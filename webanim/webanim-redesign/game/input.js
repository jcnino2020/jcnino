export const bindings = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ShiftLeft: 'boost', ShiftRight: 'boost', Space: 'drop',
  Escape: 'pause', KeyP: 'pause', KeyR: 'restart', KeyM: 'mute',
}

const held = new Set(['left', 'right', 'up', 'down', 'boost'])

export function inputState() {
  const sources = new Map()
  return {
    press(source, action) { sources.set(source, action) },
    release(source) { sources.delete(source) },
    clear() { sources.clear() },
    has(action) {
      for (const pressed of sources.values()) {
        if (pressed === action) return true
      }
      return false
    },
  }
}

export function attachInput({ active, controls, onAction, onBlur, getBindings = () => bindings }) {
  const state = inputState()
  const pointers = new Map()
  const clear = () => {
    state.clear()
    for (const button of pointers.values()) button.classList.remove('active')
    pointers.clear()
  }

  window.addEventListener('keydown', event => {
    if (!active() || document.hidden || event.defaultPrevented || event.isComposing ||
        event.ctrlKey || event.metaKey || event.altKey ||
        event.target.closest?.('input, select, textarea, [contenteditable]')) return
    const action = getBindings()[event.code]
    if (!action || (action === 'drop' && event.target.closest?.('button, a'))) return
    if (held.has(action)) state.press(event.code, action)
    if (held.has(action) || event.repeat || onAction(action) !== false) event.preventDefault()
  })
  window.addEventListener('keyup', event => state.release(event.code))
  const lostFocus = () => {
    clear()
    if (active()) onBlur()
  }
  window.addEventListener('blur', lostFocus)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) lostFocus()
  })

  for (const button of controls) {
    const action = button.dataset.action
    button.addEventListener('pointerdown', event => {
      if (!active() || event.button !== 0) return
      event.preventDefault()
      button.setPointerCapture(event.pointerId)
      if (!held.has(action)) {
        onAction(action)
        return
      }
      state.press(event.pointerId, action)
      pointers.set(event.pointerId, button)
      button.classList.add('active')
    })
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, event => {
        state.release(event.pointerId)
        pointers.delete(event.pointerId)
        if (![...pointers.values()].includes(button)) button.classList.remove('active')
      })
    }
    if (!held.has(action)) {
      button.addEventListener('click', event => {
        if (event.detail === 0 && active()) onAction(action)
      })
    }
  }

  return { has: state.has, clear }
}
