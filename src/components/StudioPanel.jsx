// The customise UI on the strip screen. Same three tabs everywhere — mood (filters),
// frame (overlays + fill-in), save (format + postcard) — laid out two ways:
//  • widescreen: a roomy frosted-glass studio card beside the strip
//  • phones: an editor layout — slim top bar (retake · title · save), the strip as the hero,
//    and a compact glass dock at the bottom with one row of tools + a tab bar.
import { useEffect, useRef, useState } from "react";
import { FILTERS, FILTER_GROUPS } from "./filters";
import frameMappings from "./frameMappings";
import LicenseForm from "./LicenseForm";

const Icon = {
  mood: (c = "h-4 w-4") => (
    <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="10" r="5.5" /><circle cx="15" cy="10" r="5.5" opacity=".6" /><circle cx="12" cy="15" r="5.5" opacity=".35" /></svg>
  ),
  frame: (c = "h-4 w-4") => (
    <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2.5" /><rect x="7" y="6" width="10" height="9" rx="1" /></svg>
  ),
  save: (c = "h-4 w-4") => (
    <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11m0 0-4-4m4 4 4-4" /><path d="M5 17v2a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-2" /></svg>
  ),
  retake: (c = "h-4 w-4") => (
    <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4.5h4.5" /></svg>
  ),
};

const TABS = [
  { id: "mood", label: "mood" },
  { id: "frame", label: "frame" },
  { id: "save", label: "save" },
];

const FORMATS = [
  { id: "photo", title: "Photo strip", short: "photo", sub: "PNG · sharpest", icon: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="6" y="2.5" width="12" height="19" rx="1.5" /><rect x="8.5" y="5" width="7" height="5" rx=".6" /><rect x="8.5" y="12" width="7" height="5" rx=".6" /></svg>
  ) },
  { id: "gif", title: "Moving strip", short: "moving", sub: "GIF · animated", icon: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m10 9.5 4.5 2.5-4.5 2.5z" fill="currentColor" /></svg>
  ) },
  { id: "gif-transparent", title: "Clear moving", short: "clear", sub: "GIF · no background", icon: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.5 2"><rect x="3" y="5" width="18" height="14" rx="2.5" /></svg>
  ) },
];

function useIsNarrow() {
  const query = "(max-width: 767px)";
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return narrow;
}

const Eyebrow = ({ children, className = "" }) => (
  <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-pink-400 ${className}`}>{children}</p>
);

const isTallLayout = (designs) => {
  const m = designs[0] && frameMappings[designs[0].key];
  return !!m && m.frameHeight > m.frameWidth * 1.5;
};

/* ── mood: filter swatches made from your own photo ───────────────── */
function MoodTab({ images, photoFilters, setPhotoFilters, target, setTarget, compact }) {
  const [group, setGroup] = useState(FILTER_GROUPS[0].id);
  const targets = target === "all" ? images.map((_, i) => i) : [target];
  const preview = images[target === "all" ? 0 : target];

  const layerOf = (filter) => {
    if (filter.name === "None") return null;
    const idx = targets.map((i) => photoFilters[i].findIndex((f) => f.name === filter.name));
    if (idx.every((x) => x !== -1)) return idx[0] + 1;
    return idx.some((x) => x !== -1) ? "·" : null; // on some photos only
  };

  const toggle = (filter) => {
    const next = photoFilters.map((layers) => [...layers]);
    if (filter.name === "None") {
      targets.forEach((i) => { next[i] = []; });
    } else {
      const onAll = targets.every((i) => next[i].some((f) => f.name === filter.name));
      targets.forEach((i) => {
        const has = next[i].some((f) => f.name === filter.name);
        if (onAll) next[i] = next[i].filter((f) => f.name !== filter.name);
        else if (!has) next[i].push(filter);
      });
    }
    setPhotoFilters(next);
  };

  const noneActive = targets.every((i) => photoFilters[i].length === 0);
  const stacked = targets.length === 1 ? photoFilters[targets[0]].length : 0;

  const targetPicker = images.length > 1 && (
    <div className={`studio-scroll flex items-center gap-2 overflow-x-auto ${compact ? "-mx-4 px-4 pb-2.5" : "pb-1"}`}>
      {!compact && <span className="sr-only">apply to</span>}
      <button onClick={() => setTarget("all")} className={`studio-chip ${compact ? "!py-1 !text-[11px]" : ""} ${target === "all" ? "is-on" : ""}`}>
        all photos
      </button>
      {images.map((img, i) => (
        <button
          key={i}
          onClick={() => setTarget(i)}
          className={`relative shrink-0 overflow-hidden rounded-lg transition ${compact ? "h-8 w-7" : "h-10 w-8"} ${target === i ? "ring-2 ring-pink-500 ring-offset-2 ring-offset-white/60" : "opacity-70 hover:opacity-100"}`}
          aria-label={`Photo ${i + 1}`}
        >
          <img src={img} alt="" className="h-full w-full object-cover" />
          <span className="absolute bottom-0 right-0 rounded-tl bg-white/85 px-1 text-[9px] font-bold text-pink-600">{i + 1}</span>
        </button>
      ))}
      {compact && stacked > 1 && <span className="ml-auto shrink-0 text-[10px] text-pink-400">{stacked} layered</span>}
    </div>
  );

  const swatch = (filter) => {
    const layer = layerOf(filter);
    const active = filter.name === "None" ? noneActive : layer !== null;
    return (
      <button key={filter.name} onClick={() => toggle(filter)} className="group flex snap-start flex-col items-center gap-1.5">
        <span className={`studio-swatch ${active ? "is-on" : ""}`}>
          <img src={preview} alt="" style={{ filter: filter.value || "none" }} draggable={false} />
          {layer !== null && <span className="studio-swatch-badge">{layer}</span>}
        </span>
        <span className={`whitespace-nowrap text-[11px] leading-none ${active ? "font-semibold text-pink-600" : "text-gray-500 group-hover:text-pink-500"}`}>
          {filter.name}
        </span>
      </button>
    );
  };
  const none = FILTERS.find((f) => f.name === "None");
  const inGroup = (g) => FILTERS.filter((f) => f.group === g);
  // which sections have something applied (dot on the chip)
  const groupUsed = (g) => inGroup(g).some((f) => layerOf(f) !== null);

  if (compact) {
    return (
      <div>
        {targetPicker}
        <div className="studio-scroll -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2">
          {FILTER_GROUPS.map((g) => (
            <button key={g.id} onClick={() => setGroup(g.id)} className={`studio-chip relative !px-3 !py-1 !text-[11px] ${group === g.id ? "is-on" : ""}`}>
              {g.label}
              {groupUsed(g.id) && group !== g.id && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-pink-500 ring-2 ring-white" />}
            </button>
          ))}
        </div>
        <div key={group} className="studio-scroll studio-body -mx-4 grid snap-x auto-cols-[58px] grid-flow-col gap-x-2.5 overflow-x-auto px-4 pt-1.5 pb-1">
          {swatch(none)}
          {inGroup(group).map(swatch)}
        </div>
      </div>
    );
  }

  return (
    <div>
      {images.length > 1 && (
        <div className="mb-5">
          <Eyebrow>apply to</Eyebrow>
          {targetPicker}
        </div>
      )}
      <div className="mb-2 flex items-baseline justify-between">
        <Eyebrow>pick a mood</Eyebrow>
        <span className="text-[10px] text-pink-300">{stacked > 1 ? `${stacked} layered` : "tap more than one to layer"}</span>
      </div>
      <div className="grid grid-cols-5 gap-x-3 gap-y-4 lg:grid-cols-6">{swatch(none)}</div>
      {FILTER_GROUPS.map((g) => (
        <div key={g.id} className="mt-5">
          <Eyebrow className="!text-pink-300">{g.label}{g.id === "texture" ? " · layer on top of any look" : ""}</Eyebrow>
          <div className="grid grid-cols-5 gap-x-3 gap-y-4 lg:grid-cols-6">{inGroup(g.id).map(swatch)}</div>
        </div>
      ))}
    </div>
  );
}

/* ── frame: overlays (+ fill-in licence) ──────────────────────────── */
function FrameTiles({ designs, selectedDesign, setSelectedDesign, className, tileClass, tileRefs, onOpenStudio }) {
  return (
    <div className={className}>
      {onOpenStudio && (
        <button onClick={onOpenStudio} className={`studio-tile studio-tile-make snap-start flex-col ${tileClass}`}>
          <span className="studio-tile-make-plus">+</span>
          <span className="text-[11px] font-semibold leading-tight text-pink-600">make your own</span>
        </button>
      )}
      {designs.map((design) => {
        const on = selectedDesign?.key === design.key;
        return (
          <button
            key={design.key}
            ref={(el) => { if (tileRefs) tileRefs.current[design.key] = el; }}
            onClick={() => setSelectedDesign(design)}
            className={`studio-tile snap-start ${tileClass} ${on ? "is-on" : ""}`}
          >
            <img src={design.url} alt={design.key} loading="lazy" draggable={false} />
            {frameMappings[design.key]?.textFields && <span className="studio-tile-tag">✍️ fill in</span>}
            {design.custom && <span className="studio-tile-tag">✦ yours</span>}
            {on && <span className="studio-tile-check">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

function FrameTab({ designs, selectedDesign, setSelectedDesign, frameText, setFrameText, compact, onOpenLicense, onOpenStudio }) {
  const tileRefs = useRef({});
  const firstFillIn = designs.find((d) => frameMappings[d.key]?.textFields);
  const mapping = frameMappings[selectedDesign?.key];
  const tall = isTallLayout(designs.filter((d) => !d.custom).length ? designs.filter((d) => !d.custom) : designs);
  const jumpToLicense = () => {
    setSelectedDesign(firstFillIn);
    tileRefs.current[firstFillIn.key]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  if (compact) {
    const filled = mapping?.textFields?.filter((f) => (frameText[f.id] || "").trim()).length || 0;
    return (
      <div>
        <FrameTiles
          designs={designs}
          selectedDesign={selectedDesign}
          setSelectedDesign={setSelectedDesign}
          tileRefs={tileRefs}
          onOpenStudio={onOpenStudio}
          className={`studio-scroll -mx-4 grid snap-x grid-flow-col gap-2.5 overflow-x-auto px-4 pt-1.5 pb-2 ${tall ? "auto-cols-[19%]" : "auto-cols-[31%]"}`}
          tileClass={`!rounded-[14px] !p-1.5 ${tall ? "h-[104px]" : "h-[76px]"}`}
        />
        {mapping?.textFields ? (
          <button onClick={onOpenLicense} className="studio-license-cta mt-1">
            <span className="text-base">🪪</span>
            <span className="flex-1 text-left">
              <span className="block text-[13px] font-semibold text-pink-600">{filled ? "edit your license" : "fill in your license"}</span>
              <span className="block text-[10px] text-pink-400">{filled}/{mapping.textFields.length} filled · name, birthday, signature</span>
            </span>
            <span className="text-pink-300">→</span>
          </button>
        ) : firstFillIn ? (
          <button onClick={jumpToLicense} className="studio-chip mt-1 !py-1 !text-[11px]">✍️ try a fill-in license</button>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <Eyebrow>pick a frame · {designs.length}</Eyebrow>
        {firstFillIn && !mapping?.textFields && (
          <button className="studio-chip -mt-2" onClick={jumpToLicense}>✍️ fill-in licenses</button>
        )}
      </div>
      {mapping?.textFields && (
        <div className="mb-5">
          <LicenseForm
            fields={mapping.textFields}
            theme={mapping.formTheme}
            values={frameText}
            onChange={(id, value) => setFrameText((t) => ({ ...t, [id]: value }))}
          />
        </div>
      )}
      <FrameTiles
        designs={designs}
        selectedDesign={selectedDesign}
        setSelectedDesign={setSelectedDesign}
        tileRefs={tileRefs}
        onOpenStudio={onOpenStudio}
        className={`grid gap-3 ${tall ? "grid-cols-4 lg:grid-cols-5" : "grid-cols-2 lg:grid-cols-3"}`}
        tileClass={tall ? "h-48" : "h-32"}
      />
    </div>
  );
}

/* ── save: format + extras ────────────────────────────────────────── */
function SaveTab({ downloadType, setDownloadType, isDownloading, extra, compact }) {
  return (
    <div>
      {!compact && <Eyebrow>save as</Eyebrow>}
      <div className={`grid grid-cols-3 ${compact ? "gap-2" : "gap-2.5"}`}>
        {FORMATS.map((f) => (
          <button
            key={f.id}
            disabled={isDownloading}
            onClick={() => setDownloadType(f.id)}
            className={`studio-format ${compact ? "!flex-row !items-center !gap-2 !px-2.5 !py-2" : ""} ${downloadType === f.id ? "is-on" : ""}`}
          >
            <span className={`studio-format-icon ${compact ? "!mb-0 !h-7 !w-7 shrink-0" : ""}`}>{f.icon}</span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[12px] font-semibold leading-tight">{compact ? f.short : f.title}</span>
              <span className={`truncate text-[10px] leading-tight opacity-60 ${compact ? "hidden" : ""}`}>{f.sub}</span>
            </span>
          </button>
        ))}
      </div>
      {extra && <div className={compact ? "mt-2.5" : "mt-5"}>{extra}</div>}
    </div>
  );
}

/* ── phone: licence form in its own sheet ─────────────────────────── */
function LicenseSheet({ mapping, frameText, setFrameText, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end" role="dialog" aria-label="Fill in your license">
      <button className="studio-backdrop absolute inset-0" onClick={onClose} aria-label="Close" />
      <div className="studio-panel studio-sheet-in relative w-full rounded-t-[28px] px-4 pt-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mb-1 flex justify-center"><span className="h-1.5 w-10 rounded-full bg-pink-300/70" /></div>
        <LicenseForm
          fields={mapping.textFields}
          theme={mapping.formTheme}
          values={frameText}
          onChange={(id, value) => setFrameText((t) => ({ ...t, [id]: value }))}
        />
        <button className="studio-save mt-4 w-full" onClick={onClose}>done ♡</button>
      </div>
    </div>
  );
}

export default function StudioPanel(props) {
  const {
    tab, setTab,
    images, photoFilters, setPhotoFilters, filterTarget, setFilterTarget,
    designs, selectedDesign, setSelectedDesign, frameText, setFrameText,
    downloadType, setDownloadType, isDownloading, onSave, onRetake,
    extra, sheetRef, topRef, onOpenStudio,
  } = props;
  const narrow = useIsNarrow();
  const [licenseOpen, setLicenseOpen] = useState(false);
  const tabIdx = Math.max(0, TABS.findIndex((t) => t.id === tab));
  const format = FORMATS.find((f) => f.id === downloadType) || FORMATS[0];
  const mapping = frameMappings[selectedDesign?.key];

  const body = (compact) => (
    <>
      {tab === "mood" && (
        <MoodTab images={images} photoFilters={photoFilters} setPhotoFilters={setPhotoFilters} target={filterTarget} setTarget={setFilterTarget} compact={compact} />
      )}
      {tab === "frame" && (
        <FrameTab designs={designs} selectedDesign={selectedDesign} setSelectedDesign={setSelectedDesign} frameText={frameText} setFrameText={setFrameText} compact={compact} onOpenLicense={() => setLicenseOpen(true)} onOpenStudio={onOpenStudio} />
      )}
      {tab === "save" && (
        <SaveTab downloadType={downloadType} setDownloadType={setDownloadType} isDownloading={isDownloading} extra={extra} compact={compact} />
      )}
    </>
  );

  const saveButton = (cls) => (
    <button onClick={onSave} disabled={!selectedDesign || isDownloading} className={`studio-save ${cls}`}>
      {isDownloading
        ? <span className="flex items-center justify-center gap-2"><span className="studio-spinner" /> saving…</span>
        : <span>save {narrow ? "" : `${format.title.toLowerCase()} `}♡</span>}
    </button>
  );

  /* ── phone ── */
  if (narrow) {
    return (
      <>
        <div ref={topRef} className="fixed inset-x-0 top-0 z-50 flex items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
          <button onClick={onRetake} className="studio-iconbtn" aria-label="Retake">{Icon.retake("h-[18px] w-[18px]")}</button>
          <h2 className="flex-1 text-center font-pacifico text-[22px] leading-none text-white drop-shadow-[0_2px_6px_rgba(219,39,119,0.45)]">
            your strip <span className="text-sm">✦</span>
          </h2>
          {saveButton("!px-5 !py-2.5 !text-sm")}
        </div>

        <div ref={sheetRef} className="studio-dock fixed inset-x-0 bottom-0 z-50">
          <div key={tab} className="studio-body px-4 pt-3 pb-2">{body(true)}</div>
          <nav className="studio-tabbar grid grid-cols-3 px-6 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-0.5 py-1 text-[11px] font-semibold transition-colors ${tab === t.id ? "text-pink-600" : "text-pink-300"}`}
              >
                <span className={`studio-tabbar-icon ${tab === t.id ? "is-on" : ""}`}>{Icon[t.id]("h-[18px] w-[18px]")}</span>
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {licenseOpen && mapping?.textFields && (
          <LicenseSheet mapping={mapping} frameText={frameText} setFrameText={setFrameText} onClose={() => setLicenseOpen(false)} />
        )}
      </>
    );
  }

  /* ── widescreen ── */
  return (
    <div className="relative z-10 w-[440px] shrink-0 lg:w-[540px]">
      <div className="studio-panel flex h-[min(88vh,820px)] flex-col rounded-[30px]">
        <div className="px-6 pt-6 lg:px-7">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-pacifico text-[28px] leading-none text-pink-500 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
              your strip <span className="align-top text-base text-pink-300">✦</span>
            </h2>
            <button onClick={onRetake} className="flex items-center gap-1 text-xs font-semibold text-pink-400 transition hover:text-pink-600">
              {Icon.retake("h-3.5 w-3.5")} retake
            </button>
          </div>
          <div className="studio-tabs relative grid grid-cols-3" role="tablist">
            <span className="studio-tabs-thumb" style={{ transform: `translateX(${tabIdx * 100}%)` }} aria-hidden />
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`relative z-[1] flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold transition-colors ${tab === t.id ? "text-pink-600" : "text-pink-400/80 hover:text-pink-500"}`}
              >
                {Icon[t.id]()}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div key={tab} className="studio-scroll studio-body min-h-0 flex-1 overflow-y-auto px-6 pt-5 pb-4 lg:px-7">{body(false)}</div>

        <div className="studio-footer flex items-center gap-3 px-6 pt-3 pb-5 lg:px-7">
          {tab !== "save" ? (
            <button onClick={() => setTab(TABS[tabIdx + 1].id)} className="rounded-full px-4 py-3 text-sm font-semibold text-pink-500 transition hover:bg-pink-50">
              next: {TABS[tabIdx + 1].label} →
            </button>
          ) : <span className="text-[11px] leading-tight text-pink-300">saved to your downloads</span>}
          {saveButton("ml-auto flex-1")}
        </div>
      </div>
    </div>
  );
}
