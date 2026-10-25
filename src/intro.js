// Intro / preloader overlay. While the pond loads: washi paper, the title, and an ensō brushed in with the loading
// progress. When the pond is ready, src/pond.js takes over the paper and two 3D koi swim in and circle inside the ensō
// (KOI_STAGE). A click inside the circle -- the user gesture that unlocks the music -- sends the koi off, ink ripples
// spread from the click and the pond dissolves the paper; this overlay removes itself when the stage is done.

const DPR = Math.min(2, window.devicePixelRatio || 1);
const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
const noise1 = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };

// ---- the ensō: one brush stroke drawn as a filled shape -- heavy where the brush lands, thinning out, the last third
// breaking into dry-brush streaks; ink edges displaced like the pond's painted layers, a faint wash bleeding around it ----
function ensoSVG() {
  const C = 100, Rr = 86, a0 = -Math.PI * .6, span = TAU * .92, N = 160;
  const at = u => { const a = a0 + span * u, r = Rr * (1 + .03 * Math.sin(u * 5.3 + .7) + .035 * u); return [C + Math.cos(a) * r, C + Math.sin(a) * r, a]; };
  const width = u => (u < .04 ? 5 + 5 * Math.sin(u / .04 * Math.PI / 2) : 10 * (1 - .72 * Math.pow((u - .04) / .96, 1.1))) * (.85 + .3 * noise1(u * 14 + 3));
  const shape = (u0, u1) => {
    const L = [], Rt = [];
    for (let i = 0; i <= N; i++) { const u = lerp(u0, u1, i / N), [x, y, a] = at(u), w = width(u) / 2; L.push([x + Math.cos(a) * w, y + Math.sin(a) * w]); Rt.push([x - Math.cos(a) * w, y - Math.sin(a) * w]); }
    return 'M' + L.concat(Rt.reverse()).map(p => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join('L') + 'Z';
  };
  const spine = 'M' + Array.from({ length: N + 1 }, (_, i) => at(i / N)).map(p => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join('L');
  const [bx, by] = at(0);
  return `<svg class="enso" viewBox="0 0 200 200">
    <defs>
      <filter id="inkEdge" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="3" seed="4" result="t"/>
        <feDisplacementMap in="SourceGraphic" in2="t" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="inkDry" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency=".9 .06" numOctaves="2" seed="11" result="t"/>
        <feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4.4 0 0 0 -1.7" result="m"/>
        <feComposite in="SourceGraphic" in2="m" operator="in" result="c"/>
        <feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="5" result="t2"/>
        <feDisplacementMap in="c" in2="t2" scale="3" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="inkWash" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>
      <radialGradient id="inkBlot"><stop offset="0" stop-color="#151413" stop-opacity=".55"/><stop offset="1" stop-color="#151413" stop-opacity="0"/></radialGradient>
      <mask id="ensoReveal" maskUnits="userSpaceOnUse" x="-20" y="-20" width="240" height="240">
        <path class="reveal" d="${spine}" fill="none" stroke="#fff" stroke-width="34" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
      </mask>
    </defs>
    <g mask="url(#ensoReveal)">
      <path d="${shape(0, 1)}" fill="#1a1917" opacity=".13" filter="url(#inkWash)" transform="translate(1.2,1.6)"/>
      <path d="${shape(0, .7)}" fill="#171614" opacity=".9" filter="url(#inkEdge)"/>
      <path d="${shape(.58, 1)}" fill="#171614" opacity=".88" filter="url(#inkDry)"/>
      <circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="9" fill="url(#inkBlot)"/>
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
let state = 'loading', last = performance.now(), progress = 0, arrived = false, paperA = 1;
let ready = !!window.KOI_READY;
document.addEventListener('koi:ready', () => { ready = true; });
document.addEventListener('koi:circle', () => { arrived = true; });
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
  // loading progress: creeps towards 90% while loading, completes once the pond is ready
  progress = ready ? Math.min(1, progress + dt * .7) : Math.min(.9, progress + dt * .11 * (1 - progress));
  reveal.setAttribute('stroke-dashoffset', (1 - ease(progress)).toFixed(4));
  // the seal invites a click once both koi have swum into the circle
  if (state === 'loading' && arrived && progress >= 1) { state = 'ready'; root.classList.add('ready'); }
  // once the pond draws the paper (and the koi), this sheet fades away
  if (ready) paperA = Math.max(0, paperA - dt / .8);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (paperA > 0) { ctx.globalAlpha = paperA; ctx.drawImage(window.KOI_PAPER, 0, 0, W, H); ctx.globalAlpha = 1; }
  drawRipples(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
