// The one doorway to code shared with the web app (frontend/src). Only UI-free modules come through here: types, the
// flood level rules, data mappers, the verified-report rules and distance helpers. If a shared module ever gains a
// DOM, Leaflet or lucide-react import, Metro and tsc fail here rather than at runtime.
export type { AlertEvent, Camera, Level, Reading } from '@web/types/vision';
export type { CitizenReport, Shelter } from '@web/types';
export { mapReport, mapShelter } from '@web/lib/mappers';
export { areaLabel, buildVerifiedAreas, verifiedZones } from '@web/lib/verifiedReports';
export type { VerifiedArea } from '@web/lib/verifiedReports';
export { deriveHazards } from '@web/lib/vision/hazards';
export { allSampleCameras, freshness, highestRisk, isSampleCamera, newestReadingAt, overallLevel } from '@web/lib/home';
export { isAlertLevel, LEVEL_PALETTE, levelRank, LEVELS } from '@web/lib/vision/levelRules';
export { agoText, fmtDistance, nearestOpenCentre, riskAt } from '@web/lib/family';
export type { Risk } from '@web/lib/family';
export { FLOOD_PRONE } from '@web/data/klDemo';
export { reportStatusInfo } from '@web/lib/reportStatus';
export type { Zone } from '@web/lib/routing';
