import Landing from "./components/Landing";
import Photobooth from "./components/Photobooth";
import { ThemeProvider } from "./components/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import { useState } from "react";

export default function App() {
  const [showBooth, setShowBooth] = useState(false);

  return (
    <ThemeProvider>
      <ThemeToggle />
      {showBooth ? (
        <Photobooth onBack={() => setShowBooth(false)} />
      ) : (
        <Landing onStart={() => setShowBooth(true)} />
      )}
    </ThemeProvider>
  );
}
