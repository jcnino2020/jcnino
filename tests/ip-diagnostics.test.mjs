import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractClientIp,
  extractVercelGeo,
  getServerTelemetry,
  handleIpSummary as summaryHandler,
} from '../lib/ip-diagnostics.js';

function createMockRes() {
  const headers = {};
  return {
    statusCode: 200,
    headers,
    body: null,
    setHeader(k, v) {
      headers[k.toLowerCase()] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

test('extractClientIp parses first x-forwarded-for IP and falls back to 127.0.0.1', () => {
  assert.equal(
    extractClientIp({ headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' } }),
    '203.0.113.10'
  );
  assert.equal(
    extractClientIp({ headers: { 'x-forwarded-for': '::ffff:198.51.100.42' } }),
    '198.51.100.42'
  );
  assert.equal(extractClientIp({ headers: {} }), '127.0.0.1');
});

test('extractVercelGeo decodes city and parses numeric coordinates', () => {
  const geo = extractVercelGeo({
    'x-vercel-ip-city': 'Quezon%20City',
    'x-vercel-ip-country-region': '00',
    'x-vercel-ip-country': 'PH',
    'x-vercel-ip-latitude': '14.6760',
    'x-vercel-ip-longitude': '121.0437',
    'x-vercel-ip-timezone': 'Asia/Manila',
  });
  assert.deepEqual(geo, {
    city: 'Quezon City',
    region: '00',
    country: 'PH',
    latitude: 14.676,
    longitude: 121.0437,
    timezone: 'Asia/Manila',
  });
});

test('getServerTelemetry returns local fallback cleanly for 127.0.0.1', async () => {
  const telemetry = await getServerTelemetry({ headers: {} });
  assert.equal(telemetry.ip, '127.0.0.1');
  assert.equal(telemetry.ipVersion, 'IPv4');
  assert.equal(telemetry.asn.source, 'local-fallback');
  assert.equal(telemetry.ptr.hostname, 'localhost');
});

test('ip-summary rejects non-POST methods and disallowed origins', async () => {
  const resGet = createMockRes();
  await summaryHandler({ method: 'GET', headers: {} }, resGet);
  assert.equal(resGet.statusCode, 405);

  const resOrigin = createMockRes();
  await summaryHandler(
    { method: 'POST', headers: { origin: 'https://evil.example.com' } },
    resOrigin
  );
  assert.equal(resOrigin.statusCode, 403);
});
