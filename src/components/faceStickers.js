// Live face stickers: MediaPipe Face Landmarker finds faces on the camera feed, and these
// sticker sets are drawn onto them — on the live preview, into the captured photo, and into
// the GIF recording — using one drawing function so all three always line up.
//
// Coordinates: landmarks are normalised to the *raw* (unmirrored) video frame. A "map" turns
// them into pixels for a target canvas: subtract the crop offset (sX, sY) of the video region
// that canvas shows, then scale by k. The preview canvas is mirrored with CSS like the video.

const MP_VERSION = "0.10.21";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarkerPromise = null;
export function loadFaceLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      const make = (delegate) =>
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: "VIDEO",
          numFaces: 4,
        });
      try { return await make("GPU"); } catch { return await make("CPU"); }
    })().catch((e) => { landmarkerPromise = null; throw e; });
  }
  return landmarkerPromise;
}

// Same crop react-camera-pro uses for takePhoto (object-fit: cover into the container)
export function coverCrop(vw, vh, cw, ch) {
  const vAR = vw / vh, cAR = cw / ch;
  if (vAR > cAR) { const sW = vh * cAR; return { sX: (vw - sW) / 2, sY: 0, sW, sH: vh }; }
  const sH = vw / cAR;
  return { sX: 0, sY: (vh - sH) / 2, sW: vw, sH };
}

/* ── anchors: the few points the stickers hang off ─────────────────── */
export function anchorsFromLandmarks(lm, vw, vh, map) {
  const P = (i) => ({ x: (lm[i].x * vw - map.sX) * map.k, y: (lm[i].y * vh - map.sY) * map.k });
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const eyeL = mid(P(33), P(133)), eyeR = mid(P(263), P(362));
  const edgeL = P(234), edgeR = P(454);
  return {
    eyeL, eyeR,
    roll: Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x),
    fw: Math.hypot(edgeR.x - edgeL.x, edgeR.y - edgeL.y),
    forehead: P(10), chin: P(152), nose: P(4), between: P(168),
    cheekL: P(50), cheekR: P(280), mouth: mid(P(13), P(14)),
  };
}

/* ── tiny drawing kit ──────────────────────────────────────────────── */
function heart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 0.6, y - s * 0.05, x - s * 0.35, y - s * 0.6, x, y - s * 0.22);
  ctx.bezierCurveTo(x + s * 0.35, y - s * 0.6, x + s * 0.6, y - s * 0.05, x, y + s * 0.35);
  ctx.closePath();
}
function sparkle(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i;
    ctx.quadraticCurveTo(x + Math.cos(a + Math.PI / 4) * r * 0.2, y + Math.sin(a + Math.PI / 4) * r * 0.2, x + Math.cos(a + Math.PI / 2) * r, y + Math.sin(a + Math.PI / 2) * r);
  }
  ctx.closePath();
}
// sticker look: thick white outline + soft drop shadow, then the fill
function stickerFill(ctx, fill, fw, outline = "#ffffff") {
  ctx.save();
  ctx.shadowColor = "rgba(80,10,40,0.28)"; ctx.shadowBlur = fw * 0.04; ctx.shadowOffsetY = fw * 0.012;
  ctx.lineJoin = "round"; ctx.lineWidth = Math.max(2, fw * 0.03); ctx.strokeStyle = outline; ctx.stroke();
  ctx.restore();
  ctx.fillStyle = fill; ctx.fill();
}
// work in a face-aligned frame: origin at point p, x along the eyes, y down the face, units of face width
function inFace(ctx, a, p, fn) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(a.roll);
  fn(a.fw);
  ctx.restore();
}

function blush(ctx, a, alpha = 0.55) {
  [a.cheekL, a.cheekR].forEach((c) => {
    const r = a.fw * 0.13;
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
    g.addColorStop(0, `rgba(255,105,150,${alpha})`);
    g.addColorStop(1, "rgba(255,105,150,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(c.x, c.y, r * 1.25, r * 0.85, a.roll, 0, Math.PI * 2); ctx.fill();
  });
}

/* ── sticker sets ──────────────────────────────────────────────────── */
const DRAW = {
  bunny(ctx, a) {
    inFace(ctx, a, a.forehead, (fw) => {
      [-1, 1].forEach((s) => {
        ctx.save();
        ctx.translate(s * fw * 0.2, -fw * 0.5);
        ctx.rotate(s * 0.2);
        ctx.beginPath(); ctx.ellipse(0, 0, fw * 0.11, fw * 0.36, 0, 0, Math.PI * 2);
        stickerFill(ctx, "#ffffff", fw, "#ffd3e4");
        ctx.beginPath(); ctx.ellipse(0, fw * 0.03, fw * 0.055, fw * 0.26, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#ffb0cc"; ctx.fill();
        ctx.restore();
      });
    });
    blush(ctx, a);
    inFace(ctx, a, a.nose, (fw) => { heart(ctx, 0, 0, fw * 0.09); ctx.fillStyle = "#ff7aa8"; ctx.fill(); });
  },
  kitty(ctx, a) {
    inFace(ctx, a, a.forehead, (fw) => {
      [-1, 1].forEach((s) => {
        ctx.save();
        ctx.translate(s * fw * 0.3, -fw * 0.12);
        ctx.rotate(s * 0.25);
        ctx.beginPath(); ctx.moveTo(-fw * 0.15, fw * 0.05); ctx.quadraticCurveTo(-fw * 0.06, -fw * 0.32, 0, -fw * 0.36); ctx.quadraticCurveTo(fw * 0.06, -fw * 0.32, fw * 0.15, fw * 0.05); ctx.closePath();
        stickerFill(ctx, "#2f2433", fw);
        ctx.beginPath(); ctx.moveTo(-fw * 0.08, fw * 0.02); ctx.quadraticCurveTo(0, -fw * 0.24, fw * 0.08, fw * 0.02); ctx.closePath();
        ctx.fillStyle = "#ff9cc0"; ctx.fill();
        ctx.restore();
      });
    });
    inFace(ctx, a, a.nose, (fw) => {
      ctx.beginPath(); ctx.moveTo(-fw * 0.05, -fw * 0.015); ctx.lineTo(fw * 0.05, -fw * 0.015); ctx.lineTo(0, fw * 0.04); ctx.closePath();
      ctx.fillStyle = "#ff7aa8"; ctx.fill();
      ctx.strokeStyle = "#2f2433"; ctx.lineWidth = Math.max(1.5, fw * 0.012); ctx.lineCap = "round";
      [-1, 1].forEach((s) => [-0.06, 0, 0.06].forEach((dy, i) => {
        ctx.beginPath(); ctx.moveTo(s * fw * 0.12, fw * (0.05 + dy * 0.5)); ctx.quadraticCurveTo(s * fw * 0.3, fw * (0.04 + dy), s * fw * (0.46 - i * 0.02), fw * (0.02 + dy * 1.6)); ctx.stroke();
      }));
    });
    blush(ctx, a, 0.35);
  },
  blush(ctx, a, t) {
    blush(ctx, a, 0.7);
    [[a.cheekL, -1], [a.cheekR, 1]].forEach(([c, s]) => inFace(ctx, a, c, (fw) => {
      heart(ctx, s * fw * 0.1, -fw * 0.02, fw * 0.07); stickerFill(ctx, "#ff5c93", fw);
      heart(ctx, s * fw * 0.02, fw * 0.08, fw * 0.045); stickerFill(ctx, "#ff8db3", fw);
    }));
    [[a.eyeL, -1], [a.eyeR, 1]].forEach(([e, s], i) => inFace(ctx, a, e, (fw) => {
      const tw = 0.75 + 0.25 * Math.sin(t / 220 + i * 2);
      sparkle(ctx, s * fw * 0.2, -fw * 0.12, fw * 0.07 * tw); stickerFill(ctx, "#fff3b0", fw);
      sparkle(ctx, s * fw * 0.27, fw * 0.0, fw * 0.035 * (1.6 - tw)); stickerFill(ctx, "#ffffff", fw, "#ffd3e4");
    }));
  },
  tiara(ctx, a, t) {
    inFace(ctx, a, a.forehead, (fw) => {
      ctx.translate(0, -fw * 0.06);
      const w = fw * 0.32, h = fw * 0.26;
      const peaks = [[-w, -0.45 * h], [-0.5 * w, -0.72 * h], [0, -h], [0.5 * w, -0.72 * h], [w, -0.45 * h]];
      // crown body: arches between the peaks, gently curved base
      ctx.beginPath();
      ctx.moveTo(-w, 0);
      ctx.lineTo(...peaks[0]);
      for (let i = 1; i < peaks.length; i++) {
        const [px, py] = peaks[i - 1], [qx, qy] = peaks[i];
        ctx.quadraticCurveTo((px + qx) / 2, Math.max(py, qy) + h * 0.55, qx, qy);
      }
      ctx.lineTo(w, 0);
      ctx.quadraticCurveTo(0, h * 0.14, -w, 0);
      ctx.closePath();
      stickerFill(ctx, "#ffd66b", fw);
      // shine + band
      ctx.save(); ctx.clip();
      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(-w, -h, w * 0.55, h * 1.2);
      ctx.fillStyle = "#f5b93a"; ctx.beginPath(); ctx.moveTo(-w, -h * 0.16); ctx.quadraticCurveTo(0, -h * 0.04, w, -h * 0.16); ctx.lineTo(w, h * 0.1); ctx.quadraticCurveTo(0, h * 0.2, -w, h * 0.1); ctx.fill();
      ctx.restore();
      // jewels on the tips and along the band
      peaks.forEach(([px, py], i) => {
        const r = fw * (i === 2 ? 0.045 : 0.032);
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); stickerFill(ctx, i === 2 ? "#ff5c93" : "#ffe9a8", fw);
      });
      [[-0.55, "#7cc6ff"], [0, "#ff5c93"], [0.55, "#7cc6ff"]].forEach(([x, c]) => {
        ctx.beginPath(); ctx.ellipse(x * w, -h * 0.03, fw * 0.03, fw * 0.022, 0, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
        ctx.beginPath(); ctx.arc(x * w - fw * 0.01, -h * 0.05, fw * 0.007, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fill();
      });
      const tw = 0.6 + 0.4 * Math.sin(t / 260);
      sparkle(ctx, w * 0.8, -h * 1.05, fw * 0.05 * tw); stickerFill(ctx, "#ffffff", fw, "#ffe7a3");
      sparkle(ctx, -w * 0.85, -h * 0.95, fw * 0.03 * (1.6 - tw)); stickerFill(ctx, "#ffffff", fw, "#ffe7a3");
    });
  },
  hearts(ctx, a, t) {
    inFace(ctx, a, a.forehead, (fw) => {
      const cy = -fw * 0.28, rx = fw * 0.5, ry = fw * 0.1;
      const n = 7;
      const list = Array.from({ length: n }, (_, i) => {
        const ang = (i / n) * Math.PI * 2 + t / 900;
        return { x: Math.cos(ang) * rx, y: cy + Math.sin(ang) * ry, depth: Math.sin(ang) };
      }).sort((p, q) => p.depth - q.depth);
      list.forEach((h, i) => {
        const s = fw * (0.1 + 0.035 * h.depth);
        ctx.globalAlpha = 0.65 + 0.35 * (h.depth + 1) / 2;
        heart(ctx, h.x, h.y, s);
        stickerFill(ctx, i % 2 ? "#ff5c93" : "#ff9cc0", fw);
      });
      ctx.globalAlpha = 1;
    });
  },
  shades(ctx, a) {
    inFace(ctx, a, a.between, (fw) => {
      const ex = Math.hypot(a.eyeR.x - a.eyeL.x, a.eyeR.y - a.eyeL.y) / 2;
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = Math.max(2, fw * 0.025); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-ex * 0.45, -fw * 0.01); ctx.quadraticCurveTo(0, -fw * 0.05, ex * 0.45, -fw * 0.01); ctx.stroke();
      [-1, 1].forEach((s) => {
        heart(ctx, s * ex, fw * 0.02, fw * 0.3);
        stickerFill(ctx, "rgba(255,70,135,0.88)", fw);
        ctx.save(); ctx.clip();
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath(); ctx.ellipse(s * ex - fw * 0.06, -fw * 0.04, fw * 0.05, fw * 0.025, -0.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
    });
  },
};

export const STICKERS = [
  { id: "none", name: "none" },
  { id: "bunny", name: "bunny" },
  { id: "kitty", name: "kitty" },
  { id: "blush", name: "blush" },
  { id: "tiara", name: "tiara" },
  { id: "hearts", name: "hearts" },
  { id: "shades", name: "shades" },
];

export function drawFaces(ctx, stickerId, faces, vw, vh, map, t = performance.now()) {
  const fn = DRAW[stickerId];
  if (!fn || !faces) return;
  for (const lm of faces) fn(ctx, anchorsFromLandmarks(lm, vw, vh, map), t);
}

// Little preview icons: the sticker drawn on a simple cartoon face
let thumbs = null;
export function stickerThumbs() {
  if (thumbs) return thumbs;
  thumbs = {};
  for (const s of STICKERS) {
    const c = document.createElement("canvas");
    c.width = c.height = 112;
    const ctx = c.getContext("2d");
    const fw = 50, cx = 56, cy = 66;
    ctx.fillStyle = "#ffe1d0";
    ctx.beginPath(); ctx.ellipse(cx, cy, fw * 0.5, fw * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5b3a2a";
    [-1, 1].forEach((k) => { ctx.beginPath(); ctx.arc(cx + k * fw * 0.18, cy - fw * 0.02, 2.6, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = "#5b3a2a"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(cx, cy + fw * 0.16, fw * 0.1, 0.2, Math.PI - 0.2); ctx.stroke();
    if (DRAW[s.id]) {
      const p = (x, y) => ({ x: cx + x * fw, y: cy + y * fw });
      DRAW[s.id](ctx, {
        eyeL: p(-0.18, -0.02), eyeR: p(0.18, -0.02), roll: 0, fw,
        forehead: p(0, -0.5), chin: p(0, 0.6), nose: p(0, 0.08), between: p(0, -0.03),
        cheekL: p(-0.27, 0.14), cheekR: p(0.27, 0.14), mouth: p(0, 0.25),
      }, 400);
    }
    thumbs[s.id] = c.toDataURL();
  }
  return thumbs;
}
