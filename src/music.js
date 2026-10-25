// Background music: plays the koto tracks one after another with a 5 s pause between them, looping.
// Browsers only allow audio after the viewer's first interaction: the intro's click calls KOI_MUSIC.start().
// window.KOI_MUSIC.toggle() mutes/unmutes (remembered across visits).
// KOI_MUSIC.rain(level) sets the sound of rain (0..1), made from filtered noise; it is muted along with the music.

const TRACKS = ['/audio/koto-1.mp3', '/audio/koto-2.mp3'];
const GAP = 5000, VOLUME = .45;

const audio = new Audio();
audio.preload = 'auto';
let index = 0, started = false, muted = false;
try { muted = localStorage.getItem('koi-muted') === '1'; } catch { /* storage unavailable */ }
audio.volume = muted ? 0 : VOLUME;

function play(i) {
  index = i % TRACKS.length;
  audio.src = TRACKS[index];
  audio.play().catch(() => { started = false; });   // blocked: retry on the next interaction
}
audio.addEventListener('ended', () => setTimeout(() => play(index + 1), GAP));

function start() {
  if (started) return;
  started = true;
  play(index);
  initRain();
}

// rain: a few seconds of white noise looped through a band of low-pass and high-pass filters -- a soft hiss on the water
let actx = null, rainGain = null, rainLevel = 0;
const RAIN_VOLUME = .5;
function initRain() {
  if (actx) { actx.resume?.(); return; }
  try { actx = new AudioContext(); } catch { return; }
  const len = actx.sampleRate * 3, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
  const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 350;
  rainGain = actx.createGain(); rainGain.gain.value = 0;
  src.connect(lp).connect(hp).connect(rainGain).connect(actx.destination); src.start();
  rain(rainLevel);
}
function rain(level) {
  rainLevel = level;
  if (rainGain) rainGain.gain.setTargetAtTime(muted ? 0 : level * RAIN_VOLUME, actx.currentTime, .4);
}

// mute toggle for the corner panel (and the M key): remembers the choice and tells the UI
function toggle() {
  muted = !muted;
  audio.volume = muted ? 0 : VOLUME;
  try { localStorage.setItem('koi-muted', muted ? '1' : '0'); } catch { /* ignore */ }
  document.dispatchEvent(new CustomEvent('koi:music', { detail: { muted } }));
  start();
  rain(rainLevel);
}
window.KOI_MUSIC = { start, toggle, rain, get muted() { return muted; } };
