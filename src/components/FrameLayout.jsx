import { useEffect, useRef, useState } from "react";
import { fitFontSize, fieldFont, ensureFrameFonts } from "./frameText";

const DEVELOP_MS = 8000; // time to develop on its own
const DEVELOP_MS_REDUCED = 2500; // gentler, shorter fade when the device asks for reduced motion
const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Instant-film style develop: starts as a murky blank and slowly reveals the photo.
// Shaking the phone (or tapping the photo) speeds it up.
function useDevelop(active, onDeveloped) {
  const [progress, setProgress] = useState(active ? 0 : 1);
  const boost = useRef(0);
  const doneCb = useRef(onDeveloped);
  doneCb.current = onDeveloped;

  useEffect(() => {
    if (!active) {
      setProgress(1);
      return;
    }
    let raf;
    let last = performance.now();
    let p = 0;
    const tick = (now) => {
      p = Math.min(1, p + (now - last) / (reducedMotion ? DEVELOP_MS_REDUCED : DEVELOP_MS) + boost.current);
      boost.current = 0;
      last = now;
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        navigator.vibrate?.(40);
        doneCb.current?.();
      }
    };
    raf = requestAnimationFrame(tick);

    let lastShake = 0;
    const onMotion = (e) => {
      const a = e.acceleration?.x != null ? e.acceleration : e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      // with gravity included, resting is ~9.8, so use a higher threshold
      const threshold = e.acceleration?.x != null ? 8 : 20;
      const now = performance.now();
      if (mag > threshold && now - lastShake > 120) {
        lastShake = now;
        boost.current += 0.05;
        navigator.vibrate?.(8);
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("devicemotion", onMotion);
    };
  }, [active]);

  const nudge = async () => {
    // iOS needs permission for motion events; ask on the first tap
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission().catch(() => {});
    }
    boost.current += 0.07;
  };
  const skip = () => { boost.current += 1; };

  return { progress, nudge, skip };
}

export default function FrameLayout({ images, mapping, filters, textValues, develop = false, onDeveloped }) {
  const [, setFontsReady] = useState(false);
  useEffect(() => { ensureFrameFonts().then(() => setFontsReady(true)); }, []);
  const { progress, nudge, skip } = useDevelop(develop, onDeveloped);

  if (!mapping) return null;
  const { frame, frameWidth, frameHeight, windows, textFields } = mapping;
  const developing = progress < 1;
  const eased = progress * progress * (3 - 2 * progress);
  const developFilter = developing
    ? ` sepia(${(1 - eased) * 0.7}) saturate(${0.3 + 0.7 * eased}) contrast(${0.6 + 0.4 * eased}) brightness(${0.75 + 0.25 * eased}) blur(${(1 - eased) * 3}px)`
    : "";

  return (
    <div
      className="max-w-[65vw] sm:max-w-[250px] md:max-w-full shadow-sm"
      style={{
        position: "relative",
        width: `${frameWidth}px`,
        aspectRatio: `${frameWidth} / ${frameHeight}`,
        background: "transparent",
        margin: "0 auto",
        containerType: "inline-size",
        cursor: developing ? "pointer" : undefined,
      }}
      onClick={developing ? nudge : undefined}
      onDoubleClick={developing ? skip : undefined}
    >
      {windows.map((win, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            left: `${(win.left / frameWidth) * 100}%`,
            top: `${(win.top / frameHeight) * 100}%`,
            width: `${(win.width / frameWidth) * 100}%`,
            height: `${(win.height / frameHeight) * 100}%`,
            overflow: "hidden",
            borderRadius: win.borderRadius || 0,
            zIndex: 5,
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {images[idx] && (
            <img
              src={images[idx]}
              alt={`Photo ${idx + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: win.objectFit || "cover",
                objectPosition: "center",
                display: "block",
                filter: ((filters && filters[idx]) || "") + developFilter || "none",
              }}
            />
          )}
          {developing && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                // murky blue-grey-brown of undeveloped instant film
                background: "radial-gradient(ellipse at 50% 40%, #6b6a5c 0%, #4a4a42 55%, #34332e 100%)",
                opacity: 1 - eased,
              }}
            />
          )}
          {developing && idx === 0 && (
            // hint written on the developing film itself; fades out as the photo appears
            <div
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center select-none"
              style={{
                opacity: Math.max(0, 1 - eased * 1.8),
                color: "rgba(255,255,255,0.92)",
                textShadow: "0 1px 6px rgba(0,0,0,0.35)",
                fontSize: `${(win.width / frameWidth) * 100 * 0.085}cqw`,
                gap: "0.35em",
              }}
            >
              {isTouch ? (
                <svg className="develop-phone" width="1.6em" height="1.6em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                  <rect x="7" y="2.5" width="10" height="19" rx="2.4" />
                  <path d="M11 18.5h2" />
                  <path d="M3.5 9c-.8 1.9-.8 4.1 0 6M20.5 9c.8 1.9.8 4.1 0 6" opacity="0.7" />
                </svg>
              ) : (
                <span aria-hidden style={{ fontSize: "1.3em", lineHeight: 1 }}>✦</span>
              )}
              <span style={{ fontFamily: "'Homemade Apple', cursive", fontSize: "1.15em", lineHeight: 1.5 }}>
                {isTouch ? "shake me" : "tap to develop"}
              </span>
              <span
                className="develop-dots"
                style={{ fontFamily: "'Special Elite', monospace", fontSize: "0.5em", letterSpacing: "0.25em", textTransform: "uppercase", opacity: 0.75 }}
              >
                developing
              </span>
              <span style={{ fontFamily: "'Special Elite', monospace", fontSize: "0.42em", letterSpacing: "0.15em", opacity: 0.55, marginTop: "0.6em" }}>
                {isTouch ? "double-tap to skip" : "double-click to skip"}
              </span>
            </div>
          )}
        </div>
      ))}
      <img
        src={frame}
        alt="Frame Overlay"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 10,
          display: "block"
        }}
        draggable={false}
      />
      {textFields?.map((field) => {
        const text = (textValues?.[field.id] || "").trim();
        if (!text) return null;
        return (
          <span
            key={field.id}
            style={{
              position: "absolute",
              left: `${(field.x / frameWidth) * 100}%`,
              top: `${(field.y / frameHeight) * 100}%`,
              width: `${(field.width / frameWidth) * 100}%`,
              transform: "translateY(-50%)",
              fontFamily: fieldFont(field),
              fontSize: `${(fitFontSize(text, field) / frameWidth) * 100}cqw`,
              lineHeight: 1.2,
              color: field.color || "#1f2a44",
              textAlign: field.align || "left",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 11,
            }}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}
