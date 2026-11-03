// Frame studio engine.
// Everything the studio makes is "baked" into a normal frame: a PNG with see-through photo
// windows + a list of window rectangles — exactly what frameMappings entries look like —
// so saving, GIFs, the develop effect and postcards all work with custom frames unchanged.

const FONTS = {
  script: "'Pacifico', cursive",
  type: "'Special Elite', 'Courier New', monospace",
  hand: "'Homemade Apple', 'Brush Script MT', cursive",
  bold: "'Poppins', Arial, sans-serif",
};
export const TEXT_FONTS = [
  { id: "script", label: "Aa", css: FONTS.script },
  { id: "type", label: "Aa", css: FONTS.type },
  { id: "hand", label: "Aa", css: FONTS.hand },
  { id: "bold", label: "Aa", css: FONTS.bold, weight: 700 },
];
export const fontCss = (id) => (TEXT_FONTS.find((f) => f.id === id) || TEXT_FONTS[0]).css;

export const PALETTES = {
  blush:  { name: "blush",  paper: "#fde4ee", ink: "#7a2149", accent: "#f06ba0", accent2: "#ffffff" },
  cherry: { name: "cherry", paper: "#b3163f", ink: "#fff0f3", accent: "#ff8fb0", accent2: "#5e0a22" },
  sky:    { name: "sky",    paper: "#dcecfa", ink: "#22406b", accent: "#6fa6e0", accent2: "#ffffff" },
  mint:   { name: "mint",   paper: "#dff5ea", ink: "#1f5a43", accent: "#6fcfa4", accent2: "#ffffff" },
  butter: { name: "butter", paper: "#fff3c9", ink: "#6b4b12", accent: "#f2bf3a", accent2: "#ffffff" },
  noir:   { name: "noir",   paper: "#1b1719", ink: "#f8eef2", accent: "#f06ba0", accent2: "#3a3236" },
};

export const STYLES = [
  { id: "classic", name: "classic" },
  { id: "gingham", name: "gingham" },
  { id: "cloud", name: "cloud" },
  { id: "hearts", name: "hearts" },
  { id: "film", name: "film" },
];

/* ── layout of the photo windows for each shot count (frame units) ─── */
export function templateLayout(shots) {
  const m = 34, gap = 20, caption = 150;
  if (shots === 6) {
    const W = 520, w = (W - m * 2 - gap) / 2, h = 250;
    const windows = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) windows.push({ x: m + c * (w + gap), y: m + r * (h + gap), w, h });
    return { W, H: m + 3 * h + 2 * gap + caption, windows, caption: { y: m + 3 * h + 2 * gap, h: caption } };
  }
  if (shots === 1) {
    const W = 500, w = W - m * 2, h = 400;
    return { W, H: m + h + caption + 10, windows: [{ x: m, y: m, w, h }], caption: { y: m + h, h: caption + 10 } };
  }
  const W = 450, w = W - m * 2, h = Math.round(w * 0.75);
  const windows = Array.from({ length: shots }, (_, i) => ({ x: m, y: m + i * (h + gap), w, h }));
  const top = m + shots * h + (shots - 1) * gap;
  return { W, H: top + caption, windows, caption: { y: top, h: caption } };
}

/* ── small drawing helpers ─────────────────────────────────────────── */
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function cloudPath(ctx, x, y, w, h) {
  // a rounded rectangle with scalloped (cloud) edges
  const r = 16;
  ctx.beginPath();
  roundRect(ctx, x + r * 0.6, y + r * 0.6, w - r * 1.2, h - r * 1.2, 20);
  const nx = Math.max(3, Math.round(w / (r * 1.9))), ny = Math.max(3, Math.round(h / (r * 1.9)));
  for (let i = 0; i <= nx; i++) {
    const cx = x + r + ((w - 2 * r) * i) / nx;
    ctx.moveTo(cx + r, y + r); ctx.arc(cx, y + r, r, 0, Math.PI * 2);
    ctx.moveTo(cx + r, y + h - r); ctx.arc(cx, y + h - r, r, 0, Math.PI * 2);
  }
  for (let i = 0; i <= ny; i++) {
    const cy = y + r + ((h - 2 * r) * i) / ny;
    ctx.moveTo(x + r + r, cy); ctx.arc(x + r, cy, r, 0, Math.PI * 2);
    ctx.moveTo(x + w - r + r, cy); ctx.arc(x + w - r, cy, r, 0, Math.PI * 2);
  }
}

function heartPath(ctx, x, y, s) {
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x - s * 0.55, y - s * 0.1, x - s * 0.35, y - s * 0.6, x, y - s * 0.25);
  ctx.bezierCurveTo(x + s * 0.35, y - s * 0.6, x + s * 0.55, y - s * 0.1, x, y + s * 0.3);
}

function grain(ctx, W, H, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < (W * H) / 260; i++) {
    ctx.fillStyle = rnd() > 0.5 ? "#000" : "#fff";
    ctx.fillRect(rnd() * W, rnd() * H, 1.4, 1.4);
  }
  ctx.restore();
}

/* ── templates ─────────────────────────────────────────────────────── */
export function generateTemplate({ shots, style, palette }) {
  const p = PALETTES[palette] || PALETTES.blush;
  const { W, H, windows, caption } = templateLayout(shots);
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  // background
  ctx.fillStyle = style === "film" ? (palette === "noir" ? "#141114" : p.accent2 === "#ffffff" ? "#1d181b" : p.accent2) : p.paper;
  ctx.fillRect(0, 0, W, H);
  if (style === "gingham") {
    ctx.save(); ctx.globalAlpha = 0.33; ctx.fillStyle = p.accent;
    for (let x = 0; x < W; x += 36) ctx.fillRect(x, 0, 18, H);
    for (let y = 0; y < H; y += 36) ctx.fillRect(0, y, W, 18);
    ctx.restore();
  } else if (style === "cloud") {
    ctx.fillStyle = p.accent; ctx.globalAlpha = 0.35;
    for (let y = 14, row = 0; y < H; y += 30, row++) for (let x = row % 2 ? 26 : 11; x < W; x += 30) { ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  } else if (style === "hearts") {
    ctx.fillStyle = p.accent; ctx.globalAlpha = 0.4;
    for (let y = 22, row = 0; y < H; y += 46, row++) for (let x = row % 2 ? 46 : 23; x < W; x += 46) { ctx.beginPath(); heartPath(ctx, x, y, 14); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  if (style !== "film") grain(ctx, W, H, 0.05);

  // punch the photo windows (and film sprockets) out
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  windows.forEach((w) => {
    if (style === "cloud") { cloudPath(ctx, w.x, w.y, w.w, w.h); ctx.fill(); }
    else { roundRect(ctx, w.x, w.y, w.w, w.h, style === "film" ? 4 : style === "hearts" ? 26 : style === "gingham" ? 20 : 14); ctx.fill(); }
  });
  if (style === "film") {
    for (const sx of [9, W - 21]) for (let y = 16; y < H - 20; y += 34) { roundRect(ctx, sx, y, 12, 18, 3); ctx.fill(); }
  }
  ctx.restore();

  // window rings
  windows.forEach((w) => {
    if (style === "gingham") { ctx.strokeStyle = "#fff"; ctx.lineWidth = 12; roundRect(ctx, w.x, w.y, w.w, w.h, 20); ctx.stroke(); }
    if (style === "hearts") { ctx.strokeStyle = p.accent; ctx.lineWidth = 6; roundRect(ctx, w.x, w.y, w.w, w.h, 26); ctx.stroke(); }
    if (style === "classic") { ctx.strokeStyle = p.ink; ctx.globalAlpha = 0.18; ctx.lineWidth = 2; roundRect(ctx, w.x - 7, w.y - 7, w.w + 14, w.h + 14, 18); ctx.stroke(); ctx.globalAlpha = 1; }
  });
  if (style === "classic") { ctx.strokeStyle = p.accent; ctx.lineWidth = 3; roundRect(ctx, 12, 12, W - 24, H - 24, 18); ctx.stroke(); }

  return {
    canvas: c, W, H, caption,
    textColor: style === "film" ? "#f8eef2" : p.ink,
    windows: windows.map((w) => ({ x: w.x, y: w.y, w: w.w, h: w.h })),
  };
}

/* ── uploads: find the see-through holes ───────────────────────────── */
// Flood-fills transparent pixels on a downscaled copy; keeps regions that are big enough and
// don't touch the image edge (so the transparent area *around* a cut-out frame isn't a "hole").
export function detectHoles(img, maxSide = 360) {
  const s = Math.min(1, maxSide / Math.max(img.width, img.height));
  const cw = Math.max(1, Math.round(img.width * s)), ch = Math.max(1, Math.round(img.height * s));
  const c = document.createElement("canvas");
  c.width = cw; c.height = ch;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, cw, ch);
  const a = ctx.getImageData(0, 0, cw, ch).data;
  const seen = new Uint8Array(cw * ch);
  const regions = [];
  const stack = [];
  for (let i = 0; i < cw * ch; i++) {
    if (seen[i] || a[i * 4 + 3] > 40) continue;
    let minX = cw, minY = ch, maxX = 0, maxY = 0, count = 0, edge = false;
    stack.push(i); seen[i] = 1;
    while (stack.length) {
      const j = stack.pop();
      const x = j % cw, y = (j / cw) | 0;
      count++;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (x === 0 || y === 0 || x === cw - 1 || y === ch - 1) edge = true;
      const nb = [j - 1, j + 1, j - cw, j + cw];
      for (let k = 0; k < 4; k++) {
        const n = nb[k];
        if (n < 0 || n >= cw * ch || seen[n]) continue;
        if ((k === 0 && x === 0) || (k === 1 && x === cw - 1)) continue;
        if (a[n * 4 + 3] <= 40) { seen[n] = 1; stack.push(n); }
      }
    }
    if (!edge && count > cw * ch * 0.01) regions.push({ x: minX / s, y: minY / s, w: (maxX - minX + 1) / s, h: (maxY - minY + 1) / s });
  }
  // reading order: rows top→bottom, then left→right within a row
  regions.sort((p, q) => p.y - q.y);
  const rows = [];
  regions.forEach((r) => {
    const row = rows.find((rw) => Math.abs(rw[0].y + rw[0].h / 2 - (r.y + r.h / 2)) < Math.min(rw[0].h, r.h) / 2);
    row ? row.push(r) : rows.push([r]);
  });
  return rows.flatMap((rw) => rw.sort((p, q) => p.x - q.x));
}

// Turn an uploaded image into a frame base: normalised to ~500 units wide.
// If it has no see-through holes, cut them in using the template layout for this shot count.
export function frameFromUpload(img, shots) {
  const targetW = 500;
  const k = targetW / img.width;
  const W = targetW, H = Math.round(img.height * k);
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, W, H);

  let windows = detectHoles(img).map((r) => ({ x: r.x * k, y: r.y * k, w: r.w * k, h: r.h * k }));
  let cut = false;
  if (windows.length === 0) {
    // no holes → punch them, scaling the template layout into the image (keeping some border)
    const lay = templateLayout(shots);
    // keep the template's proportions, centred in the image
    const k2 = Math.min(W / lay.W, H / lay.H);
    const ox = (W - lay.W * k2) / 2, oy = (H - lay.H * k2) / 2;
    windows = lay.windows.map((w) => ({ x: ox + w.x * k2, y: oy + w.y * k2, w: w.w * k2, h: w.h * k2 }));
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    windows.forEach((w) => { roundRect(ctx, w.x, w.y, w.w, w.h, 14); ctx.fill(); });
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 6;
    windows.forEach((w) => { roundRect(ctx, w.x, w.y, w.w, w.h, 14); ctx.stroke(); });
    cut = true;
  }
  return { canvas: c, W, H, windows, cut, textColor: "#ffffff" };
}

/* ── charms (sticker-style, drawn as SVG so they look the same everywhere) ── */
const sticker = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 120 120"><g stroke="#fff" stroke-width="9" stroke-linejoin="round" paint-order="stroke">${inner}</g></svg>`;

export const CHARMS = [
  { id: "heart", name: "heart", svg: sticker(`<path d="M50 88C18 66 6 46 14 28c7-15 27-17 36-2 9-15 29-13 36 2 8 18-4 38-36 60z" fill="#ff5c93"/><path d="M28 30c5-6 12-6 16-2" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`) },
  { id: "star", name: "star", svg: sticker(`<path d="M50 6l12 28 30 3-23 20 7 30-26-16-26 16 7-30L8 37l30-3z" fill="#ffd43b"/>`) },
  { id: "sparkle", name: "sparkle", svg: sticker(`<path d="M50 4c4 26 10 38 46 46-36 8-42 20-46 46-4-26-10-38-46-46 36-8 42-20 46-46z" fill="#ffb3d1"/>`) },
  { id: "bow", name: "bow", svg: sticker(`<path d="M50 44C36 22 10 18 10 40s26 22 40 10c14 12 40 12 40-10S64 22 50 44z" fill="#ff7aa8"/><path d="M44 50l-14 36 14-6 6 10 0-38zM56 50l14 36-14-6-6 10 0-38z" fill="#ff5c93"/><circle cx="50" cy="47" r="9" fill="#e23d78"/>`) },
  { id: "cherry", name: "cherry", svg: sticker(`<path d="M36 64C40 40 52 22 70 10M66 66C64 44 66 26 70 10" stroke="#3f8f4a" stroke-width="5" fill="none"/><path d="M70 10c10-4 22 0 24 10-12 4-20 0-24-10z" fill="#5bbf6a"/><circle cx="32" cy="72" r="18" fill="#e5194b"/><circle cx="68" cy="74" r="18" fill="#e5194b"/><circle cx="26" cy="66" r="5" fill="#fff" opacity=".7"/><circle cx="62" cy="68" r="5" fill="#fff" opacity=".7"/>`) },
  { id: "flower", name: "flower", svg: sticker(`<g fill="#ffffff"><circle cx="50" cy="22" r="18"/><circle cx="77" cy="42" r="18"/><circle cx="67" cy="74" r="18"/><circle cx="33" cy="74" r="18"/><circle cx="23" cy="42" r="18"/></g><circle cx="50" cy="52" r="15" fill="#ffd43b"/>`) },
  { id: "cloud", name: "cloud", svg: sticker(`<path d="M24 78c-14 0-20-18-8-26-2-16 16-26 28-16 6-16 30-16 34 4 16-2 22 20 8 30-2 6-6 8-12 8z" fill="#ffffff"/><circle cx="40" cy="58" r="3" fill="#7a2149"/><circle cx="62" cy="58" r="3" fill="#7a2149"/><path d="M46 66q5 5 10 0" stroke="#7a2149" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="34" cy="65" r="4" fill="#ff9cc0"/><circle cx="68" cy="65" r="4" fill="#ff9cc0"/>`) },
  { id: "moon", name: "moon", svg: sticker(`<path d="M66 8C42 12 26 32 28 56s24 40 48 36C58 84 46 66 48 46S58 14 66 8z" fill="#ffe27a"/><path d="M80 20l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#ffd43b"/>`) },
  { id: "smile", name: "smiley", svg: sticker(`<circle cx="50" cy="50" r="40" fill="#ffd43b"/><circle cx="36" cy="42" r="5" fill="#5b3a00"/><circle cx="64" cy="42" r="5" fill="#5b3a00"/><path d="M32 58q18 20 36 0" stroke="#5b3a00" stroke-width="5" fill="none" stroke-linecap="round"/>`) },
  { id: "lips", name: "kiss", svg: sticker(`<path d="M8 50c10-16 24-24 34-16 4-3 12-3 16 0 10-8 24 0 34 16-12 22-30 30-42 30S20 72 8 50z" fill="#e5194b"/><path d="M14 50q36 10 72 0" stroke="#9c0a2e" stroke-width="3" fill="none"/>`) },
  { id: "butterfly", name: "butterfly", svg: sticker(`<path d="M48 48C38 24 14 14 10 28s8 30 34 26c-22 6-28 24-16 30s18-14 20-30zM52 48c10-24 34-34 38-20s-8 30-34 26c22 6 28 24 16 30s-18-14-20-30z" fill="#b9a2ff"/><rect x="46" y="30" width="8" height="46" rx="4" fill="#4b2f7a"/>`) },
  { id: "music", name: "note", svg: sticker(`<path d="M38 74V24l40-10v48" stroke="#ff5c93" stroke-width="8" fill="none" stroke-linecap="round"/><ellipse cx="28" cy="76" rx="14" ry="11" fill="#ff5c93"/><ellipse cx="68" cy="66" rx="14" ry="11" fill="#ff5c93"/>`) },
];
export const charmUrl = (charm) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(charm.svg)}`;

const charmImgCache = {};
export function loadCharm(id) {
  if (!charmImgCache[id]) {
    const charm = CHARMS.find((c) => c.id === id);
    charmImgCache[id] = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = charmUrl(charm);
    });
  }
  return charmImgCache[id];
}

/* ── drawing decorations (charms + text) ───────────────────────────── */
export function itemBox(ctx, item) {
  if (item.type === "charm") return { w: item.size, h: item.size };
  ctx.font = `${item.weight || 400} ${item.size}px ${fontCss(item.font)}`;
  return { w: Math.max(20, ctx.measureText(item.text || " ").width), h: item.size * 1.3 };
}

export function drawItems(ctx, items, charmImgs) {
  for (const it of items) {
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(((it.rot || 0) * Math.PI) / 180);
    if (it.type === "charm") {
      const img = charmImgs[it.kind];
      if (img) {
        ctx.shadowColor = "rgba(0,0,0,0.22)"; ctx.shadowBlur = it.size * 0.08; ctx.shadowOffsetY = it.size * 0.03;
        ctx.drawImage(img, -it.size / 2, -it.size / 2, it.size, it.size);
      }
    } else if (it.text) {
      const f = TEXT_FONTS.find((x) => x.id === it.font);
      ctx.font = `${f?.weight || 400} ${it.size}px ${fontCss(it.font)}`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (it.outline) { ctx.lineJoin = "round"; ctx.lineWidth = it.size * 0.16; ctx.strokeStyle = "#ffffff"; ctx.strokeText(it.text, 0, 0); }
      ctx.fillStyle = it.color;
      ctx.fillText(it.text, 0, 0);
    }
    ctx.restore();
  }
}

export function hitItem(ctx, items, x, y) {
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    const { w, h } = itemBox(ctx, it);
    const a = (-(it.rot || 0) * Math.PI) / 180;
    const dx = x - it.x, dy = y - it.y;
    const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
    if (Math.abs(lx) <= w / 2 + 8 && Math.abs(ly) <= h / 2 + 8) return it;
  }
  return null;
}

/* ── bake: base + decorations → a frameMappings-style entry ─────────── */
export function bakeFrame(base, items, charmImgs) {
  const c = document.createElement("canvas");
  c.width = base.W; c.height = base.H;
  const ctx = c.getContext("2d");
  ctx.drawImage(base.canvas, 0, 0);
  drawItems(ctx, items, charmImgs);
  const url = c.toDataURL("image/png");
  return {
    url,
    mapping: {
      frame: url,
      frameWidth: base.W,
      frameHeight: base.H,
      // grow windows a touch so no seam shows between photo and frame edge
      windows: base.windows.map((w) => ({ left: Math.round(w.x - 3), top: Math.round(w.y - 3), width: Math.round(w.w + 6), height: Math.round(w.h + 6), borderRadius: 0 })),
      custom: true,
    },
  };
}

/* ── remember a few custom frames on this device ───────────────────── */
const STORE = "photobooth.customFrames.v1";
export function loadSavedFrames(shots) {
  try { return (JSON.parse(localStorage.getItem(STORE) || "[]") || []).filter((f) => f.shots === shots); }
  catch { return []; }
}
export function saveFrame(entry) {
  try {
    const all = JSON.parse(localStorage.getItem(STORE) || "[]") || [];
    const next = [entry, ...all.filter((f) => f.key !== entry.key)].slice(0, 6);
    localStorage.setItem(STORE, JSON.stringify(next));
  } catch { /* storage full or blocked — the frame still works this session */ }
}
