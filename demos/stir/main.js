import * as THREE from 'three';
import GUI from 'lil-gui';
import quadVert from './shaders/quad.vert?raw';
import stirFrag from './shaders/stir.frag?raw';
import waveFrag from './shaders/wave.frag?raw';
import compositeFrag from './shaders/composite.frag?raw';

// Stir: thông số gốc của kinoria.studio là radius .115, strength 2.5, fade 2.5, max .12, lift .85.
// Ở đây hạ xuống để sóng (wave) dẫn dắt, stir chỉ còn là lực kéo nhẹ của nước.
const params = {
  // stir
  radius: 0.1,
  strength: 1.2,
  fade: 1.5,
  max: 0.04,
  lift: 0.15,
  driftX: 0,
  driftY: 0,
  res: 192,
  // wave
  waveRes: 384,
  substeps: 2,
  damping: 0.985,
  dropRadius: 0.018,
  dropForce: 6,
  clickForce: 1.2,
  // shading
  normalK: 14,
  refract: 0.025,
  chroma: 0.35,
  spec: 0.4,
  shade: 0.5,
  caustic: 2.5,
  debug: 'none',
};

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quad = new THREE.PlaneGeometry(2, 2);

function fullscreenPass(fragmentShader, uniforms) {
  const material = new THREE.ShaderMaterial({
    vertexShader: quadVert,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(quad, material);
  mesh.frustumCulled = false; // vertex shader bỏ qua camera, bounds của mesh không có nghĩa
  const scene = new THREE.Scene();
  scene.add(mesh);
  return { scene, material, uniforms };
}

function makeTarget() {
  return new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

// Ping-pong: đọc một target, ghi target kia, rồi đổi vai.
function pingPong() {
  const targets = [makeTarget(), makeTarget()];
  let read = 0;
  return {
    get read() { return targets[read]; },
    get write() { return targets[1 - read]; },
    swap() { read = 1 - read; },
    setSize(w, h) {
      for (const t of targets) {
        t.setSize(w, h);
        renderer.setRenderTarget(t);
        renderer.clear();
      }
      renderer.setRenderTarget(null);
    },
  };
}
const stirBuf = pingPong();
const waveBuf = pingPong();

const stir = fullscreenPass(stirFrag, {
  uPrev: { value: null },
  uPtr: { value: new THREE.Vector2(0.5, 0.5) },
  uPtrVel: { value: new THREE.Vector2() },
  uDrift: { value: new THREE.Vector2() },
  uDt: { value: 1 / 60 },
  uFade: { value: params.fade },
  uRadius: { value: params.radius },
  uStrength: { value: params.strength },
  uMax: { value: params.max },
  uAspect: { value: 1 },
});

const wave = fullscreenPass(waveFrag, {
  uPrev: { value: null },
  uTexel: { value: new THREE.Vector2() },
  uA: { value: new THREE.Vector2() },
  uB: { value: new THREE.Vector2() },
  uAmount: { value: 0 },
  uRadius: { value: params.dropRadius },
  uDamping: { value: params.damping },
  uAspect: { value: 1 },
});

const composite = fullscreenPass(compositeFrag, {
  uImage: { value: null },
  uStir: { value: null },
  uWave: { value: null },
  uWaveTexel: { value: new THREE.Vector2() },
  uCover: { value: new THREE.Vector2(1, 1) },
  uMax: { value: params.max },
  uLift: { value: params.lift },
  uChroma: { value: params.chroma },
  uNormalK: { value: params.normalK },
  uRefract: { value: params.refract },
  uSpec: { value: params.spec },
  uShade: { value: params.shade },
  uCaustic: { value: params.caustic },
  uDebug: { value: 0 },
});

let imageAspect = 16 / 9;
new THREE.TextureLoader().load('./hades.jpg', (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  imageAspect = tex.image.width / tex.image.height;
  composite.uniforms.uImage.value = tex;
  updateCover();
});

// Scale uv để ảnh phủ kín màn hình, giữ tỉ lệ (giống CSS background-size: cover).
function updateCover() {
  const screenAspect = window.innerWidth / window.innerHeight;
  composite.uniforms.uCover.value.set(
    screenAspect < imageAspect ? screenAspect / imageAspect : 1,
    screenAspect < imageAspect ? 1 : imageAspect / screenAspect,
  );
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;
  renderer.setSize(w, h);
  stir.uniforms.uAspect.value = aspect;
  wave.uniforms.uAspect.value = aspect;

  stirBuf.setSize(params.res, Math.max(64, Math.round(params.res / aspect)));

  // Texel của sóng phải vuông, nếu không sóng lan nhanh hơn theo một trục.
  const ww = params.waveRes;
  const wh = Math.max(64, Math.round(params.waveRes / aspect));
  waveBuf.setSize(ww, wh);
  wave.uniforms.uTexel.value.set(1 / ww, 1 / wh);
  composite.uniforms.uWaveTexel.value.set(1 / ww, 1 / wh);

  updateCover();
}
window.addEventListener('resize', resize);
resize();

// --- Pointer: chỉ vận tốc mới tạo gợn ---
const ptr = new THREE.Vector2(0.5, 0.5);
const prevPtr = new THREE.Vector2(0.5, 0.5);
let hasPointer = false;
let click = 0;

function onPointer(e) {
  ptr.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
  // Lần đầu vào canvas: không tính cú nhảy từ vị trí cũ thành vận tốc.
  if (!hasPointer) prevPtr.copy(ptr);
  hasPointer = true;
}
window.addEventListener('pointermove', onPointer, { passive: true });
window.addEventListener('pointerdown', (e) => {
  onPointer(e);
  click = 1;
}, { passive: true });
document.documentElement.addEventListener('pointerleave', () => { hasPointer = false; });
window.addEventListener('blur', () => { hasPointer = false; });

// --- Loop ---
const timer = new THREE.Timer();
timer.connect(document); // tab ẩn rồi quay lại: không nhận delta khổng lồ
const segA = new THREE.Vector2();
const segB = new THREE.Vector2();

function stepStir(dt, vel) {
  const u = stir.uniforms;
  u.uPtr.value.copy(ptr);
  u.uPtrVel.value.copy(vel);
  u.uDt.value = dt;
  u.uFade.value = params.fade;
  u.uRadius.value = params.radius;
  u.uStrength.value = params.strength;
  u.uMax.value = params.max;
  u.uDrift.value.set(params.driftX, params.driftY);
  u.uPrev.value = stirBuf.read.texture;
  renderer.setRenderTarget(stirBuf.write);
  renderer.render(stir.scene, camera);
  stirBuf.swap();
}

function stepWave(speed) {
  const u = wave.uniforms;
  const n = params.substeps;
  u.uRadius.value = params.dropRadius;
  u.uDamping.value = params.damping;
  // Lực nhấn theo tốc độ chuột, chia đều cho các substep; có trần để không nổ.
  const amount = Math.min(speed * params.dropForce, 0.25) + click * params.clickForce;
  for (let i = 0; i < n; i++) {
    segA.lerpVectors(prevPtr, ptr, i / n);
    segB.lerpVectors(prevPtr, ptr, (i + 1) / n);
    u.uA.value.copy(segA);
    u.uB.value.copy(segB);
    u.uAmount.value = hasPointer || click ? amount / n : 0;
    u.uPrev.value = waveBuf.read.texture;
    renderer.setRenderTarget(waveBuf.write);
    renderer.render(wave.scene, camera);
    waveBuf.swap();
  }
  click = 0;
}

const vel = new THREE.Vector2();

function frame(timestamp) {
  timer.update(timestamp);
  const dt = Math.min(timer.getDelta(), 1 / 30);

  if (hasPointer) vel.subVectors(ptr, prevPtr);
  else vel.set(0, 0);
  const speed = Math.hypot(vel.x * stir.uniforms.uAspect.value, vel.y);

  stepStir(dt, vel);
  stepWave(speed);
  prevPtr.copy(ptr);

  const c = composite.uniforms;
  c.uStir.value = stirBuf.read.texture;
  c.uWave.value = waveBuf.read.texture;
  c.uMax.value = params.max;
  c.uLift.value = params.lift;
  c.uChroma.value = params.chroma;
  c.uNormalK.value = params.normalK;
  c.uRefract.value = params.refract;
  c.uSpec.value = params.spec;
  c.uShade.value = params.shade;
  c.uCaustic.value = params.caustic;
  c.uDebug.value = { none: 0, stir: 1, wave: 2 }[params.debug];

  renderer.setRenderTarget(null);
  renderer.render(composite.scene, camera);
}
renderer.setAnimationLoop(frame);

// --- GUI ---
const gui = new GUI({ title: 'Water' });
const gWave = gui.addFolder('Sóng');
gWave.add(params, 'dropForce', 0, 20, 0.1).name('lực chuột');
gWave.add(params, 'clickForce', 0, 4, 0.05).name('lực click');
gWave.add(params, 'dropRadius', 0.004, 0.06, 0.001).name('bán kính');
gWave.add(params, 'damping', 0.95, 0.999, 0.001).name('giữ sóng');
gWave.add(params, 'substeps', 1, 6, 1).name('tốc độ lan');
gWave.add(params, 'waveRes', [256, 384, 512, 768]).name('độ phân giải').onChange(resize);
const gLook = gui.addFolder('Ánh sáng');
gLook.add(params, 'normalK', 0, 60, 0.5).name('độ dốc');
gLook.add(params, 'refract', 0, 0.1, 0.001).name('khúc xạ');
gLook.add(params, 'chroma', 0, 1, 0.01).name('tán sắc');
gLook.add(params, 'spec', 0, 2, 0.05).name('highlight');
gLook.add(params, 'shade', 0, 1, 0.01).name('sáng/tối sườn');
gLook.add(params, 'caustic', 0, 8, 0.1);
const gStir = gui.addFolder('Stir (kéo)');
gStir.add(params, 'radius', 0.02, 0.4, 0.005);
gStir.add(params, 'strength', 0, 8, 0.1);
gStir.add(params, 'fade', 0.2, 8, 0.1).name('fade (s)');
gStir.add(params, 'max', 0, 0.3, 0.005);
gStir.add(params, 'lift', 0, 1.5, 0.05);
gStir.add(params, 'driftX', -0.2, 0.2, 0.005);
gStir.add(params, 'driftY', -0.2, 0.2, 0.005);
gStir.add(params, 'res', [96, 128, 192, 256, 384]).onChange(resize);
gStir.close();
gui.add(params, 'debug', ['none', 'stir', 'wave']).name('xem buffer');
