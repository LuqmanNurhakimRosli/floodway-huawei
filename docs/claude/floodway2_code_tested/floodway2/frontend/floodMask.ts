/** BFS flood-fill on the terrain grid: which cells are below the water surface AND hydraulically connected to the sensor cell. */
export interface Terrain {
  rows: number;
  cols: number;
  cell_m: number;
  sensor_rc: [number, number];
  ground_at_sensor_m: number;
  elev_rel_m: number[]; // elevation relative to sensor ground, row-major
}

export function floodMask(t: Terrain, levelM: number): Uint8Array {
  const { rows, cols, elev_rel_m: e } = t;
  const mask = new Uint8Array(rows * cols);
  const [sr, sc] = t.sensor_rc;
  const seed = sr * cols + sc;
  if (levelM <= 0 || e[seed] >= levelM) return mask;
  const stack = [seed];
  mask[seed] = 1;
  while (stack.length) {
    const i = stack.pop() as number;
    const r = (i / cols) | 0;
    const c = i - r * cols;
    if (r > 0 && !mask[i - cols] && e[i - cols] < levelM) { mask[i - cols] = 1; stack.push(i - cols); }
    if (r < rows - 1 && !mask[i + cols] && e[i + cols] < levelM) { mask[i + cols] = 1; stack.push(i + cols); }
    if (c > 0 && !mask[i - 1] && e[i - 1] < levelM) { mask[i - 1] = 1; stack.push(i - 1); }
    if (c < cols - 1 && !mask[i + 1] && e[i + 1] < levelM) { mask[i + 1] = 1; stack.push(i + 1); }
  }
  return mask;
}

export function depthAt(t: Terrain, levelM: number, mask: Uint8Array, r: number, c: number): number {
  const i = r * t.cols + c;
  return mask[i] ? Math.max(0, levelM - t.elev_rel_m[i]) : 0;
}
