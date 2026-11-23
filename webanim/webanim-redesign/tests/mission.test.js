import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CONTRACTS, DISTRICTS, MODES } from '../game/contracts.js'
import { FLIGHT } from '../game/balance.js'
import { STEP } from '../game/core.js'
import { startMission } from '../game/mission.js'

const noInput = new Set()
const tick = (engine, duration, keys = noInput) => {
  for (let i = 0; i < duration / STEP; i++) engine.update(STEP, keys)
}
const launch = (contract, stats = FLIGHT) => {
  const engine = startMission(contract, stats, { stabilize: true, prediction: true })
  assert.equal(engine.run.phase, 'briefing')
  assert.equal(engine.launch(), true)
  tick(engine, 3)
  assert.equal(engine.run.phase, 'active')
  return engine
}

test('pause freezes the timer and an in-flight parcel, restart starts a clean run', () => {
  const route = CONTRACTS[0]
  const engine = launch(route)
  assert.ok(engine.drop())
  assert.equal(engine.drop(), false)
  tick(engine, 0.1)
  const parcelY = engine.run.parcel.y
  const time = engine.run.timeLeft
  assert.ok(engine.pause())
  tick(engine, 5)
  assert.equal(engine.run.parcel.y, parcelY)
  assert.equal(engine.run.timeLeft, time)
  assert.equal(engine.drop(), false)
  const retry = launch(route)
  assert.equal(retry.run.score.attempts, 0)
  assert.equal(retry.run.parcel, null)
  assert.ok(engine.resume())
  tick(engine, 1)
  assert.equal(engine.run.score.delivered, 1)
  assert.equal(engine.run.score.attempts, 1)
})

test('countdown pauses and resumes in countdown', () => {
  const engine = startMission(CONTRACTS[0])
  assert.equal(engine.pause(), false)
  assert.ok(engine.launch())
  tick(engine, 1)
  assert.ok(engine.pause())
  tick(engine, 10)
  assert.ok(engine.resume())
  assert.equal(engine.run.phase, 'countdown')
  tick(engine, 2)
  assert.equal(engine.run.phase, 'active')
})

test('timer, battery, collision and attempt-limit failures are terminal', () => {
  const base = CONTRACTS[0]
  const scenarios = [
    [{ ...base, time: 0.05 }, FLIGHT, 'timer'],
    [base, { ...FLIGHT, battery: 0.05 }, 'battery'],
    [{ ...base, hazards: [{ x: 205, y: 220, w: 35, h: 60, damage: 200 }] }, FLIGHT, 'impact'],
  ]
  for (const [contract, stats, reason] of scenarios) {
    const engine = launch(contract, stats)
    tick(engine, 1)
    const result = engine.run.result
    assert.equal(engine.run.phase, 'results')
    assert.equal(result.success, false)
    assert.match(result.reason, new RegExp(reason))
    assert.equal(engine.drop(), false)
    tick(engine, 10)
    assert.equal(engine.run.result, result)
  }
  const precision = launch({ ...MODES.precision, attemptLimit: 1, spawn: [105, 245] })
  assert.equal(precision.predict(), null)
  assert.ok(precision.drop())
  tick(precision, 2)
  assert.match(precision.run.result.reason, /attempts/)
})

test('free flight preserves battery and allows the pilot to end the session', () => {
  const engine = launch(MODES.training)
  tick(engine, 15, new Set(['right', 'boost']))
  assert.equal(engine.run.drone.battery, FLIGHT.battery)
  assert.equal(engine.run.timeLeft, null)
  assert.ok(engine.endPractice())
  assert.equal(engine.run.result.success, true)
})

function steer(engine, x, y, done, timeout = 14) {
  let waited = 0
  while (waited < timeout && engine.run.phase === 'active') {
    const drone = engine.run.drone
    if (done(drone)) return true
    const key = new Set()
    const dx = x - drone.x - drone.vx / 7.2
    const dy = y - drone.y - drone.vy / 7.2
    if (Math.abs(dx) > 3.6) key.add(dx > 0 ? 'right' : 'left')
    if (Math.abs(dy) > 3.6) key.add(dy > 0 ? 'down' : 'up')
    engine.update(STEP, key)
    waited += STEP
  }
  return false
}

function deliverRoute(contract) {
  const engine = launch(contract)
  if (contract.reserve < 1) {
    const depot = contract.depot
    assert.ok(steer(engine, engine.run.drone.x, 84, drone => drone.y < 101), 'climb to the depot corridor')
    assert.ok(steer(engine, depot.x, 84, drone => Math.abs(drone.x - depot.x) <= 14), 'reach the charge corridor')
    assert.ok(steer(engine, depot.x, depot.y, drone => Math.abs(drone.x - depot.x) < 28 &&
      Math.abs(drone.y - depot.y) < 17 && Math.hypot(drone.vx, drone.vy) < 38), 'reach the charge bay')
    tick(engine, 2.3)
    assert.ok(engine.run.drone.battery > 65)
  }
  for (const target of contract.targets) {
    const hover = Math.max(82, target.y - 98)
    const safe = 82
    assert.ok(steer(engine, engine.run.drone.x, safe, drone => drone.y < 99), 'gain clearance')
    assert.ok(steer(engine, target.x, safe, drone => Math.abs(drone.x - target.x) < 17), 'fly to destination')
    assert.ok(steer(engine, target.x, hover, drone => Math.abs(drone.x - target.x) < 6 &&
      Math.abs(drone.y - hover) < 13 && Math.hypot(drone.vx, drone.vy) < 25 &&
      (!target.window || engine.run.elapsed % target.window.period < target.window.open - 0.65)), 'line up a drop')
    const prior = engine.run.score.delivered
    assert.ok(engine.drop(), 'release cargo')
    tick(engine, 1)
    assert.equal(engine.run.score.delivered, prior + 1, JSON.stringify({
      target, outcome: engine.run.outcome, drone: engine.run.drone, elapsed: engine.run.elapsed,
    }))
  }
  return engine
}

test('campaign offers eight main contracts and two challenges per district', () => {
  assert.equal(new Set(CONTRACTS.map(contract => contract.id)).size, 50)
  DISTRICTS.forEach(district => {
    const entries = CONTRACTS.filter(contract => contract.district === district.id)
    assert.equal(entries.filter(contract => contract.optional).length, 2)
    assert.equal(entries.filter(contract => !contract.optional).length, 8)
  })
})
for (const route of CONTRACTS) {
  test(`${route.title} has a playable Standard route with the starter drone`, () => {
    const { run } = deliverRoute(route)
    assert.equal(run.result?.success, true, JSON.stringify(run.result))
    assert.equal(run.result.delivered, route.targets.length)
    assert.ok(run.result.stars >= 1)
  })
}
