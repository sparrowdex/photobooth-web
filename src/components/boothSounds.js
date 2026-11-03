// Tiny 8-bit booth sounds made with the Web Audio API (no audio files to load).
let ctx = null;
const ac = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
};

function blip(freq, dur = 0.12, type = "square", vol = 0.08, when = 0) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + when;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** countdown tick: low blips, a higher one on the last second */
export function countBeep(n) {
  if (n <= 1) { blip(988, 0.16); blip(1319, 0.2, "square", 0.07, 0.08); }
  else blip(659, 0.1);
}

/** shutter: a short noise "chk" + a bright blip */
export function shutterSound() {
  const a = ac();
  if (!a) return;
  const len = Math.floor(a.sampleRate * 0.09);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = a.createBufferSource();
  const g = a.createGain();
  g.gain.value = 0.25;
  src.buffer = buf;
  src.connect(g).connect(a.destination);
  src.start();
  blip(1760, 0.08, "square", 0.05, 0.05);
}

/** call from a tap so browsers allow sound later */
export function unlockSound() { ac(); }
