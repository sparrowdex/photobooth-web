// "Application for license" slip — the fill-in form for frames with textFields.
// Styled like the license card itself: tinted paper, star border, typewriter fields on dotted lines,
// a signature line, and a rubber stamp that thuds on once everything is filled in.
const PLACEHOLDERS = {
  name: "their name",
  dob: "dd · month · yyyy",
  signature: "sign here",
};

const Stars = ({ color }) => (
  <div
    aria-hidden
    className="flex justify-between px-3 text-[9px] leading-none select-none"
    style={{ color, opacity: 0.55, letterSpacing: "0.2em" }}
  >
    {Array.from({ length: 14 }).map((_, i) => <span key={i}>★</span>)}
  </div>
);

export default function LicenseForm({ fields, theme = {}, values, onChange }) {
  const { title = "Love", paper = "#fbe3ec", edge = "#f3bfd2", ink = "#2b2f4a", stamp = "#d0487f" } = theme;
  const complete = fields.every((f) => (values[f.id] || "").trim());
  const textFields = fields.filter((f) => f.font !== "signature");
  const sigField = fields.find((f) => f.font === "signature");

  return (
    <div
      className="license-slip relative mt-5 w-full overflow-hidden rounded-[18px] py-2.5"
      style={{
        "--ink": ink,
        "--stamp": stamp,
        background: `radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.75), transparent 55%), ${paper}`,
        border: `1px solid ${edge}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 24px -10px ${edge}, 0 2px 6px rgba(219,39,119,0.12)`,
        color: ink,
        transform: "rotate(-0.6deg)",
      }}
    >
      {/* paper grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-multiply"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,0.025) 3px 4px)" }}
      />

      <Stars color={ink} />

      <div className="relative px-5 pt-3 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-pacifico text-[22px] leading-tight" style={{ color: stamp }}>make it official</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] opacity-70" style={{ fontFamily: "'Special Elite', monospace" }}>
              Application · License of {title}
            </p>
          </div>
          <span
            className="shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] uppercase tracking-widest opacity-60"
            style={{ fontFamily: "'Special Elite', monospace", borderColor: ink }}
          >
            Form ♡1
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3.5">
          {textFields.map((field) => (
            <label key={field.id} className="flex items-end gap-3">
              <span
                className="shrink-0 pb-1 text-[11px] uppercase tracking-[0.14em] opacity-75"
                style={{ fontFamily: "'Special Elite', monospace" }}
              >
                {field.label}
              </span>
              <input
                type="text"
                maxLength={32}
                value={values[field.id] || ""}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={PLACEHOLDERS[field.id] || ""}
                className="license-line min-w-0 flex-1 bg-transparent pb-1 text-[15px] outline-none"
                style={{ fontFamily: "'Special Elite', monospace", color: ink }}
              />
            </label>
          ))}

          {sigField && (
            <label className="mt-1 block">
              <div className="flex items-end gap-2">
                <span className="pb-1 text-lg leading-none opacity-60" style={{ color: ink }}>✕</span>
                <input
                  type="text"
                  maxLength={32}
                  value={values[sigField.id] || ""}
                  onChange={(e) => onChange(sigField.id, e.target.value)}
                  placeholder={PLACEHOLDERS.signature}
                  className="license-line min-w-0 flex-1 bg-transparent pb-1 text-[15px] outline-none"
                  style={{ fontFamily: "'Homemade Apple', cursive", color: sigField.color || "#1d3b8a" }}
                />
              </div>
              <span
                className="mt-1 block text-right text-[10px] uppercase tracking-[0.18em] opacity-60"
                style={{ fontFamily: "'Special Elite', monospace" }}
              >
                Signature of holder
              </span>
            </label>
          )}
        </div>

        {/* Approved stamp */}
        <div
          aria-hidden={!complete}
          className={`license-stamp pointer-events-none absolute right-3 bottom-12 ${complete ? "is-on" : ""}`}
        >
          <div className="license-stamp-inner">
            <span className="block text-[9px] tracking-[0.25em]">✦ forever ✦</span>
            <span className="block text-[17px] leading-none tracking-[0.12em]">APPROVED</span>
            <span className="block text-[9px] tracking-[0.25em]">♥ no returns ♥</span>
          </div>
        </div>
      </div>

      <Stars color={ink} />
    </div>
  );
}
