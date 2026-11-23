import assert from 'node:assert/strict'
import { test } from 'node:test'
import { classicThrust, fixedClock, inputVector, stateMachine } from '../game/core.js'
import { inputState } from '../game/input.js'

test('fixed simulation steps agree at 30, 60 and 144 Hz and cap gaps', () => {
  for (const rate of [30, 60, 144]) {
    const clock = fixedClock()
    let steps = 0
    for (let i = 0; i <= rate; i++) clock.advance(1000 * i / rate, () => steps++)
    assert.equal(steps, 120)
    clock.advance(8000, () => steps++)
    assert.equal(steps, 132)
    clock.reset()
    clock.advance(9000, () => steps++)
    assert.equal(steps, 132)
  }
})

test('lifecycle rejects conflicting terminal decisions', () => {
  const scene = stateMachine('active', { active: ['paused', 'failed'], paused: ['active'], failed: ['results'] })
  assert.ok(scene.move('paused'))
  assert.equal(scene.move('failed'), false)
  assert.ok(scene.move('active'))
  assert.ok(scene.move('failed'))
  assert.equal(scene.move('completed'), false)
})

test('alternate bindings can be held and released independently', () => {
  const input = inputState()
  input.press('KeyA', 'left')
  input.press('ArrowLeft', 'left')
  input.press(3, 'up')
  input.release('KeyA')
  const diagonal = inputVector(input)
  assert.equal(diagonal.x, diagonal.y)
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 1e-12)
  input.release(3)
  assert.equal(inputVector(input).x, -1)
  input.clear()
  assert.deepEqual(inputVector(input), { x: 0, y: 0 })
})

test('Classic thrust preserves boost and recharge rates', () => {
  const drone = { vx: 0, vy: 0 }
  const level = { accel: 1500, maxSpeed: 330 }
  const dt = 1 / 120
  assert.equal(classicThrust(drone, new Set(['right', 'boost']), level, 100, dt, true), 100 - 45 * dt)
  assert.ok(drone.vx > 0)
  assert.equal(classicThrust(drone, new Set(), level, 30, dt, true), 30 + 25 * dt)
})

test('pointer cancellation releases only that touch input', async () => {
  const { attachInput } = await import('../game/input.js')
  const oldWindow = globalThis.window
  const oldDocument = globalThis.document
  globalThis.window = new EventTarget()
  globalThis.document = new EventTarget()
  const makeButton = action => Object.assign(new EventTarget(), {
    dataset: { action }, setPointerCapture() {}, classList: { add() {}, remove() {} },
  })
  const send = (target, type, pointerId) => target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), { pointerId, button: 0 }))
  const move = makeButton('right')
  const boost = makeButton('boost')
  try {
    const input = attachInput({ active: () => true, controls: [move, boost], onAction() {}, onBlur() {} })
    send(move, 'pointerdown', 1)
    send(boost, 'pointerdown', 2)
    assert.equal(input.has('right') && input.has('boost'), true)
    send(move, 'pointercancel', 1)
    assert.equal(input.has('right'), false)
    assert.equal(input.has('boost'), true)
    send(boost, 'lostpointercapture', 2)
    assert.equal(input.has('boost'), false)
  } finally {
    globalThis.window = oldWindow
    globalThis.document = oldDocument
  }
})
