// Background music: plays the koto tracks one after another with a 5 s pause between them, looping.
// Browsers only allow audio after the viewer's first interaction, so playback starts on the first click/key/touch.
// M toggles mute (remembered across visits).

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
}
for (const ev of ['pointerdown', 'keydown', 'touchstart']) addEventListener(ev, start, { passive: true });

addEventListener('keydown', e => {
  if (e.key.toLowerCase() !== 'm' || e.ctrlKey || e.metaKey || e.altKey) return;
  muted = !muted;
  audio.volume = muted ? 0 : VOLUME;
  try { localStorage.setItem('koi-muted', muted ? '1' : '0'); } catch { /* ignore */ }
});
