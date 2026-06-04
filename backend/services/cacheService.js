const store = new Map();

const DEFAULT_TTL = {
  DASHBOARD: 30,
  LEAD_ANALYSIS: 60,
  SOCIAL_MEDIA: 60,
  SESSIONS: 30,
  LABELS: 60,
  LABEL_DETAIL: 120,
};

export { DEFAULT_TTL };

export function cacheKey(...parts) {
  return parts.filter(Boolean).join(":").toLowerCase();
}

export async function getFromCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export async function setToCache(key, data, ttlSeconds = 60) {
  store.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  });
  return true;
}

export async function getOrSet(key, fetchFn, ttlSeconds = 60) {
  const cached = await getFromCache(key);
  if (cached !== null) return cached;
  const data = await fetchFn();
  await setToCache(key, data, ttlSeconds);
  return data;
}

export async function invalidateCache(key) {
  store.delete(key);
  return true;
}

export async function invalidatePattern(pattern) {
  const lower = pattern.toLowerCase();
  for (const key of store.keys()) {
    if (key.includes(lower)) store.delete(key);
  }
  return true;
}

export async function invalidateDashboard() {
  return invalidatePattern("dashboard");
}

export async function invalidateLeadAnalysis() {
  return invalidatePattern("lead");
}

export async function invalidateSocialMedia() {
  return invalidatePattern("social");
}

export async function invalidateSessions() {
  return invalidatePattern("sessions");
}

export async function invalidateLabels() {
  return invalidatePattern("labels");
}

export async function invalidateAll() {
  store.clear();
  return true;
}

export default {
  getFromCache,
  setToCache,
  getOrSet,
  invalidateCache,
  invalidatePattern,
  invalidateDashboard,
  invalidateLeadAnalysis,
  invalidateSocialMedia,
  invalidateSessions,
  invalidateLabels,
  invalidateAll,
  cacheKey,
  DEFAULT_TTL,
};
