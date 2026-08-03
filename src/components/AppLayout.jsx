import { useTheme } from "./ThemeContext";
import WandCursor from "./WandCursor";

export default function AppLayout({ children }) {
  const { colors } = useTheme();

  return (
    <div className={`${colors.animatedBg} min-h-[100svh] flex flex-col relative transition-all duration-1000`}>
      {/* Hardware-Accelerated Wand Cursor for Desktop */}
      <WandCursor />
      {/* Page Content */}
      <div className="w-full flex-grow flex flex-col items-center justify-center animate-fadeInUp relative">
        {children}
      </div>
    </div>
  );
}
