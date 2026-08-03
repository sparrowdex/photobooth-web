import { useEffect, useState, useRef } from "react";
import { useTheme } from "./ThemeContext";
import { Capacitor } from "@capacitor/core";
import WandCursor from "./WandCursor";

export default function Landing({ onStart }) {
  const { colors } = useTheme();
  const [cardHovered, setCardHovered] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [pinkState, setPinkState] = useState('initial'); // 'initial' | 'focusing' | 'clicking' | 'captured'
  const videoRef = useRef(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const isWeb = typeof Capacitor !== 'undefined' ? !Capacitor.isNativePlatform() : true;

  // Intro camera shutter click animation on 'Pink'
  useEffect(() => {
    const t1 = setTimeout(() => setPinkState('focusing'), 500);
    const t2 = setTimeout(() => setPinkState('clicking'), 1300);
    const t3 = setTimeout(() => setPinkState('captured'), 1650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const triggerPinkSnap = () => {
    setPinkState('focusing');
    setTimeout(() => setPinkState('clicking'), 250);
    setTimeout(() => setPinkState('captured'), 550);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Seamless forward loop for background video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animationFrameId;

    const loopSeamlessly = () => {
      if (video.duration) {
        if (video.currentTime >= video.duration - 1.5) {
          video.style.opacity = '0';
        } else {
          video.style.opacity = '0.4';
        }

        if (video.currentTime >= video.duration - 0.1) {
          video.currentTime = 0;
        }
      }
      animationFrameId = requestAnimationFrame(loopSeamlessly);
    };

    animationFrameId = requestAnimationFrame(loopSeamlessly);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isMobile]);

  // Web Share or Clipboard Copy Handler
  const handleShare = async () => {
    const shareData = {
      title: "The Pink Photobooth",
      text: "Take aesthetic vintage photo strips & cute animated GIFs!",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      } catch (err) {
        console.error("Clipboard copy failed:", err);
      }
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative transition-all duration-1000 overflow-hidden px-4 md:px-0 bg-black`}>
      {/* Background Video */}
      <video
        key={isMobile ? "mobile" : "desktop"}
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-[1500ms] ease-in-out"
        style={{ opacity: 0.4 }}
      >
        <source src={isMobile ? "/videos/reels_mobile.mp4" : "/videos/reels.mp4"} type="video/mp4" />
      </video>
      
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 ${colors.animatedBg} opacity-85 pointer-events-none z-0`}></div>

      {/* Top Right Share Button for Web (Crystal Glass Button) */}
      {isWeb && (
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full crystal-glass text-white transition-all duration-200 hover:scale-105 active:scale-95 text-xs sm:text-sm cursor-pointer select-none group"
            title="Share Photobooth"
          >
            <svg className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            <span className="font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] tracking-wide">Share</span>
          </button>

          {/* Toast Notification */}
          {copiedToast && (
            <div className="absolute right-0 top-12 sm:top-14 crystal-glass text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl whitespace-nowrap animate-fadeInUp flex items-center gap-2 border border-white/80 bg-pink-950/60 backdrop-blur-2xl">
              <span>✨</span>
              <span className="drop-shadow-sm font-bold">Link copied to clipboard!</span>
            </div>
          )}
        </div>
      )}

      {/* Desktop-only Hardware-Accelerated Wand Cursor */}
      <WandCursor />

      {/* Main Card Container */}
      <div
        className="relative z-10 animate-fadeInUp flex items-center justify-center"
        onMouseEnter={() => setCardHovered(true)}
        onMouseLeave={() => setCardHovered(false)}
        style={{ overflow: "visible" }}
      >
        {/* ================= DESKTOP (Widescreen) STRIPS ================= */}
        {/* LEFT SIDE: Back Strip (Desktop) */}
        <div
          className={`hidden md:flex flex-col items-center justify-center absolute left-0 top-1/2 -translate-y-1/2
            transition-all duration-500
            ${cardHovered
              ? "opacity-80 -translate-x-20 -rotate-12 z-0"
              : "opacity-0 -translate-x-36 z-[-2]"
            }`}
          style={{ pointerEvents: "none" }}
        >
          <img
            src="./photostrip-behind-left.png"
            alt="Photo Strip Back Left"
            className="w-28 h-72 object-cover rounded-xl"
          />
        </div>

        {/* LEFT SIDE: Front Strip (Desktop) */}
        <div
          className={`hidden md:flex flex-col items-center justify-center absolute left-0 top-1/2 -translate-y-1/2
            transition-all duration-500
            ${cardHovered
              ? "opacity-100 -translate-x-10 -rotate-6 z-10"
              : "opacity-0 -translate-x-32 z-[-1]"
            }`}
          style={{ pointerEvents: "none" }}
        >
          <img
            src="photostrip-sample-left.png"
            alt="Photo Strip Left"
            className="w-28 h-72 object-cover rounded-xl"
          />
        </div>

        {/* ================= MAIN HERO CONTAINER (Mobile + Widescreen) ================= */}
        <div className="relative px-4 md:px-8 py-6 md:py-8 flex flex-col items-center justify-center text-center w-[90vw] max-w-sm md:max-w-xl z-20">
          {/* Interactive Camera Click Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-pacifico text-white drop-shadow-[0_4px_20px_rgba(219,39,119,0.85)] leading-tight tracking-wide mb-3 md:mb-4 animate-float-subtle flex items-center justify-center flex-wrap gap-x-2 md:gap-x-3">
            <span>The</span>

            {/* 'Pink' with Viewfinder Brackets & Camera Click Mimicry */}
            <span
              onClick={triggerPinkSnap}
              className={`relative inline-flex items-center justify-center px-2.5 md:px-3.5 py-0.5 md:py-1 cursor-pointer select-none transition-transform duration-200 ${
                pinkState === 'clicking' ? 'scale-90 brightness-150' : 'hover:scale-105 active:scale-95'
              }`}
              title="Tap to snap!"
            >
              {/* Viewfinder Brackets */}
              <div
                className={`absolute -inset-1.5 md:-inset-2 pointer-events-none z-10 transition-all duration-300 ease-out ${
                  pinkState === 'initial'
                    ? 'opacity-0 scale-125'
                    : pinkState === 'focusing'
                    ? 'opacity-100 scale-100'
                    : pinkState === 'clicking'
                    ? 'opacity-100 scale-90 brightness-200'
                    : 'opacity-0 scale-95'
                }`}
              >
                {/* Top Left */}
                <div className="absolute top-0 left-0 w-3 md:w-4 h-[2px] md:h-[2.5px] bg-pink-300 rounded-tl shadow-[0_0_8px_#f472b6]"></div>
                <div className="absolute top-0 left-0 w-[2px] md:w-[2.5px] h-3 md:h-4 bg-pink-300 rounded-tl shadow-[0_0_8px_#f472b6]"></div>
                {/* Top Right */}
                <div className="absolute top-0 right-0 w-3 md:w-4 h-[2px] md:h-[2.5px] bg-pink-300 rounded-tr shadow-[0_0_8px_#f472b6]"></div>
                <div className="absolute top-0 right-0 w-[2px] md:w-[2.5px] h-3 md:h-4 bg-pink-300 rounded-tr shadow-[0_0_8px_#f472b6]"></div>
                {/* Bottom Left */}
                <div className="absolute bottom-0 left-0 w-3 md:w-4 h-[2px] md:h-[2.5px] bg-pink-300 rounded-bl shadow-[0_0_8px_#f472b6]"></div>
                <div className="absolute bottom-0 left-0 w-[2px] md:w-[2.5px] h-3 md:h-4 bg-pink-300 rounded-bl shadow-[0_0_8px_#f472b6]"></div>
                {/* Bottom Right */}
                <div className="absolute bottom-0 right-0 w-3 md:w-4 h-[2px] md:h-[2.5px] bg-pink-300 rounded-br shadow-[0_0_8px_#f472b6]"></div>
                <div className="absolute bottom-0 right-0 w-[2px] md:w-[2.5px] h-3 md:h-4 bg-pink-300 rounded-br shadow-[0_0_8px_#f472b6]"></div>
              </div>

              {/* Shutter Flash Ripple */}
              {pinkState === 'clicking' && (
                <span className="absolute inset-0 bg-white rounded-lg blur-[2px] opacity-90 animate-ping pointer-events-none" />
              )}

              {/* Word Text */}
              <span
                className={`transition-all duration-500 ${
                  pinkState === 'captured'
                    ? 'text-pink-200 drop-shadow-[0_2px_10px_rgba(219,39,119,0.6)]'
                    : 'text-white'
                }`}
              >
                Pink
              </span>
            </span>

            <span>Photobooth</span>
          </h1>

          <p className="text-sm md:text-base font-medium text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] mb-7 md:mb-8 max-w-[260px] md:max-w-[300px] leading-relaxed mx-auto">
            Create, customize, and download your aesthetic photo strips & animated GIFs!
          </p>

          {/* Tactile Camera Shutter Trigger Button with Sparkles (Glass Effect) */}
          <div className="relative w-full max-w-[260px] md:max-w-[290px] mx-auto">
            <span className="absolute -top-3.5 right-0 md:right-1 text-pink-200 text-base md:text-lg animate-pulse select-none z-30 pointer-events-none">✦</span>
            <span className="absolute -bottom-2.5 left-0 md:left-1 text-pink-200 text-xs md:text-sm animate-pulse delay-500 select-none z-30 pointer-events-none">✧</span>

            <button
              className="w-full py-3 md:py-3.5 px-5 md:px-6 rounded-full pink-crystal-btn text-white font-bold text-sm md:text-base flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group select-none"
              onClick={onStart}
            >
              {/* Retro Camera Shutter Ring Icon */}
              <div className="w-5 h-5 md:w-5.5 md:h-5.5 rounded-full border-2 border-white/90 flex items-center justify-center shadow-inner drop-shadow-sm">
                <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white animate-pulse" />
              </div>
              <span className="tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)] font-bold">Start Photobooth</span>
              <svg className="w-4 h-4 md:w-4.5 md:h-4.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* ================= DESKTOP (Widescreen) RIGHT STRIPS ================= */}
        {/* RIGHT SIDE: Back Strip (Desktop) */}
        <div
          className={`hidden md:flex flex-col items-center justify-center absolute right-0 top-1/2 -translate-y-1/2
            transition-all duration-500
            ${cardHovered
              ? "opacity-80 translate-x-20 rotate-12 z-0"
              : "opacity-0 translate-x-36 z-[-2]"
            }`}
          style={{ pointerEvents: "none" }}
        >
          <img
            src="./photostrip-behind-right.png"
            alt="Photo Strip Back Right"
            className="w-28 h-72 object-cover rounded-xl"
          />
        </div>

        {/* RIGHT SIDE: Front Strip (Desktop) */}
        <div
          className={`hidden md:flex flex-col items-center justify-center absolute right-0 top-1/2 -translate-y-1/2
            transition-all duration-500
            ${cardHovered
              ? "opacity-100 translate-x-10 rotate-6 z-10"
              : "opacity-0 translate-x-32 z-[-1]"
            }`}
          style={{ pointerEvents: "none" }}
        >
          <img
            src="photostrip-sample-right.png"
            alt="Photo Strip Right"
            className="w-28 h-72 object-cover rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
