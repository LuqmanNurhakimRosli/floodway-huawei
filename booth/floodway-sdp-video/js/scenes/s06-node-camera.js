// Scene 6, river node and street camera, LUQMAN. timing.json lands each segment on his sentences.
//  A  0 to 11.5   3D turntable of the RiverNode GLB with callouts
//  B  11.5 to 23  side elevation: beam cone, h = H - d, temperature correction, LoRa every 5 min, solar
//  C  23 to 30    3D exploded view of the enclosure, labelled "design", pilot units after Top 10
//  D  30 to 45    sample street-camera frame: water line, two readings before the level changes
// Geometry and example levels come from blueprint S2; camera lines come from backend sample_media/calibration.json.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { el, svgEl, show, lerp, clamp, prog, eio, eout, ease, wavePath, waterPath, draw, icon, chapter, animChapter } from '../lib.js';

const SEG = { bIn: 11.4, cIn: 22.8, dIn: 29.7 };
// sample-smart-tunnel calibration (fractions of frame height); bed = lowest ROI corner
const CAL = { roi: [[0.202, 0.44], [0.78, 0.44], [0.828, 0.94], [0.158, 0.94]], normal: 0.82, warning: 0.65, danger: 0.48, bed: 0.94 };
const SPAN = CAL.bed - CAL.danger;
const ratioToY = (r) => CAL.bed - r * SPAN;   // frame fraction

export default {
  id: 's06', title: 'River node and street camera', dur: 45,
  async build(root) {
    root.classList.add('s6');
    const ch = chapter(root, '05', 'River node and street camera');

    // ── 3D ──
    const canvas = el('canvas', 's6-canvas', null, root);
    canvas.width = 1920; canvas.height = 1080;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(1920, 1080, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c8de, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(4, 6, 5);
    scene.add(key);
    const gltf = await new GLTFLoader().loadAsync('assets/3d/FloodWay_RiverNode_v1.glb');
    const model = gltf.scene;
    const pivot = new THREE.Group();
    pivot.add(model);
    scene.add(pivot);
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3()), c0 = box.getCenter(new THREE.Vector3());
    model.position.set(-c0.x, -box.min.y, -c0.z);           // stand on y = 0, centred in x and z
    // soft contact shadow under the mast foot (radial gradient texture)
    const sc = document.createElement('canvas');
    sc.width = sc.height = 128;
    const g2 = sc.getContext('2d'), grad = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(11,27,51,.30)'); grad.addColorStop(1, 'rgba(11,27,51,0)');
    g2.fillStyle = grad; g2.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    const mastC = new THREE.Box3().setFromObject(model.getObjectByName('Mast_GI_Pipe_2in')).getCenter(new THREE.Vector3());
    shadow.position.set(mastC.x, 0.002, mastC.z);            // under the mast foot; turns with the model
    pivot.add(shadow);
    const camera = new THREE.PerspectiveCamera(26, 1920 / 1080, 0.05, 100);
    const part = (n) => model.getObjectByName(n);
    const centreOf = (o) => new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());

    // explode: the lid and the inside parts move out along the lid's direction
    const enclosure = part('Enclosure_IP65_200x150x100');
    pivot.rotation.y = 0;
    pivot.updateMatrixWorld(true);
    const encC = model.worldToLocal(centreOf(enclosure));
    const lidDir = model.worldToLocal(centreOf(part('Enclosure_Lid'))).sub(encC).normalize();
    const INSIDE = ['Enclosure_Lid', 'Enclosure_Hood', 'Board_ESP32_LoRa_Heltec_V3', 'Battery_LiFePO4_32700', 'Charger_MPPT_CN3791',
      'BuckBoost_3V3_and_Boost_5V', 'Terminal_Blocks_Fuse', 'Silica_Gel_Pack', 'Mount_Plate_Internal'];
    const moves = INSIDE.map((n, i) => {
      const o = part(n);
      const dist = n === 'Enclosure_Hood' ? 0.42 : n === 'Enclosure_Lid' ? 0.34 : 0.12 + 0.045 * i;
      const side = new THREE.Vector3(0, 1, 0).multiplyScalar((i % 3 - 1) * 0.05);
      return { o, base: o.position.clone(), off: lidDir.clone().multiplyScalar(dist).add(side) };
    }).filter((m) => m.o);

    // segment C: turn the model so the lid faces 50 degrees left of the camera, and the parts slide out sideways
    const CAM_AZ_C = 0.35;
    const ROT_C = (CAM_AZ_C - 0.87) - Math.atan2(lidDir.x, lidDir.z);
    const camPose = (az, dist, ty, tx = 0, tz = 0, el = 0.28) => {
      camera.position.set(tx + Math.sin(az) * dist * Math.cos(el), ty + Math.sin(el) * dist, tz + Math.cos(az) * dist * Math.cos(el));
      camera.lookAt(tx, ty, tz);
    };
    const project = (o) => {
      const v = centreOf(o).project(camera);
      return { x: (v.x + 1) / 2 * 1920, y: (1 - v.y) / 2 * 1080 };
    };

    // callouts over the 3D view (segment A) and the exploded view (segment C)
    const callSvg = svgEl('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080, class: 'abs s6-callsvg' }, root);
    const mkCall = (name, title, sub, lx, ly) => {
      const line = svgEl('path', { fill: 'none', stroke: '#1677FF', 'stroke-width': 2.5 }, callSvg);
      const dot = svgEl('circle', { r: 7, fill: '#fff', stroke: '#1677FF', 'stroke-width': 3 }, callSvg);
      const lab = el('div', 's6-call', `<b>${title}</b><span>${sub}</span>`, root);
      return { name, line, dot, lab, lx, ly };
    };
    const callsA = [
      mkCall('Sensor_A02YYUW_Ultrasonic', 'Ultrasonic sensor', 'points down at the water', 1050, 700),
      mkCall('Solar_Panel_6V6W_Cells', 'Solar panel', '6 V 6 W', 210, 200),
      mkCall('Antenna_923MHz_3dBi', 'LoRa antenna', '923 MHz radio', 210, 380),
      mkCall('Enclosure_IP65_200x150x100', 'IP65 enclosure', 'controller and battery', 210, 560),
      mkCall('Beacon_Dome_RGB', 'Warning beacon', 'green, amber, red', 1010, 150),
      mkCall('RainGauge_Body_rPETG', 'Rain gauge', '0.2 mm per tip', 1050, 330),
    ];
    const TA = [3.2, 4.4, 5.4, 6.3, 7.2, 8.1];
    // exploded-view labels sit beside their part (offset from the projected point)
    const callsC = [
      mkCall('Board_ESP32_LoRa_Heltec_V3', 'ESP32 LoRa board', 'reads, decides, sends', 0, 0),
      mkCall('Battery_LiFePO4_32700', 'LiFePO4 battery', '3.2 V, 6 Ah', 0, 0),
      mkCall('Charger_MPPT_CN3791', 'Solar charger', 'MPPT', 0, 0),
    ];
    const OFF_C = [[-330, -150], [-360, 40], [140, 90]];
    const TC = [24.6, 25.2, 25.8];

    // segment A text
    const aText = el('div', 's6-atext', `
      <div class="label">Factor · river node</div>
      <div class="h2">Measures the river<br>from the bridge</div>
      <div class="s6-chips"><span class="pill">A02YYUW ultrasonic · 3 to 450 cm</span><span class="pill">LoRa 923 MHz</span><span class="pill">Solar, LiFePO4 battery</span></div>`, root);
    const aChips = [...aText.querySelectorAll('.pill')];

    // ── segment B: side elevation (light blueprint) ──
    // layout, left to right: river 120..1040 (deck, node, gauge), level labels 1056.., H dimension 1250, formulas 1450..
    const PXM = 150, SY = 352, BED = 929, SX = 560, RX0 = 120, RX1 = 1040;   // px per metre, sensor face y, bed y (H = 3.845 m), sensor x
    const lv = (m) => BED - m * PXM;
    const DECK = SY + 1.25 * PXM, MTOP = DECK - 2.65 * PXM, ARM = DECK - 1.35 * PXM;   // from blueprint S2
    const LV = [['Normal', 1.10, '#16A34A'], ['Advisory', 1.60, '#CA8A04'], ['Warning', 1.90, '#EA580C'], ['Danger', 2.15, '#DC2626']];
    const B = el('div', 's6-b', '', root);
    const bs = svgEl('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080, class: 'abs' }, B);
    bs.innerHTML = `
      <defs><pattern id="s6hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V14" stroke="#B9C7DA" stroke-width="2"/></pattern>
        <linearGradient id="s6wat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FA8FF" stop-opacity=".55"/><stop offset="1" stop-color="#1677FF" stop-opacity=".35"/></linearGradient></defs>
      <rect x="${RX0}" y="${BED}" width="${RX1 - RX0}" height="40" fill="url(#s6hatch)" stroke="#9FB1C8" stroke-width="2"/>
      <text x="${(RX0 + RX1) / 2}" y="${BED + 68}" text-anchor="middle" class="s6-svgcap">CHANNEL BED</text>
      <rect x="${RX0}" y="${DECK}" width="210" height="56" fill="url(#s6hatch)" stroke="#9FB1C8" stroke-width="2"/>
      <text x="${RX0}" y="${DECK - 12}" class="s6-svgcap">BRIDGE DECK</text>`;
    const water = svgEl('path', { fill: 'url(#s6wat)' }, bs);
    const waterTop = svgEl('path', { fill: 'none', stroke: '#1677FF', 'stroke-width': 3 }, bs);
    const levelG = svgEl('g', {}, bs);
    levelG.innerHTML = LV.map(([n, m, c]) => `<path d="M${RX0} ${lv(m)} H${RX1}" stroke="${c}" stroke-width="2.5" stroke-dasharray="10 9"/>
      <text x="${RX1 + 16}" y="${lv(m) + 7}" class="s6-lv" fill="${c}">${n} ${m.toFixed(2)} m</text>`).join('')
      + `<text x="${RX1 + 16}" y="${lv(2.15) - 36}" class="s6-svgcap">EXAMPLE MARKS</text>`;
    const gauge = svgEl('g', {}, bs);
    gauge.innerHTML = `<rect x="900" y="${lv(2.6)}" width="18" height="${BED - lv(2.6)}" fill="#fff" stroke="#9FB1C8" stroke-width="2"/>`
      + Array.from({ length: 14 }, (_, i) => `<path d="M900 ${lv(i * 0.2)} h${i % 5 ? 8 : 14}" stroke="#4A5B73" stroke-width="2"/>`).join('')
      + `<text x="928" y="${lv(2.6) + 4}" class="s6-svgcap">STAFF GAUGE</text>`;
    // the node: mast on the deck, arm over the river, sensor at the arm end
    const node = svgEl('g', {}, bs);
    node.innerHTML = `
      <rect x="284" y="${MTOP}" width="12" height="${DECK - MTOP}" fill="#8A9BB2"/>
      <path d="M290 ${ARM} H${SX + 10}" stroke="#8A9BB2" stroke-width="12"/><path d="M290 ${ARM + 116} L430 ${ARM + 6}" stroke="#8A9BB2" stroke-width="6"/>
      <rect x="${SX - 22}" y="${SY - 30}" width="44" height="30" rx="6" fill="#1677FF"/>
      <rect x="304" y="${ARM - 84}" width="70" height="56" rx="6" fill="#fff" stroke="#8A9BB2" stroke-width="3"/>
      <path d="M316 ${ARM - 88} l0 -46" stroke="#4A5B73" stroke-width="4"/>
      <rect x="216" y="${MTOP + 30}" width="68" height="12" fill="#0E3A7A" transform="rotate(-15 250 ${MTOP + 36})"/>
      <circle cx="290" cy="${MTOP - 10}" r="13" fill="#16A34A"/>`;
    const RADIO = [316, ARM - 134];
    const beam = svgEl('path', { fill: '#1677FF', opacity: 0.14 }, bs);
    const beamEdges = svgEl('path', { fill: 'none', stroke: '#1677FF', 'stroke-width': 2, 'stroke-dasharray': '6 8', opacity: 0.7 }, bs);
    const pings = Array.from({ length: 4 }, () => svgEl('path', { fill: 'none', stroke: '#1677FF', 'stroke-width': 3 }, bs));
    const dims = svgEl('g', {}, bs);
    const dimH = svgEl('path', { stroke: '#071426', 'stroke-width': 2.5, fill: 'none' }, dims);
    const dimD = svgEl('path', { stroke: '#1677FF', 'stroke-width': 3, fill: 'none' }, dims);
    const dimh = svgEl('path', { stroke: '#16A34A', 'stroke-width': 3, fill: 'none' }, dims);
    const labH = el('div', 's6-dim', '<b>H</b> sensor to bed, surveyed', B);
    const labD = el('div', 's6-dim d', '<b>d</b> measured distance', B);
    const labh = el('div', 's6-dim h', '<b>h</b> river height', B);
    const radio = Array.from({ length: 3 }, () => svgEl('path', { fill: 'none', stroke: '#1677FF', 'stroke-width': 3, 'stroke-linecap': 'round' }, bs));
    const gw = el('div', 's6-gw', `${icon('signal', 40, '#003EB3')}<div><b>Gateway</b><span>guardhouse</span></div>`, B);
    const sunI = el('div', 's6-sun', icon('sun', 64, '#EAB308', 2.4), B);
    const fx = el('div', 's6-fx', `
      <div class="label">How it measures</div>
      <div class="s6-f big">h = H − d</div>
      <div class="s6-f">d = c × t ÷ 2</div>
      <div class="s6-fc">echo time t, out and back</div>
      <div class="s6-f">c = 331.3 + 0.606 × T</div>
      <div class="s6-fc">speed of sound at air temperature T</div>
      <div class="s6-fl">${icon('signal', 30, '#1677FF')}<span>LoRa radio, every 5 minutes</span></div>
      <div class="s6-fl">${icon('solar', 30, '#1677FF')}<span>Solar panel and LiFePO4 battery</span></div>`, B);
    const fxRows = [...fx.children];

    // ── segment C extras ──
    const stamp = el('div', 's6-stamp', 'Design · river node', root);
    const top10 = el('div', 's6-top10', `${icon('check', 30, '#fff', 3)}<span>Top 10: we build pilot units</span>`, root);
    const sheets = el('div', 's6-sheets', `<img src="assets/blueprints/S1.jpg" alt=""><img src="assets/blueprints/S4.jpg" alt=""><div class="small">8 blueprint sheets drawn</div>`, root);

    // ── segment D: street camera ──
    const D = el('div', 's6-d', '', root);
    const FW = 1104, FH = 621;
    const frame = el('div', 's6-frame', '', D);
    const imgs = ['r020', 'r040', 'r070'].map((r) => { const im = el('img', 's6-cam', null, frame); im.src = `assets/cams/smart-${r}.webp`; return im; });
    const fs = svgEl('svg', { viewBox: `0 0 ${FW} ${FH}`, width: FW, height: FH, class: 'abs' }, frame);
    const P = (x, y) => `${(x * FW).toFixed(1)},${(y * FH).toFixed(1)}`;
    fs.innerHTML = `<polygon points="${CAL.roi.map(([x, y]) => P(x, y)).join(' ')}" fill="#1677FF" fill-opacity=".08" stroke="#8EC1FF" stroke-width="2.5" stroke-dasharray="9 7"/>`;
    const roiX = (y) => {                                     // left and right edge of the zone at frame height y
      const k = (y - 0.44) / (0.94 - 0.44);
      return [lerp(0.202, 0.158, k), lerp(0.78, 0.828, k)];
    };
    const lineAt = (y, color, label) => {
      const [a, b] = roiX(y);
      svgEl('path', { d: `M${a * FW} ${y * FH} H${b * FW}`, stroke: color, 'stroke-width': 3, 'stroke-dasharray': '12 8' }, fs);
      const t = el('div', 's6-line', label, frame);
      t.style.cssText = `left:${b * FW + 10}px;top:${y * FH - 15}px;background:${color}`;
    };
    lineAt(CAL.normal, '#16A34A', 'Normal line');
    lineAt(CAL.warning, '#EA580C', 'Warning line');
    lineAt(CAL.danger, '#DC2626', 'Danger line');
    const wl = svgEl('path', { stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round' }, fs);
    const wlGlow = svgEl('path', { stroke: '#1677FF', 'stroke-width': 13, 'stroke-linecap': 'round', opacity: 0.55 }, fs);
    fs.insertBefore(wlGlow, wl);
    el('div', 's6-hud', '<span class="rec"></span>CAM · underpass culvert', frame);
    const clock = el('div', 's6-clock num', '', frame);
    const dPanel = el('div', 's6-dpanel', `
      <div class="label">Factor · street camera</div>
      <div class="h2">Finds the water line</div>
      <div class="small">Lines are drawn on the camera view once, at installation.</div>
      <div class="s6-read"><span class="num" id="s6ratio">20%</span><small>of bank height</small></div>
      <div class="s6-level"><i></i><b id="s6lvl">NORMAL</b></div>
      <div class="s6-rd r1">${icon('hold', 34, '#B45309')}<div><b>Reading 1: above the warning line</b><span>Held. A level needs two readings.</span></div></div>
      <div class="s6-rd r2">${icon('check', 34, '#15803D', 3)}<div><b>Reading 2: still above</b><span>Now the level changes to Warning.</span></div></div>`, D);
    const ratioEl = dPanel.querySelector('#s6ratio'), lvlEl = dPanel.querySelector('#s6lvl'), lvlBox = dPanel.querySelector('.s6-level');
    const [dl0, dh0, ds0, dread, dlvl, rd1, rd2] = [...dPanel.children];

    return {
      cues: [[0.4, 'whoosh'], [2.6, 'water', { dur: 8 }], ...TA.map((t) => [t, 'tick']), [12.6, 'sonar'], [13.5, 'sonar'], [14.4, 'sonar'],
        [17.2, 'radio'], [20.2, 'chime', { notes: [79] }], [24.0, 'click'], [24.2, 'click2'], [27.0, 'stamp'], [32.8, 'tick'], [35.2, 'tick'],
        [36.0, 'hold'], [38.3, 'chime', { notes: [74, 81] }], [44.3, 'whoosh']].map(([t, kind, o]) => ({ t, kind, ...(o || {}) })),
      frame(t) {
        animChapter(ch, t, 45);

        // ── 3D: visible in A and C ──
        const aOn = 1 - eio(t, SEG.bIn, SEG.bIn + 0.6);
        const cOn = eio(t, SEG.cIn, SEG.cIn + 0.6) * (1 - eio(t, SEG.dIn, SEG.dIn + 0.6));
        const vis3d = Math.max(t < SEG.cIn ? aOn : 0, cOn) * eout(t, 0, 0.5);
        canvas.style.opacity = vis3d.toFixed(3);
        if (vis3d > 0.001) {
          const inC = t >= SEG.cIn - 0.2;
          // A: turn, settle for the callouts, turn again; C: closer on the enclosure, then explode
          const spinA = 0.62 * Math.min(t, 2.6) + 0.62 * 0.7 * ease.out(prog(t, 2.6, 3.3)) + 0.15 * eio(t, 9.6, 11.4);
          pivot.rotation.y = inC ? ROT_C + 0.1 * eio(t, SEG.cIn, 29.5) : -1.7 + spinA;
          for (const m of moves) m.o.position.copy(m.base);
          pivot.updateMatrixWorld(true);
          const ec = centreOf(enclosure);                         // the closed enclosure's centre: the camera target in C
          for (const m of moves) m.o.position.copy(m.base).addScaledVector(m.off, inC ? eio(t, 24.0, 25.0) : 0);
          pivot.updateMatrixWorld(true);
          if (inC) {
            const k = eio(t, SEG.cIn, SEG.cIn + 1.0);
            // aim between the closed box and where the lid ends up, so the exploded group sits mid-frame
            const lw = lidDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), pivot.rotation.y);
            const tgt = ec.clone().addScaledVector(lw, 0.16 * eio(t, 23.6, 25.0));
            camPose(CAM_AZ_C, lerp(size.y * 3.1, 1.75, k), lerp(size.y * 0.52, tgt.y + 0.06, k), lerp(0, tgt.x, k), lerp(0, tgt.z, k), 0.22);
            camera.setViewOffset(1920, 1080, 60, 0, 1920, 1080);
          } else {
            camPose(0.25, size.y * 3.1, size.y * 0.52);
            camera.setViewOffset(1920, 1080, 300, 0, 1920, 1080);
          }
          renderer.render(scene, camera);
        }
        // callouts
        const placeCalls = (calls, times, tEnd, on, offs) => calls.forEach((cl, i) => {
          const op = on ? show(cl.lab, t, times[i], { d: 0.35, y: 10, tout: tEnd, dout: 0.3 }) : (cl.lab.style.opacity = 0, 0);
          const p = project(part(cl.name));
          if (offs) { cl.lx = Math.round(p.x + offs[i][0]); cl.ly = Math.round(p.y + offs[i][1]); }
          const ex = cl.lx < p.x ? cl.lx + cl.lab.offsetWidth + 8 : cl.lx - 8, ey = cl.ly + 30;
          cl.line.setAttribute('d', `M${p.x.toFixed(1)} ${p.y.toFixed(1)} L${ex} ${ey}`);
          cl.line.setAttribute('opacity', op.toFixed(3));
          cl.dot.setAttribute('cx', p.x.toFixed(1)); cl.dot.setAttribute('cy', p.y.toFixed(1));
          cl.dot.setAttribute('opacity', op.toFixed(3));
          cl.lab.style.left = cl.lx + 'px'; cl.lab.style.top = cl.ly + 'px';
        });
        placeCalls(callsA, TA, 10.4, t < SEG.cIn);
        placeCalls(callsC, TC, 29.4, t >= SEG.cIn, OFF_C);
        show(aText.children[0], t, 1.0, { tout: 10.6 });
        show(aText.children[1], t, 1.3, { tout: 10.6 });
        aChips.forEach((n, i) => show(n, t, 8.8 + i * 0.35, { d: 0.35, y: 12, tout: 10.6 }));

        // ── B ──
        const bOn = eio(t, SEG.bIn, SEG.bIn + 0.6) * (1 - eio(t, SEG.cIn - 0.3, SEG.cIn + 0.3));
        B.style.opacity = bOn.toFixed(3);
        B.style.visibility = bOn > 0.001 ? 'visible' : 'hidden';
        if (bOn > 0.001) {
          const wm = 1.45 + 0.05 * Math.sin(t * 1.3), wy = lv(wm);
          water.setAttribute('d', waterPath(RX0 + 4, RX1 - 4, wy, BED, 6, 180, t * 2));
          waterTop.setAttribute('d', wavePath(RX0 + 4, RX1 - 4, wy, 6, 180, t * 2));
          const pb = eout(t, 12.2, 12.9), half = (wy - SY) * Math.tan(Math.PI / 6) * pb;
          beam.setAttribute('d', `M${SX} ${SY} L${SX - half} ${SY + (wy - SY) * pb} L${SX + half} ${SY + (wy - SY) * pb} Z`);
          beamEdges.setAttribute('d', `M${SX - half} ${SY + (wy - SY) * pb} L${SX} ${SY} L${SX + half} ${SY + (wy - SY) * pb}`);
          pings.forEach((pg, i) => {
            const ph = ((t - 12.6) * 1.1 + i / pings.length) % 1;
            const r = ph * (wy - SY), on = t > 12.6 && t < 22 ? 1 : 0;
            const a = Math.PI / 6;
            pg.setAttribute('d', `M${SX - r * Math.sin(a)} ${SY + r * Math.cos(a)} A${r} ${r} 0 0 0 ${SX + r * Math.sin(a)} ${SY + r * Math.cos(a)}`);
            pg.setAttribute('opacity', (on * (1 - ph) * 0.8).toFixed(3));
          });
          const pd = eout(t, 13.4, 14.2);
          dimH.setAttribute('d', `M1250 ${SY} V${BED} M1238 ${SY} h24 M1238 ${BED} h24`);
          dimH.setAttribute('opacity', pd.toFixed(3));
          dimD.setAttribute('d', `M${SX} ${SY} V${wy} M${SX - 12} ${wy} h24`);
          dimD.setAttribute('opacity', eout(t, 13.0, 13.6).toFixed(3));
          dimh.setAttribute('d', `M${SX} ${wy} V${BED} M${SX - 12} ${BED} h24`);
          dimh.setAttribute('opacity', eout(t, 13.8, 14.4).toFixed(3));
          show(labH, t, 13.4, { d: 0.4, y: 0, x: 12 });
          labH.style.top = (SY + BED) / 2 - 30 + 'px';
          show(labD, t, 13.0, { d: 0.4, y: 0, x: 12 });
          labD.style.top = (SY + wy) / 2 - 20 + 'px';
          show(labh, t, 13.8, { d: 0.4, y: 0, x: 12 });
          labh.style.top = (wy + BED) / 2 - 20 + 'px';
          fxRows.forEach((n, i) => show(n, t, [12.4, 14.6, 15.6, 15.9, 16.4, 16.7, 17.6, 20.4][i], { d: 0.4, y: 14 }));
          radio.forEach((r, i) => {
            const ph = ((t - 17.2) * 0.9 + i / 3) % 1, on = t > 17.2 ? 1 : 0, rr = 30 + ph * 160;
            const [ox, oy] = RADIO;
            r.setAttribute('d', `M${ox + rr * Math.cos(-0.9)} ${oy + rr * Math.sin(-0.9)} A${rr} ${rr} 0 0 1 ${ox + rr * Math.cos(0.15)} ${oy + rr * Math.sin(0.15)}`);
            r.setAttribute('opacity', (on * (1 - ph)).toFixed(3));
          });
          show(gw, t, 17.6, { d: 0.4, y: 10 });
          const sp = show(sunI, t, 20.4, { d: 0.5, y: 0, s: 0.6 });
          sunI.style.transform += ` rotate(${(t * 20).toFixed(1)}deg)`;
          sunI.style.opacity = sp.toFixed(3);
        }

        // ── C extras ──
        show(stamp, t, 26.6, { d: 0.3, y: 0, s: 1.25, tout: 29.6 });
        show(top10, t, 27.8, { d: 0.4, y: 16, tout: 29.6 });
        show(sheets, t, 26.0, { d: 0.5, x: 60, y: 0, tout: 29.6 });

        // ── D ──
        const dOn = eio(t, SEG.dIn, SEG.dIn + 0.6) * (1 - eio(t, 44.4, 45));
        D.style.opacity = dOn.toFixed(3);
        D.style.visibility = dOn > 0.001 ? 'visible' : 'hidden';
        if (dOn > 0.001) {
          imgs[0].style.opacity = 1;
          imgs[1].style.opacity = eio(t, 32.6, 33.0).toFixed(3);
          imgs[2].style.opacity = eio(t, 35.0, 35.4).toFixed(3);
          const r = lerp(lerp(0.2, 0.4, eio(t, 32.6, 33.2)), 0.7, eio(t, 35.0, 35.6));
          const y = ratioToY(r), [a, b] = roiX(y);
          const d = `M${(a * FW).toFixed(1)} ${(y * FH).toFixed(1)} H${(b * FW).toFixed(1)}`;
          wl.setAttribute('d', d); wlGlow.setAttribute('d', d);
          const s = 10 + Math.floor(Math.max(0, t - SEG.dIn));
          clock.textContent = `18:42:${String(s % 60).padStart(2, '0')}`;
          [dl0, dh0, ds0].forEach((n, i) => show(n, t, 30.2 + i * 0.25));
          show(dread, t, 31.0); show(dlvl, t, 31.2);
          ratioEl.textContent = `${Math.round(r * 100)}%`;
          const level = t >= 38.3 ? ['WARNING', '#F97316'] : r >= 0.26 ? ['ADVISORY', '#EAB308'] : ['NORMAL', '#16A34A'];
          lvlEl.textContent = level[0];
          lvlBox.style.setProperty('--c', level[1]);
          show(rd1, t, 36.0, { d: 0.4, x: 24, y: 0 });
          show(rd2, t, 38.3, { d: 0.4, x: 24, y: 0 });
        }
      },
    };
  },
};
