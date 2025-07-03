import { useTheme } from "./ThemeContext";

export default function BackButton({ onClick, children = "Back", className = "" }) {
  const { colors } = useTheme();
  return (
    <button
      className={`flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r ${colors.primaryGradient} text-white font-semibold shadow-lg hover:${colors.primaryGradientHover} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-${colors.primary}-300 active:scale-95 ${className}`}
      onClick={onClick}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span>{children}</span>
    </button>
  );
}
