/** Normalize photos/videos from array fields or legacy single URL fields. */
export function normalizeMediaList(value, legacySingle) {
  if (Array.isArray(value)) {
    return value
      .map((u) => (typeof u === "string" ? u.trim() : ""))
      .filter(Boolean);
  }
  if (typeof legacySingle === "string" && legacySingle.trim()) {
    return [legacySingle.trim()];
  }
  return [];
}

export function sanitizeMediaUrls(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((u) => String(u).trim()).filter(Boolean);
}

export function getTripPhotos(trip) {
  return normalizeMediaList(trip?.photos, trip?.glimpsesPhotos);
}

export function getTripVideos(trip) {
  return normalizeMediaList(trip?.videos, trip?.glimpsesVideos);
}
