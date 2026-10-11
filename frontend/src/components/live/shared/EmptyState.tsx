import type { LucideIcon } from 'lucide-react';
import { btnPrimary, heading } from './ui';

interface Props {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, hint, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <Icon className="h-7 w-7 text-slate-500" aria-hidden="true" />
      <p className={`${heading} text-base`}>{title}</p>
      {hint && <p className="max-w-xs text-sm text-slate-600">{hint}</p>}
      {action && (
        <button type="button" onClick={action.onClick} className={`${btnPrimary} mt-2`}>
          {action.label}
        </button>
      )}
    </div>
  );
}
