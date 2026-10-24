// Ink-wash koi pond · three.js r186
// Fish: "Koi Fish" by 7PLUS (CC BY 4.0) — sketchfab.com/3d-models/koi-fish-236859b809984f52b70c94fd040b9c59
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const Ink = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  let uid = 0;
  const R = (seed) => { let s = (seed * 9301 + 49297) % 233280; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };
  const E = (p, tag, a = {}) => { const e = document.createElementNS(NS, tag); for (const k in a) if (a[k] !== undefined && a[k] !== null) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  const G = (p, a = {}) => E(p, 'g', a);
  const f = (n) => (+n).toFixed(1);
  const FONT_BRUSH = "'Yuji Syuku','Noto Serif JP','Yu Mincho',serif";
  const FONT_SERIF = "'Noto Serif JP','Yu Mincho',serif";

  function smooth(pts) {
    const n = pts.length; let d = '';
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (i === 0) d += `M${f(p1[0])},${f(p1[1])}`;
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    return d + 'Z';
  }
  function blob(cx, cy, rx, ry, seed, amp = .18, n = 10) {
    const r = R(seed), pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * 6.2832, k = 1 + (r() - .5) * 2 * amp; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return smooth(pts);
  }
  const bez = (c, t) => { const [p0, p1, p2, p3] = c, u = 1 - t; return [u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]; };

  // Tapered brush stroke: thick at the press, thinning toward the end.
  function taperF(p, at, w, a = {}) {
    const N = 32, L = [], Rr = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, q = at(t), b = at(Math.min(1, t + .01)), c = at(Math.max(0, t - .01));
      let dx = b[0] - c[0], dy = b[1] - c[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const ww = w(t) / 2;
      L.push([q[0] - dy * ww, q[1] + dx * ww]); Rr.push([q[0] + dy * ww, q[1] - dx * ww]);
    }
    const pts = L.concat(Rr.reverse());
    return E(p, 'path', { d: 'M' + pts.map(q => f(q[0]) + ',' + f(q[1])).join('L') + 'Z', fill: '#141414', filter: 'url(#brush)', ...a });
  }
  const stroke = (p, c, w0, w1, a) => taperF(p, t => bez(c, t), t => (w0 + (w1 - w0) * t) * Math.min(1, .45 + t * 7), a);

  function branch(p, c, w0, w1, col = '#141414', snow = false) {
    stroke(p, c, w0 * 1.6, w1 * 1.6, { fill: col, opacity: .14, filter: 'url(#bleed)' });
    stroke(p, c, w0, w1, { fill: col, opacity: .92 });
    stroke(p, c, w0 * .9, w1 * .9, { fill: '#f3ecdc', opacity: .25, filter: 'url(#dry)' });
    if (snow) {
      const up = c.map(q => [q[0], q[1] - w0 * .45]);
      stroke(p, up, w0 * .55, w1 * .4, { fill: '#fbfaf6', opacity: .95, filter: 'url(#brushF)' });
    }
  }

  function paper(svg, W, H, o = {}) {
    E(svg, 'rect', { width: W, height: H, fill: o.col || '#eee4cf' });
    E(svg, 'rect', { width: W, height: H, fill: '#000', filter: 'url(#stain)', opacity: o.stain ?? .55 });
    E(svg, 'rect', { width: W, height: H, fill: '#000', filter: 'url(#paperTex)', opacity: o.tex ?? .55 });
    const r = R(o.seed || 1), g = G(svg, { stroke: o.fiber || '#fffaf0', fill: 'none', 'stroke-width': .6, opacity: .45 });
    for (let i = 0; i < W / 6; i++) {
      const x = r() * W, y = r() * H, a = r() * 6.28, l = 4 + r() * 12;
      E(g, 'path', { d: `M${f(x)},${f(y)}q${f(Math.cos(a) * l / 2 + 2)},${f(Math.sin(a) * l / 2)} ${f(Math.cos(a) * l)},${f(Math.sin(a) * l)}` });
    }
    const id = 'vg' + (uid++), d = E(svg, 'defs'), rg = E(d, 'radialGradient', { id, cx: .5, cy: .5, r: .75 });
    E(rg, 'stop', { offset: .55, 'stop-color': o.vigCol || '#3a2a10', 'stop-opacity': 0 });
    E(rg, 'stop', { offset: 1, 'stop-color': o.vigCol || '#3a2a10', 'stop-opacity': o.vig ?? .28 });
    E(svg, 'rect', { width: W, height: H, fill: `url(#${id})` });
  }

  function pond(p, cx, cy, rx, ry, seed, o = {}) {
    const d = blob(cx, cy, rx, ry, seed, o.amp ?? .14, o.n ?? 11);
    const col = o.water || '#1c1c1c';
    E(p, 'path', { d, fill: col, opacity: o.op ?? .1, filter: 'url(#bleed)' });
    E(p, 'path', { d: blob(cx + rx * .05, cy + ry * .08, rx * .72, ry * .68, seed + 3, .18, 9), fill: col, opacity: (o.op ?? .1) * .9, filter: 'url(#bleed)' });
    E(p, 'path', { d: blob(cx + rx * .08, cy + ry * .1, rx * .4, ry * .38, seed + 5, .2, 8), fill: col, opacity: (o.op ?? .1) * .7, filter: 'url(#bleed)' });
    E(p, 'path', { d, fill: 'none', stroke: o.rim || '#1a1a1a', 'stroke-width': 12, opacity: o.rimOp ?? .22, filter: 'url(#bleed)' });
    E(p, 'path', { d, fill: 'none', stroke: o.rim || '#151515', 'stroke-width': 1.6, opacity: .7, filter: 'url(#brush)', 'stroke-dasharray': '120 9 60 4 200 14 80 6' });
    return d;
  }

  function rock(p, x, y, s, seed, o = {}) {
    const r = R(seed), d = blob(x, y, s, s * .75, seed, .3, 7);
    E(p, 'path', { d, fill: o.col || '#2a2a2a', opacity: .3, filter: 'url(#bleed)' });
    E(p, 'path', { d, fill: o.col || '#1a1a1a', opacity: .85, filter: 'url(#dry)' });
    E(p, 'path', { d: blob(x - s * .15, y - s * .15, s * .45, s * .3, seed + 2, .3, 6), fill: o.hi || '#efe6d2', opacity: .35, filter: 'url(#brush)' });
    E(p, 'path', { d, fill: 'none', stroke: '#111', 'stroke-width': 1.7, filter: 'url(#brush)', opacity: .9 });
    for (let i = 0; i < 7; i++) {
      const a = r() * 6.28, k = .2 + r() * .7;
      E(p, 'circle', { cx: f(x + Math.cos(a) * s * k), cy: f(y + Math.sin(a) * s * .75 * k), r: f(.8 + r() * 1.8), fill: o.moss || '#0d0d0d', opacity: .9 });
    }
  }

  function ripple(p, x, y, r0, n = 3, o = {}) {
    const r = R(Math.round(x * 3 + y));
    for (let i = 0; i < n; i++) {
      const rr = r0 * (1 + i * .65), c = 6.283 * rr;
      E(p, 'ellipse', {
        cx: x, cy: y, rx: f(rr), ry: f(rr * .93), fill: 'none', stroke: o.col || '#1a1a1a',
        'stroke-width': f(Math.max(.4, (o.w || 1.4) - i * .35)), opacity: f((o.op ?? .55) * (1 - i * .27)),
        'stroke-dasharray': `${f(c * (.22 + r() * .3))} ${f(c * .05 + r() * 6)} ${f(c * .16)} ${f(c * .04)}`,
        'stroke-dashoffset': f(r() * c), filter: 'url(#brush)', 'stroke-linecap': 'round',
      });
    }
  }

  const KOI = {
    body: 'M0,-28 C9,-27 12,-14 11,-2 C10,10 6,20 2,28 L-2,28 C-6,20 -10,10 -11,-2 C-12,-14 -9,-27 0,-28 Z',
    tail: 'M0,25 C5,29 13,37 13,48 C9,43 4,40 0,37 C-4,40 -9,43 -13,48 C-13,37 -5,29 0,25 Z',
    finL: 'M-9,-12 C-19,-13 -27,-5 -25,3 C-20,-2 -14,-5 -9,-5 Z',
    finR: 'M9,-12 C19,-13 27,-5 25,3 C20,-2 14,-5 9,-5 Z',
    pelL: 'M-6,10 C-12,10 -15,15 -14,20 C-11,16 -8,15 -5,15 Z',
    pelR: 'M6,10 C12,10 15,15 14,20 C11,16 8,15 5,15 Z',
  };
  const KT = {
    kohaku: { body: '#f6f1e6', spots: ['#c8321f'], fin: '#f6f1e6' },
    hi: { body: '#d4452a', fin: '#e2734a' },
    karasu: { body: '#1b1b1b', fin: '#1b1b1b', dark: true },
    showa: { body: '#1d1d1d', spots: ['#c8321f', '#f2ece0'], fin: '#1d1d1d', dark: true },
    ogon: { body: '#d6b25a', fin: '#e4c87e' },
    sumi: { body: '#4a4a4a', fin: '#4a4a4a', dark: true },
    ghost: { body: '#f4f0e4', spots: ['#e2dccb'], fin: '#f4f0e4' },
    faded: { body: '#e9dcc0', spots: ['#a8583c'], fin: '#e9dcc0' },
  };
  function koi(p, x, y, ang, s, type = 'kohaku', o = {}) {
    const t = KT[type], seed = o.seed || Math.round(x * 7 + y * 13), r = R(seed);
    if (o.shadow !== false) {
      const sh = G(p, { transform: `translate(${f(x + 6 * s)},${f(y + 9 * s)}) rotate(${ang}) scale(${s})`, opacity: o.shadowOp ?? .2, filter: 'url(#blurM)' });
      for (const k of ['body', 'tail', 'finL', 'finR']) E(sh, 'path', { d: KOI[k], fill: '#111' });
    }
    if (o.glow) {
      const gl = G(p, { transform: `translate(${x},${y}) rotate(${ang}) scale(${s})`, opacity: .55, filter: 'url(#glow)' });
      E(gl, 'path', { d: KOI.body, fill: o.glow }); E(gl, 'path', { d: KOI.tail, fill: o.glow });
    }
    const g = G(p, { transform: `translate(${x},${y}) rotate(${ang}) scale(${s})`, opacity: o.op ?? 1 });
    const line = t.dark ? '#e8e0cc' : '#151515';
    const fins = G(g, { opacity: .6 });
    for (const k of ['finL', 'finR', 'pelL', 'pelR', 'tail']) E(fins, 'path', { d: KOI[k], fill: t.fin, stroke: '#151515', 'stroke-width': .6, filter: 'url(#brushF)' });
    const rays = G(g, { stroke: line, 'stroke-width': .35, opacity: .45, fill: 'none' });
    for (let i = 0; i < 6; i++) {
      E(rays, 'path', { d: `M0,28 L${f(-12 + i * 1.6)},${f(46 - i * 1.2)} M0,28 L${f(12 - i * 1.6)},${f(46 - i * 1.2)}` });
      E(rays, 'path', { d: `M-10,-9 L${f(-17 - i * 1.6)},${f(-11 + i * 2.6)} M10,-9 L${f(17 + i * 1.6)},${f(-11 + i * 2.6)}` });
    }
    const cid = 'kc' + (uid++), cp = E(E(g, 'defs'), 'clipPath', { id: cid });
    E(cp, 'path', { d: KOI.body });
    E(g, 'path', { d: KOI.body, fill: t.body });
    const sg = G(g, { 'clip-path': `url(#${cid})` });
    (t.spots || []).forEach((col, j) => {
      for (let i = 0; i < 3; i++) E(sg, 'path', { d: blob((r() - .5) * 12, -21 + i * 15 + r() * 5 + j * 6, 5 + r() * 6, 5 + r() * 5, seed * 10 + i + j * 7, .4, 7), fill: col, filter: 'url(#brushF)' });
    });
    const sc = G(sg, { fill: 'none', stroke: t.dark ? '#fff' : '#000', 'stroke-width': .35, opacity: t.dark ? .1 : .17 });
    for (let yy = -15, row = 0; yy < 25; yy += 3, row++)
      for (let xx = -11; xx <= 11; xx += 3.2) E(sc, 'path', { d: `M${f(xx + (row % 2) * 1.6)},${yy} q1.6,1.9 3.2,0` });
    E(sg, 'path', { d: KOI.body, fill: 'none', stroke: '#000', 'stroke-width': 6, opacity: t.dark ? .3 : .13, filter: 'url(#blurS)' });
    E(sg, 'path', { d: 'M-3,-24 C-4,-10 -3,6 -1,20', fill: 'none', stroke: '#fff', 'stroke-width': 2.2, opacity: .18, filter: 'url(#blurS)' });
    E(g, 'path', { d: KOI.body, fill: 'none', stroke: '#141414', 'stroke-width': .9, filter: 'url(#brushF)', opacity: .9 });
    E(g, 'path', { d: 'M-8,-17 Q0,-12.5 8,-17', fill: 'none', stroke: line, 'stroke-width': .45, opacity: .4 });
    E(g, 'path', { d: 'M0,-13 C1.5,-3 1.5,9 0,21', fill: 'none', stroke: line, 'stroke-width': .6, opacity: .4 });
    E(g, 'circle', { cx: -5.4, cy: -21, r: 1.15, fill: '#111' }); E(g, 'circle', { cx: 5.4, cy: -21, r: 1.15, fill: '#111' });
    E(g, 'path', { d: 'M-2.2,-27.5 q-3,-3 -5.5,-2 M2.2,-27.5 q3,-3 5.5,-2', fill: 'none', stroke: '#111', 'stroke-width': .45, opacity: .65 });
  }

  function needles(p, x, y, r, seed, col = '#141414', fan = 1) {
    const rr = R(seed);
    E(p, 'ellipse', { cx: x, cy: y, rx: r * 1.15, ry: r * .8, fill: col, opacity: .13, filter: 'url(#bleed)' });
    const g = G(p, { stroke: col, 'stroke-width': .75, 'stroke-linecap': 'round', fill: 'none', opacity: .85 });
    const n = Math.round(r * 3);
    for (let i = 0; i < n; i++) {
      const a = fan === 1 ? rr() * 6.283 : Math.PI * (1.05 + rr() * .9), l = r * (.55 + rr() * .5);
      const cx = x + (rr() - .5) * r * .35, cy = y + (rr() - .5) * r * .35;
      E(g, 'line', { x1: f(cx), y1: f(cy), x2: f(cx + Math.cos(a) * l), y2: f(cy + Math.sin(a) * l * .8) });
    }
  }

  function blossom(p, x, y, r, petal = '#f6f2ea', center = '#c8321f', rot = 0, outline = '#2a2a2a') {
    const g = G(p, { transform: `translate(${f(x)},${f(y)}) rotate(${f(rot)})` });
    for (let i = 0; i < 5; i++) {
      const a = i * 72 * Math.PI / 180, px = Math.cos(a) * r * .55, py = Math.sin(a) * r * .55;
      E(g, 'ellipse', { cx: f(px), cy: f(py), rx: f(r * .55), ry: f(r * .44), transform: `rotate(${i * 72} ${f(px)} ${f(py)})`, fill: petal, stroke: outline, 'stroke-width': .5, filter: 'url(#brushF)' });
    }
    E(g, 'circle', { r: f(r * .22), fill: center });
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; E(g, 'circle', { cx: f(Math.cos(a) * r * .38), cy: f(Math.sin(a) * r * .38), r: .55, fill: '#3a2a10' }); }
  }


  function lotusLeaf(p, x, y, r, rot, col = '#1d1d1d', op = .22) {
    const a0 = (rot - 14) * Math.PI / 180, a1 = (rot + 14) * Math.PI / 180;
    const d = `M${f(x)},${f(y)} L${f(x + Math.cos(a1) * r)},${f(y + Math.sin(a1) * r)} A${r},${r} 0 1 1 ${f(x + Math.cos(a0) * r)},${f(y + Math.sin(a0) * r)} Z`;
    E(p, 'path', { d, fill: col, opacity: op, filter: 'url(#brush)' });
    E(p, 'path', { d, fill: 'none', stroke: '#1a1a1a', 'stroke-width': .8, opacity: .55, filter: 'url(#brush)' });
    const v = G(p, { stroke: '#1a1a1a', 'stroke-width': .45, opacity: .3 });
    for (let i = 0; i < 13; i++) { const a = (rot + 28 + i * 25) * Math.PI / 180; E(v, 'line', { x1: x, y1: y, x2: f(x + Math.cos(a) * r * .9), y2: f(y + Math.sin(a) * r * .9) }); }
    E(p, 'circle', { cx: x, cy: y, r: 1.5, fill: '#1a1a1a', opacity: .5 });
  }
  function lotusFlower(p, x, y, r, col = '#e8a0b4') {
    const g = G(p, { transform: `translate(${x},${y})` });
    for (let layer = 0; layer < 3; layer++) {
      const n = 8 - layer * 2, rr = r * (1 - layer * .28);
      for (let i = 0; i < n; i++) {
        const a = (i / n * 360 + layer * 22);
        E(g, 'ellipse', { cx: 0, cy: f(-rr * .5), rx: f(rr * .26), ry: f(rr * .52), transform: `rotate(${f(a)})`, fill: layer === 2 ? '#f6e3e8' : col, stroke: '#5a2a35', 'stroke-width': .4, opacity: .95, filter: 'url(#brushF)' });
      }
    }
    E(g, 'circle', { r: f(r * .18), fill: '#e2c35a', stroke: '#6a5a1a', 'stroke-width': .4 });
  }

  function bambooLeaf(p, x, y, len, ang, w, col, op) {
    const a = ang * Math.PI / 180, tx = x + Math.cos(a) * len, ty = y + Math.sin(a) * len;
    const nx = -Math.sin(a) * w, ny = Math.cos(a) * w, mx = x + Math.cos(a) * len * .35, my = y + Math.sin(a) * len * .35;
    E(p, 'path', { d: `M${f(x)},${f(y)} Q${f(mx + nx)},${f(my + ny)} ${f(tx)},${f(ty)} Q${f(mx - nx)},${f(my - ny)} ${f(x)},${f(y)}Z`, fill: col, opacity: op, filter: 'url(#brush)' });
  }
  function bambooCluster(p, x, y, seed, n, col, op, baseAng = 0, spread = 180) {
    const r = R(seed);
    for (let i = 0; i < n; i++) bambooLeaf(p, x + (r() - .5) * 8, y + (r() - .5) * 8, 22 + r() * 22, baseAng + (r() - .5) * spread, 3 + r() * 2.5, col, op * (.6 + r() * .4));
  }

  function grass(p, x, y, n, seed, col = '#151515', h = 26) {
    const r = R(seed), g = G(p, { fill: col, opacity: .85 });
    for (let i = 0; i < n; i++) {
      const bx = x + (r() - .5) * 18, ang = -90 + (r() - .5) * 70, l = h * (.6 + r() * .6), a = ang * Math.PI / 180;
      stroke(g, [[bx, y], [bx + Math.cos(a) * l * .3, y + Math.sin(a) * l * .3], [bx + Math.cos(a) * l * .7 + (r() - .5) * 8, y + Math.sin(a) * l * .7], [bx + Math.cos(a) * l + (r() - .5) * 12, y + Math.sin(a) * l]], 2.2, .3, { fill: col });
    }
  }

  function calli(p, x, y, text, size, col = '#141414', op = .88) {
    const t = E(p, 'text', { x, y, 'font-size': size, fill: col, opacity: op, 'font-family': FONT_BRUSH, style: 'writing-mode:vertical-rl;letter-spacing:3px' });
    t.textContent = text;
  }
  function seal(p, x, y, s, chars, col = '#b3281e') {
    const g = G(p, { transform: `translate(${x},${y})` });
    E(g, 'rect', { width: s, height: s, rx: 1.5, fill: col, filter: 'url(#brush)', opacity: .92 });
    E(g, 'rect', { x: 1.6, y: 1.6, width: s - 3.2, height: s - 3.2, fill: 'none', stroke: '#f3e9d6', 'stroke-width': .6, opacity: .8 });
    const t = E(g, 'text', { x: s / 2, y: s * .73, 'font-size': s * .6, 'text-anchor': 'middle', fill: '#f3e9d6', 'font-family': FONT_SERIF, 'font-weight': 700 });
    t.textContent = chars;
  }

  function splatter(p, x, y, spread, n, seed, col = '#121212') {
    const r = R(seed), g = G(p, { fill: col });
    for (let i = 0; i < n; i++) {
      const a = r() * 6.283, d = Math.pow(r(), 1.8) * spread, s = Math.max(.4, (1 - d / spread) * 4 * r() + .3);
      E(g, 'circle', { cx: f(x + Math.cos(a) * d), cy: f(y + Math.sin(a) * d), r: f(s), opacity: f(.5 + r() * .5), filter: s > 2 ? 'url(#brushF)' : undefined });
    }
  }

  function goldCloud(p, x, y, w, h, seed) {
    const r = R(seed), id = 'gc' + (uid++);
    const parts = [[x, y, w, h], [x + w * .15, y - h * .55, w * .45, h * .9], [x + w * .5, y + h * .5, w * .42, h * .85]];
    const d = parts.map(([px, py, pw, ph]) => `M${f(px + ph / 2)},${f(py)}H${f(px + pw - ph / 2)}A${f(ph / 2)},${f(ph / 2)} 0 0 1 ${f(px + pw - ph / 2)},${f(py + ph)}H${f(px + ph / 2)}A${f(ph / 2)},${f(ph / 2)} 0 0 1 ${f(px + ph / 2)},${f(py)}Z`).join('');
    const cp = E(E(p, 'defs'), 'clipPath', { id }); E(cp, 'path', { d });
    E(p, 'path', { d, fill: '#6a4a10', opacity: .25, filter: 'url(#blurM)', transform: 'translate(1.5,2)' });
    const g = G(p, { 'clip-path': `url(#${id})` });
    E(g, 'rect', { x: x - 10, y: y - h, width: w + 20, height: h * 3, fill: 'url(#gold)' });
    const s = 11;
    for (let gx = x - 10; gx < x + w + 10; gx += s) for (let gy = y - h; gy < y + h * 2; gy += s)
      E(g, 'rect', { x: f(gx + (r() - .5)), y: f(gy + (r() - .5)), width: s, height: s, fill: r() > .5 ? '#fff3c4' : '#7a5a1a', opacity: f(r() * .14), stroke: '#8a6a24', 'stroke-width': .35, 'stroke-opacity': .5 });
    E(p, 'path', { d, fill: 'none', stroke: '#8a6a24', 'stroke-width': .7, opacity: .6 });
  }

  function willow(p, x0, y0, n, seed, col = '#2a2a1e', op = .75) {
    const r = R(seed);
    for (let i = 0; i < n; i++) {
      const sx = x0 + (r() - .3) * 150, sy = y0 + r() * 8, len = 60 + r() * 120, sway = (r() - .5) * 30;
      const c = [[sx, sy], [sx + sway * .2, sy + len * .3], [sx + sway * .7, sy + len * .7], [sx + sway, sy + len]];
      stroke(p, c, 1.2, .3, { fill: col, opacity: op * .7 });
      for (let k = 0; k < 9; k++) {
        const t = .15 + k / 10, q = bez(c, t), side = k % 2 ? 1 : -1;
        bambooLeaf(p, q[0], q[1], 7 + r() * 5, 90 + side * (25 + r() * 15), 1.6, col, op * (.6 + r() * .4));
      }
    }
  }

  function lantern(p, x, y, s) {
    const g = G(p, { transform: `translate(${x},${y}) scale(${s})` });
    E(g, 'path', { d: 'M-16,-16 L16,-16 L20,0 L16,16 L-16,16 L-20,0 Z', fill: '#3a3a3a', opacity: .25, filter: 'url(#bleed)' });
    E(g, 'path', { d: 'M-15,-15 L15,-15 L18,0 L15,15 L-15,15 L-18,0 Z', fill: '#d9d0bc', stroke: '#141414', 'stroke-width': 1.6, filter: 'url(#brush)' });
    E(g, 'path', { d: 'M-15,-15 L15,15 M15,-15 L-15,15', stroke: '#141414', 'stroke-width': 1, opacity: .7 });
    E(g, 'rect', { x: -7, y: -7, width: 14, height: 14, fill: '#2a2a2a', stroke: '#141414', 'stroke-width': 1 });
    E(g, 'circle', { r: 3.2, fill: '#e9c66a', opacity: .9 });
    E(g, 'path', { d: 'M-17,-17 L17,-17 L17,17 L-17,17Z', fill: '#000', filter: 'url(#dry)', opacity: .35 });
  }
  function bridge(p, x1, y1, x2, y2, w) {
    const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a) * w / 2, ny = Math.cos(a) * w / 2;
    const g = G(p);
    E(g, 'path', { d: `M${f(x1 + nx)},${f(y1 + ny)}L${f(x2 + nx)},${f(y2 + ny)}L${f(x2 - nx)},${f(y2 - ny)}L${f(x1 - nx)},${f(y1 - ny)}Z`, fill: '#1a1a1a', opacity: .25, filter: 'url(#bleed)', transform: 'translate(4,7)' });
    E(g, 'path', { d: `M${f(x1 + nx)},${f(y1 + ny)}L${f(x2 + nx)},${f(y2 + ny)}L${f(x2 - nx)},${f(y2 - ny)}L${f(x1 - nx)},${f(y1 - ny)}Z`, fill: '#cdbf9f', stroke: '#141414', 'stroke-width': 1.4, filter: 'url(#brush)' });
    const L = Math.hypot(x2 - x1, y2 - y1);
    for (let d = 6; d < L; d += 7) {
      const t = d / L, cx = x1 + (x2 - x1) * t, cy = y1 + (y2 - y1) * t;
      E(g, 'line', { x1: f(cx + nx), y1: f(cy + ny), x2: f(cx - nx), y2: f(cy - ny), stroke: '#141414', 'stroke-width': .7, opacity: .6 });
    }
  }
  function stepStones(p, pts, seed) {
    const r = R(seed);
    pts.forEach(([x, y, s], i) => {
      const d = blob(x, y, s, s * .8, seed + i, .2, 7);
      E(p, 'path', { d, fill: '#2a2a2a', opacity: .25, filter: 'url(#blurM)', transform: 'translate(2,3)' });
      E(p, 'path', { d, fill: '#d6ccb4', stroke: '#141414', 'stroke-width': 1.1, filter: 'url(#brush)' });
      E(p, 'path', { d, fill: '#000', opacity: .3, filter: 'url(#dry)' });
    });
  }


  return { NS, R, E, G, f, bez, smooth, blob, taperF, stroke, branch, paper, pond, rock, ripple, needles, blossom, lotusLeaf, lotusFlower, bambooLeaf, bambooCluster, grass, calli, seal, splatter, lantern, bridge, stepStones };
})();
const INK_DEFS = `
    <filter id="brush" x="-15%" y="-15%" width="130%" height="130%">
      <feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="3" seed="3" result="t"/>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="brushF" x="-15%" y="-15%" width="130%" height="130%">
      <feTurbulence type="fractalNoise" baseFrequency=".25" numOctaves="2" seed="9" result="t"/>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="1.4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="bleed" x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency=".015" numOctaves="4" seed="7" result="t"/>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="40" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation="4"/>
    </filter>
    <filter id="dry" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency=".55 .05" numOctaves="2" seed="11" result="t"/>
      <feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4.2 0 0 0 -1.55" result="m"/>
      <feComposite in="SourceGraphic" in2="m" operator="in" result="c"/>
      <feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="5" result="t2"/>
      <feDisplacementMap in="c" in2="t2" scale="4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="paperTex" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="2" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 .35  0 0 0 0 .29  0 0 0 0 .2  1.1 0 0 0 -.42"/>
    </filter>
    <filter id="stain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".007" numOctaves="4" seed="21" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 .45  0 0 0 0 .36  0 0 0 0 .2  .9 0 0 0 -.38"/>
    </filter>
    <filter id="blurS"><feGaussianBlur stdDeviation="1.2"/></filter>
    <filter id="blurM" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6"/></filter>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#b8903f"/><stop offset=".45" stop-color="#e6cd86"/><stop offset=".7" stop-color="#c9a24e"/><stop offset="1" stop-color="#a47c33"/>
    </linearGradient>
    <radialGradient id="moon">
      <stop offset="0" stop-color="#fbf3dc" stop-opacity="1"/><stop offset=".55" stop-color="#efe1b8" stop-opacity=".85"/><stop offset="1" stop-color="#efe1b8" stop-opacity="0"/>
    </radialGradient>
    <pattern id="silk" width="3" height="3" patternUnits="userSpaceOnUse">
      <path d="M0,.5H3M.5,0V3" stroke="#5a4423" stroke-width=".35" opacity=".35"/>
    </pattern>
  `;

// ======================================================================
// Scene: every painted layer is drawn in 960×560 design coordinates, viewed straight from above.
// Each layer is a plane covering exactly the view at its own height, so design coordinates
// match the screen whether the layer is high or low.
// ======================================================================
const DW = 960, DH = 560, ASPECT = DW / DH, CAM_Y = 80, FOV = 28, TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.NoToneMapping;          // keep the exact paper color between the water layer and the shore layer
renderer.autoClear = false;

const camera = new THREE.PerspectiveCamera(FOV, ASPECT, 1, 200);
camera.position.set(0, CAM_Y, 0); camera.up.set(0, 0, -1); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
function viewAt(y) { const h = 2 * Math.tan(FOV * Math.PI / 360) * (CAM_Y - y); return { w: h * ASPECT, h }; }
const d2w = (dx, dy, y) => { const v = viewAt(y); return [(dx / DW - .5) * v.w, (dy / DH - .5) * v.h]; };
const w2d = (x, z, y) => { const v = viewAt(y); return [(x / v.w + .5) * DW, (z / v.h + .5) * DH]; };
const tmpV = new THREE.Vector3();
const w2uv = (x, y, z) => { tmpV.set(x, y, z).project(camera); return [tmpV.x * .5 + .5, tmpV.y * .5 + .5]; };
const d2uv = (dx, dy) => [dx / DW, 1 - dy / DH];

// ---------- Pond shape: ellipse with harmonic noise, shared by drawing and fish shore avoidance ----------
const POND = { cx: 468, cy: 296, rx: 338, ry: 200, harm: [[2, .045, 1.1], [3, .06, .4], [5, .028, 2.2], [7, .016, .9]] };
const pondR = (th) => POND.harm.reduce((r, [k, a, p]) => r + a * Math.sin(k * th + p), 1);
const pondPt = (th, s = 1) => { const r = pondR(th) * s; return [POND.cx + Math.cos(th) * POND.rx * r, POND.cy + Math.sin(th) * POND.ry * r]; };
const pondPathD = (s = 1, n = 90) => Ink.smooth(Array.from({ length: n }, (_, i) => pondPt(i / n * TAU, s)));
const pondE = (dx, dy) => { const nx = (dx - POND.cx) / POND.rx, ny = (dy - POND.cy) / POND.ry; return Math.hypot(nx, ny) / pondR(Math.atan2(ny, nx)); };

// ---------- Seasons ----------
const SEASONS = {
  spring: { name: '春', en: 'Spring', poem: '春池游鯉', sub: '花落水自流', paper: '#efe6d3', moss: '#3d5530', grass: '#4d6a38', water: '#1d2a28', sun: '#fff3ea', sunI: 2.1, hemi: .95, fall: 'petal', rate: 7, lotus: 3, flowers: 0 },
  summer: { name: '夏', en: 'Summer', poem: '蓮池涼風', sub: '蜻蛉點水', paper: '#ece4cc', moss: '#2f4a24', grass: '#3d5a2c', water: '#16261f', sun: '#fff8e8', sunI: 2.4, hemi: 1.0, fall: null, rate: 0, lotus: 9, flowers: 4 },
  autumn: { name: '秋', en: 'Autumn', poem: '紅葉浮水', sub: '風過池心', paper: '#ede0c6', moss: '#4a4426', grass: '#6b5a2a', water: '#2a2620', sun: '#ffe9cc', sunI: 2.1, hemi: .9, fall: 'leaf', rate: 3.2, lotus: 4, flowers: 0 },
  winter: { name: '冬', en: 'Winter', poem: '雪池靜鯉', sub: '寒梅一點紅', paper: '#ebe9e3', moss: '#2a2c2a', grass: '#7a7060', water: '#1e2428', sun: '#eef3ff', sunI: 1.8, hemi: 1.05, fall: 'snow', rate: 30, lotus: 0, flowers: 0 },
};

// ---------- SVG -> canvas ----------
function newSVG(w = DW, h = DH, scale = 2) {
  const s = document.createElementNS(Ink.NS, 'svg');
  s.setAttribute('xmlns', Ink.NS); s.setAttribute('viewBox', `0 0 ${w} ${h}`);
  s.setAttribute('width', w * scale); s.setAttribute('height', h * scale);
  s.innerHTML = `<defs>${INK_DEFS}</defs>`;
  return s;
}
async function raster(svg) {
  const w = +svg.getAttribute('width'), h = +svg.getAttribute('height');
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  await img.decode();
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  return c;
}
function canvasTex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const spriteTex = new WeakMap();                  // falling objects share a texture per canvas
const sharedTex = (c) => { let t = spriteTex.get(c); if (!t) { t = canvasTex(c); spriteTex.set(c, t); } return t; };

// ---------- Draw the seasonal layers ----------
function floorArt(S) {
  const s = newSVG(), { E, G, R, blob } = Ink, r = R(11);
  Ink.paper(s, DW, DH, { seed: 7, col: S.paper, vig: .22 });
  const g = G(s);
  for (const [k, op] of [[1.02, .1], [.8, .065], [.55, .055], [.3, .045]]) E(g, 'path', { d: pondPathD(k), fill: S.water, opacity: op, filter: 'url(#bleed)' });
  for (let i = 0; i < 160; i++) {
    const th = r() * TAU, k = Math.sqrt(r()) * .95, [x, y] = pondPt(th, k), sz = 1 + Math.pow(r(), 3) * 7;
    E(g, 'path', { d: blob(x, y, sz, sz * .75, 300 + i, .3, 7), fill: r() > .5 ? '#5a574d' : '#7a766a', opacity: (.18 + r() * .3).toFixed(2), filter: 'url(#brushF)' });
  }
  for (let i = 0; i < 9; i++) { const th = r() * TAU, [x, y] = pondPt(th, .5 + r() * .4); Ink.rock(g, x, y, 6 + r() * 10, 400 + i, { col: '#3a3a36', hi: S.paper }); }
  if (S !== SEASONS.winter) for (let i = 0; i < 14; i++) { const th = r() * TAU, [x, y] = pondPt(th, .88); const wg = G(g, { opacity: .35 }); Ink.grass(wg, x, y, 4, 500 + i, '#2a3a2a', 30); }
  return s;
}

function shoreArt(S, key) {
  const s = newSVG(), { E, G, R, blob } = Ink, r = R(23);
  const defs = s.querySelector('defs');
  defs.insertAdjacentHTML('beforeend', `<clipPath id="shoreClip" clip-rule="evenodd"><path clip-rule="evenodd" d="M-10,-10H${DW + 10}V${DH + 10}H-10Z ${pondPathD(1)}"/></clipPath><clipPath id="pondClip"><path d="${pondPathD(1)}"/></clipPath>`);
  const out = G(s, { 'clip-path': 'url(#shoreClip)' });
  Ink.paper(out, DW, DH, { seed: 3, col: S.paper, vig: .3 });
  E(out, 'path', { d: pondPathD(1.08), fill: 'none', stroke: '#3a3826', 'stroke-width': 46, opacity: .13, filter: 'url(#bleed)' });
  for (let i = 0; i < 420; i++) {
    const x = r() * DW, y = r() * DH; if (pondE(x, y) < 1.03) continue;
    const near = clamp(1.6 - pondE(x, y), 0, 1);
    E(out, 'circle', { cx: Ink.f(x), cy: Ink.f(y), r: Ink.f(.4 + r() * 1.3), fill: r() > .6 ? S.moss : '#1d1d1d', opacity: (.15 + near * .45 * r()).toFixed(2) });
  }
  if (key === 'winter') for (let i = 0; i < 26; i++) {
    const x = r() * DW, y = r() * DH; if (pondE(x, y) < 1.08) continue;
    E(out, 'path', { d: blob(x, y, 20 + r() * 60, 10 + r() * 26, 600 + i, .35, 9), fill: '#fbfaf6', opacity: .75, filter: 'url(#bleed)' });
  }
  // shore shadow cast onto the water
  const inner = G(s, { 'clip-path': 'url(#pondClip)' });
  E(inner, 'path', { d: pondPathD(1), fill: 'none', stroke: '#141818', 'stroke-width': 34, opacity: .26, filter: 'url(#bleed)' });
  E(s, 'path', { d: pondPathD(1), fill: 'none', stroke: '#151515', 'stroke-width': 2.4, opacity: .82, filter: 'url(#brush)', 'stroke-dasharray': '190 10 70 6 260 14 90 8 140 12' });
  E(s, 'path', { d: pondPathD(1.016), fill: 'none', stroke: '#151515', 'stroke-width': 1, opacity: .4, filter: 'url(#brush)', 'stroke-dasharray': '60 30 120 22 40 18' });

  // shore-edge rocks: large clusters at bottom-left and on the right
  const rocks = [];
  for (let i = 0; i < 40; i++) {
    const th = i / 40 * TAU + (r() - .5) * .1;
    if (r() < .38) continue;                        // leave gaps: the shore is not a string of beads
    const big = r() < .25;
    rocks.push([th, 1.035 + r() * .06, big ? 13 + r() * 10 : 5 + r() * 8]);
    if (big && r() < .6) rocks.push([th + (r() - .5) * .05, 1.1 + r() * .05, 5 + r() * 6]);
  }
  for (const [th, k, sz] of [[2.3, 1.1, 30], [2.45, 1.16, 20], [2.15, 1.18, 16], [.15, 1.1, 26], [.32, 1.15, 16], [4.4, 1.1, 18], [3.6, 1.12, 22]]) rocks.push([th, k, sz]);
  rocks.forEach(([th, k, sz], i) => {
    const [x, y] = pondPt(th, k);
    if (x > 600 && y < 150) return;                 // under the tree canopy at top right, leave empty
    Ink.rock(s, x, y, sz, 700 + i, { moss: S.moss, hi: S.paper });
    if (key === 'winter') E(s, 'path', { d: blob(x - sz * .1, y - sz * .3, sz * .75, sz * .38, 800 + i, .3, 8), fill: '#fdfcf8', opacity: .95, filter: 'url(#brushF)' });
  });
  // shoreline grass + iris clumps: separate sprites swaying in the wind (buildPlants)
  Ink.stepStones(s, [[150, 470, 13], [118, 500, 12], [92, 530, 13], [70, 556, 12]], 61);
  Ink.lantern(s, 70, 430, 1.25);
  if (key === 'winter') E(s, 'path', { d: blob(70, 412, 20, 8, 970, .2, 8), fill: '#fdfcf8', opacity: .95, filter: 'url(#brushF)' });
  Ink.seal(s, 46, 270, 24, S.name);
  Ink.seal(s, 900, 520, 18, '鯉', '#a83226');
  return s;
}

// Main branches + twigs shared by tree drawing and per-leaf/flower placement: leaf stems attach exactly to branches.
const BRANCHES = {
  spring: [[[[1000, -10], [880, 30], [800, 44], [700, 100]], 22, 5], [[[860, 34], [840, 86], [812, 130], [780, 170]], 10, 2.5], [[[790, 48], [760, 30], [720, 24], [680, 36]], 7, 2], [[[940, 0], [930, 60], [946, 120], [960, 170]], 10, 3]],
  autumn: [[[[1000, -10], [880, 34], [796, 50], [690, 110]], 22, 5], [[[860, 38], [836, 90], [808, 136], [770, 176]], 10, 2.5], [[[786, 52], [756, 32], [716, 26], [674, 40]], 7, 2], [[[944, 0], [932, 64], [946, 124], [960, 176]], 10, 3]],
};
const CLUSTERS = {
  spring: [[700, 100], [680, 36], [780, 170], [960, 170], [720, 24], [760, 64], [820, 96], [900, 40], [850, 150], [740, 130], [660, 70], [930, 110]],
  autumn: [[690, 110], [674, 40], [770, 176], [960, 176], [716, 26], [760, 70], [820, 100], [900, 44], [850, 150], [740, 140], [650, 80], [930, 116], [880, 90]],
};
function twigPlan(key) {
  if (!BRANCHES[key]) return [];
  const r = Ink.R(key === 'spring' ? 501 : 502), samples = [], twigs = [];
  for (const [c] of BRANCHES[key]) for (let i = 3; i <= 24; i++) samples.push(Ink.bez(c, i / 24));
  for (const [cx, cy] of CLUSTERS[key]) {
    let best = samples[0], bd = 1e9;
    for (const p of samples) { const d = Math.hypot(p[0] - cx, p[1] - cy); if (d < bd && d > 6) { bd = d; best = p; } }
    const [bx, by] = best, a = Math.atan2(cy - by, cx - bx) + (r() - .5) * .4, len = Math.max(bd, 18) + 4 + r() * 8, bend = (r() - .5) * .6;
    const P = (k, aa) => [bx + Math.cos(aa) * len * k, by + Math.sin(aa) * len * k];
    const main = [[bx, by], P(.34, a + bend), P(.68, a - bend * .4), P(1, a)];
    twigs.push({ c: main, w0: 1.5, w1: .45, main: true });
    for (let k = 0; k < 2; k++) {
      const p0 = Ink.bez(main, .4 + r() * .4), a2 = a + (k ? 1 : -1) * (.55 + r() * .5), l2 = 10 + r() * 12;
      const Q = (kk, aa) => [p0[0] + Math.cos(aa) * l2 * kk, p0[1] + Math.sin(aa) * l2 * kk];
      twigs.push({ c: [p0, Q(.35, a2), Q(.7, a2 + .25), Q(1, a2 + .1)], w0: .9, w1: .35 });
    }
  }
  return twigs;
}

function treeArt(S, key) {
  const s = newSVG(), { E, G, R } = Ink, r = R(31);
  const B = (c, w0, w1, col = '#191512') => Ink.branch(s, c, w0, w1, col, key === 'winter');
  if (key === 'summer') {
    // old pine: horizontal branches, needle clusters
    B([[1000, -20], [880, 36], [784, 56], [676, 124]], 26, 6, '#141414');
    B([[864, 40], [836, 92], [804, 140], [768, 184]], 12, 3, '#141414');
    B([[956, 4], [924, 76], [932, 140], [944, 192]], 12, 4, '#141414');
    B([[790, 60], [760, 36], [724, 28], [690, 44]], 8, 2.4, '#141414');
    [[676, 120, 34], [712, 80, 30], [690, 44, 22], [768, 184, 32], [808, 128, 26], [944, 192, 32], [892, 68, 26], [840, 12, 24], [740, 140, 22], [910, 130, 24], [640, 150, 20]]
      .forEach(([x, y, rr], i) => Ink.needles(s, x, y, rr, 130 + i));
  } else if (key === 'spring') {
    for (const [c, w0, w1] of BRANCHES.spring) B(c, w0, w1, '#2a1d18');
    for (const tw of twigPlan('spring')) B(tw.c, tw.w0, tw.w1, '#2a1d18');
    // pink buds at the twig tips
    for (const tw of twigPlan('spring')) { const p = tw.c[3]; E(s, 'circle', { cx: Ink.f(p[0] + (r() - .5) * 4), cy: Ink.f(p[1] + (r() - .5) * 4), r: Ink.f(1.6 + r() * 1.4), fill: '#d9708c', opacity: .9 }); }
  } else if (key === 'autumn') {
    for (const [c, w0, w1] of BRANCHES.autumn) B(c, w0, w1, '#2a1d14');
    for (const tw of twigPlan('autumn')) B(tw.c, tw.w0, tw.w1, '#3a2418');
  } else {
    // winter plum: bare snow-covered branches, a few red plum blossoms
    B([[1000, -10], [880, 30], [808, 40], [700, 96]], 22, 5, '#161616');
    B([[866, 32], [846, 84], [820, 128], [790, 168]], 10, 2.5, '#161616');
    B([[796, 44], [770, 22], [736, 16], [700, 26]], 7, 2, '#161616');
    B([[946, 0], [934, 62], [950, 120], [962, 168]], 10, 3, '#161616');
    B([[740, 70], [712, 92], [690, 120], [660, 130]], 5, 1.4, '#161616');
    for (const [x, y] of [[700, 96], [700, 26], [790, 168], [660, 130], [736, 16], [846, 84], [960, 120], [812, 130]]) Ink.blossom(s, x + (r() - .5) * 10, y + (r() - .5) * 10, 7 + r() * 2, '#c8402b', '#f4e3b0', r() * 72, '#5a1a10');
  }
  return s;
}


// ---------- Detailed lotus ----------
// Lotus leaf seen from above, watercolor + ink style: blotchy grey-green wash, dark pooled edge (wet edge), wavy rim
// not perfectly round, narrow slit from the center, fine veins radiating and forking near the rim, a curled-up rim section catching light,
// broken ink outline; autumn leaves turn yellow with brown spots.
function lotusLeafArt(s, cx, cy, R, rotDeg, autumn, seed) {
  const { E, G, R: Rng, f } = Ink, r = Rng(seed), rot = rotDeg * Math.PI / 180, id = 'll' + seed;
  const sq = .9 + r() * .1, notch = .018 + r() * .012, N = 110;
  const ph1 = r() * TAU, ph2 = r() * TAU, ph3 = r() * TAU;
  const P = (a, k) => { const x = Math.cos(a) * R * k, y = Math.sin(a) * R * k * sq; return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]; };
  const edgeK = a => 1 + .035 * Math.sin(a * 5 + ph1) + .022 * Math.sin(a * 11 + ph2) + .01 * Math.sin(a * 27 + ph3);
  const pts = [];
  for (let i = 0; i <= N; i++) { const a = notch + i / N * (TAU - 2 * notch); pts.push(P(a, edgeK(a))); }
  const c = P(0, .02);
  const d = `M${f(c[0])},${f(c[1])}L` + pts.map(p => f(p[0]) + ',' + f(p[1])).join('L') + 'Z';
  const pal = autumn ? ['#c2b27a', '#9c8a50', '#6e5e30', '#3e3418', '#e6dcb0'] : ['#a7b583', '#74885a', '#4c6240', '#26331f', '#dfe8c8'];
  const defs = E(s, 'defs');
  const cp = E(defs, 'clipPath', { id: id + 'c' }); E(cp, 'path', { d });
  const g = E(defs, 'radialGradient', { id, cx: .5, cy: .5, r: .55 });
  E(g, 'stop', { offset: 0, 'stop-color': pal[0] }); E(g, 'stop', { offset: .6, 'stop-color': pal[1] }); E(g, 'stop', { offset: 1, 'stop-color': pal[2] });
  // leaf shadow on the water
  E(s, 'path', { d, fill: '#1a2018', opacity: .22, filter: 'url(#blurM)', transform: 'translate(2.5,3.5)' });
  E(s, 'path', { d, fill: `url(#${id})`, opacity: .93 });
  const L = G(s, { 'clip-path': `url(#${id}c)` });
  // color blooms: dark and light patches overlapping like wet watercolor
  const wash = G(L, { filter: 'url(#bleed)' });
  for (let i = 0; i < 9; i++) { const a = r() * TAU, k = .2 + r() * .7, q = P(a, k); E(wash, 'ellipse', { cx: f(q[0]), cy: f(q[1]), rx: f(R * (.16 + r() * .22)), ry: f(R * (.1 + r() * .16)), fill: r() < .55 ? pal[2] : pal[0], opacity: .3 + r() * .2 }); }
  E(L, 'rect', { x: f(cx - R * 1.2), y: f(cy - R * 1.2), width: f(R * 2.4), height: f(R * 2.4), filter: 'url(#stain)', opacity: .55 });
  E(L, 'rect', { x: f(cx - R * 1.2), y: f(cy - R * 1.2), width: f(R * 2.4), height: f(R * 2.4), filter: 'url(#paperTex)', opacity: .5 });
  // leaf center lighter
  E(L, 'circle', { cx: f(c[0]), cy: f(c[1]), r: f(R * .3), fill: pal[0], opacity: .35, filter: 'url(#blurM)' });
  // pooled edge (wet edge): dark stroke along the rim, bleeding inward
  E(L, 'path', { d, fill: 'none', stroke: pal[2], 'stroke-width': f(R * .16), opacity: .5, filter: 'url(#blurS)' });
  E(L, 'path', { d, fill: 'none', stroke: pal[3], 'stroke-width': f(R * .05), opacity: .35, filter: 'url(#blurS)' });
  // veins: fine, slightly curved, forking at 2/3 radius, fading toward the rim
  const vg = G(L, { stroke: pal[4], fill: 'none', 'stroke-linecap': 'round' });
  const nv = 17 + Math.floor(r() * 5);
  for (let i = 0; i < nv; i++) {
    const a = notch + (i + .5) / nv * (TAU - 2 * notch) + (r() - .5) * .06, bend = (r() - .5) * .1;
    const m = P(a + bend, .4), e = P(a, .66);
    E(vg, 'path', { d: `M${f(c[0])},${f(c[1])}Q${f(m[0])},${f(m[1])} ${f(e[0])},${f(e[1])}`, 'stroke-width': .7, opacity: .32 + r() * .2 });
    for (const sd of [-1, 1]) { const t = P(a + sd * .09, .93 * edgeK(a)); E(vg, 'path', { d: `M${f(e[0])},${f(e[1])}L${f(t[0])},${f(t[1])}`, 'stroke-width': .4, opacity: .22 }); }
  }
  E(L, 'circle', { cx: f(c[0]), cy: f(c[1]), r: f(R * .05), fill: pal[4], opacity: .75 });
  E(L, 'circle', { cx: f(c[0]), cy: f(c[1]), r: f(R * .022), fill: pal[2], opacity: .7 });
  // old/autumn leaf: brown burn spots spreading from the rim
  const spots = autumn ? 2 + Math.floor(r() * 3) : (r() < .35 ? 1 : 0);
  for (let i = 0; i < spots; i++) { const a = r() * TAU, q = P(a, .75 + r() * .3); E(L, 'ellipse', { cx: f(q[0]), cy: f(q[1]), rx: f(R * (.08 + r() * .12)), ry: f(R * (.06 + r() * .08)), fill: autumn ? '#5a3a18' : '#7a6a34', opacity: .45, filter: 'url(#bleed)' }); }
  // curled-up rim catching light + thin shadow inside
  const a0 = notch + .5 + r() * 4, arc = [], arcIn = [];
  for (let i = 0; i <= 14; i++) { const a = a0 + i / 14 * (.9 + r() * .2); arc.push(P(a, .97 * edgeK(a))); arcIn.push(P(a, .9 * edgeK(a))); }
  E(L, 'path', { d: 'M' + arcIn.map(p => f(p[0]) + ',' + f(p[1])).join('L'), fill: 'none', stroke: pal[3], 'stroke-width': 1.2, opacity: .3, filter: 'url(#blurS)' });
  E(L, 'path', { d: 'M' + arc.map(p => f(p[0]) + ',' + f(p[1])).join('L'), fill: 'none', stroke: pal[4], 'stroke-width': 2.6, opacity: .5, 'stroke-linecap': 'round' });
  // broken ink outline, uneven darkness
  const dash = Array.from({ length: 8 }, () => f(8 + r() * 30) + ' ' + f(1 + r() * 6)).join(' ');
  E(s, 'path', { d, fill: 'none', stroke: pal[3], 'stroke-width': .9, opacity: .7, 'stroke-dasharray': dash, filter: 'url(#brushF)' });
  // water droplets: a few small beads
  if (!autumn) for (let i = 0; i < Math.floor(r() * 3); i++) {
    const q = P(r() * TAU, .2 + r() * .45), dr = 1.2 + r() * 1.6;
    E(s, 'circle', { cx: f(q[0] + .5), cy: f(q[1] + .7), r: f(dr), fill: pal[3], opacity: .25 });
    E(s, 'circle', { cx: f(q[0]), cy: f(q[1]), r: f(dr), fill: '#eef4e2', opacity: .4 });
    E(s, 'circle', { cx: f(q[0] - dr * .35), cy: f(q[1] - dr * .35), r: f(dr * .3), fill: '#fff', opacity: .9 });
  }
}
// Lotus flower seen from above (slightly tilted): 3 rings of petals, outer petals spread wide, inner petals cupped upright so shorter and overlapping;
// each petal white at the base turning pink at the tip, fine parallel veins, thin pink ink outline; in the middle a yellow-green seed pod with seed holes,
// a ring of yellow stamens. The flower's shadow falls far because it rises high above the water.
function lotusFlowerArt(s, cx, cy, R, seed) {
  const { E, G, R: Rng, f } = Ink, r = Rng(seed), id = 'lf' + seed;
  const defs = E(s, 'defs');
  for (const [k, tip] of [[0, '#de7799'], [1, '#e78fab'], [2, '#efa9bf']]) {
    const g = E(defs, 'linearGradient', { id: id + k, x1: 0, y1: 1, x2: 0, y2: 0 });
    E(g, 'stop', { offset: 0, 'stop-color': '#f6ece6' }); E(g, 'stop', { offset: .3, 'stop-color': '#fffaf7' }); E(g, 'stop', { offset: .62, 'stop-color': '#fbe6ec' }); E(g, 'stop', { offset: 1, 'stop-color': tip });
  }
  const petal = (len, wid, cup) => `M0,0 C${f(wid * .9)},${f(-len * .18)} ${f(wid)},${f(-len * (.62 - cup))} ${f(wid * .1)},${f(-len * .96)} Q0,${f(-len * 1.04)} ${f(-wid * .1)},${f(-len * .96)} C${f(-wid)},${f(-len * (.62 - cup))} ${f(-wid * .9)},${f(-len * .18)} 0,0Z`;
  const tilt = G(s, { transform: `translate(${f(cx)},${f(cy)}) rotate(${f(r() * 360)}) scale(1,${f(.86 + r() * .1)})` });
  E(tilt, 'circle', { cx: 5, cy: 7, r: f(R * .95), fill: '#1a2018', opacity: .2, filter: 'url(#blurM)' });
  const layers = [[7, R, R * .5, 0, 0], [6, R * .78, R * .44, .5, .08], [5, R * .52, R * .36, .2, .16]];
  layers.forEach(([n, len, wid, off, cup], li) => {
    // soft shadow of the inner petal ring cast onto the outer ring
    if (li) E(tilt, 'circle', { r: f(len * .9), fill: '#7a3048', opacity: .2, filter: 'url(#blurM)' });
    for (let i = 0; i < n; i++) {
      const a = (i + off + (r() - .5) * .3) / n * 360, L2 = len * (.88 + r() * .2), W2 = wid * (.9 + r() * .2);
      const g = G(tilt, { transform: `rotate(${f(a)})` });
      E(g, 'path', { d: petal(L2, W2, cup), fill: `url(#${id}${li})`, opacity: .97 });
      E(g, 'ellipse', { cx: 0, cy: f(-L2 * .82), rx: f(W2 * .45), ry: f(L2 * .18), fill: '#d0577f', opacity: .16, filter: 'url(#blurS)' });   // petal tip deeper in color
      const vg = G(g, { stroke: '#c76a8c', 'stroke-width': .3, fill: 'none', opacity: .4 });
      for (const k of [-.55, -.25, 0, .25, .55]) E(vg, 'path', { d: `M${f(W2 * k * .2)},${f(-L2 * .08)} Q${f(W2 * k * .95)},${f(-L2 * .5)} ${f(W2 * k * .35)},${f(-L2 * .9)}` });
      E(g, 'path', { d: petal(L2, W2, cup), fill: 'none', stroke: '#a3405f', 'stroke-width': .4, opacity: .45, filter: 'url(#brushF)' });
    }
  });
  // stamens: yellow filaments + anthers
  for (let i = 0; i < 34; i++) { const a = i / 34 * TAU + (r() - .5) * .1, r1 = R * .17, r2 = R * (.27 + r() * .07); E(tilt, 'line', { x1: f(Math.cos(a) * r1), y1: f(Math.sin(a) * r1), x2: f(Math.cos(a) * r2), y2: f(Math.sin(a) * r2), stroke: '#e9c44e', 'stroke-width': .55 }); E(tilt, 'circle', { cx: f(Math.cos(a) * r2), cy: f(Math.sin(a) * r2), r: .7, fill: '#d59a26' }); }
  // seed pod
  E(tilt, 'circle', { r: f(R * .19), fill: '#cdd27a', stroke: '#7d8a3a', 'stroke-width': .6 });
  E(tilt, 'circle', { cx: f(-R * .04), cy: f(-R * .05), r: f(R * .1), fill: '#e4e6a4', opacity: .7, filter: 'url(#blurS)' });
  for (let i = 0; i < 8; i++) { const a = i / 7 * TAU, rr = i ? R * .11 : 0; E(tilt, 'circle', { cx: f(Math.cos(a) * rr), cy: f(Math.sin(a) * rr), r: f(R * .03), fill: '#6f7a2c', opacity: .85 }); }
}
function lotusBudArt(s, cx, cy) {
  const { E, f } = Ink, id = 'lb' + cx;
  const defs = E(s, 'defs'), g = E(defs, 'linearGradient', { id, x1: 0, y1: 1, x2: 0, y2: 0 });
  E(g, 'stop', { offset: 0, 'stop-color': '#f7dde5' }); E(g, 'stop', { offset: .6, 'stop-color': '#e88aa8' }); E(g, 'stop', { offset: 1, 'stop-color': '#cf5f86' });
  E(s, 'ellipse', { cx: cx + 4, cy: cy + 6, rx: 9, ry: 15, fill: '#1a2018', opacity: .2, filter: 'url(#blurM)' });
  E(s, 'path', { d: `M${cx},${cy - 18} C${cx + 11},${cy - 8} ${cx + 10},${cy + 10} ${cx},${cy + 14} C${cx - 10},${cy + 10} ${cx - 11},${cy - 8} ${cx},${cy - 18}Z`, fill: `url(#${id})`, stroke: '#a3405f', 'stroke-width': .6, filter: 'url(#brushF)' });
  E(s, 'path', { d: `M${cx},${cy + 14} C${cx - 5},${cy + 6} ${cx - 4},${cy - 8} ${cx},${cy - 18}`, fill: 'none', stroke: '#b5577a', 'stroke-width': .5, opacity: .6 });
  E(s, 'path', { d: `M${cx - 7},${cy + 9} Q${cx},${cy + 3} ${cx + 7},${cy + 9}`, fill: 'none', stroke: '#5c7046', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
}

// Japanese maple leaf (Acer palmatum) seen from above: 7 deeply cut lanceolate lobes, doubly serrated edge, long pointed tips;
// color blending from orange-yellow at the base to red at the tips, dark pooled edge, main veins radiating from the stem, fine secondary veins,
// thin broken ink outline. Stem slightly curved, stem end kept at (x, y + r*.553) to match STEM.autumn.
function mapleArt(s, x, y, r, col, seed) {
  const { E, G, R: Rng, f } = Ink, rr = Rng(seed), id = 'mp' + seed;
  const mix = (a, b, t) => { const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16)); return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const light = mix(col, '#f0c050', .55), dark = mix(col, '#3a0e08', .45), ink = mix(col, '#1a0804', .75);
  // [angle offset from the up axis (deg), relative length, relative width]
  const lobes = [[0, 1, .19], [-42, .95, .185], [42, .95, .185], [-84, .78, .17], [84, .78, .17], [-124, .46, .14], [124, .46, .14]]
    .map(([a, l, w]) => [a + (rr() - .5) * 8, l * (.92 + rr() * .14), w * (.9 + rr() * .2)]).sort((p, q) => p[0] - q[0]);
  const rs = r * .16, pts = [], tips = [], gapT = Math.tan(19 * Math.PI / 180);   // adjacent lobes ~40° apart: width near the base never exceeds half the gap -> no overlap
  const P = (ang, along, side) => { const u = (ang - 90) * Math.PI / 180; return [x + Math.cos(u) * along - Math.sin(u) * side, y + Math.sin(u) * along + Math.cos(u) * side]; };
  for (const [ang, l, w] of lobes) {
    const L = r * l, W = r * w, n = 16, edge = [];
    const width = t => Math.min(W * Math.pow(Math.sin(Math.PI * Math.min(1, Math.pow(t, .75))), 1.1) * (1 - .2 * t), (rs + t * (L - rs)) * gapT);
    for (let i = 0; i <= n; i++) {
      const t = i / n, tooth = t > .3 && t < .96 ? (i % 2 ? .13 : -.05) * W * (1 - t * .4) : 0;
      edge.push([t, width(t) + tooth]);
    }
    // left edge from base up to tip, then right edge from tip down to base
    for (const [t, wv] of edge) pts.push(P(ang, rs + t * (L - rs), -wv));
    tips.push([ang, L]);
    for (let i = edge.length - 2; i >= 0; i--) { const [t, wv] = edge[i]; pts.push(P(ang, rs + t * (L - rs), wv)); }
  }
  const d = 'M' + pts.map(p => f(p[0]) + ',' + f(p[1])).join('L') + 'Z';
  const defs = E(s, 'defs');
  const cp = E(defs, 'clipPath', { id: id + 'c' }); E(cp, 'path', { d });
  const g = E(defs, 'radialGradient', { id, cx: f(x), cy: f(y), r: f(r), gradientUnits: 'userSpaceOnUse' });
  E(g, 'stop', { offset: 0, 'stop-color': light }); E(g, 'stop', { offset: .45, 'stop-color': col }); E(g, 'stop', { offset: 1, 'stop-color': dark });
  // stem: slightly curved, thickening toward the base
  const sx = x + (rr() - .5) * r * .12, ey = y + r * .553;
  E(s, 'path', { d: `M${f(x)},${f(y + r * .05)} Q${f(sx + r * .06)},${f(y + r * .3)} ${f(x)},${f(ey)}`, fill: 'none', stroke: ink, 'stroke-width': f(r * .07), 'stroke-linecap': 'round', opacity: .9 });
  E(s, 'path', { d, fill: `url(#${id})`, opacity: .95 });
  const Lg = G(s, { 'clip-path': `url(#${id}c)` });
  // watercolor blooms
  const wash = G(Lg, { filter: 'url(#blurS)' });
  for (let i = 0; i < 7; i++) { const [ang, L] = tips[Math.floor(rr() * tips.length)], q = P(ang, L * (.3 + rr() * .6), (rr() - .5) * r * .2); E(wash, 'circle', { cx: f(q[0]), cy: f(q[1]), r: f(r * (.08 + rr() * .12)), fill: rr() < .5 ? dark : light, opacity: .25 + rr() * .2 }); }
  E(Lg, 'rect', { x: f(x - r * 1.2), y: f(y - r * 1.2), width: f(r * 2.4), height: f(r * 2.4), filter: 'url(#paperTex)', opacity: .35 });
  // pooled edge
  E(Lg, 'path', { d, fill: 'none', stroke: dark, 'stroke-width': f(r * .12), opacity: .45, filter: 'url(#blurS)' });
  // main veins + secondary veins
  const vg = G(Lg, { stroke: ink, fill: 'none', 'stroke-linecap': 'round' });
  for (const [ang, L] of tips) {
    const m = P(ang, L * .5, (rr() - .5) * r * .03), e = P(ang, L * .93, 0);
    E(vg, 'path', { d: `M${f(x)},${f(y)}Q${f(m[0])},${f(m[1])} ${f(e[0])},${f(e[1])}`, 'stroke-width': f(r * .025), opacity: .45 });
    for (let k = 1; k <= 4; k++) for (const sd of [-1, 1]) {
      const t = .15 + k * .15, a0 = P(ang, rs + t * (L - rs), 0), a1 = P(ang, rs + (t + .1) * (L - rs), sd * r * .1 * (1 - t * .7));
      E(vg, 'path', { d: `M${f(a0[0])},${f(a0[1])}L${f(a1[0])},${f(a1[1])}`, 'stroke-width': f(r * .012), opacity: .3 });
    }
  }
  E(Lg, 'circle', { cx: f(x), cy: f(y), r: f(r * .06), fill: ink, opacity: .5 });
  // thin broken ink outline
  const dash = Array.from({ length: 6 }, () => f(r * (.6 + rr() * 2)) + ' ' + f(r * (.05 + rr() * .25))).join(' ');
  E(s, 'path', { d, fill: 'none', stroke: ink, 'stroke-width': f(r * .028), opacity: .75, 'stroke-dasharray': dash, 'stroke-linejoin': 'round' });
}

// Cherry blossom seen from above: 5 obovate petals, each tip with the characteristic small notch; petals white, pale pink at the edge,
// deepening toward the base, fine veins radiating from the base; deep red center, a tuft of thin stamens with yellow-brown tips, one pistil in the middle.
// Petals slightly offset in angle and varied in size, thin pink ink outline.
function sakuraPetalD(L, W, notch) {
  // base at (0,0), petal tip at (0,-L); notch of depth notch*L in the middle of the tip
  const { f } = Ink, n = L * notch, w = W / 2;
  return `M0,0 C${f(w * .55)},${f(-L * .12)} ${f(w * 1.05)},${f(-L * .55)} ${f(w * .78)},${f(-L * .9)} ` +
    `Q${f(w * .5)},${f(-L * 1.04)} ${f(w * .12)},${f(-L * .97)} L0,${f(-L + n)} L${f(-w * .12)},${f(-L * .97)} ` +
    `Q${f(-w * .5)},${f(-L * 1.04)} ${f(-w * .78)},${f(-L * .9)} C${f(-w * 1.05)},${f(-L * .55)} ${f(-w * .55)},${f(-L * .12)} 0,0Z`;
}
function sakuraArt(s, x, y, r, seed, col = '#f7d6de', rot = 0) {
  const { E, G, R, f } = Ink, rr = R(seed), id = 'sk' + seed;
  const defs = E(s, 'defs'), gr = E(defs, 'radialGradient', { id, cx: 0, cy: 0, r: r, gradientUnits: 'userSpaceOnUse' });
  E(gr, 'stop', { offset: 0, 'stop-color': '#d9587e' }); E(gr, 'stop', { offset: .28, 'stop-color': '#efa2b8' }); E(gr, 'stop', { offset: .6, 'stop-color': col }); E(gr, 'stop', { offset: 1, 'stop-color': '#fdf3f5' });
  const g = G(s, { transform: `translate(${f(x)},${f(y)}) rotate(${f(rot)})` });
  E(g, 'circle', { cx: .6, cy: .9, r: f(r * .95), fill: '#3a1a22', opacity: .14, filter: 'url(#blurS)' });   // soft shadow
  const a0 = rr() * 72;
  for (let i = 0; i < 5; i++) {
    const a = a0 + i * 72 + (rr() - .5) * 10, L = r * (1.02 + rr() * .14), W = r * (.82 + rr() * .12);
    const pg = G(g, { transform: `rotate(${f(a)})` }), d = sakuraPetalD(L, W, .13 + rr() * .05);
    E(pg, 'path', { d, fill: `url(#${id})`, opacity: .97 });
    // fine veins radiating from the base
    const vg = G(pg, { stroke: '#d9708e', 'stroke-width': f(r * .018), fill: 'none', opacity: .45 });
    for (const k of [-.55, -.28, 0, .28, .55]) E(vg, 'path', { d: `M0,${f(-L * .08)} Q${f(W * k * .45)},${f(-L * .5)} ${f(W * k * .38)},${f(-L * .86)}` });
    E(pg, 'path', { d, fill: 'none', stroke: '#b4566e', 'stroke-width': f(r * .025), opacity: .55, 'stroke-linejoin': 'round' });
  }
  // deep red center + stamen tuft + pistil
  E(g, 'circle', { r: f(r * .2), fill: '#a8243e', opacity: .85, filter: 'url(#blurS)' });
  const n = 16 + Math.floor(rr() * 6);
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + (rr() - .5) * .3, l = r * (.38 + rr() * .16), ex = Math.cos(a) * l, ey = Math.sin(a) * l;
    E(g, 'path', { d: `M${f(Math.cos(a) * r * .1)},${f(Math.sin(a) * r * .1)} Q${f(Math.cos(a + .15) * l * .6)},${f(Math.sin(a + .15) * l * .6)} ${f(ex)},${f(ey)}`, fill: 'none', stroke: '#f3e6e6', 'stroke-width': f(r * .022) });
    E(g, 'circle', { cx: f(ex), cy: f(ey), r: f(r * .045), fill: rr() < .5 ? '#e0b040' : '#b07a2a', stroke: '#6a4a1a', 'stroke-width': f(r * .008) });
  }
  E(g, 'circle', { r: f(r * .05), fill: '#c8d88a', stroke: '#6a7a3a', 'stroke-width': f(r * .01) });
}
// falling petal: a single notched petal, darker at the base, fine veins, slightly curved (tilted over)
function sakuraPetalArt(s, x, y, s0, rot, col, seed) {
  const { E, G, f } = Ink, id = 'skp' + seed, L = 7 * s0, W = 5.6 * s0;
  const defs = E(s, 'defs'), gr = E(defs, 'linearGradient', { id, x1: 0, y1: 1, x2: 0, y2: 0 });
  E(gr, 'stop', { offset: 0, 'stop-color': '#e07a98' }); E(gr, 'stop', { offset: .35, 'stop-color': col }); E(gr, 'stop', { offset: 1, 'stop-color': '#fff5f7' });
  const g = G(s, { transform: `translate(${f(x)},${f(y + L / 2)}) rotate(${f(rot)} 0 ${f(-L / 2)})` });
  const d = sakuraPetalD(L, W, .15);
  E(g, 'path', { d, fill: `url(#${id})` });
  const vg = G(g, { stroke: '#d9708e', 'stroke-width': .18, fill: 'none', opacity: .5 });
  for (const k of [-.4, 0, .4]) E(vg, 'path', { d: `M0,${f(-L * .1)} Q${f(W * k * .45)},${f(-L * .5)} ${f(W * k * .36)},${f(-L * .85)}` });
  E(g, 'path', { d, fill: 'none', stroke: '#b4566e', 'stroke-width': .25, opacity: .6 });
}

function spriteSVG(w, h, draw, scale = 2) { const s = newSVG(w, h, scale); draw(s); return s; }
async function spriteSet(key) {
  const out = {};
  if (SEASONS[key].lotus) {
    const leafCol = key === 'autumn' ? '#8a7a3a' : '#4f6b3c';
    out.lotus = await Promise.all([0, 1, 2, 3].map(i => raster(spriteSVG(100, 100, s => lotusLeafArt(s, 50, 50, 44, i * 95 + 20, key === 'autumn', 900 + i)))));
  }
  if (SEASONS[key].flowers) {
    out.flower = await Promise.all([0, 1].map(i => raster(spriteSVG(130, 130, s => { lotusLeafArt(s, 65, 65, 46, 40 + i * 140, false, 950 + i); lotusFlowerArt(s, 65, 64, 28, 960 + i); }))));   // flower rises from the middle of the leaf
    out.bud = [await raster(spriteSVG(60, 60, s => lotusBudArt(s, 30, 30)))];
  }
  if (key === 'spring') out.fall = await Promise.all([0, 1].map(i => raster(spriteSVG(20, 20, s => sakuraPetalArt(s, 10, 10, 1.7, i * 40, i ? '#f6c9d4' : '#f2b8c6', 70 + i), 4))));
  if (key === 'spring') out.bloom = await Promise.all(['#f7d6de', '#fbe9ee', '#f9dfe6'].map((c, i) => raster(spriteSVG(30, 36, s => {
    Ink.E(s, 'path', { d: 'M15,34 C14,30 16,25 15,20', fill: 'none', stroke: '#5a3a2a', 'stroke-width': 1, 'stroke-linecap': 'round' });
    sakuraArt(s, 15, 14, 10, 40 + i, c, i * 23);
  }, 4))));
  if (key === 'autumn') {
    const cols = ['#a8321e', '#c4512b', '#d9823a', '#8c2a1a', '#b8402a', '#e09a40'];
    out.leaf = await Promise.all(cols.map((c, i) => raster(spriteSVG(40, 40, s => mapleArt(s, 20, 20, 15, c, 700 + i), 4))));
    out.fall = out.leaf;
  }
  if (key === 'winter') {
    const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 15);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.5, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    out.fall = [c];
    out.ice = await Promise.all([0, 1, 2].map(i => raster(spriteSVG(120, 80, s => {
      const d = Ink.blob(60, 40, 52, 32, 40 + i, .3, 9), rr = Ink.R(70 + i);
      Ink.E(s, 'path', { d, fill: '#ffffff', opacity: .62, filter: 'url(#brush)' });
      Ink.E(s, 'path', { d, fill: 'none', stroke: '#5a6670', 'stroke-width': 1, opacity: .7, filter: 'url(#brush)' });
      for (let k = 0; k < 5; k++) { let px = 60 + (rr() - .5) * 60, py = 40 + (rr() - .5) * 34, dd = `M${px.toFixed(1)},${py.toFixed(1)}`; for (let q = 0; q < 4; q++) { px += (rr() - .5) * 26; py += (rr() - .5) * 16; dd += `L${px.toFixed(1)},${py.toFixed(1)}`; } Ink.E(s, 'path', { d: dd, fill: 'none', stroke: '#6a737c', 'stroke-width': .7, opacity: .8 }); }
    }))));
  }
  return out;
}

function drawCalligraphy(c, S) {
  const x = c.getContext('2d'), k = c.width / DW;
  x.save(); x.scale(k, k);
  x.fillStyle = 'rgba(20,20,20,.9)'; x.textAlign = 'center'; x.textBaseline = 'top';
  x.font = '34px "Yuji Syuku", "Noto Serif JP", serif';
  [...S.poem].forEach((ch, i) => x.fillText(ch, 58, 34 + i * 42));
  x.fillStyle = 'rgba(20,20,20,.65)'; x.font = '18px "Yuji Syuku", "Noto Serif JP", serif';
  [...S.sub].forEach((ch, i) => x.fillText(ch, 98, 44 + i * 24));
  x.restore();
}

// ======================================================================
// Scene: underwater layer (bottom + fish) renders into an RT, the water surface layer is processed by a wave shader,
// then the above-water layers (shore, floating objects, tree, falling objects) are drawn on top.
// ======================================================================
const waterScene = new THREE.Scene(), overScene = new THREE.Scene();
const hemi = new THREE.HemisphereLight('#fffaf0', '#8a8370', .95); waterScene.add(hemi);
const sun = new THREE.DirectionalLight('#fff6e6', 2.4);
sun.position.set(-24, 62, -20); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 30, bottom: -30, near: 20, far: 130 });
sun.shadow.radius = 10; sun.shadow.blurSamples = 16; sun.shadow.bias = -.0005;
waterScene.add(sun);
const FLOOR_Y = -9, SURF_Y = 0, SHORE_Y = .4, FLOAT_Y = .2, TREE_Y = 10;

function screenPlane(y, mat, segs = 1) {
  const v = viewAt(y), m = new THREE.Mesh(new THREE.PlaneGeometry(v.w * 1.01, v.h * 1.01, segs, Math.max(1, Math.round(segs / ASPECT))), mat);
  m.rotation.x = -Math.PI / 2; m.position.y = y; return m;
}
const swayVert = /* glsl */ `
  uniform float uTime, uGust, uSway; uniform vec2 uWind, uPivot; varying vec2 vUv;
  void main() {
    vUv = uv; vec3 p = position;
    float d = distance(uv, uPivot);
    float w = (sin(uTime * 1.3 + uv.x * 5.0) * .6 + sin(uTime * 2.3 + uv.y * 7.0) * .4) * uGust;
    p.xy += vec2(uWind.x, -uWind.y) * (w * .6 + uGust * .5) * d * d * uSway;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
function swayMat(tex, shadow) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false,
    uniforms: { map: { value: tex }, uOpacity: { value: 0 }, uTime: { value: 0 }, uGust: { value: 0 }, uSway: { value: shadow ? 1.4 : 2.4 }, uWind: { value: new THREE.Vector2(-1, 0) }, uPivot: { value: new THREE.Vector2(1, 1) }, uShadow: { value: shadow ? 1 : 0 } },
    vertexShader: swayVert,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform float uOpacity, uShadow; varying vec2 vUv;
      void main() {
        vec4 c = texture(map, vUv);
        gl_FragColor = uShadow > .5 ? vec4(0.02, .03, .03, c.a * uOpacity * .2) : vec4(c.rgb, c.a * uOpacity);
        #include <colorspace_fragment>
      }`,
  });
}
const basicLayer = (tex) => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false, opacity: 0 });

// ---------- Koi ----------
const gltf = await new GLTFLoader().loadAsync('/models/koi.glb');
const srcMesh = gltf.scene.getObjectByProperty('type', 'Mesh'), srcMat = srcMesh.material;
srcMat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
const koiGeo = new THREE.BufferGeometry();
for (const k of ['position', 'normal', 'uv', 'tangent']) if (srcMesh.geometry.attributes[k]) koiGeo.setAttribute(k, srcMesh.geometry.attributes[k]);
koiGeo.setIndex(srcMesh.geometry.index);
const NODE_Q = srcMesh.parent.quaternion.clone();

const SWIM_PARS = /* glsl */ `
  uniform float uPhase, uAmp, uTurn, uWave, uFinL, uFinR;
  // Spine: 9 points (mesh coords) evenly spaced along the body length, taken from the swim trail -> body follows the path.
  uniform float uSX[9], uSZ[9];
  vec2 spineP(int i) { return vec2(uSX[i], uSZ[i]); }
  vec2 spineT(int i) { return normalize(spineP(i) - spineP(i + 1) + vec2(1e-5, 0.0)); }   // pointing toward the head
  // point + tangent on the spine at s (0 = snout, 1 = tail tip); past the tail, extend along the last tangent
  void spineAt(float s, out vec2 P, out vec2 T) {
    float sc = clamp(s, 0.0, 1.0), f = sc * 8.0; int i = int(min(floor(f), 7.0)); float t = f - float(i);
    vec2 t0 = spineT(max(i - 1, 0)), t1 = spineT(i), t2 = spineT(min(i + 1, 7));
    T = normalize(t < .5 ? mix(mix(t0, t1, .5), t1, t * 2.0) : mix(t1, mix(t1, t2, .5), t * 2.0 - 1.0));
    P = mix(spineP(i), spineP(i + 1), t) - T * max(s - 1.0, 0.0) * 6.39;
  }
  float waveZ(float s) { return uAmp * (0.03 + 0.12 * s + 0.85 * s * s) * sin(uPhase - s * uWave); }
  varying vec3 vKoiPos;
  float swimS(float x) { return clamp((2.87 - x) / 6.39, 0.0, 1.0); }
  float swimZ(float x) { return waveZ(swimS(x)); }
  float swimSlope(float x) { return (swimZ(x - 0.04) - swimZ(x + 0.04)) / -0.08; }
`;
// Mesh coords: head +x (2.87), tail -x (-3.52), back +y, flanks ±z.
// Fins are identified by position: tail x < -2.3, dorsal fin y > .62, pectoral fins |z| > .72 underneath, pelvic fins y < -.85.
// Following the carangiform swimming kinematics of carp/koi:
//  - soft tail fin, trailing edge lags in phase behind the caudal peduncle, both lobes slightly cupped;
//  - dorsal fin upright, only flutters passively and very slightly with the body;
//  - pectoral fins fold against the body when swimming fast, spread and paddle when slow/braking; when turning the inner fin spreads to brake.
const FIN_POS = /* glsl */ `
  vKoiPos = position;
  {
    vec3 p0 = position;
    float tr = smoothstep(-2.4, -3.5, p0.x), ty = p0.y + .2;
    // The model's tail is an upright fin with asymmetric lobes (upper long pointing back, lower short pointing down). Rotate the tail blade flat
    // using polar coords around the peduncle, make the two lobes' opening angles symmetric (~±32°) and lengthen the lower lobe -> balanced forked fan.
    // The tail spreads when sweeping sideways hardest (lateral tail velocity ~ cos of the wave at the tail).
    float sweep = abs(cos(uPhase - uWave * .95));
    {
      float L = max(0.0, -p0.x - 2.4), th = atan(ty, L + 1e-4), r = length(vec2(L, ty));
      // the model's lobes leave a wide V between them (upper 27..61° from the axis, lower 56..87°): pull both inner
      // edges in to ±6° and the outer edges to ±38° -> one full fan with a shallow fork; lower lobe stretched to the upper's length
      float tl = -th;
      float th2 = (th > 0.0 ? (th < .473 ? th * .221 : .1047 + (th - .473) * .955)
                            : -(tl < .972 ? tl * .108 : .1047 + (tl - .972) * 1.019)) * (1.0 + .18 * sweep);
      float r2 = r * (th < 0.0 ? 1.0 + .24 * smoothstep(0.0, .6, tl) : 1.0) * (1.1 + .06 * sweep);
      transformed.xz = mix(transformed.xz, vec2(-2.4 - cos(th2) * r2, sin(th2) * r2), tr);
    }
    // Soft tail but JOINED to the body: the extra bend uses exactly the body's wave at that position, only the phase lag grows
    // toward the tail edge and lobe edges -> the tail continues the wave, never out of rhythm.
    float sT = swimS(p0.x), lag = tr * 1.1 + abs(ty) * tr * .5;
    transformed.z += uAmp * tr * (.55 + .45 * abs(ty)) * sin(uPhase - sT * uWave - lag);
    float dm = smoothstep(.82, 1.05, p0.y) * smoothstep(.16, .08, abs(p0.z)) * smoothstep(-1.0, -.55, p0.x) * smoothstep(1.5, 1.0, p0.x);
    // the model's dorsal fin has thickness -> seen from above it becomes a band; flatten + lower it to leave only a thin line along the spine
    float dq = smoothstep(.72, .9, p0.y) * smoothstep(.22, .1, abs(p0.z)) * step(-1.1, p0.x) * step(p0.x, 1.6);
    transformed.z = mix(transformed.z, transformed.z * .18, dq) + (p0.y - .62) * dm * .04 * sin(uPhase - 2.8 - p0.x);
    transformed.y = mix(transformed.y, .76 + (p0.y - .76) * .35, dq);
    float pm = smoothstep(.7, .88, abs(p0.z)) * smoothstep(.35, .6, p0.x) * smoothstep(1.25, 1.0, p0.x) * step(p0.y, -.3);
    // original pectoral fins are just a few triangles: collapse to the root (hidden), round fan fins are attached separately in JS
    // hard mask: every vertex of the original fin collapses fully to one point inside the body (a soft mask leaves spikes)
    float pmHard = step(.62, abs(p0.z)) * step(.25, p0.x) * step(p0.x, 1.6) * step(p0.y, -.2);
    transformed = mix(transformed, vec3(.95, -.4, sign(p0.z) * .4), pmHard);
    float vm = smoothstep(-.82, -.95, p0.y) * step(-.75, p0.x) * step(p0.x, .15);
    // pelvic fins: seen from above they only poke out as spikes -> tuck under the belly
    float vmHard = max(step(p0.y, -.8) * step(-.8, p0.x) * step(p0.x, .2) * step(.3, abs(p0.z)),
                       step(p0.y, -.6) * step(-.1, p0.x) * step(p0.x, .4) * step(.45, abs(p0.z)));
    transformed = mix(transformed, vec3(p0.x, -.75, sign(p0.z) * .25), vmHard);
    // final clamp: no vertex in the gill/fin-root area may stick out past the body edge
    float gill = step(.2, p0.x) * step(p0.x, 1.7) * step(p0.y, -.15);
    transformed.z = mix(transformed.z, sign(transformed.z) * min(abs(transformed.z), .56), gill);
    // belly area (pelvic fins, original anal fin): no vertex sticks out past the body edge, edge tapering toward the tail
    float belly = step(-2.5, p0.x) * step(p0.x, .5) * step(p0.y, -.3);
    float hwB = mix(.28, .5, clamp((p0.x + 2.4) / 2.9, 0.0, 1.0));
    transformed.z = mix(transformed.z, sign(transformed.z) * min(abs(transformed.z), hwB), belly);
  }
`;
// Place each vertex on the spine at its exact position along the body, offset along the normal: preserves length,
// cross-section always perpendicular to the spine -> sharp turns don't distort. Swim wave is added along the normal.
const SWIM_POS = `{
  float s = (2.87 - transformed.x) / 6.39;
  // from the caudal peduncle back: share the frame at the peduncle (tail like a fan attached to it) -> sharp turns don't squash the tail
  float rig = smoothstep(.8, .88, s), sF = mix(s, min(s, .86), rig);
  vec2 P, T; spineAt(sF, P, T); P -= T * (s - sF) * 6.39;
  float a = atan(swimSlope(position.x)) * (1.0 - rig * .5); vec2 N = vec2(-T.y, T.x);
  vec2 Tw = T * cos(a) + N * sin(a), Nw = vec2(-Tw.y, Tw.x);
  vec2 q = P + N * waveZ(clamp(s, 0.0, 1.0)) + Nw * transformed.z;
  transformed.x = q.x; transformed.z = q.y;
}`;
const SWIM_NRM = `{ vec2 P, T; float sN = (2.87 - position.x) / 6.39; spineAt(mix(sN, min(sN, .86), smoothstep(.8, .88, sN)), P, T); float a = atan(swimSlope(position.x)) + atan(T.y, T.x); objectNormal.xz = vec2(objectNormal.x * cos(a) - objectNormal.z * sin(a), objectNormal.x * sin(a) + objectNormal.z * cos(a)); }`;
// Pattern drawn with 3D noise over body coords + per-fish seed: each fish its own pattern, independent of the original texture.
// Palette keeps ink-wash tones: vermilion, paper white, ink black.
const PATTERN_GLSL = /* glsl */ `
  {
    vec3 c = diffuseColor.rgb, p = vKoiPos;
    float l = sqrt(max(dot(c, vec3(.2126, .7152, .0722)), 0.0));
    float redT = smoothstep(.05, .22, c.r - max(c.g, c.b));                      // red patches pre-painted in the texture
    vec3 q = vec3(p.x * .85, p.y * 1.3, p.z * 1.7) + uSeed;
    // Each fish's red patches: shape taken from the texture then grown/shrunk/removed by its own noise -> no two fish alike
    float red = smoothstep(.42, .58, redT + (fbm(q * 1.1) - .5) * 1.25 + uRedBias);
    float top = smoothstep(-.35, .3, p.y), s = clamp((2.87 - p.x) / 6.39, 0.0, 1.0), side = p.z / .62;
    float fin = max(max(smoothstep(-2.3, -2.6, p.x), smoothstep(.82, 1.05, p.y) * smoothstep(.16, .08, abs(p.z)) * smoothstep(-1.0, -.55, p.x) * smoothstep(1.5, 1.0, p.x)),
                max(smoothstep(.7, .85, abs(p.z)) * step(p.y, -.3), smoothstep(-.8, -.95, p.y)));
    vec3 shade = vec3(clamp(.34 + 1.0 * l, 0.0, 1.1));
    vec3 W = vec3(.83, .79, .70) * shade, VER = vec3(.62, .07, .025) * (.55 + .7 * l), BLK = vec3(.012, .012, .013) + .045 * l;
    #if KOI_VARIANT == 0      // Kohaku
      c = mix(W, VER, red);
    #elif KOI_VARIANT == 1    // Taishō Sanke: Kohaku + ink spots on the back
      c = mix(W, VER, red);
      c = mix(c, BLK, patchN(q + 4.0, 2.6, .68) * top * step(.16, s) * (1.0 - fin));
    #elif KOI_VARIANT == 2    // Shōwa
      c = mix(BLK, VER, red);
      c = mix(c, W, patchN(q + 9.0, 1.3, .62) * (1.0 - red));
    #elif KOI_VARIANT == 3    // Asagi: indigo back, orange flanks + fins
      c = mix(vec3(.75, .26, .06) * shade, vec3(.17, .25, .35) * shade * 1.2, top);
      c = mix(c, vec3(.75, .26, .06) * shade, fin * .8);
    #elif KOI_VARIANT == 4    // Shūsui: pale Asagi + row of dark blue scales along the spine
      c = mix(vec3(.75, .26, .06) * shade, vec3(.4, .48, .56) * shade, top);
      c = mix(c, vec3(.08, .12, .2), smoothstep(.28, .18, abs(side)) * top * step(.12, s) * step(.5, fract(p.x * 4.5)));
    #elif KOI_VARIANT == 5    // Chagoi
      c = vec3(.30, .17, .08) * shade;
    #elif KOI_VARIANT == 6    // Ogon
      c = mix(vec3(.10, .055, .012), vec3(.95, .66, .2), l * 1.15);
    #elif KOI_VARIANT == 7    // Platinum Ogon
      c = vec3(.92, .91, .88) * shade;
    #elif KOI_VARIANT == 8    // Karasu
      c = BLK;
    #elif KOI_VARIANT == 9    // Tanchō: only one round red spot on the head
      c = mix(W, VER, smoothstep(1.0, .9, length(vec2((s - .065) * 6.39, side * .62)) / .42) * top);
    #elif KOI_VARIANT == 10   // Kumonryū: black and white like clouds
      c = mix(W, BLK, patchN(q, 1.5, .5));
    #elif KOI_VARIANT == 11   // Hi Utsuri: ink base, large red
      c = mix(BLK, VER, smoothstep(.3, .5, redT + (fbm(q) - .5) + .1));
    #else                     // Ochiba: blue-grey + brown patches
      c = mix(vec3(.32, .35, .38) * shade, vec3(.5, .3, .14) * shade, red);
    #endif
    c = mix(c, W * 1.06, fin * .35);
    // dorsal fin: no body pattern -- translucent fin color, thin ray lines, only a faint tint of the fish color
    float dor = smoothstep(.82, 1.05, p.y) * smoothstep(.16, .08, abs(p.z)) * smoothstep(-1.0, -.55, p.x) * smoothstep(1.5, 1.0, p.x);
    float dark = step(dot(c, vec3(.33)), .08) * step(.5, float(KOI_VARIANT == 2 || KOI_VARIANT == 8 || KOI_VARIANT == 11));
    vec3 finTone = mix(mix(vec3(.8, .78, .72), vec3(.2, .2, .21), dark), c, .15);
    float rays = .88 + .12 * sin((p.x + p.y * .35) * 46.0);
    c = mix(c, c * .45 + finTone * .05, dor);                          // dorsal fin line darker than the body
    diffuseColor.rgb = c;
    diffuseColor.a *= 1.0 - fin * (.18 + .37 * finTip(p)) ;            // koi fins nearly transparent, edge clearer than the base
  }
`;
const PATTERN_PARS = /* glsl */ `
  varying vec3 vKoiPos;
  uniform float uSeed, uRedBias;
  float h3(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float n3(vec3 x) {
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { return .55 * n3(p) + .3 * n3(p * 2.03 + 7.1) + .15 * n3(p * 4.1 + 3.3); }
  // color patch edges sharp but slightly jagged, like scale edges (kiwa)
  float patchN(vec3 q, float sc, float th) { float n = fbm(q * sc) + .035 * n3(q * 18.0); return smoothstep(th - .02, th + .02, n); }
  float headCap(float s, float side) { return smoothstep(1.0, .85, length(vec2((s - .07) * 6.39, side * .62)) / .55); }
  float finTip(vec3 p) { return clamp(max(max((-p.x - 2.5) / .9, (abs(p.z) - .75) / .4), (p.y - .7) / .9), 0.0, 1.0); }
`;
const gradientMap = (() => { const t = new THREE.DataTexture(new Uint8Array([60, 140, 210, 255]), 4, 1, THREE.RedFormat); t.needsUpdate = true; t.minFilter = t.magFilter = THREE.NearestFilter; return t; })();
function swimInject(m, U, key, extra = '') {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = SWIM_PARS + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + FIN_POS + SWIM_POS + extra);
    if (sh.vertexShader.includes('#include <beginnormal_vertex>')) sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n' + SWIM_NRM);
    if (m.userData.variant !== undefined) {
      sh.defines = { ...(sh.defines || {}), KOI_VARIANT: m.userData.variant };
      sh.fragmentShader = PATTERN_PARS + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n' + PATTERN_GLSL);
    }
  };
  m.customProgramCacheKey = () => key;
  return m;
}


// ---------- Pectoral fins: round fan, translucent, with rays ----------
const PEC_COL = {
  light: ['#f1ddd2', '#f4efe6'], motoguro: ['#18181a', '#e6e0d6'], black: ['#141416', '#3c3c3e'], orange: ['#d8742f', '#f2bf92'],
  tea: ['#8a6040', '#cfa985'], gold: ['#d9a640', '#f3d993'], grey: ['#66717c', '#cbd0d4'],
};
const PEC_OF_VARIANT = { 0: 'light', 1: 'light', 9: 'light', 7: 'light', 2: 'motoguro', 11: 'motoguro', 10: 'motoguro', 8: 'black', 3: 'orange', 4: 'orange', 5: 'tea', 6: 'gold', 12: 'grey' };
const pecTex = {};
// faint pattern spots on the fin per variety: vermilion, ink black, brown
// ink-wash tones: muted vermilion, brown-black ink, blue-grey, brown, ochre
const PEC_SPOTS = { 0: ['#b8402a'], 1: ['#b8402a', '#2a2622'], 2: ['#b8402a', '#2a2622'], 3: ['#6a8296'], 4: ['#4a5f78'], 5: ['#6a4a30'], 6: ['#c09040'], 10: ['#2a2622'], 11: ['#b8402a'], 12: ['#7a5236'] };
function pecTexture(variant, seed = 1) {
  const key = PEC_OF_VARIANT[variant] || 'light';
  const [rootC, baseC] = PEC_COL[key];
  // Real koi pectoral fin: straight, long leading edge; round, short trailing edge; whole fin swept back.
  // Thin, slightly curved rays; membrane between rays clearer than the rays. Top edge of the image = leading edge of the fin.
  const c = cv(220, 260, (x, w, h) => {
    const ox = 8, oy = 90, R = 205, a0 = -.62, a1 = 1.05, RAYS = 16;
    const rad = (t) => R * (1 - .45 * Math.pow(t, 1.3));
    const at = (t, k = 1) => { const a = lerp(a0, a1, t), r = rad(t) * k * (1 - .018 * (1 - Math.cos(t * (RAYS - 1) * TAU))); return [ox + Math.cos(a) * r, oy + Math.sin(a) * r]; };
    const path = () => { x.beginPath(); x.moveTo(ox, oy - 5); for (let i = 0; i <= 80; i++) x.lineTo(...at(i / 80)); x.lineTo(ox, oy + 7); x.closePath(); };
    const g = x.createRadialGradient(ox, oy, 0, ox, oy, R);
    g.addColorStop(0, rootC); g.addColorStop(.32, baseC); g.addColorStop(1, baseC);
    path(); x.fillStyle = g; x.fill();
    // lightly overlay the fish's pattern onto the fin membrane (near the base, faint)
    const spots = PEC_SPOTS[variant];
    if (spots) {
      let sd = seed * 9301 + 49297; const rr = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
      x.save(); path(); x.clip(); x.globalCompositeOperation = 'source-atop';
      // pigment runs along the fin rays (like real koi fins): each band covers 2-4 adjacent rays, dark in the middle, fading at both ends
      for (let i = 0; i < 2 + Math.floor(rr() * 3); i++) {
        const t0 = rr() * .8, t1 = Math.min(1, t0 + (2 + rr() * 2) / 16), k0 = .12 + rr() * .35, k1 = Math.min(1, k0 + .3 + rr() * .5);
        const col = spots[Math.floor(rr() * spots.length)];
        const mid = at((t0 + t1) / 2, (k0 + k1) / 2), far = at((t0 + t1) / 2, k1), near = at((t0 + t1) / 2, k0);
        const lg = x.createLinearGradient(near[0], near[1], far[0], far[1]);
        lg.addColorStop(0, col + '00'); lg.addColorStop(.3, col); lg.addColorStop(.7, col); lg.addColorStop(1, col + '00');
        x.beginPath();
        for (let j = 0; j <= 10; j++) x.lineTo(...at(t0 + (t1 - t0) * j / 10, k0));
        for (let j = 10; j >= 0; j--) x.lineTo(...at(t0 + (t1 - t0) * j / 10, k1));
        x.closePath(); x.globalAlpha = .3 + rr() * .22; x.fillStyle = lg; x.fill();
      }
      x.restore(); x.globalAlpha = 1;
    }
    x.globalCompositeOperation = 'destination-in';
    const ga = x.createRadialGradient(ox, oy, 0, ox, oy, R);
    ga.addColorStop(0, 'rgba(0,0,0,.95)'); ga.addColorStop(.45, 'rgba(0,0,0,.6)'); ga.addColorStop(1, 'rgba(0,0,0,.3)');
    x.fillStyle = ga; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'source-over';
    x.save(); path(); x.clip();
    for (let i = 0; i < RAYS; i++) {
      const t = (i + .5) / RAYS, e = at(t), m = at(t - .04, .5);              // rays curve slightly forward then sweep out
      // rays start ~18% of the radius from the base: if all converged to one point they'd form a black spike where the fin emerges
      const b = at(t, .18);
      x.strokeStyle = i === 0 ? 'rgba(40,30,22,.28)' : 'rgba(40,30,22,.2)'; x.lineWidth = i === 0 ? 1.6 : 1.3;
      x.beginPath(); x.moveTo(b[0], b[1]); x.quadraticCurveTo(m[0], m[1], e[0], e[1]); x.stroke();
      x.strokeStyle = 'rgba(255,252,246,.28)'; x.lineWidth = .8;
      x.beginPath(); x.moveTo(b[0] + 1, b[1] - 1); x.quadraticCurveTo(m[0] + 1, m[1] - 1, e[0] + 1, e[1] - 1); x.stroke();
      if (key === 'motoguro') { const q = at(t, .4); x.strokeStyle = 'rgba(15,15,15,.75)'; x.lineWidth = 4; x.beginPath(); x.moveTo(b[0], b[1]); x.lineTo(q[0], q[1]); x.stroke(); }
    }
    x.restore();
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
// Fan lies on the mesh XZ plane, base at x = 0, spreading along +x
// fin base (pixel 8, 90 in the 220x260 image) placed at the origin
const PEC_GEO = (() => { const W = 1.3, H = W * 260 / 220; return new THREE.PlaneGeometry(W, H).translate(W / 2 - 8 / 220 * W, -(H / 2 - 90 / 260 * H), 0).rotateX(-Math.PI / 2); })();


// turn rhythm (tunable via window.KOI_TUNE): t1/t2 = duration of stage 1 (C bend) / stage 2 (counter-bend) of a normal turn (seconds),
// depth = max tail offset in the C bend (mesh units, body length 6.39), counter = counter-bend depth relative to the C bend,
// follow = how much the body follows the turn trail, relax/straighten = after how long and how much it straightens when a turn drags on
const TUNE = window.KOI_TUNE = { t1: .22, t2: 1, depth: .25, counter: .45, follow: .85, relax: 1.3, straighten: .35 };
const smooth01 = x => x * x * (3 - 2 * x);
const KOI_SCALE = 1.6, KOI_PIVOT = 1.7;              // KOI_PIVOT: mesh units, shifts the body back so the pivot sits at the front 1/3
const RIPPLE = [];                                   // ripple sources for the wave shader this frame
const splash = (u, v, r, a) => { if (RIPPLE.length < 12) RIPPLE.push([u, v, r, a]); };
const foods = [];                                    // food pellets: see the 'Food' section

class Koi {
  constructor(o) {
    Object.assign(this, { x: 0, z: 0, y: -2, ty: -2, heading: 0, size: 1, variant: 1, seed: Math.random() * 100, cruise: 4.4, cur: 3, turn: 0, phase: rnd(0, 6), beat: .5, burstT: 0, thrust: .8, startle: 0, nextDepth: rnd(4, 12), sipT: rnd(2, 8) }, o);
    this.U = { uPhase: { value: 0 }, uAmp: { value: .3 }, uTurn: { value: 0 }, uSX: { value: Array.from({ length: 9 }, (_, k) => 2.87 - k / 8 * 6.39) }, uSZ: { value: new Array(9).fill(0) }, uWave: { value: 5.2 }, uFinL: { value: .5 }, uFinR: { value: .5 }, uSeed: { value: rnd(0, 50) }, uRedBias: { value: rnd(-.12, .15) } };
    const toon = new THREE.MeshToonMaterial({ map: srcMat.map, gradientMap, transparent: true, side: THREE.DoubleSide });   // double-sided: the tail twisting during turns doesn't lose half
    toon.userData.variant = this.variant;
    this.root = new THREE.Group(); const body = new THREE.Group(); body.quaternion.copy(NODE_Q); this.root.add(body);
    body.position.x = KOI_PIVOT;                       // pivot near the head: head leads, body + tail follow the swim trail
    this.mesh = new THREE.Mesh(koiGeo, swimInject(toon, this.U, `koi-${this.variant}`)); this.mesh.renderOrder = 1;
    this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = swimInject(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), this.U, 'koi-depth');
    body.add(this.mesh);   // no ink outline: body blends seamlessly with the translucent fins/tail
    this.pecs = [];
    const pecMat = new THREE.MeshToonMaterial({ map: pecTexture(this.variant, Math.floor(rnd(1, 9999))), gradientMap, transparent: true, depthWrite: false, side: THREE.DoubleSide, alphaTest: .04 });
    for (const sd of [1, -1]) {
      const pivot = new THREE.Group(); pivot.position.set(1.45, -.36, sd * .46); body.add(pivot);   // right behind the gills, root hidden under the body edge
      const m = new THREE.Mesh(PEC_GEO, pecMat); m.castShadow = true; m.renderOrder = -1; if (sd < 0) m.scale.z = -1; pivot.add(m);   // drawn before the body: body covers the fin root
      const k = rnd(.85, 1.15); m.scale.x *= k; m.scale.z *= k;      // per-fish fin size
      this.pecs.push({ pivot, m, sd, bias: rnd(-.1, .14), seed: rnd(0, 9), back: 0, flap: .2, rest: pivot.position.clone() });   // per-fish fold angle, left/right differ
    }
    // pelvic fins: same fan style, smaller (~55%), mid-body under the belly edge, swept back more
    for (const sd of [1, -1]) {
      const pivot = new THREE.Group(); pivot.position.set(.05, -.58, sd * .3); body.add(pivot);
      const m = new THREE.Mesh(PEC_GEO, pecMat); m.castShadow = true; m.renderOrder = -1; if (sd < 0) m.scale.z = -1; pivot.add(m);
      const k = rnd(.5, .62); m.scale.x *= k; m.scale.z *= k;
      this.pecs.push({ pivot, m, sd, bias: rnd(-.08, .1), seed: rnd(0, 9), back: .32, flap: .1, rest: pivot.position.clone() });
    }
    this.root.scale.setScalar(this.size * KOI_SCALE);
    waterScene.add(this.root);
  }
  head() { const L = (2.87 - KOI_PIVOT) * this.size * KOI_SCALE; return [this.x + Math.cos(this.heading) * L, this.z + Math.sin(this.heading) * L]; }
  // one turn: D = turn angle (rad, signed); fast = startle (much faster C-start)
  startTurn(D, fast = false) { this.ev = { D, t: 0, prev: 0, fast, t1: fast ? .11 : TUNE.t1 * rnd(.85, 1.15), t2: fast ? .17 : TUNE.t2 }; }
  update(dt, t, others, pointer) {
    this.t = t;
    // Turning per koi research (Wu, Yang & Zeng 2007, J Exp Biol 210:4379): fish mostly turn in "a single beat":
    //  stage 1: body bends into a C toward the turn, most of the turn angle happens here, near-fixed duration;
    //  stage 2: body + tail flip back to the other side (the push), then swim straight/glide. Between turns fish go nearly straight.
    // Startle = C-start (Eaton 1988, goldfish): stage 1 rotates the body 30-100° very fast, stage 2 darts straight; trajectory straight afterwards.
    let want = this.cruise, desired, urg = 0;
    // Food: reaction delay, swim over, slow down, rise right under the pellet, lift the head and gulp.
    this.gulpCD = (this.gulpCD || 0) - dt; this.react = (this.react ?? rnd(.2, 1.2)) - dt;
    if (this.food && (this.food.state === 'gone' || this.food.state === 'suck')) this.food = null;
    if (!this.food && this.react <= 0) {
      let fd = 26; for (const f of foods) { if (f.state !== 'float' && f.state !== 'sink') continue; const d = Math.hypot(f.x - this.x, f.z - this.z); if (d < fd) { fd = d; this.food = f; } }
      this.react = this.food ? 0 : rnd(.3, 1);
    }
    const food = this.food;
    this.pitchT = 0;
    const [dx, dy] = w2d(this.x, this.z, this.y), e = pondE(dx, dy);
    if (food) {
      const [hx, hz] = this.head(), dh = Math.hypot(food.x - hx, food.z - hz);
      desired = Math.atan2(food.z - this.z, food.x - this.x);
      want = dh > 5 ? this.cruise * 1.8 : this.cruise * (.35 + dh / 7);
      this.ty = Math.min(-.45, food.y - .45);
      if (dh < 5) this.pitchT = food.state === 'float' ? .38 : .15;
      if (dh < 1.15 && Math.abs(this.y - food.y) < 1.3 && this.gulpCD <= 0) gulp(this);
    } else {
      // random swim goal in the pond (changes periodically) + avoid other fish: sum vectors then take the heading
      this.goalT = (this.goalT ?? 0) - dt;
      const gBack = this.goal && Math.abs(angDiff(Math.atan2(this.goal[1] - dy, this.goal[0] - dx), this.heading)) > 1.9;
      // near the goal, or the goal has slipped behind (passed by) -> pick a new goal, don't circle back around the old one
      if (!this.goal || this.goalT < 0 || Math.hypot(this.goal[0] - dx, this.goal[1] - dy) < 90 || (gBack && e < .55)) {   // no goal yet (first frame dt = 0) also picks immediately
        let best = null, bs = -1e9;
        // score goals: little turning, far away (cross the pond instead of hugging the shore), and turning OPPOSITE to the recent dominant turn direction
        // -> don't get caught in a one-way loop along the shore
        for (let i = 0; i < 8; i++) {
          const g = pondPt(rnd(0, TAU), rnd(.05, .65)), a = angDiff(Math.atan2(g[1] - dy, g[0] - dx), this.heading);
          const sc = -.5 * Math.abs(a) + .004 * Math.hypot(g[0] - dx, g[1] - dy) - (Math.sign(a) === Math.sign(this.net || 0) ? Math.min(1.2, Math.abs(this.net || 0) / 2.5) : 0) + rnd(0, .8);
          if (sc > bs) { bs = sc; best = g; }
        }
        this.goal = best; this.goalT = rnd(8, 16);
      }
      const toGoal = Math.atan2(this.goal[1] - dy, this.goal[0] - dx);
      let vx = Math.cos(toGoal), vz = Math.sin(toGoal);
      for (const o of others) { if (o === this) continue; const ddx = this.x - o.x, ddz = this.z - o.z, d = Math.hypot(ddx, ddz), R = 7 * this.size; if (d < R && d > 0 && Math.abs(o.y - this.y) < 1.6) { vx += ddx / d * 1.3 * (1 - d / R); vz += ddz / d * 1.3 * (1 - d / R); } }
      desired = Math.atan2(vz, vx);
      urg = clamp((e - .55) / .35, 0, 1);   // near the shore: turn earlier, more decisively
    }
    const err = angDiff(desired, this.heading);
    this.gapT = (this.gapT ?? rnd(.5, 2)) - dt; this.lockT = (this.lockT || 0) - dt;
    // Startle: lock ONE escape heading when the water surface is touched (away from the pointer), C-start then dart straight.
    this.startleCD = (this.startleCD || 0) - dt;
    if (pointer && this.startle <= 0 && this.startleCD <= 0 && pointer.speed > 18) {
      const ddx = this.x - pointer.x, ddz = this.z - pointer.z, d = Math.hypot(ddx, ddz);
      if (d < 11) {
        let D = angDiff(Math.atan2(ddz, ddx) + rnd(-.3, .3), this.heading);
        if (Math.abs(D) < .4) D = Math.sign(D || 1) * .4;
        this.startTurn(clamp(D, -2.4, 2.4), true);
        this.startle = rnd(1, 1.4); this.burstT = 0; this.startleCD = this.startle + rnd(1.8, 3); this.food = null;
        // new goal lies ahead along the escape heading -> no looping back after the dart
        const h = this.heading + D, [ax, ay] = w2d(this.x + Math.cos(h) * 14, this.z + Math.sin(h) * 14, this.y);
        this.goal = [lerp(ax, POND.cx, .3), lerp(ay, POND.cy, .3)]; this.goalT = rnd(4, 7);
      }
    }
    if (this.startle > 0) { this.startle -= dt; want = this.cruise * 4; }
    // single-beat turn when the heading error is large enough; a rest interval between turns (straight swim/glide)
    if (!this.ev && this.lockT <= 0 && this.gapT <= 0) {
      const thr = food ? .22 : lerp(.6, .18, urg);
      if (Math.abs(err) > thr) this.startTurn(clamp(err * rnd(.9, 1.05), -1.7, 1.7));   // turn nearly the full heading error: consistent under-turning becomes circling around the goal
      else {
        // occasionally turn freely, favoring the opposite of the recent dominant direction -> path meanders both ways
        this.turnT = (this.turnT ?? rnd(1, 6)) - dt;
        if (this.turnT < 0 && !food && urg < .3) { this.turnT = rnd(5, 12); this.startTurn((Math.abs(this.net || 0) > .8 && Math.random() < .75 ? -Math.sign(this.net) : (Math.random() < .5 ? -1 : 1)) * rnd(.35, .9)); }
      }
    }
    // small error: continuous, very gentle heading correction (multi-beat turn), body barely bends
    const contT = clamp(err * (food ? .6 : .12 + urg * .9), -(food ? .5 : .07 + urg * .8), food ? .5 : .07 + urg * .8);
    this.contW = lerp(this.contW || 0, contT, 1 - Math.exp(-dt * 2));
    let evRot = 0; this.cBend = 0;
    if (this.ev) {
      const ev = this.ev; ev.t += dt;
      // ~80% of the turn angle in stage 1 (C), the rest in stage 2 (counter-bend)
      const prog = ev.t < ev.t1 ? .8 * smooth01(ev.t / ev.t1) : .8 + .2 * smooth01(Math.min(1, (ev.t - ev.t1) / ev.t2));
      evRot = ev.D * (prog - ev.prev); ev.prev = prog;
      let a;
      if (ev.t < ev.t1) a = Math.sin(Math.PI / 2 * ev.t / ev.t1);                                  // 0 -> deepest C
      else { const c = Math.cos(1.5 * Math.PI * Math.min(1, (ev.t - ev.t1) / ev.t2)); a = c < 0 ? c * TUNE.counter : c; }   // C -> counter-bend -> straight
      this.cBend = Math.sign(ev.D) * a * Math.min(1.4, Math.abs(ev.D) / 1.2);
      if (ev.t >= ev.t1 && !ev.pushed) { ev.pushed = true; this.cur += ev.fast ? this.cruise * 2.2 : this.cruise * .25 * Math.min(1, Math.abs(ev.D)); }   // stage 2 push
      if (ev.t >= ev.t1 + ev.t2) { this.ev = null; this.gapT = food ? rnd(.15, .4) : rnd(.8, 2.6) * (1 - urg * .7); if (ev.fast) this.lockT = rnd(.8, 1.3); }
    }
    this.evEnv = lerp(this.evEnv || 0, this.ev ? 1 : 0, 1 - Math.exp(-dt * 10));
    this.burstT -= dt;
    if (this.burstT <= 0) { this.burstT = rnd(2.4, 4.2); this.thrust = rnd(.78, .95); }   // long beat/glide rhythm, steady thrust
    const kick = this.burstT > (this.startle > 0 ? 0 : 1.0) ? 1 : 0;
    const thrust = Math.max(kick * this.thrust, (want - this.cur) / 3);
    this.cur = clamp(this.cur + (thrust * 4.2 - this.cur * .55) * dt, .4, this.cruise * 4.5);
    this.beat = lerp(this.beat, clamp(.35 + thrust * .9, .3, 1.6), 1 - Math.exp(-dt * 4));   // while swimming, always beat evenly on both sides
    this.heading += this.contW * dt + evRot;
    this.angVel = this.contW + evRot / Math.max(dt, 1e-4);
    this.net = (this.net || 0) * Math.exp(-dt / 10) + this.contW * dt + evRot;   // total recent turning (signed)
    if (this.startle <= 0) this.cur *= 1 - Math.min(.25, Math.abs(this.angVel) * .2) * dt * 2;   // slow down while turning
    this.turn = this.angVel;
    this.x += Math.cos(this.heading) * this.cur * dt; this.z += Math.sin(this.heading) * this.cur * dt;
    this.nextDepth -= dt;
    if (this.nextDepth < 0 && !this.food) { this.ty = -rnd(.9, 5); this.nextDepth = rnd(6, 16); }
    this.y = lerp(this.y, this.ty, 1 - Math.exp(-dt * .5));
    // near the surface: head parts the water (V-shaped wake), occasionally rises to gulp
    if (this.y > -1.6) { const [hx, hz] = this.head(), [u, v] = w2uv(hx, SURF_Y, hz); splash(u, v, .006, .012 * (1.6 + this.y) * this.cur / 4); }
    this.sipT -= dt;
    if (this.y > -1.3 && this.sipT < 0) { const [hx, hz] = this.head(), [u, v] = w2uv(hx, SURF_Y, hz); splash(u, v, .009, .35); this.sipT = rnd(2, 7); }
    // beat frequency proportional to speed (~0.8 body lengths/beat); amplitude follows thrust, changes smoothly; when gliding the body gradually straightens
    const Lw = 6.39 * this.size * KOI_SCALE;
    this.phase += dt * TAU * (.28 + this.cur / (.8 * Lw) + this.beat * .2);
    this.U.uPhase.value = this.phase; this.U.uAmp.value = lerp(this.U.uAmp.value, (.09 + this.beat * .34) * (1 - .7 * this.evEnv), 1 - Math.exp(-dt * 2.5)); /* during a turn, the C bend + counter-bend replace the tail beat */ {
      // body bends with path curvature kappa = omega / v (converted to mesh units): tail lies exactly on the old trail
      // Body is a chain of 8 segments: the first follows the swim heading, each next one chases the previous one's heading with speed-dependent lag.
      // Angle between adjacent segments is limited + smoothed -> bend spreads evenly like a C, no kink at one point.
      const sc = this.size * KOI_SCALE, seg = 6.39 / 8, A = this.segA || (this.segA = new Array(9).fill(this.heading));
      A[0] = this.heading;
      const kf = 1 - Math.exp(-dt * Math.max(this.cur, .8) / (seg * sc) * 1.4);
      for (let k = 1; k <= 8; k++) {
        A[k] += angDiff(A[k - 1], A[k]) * kf;
                A[k] += angDiff(A[k - 1], A[k]) * (1 - Math.exp(-dt * 5));
        const dk = angDiff(A[k], A[k - 1]); A[k] = A[k - 1] + .3 * Math.tanh(dk / .3);   // soft saturation: no sharp kink when hitting the limit
      }
      for (let k = 1; k < 8; k++) A[k] += angDiff(A[k - 1] + angDiff(A[k + 1], A[k - 1]) / 2, A[k]) * .4;
      // build mesh coords from snout to tail (+x toward the head, +z = left normal of the swim heading)
      const X = [2.87], Z = [0];
      for (let k = 1; k <= 8; k++) {
        // segment heading = (turn trail, reduced by follow) + drawn C shape: z(s) = depth * cBend * ((s-.4)^2 - .16) / .2
        // -> both ends curl into the turn, tail offset exactly depth; angle taken from the derivative so the body doesn't stretch
        const sm = (k - .5) / 8, dz = TUNE.depth * this.cBend * 2 * (sm - .4) / (.2 * 6.39);
        // the trail-following bend is only transient: subtract its lagged copy (rSlow) -> body bends entering a turn, and on a long turn
        // the body straightens itself after ~relax seconds and heading changes via tail beats, not holding a banana shape
        const rf = angDiff(A[k - 1] + angDiff(A[k], A[k - 1]) / 2, this.heading) * TUNE.follow, rs = this.rSlow || (this.rSlow = new Array(9).fill(0));
        rs[k] = lerp(rs[k], rf, 1 - Math.exp(-dt / TUNE.relax));
        const r = rf - rs[k] * TUNE.straighten - Math.asin(clamp(dz, -.9, .9));
        X.push(X[k - 1] - Math.cos(r) * seg); Z.push(Z[k - 1] - Math.sin(r) * seg);
      }
      // shift so the pivot (s0, near the head) coincides with the fish's origin
      const s0 = (2.87 - KOI_PIVOT) / 6.39, pf = s0 * 8, pi = Math.floor(pf), pt = pf - pi;
      const ox = KOI_PIVOT - lerp(X[pi], X[pi + 1], pt), oz = -lerp(Z[pi], Z[pi + 1], pt);
      const SX = this.U.uSX.value, SZ = this.U.uSZ.value;
      // remove the steady long-lasting bend (fish circling the elliptical pond always turn slightly toward the center) -> tail beats evenly on both sides;
      // the transient bend while turning is kept as is
      const slow = this.bendSlow || (this.bendSlow = new Array(9).fill(0)), ks = 1 - Math.exp(-dt * .25);
      for (let k = 0; k <= 8; k++) { const z = Z[k] + oz; slow[k] = lerp(slow[k], z, ks); SX[k] = X[k] + ox; SZ[k] = z - slow[k] * .25; }
      this.U.uTurn.value = 0;
    }
    // pectoral fins: slow/braking -> spread; fast -> folded against the body; turning -> fin on the inside of the turn (+z when turn > 0) spreads more
    const open = clamp(1.35 - this.cur / 9, .55, 1), k = 1 - Math.exp(-dt * 3);
    this.U.uFinR.value = lerp(this.U.uFinR.value, clamp(open + Math.max(this.turn, 0) * .35, 0, 1), k);
    this.U.uFinL.value = lerp(this.U.uFinL.value, clamp(open + Math.max(-this.turn, 0) * .35, 0, 1), k);
    // fan fins: swept back when swimming fast, spread wide when slow; blade rotates like an oar
    for (const f of this.pecs) {
      const open = f.sd > 0 ? this.U.uFinR.value : this.U.uFinL.value;
      const beta = lerp(1.42, .95, open) + f.bias + f.back + Math.sin(this.t * .6 + f.seed) * .08;   // folded close to the body, slow oscillation
      // fins follow the bending spine: position + tangent direction at the attachment point (same interpolation as the shader)
      const SX = this.U.uSX.value, SZ = this.U.uSZ.value, sr = clamp((2.87 - f.rest.x) / 6.39, 0, 1), fi = Math.min(7, Math.floor(sr * 8)), ft = sr * 8 - fi;
      const tX = SX[fi] - SX[fi + 1], tZ = SZ[fi] - SZ[fi + 1], tl = Math.hypot(tX, tZ) || 1, Tx = tX / tl, Tz = tZ / tl;
      const U = this.U, w = U.uAmp.value * (.03 + .12 * sr + .85 * sr * sr) * Math.sin(U.uPhase.value - sr * U.uWave.value), lz = f.rest.z + w;
      f.pivot.position.set(lerp(SX[fi], SX[fi + 1], ft) - Tz * lz, f.rest.y, lerp(SZ[fi], SZ[fi + 1], ft) + Tx * lz);
      f.pivot.rotation.set(0, (f.sd > 0 ? -(Math.PI / 2 + beta) : Math.PI / 2 + beta) - Math.atan2(Tz, Tx), f.sd * .04);
      f.m.rotation.x = f.sd * (.08 + Math.sin(this.phase * .45 + f.sd * 1.3 + f.back * 4) * f.flap * open);
    }
    this.pitch = lerp(this.pitch || 0, this.pitchT, 1 - Math.exp(-dt * 4));
    this.root.position.set(this.x, this.y, this.z);
    // YZX: rotate to the swim heading, then pitch the head about the body's transverse axis (head at local -x)
    this.root.rotation.set(0, -this.heading + Math.PI, -this.pitch, 'YZX');
  }
}
// Koi varieties + spawn weights (smaller = rarer). Each page load gives a different school.
const VARIETIES = [
  ['Kohaku', 0, 22], ['Taishō Sanke', 1, 16], ['Shōwa', 2, 14], ['Asagi', 3, 8], ['Chagoi', 5, 7], ['Ogon', 6, 6],
  ['Platinum Ogon', 7, 5], ['Ochiba', 12, 5], ['Shūsui', 4, 4], ['Karasu', 8, 4], ['Hi Utsuri', 11, 4], ['Kumonryū', 10, 2.5], ['Tanchō', 9, 2.5],
];
const VAR_TOTAL = VARIETIES.reduce((a, v) => a + v[2], 0);
function pickVariety() { let r = Math.random() * VAR_TOTAL; for (const v of VARIETIES) { if ((r -= v[2]) < 0) return v; } return VARIETIES[0]; }
const fish = Array.from({ length: 9 }, (_, i) => {
  const v = pickVariety(), th = i / 9 * TAU, [dx, dy] = pondPt(th, .45), y = i > 6 ? -4.2 : -rnd(1, 3), [x, z] = d2w(dx, dy, y);
  const k = new Koi({ variant: v[1], size: rnd(.8, 1.02), x, z, y, ty: y, heading: th + Math.PI / 2, cruise: rnd(3.7, 4.3) });
  k.variety = v; return k;
});
{
  const count = {}; for (const f of fish) count[f.variety[0]] = (count[f.variety[0]] || 0) + 1;
  document.getElementById('koiList').innerHTML = 'In the pond today: ' + Object.entries(count).map(([n, c]) => {
    const w = VARIETIES.find(v => v[0] === n)[2] / VAR_TOTAL * 100;
    return `${n}${c > 1 ? ' ×' + c : ''} <span style="opacity:.6">(${w.toFixed(1)}%${w < 5 ? ' ★ rare' : ''})</span>`;
  }).join(' · ') + ' — reload for a new school.';
}

// ---------- Water surface simulation (stir + waves), as in the first demo ----------
const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quadGeo = new THREE.PlaneGeometry(2, 2);
const QV = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
function pass(frag, uniforms) { const m = new THREE.ShaderMaterial({ vertexShader: QV, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false }); const s = new THREE.Scene(); const q = new THREE.Mesh(quadGeo, m); q.frustumCulled = false; s.add(q); return { s, m, u: uniforms }; }
const rt = (w, h) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
function pingPong(w, h) { const t = [rt(w, h), rt(w, h)]; let r = 0; return { get read() { return t[r]; }, get write() { return t[1 - r]; }, swap() { r = 1 - r; }, clear() { for (const x of t) { renderer.setRenderTarget(x); renderer.setClearColor(0, 0); renderer.clear(); } renderer.setRenderTarget(null); } }; }
const WAVE_W = 420, WAVE_H = Math.round(420 / ASPECT), STIR_W = 192, STIR_H = Math.round(192 / ASPECT);
const waveBuf = pingPong(WAVE_W, WAVE_H), stirBuf = pingPong(STIR_W, STIR_H);
waveBuf.clear(); stirBuf.clear();

const stir = pass(/* glsl */ `
  uniform sampler2D uPrev; uniform vec2 uPtr, uPtrVel, uDrift; uniform float uDt, uFade, uRadius, uStrength, uMax, uAspect; varying vec2 vUv;
  void main() {
    float tau = max(uFade, 1e-3) / 3.0;
    vec2 d = texture(uPrev, vUv - uDrift * uDt).xy * exp(-uDt / tau);
    vec2 p = (vUv - uPtr) * vec2(uAspect, 1.0);
    d += uPtrVel * uStrength * exp(-dot(p, p) / (uRadius * uRadius));
    float m = length(d); if (m > 1e-6) d = d / m * uMax * (1.0 - exp(-m / uMax));
    vec2 e = smoothstep(vec2(0.0), vec2(0.06), vUv) * smoothstep(vec2(0.0), vec2(0.06), 1.0 - vUv);
    gl_FragColor = vec4(d * min(e.x, e.y), 0.0, 1.0);
  }`, { uPrev: { value: null }, uPtr: { value: new THREE.Vector2() }, uPtrVel: { value: new THREE.Vector2() }, uDrift: { value: new THREE.Vector2() }, uDt: { value: .016 }, uFade: { value: 1.6 }, uRadius: { value: .08 }, uStrength: { value: 1.1 }, uMax: { value: .035 }, uAspect: { value: ASPECT } });

const wave = pass(/* glsl */ `
  uniform sampler2D uPrev; uniform vec2 uTexel, uA, uB; uniform float uAmount, uRadius, uDamping, uAspect;
  uniform vec4 uDrops[12]; uniform int uDropN; varying vec2 vUv;
  float segDist(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float t = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0); return length(pa - ba * t); }
  void main() {
    vec2 c = texture(uPrev, vUv).rg;
    float n = texture(uPrev, vUv + vec2(0.0, uTexel.y)).r, s = texture(uPrev, vUv - vec2(0.0, uTexel.y)).r;
    float e = texture(uPrev, vUv + vec2(uTexel.x, 0.0)).r, w = texture(uPrev, vUv - vec2(uTexel.x, 0.0)).r;
    float h = ((n + s + e + w) * 0.5 - c.g) * uDamping;
    vec2 asp = vec2(uAspect, 1.0);
    float d = segDist(vUv * asp, uA * asp, uB * asp);
    h -= uAmount * exp(-(d * d) / (uRadius * uRadius));
    for (int i = 0; i < 12; i++) { if (i >= uDropN) break; vec2 q = (vUv - uDrops[i].xy) * asp; h -= uDrops[i].w * exp(-dot(q, q) / (uDrops[i].z * uDrops[i].z)); }
    vec2 ed = smoothstep(vec2(0.0), vec2(0.04), vUv) * smoothstep(vec2(0.0), vec2(0.04), 1.0 - vUv);
    h *= mix(0.9, 1.0, min(ed.x, ed.y));
    gl_FragColor = vec4(h, c.r, 0.0, 1.0);
  }`, { uPrev: { value: null }, uTexel: { value: new THREE.Vector2(1 / WAVE_W, 1 / WAVE_H) }, uA: { value: new THREE.Vector2() }, uB: { value: new THREE.Vector2() }, uAmount: { value: 0 }, uRadius: { value: .014 }, uDamping: { value: .986 }, uAspect: { value: ASPECT }, uDrops: { value: Array.from({ length: 12 }, () => new THREE.Vector4()) }, uDropN: { value: 0 } });

let sceneRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
const comp = pass(/* glsl */ `
  uniform sampler2D uScene, uStir, uWave; uniform vec2 uWaveTexel, uWind; uniform float uTime, uGust, uAspect; uniform vec3 uPaper; varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
  float H(vec2 uv) { return texture(uWave, uv).r; }
  void main() {
    vec2 disp = texture(uStir, vUv).xy;
    float hC = H(vUv), hL = H(vUv - vec2(uWaveTexel.x, 0.0)), hR = H(vUv + vec2(uWaveTexel.x, 0.0)), hD = H(vUv - vec2(0.0, uWaveTexel.y)), hU = H(vUv + vec2(0.0, uWaveTexel.y));
    vec3 N = normalize(vec3((hL - hR) * 9.0, (hD - hU) * 9.0, 1.0));
    // wind: tiny ripples running in the wind direction
    vec2 wd = normalize(uWind + 1e-4), p = vUv * vec2(uAspect, 1.0);
    vec2 q = vec2(dot(p, wd), dot(p, vec2(-wd.y, wd.x)));
    float wn = noise(vec2(q.x * 46.0 - uTime * 3.0, q.y * 9.0)) + .5 * noise(vec2(q.x * 90.0 - uTime * 5.0, q.y * 22.0));
    vec2 uv = vUv - disp - N.xy * .018 + wd * (wn - .75) * .0026 * uGust;
    vec3 col = texture(uScene, uv).rgb;
    // ripples drawn like ink strokes: wave troughs ink-dark, crests paper-light
    float lap = hL + hR + hD + hU - 4.0 * hC;
    col = mix(col, col * .5, smoothstep(.003, .03, lap) * .6);
    col = mix(col, uPaper * 1.04, smoothstep(.003, .03, -lap) * .4);
    float streak = smoothstep(.6, .85, noise(vec2(q.x * 5.0 - uTime * .5, q.y * 1.3)));
    col = mix(col, uPaper * 1.06, streak * .06 * uGust);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`, { uScene: { value: null }, uStir: { value: null }, uWave: { value: null }, uWaveTexel: { value: new THREE.Vector2(1 / WAVE_W, 1 / WAVE_H) }, uWind: { value: new THREE.Vector2(-1, .4) }, uTime: { value: 0 }, uGust: { value: 0 }, uAspect: { value: ASPECT }, uPaper: { value: new THREE.Color() } });

function fit() {
  const w = canvas.clientWidth || DW, h = Math.round(w / ASPECT);
  renderer.setSize(w, h, false);
  const pr = renderer.getPixelRatio(); sceneRT.setSize(Math.round(w * pr), Math.round(h * pr));
}
fit(); new ResizeObserver(fit).observe(canvas);

// ---------- Painted layers + floating/falling objects ----------
// ---------- Shoreline grass (animated) ----------
// Each grass clump is its own sprite, bent in the vertex shader: bows along the wind direction, bow amount follows the gust
// reaching that clump (uGustL), plus small leaf flutter.
const plantVert = /* glsl */ `
  uniform float uTime, uGustL, uSeed, uAmp; uniform vec2 uWind; varying vec2 vUv;
  void main() {
    vUv = uv; vec3 p = position; float h = uv.y;
    float fl = sin(uTime * (2.0 + uSeed * .4) + uSeed * 6.0) * .6 + sin(uTime * 3.9 + uSeed * 2.0) * .4;
    float b = uGustL * .85 + .08 + fl * (.05 + .2 * uGustL);
    vec2 d = vec2(uWind.x, -uWind.y) * b * h * h * uAmp;
    p.xy += d; p.y -= length(d) * .35 * h;                 // when bowing, the tip gets lower
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
function plantMat(tex, seed, amp) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false,
    // uGust/uWind/uTime/uOpacity set jointly by the painted-layer loop; uGustL set per clump
    uniforms: { map: { value: tex }, uOpacity: { value: 0 }, uTime: { value: 0 }, uGust: { value: 0 }, uGustL: { value: 0 }, uWind: { value: new THREE.Vector2(-1, 0) }, uSeed: { value: seed }, uAmp: { value: amp } },
    vertexShader: plantVert,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform float uOpacity; varying vec2 vUv;
      void main() {
        vec4 c = texture(map, vUv);
        gl_FragColor = vec4(c.rgb, c.a * uOpacity);
        #include <colorspace_fragment>
      }`,
  });
}
// horizontal flat sheet, plant base at (bx, by) design coords; base at (cx, by0) on the w x h image in design units
function plantMesh(mat, w, h, by0, bx, by, y, rot = 0, scale = 1) {
  const k = viewAt(y).w / DW * scale, m = new THREE.Mesh(new THREE.PlaneGeometry(w * k, h * k, 1, 10), mat);
  const ly = (by0 - h / 2) * k, [rx, rz] = d2w(bx, by, y);   // image center is ly from the base along local +y
  m.rotation.set(-Math.PI / 2, 0, rot);
  m.position.set(rx - ly * Math.sin(rot), y, rz - ly * Math.cos(rot));
  return m;
}
async function buildPlants(S, key) {
  const { R, E } = Ink, out = { grass: [] };
  // shoreline grass: exact positions of the clumps previously hard-drawn in shoreArt (same random sequence)
  const r = R(23), gc = key === 'winter' ? '#6a6050' : S.grass, tufts = [];
  for (let i = 0; i < 22; i++) {
    const th = r() * TAU, [x, y] = pondPt(th, 1.12 + r() * .1), n = 4 + Math.round(r() * 4), h = 24 + r() * 16;
    if ((x > 600 && y < 150) || (x < 140 && y < 260)) continue;
    tufts.push({ x, y, draw: s => Ink.grass(s, 50, 96, n, 900 + i, gc, h), amp: h / 40 });
  }
  if (key === 'summer' || key === 'spring') {
    // iris clump at bottom right, flowers go with the leaves
    const fl = [[6, -50], [6, -52], [8, -32]];
    for (let i = 0; i < 3; i++) tufts.push({ x: 840 + i * 26, y: 520 - i * 6, amp: 1.2, draw: s => {
      Ink.grass(s, 50, 96, 7, 950 + i, '#2f4a24', 56);
      if (key === 'summer') { const [dx, dy] = fl[i], x = 50 + dx, y = 96 + dy; E(s, 'path', { d: `M${x},${y} q-6,-8 0,-14 q6,6 0,14 q8,-4 12,4 q-8,4 -12,-4 q-8,-4 -12,4 q8,4 12,-4Z`, fill: '#5b4b8a', opacity: .9, filter: 'url(#brushF)' }); }
    } });
  }
  const gTex = await Promise.all(tufts.map(q => raster(spriteSVG(100, 100, q.draw))));
  tufts.forEach((q, i) => {
    const m = plantMesh(plantMat(canvasTex(gTex[i]), rnd(0, 9), 0), 100, 100, 96, q.x, q.y, SHORE_Y + .05);
    m.material.uniforms.uAmp.value = m.geometry.parameters.height * .32 * q.amp;
    m.renderOrder = 21; out.grass.push({ m, dx: q.x, dy: q.y });
  });
  return out;
}

// Random wind: slowly changing base wind (calm at times, steady at others) + gusts arriving unexpectedly: ramp up, hold, fade;
// each gust shifts direction a little. Keep a few seconds of history so a gust spreads across the scene (upwind grass sways first).
const WIND = { base: .25, baseT: .25, nextT: 2, gusts: [], dirOff: 0, hist: [] };
function updateWind(dt, t) {
  const W = WIND;
  W.nextT -= dt;
  if (W.nextT < 0) {
    W.gusts.push({ t: 0, rise: rnd(.6, 1.6), hold: rnd(.4, 2.5), fall: rnd(1.5, 4), s: rnd(.3, .8) * (Math.random() < .2 ? 1.35 : 1), off: rnd(-.35, .35) });
    W.nextT = rnd(3, 12) * (Math.random() < .25 ? 2 : 1);
  }
  if (Math.random() < dt * .05) W.baseT = rnd(.06, .38);
  W.base = lerp(W.base, W.baseT, 1 - Math.exp(-dt * .3));
  let g = W.base, off = 0, sum = 0;
  for (let i = W.gusts.length - 1; i >= 0; i--) {
    const q = W.gusts[i]; q.t += dt;
    const e = q.t < q.rise ? smooth01(q.t / q.rise) : q.t < q.rise + q.hold ? 1 : 1 - smooth01(Math.min(1, (q.t - q.rise - q.hold) / q.fall));
    g += q.s * e; off += q.off * e; sum += e;
    if (q.t > q.rise + q.hold + q.fall) W.gusts.splice(i, 1);
  }
  g *= 1 + (Math.sin(t * 1.7) + Math.sin(t * 2.9 + 1)) * .04;
  W.dirOff = lerp(W.dirOff, sum > 0 ? off / Math.max(1, sum) : 0, 1 - Math.exp(-dt));
  g = clamp(g, 0, 1.05);
  W.hist.push([t, g]); while (W.hist.length > 2 && W.hist[0][0] < t - 4) W.hist.shift();
  return g;
}
const gustAt = tq => { const H = WIND.hist; for (let i = H.length - 1; i >= 0; i--) if (H[i][0] <= tq) return H[i][1]; return H.length ? H[0][1] : 0; };
function updatePlants(dt, t, wind) {
  for (const L of layers) {
    if (L.grass) for (const q of L.grass) q.m.material.uniforms.uGustL.value = gustAt(t - ((q.dx - 480) * wind.x + (q.dy - 280) * wind.y + 560) / 380);
  }
}

// ---------- Day / night ----------
// Night: multiply an indigo layer over the whole scene (~3 s transition), sparing the stone lantern's glow and moonlight spread on the water;
// on top of the dark layer draw additively: lantern flame, moon reflection, fireflies. Frogs come sit on lotus leaves, puff vocal sacs croaking and rippling the water,
// occasionally plop into the pond. Winter: stone lantern snow-covered, dim and flickering; no fireflies, no frogs.
const NIGHT = { on: false, k: 0, lampI: 1, ff: [], frogs: [], frogT: 0 };
const NIGHT_SET = {
  spring: { tint: '#3e4870', ff: 8, frogs: 2, lamp: 1, moon: '#dfe6ff' },
  summer: { tint: '#34426a', ff: 26, frogs: 4, lamp: 1, moon: '#dfe6ff' },
  autumn: { tint: '#40405e', ff: 3, frogs: 1, lamp: 1, moon: '#f3e2c0' },
  winter: { tint: '#56607e', ff: 0, frogs: 0, lamp: .38, moon: '#e8eeff' },
};
const LANTERN_D = [70, 430], MOON_D = [650, 320];
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();
const glowScene = new THREE.Scene(), nightScene = new THREE.Scene();
// Frog: "Frog" by Thunk3D scanner (sketchfab.com/Diana123456), CC BY 4.0 -- decimated, axis-aligned (head +z,
// 1 unit long, bottom y = 0) and repainted in ink-wash per vertex (moss-green back mottled with ink spots, ivory belly, yellow eyes)
let FROG = null;
new GLTFLoader().loadAsync('/models/frog.glb').then(g => {
  let geo = null; g.scene.traverse(o => { if (o.isMesh && !geo) geo = o.geometry; });
  // vocal sac: find the real chin on the mesh -- the most forward point in the band below the snout, near the center axis
  const P = geo.attributes.position, v = new THREE.Vector3(); let sn = null, chin = null;
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); if (!sn || v.z > sn.z) sn = v.clone(); }
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); if (Math.abs(v.x - sn.x) < .035 && v.y < sn.y - .07 && v.y > sn.y - .16 && (!chin || v.z > chin.z)) chin = v.clone(); }
  FROG = { geo, sac: new THREE.SphereGeometry(.065, 20, 14), chin: chin.add(new THREE.Vector3(0, .005, -.035)) };   // center pulled slightly into the chin
});
overScene.add(new THREE.HemisphereLight('#fffaf0', '#6a7058', 1.6));
{ const l = new THREE.DirectionalLight('#fff8e8', 2.2); l.position.set(-24, 62, -20); overScene.add(l); }
function glow(size, col, y, additive = true) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: glowTex, color: col, transparent: true, opacity: 0, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthTest: false, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = y; return m;
}
// dark layer: multiply (dst * src), values are display colors so no color-space conversion
const nightQ = new THREE.Mesh(quadGeo, new THREE.ShaderMaterial({
  vertexShader: QV, depthTest: false, depthWrite: false, transparent: true,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
  uniforms: { uK: { value: 0 }, uAspect: { value: ASPECT }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uLamp: { value: 0 }, uMoon: { value: 1 }, uLampP: { value: new THREE.Vector2(...d2uv(...LANTERN_D)) }, uMoonP: { value: new THREE.Vector2(...d2uv(...MOON_D)) } },
  fragmentShader: /* glsl */ `
    uniform float uK, uAspect, uLamp, uMoon; uniform vec3 uTint; uniform vec2 uLampP, uMoonP; varying vec2 vUv;
    void main() {
      vec2 a = vec2(uAspect, 1.0);
      float dl = length((vUv - uLampP) * a), dm = length((vUv - uMoonP) * a);
      float vig = smoothstep(1.0, .35, length((vUv - .5) * a * .85));
      vec3 c = uTint * mix(.72, 1.0, vig);
      c += vec3(1.0, .78, .48) * uLamp * exp(-dl * dl / .01) * .9;      // warm stone lantern glow
      c += vec3(.75, .82, 1.0) * uMoon * exp(-dm * dm / .03) * .18;     // faint moonlight spread around the moon reflection
      gl_FragColor = vec4(mix(vec3(1.0), min(c, vec3(1.0)), uK), 1.0);
    }`,
}));
nightQ.frustumCulled = false; nightScene.add(nightQ);
const lampFlame = glow(1.4, '#ffd590', SHORE_Y + .4), lampHalo = glow(7, '#ffb050', SHORE_Y + .3);
{ const [lx, lz] = d2w(...LANTERN_D, SHORE_Y + .4); lampFlame.position.x = lampHalo.position.x = lx; lampFlame.position.z = lampHalo.position.z = lz; }
glowScene.add(lampHalo, lampFlame);
// Moon reflection: sharp round moon disc on the water, with faint dark maria and a soft halo; drawn additively after the dark layer.
// Wave normals + stir marks + wind ripples make the moon reflection sway and break; floating objects (lotus leaves, flowers, shore) occlude it via the occRT mask.
const occRT = new THREE.WebGLRenderTarget(4, 4);
const moonP = pass(/* glsl */ `
  uniform sampler2D uWave, uStir, uOcc; uniform vec2 uWaveTexel, uMoonP, uWind; uniform float uK, uAspect, uR, uTime, uGust; uniform vec3 uCol; varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
  float H(vec2 uv) { return texture(uWave, uv).r; }
  void main() {
    vec2 disp = texture(uStir, vUv).xy;
    float hL = H(vUv - vec2(uWaveTexel.x, 0.0)), hR = H(vUv + vec2(uWaveTexel.x, 0.0)), hD = H(vUv - vec2(0.0, uWaveTexel.y)), hU = H(vUv + vec2(0.0, uWaveTexel.y));
    vec2 n = vec2(hL - hR, hD - hU) * 9.0;
    vec2 wd = normalize(uWind + 1e-4), p = vUv * vec2(uAspect, 1.0), q = vec2(dot(p, wd), dot(p, vec2(-wd.y, wd.x)));
    float wn = noise(vec2(q.x * 60.0 - uTime * 2.5, q.y * 14.0)) - .5;
    // reflection is more sensitive to surface tilt than refraction
    vec2 uv = vUv - disp * 1.4 - n * .045 + wd * wn * (.002 + .004 * uGust);
    vec2 d = (uv - uMoonP) * vec2(uAspect, 1.0);
    float r = length(d), px = .0016;
    float disc = 1.0 - smoothstep(uR - px, uR + px, r);
    float mare = smoothstep(.45, .75, noise(d / uR * 2.0 + 4.0)) * .3 + smoothstep(.55, .85, noise(d / uR * 4.5 + 9.0)) * .14;   // dark maria on the moon
    float halo = exp(-max(r - uR, 0.0) * 30.0) * .28 + exp(-r * r / .03) * .08;
    float occ = texture(uOcc, vUv).a;
    float limb = 1.0 - .22 * (r / uR) * (r / uR);                                          // moon limb darker than the center
    vec3 c = uCol * (disc * (.85 - mare) * limb + halo) * (1.0 - occ) * uK;
    gl_FragColor = vec4(c, 1.0);
  }`, { uWave: { value: null }, uStir: { value: null }, uOcc: { value: occRT.texture }, uWaveTexel: { value: new THREE.Vector2(1 / WAVE_W, 1 / WAVE_H) }, uMoonP: { value: new THREE.Vector2(...d2uv(...MOON_D)) }, uWind: { value: new THREE.Vector2(-1, 0) }, uK: { value: 0 }, uAspect: { value: ASPECT }, uR: { value: .042 }, uTime: { value: 0 }, uGust: { value: 0 }, uCol: { value: new THREE.Color() } });
moonP.m.blending = THREE.AdditiveBlending; moonP.m.transparent = true;
const _sz = new THREE.Vector2();
// draw the night part after the day layers: floating-object mask -> dark layer -> moon reflection -> lantern, fireflies
function renderNight(t, gust, wind) {
  renderer.getDrawingBufferSize(_sz);
  const w = Math.max(1, _sz.x >> 1), h = Math.max(1, _sz.y >> 1);
  if (occRT.width !== w || occRT.height !== h) occRT.setSize(w, h);
  renderer.setRenderTarget(occRT); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(overScene, camera);
  renderer.setRenderTarget(null);
  renderer.render(nightScene, qCam);
  const U = moonP.u;
  U.uWave.value = waveBuf.read.texture; U.uStir.value = stirBuf.read.texture; U.uK.value = nightQ.material.uniforms.uK.value;
  U.uTime.value = t; U.uGust.value = gust; U.uWind.value.set(wind.x, -wind.y); U.uCol.value.set(NIGHT_SET[season].moon).convertLinearToSRGB();
  renderer.render(moonP.s, qCam);
  renderer.render(glowScene, camera);
}

// Fireflies: drift slowly around the shore and pond edge, blinking: off for a few seconds then light up and fade in under 1 s
class Firefly {
  constructor() {
    const [dx, dy] = pondPt(rnd(0, TAU), rnd(.75, 1.25));
    this.y = rnd(.8, 4); [this.x, this.z] = d2w(dx, dy, this.y);
    this.a = rnd(0, TAU); this.sp = rnd(.4, 1.1); this.off = rnd(1, 3.5); this.len = rnd(.5, .9); this.blink = -rnd(0, 3);
    this.m = glow(rnd(1.2, 1.6), '#d6ff70', this.y); this.h = glow(rnd(3.2, 4), '#9fd84a', this.y);
    glowScene.add(this.h, this.m); this.fade = 0; this.dying = false;
  }
  update(dt, t, k) {
    this.a += (Math.sin(t * .7 + this.len * 9) * 1.4 + (Math.random() - .5) * 2) * dt;
    const [dx, dy] = w2d(this.x, this.z, this.y), e = pondE(dx, dy);
    if (e > 1.35 || e < .55) { const [cx, cz] = d2w(POND.cx, POND.cy, this.y), out = e > 1.35 ? 1 : -1; this.a += angDiff(Math.atan2(out * (cz - this.z), out * (cx - this.x)), this.a) * dt * 1.5; }
    this.x += Math.cos(this.a) * this.sp * dt; this.z += Math.sin(this.a) * this.sp * dt;
    this.y = clamp(this.y + Math.sin(t * 1.3 + this.len * 7) * .15 * dt, .5, 4.5);
    this.blink += dt; let I = 0;
    if (this.blink > 0) { const u = this.blink / this.len; I = Math.sin(Math.PI * Math.min(1, u)) ** 2; if (u >= 1) this.blink = -this.off * rnd(.6, 1.4); }
    this.fade = clamp(this.fade + (this.dying ? -dt : dt) / 1.5, 0, 1);
    const o = I * this.fade * k;
    this.m.position.set(this.x, this.y, this.z); this.h.position.set(this.x, this.y, this.z);
    this.m.material.opacity = o; this.h.material.opacity = o * .35;
  }
  dispose() { for (const m of [this.m, this.h]) { glowScene.remove(m); m.geometry.dispose(); m.material.dispose(); } }
}

// Frog: sits on a lotus leaf (drifts with the leaf), croaks in runs of 2-4: vocal sac inflates/deflates, each croak ripples the water;
// occasionally plops into the water and dives out of sight, then another one climbs onto another leaf.
// frog material: toon-stepped like the fish + desaturated toward paper color + ink outline following the shape
function frogMat(opts) {
  const m = new THREE.MeshToonMaterial({ gradientMap, transparent: true, ...opts });
  m.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      {
        float l = dot(gl_FragColor.rgb, vec3(.299, .587, .114));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(l) * vec3(1.03, 1.0, .88), .25);
        float rim = 1.0 - abs(dot(normal, normalize(vViewPosition)));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(.08, .09, .07), smoothstep(.55, .85, rim) * .9);
      }`);
  };
  return m;
}

class Frog {
  constructor(host) {
    this.host = host; this.ang = rnd(0, TAU); this.r = host.rad * rnd(.1, .4); this.rot = rnd(0, TAU);
    this.mats = [frogMat({ vertexColors: true }), frogMat({ color: '#efe6c2' })];
    this.m = new THREE.Group(); this.m.scale.setScalar(1.05); this.seed = rnd(0, 9);
    const body = new THREE.Mesh(FROG.geo, this.mats[0]); body.renderOrder = 13; this.m.add(body);
    this.sacM = new THREE.Mesh(FROG.sac, this.mats[1]); this.sacM.position.copy(FROG.chin); this.sacM.renderOrder = 13; this.m.add(this.sacM);   // vocal sac under the chin
    this.sh = glow(1.35, '#000', FLOAT_Y + .02, false); this.sh.renderOrder = 12.5;
    overScene.add(this.sh, this.m);
    this.state = 'sit'; this.a = 0; this.croakT = rnd(1, 5); this.croak = -1; this.jumpT = rnd(18, 45); this.dying = false;
  }
  face() { const r = this.m.rotation.y; return [Math.sin(r), Math.cos(r)]; }   // frog head faces the model's +z
  update(dt, t, k) {
    const d = this.host;
    this.m.scale.y = 1.05 * (1 + .025 * Math.sin(t * 3.1 + this.seed));   // breathing
    if (this.state === 'sit') {
      const hr = d.m.rotation.z + this.ang;
      this.x = d.x + Math.cos(hr) * this.r; this.z = d.z + Math.sin(hr) * this.r; this.y = FLOAT_Y + .05;
      this.m.rotation.y = this.rot - d.m.rotation.z;                       // rotate with the leaf
      if (d.dying || d.state !== 'float') this.jumpT = 0;
      this.croakT -= dt;
      if (this.croakT < 0 && this.croak < 0) { this.croak = 0; this.n = 2 + Math.floor(Math.random() * 3); this.lastI = -1; }
      if (this.croak >= 0) {
        this.croak += dt; const i = Math.floor(this.croak / .32), u = (this.croak % .32) / .32;
        this.sacS = i < this.n ? Math.sin(Math.PI * u) : 0;
        if (i !== this.lastI && i < this.n) { this.lastI = i; const [uu, vv] = w2uv(this.x, SURF_Y, this.z); splash(uu, vv, .005, .07); }   // one ripple ring per croak
        if (i >= this.n) { this.croak = -1; this.croakT = rnd(2, 7); this.sacS = 0; }
      }
      this.jumpT -= dt;
      if (this.jumpT < 0 || this.dying) {
        const [fx, fz] = this.face(), L = rnd(3, 5);
        this.state = 'jump'; this.u = 0; this.from = [this.x, this.z]; this.to = [this.x + fx * L, this.z + fz * L];
      }
    } else if (this.state === 'jump') {
      this.u += dt / .55; const u = Math.min(1, this.u);
      this.x = lerp(this.from[0], this.to[0], u); this.z = lerp(this.from[1], this.to[1], u); this.y = FLOAT_Y + .05 + Math.sin(Math.PI * u) * 1.4;
      this.m.rotation.x = -Math.sin(Math.PI * u) * .5;                     // head pitches down while airborne
      if (u >= 1) { const [uu, vv] = w2uv(this.x, SURF_Y, this.z); splash(uu, vv, .008, .4); this.state = 'gone'; }
    } else { this.a -= dt / .5; this.y -= dt * .8; }
    if (this.state !== 'gone') this.a = Math.min(1, this.a + dt / 1.2);
    const o = clamp(this.a, 0, 1);
    for (const m of this.mats) m.opacity = o;
    this.sacM.scale.setScalar(.2 + (this.sacS || 0) * 1.05);   // vocal sac inflates/deflates with each croak
    this.m.position.set(this.x, this.y, this.z);
    this.sh.position.set(this.x + .12, FLOAT_Y + .02, this.z + .17); this.sh.material.opacity = o * .35 * (this.state === 'jump' ? .5 : 1);
  }
  get done() { return this.state === 'gone' && this.a <= 0; }
  dispose() {
    overScene.remove(this.m, this.sh); this.sh.geometry.dispose(); this.sh.material.dispose();
    for (const m of this.mats) m.dispose();
  }
}

function setNight(on) {
  NIGHT.on = on;
  const b = document.getElementById('night'); if (b) { b.textContent = on ? '☀ Day' : '☾ Night'; b.classList.toggle('on', on); }
  // butterflies, dragonflies go to sleep; fly again in the morning
  if (on) for (const b of insects) b.dying = true;
  else if (season && !insects.some(b => !b.dying)) insects.push(...SEASON_INSECTS[season]());
}
function updateNight(dt, t) {
  const N = NIGHT, set = NIGHT_SET[season];
  N.k = clamp(N.k + (N.on ? dt : -dt) / 3, 0, 1);
  const k = smooth01(N.k), U = nightQ.material.uniforms;
  U.uK.value = k;
  const tc = new THREE.Color(set.tint).convertLinearToSRGB(); U.uTint.value.lerp(new THREE.Vector3(tc.r, tc.g, tc.b), 1 - Math.exp(-dt * 2));
  // stone lantern: flame sways gently; in winter snow-covered, weak and flickering, sometimes nearly out
  const fl = season === 'winter' ? clamp(.55 + .3 * Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1) - (Math.random() < .03 ? .45 : 0), .08, 1) : .9 + .06 * Math.sin(t * 9) + .04 * Math.sin(t * 23.7);
  N.lampI = lerp(N.lampI, fl * set.lamp, season === 'winter' ? .25 : .15);
  U.uLamp.value = N.lampI;
  lampFlame.material.opacity = k * N.lampI; lampHalo.material.opacity = k * N.lampI * .45;
  lampFlame.scale.setScalar(.85 + .15 * N.lampI);
  // fireflies
  const want = N.on ? set.ff : 0, alive = N.ff.filter(f => !f.dying);
  if (alive.length < want && Math.random() < dt * 4) N.ff.push(new Firefly());
  if (alive.length > want) alive[0].dying = true;
  for (let i = N.ff.length - 1; i >= 0; i--) { const f = N.ff[i]; f.update(dt, t, k); if (f.dying && f.fade <= 0) { f.dispose(); N.ff.splice(i, 1); } }
  // frogs: climb onto free lotus leaves when it gets dark
  const wantF = N.on && FROG ? set.frogs : 0, liveF = N.frogs.filter(f => f.state === 'sit' && !f.dying);
  N.frogT -= dt;
  if (liveF.length < wantF && N.frogT < 0) {
    const hosts = drifters.filter(d => d.big && !d.ice && !d.flower && !d.dying && d.state === 'float' && !N.frogs.some(f => f.host === d && f.state === 'sit'));
    if (hosts.length) N.frogs.push(new Frog(hosts[Math.floor(Math.random() * hosts.length)]));
    N.frogT = rnd(1.5, 5);
  }
  if (liveF.length > wantF) for (const f of liveF.slice(wantF)) f.dying = true;
  for (let i = N.frogs.length - 1; i >= 0; i--) { const f = N.frogs[i]; f.update(dt, t, k); if (f.done) { f.dispose(); N.frogs.splice(i, 1); } }
}

let layers = [], season = null, sprites = {}, busy = false, pending = null;
const drifters = [];                                 // falling + floating objects
const spriteMesh = (c, size) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size * c.height / c.width), new THREE.MeshBasicMaterial({ map: sharedTex(c), transparent: true, depthWrite: false, depthTest: false, toneMapped: false, opacity: 0 }));
  m.rotation.x = -Math.PI / 2; return m;
};

async function setSeason(key) {
  if (busy) { pending = key; return; }
  if (key === season) return; busy = true;
  document.querySelectorAll('.toolbar [data-season]').forEach(b => b.classList.toggle('on', b.dataset.season === key));
  const S = SEASONS[key];
  const [floorC, shoreC, treeC, sp, plants] = await Promise.all([raster(floorArt(S)), raster(shoreArt(S, key)), raster(treeArt(S, key)), spriteSet(key), buildPlants(S, key)]);
  await document.fonts.load('34px "Yuji Syuku"').catch(() => {});
  drawCalligraphy(shoreC, S);
  const floorM = screenPlane(FLOOR_Y, new THREE.MeshLambertMaterial({ map: canvasTex(floorC), transparent: true, opacity: 0, fog: false }));
  floorM.receiveShadow = true; floorM.renderOrder = -10; waterScene.add(floorM);
  const shoreM = screenPlane(SHORE_Y, basicLayer(canvasTex(shoreC))); shoreM.renderOrder = 20;
  const treeTex = canvasTex(treeC);
  const shadowM = screenPlane(SHORE_Y + .1, swayMat(treeTex, true), 48); shadowM.renderOrder = 25;
  shadowM.position.x += 2.2; shadowM.position.z += 3.4;
  const treeM = screenPlane(TREE_Y, swayMat(treeTex, false), 48); treeM.renderOrder = 40;
  overScene.add(shoreM, shadowM, treeM);
  for (const q of plants.grass) overScene.add(q.m);
  for (const L of layers) L.fade = -1;
  const layer = { meshes: [floorM, shoreM, shadowM, treeM, ...plants.grass.map(q => q.m)], fade: 1, a: 0, grass: plants.grass };
  layers.push(layer);
  // previous season's floating objects: fade out; new season: scatter lotus leaves, ice
  for (const d of drifters) d.dying = true;
  sprites = sp;
  buildSlots(key, layer);
  const r = Math.random;
  for (let i = 0; i < S.lotus; i++) addFloat(sprites.lotus[i % sprites.lotus.length], rnd(3.6, 6.4), .15 + r() * .75);
  for (let i = 0; i < S.flowers; i++) addFloat(sprites.flower[i % sprites.flower.length], rnd(6.4, 8.2), .2 + r() * .7, false, true);
  if (sprites.bud) for (let i = 0; i < 3; i++) addFloat(sprites.bud[0], rnd(1.6, 2.1), .25 + r() * .6, false, true);
  for (const b of insects) b.dying = true;
  if (!NIGHT.on) insects.push(...SEASON_INSECTS[key]());
  hemi.intensity = S.hemi; sun.color.set(S.sun); sun.intensity = S.sunI;
  waterScene.fog = new THREE.Fog(new THREE.Color(S.paper).lerp(new THREE.Color(S.water), .25), 82, 96);
  comp.u.uPaper.value.set(S.paper);
  season = key; busy = false;
  if (pending && pending !== key) { const k = pending; pending = null; setSeason(k); } else pending = null;
}
function addFloat(c, size, k, ice = false, flower = false) {
  // scatter without overlap: try many positions, skip spots touching existing leaves/flowers
  const rad = size * .44;
  let x, z;
  for (let tries = 0; tries < 40; tries++) {
    const th = rnd(0, TAU), [dx, dy] = pondPt(th, tries ? rnd(.12, .86) : k);
    [x, z] = d2w(dx, dy, FLOAT_Y);
    if (!drifters.some(o => o.big && !o.dying && Math.hypot(o.x - x, o.z - z) < (o.rad + rad) * 1.05)) break;
  }
  const m = spriteMesh(c, size); m.position.set(x, FLOAT_Y, z); m.rotation.z = rnd(0, TAU); m.renderOrder = ice ? 11 : 12; overScene.add(m);
  drifters.push({ m, state: 'float', x, z, hx: x, hz: z, y: FLOAT_Y, vx: 0, vz: 0, spin: rnd(-.05, .05), a: 0, life: Infinity, big: true, ice, flower, rad });
}
// ---------- Flowers/leaves on the tree: each one its own sprite, really falls then regrows ----------
const SUN_SH = [24 / 62, 20 / 62];                   // shadow offset along the sun direction, per unit of height
const slots = [];
const PX_TREE = () => viewAt(TREE_Y).w / DW;
// Leaves/flowers grow at nodes on the twigs. ang: blade direction from the attachment point (design coords).
function slotPlan(key) {
  const r = Ink.R(key === 'spring' ? 77 : 78), out = [];
  for (const tw of twigPlan(key)) {
    for (const t of key === 'autumn' ? (tw.main ? [.3, .55, .8, 1] : [.5, 1]) : [.55, 1]) {
      const p = Ink.bez(tw.c, t), q = Ink.bez(tw.c, Math.max(0, t - .03)), a = Math.atan2(p[1] - q[1], p[0] - q[0]);
      if (key === 'autumn') {
        // maple: leaves in opposite pairs, one extra leaf at the twig tip
        for (const sd of t === 1 ? [-1, 0, 1] : [-1, 1]) out.push({ dx: p[0], dy: p[1], ang: a + sd * (.95 + r() * .45) + (r() - .5) * .25, size: 10 + r() * 6, v: Math.floor(r() * 6) });
      } else {
        // cherry: clusters of 3-4 blossoms on long stalks, from one node
        const n = 3 + Math.floor(r() * 2);
        for (let k = 0; k < n; k++) out.push({ dx: p[0], dy: p[1], ang: a + (k - (n - 1) / 2) * .6 + (r() - .5) * .3, size: 5.5 + r() * 3.5, v: Math.floor(r() * 3) });
      }
    }
  }
  return out;
}
// Sprite pivots at the stem tip: the leaf rotates and flutters around where it attaches to the branch.
const STEM = { spring: { r: 10, w: 30, h: 36, pivot: 34, blade: 20 }, autumn: { r: 15, w: 40, h: 40, pivot: 28.3, blade: 8.3 } };
function stemSprite(c, key, size, scale = 1) {
  const st = STEM[key], k = size / st.r * PX_TREE() * scale, w = st.w * k, h = st.h * k;
  const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2 - (st.h - st.pivot) / st.h * h, 0);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: sharedTex(c), transparent: true, depthWrite: false, depthTest: false, toneMapped: false, opacity: 0 }));
  m.rotation.x = -Math.PI / 2; return m;
}
// design angle (x right, y down) -> rotation.z of the horizontal plane (local +y axis is the blade direction)
const designAngToRotZ = (a) => Math.atan2(-Math.cos(a), -Math.sin(a));
const shadowMat = (c) => new THREE.MeshBasicMaterial({ map: sharedTex(c), color: 0x000000, transparent: true, depthWrite: false, depthTest: false, toneMapped: false, opacity: 0 });
function buildSlots(key, layer) {
  const tex = key === 'spring' ? sprites.bloom : key === 'autumn' ? sprites.leaf : null;
  if (!tex) return;
  const kSh = viewAt(SHORE_Y + .1).w / viewAt(TREE_Y).w;
  for (const p of slotPlan(key)) {
    const c = tex[p.v % tex.length], rz = designAngToRotZ(p.ang);
    const m = stemSprite(c, key, p.size); m.renderOrder = 41; m.rotation.z = rz; overScene.add(m);
    const sh = stemSprite(c, key, p.size, kSh); sh.material.color.set(0x000000); sh.renderOrder = 26; sh.rotation.z = rz; overScene.add(sh);
    slots.push({ ...p, rot: rz, m, sh, key, layer, state: 'on', grow: 1, timer: 0, x: 0, z: 0, seed: Math.random() * 9 });
  }
}
// Same formula as the tree's sway shader, so blossoms follow the branches.
function slotSway(s, t, gust, sway) {
  const u = s.dx / DW, v = 1 - s.dy / DH, d2 = (u - 1) ** 2 + (v - 1) ** 2;
  const w = (Math.sin(t * 1.3 + u * 5) * .6 + Math.sin(t * 2.3 + v * 7) * .4) * gust;
  return (w * .6 + gust * .5) * d2 * sway;
}
function detach(s) {
  s.state = 'gone'; s.timer = s.key === 'spring' ? rnd(10, 20) : rnd(12, 24);
  // fall from the middle of the leaf blade/blossom, not from the attachment point
  const st = STEM[s.key], off = st.blade * s.size / st.r * PX_TREE() * .75;
  const x = s.x + Math.cos(s.ang) * off, z = s.z + Math.sin(s.ang) * off, worldSize = st.w * s.size / st.r * PX_TREE();
  if (s.key === 'spring') {
    if (Math.random() < .45) spawnFall(sprites.bloom[s.v], worldSize, x, TREE_Y, z, 'bloom', s.rot);
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) spawnFall(sprites.fall[i % sprites.fall.length], rnd(.55, .8), x + rnd(-.4, .4), TREE_Y, z + rnd(-.4, .4), 'petal');
  } else spawnFall(sprites.leaf[s.v], worldSize, x, TREE_Y, z, 'leaf', s.rot);
}
function spawnFall(c, size, x, y, z, kind, rot = rnd(0, TAU)) {
  const m = spriteMesh(c, size); m.position.set(x, y, z); m.rotation.z = rot; m.renderOrder = kind === 'snow' ? 52 : 50; overScene.add(m);
  let sh = null;
  if (kind !== 'snow') { sh = new THREE.Mesh(m.geometry, shadowMat(c)); sh.rotation.x = -Math.PI / 2; sh.renderOrder = 27; overScene.add(sh); }
  // [flip speed, lateral drift, fall factor]: petals flip fast, maple leaves rock like a pendulum
  const P = { petal: [rnd(5, 9), .55, 1.0], bloom: [rnd(2.5, 4), .8, 1.1], leaf: [rnd(1.6, 3), 2.4, 1.4], snow: [0, 0, 1] }[kind];
  drifters.push({ m, sh, state: 'fall', kind, size, x, y, z, vx: 0, vz: 0, vy: -.3, phi: rnd(0, TAU), phiRate: P[0] * (Math.random() < .5 ? -1 : 1), glide: P[1], fallK: P[2], dir: rnd(0, TAU), spin: rnd(-1.5, 1.5), rot, a: kind === 'snow' ? 0 : 1, life: Infinity, snow: kind === 'snow', flutter: rnd(0, 6) });
}
function spawnSnow() {
  const y = rnd(TREE_Y - 2, TREE_Y + 4), [x, z] = d2w(rnd(-40, DW + 40), rnd(-40, DH + 40), y);
  spawnFall(sprites.fall[0], rnd(.25, .55), x, y, z, 'snow');
}

// ---------- Insects: dragonflies, butterflies ----------
function cv(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
const INSECT = {};
{
  // Dragonfly wing: pointing right, base at x = 0. Longitudinal veins, cross veins, wing spot (pterostigma).
  INSECT.dWing = cv(256, 56, (x, w, h) => {
    x.translate(0, h / 2);
    const path = () => { x.beginPath(); x.moveTo(2, -3); x.bezierCurveTo(60, -24, 200, -22, 250, -6); x.bezierCurveTo(254, 0, 250, 8, 236, 10); x.bezierCurveTo(160, 20, 50, 16, 2, 4); x.closePath(); };
    path(); x.fillStyle = 'rgba(226,236,240,.45)'; x.fill();
    x.save(); path(); x.clip();
    x.strokeStyle = 'rgba(30,30,30,.4)'; x.lineWidth = 1;
    for (let k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(4, k * 2.2); x.bezierCurveTo(80, k * 5 - 2, 180, k * 4 - 2, 250, k * 2 - 3); x.stroke(); }
    x.lineWidth = .6; x.strokeStyle = 'rgba(30,30,30,.25)';
    for (let i = 10; i < 250; i += 7) { x.beginPath(); x.moveTo(i, -18); x.lineTo(i + 2, 18); x.stroke(); }
    x.restore();
    path(); x.strokeStyle = 'rgba(20,20,20,.8)'; x.lineWidth = 1.6; x.stroke();
    x.fillStyle = '#1a1a1a'; x.fillRect(212, -11, 15, 7);
  });
  // Dragonfly body, head up: big compound eyes, thorax, 9-segment abdomen.
  const dBody = (abd, tip) => cv(48, 200, (x, w) => {
    x.translate(w / 2, 0);
    x.fillStyle = '#1b1b1b'; x.beginPath(); x.ellipse(-8, 14, 9, 10, 0, 0, TAU); x.ellipse(8, 14, 9, 10, 0, 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(-10, 10, 3, 0, TAU); x.arc(10, 10, 3, 0, TAU); x.fill();
    x.fillStyle = '#2b2b2b'; x.beginPath(); x.ellipse(0, 40, 10, 18, 0, 0, TAU); x.fill();
    for (let i = 0; i < 9; i++) { const y = 62 + i * 15, wd = 6 - i * .35; x.fillStyle = i > 6 ? tip : abd; x.beginPath(); x.ellipse(0, y, wd, 8.5, 0, 0, TAU); x.fill(); x.strokeStyle = 'rgba(15,15,15,.8)'; x.lineWidth = 1.2; x.stroke(); }
  });
  INSECT.dBody = { blue: dBody('#8fa6b6', '#1b1b1b'), red: dBody('#c2402a', '#7a1d10') };
  // Right butterfly wing (forewing + hindwing), base at x = 0.
  const bWing = (kind) => cv(160, 170, (x) => {
    x.translate(0, 74);
    const fore = () => { x.beginPath(); x.moveTo(0, -4); x.bezierCurveTo(30, -70, 110, -76, 150, -56); x.bezierCurveTo(150, -20, 110, 4, 0, 6); x.closePath(); };
    const hind = () => { x.beginPath(); x.moveTo(0, 4); x.bezierCurveTo(70, 0, 120, 40, 96, 80); if (kind === 'swallow') { x.lineTo(108, 92); x.lineTo(94, 94); x.lineTo(84, 84); } x.bezierCurveTo(60, 96, 20, 60, 0, 12); x.closePath(); };
    const base = { white: '#f7f5ef', yellow: '#f1d36a', swallow: '#1d1b1a' }[kind];
    for (const sh of [hind, fore]) { sh(); x.fillStyle = base; x.fill(); }
    x.save(); fore(); x.clip();
    if (kind === 'white') { x.fillStyle = '#3a3a3a'; x.beginPath(); x.ellipse(140, -56, 26, 14, -.3, 0, TAU); x.fill(); x.beginPath(); x.arc(90, -28, 7, 0, TAU); x.fill(); }
    if (kind === 'yellow') { x.fillStyle = '#6a4a1a'; x.beginPath(); x.ellipse(146, -54, 18, 12, -.3, 0, TAU); x.fill(); }
    if (kind === 'swallow') { x.fillStyle = '#e8d27a'; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(40 + i * 18, -30 - i * 3, 5, 14, .3, 0, TAU); x.fill(); } }
    x.restore();
    x.save(); hind(); x.clip();
    if (kind === 'swallow') { x.fillStyle = '#e8d27a'; for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(30 + i * 14, 24 + i * 6, 5, 12, -.4, 0, TAU); x.fill(); } x.fillStyle = '#c8402b'; x.beginPath(); x.arc(84, 70, 6, 0, TAU); x.fill(); x.fillStyle = '#5a7ab0'; x.beginPath(); x.arc(70, 76, 4, 0, TAU); x.fill(); }
    if (kind === 'white') { x.fillStyle = '#3a3a3a'; x.beginPath(); x.arc(40, 22, 6, 0, TAU); x.fill(); }
    x.restore();
    x.strokeStyle = kind === 'swallow' ? 'rgba(240,230,200,.35)' : 'rgba(40,30,20,.35)'; x.lineWidth = 1;
    for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(2, 0); x.quadraticCurveTo(60, -30 + i * 10, 140 - i * 10, -60 + i * 22); x.stroke(); }
    for (const sh of [hind, fore]) { sh(); x.strokeStyle = 'rgba(15,15,15,.85)'; x.lineWidth = 2; x.stroke(); }
  });
  INSECT.bWing = { white: bWing('white'), yellow: bWing('yellow'), swallow: bWing('swallow') };
  INSECT.bBody = cv(28, 100, (x, w) => {
    x.translate(w / 2, 14);
    x.fillStyle = '#1d1d1d'; x.beginPath(); x.ellipse(0, 10, 5, 6, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(0, 44, 4.5, 28, 0, 0, TAU); x.fill();
    x.strokeStyle = '#1d1d1d'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-2, 6); x.quadraticCurveTo(-8, -6, -11, -10); x.moveTo(2, 6); x.quadraticCurveTo(8, -6, 11, -10); x.stroke();
  });
}
function plane(c, w, h, pivot = 0) {
  const g = new THREE.PlaneGeometry(w, h); if (pivot) g.translate(w / 2, 0, 0);   // pivot: wing base at the left edge
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: sharedTex(c), transparent: true, depthWrite: false, depthTest: false, toneMapped: false, side: THREE.DoubleSide, opacity: 0 }));
}
const insects = [];
class Insect {
  constructor() {
    this.root = new THREE.Group(); this.flat = new THREE.Group(); this.flat.rotation.x = -Math.PI / 2; this.root.add(this.flat);
    this.shRoot = new THREE.Group(); this.shFlat = new THREE.Group(); this.shFlat.rotation.x = -Math.PI / 2; this.shRoot.add(this.shFlat);
    overScene.add(this.root, this.shRoot);
    this.wings = []; this.a = 0; this.dying = false; this.seedA = rnd(0, 9); this.seedB = rnd(0, 9);
  }
  part(c, w, h, x, y, rotZ, pivot, order, wing) {
    const m = plane(c, w, h, pivot), s = plane(c, w, h, pivot);
    s.material.color.set(0x000000);
    for (const o of [m, s]) { o.position.set(x, y, 0); o.rotation.z = rotZ; }
    m.renderOrder = order; s.renderOrder = 28;
    this.flat.add(m); this.shFlat.add(s);
    if (wing) this.wings.push({ m, s, side: x < 0 ? -1 : 1, base: rotZ });
  }
  // proj: wing width seen from above (1 = flat open, ~0 = upright while flapping)
  wing(i, proj, alpha, rotZ) { const W = this.wings[i]; for (const o of [W.m, W.s]) { o.scale.x = W.side * proj; o.rotation.z = rotZ ?? W.base; } W.m.userData.alpha = alpha; }
  place() {
    // Image is drawn head-up: rotate so the head points along flight heading h on the XZ plane.
    const ry = -this.h - Math.PI / 2;
    this.root.position.set(this.x, this.y, this.z); this.root.rotation.y = ry;
    this.shRoot.position.set(this.x + SUN_SH[0] * this.y, SHORE_Y + .14, this.z + SUN_SH[1] * this.y); this.shRoot.rotation.y = ry;
    const op = clamp(this.a, 0, 1), so = .2 * clamp(1.15 - this.y / 13, .25, 1) * op;
    this.root.traverse(o => { if (o.material) o.material.opacity = op * (o.userData.alpha ?? 1); });
    this.shRoot.traverse(o => { if (o.material) o.material.opacity = so; });
  }
  life(dt) { this.a = this.dying ? this.a - dt / 1.2 : Math.min(1, this.a + dt / 1.2); }
  dispose() { for (const r of [this.root, this.shRoot]) { overScene.remove(r); r.traverse(o => { if (o.material) { o.material.dispose(); o.geometry.dispose(); } }); } }
}
function hoverPoint() { const y = rnd(3.5, 8), [dx, dy] = pondPt(rnd(0, TAU), rnd(.1, .9)), [x, z] = d2w(dx, dy, y); return { x, z, y }; }
function perchPoint() {
  const leaves = drifters.filter(d => d.big && !d.ice && d.state === 'float' && !d.dying);
  if (leaves.length && Math.random() < .7) { const d = leaves[Math.floor(Math.random() * leaves.length)]; return { x: d.x, z: d.z, y: FLOAT_Y + .3, perch: { d, y: FLOAT_Y + .3 } }; }
  const y = SHORE_Y + .5, [dx, dy] = pondPt(rnd(0, TAU), 1.07), [x, z] = d2w(dx, dy, y); return { x, z, y, perch: { y } };
}
class Dragonfly extends Insect {
  constructor(kind) {
    super();
    const L = 3.4, span = 2.9, chord = .62;
    for (const [y, rot] of [[1.12, .08], [.86, -.2]]) for (const side of [1, -1]) this.part(INSECT.dWing, span, chord, side * .12, y, side * rot, 1, 61, true);
    this.part(INSECT.dBody[kind], .8, L, 0, 0, 0, 0, 62, false);
    const p = hoverPoint();
    Object.assign(this, { x: p.x, z: p.z, y: p.y, h: rnd(0, TAU), hT: null, state: 'hover', T: rnd(.5, 1.5), el: 0, flap: rnd(0, 6) });
  }
  // Behavior: dart straight -> stop and hover -> sharp turn; perch on lotus leaves/rocks; dip down to touch the water.
  next() {
    const r = Math.random();
    if (r < .55) this.dartTo(hoverPoint());
    else if (r < .82) this.dartTo(perchPoint());
    else { this.state = 'dip'; this.el = 0; this.dipY = this.y; this.dipped = false; }
  }
  dartTo(p) {
    this.from = [this.x, this.z, this.y]; this.to = [p.x, p.z, p.y]; this.perchNext = p.perch || null;
    this.hT = Math.atan2(p.z - this.z, p.x - this.x);
    this.dur = clamp(Math.hypot(p.x - this.x, p.z - this.z) / rnd(16, 24), .25, 1.4);
    this.state = 'turn'; this.el = 0;                                     // turn the body first, then dart
  }
  update(dt, t) {
    this.life(dt); this.el += dt; this.T -= dt;
    if (this.state === 'turn') { if (this.el > .12) { this.state = 'dart'; this.el = 0; } }
    else if (this.state === 'dart') {
      const k = clamp(this.el / this.dur, 0, 1), e = k * k * (3 - 2 * k);
      this.x = lerp(this.from[0], this.to[0], e); this.z = lerp(this.from[1], this.to[1], e);
      this.y = lerp(this.from[2], this.to[2], e) + Math.sin(k * Math.PI) * .6;
      if (k >= 1) {
        if (this.perchNext) { this.state = 'perch'; this.perch = this.perchNext; this.T = rnd(2.5, 7); }
        else { this.state = 'hover'; this.T = rnd(.4, 1.4); }
      }
    } else if (this.state === 'hover') {
      this.x += Math.sin(t * 7.3 + this.seedA) * .3 * dt; this.z += Math.cos(t * 6.1 + this.seedB) * .3 * dt; this.y += Math.sin(t * 3) * .12 * dt;
      if (Math.random() < dt * .8) this.hT = this.h + rnd(-1.2, 1.2);          // startled heading change in place
      if (this.T < 0) this.next();
    } else if (this.state === 'perch') {
      if (this.perch.d) { if (this.perch.d.dying) this.T = -1; this.x = this.perch.d.x; this.z = this.perch.d.z; }
      this.y = this.perch.y;
      if (Math.random() < dt * .3) this.hT = this.h + rnd(-.5, .5);
      if (this.T < 0) { this.state = 'hover'; this.T = rnd(.3, .8); this.y += .8; }
    } else if (this.state === 'dip') {
      const k = clamp(this.el / .7, 0, 1); this.y = lerp(this.dipY, .35, Math.sin(k * Math.PI));
      if (!this.dipped && k > .5) { this.dipped = true; const [u, v] = w2uv(this.x, SURF_Y, this.z); splash(u, v, .005, .3); }
      if (k >= 1) { this.state = 'hover'; this.T = rnd(.3, 1); }
    }
    if (this.hT !== null) this.h += angDiff(this.hT, this.h) * (1 - Math.exp(-dt * 20));
    // Wings: in flight they beat ~27 Hz so only a blur shows; perched they spread flat, crisp, tilted slightly forward.
    const flying = this.state !== 'perch';
    this.flap += dt * TAU * 27;
    this.wings.forEach((W, i) => {
      if (flying) this.wing(i, .25 + .75 * Math.abs(Math.cos(this.flap + (i < 2 ? 0 : 1.7) + Math.random() * .5)), .5);
      else this.wing(i, 1, 1, W.base + W.side * (i < 2 ? .14 : -.06));
    });
    this.place();
  }
}
function flowerTarget() {
  if (season === 'spring') {
    const on = slots.filter(s => s.state === 'on' && s.key === 'spring' && s.layer.fade > 0);
    if (!on.length) return null;
    const s = on[Math.floor(Math.random() * on.length)];
    return { pos: () => ({ x: s.x, z: s.z, y: TREE_Y + .1 }), ok: () => s.state === 'on' };
  }
  if (season === 'summer') {
    const fl = drifters.filter(d => d.flower && !d.dying);
    if (!fl.length) return null;
    const d = fl[Math.floor(Math.random() * fl.length)];
    return { pos: () => ({ x: d.x, z: d.z, y: FLOAT_Y + .3 }), ok: () => !d.dying };
  }
  return null;
}
class Butterfly extends Insect {
  constructor(kind) {
    super();
    for (const side of [1, -1]) this.part(INSECT.bWing[kind], 1.6, 1.7, side * .05, .02, 0, 1, 61, true);
    this.part(INSECT.bBody, .32, 1.15, 0, 0, 0, 0, 62, false);
    const p = hoverPoint();
    Object.assign(this, { x: p.x, z: p.z, y: p.y, vx: 0, vz: 0, vy: 0, h: rnd(0, TAU), course: rnd(0, TAU), yaw: 0, bank: 0,
      ph: rnd(0, 6), freq: rnd(4.5, 6), beats: 4, yT: rnd(3.5, 8), glideT: 0, state: 'fly', T: rnd(5, 10), target: null });
  }
  // Real butterflies don't fly in smooth curves: each downstroke is a push in a random
  // direction, gravity pulls down between beats -> jerky zigzag, bobbing flight path.
  update(dt, t) {
    this.life(dt); this.T -= dt;
    let elev, sweep = 0;
    if (this.state !== 'land') {
      if (this.glideT > 0) {
        this.glideT -= dt; elev = .08 + .06 * Math.sin(t * 3);
        this.vy -= .9 * dt;
      } else {
        const before = Math.sin(this.ph);
        this.ph += dt * TAU * this.freq * (before > 0 ? .85 : 1.25);   // slow upstroke, fast downstroke
        if (before > 0 && Math.sin(this.ph) <= 0) {                     // downstroke begins
          const dir = this.course + rnd(-.8, .8), f = this.state === 'approach' ? rnd(.8, 1.4) : rnd(1.2, 2.2);
          this.vx += Math.cos(dir) * f; this.vz += Math.sin(dir) * f; this.vy += clamp(.55 + (this.yT - this.y) * .2, .08, 1.4) + rnd(-.15, .15);   // lift ~ gravity, pulled toward the target height
          this.yaw += rnd(-.45, .45);
          if (--this.beats <= 0) { this.beats = 3 + Math.floor(Math.random() * 6); if (Math.random() < .55) this.glideT = rnd(.25, .7); }
        }
        elev = .55 + .9 * Math.sin(this.ph);                            // wing elevation angle: -0.35 .. 1.45 rad
        sweep = .16 * Math.cos(this.ph);                                // wings sweep forward on the downstroke
      }
      // desired heading: slow drift, occasional sharp changes; steer away from the frame edge; seek flowers
      this.course += (Math.sin(t * .7 + this.seedA) * .5 + Math.sin(t * 1.9 + this.seedB) * .35) * dt;
      if (Math.random() < dt * .25) this.course += rnd(-1.4, 1.4);
      if (Math.random() < dt * .15) this.yT = rnd(3, 8.5);
      const [dx, dy] = w2d(this.x, this.z, this.y);
      if (dx < 90 || dx > 880 || dy < 60 || dy > 500) this.course += angDiff(Math.atan2(POND.cy - dy, POND.cx - dx), this.course) * 2 * dt;
      if (this.state === 'approach') {
        if (!this.target.ok() || this.T < 0) { this.state = 'fly'; this.T = rnd(5, 10); }
        else {
          const p = this.target.pos(), dd = Math.hypot(p.x - this.x, p.z - this.z);
          this.course = Math.atan2(p.z - this.z, p.x - this.x);
          this.yT = p.y + .3;
          if (dd < 2) { this.vx *= Math.exp(-dt * 3); this.vz *= Math.exp(-dt * 3); }
          if (dd < .55 && Math.abs(this.y - p.y) < .9) { this.state = 'land'; this.T = rnd(3, 8); this.vx = this.vz = this.vy = 0; }
        }
      } else if (this.T < 0) { this.target = flowerTarget(); this.state = this.target ? 'approach' : 'fly'; this.T = this.target ? 10 : rnd(5, 10); }
      // gravity + drag
      this.vy -= 2.6 * dt;
      const kd = Math.exp(-dt * 2.1); this.vx *= kd; this.vz *= kd; this.vy *= Math.exp(-dt * 1.4);
      this.x += this.vx * dt; this.z += this.vz * dt; this.y += this.vy * dt;
      if (this.y < 2.4) { this.y = 2.4; this.vy = Math.abs(this.vy) * .5 + 1; }
      if (this.y > TREE_Y + .6) { this.y = TREE_Y + .6; this.vy = -Math.abs(this.vy) * .3; }
      // body turns to the motion direction, wobbles slightly with each stroke; banks when turning
      const sp = Math.hypot(this.vx, this.vz), want = sp > .3 ? Math.atan2(this.vz, this.vx) : this.h;
      this.yaw *= Math.exp(-dt * 5);
      const dh = angDiff(want + this.yaw, this.h) * (1 - Math.exp(-dt * 6));
      this.h += dh;
      this.bank = lerp(this.bank, clamp(dh / Math.max(dt, 1e-3) * .12, -.45, .45), 1 - Math.exp(-dt * 6));
    } else {
      const p = this.target.pos(); this.x = p.x; this.z = p.z; this.y = p.y + .12;
      // perched: wings closed upright, opened to bask only occasionally
      this.ph += dt * .8; elev = 1.2 + .45 * Math.sin(this.ph) + (Math.sin(t * .37 + this.seedA) > .7 ? -.7 : 0);
      if (this.T < 0 || !this.target.ok()) { this.state = 'fly'; this.T = rnd(6, 12); this.vy = 3; this.course = this.h + rnd(-1.5, 1.5); this.beats = 4; }
      this.bank = 0;
    }
    const proj = Math.max(.05, Math.cos(elev));
    this.wings.forEach((W, i) => {
      // wing on the inside of the turn more upright than the outer one
      const pr = clamp(proj * (1 + W.side * this.bank), .04, 1);
      this.wing(i, pr, 1, W.side * sweep);
      W.m.material.color.setScalar(.7 + .3 * pr);                       // wings darken as they rise upright
    });
    this.place();
  }
}

const SEASON_INSECTS = {
  spring: () => [new Butterfly('white'), new Butterfly('yellow'), new Butterfly('white')],
  summer: () => [new Dragonfly('blue'), new Dragonfly('blue'), new Butterfly('swallow')],
  autumn: () => [new Dragonfly('red'), new Dragonfly('red'), new Dragonfly('red')],
  winter: () => [],
};

// ---------- Food: 3D pellets tossed by hand, fall into the water, float then soak and slowly sink ----------
const pelletGeo = new THREE.SphereGeometry(.24, 14, 10); pelletGeo.scale(1, .62, 1);
const pelletMats = ['#6e4421', '#7d4d24', '#8f5c2c', '#5c3a1d', '#a0662e'].map(c => new THREE.MeshToonMaterial({ color: c, gradientMap }));
{ const h = new THREE.HemisphereLight('#fffaf0', '#8a8370', 1.2), d = new THREE.DirectionalLight('#fff6e6', 2); d.position.set(-24, 62, -20); overScene.add(h, d); }
const DROP = cv(16, 16, (x) => { const g = x.createRadialGradient(8, 8, 0, 8, 8, 7); g.addColorStop(0, 'rgba(252,250,244,1)'); g.addColorStop(.6, 'rgba(236,232,220,.8)'); g.addColorStop(1, 'rgba(236,232,220,0)'); x.fillStyle = g; x.fillRect(0, 0, 16, 16); });
const drops = [];
// Water droplets splash up when a pellet hits the water or a fish gulps.
function droplets(x, z, n, power) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: sharedTex(DROP), transparent: true, depthWrite: false, depthTest: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 55; m.scale.setScalar(rnd(.1, .22) * (.6 + power * .6)); overScene.add(m);
    const a = rnd(0, TAU), sp = rnd(.6, 2.2) * power;
    drops.push({ m, x, z, y: .1, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: rnd(2.5, 5.5) * power, life: 0 });
  }
}
function tossFood(x, z) {
  const n = 7 + Math.floor(Math.random() * 5), y0 = 16, g = 32;
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(pelletGeo, pelletMats[Math.floor(Math.random() * pelletMats.length)]);
    m.scale.setScalar(rnd(.75, 1.3)); m.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); m.castShadow = true; m.visible = false;
    const sx = x + rnd(-.3, .3), sz = z + rnd(-.3, .3), tx = x + rnd(-1.9, 1.9), tz = z + rnd(-1.9, 1.9), T = rnd(.6, .85);
    overScene.add(m);
    foods.push({ m, state: 'air', delay: rnd(0, .18), x: sx, y: y0, z: sz, vx: (tx - sx) / T, vz: (tz - sz) / T, vy: (.5 * g * T * T - y0) / T, g, t: 0, soak: rnd(10, 16), spin: rnd(-4, 4), ph: rnd(0, 6), px: 0, pz: 0 });
  }
}
// Fish gulp: suck in pellets in front of the mouth, splash, ripple, fish pauses briefly.
function gulp(fish) {
  const [hx, hz] = fish.head(); let n = 0;
  for (const f of foods) {
    if ((f.state !== 'float' && f.state !== 'sink') || n >= 3) continue;
    if (Math.hypot(f.x - hx, f.z - hz) < 1.5 && Math.abs(f.y - fish.y) < 1.6) { f.state = 'suck'; f.k = 0; f.fish = fish; n++; }
  }
  if (!n) return;
  fish.gulpCD = rnd(.35, .75); fish.cur *= .55; fish.food = null; fish.react = rnd(.1, .4);
  const [u, v] = w2uv(hx, SURF_Y, hz);
  if (fish.y > -1.2) { splash(u, v, .011, .55); droplets(hx, hz, 4 + n * 2, .9); }
  else splash(u, v, .008, .2);
}
function updateFood(dt, t, wx, wz, gust) {
  for (let i = foods.length - 1; i >= 0; i--) {
    const f = foods[i], m = f.m;
    if (f.delay > 0) { f.delay -= dt; continue; }
    m.visible = true;
    if (f.state === 'air') {
      f.vy -= f.g * dt; f.x += f.vx * dt; f.z += f.vz * dt; f.y += f.vy * dt;
      m.rotation.x += f.spin * dt; m.rotation.z += f.spin * .7 * dt;
      if (f.y <= 0) {
        // hit the water: move to the underwater layer to be refracted by waves, casting a shadow on the bottom
        f.y = -.04; f.state = 'float'; overScene.remove(m); waterScene.add(m);
        const [u, v] = w2uv(f.x, SURF_Y, f.z); splash(u, v, .004, .16); droplets(f.x, f.z, 2, .45);
      }
    } else if (f.state === 'float') {
      f.t += dt;
      // drift with the wind, pushed by fish snouts, pellets don't overlap
      f.px = lerp(f.px, wx * gust * .35, dt); f.pz = lerp(f.pz, wz * gust * .35, dt);
      for (const k of fish) { if (k.y < -1.5) continue; const [hx, hz] = k.head(), ddx = f.x - hx, ddz = f.z - hz, d = Math.hypot(ddx, ddz); if (d < 1.8 && d > 0) { f.px += ddx / d * (1.8 - d) * dt * 3; f.pz += ddz / d * (1.8 - d) * dt * 3; } }
      for (const o of foods) { if (o === f || o.state !== 'float') continue; const ddx = f.x - o.x, ddz = f.z - o.z, d = Math.hypot(ddx, ddz); if (d < .4 && d > 0) { f.x += ddx / d * (.4 - d) * .5; f.z += ddz / d * (.4 - d) * .5; } }
      f.px *= Math.exp(-dt * .8); f.pz *= Math.exp(-dt * .8);
      f.x += f.px * dt; f.z += f.pz * dt;
      f.y = -.04 + Math.sin(t * 3 + f.ph) * .012;
      m.rotation.y += f.spin * .05 * dt;
      if (f.t > f.soak) f.state = 'sink';
    } else if (f.state === 'sink') {
      f.y -= .32 * dt; m.rotation.x += f.spin * .1 * dt;
      if (f.y < FLOOR_Y + 1) f.state = 'gone';
    } else if (f.state === 'suck') {
      // sucked into the mouth in ~0.13 s
      f.k += dt / .13; const [hx, hz] = f.fish.head();
      f.x = lerp(f.x, hx, Math.min(1, f.k)); f.z = lerp(f.z, hz, Math.min(1, f.k)); f.y = lerp(f.y, f.fish.y + .2, Math.min(1, f.k));
      m.scale.multiplyScalar(Math.exp(-dt * 6));
      if (f.k >= 1) f.state = 'gone';
    }
    m.position.set(f.x, f.y, f.z);
    if (f.state === 'gone') { m.parent?.remove(m); foods.splice(i, 1); }
  }
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i]; d.life += dt; d.vy -= 22 * dt; d.x += d.vx * dt; d.z += d.vz * dt; d.y += d.vy * dt;
    d.m.position.set(d.x, Math.max(d.y, 0), d.z); d.m.material.opacity = clamp(1 - d.life / .55, 0, 1) * .9;
    if (d.y < 0 && d.vy < 0) { if (d.life > .1) { const [u, v] = w2uv(d.x, SURF_Y, d.z); splash(u, v, .003, .05); } overScene.remove(d.m); d.m.material.dispose(); d.m.geometry.dispose(); drops.splice(i, 1); }
  }
}

// ---------- Interaction ----------
const ray = new THREE.Raycaster(), surf = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
let pointer = null, lastP = null, ptrUV = new THREE.Vector2(.5, .5), prevUV = new THREE.Vector2(.5, .5), hasPtr = false;
function pickEvt(e) {
  const b = canvas.getBoundingClientRect(), nx = (e.clientX - b.left) / b.width, ny = (e.clientY - b.top) / b.height;
  ray.setFromCamera({ x: nx * 2 - 1, y: -(ny * 2 - 1) }, camera);
  return { uv: [nx, 1 - ny], w: ray.ray.intersectPlane(surf, hit) ? { x: hit.x, z: hit.z } : null };
}
canvas.addEventListener('pointermove', (e) => {
  const { uv, w } = pickEvt(e); if (!w) return;
  ptrUV.set(uv[0], uv[1]); if (!hasPtr) prevUV.copy(ptrUV); hasPtr = true;
  const now = performance.now();
  const pdt = lastP ? Math.max(.008, (now - lastP.t) / 1000) : 1;
  w.vx = lastP ? (w.x - lastP.x) / pdt : 0; w.vz = lastP ? (w.z - lastP.z) / pdt : 0; w.speed = Math.hypot(w.vx, w.vz); w.t = now;
  pointer = w; lastP = w;
});
canvas.addEventListener('pointerleave', () => { pointer = null; hasPtr = false; });
canvas.addEventListener('click', (e) => {
  const { w } = pickEvt(e); if (!w) return;
  const [dx, dy] = w2d(w.x, w.z, SURF_Y);
  if (pondE(dx, dy) < .92) tossFood(w.x, w.z);
});
document.querySelectorAll('.toolbar [data-season]').forEach(b => b.addEventListener('click', () => { auto = false; document.getElementById('auto').classList.remove('on'); setSeason(b.dataset.season); }));
let auto = true, autoT = 0;
document.getElementById('auto').addEventListener('click', (e) => { auto = !auto; e.currentTarget.classList.toggle('on', auto); autoT = 0; });
document.getElementById('night').addEventListener('click', () => { auto = false; document.getElementById('auto').classList.remove('on'); setNight(!NIGHT.on); });

// ---------- Loop ----------
await setSeason('spring');
const timer = new THREE.Timer(); timer.connect(document);
const ORDER = ['spring', 'summer', 'autumn', 'winter'];
let windA = Math.PI * .85, spawnAcc = 0;

renderer.setAnimationLoop((ts) => {
  timer.update(ts);
  const dt = Math.min(timer.getDelta(), 1 / 30), t = timer.getElapsed(), S = SEASONS[season];
  // auto-cycle: each season one day then one night, next season in the morning
  if (auto && !busy) { autoT += dt; if (!NIGHT.on && autoT > 24) { autoT = 0; setNight(true); } else if (NIGHT.on && autoT > 16) { autoT = 0; setNight(false); setSeason(ORDER[(ORDER.indexOf(season) + 1) % 4]); } }

  // Wind: main direction from the tree corner (top right) blowing toward bottom left, in gusts.
  const gust = updateWind(dt, t);
  windA = Math.PI * .85 + Math.sin(t * .05) * .35 + WIND.dirOff;
  const wind = new THREE.Vector2(Math.cos(windA), Math.sin(windA));    // design coords: x right, y down
  // wind direction in world (x, z) matches design (x, y)
  const wx = wind.x, wz = wind.y;

  // Painted layers: fade in/out on season change
  for (let i = layers.length - 1; i >= 0; i--) {
    const L = layers[i]; L.a = clamp(L.a + L.fade * dt / 1.6, 0, 1);
    for (const m of L.meshes) {
      if (m.material.uniforms) { m.material.uniforms.uOpacity.value = L.a; m.material.uniforms.uTime.value = t; m.material.uniforms.uGust.value = gust; m.material.uniforms.uWind.value.copy(wind); }
      else m.material.opacity = L.a;
    }
    if (L.fade < 0 && L.a <= 0) { for (const m of L.meshes) { m.parent.remove(m); m.material.map?.dispose?.(); m.material.uniforms?.map.value.dispose(); m.material.dispose(); m.geometry.dispose(); } layers.splice(i, 1); }
  }

  updatePlants(dt, t, wind);

  // Falling objects driven by wind
  if (S.fall === 'snow' && sprites.fall) { spawnAcc += dt * S.rate; while (spawnAcc > 1) { spawnAcc--; spawnSnow(); } }

  // Flowers/leaves on the tree: follow the branches, gusts make them fall, then they slowly regrow.
  for (let i = slots.length - 1; i >= 0; i--) {
    const s = slots[i], L = s.layer;
    const k = slotSway(s, t, gust, 2.4), [bx, bz] = d2w(s.dx, s.dy, TREE_Y);
    s.x = bx + wx * k; s.z = bz + wz * k;
    if (s.state === 'on') {
      if (L.fade > 0 && Math.random() < dt * (s.key === 'spring' ? .02 : .013) * (.12 + gust * gust * 1.8)) detach(s);
      else if (s.key === 'spring' && L.fade > 0 && Math.random() < dt * .012 * gust) spawnFall(sprites.fall[Math.floor(Math.random() * sprites.fall.length)], rnd(.5, .75), s.x, TREE_Y, s.z, 'petal');
    } else if (s.state === 'gone') { if ((s.timer -= dt) < 0) { s.state = 'grow'; s.grow = 0; } }
    else if ((s.grow += dt / 4) >= 1) { s.grow = 1; s.state = 'on'; }
    const g = s.state === 'gone' ? 0 : s.state === 'grow' ? s.grow * s.grow * (3 - 2 * s.grow) : 1;
    // leaves flutter around the stem, occasionally flipping over in gusts
    const flut = Math.sin(t * (3.1 + s.seed * .3) + s.seed * 7) * (.06 + .16 * gust) + Math.sin(t * 7.7 + s.seed) * .04 * gust;
    s.m.position.set(s.x, TREE_Y + .05, s.z); s.m.rotation.z = s.rot + flut + k * .03;
    s.m.scale.set((.3 + .7 * g) * (1 - .35 * gust * Math.max(0, Math.sin(t * 2.3 + s.seed * 5)) ** 6), .3 + .7 * g, 1);
    s.m.material.opacity = g * L.a;
    const ks = slotSway(s, t, gust, 1.4), [sx, sz] = d2w(s.dx, s.dy, SHORE_Y + .1);
    s.sh.position.set(sx + 2.2 + wx * ks, SHORE_Y + .12, sz + 3.4 + wz * ks); s.sh.scale.copy(s.m.scale); s.sh.rotation.z = s.m.rotation.z;
    s.sh.material.opacity = .2 * g * L.a;
    if (L.fade < 0 && L.a <= 0) { for (const o of [s.m, s.sh]) { overScene.remove(o); o.material.dispose(); o.geometry.dispose(); } slots.splice(i, 1); }
  }
  for (let i = drifters.length - 1; i >= 0; i--) {
    const d = drifters[i], mat = d.m.material;
    if (d.state === 'fall') {
      if (d.snow) {
        d.flutter += dt * 2;
        d.x += (wx * (1.5 + gust * 5) + Math.sin(d.flutter) * .5) * dt; d.z += (wz * (1.5 + gust * 5) + Math.cos(d.flutter * .7) * .4) * dt;
        d.y -= 1.1 * dt;
        if (!d.dying) d.a = Math.min(1, d.a + dt * 2);
      } else {
        // Flipping in the air: lying flat it catches wind, falls slowly and drifts sideways like a pendulum; tilted on edge it falls fast.
        d.phi += d.phiRate * dt;
        const c = Math.cos(d.phi), flat = Math.abs(c);
        d.vy = lerp(d.vy, -d.fallK * lerp(2.6, .7, flat), 1 - Math.exp(-dt * 3));
        const g = Math.sin(d.phi) * d.glide;
        d.dir += d.spin * .3 * dt;
        d.x += (wx * (1.2 + gust * 6) + Math.cos(d.dir) * g) * dt;
        d.z += (wz * (1.2 + gust * 6) + Math.sin(d.dir) * g) * dt;
        d.y += d.vy * dt;
        d.rot += d.spin * dt;
        d.m.rotation.z = d.rot;
        d.m.scale.set(Math.max(.14, flat), 1, 1);
        mat.color.setScalar(c >= 0 ? 1 : .72);                       // underside darker
        if (d.sh) {
          d.sh.position.set(d.x + SUN_SH[0] * d.y, SHORE_Y + .12, d.z + SUN_SH[1] * d.y);
          d.sh.rotation.z = d.rot; d.sh.scale.copy(d.m.scale);
          d.sh.material.opacity = .3 * clamp(1 - d.y / (TREE_Y + 2), .1, 1) * Math.max(.3, flat) * clamp(d.a, 0, 1);
        }
      }
      if (d.y <= FLOAT_Y + .02) {
        if (d.sh) { overScene.remove(d.sh); d.sh.material.dispose(); d.sh = null; }
        d.m.scale.set(1, 1, 1); mat.color.setScalar(1);
        const [dx, dy] = w2d(d.x, d.z, FLOAT_Y);
        if (pondE(dx, dy) < .97) {
          const [u, v] = d2uv(dx, dy);
          if (d.snow) { d.state = 'melt'; } else { d.state = 'float'; d.life = { petal: 14, bloom: 20, leaf: 24 }[d.kind] * Math.sqrt(d.size) * rnd(.75, 1.25); d.sinkable = true; splash(u, v, .006, d.kind === 'leaf' ? .2 : .12); }   // floats longer or shorter depending on size, then soaks and sinks
        } else { d.state = 'land'; d.life = d.snow ? rnd(3, 6) : rnd(8, 14); d.m.renderOrder = 22; }
        d.y = FLOAT_Y;
      }
    } else if (d.state === 'float') {
      // wind pushes drift (small objects drift faster than big lotus leaves), water stirred by the pointer carries floating objects in the drag direction
      const k = d.ice ? .08 : d.big ? .3 : .6;
      d.vx = lerp(d.vx, wx * gust * 1.6 * k * 4, dt * .5); d.vz = lerp(d.vz, wz * gust * 1.6 * k * 4, dt * .5);
      if (pointer) {
        const ddx = d.x - pointer.x, ddz = d.z - pointer.z, dd = Math.hypot(ddx, ddz) || 1e-3, R = 6;
        if (dd < R) {
          const fall = (1 - dd / R) ** 2, kf = (d.big ? 1.1 : 2.4) * fall * dt;
          d.vx += (pointer.vx || 0) * kf + ddx / dd * (4 - Math.min(dd, 4)) * dt * 2; d.vz += (pointer.vz || 0) * kf + ddz / dd * (4 - Math.min(dd, 4)) * dt * 2;
          d.spin += ((pointer.vx || 0) * ddz - (pointer.vz || 0) * ddx) / (dd * dd + 4) * dt * (d.big ? .05 : .3);   // swirl makes objects spin
        }
      }
      d.spin *= Math.exp(-dt * .4);
      // lotus leaves/flowers have stems anchored to the bottom: drift around where they grow then get pulled back
      if (d.big && !d.ice && d.hx !== undefined) { d.vx += (d.hx - d.x) * dt * .18; d.vz += (d.hz - d.z) * dt * .18; }
      for (const f of fish) { if (f.y < -1.4) continue; const [hx, hz] = f.head(), ddx = d.x - hx, ddz = d.z - hz, dd = Math.hypot(ddx, ddz); if (dd < 2.5 && dd > 0) { d.vx += ddx / dd * dt * 4; d.vz += ddz / dd * dt * 4; } }
      // lotus leaves/flowers that collide get pushed apart, no overlap
      if (d.big && !d.dying) for (const o of drifters) {
        if (o === d || !o.big || o.dying || o.state !== 'float') continue;
        const ddx = d.x - o.x, ddz = d.z - o.z, dd = Math.hypot(ddx, ddz) || 1e-3, min = d.rad + o.rad;
        if (dd < min) { const push = (min - dd) * .5; d.x += ddx / dd * push; d.z += ddz / dd * push; o.x -= ddx / dd * push; o.z -= ddz / dd * push; d.vx *= .9; d.vz *= .9; }
      }
      d.x += d.vx * dt; d.z += d.vz * dt; d.m.rotation.z += d.spin * dt * (d.big ? .2 : 1);
      const [dx, dy] = w2d(d.x, d.z, FLOAT_Y), e = pondE(dx, dy);
      if (e > .93) { const [cx, cz] = d2w(POND.cx, POND.cy, FLOAT_Y), l = Math.hypot(cx - d.x, cz - d.z); d.vx += (cx - d.x) / l * dt * 2; d.vz += (cz - d.z) / l * dt * 2; }
      d.y = FLOAT_Y + Math.sin(t * 2 + d.x) * .02;
      if (!d.dying) d.a = Math.min(1, d.a + dt);
      d.life -= dt;
      if (d.sinkable && !d.dying) {
        if (d.life < 2) mat.color.setScalar(lerp(.82, 1, clamp(d.life / 2, 0, 1)));   // soaking: gradually darken before sinking
        if (d.life < 0) {
          // move to the underwater scene: seen through the surface (refraction, ripples), occluded by the fish body above
          overScene.remove(d.m); waterScene.add(d.m); mat.depthTest = true;
          d.state = 'sink'; d.vy = -{ petal: .22, bloom: .28, leaf: .32 }[d.kind] * rnd(.8, 1.2); d.phi = 0; d.y0 = d.y;
          const [u, v] = d2uv(...w2d(d.x, d.z, FLOAT_Y)); splash(u, v, .004, .05);
        }
      } else if (d.life < 0) d.dying = true;
    } else if (d.state === 'sink') {
      // sink slowly, swaying and flipping gently, darkening and fading with depth
      const depth = d.y0 - d.y;
      d.phi += dt * .7; d.y += d.vy * dt;
      d.x += (Math.sin(t * 1.3 + d.dir * 5) * .25 + d.vx * .3) * dt; d.z += (Math.cos(t * 1.1 + d.dir * 3) * .25 + d.vz * .3) * dt;
      d.m.rotation.z += d.spin * dt * .3; d.m.scale.set(Math.max(.45, Math.abs(Math.cos(d.phi * .5))), 1, 1);
      mat.color.setScalar(lerp(.82, .4, clamp(depth / 3.5, 0, 1)));
      d.a = Math.min(d.a, 1 - clamp(depth / 4, 0, 1));
      if (d.a <= 0) d.dying = true;
    } else if (d.state === 'land') { d.life -= dt; if (d.life < 0) d.dying = true; }
    else if (d.state === 'melt') { d.dying = true; }
    if (d.dying) d.a -= dt / (d.state === 'melt' ? .4 : 1.6);
    mat.opacity = clamp(d.a, 0, 1) * (d.snow ? .9 : 1);
    d.m.position.set(d.x, d.y, d.z);
    if (d.dying && d.a <= 0) { if (d.sh) { overScene.remove(d.sh); d.sh.material.dispose(); } d.m.removeFromParent(); mat.dispose(); d.m.geometry.dispose(); drifters.splice(i, 1); }
  }
  // insects
  for (let i = insects.length - 1; i >= 0; i--) { const b = insects[i]; b.update(dt, t); if (b.dying && b.a <= 0) { b.dispose(); insects.splice(i, 1); } }

  for (const f of fish) f.update(dt, t, fish, pointer);
  updateFood(dt, t, wx, wz, gust);

  // Water surface simulation
  if (pointer) { const k = Math.exp(-dt * 6); pointer.speed *= k; pointer.vx *= k; pointer.vz *= k; }
  const vel = hasPtr ? ptrUV.clone().sub(prevUV) : new THREE.Vector2();
  stir.u.uPrev.value = stirBuf.read.texture; stir.u.uPtr.value.copy(ptrUV); stir.u.uPtrVel.value.copy(vel); stir.u.uDt.value = dt;
  stir.u.uDrift.value.set(wx * gust * .012, -wz * gust * .012);
  renderer.setRenderTarget(stirBuf.write); renderer.render(stir.s, qCam); stirBuf.swap();
  const spd = Math.hypot(vel.x * ASPECT, vel.y), amount = hasPtr ? Math.min(spd * 6, .25) : 0;
  for (let k = 0; k < 2; k++) {
    wave.u.uA.value.lerpVectors(prevUV, ptrUV, k / 2); wave.u.uB.value.lerpVectors(prevUV, ptrUV, (k + 1) / 2);
    wave.u.uAmount.value = amount / 2;
    wave.u.uDropN.value = k === 0 ? RIPPLE.length : 0;
    RIPPLE.forEach((r, i) => wave.u.uDrops.value[i].set(r[0], r[1], r[2], r[3]));
    wave.u.uPrev.value = waveBuf.read.texture;
    renderer.setRenderTarget(waveBuf.write); renderer.render(wave.s, qCam); waveBuf.swap();
  }
  RIPPLE.length = 0; prevUV.copy(ptrUV);

  // Underwater -> RT, through the water surface shader to the screen, then the above-water layers
  renderer.setRenderTarget(sceneRT); renderer.setClearColor(new THREE.Color(S.paper), 1); renderer.clear(); renderer.render(waterScene, camera);
  comp.u.uScene.value = sceneRT.texture; comp.u.uStir.value = stirBuf.read.texture; comp.u.uWave.value = waveBuf.read.texture;
  comp.u.uTime.value = t; comp.u.uGust.value = gust; comp.u.uWind.value.set(wx, -wz);
  renderer.setRenderTarget(null); renderer.clear(); renderer.render(comp.s, qCam);
  renderer.render(overScene, camera);
  updateNight(dt, t);
  if (NIGHT.k > 0) renderNight(t, gust, wind);
});
window.__pond = { camera, fish, drifters, setSeason, layers, slots, insects, foods, tossFood, get busy() { return busy; }, get season() { return season; } };
