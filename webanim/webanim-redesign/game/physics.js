import { clamp, inputVector } from './core.js'
import { CARGO, DROP, POINTS, WORLD } from './balance.js'

export function fly(drone, input, dt, stats, difficulty, options) {
  const vector = inputVector(input)
  const x = vector.x
  const y = vector.y * (options.invert ? -1 : 1)
  const moving = Boolean(x || y)
  const boostHeld = input.has('boost')
  if (!boostHeld && drone.boost >= stats.boostRearm) drone.boostEmpty = false
  const boosting = moving && boostHeld && !drone.boostEmpty && drone.boost > 0
  const thrust = boosting ? stats.boostMultiplier : 1
  drone.boost = clamp(drone.boost + (boosting ? -stats.boostDrain : stats.boostRecharge) * dt, 0, 100)
  if (!drone.boost) drone.boostEmpty = true
  drone.boosting = boosting
  const weight = Math.max(0, options.weight - 1)
  const authority = thrust / (1 + weight * 0.11 * (stats.payloadDrag ?? 1))
  const drag = moving ? stats.steering : stats.braking * difficulty.braking
  const wind = options.wind * stats.windShield * (options.stabilize ? 0.39 : 1)
  const stopAssist = options.stabilize && !moving ? 1.45 : 1
  const decay = Math.exp(-drag * stopAssist * dt)
  // Drag approaches a target velocity while the initial acceleration stays bounded.
  const speed = stats.speed * authority
  const response = Math.min(1 - decay, stats.acceleration * thrust * dt / Math.max(1, speed))
  drone.vx += (x * speed - drone.vx) * (moving ? response : 1 - decay) + wind * dt
  drone.vy += (y * speed - drone.vy) * (moving ? response : 1 - decay)
  const velocity = Math.hypot(drone.vx, drone.vy)
  const limit = Math.max(stats.speed * thrust, 1)
  if (velocity > limit) {
    drone.vx *= limit / velocity
    drone.vy *= limit / velocity
  }
  const lastX = drone.x
  const lastY = drone.y
  const nextX = lastX + drone.vx * dt
  const nextY = lastY + drone.vy * dt
  drone.x = clamp(nextX, 30, options.worldWidth - 30)
  drone.y = clamp(nextY, 35, WORLD.ground - 29)
  if (nextX !== drone.x) drone.vx = 0
  if (nextY !== drone.y) drone.vy = 0
  drone.tilt += (clamp(drone.vx / 630, -0.38, 0.38) - drone.tilt) * (1 - Math.exp(-dt * 11))
  if (!options.practice) {
    const drain = stats.batteryIdle + (moving ? stats.batteryMoving : 0) + (boosting ? stats.batteryBoost : 0)
    drone.battery = Math.max(0, drone.battery - drain * dt)
  }
  return Math.hypot(drone.x - lastX, drone.y - lastY)
}

export function hitBox(x, y, radius, box) {
  const closestX = clamp(x, box.x, box.x + box.w)
  const closestY = clamp(y, box.y, box.y + box.h)
  return (x - closestX) ** 2 + (y - closestY) ** 2 < radius ** 2
}

export function damageDrone(drone, damage, stats, difficulty, collider) {
  if (drone.invulnerable > 0) return false
  drone.health = Math.max(0, drone.health - Math.ceil(damage * stats.armor * difficulty.damage))
  drone.invulnerable = 1.05
  const dx = drone.x - (collider.x + collider.w / 2)
  const dy = drone.y - (collider.y + collider.h / 2)
  const side = Math.abs(dx / collider.w) > Math.abs(dy / collider.h)
  if (side) {
    const sign = Math.sign(dx) || 1
    drone.x = sign > 0 ? collider.x + collider.w + WORLD.radius : collider.x - WORLD.radius
    drone.vx = sign * 125
  } else {
    const sign = Math.sign(dy) || -1
    drone.y = sign > 0 ? collider.y + collider.h + WORLD.radius : collider.y - WORLD.radius
    drone.vy = sign * 120
  }
  return true
}

export const CLASSIC_PARCEL_SIZE = 32

export function releaseClassic(drone, camera) {
  return { x: drone.x + camera, y: drone.y + 30, vx: drone.vx * 0.35, vy: 60 }
}

export function stepClassicPackage(parcel, dt, surfaceAt) {
  parcel.vy += 1500 * dt
  parcel.x += parcel.vx * dt
  parcel.y += parcel.vy * dt

  const surface = surfaceAt(parcel.x, parcel.y)
  if (parcel.y + CLASSIC_PARCEL_SIZE < surface) return null
  parcel.y = surface - CLASSIC_PARCEL_SIZE
  const bounced = parcel.vy > 260
  if (bounced) {
    parcel.vy *= -0.3
    parcel.vx *= 0.6
  }
  return { surface, bounced }
}

export function release(drone, cargo) {
  return { x: drone.x, y: drone.y + DROP.gap, vx: drone.vx * DROP.inheritance, vy: Math.max(-75, drone.vy * 0.3), cargo }
}

function entryTime(start, end, low, high) {
  const delta = end - start
  if (!delta) return start >= low && start <= high ? [-Infinity, Infinity] : [Infinity, -Infinity]
  const a = (low - start) / delta
  const b = (high - start) / delta
  return [Math.min(a, b), Math.max(a, b)]
}

export function stepPackage(parcel, dt, surfaces, hazards, wind = 0) {
  const gravity = DROP.gravity * CARGO[parcel.cargo].gravity
  const x = parcel.x + parcel.vx * dt + wind * 0.5 * dt ** 2
  const y = parcel.y + parcel.vy * dt + gravity * 0.5 * dt ** 2
  const half = DROP.size / 2
  let hit = null
  let first = Infinity
  if (y > parcel.y) {
    for (const surface of surfaces) {
      const startsOnSurface = parcel.y + half >= surface.y && parcel.y - half <= surface.y &&
        Math.abs(parcel.x - surface.x) <= surface.width / 2
      const t = startsOnSurface ? 0 : (surface.y - half - parcel.y) / (y - parcel.y)
      const impactX = parcel.x + (x - parcel.x) * t
      if (t >= 0 && t <= 1 && t < first && Math.abs(impactX - surface.x) <= surface.width / 2) {
        first = t
        hit = { x: impactX, y: surface.y, surface }
      }
    }
  }
  for (const box of hazards) {
    const [ax, bx] = entryTime(parcel.x, x, box.x - half, box.x + box.w + half)
    const [ay, by] = entryTime(parcel.y, y, box.y - half, box.y + box.h + half)
    const t = Math.max(0, ax, ay)
    if (t <= Math.min(1, bx, by) && t <= first) {
      first = t
      hit = { x: parcel.x + (x - parcel.x) * t, y: parcel.y + (y - parcel.y) * t, damaged: true }
    }
  }
  if (hit) return hit
  parcel.x = x
  parcel.y = y
  parcel.vx += wind * dt
  parcel.vy += gravity * dt
  return y > WORLD.height + 30 ? { x, y } : null
}

export function judgeLanding(hit, target, difficulty, cargo, time) {
  if (hit.damaged) return 'damaged'
  if (!target || hit.surface !== target || (target.window && (time % target.window.period) >= target.window.open)) return 'missed'
  const error = Math.abs(hit.x - target.x) / (target.width * difficulty.target / 2)
  if (error <= 0.28) return 'perfect'
  if (error <= 0.68) return 'good'
  if (error <= 1) return CARGO[cargo].fragile ? 'damaged' : 'acceptable'
  return 'missed'
}

export function registerDelivery(score, outcome) {
  const points = POINTS[outcome]
  score.attempts++
  if (!points) {
    score.streak = 0
    return 0
  }
  score.delivered++
  if (outcome === 'perfect') score.perfect++
  score.streak++
  const combo = comboFor(score.streak)
  score.bestCombo = Math.max(score.bestCombo, combo)
  score.points += points * combo
  return points * combo
}

export function comboFor(streak) {
  return streak >= 4 ? 3 : streak >= 2 ? 2 : 1
}
