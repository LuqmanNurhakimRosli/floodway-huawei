// PENYU concept robot: parts, modes and targets. CONCEPT DESIGN, NOT BUILT. Every number here is a design target or an
// engineering estimate, labelled as such where it is shown. Nothing on this page is a measured result.

export type RobotMode = 'patrol' | 'wade' | 'float' | 'dock';
export type PartId = 'shell' | 'hull' | 'whegs' | 'head' | 'probe' | 'rake' | 'antenna' | 'sonar' | 'dock';

export interface RobotPart {
  id: PartId;
  name: string;
  short: string;
  detail: string;
  green?: string; // the sustainability angle, when the part has one
}

export const PARTS: RobotPart[] = [
  {
    id: 'shell', name: 'Solar shell', short: 'Charges between storms',
    detail: 'The top of the shell is a curved solar skin of about 0.25 m². Parked in the sun it tops up the battery between storms. Design target: 30 to 40 W peak, enough for patrol duty on dry days.',
    green: 'No grid connection needed for daily patrols.',
  },
  {
    id: 'hull', name: 'Recycled-plastic hull', short: 'Made from river rubbish',
    detail: 'The hull is moulded HDPE recovered from river trash booms, with a closed-cell foam ring inside the orange bumper so the robot floats if the water is deeper than its wheels.',
    green: 'The plastic it is made from is the plastic that blocks drains.',
  },
  {
    id: 'whegs', name: 'Wheel-legs', short: 'Climbs kerbs, paddles in water',
    detail: 'Three-spoke wheel-legs ("whegs") step over a 15 cm kerb and debris on dry roads, and their paddle tips push it along when it floats. Sealed hub motors.',
  },
  {
    id: 'head', name: 'Vision head', short: 'Reads the waterline',
    detail: 'Stereo camera with infrared light reads the waterline on walls and gauges, the same job the FloodWay camera analyser does from a fixed CCTV view. The infrared light is for night, where the current analyser is weakest.',
  },
  {
    id: 'probe', name: 'Depth probe', short: 'Measures depth directly',
    detail: 'A striped mast lowers to the road surface and measures the water depth directly. It reports through the same ingest API as the fixed depth node fw-node-03, so the barrier logic needs no change.',
  },
  {
    id: 'rake', name: 'Debris rake', short: 'Clears drain grates',
    detail: 'Before a storm it sweeps leaves and plastic off drain grates at underpass entries. A clogged grate stops water leaving the road, even when the drain behind it is empty.',
    green: 'Collected plastic goes back to the recycler that makes the hulls.',
  },
  {
    id: 'antenna', name: 'LoRa relay mast', short: 'Keeps alerts moving',
    detail: 'A long-range, low-power radio mast with an amber beacon. Cell broadcast stops working when local towers lose power; PENYU units form a relay chain that passes alerts to the nearest working gateway.',
    green: 'Low-power radio: milliwatts, not a new tower.',
  },
  {
    id: 'sonar', name: 'Down-looking sonar', short: 'Depth when floating',
    detail: 'When the probe cannot reach the road because the robot is floating, a sonar under the hull measures the depth below it.',
  },
  {
    id: 'dock', name: 'Lamp-post dock', short: 'Charges on existing poles',
    detail: 'Each unit lives on a dock clamped to an existing street lamp post above flood height, with a solar panel on top. No new civil works: the city already has the poles.',
    green: 'Reuses street furniture the city already maintains.',
  },
];

export const MODES: { id: RobotMode; label: string; when: string; does: string }[] = [
  { id: 'patrol', label: 'Patrol', when: 'Before the storm', does: 'Drives the underpass approaches, rakes debris off drain grates and reports blocked ones to the control room.' },
  { id: 'wade', label: 'Wade', when: 'Water rising', does: 'Parks at the underpass entry, lowers the depth probe and confirms the depth node. Two independent readings before the barrier closes.' },
  { id: 'float', label: 'Float', when: 'Deep water', does: 'Floats on its foam ring, keeps measuring with the sonar and relays alerts over LoRa if the cell network is down.' },
  { id: 'dock', label: 'Dock', when: 'After the flood', does: 'Checks the underpass is clear before the barrier reopens, then climbs back to its lamp-post dock to recharge.' },
];

/** Design targets, not measurements. Shown in a table with that label. */
export const TARGETS: { label: string; value: string }[] = [
  { label: 'Size', value: '1.0 × 0.7 × 0.45 m' },
  { label: 'Mass', value: 'about 25 kg' },
  { label: 'Wading depth', value: 'up to 0.35 m on wheels, floats above' },
  { label: 'Battery', value: '1 kWh LiFePO4, swappable' },
  { label: 'Patrol time', value: '6 to 8 hours per charge' },
  { label: 'Solar', value: '30 to 40 W peak on the shell, plus the dock panel' },
  { label: 'Radio', value: 'LoRa relay, plus 4G when towers are up' },
  { label: 'Speed', value: '1.5 m/s on road, 0.3 m/s afloat' },
];
