import { Camera, Gauge, Image as ImageIcon, Scale, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { compareAi, compareSensor, formatRange, summarise, type Agreement, type DepthRange, type NearbySensor } from '../../lib/depthFromPhoto';
import type { AiVerificationResult } from '../../types';
import { StatusChip } from '../live/shared/StatusChip';
import { num } from '../../styles/tokens';

const BADGE: Record<Agreement, { label: string; cls: string }> = {
  agrees: { label: 'Consistent', cls: 'bg-emerald-100 text-emerald-800' },
  close: { label: 'Close', cls: 'bg-sky-100 text-sky-800' },
  differs: { label: 'Differs', cls: 'bg-amber-100 text-amber-900' },
  unavailable: { label: 'Not available', cls: 'bg-slate-100 text-slate-700' },
};

function Row({ icon: Icon, title, detail, agreement }: { icon: LucideIcon; title: string; detail: React.ReactNode; agreement?: Agreement }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm/5 font-semibold text-slate-900">{title}</p>
        <div className="text-xs/4 text-slate-600">{detail}</div>
      </div>
      {agreement && <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${BADGE[agreement].cls}`}>{BADGE[agreement].label}</span>}
    </li>
  );
}

const km = (d: number) => (d < 0.1 ? 'under 100 m' : d < 1 ? `${Math.round(d * 100) * 10} m` : `${d.toFixed(1)} km`);

interface Props {
  range: DepthRange | null;
  method: string | null;
  ai: AiVerificationResult | null;
  camera: NearbySensor | null;
  node: NearbySensor | null;
  positionLabel: string;
}

/** Your measurement next to the nearest camera, the nearest depth node and the AI opinion. Evidence, not a verdict. */
export function EvidenceCheck({ range, method, ai, camera, node, positionLabel }: Props) {
  if (!range) {
    return <p className="rounded-xl bg-slate-50 p-3 text-sm/5 text-slate-600">Measure the depth above, then this compares it with the sensors near you and the AI check.</p>;
  }
  const camAgree = compareSensor(range, camera);
  const nodeAgree = compareSensor(range, node);
  const aiAgree = compareAi(range, ai?.ran ? ai.estimatedDepthCm : null);
  const summary = summarise([camAgree, nodeAgree, aiAgree]);

  return (
    <div>
      <ul className="divide-y divide-slate-100">
        <Row icon={ImageIcon} title={`Your photo: ${formatRange(range)}`} detail={method ?? ''} />
        <Row
          icon={Camera}
          title={camera ? `Nearest camera: ${camera.name}` : 'Nearest camera'}
          agreement={camAgree}
          detail={camera ? (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span className={num}>{km(camera.distanceKm)}</span> from {positionLabel} · <StatusChip level={camera.level} />
              {camera.distanceKm > 1.5 && <span>Too far to compare.</span>}
            </span>
          ) : 'No camera online.'}
        />
        <Row
          icon={Gauge}
          title={node ? `Nearest depth node: ${node.name}` : 'Nearest depth node'}
          agreement={nodeAgree}
          detail={node ? (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span className={num}>{km(node.distanceKm)}</span> · {node.kind === 'street-node' && node.depthM !== undefined ? <span className={num}>{Math.round(node.depthM * 100)} cm deep</span> : 'river stage'} · <StatusChip level={node.level} />
              {node.distanceKm > 1.5 && <span>Too far to compare.</span>}
            </span>
          ) : 'No depth node reachable.'}
        />
        <Row
          icon={Sparkles}
          title="AI photo check"
          agreement={aiAgree}
          detail={ai?.ran ? <>Model estimate <span className={num}>~{ai.estimatedDepthCm} cm</span>. One opinion, not a measurement.</> : 'Not run yet. Optional.'}
        />
      </ul>
      <p className="mt-2 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm/5 font-medium text-slate-800" role="status">
        <Scale className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" /> {summary.text}
      </p>
      <p className="mt-1.5 text-xs/4 text-slate-600">A river camera measures bank height and your photo measures street depth, so they are compared by danger level, not by number.</p>
    </div>
  );
}
