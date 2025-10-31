import { createClient } from 'redis';

let client = null;
let enabled = false;
let loggedOnce = false;

export async function initRedis() {
  if (!process.env.REDIS_URL) {
    if (!loggedOnce) { console.warn('Redis disabled: REDIS_URL not set'); loggedOnce = true; }
    return;
  }
  try {
    client = createClient({ url: process.env.REDIS_URL, socket: { reconnectStrategy: () => false } });
    client.on('error', (err) => {
      if (!loggedOnce) { console.warn('Redis warning:', err?.code || err?.message || err); loggedOnce = true; }
    });
    await client.connect();
    enabled = true;
    console.log('Redis connected');
  } catch (err) {
    enabled = false;
    if (!loggedOnce) { console.warn('Redis disabled: connection failed'); loggedOnce = true; }
  }
}

export async function cacheGet(key) {
  if (!enabled || !client) return null;
  try { return await client.get(key); } catch { return null; }
}

export async function cacheSet(key, value, ttlSeconds = 60) {
  if (!enabled || !client) return;
  try { await client.setEx(key, ttlSeconds, value); } catch {}
}

export default { initRedis, cacheGet, cacheSet };
