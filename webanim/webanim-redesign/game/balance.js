export const FLIGHT = {
  speed: 260, acceleration: 645, steering: 4.1, braking: 5.8, boostMultiplier: 1.6,
  boostDrain: 50, boostRecharge: 20, boostRearm: 18, health: 100, battery: 100,
  batteryIdle: 0.47, batteryMoving: 0.29, batteryBoost: 1.9, armor: 1, capacity: 3, windShield: 1,
}
export const WORLD = { height: 560, ground: 520, radius: 19 }
export const DROP = { gravity: 680, inheritance: 0.65, gap: 26, size: 14, cooldown: 0.48 }
export const POINTS = { perfect: 150, good: 100, acceptable: 60, missed: 0, damaged: 0 }
export const DIFFICULTIES = {
  casual: { name: 'Casual', damage: 0.67, target: 1.24, time: 1.28, bonus: 0.9, braking: 1.28 },
  standard: { name: 'Standard', damage: 1, target: 1, time: 1, bonus: 1, braking: 1 },
  expert: { name: 'Expert', damage: 1.42, target: 0.83, time: 0.88, bonus: 1.18, braking: 0.88 },
}
export const WEATHER = {
  clear: { name: 'Clear', wind: 0, gust: 0 },
  windy: { name: 'Coastal winds', wind: 89, gust: 35 },
  rainy: { name: 'Rain', wind: -43, gust: 32 },
  foggy: { name: 'Fog', wind: 9, gust: 5 },
  night: { name: 'Night', wind: -13, gust: 10 },
}
export const CARGO = {
  standard: { name: 'Parcel', weight: 1, gravity: 1, color: '#e8af71' },
  express: { name: 'Priority parcel', weight: 1, gravity: 0.92, color: '#fff2b4' },
  fragile: { name: 'Fragile glass', weight: 1.5, gravity: 0.85, color: '#a1ddd7', fragile: true },
  heavy: { name: 'Heavy freight', weight: 3, gravity: 1.21, color: '#ef9871' },
  relief: { name: 'Medical supplies', weight: 2, gravity: 1.02, color: '#f5e2dc' },
}
