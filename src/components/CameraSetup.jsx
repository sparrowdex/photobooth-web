import React, { useRef, useState, useEffect } from "react";
import { Camera } from "react-camera-pro";
import { STICKERS, loadFaceLandmarker, coverCrop, drawFaces, stickerThumbs } from "./faceStickers";
import { countBeep, shutterSound, unlockSound } from "./boothSounds";
import "@fontsource/press-start-2p/400.css";

// Orientation detection using Screen Orientation API (with fallback)
function useLandscape() {
  const getIsPortrait = () => {
    if (window.screen.orientation && window.screen.orientation.type) {
      return window.screen.orientation.type.startsWith("portrait");
    }
    return window.innerHeight > window.innerWidth;
  };

  const [isPortrait, setIsPortrait] = useState(getIsPortrait());

  useEffect(() => {
    function updateOrientation() {
      setIsPortrait(getIsPortrait());
    }
    window.addEventListener("orientationchange", updateOrientation);
    window.addEventListener("resize", updateOrientation);
    return () => {
      window.removeEventListener("orientationchange", updateOrientation);
      window.removeEventListener("resize", updateOrientation);
    };
  }, []);

  return !isPortrait; // returns true if landscape
}

// Helper: detect mobile device
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof navigator === "undefined") return false;
    return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  });
  useEffect(() => {
    const check = () => {
      setIsMobile(/Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent));
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function CameraSetup({ layout, onBack, onDone }) {
  const shots = layout?.shots || 1;
  const cameraRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [captured, setCaptured] = useState([]);
  const [step, setStep] = useState("start"); // 'start', 'preview', 'countdown', 'done'
  const [showInstructions, setShowInstructions] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [cameraSize, setCameraSize] = useState({ width: 640, height: 480 });
  const [facingMode, setFacingMode] = useState("user");
  const [numberOfCameras, setNumberOfCameras] = useState(0);

  // live face stickers
  const camBoxRef = useRef(null);      // the camera container (same box react-camera-pro crops to)
  const overlayRef = useRef(null);     // preview canvas over the video
  const facesRef = useRef([]);         // latest face landmarks
  const stickerRef = useRef("none");
  const compositeRef = useRef(null);   // { canvas, ctx } while recording a GIF with stickers
  const [sticker, setSticker] = useState("none");
  const [timerSec, setTimerSec] = useState(3);
  const [flash, setFlash] = useState(false);
  const [viewShot, setViewShot] = useState(null); // index of the shot open in the viewer
  const [soundOn, setSoundOn] = useState(() => { try { return localStorage.getItem("photobooth.sound") !== "off"; } catch { return true; } });
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;
  const toggleSound = () => setSoundOn((on) => {
    try { localStorage.setItem("photobooth.sound", on ? "off" : "on"); } catch { /* ignore */ }
    if (!on) unlockSound();
    return !on;
  });
  const [stickerStatus, setStickerStatus] = useState("idle"); // idle | loading | ready | error
  const thumbs = stickerThumbs();
  stickerRef.current = sticker;

  const isLandscape = useLandscape();
  const isMobile = useIsMobile();

  // Size the viewfinder from what's actually on screen: everything else (top bar, booth
  // frame, charms, prints + controls) is measured, and the camera gets the rest.
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const boothRef = useRef(null);
  const charmsRef = useRef(null);
  useEffect(() => {
    const update = () => {
      const portrait = isMobile && !isLandscape;
      const aspect = portrait ? 3 / 4 : 4 / 3;
      const win = camBoxRef.current, booth = boothRef.current;
      const chromeH = booth && win ? booth.offsetHeight - win.offsetHeight : 70;
      const chromeW = booth && win ? booth.offsetWidth - win.offsetWidth : 36;
      const headerH = headerRef.current?.offsetHeight || 44;
      const footerH = footerRef.current?.offsetHeight || 170;
      const charms = charmsRef.current;
      const charmsH = portrait && charms ? charms.offsetHeight + 10 : 0;
      const charmsW = !portrait && charms ? charms.offsetWidth + 16 : 0;
      const pads = 12 + 16 + 20 + 12; // page padding + main padding + footer gap
      const maxH = window.innerHeight - headerH - footerH - chromeH - charmsH - pads;
      const maxW = window.innerWidth - 24 - chromeW - charmsW;
      const width = Math.round(Math.max(200, Math.min(maxW, maxH * aspect, portrait ? 560 : 1000)));
      setCameraSize((prev) => {
        const next = { width, height: Math.round(width / aspect) };
        return prev.width === next.width && prev.height === next.height ? prev : next;
      });
    };
    update();
    const ro = new ResizeObserver(update);
    [headerRef, footerRef].forEach((r) => r.current && ro.observe(r.current));
    window.addEventListener("resize", update);
    return () => { ro.disconnect(); window.removeEventListener("resize", update); };
  }, [isMobile, isLandscape, step]);

  // Face tracking + sticker preview loop (only runs while a sticker is picked)
  useEffect(() => {
    const overlay = overlayRef.current;
    const clear = () => { if (overlay) overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height); };
    if (sticker === "none") { clear(); facesRef.current = []; return; }
    let alive = true, raf = 0, landmarker = null, lastVideoTime = -1, lastDetect = 0;
    setStickerStatus((st) => (st === "ready" ? st : "loading"));
    const tick = () => {
      if (!alive) return;
      const video = camBoxRef.current?.querySelector("video");
      if (landmarker && video && video.readyState >= 2 && video.videoWidth) {
        const now = performance.now();
        const gap = compositeRef.current ? 66 : 33; // ~15 fps while a GIF records, ~30 otherwise
        if (video.currentTime !== lastVideoTime && now - lastDetect >= gap) {
          lastDetect = now;
          lastVideoTime = video.currentTime;
          try { facesRef.current = landmarker.detectForVideo(video, now).faceLandmarks || []; } catch { /* skip frame */ }
        }
        const vw = video.videoWidth, vh = video.videoHeight;
        // live preview, drawn in the crop the camera box shows
        const box = camBoxRef.current;
        if (overlay && box) {
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const cw = Math.round(box.offsetWidth * dpr), ch = Math.round(box.offsetHeight * dpr);
          if (overlay.width !== cw || overlay.height !== ch) { overlay.width = cw; overlay.height = ch; }
          const crop = coverCrop(vw, vh, cw, ch);
          const ctx = overlay.getContext("2d");
          ctx.clearRect(0, 0, cw, ch);
          drawFaces(ctx, stickerRef.current, facesRef.current, vw, vh, { sX: crop.sX, sY: crop.sY, k: cw / crop.sW }, now);
        }
        // GIF recording with stickers: full raw frame + stickers
        const comp = compositeRef.current;
        if (comp) {
          comp.ctx.drawImage(video, 0, 0, comp.canvas.width, comp.canvas.height);
          drawFaces(comp.ctx, stickerRef.current, facesRef.current, vw, vh, { sX: 0, sY: 0, k: comp.canvas.width / vw }, now);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    loadFaceLandmarker()
      .then((l) => { if (!alive) return; landmarker = l; setStickerStatus("ready"); })
      .catch((e) => { console.error("face stickers unavailable", e); if (alive) setStickerStatus("error"); });
    raf = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(raf); clear(); };
  }, [sticker]);

  // Bake the stickers into a captured photo (same crop as react-camera-pro's takePhoto)
  const addStickersToPhoto = async (photo) => {
    const video = camBoxRef.current?.querySelector("video");
    const box = camBoxRef.current;
    if (stickerRef.current === "none" || !facesRef.current.length || !video || !box) return photo;
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = photo; });
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const vw = video.videoWidth, vh = video.videoHeight;
    const crop = coverCrop(vw, vh, box.offsetWidth, box.offsetHeight);
    drawFaces(ctx, stickerRef.current, facesRef.current, vw, vh, { sX: crop.sX, sY: crop.sY, k: img.width / crop.sW });
    return c.toDataURL("image/jpeg", 0.92);
  };

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0 && soundRef.current) countBeep(countdown);
    if (countdown === 3) {
      // Capture the correct index for this specific shot to avoid race conditions
      // where the user takes the next shot before the current GIF is done generating.
      const currentShotIndex = captured.length;
      
      const video = document.querySelector("video");
      if (video) {
        let chunks = [];
        let stream = video.captureStream ? video.captureStream() : (video.mozCaptureStream ? video.mozCaptureStream() : null);
        // with a face sticker on, record a canvas that has the stickers drawn in
        if (stickerRef.current !== "none" && stickerStatus === "ready" && video.videoWidth) {
          const canvas = document.createElement("canvas");
          const k = Math.min(1, 640 / video.videoWidth);
          canvas.width = Math.round(video.videoWidth * k); canvas.height = Math.round(video.videoHeight * k);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          compositeRef.current = { canvas, ctx };
          if (canvas.captureStream) stream = canvas.captureStream(24);
        }
        if (stream) {
          try {
            const recorder = new window.MediaRecorder(stream, { mimeType: "video/webm" });
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunks.push(e.data);
            };
            recorder.onstop = async () => {
              compositeRef.current = null;
              // Create GIF from video
              const videoBlob = new Blob(chunks, { type: "video/webm" });
              const url = URL.createObjectURL(videoBlob);
              
              // Dynamically import gifshot
              const gifshot = (await import('gifshot')).default;
              
              const gWidth = isMobile && !isLandscape ? 240 : 320;
              const gHeight = isMobile && !isLandscape ? 320 : 240;

              gifshot.createGIF({
                video: [url],
                gifWidth: gWidth,
                gifHeight: gHeight,
                numFrames: 16,
                frameDuration: 0.12,
              }, function(obj) {
                if (obj && obj.image) {
                  setCaptured((prev) => {
                    const updated = [...prev];
                    if (updated[currentShotIndex]) {
                      updated[currentShotIndex] = { ...updated[currentShotIndex], gif: obj.image };
                    }
                    return updated;
                  });
                }
                URL.revokeObjectURL(url);
              });
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
          } catch (err) {
            console.error("Failed to start MediaRecorder:", err);
          }
        }
      }
    }
    if (countdown === 0) {
      setTimeout(async () => {
        if (cameraRef.current) {
          setFlash(true);
          if (soundRef.current) shutterSound();
          setTimeout(() => setFlash(false), 450);
          navigator.vibrate?.(30);
          let photo = cameraRef.current.takePhoto();
          try { photo = await addStickersToPhoto(photo); } catch { /* keep the plain photo */ }
          setCaptured((prev) => [...prev, { photo, gif: null }]);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
          if (captured.length + 1 < shots) {
            setStep("preview");
          } else {
            setStep("done");
          }
        }
        setCountdown(null);
      }, 300);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, shots, isMobile, isLandscape, captured.length]);

  // Reset session
  const handleStartOrRetake = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    setCaptured([]);
    setStep("start");
    setCountdown(null);
  };

  useEffect(() => {
    if (viewShot === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setViewShot(null);
      if (e.key === "ArrowRight") setViewShot((i) => (i + 1) % captured.length);
      if (e.key === "ArrowLeft") setViewShot((i) => (i - 1 + captured.length) % captured.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewShot, captured.length]);

  // Shutter: start the timer for the next shot
  const handleStartCountdown = () => {
    if (soundRef.current) unlockSound();
    setCountdown(timerSec);
    setStep("countdown");
  };
  const cycleTimer = () => setTimerSec((t) => (t === 3 ? 5 : t === 5 ? 10 : 3));

  const portrait = isMobile && !isLandscape;
  const canShoot = (step === "start" || step === "preview") && captured.length < shots;
  const gifsPending = captured.some((c) => !c.gif);
  const title =
    step === "done" ? "all done ✦" : step === "start" && captured.length === 0 ? "strike a pose" : `photo ${Math.min(captured.length + 1, shots)} of ${shots}`;

  const backgroundImage = portrait
    ? "url('./images/customize_bg.webp')"
    : "url('./images/strip_design_wide.webp')";

  // the shots so far — they play as GIFs once those are ready
  const prints = (
    <div
      className={`booth-prints ${step === "done" ? "is-big" : shots > 4 ? "is-many" : ""}`}
      style={step === "done" ? undefined : { gridTemplateColumns: `repeat(${shots > 4 ? Math.ceil(shots / 2) : shots}, auto)` }}
      aria-label={`${captured.length} of ${shots} photos taken`}
    >
      {Array.from({ length: shots }).map((_, i) =>
        captured[i] ? (
          <button
            key={i}
            className="booth-print is-filled"
            style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (2 + (i % 3))}deg)` }}
            onClick={() => setViewShot(i)}
            disabled={step === "countdown"}
            aria-label={`View shot ${i + 1}`}
          >
            <img src={captured[i].gif || captured[i].photo} data-photo={captured[i].photo} alt={`Shot ${i + 1}`} />
            <span className="booth-print-tag">{captured[i].gif ? "gif" : "…"}</span>
          </button>
        ) : (
          <span key={i} className="booth-print is-empty">{i + 1}</span>
        )
      )}
    </div>
  );

  const charmPicker = step !== "done" && (
    <div
      ref={charmsRef}
      className={`booth-charms ${portrait ? "is-row" : "is-col"}`}
      style={portrait ? { width: cameraSize.width + 20 } : { maxHeight: cameraSize.height + 40 }}
      role="listbox"
      aria-label="Face charms"
    >
      {STICKERS.map((st) => (
        <button
          key={st.id}
          onClick={() => setSticker(st.id)}
          disabled={step === "countdown"}
          className={`facecharm ${sticker === st.id ? "is-on" : ""}`}
          aria-label={`${st.name} face charm`}
          aria-selected={sticker === st.id}
          title={st.name}
        >
          {st.id === "none" ? <span className="text-base text-pink-400">⌀</span> : <img src={thumbs[st.id]} alt="" draggable={false} />}
          {sticker === st.id && st.id !== "none" && stickerStatus === "loading" && <span className="facecharm-spin" />}
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative flex min-h-[100svh] w-full flex-col items-center overflow-x-hidden px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        className="pointer-events-none absolute inset-0 z-0 h-full w-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage }}
      />

      {/* How it works */}
      {showInstructions && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-label="How to use the photobooth">
          <button className="studio-backdrop absolute inset-0" onClick={() => setShowInstructions(false)} aria-label="Close" />
          <div className="studio-panel studio-sheet-in relative w-full max-w-md rounded-[28px] p-6">
            <h2 className="mb-4 font-pacifico text-2xl text-pink-500">how it works ✦</h2>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li>📸 Tap the big shutter button — the timer counts down, then it snaps.</li>
              <li>⏱ Tap the timer to switch between 3, 5 and 10 seconds.</li>
              <li>🐰 Swipe the face charms in the viewfinder and pick one (needs internet the first time).</li>
              <li>🧍 Stay centred in the frame for each shot.</li>
              <li>↺ Retake any time, then choose your strip design.</li>
              <li>✨ Tip: layer looks on top of <b>Soft Focus</b> for extra-smooth skin.</li>
            </ul>
            <button className="studio-save mt-5 w-full" onClick={() => setShowInstructions(false)}>got it ♡</button>
          </div>
        </div>
      )}

      {/* Shot viewer: the photo and its moving version side by side */}
      {viewShot !== null && captured[viewShot] && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-6" role="dialog" aria-label={`Shot ${viewShot + 1}`}>
          <button className="studio-backdrop absolute inset-0" onClick={() => setViewShot(null)} aria-label="Close" />
          <div className="studio-panel studio-sheet-in relative w-full max-w-4xl rounded-[28px] p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-pacifico text-2xl text-pink-500">shot {viewShot + 1}<span className="text-base text-pink-300"> of {captured.length}</span></h2>
              <button className="studio-iconbtn" onClick={() => setViewShot(null)} aria-label="Close viewer">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-5">
              {[
                { label: "photo", src: captured[viewShot].photo },
                { label: "moving", src: captured[viewShot].gif },
              ].map((v) => (
                <figure key={v.label} className="flex flex-col items-center gap-2">
                  <div className="shotview-frame">
                    {v.src ? (
                      <img src={v.src} alt={`Shot ${viewShot + 1} ${v.label}`} />
                    ) : (
                      <span className="flex items-center gap-2 text-sm font-semibold text-pink-500"><span className="studio-spinner !border-pink-200 !border-t-pink-500" /> developing gif…</span>
                    )}
                  </div>
                  <figcaption className="shotview-label">{v.label === "moving" ? "▶ moving" : "◼ photo"}</figcaption>
                </figure>
              ))}
            </div>
            {captured.length > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button className="booth-pill" onClick={() => setViewShot((i) => (i - 1 + captured.length) % captured.length)} aria-label="Previous shot">←</button>
                <div className="flex gap-1.5">
                  {captured.map((_, i) => (
                    <button key={i} onClick={() => setViewShot(i)} className={`h-2.5 w-2.5 rounded-sm transition ${i === viewShot ? "bg-pink-500" : "bg-pink-200 hover:bg-pink-300"}`} aria-label={`Shot ${i + 1}`} />
                  ))}
                </div>
                <button className="booth-pill" onClick={() => setViewShot((i) => (i + 1) % captured.length)} aria-label="Next shot">→</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* top bar */}
      <header ref={headerRef} className="relative z-10 grid w-full max-w-4xl grid-cols-[auto_1fr_auto] items-center gap-3">
        <button onClick={onBack} className="studio-iconbtn" aria-label="Go back">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <h1 className="text-center font-pacifico text-[26px] leading-tight text-pink-700 drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] md:text-4xl">{title}</h1>
        <button onClick={() => setShowInstructions(true)} className="studio-iconbtn text-base font-bold" aria-label="How it works">?</button>
      </header>

      <main className={`relative z-10 flex w-full flex-1 items-center justify-center py-2.5 ${portrait ? "flex-col gap-2.5" : "flex-row gap-4"}`}>
        {/* the booth */}
        <div ref={boothRef} className="booth">
          <div className="booth-top">
            <span className="booth-lens" aria-hidden />
            <span className="booth-label">PHOTO·BOOTH</span>
            <span className="booth-leds" aria-hidden>
              {Array.from({ length: shots }).map((_, i) => <span key={i} className={i < captured.length ? "is-on" : ""} />)}
            </span>
          </div>
          <div className="booth-bezel">
            <div ref={camBoxRef} className="booth-window" style={{ width: cameraSize.width, height: cameraSize.height }}>
              <Camera
                ref={cameraRef}
                aspectRatio={portrait ? 3 / 4 : 4 / 3}
                facingMode={facingMode}
                numberOfCamerasCallback={setNumberOfCameras}
                errorMessages={{
                  noCameraAccessible: "No camera device accessible.",
                  permissionDenied: "Permission denied. Please refresh and give camera permission.",
                  switchCamera: "Unable to switch camera.",
                  canvas: "Canvas is not supported."
                }}
              />

              {/* face sticker preview (mirrored like the video for the front camera) */}
              <canvas
                ref={overlayRef}
                className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
                style={{ transform: facingMode === "user" ? "rotateY(180deg)" : "none" }}
              />

              {/* viewfinder corners */}
              <div className="pointer-events-none absolute inset-3 z-10 opacity-80 md:inset-4" aria-hidden>
                <span className="booth-corner left-0 top-0 border-l-[3px] border-t-[3px]" />
                <span className="booth-corner right-0 top-0 border-r-[3px] border-t-[3px]" />
                <span className="booth-corner bottom-0 left-0 border-b-[3px] border-l-[3px]" />
                <span className="booth-corner bottom-0 right-0 border-b-[3px] border-r-[3px]" />
              </div>

              {step !== "done" && step !== "countdown" && (
                <span className="booth-live"><span className="booth-live-dot" /> live</span>
              )}
              {sticker !== "none" && stickerStatus !== "ready" && step !== "countdown" && (
                <span className={`booth-status ${stickerStatus === "error" ? "is-error" : ""}`}>
                  {stickerStatus === "error" ? "charms couldn't load (offline?)" : "waking up the magic…"}
                </span>
              )}

              {/* flip camera */}
              {step !== "done" && numberOfCameras > 1 && (
                <button
                  className="absolute left-3 bottom-3 z-20 rounded-md bg-black/30 p-2 text-white backdrop-blur-md transition hover:bg-black/45"
                  onClick={() => { if (cameraRef.current) setFacingMode(cameraRef.current.switchCamera()); }}
                  title="Flip camera"
                  aria-label="Flip camera"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              )}


              {/* countdown — 8-bit style */}
              {step === "countdown" && countdown !== null && countdown > 0 && (
                <div className="booth-countdown">
                  <span key={countdown} className="booth-count-num">{countdown}</span>
                  <div className="booth-count-bar" aria-hidden>
                    {Array.from({ length: timerSec }).map((_, i) => <span key={i} className={i < countdown ? "is-on" : ""} />)}
                  </div>
                  <span className="booth-count-label">GET READY!</span>
                </div>
              )}

              {/* flash */}
              {flash && <div className="booth-flash" aria-hidden />}
            </div>
          </div>
          <div className="booth-bottom" aria-hidden>
            <span className="booth-grille" />
            <span className="booth-tagline">★ SMILE ★</span>
            <span className="booth-grille" />
          </div>
        </div>
        {charmPicker}
      </main>

      {/* shots + controls */}
      <footer ref={footerRef} className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-3">
        {step === "done" && prints}
        {step === "done" ? (
          <div className="flex w-full items-center justify-center gap-3">
            <button className="booth-pill" onClick={handleStartOrRetake}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4.5h4.5" /></svg>
              retake
            </button>
            <button className="studio-save !px-7" onClick={() => onDone(captured)} disabled={gifsPending}>
              {gifsPending ? <span className="flex items-center gap-2"><span className="studio-spinner" /> developing gifs…</span> : "choose strip design →"}
            </button>
          </div>
        ) : (
          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="flex items-center gap-2 justify-self-start">
              <button className="booth-pill" onClick={cycleTimer} disabled={step === "countdown"} aria-label={`Timer ${timerSec} seconds`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></svg>
                {timerSec}s
              </button>
              <button className="booth-pill !px-3" onClick={toggleSound} aria-label={soundOn ? "Sound on" : "Sound off"} title={soundOn ? "sound on" : "sound off"}>
                {soundOn ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M17 9l5 6M22 9l-5 6" /></svg>
                )}
              </button>
              {captured.length > 0 && (
                <button className="booth-pill !px-3" onClick={handleStartOrRetake} disabled={step === "countdown"} aria-label="Redo all shots" title="redo">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4.5h4.5" /></svg>
                </button>
              )}
            </div>
            <button className="booth-shutter" onClick={handleStartCountdown} disabled={!canShoot} aria-label="Take photo">
              <span />
            </button>
            <div className="justify-self-end">{prints}</div>
          </div>
        )}
      </footer>
    </div>
  );
}
