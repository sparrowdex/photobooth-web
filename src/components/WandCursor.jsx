import { useEffect, useRef } from "react";

export default function WandCursor() {
  const cursorRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Only enable on desktop pointer devices (mouse), completely disable on touch/mobile
    const isDesktopPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isDesktopPointer) return;

    const cursorEl = cursorRef.current;
    const canvas = canvasRef.current;
    if (!cursorEl || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to full viewport
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let rafId = null;
    let targetX = -100;
    let targetY = -100;
    let lastSpawnX = -100;
    let lastSpawnY = -100;
    let isVisible = false;
    let isClicking = false;

    // Sparkle particles pool
    const particles = [];
    const sparkleColors = ["#ffffff", "#fce7f3", "#f472b6", "#fbcfe8", "#fef08a"];

    const spawnSparkles = (x, y, count = 1, isBurst = false) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = isBurst ? Math.random() * 2.8 + 1 : Math.random() * 0.8 + 0.2;
        particles.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.4,
          vy: Math.sin(angle) * speed + 0.25, // gentle float down
          size: isBurst ? Math.random() * 4 + 3.5 : Math.random() * 3.5 + 2.5,
          rot: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.15,
          alpha: 1.0,
          decay: isBurst ? Math.random() * 0.035 + 0.02 : Math.random() * 0.03 + 0.025,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        });
      }
    };

    // Draw a shiny 4-pointed star
    const drawStar = (cx, cy, size, rot, alpha, color) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 5 * alpha;

      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(size * 0.18, -size * 0.18, size, 0);
      ctx.quadraticCurveTo(size * 0.18, size * 0.18, 0, size);
      ctx.quadraticCurveTo(-size * 0.18, size * 0.18, -size, 0);
      ctx.quadraticCurveTo(-size * 0.18, -size * 0.18, 0, -size);
      ctx.closePath();
      ctx.fill();

      // Center bright glimmer
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // Main animation loop (Cursor update + Particle simulation)
    const loop = () => {
      // 1. Update wand DOM position
      if (isVisible) {
        const scale = isClicking ? "scale(0.85) rotate(-12deg)" : "scale(1) rotate(0deg)";
        cursorEl.style.transform = `translate3d(${targetX - 32}px, ${targetY - 14}px, 0) ${scale}`;
      }

      // 2. Render particle trail on canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vRot;
        p.alpha -= p.decay;
        p.size = Math.max(0, p.size - 0.05);

        if (p.alpha <= 0 || p.size <= 0) {
          particles.splice(i, 1);
        } else {
          drawStar(p.x, p.y, p.size, p.rot, p.alpha, p.color);
        }
      }

      // Keep loop running if particles exist or cursor is active
      if (particles.length > 0 || isVisible) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
      }
    };

    const startLoopIfNeeded = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(loop);
      }
    };

    const handleMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        cursorEl.style.opacity = "1";
      }

      // Calculate distance from last particle spawn point
      const dx = targetX - lastSpawnX;
      const dy = targetY - lastSpawnY;
      const dist = Math.hypot(dx, dy);

      // Spawn trailing sparkle every 10px of movement at the wand's glowing star tip (targetX, targetY)
      if (dist > 10) {
        spawnSparkles(targetX, targetY, 1, false);
        lastSpawnX = targetX;
        lastSpawnY = targetY;
      }

      startLoopIfNeeded();
    };

    const handleMouseDown = () => {
      isClicking = true;
      // Burst of sparkles on click!
      spawnSparkles(targetX, targetY, 5, true);
      startLoopIfNeeded();
    };

    const handleMouseUp = () => {
      isClicking = false;
      startLoopIfNeeded();
    };

    const handleMouseLeave = () => {
      isVisible = false;
      cursorEl.style.opacity = "0";
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Trailing Fairy Dust Sparkle Canvas */}
      <canvas
        ref={canvasRef}
        className="hidden md:block pointer-events-none fixed inset-0 z-[9998]"
      />

      {/* Wand Pointer */}
      <div
        ref={cursorRef}
        className="hidden md:block pointer-events-none fixed top-0 left-0 z-[9999] transition-opacity duration-150"
        style={{
          opacity: 0,
          willChange: "transform",
          transform: "translate3d(-100px, -100px, 0)",
        }}
      >
        <img
          src="/wand-cursor.svg"
          alt=""
          className="w-[46px] h-[46px] select-none drop-shadow-[0_4px_12px_rgba(219,39,119,0.5)]"
        />
      </div>
    </>
  );
}
