export const ENGINE_VERSION = '0.1.0-e1'
export const SCHEMA_VERSION = 1

/** Default utilization ceiling (Healthy below this). */
export const UTIL_CEILING = 0.7
export const RHO_WARNING = 0.7
export const RHO_CRITICAL = 0.85

/** Path-percentile sampler draws. Labeled Analytic; independence assumed. */
export const PATH_DRAWS = 20_000

/** Design default. UI may still refuse earlier (Decision 8) until E1.11 records a benchmark. */
export const DEFAULT_EVENT_BUDGET = 50_000_000

export const DEFAULT_REPLICATIONS = 5
export const WARMUP_FRACTION = 0.2
export const BATCH_COUNT = 20
/** t critical, 95% two-sided, 19 df (20 batches). */
export const T_95_19 = 2.093
