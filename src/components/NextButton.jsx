import { useTheme } from "./ThemeContext";

export default function NextButton({ onClick, children = "Next", className = "", disabled = false }) {
  const { colors } = useTheme();
  return (
    <button
      className={`flex items-center justify-center gap-1 md:gap-2 px-3 py-1.5 md:px-5 md:py-2 rounded-full bg-gradient-to-r ${colors.primaryGradient} text-white font-semibold shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-${colors.primary}-400 disabled:opacity-50 disabled:cursor-not-allowed hover:${colors.primaryGradientHover} active:scale-95 ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="text-xs sm:text-sm md:text-base">{children}</span>
      <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
