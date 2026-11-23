export const STEP = 1 / 120
export const clamp = (value, min, max) => Math.max(min, Math.min(value, max))

export function fixedClock(step = STEP, frameLimit = 0.1) {
  let previous
  let carry = 0
  return {
    reset() {
      previous = undefined
      carry = 0
    },
    advance(now, update) {
      const elapsed = previous === undefined ? 0 : clamp((now - previous) / 1000, 0, frameLimit)
      previous = now
      carry += elapsed
      while (carry + 1e-10 >= step) {
        carry -= step
        if (update(step) === false) {
          carry = 0
          break
        }
      }
      return elapsed
    },
  }
}

export function stateMachine(initial, transitions) {
  let state = initial
  return {
    get state() { return state },
    move(next) {
      if (!transitions[state]?.includes(next)) return false
      state = next
      return true
    },
  }
}

export function inputVector(input) {
  const x = Number(input.has('right')) - Number(input.has('left'))
  const y = Number(input.has('down')) - Number(input.has('up'))
  const length = Math.hypot(x, y) || 1
  return { x: x / length, y: y / length }
}

// Preserve the original per-axis arcade limits and thrust.
export function classicThrust(drone, input, level, energy, dt, active) {
  const x = active ? Number(input.has('right')) - Number(input.has('left')) : 0
  const y = active ? Number(input.has('down')) - Number(input.has('up')) : 0
  const boosting = active && energy > 0 && input.has('boost') && (x || y)
  const multiplier = boosting ? 1.4 : 1
  const topSpeed = level.maxSpeed * multiplier
  const damping = Math.exp(-dt * 2.4)
  drone.vx = clamp((drone.vx + x * level.accel * multiplier * dt) * damping, -topSpeed, topSpeed)
  drone.vy = clamp((drone.vy + y * level.accel * multiplier * dt) * damping, -topSpeed, topSpeed)
  return active ? clamp(energy + (boosting ? -45 : 25) * dt, 0, 100) : energy
}
