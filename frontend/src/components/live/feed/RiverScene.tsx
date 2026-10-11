interface Props {
  ratio: number;
  className?: string;
}

/** Vector stand-in for a camera frame, used for sample data. Same geometry as the backend's synthetic scene:
 *  channel bed at y=330, bank top (danger line) at y=130 on a 640x360 canvas. */
export function RiverScene({ ratio, className = '' }: Props) {
  const waterY = Math.max(100, Math.min(330, 330 - ratio * 200));
  return (
    <svg viewBox="0 0 640 360" preserveAspectRatio="none" className={`h-full w-full ${className}`} aria-hidden="true">
      <rect width="640" height="360" fill="#c8bda9" />
      <g fill="#6b6964">
        <rect x="0" y="40" width="90" height="90" />
        <rect x="90" y="70" width="80" height="60" />
        <rect x="480" y="55" width="80" height="75" />
        <rect x="560" y="85" width="80" height="45" />
      </g>
      <rect y="130" width="640" height="230" fill="#8f8f8f" />
      <rect x="160" y="108" width="320" height="22" fill="#8f8f8f" />
      <rect x="160" y={waterY} width="320" height={330 - waterY} fill="#6e5f46" />
      <rect x="160" y={waterY} width="320" height="3" fill="#8a7a5c" />
    </svg>
  );
}
