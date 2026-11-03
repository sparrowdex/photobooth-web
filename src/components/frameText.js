// Fill-in text for frames that have blanks to write on (e.g. the GF/BF license cards).
// Used both by the on-screen preview (FrameLayout) and by every canvas download in StripDesign,
// so what you see is what you download.
import '@fontsource/special-elite/400.css';
import '@fontsource/homemade-apple/400.css';

const FONTS = {
  typewriter: "'Special Elite', 'Courier New', monospace",
  signature: "'Homemade Apple', 'Brush Script MT', cursive",
};

export const fieldFont = (field) => FONTS[field.font || 'typewriter'];

let measureCtx = null;

/** Font size (in frame units) that fits `text` inside the field's width. */
export function fitFontSize(text, field) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = `${field.fontSize}px ${fieldFont(field)}`;
  const w = measureCtx.measureText(text).width;
  return w > field.width ? Math.max(6, (field.fontSize * field.width) / w) : field.fontSize;
}

/** Make sure the fonts are loaded before measuring/drawing on a canvas. */
export function ensureFrameFonts() {
  if (!document.fonts?.load) return Promise.resolve();
  return Promise.all([
    document.fonts.load("16px 'Special Elite'"),
    document.fonts.load("16px 'Homemade Apple'"),
  ]).catch(() => {});
}

/** Draw the fields onto a canvas whose coordinate system matches the frame (frameWidth x frameHeight). */
export function drawFrameText(ctx, mapping, values) {
  if (!mapping?.textFields || !values) return;
  for (const field of mapping.textFields) {
    const text = (values[field.id] || '').trim();
    if (!text) continue;
    const size = fitFontSize(text, field);
    ctx.save();
    ctx.font = `${size}px ${fieldFont(field)}`;
    ctx.fillStyle = field.color || '#1f2a44';
    ctx.textBaseline = 'middle';
    ctx.textAlign = field.align || 'left';
    const x = field.align === 'center' ? field.x + field.width / 2 : field.x;
    ctx.fillText(text, x, field.y);
    ctx.restore();
  }
}
