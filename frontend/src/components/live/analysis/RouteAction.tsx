import { Map as MapIcon } from 'lucide-react';
import { isAlertLevel } from '../../../lib/vision/levels';
import type { Level } from '../../../types/vision';
import { btnPrimary, btnSecondary } from '../shared/ui';

/** The one action on the page. Primary once the camera is above normal; quiet otherwise. */
export function RouteAction({ level, onClick, className = '' }: { level: Level | undefined; onClick: () => void; className?: string }) {
  const urgent = level !== undefined && level !== 'NORMAL';
  return (
    <button type="button" onClick={onClick} className={`${urgent ? btnPrimary : btnSecondary} w-full ${className}`}>
      <MapIcon className="h-4 w-4" aria-hidden="true" />
      {urgent ? 'Show evacuation routes' : 'View on map'}
      {level && isAlertLevel(level) && <span className="sr-only">. This camera adds a flood zone that routes avoid.</span>}
    </button>
  );
}
