import { startMission } from './mission.js'
import { createRenderer } from './renderer.js'

export function createPreview(canvas, renderer = createRenderer(canvas)) {
  let frame = 0
  let view = null
  let openedAt = 0

  function paint(now) {
    if (!view || document.hidden) return
    const { scene, style } = view
    const animated = style === 'home' && !scene.run.settings.reducedMotion
    renderer.paint(scene, 0, 0, { style, time: animated ? (now - openedAt) / 1000 : 0 })
    if (animated) frame = requestAnimationFrame(paint)
  }

  function refresh() {
    cancelAnimationFrame(frame)
    if (view) frame = requestAnimationFrame(paint)
  }

  return {
    start(contract, craft, settings, style) {
      canvas.hidden = false
      openedAt = performance.now()
      view = { scene: startMission(contract, craft, settings), style }
      refresh()
    },
    stop(hide = true) {
      view = null
      cancelAnimationFrame(frame)
      canvas.hidden = hide
    },
    refresh,
  }
}
