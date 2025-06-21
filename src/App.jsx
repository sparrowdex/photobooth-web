import Landing from "./components/Landing";
import Photobooth from "./components/Photobooth";
import { useState } from "react";

export default function App() {
  const [showBooth, setShowBooth] = useState(false);

  return showBooth ? (
    <Photobooth onBack={() => setShowBooth(false)} />
  ) : (
    <Landing onStart={() => setShowBooth(true)} />
  );
}
