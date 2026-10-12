import { samplePhotoUrl } from '../../../lib/vision/samplePhoto';
import { RiverScene } from './RiverScene';

interface Props {
  cameraId: string;
  ratio: number;
  className?: string;
}

/** The sample camera's photo for this water level. Falls back to the vector scene for a camera with no photos. */
export function SampleFrame({ cameraId, ratio, className = 'h-full w-full object-cover' }: Props) {
  const src = samplePhotoUrl(cameraId, ratio);
  if (!src) return <RiverScene ratio={ratio} />;
  return <img src={src} alt="" className={className} />;
}
