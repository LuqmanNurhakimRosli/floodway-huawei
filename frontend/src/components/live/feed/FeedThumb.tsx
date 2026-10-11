import { frameUrl } from '../../../services/vision/visionApi';
import type { Camera } from '../../../types/vision';
import { RiverScene } from './RiverScene';

interface Props {
  camera: Camera;
  useScene: boolean;
  className?: string;
}

/** Small thumbnail for cards and the camera strip. */
export function FeedThumb({ camera, useScene, className = '' }: Props) {
  const ratio = camera.reading?.water_ratio ?? 0;
  return (
    <div className={`relative aspect-video overflow-hidden rounded-lg bg-slate-200 ${className}`}>
      {!camera.online ? (
        <div className="flex h-full w-full items-center justify-center bg-slate-300 text-xs font-semibold text-slate-600">No signal</div>
      ) : useScene ? (
        <RiverScene ratio={ratio} />
      ) : !camera.reading ? (
        <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xs font-semibold text-slate-600">Waiting…</div>
      ) : (
        <img src={frameUrl(camera.id, camera.reading?.timestamp ?? 0)} alt="" loading="lazy" className="h-full w-full object-cover" />
      )}
    </div>
  );
}
