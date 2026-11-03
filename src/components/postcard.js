// Postcard renderer: draws the front (your strip + "greetings from") and the back
// (message, stamp made from your photo, postmark, address lines) onto canvases.
// The same functions drive the live preview and the downloads, so they always match.
import '@fontsource/pacifico/400.css';
import '@fontsource/special-elite/400.css';
import '@fontsource/homemade-apple/400.css';

export const POSTCARD_W = 1500;
export const POSTCARD_H = 1000;

export const POSTCARD_THEMES = {
  blush:  { name: "blush",  bg: "#fbd9e6", bg2: "#f7b9d0", paper: "#fff6f8", accent: "#e0457f", ink: "#3b2236", soft: "#f39ab9" },
  cherry: { name: "cherry", bg: "#9e1741", bg2: "#6f0d2c", paper: "#fff4f2", accent: "#c81e4d", ink: "#3a1320", soft: "#ffc2d1", light: true },
  sky:    { name: "sky",    bg: "#d6e9f7", bg2: "#b3d3ee", paper: "#f6fbff", accent: "#3a78c2", ink: "#1f2f4a", soft: "#8fb9e4" },
  cream:  { name: "cream",  bg: "#f5ead6", bg2: "#ead7b3", paper: "#fffaf1", accent: "#c25a35", ink: "#3b2c22", soft: "#e3a37f" },
};

const FONT = {
  script: "'Pacifico', cursive",
  type: "'Special Elite', 'Courier New', monospace",
  hand: "'Homemade Apple', 'Brush Script MT', cursive",
};

export function ensurePostcardFonts() {
  if (!document.fonts?.load) return Promise.resolve();
  return Promise.all([
    document.fonts.load(`40px ${FONT.script}`),
    document.fonts.load(`20px ${FONT.type}`),
    document.fonts.load(`20px ${FONT.hand}`),
  ]).catch(() => {});
}

export const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:") && !src.startsWith("blob:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// deterministic pseudo-random so the preview doesn't jitter on every keystroke
const rand = (seed) => { let x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };

function paperGrain(ctx, w, h, alpha = 0.05) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = rand(i) > 0.5 ? "#000" : "#fff";
    ctx.fillRect(rand(i + 1) * w, rand(i + 2) * h, 1.6, 1.6);
  }
  ctx.restore();
}

function sparkle(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i;
    ctx.quadraticCurveTo(Math.cos(a + Math.PI / 4) * r * 0.18, Math.sin(a + Math.PI / 4) * r * 0.18, Math.cos(a + Math.PI / 2) * r, Math.sin(a + Math.PI / 2) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function heart(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 30, s / 30);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 9);
  ctx.bezierCurveTo(-16, -2, -12, -18, 0, -8);
  ctx.bezierCurveTo(12, -18, 16, -2, 0, 9);
  ctx.fill();
  ctx.restore();
}

function tape(ctx, x, y, w, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.78;
  ctx.beginPath();
  const h = w * 0.32;
  // torn ends
  ctx.moveTo(-w / 2, -h / 2);
  for (let i = 0; i <= 6; i++) ctx.lineTo(-w / 2 + (i % 2 ? 5 : 0), -h / 2 + (h / 6) * i);
  ctx.lineTo(w / 2, h / 2);
  for (let i = 6; i >= 0; i--) ctx.lineTo(w / 2 - (i % 2 ? 5 : 0), -h / 2 + (h / 6) * i);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#fff";
  ctx.fillRect(-w / 2, -h / 2, w, h * 0.35);
  ctx.restore();
}

function wrapLines(ctx, text, maxW) {
  const out = [];
  for (const para of String(text || "").split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      if (!word) continue;
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; }
      else line = test;
    }
    out.push(line);
  }
  return out;
}

/* ── FRONT ─────────────────────────────────────────────────────────── */
export function drawFront(ctx, { stripImg, theme, place, date, headline = "with love from" }) {
  const W = POSTCARD_W, H = POSTCARD_H, t = theme;
  ctx.clearRect(0, 0, W, H);

  // background: soft gradient + rays + grain
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, t.bg); g.addColorStop(1, t.bg2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = t.light ? 0.06 : 0.18;
  ctx.fillStyle = "#fff";
  ctx.translate(W * 0.72, H * 0.5);
  for (let i = 0; i < 18; i++) {
    ctx.rotate((Math.PI * 2) / 18);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1400, -70); ctx.lineTo(1400, 70); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  paperGrain(ctx, W, H, 0.05);

  // the strip, taped on, slightly tilted
  if (stripImg) {
    const maxW = W * 0.5, maxH = H * 0.8;
    const s = Math.min(maxW / stripImg.width, maxH / stripImg.height);
    const sw = stripImg.width * s, sh = stripImg.height * s;
    const cx = W * 0.06 + maxW / 2, cy = H / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.045);
    ctx.shadowColor = "rgba(60,10,30,0.35)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
    ctx.fillStyle = "#fff";
    ctx.fillRect(-sw / 2 - 14, -sh / 2 - 14, sw + 28, sh + 28); // white photo border
    ctx.shadowColor = "transparent";
    ctx.drawImage(stripImg, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
    tape(ctx, cx - sw * 0.32, cy - sh / 2 - 6, Math.max(110, sw * 0.32), -0.35, t.soft);
    tape(ctx, cx + sw * 0.34, cy + sh / 2 + 4, Math.max(110, sw * 0.32), -0.4, t.soft);
  }

  // greeting
  const textX = W * 0.6 + (W * 0.4) / 2 - 10;
  const ink = t.light ? "#fff4f6" : t.ink;
  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  const line = (headline || "").trim();
  const shift = line ? 0 : -H * 0.06; // no little line → centre the big word
  if (line) {
    let hs = 64;
    ctx.font = `${hs}px ${FONT.script}`;
    while (ctx.measureText(line).width > W * 0.38 && hs > 30) { hs -= 4; ctx.font = `${hs}px ${FONT.script}`; }
    ctx.save(); ctx.translate(textX, H * 0.36); ctx.rotate(-0.06); ctx.fillText(line, 0, 0); ctx.restore();
  }

  // big place word with retro offset shadow, auto-fit
  const word = (place || "us").trim() || "us";
  let size = 190;
  ctx.font = `${size}px ${FONT.script}`;
  while (ctx.measureText(word).width > W * 0.4 && size > 60) { size -= 6; ctx.font = `${size}px ${FONT.script}`; }
  ctx.save();
  ctx.translate(textX, H * 0.6 + shift);
  ctx.rotate(-0.06);
  ctx.lineJoin = "round";
  ctx.fillStyle = t.light ? "#5a0a20" : t.accent; ctx.globalAlpha = 0.35;
  ctx.fillText(word, 10, 12);
  ctx.globalAlpha = 1;
  ctx.lineWidth = 14; ctx.strokeStyle = t.light ? t.bg2 : "#fff"; ctx.strokeText(word, 0, 0);
  ctx.fillStyle = t.light ? "#ffd6e0" : t.accent; ctx.fillText(word, 0, 0);
  ctx.restore();

  ctx.font = `30px ${FONT.type}`;
  ctx.fillStyle = ink; ctx.globalAlpha = 0.7;
  ctx.save(); ctx.translate(textX, H * 0.73 + shift); ctx.rotate(-0.06); ctx.fillText(`✦  ${date}  ✦`, 0, 0); ctx.restore();
  ctx.globalAlpha = 1;

  // scattered sparkles + hearts
  const deco = t.light ? "#ffd6e0" : "#ffffff";
  [[0.62, 0.16, 26], [0.93, 0.2, 18], [0.88, 0.84, 30], [0.57, 0.86, 16], [0.97, 0.55, 14]].forEach(([x, y, r], i) =>
    sparkle(ctx, W * x, H * y, r, i % 2 ? deco : t.light ? t.soft : t.accent));
  heart(ctx, W * 0.66, H * 0.8, 34, t.light ? t.soft : t.accent);
  heart(ctx, W * 0.92, H * 0.37, 24, deco);

  // white border like a printed card
  ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 22; ctx.strokeRect(11, 11, W - 22, H - 22);
  ctx.textAlign = "left";
}

/* ── BACK ──────────────────────────────────────────────────────────── */
function stamp(ctx, x, y, w, h, photoImg, t) {
  // perforated edge
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  const r = 9, step = 26;
  for (let px = x; px <= x + w; px += step) { ctx.beginPath(); ctx.arc(px, y, r, 0, 7); ctx.arc(px, y + h, r, 0, 7); ctx.fill(); }
  for (let py = y; py <= y + h; py += step) { ctx.beginPath(); ctx.arc(x, py, r, 0, 7); ctx.arc(x + w, py, r, 0, 7); ctx.fill(); }
  ctx.restore();
  // photo inside
  const ix = x + 20, iy = y + 20, iw = w - 40, ih = h - 80;
  ctx.fillStyle = t.bg; ctx.fillRect(ix, iy, iw, ih);
  if (photoImg) {
    const s = Math.max(iw / photoImg.width, ih / photoImg.height);
    const sw = iw / s, sh = ih / s;
    ctx.drawImage(photoImg, (photoImg.width - sw) / 2, (photoImg.height - sh) / 2, sw, sh, ix, iy, iw, ih);
  }
  ctx.fillStyle = t.accent;
  ctx.font = `26px ${FONT.type}`; ctx.textAlign = "center";
  ctx.fillText("1 kiss", x + w / 2 + 14, y + h - 28);
  heart(ctx, x + w / 2 - 50, y + h - 37, 22, t.accent);
  ctx.textAlign = "left";
}

function postmark(ctx, cx, cy, date, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.globalAlpha = 0.72; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, 108, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, 80, 0, Math.PI * 2); ctx.stroke();
  // text around the ring
  const label = "✦ SENT WITH LOVE ✦ PHOTOBOOTH ";
  ctx.font = `19px ${FONT.type}`;
  const step = (Math.PI * 2) / label.length;
  for (let i = 0; i < label.length; i++) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.PI / 2 + i * step); ctx.translate(0, -88);
    ctx.textAlign = "center"; ctx.fillText(label[i], 0, 0); ctx.restore();
  }
  ctx.textAlign = "center"; ctx.font = `22px ${FONT.type}`;
  ctx.fillText(date, cx, cy + 8);
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 56, cy - 22); ctx.lineTo(cx + 56, cy - 22); ctx.moveTo(cx - 56, cy + 26); ctx.lineTo(cx + 56, cy + 26); ctx.stroke();
  // wavy cancellation lines
  ctx.lineWidth = 4;
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    for (let px = 0; px <= 200; px += 6) {
      const yy = cy - 36 + k * 24 + Math.sin(px / 18) * 7;
      px === 0 ? ctx.moveTo(cx - 285 + px, yy) : ctx.lineTo(cx - 285 + px, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
  ctx.textAlign = "left";
}

export function drawBack(ctx, { photoImg, theme, message, to, from, date }) {
  const W = POSTCARD_W, H = POSTCARD_H, t = theme;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = t.paper; ctx.fillRect(0, 0, W, H);
  paperGrain(ctx, W, H, 0.045);

  // airmail border
  const band = 18;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(band, band, W - band * 2, H - band * 2); ctx.clip("evenodd");
  for (let i = -H; i < W + H; i += 60) {
    ctx.fillStyle = (i / 60) % 2 === 0 ? t.accent : t.soft;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 30, 0); ctx.lineTo(i + 30 - H, H); ctx.lineTo(i - H, H); ctx.fill();
  }
  ctx.restore();

  // header
  ctx.fillStyle = t.ink; ctx.textAlign = "center";
  ctx.font = `46px ${FONT.type}`;
  ctx.save(); ctx.globalAlpha = 0.85;
  ctx.fillText("P O S T   C A R D", W * 0.5, 120);
  ctx.restore();
  ctx.font = `20px ${FONT.type}`; ctx.globalAlpha = 0.5;
  ctx.fillText("correspondence  ·  address", W * 0.5, 152);
  ctx.globalAlpha = 1; ctx.textAlign = "left";

  // divider
  ctx.strokeStyle = t.ink; ctx.globalAlpha = 0.35; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(W * 0.53, 210); ctx.lineTo(W * 0.53, H - 90); ctx.stroke();
  ctx.globalAlpha = 1;

  // message (handwritten, on faint lines)
  const mx = 90, mw = W * 0.53 - mx - 50, lineH = 68, top = 290;
  ctx.strokeStyle = t.soft; ctx.globalAlpha = 0.45; ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(mx, top + i * lineH + 14); ctx.lineTo(mx + mw, top + i * lineH + 14); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#24356b";
  let fs = 34;
  ctx.font = `${fs}px ${FONT.hand}`;
  let lines = wrapLines(ctx, message || "", mw);
  while (lines.length > 8 && fs > 20) { fs -= 2; ctx.font = `${fs}px ${FONT.hand}`; lines = wrapLines(ctx, message || "", mw); }
  lines.slice(0, 9).forEach((ln, i) => ctx.fillText(ln, mx, top + i * lineH));
  if (from) {
    ctx.font = `34px ${FONT.hand}`; ctx.textAlign = "right";
    ctx.fillText(`— ${from}`, mx + mw, top + 9 * lineH + 10);
    ctx.textAlign = "left";
  }

  // stamp + postmark
  stamp(ctx, W - 320, 200, 220, 270, photoImg, t);
  postmark(ctx, W - 400, 455, date, t.accent);

  // address lines
  const ax = W * 0.53 + 60, aw = W - 110 - ax;
  ctx.fillStyle = t.ink; ctx.font = `30px ${FONT.type}`; ctx.globalAlpha = 0.75;
  ctx.fillText("to:", ax, 640);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = t.ink; ctx.lineWidth = 2; ctx.globalAlpha = 0.45;
  [650, 740, 830].forEach((y) => { ctx.beginPath(); ctx.moveTo(ax + 60, y); ctx.lineTo(ax + aw, y); ctx.stroke(); });
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#24356b";
  const toLines = String(to || "").split("\n").slice(0, 3);
  toLines.forEach((ln, i) => {
    let s = 40; ctx.font = `${s}px ${FONT.hand}`;
    while (ctx.measureText(ln).width > aw - 80 && s > 18) { s -= 2; ctx.font = `${s}px ${FONT.hand}`; }
    ctx.fillText(ln, ax + 72, 636 + i * 90);
  });
}
