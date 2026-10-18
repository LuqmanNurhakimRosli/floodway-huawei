import { useEffect, useRef } from 'react';

/**
 * The opening animation: rain over a city, water rising gently in the low street, and a family walking the safe route
 * from their house up to a relief centre on high ground. An 8-second seamless loop, all drawn shapes (no photos).
 * The walk and the route line share one SMIL timeline so they stay in sync; rain, clouds and waves are CSS loops.
 * With reduced motion it shows one still frame: the family arrived at the centre.
 */
const LOOP_S = 8;
const ROUTE = 'M70 214 C 108 214, 118 186, 152 182 S 206 178, 222 150 S 262 112, 292 112';

export function EvacuationLoop({ className = '' }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svg.current;
    if (!el || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      if (mq.matches) {
        el.pauseAnimations?.();
        el.setCurrentTime?.(6.2);
      } else el.unpauseAnimations?.();
    };
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  const walker = (begin: number, color: string, r: number) => (
    <g opacity="0">
      <animateMotion dur={`${LOOP_S}s`} begin={`${begin}s`} repeatCount="indefinite" path={ROUTE} keyPoints="0;0;1;1" keyTimes="0;0.1;0.72;1" calcMode="linear" />
      <animate attributeName="opacity" dur={`${LOOP_S}s`} begin={`${begin}s`} repeatCount="indefinite" values="0;1;1;0;0" keyTimes="0;0.1;0.9;0.97;1" />
      <circle r={r + 2.5} fill="white" />
      <circle r={r} fill={color} />
    </g>
  );

  return (
    <div className={`fw-loop relative overflow-hidden ${className}`} aria-hidden="true">
      <svg ref={svg} viewBox="0 0 360 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="fw-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#DCEBFF" />
            <stop offset="1" stopColor="#F7FAFF" />
          </linearGradient>
          <linearGradient id="fw-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4096FF" stopOpacity="0.9" />
            <stop offset="1" stopColor="#0958D9" />
          </linearGradient>
          <linearGradient id="fw-hill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#E3EEFF" />
          </linearGradient>
          <clipPath id="fw-frame">
            <rect width="360" height="300" />
          </clipPath>
        </defs>

        <g clipPath="url(#fw-frame)">
          <rect width="360" height="300" fill="url(#fw-sky)" />

          {/* clouds drift right and wrap */}
          <g className="fw-cloud fw-cloud--a" fill="white" opacity="0.95">
            <ellipse cx="60" cy="48" rx="34" ry="12" />
            <ellipse cx="80" cy="40" rx="22" ry="14" />
          </g>
          <g className="fw-cloud fw-cloud--b" fill="white" opacity="0.8">
            <ellipse cx="250" cy="34" rx="30" ry="10" />
            <ellipse cx="266" cy="28" rx="18" ry="11" />
          </g>

          {/* rain */}
          <g stroke="#7BAAF7" strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
            {Array.from({ length: 16 }, (_, i) => (
              <line key={i} className="fw-rain" x1={12 + i * 22} y1="-10" x2={8 + i * 22} y2="2" style={{ animationDelay: `${(i * 0.37) % 1.2}s` }} />
            ))}
          </g>

          {/* skyline, two depths */}
          <g fill="#C7DCFF">
            <rect x="96" y="96" width="22" height="90" rx="3" />
            <rect x="122" y="70" width="18" height="116" rx="3" />
            <rect x="144" y="104" width="26" height="82" rx="3" />
            <rect x="176" y="84" width="16" height="102" rx="3" />
            <path d="M176 84 l8 -16 l8 16 z" />
          </g>
          <g fill="#A9C9FF">
            <rect x="20" y="132" width="30" height="70" rx="3" />
            <rect x="54" y="118" width="20" height="84" rx="3" />
            <rect x="196" y="120" width="24" height="70" rx="3" />
          </g>

          {/* high ground with the relief centre */}
          <path d="M150 300 C 190 220, 230 150, 300 118 C 330 106, 350 108, 360 110 L 360 300 Z" fill="url(#fw-hill)" />
          <path d="M150 300 C 190 220, 230 150, 300 118 C 330 106, 350 108, 360 110" fill="none" stroke="#BFD6FF" strokeWidth="2" />

          {/* relief centre */}
          <g transform="translate(276 72)">
            <rect x="0" y="16" width="48" height="34" rx="5" fill="white" stroke="#0958D9" strokeWidth="2.5" />
            <path d="M-4 18 L24 0 L52 18 Z" fill="#0958D9" />
            <rect x="19" y="32" width="10" height="18" rx="2" fill="#1677FF" />
            <path d="M24 21.5 l5 2.2 v3.6 c0 3 -2.2 5 -5 6 c-2.8 -1 -5 -3 -5 -6 v-3.6 z" fill="#10B981" />
            <line x1="44" y1="-14" x2="44" y2="16" stroke="#0958D9" strokeWidth="2" />
            <path className="fw-flag" d="M44 -14 h14 l-4 5 l4 5 h-14 z" fill="#10B981" />
            {/* arrival ring, on the shared timeline */}
            <circle cx="24" cy="40" r="18" fill="none" stroke="#10B981" strokeWidth="3" opacity="0">
              <animate attributeName="opacity" dur={`${LOOP_S}s`} repeatCount="indefinite" values="0;0;0.9;0;0" keyTimes="0;0.72;0.78;0.92;1" />
              <animate attributeName="r" dur={`${LOOP_S}s`} repeatCount="indefinite" values="18;18;20;34;34" keyTimes="0;0.72;0.78;0.92;1" />
            </circle>
          </g>

          {/* the house in the low street */}
          <g transform="translate(36 182)">
            <rect x="4" y="16" width="44" height="30" rx="4" fill="white" stroke="#0958D9" strokeWidth="2.5" />
            <path d="M0 18 L26 0 L52 18 Z" fill="#1677FF" />
            <rect x="20" y="28" width="11" height="18" rx="2" fill="#0958D9" />
            <rect x="9" y="24" width="8" height="8" rx="1.5" fill="#DCEBFF" />
          </g>

          {/* safe route: faint dotted base, then the line drawn in step with the walk */}
          <path d={ROUTE} fill="none" stroke="#9CC0FF" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 9" />
          <path d={ROUTE} fill="none" stroke="#1677FF" strokeWidth="4.5" strokeLinecap="round" pathLength={100} strokeDasharray="100 100" strokeDashoffset="100">
            <animate attributeName="stroke-dashoffset" dur={`${LOOP_S}s`} repeatCount="indefinite" values="100;100;0;0;100" keyTimes="0;0.1;0.72;0.95;1" />
            <animate attributeName="opacity" dur={`${LOOP_S}s`} repeatCount="indefinite" values="1;1;1;0;0" keyTimes="0;0.1;0.9;0.97;1" />
          </path>

          {/* the family: three people a step apart */}
          {walker(0.4, '#FBBF24', 4)}
          {walker(0.2, '#F472B6', 5)}
          {walker(0, '#0958D9', 6)}

          {/* water rising and settling in the low street: two wave layers sliding at different speeds */}
          <g className="fw-tide">
            <path className="fw-wave fw-wave--back" d="M0 236 Q 22.5 230 45 236 T 90 236 T 135 236 T 180 236 T 225 236 T 270 236 T 315 236 T 360 236 T 405 236 T 450 236 T 495 236 T 540 236 T 585 236 T 630 236 T 675 236 T 720 236 V 300 H 0 Z" fill="#69A8FF" opacity="0.55" />
            <path className="fw-wave fw-wave--front" d="M0 246 Q 30 238 60 246 T 120 246 T 180 246 T 240 246 T 300 246 T 360 246 T 420 246 T 480 246 T 540 246 T 600 246 T 660 246 T 720 246 V 300 H 0 Z" fill="url(#fw-water)" />
          </g>
        </g>
      </svg>

      {/* the phone alert that starts each loop */}
      <div className="fw-toast absolute left-3 top-3 flex max-w-[78%] items-center gap-2.5 rounded-2xl bg-white/95 px-3 py-2 shadow-[0_10px_30px_-12px_rgba(7,20,38,0.45)] ring-1 ring-blue-100 backdrop-blur">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-base">🌧️</span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-extrabold text-slate-900">Water rising near you</span>
          <span className="block truncate text-xs font-semibold text-[#0958D9]">Safe route ready · 1.4 km</span>
        </span>
      </div>
      <div className="fw-safe absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
        ✓ Family arrived safe
      </div>
    </div>
  );
}
