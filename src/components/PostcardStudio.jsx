// "Make a postcard" — turns the finished strip into a two-sided postcard.
// Front: your strip taped onto a "greetings from ___" card. Back: handwritten message,
// a stamp made from your first photo, a postmark with today's date, and address lines.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  POSTCARD_W, POSTCARD_H, POSTCARD_THEMES,
  drawFront, drawBack, ensurePostcardFonts, loadImage,
} from "./postcard";

const today = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

// apply the photo's filter once so the stamp matches the strip
async function filteredPhoto(src, filter) {
  const img = await loadImage(src);
  if (!filter) return img;
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext("2d");
  ctx.filter = filter;
  ctx.drawImage(img, 0, 0);
  return c;
}

const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="mb-1.5 flex items-baseline justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pink-400">{label}</span>
      {hint && <span className="text-[10px] text-pink-300">{hint}</span>}
    </span>
    {children}
  </label>
);

export default function PostcardStudio({ renderStrip, photo, photoFilter, onSave, onClose, isSaving }) {
  const [side, setSide] = useState("front");
  const [themeId, setThemeId] = useState("blush");
  const [place, setPlace] = useState("");
  const [message, setMessage] = useState("");
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [assets, setAssets] = useState(null); // { strip, photo }
  const date = useMemo(today, []);
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const theme = POSTCARD_THEMES[themeId];

  useEffect(() => {
    let alive = true;
    (async () => {
      const [stripUrl] = await Promise.all([renderStrip(), ensurePostcardFonts()]);
      const [strip, ph] = await Promise.all([loadImage(stripUrl), filteredPhoto(photo, photoFilter)]);
      if (alive) setAssets({ strip, photo: ph });
    })().catch((e) => console.error("postcard: failed to prepare images", e));
    return () => { alive = false; };
    // render once when opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!assets) return;
    const id = requestAnimationFrame(() => {
      if (frontRef.current) drawFront(frontRef.current.getContext("2d"), { stripImg: assets.strip, theme, place, date });
      if (backRef.current) drawBack(backRef.current.getContext("2d"), { photoImg: assets.photo, theme, message, to, from, date });
    });
    return () => cancelAnimationFrame(id);
  }, [assets, theme, place, message, to, from, date]);

  const save = async (which) => {
    const stamp = Date.now();
    if (which !== "back") await onSave(frontRef.current.toDataURL("image/png"), `postcard-front-${stamp}.png`);
    if (which !== "front") await onSave(backRef.current.toDataURL("image/png"), `postcard-back-${stamp}.png`);
  };

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto animated-pink-bg">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col items-center gap-6 px-4 py-5 md:flex-row md:items-center md:gap-10 md:px-8">
        {/* card */}
        <div className="flex w-full flex-1 flex-col items-center">
          <div className="mb-4 flex w-full items-center justify-between md:mb-6">
            <button onClick={onClose} className="studio-chip flex items-center gap-1.5">
              <span aria-hidden>←</span> back<span className="hidden sm:inline"> to strip</span>
            </button>
            <p className="whitespace-nowrap font-pacifico text-xl text-white drop-shadow-[0_2px_6px_rgba(219,39,119,0.45)] md:text-3xl">your postcard ✉︎</p>
            <span className="hidden w-[112px] md:block" />
          </div>

          <button
            className="postcard-stage w-full max-w-[640px]"
            onClick={() => setSide((s) => (s === "front" ? "back" : "front"))}
            aria-label="Flip postcard"
          >
            <div className={`postcard-flip ${side === "back" ? "is-back" : ""}`}>
              <canvas ref={frontRef} width={POSTCARD_W} height={POSTCARD_H} className="postcard-face" />
              <canvas ref={backRef} width={POSTCARD_W} height={POSTCARD_H} className="postcard-face postcard-face-back" />
              {!assets && (
                <div className="postcard-face flex items-center justify-center bg-white/60 text-sm font-semibold text-pink-500">
                  <span className="studio-spinner !border-pink-200 !border-t-pink-500" />&nbsp; printing your postcard…
                </div>
              )}
            </div>
          </button>

          <div className="mt-5 flex items-center gap-3">
            <div className="studio-tabs relative grid w-56 grid-cols-2">
              <span className="studio-tabs-thumb" style={{ width: "calc((100% - 8px) / 2)", transform: `translateX(${side === "back" ? 100 : 0}%)` }} aria-hidden />
              {["front", "back"].map((s) => (
                <button key={s} onClick={() => setSide(s)} className={`relative z-[1] py-2 text-[13px] font-semibold ${side === s ? "text-pink-600" : "text-pink-400/80"}`}>
                  {s}
                </button>
              ))}
            </div>
            <span className="text-xs text-white/90 drop-shadow">tap the card to flip</span>
          </div>
        </div>

        {/* controls */}
        <div className="studio-panel w-full shrink-0 rounded-[28px] p-5 md:w-[380px]">
          <h2 className="mb-4 font-pacifico text-[24px] leading-none text-pink-500">write it ✦</h2>

          <div className="flex flex-col gap-4">
            <Field label="colour">
              <div className="flex gap-2.5">
                {Object.entries(POSTCARD_THEMES).map(([id, t]) => (
                  <button
                    key={id}
                    onClick={() => setThemeId(id)}
                    className={`postcard-swatch ${themeId === id ? "is-on" : ""}`}
                    style={{ background: `linear-gradient(135deg, ${t.bg}, ${t.bg2})` }}
                    aria-label={t.name}
                    title={t.name}
                  >
                    <span style={{ background: t.accent }} />
                  </button>
                ))}
              </div>
            </Field>

            <Field label="greetings from" hint="front">
              <input
                value={place}
                maxLength={18}
                onChange={(e) => { setPlace(e.target.value); setSide("front"); }}
                placeholder="us"
                className="postcard-input font-pacifico text-lg"
              />
            </Field>

            <Field label="message" hint={`${message.length}/260 · back`}>
              <textarea
                value={message}
                maxLength={260}
                rows={4}
                onChange={(e) => { setMessage(e.target.value); setSide("back"); }}
                placeholder="wish you were here…"
                className="postcard-input resize-none leading-relaxed"
                style={{ fontFamily: "'Homemade Apple', cursive", fontSize: 13 }}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="to">
                <input value={to} maxLength={28} onChange={(e) => { setTo(e.target.value); setSide("back"); }} placeholder="my favourite" className="postcard-input" style={{ fontFamily: "'Homemade Apple', cursive", fontSize: 12 }} />
              </Field>
              <Field label="from">
                <input value={from} maxLength={24} onChange={(e) => { setFrom(e.target.value); setSide("back"); }} placeholder="you know who" className="postcard-input" style={{ fontFamily: "'Homemade Apple', cursive", fontSize: 12 }} />
              </Field>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <button className="studio-save w-full" disabled={!assets || isSaving} onClick={() => save("both")}>
              {isSaving ? <span className="flex items-center justify-center gap-2"><span className="studio-spinner" /> saving…</span> : "save both sides ♡"}
            </button>
            <div className="grid grid-cols-2 gap-2.5">
              <button className="studio-chip !py-2.5" disabled={!assets || isSaving} onClick={() => save("front")}>front only</button>
              <button className="studio-chip !py-2.5" disabled={!assets || isSaving} onClick={() => save("back")}>back only</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
