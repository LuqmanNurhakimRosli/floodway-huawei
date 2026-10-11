interface Props {
  values: number[];
  color: string;
  width?: number;
  height?: number;
  max?: number;
  className?: string;
}

/** Hand-drawn SVG line, no chart library. Values are bank-height ratios (0..~1.2). */
export function Sparkline({ values, color, width = 120, height = 32, max = 1.2, className = '' }: Props) {
  if (values.length < 2) return <div className={className} style={{ width, height }} aria-hidden="true" />;
  const x = (i: number) => (i / (values.length - 1)) * (width - 6) + 3;
  const y = (v: number) => height - (Math.min(v, max) / max) * (height - 6) - 3;
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={className} role="img" aria-label="Water level trend">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={2.5} fill={color} />
    </svg>
  );
}
