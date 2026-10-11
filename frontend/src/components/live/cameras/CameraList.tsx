import { Video } from 'lucide-react';
import type { CameraWithDistance } from '../../../hooks/vision/useNearbyCameras';
import type { Reading } from '../../../types/vision';
import { EmptyState } from '../shared/EmptyState';
import { AddCameraCard } from './AddCameraCard';
import { CameraCard } from './CameraCard';

interface Props {
  items: CameraWithDistance[];
  history: Record<string, Reading[]>;
  selectedId: string | null;
  useScene: boolean;
  isMineTab: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export function CameraList({ items, history, selectedId, useScene, isMineTab, onSelect, onAdd }: Props) {
  return (
    <ul className="space-y-2.5" aria-label="Cameras near you">
      {items.length === 0 && (
        <li>
          {isMineTab ? (
            <EmptyState icon={Video} title="No cameras of your own yet" hint="Add a stream or snapshot URL, draw the water zone, and the AI starts watching it." action={{ label: 'Add your first camera', onClick: onAdd }} />
          ) : (
            <EmptyState icon={Video} title="No cameras in this radius" hint="Try a larger radius or the City tab." />
          )}
        </li>
      )}
      {items.map(({ camera, distanceKm }) => (
        <li key={camera.id}>
          <CameraCard camera={camera} distanceKm={distanceKm} history={history[camera.id] ?? []} selected={camera.id === selectedId} useScene={useScene} onSelect={() => onSelect(camera.id)} />
        </li>
      ))}
      {items.length > 0 && (
        <li>
          <AddCameraCard onClick={onAdd} />
        </li>
      )}
    </ul>
  );
}
