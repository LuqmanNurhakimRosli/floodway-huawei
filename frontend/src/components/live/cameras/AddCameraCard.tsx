import { Plus } from 'lucide-react';
import { focusRing } from '../shared/ui';

export function AddCameraCard({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1677FF]/50 bg-blue-50/40 p-3 text-sm font-bold text-[#0958D9] hover:bg-blue-50 ${focusRing}`}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      Add my camera
    </button>
  );
}
