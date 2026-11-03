// Frame studio — make your own frame for this strip.
//  base:   a generated template (style × colour) or your own uploaded image
//          (see-through holes are found automatically; if there are none, holes are cut for you)
//  charms: sticker charms you drag around, resize and rotate
//  text:   captions in the app's fonts
// "use this frame" bakes it into a normal frame that the rest of the app treats like a built-in.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  PALETTES, STYLES, CHARMS, TEXT_FONTS, charmUrl, loadCharm,
  generateTemplate, frameFromUpload, drawItems, hitItem, itemBox, bakeFrame,
} from "./frameEngine";
import { ensurePostcardFonts, loadImage } from "./postcard";

const TABS = ["base", "charms", "text"];
let nextId = 1;

async function preparePhoto(src, filter) {
  const img = await loadImage(src);
  if (!filter) return img;
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext("2d");
  ctx.filter = filter;
  ctx.drawImage(img, 0, 0);
  return c;
}

function drawCover(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s, sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

const Eyebrow = ({ children, right }) => (
  <div className="mb-2 flex items-baseline justify-between">
    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pink-400">{children}</p>
    {right && <span className="text-[10px] text-pink-300">{right}</span>}
  </div>
);

function Slider({ label, value, min, max, onChange, suffix = "" }) {
  return (
    <label className="flex items-center gap-3 text-[11px] font-semibold text-pink-500">
      <span className="w-12 shrink-0">{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="studio-range flex-1" />
      <span className="w-10 shrink-0 text-right font-normal text-pink-400">{Math.round(value)}{suffix}</span>
    </label>
  );
}

export default function FrameStudio({ images, filters, onDone, onClose }) {
  const shots = images.length;
  const [tab, setTab] = useState("base");
  const [source, setSource] = useState("template");
  const [style, setStyle] = useState("gingham");
  const [palette, setPalette] = useState("blush");
  const [upload, setUpload] = useState(null); // { img, name }
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [charmImgs, setCharmImgs] = useState({});
  const [, setFontsReady] = useState(false);
  const canvasRef = useRef(null);
  const drag = useRef(null);
  const fileRef = useRef(null);

  const base = useMemo(() => {
    if (source === "upload" && upload) return frameFromUpload(upload.img, shots);
    return generateTemplate({ shots, style, palette });
  }, [source, upload, shots, style, palette]);

  // style thumbnails for the current colour
  const styleThumbs = useMemo(
    () => Object.fromEntries(STYLES.map((s) => [s.id, generateTemplate({ shots, style: s.id, palette }).canvas.toDataURL()])),
    [shots, palette]
  );

  useEffect(() => {
    Promise.all(images.map((src, i) => preparePhoto(src, filters[i]))).then(setPhotos).catch(() => {});
    Promise.all(CHARMS.map((c) => loadCharm(c.id).then((img) => [c.id, img]))).then((e) => setCharmImgs(Object.fromEntries(e))).catch(() => {});
    Promise.all([ensurePostcardFonts(), document.fonts?.load?.("700 20px Poppins")]).then(() => setFontsReady(true));
    // prepare once when opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = items.find((i) => i.id === selectedId) || null;

  // live preview
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = base.W; c.height = base.H;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, base.W, base.H);
    base.windows.forEach((w, i) => {
      if (photos[i]) drawCover(ctx, photos[i], w.x - 3, w.y - 3, w.w + 6, w.h + 6);
      else { ctx.fillStyle = "#f3d3e0"; ctx.fillRect(w.x, w.y, w.w, w.h); }
    });
    ctx.drawImage(base.canvas, 0, 0);
    drawItems(ctx, items, charmImgs);
    if (selected) {
      const { w, h } = itemBox(ctx, selected);
      ctx.save();
      ctx.translate(selected.x, selected.y);
      ctx.rotate(((selected.rot || 0) * Math.PI) / 180);
      ctx.setLineDash([8, 6]); ctx.lineWidth = 3; ctx.strokeStyle = "#ec4899";
      ctx.strokeRect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16);
      ctx.restore();
    }
  });

  const toFrame = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * base.W) / r.width, y: ((e.clientY - r.top) * base.H) / r.height };
  };
  const onPointerDown = (e) => {
    const p = toFrame(e);
    const hit = hitItem(canvasRef.current.getContext("2d"), items, p.x, p.y);
    if (hit) {
      setSelectedId(hit.id);
      setTab(hit.type === "text" ? "text" : "charms");
      drag.current = { id: hit.id, dx: p.x - hit.x, dy: p.y - hit.y };
      canvasRef.current.setPointerCapture(e.pointerId);
    } else setSelectedId(null);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const p = toFrame(e);
    const { id, dx, dy } = drag.current;
    setItems((list) => list.map((it) => (it.id === id ? { ...it, x: Math.max(0, Math.min(base.W, p.x - dx)), y: Math.max(0, Math.min(base.H, p.y - dy)) } : it)));
  };
  const onPointerUp = () => { drag.current = null; };

  const update = (patch) => setItems((list) => list.map((it) => (it.id === selectedId ? { ...it, ...patch } : it)));
  const remove = () => { setItems((list) => list.filter((it) => it.id !== selectedId)); setSelectedId(null); };
  const toFront = () => setItems((list) => [...list.filter((it) => it.id !== selectedId), ...list.filter((it) => it.id === selectedId)]);

  const spot = () => {
    // drop new things in the caption area (templates) or the middle, with a little scatter
    const n = items.length;
    const y = base.caption ? base.caption.y + base.caption.h / 2 : base.H / 2;
    const xs = [0.5, 0.2, 0.8, 0.33, 0.67, 0.12, 0.88];
    return { x: base.W * xs[n % xs.length], y: y + ((n % 3) - 1) * base.W * 0.04 };
  };
  const addCharm = (kind) => {
    const id = nextId++;
    setItems((list) => [...list, { id, type: "charm", kind, size: Math.round(base.W * 0.18), rot: ((items.length * 17) % 30) - 15, ...spot() }]);
    setSelectedId(id);
  };
  const addText = () => {
    const id = nextId++;
    setItems((list) => [...list, {
      id, type: "text", text: "best day ever", font: "script", size: Math.round(base.W * 0.085),
      color: base.textColor || "#7a2149", outline: source === "upload", rot: -4, ...spot(),
    }]);
    setSelectedId(id);
  };

  const onFile = async (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      URL.revokeObjectURL(url);
      setUpload({ img, name: file.name });
      setSource("upload");
    } catch { /* not an image */ }
  };

  const uploadNote = (() => {
    if (source !== "upload" || !upload) return null;
    if (base.cut) return { ok: true, text: `no see-through holes found — we cut ${shots} photo window${shots > 1 ? "s" : ""} for you` };
    if (base.windows.length < shots) return { ok: false, text: `found ${base.windows.length} photo window${base.windows.length === 1 ? "" : "s"} but you have ${shots} photos — the extra photo${shots - base.windows.length > 1 ? "s" : ""} won't show` };
    return { ok: true, text: `found ${base.windows.length} photo window${base.windows.length > 1 ? "s" : ""} ✓` };
  })();

  const finish = () => {
    setSelectedId(null);
    const { url, mapping } = bakeFrame(base, items, charmImgs);
    onDone({ url, mapping });
  };

  const colors = [base.textColor || "#7a2149", "#ffffff", "#ec4899", "#1f2a44", "#e5194b", "#f2bf3a"];

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto animated-pink-bg">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col items-center gap-5 px-4 py-4 md:flex-row md:items-center md:gap-10 md:px-8 md:py-6">
        {/* preview */}
        <div className="flex w-full flex-1 flex-col items-center">
          <div className="mb-3 flex w-full items-center justify-between md:mb-5">
            <button onClick={onClose} className="studio-chip flex items-center gap-1.5"><span aria-hidden>←</span> back</button>
            <p className="whitespace-nowrap font-pacifico text-xl text-white drop-shadow-[0_2px_6px_rgba(219,39,119,0.45)] md:text-3xl">frame studio ✦</p>
            <span className="w-[68px]" />
          </div>
          <canvas
            ref={canvasRef}
            className="framestudio-canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          <p className="mt-3 text-center text-xs text-white/90 drop-shadow">
            {items.length ? "drag charms & text to move them · tap one to edit" : "pick a base, then add charms & words"}
          </p>
        </div>

        {/* controls */}
        <div className="studio-panel flex w-full shrink-0 flex-col rounded-[28px] md:max-h-[88vh] md:w-[400px] lg:w-[440px]">
          <div className="px-5 pt-5">
            <div className="studio-tabs relative grid grid-cols-3" role="tablist">
              <span className="studio-tabs-thumb" style={{ transform: `translateX(${TABS.indexOf(tab) * 100}%)` }} aria-hidden />
              {TABS.map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`relative z-[1] py-2.5 text-[13px] font-semibold ${tab === t ? "text-pink-600" : "text-pink-400/80 hover:text-pink-500"}`}>
                  {t}{t === "charms" && items.some((i) => i.type === "charm") ? ` · ${items.filter((i) => i.type === "charm").length}` : ""}
                </button>
              ))}
            </div>
          </div>

          <div key={tab} className="studio-scroll studio-body min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-4">
            {tab === "base" && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-2">
                  <button className={`studio-chip !py-2.5 ${source === "template" ? "is-on" : ""}`} onClick={() => setSource("template")}>✦ templates</button>
                  <button className={`studio-chip !py-2.5 ${source === "upload" ? "is-on" : ""}`} onClick={() => (upload ? setSource("upload") : fileRef.current?.click())}>⇪ your own</button>
                </div>

                {source === "template" ? (
                  <>
                    <div>
                      <Eyebrow>style</Eyebrow>
                      <div className="studio-scroll -mx-5 grid snap-x auto-cols-[30%] grid-flow-col gap-2.5 overflow-x-auto px-5 pb-2">
                        {STYLES.map((s) => (
                          <button key={s.id} onClick={() => setStyle(s.id)} className={`studio-tile snap-start flex-col !gap-1.5 ${shots > 1 ? "h-40" : "h-32"} ${style === s.id ? "is-on" : ""}`}>
                            <img src={styleThumbs[s.id]} alt="" className="min-h-0 flex-1" />
                            <span className="text-[11px] font-semibold text-pink-500">{s.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Eyebrow>colour</Eyebrow>
                      <div className="flex flex-wrap gap-2.5">
                        {Object.entries(PALETTES).map(([id, p]) => (
                          <button key={id} onClick={() => setPalette(id)} title={p.name} aria-label={p.name} className={`postcard-swatch ${palette === id ? "is-on" : ""}`} style={{ background: p.paper }}>
                            <span style={{ background: p.accent }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button className="framestudio-drop" onClick={() => fileRef.current?.click()}>
                      {upload ? (
                        <>
                          <img src={base.canvas.toDataURL()} alt="" className="h-20 w-auto rounded-md object-contain" />
                          <span className="text-xs font-semibold text-pink-600">{upload.name}</span>
                          <span className="text-[11px] text-pink-400">tap to choose a different image</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">⇪</span>
                          <span className="text-sm font-semibold text-pink-600">upload a frame</span>
                          <span className="text-[11px] text-pink-400">PNG with see-through photo holes works best</span>
                        </>
                      )}
                    </button>
                    {uploadNote && (
                      <p className={`rounded-2xl px-3 py-2 text-[12px] ${uploadNote.ok ? "bg-white/70 text-pink-600" : "bg-amber-50 text-amber-700"}`}>{uploadNote.text}</p>
                    )}
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
              </div>
            )}

            {tab === "charms" && (
              <div className="flex flex-col gap-5">
                <div>
                  <Eyebrow right="tap to add">charms</Eyebrow>
                  <div className="grid grid-cols-6 gap-2">
                    {CHARMS.map((c) => (
                      <button key={c.id} onClick={() => addCharm(c.id)} className="framestudio-charm" title={c.name} aria-label={`add ${c.name}`}>
                        <img src={charmUrl(c)} alt="" draggable={false} />
                      </button>
                    ))}
                  </div>
                </div>
                {selected?.type === "charm" && (
                  <ItemControls item={selected} update={update} remove={remove} toFront={toFront} />
                )}
              </div>
            )}

            {tab === "text" && (
              <div className="flex flex-col gap-4">
                {selected?.type === "text" ? (
                  <>
                    <Eyebrow right={<button className="text-pink-500 underline" onClick={addText}>+ another</button>}>your words</Eyebrow>
                    <input
                      value={selected.text}
                      maxLength={40}
                      onChange={(e) => update({ text: e.target.value })}
                      className="postcard-input text-lg"
                      style={{ fontFamily: TEXT_FONTS.find((f) => f.id === selected.font)?.css }}
                      autoFocus
                    />
                    <div>
                      <Eyebrow>font</Eyebrow>
                      <div className="grid grid-cols-4 gap-2">
                        {TEXT_FONTS.map((f) => (
                          <button key={f.id} onClick={() => update({ font: f.id, weight: f.weight })} className={`studio-chip !py-2 !text-base ${selected.font === f.id ? "is-on" : ""}`} style={{ fontFamily: f.css, fontWeight: f.weight }}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Eyebrow>colour</Eyebrow>
                      <div className="flex items-center gap-2.5">
                        {colors.map((c, i) => (
                          <button key={c + i} onClick={() => update({ color: c })} className={`framestudio-dot ${selected.color === c ? "is-on" : ""}`} style={{ background: c }} aria-label={c} />
                        ))}
                        <button onClick={() => update({ outline: !selected.outline })} className={`studio-chip ml-auto !py-1.5 ${selected.outline ? "is-on" : ""}`}>outline</button>
                      </div>
                    </div>
                    <ItemControls item={selected} update={update} remove={remove} toFront={toFront} sizeRange={[14, 120]} />
                  </>
                ) : (
                  <button className="studio-extra" onClick={addText}>
                    <span className="studio-extra-icon font-pacifico">Aa</span>
                    <span className="flex flex-col text-left">
                      <span className="text-sm font-semibold text-pink-600">Add words</span>
                      <span className="text-[11px] text-pink-400">a caption, a date, an inside joke</span>
                    </span>
                    <span className="ml-auto text-pink-300">+</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="studio-footer px-5 pt-3 pb-5">
            <button className="studio-save w-full" onClick={finish} disabled={!photos.length}>use this frame ♡</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemControls({ item, update, remove, toFront, sizeRange = [30, 260] }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/60 p-3 shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgba(244,114,182,0.18)]">
      <Slider label="size" value={item.size} min={sizeRange[0]} max={sizeRange[1]} onChange={(v) => update({ size: v })} />
      <Slider label="tilt" value={item.rot || 0} min={-180} max={180} onChange={(v) => update({ rot: v })} suffix="°" />
      <div className="flex gap-2">
        <button className="studio-chip flex-1 !py-2" onClick={toFront}>bring to front</button>
        <button className="studio-chip flex-1 !py-2 !text-rose-500" onClick={remove}>remove</button>
      </div>
    </div>
  );
}
