// Shared style tokens for Live Vision. Change the look of the whole page here.
//
// Layout is driven by the width of the page's <main> (a named container, `main`), not the viewport, because the app
// sidebar changes how much room the page actually has. `@min-[760px]/main:` reads "when the content area is >= 760px".
//
// Spacing scale: 4 8 12 16 20 24 32. Cards: 16px padding on narrow layouts, 20px on wide ones; 16px between cards,
// 12px inside a card. Type: nothing below 12px. Status colours live in lib/vision/levels.ts.

export const BRAND = '#1677FF';

const motion = 'transition-[color,background-color,border-color,box-shadow,opacity] duration-150 ease-out motion-reduce:transition-none';

export const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
export const cardPad = 'p-4 @min-[760px]/main:p-5';
export const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white';
export const interactive = `${motion} ${focusRing}`;

export const btnPrimary = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1677FF] px-4 text-sm font-semibold text-white hover:bg-[#0958D9] disabled:cursor-not-allowed disabled:opacity-50 ${interactive}`;
export const btnSecondary = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${interactive}`;

// Type scale
export const heading = 'font-heading font-bold text-slate-900';
export const pageTitle = 'font-heading text-xl/7 font-bold text-slate-900 @min-[640px]/main:text-2xl/8';
export const cardTitle = 'font-heading text-base/6 font-bold text-slate-900';
export const label = 'text-xs/4 font-medium text-slate-600';
export const muted = 'text-slate-600';
/** Numbers, timestamps, coordinates and JSON: monospace with fixed-width digits so values never jitter. */
export const num = "font-['JetBrains_Mono',ui-monospace,monospace] tabular-nums";
export const hero = 'font-heading text-[44px]/[48px] font-extrabold tracking-tight tabular-nums text-slate-900 @min-[640px]/main:text-5xl/[52px]';

/** Small rounded pill used for counts and meta. */
export const pill = `inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700`;
