import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DIFFICULTIES, DROP, FLIGHT } from '../game/balance.js'
import { damageDrone, fly, judgeLanding, registerDelivery, release, releaseClassic, stepClassicPackage, stepPackage } from '../game/physics.js'

const difficulty = DIFFICULTIES.standard
const options = { worldWidth: 2000, weight: 1, wind: 0, stabilize: true }
const drone = () => ({ x: 500, y: 350, vx: 0, vy: 0, boost: 100, health: 100, battery: 100, tilt: 0, invulnerable: 0 })
const tick = (craft, keys, seconds) => {
  for (let i = 0; i < seconds * 120; i++) fly(craft, new Set(keys), 1 / 120, FLIGHT, difficulty, options)
}

test('flight normalizes diagonal top speed, brakes on release and spends battery', () => {
  const craft = drone()
  tick(craft, ['right', 'up'], 1)
  assert.ok(craft.x > 590 && craft.y < 260)
  assert.ok(Math.hypot(craft.vx, craft.vy) <= FLIGHT.speed)
  assert.ok(craft.battery < 100)
  tick(craft, [], 1)
  assert.ok(Math.abs(craft.vx) < 1)
})

test('boost drains, locks out on depletion and rearms after release', () => {
  const craft = drone()
  tick(craft, ['right', 'boost'], 3)
  assert.equal(craft.boostEmpty, true)
  assert.equal(craft.boosting, false)
  tick(craft, [], 1)
  tick(craft, ['right', 'boost'], 0.2)
  assert.equal(craft.boosting, true)
})

test('package inherits motion and resolves the first crossed surface or obstacle', () => {
  const craft = { ...drone(), vx: 100 }
  const parcel = release(craft, 'standard')
  const target = { x: 510, y: 450, width: 80 }
  assert.equal(parcel.vx, 65)
  const hit = stepPackage({ ...parcel, vy: 900 }, 0.2, [target], [], 0)
  assert.equal(hit.surface, target)
  assert.equal(judgeLanding(hit, target, difficulty, 'standard', 3), 'perfect')
  const blocked = stepPackage({ ...parcel, vy: 900 }, 0.2, [target], [{ x: 478, y: 405, w: 80, h: 2 }], 0)
  assert.equal(judgeLanding(blocked, target, difficulty, 'standard', 3), 'damaged')
})

test('accuracy bands and fragile cargo affect score and combo', () => {
  const target = { x: 300, y: 420, width: 100 }
  assert.equal(judgeLanding({ x: 335, surface: target }, target, difficulty, 'standard', 1), 'acceptable')
  assert.equal(judgeLanding({ x: 335, surface: target }, target, difficulty, 'fragile', 1), 'damaged')
  const score = { points: 0, attempts: 0, delivered: 0, streak: 0, bestCombo: 1, perfect: 0 }
  for (let i = 0; i < 9; i++) registerDelivery(score, 'good')
  assert.equal(score.bestCombo, 3)
  assert.equal(registerDelivery(score, 'perfect'), 450)
  assert.equal(registerDelivery(score, 'missed'), 0)
  assert.equal(score.streak, 0)
})

test('one damage event wins when collisions overlap', () => {
  const craft = drone()
  const box = { x: 495, y: 330, w: 15, h: 30 }
  assert.equal(damageDrone(craft, 26, FLIGHT, difficulty, box), true)
  assert.equal(damageDrone(craft, 26, FLIGHT, difficulty, box), false)
  assert.equal(craft.health, 74)
})

test('a parcel already touching the top of a pad lands on its first downward step', () => {
  const target = { x: 510, y: 450, width: 80 }
  const parcel = { x: 510, y: target.y - DROP.size / 2 + 3, vx: 10, vy: 0, cargo: 'standard' }
  const hit = stepPackage(parcel, 1 / 120, [target], [])
  assert.equal(hit.surface, target)
  assert.equal(hit.x, 510)
})

test('Classic parcels carry horizontal momentum through the original bounce', () => {
  const parcel = releaseClassic({ x: 200, y: 255, vx: 100 }, 50)
  const surface = () => 520
  let bounces = 0
  let landing
  for (let tick = 0; tick < 240; tick++) {
    const impact = stepClassicPackage(parcel, 1 / 120, surface)
    if (!impact) continue
    if (impact.bounced) bounces++
    else {
      landing = impact.surface
      break
    }
  }
  assert.equal(bounces, 1)
  assert.equal(landing, 520)
  assert.ok(Math.abs(parcel.x - 273.39) < 0.01)
})
