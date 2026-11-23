import { DIFFICULTIES, FLIGHT } from './balance.js'
import { CONTRACTS, DISTRICTS, MODES } from './contracts.js'
import { bindings } from './input.js'

export const SAVE_KEY = 'skyward_rooftop_dispatch_v1'
export const SAVE_VERSION = 1
export const DRONES = {
  swift: { name: 'Swift X1', role: 'Balanced starter', cost: 0, rank: 1, color: '#eb8d56' },
  cargolift: { name: 'CargoLift C2', role: 'Heavy payloads', cost: 500, rank: 3, color: '#f0c260', speed: 238, acceleration: 570, health: 120, capacity: 5, battery: 120 },
  falcon: { name: 'Falcon S3', role: 'Express and timed routes', cost: 775, rank: 5, color: '#ffadb2', speed: 327, acceleration: 735, battery: 87 },
  stormrider: { name: 'Stormrider R4', role: 'Bad-weather handling', cost: 1050, rank: 8, color: '#82ddd6', windShield: 0.48, braking: 7.3, armor: 0.82 },
  prototype: { name: 'Skyward Prototype', role: 'Long-range courier', cost: 1550, rank: 14, color: '#baecfb', speed: 315, acceleration: 720, battery: 145, capacity: 5, boostDrain: 40 },
}
export const UPGRADES = {
  motor: { name: 'Motor', description: '+18 speed and +65 thrust per level', cost: 130 },
  battery: { name: 'Battery', description: '+19 energy capacity per level', cost: 145 },
  stabilizer: { name: 'Stabilizer', description: 'Quicker braking and less wind drift', cost: 120 },
  cargo: { name: 'Cargo bay', description: '+1 payload capacity and less load drag per level', cost: 115 },
  armor: { name: 'Armor', description: '12% less collision damage per level', cost: 130 },
  boost: { name: 'Boost', description: 'Longer boost and faster recharge per level', cost: 140 },
}
export const MAX_UPGRADE = 3
export const PAINTS = {
  stock: { name: 'Factory finish', rank: 1, cost: 0 },
  amber: { name: 'Amber', rank: 3, cost: 100, color: '#ffd27b' },
  tide: { name: 'Tide', rank: 6, cost: 190, color: '#73e7dc' },
  arctic: { name: 'Arctic', rank: 10, cost: 240, color: '#dcf6ff' },
}
const ranks = [[40, 'Skyline Legend'], [30, 'Elite Courier'], [20, 'Senior Pilot'], [10, 'Certified Courier'], [5, 'Junior Pilot'], [1, 'Trainee Courier']]
const zeroStats = { time: 0, delivered: 0, attempts: 0, perfect: 0, combo: 0, endless: 0, distance: 0, missions: 0, credits: 0, hits: 0 }
const max = Number.MAX_SAFE_INTEGER
const count = (value, ceiling = max) => Number.isSafeInteger(value) && value >= 0 ? Math.min(ceiling, value) : 0
const bounded = (value, fallback) => Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback
const bestKeys = [...CONTRACTS.map(contract => contract.id), ...Object.keys(MODES)]
const owns = (record, key) => Object.hasOwn(record, key)

export const ACHIEVEMENTS = {
  first: ['First Contact', 'Make your first delivery.', save => save.stats.delivered > 0],
  untouched: ['Untouchable', 'Complete a career contract without damage.', save => Object.values(save.records).some(record => record.clean)],
  express: ['Speed Courier', 'Finish an express contract with at least 10 seconds left.', save => Object.values(save.records).some(record => record.express)],
  bullseye: ['Bullseye', 'Make a perfect delivery.', save => save.stats.perfect > 0],
  streak: ['Triple Threat', 'Reach a 3× combo.', save => save.stats.combo >= 3],
  night: ['Night Owl', 'Complete a night contract.', save => CONTRACTS.some(contract => contract.weather === 'night' && save.records[contract.id]?.stars)],
  heavy: ['Heavy Lifter', 'Complete a heavy cargo contract.', save => CONTRACTS.some(contract => contract.cargo === 'heavy' && save.records[contract.id]?.stars)],
  district: ['Downtown Dispatch', 'Complete all eight Downtown contracts.', save => Boolean(save.records['downtown-8']?.stars)],
  legend: ['Skyline Legend', 'Reach level 40.', save => getLevel(save.xp) >= 40],
  master: ['Master Pilot', 'Earn three stars on every main contract.', save => CONTRACTS.every(contract => contract.optional || save.records[contract.id]?.stars === 3)],
  endless: ['Endless Veteran', 'Score 3,500 points in Endless.', save => save.stats.endless >= 3500],
}

export function emptySave() {
  return {
    version: SAVE_VERSION, started: false, xp: 0, credits: 0, records: {}, owned: ['swift'], selected: 'swift',
    paint: 'stock', paints: ['stock'], upgrades: {}, achievements: [], stats: { ...zeroStats }, arcade: { score: 0, seconds: 0 }, paid: [],
    settings: { difficulty: 'standard', prediction: true, stabilize: true, invert: false, shake: true, contrast: false,
      reducedMotion: false, graphics: 'high', particles: 'high', background: 'high', master: 80, music: 28, effects: 80, ambience: 50, mute: false,
      hud: 'normal', touch: 'left', customKeys: {} },
  }
}

export function validateSave(snapshot) {
  if (!snapshot || snapshot.version !== SAVE_VERSION || Array.isArray(snapshot)) return null
  const clean = emptySave()
  clean.started = snapshot.started === true
  clean.xp = count(snapshot.xp)
  clean.credits = count(snapshot.credits)
  if (Array.isArray(snapshot.owned)) clean.owned.push(...new Set(snapshot.owned.filter(id => id !== 'swift' && owns(DRONES, id))))
  if (clean.owned.includes(snapshot.selected)) clean.selected = snapshot.selected
  if (Array.isArray(snapshot.paints)) clean.paints.push(...new Set(snapshot.paints.filter(id => id !== 'stock' && owns(PAINTS, id))))
  if (clean.paints.includes(snapshot.paint)) clean.paint = snapshot.paint
  for (const drone of clean.owned) {
    const source = snapshot.upgrades?.[drone]
    if (source) clean.upgrades[drone] = Object.fromEntries(Object.keys(UPGRADES).map(key => [key, count(source[key], MAX_UPGRADE)]))
  }
  for (const key of bestKeys) {
    const record = snapshot.records?.[key]
    if (!record || typeof record !== 'object') continue
    clean.records[key] = { stars: count(record.stars, 3), best: count(record.best), seconds: count(record.seconds),
      clean: record.clean === true, express: record.express === true }
  }
  for (const key of Object.keys(zeroStats)) clean.stats[key] = count(snapshot.stats?.[key], key === 'combo' ? 3 : max)
  clean.arcade = { score: count(snapshot.arcade?.score), seconds: count(snapshot.arcade?.seconds) }
  if (Array.isArray(snapshot.paid)) clean.paid = [...new Set(snapshot.paid.filter(id => typeof id === 'string' && /^[a-z0-9-]{10,80}$/i.test(id)))].slice(-32)
  const source = snapshot.settings ?? {}
  for (const key of Object.keys(clean.settings)) {
    if (typeof clean.settings[key] === 'boolean' && typeof source[key] === 'boolean') clean.settings[key] = source[key]
    if (typeof clean.settings[key] === 'number') clean.settings[key] = bounded(source[key], clean.settings[key])
  }
  if (owns(DIFFICULTIES, source.difficulty)) clean.settings.difficulty = source.difficulty
  for (const key of ['graphics', 'background']) if (['low', 'high'].includes(source[key])) clean.settings[key] = source[key]
  if (['off', 'low', 'high'].includes(source.particles)) clean.settings.particles = source.particles
  if (['normal', 'large'].includes(source.hud)) clean.settings.hud = source.hud
  if (['left', 'right'].includes(source.touch)) clean.settings.touch = source.touch
  for (const action of ['up', 'down', 'left', 'right', 'drop', 'boost']) {
    const code = source.customKeys?.[action]
    if (typeof code === 'string' && /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Shift(Right|Left))$/.test(code) &&
      (!bindings[code] || bindings[code] === action) && !Object.values(clean.settings.customKeys).includes(code)) clean.settings.customKeys[action] = code
  }
  if (Array.isArray(snapshot.achievements)) clean.achievements = [...new Set(snapshot.achievements.filter(id => owns(ACHIEVEMENTS, id)))]
  refreshAchievements(clean)
  return clean
}

function readStorage(storage) {
  const raw = storage.getItem(SAVE_KEY)
  if (raw !== null) return validateSave(JSON.parse(raw))
  const migrated = emptySave()
  const score = Number(storage.getItem('skyward_rooftop_best_score'))
  const time = Number(storage.getItem('skyward_rooftop_best_time'))
  migrated.arcade = { score: count(Math.floor(score)), seconds: count(Math.round(time * 1000)) }
  return migrated
}

export function saveStore(storage) {
  if (storage === undefined) {
    try { storage = globalThis.localStorage } catch { /* Storage access may be blocked by the browser. */ }
  }
  let current
  let notice = ''
  let dirty = false
  try {
    current = storage ? readStorage(storage) : emptySave()
    if (!current) notice = 'This save version could not be read. The game opened with a fresh career.'
  } catch {
    notice = 'Saved progress could not be read. The game opened with a fresh career.'
  }
  current ??= emptySave()

  function replace(snapshot) {
    const updated = validateSave(snapshot)
    if (!updated) return false
    current = updated
    try {
      storage.setItem(SAVE_KEY, JSON.stringify(current))
      dirty = false
      notice = ''
    } catch {
      dirty = true
      notice = 'This browser could not save changes. Export a copy before closing the game.'
    }
    return true
  }
  return {
    get data() { return current },
    get notice() { return notice },
    change(update) {
      if (!dirty) {
        try {
          if (storage.getItem(SAVE_KEY) !== null) current = readStorage(storage) ?? current
        } catch { /* Keep the current in-memory state if storage is unreadable. */ }
      }
      const snapshot = structuredClone(current)
      const result = update(snapshot)
      if (result !== false) replace(snapshot)
      return result
    },
    import(raw) {
      try { return replace(JSON.parse(raw)) } catch { return false }
    },
    reset() {
      const fresh = emptySave()
      fresh.settings = current.settings
      fresh.arcade = current.arcade
      replace(fresh)
    },
  }
}

export const xpFor = level => 135 * (level - 1) + 5 * (level - 1) ** 2
export const getLevel = xp => Math.min(999, 1 + Math.floor((-135 + Math.sqrt(135 ** 2 + 20 * xp)) / 10))
export const rankFor = level => ranks.find(([minimum]) => level >= minimum)[1]
export const upgradeCost = (key, level) => UPGRADES[key].cost * (level + 1) ** 2

export function available(save, contract) {
  const level = getLevel(save.xp)
  return level >= contract.rank && (!contract.previous || Boolean(save.records[contract.previous]?.stars))
}

export function districtAvailable(save, district) {
  const first = CONTRACTS.find(contract => contract.district === district.id)
  return available(save, first)
}

export function droneStats(save, id = save.selected) {
  const base = DRONES[id]
  const config = { ...FLIGHT, ...base }
  const upgrade = save.upgrades[id] ?? {}
  const value = key => upgrade[key] ?? 0
  return {
    ...config, speed: config.speed + 18 * value('motor'), acceleration: config.acceleration + 65 * value('motor'),
    battery: config.battery + 19 * value('battery'), braking: config.braking + 0.85 * value('stabilizer'),
    windShield: config.windShield * (1 - 0.16 * value('stabilizer')), armor: config.armor * (1 - 0.12 * value('armor')),
    capacity: config.capacity + value('cargo'), payloadDrag: 1 - 0.12 * value('cargo'),
    boostDrain: config.boostDrain - 5 * value('boost'), boostRecharge: config.boostRecharge + 3 * value('boost'),
    color: PAINTS[save.paint].color ?? config.color,
  }
}

export function purchase(save, kind, key) {
  const rank = getLevel(save.xp)
  const levels = save.upgrades[save.selected] ?? {}
  if (kind === 'upgrade') {
    if (!owns(UPGRADES, key)) return false
    const level = levels[key] ?? 0
    if (level >= MAX_UPGRADE || rank < 1 + level * 3) return false
    const cost = upgradeCost(key, level)
    if (save.credits < cost) return false
    save.credits -= cost
    save.upgrades[save.selected] = { ...levels, [key]: level + 1 }
    return true
  }
  if (kind !== 'drone' && kind !== 'paint') return false
  const items = kind === 'drone' ? DRONES : PAINTS
  const collection = kind === 'drone' ? save.owned : save.paints
  if (!owns(items, key) || collection.includes(key) || rank < items[key].rank || save.credits < items[key].cost) return false
  save.credits -= items[key].cost
  collection.push(key)
  return true
}

function refreshAchievements(save) {
  const unlocked = []
  for (const [key, [, , eligible]] of Object.entries(ACHIEVEMENTS)) {
    if (!save.achievements.includes(key) && eligible(save)) {
      save.achievements.push(key)
      unlocked.push(ACHIEVEMENTS[key][0])
    }
  }
  return unlocked
}

export function recordRun(save, contract, result, id) {
  if (save.paid.includes(id)) return false
  save.paid.push(id)
  const previous = save.records[contract.id] ?? { stars: 0, best: 0, seconds: 0 }
  let credits = 0
  let xp = 0
  if (!contract.mode && result.success && result.stars > previous.stars) {
    const factor = result.rewardFactor
    const stars = Math.max(0, result.stars - Math.max(previous.stars, 1))
    credits = Math.round(((previous.stars ? 0 : contract.credits) + 45 * stars) * factor)
    xp = Math.round(((previous.stars ? 0 : contract.xp) + 28 * stars) * factor)
    save.credits += credits
    save.xp += xp
  }
  if (contract.mode !== 'training') {
    const seconds = Math.round(result.seconds * 1000)
    save.records[contract.id] = { stars: Math.max(previous.stars, result.stars), best: Math.max(previous.best, result.points),
      seconds: result.success ? Math.min(previous.seconds || seconds, seconds) : previous.seconds,
      clean: Boolean(previous.clean || (!contract.mode && result.success && !result.hits)),
      express: Boolean(previous.express || (!contract.mode && contract.type === 'Express delivery' && result.success && result.timeLeft >= 10)) }
  }
  save.stats.time += Math.round(result.seconds * 1000)
  save.stats.delivered += result.delivered
  save.stats.attempts += result.attempts
  save.stats.perfect += result.perfect
  save.stats.combo = Math.max(save.stats.combo, result.bestCombo)
  save.stats.distance += Math.round(result.distance)
  save.stats.hits += result.hits
  if (!contract.mode && result.success) save.stats.missions++
  save.stats.credits += credits
  return { credits, xp, achievements: refreshAchievements(save) }
}

export function recordArcade(save, report) {
  save.arcade.score = Math.max(save.arcade.score, report.score)
  if (report.won) save.arcade.seconds = Math.min(save.arcade.seconds || report.seconds, report.seconds)
  if (report.endless) save.stats.endless = Math.max(save.stats.endless, report.score)
  save.stats.time += report.activeTime
  save.stats.delivered += report.deliveries
  save.stats.attempts += report.attempts
  save.stats.perfect += report.perfect
  save.stats.hits += report.hits
  save.stats.combo = Math.max(save.stats.combo, report.combo)
  save.stats.distance += report.distance
  return refreshAchievements(save)
}
