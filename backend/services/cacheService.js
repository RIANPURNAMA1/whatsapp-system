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
  return null;
}

export async function setToCache(key, data, ttlSeconds = 60) {
  return false;
}

export async function getOrSet(key, fetchFn, ttlSeconds = 60) {
  return fetchFn();
}

export async function invalidateCache(key) {
  return false;
}

export async function invalidatePattern(pattern) {
  return false;
}

export async function invalidateDashboard() {
  return false;
}

export async function invalidateLeadAnalysis() {
  return false;
}

export async function invalidateSocialMedia() {
  return false;
}

export async function invalidateSessions() {
  return false;
}

export async function invalidateLabels() {
  return false;
}

export async function invalidateAll() {
  return false;
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
