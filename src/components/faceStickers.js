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
    mouthOpen: Math.hypot(P(14).x - P(13).x, P(14).y - P(13).y) / Math.max(1, Math.hypot(edgeR.x - edgeL.x, edgeR.y - edgeL.y)),
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

/* ── fur kit (realistic ears) ──────────────────────────────────────── */
// Points around a long ear shape: base at (0,0), tip at (bend, -len). Wider in the middle.
function earPoints(w, len, bend = 0, n = 64) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const y = -len * (1 - Math.cos(t)) / 2;            // 0 at base → -len at tip
    const u = -y / len;                                  // 0..1 up the ear
    const st = Math.sin(t);
    const profile = 0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, u * 0.95 + 0.05)) + 0.1 * (1 - u);
    const width = w * Math.sign(st) * Math.pow(Math.abs(st), 0.6) * profile;
    pts.push({ x: width + bend * u * u, y });
  }
  return pts;
}
function pathFrom(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i <= pts.length; i++) {
    const a = pts[i % pts.length], b = pts[(i + 1) % pts.length];
    ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
  }
  ctx.closePath();
}
let furSeed = 1;
const frand = () => { furSeed = (furSeed * 16807) % 2147483647; return furSeed / 2147483647; };
// short hair strokes along the outline, pointing outward
function furEdge(ctx, pts, fw, color, len = 0.03, seed = 3) {
  furSeed = seed;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineCap = "round";
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], c = pts[(i - 1 + pts.length) % pts.length];
    let nx = b.y - c.y, ny = -(b.x - c.x);
    const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    for (let k = 0; k < 3; k++) {
      const l = fw * len * (0.4 + frand() * 0.8);
      const jitter = (frand() - 0.5) * 1.1;
      ctx.lineWidth = Math.max(0.6, fw * 0.004 * (0.6 + frand()));
      ctx.globalAlpha = 0.25 + frand() * 0.35;
      const sx = a.x + (b.x - a.x) * k / 3 - nx * l * 0.4, sy = a.y + (b.y - a.y) * k / 3 - ny * l * 0.4;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (nx + jitter * ny) * l, sy + (ny - jitter * nx) * l);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function furEar(ctx, fw, { w, len, bend, outer, outerDark, inner, innerDark, fur, seed }) {
  const pts = earPoints(w, len, bend);
  ctx.save();
  ctx.shadowColor = "rgba(40,20,20,0.3)"; ctx.shadowBlur = fw * 0.05; ctx.shadowOffsetY = fw * 0.015;
  pathFrom(ctx, pts);
  const g = ctx.createLinearGradient(-w, 0, w, 0);
  g.addColorStop(0, outerDark); g.addColorStop(0.45, outer); g.addColorStop(1, outerDark);
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  // inner ear
  const ipts = earPoints(w * 0.44, len * 0.78, bend * 0.82).map((p) => ({ x: p.x, y: p.y - len * 0.08 }));
  pathFrom(ctx, ipts);
  const ig = ctx.createLinearGradient(0, -len * 0.1, 0, -len * 0.9);
  ig.addColorStop(0, innerDark); ig.addColorStop(0.45, inner); ig.addColorStop(1, inner);
  ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = ig; ctx.fill(); ctx.restore();
  // soft shading where the inner ear folds
  ctx.save(); pathFrom(ctx, pts); ctx.clip();
  const sh = ctx.createLinearGradient(-w, 0, w, 0);
  sh.addColorStop(0, "rgba(60,30,30,0.18)"); sh.addColorStop(0.5, "rgba(60,30,30,0)"); sh.addColorStop(1, "rgba(60,30,30,0.12)");
  ctx.fillStyle = sh; ctx.fillRect(-w * 2, -len * 1.2, w * 4, len * 1.4); ctx.restore();
  // soft vein + fluff over the inner edge
  ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = innerDark; ctx.lineWidth = Math.max(1, fw * 0.008);
  ctx.beginPath(); ctx.moveTo(0, -len * 0.12); ctx.quadraticCurveTo(bend * 0.25, -len * 0.5, bend * 0.6, -len * 0.82); ctx.stroke(); ctx.restore();
  furEdge(ctx, ipts, fw, outer, 0.018, seed + 9);
  furEdge(ctx, pts, fw, fur, 0.03, seed);
}

/* ── sticker sets ──────────────────────────────────────────────────── */
const DRAW = {
  bunny(ctx, a) {
    inFace(ctx, a, a.forehead, (fw) => {
      [-1, 1].forEach((side) => {
        ctx.save();
        ctx.translate(side * fw * 0.19, fw * 0.06);
        ctx.rotate(side * 0.14);
        furEar(ctx, fw, {
          w: fw * 0.15, len: fw * 0.95, bend: side > 0 ? fw * 0.22 : -fw * 0.05,
          outer: "#f4efea", outerDark: "#d9cfc6", inner: "#f6b8c6", innerDark: "#e48ea3", fur: "#fffaf6", seed: side > 0 ? 11 : 5,
        });
        ctx.restore();
      });
    });
    blush(ctx, a, 0.4);
    inFace(ctx, a, a.nose, (fw) => {
      ctx.beginPath(); ctx.moveTo(-fw * 0.04, -fw * 0.02); ctx.quadraticCurveTo(0, -fw * 0.035, fw * 0.04, -fw * 0.02); ctx.quadraticCurveTo(fw * 0.02, fw * 0.03, 0, fw * 0.035); ctx.quadraticCurveTo(-fw * 0.02, fw * 0.03, -fw * 0.04, -fw * 0.02);
      const ng = ctx.createRadialGradient(-fw * 0.01, -fw * 0.01, 0, 0, 0, fw * 0.05);
      ng.addColorStop(0, "#ffc2d1"); ng.addColorStop(1, "#e7829d"); ctx.fillStyle = ng; ctx.fill();
    });
  },
  puppy(ctx, a) {
    // floppy ears hanging at the temples
    inFace(ctx, a, a.between, (fw) => {
      [-1, 1].forEach((side) => {
        ctx.save();
        ctx.translate(side * fw * 0.33, -fw * 0.62);
        ctx.rotate(Math.PI - side * 0.62);
        furEar(ctx, fw, {
          w: fw * 0.16, len: fw * 0.62, bend: side * fw * 0.08,
          outer: "#9a6a43", outerDark: "#6e4528", inner: "#7c5032", innerDark: "#5c3720", fur: "#b98b62", seed: side > 0 ? 21 : 17,
        });
        ctx.restore();
      });
    });
    // tongue when the mouth is open
    if (a.mouthOpen > 0.06) inFace(ctx, a, a.mouth, (fw) => {
      const l = fw * Math.min(0.3, 0.1 + a.mouthOpen * 1.4);
      ctx.beginPath(); ctx.moveTo(-fw * 0.08, 0); ctx.lineTo(-fw * 0.085, l * 0.6); ctx.quadraticCurveTo(-fw * 0.08, l, 0, l); ctx.quadraticCurveTo(fw * 0.08, l, fw * 0.085, l * 0.6); ctx.lineTo(fw * 0.08, 0); ctx.closePath();
      const tg = ctx.createLinearGradient(0, 0, 0, l);
      tg.addColorStop(0, "#d94f6e"); tg.addColorStop(1, "#ff8aa5"); ctx.fillStyle = tg; ctx.fill();
      ctx.strokeStyle = "rgba(160,30,60,0.5)"; ctx.lineWidth = Math.max(1, fw * 0.008); ctx.beginPath(); ctx.moveTo(0, l * 0.15); ctx.lineTo(0, l * 0.75); ctx.stroke();
    });
    // glossy nose
    inFace(ctx, a, a.nose, (fw) => {
      ctx.beginPath(); ctx.ellipse(0, -fw * 0.005, fw * 0.075, fw * 0.05, 0, 0, Math.PI * 2);
      const ng = ctx.createRadialGradient(-fw * 0.02, -fw * 0.025, 0, 0, 0, fw * 0.08);
      ng.addColorStop(0, "#5a4a4a"); ng.addColorStop(1, "#141012"); ctx.fillStyle = ng; ctx.fill();
      ctx.beginPath(); ctx.ellipse(-fw * 0.025, -fw * 0.025, fw * 0.022, fw * 0.011, -0.3, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fill();
    });
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
  flowers(ctx, a, t) {
    inFace(ctx, a, a.forehead, (fw) => {
      const n = 9, rx = fw * 0.5, ry = fw * 0.2;
      const cols = [["#ffb3cf", "#ff7aa8"], ["#fff3b0", "#ffd43b"], ["#d7c8ff", "#a68bff"], ["#ffffff", "#ffd43b"], ["#ffc9a8", "#ff9a6b"]];
      const pts = Array.from({ length: n }, (_, i) => {
        const ang = Math.PI + (i / (n - 1)) * Math.PI; // arc over the head
        return { x: Math.cos(ang) * rx, y: Math.sin(ang) * ry + fw * 0.06, i };
      });
      // leaves first
      pts.forEach(({ x, y, i }) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate((i - n / 2) * 0.3 + Math.PI / 2 + (i % 2 ? 0.6 : -0.6));
        ctx.beginPath(); ctx.ellipse(fw * 0.07, 0, fw * 0.065, fw * 0.025, 0, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 ? "#7cc47f" : "#5ea865"; ctx.fill(); ctx.restore();
      });
      pts.forEach(({ x, y, i }) => {
        const [petal, mid] = cols[i % cols.length];
        const r = fw * (i % 2 ? 0.055 : 0.07);
        const spin = t / 4000 + i;
        ctx.save(); ctx.translate(x, y); ctx.rotate(spin * 0.2);
        ctx.shadowColor = "rgba(80,10,40,0.25)"; ctx.shadowBlur = fw * 0.02;
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(Math.cos(k * 1.2566) * r * 0.75, Math.sin(k * 1.2566) * r * 0.75, r * 0.62, r * 0.48, k * 1.2566, 0, Math.PI * 2); ctx.fillStyle = petal; ctx.fill(); }
        ctx.shadowColor = "transparent";
        ctx.beginPath(); ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2); ctx.fillStyle = mid; ctx.fill();
        ctx.restore();
      });
    });
  },
  butterflies(ctx, a, t) {
    const wing = (fw, x, y, s, hue, phase, tilt) => {
      const flap = 0.25 + 0.75 * Math.abs(Math.sin(t / 110 + phase));
      ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
      [-1, 1].forEach((side) => {
        ctx.save(); ctx.scale(side * flap, 1);
        const g = ctx.createLinearGradient(0, -s, s, s);
        g.addColorStop(0, `hsl(${hue},90%,78%)`); g.addColorStop(1, `hsl(${hue + 30},85%,62%)`);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(s * 0.5, -s * 1.1, s * 1.25, -s * 0.6, s * 0.95, -s * 0.05); ctx.bezierCurveTo(s * 0.8, s * 0.2, s * 0.3, s * 0.1, 0, 0);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, s * 0.05); ctx.bezierCurveTo(s * 0.55, s * 0.1, s * 0.8, s * 0.6, s * 0.45, s * 0.75); ctx.bezierCurveTo(s * 0.2, s * 0.8, s * 0.05, s * 0.4, 0, s * 0.05);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.beginPath(); ctx.arc(s * 0.6, -s * 0.4, s * 0.12, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      ctx.fillStyle = "#3b2440"; ctx.beginPath(); ctx.ellipse(0, s * 0.15, s * 0.07, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };
    inFace(ctx, a, a.between, (fw) => {
      const list = [
        { r: 0.62, sp: 1 / 1700, ph: 0, y: -0.45, s: 0.2, hue: 300 },
        { r: 0.58, sp: -1 / 2100, ph: 2.1, y: -0.12, s: 0.16, hue: 200 },
        { r: 0.72, sp: 1 / 2500, ph: 4.2, y: 0.18, s: 0.13, hue: 40 },
      ];
      list.forEach((b, i) => {
        const ang = t * b.sp + b.ph;
        const x = Math.cos(ang) * fw * b.r, y = fw * b.y + Math.sin(ang * 2) * fw * 0.08;
        wing(fw, x, y, fw * b.s, b.hue, i * 1.3, Math.sin(ang) * 0.4);
      });
    });
  },
  angel(ctx, a, t) {
    inFace(ctx, a, a.forehead, (fw) => {
      const bob = Math.sin(t / 500) * fw * 0.015;
      const cy = -fw * 0.3 + bob;
      // sparkles orbiting the halo (behind ones dimmer and smaller)
      const n = 6;
      const orbit = Array.from({ length: n }, (_, i) => {
        const ang = (i / n) * Math.PI * 2 - t / 1100;
        return { x: Math.cos(ang) * fw * 0.36, y: cy + Math.sin(ang) * fw * 0.09, d: Math.sin(ang), i };
      });
      const drawSpark = (o) => {
        const tw = 0.7 + 0.3 * Math.sin(t / 160 + o.i * 1.9);
        ctx.globalAlpha = 0.45 + 0.55 * (o.d + 1) / 2;
        sparkle(ctx, o.x, o.y, fw * (0.03 + 0.02 * (o.d + 1) / 2) * tw);
        ctx.fillStyle = o.i % 2 ? "#fff6c9" : "#ffffff"; ctx.fill();
        ctx.globalAlpha = 1;
      };
      orbit.filter((o) => o.d < 0).forEach(drawSpark);
      ctx.save();
      ctx.shadowColor = "rgba(255,214,107,0.95)"; ctx.shadowBlur = fw * 0.1;
      ctx.lineWidth = fw * 0.045; ctx.strokeStyle = "#ffe08a";
      ctx.beginPath(); ctx.ellipse(0, cy, fw * 0.25, fw * 0.065, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0; ctx.lineWidth = fw * 0.012; ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath(); ctx.ellipse(0, cy - fw * 0.012, fw * 0.23, fw * 0.05, 0, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke();
      ctx.restore();
      orbit.filter((o) => o.d >= 0).forEach(drawSpark);
    });
  },
  devil(ctx, a) {
    inFace(ctx, a, a.forehead, (fw) => {
      [-1, 1].forEach((side) => {
        ctx.save(); ctx.translate(side * fw * 0.2, fw * 0.02); ctx.scale(side, 1);
        ctx.beginPath(); ctx.moveTo(-fw * 0.06, 0);
        ctx.quadraticCurveTo(-fw * 0.02, -fw * 0.2, fw * 0.12, -fw * 0.3);
        ctx.quadraticCurveTo(fw * 0.05, -fw * 0.16, fw * 0.07, 0);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, 0, fw * 0.1, -fw * 0.3);
        g.addColorStop(0, "#8f0f25"); g.addColorStop(0.6, "#e0233f"); g.addColorStop(1, "#ff6b7d");
        ctx.shadowColor = "rgba(60,0,10,0.35)"; ctx.shadowBlur = fw * 0.03; ctx.fillStyle = g; ctx.fill();
        ctx.shadowColor = "transparent"; ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = fw * 0.01;
        ctx.beginPath(); ctx.moveTo(-fw * 0.02, -fw * 0.05); ctx.quadraticCurveTo(0, -fw * 0.17, fw * 0.08, -fw * 0.25); ctx.stroke();
        ctx.restore();
      });
    });
    blush(ctx, a, 0.45);
  },
  glitter(ctx, a, t) {
    // freckles over the nose and cheeks + shimmering glitter
    inFace(ctx, a, a.nose, (fw) => {
      furSeed = 42;
      for (let i = 0; i < 26; i++) {
        const side = i % 2 ? 1 : -1;
        const x = side * fw * (0.05 + frand() * 0.22), y = fw * (-0.06 + frand() * 0.08) + Math.abs(x) * 0.2;
        ctx.globalAlpha = 0.35 + frand() * 0.3;
        ctx.fillStyle = "#8a5236";
        ctx.beginPath(); ctx.arc(x, y, fw * (0.008 + frand() * 0.007), 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < 14; i++) {
        const side = i % 2 ? 1 : -1;
        const x = side * fw * (0.1 + frand() * 0.2), y = -fw * (0.0 + frand() * 0.14);
        const tw = Math.max(0, Math.sin(t / 180 + i * 1.7));
        ctx.globalAlpha = 0.4 + tw * 0.6;
        sparkle(ctx, x, y, fw * (0.02 + tw * 0.03));
        ctx.fillStyle = i % 3 ? "#fff6c9" : "#ffc2df"; ctx.fill();
      }
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
  { id: "puppy", name: "puppy" },
  { id: "kitty", name: "kitty" },
  { id: "flowers", name: "flower crown" },
  { id: "butterflies", name: "butterflies" },
  { id: "angel", name: "angel" },
  { id: "devil", name: "devil" },
  { id: "tiara", name: "tiara" },
  { id: "hearts", name: "hearts" },
  { id: "blush", name: "blush" },
  { id: "glitter", name: "glitter freckles" },
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
    const fw = 36, cx = 56, cy = 70;
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
        cheekL: p(-0.27, 0.14), cheekR: p(0.27, 0.14), mouth: p(0, 0.25), mouthOpen: 0.1,
      }, 400);
    }
    thumbs[s.id] = c.toDataURL();
  }
  return thumbs;
}
