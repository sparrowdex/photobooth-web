

import { useEffect, useState, useRef } from "react";
import { useTheme } from "./ThemeContext";

export default function Landing({ onStart }) {
  const { colors } = useTheme();
  const [star, setStar] = useState({ x: 0, y: 0 });
  const [cardHovered, setCardHovered] = useState(false);
  const videoRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Shooting star follows the mouse
  useEffect(() => {
    const handleMouseMove = (e) => {
      setStar({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Seamless forward loop (restart slightly before the end)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animationFrameId;

    const loopSeamlessly = () => {
      if (video.duration) {
        // Fade out 1.5s before the end of the video for a slow, cinematic pulse
        if (video.currentTime >= video.duration - 1.5) {
          video.style.opacity = '0';
        } else {
          video.style.opacity = '0.4';
        }

        // Snappy jump to start right before the video naturally ends
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

      {/* Shooting Star */}
      <div
        className="hidden md:block"
        style={{
          position: "fixed",
          left: star.x - 20,
          top: star.y - 20,
          pointerEvents: "none",
          zIndex: 50,
          transition: "left 0.1s linear, top 0.1s linear",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40">
          <g>
            <line
              x1="5"
              y1="35"
              x2="35"
              y2="5"
              stroke="#f472b6"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.7"
            />
            <circle cx="35" cy="5" r="6" fill="#f472b6" />
            <circle cx="35" cy="5" r="3" fill="#fff" opacity="0.7" />
          </g>
        </svg>
      </div>

      {/* Main Card with Blob Background and Fade-in Animation */}
      <div
        className="relative z-10 animate-fadeInUp flex items-center"
        onMouseEnter={() => setCardHovered(true)}
        onMouseLeave={() => setCardHovered(false)}
        style={{ overflow: "visible" }}
      >
        {/* LEFT SIDE: Back Strip */}
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
        {/* LEFT SIDE: Front Strip */}
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

        {/* Main Card */}
        <div className={`relative ${colors.card} bg-opacity-90 rounded-3xl ${colors.shadow} px-7 py-10 md:px-12 md:py-0 md:h-72 flex flex-col items-center justify-center text-center w-full max-w-[90vw] md:max-w-xl`}>
          <h1 className={`text-4xl md:text-5xl font-pacifico mb-4 ${colors.text} drop-shadow-lg`}>
            Welcome to Photobooth
          </h1>
          <p className={`text-lg md:text-xl mb-8 ${colors.textSecondary}`}>
            Create, customize, and download your own photo strips!
          </p>
          <button
            className={`px-10 py-4 ${colors.button} text-white rounded-xl shadow transition text-xl font-semibold`}
            onClick={onStart}
          >
            Start Photobooth
          </button>
        </div>

        {/* RIGHT SIDE: Back Strip */}
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
        {/* RIGHT SIDE: Front Strip */}
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
