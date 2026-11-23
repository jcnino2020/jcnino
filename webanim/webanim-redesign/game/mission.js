import { clamp, stateMachine, STEP } from './core.js'
import { CARGO, DIFFICULTIES, DROP, FLIGHT, WEATHER, WORLD } from './balance.js'
import { damageDrone, fly, hitBox, judgeLanding, registerDelivery, release, stepPackage } from './physics.js'

const transitions = {
  notStarted: ['briefing'], briefing: ['countdown'], countdown: ['active', 'paused'],
  active: ['paused', 'completed', 'failed'], paused: ['active', 'countdown'],
  completed: ['results'], failed: ['results'],
}

function meets(condition, run) {
  switch (condition.key) {
    case 'perfect': return run.score.perfect >= condition.value
    case 'hits': return run.hits <= condition.value
    case 'misses': return run.score.attempts - run.score.delivered <= condition.value
    case 'battery': return run.drone.battery / run.stats.battery >= condition.value
    case 'time': return run.elapsed <= condition.value
    default: return false
  }
}

function moveHazards(hazards, time) {
  for (const hazard of hazards) {
    if (!hazard.travel) continue
    const [dx, dy, rate] = hazard.travel
    hazard.x = hazard.startX + Math.sin(time * rate) * dx
    hazard.y = hazard.startY + Math.sin(time * rate * 0.8) * dy
  }
}

export function startMission(contract, stats = FLIGHT, settings = {}) {
  const lifecycle = stateMachine('notStarted', transitions)
  const difficulty = DIFFICULTIES[settings.difficulty] ?? DIFFICULTIES.standard
  const weather = WEATHER[contract.weather]
  const practice = contract.mode === 'training'
  const scored = !contract.mode
  const [x, y] = contract.spawn
  const targets = contract.targets.map(target => ({ ...target, physicalWidth: target.width * Math.max(1, difficulty.target) }))
  const surfaces = targets.map(target => ({ ...target, width: target.physicalWidth }))
  const ground = { x: contract.width / 2, y: WORLD.ground, width: contract.width }
  const landingSurfaces = [...surfaces, ground]
  const padColliders = targets.map(target => ({ type: 'platform', x: target.x - target.physicalWidth / 2,
    y: target.y, w: target.physicalWidth, h: 15, damage: 18 }))
  const hazards = contract.hazards.map(hazard => ({ ...hazard, startX: hazard.x, startY: hazard.y }))
  const forecastHazards = hazards.map(hazard => ({ ...hazard }))
  const windAt = time => weather.wind + weather.gust * Math.sin(time * 0.7)
  const run = {
    contract, stats, settings, difficulty, weather, practice, targets, hazards,
    drone: { x, y, vx: 0, vy: 0, tilt: 0, health: stats.health, battery: stats.battery * (contract.reserve ?? 1), boost: 100, invulnerable: 0 },
    score: { points: 0, attempts: 0, delivered: 0, streak: 0, bestCombo: 0, perfect: 0 },
    targetIndex: 0, elapsed: 0, countdown: 3, hits: 0, distance: 0, wind: weather.wind, depotUsed: false,
    timeLeft: contract.time === null ? null : contract.time * (contract.mode ? 1 : difficulty.time),
    parcel: null, cooldown: 0, outcome: null, result: null,
    get phase() { return lifecycle.state },
    get target() { return targets[this.targetIndex] },
  }
  lifecycle.move('briefing')
  let resumeState

  const finish = (success, reason) => {
    if (!lifecycle.move(success ? 'completed' : 'failed')) return false
    const objectives = contract.conditions.map(condition => ({ ...condition, fulfilled: success && meets(condition, run) }))
    const stars = success ? 1 + Number(objectives[0]?.fulfilled ?? false) + Number(objectives.every(item => item.fulfilled) && objectives.length > 1) : 0
    const timeBonus = success && scored ? Math.floor(Math.max(0, run.timeLeft) * 2) : 0
    const hullBonus = success && scored ? Math.floor(run.drone.health * 0.8) : 0
    const bonus = success && scored ? Math.round((150 + timeBonus + hullBonus + (stars - 1) * 100) * difficulty.bonus) : 0
    run.result = { success, reason, stars, objectives, bonus, points: run.score.points + bonus, delivered: run.score.delivered,
      attempts: run.score.attempts, perfect: run.score.perfect, bestCombo: run.score.bestCombo, seconds: run.elapsed,
      distance: run.distance, timeLeft: run.timeLeft, hits: run.hits, health: run.drone.health, battery: run.drone.battery, rewardFactor: difficulty.bonus }
    run.parcel = null
    lifecycle.move('results')
    return true
  }

  const landingOutcome = (hit, cargo, time) => {
    const target = run.target
    const adjusted = hit.surface === surfaces[run.targetIndex] ? { ...hit, surface: target } : hit
    return judgeLanding(adjusted, target, difficulty, cargo, time)
  }

  const awardLanding = hit => {
    const { cargo } = run.parcel
    run.parcel = null
    const outcome = landingOutcome(hit, cargo, run.elapsed)
    const points = registerDelivery(run.score, outcome)
    run.outcome = { type: outcome, x: hit.x, y: hit.y, time: run.elapsed, points }
    if (points) {
      run.targetIndex++
      if (run.targetIndex === targets.length && !practice && contract.mode !== 'trial') finish(true, 'All destinations served.')
      else if (run.targetIndex === targets.length) run.targetIndex = 0
    }
    if (contract.attemptLimit && run.score.attempts >= contract.attemptLimit && !run.result) finish(false, 'No delivery attempts remaining.')
  }

  const api = {
    run,
    launch: () => CARGO[contract.cargo].weight <= stats.capacity && lifecycle.move('countdown'),
    pause() {
      const before = run.phase
      if (!lifecycle.move('paused')) return false
      resumeState = before
      return true
    },
    resume: () => lifecycle.move(resumeState),
    endPractice: () => practice && finish(true, 'Practice session ended.'),
    drop() {
      if (run.phase !== 'active' || run.parcel || run.cooldown > 0) return false
      run.parcel = release(run.drone, contract.cargo)
      run.cooldown = DROP.cooldown
      return true
    },
    predict() {
      if (run.phase !== 'active' || !contract.prediction || !settings.prediction || run.parcel || run.cooldown > 0) return null
      const parcel = release(run.drone, contract.cargo)
      const path = [{ x: parcel.x, y: parcel.y }]
      let time = run.elapsed
      for (let tick = 1; tick <= 240; tick++) {
        time += STEP
        if (run.timeLeft !== null && tick * STEP >= run.timeLeft) return null
        moveHazards(forecastHazards, time)
        const hit = stepPackage(parcel, STEP, landingSurfaces, forecastHazards, windAt(time) * 0.34)
        if (hit) {
          const y = hit.surface ? hit.y - DROP.size / 2 : hit.y
          path.push({ x: hit.x, y })
          return { ...hit, path, outcome: landingOutcome(hit, parcel.cargo, time) }
        }
        if (tick % 6 === 0) path.push({ x: parcel.x, y: parcel.y })
      }
      return null
    },
    update(dt, input) {
      if (run.phase === 'countdown') {
        run.countdown = Math.max(0, run.countdown - dt)
        if (run.countdown < 1e-8) lifecycle.move('active')
        return
      }
      if (run.phase !== 'active') return
      run.elapsed += dt
      if (run.timeLeft !== null) {
        run.timeLeft = Math.max(0, run.timeLeft - dt)
        if (!run.timeLeft) {
          const trial = contract.mode === 'trial' && run.score.delivered > 0
          finish(trial, trial ? 'Time trial finished.' : 'The dispatch timer expired.')
          return
        }
      }
      run.wind = windAt(run.elapsed)
      run.cooldown = Math.max(0, run.cooldown - dt)
      run.drone.invulnerable = Math.max(0, run.drone.invulnerable - dt)
      run.distance += fly(run.drone, input, dt, stats, difficulty, {
        worldWidth: contract.width, weight: CARGO[contract.cargo].weight, wind: run.wind,
        invert: settings.invert, stabilize: settings.stabilize && settings.difficulty !== 'expert', practice,
      })
      moveHazards(hazards, run.elapsed)
      const drone = run.drone
      const depot = contract.depot
      if (depot && Math.abs(drone.x - depot.x) <= depot.width / 2 && Math.abs(drone.y - depot.y) < 34 && Math.hypot(drone.vx, drone.vy) < 48) {
        drone.battery = Math.min(stats.battery, drone.battery + dt * 42)
        run.depotUsed = true
      }
      const collision = hazards.find(box => hitBox(drone.x, drone.y, WORLD.radius, box)) ??
        padColliders.find(box => hitBox(drone.x, drone.y, WORLD.radius, box))
      if (collision && damageDrone(drone, practice ? 0 : collision.damage, stats, difficulty, collision)) {
        run.hits++
        run.score.streak = 0
        run.outcome = { type: 'collision', x: drone.x, y: drone.y, time: run.elapsed }
        drone.x = clamp(drone.x, 30, contract.width - 30)
        drone.y = clamp(drone.y, 35, WORLD.ground - 29)
      }
      if (!drone.health || !drone.battery) {
        finish(false, drone.health ? 'The battery ran out.' : 'The drone shut down after impact.')
        return
      }
      if (run.parcel) {
        const hit = stepPackage(run.parcel, dt, landingSurfaces, hazards, run.wind * 0.34)
        if (hit) awardLanding(hit)
      }
    },
  }
  return api
}
