// Demo playback loops (AI-generated sample imagery). A loop is NOT tied to the live readings, so the UI offers it
// as an explicit "Demo loop" view and labels it. Files are made by docs/PLAN_A_GEMINI_MEDIA.md.
export interface DemoVideo {
  src: string;
  poster: string;
}

export const DEMO_VIDEOS: Record<string, DemoVideo> = {
  'sample-klang-jamek': { src: '/media/live/klang-rise.mp4', poster: '/media/live/klang-rise-poster.webp' },
};

const availability = new Map<string, Promise<boolean>>();

/**
 * True only if the URL serves a video. A plain `res.ok` is not enough: the Vite dev server and most SPA hosts answer
 * a missing file with index.html and status 200, so the content type has to be checked too.
 */
export function isVideoAvailable(url: string): Promise<boolean> {
  let p = availability.get(url);
  if (!p) {
    p = fetch(url, { method: 'HEAD' })
      .then((res) => res.ok && (res.headers.get('content-type') ?? '').startsWith('video/'))
      .catch(() => false);
    availability.set(url, p);
  }
  return p;
}
