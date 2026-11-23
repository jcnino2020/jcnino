import { CARGO, DROP, WORLD } from './balance.js'
import { clamp } from './core.js'
import { DISTRICTS } from './contracts.js'

const ink = '#14232f'
const pale = '#fff5dc'
const hash = index => {
  const value = Math.sin(index * 81.19 + 27.26) * 43758.54
  return value - Math.floor(value)
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false })
  let scale = 1
  let width = 0
  let height = 0
  let view = 0
  let camera = 0
  let skyKey = ''
  let sky
  let forecast = null
  let nextForecast = 0

  const rect = (x, y, w, h, color) => {
    ctx.fillStyle = color
    ctx.fillRect(x, y, w, h)
  }

  const label = (value, x, y, color = pale, size = 15, align = 'left') => {
    ctx.fillStyle = color
    ctx.font = `700 ${size}px "JetBrains Mono", monospace`
    ctx.textAlign = align
    ctx.fillText(value, x, y)
  }

  function skyline(district, cameraX, detail) {
    const key = district.id + height + view
    if (skyKey !== key) {
      skyKey = key
      sky = ctx.createLinearGradient(0, 0, 0, WORLD.ground)
      sky.addColorStop(0, district.sky)
      sky.addColorStop(1, district.horizon)
    }
    rect(0, 0, view, WORLD.height, sky)
    ctx.fillStyle = district.accent
    ctx.beginPath()
    ctx.arc(view * 0.71, 158, 51, 0, Math.PI * 2)
    ctx.fill()
    for (const [layer, parallax, baseline, color] of [[0, 0.18, 488, district.far], [1, 0.42, 522, district.near]]) {
      const [step, min, max] = district.shape
      const offset = cameraX * parallax
      const first = Math.floor(offset / step)
      for (let i = first; i <= first + view / step + 2; i++) {
        const h = min + hash(i + layer * 48) * (max - min)
        const x = i * step - offset
        const y = baseline - h
        const buildingWidth = step * (0.68 + hash(i + 52) * 0.28)
        rect(x, y, buildingWidth, h, color)
        rect(x + buildingWidth * 0.17, y - 8 - hash(i + 371) * 13, buildingWidth * 0.55, 27, color)
        if (detail && layer) {
          ctx.globalAlpha = district.id === 'neon' ? 0.76 : 0.27
          for (let floor = y + 21; floor < baseline - 10; floor += 21) {
            for (let cell = 10; cell < buildingWidth - 9; cell += 15) {
              if (hash(i + cell * 21 + floor * 2) > 0.27) rect(x + cell, floor, 5, 9, district.accent)
            }
          }
          ctx.globalAlpha = 1
        }
      }
    }
    if (detail) {
      const offset = cameraX * 0.64
      for (let i = Math.floor(offset / 390); i < (offset + view) / 390 + 1; i++) {
        const x = i * 390 - offset
        if (district.id === 'harbor') {
          rect(x + 28, 453, 8, 68, district.ground)
          rect(x + 28, 450, 86, 5, district.ground)
          rect(x + 100, 454, 3, 57, district.ground)
          for (const [n, shade] of ['#62777b', '#805c54', '#9d7855'].entries()) {
            rect(x + 20 + n * 55, 493, 53, 24, shade)
            rect(x + 24 + n * 55, 497, 3, 15, district.horizon)
          }
        } else if (district.id === 'neon') {
          rect(x + 26, 360, 20, 92, district.accent)
          rect(x + 29, 365, 14, 82, district.ground)
          label(['N', 'E', 'O', 'N'][i % 4], x + 36, 406, district.accent, 13, 'center')
        } else if (district.id === 'business' || district.id === 'central') {
          rect(x + 126, 312, 42, 208, district.near)
          rect(x + 144, 278, 4, 65, district.near)
          rect(x + 140, 279, 12, 5, district.accent)
          for (let y = 336; y <= 496; y += 20) rect(x + 132, y, 29, 2, district.far)
        } else {
          rect(x + 82, 497, 5, 24, district.ground)
          ctx.fillStyle = '#466760'
          ctx.beginPath()
          ctx.arc(x + 84, 490, 18, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
    rect(0, WORLD.ground, view, 40, district.ground)
    rect(0, WORLD.ground, view, 4, district.accent)
    for (let x = -(cameraX % 82); x < view; x += 82) rect(x, 541, 41, 2, district.far)
  }

  function targetPad(target, run, index, accent) {
    const active = run.targetIndex === index
    const open = !target.window || (run.elapsed % target.window.period) < target.window.open
    const valid = target.width * run.difficulty.target
    const left = target.x - target.physicalWidth / 2
    const y = target.y
    rect(left + 9, y + 14, 6, WORLD.ground - y - 14, '#294651')
    rect(left + target.physicalWidth - 15, y + 14, 6, WORLD.ground - y - 14, '#294651')
    const marker = open ? accent : '#ddab9a'
    rect(left, y, target.physicalWidth, 15, ink)
    rect(target.x - valid / 2, y, valid, active ? 5 : 2, active ? marker : '#8fa9af')
    if (!active) return
    rect(target.x - valid * 0.14, y - 5, valid * 0.28, 5, pale)
    rect(target.x - 3, y + 6, 6, 5, pale)
    const tag = open ? target.name.toUpperCase() : 'BAY CLOSED'
    const tagWidth = tag.length * 8 + 19
    rect(target.x - tagWidth / 2, y - 46, tagWidth, 23, ink)
    label(tag, target.x, y - 30, marker, 12, 'center')
    ctx.strokeStyle = marker
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(target.x - 6, y - 17)
    ctx.lineTo(target.x, y - 11)
    ctx.lineTo(target.x + 6, y - 17)
    ctx.stroke()
  }

  function obstacle(box, run) {
    const { type, x, y, w, h } = box
    if (type === 'restricted') {
      ctx.fillStyle = '#ef805878'
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = '#ffba72'
      ctx.lineWidth = 2
      ctx.setLineDash([7, 5])
      ctx.strokeRect(x, y, w, h)
      ctx.setLineDash([])
      label('NO FLY', x + w / 2, y + h / 2 + 5, ink, 13, 'center')
    } else if (type === 'bird') {
      ctx.strokeStyle = ink
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(x, y + 4 + 7 * Math.sin(run.elapsed * 10))
      ctx.quadraticCurveTo(x + 7, y + 1, x + w / 2, y + 13)
      ctx.quadraticCurveTo(x + w - 7, y + 1, x + w, y + 4 + 7 * Math.sin(run.elapsed * 10))
      ctx.stroke()
    } else {
      if (type === 'hook') rect(x + w / 2 - 2, 0, 4, y, ink)
      rect(x, y, w, h, ink)
      for (let offset = 0; offset < (type === 'wire' ? w : h); offset += 19) {
        if (type === 'wire') rect(x + offset, y, Math.min(9, w - offset), h, '#ffc063')
        else rect(x + 2, y + offset, w - 4, Math.min(5, h - offset), '#efab61')
      }
      if (type === 'drone') {
        rect(x - 5, y - 3, 18, 3, '#f6c07d')
        rect(x + w - 13, y - 3, 18, 3, '#f6c07d')
      }
    }
  }

  function craft(run, terminalAge) {
    const drone = run.drone
    if (!run.settings.reducedMotion && drone.invulnerable && Math.floor(run.elapsed * 15) % 2) ctx.globalAlpha = 0.52
    ctx.save()
    const shutdown = run.result && drone.health === 0 ? terminalAge : 0
    ctx.translate(drone.x, drone.y + shutdown * shutdown * 115)
    ctx.rotate(drone.tilt + shutdown * 2.1)
    if (drone.boosting && run.settings.particles !== 'off') {
      const trail = 24 + 13 * Math.sin(run.elapsed * 41)
      const direction = drone.vx < 0 ? 1 : -1
      ctx.fillStyle = '#8de6ee'
      for (const offset of [-4, 8]) {
        ctx.beginPath()
        ctx.moveTo(direction * 13, offset)
        ctx.lineTo(direction * (40 + trail), offset + 4)
        ctx.lineTo(direction * 25, offset + 5)
        ctx.fill()
      }
    }
    rect(-37, -4, 74, 7, ink)
    for (const rotor of [-34, 34]) {
      rect(rotor - 4, -9, 8, 16, '#3c5761')
      const length = run.settings.reducedMotion ? 22 : 16 + Math.abs(Math.sin(run.elapsed * 35)) * 13
      rect(rotor - length / 2, -11, length, 3, '#effbfa')
    }
    ctx.fillStyle = ink
    ctx.beginPath()
    ctx.roundRect(-20, -10, 40, 24, 7)
    ctx.fill()
    rect(-15, -5, 30, 5, run.stats.color ?? '#e78552')
    rect(-9, 4, 18, 4, '#99e4de')
    if (!run.parcel) parcel(0, DROP.gap, run.contract.cargo)
    ctx.restore()
    ctx.globalAlpha = 1
  }

  function parcel(x, y, cargo) {
    const half = DROP.size / 2
    rect(x - half, y - half, DROP.size, DROP.size, ink)
    rect(x - half + 1, y - half + 1, DROP.size - 2, DROP.size - 2, CARGO[cargo].color)
    rect(x - 1, y - half + 1, 2, DROP.size - 2, pale)
  }

  return {
    reset() {
      camera = 0
      forecast = null
      nextForecast = 0
    },
    paint(scene, elapsed, terminalAge = 0) {
      const { run } = scene
      const quality = run.settings.graphics === 'low' ? 1 : 2
      const dpr = Math.min(devicePixelRatio || 1, quality)
      const nextWidth = Math.round(canvas.clientWidth * dpr)
      const nextHeight = Math.round(canvas.clientHeight * dpr)
      if (!nextWidth || !nextHeight) return
      if (nextWidth !== width || nextHeight !== height) {
        canvas.width = width = nextWidth
        canvas.height = height = nextHeight
        scale = height / WORLD.height
        view = width / scale
        skyKey = ''
      }
      const district = DISTRICTS.find(item => item.id === run.contract.district)
      const focus = clamp(run.drone.x - Math.min(360, view * 0.45) + run.drone.vx * 0.17, 0, Math.max(0, run.contract.width - view))
      camera = run.settings.reducedMotion ? focus : camera + (focus - camera) * (1 - Math.exp(-Math.max(1 / 120, elapsed) * 7))
      const impactAge = run.elapsed - (run.outcome?.time ?? -99)
      const shake = run.outcome?.type === 'collision' && impactAge < 0.25 && run.settings.shake && !run.settings.reducedMotion
        ? Math.sin(impactAge * 73) * 5 * (1 - impactAge * 4) : 0
      const offset = camera + shake
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      skyline(district, offset, run.settings.background !== 'low' && quality > 1)
      ctx.save()
      ctx.translate(-offset, 0)
      const shown = (x, w = 0) => x + w > camera - 150 && x < camera + view + 150
      if (run.contract.depot && shown(run.contract.depot.x)) {
        const { x, y, width: bay } = run.contract.depot
        ctx.strokeStyle = '#ffda8c'
        ctx.setLineDash([6, 5])
        ctx.strokeRect(x - bay / 2, y - 33, bay, 66)
        ctx.setLineDash([])
        rect(x - 40, y + 11, 80, 20, ink)
        label('CHARGE', x, y + 26, '#ffda8c', 13, 'center')
      }
      const accent = run.settings.contrast ? '#fff5a2' : district.accent
      run.targets.forEach((target, index) => { if (shown(target.x)) targetPad(target, run, index, accent) })
      for (const box of run.hazards) if (shown(box.x, box.w)) obstacle(box, run)
      if (run.phase === 'active' && run.elapsed >= nextForecast) {
        forecast = scene.predict()
        nextForecast = run.elapsed + 0.045
      }
      if (forecast && !run.parcel && run.phase === 'active' && shown(forecast.x)) {
        ctx.strokeStyle = forecast.damaged ? '#ff9f7a' : '#d8ffff'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 6])
        ctx.beginPath()
        ctx.moveTo(run.drone.x, run.drone.y + DROP.gap + 8)
        ctx.lineTo(forecast.x, forecast.y - 6)
        ctx.stroke()
        ctx.setLineDash([])
        label('×', forecast.x, forecast.y - 4, '#fff', 21, 'center')
      }
      if (run.parcel) parcel(run.parcel.x, run.parcel.y, run.parcel.cargo)
      craft(run, terminalAge)
      if (run.outcome && impactAge < 1.35) {
        const outcome = run.outcome
        const value = outcome.type.toUpperCase() + (outcome.points ? ` +${outcome.points}` : '')
        const rise = run.settings.reducedMotion ? 0 : impactAge * 26
        const x = clamp(outcome.x, camera + 82, camera + view - 82)
        const y = Math.max(view < 460 ? 154 : 115, outcome.y - 66 - rise)
        rect(x - value.length * 4.8 - 8, y - 17, value.length * 9.6 + 16, 25, ink)
        label(value, x, y, outcome.points ? '#ffe794' : '#ffbda3', 15, 'center')
        if (outcome.points && run.settings.particles !== 'off' && impactAge < 0.45 && !run.settings.reducedMotion) {
          ctx.globalAlpha = Math.max(0, 1 - impactAge / 0.45)
          ctx.strokeStyle = '#fff5cb'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.ellipse(outcome.x, outcome.y, 6 + impactAge * 44, 3 + impactAge * 11, 0, 0, Math.PI * 2)
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      }
      ctx.restore()
      if (run.contract.weather === 'foggy') rect(0, 100, view, 77, '#dbe9f626')
      if (run.contract.weather === 'rainy' && run.settings.particles !== 'off' && !run.settings.reducedMotion) {
        ctx.strokeStyle = '#dcecf45e'
        ctx.beginPath()
        for (let i = 0; i < (quality > 1 && run.settings.particles === 'high' ? 38 : 14); i++) {
          const x = hash(i + 771) * view
          const y = (hash(i + 150) * 560 + run.elapsed * 540) % 560
          ctx.moveTo(x, y)
          ctx.lineTo(x - 5, y + 18)
        }
        ctx.stroke()
      }
    },
  }
}
