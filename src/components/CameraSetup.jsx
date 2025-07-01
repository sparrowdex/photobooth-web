
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

// 
// import React, { useRef, useState, useEffect } from "react";
// import { Camera } from "react-camera-pro";
// import BackButton from "./BackButton";

// // Helper hook for orientation detection
// function useLandscape() {
//   const getIsPortrait = () => {
//     if (window.screen.orientation && window.screen.orientation.type) {
//       return window.screen.orientation.type.startsWith("portrait");
//     }
//     // Fallback for browsers that don't support the API
//     return window.innerHeight > window.innerWidth;
//   };

//   const [isPortrait, setIsPortrait] = useState(getIsPortrait());

//   useEffect(() => {
//     function updateOrientation() {
//       setIsPortrait(getIsPortrait());
//     }
//     // Listen for orientation changes and resizes
//     window.addEventListener("orientationchange", updateOrientation);
//     window.addEventListener("resize", updateOrientation);
//     return () => {
//       window.removeEventListener("orientationchange", updateOrientation);
//       window.removeEventListener("resize", updateOrientation);
//     };
//   }, []);

//   return !isPortrait; // returns true if landscape
// }

// export default function CameraSetup({ layout, onBack, onDone }) {
//   const shots = layout?.shots || 1;
//   const cameraRef = useRef(null);
//   const [captured, setCaptured] = useState([]);
//   const [step, setStep] = useState("preview");
//   const [showInstructions, setShowInstructions] = useState(false);
//   const [countdown, setCountdown] = useState(null);

//   // Use the improved orientation detection
//   const isLandscape = useLandscape();

//   // Countdown logic
//   useEffect(() => {
//     if (countdown === null) return;
//     if (countdown === 0) {
//       setTimeout(() => {
//         if (cameraRef.current) {
//           const photo = cameraRef.current.takePhoto();
//           setCaptured((prev) => {
//             const next = [...prev, photo];
//             if (next.length < shots) {
//               setStep("preview");
//             } else {
//               setStep("done");
//             }
//             return next;
//           });
//         }
//         setCountdown(null);
//       }, 300);
//       return;
//     }
//     const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
//     return () => clearTimeout(timer);
//   }, [countdown, shots]);

//   // Start or retake session
//   const handleStartOrRetake = () => {
//     setCaptured([]);
//     setStep("preview");
//   };

//   // Handler to start countdown
//   const handleStartCountdown = () => {
//     setCountdown(3);
//     setStep("countdown");
//   };

//   return (
//     <div className="flex flex-col items-center relative min-h-screen bg-gradient-to-br from-pink-300 via-purple-200 to-indigo-200 overflow-x-hidden">
//       {/* Orientation Prompt */}
//       {!isLandscape && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
//           <div className="text-white text-center text-2xl p-8 rounded-xl bg-pink-600 shadow-2xl">
//             For the best experience,<br />
//             please rotate your device horizontally (landscape).
//           </div>
//         </div>
//       )}

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
//       {/* Responsive Camera */}
//       <div className="mb-4 w-full flex justify-center">
//         <div style={{ width: "100%", maxWidth: 640, position: "relative" }}>
//           <Camera
//             ref={cameraRef}
//             aspectRatio={4 / 3}
//             facingMode="user"
//             numberOfCamerasCallback={() => {}}
//             errorMessages={{
//               noCameraAccessible: "No camera device accessible.",
//               permissionDenied: "Permission denied. Please refresh and give camera permission.",
//               switchCamera: "Unable to switch camera.",
//               canvas: "Canvas is not supported."
//             }}
//           />
//           {/* Countdown Overlay */}
//           {step === "countdown" && countdown !== null && (
//             <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-20">
//               <span className="text-white text-7xl font-bold drop-shadow-lg">{countdown}</span>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Only show "Take Photo" before all photos are taken */}
//       {step === "preview" && captured.length < shots && (
//         <button
//           className="px-8 py-4 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-xl font-semibold"
//           onClick={handleStartCountdown}
//         >
//           Take Photo
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
//ios safari compatibility, previous code with all compatible currently removed

import React, { useRef, useState, useEffect } from "react";
import { Camera } from "react-camera-pro";
import BackButton from "./BackButton";

// Orientation detection using Screen Orientation API (with fallback)
function useLandscape() {
  const getIsPortrait = () => {
    if (window.screen.orientation && window.screen.orientation.type) {
      return window.screen.orientation.type.startsWith("portrait");
    }
    return window.innerHeight > window.innerWidth;
  };

  const [isPortrait, setIsPortrait] = useState(getIsPortrait());

  useEffect(() => {
    function updateOrientation() {
      setIsPortrait(getIsPortrait());
    }
    window.addEventListener("orientationchange", updateOrientation);
    window.addEventListener("resize", updateOrientation);
    return () => {
      window.removeEventListener("orientationchange", updateOrientation);
      window.removeEventListener("resize", updateOrientation);
    };
  }, []);

  return !isPortrait; // returns true if landscape
}

export default function CameraSetup({ layout, onBack, onDone }) {
  const shots = layout?.shots || 1;
  const cameraRef = useRef(null);
  const [captured, setCaptured] = useState([]);
  const [step, setStep] = useState("start"); // 'start', 'preview', 'countdown', 'done'
  const [showInstructions, setShowInstructions] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [cameraSize, setCameraSize] = useState({ width: 640, height: 480 });

  const isLandscape = useLandscape();

  // Set camera size on mount and resize
  useEffect(() => {
    const updateCameraSize = () => {
      const width = Math.min(window.innerWidth * 0.95, 640);
      const height = Math.round(width * 0.75); // 4:3 aspect ratio
      setCameraSize({ width, height });
    };
    
    updateCameraSize();
    window.addEventListener('resize', updateCameraSize);
    return () => window.removeEventListener('resize', updateCameraSize);
  }, []);

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setTimeout(() => {
        if (cameraRef.current) {
          const photo = cameraRef.current.takePhoto();
          setCaptured((prev) => {
            const next = [...prev, photo];
            if (next.length < shots) {
              setStep("preview");
            } else {
              setStep("done");
            }
            return next;
          });
        }
        setCountdown(null);
      }, 300);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, shots]);

  // Reset session
  const handleStartOrRetake = () => {
    setCaptured([]);
    setStep("start");
    setCountdown(null);
  };

  // Handler to start session
  const handleStartSession = () => {
    setStep("preview");
  };

  // Handler to start countdown for each shot
  const handleStartCountdown = () => {
    setCountdown(3);
    setStep("countdown");
  };

  return (
    <div className="flex flex-col items-center relative min-h-screen bg-transparent overflow-x-hidden">
      {/* Orientation Prompt */}
      {!isLandscape && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="flex flex-col items-center text-white text-center text-2xl p-8 rounded-xl bg-pink-600 shadow-2xl">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              className="mb-4"
              aria-hidden="true"
            >
              <rect x="8" y="16" width="32" height="16" rx="3" fill="#fff" fillOpacity="0.2"/>
              <rect x="8" y="16" width="32" height="16" rx="3" stroke="#fff" strokeWidth="2"/>
              <path d="M36 32l4 4M40 32l-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>
              <b>Rotate your device to landscape (horizontal) mode</b><br />
              for the best photobooth experience.<br /><br />
              <span className="text-base text-pink-100 font-normal">
                This app is designed for wide screens.<br />
                Please turn your phone or tablet sideways.
              </span>
            </span>
          </div>
        </div>
      )}

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
          : step === "start"
            ? "Ready to Start?"
            : `Photo ${captured.length + 1} of ${shots}`}
      </div>

      {/* Camera Container - fixed size to prevent shrinking */}
      <div className="mb-4 flex justify-center">
        <div 
          style={{ 
            width: cameraSize.width,
            height: cameraSize.height,
            position: "relative", 
            background: "transparent",
            borderRadius: "12px",
            overflow: "hidden"
          }}
        >
          <Camera
            ref={cameraRef}
            aspectRatio={4 / 3}
            facingMode="user"
            numberOfCamerasCallback={() => {}}
            errorMessages={{
              noCameraAccessible: "No camera device accessible.",
              permissionDenied: "Permission denied. Please refresh and give camera permission.",
              switchCamera: "Unable to switch camera.",
              canvas: "Canvas is not supported."
            }}
          />
          {/* Countdown Overlay */}
          {step === "countdown" && countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-20">
              <span className="text-white text-7xl font-bold drop-shadow-lg">{countdown}</span>
            </div>
          )}
        </div>
      </div>

      {/* Start Photo Session button */}
      {step === "start" && (
        <button
          className="px-8 py-4 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-xl font-semibold"
          onClick={handleStartSession}
        >
          Start Photo Session
        </button>
      )}

      {/* Take Photo button for each shot */}
      {step === "preview" && captured.length < shots && (
        <button
          className="px-8 py-4 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition text-xl font-semibold"
          onClick={handleStartCountdown}
        >
          Take Photo
        </button>
      )}

      {/* Slots UI - transparent */}
      <div className="flex gap-4 mt-8 bg-transparent">
        {Array.from({ length: shots }).map((_, i) =>
          captured[i] ? (
            <img
              key={i}
              src={captured[i]}
              alt={`Shot ${i + 1}`}
              className="w-24 h-32 object-cover rounded-lg bg-transparent"
              style={{ background: "transparent" }}
            />
          ) : (
            <div
              key={i}
              className="w-24 h-32 rounded-lg border-2 border-pink-300 flex items-center justify-center text-pink-300 text-3xl bg-transparent"
              style={{ background: "transparent" }}
            >
              {i + 1}
            </div>
          )
        )}
      </div>

      {/* Retake/Choose Strip Design after all photos */}
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
