// The demo scenario: every number on the Home screen that is NOT computed from data lives here, so it is
// obvious (and greppable) what is simulated. The UI must show DEMO_SCENARIO_LABEL next to any of these.
export const DEMO_SCENARIO_LABEL = 'Demo scenario (simulated)';

export const DEMO_SCENARIO = {
  river: { name: 'Klang River Basin', levelM: 1.2, risePerQuarterHourM: 0.3 },
  forecast: { horizonMin: 60, p50M: 1.65, impactInMin: 62 },
  rainfallMmH: 95,
  /** Confidence reported by the (simulated) forecast model. NOT a validated accuracy. */
  modelConfidencePct: 87,
  sensors: { active: 14, online: 12 },
  station: { id: 'DEMO-NODE-01', name: 'Kampung Baru station (simulated)', batteryPct: 94, signalDbm: -68 },
} as const;
