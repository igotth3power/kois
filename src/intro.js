// Intro / preloader overlay. While the pond loads: washi paper and the title. When the pond is ready, src/pond.js takes
// over the paper and two 3D koi swim in and circle (KOI_STAGE); the ensō is brushed in around them as they swim their
// first lap, closing as they complete it. A click inside the circle -- the user gesture that unlocks the music -- sends the koi off, ink ripples
// spread from the click and the pond dissolves the paper; this overlay removes itself when the stage is done.

const DPR = Math.min(2, window.devicePixelRatio || 1);
const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
const noise1 = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };

// ---- the ensō: one brush stroke, painted bristle by bristle onto a canvas and shown inside the SVG, where the loading
// mask brushes it in. The brush lands pressed and ragged at lower left, runs full and dark up the left side, thins
// over the top while its inner bristles run dry first and split into streaks, and ends in a few dry threads ----
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const ENSO_A0 = Math.PI * .66, ENSO_SPAN = TAU * .985;   // starts at lower left, goes up the left side (clockwise)
const ensoAt = u => { const a = ENSO_A0 + ENSO_SPAN * u, r = 84 * (1 + .016 * Math.sin(u * 6.3 + 1.1) - .025 * u); return [100 + Math.cos(a) * r, 100 + Math.sin(a) * r, a]; };
const ensoWidth = u => 22 * (1 - .7 * Math.pow(smooth(.22, 1, u), .8)) * (.9 + .2 * noise1(u * 9 + 2));

function ensoBitmap(size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.scale(size / 200, size / 200);
  g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#141311';
  let seed = 7; const rnd = () => hash(seed++ * 1.37);
  const B = 120, N = 520;
  for (let b = 0; b < B + 16; b++) {
    // the last 16 are short, heavy strokes just past the brush edges: the lumpy pool of ink where the brush landed
    const land = b >= B, o = land ? (rnd() < .5 ? -1 : 1) * (.9 + rnd() * .3) : (b + rnd()) / B * 2 - 1;   // -1 inner edge, +1 outer
    const inner = Math.min(1, Math.max(0, (1 - o) / 2));
    const thick = land ? 3 + rnd() * 3 : .8 + rnd() * .8;
    const start = land ? rnd() * .006 : rnd() * .008 + inner * rnd() * .01;           // ragged landing edge
    const end = land ? .01 + rnd() * .035 : Math.min(1, .55 + rnd() * .5 + (1 - inner) * .15);   // where it runs out of ink
    const freq = 12 + rnd() * 30, ph = rnd() * 100, ph2 = rnd() * 100;
    let prev = null, run = 0;
    const flush = () => { if (run) g.stroke(); run = 0; };
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const edge = Math.pow(Math.abs(o), 6), dry = Math.min(1.2, smooth(.12, 1, u) * (.4 + .9 * inner) + .22 * edge);   // inner bristles dry out first, the edges break up
      if (u < start || u > end || noise1(u * freq + ph) < dry * .85 - .08) { flush(); prev = null; continue; }
      const w = ensoWidth(u), [x, y, a] = ensoAt(u);
      const off = (o * (1 + .25 * dry) + (noise1(u * (3 + 9 * edge) + ph2) - .5) * (.16 + .22 * edge)) * w / 2;   // the brush splays as it dries
      const p = [x + Math.cos(a) * off, y + Math.sin(a) * off];
      if (!run) {
        if (!prev) { prev = p; continue; }
        g.lineWidth = Math.max(.3, w / B * 3 * thick * (1 - .55 * dry) * Math.min(1, (end - u) / .05 + .3));
        g.beginPath(); g.moveTo(prev[0], prev[1]);
      }
      g.lineTo(p[0], p[1]); prev = p;
      if (++run >= 6) flush();
    }
    flush();
  }
  // flyaway hairs and flecks just off the edges
  for (let i = 0; i < 22; i++) {
    const u0 = .05 + rnd() * .9, len = .003 + rnd() * .01, side = rnd() < .6 ? 1 : -1, d = .3 + rnd() * 1.6;
    g.lineWidth = .15 + rnd() * .2; g.beginPath();
    for (let j = 0; j <= 6; j++) {
      const u = u0 + len * j / 6, [x, y, a] = ensoAt(u), off = side * (ensoWidth(u) / 2 + d);
      g[j ? 'lineTo' : 'moveTo'](x + Math.cos(a) * off, y + Math.sin(a) * off);
    }
    g.stroke();
  }
  return c;
}

function ensoSVG() {
  const spine = 'M' + Array.from({ length: 161 }, (_, i) => ensoAt(i / 160)).map(p => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join('L');
  return `<svg class="enso" viewBox="0 0 200 200">
    <defs>
      <filter id="inkWash" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.6"/></filter>
      <mask id="ensoReveal" maskUnits="userSpaceOnUse" x="-20" y="-20" width="240" height="240">
        <path class="reveal" d="${spine}" fill="none" stroke="#fff" stroke-width="40" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
      </mask>
    </defs>
    <g mask="url(#ensoReveal)">
      <image class="enso-ink" width="200" height="200" opacity=".14" filter="url(#inkWash)" transform="translate(1.2,1.6)"/>
      <image class="enso-ink" width="200" height="200" opacity=".93"/>
    </g>
  </svg>`;
}

// ---- DOM ----
const root = document.createElement('div');
root.id = 'intro';
root.innerHTML = `<canvas></canvas>${ensoSVG()}<div class="seal">鯉</div><div class="title"><span class="jp">墨池の鯉</span><span class="en">Ink-Wash Koi Pond</span></div>`;
const css = document.createElement('style');
css.textContent = `
  #intro { position: fixed; inset: 0; z-index: 20; cursor: default; user-select: none; }
  #intro canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  #intro .enso { position: absolute; left: 50%; top: 50%; width: var(--d); height: var(--d); transform: translate(-50%, -50%) rotate(-6deg); overflow: visible; pointer-events: none; transition: opacity .9s, transform 1.4s; }
  #intro .seal { position: absolute; left: 50%; top: 50%; width: 42px; height: 42px; margin: -21px 0 0 -21px; background: #b3281e; color: #f6eedd; border-radius: 4px;
    font: 28px/42px 'Yuji Syuku', 'Noto Serif JP', serif; text-align: center; transform: rotate(-6deg) scale(.3); opacity: 0;
    transition: opacity .7s, transform .7s cubic-bezier(.3, 1.6, .5, 1); pointer-events: none; box-shadow: inset 0 0 0 3px rgba(246, 238, 221, .28); }
  #intro.ready .seal { opacity: .88; transform: rotate(-6deg) scale(1); }
  #intro .title { position: absolute; left: 0; right: 0; top: calc(50% - var(--d) / 2 - 100px); display: flex; flex-direction: column; align-items: center; gap: 6px; color: #1b1b1a; opacity: 0; transform: translateY(8px); transition: opacity 1.6s .3s, transform 1.6s .3s; pointer-events: none; }
  #intro .jp { font: 400 clamp(30px, 4.4vw, 48px) 'Yuji Syuku', 'Noto Serif JP', serif; letter-spacing: .18em; padding-left: .18em; }
  #intro .en { font: 500 11px 'Noto Serif JP', Georgia, serif; letter-spacing: .5em; padding-left: .5em; text-transform: uppercase; opacity: .55; }
  #intro.shown .title { opacity: .9; transform: none; }
  #intro.ready.over { cursor: pointer; }
  #intro.leave .seal, #intro.leave .title { opacity: 0 !important; transition: opacity .5s; }
  #intro.leave .enso { opacity: 0; transform: translate(-50%, -50%) rotate(-6deg) scale(1.25); }`;
document.head.appendChild(css);
document.body.appendChild(root);
requestAnimationFrame(() => root.classList.add('shown'));
const reveal = root.querySelector('.reveal');
ensoBitmap(1200).toBlob(b => { const url = URL.createObjectURL(b); root.querySelectorAll('.enso-ink').forEach(im => im.setAttribute('href', url)); });

const cvs = root.querySelector('canvas'), ctx = cvs.getContext('2d');
let W = 0, H = 0, cx = 0, cy = 0, R = 0;
function layout() {
  W = innerWidth; H = innerHeight; cvs.width = W * DPR; cvs.height = H * DPR;
  cx = W / 2; cy = H / 2; R = Math.min(W, H) * .16;            // same circle as KOI_STAGE in src/pond.js
  root.style.setProperty('--d', `${R * 2.9}px`);
  window.KOI_PAPER = makePaper(W, H);                         // the pond draws this same sheet once it takes over
}
// washi: warm paper colour, soft fibres and a few faint stains
function makePaper(w, h) {
  const c = document.createElement('canvas'); c.width = w * DPR; c.height = h * DPR;
  const g = c.getContext('2d'); g.scale(DPR, DPR);
  const bg = g.createRadialGradient(w / 2, h * .45, 0, w / 2, h / 2, Math.hypot(w, h) * .62);
  bg.addColorStop(0, '#f3ecdd'); bg.addColorStop(1, '#dcd0b4'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1600; i++) {
    g.strokeStyle = `rgba(120, 100, 70, ${Math.random() * .055})`; g.lineWidth = Math.random() * 1.1;
    const x = Math.random() * w, y = Math.random() * h, a = Math.random() * TAU, l = 4 + Math.random() * 20;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 60 + Math.random() * 180, s = g.createRadialGradient(x, y, 0, x, y, r);
    s.addColorStop(0, 'rgba(90, 80, 60, .045)'); s.addColorStop(1, 'rgba(90, 80, 60, 0)'); g.fillStyle = s; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return c;
}
layout();
addEventListener('resize', layout);

// ---- ink ripples from the click: brushed rings, thicker and darker in places ----
const ripples = [];
function drawRipples(dt) {
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i]; r.t += dt; const u = r.t / r.life;
    if (u >= 1) { ripples.splice(i, 1); continue; }
    if (u < 0) continue;   // staggered: not started yet
    const rad = r.r0 + ease(u) * r.r1;
    ctx.lineCap = 'round';
    for (let s = 0; s < 48; s++) {
      const a0 = s / 48 * TAU, k = noise1(s * .6 + r.seed);
      ctx.strokeStyle = `rgba(25, 24, 22, ${(.1 + .28 * k) * (1 - u)})`; ctx.lineWidth = (.8 + 2.4 * k) * (1 - u * .7);
      ctx.beginPath(); ctx.arc(r.x, r.y, rad, a0, a0 + TAU / 48 * .85); ctx.stroke();
    }
  }
}

// ---- state ----
let state = 'loading', last = performance.now(), paperA = 1;
let ready = !!window.KOI_READY;
document.addEventListener('koi:ready', () => { ready = true; });
document.addEventListener('koi:stage-done', () => { root.remove(); css.remove(); document.body.classList.remove('intro'); });
document.body.classList.add('intro');
const inside = e => Math.hypot(e.clientX - cx, e.clientY - cy) < R * 1.45;
root.addEventListener('pointermove', e => root.classList.toggle('over', inside(e)));
root.addEventListener('pointerdown', e => {
  if (state !== 'ready' || !inside(e)) return;
  state = 'leave'; root.classList.add('leave');
  for (let i = 0; i < 4; i++) ripples.push({ x: e.clientX, y: e.clientY, t: -i * .2, life: 1.8, r0: 6, r1: R * (1.4 + i * .5), seed: i * 9.1 });
  window.KOI_MUSIC?.start?.();
  window.KOI_STAGE?.exit();
});

function frame(now) {
  if (!root.isConnected) return;
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  // the ensō keeps pace with the koi: brushed in over their first lap of the circle
  const lap = window.KOI_STAGE?.lap || 0;
  reveal.setAttribute('stroke-dashoffset', (1 - lap).toFixed(4));
  // the seal invites a click once the ensō has closed
  if (state === 'loading' && lap >= 1) { state = 'ready'; root.classList.add('ready'); }
  // once the pond draws the paper (and the koi), this sheet fades away
  if (ready) paperA = Math.max(0, paperA - dt / .8);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (paperA > 0) { ctx.globalAlpha = paperA; ctx.drawImage(window.KOI_PAPER, 0, 0, W, H); ctx.globalAlpha = 1; }
  drawRipples(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
