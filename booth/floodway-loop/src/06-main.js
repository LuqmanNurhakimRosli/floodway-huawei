/* =====================================================================
   renderFrame(t): the single entry point. Pure function of t in [0, 60).
   PLAYBACK: the live clock only feeds renderFrame(clock % 60).
   ===================================================================== */
const dbg = document.getElementById('debug');
const sceneAt = t => TL.scenes.find(s => t >= s.start && t < s.end) || TL.scenes[TL.scenes.length - 1];
const wrapT = t => ((t % DUR) + DUR) % DUR;
let QA_BAD = 0;
if (QA) {                                             // QA: count any non-finite numeric argument passed to canvas drawing calls
  const P2 = CanvasRenderingContext2D.prototype;
  for (const m of ['fillRect', 'rect', 'moveTo', 'lineTo', 'arc', 'arcTo', 'ellipse', 'bezierCurveTo', 'quadraticCurveTo', 'drawImage', 'fillText', 'translate', 'scale', 'rotate', 'setTransform', 'clearRect']) {
    const f = P2[m];
    P2[m] = function (...a) { for (const v of a) if (typeof v === 'number' && !Number.isFinite(v)) QA_BAD++; return f.apply(this, a); };
  }
}
function renderFrame(tIn) {
  const t = wrapT(Number.isFinite(+tIn) ? +tIn : 0);
  const P = phonePose(t);
  renderWorld(t, P);
  renderPhone(t);
  renderOver(t);
  if (DEBUG) { const s = sceneAt(t); dbg.textContent = 't ' + t.toFixed(3) + ' s   frame ' + Math.floor(t * FPS + 1e-6) + ' / ' + (DUR * FPS) + '\n' + s.id + ' · ' + s.name; }
  return t;
}
function fit() {                                      // letterbox the 1920x1080 stage into any window
  const k = Math.min(innerWidth / W, innerHeight / H);
  stageEl.style.transform = 'translate(' + ((innerWidth - W * k) / 2).toFixed(2) + 'px,' + ((innerHeight - H * k) / 2).toFixed(2) + 'px) scale(' + k.toFixed(5) + ')';
}

function start() {
  makeGrade();
  fit(); addEventListener('resize', fit);
  window.renderFrame = renderFrame;
  window.FLOODWAY = { DURATION: DUR, FPS, SCENES: TL.scenes, CONFIG, qaBad: () => QA_BAD, phonePose };
  if (DEBUG) dbg.style.display = 'block';
  const START_T = wrapT(parseFloat(Q.get('t')) || 0);
  if (RENDER_MODE) {
    renderFrame(START_T);
  } else {
    let playing = true, baseT = START_T, t0 = performance.now();
    const clock = () => (playing ? baseT + (performance.now() - t0) / 1000 : baseT);
    const loop = () => {
      const a = performance.now();
      renderFrame(clock());
      if (DEBUG) dbg.textContent += '\nframe script ' + (performance.now() - a).toFixed(2) + ' ms' + (playing ? '' : '   PAUSED');
      requestAnimationFrame(loop);
    };
    addEventListener('keydown', ev => {
      if (ev.code === 'Space') {
        ev.preventDefault();
        if (playing) { baseT = clock(); playing = false; } else { t0 = performance.now(); playing = true; }
      } else if (ev.code === 'ArrowRight' || ev.code === 'ArrowLeft') {
        ev.preventDefault();
        baseT = wrapT(clock() + (ev.code === 'ArrowRight' ? 1 : -1)); t0 = performance.now();
      } else if (ev.code === 'KeyF') {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else document.documentElement.requestFullscreen().catch(() => {});
      }
    });
    let hideTimer = 0;
    const poke = () => {
      document.body.classList.remove('nocursor');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => document.body.classList.add('nocursor'), 2000);
    };
    addEventListener('mousemove', poke, { passive: true });
    poke();
    const keepAwake = async () => {
      try { if ('wakeLock' in navigator && document.visibilityState === 'visible') await navigator.wakeLock.request('screen'); } catch (e) { /* OS sleep settings cover this */ }
    };
    document.addEventListener('visibilitychange', keepAwake);
    keepAwake();
    requestAnimationFrame(loop);
  }
  window.FLOODWAY_READY = true;
}
// Fonts are embedded; wait until every weight is decoded so the first frame and all measurements use Outfit.
Promise.all([400, 600, 700, 800].map(w => document.fonts.load(w + ' 64px Outfit'))).then(start, start);
