// Background music: plays the koto tracks one after another with a 5 s pause between them, looping.
// Browsers only allow audio after the viewer's first interaction: the intro's click calls KOI_MUSIC.start().
// window.KOI_MUSIC.toggle() mutes/unmutes (remembered across visits).

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
// the browser refused to play (no user gesture yet, e.g. the screensaver skips the intro click): try again on the
// viewer's next click or key
for (const t of ['pointerdown', 'keydown']) addEventListener(t, () => { if (!started && audio.src) start(); }, true);
audio.addEventListener('ended', () => setTimeout(() => play(index + 1), GAP));

function start() {
  if (started) return;
  started = true;
  play(index);
}

// mute toggle for the corner panel (and the M key): remembers the choice and tells the UI
function toggle() {
  muted = !muted;
  audio.volume = muted ? 0 : VOLUME;
  try { localStorage.setItem('koi-muted', muted ? '1' : '0'); } catch { /* ignore */ }
  document.dispatchEvent(new CustomEvent('koi:music', { detail: { muted } }));
  start();
}
window.KOI_MUSIC = { start, toggle, get muted() { return muted; } };
