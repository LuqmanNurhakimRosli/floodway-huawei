// FloodWay mobile design tokens: the web app's brand blue and level colours, sized for phones (44 dp minimum targets).
import { LEVEL_PALETTE, type Level } from './shared';

export const color = {
  blue: '#1677FF',
  blueDark: '#0958D9',
  blueDeep: '#003EB3',
  blueSoft: '#E8F1FF',
  navy: '#071426',
  page: '#F4F7FB',
  card: '#FFFFFF',
  ink: '#0F172A',
  muted: '#475569',
  faint: '#64748B',
  line: '#E2E8F0',
  red: '#B91C1C',
  redSoft: '#FEF2F2',
  amber: '#92400E',
  amberSoft: '#FFFBEB',
  green: '#047857',
  greenSoft: '#ECFDF5',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { card: 20, button: 14, pill: 999 };
export const font = { title: 26, h2: 19, body: 16, small: 14, tiny: 13 };
/** Smallest touch target, in dp. */
export const TOUCH = 48;

export const levelColor = (level: Level | null) => (level ? LEVEL_PALETTE[level] : { text: color.muted, tint: '#F1F5F9', solid: color.muted, marker: color.faint });
export const LEVEL_LABEL: Record<Level, string> = { NORMAL: 'Normal', ADVISORY: 'Advisory', WARNING: 'Warning', DANGER: 'Danger' };
