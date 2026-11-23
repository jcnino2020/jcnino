import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CONTRACTS, DISTRICTS } from '../game/contracts.js'
import { SAVE_KEY, available, districtAvailable, droneStats, emptySave, getLevel, purchase, recordArcade, recordRun, saveStore, validateSave, xpFor } from '../game/career.js'

const storageFrom = entries => {
  const items = new Map(entries)
  return { getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, value) }
}

const contract = CONTRACTS[0]
const result = {
  success: true, stars: 3, rewardFactor: 1, points: 600, seconds: 22, delivered: 2, attempts: 2,
  perfect: 1, bestCombo: 2, distance: 400, hits: 0,
}

test('one result pays once, replay cannot erase stars or farm rewards', () => {
  const save = emptySave()
  assert.equal(available(save, CONTRACTS[1]), false)
  const rewards = recordRun(save, contract, result, 'run-one-000001')
  assert.equal(rewards.credits, 230)
  assert.equal(rewards.xp, 146)
  assert.deepEqual(rewards.achievements, ['First Contact', 'Untouchable', 'Bullseye'])
  assert.equal(available(save, CONTRACTS[1]), true)
  assert.equal(recordRun(save, contract, result, 'run-one-000001'), false)
  assert.equal(recordRun(save, contract, { ...result, stars: 2 }, 'run-two-000002').credits, 0)
  assert.equal(save.records[contract.id].stars, 3)
  assert.equal(save.credits, 230)
  assert.equal(save.stats.delivered, 4)
})

test('career rank and mission completion gate districts', () => {
  const save = emptySave()
  const district = DISTRICTS[1]
  assert.equal(districtAvailable(save, district), false)
  save.xp = xpFor(4)
  assert.equal(getLevel(save.xp), 4)
  assert.equal(districtAvailable(save, district), false)
  save.records['downtown-8'] = { stars: 1 }
  assert.equal(districtAvailable(save, district), true)
})

test('all main contracts unlock in sequence at their minimum one-star payouts', () => {
  const save = emptySave()
  const mains = CONTRACTS.filter(route => !route.optional)
  for (const route of mains) {
    assert.equal(available(save, route), true, route.title)
    recordRun(save, route, { ...result, stars: 1, rewardFactor: 0.9 }, 'campaign-' + route.id)
  }
  assert.equal(save.stats.missions, 40)
})

test('garage purchases enforce costs, rank and max levels and change flight stats', () => {
  const save = emptySave()
  assert.equal(purchase(save, 'upgrade', 'motor'), false)
  assert.equal(save.credits, 0)
  save.credits = 5000
  assert.equal(purchase(save, 'drone', 'cargolift'), false)
  assert.equal(purchase(save, 'upgrade', 'motor'), true)
  assert.equal(save.credits, 4870)
  assert.equal(droneStats(save).speed, 278)
  assert.equal(droneStats(save).acceleration, 710)
  assert.equal(purchase(save, 'upgrade', 'motor'), false)
  save.xp = xpFor(9)
  assert.equal(purchase(save, 'drone', 'cargolift'), true)
  assert.equal(purchase(save, 'upgrade', 'motor'), true)
  assert.equal(purchase(save, 'upgrade', 'motor'), true)
  assert.equal(purchase(save, 'upgrade', 'motor'), false)
  save.selected = 'cargolift'
  assert.equal(droneStats(save).capacity, 5)
  assert.equal(droneStats(save).speed, 238)
})

test('save migrates classic records, survives serialization, and resets career with settings intact', () => {
  const storage = storageFrom([['skyward_best_score', '1100'], ['skyward_best_time', '34.25']])
  const store = saveStore(storage)
  assert.deepEqual(store.data.arcade, { score: 1100, seconds: 34250 })
  store.change(save => { save.started = true; save.settings.master = 45; return recordRun(save, contract, result, 'run-one-000001') })
  const reopened = saveStore(storage)
  assert.equal(reopened.data.credits, 230)
  assert.equal(reopened.data.records[contract.id].stars, 3)
  assert.equal(reopened.import(JSON.stringify({ ...reopened.data, version: 999 })), false)
  reopened.reset()
  assert.equal(reopened.data.started, false)
  assert.equal(reopened.data.credits, 0)
  assert.equal(reopened.data.settings.master, 45)
  assert.equal(reopened.data.arcade.score, 1100)
})

test('corrupt saves recover without invalid IDs, credits or input bindings', () => {
  const invalid = saveStore(storageFrom([[SAVE_KEY, '{{']]))
  assert.match(invalid.notice, /could not be read/)
  assert.equal(invalid.data.selected, 'swift')
  const clean = validateSave({ version: 1, xp: Infinity, credits: -42, owned: ['toString', 'falcon', 'falcon'],
    selected: 'ghost', upgrades: { swift: { motor: 15, boost: NaN } },
    settings: { master: Infinity, music: 300, customKeys: { left: 'KeyH', right: 'KeyH', up: 'ShiftLeft' } } })
  assert.deepEqual(clean.owned, ['swift', 'falcon'])
  assert.equal(clean.selected, 'swift')
  assert.equal(clean.xp, 0)
  assert.equal(clean.credits, 0)
  assert.equal(clean.upgrades.swift.motor, 3)
  assert.equal(clean.upgrades.swift.boost, 0)
  assert.equal(clean.settings.music, 100)
  assert.deepEqual(clean.settings.customKeys, { left: 'KeyH' })
})

test('Endless achievement uses recorded arcade play', () => {
  const save = emptySave()
  const achievements = recordArcade(save, { score: 3700, activeTime: 57000, distance: 5500, hits: 3,
    attempts: 18, deliveries: 17, perfect: 2, combo: 3, endless: true, won: false })
  assert.equal(save.stats.endless, 3700)
  assert.ok(achievements.includes('Endless Veteran'))
  assert.ok(achievements.includes('Triple Threat'))
})
