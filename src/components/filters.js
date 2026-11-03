// Photo filters, applied as stackable layers (in the order you tap them).
//
// Most looks are SVG filters (tone curves per channel, split toning, film grain, soft glow),
// referenced as `url(#pb-…)` — that works both as a CSS filter on <img> previews and as
// `ctx.filter` when saving, so the strip, GIF, postcard and frame studio all match.
// A few simple looks stay plain CSS filter strings.

// Tone curves: output levels at inputs 0, .25, .5, .75, 1 for R, G, B
const LOOKS = {
  peach:     { r: "0.02 0.27 0.60 0.90 1.00",   g: "0.00 0.22 0.53 0.84 0.98", b: "0.00 0.18 0.46 0.77 0.94", sat: 1.1 },
  rose:      { r: "0.02 0.26 0.58 0.88 1.00",   g: "0.00 0.19 0.49 0.81 0.97", b: "0.03 0.23 0.53 0.84 0.98", sat: 1.0,  glow: 0.12 },
  candy:     { r: "0.04 0.25 0.58 0.90 1.00",   g: "0.02 0.20 0.50 0.83 0.98", b: "0.12 0.30 0.57 0.86 1.00",    sat: 1.05, glow: 0.18 },
  portra:    { r: "0.04 0.25 0.56 0.85 0.99", g: "0.03 0.22 0.52 0.82 0.97", b: "0.05 0.20 0.46 0.76 0.94", sat: 0.95, grain: 0.1 },
  gold:      { r: "0.00 0.26 0.60 0.90 1.00",   g: "0.00 0.21 0.54 0.85 0.98", b: "0.00 0.13 0.40 0.71 0.89", sat: 1.2,  grain: 0.12 },
  polaroid:  { r: "0.10 0.28 0.57 0.86 0.98", g: "0.10 0.27 0.55 0.84 0.96", b: "0.15 0.28 0.51 0.78 0.92", sat: 0.88, grain: 0.05 },
  disposable:{ r: "0.00 0.24 0.60 0.92 1.00",   g: "0.00 0.19 0.53 0.86 0.99", b: "0.00 0.15 0.44 0.79 0.94", sat: 1.35, grain: 0.2 },
  golden:    { r: "0.03 0.30 0.65 0.93 1.00",   g: "0.00 0.21 0.52 0.82 0.96", b: "0.00 0.11 0.35 0.66 0.86", sat: 1.15, glow: 0.18 },
  y2k:       { r: "0.00 0.18 0.50 0.85 1.00",   g: "0.02 0.25 0.58 0.89 1.00",    b: "0.10 0.35 0.67 0.92 1.00",    sat: 1.1,  glow: 0.2 },
  lavender:  { r: "0.04 0.24 0.56 0.87 0.99", g: "0.00 0.18 0.48 0.80 0.96", b: "0.10 0.31 0.61 0.89 1.00",    sat: 0.95 },
  clean:     { r: "0.00 0.23 0.55 0.86 1.00",   g: "0.00 0.23 0.55 0.86 1.00",    b: "0.00 0.23 0.55 0.86 1.00",    sat: 1.08 },
  glow:      { r: "0.00 0.25 0.50 0.76 1", g: "0.00 0.25 0.50 0.76 1", b: "0.00 0.25 0.50 0.76 1", sat: 1.03, glow: 0.35 },
  grainy:    { r: "0 0.25 0.5 0.75 1", g: "0 0.25 0.5 0.75 1", b: "0 0.25 0.5 0.75 1", grain: 0.18 },
  gritty:    { r: "0.00 0.14 0.50 0.88 1", g: "0.00 0.14 0.50 0.88 1", b: "0.00 0.14 0.50 0.88 1", sat: 0.85, grain: 0.32, sharpen: true },
  dusty:     { r: "0.10 0.31 0.57 0.82 0.97", g: "0.08 0.28 0.53 0.78 0.94", b: "0.08 0.25 0.48 0.72 0.88", sat: 0.85, grain: 0.12, dust: true },
  silver:    { mono: true, r: "0.10 0.28 0.55 0.84 0.97", g: "0.10 0.28 0.55 0.84 0.97", b: "0.10 0.28 0.55 0.84 0.97", grain: 0.08 },
  noir:      { mono: true, r: "0.00 0.10 0.45 0.86 1.00", g: "0.00 0.10 0.45 0.86 1.00", b: "0.00 0.10 0.45 0.86 1.00", grain: 0.14 },
  sepia:     { mono: true, r: "0.06 0.33 0.64 0.91 1.00", g: "0.03 0.25 0.53 0.81 0.95", b: "0.00 0.15 0.39 0.67 0.85", grain: 0.06 },
};

function filterSvg(id, l) {
  const steps = [];
  if (l.mono) steps.push(`<feColorMatrix type="saturate" values="0" result="mono0"/>`);
  steps.push(`<feComponentTransfer result="curved"><feFuncR type="table" tableValues="${l.r}"/><feFuncG type="table" tableValues="${l.g}"/><feFuncB type="table" tableValues="${l.b}"/></feComponentTransfer>`);
  let last = "curved";
  if (l.sat && l.sat !== 1) { steps.push(`<feColorMatrix in="curved" type="saturate" values="${l.sat}" result="graded"/>`); last = "graded"; }
  if (l.sharpen) {
    steps.push(`<feConvolveMatrix in="${last}" order="3" kernelMatrix="0 -0.6 0  -0.6 3.4 -0.6  0 -0.6 0" preserveAlpha="true" result="sharp"/>`);
    last = "sharp";
  }
  if (l.glow) {
    steps.push(`<feGaussianBlur in="${last}" stdDeviation="5" result="soft"/>`);
    steps.push(`<feBlend in="${last}" in2="soft" mode="screen" result="bloom"/>`);
    steps.push(`<feComposite in="${last}" in2="bloom" operator="arithmetic" k2="${1 - l.glow}" k3="${l.glow}" result="glowed"/>`);
    last = "glowed";
  }
  if (l.grain) {
    steps.push(`<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch" result="noise"/>`);
    steps.push(`<feColorMatrix in="noise" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" result="mono"/>`);
    steps.push(`<feComposite in="${last}" in2="mono" operator="arithmetic" k2="1" k3="${l.grain}" k4="${-l.grain / 2}" result="grained"/>`);
    last = "grained";
  }
  if (l.dust) {
    // sparse white specks + a few hairline scratches, like an old print
    steps.push(`<feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="1" seed="11" result="dn"/>`);
    steps.push(`<feColorMatrix in="dn" type="matrix" values="0 0 0 0 1  0 0 0 0 0.97  0 0 0 0 0.92  9 0 0 0 -6.3" result="specks"/>`);
    steps.push(`<feTurbulence type="turbulence" baseFrequency="0.002 0.3" numOctaves="1" seed="5" result="sn"/>`);
    steps.push(`<feColorMatrix in="sn" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 6 0 0 -5.2" result="scratches"/>`);
    steps.push(`<feMerge result="dusted"><feMergeNode in="${last}"/><feMergeNode in="specks"/><feMergeNode in="scratches"/></feMerge>`);
    last = "dusted";
  }
  // keep the original alpha (frames / transparent GIF stay see-through)
  steps.push(`<feComposite in="${last}" in2="SourceGraphic" operator="in"/>`);
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">${steps.join("")}</filter>`;
}

// Put the SVG filter definitions into the page once (they must live in the document)
function ensureFilterDefs() {
  if (typeof document === "undefined" || document.getElementById("pb-filter-defs")) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("id", "pb-filter-defs");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svg.innerHTML = `<defs>${Object.entries(LOOKS).map(([k, l]) => filterSvg(`pb-${k}`, l)).join("")}</defs>`;
  document.body.appendChild(svg);
}
ensureFilterDefs();

const look = (k) => `url(#pb-${k})`;

// Sections keep the choice manageable: one short row per section on phones.
export const FILTER_GROUPS = [
  { id: "enhance", label: "enhance" },
  { id: "warm", label: "warm" },
  { id: "film", label: "film" },
  { id: "bw", label: "b&w" },
  { id: "texture", label: "texture" },
  { id: "fun", label: "fun" },
];

export const FILTERS = [
  { name: "None", value: "" },
  // enhance — subtle, flattering
  { name: "Soft Focus", group: "enhance", value: "blur(0.5px) contrast(0.98) saturate(1.05)" },
  { name: "Soft Glow", group: "enhance", value: look("glow") },
  { name: "Clean", group: "enhance", value: look("clean") },
  { name: "Clarendon", group: "enhance", value: "contrast(1.2) saturate(1.35) brightness(1.1)" },
  // warm
  { name: "Peach", group: "warm", value: look("peach") },
  { name: "Rosé", group: "warm", value: look("rose") },
  { name: "Golden Hour", group: "warm", value: look("golden") },
  { name: "Juno", group: "warm", value: "saturate(1.4) contrast(1.1) sepia(0.1) hue-rotate(-10deg)" },
  // film
  { name: "Portra", group: "film", value: look("portra") },
  { name: "Gold 200", group: "film", value: look("gold") },
  { name: "Polaroid", group: "film", value: look("polaroid") },
  { name: "Disposable", group: "film", value: look("disposable") },
  // black & white
  { name: "Silver", group: "bw", value: look("silver") },
  { name: "Noir", group: "bw", value: look("noir") },
  { name: "Sepia", group: "bw", value: look("sepia") },
  // textures — layer these on top of any colour look
  { name: "Grainy", group: "texture", value: look("grainy") },
  { name: "Gritty", group: "texture", value: look("gritty") },
  { name: "Dusty", group: "texture", value: look("dusty") },
  // fun
  { name: "Y2K", group: "fun", value: look("y2k") },
  { name: "Cotton Candy", group: "fun", value: look("candy") },
  { name: "Lavender", group: "fun", value: look("lavender") },
  { name: "Cyber", group: "fun", value: "contrast(1.5) saturate(2.5) hue-rotate(150deg) brightness(0.9)" },
];
