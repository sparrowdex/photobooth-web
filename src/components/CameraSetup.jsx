import React, { useRef, useState, useEffect } from "react";
import { Camera } from "react-camera-pro";
import BackButton from "./BackButton";
import { useTheme } from "./ThemeContext";
import { STICKERS, loadFaceLandmarker, coverCrop, drawFaces, stickerThumbs } from "./faceStickers";

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
  const { colors } = useTheme();
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
  const [stickerStatus, setStickerStatus] = useState("idle"); // idle | loading | ready | error
  const thumbs = stickerThumbs();
  stickerRef.current = sticker;

  const isLandscape = useLandscape();
  const isMobile = useIsMobile();

  // Set camera size on mount and resize
  useEffect(() => {
    const updateCameraSize = () => {
      const width = Math.min(window.innerWidth * 0.95, 640);
      const height = Math.round(width * 0.75); // 4:3 aspect ratio
      setCameraSize({ width, height });
    };
    
    updateCameraSize();
    window.addEventListener('resize', updateCameraSize);
    return () => window.removeEventListener('resize', updateCameraSize);
  }, []);

  // Face tracking + sticker preview loop (only runs while a sticker is picked)
  useEffect(() => {
    const overlay = overlayRef.current;
    const clear = () => { if (overlay) overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height); };
    if (sticker === "none") { clear(); facesRef.current = []; return; }
    let alive = true, raf = 0, landmarker = null, lastVideoTime = -1;
    setStickerStatus((st) => (st === "ready" ? st : "loading"));
    const tick = () => {
      if (!alive) return;
      const video = camBoxRef.current?.querySelector("video");
      if (landmarker && video && video.readyState >= 2 && video.videoWidth) {
        const now = performance.now();
        if (video.currentTime !== lastVideoTime) {
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
                numFrames: 10,
                frameDuration: 0.2,
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

  // Handler to start session
  const handleStartSession = () => {
    setStep("preview");
  };

  // Handler to start countdown for each shot
  const handleStartCountdown = () => {
    setCountdown(3);
    setStep("countdown");
  };

  // Camera container style
  let cameraContainerStyle = {
    width: cameraSize.width,
    height: cameraSize.height,
    position: "relative",
    background: "transparent",
    borderRadius: "12px",
    overflow: "hidden"
  };
  // On mobile portrait, let the camera fill the container width and use a tall 3:4 aspect ratio
  if (isMobile && !isLandscape) {
    cameraContainerStyle = {
      width: "100%",
      maxWidth: "calc(48svh * 0.75)",
      aspectRatio: "3 / 4",
      position: "relative",
      background: "transparent",
      borderRadius: "12px",
      overflow: "hidden",
      margin: "0 auto",
    };
  }

  const backgroundImage = isMobile && !isLandscape
    ? "url('./images/customize_bg.webp')"
    : "url('./images/strip_design_wide.webp')";

  return (
    <div className="flex flex-col items-center relative w-full min-h-[100svh] bg-transparent overflow-x-hidden py-4 md:py-8 px-2 md:px-4">
      {/* Background Image Overlay */}
      <div
        className="absolute inset-0 w-full h-full bg-center bg-cover bg-no-repeat z-0 pointer-events-none"
        style={{ backgroundImage }}
      ></div>

      {/* Orientation Prompt */}
      {/* Removed: Landscape mode disclaimer */}

      {/* Floating Help Circle */}
      {!showInstructions && (
        <div
          className="fixed bottom-8 right-8 z-50 cursor-pointer transition-transform hover:scale-110"
          onClick={() => setShowInstructions(true)}
          style={{
            width: 60,
            height: 60,
            background: 'radial-gradient(circle at 30% 30%, #f472b6, #a21caf)',
            borderRadius: '50%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="How to use the photobooth"
        >
          <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
      )}

      {/* Instruction Card */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in">
            <button
              className={`absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl`}
              onClick={() => setShowInstructions(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className={`text-2xl font-bold mb-4 text-gray-800`}>How to Use the Photobooth</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Click <b>Start Photo Session</b> to begin.</li>
              <li>Follow the countdown and pose for each shot.</li>
              <li>Make sure you are centered when posing for pictures.</li>
              <li>After all photos are taken, choose your strip design or retake if needed.</li>
              <li>Use the <b>Retake</b> button to restart the session at any time.</li>
              <li>For the best look, layer your favorite filters on top of the <b>Soft Focus</b> filter, especially if your device has a high-resolution camera.</li>
            </ul>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl flex flex-col items-center relative z-10">
        <BackButton className="mb-2 md:mb-4 self-start md:absolute md:top-8 md:left-8 z-10" onClick={onBack}>
          Go Back
        </BackButton>

        <div className="relative w-full flex flex-col items-center mt-4 md:mt-8">
          <div className={`mb-3 md:mb-6 text-xl md:text-4xl font-pacifico font-bold ${colors.text} drop-shadow-sm`}>
            {step === "done"
              ? "All Photos Captured!"
              : step === "start"
                ? "Ready to Start?"
                : `Photo ${captured.length + 1} of ${shots}`}
          </div>

          {/* Camera Container */}
          <div className="mb-3 md:mb-6 flex justify-center w-full">
            <div 
              ref={camBoxRef}
              style={cameraContainerStyle}
              className="shadow-inner bg-black ring-4 ring-white ring-opacity-60 rounded-xl overflow-hidden relative"
            >
              <Camera
                ref={cameraRef}
                aspectRatio={isMobile && !isLandscape ? 3 / 4 : 4 / 3}
                facingMode={facingMode}
                numberOfCamerasCallback={setNumberOfCameras}
                errorMessages={{
                  noCameraAccessible: "No camera device accessible.",
                  permissionDenied: "Permission denied. Please refresh and give camera permission.",
                  switchCamera: "Unable to switch camera.",
                  canvas: "Canvas is not supported."
                }}
              />
              
              {/* Face sticker preview (mirrored like the video for the front camera) */}
              <canvas
                ref={overlayRef}
                className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
                style={{ transform: facingMode === "user" ? "rotateY(180deg)" : "none" }}
              />

              {/* Viewfinder brackets */}
              {step !== "start" && step !== "done" && (
                 <div className="absolute inset-4 md:inset-8 pointer-events-none z-10 opacity-70">
                 <div className="absolute top-0 left-0 w-8 md:w-16 h-8 md:h-16 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                 <div className="absolute top-0 right-0 w-8 md:w-16 h-8 md:h-16 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                 <div className="absolute bottom-0 left-0 w-8 md:w-16 h-8 md:h-16 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                 <div className="absolute bottom-0 right-0 w-8 md:w-16 h-8 md:h-16 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                </div>
              )}

              {/* Countdown Overlay */}
              {step === "countdown" && countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-20 backdrop-blur-sm">
                  <span className="text-white text-8xl md:text-9xl font-bold drop-shadow-2xl animate-ping">{countdown}</span>
                </div>
              )}

              {/* Flip Camera Button */}
              {step !== "done" && numberOfCameras > 1 && (
                <button
                  className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-2 sm:p-3 bg-black bg-opacity-30 backdrop-blur-md rounded-full text-white hover:bg-opacity-50 transition-all shadow-lg focus:outline-none"
                  onClick={() => {
                    if (cameraRef.current) {
                      setFacingMode(cameraRef.current.switchCamera());
                    }
                  }}
                  title="Flip Camera"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Face sticker picker */}
          {step !== "done" && (
            <div className="mb-4 w-full max-w-xl md:mb-6">
              <div className="mb-1.5 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-pink-500/90">
                <span>face charms</span>
                {sticker !== "none" && stickerStatus === "loading" && <span className="normal-case tracking-normal text-pink-400">· waking up the magic…</span>}
                {sticker !== "none" && stickerStatus === "error" && <span className="normal-case tracking-normal text-rose-500">· couldn't load (offline?)</span>}
              </div>
              <div className="studio-scroll flex justify-start gap-2.5 overflow-x-auto px-2 pb-1 sm:justify-center">
                {STICKERS.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSticker(st.id)}
                    disabled={step === "countdown"}
                    className={`facecharm ${sticker === st.id ? "is-on" : ""}`}
                    aria-label={`${st.name} face charm`}
                    title={st.name}
                  >
                    {st.id === "none" ? (
                      <span className="text-lg text-pink-400">⌀</span>
                    ) : (
                      <img src={thumbs[st.id]} alt="" draggable={false} />
                    )}
                    {sticker === st.id && st.id !== "none" && stickerStatus === "loading" && <span className="facecharm-spin" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start Photo Session button */}
          {step === "start" && (
            <button
              className={`px-6 py-3 md:px-10 md:py-4 ${colors.button} text-white rounded-full shadow-lg transition-transform hover:scale-105 text-lg md:text-xl font-semibold`}
              onClick={handleStartSession}
            >
              Start Photo Session
            </button>
          )}

          {/* Take Photo button for each shot */}
          {step === "preview" && captured.length < shots && (
            <button
              className={`px-6 py-3 md:px-10 md:py-4 ${colors.button} text-white rounded-full shadow-lg transition-transform hover:scale-105 text-lg md:text-xl font-semibold`}
              onClick={handleStartCountdown}
            >
              Take Photo
            </button>
          )}

          {/* Slots UI */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-6 mt-4 md:mt-8 w-full">
            {Array.from({ length: shots }).map((_, i) =>
              captured[i] ? (
                <div key={i} className="flex flex-col items-center relative group">
                  <img
                    src={captured[i].photo}
                    alt={`Shot ${i + 1}`}
                    className="w-14 h-20 sm:w-20 sm:h-28 md:w-28 md:h-36 object-cover rounded-xl shadow-md border-2 border-white"
                  />
                  {captured[i].gif && (
                    <img
                      src={captured[i].gif}
                      alt={`GIF ${i + 1}`}
                      className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 object-cover rounded-lg shadow-sm border-2 border-white absolute -bottom-2 -right-2 bg-white"
                    />
                  )}
                </div>
              ) : (
                <div
                  key={i}
                  className={`w-14 h-20 sm:w-20 sm:h-28 md:w-28 md:h-36 rounded-xl border-4 border-dashed ${colors.borderLight} flex items-center justify-center ${colors.textSecondary} text-xl sm:text-2xl md:text-3xl font-bold opacity-70 bg-white bg-opacity-40 shadow-inner`}
                >
                  {i + 1}
                </div>
              )
            )}
          </div>

          {/* Retake/Choose Strip Design after all photos */}
          {step === "done" && (
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-4 md:mt-8">
              <button
                className={`px-6 py-3 md:px-8 md:py-4 ${colors.buttonSecondary} rounded-full shadow transition-transform hover:scale-105 text-base md:text-lg font-semibold`}
                onClick={handleStartOrRetake}
              >
                Retake
              </button>
              <button
                className={`px-6 py-3 md:px-8 md:py-4 ${colors.button} text-white rounded-full shadow-lg transition-transform hover:scale-105 text-base md:text-lg font-semibold disabled:opacity-50 disabled:cursor-wait disabled:hover:scale-100`}
                onClick={() => onDone(captured)}
                disabled={captured.some(c => !c.gif)}
              >
                {captured.some(c => !c.gif) ? "Processing GIFs..." : "Choose Strip Design"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
