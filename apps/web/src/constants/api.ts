/** How often to re-fetch active alerts from the API (ms). */
export const ALERTS_REFETCH_MS = 30_000;

/** How often to re-fetch current weather conditions (ms). */
export const CONDITIONS_REFETCH_MS = 60_000;

/** Stale-time for conditions — data is fresh for this long before a background refetch. */
export const CONDITIONS_STALE_MS = 30_000;

/** Browser geolocation request timeout (ms). */
export const GEOLOCATION_TIMEOUT_MS = 5_000;

/** Maximum number of cities to show in the landing-page live temps strip. */
export const LIVE_STATS_MAX_CITIES = 6;
