  // ---------- background: blooms and rain ----------
  function background(t) {
    el.bloomA.style.transform = `translate(${(-300 + 160 * Math.sin(t * 0.11)).toFixed(1)}px, ${(-420 + 90 * Math.cos(t * 0.09)).toFixed(1)}px)`;
    el.bloomB.style.transform = `translate(${(980 + 140 * Math.cos(t * 0.08)).toFixed(1)}px, ${(260 + 110 * Math.sin(t * 0.07)).toFixed(1)}px)`;
    const ctx = el.rain.getContext('2d');
    ctx.clearRect(0, 0, 1920, 1080);
    const env = clamp(prog(t, 0, 0.8)) * (1 - prog(t, 9.6, 10.6));
    if (env <= 0) return;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#BFE4F2';
    for (const d of rain) {
      const y = ((d.y + d.v * t) % 1400) - 150;
      const x = d.x - 0.18 * (y + 150);
      ctx.globalAlpha = d.a * env;
      ctx.lineWidth = d.l > 40 ? 2 : 1.4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 0.18 * d.l, y + d.l); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Floodwater creeping up from the bottom edge: tension without disaster imagery.
    const h = 30 + 170 * E.inOutSine(prog(t, 0.4, 9.8)), top = 1080 - h;
    const g = ctx.createLinearGradient(0, top - 20, 0, 1080);
    g.addColorStop(0, 'rgba(56,150,190,0.50)'); g.addColorStop(1, 'rgba(4,26,34,0.95)');
    ctx.globalAlpha = env;
    ctx.beginPath(); ctx.moveTo(0, 1080);
    for (let x = 0; x <= 1920; x += 16) ctx.lineTo(x, top + 9 * Math.sin(x / 140 + t * 1.6) + 5 * Math.sin(x / 57 - t * 2.3));
    ctx.lineTo(1920, 1080); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath();
    for (let x = 0; x <= 1920; x += 16) { const y = top + 9 * Math.sin(x / 140 + t * 1.6) + 5 * Math.sin(x / 57 - t * 2.3); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = 'rgba(191,228,242,0.55)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ---------- S1 hook ----------
  function s1(t) {
    if (!plate(S.s1, t, SC.s1)) return;
    reveal([...S.s1.querySelectorAll('.line > span')], t, 0.35, 0.42, 0.9);
  }

  // ---------- S2 the gap ----------
  function s2(t) {
    if (!plate(S.s2, t, SC.s2)) return;
    const out = E.inCubic(prog(t, 8.0, 8.5));
    ['f1', 'f2', 'f3'].forEach((id, i) => {
      enter(el[id], t, 4.85 + i * 0.6, { dx: 90, dy: 0, dur: 0.8 });
      if (out > 0) { el[id].style.opacity = String(1 - out); el[id].style.transform = `translateX(${(-160 * out).toFixed(1)}px)`; }
    });
    reveal([...el.turn.querySelectorAll('.line > span')], t, 8.4, 0, 0.9);
    [...el.camgrid.children].forEach((c, i) => enter(c, t, 9.0 + i * 0.08, { dy: 0, s0: 0.6, dur: 0.5, ease: E.outBack }));
  }

  // ---------- S3 Live Vision ----------
  const RA = 11.4, RB = 19.6;
  const ratioAt = (t) => lerp(0.10, 1.04, E.inOutSine(prog(t, RA, RB)));
  const changes = [];
  for (let t = RA, prev = levelOf(ratioAt(RA))[1]; t <= RB; t += 1 / 240) { const l = levelOf(ratioAt(t))[1]; if (l !== prev) { changes.push(t); prev = l; } }
  const Y = (v) => v * 630;                            // overlay is 1120 x 630
  function s3(t) {
    if (!plate(S.s3, t, SC.s3)) return;
    enter(el.monitor, t, 10.3, { dx: -60, dy: 0, dur: 1.0 });
    reveal([...S.s3.querySelectorAll('.side .kicker, .side h2')].map((n) => n), t, 10.7, 0.15, 0.9);
    const r = ratioAt(t);
    // Water: crossfade between neighbouring ladder photos (0.10 of bank apart), so the picture matches the number.
    const f = clamp(r * 10, 0, 11), i = Math.floor(f), k = f - i;
    ladder.forEach((img, j) => { img.style.opacity = j === i ? '1' : j === i + 1 ? k.toFixed(3) : '0'; });
    // Reference lines from the Klang camera's calibration (bed 0.90, danger 0.48, warning 0.635, normal 0.791).
    [['lnD', 'lblD', 0.48], ['lnW', 'lblW', 0.635], ['lnN', 'lblN', 0.791]].forEach(([ln, lb, v], j) => {
      const a = clamp(prog(t, 11.0 + j * 0.12, 11.5 + j * 0.12));
      el[ln].setAttribute('y1', Y(v)); el[ln].setAttribute('y2', Y(v)); el[ln].style.opacity = a;
      el[lb].setAttribute('transform', `translate(0 ${Y(v) - 20})`); el[lb].style.opacity = a;
    });
    const wy = Y(0.90 - 0.42 * r), wa = clamp(prog(t, 11.3, 11.8));
    el.wl.setAttribute('y1', wy); el.wl.setAttribute('y2', wy); el.wl.style.opacity = wa;
    el.wlKnob.setAttribute('cy', wy); el.wlKnob.style.opacity = wa;
    scan.setAttribute('y', String(((t - 10) % 1.1) / 1.1 * 720 - 90));
    scan.style.opacity = String(wa);
    const clock = 58 * 60 + 20 + Math.floor((t - 10.2) * 95);
    const p2 = (n) => String(n).padStart(2, '0');   // the clock runs fast: about 16 minutes of rain in 11 seconds
    el.hudTime.textContent = `${p2(Math.floor(clock / 3600))}:${p2(Math.floor(clock / 60) % 60)}:${p2(clock % 60)}`;
    // Reading panel.
    const [, name, color] = levelOf(r);
    const last = changes.filter((c) => c <= t).pop();
    const pulse = last ? Math.exp(-(t - last) * 6) : 0;
    el.pct.firstChild.nodeValue = String(Math.round(r * 100));
    el.pillTxt.textContent = name;
    el.pill.style.color = color;
    el.pill.style.background = color + '2E';
    el.pill.style.boxShadow = `0 0 0 ${(2 + 18 * pulse).toFixed(1)}px ${color}${Math.round(40 * pulse + 20).toString(16).padStart(2, '0')}`;
    el.pill.style.transform = `scale(${(1 + 0.08 * pulse).toFixed(3)})`;
    el.barFill.style.width = `${(Math.min(r, 1) * 100).toFixed(2)}%`;
    el.barFill.style.background = color;
    ['pct', 'pill'].forEach((id, j) => { const n = el[id]; n.style.opacity = String(clamp(prog(t, 11.0 + j * 0.15, 11.6 + j * 0.15))); });
    const danger = r >= 0.97;
    el.monGlow.style.boxShadow = danger ? `inset 0 0 0 ${(4 + 3 * Math.sin(t * 9)).toFixed(1)}px rgba(229,72,77,.9), inset 0 0 80px rgba(229,72,77,.35)` : 'none';
    enter(el.toast, t, 19.9, { dy: -40, dur: 0.6, ease: E.outBack });
  }

  // ---------- S4 map ----------
  const draw = (id, t, a, b, ease = E.inOutCubic) => { el[id].style.strokeDashoffset = String(lens[id] * (1 - ease(prog(t, a, b)))); };
  const pop = (id, t, a, dur = 0.5) => { const k = E.outBack(prog(t, a, a + dur)); el[id].style.opacity = String(clamp(prog(t, a, a + dur * 0.5))); el[id].style.transform = `scale(${lerp(0.5, 1, k).toFixed(4)})`; };
  function s4(t) {
    if (!plate(S.s4, t, SC.s4)) return;
    el.map.style.transform = `scale(${(1 + 0.05 * prog(t, 21, 28.8)).toFixed(4)})`;
    reveal([...S.s4.querySelectorAll('.title .kicker, .title h2')], t, 21.3, 0.15, 0.9);
    draw('river', t, 21.0, 21.9, E.outCubic);
    pop('camPin', t, 21.7);
    const ph = Math.max(0, (t - 21.7) % 1.2) / 1.2;     // before 21.7 s the ring is hidden; keep r valid
    el.camRing.setAttribute('r', String(22 + 46 * ph)); el.camRing.style.opacity = t > 21.7 ? String(1 - ph) : '0';
    const fr = 190 * E.outCubic(prog(t, 22.1, 23.6)) * (1 + 0.03 * Math.sin(t * 3));
    el.flood.setAttribute('r', String(Math.max(1, fr))); el.flood.style.opacity = String(clamp(prog(t, 22.1, 22.4)));
    pop('you', t, 22.7); pop('shelter', t, 22.95);
    draw('routeBad', t, 23.3, 24.3);
    const bad = prog(t, 24.5, 24.8);
    el.routeBad.style.stroke = bad > 0 ? '#E5484D' : '#FFFFFF';
    el.routeBad.style.opacity = String(t < 23.3 ? 0 : 1 - 0.6 * prog(t, 25.3, 25.9));
    pop('xMark', t, 24.6, 0.4);
    el.routeGood.style.opacity = t < 25.2 ? '0' : '1';
    draw('routeGood', t, 25.2, 26.6);
    enter(el.eta, t, 26.6, { dy: 50, dur: 0.7 });
  }

  // ---------- S5 alert in hand ----------
  function s5(t) {
    if (!plate(S.s5, t, SC.s5)) return;
    reveal([...S.s5.querySelectorAll('.copy .kicker, .copy h2, .copy p')], t, 29.0, 0.16, 0.9);
    const k = E.outExpo(prog(t, 28.8, 30.0));
    el.phone.style.opacity = String(clamp(prog(t, 28.8, 29.3)));
    el.phone.style.transform = `perspective(1800px) translateY(${(320 * (1 - k)).toFixed(1)}px) rotateX(${(16 * (1 - k)).toFixed(2)}deg) rotateY(${(-14 + 6 * k).toFixed(2)}deg)`;
    enter(el.notif, t, 30.3, { dy: -120, dur: 0.6, ease: E.outBack });
    ['c1', 'c2', 'c3'].forEach((id, i) => {
      const a = 31.4 + i * 0.28;
      enter(el[id], t, a, { dx: -40, dy: 0, dur: 0.5 });
      const em = el[id].querySelector('em');
      const done = t >= a + 0.7;
      em.textContent = done ? (i === 0 ? 'Delivered' : 'Seen') : 'Sending…';
      em.style.color = done ? '#18B57A' : '#9DBBC6';
    });
  }

  // ---------- S6 impact ----------
  function s6(t) {
    if (!plate(S.s6, t, SC.s6)) return;
    const away = E.inCubic(prog(t, 37.3, 37.7));
    const head = S.s6.querySelector('.head');
    reveal([...head.querySelectorAll('.kicker, h2')], t, 34.9, 0.15, 0.9);
    head.style.opacity = el.tl.style.opacity = String(1 - away);
    el.tlFill.style.width = `${(100 * E.inOutCubic(prog(t, 35.2, 37.0))).toFixed(2)}%`;
    ['n1', 'n2', 'n3'].forEach((id, i) => enter(el[id], t, 35.2 + i * 0.7, { dy: 30, dur: 0.6 }));
    el.stat.style.opacity = String(clamp(prog(t, 37.5, 37.9)));
    el.stat.style.transform = `scale(${lerp(0.9, 1, E.outExpo(prog(t, 37.5, 38.3))).toFixed(4)})`;
    el.statNum.textContent = String(Math.round(100 * E.outCubic(prog(t, 37.6, 38.7))));
    enter(el.chips6, t, 38.8, { dy: 30, dur: 0.6 });
  }

  // ---------- S7 brand ----------
  function s7(t) {
    if (!plate(S.s7, t, SC.s7, { exit: false })) return;
    const mark = S.s7.querySelector('.mark');
    const k = E.outBack(prog(t, 40.2, 40.9));
    mark.style.opacity = String(clamp(prog(t, 40.2, 40.5)));
    mark.style.transform = `scale(${lerp(0.55, 1, k).toFixed(4)}) rotate(${((1 - k) * -8).toFixed(2)}deg)`;
    enter(el.word, t, 40.6, { dy: 50, dur: 0.8 });
    enter(el.tag, t, 41.1, { dy: 30, dur: 0.8 });
    enter(el.cta, t, 41.7, { dy: 30, s0: 0.92, dur: 0.7 });
    el.cta.style.transform = `translateX(-50%) ${el.cta.style.transform}`;
    enter(el.team, t, 42.2, { dy: 20, dur: 0.7 });
  }

  // ---------- frame ----------
  function renderFrame(t) {
    t = clamp(t, 0, DUR - 1e-6);
    background(t);
    s1(t); s2(t); s3(t); s4(t); s5(t); s6(t); s7(t);
    el.fade.style.opacity = String(Math.max(1 - prog(t, 0, 0.35), E.inCubic(prog(t, 44.3, 45.0))));
    if (DEBUG) el.dbg.textContent = t.toFixed(2) + ' s';
  }

  // ---------- boot and playback ----------
  const q = new URLSearchParams(location.search);
  const DEBUG = q.has('debug');
  async function boot() {
    setup();
    if (DEBUG) el.dbg.style.display = 'block';
    await document.fonts.ready;
    await Promise.all([...document.images].map((im) => (im.decode ? im.decode().catch(() => {}) : 0)));
    window.renderFrame = renderFrame;
    window.FILM = { DUR, FPS };
    renderFrame(0);
    window.FLOODWAY_READY = true;
    if (q.has('render')) return;
    let t0 = performance.now() - 1000 * (parseFloat(q.get('t')) || 0), paused = false, held = 0;
    const tick = (now) => { if (!paused) renderFrame(((now - t0) / 1000) % DUR); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    addEventListener('keydown', (e) => {
      if (e.code === 'Space') { paused = !paused; if (paused) held = performance.now(); else t0 += performance.now() - held; }
      if (e.key === 'f' || e.key === 'F') document.documentElement.requestFullscreen?.();
    });
  }
  boot();
})();
