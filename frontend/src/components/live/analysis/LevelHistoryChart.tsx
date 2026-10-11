import { clockTime } from '../../../lib/vision/format';
import { LEVEL_META } from '../../../lib/vision/levels';
import { thresholdsFromCalibration } from '../../../lib/vision/thresholds';
import type { Calibration, Reading } from '../../../types/vision';

interface Props {
  history: Reading[];
  calibration: Calibration;
}

const W = 320;
const H = 120;
const MAX = 1.2;

export function LevelHistoryChart({ history, calibration }: Props) {
  const t = thresholdsFromCalibration(calibration);
  const y = (v: number) => H - 6 - (Math.min(v, MAX) / MAX) * (H - 14);
  const data = history.slice(-30);
  const x = (i: number) => (data.length < 2 ? W : (i / (data.length - 1)) * (W - 8) + 4);
  const last = data[data.length - 1];
  const color = last ? LEVEL_META[last.level].hex : '#0EA5E9';
  const points = data.map((r, i) => `${x(i).toFixed(1)},${y(r.water_ratio).toFixed(1)}`).join(' ');

  return (
    <figure>
      <figcaption className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-900">Level history</span>
        <span className="text-xs text-slate-600">{data.length ? `${data.length} readings` : 'Collecting…'}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full" role="img" aria-label="Water level over recent readings against the normal, warning and danger lines">
        {([['danger', t.danger, '#DC2626'], ['warning', t.warning, '#D97706'], ['normal', t.normal, '#059669']] as const).map(([name, v, c]) => (
          <g key={name}>
            <line x1={0} x2={W} y1={y(v)} y2={y(v)} stroke={c} strokeWidth={1} strokeDasharray="4 4" opacity={0.7} />
            <text x={W - 2} y={y(v) - 3} textAnchor="end" fontSize={10} fill={c}>
              {name}
            </text>
          </g>
        ))}
        {data.length > 1 && <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        {last && <circle cx={x(data.length - 1)} cy={y(last.water_ratio)} r={4} fill={color} />}
      </svg>
      {last && <p className="mt-1 text-xs text-slate-600">Latest {clockTime(last.timestamp)} · trend {last.trend}</p>}
    </figure>
  );
}
