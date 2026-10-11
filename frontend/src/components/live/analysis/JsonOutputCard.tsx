import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import type { Reading } from '../../../types/vision';
import { focusRing } from '../shared/ui';

export function JsonOutputCard({ reading }: { reading: Reading }) {
  const [copied, setCopied] = useState(false);
  const output = {
    camera_id: reading.camera_id,
    timestamp: reading.timestamp,
    window_seconds: reading.window_seconds,
    frames_analyzed: reading.frames_analyzed,
    water_ratio: reading.water_ratio,
    level: reading.level,
    confidence: reading.confidence,
    lines_crossed: reading.lines_crossed,
    trend: reading.trend,
    model: reading.model,
    latency_ms: reading.latency_ms,
    action: reading.action,
  };
  const text = JSON.stringify(output, null, 2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard can be blocked; the text stays selectable */
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">Latest result</span>
        <button type="button" onClick={copy} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 ${focusRing}`}>
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="max-h-64 overflow-auto rounded-xl bg-slate-900 p-3 font-mono text-xs leading-relaxed text-sky-200">{text}</pre>
    </div>
  );
}
