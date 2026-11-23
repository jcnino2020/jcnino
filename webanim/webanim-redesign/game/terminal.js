import { ACHIEVEMENTS, DRONES, MAX_UPGRADE, PAINTS, UPGRADES, droneStats, getLevel, upgradeCost } from './career.js'

export const button = (action, label, type = '', disabled = false) => `<button class="route-btn ${type}" type="button" data-route="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`
export const back = () => button('menu', 'Main menu')
export const stats = (label, value) => `<div><dt>${label}</dt><dd>${value}</dd></div>`
export const time = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
export const credits = amount => `₱${amount.toLocaleString('en-PH')}`
export const title = (name, eyebrow = 'SKYWARD EXPRESS') => `<p class="route-kicker">${eyebrow}</p><h1 tabindex="-1">${name}</h1>`
export const stars = value => `<span aria-label="${value} of 3 stars">${'★'.repeat(value)}${'☆'.repeat(3 - value)}</span>`

export function garageView(save, notice, act) {
  const selected = save.selected
  const config = droneStats(save)
  const level = getLevel(save.xp)
  const actions = {}
  const models = Object.entries(DRONES).map(([id, model]) => {
    const owned = save.owned.includes(id)
    const label = id === selected ? 'Selected' : owned ? 'Select' : level < model.rank ? `Level ${model.rank}` : credits(model.cost)
    const action = `drone-${id}`
    actions[action] = () => act(owned ? 'select' : 'drone', id)
    return button(action, `<span>${model.name}<small>${model.role}</small></span><small>${label}</small>`,
      'contract-row hangar-row', id === selected || (!owned && (level < model.rank || model.cost > save.credits)))
  })
  const grades = Object.entries(UPGRADES).map(([key, item]) => {
    const current = save.upgrades[selected]?.[key] ?? 0
    const cost = upgradeCost(key, current)
    const locked = 1 + current * 3
    const action = `upgrade-${key}`
    actions[action] = () => act('upgrade', key)
    return button(action, `<span>${item.name} · ${current}/${MAX_UPGRADE}<small>${item.description}</small></span><small>${current >= MAX_UPGRADE ? 'Max level' : level < locked ? `Level ${locked}` : credits(cost)}</small>`,
      'contract-row hangar-row', current >= MAX_UPGRADE || level < locked || cost > save.credits)
  })
  const paints = Object.entries(PAINTS).map(([key, item]) => {
    const owned = save.paints.includes(key)
    const action = `paint-${key}`
    actions[action] = () => act(owned ? 'finish' : 'paint', key)
    return button(action, `${item.name}${key === save.paint ? ' · Active' : owned ? '' : level < item.rank ? ` · Lv ${item.rank}` : ' · ' + credits(item.cost)}`,
      '', key === save.paint || (!owned && (level < item.rank || item.cost > save.credits)))
  })
  return [`${title('Garage', 'DRONE HANGAR')}<p><strong>${credits(save.credits)}</strong> available for upgrades and equipment.</p>
    ${notice ? `<p role="status" class="route-notice">${notice}</p>` : ''}
    <div class="garage-model">
      <svg viewBox="0 0 220 125" aria-hidden="true">
        <path d="M35 55h150m-134 0v15m118-15v15" stroke="#182c39" stroke-width="8" stroke-linecap="round"/>
        <path d="M17 51h54m78 0h54" stroke="#4a6475" stroke-width="5" stroke-linecap="round"/>
        <path d="M89 76l-9 12m51-12 9 12" stroke="#172734" stroke-width="5" stroke-linecap="round"/>
        <rect x="72" y="43" width="76" height="34" rx="12" fill="#14232f"/>
        <rect x="81" y="49" width="58" height="8" rx="4" fill="${config.color}"/>
        <rect x="97" y="61" width="26" height="5" rx="2" fill="#9fe9dd"/>
      </svg>
      <div><h2>${config.name}</h2><p>${config.role} · Flight ready</p></div>
    </div>
    <dl class="route-controls">${stats('Top speed', `${config.speed} u/s`)}${stats('Thrust', config.acceleration)}${stats('Battery', config.battery)}
      ${stats('Hull', config.health)}${stats('Payload', config.capacity)}${stats('Armor', `${Math.round((1 - config.armor) * 100)}% reduction`)}
      ${stats('Braking', config.braking.toFixed(1))}${stats('Boost', `${(100 / config.boostDrain).toFixed(1)} s`)}</dl>
    <h2>Drone models</h2><div class="route-list">${models.join('')}</div>
    <h2>Installed upgrades</h2><div class="route-list">${grades.join('')}</div>
    <h2>Paint finish</h2><div class="route-actions">${paints.join('')}</div>
    <div class="route-actions">${button('career', 'Career dashboard', 'primary')}${back()}</div>`, actions]
}

export function statisticsView(save) {
  const stat = save.stats
  const rate = stat.attempts ? `${Math.min(100, 100 * stat.delivered / stat.attempts).toFixed(1)}%` : '—'
  return `${title('Statistics')}<dl class="route-controls">
    ${stats('Flight time', time(stat.time / 1000))}${stats('Package attempts', stat.attempts)}${stats('Delivered', stat.delivered)}
    ${stats('Failed drops', Math.max(0, stat.attempts - stat.delivered))}${stats('Accuracy', rate)}${stats('Perfect', stat.perfect)}
    ${stats('Best combo', `×${stat.combo || 1}`)}${stats('Endless record', stat.endless)}${stats('Classic record', save.arcade.score)}
    ${stats('Fastest Classic', save.arcade.seconds ? time(save.arcade.seconds / 1000) : '—')}${stats('Distance flown', `${(stat.distance / 1000).toFixed(1)} km`)}
    ${stats('Contracts completed', stat.missions)}${stats('Credits earned', credits(stat.credits))}
    </dl><div class="route-actions">${back()}</div>`
}

export function achievementsView(save) {
  return `${title('Achievements')}<p>${save.achievements.length} of ${Object.keys(ACHIEVEMENTS).length} unlocked</p><ul class="achievement-list">
    ${Object.entries(ACHIEVEMENTS).map(([key, [name, description]]) => `<li><span><strong>${name}</strong><small>${description}</small></span><b>${save.achievements.includes(key) ? 'Unlocked' : 'Locked'}</b></li>`).join('')}</ul><div class="route-actions">${back()}</div>`
}

export function settingsView(data, notice, pending) {
  const toggle = (key, label) => `<label class="setting-row"><span>${label}</span><input type="checkbox" data-setting="${key}" ${data[key] ? 'checked' : ''}></label>`
  const select = (key, label, choices) => `<label class="setting-row"><span>${label}</span><select data-setting="${key}">${Object.entries(choices).map(([val, text]) => `<option value="${val}" ${data[key] === val ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`
  const volume = (key, label) => `<label class="setting-row"><span>${label}</span><input type="range" min="0" max="100" value="${data[key]}" data-setting="${key}"></label>`
  const keys = { up: 'W / ↑', down: 'S / ↓', left: 'A / ←', right: 'D / →', drop: 'Space', boost: 'Shift' }
  const showKey = code => code?.replace(/^Key|^Digit|^Arrow/, '').replace(/Shift(Left|Right)/, 'Shift')
  return `${title('Settings')}${notice ? `<p role="status" class="route-notice">${notice}</p>` : ''}
    <div class="settings-grid">
      <fieldset><legend>Gameplay</legend>
        ${select('difficulty', 'Difficulty', { casual: 'Casual', standard: 'Standard', expert: 'Expert' })}
        <small>Casual widens pads, adds time and softens impacts. Expert narrows pads, shortens timers and disables stabilization.</small>
        ${toggle('stabilize', 'Stabilization assist')}${toggle('prediction', 'Landing prediction')}${toggle('contrast', 'High-contrast targets')}
        ${select('hud', 'HUD text size', { normal: 'Standard', large: 'Large' })}
      </fieldset>
      <fieldset><legend>Graphics</legend>
        ${select('graphics', 'Graphics quality', { high: 'High', low: 'Low' })}
        ${select('particles', 'Particle effects', { high: 'Full', low: 'Low', off: 'Off' })}
        ${select('background', 'Skyline detail', { high: 'Full', low: 'Low' })}
        ${toggle('shake', 'Screen shake')}${toggle('reducedMotion', 'Reduce motion')}
      </fieldset>
      <fieldset><legend>Audio</legend>
        ${volume('master', 'Master')}${volume('music', 'Music')}${volume('effects', 'Effects')}${volume('ambience', 'Ambience')}${toggle('mute', 'Mute all audio')}
      </fieldset>
      <fieldset><legend>Controls</legend>
        ${toggle('invert', 'Invert vertical input')}${select('touch', 'Touch directions', { left: 'Left side', right: 'Right side' })}
        <div class="bind-list">${Object.entries(keys).map(([action, defaults]) => button('bind-' + action, `${action[0].toUpperCase() + action.slice(1)} <small>${pending === action ? 'Press a key…' : showKey(data.customKeys[action]) ?? defaults}</small>`)).join('')}
        ${button('bind-reset', 'Restore default keys')}</div>
      </fieldset>
    </div><h2>Saved progress</h2><p>Career saves are stored in this browser. Export a JSON copy to move your career to another device.</p>
    <div class="route-actions">${button('save-export', 'Export save')}${button('save-import', 'Import save')}${button('save-reset', 'Reset career')}${back()}</div>`
}
