(function (root) {
  'use strict';
  const MIN32 = -(1n << 31n);
  const MAX32 = (1n << 31n) - 1n;
  const MIN64 = -(1n << 63n);
  const MAX64 = (1n << 63n) - 1n;
  const BOUNDARY = MAX32 + 1n;
  function parse(value) {
    const text = String(value).trim();
    if (!/^-?\d{1,19}$/.test(text)) throw new Error('Enter a whole number of seconds, without commas.');
    const number = BigInt(text);
    if (number < MIN64 || number > MAX64) throw new Error('Enter a value within the signed 64-bit range.');
    return number;
  }
  function utc(seconds) {
    if (seconds < -8640000000000n || seconds > 8640000000000n) return null;
    return new Date(Number(seconds) * 1000).toISOString().replace('T', ' ').replace('.000Z', ' UTC');
  }
  function inspect(value) {
    const raw = parse(value);
    const signed = BigInt.asIntN(32, raw);
    const unsigned = BigInt.asUintN(32, raw);
    return { raw, signed, unsigned, bits: unsigned.toString(2).padStart(32, '0'),
      hex: '0x' + unsigned.toString(16).padStart(8, '0').toUpperCase(),
      overflow: raw < MIN32 || raw > MAX32, intended: utc(raw), interpreted: utc(signed) };
  }
  function flip(value, index) {
    if (!Number.isInteger(index) || index < 0 || index > 31) throw new Error('Invalid bit index.');
    return BigInt.asIntN(32, parse(value) ^ (1n << BigInt(index)));
  }
  function countdown(now) { return Math.max(0, Math.ceil((Number(BOUNDARY) * 1000 - now) / 1000)); }
  const api = Object.freeze({ MIN32, MAX32, MIN64, MAX64, BOUNDARY, parse, utc, inspect, flip, countdown });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TimeLab = api;
}(typeof globalThis !== 'undefined' ? globalThis : this));
