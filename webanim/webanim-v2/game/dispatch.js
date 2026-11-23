import { startGame, showClassicPreview, classicAudio } from '../script.js'
import { CARGO, DIFFICULTIES, WEATHER } from './balance.js'
import { CONTRACTS, DISTRICTS, MODES } from './contracts.js'
import { fixedClock } from './core.js'
import { attachInput, bindings } from './input.js'
import { startMission } from './mission.js'
import { comboFor } from './physics.js'
import { createRenderer } from './renderer.js'
import { createPreview } from './preview.js'
import { DRONES, PAINTS, UPGRADES, available, districtAvailable, droneStats, getLevel, purchase, rankFor, recordArcade, recordRun, saveStore, xpFor } from './career.js'
import { achievementsView, back, button, credits as money, garageView, settingsView, stars, statisticsView, stats, time, title } from './terminal.js'

const element = id => document.getElementById(id)
const stage = element('stage')
const terminal = element('dispatch')
const terminalContent = element('dispatch-content')
const flight = element('contract-flight')
const hud = element('contract-hud')
const dialog = element('flight-dialog')
const clock = fixedClock()
const canvas = element('contract-canvas')
const renderer = createRenderer(canvas)
const backdrop = createPreview(canvas, renderer)
let insertPreview = null
let reveal = null
let scene = null
let afterBrief = () => menu()
let classicRunning = false
let hudStamp = ''
let settledAt = null
let lastOutcome
let animation
let screenActions = new Map()
const store = saveStore()
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)')
let binding = null
let runId = ''
const settings = () => ({ ...store.data.settings, reducedMotion: store.data.settings.reducedMotion || prefersReduced.matches })
const mappedKeys = () => {
  const custom = Object.entries(store.data.settings.customKeys)
  const actions = custom.map(([action]) => action)
  return { ...Object.fromEntries(Object.entries(bindings).filter(([, action]) => !actions.includes(action))),
    ...Object.fromEntries(custom.map(([action, code]) => [code, action])) }
}

const displayKey = (action, fallback) => store.data.settings.customKeys[action]?.replace(/^Key|^Digit/, '') ?? fallback
const formatObjective = target => target.window ? `${target.name} · ${target.window.open}s open / ${target.window.period}s cycle` : target.name
const tone = (frequency, duration = 0.1, volume = 0.1) => classicAudio.playTone(frequency, { dur: duration, vol: volume })

function show(markup, actions = {}, options = {}) {
  binding = options.binding ?? null
  reveal?.cancel()
  reveal = null
  terminal.hidden = false
  terminal.inert = false
  terminal.dataset.view = options.view ?? 'sheet'
  stage.hidden = true
  stage.inert = true
  flight.hidden = true
  terminalContent.className = `route-sheet view-${terminal.dataset.view}`
  insertPreview?.stop()
  insertPreview = null
  terminalContent.innerHTML = markup
  if (screenActions.size) {
    const focus = options.focus ? terminalContent.querySelector(`[data-route="${options.focus}"]`) : null
    const target = focus ?? terminalContent.querySelector('h1')
    target?.focus({ preventScroll: true })
  }
  screenActions = new Map(Object.entries({ menu, ...actions }))
  if (!options.focus) terminal.scrollTop = 0

  const config = droneStats(store.data)
  if (options.world) backdrop.start(options.world, config, settings(), terminal.dataset.view)
  else backdrop.stop()
  const thumbnail = element('contract-thumbnail')
  if (thumbnail && options.thumbnail) {
    insertPreview = createPreview(thumbnail)
    insertPreview.start(options.thumbnail, config, settings(), 'detail')
  }
}

function leaveFlight() {
  scene = null
  cancelAnimationFrame(animation)
  animation = null
  classicAudio.setHum(0)
  clock.reset()
  inputs.clear()
  hudStamp = ''
  dialog.hidden = true
  hud.inert = false
  element('flight-touch').inert = false
  flight.hidden = true
}

const nextContract = save => CONTRACTS.find(contract => !contract.optional && available(save, contract) && !save.records[contract.id]?.stars)

function menu() {
  if (classicRunning) showClassicPreview()
  classicRunning = false
  leaveFlight()
  const save = store.data
  const next = nextContract(save)
  const district = DISTRICTS.find(item => item.id === next?.district)
  show(`<div class="home-copy">
      <h1 tabindex="-1">SKYWARD<span>EXPRESS</span></h1>
      <p>Arcade drone delivery across five districts.</p>
      <nav class="home-play" aria-label="Play">
        ${button('career-primary', save.started ? 'Continue career' : 'Start career', 'primary')}
        ${save.started && next ? `<span class="home-next">Next contract · ${next.title}</span>` : ''}
        ${button('classic', 'Classic Shift', 'home-option')}
        ${button('challenges', 'Challenges', 'home-option')}
      </nav>
      <nav class="home-tools" aria-label="Game options">
        ${button('garage', 'Garage', 'text-button')}
        ${button('pilot', 'Pilot log', 'text-button')}
        ${button('settings', 'Settings', 'text-button')}
        ${button('help', 'How to play', 'text-button')}
      </nav>
    </div>`, {
      'career-primary': save.started ? () => district ? districtBoard(district, next) : career() : startCareer,
      classic: () => classic(false), challenges, garage: () => garage(), pilot: pilotLog, settings: () => openSettings(), help,
    }, { view: 'home', world: next ?? CONTRACTS[0] })
}

function classic(endless) {
  terminal.hidden = true
  backdrop.stop()
  stage.inert = false
  classicRunning = true
  startGame(endless)
}

function startCareer() {
  store.change(save => { save.started = true })
  const first = CONTRACTS[0]
  briefing(first, () => districtBoard(DISTRICTS[0], first))
}

function pilotLog() {
  const save = store.data
  show(`${title('Pilot log')}<p>Review delivery records and milestones from this career.</p>
    <div class="route-list">
      ${button('career', 'Career overview', 'contract-row')}${button('stats', 'Statistics', 'contract-row')}
      ${button('medals', 'Achievements', 'contract-row')}${button('credits', 'Credits', 'contract-row')}
    </div><div class="route-actions">${back()}</div>`, {
      career, stats: () => show(statisticsView(save)), medals: () => show(achievementsView(save)), credits,
    })
}

function career() {
  const save = store.data
  const level = getLevel(save.xp)
  const mains = CONTRACTS.filter(contract => !contract.optional)
  const cleared = mains.filter(contract => save.records[contract.id]?.stars)
  const total = CONTRACTS.reduce((sum, contract) => sum + (save.records[contract.id]?.stars ?? 0), 0)
  const next = nextContract(save)
  show(`${title('Career dashboard', rankFor(level).toUpperCase())}
    ${store.notice ? `<p class="route-notice">${store.notice}</p>` : ''}
    <dl class="route-controls">${stats('Level', level)}${stats('Experience', `${save.xp.toLocaleString()} XP`)}
      ${stats('Next level', level < 999 ? `${xpFor(level + 1) - save.xp} XP to go` : 'Max level')}
      ${stats('Credits', money(save.credits))}${stats('Deliveries', save.stats.delivered)}${stats('Main contracts', `${cleared.length} / ${mains.length}`)}
      ${stats('Stars', `${total} / ${CONTRACTS.length * 3}`)}${stats('Selected drone', DRONES[save.selected].name)}</dl>
    ${next ? `<h2>Next contract</h2><div class="route-list">${button('next', next.title, 'primary')}</div>` : ''}
    <h2>Districts</h2><div class="route-list">${DISTRICTS.map(district => {
      const unlocked = districtAvailable(save, district)
      return button(district.id, `<span>${district.name}</span><small>${unlocked ? district.description : `Level ${district.rank} · Complete the previous district`}</small>`, 'contract-row', !unlocked)
    }).join('')}</div><div class="route-actions">${button('garage', 'Garage')}${save.started ? button('new', 'New career') : ''}${back()}</div>`,
    { new: () => confirmReset(true), garage: () => garage(), next: () => briefing(next, career), ...Object.fromEntries(DISTRICTS.map(district => [district.id, () => districtBoard(district)])) })
}

function districtBoard(district, selection = null, moveFocus = false) {
  const save = store.data
  const entries = CONTRACTS.filter(contract => contract.district === district.id)
  const selected = selection ?? entries.find(contract => available(save, contract) && !save.records[contract.id]?.stars) ?? entries[0]
  const actions = { career }
  const rows = entries.map(contract => {
    const unlocked = available(save, contract)
    const rating = save.records[contract.id]?.stars ?? 0
    const requirement = CONTRACTS.find(item => item.id === contract.previous)
    const status = unlocked ? rating ? stars(rating) : 'Ready' : `After ${requirement?.title ?? 'first dispatch'}`
    const current = contract.id === selected.id ? ' aria-current="true"' : ''
    actions[contract.id] = () => matchMedia('(max-width: 740px)').matches
      ? briefing(contract, () => districtBoard(district, contract))
      : districtBoard(district, contract, true)
    return `<button class="route-btn contract-row board-row" type="button" data-route="${contract.id}"${current} ${unlocked ? '' : 'disabled'}>
      <span>${contract.title}<small>${contract.optional ? 'District challenge' : contract.type}</small></span>
      <small class="board-status">${status}</small></button>`
  }).join('')
  actions.brief = () => briefing(selected, () => districtBoard(district, selected))
  actions.launch = () => launchFromLoadout(selected, () => districtBoard(district, selected))

  show(`<div class="board-top"><div>${title(district.name)}<p>${district.description}</p></div>
    <nav class="board-nav" aria-label="Contract navigation">${button('career', 'All districts')}${back()}</nav>
    </div><div class="board-grid">
    <div class="route-list board-list" aria-label="District contracts">${rows}</div>
    <aside class="board-detail" aria-label="Selected contract">
      <canvas id="contract-thumbnail" aria-hidden="true"></canvas>
      <div class="board-detail-copy">
        <h2>${selected.title}</h2><p>${selected.description}</p>
        ${contractFacts(selected)}
        <div class="board-launch">${loadoutSelect(selected)}
          <div class="route-actions">${button('launch', 'Launch flight', 'primary')}${button('brief', 'Full briefing')}</div>
        </div>
        <h3>Delivery order</h3>${deliveryOrder(selected)}
      </div>
    </aside>
  </div>`, actions,
    { view: 'board', thumbnail: selected, focus: moveFocus ? selected.id : null })
}

function garage(notice = '') {
  const [view, actions] = garageView(store.data, notice || store.notice, (kind, id) => {
    const ok = store.change(save => {
      if (kind === 'select' && save.owned.includes(id)) save.selected = id
      else if (kind === 'finish' && save.paints.includes(id)) save.paint = id
      else if (!purchase(save, kind, id)) return false
      return true
    })
    const item = UPGRADES[id] ?? DRONES[id] ?? PAINTS[id]
    garage(ok ? `${item.name} ${kind === 'select' || kind === 'finish' ? 'equipped' : kind === 'upgrade' ? 'upgraded' : 'purchased'}.` : 'Equipment unavailable or insufficient credits.')
  })
  show(view, { ...actions, career }, { view: 'garage' })
}

function confirmReset(start = false) {
  show(`${title(start ? 'Start a new career?' : 'Reset career?')}<p>This clears your local contracts, stars, credits, drones, and career statistics. Classic Shift records and settings are kept.</p>
    <div class="route-actions">${button('confirm-reset', start ? 'Start new career' : 'Reset career', 'primary')}${button('cancel', 'Cancel')}</div>`, {
    'confirm-reset': () => { store.reset(); start ? startCareer() : openSettings('Career reset.') }, cancel: start ? menu : () => openSettings(),
  })
}

function openSettings(notice = '', pending = null) {
  const actions = {
    'bind-reset': () => { store.change(save => { save.settings.customKeys = {} }); openSettings('Default controls restored.') },
    'save-export': exportSave, 'save-import': () => element('save-file').click(), 'save-reset': () => confirmReset(),
  }
  for (const action of ['up', 'down', 'left', 'right', 'drop', 'boost']) actions['bind-' + action] = () => openSettings('Press a key to assign it. Escape cancels.', action)
  show(settingsView(store.data.settings, notice || store.notice, pending), actions, { binding: pending })
}

function exportSave() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'skyward-express-rooftop-dispatch-save.json'
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function challenges() {
  const modes = Object.values(MODES)
  show(`${title('Challenges')}<div class="route-list">
    ${button('endless', '<span>Endless</span><small>Keep delivering as the city speeds up.</small>', 'contract-row')}
    ${modes.map(mode => button(mode.id, `<span>${mode.title}</span><small>${mode.description}</small>`, 'contract-row')).join('')}</div>
    <div class="route-actions">${back()}</div>`, {
      endless: () => classic(true), ...Object.fromEntries(modes.map(mode => [mode.id, () => briefing(mode, challenges)])),
    })
}

function help() {
  show(`${title('How to play')}<dl class="route-controls">
    ${stats('Fly', [displayKey('up', 'W / ↑'), displayKey('left', 'A / ←'), displayKey('down', 'S / ↓'), displayKey('right', 'D / →')].join(' · '))}
    ${stats('Drop', displayKey('drop', 'Space'))}${stats('Boost', displayKey('boost', 'Shift'))}${stats('Pause', 'P or Escape')}${stats('Restart', 'R while paused')}
    </dl><p>Line up over the current landing pad and release one parcel at a time. The center stripe marks a perfect drop. Momentum carries into each release, so slow down above narrow pads.</p>
    <p>On touchscreens, hold a direction on the pad and tap Drop or hold Boost with your other thumb.</p>
    <div class="route-actions">${button('practice', 'Start free flight', 'primary')}${back()}</div>`, { practice: () => briefing(MODES.training, menu) })
}

function credits() {
  show(`${title('Credits')}<p>Skyward Express was created by JC Niñonuevo. This edition builds on the original five-level arcade shift.</p><div class="route-actions">${back()}</div>`)
}

function loadoutSelect(contract) {
  const aircraft = Object.entries(DRONES).filter(([id]) => store.data.owned.includes(id) && droneStats(store.data, id).capacity >= CARGO[contract.cargo].weight)
  return `<label class="setting-row"><span>Loadout</span><select id="route-loadout">${aircraft.map(([id, drone]) => `<option value="${id}" ${store.data.selected === id ? 'selected' : ''}>${drone.name}</option>`).join('')}</select></label>`
}

function contractFacts(contract) {
  const duration = contract.time ? time(Math.ceil(contract.time * (contract.mode ? 1 : DIFFICULTIES[settings().difficulty].time))) : 'Open'
  return `<dl class="route-controls">${stats('Cargo', CARGO[contract.cargo].name)}${stats('Weather', WEATHER[contract.weather].name)}${stats('Time limit', duration)}</dl>`
}

function deliveryOrder(contract) {
  return `<ol class="route-order">${contract.targets.map(target => `<li>${formatObjective(target)}</li>`).join('')}</ol>`
}

function briefing(contract, onBack) {
  show(`${title(contract.title)}<p>${contract.description}</p>${contractFacts(contract)}
    <h2>Delivery order</h2>${deliveryOrder(contract)}
    ${contract.conditions.length ? `<details class="brief-stars"><summary>Star objectives</summary><ol class="route-order"><li>Complete the contract</li>${contract.conditions.map(condition => `<li>${condition.label}</li>`).join('')}</ol></details>` : ''}
    ${loadoutSelect(contract)}
    ${!contract.mode ? `<p class="brief-reward">First completion · ${money(contract.credits)} and ${contract.xp} XP</p>` : ''}
    <div class="route-actions">${button('launch', 'Launch flight', 'primary')}${button('previous', 'Back')}</div>`,
    { launch: () => launchFromLoadout(contract, onBack), previous: onBack }, { view: 'brief', world: contract })
}

function launchFromLoadout(contract, onBack) {
  afterBrief = onBack
  store.change(save => {
    save.selected = element('route-loadout').value || save.selected
    if (!contract.mode) save.started = true
  })
  launch(contract)
}

function launch(contract) {
  const animate = !terminal.hidden && !settings().reducedMotion
  const slide = terminal.dataset.view === 'brief' ? 64 : -64
  leaveFlight()
  insertPreview?.stop()
  insertPreview = null
  backdrop.stop(false)
  scene = startMission(contract, droneStats(store.data), settings())
  runId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  flight.classList.toggle('touch-right', scene.run.settings.touch === 'right')
  flight.classList.toggle('hud-large', scene.run.settings.hud === 'large')
  element('flight-status').textContent = ''
  if (!scene.launch()) {
    leaveFlight()
    return briefing(contract, afterBrief)
  }
  classicAudio.startHum()
  classicAudio.setHum(0.023)
  stage.hidden = true
  flight.hidden = false
  flight.focus({ preventScroll: true })
  lastOutcome = null
  settledAt = null
  renderer.reset()
  renderer.paint(scene, 0, 0, { style: 'brief' })
  if (animate && terminalContent.animate) {
    const launched = scene
    terminal.inert = true
    terminal.dataset.view = 'reveal'
    reveal = terminalContent.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: `translateX(${slide}px)`, opacity: 0 }],
      { duration: 350, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' })
    reveal.finished.then(() => { if (scene === launched) terminal.hidden = true }).catch(() => {})
  } else terminal.hidden = true
  renderHud(scene.run)
  animation = requestAnimationFrame(frame)
}

function renderHud(run) {
  const { drone, stats: capacity, contract } = run
  const battery = Math.ceil(drone.battery * 100 / capacity.battery)
  const hull = Math.ceil(drone.health * 100 / capacity.health)
  const target = run.target
  const open = !target?.window || run.elapsed % target.window.period < target.window.open
  const goal = target ? `${target.name}${open ? '' : ' · closed'}` : 'Route complete'
  const remaining = run.timeLeft === null ? 'Open' : time(Math.ceil(run.timeLeft))
  const wind = Math.abs(run.wind) > 16 ? (run.wind > 0 ? 'Wind →' : 'Wind ←') : ''
  const summary = `${run.score.points} pts · ×${comboFor(run.score.streak)}`
  const progress = run.practice || contract.mode === 'trial' ? '' : ` · ${Math.min(run.targetIndex + 1, run.targets.length)}/${run.targets.length}`
  const range = target ? target.x - drone.x : 0
  const bearing = Math.abs(range) > 62 ? (range > 0 ? ' →' : ' ←') : ' ↓'
  const cargo = CARGO[contract.cargo].name
  const attempts = contract.attemptLimit ? ` · ${contract.attemptLimit - run.score.attempts} attempts left` : ''
  const timestamp = [goal, bearing, remaining, summary, battery, hull, Math.floor(drone.boost / 5), wind, run.phase].join(':')
  if (timestamp !== hudStamp) {
    hudStamp = timestamp
    element('flight-name').textContent = contract.title
    element('flight-objective').textContent = `${goal}${bearing}${progress}`
    element('flight-time').textContent = remaining
    element('flight-time-label').textContent = run.timeLeft === null ? 'Time limit' : 'Time left'
    element('flight-cargo').textContent = cargo + attempts
    element('flight-score').textContent = summary
    element('flight-hull').textContent = `Hull ${hull}%`
    element('flight-battery').textContent = `Battery ${battery}%`
    const boost = Math.floor(drone.boost / 5) * 5
    element('flight-boost').textContent = `${boost}%`
    element('flight-key-boost').textContent = `Boost ${boost}% · ${displayKey('boost', 'Shift')}`
    element('flight-boost-control').setAttribute('aria-label', `Boost ${boost} percent`)
    element('flight-boost-control').style.setProperty('--boost', `${boost}%`)
    element('flight-wind').textContent = wind
    element('flight-hull').classList.toggle('warning', hull <= 30)
    element('flight-battery').classList.toggle('warning', battery <= 22)
    element('flight-time').classList.toggle('warning', run.timeLeft !== null && run.timeLeft <= 12)
    hud.dataset.phase = run.phase
  }
  const countdown = element('flight-countdown')
  countdown.hidden = run.phase !== 'countdown'
  if (!countdown.hidden && countdown.textContent !== String(Math.ceil(run.countdown))) countdown.textContent = Math.ceil(run.countdown)
  const guide = element('flight-guide')
  guide.hidden = !contract.tutorial || run.phase !== 'active' || run.score.delivered > 1
  if (!guide.hidden) {
    const dropKey = run.settings.customKeys?.drop?.replace(/^Key|^Digit/, '') ?? 'Space'
    const tip = run.score.delivered ? 'Fly right to the café. Brake above the pad, then drop.' : `You’re above the bakery. Press ${dropKey} or tap Drop.`
    if (guide.textContent !== tip) guide.textContent = tip
  }
}

function frame(now) {
  if (!scene || document.hidden) return
  const elapsed = clock.advance(now, dt => scene.update(dt, inputs))
  const { run } = scene
  if (run.phase === 'active') {
    classicAudio.music(elapsed, DISTRICTS.findIndex(district => district.id === run.contract.district) + 1)
    classicAudio.setHum(run.drone.boosting ? 0.048 : 0.018 + Math.min(0.012, Math.abs(run.wind) / 8000))
  }
  if (run.outcome && run.outcome !== lastOutcome) {
    lastOutcome = run.outcome
    tone(lastOutcome.type === 'collision' ? 134 : lastOutcome.type === 'perfect' ? 987 : lastOutcome.points ? 760 : 240, 0.16)
    if (lastOutcome.type === 'perfect') classicAudio.playTone(1318, { dur: 0.18, vol: 0.08, delay: 0.06 })
    element('flight-status').textContent = lastOutcome.type + (lastOutcome.points ? `, ${lastOutcome.points} points` : '')
  }
  if (run.result) {
    settledAt ??= now
    const seconds = (now - settledAt) / 1000
    if (seconds >= 0.55 || run.settings.reducedMotion) return results(run)
    renderer.paint(scene, elapsed, seconds)
    animation = requestAnimationFrame(frame)
    return
  }
  renderer.paint(scene, elapsed)
  renderHud(run)
  if (run.phase !== 'paused') animation = requestAnimationFrame(frame)
}

function results(run) {
  const { result, contract } = run
  const before = store.data
  const rewards = store.change(save => recordRun(save, contract, result, runId))
  const after = store.data
  const oldLevel = getLevel(before.xp)
  const level = getLevel(after.xp)
  const newDistricts = DISTRICTS.filter(district => districtAvailable(after, district) && !districtAvailable(before, district)).map(district => district.name)
  const newModels = Object.values(DRONES).filter(model => model.rank > oldLevel && model.rank <= level).map(model => model.name)
  const next = result.success && !contract.mode && CONTRACTS.find(item => !item.optional && item.previous === contract.id && available(after, item))
  const unlocks = [...newDistricts, ...newModels]
  const accuracy = result.attempts ? `${Math.round(result.delivered * 100 / result.attempts)}%` : '—'
  const hull = `${Math.ceil(result.health * 100 / run.stats.health)}%`
  const rank = `${rankFor(level)} · Lv ${level}`
  leaveFlight()
  tone(result.success ? 880 : 224, 0.28)
  if (rewards?.achievements.length) classicAudio.playTone(1174, { dur: 0.2, vol: 0.09, delay: 0.28 })
  show(`${title(result.success ? 'Route complete' : 'Route ended', contract.title.toUpperCase())}<p>${result.reason}</p>
    <dl class="route-controls">
      ${stats('Score', result.points)}${stats('Deliveries', `${result.delivered}/${result.attempts}`)}${stats('Accuracy', accuracy)}
      ${stats('Perfect', result.perfect)}${stats('Best combo', `×${result.bestCombo || 1}`)}${stats('Time', time(result.seconds))}
      ${stats('Hull remaining', hull)}${stats('Impacts', result.hits)}${stats('Bonus score', result.bonus)}
      ${!contract.mode ? stats('Credits', money(rewards?.credits ?? 0)) + stats('Experience', `${rewards?.xp ?? 0} XP`) + stats('Current rank', rank) : ''}
      ${contract.conditions.length ? stats('Stars', `${result.stars} / 3`) : ''}
    </dl>
    ${result.objectives.length ? `<h2>Star objectives</h2><ul class="route-order">${result.objectives.map(condition => `<li>${condition.fulfilled ? 'Met' : 'Unmet'} · ${condition.label}</li>`).join('')}</ul>` : ''}
    ${unlocks.length ? `<p class="route-notice">Now available · ${unlocks.join(', ')}</p>` : ''}
    ${rewards?.achievements.length ? `<p role="status" class="route-notice">Achievements unlocked · ${rewards.achievements.join(', ')}</p>` : ''}
    <div class="route-actions">
      ${next ? button('next', 'Next contract', 'primary') : ''}${button('retry', 'Retry flight', next ? '' : 'primary')}
      ${button('previous', 'Back to routes')}${!contract.mode ? button('career', 'Career dashboard') : ''}
      ${button('garage', 'Garage')}${back()}
    </div>`, { retry: () => launch(contract), previous: afterBrief, garage: () => garage(), career, next: () => briefing(next, career) })
}

function togglePause() {
  if (!scene) return
  if (scene.run.phase === 'paused') {
    if (!scene.resume()) return
    dialog.hidden = true
    hud.inert = false
    element('flight-touch').inert = false
    clock.reset()
    flight.focus({ preventScroll: true })
    animation = requestAnimationFrame(frame)
  } else if (scene.pause()) {
    cancelAnimationFrame(animation)
    classicAudio.setHum(0)
    inputs.clear()
    element('flight-finish').hidden = !scene.run.practice
    dialog.hidden = false
    hud.inert = true
    element('flight-touch').inert = true
    element('flight-resume').focus({ preventScroll: true })
  }
}

const inputs = attachInput({
  active: () => Boolean(scene),
  controls: flight.querySelectorAll('[data-action]'),
  getBindings: mappedKeys,
  onBlur: () => {
    if (scene?.run.result) results(scene.run)
    else if (scene?.run.phase !== 'paused') togglePause()
  },
  onAction(action) {
    if (action === 'pause' && !scene.run.result) togglePause()
    else if (action === 'restart' && scene.run.phase === 'paused') launch(scene.run.contract)
    else if (action === 'drop' && scene.drop()) tone(440, 0.08)
    else return false
  },
})

function handleRoute(event) {
  const action = event.target.closest('[data-route]')?.dataset.route
  if (!action) return
  classicAudio.initAudio()
  tone(590, 0.055)
  screenActions.get(action)?.()
}
terminal.addEventListener('click', handleRoute)
document.querySelectorAll('[data-classic-menu]').forEach(control => control.addEventListener('click', menu))
element('flight-pause').addEventListener('click', togglePause)
element('flight-resume').addEventListener('click', togglePause)
element('flight-restart').addEventListener('click', () => launch(scene.run.contract))
element('flight-exit').addEventListener('click', menu)
element('flight-finish').addEventListener('click', () => {
  if (!scene?.run.practice) return
  if (scene.run.phase === 'paused') scene.resume()
  if (scene.endPractice()) results(scene.run)
})

terminal.addEventListener('change', event => {
  const field = event.target
  const key = field.dataset.setting
  if (!key) return
  const value = field.type === 'checkbox' ? field.checked : field.type === 'range' ? Number(field.value) : field.value
  store.change(save => { save.settings[key] = value })
  applySettings()
})
document.addEventListener('keydown', event => {
  if (!binding || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
  event.preventDefault()
  event.stopImmediatePropagation()
  if (event.code === 'Escape') return openSettings()
  const action = binding
  const saved = store.change(save => {
    if (!/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Shift(Right|Left))$/.test(event.code) ||
        (bindings[event.code] && bindings[event.code] !== action) ||
        Object.entries(save.settings.customKeys).some(([other, code]) => other !== action && code === event.code)) return false
    save.settings.customKeys[action] = event.code
    return true
  })
  openSettings(saved ? 'Control updated.' : 'That key is reserved or already assigned.', saved ? null : action)
}, true)

element('save-file').addEventListener('change', async event => {
  const field = event.target
  const file = field.files[0]
  field.value = ''
  if (!file) return
  try {
    const raw = file.size <= 1024 * 1024 ? await file.text() : ''
    if (!store.import(raw)) return openSettings('This file is not a supported Skyward Express save.')
    applySettings()
    openSettings('Save imported.')
  } catch {
    openSettings('The selected file could not be read.')
  }
})

function applySettings() {
  const current = settings()
  document.documentElement.classList.toggle('route-reduce', current.reducedMotion)
  classicAudio.configure(current, mappedKeys)
}
prefersReduced.addEventListener('change', () => {
  applySettings()
  if (terminal.dataset.view === 'home' && !terminal.hidden) menu()
})
window.addEventListener('resize', () => {
  backdrop.refresh()
  insertPreview?.refresh()
  if (scene?.run.phase === 'paused') renderer.paint(scene, 0)
})
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) backdrop.refresh()
})
window.addEventListener('skyward:muted', event => {
  store.change(save => { save.settings.mute = event.detail })
  applySettings()
})
window.addEventListener('skyward:arcade-results', event => store.change(save => recordArcade(save, event.detail)))
applySettings()
showClassicPreview()
menu()
