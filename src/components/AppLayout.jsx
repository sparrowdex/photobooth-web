import { useEffect, useState } from "react";
import { useTheme } from "./ThemeContext";

export default function AppLayout({ children }) {
  const { colors, isDarkMode } = useTheme();
  const [star, setStar] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setStar({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className={`${colors.animatedBg} min-h-screen flex items-center justify-center relative transition-all duration-1000`}>
      {/* Shooting Star Pointer */}
      <div
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
              stroke={isDarkMode ? "#dc2626" : "#f472b6"}
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.7"
            />
            <circle cx="35" cy="5" r="6" fill={isDarkMode ? "#dc2626" : "#f472b6"} />
            <circle cx="35" cy="5" r="3" fill="#fff" opacity="0.7" />
          </g>
        </svg>
      </div>
      {/* Page Content */}
      <div className="w-full h-full flex flex-col items-center justify-center animate-fadeInUp">
        {children}
      </div>
    </div>
  );
}

