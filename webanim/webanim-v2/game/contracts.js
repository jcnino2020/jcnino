const pad = (name, x, y, width, window) => ({ name, x, y, width, window })
const pole = (x, y, height) => ({ type: 'pole', x, y, w: 12, h: height, damage: 22 })
const wire = (x, y, width) => ({ type: 'wire', x, y, w: width, h: 5, damage: 16 })
const bird = (x, y, range = 100) => ({ type: 'bird', x, y, w: 33, h: 16, damage: 23, travel: [range, 22, 1.25] })
const hook = (x, y, range = 82) => ({ type: 'hook', x, y, w: 24, h: 44, damage: 31, travel: [0, range, 1.55] })
const restricted = (x, y, w, h) => ({ type: 'restricted', x, y, w, h, damage: 29 })
const patrol = (x, y, range) => ({ type: 'drone', x, y, w: 47, h: 20, damage: 31, travel: [range, 17, 1.1] })
const windowed = (period, open) => ({ period, open })

export const DISTRICTS = [
  { id: 'downtown', name: 'Downtown Deliveries', description: 'Corner shops, neighborhood rooftops and the city’s first dispatch depot.', sky: '#445b77', horizon: '#f0b38a', far: '#807890', near: '#3c526b', accent: '#ffd087', ground: '#1c2c3c', shape: [76, 124, 210], rank: 1 },
  { id: 'business', name: 'Business District', description: 'Climb past tower crews and time drops around moving crane hooks.', sky: '#9ec1d5', horizon: '#e7edf2', far: '#6689a5', near: '#3e5b75', accent: '#efb865', ground: '#223243', shape: [92, 230, 380], rank: 4 },
  { id: 'harbor', name: 'Harbor & Industrial Zone', description: 'Heavy freight, gusts from the bay and low dockside approaches.', sky: '#8cbeca', horizon: '#d8e5d7', far: '#598d9b', near: '#396477', accent: '#ffad67', ground: '#203943', shape: [150, 58, 146], rank: 7 },
  { id: 'neon', name: 'Neon Heights', description: 'Night approaches under rain, security patrols and timed receiving bays.', sky: '#152841', horizon: '#385265', far: '#344563', near: '#222d48', accent: '#72f1da', ground: '#111a2c', shape: [74, 156, 290], rank: 10 },
  { id: 'central', name: 'Skyward Central', description: 'The city’s highest routes combine timed deliveries, heavy loads and narrow corridors.', sky: '#243449', horizon: '#cc8878', far: '#67677d', near: '#414c64', accent: '#ffcb83', ground: '#20283a', shape: [110, 130, 344], rank: 13 },
]

const conditions = {
  perfect: count => ({ key: 'perfect', value: count, label: count === 1 ? 'Make one perfect landing' : `Make ${count} perfect landings` }),
  clean: { key: 'hits', value: 0, label: 'Finish without taking a hit' },
  efficient: { key: 'battery', value: 0.55, label: 'Keep at least 55% battery' },
  flawless: { key: 'misses', value: 0, label: 'Finish without a missed or damaged package' },
  fast: seconds => ({ key: 'time', value: seconds, label: `Finish within ${seconds} seconds` }),
}

const downtown = [
  ['First Drop', 'Standard delivery', 'You are already above the bakery. Drop once the landing guide is centered, then fly to the café.', 85, 'standard', 'clear',
    [pad('Sunrise Bakery', 220, 442, 128), pad('Corner Café', 548, 389, 114)], [], conditions.clean, [220, 255], true],
  ['Rooftop Mail', 'Standard delivery', 'Climb to the clinic roof before dropping to the post office’s lower landing pad.', 65, 'standard', 'clear',
    [pad('Oak Street Clinic', 368, 280, 112), pad('Post Office', 795, 457, 105)], [pole(590, 368, 152)], conditions.clean],
  ['Ten Before Ten', 'Express delivery', 'The tailor is closing. Deliver to the tailor and pharmacy within the dispatch window.', 34, 'express', 'clear',
    [pad('Tailor Shop', 455, 375, 92), pad('North Pharmacy', 1260, 438, 88)], [pole(668, 340, 180), wire(668, 341, 210)], conditions.fast(15)],
  ['Handle with Care', 'Fragile cargo', 'Deliver glassware to two repair shops. A landing on the outer band damages glass.', 60, 'fragile', 'clear',
    [pad('Watch Repair', 475, 428, 110), pad('Glass Studio', 1005, 319, 108)], [bird(730, 259)], conditions.flawless],
  ['Market Loop', 'Multi-drop route', 'Start high at the flower shop, cross the market, then double back to the library.', 70, 'standard', 'clear',
    [pad('Flower Shop', 472, 292, 103), pad('Public Market', 1480, 446, 100), pad('Library', 807, 377, 90)], [pole(648, 340, 180), bird(1110, 225, 148)], conditions.fast(32)],
  ['Clinic Dispatch', 'Emergency supplies', 'Deliver medical supplies in priority order. A charging depot sits near the far end of the route.', 45, 'relief', 'foggy',
    [pad('Field Clinic', 661, 372, 98), pad('First Aid Station', 1760, 320, 94), pad('Evening Practice', 1320, 458, 92)], [wire(840, 273, 222), pole(1062, 271, 249), bird(1490, 230)], conditions.clean],
  ['Depot Transfer', 'Heavy delivery', 'The freight pulls on your momentum. Brake before releasing above the receiving decks.', 63, 'heavy', 'windy',
    [pad('Brick Warehouse', 745, 381, 118), pad('West Receiving', 1500, 452, 109)], [pole(422, 355, 165), bird(1057, 228, 134)], conditions.efficient],
  ['Closing Route', 'Night delivery', 'The market and tower only accept deliveries while their landing lights are on.', 67, 'express', 'night',
    [pad('Night Market', 570, 403, 94, windowed(8, 5)), pad('Clock Tower', 1175, 212, 92), pad('Corner Garage', 1790, 431, 98, windowed(10, 6))],
    [pole(825, 327, 193), wire(825, 329, 230), bird(1510, 222, 120)], conditions.flawless],
  ['Bullseye Circuit', 'Precision challenge', 'Land dead center on two narrow pads. Prediction is disabled for this contract.', 52, 'standard', 'clear',
    [pad('Pocket Park', 511, 462, 65), pad('Roof Garden', 1150, 293, 61)], [pole(760, 350, 170)], conditions.perfect(2)],
  ['One Last Charge', 'Battery endurance', 'Start on reserve power. Recharge at the yellow depot along the way.', 78, 'relief', 'windy',
    [pad('Community Hall', 562, 410, 112), pad('Sorting Center', 1850, 324, 87), pad('Far Depot', 2390, 384, 92)], [pole(815, 346, 174), bird(1530, 241)], conditions.efficient],
]

const rest = {
  business: {
    names: ['Tower Reception', 'Lunch Rush', 'Glass Corridor', 'Concrete Lift', 'The Switchback', 'Roof Medic', 'After Hours', 'Crane Crossing', 'Window Washer', 'Battery Audit'],
    locations: ['Atlas Reception', 'Exchange Terrace', 'Meridian Clinic', 'West Crane', 'Pinnacle Deck', 'Roof Canteen'],
    width: [101, 89, 84], heights: [245, 342, 195, 288], obstacles: [hook, wire, pole], weather: ['clear', 'foggy', 'windy', 'night'],
  },
  harbor: {
    names: ['Manifest Pickup', 'Tide Window', 'Cold Chain', 'Container Lift', 'The Long Pier', 'Breakwater Aid', 'Last Ferry', 'Storm Berth', 'Harbor Markers', 'Coast Guard Reserve'],
    locations: ['Ferry Office', 'Cold Store', 'Berth Three', 'Container Yard', 'Signal House', 'Coast Guard'],
    width: [114, 101, 95], heights: [434, 394, 463, 329], obstacles: [hook, pole, bird], weather: ['windy', 'rainy', 'foggy', 'night'],
  },
  neon: {
    names: ['Sign-on', 'Subway Transfer', 'Optics Run', 'Late Freight', 'Alley Switchback', 'Night Aid', 'Closing Lights', 'Security Sweep', 'Darkroom Accuracy', 'Brownout'],
    locations: ['Metro Entrance', 'Optics Shop', 'Archive Roof', 'Rain Garden', 'Radio Booth', 'Lantern Arcade'],
    width: [91, 82, 76], heights: [300, 421, 241, 358], obstacles: [patrol, restricted, wire], weather: ['night', 'rainy', 'foggy', 'night'],
  },
  central: {
    names: ['City Hall', 'Press Deadline', 'Museum Glass', 'Lift Permit', 'Ring Road', 'Emergency Corridor', 'Beacon Sweep', 'Final Courier', 'Central Bullseye', 'Above the Skyline'],
    locations: ['City Hall', 'Broadcast Roof', 'Museum Terrace', 'Transit Command', 'Weather Office', 'Crown Observatory'],
    width: [88, 79, 74], heights: [244, 380, 183, 305], obstacles: [restricted, patrol, hook], weather: ['windy', 'foggy', 'rainy', 'night'],
  },
}

const patterns = [
  { type: 'Standard delivery', cargo: 'standard', route: [425, 980], time: 69, weather: 0, summary: 'Climb for the first stop, then descend to the second receiving pad.' },
  { type: 'Express delivery', cargo: 'express', route: [650, 1610], time: 35, weather: 1, summary: 'Make the first drop during its open window, then boost to the far end of the route.', windows: [0] },
  { type: 'Fragile cargo', cargo: 'fragile', route: [530, 1180, 1510], time: 63, weather: 0, summary: 'Deliver fragile cargo to three customers. Outer-band landings damage their parcels.' },
  { type: 'Heavy delivery', cargo: 'heavy', route: [870, 1710], time: 61, weather: 0, summary: 'Allow room to brake with heavy freight. Find the safe gap between hazards.' },
  { type: 'Multi-drop route', cargo: 'standard', route: [750, 1830, 1220, 2260], time: 76, weather: 2, summary: 'Fly the stops in order, doubling back between the second and third drops.' },
  { type: 'Emergency supplies', cargo: 'relief', route: [610, 1410, 2000], time: 49, weather: 1, summary: 'Get relief parcels across the corridor before the dispatch timer expires.' },
  { type: 'Night delivery', cargo: 'express', route: [620, 1340, 1830], time: 71, weather: 3, summary: 'Wait for receiving lights at the first and last stops. Patrols keep moving between drops.', windows: [0, 2] },
  { type: 'Advanced combination', cargo: 'heavy', route: [580, 1370, 2240, 2880], time: 87, weather: 2, summary: 'Fly heavy freight over the entire district, read the moving hazards and time the last drop.', windows: [3] },
  { type: 'Precision challenge', cargo: 'standard', route: [575, 1310, 1880], time: 65, weather: 0, summary: 'Thread three compact targets without the predictive guide.' },
  { type: 'Battery endurance', cargo: 'relief', route: [580, 1820, 2710], time: 87, weather: 0, summary: 'Start on reserve power. Recharge in the marked bay and finish the long route.' },
]

function expanded(district, districtIndex) {
  const data = rest[district.id]
  return patterns.map((pattern, index) => {
    const targets = pattern.route.map((position, stop) => {
      const x = position + districtIndex * 47 * (stop % 2 ? -1 : 1)
      const y = data.heights[(stop + index) % data.heights.length]
      const width = data.width[stop % data.width.length] - (index === 8 ? 22 : 0)
      const timing = pattern.windows?.includes(stop) ? windowed(9 + districtIndex, 6) : undefined
      return pad(data.locations[(stop + index) % data.locations.length], x, y, width, timing)
    })
    const byPosition = [...targets].sort((a, b) => a.x - b.x)
    const hazards = byPosition.slice(0, -1).map((target, i) => {
      const gap = byPosition[i + 1].x - target.x
      const x = target.x + gap * 0.48
      const obstacle = data.obstacles[(index + i) % 3]
      const pass = index % 2 === 0 ? 320 : 165
      const room = Math.min(92, gap * 0.21)
      if (obstacle === wire) return wire(x - room, pass, room * 1.65)
      if (obstacle === restricted) return restricted(x - 40, pass, 104, 72)
      if (obstacle === pole) return pole(x, pass + 35, 485 - pass)
      return obstacle(x, pass, room)
    })
    const final = [conditions.clean, conditions.fast(22), conditions.flawless, conditions.efficient,
      conditions.fast(40), conditions.clean, conditions.flawless, conditions.clean, conditions.perfect(3), conditions.efficient][index]
    return [data.names[index], pattern.type, pattern.summary, pattern.time, pattern.cargo, data.weather[pattern.weather],
      targets, hazards, final]
  })
}

export const CONTRACTS = DISTRICTS.flatMap((district, districtIndex) => {
  const catalog = districtIndex === 0 ? downtown : expanded(district, districtIndex)
  return catalog.map(([title, type, description, time, cargo, weather, targets, hazards, bonus, spawn, tutorial], index) => {
    const optional = index >= 8
    const endurance = index === 9
    return {
      id: `${district.id}-${index + 1}`, district: district.id, title, description, type, time, cargo, weather,
      grade: index + 1, rank: district.rank, optional, tutorial,
      previous: index === 0 ? (districtIndex ? `${DISTRICTS[districtIndex - 1].id}-8` : null)
        : `${district.id}-${index === 8 ? 4 : index === 9 ? 6 : index}`,
      spawn: spawn ?? [180, 244],
      targets, hazards, width: Math.max(1280, ...targets.map(target => target.x + 360)), attemptLimit: index === 8 ? targets.length + 2 : 0,
      reserve: endurance ? 0.12 : 1, depot: endurance ? { x: 1115, y: 322, width: 128 } : index === 5 ? { x: 1220, y: 392, width: 102 } : null,
      prediction: index !== 8, conditions: [conditions.perfect(index === 8 ? targets.length : targets.length > 3 ? 2 : 1), index === 8 ? conditions.flawless : bonus],
      credits: 140 + districtIndex * 55 + index * 16, xp: 90 + districtIndex * 31 + index * 12,
    }
  })
})

export const MODES = {
  trial: {
    id: 'trial', district: 'downtown', title: 'Time Trial', description: 'Make as many deliveries as you can before the 60-second timer ends.',
    type: 'Time trial', time: 60, mode: 'trial', weather: 'clear', cargo: 'express', spawn: [230, 250],
    targets: [pad('First Stop', 230, 423, 112), pad('Library', 535, 326, 94), pad('Night Market', 930, 438, 104), pad('Café', 1350, 375, 110)],
    hazards: [bird(790, 233)], width: 1650, prediction: true, conditions: [],
  },
  precision: {
    id: 'precision', district: 'downtown', title: 'Precision Challenge', description: 'Land on three narrow pads in up to five attempts without the prediction guide.',
    type: 'Precision challenge', time: 65, mode: 'precision', weather: 'clear', cargo: 'standard', spawn: [230, 250],
    targets: [pad('First Marker', 230, 384, 60), pad('Second Marker', 645, 310, 56), pad('Final Marker', 1020, 431, 53)],
    hazards: [pole(449, 333, 187)], width: 1350, attemptLimit: 5, prediction: false, conditions: [conditions.perfect(2), conditions.flawless],
  },
  training: {
    id: 'training', district: 'downtown', title: 'Free Flight', description: 'Fly without a timer or battery drain. Practice drops in sequence and finish whenever you’re ready.',
    type: 'Training', time: null, mode: 'training', weather: 'clear', cargo: 'standard', spawn: [230, 243],
    targets: [pad('Practice Pad', 230, 426, 148), pad('Low Roof', 600, 357, 116), pad('High Roof', 1020, 230, 106)],
    hazards: [], width: 1360, prediction: true, conditions: [],
  },
}
