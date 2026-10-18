import { Plus } from 'lucide-react';
import { interactive } from '../shared/ui';

export function AddCameraCard({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#0E7C7B]/50 bg-teal-50/40 px-3 text-sm font-semibold text-[#0B5F60] hover:bg-teal-50 ${interactive}`}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      Add my camera
    </button>
  );
}
