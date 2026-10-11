import type { Camera } from '../../types/vision';

/** Short display id such as CAM-001, based on the camera's stable position in the full list. */
export function camTag(cameras: Camera[], id: string): string {
  const index = cameras.findIndex((c) => c.id === id);
  return `CAM-${String(index < 0 ? 0 : index + 1).padStart(3, '0')}`;
}
