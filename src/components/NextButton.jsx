import { useTheme } from "./ThemeContext";

export default function NextButton({ onClick, children = "Next", className = "" }) {
  const { colors } = useTheme();
  return (
    <button
      className={`flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r ${colors.primaryGradient} text-white font-semibold shadow-lg hover:${colors.primaryGradientHover} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-${colors.primary}-400 active:scale-95 ${className}`}
      onClick={onClick}
    >
      <span>{children}</span>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
