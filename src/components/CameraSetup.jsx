
// import { useRef, useState, useEffect } from "react";
// import { ReactP5Wrapper } from "@p5-wrapper/react";
// import BackButton from "./BackButton";

// export default function CameraSetup({ layout, onBack, onDone }) {
//   const shots = layout?.shots || 1;
//   const [captured, setCaptured] = useState([]);
//   const [step, setStep] = useState("preview");
//   const [countdown, setCountdown] = useState(3);
//   const [showInstructions, setShowInstructions] = useState(false);
//   const videoRef = useRef(null);
//   const countdownInterval = useRef(null);

//   // Reset session when shot count changes
//   useEffect(() => {
//     startSession();
//     // eslint-disable-next-line
//   }, [shots]);

//   // Cleanup intervals on unmount
//   useEffect(() => {
//     return () => {
//       if (countdownInterval.current) {
//         clearInterval(countdownInterval.current);
//       }
//     };
//   }, []);

//   // p5 sketch function
//   const sketch = (p5) => {
//     let capture;

//     p5.setup = () => {
//       p5.createCanvas(640, 480);
//       capture = p5.createCapture(p5.VIDEO);
//       capture.size(640, 480);
//       capture.hide();
//       videoRef.current = capture;
//     };

//     p5.draw = () => {
//       p5.background(0);
//       if (capture) {
//         p5.image(capture, 0, 0, 640, 480);
//         if (step === "countdown") {
//           p5.fill(255, 0, 0, 180);
//           p5.noStroke();
//           p5.ellipse(320, 240, 120, 120);
//           p5.fill(255);
//           p5.textSize(64);
//           p5.textAlign(p5.CENTER, p5.CENTER);
//           p5.text(countdown, 320, 240);
//         }
//       }
//     };
//   };

//   // Reset session state
//   const startSession = () => {
//     setCaptured([]);
//     setStep("preview");
//     setCountdown(3);
//     if (countdownInterval.current) {
//       clearInterval(countdownInterval.current);
//     }
//   };

//   // Start countdown for next shot
//   const startCountdown = () => {
//     setStep("countdown");
//     setCountdown(3);

//     let timer = 3;
//     if (countdownInterval.current) clearInterval(countdownInterval.current);
//     countdownInterval.current = setInterval(() => {
//       timer -= 1;
//       setCountdown(timer);
//       if (timer === 0) {
//         clearInterval(countdownInterval.current);
//         setTimeout(() => {
//           capturePhoto();
//         }, 300);
//       }
//     }, 1000);
//   };

//   // Capture photo and advance
//   const capturePhoto = () => {
//     setStep("capture");
//     const canvas = document.createElement("canvas");
//     canvas.width = 640;
//     canvas.height = 480;
//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(videoRef.current.elt, 0, 0, canvas.width, canvas.height);

//     setCaptured((prev) => {
//       const next = [...prev, canvas.toDataURL("image/png")];
//       if (next.length < shots) {
//         setTimeout(() => {
//           setStep("preview");
//           setTimeout(startCountdown, 300);
//         }, 700);
//       } else {
//         setTimeout(() => setStep("done"), 500);
//       }
//       return next;
//     });
//   };

//   // Start or retake session
//   const handleStartOrRetake = () => {
//     startSession();
//     setTimeout(startCountdown, 500);
//   };

//   return (
//     <div className="flex flex-col items-center relative min-h-screen">

//       {/* Floating Help Circle */}
//       {!showInstructions && (
//         <div
//           className="fixed bottom-8 right-8 z-50 cursor-pointer transition-transform hover:scale-110"
//           onClick={() => setShowInstructions(true)}
//           style={{
//             width: 60,
//             height: 60,
//             background: 'radial-gradient(circle at 30% 30%, #f472b6, #a21caf)',
//             borderRadius: '50%',
//             boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//           }}
//           title="How to use the photobooth"
//         >
//           <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
//             <circle cx="12" cy="12" r="12" fill="none"/>
//             <path d="M12 17h.01M12 7a5 5 0 0 1 5 5c0 2.5-2.5 3-2.5 3h-5s-2.5-.5-2.5-3a5 5 0 0 1 5-5zm0 0V5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//           </svg>
//         </div>
//       )}

//       {/* Instruction Card */}
//       {showInstructions && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in">
//             <button
//               className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl"
//               onClick={() => setShowInstructions(false)}
//               aria-label="Close"
//             >
//               &times;
//             </button>
//             <h2 className="text-2xl font-bold mb-4 text-pink-600">How to Use the Photobooth</h2>
//             <ul className="list-disc pl-6 space-y-2 text-gray-700">
//               <li>Click <b>Start Photo Session</b> to begin.</li>
//               <li>Follow the countdown and pose for each shot.</li>
//               <l>Make sure you are centered when posing for pictures.</l>
//               <li>After all photos are taken, choose your strip design or retake if needed.</li>
//               <li>Use the <b>Retake</b> button to restart the session at any time.</li>
//             </ul>
//           </div>
//         </div>
//       )}

//       <BackButton className="mb-4 self-start" onClick={onBack}>
//         Go Back
//       </BackButton>
//       <div className="mb-4 text-xl font-semibold">
//         {step === "done"
//           ? "All Photos Captured!"
//           : `Photo ${captured.length + 1} of ${shots}`}
//       </div>
//       <div className="w-[640px] h-[480px] mb-4">
//         <ReactP5Wrapper sketch={sketch} />
//       </div>

//       {/* Only show "Start Photo Session" before the first photo */}
//       {step === "preview" && captured.length === 0 && (
//         <button
//           className="px-8 py-4 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-xl font-semibold"
//           onClick={handleStartOrRetake}
//         >
//           Start Photo Session
//         </button>
//       )}

//       <div className="flex gap-4 mt-8">
//         {Array.from({ length: shots }).map((_, i) =>
//           captured[i] ? (
//             <img
//               key={i}
//               src={captured[i]}
//               alt={`Shot ${i + 1}`}
//               className="w-24 h-32 object-cover rounded-lg"
//             />
//           ) : (
//             <div
//               key={i}
//               className="w-24 h-32 rounded-lg bg-pink-100 border-2 border-pink-300 flex items-center justify-center text-pink-300 text-3xl"
//             >
//               {i + 1}
//             </div>
//           )
//         )}
//       </div>

//       {/* Only show "Retake" and "Choose Strip Design" after all photos are taken */}
//       {step === "done" && (
//         <div className="flex gap-4 mt-8">
//           <button
//             className="px-8 py-4 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-xl font-semibold"
//             onClick={handleStartOrRetake}
//           >
//             Retake
//           </button>
//           <button
//             className="px-8 py-4 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-xl font-semibold"
//             onClick={() => onDone(captured)}
//           >
//             Choose Strip Design
//           </button>
//         </div>
//       )}
//     </div>
//   );
// } 
// above code compatible with laptop

// import { useRef, useState, useEffect } from "react";
// import { ReactP5Wrapper } from "@p5-wrapper/react";
// import BackButton from "./BackButton";

// export default function CameraSetup({ layout, onBack, onDone }) {
//   const shots = layout?.shots || 1;
//   const [captured, setCaptured] = useState([]);
//   const [step, setStep] = useState("preview");
//   const [countdown, setCountdown] = useState(3);
//   const [showInstructions, setShowInstructions] = useState(false);
//   const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 });
//   const videoRef = useRef(null);
//   const countdownInterval = useRef(null);

//   // Responsive canvas sizing for mobile
//   useEffect(() => {
//     function updateCanvasSize() {
//       // Use 90vw for width on small screens, max 640px; maintain 4:3 aspect ratio
//       const isMobile = window.innerWidth < 700;
//       const width = isMobile ? Math.min(window.innerWidth * 0.96, 640) : 640;
//       const height = Math.round((width / 4) * 3);
//       setCanvasSize({ width, height });
//     }
//     updateCanvasSize();
//     window.addEventListener("resize", updateCanvasSize);
//     return () => window.removeEventListener("resize", updateCanvasSize);
//   }, []);

//   // Reset session when shot count changes
//   useEffect(() => {
//     startSession();
//     // eslint-disable-next-line
//   }, [shots]);

//   // Cleanup intervals on unmount
//   useEffect(() => {
//     return () => {
//       if (countdownInterval.current) {
//         clearInterval(countdownInterval.current);
//       }
//     };
//   }, []);

//   // p5 sketch function
//   const sketch = (p5) => {
//     let capture;

//     p5.setup = () => {
//       p5.createCanvas(canvasSize.width, canvasSize.height);
//       capture = p5.createCapture(p5.VIDEO);
//       // Set video size to match canvas for best results
//       capture.size(canvasSize.width, canvasSize.height);
//       capture.hide();
//       videoRef.current = capture;
//     };

//     p5.draw = () => {
//       p5.background(0);
//       if (capture) {
//         p5.image(capture, 0, 0, canvasSize.width, canvasSize.height);
//         if (step === "countdown") {
//           p5.fill(255, 0, 0, 180);
//           p5.noStroke();
//           p5.ellipse(canvasSize.width / 2, canvasSize.height / 2, 120, 120);
//           p5.fill(255);
//           p5.textSize(64);
//           p5.textAlign(p5.CENTER, p5.CENTER);
//           p5.text(countdown, canvasSize.width / 2, canvasSize.height / 2);
//         }
//       }
//     };

//     p5.windowResized = () => {
//       // This will trigger a re-render and update canvas size
//       // (handled by the useEffect above)
//     };
//   };

//   // Reset session state
//   const startSession = () => {
//     setCaptured([]);
//     setStep("preview");
//     setCountdown(3);
//     if (countdownInterval.current) {
//       clearInterval(countdownInterval.current);
//     }
//   };

//   // Start countdown for next shot
//   const startCountdown = () => {
//     setStep("countdown");
//     setCountdown(3);

//     let timer = 3;
//     if (countdownInterval.current) clearInterval(countdownInterval.current);
//     countdownInterval.current = setInterval(() => {
//       timer -= 1;
//       setCountdown(timer);
//       if (timer === 0) {
//         clearInterval(countdownInterval.current);
//         setTimeout(() => {
//           capturePhoto();
//         }, 300);
//       }
//     }, 1000);
//   };

//   // Capture photo and advance
//   const capturePhoto = () => {
//     setStep("capture");
//     const canvas = document.createElement("canvas");
//     canvas.width = canvasSize.width;
//     canvas.height = canvasSize.height;
//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(videoRef.current.elt, 0, 0, canvas.width, canvas.height);

//     setCaptured((prev) => {
//       const next = [...prev, canvas.toDataURL("image/png")];
//       if (next.length < shots) {
//         setTimeout(() => {
//           setStep("preview");
//           setTimeout(startCountdown, 300);
//         }, 700);
//       } else {
//         setTimeout(() => setStep("done"), 500);
//       }
//       return next;
//     });
//   };

//   // Start or retake session
//   const handleStartOrRetake = () => {
//     startSession();
//     setTimeout(startCountdown, 500);
//   };

//   return (
//     <div className="flex flex-col items-center relative min-h-screen bg-gray-50">

//       {/* Floating Help Circle */}
//       {!showInstructions && (
//         <div
//           className="fixed bottom-4 right-4 z-50 cursor-pointer transition-transform hover:scale-110"
//           onClick={() => setShowInstructions(true)}
//           style={{
//             width: 50,
//             height: 50,
//             background: 'radial-gradient(circle at 30% 30%, #f472b6, #a21caf)',
//             borderRadius: '50%',
//             boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//           }}
//           title="How to use the photobooth"
//         >
//           <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
//             <circle cx="12" cy="12" r="12" fill="none"/>
//             <path d="M12 17h.01M12 7a5 5 0 0 1 5 5c0 2.5-2.5 3-2.5 3h-5s-2.5-.5-2.5-3a5 5 0 0 1 5-5zm0 0V5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//           </svg>
//         </div>
//       )}

//       {/* Instruction Card */}
//       {showInstructions && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-11/12 relative animate-fade-in">
//             <button
//               className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl"
//               onClick={() => setShowInstructions(false)}
//               aria-label="Close"
//             >
//               &times;
//             </button>
//             <h2 className="text-xl font-bold mb-4 text-pink-600">How to Use the Photobooth</h2>
//             <ul className="list-disc pl-6 space-y-2 text-gray-700 text-base">
//               <li>Click <b>Start Photo Session</b> to begin.</li>
//               <li>Follow the countdown and pose for each shot.</li>
//               <li>Make sure you are centered when posing for pictures.</li>
//               <li>After all photos are taken, choose your strip design or retake if needed.</li>
//               <li>Use the <b>Retake</b> button to restart the session at any time.</li>
//             </ul>
//           </div>
//         </div>
//       )}

//       <BackButton className="mb-4 self-start" onClick={onBack}>
//         Go Back
//       </BackButton>
//       <div className="mb-4 text-lg md:text-xl font-semibold">
//         {step === "done"
//           ? "All Photos Captured!"
//           : `Photo ${captured.length + 1} of ${shots}`}
//       </div>
//       <div
//         className="mb-4"
//         style={{
//           width: canvasSize.width,
//           height: canvasSize.height,
//           maxWidth: "96vw",
//           maxHeight: "72vw",
//           background: "#222",
//           borderRadius: 12,
//           overflow: "hidden",
//         }}
//       >
//         <ReactP5Wrapper sketch={sketch} />
//       </div>

//       {/* Only show "Start Photo Session" before the first photo */}
//       {step === "preview" && captured.length === 0 && (
//         <button
//           className="px-6 py-3 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-lg font-semibold"
//           onClick={handleStartOrRetake}
//         >
//           Start Photo Session
//         </button>
//       )}

//       <div className="flex gap-2 md:gap-4 mt-4 md:mt-8">
//         {Array.from({ length: shots }).map((_, i) =>
//           captured[i] ? (
//             <img
//               key={i}
//               src={captured[i]}
//               alt={`Shot ${i + 1}`}
//               className="w-16 h-20 md:w-24 md:h-32 object-cover rounded-lg"
//             />
//           ) : (
//             <div
//               key={i}
//               className="w-16 h-20 md:w-24 md:h-32 rounded-lg bg-pink-100 border-2 border-pink-300 flex items-center justify-center text-pink-300 text-2xl md:text-3xl"
//             >
//               {i + 1}
//             </div>
//           )
//         )}
//       </div>

//       {/* Only show "Retake" and "Choose Strip Design" after all photos are taken */}
//       {step === "done" && (
//         <div className="flex gap-4 mt-8 flex-wrap justify-center">
//           <button
//             className="px-6 py-3 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-lg font-semibold"
//             onClick={handleStartOrRetake}
//           >
//             Retake
//           </button>
//           <button
//             className="px-6 py-3 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-lg font-semibold"
//             onClick={() => onDone(captured)}
//           >
//             Choose Strip Design
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
//compatible with mobile but do not like white background 

// import { useRef, useState, useEffect } from "react";
// import { ReactP5Wrapper } from "@p5-wrapper/react";
// import BackButton from "./BackButton";

// export default function CameraSetup({ layout, onBack, onDone }) {
//   const shots = layout?.shots || 1;
//   const [captured, setCaptured] = useState([]);
//   const [step, setStep] = useState("preview");
//   const [countdown, setCountdown] = useState(3);
//   const [showInstructions, setShowInstructions] = useState(false);
//   const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 });
//   const videoRef = useRef(null);
//   const countdownInterval = useRef(null);

//   // Responsive canvas sizing
//   useEffect(() => {
//     function updateCanvasSize() {
//       const vw = Math.min(window.innerWidth, document.documentElement.clientWidth);
//       const isMobile = vw < 700;
//       const width = isMobile ? Math.min(vw * 0.96, 640) : 640;
//       const height = Math.round((width / 4) * 3);
//       setCanvasSize({ width, height });
//     }
//     updateCanvasSize();
//     window.addEventListener("resize", updateCanvasSize);
//     return () => window.removeEventListener("resize", updateCanvasSize);
//   }, []);

//   // Reset session when shot count changes
//   useEffect(() => {
//     startSession();
//     // eslint-disable-next-line
//   }, [shots]);

//   // Cleanup intervals on unmount
//   useEffect(() => {
//     return () => {
//       if (countdownInterval.current) {
//         clearInterval(countdownInterval.current);
//       }
//     };
//   }, []);

//   // p5 sketch function
//   const sketch = (p5) => {
//     let capture;
//     p5.setup = () => {
//       p5.createCanvas(canvasSize.width, canvasSize.height);
//       capture = p5.createCapture(p5.VIDEO);
//       capture.size(canvasSize.width, canvasSize.height);
//       capture.hide();
//       videoRef.current = capture;
//     };
//     p5.draw = () => {
//       p5.background(0);
//       if (capture) {
//         p5.image(capture, 0, 0, canvasSize.width, canvasSize.height);
//         if (step === "countdown") {
//           p5.fill(255, 0, 0, 180);
//           p5.noStroke();
//           p5.ellipse(canvasSize.width / 2, canvasSize.height / 2, 120, 120);
//           p5.fill(255);
//           p5.textSize(64);
//           p5.textAlign(p5.CENTER, p5.CENTER);
//           p5.text(countdown, canvasSize.width / 2, canvasSize.height / 2);
//         }
//       }
//     };
//   };

//   // Reset session state
//   const startSession = () => {
//     setCaptured([]);
//     setStep("preview");
//     setCountdown(3);
//     if (countdownInterval.current) {
//       clearInterval(countdownInterval.current);
//     }
//   };

//   // Start countdown for next shot
//   const startCountdown = () => {
//     setStep("countdown");
//     setCountdown(3);

//     let timer = 3;
//     if (countdownInterval.current) clearInterval(countdownInterval.current);
//     countdownInterval.current = setInterval(() => {
//       timer -= 1;
//       setCountdown(timer);
//       if (timer === 0) {
//         clearInterval(countdownInterval.current);
//         setTimeout(() => {
//           capturePhoto();
//         }, 300);
//       }
//     }, 1000);
//   };

//   // Capture photo and advance
//   const capturePhoto = () => {
//     setStep("capture");
//     const canvas = document.createElement("canvas");
//     canvas.width = canvasSize.width;
//     canvas.height = canvasSize.height;
//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(videoRef.current.elt, 0, 0, canvas.width, canvas.height);

//     setCaptured((prev) => {
//       const next = [...prev, canvas.toDataURL("image/png")];
//       if (next.length < shots) {
//         setTimeout(() => {
//           setStep("preview");
//           setTimeout(startCountdown, 300);
//         }, 700);
//       } else {
//         setTimeout(() => setStep("done"), 500);
//       }
//       return next;
//     });
//   };

//   // Start or retake session
//   const handleStartOrRetake = () => {
//     startSession();
//     setTimeout(startCountdown, 500);
//   };

//   return (
//     <div className="flex flex-col items-center relative min-h-screen bg-gradient-to-br from-pink-300 via-purple-200 to-indigo-200 overflow-x-hidden">
//       {/* Floating Help Circle */}
//       {!showInstructions && (
//         <div
//           className="fixed bottom-8 right-8 z-50 cursor-pointer transition-transform hover:scale-110"
//           onClick={() => setShowInstructions(true)}
//           style={{
//             width: 60,
//             height: 60,
//             background: 'radial-gradient(circle at 30% 30%, #f472b6, #a21caf)',
//             borderRadius: '50%',
//             boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//           }}
//           title="How to use the photobooth"
//         >
//           <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
//             <circle cx="12" cy="12" r="12" fill="none"/>
//             <path d="M12 17h.01M12 7a5 5 0 0 1 5 5c0 2.5-2.5 3-2.5 3h-5s-2.5-.5-2.5-3a5 5 0 0 1 5-5zm0 0V5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//           </svg>
//         </div>
//       )}

//       {/* Instruction Card */}
//       {showInstructions && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in">
//             <button
//               className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl"
//               onClick={() => setShowInstructions(false)}
//               aria-label="Close"
//             >
//               &times;
//             </button>
//             <h2 className="text-2xl font-bold mb-4 text-pink-600">How to Use the Photobooth</h2>
//             <ul className="list-disc pl-6 space-y-2 text-gray-700">
//               <li>Click <b>Start Photo Session</b> to begin.</li>
//               <li>Follow the countdown and pose for each shot.</li>
//               <li>Make sure you are centered when posing for pictures.</li>
//               <li>After all photos are taken, choose your strip design or retake if needed.</li>
//               <li>Use the <b>Retake</b> button to restart the session at any time.</li>
//             </ul>
//           </div>
//         </div>
//       )}

//       <BackButton className="mb-4 self-start" onClick={onBack}>
//         Go Back
//       </BackButton>
//       <div className="mb-4 text-xl font-semibold">
//         {step === "done"
//           ? "All Photos Captured!"
//           : `Photo ${captured.length + 1} of ${shots}`}
//       </div>
//       <div
//         className="mb-4 flex items-center justify-center"
//         style={{
//           width: "100%",
//           maxWidth: `${canvasSize.width}px`,
//           height: `${canvasSize.height}px`,
//           background: "#222",
//           borderRadius: 16,
//           overflow: "hidden",
//           position: "relative",
//           margin: "0 auto",
//           boxSizing: "border-box",
//         }}
//       >
//         <ReactP5Wrapper sketch={sketch} />
//       </div>

//       {step === "preview" && captured.length === 0 && (
//         <button
//           className="px-8 py-4 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-xl font-semibold"
//           onClick={handleStartOrRetake}
//         >
//           Start Photo Session
//         </button>
//       )}

//       <div className="flex gap-4 mt-8">
//         {Array.from({ length: shots }).map((_, i) =>
//           captured[i] ? (
//             <img
//               key={i}
//               src={captured[i]}
//               alt={`Shot ${i + 1}`}
//               className="w-24 h-32 object-cover rounded-lg"
//             />
//           ) : (
//             <div
//               key={i}
//               className="w-24 h-32 rounded-lg bg-pink-100 border-2 border-pink-300 flex items-center justify-center text-pink-300 text-3xl"
//             >
//               {i + 1}
//             </div>
//           )
//         )}
//       </div>

//       {step === "done" && (
//         <div className="flex gap-4 mt-8">
//           <button
//             className="px-8 py-4 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-xl font-semibold"
//             onClick={handleStartOrRetake}
//           >
//             Retake
//           </button>
//           <button
//             className="px-8 py-4 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-xl font-semibold"
//             onClick={() => onDone(captured)}
//           >
//             Choose Strip Design
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
// smaller screen compatibility for camera doesnt work, introduced glass morphism effect on container.

import { useRef, useState, useEffect } from "react";
import { ReactP5Wrapper } from "@p5-wrapper/react";
import BackButton from "./BackButton";

export default function CameraSetup({ layout, onBack, onDone }) {
  const shots = layout?.shots || 1;
  const [captured, setCaptured] = useState([]);
  const [step, setStep] = useState("preview");
  const [countdown, setCountdown] = useState(3);
  const [showInstructions, setShowInstructions] = useState(false);
  const videoRef = useRef(null);
  const countdownInterval = useRef(null);
  const [previewSize, setPreviewSize] = useState({ width: 640, height: 480 });

  // Responsive preview sizing
  useEffect(() => {
    function updatePreviewSize() {
      const vw = Math.min(window.innerWidth, document.documentElement.clientWidth);
      const width = Math.min(vw * 0.9, 640); // 90% of viewport width, max 640px
      const height = Math.round(width * 3 / 4); // Maintain 4:3 aspect ratio
      setPreviewSize({ width, height });
    }
    
    updatePreviewSize();
    window.addEventListener("resize", updatePreviewSize);
    return () => window.removeEventListener("resize", updatePreviewSize);
  }, []);

  // Reset session when shot count changes
  useEffect(() => {
    startSession();
    // eslint-disable-next-line
  }, [shots]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  // p5 sketch function
  const sketch = (p5) => {
    let capture;
    
    p5.setup = () => {
      p5.createCanvas(previewSize.width, previewSize.height);
      capture = p5.createCapture(p5.VIDEO);
      capture.size(640, 480); // Internal capture size remains 640x480
      capture.hide();
      videoRef.current = capture;
    };

    p5.draw = () => {
      p5.background(0);
      if (capture) {
        // Draw video scaled to preview size
        p5.image(capture, 0, 0, previewSize.width, previewSize.height);
        
        if (step === "countdown") {
          p5.fill(255, 0, 0, 180);
          p5.noStroke();
          p5.ellipse(
            previewSize.width / 2, 
            previewSize.height / 2, 
            120, 
            120
          );
          p5.fill(255);
          p5.textSize(64);
          p5.textAlign(p5.CENTER, p5.CENTER);
          p5.text(
            countdown, 
            previewSize.width / 2, 
            previewSize.height / 2
          );
        }
      }
    };
  };

  // Reset session state
  const startSession = () => {
    setCaptured([]);
    setStep("preview");
    setCountdown(3);
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
  };

  // Start countdown for next shot
  const startCountdown = () => {
    setStep("countdown");
    setCountdown(3);

    let timer = 3;
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    countdownInterval.current = setInterval(() => {
      timer -= 1;
      setCountdown(timer);
      if (timer === 0) {
        clearInterval(countdownInterval.current);
        setTimeout(() => {
          capturePhoto();
        }, 300);
      }
    }, 1000);
  };

  // Capture photo and advance (always at 640x480)
  const capturePhoto = () => {
    setStep("capture");
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current.elt, 0, 0, canvas.width, canvas.height);

    setCaptured((prev) => {
      const next = [...prev, canvas.toDataURL("image/png")];
      if (next.length < shots) {
        setTimeout(() => {
          setStep("preview");
          setTimeout(startCountdown, 300);
        }, 700);
      } else {
        setTimeout(() => setStep("done"), 500);
      }
      return next;
    });
  };

  // Start or retake session
  const handleStartOrRetake = () => {
    startSession();
    setTimeout(startCountdown, 500);
  };

  return (
    <div className="flex flex-col items-center relative min-h-screen bg-gradient-to-br from-pink-300 via-purple-200 to-indigo-200 overflow-x-hidden">
      {/* Floating Help Circle */}
      {!showInstructions && (
        <div
          className="fixed bottom-8 right-8 z-50 cursor-pointer transition-transform hover:scale-110"
          onClick={() => setShowInstructions(true)}
          style={{
            width: 60,
            height: 60,
            background: 'radial-gradient(circle at 30% 30%, #f472b6, #a21caf)',
            borderRadius: '50%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="How to use the photobooth"
        >
          <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="none"/>
            <path d="M12 17h.01M12 7a5 5 0 0 1 5 5c0 2.5-2.5 3-2.5 3h-5s-2.5-.5-2.5-3a5 5 0 0 1 5-5zm0 0V5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}

      {/* Instruction Card */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl"
              onClick={() => setShowInstructions(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-pink-600">How to Use the Photobooth</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Click <b>Start Photo Session</b> to begin.</li>
              <li>Follow the countdown and pose for each shot.</li>
              <li>Make sure you are centered when posing for pictures.</li>
              <li>After all photos are taken, choose your strip design or retake if needed.</li>
              <li>Use the <b>Retake</b> button to restart the session at any time.</li>
            </ul>
          </div>
        </div>
      )}

      <BackButton className="mb-4 self-start" onClick={onBack}>
        Go Back
      </BackButton>
      <div className="mb-4 text-xl font-semibold">
        {step === "done"
          ? "All Photos Captured!"
          : `Photo ${captured.length + 1} of ${shots}`}
      </div>
      
      {/* Responsive preview container */}
      <div className="mb-4 w-full flex justify-center">
        <div 
          className="relative bg-black rounded-xl overflow-hidden"
          style={{
            width: `${previewSize.width}px`,
            height: `${previewSize.height}px`
          }}
        >
          <ReactP5Wrapper sketch={sketch} />
        </div>
      </div>

      {/* Only show "Start Photo Session" before the first photo */}
      {step === "preview" && captured.length === 0 && (
        <button
          className="px-8 py-4 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-xl font-semibold"
          onClick={handleStartOrRetake}
        >
          Start Photo Session
        </button>
      )}

      <div className="flex gap-4 mt-8">
        {Array.from({ length: shots }).map((_, i) =>
          captured[i] ? (
            <img
              key={i}
              src={captured[i]}
              alt={`Shot ${i + 1}`}
              className="w-24 h-32 object-cover rounded-lg"
            />
          ) : (
            <div
              key={i}
              className="w-24 h-32 rounded-lg bg-pink-100 border-2 border-pink-300 flex items-center justify-center text-pink-300 text-3xl"
            >
              {i + 1}
            </div>
          )
        )}
      </div>

      {/* Only show "Retake" and "Choose Strip Design" after all photos are taken */}
      {step === "done" && (
        <div className="flex gap-4 mt-8">
          <button
            className="px-8 py-4 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-xl font-semibold"
            onClick={handleStartOrRetake}
          >
            Retake
          </button>
          <button
            className="px-8 py-4 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-xl font-semibold"
            onClick={() => onDone(captured)}
          >
            Choose Strip Design
          </button>
        </div>
      )}
    </div>
  );
}



