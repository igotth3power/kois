// A saying written onto the corner of the painting, in Vietnamese, a line per sentence, its source (if any) beneath.
// A random one seeps in like ink on wet paper once the intro is over and again with every change of season; while a
// season is pinned from the corner control, the next one comes every 30 s. The old one dissolves first; none repeats until most have been shown.
// At night the ink turns pale, like the moonlit water. src/quotes.json: [{ vi, src?, ref? }], lines in vi split by \n.
import QUOTES from './quotes.json';

const PINNED = 30, FADE = 2.4;   // seconds a saying stays while the season is pinned, seconds to seep in / dissolve

const root = document.createElement('div');
root.id = 'quote';
root.innerHTML = '<div class="vi"></div><div class="src"></div>';
const css = document.createElement('style');
css.textContent = `
  #quote { position: fixed; left: clamp(16px, 3.2vw, 56px); top: clamp(16px, 4.5vh, 48px); z-index: 1; pointer-events: none;
    display: flex; flex-direction: column; align-items: flex-start; gap: 10px; max-width: min(30ch, 40vw); color: #1b1a18;
    opacity: 0; filter: blur(7px); transition: opacity ${FADE}s ease, filter ${FADE}s ease, color 3s; }
  #quote.on { opacity: 1; filter: blur(0); }
  #quote.night { color: #e9e4d6; }
  #quote .vi { font: 500 clamp(21px, 1.95vw, 28px)/1.4 'Dancing Script', 'Noto Serif', cursive; opacity: .88; white-space: pre-line; }   /* a calligraphic hand with full Vietnamese */
  #quote .src:empty { display: none; }
  #quote .src { font: 400 clamp(10px, .85vw, 12px)/1.4 'Noto Serif', Georgia, serif; letter-spacing: .04em; opacity: .5; }
  body.intro #quote { display: none; }`;
document.head.append(css);
document.body.append(root);

const recent = [];
function pick() {
  let i;
  do i = Math.floor(Math.random() * QUOTES.length); while (recent.includes(i));
  recent.push(i); if (recent.length > QUOTES.length * .8) recent.shift();
  return QUOTES[i];
}
function show() {
  const q = pick();
  root.querySelector('.vi').textContent = q.vi;
  root.querySelector('.src').textContent = q.src ? '— ' + q.src + (q.ref ? ' · ' + q.ref : '') : '';
  root.classList.add('on');
}
// dissolve the current saying (if any), then bring in the next; restarts the 30 s clock while the season is pinned
let started = false, season = null, pinned = false, swapT = 0, nextT = 0;
function next() {
  if (!started) return;
  clearTimeout(swapT); clearTimeout(nextT);
  const wait = root.classList.contains('on') ? FADE * 1000 + 400 : 0;
  root.classList.remove('on');
  swapT = setTimeout(() => { show(); if (pinned) nextT = setTimeout(next, PINNED * 1000); }, wait);
}

document.addEventListener('koi:state', e => {
  const st = e.detail;
  root.classList.toggle('night', !!st.night);
  const pin = !!st.pinSeason, changed = st.season !== season, repin = pin !== pinned;
  season = st.season; pinned = pin;
  if (changed) next();
  else if (repin && started) { clearTimeout(nextT); if (pin) nextT = setTimeout(next, PINNED * 1000); }   // pinned or let go: the saying stays, only the clock changes
});
const start = () => { if (!started) { started = true; setTimeout(next, 1500); } };
document.addEventListener('koi:stage-done', start);
if (!document.body.classList.contains('intro')) start();   // no intro (e.g. the screensaver skips it)
