import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera } from "react-camera-pro";
import BackButton from "./BackButton";
import { useTheme } from "./ThemeContext";

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

// Helper: detect mobile device
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      setIsMobile(/Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent));
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function CameraSetup({ layout, onBack, onDone }) {
  const { colors } = useTheme();
  const shots = layout?.shots || 1;
  const cameraRef = useRef(null);
  const [captured, setCaptured] = useState([]);
  const [step, setStep] = useState("start"); // 'start', 'preview', 'countdown', 'done'
  const [showInstructions, setShowInstructions] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [cameraSize, setCameraSize] = useState({ width: 640, height: 480 });
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  const isLandscape = useLandscape();
  const isMobile = useIsMobile();

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

  const startRecording = useCallback(async () => {
    if (!cameraRef.current) return;
    
    setRecordedChunks([]);
    const stream = cameraRef.current.takePhotoStream();
    if (!stream) return;
    
    try {
      const options = { mimeType: 'video/webm;codecs=vp9' };
      const mediaRecorder = new MediaRecorder(stream, options);
      let chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Dynamically import gifshot
        const gifshot = (await import('gifshot')).default;
        
        gifshot.createGIF({
          video: [url],
          gifWidth: 640,
          gifHeight: 480,
          frameDuration: 0.1,
          progressCallback: function(progress) {
            console.log('GIF creation progress:', progress);
          }
        }, function(obj) {
          if (!obj.error) {
            setCaptured((prev) => {
              const updated = [...prev, { photo: cameraRef.current.takePhoto(), gif: obj.image }];
              return updated;
            });
            if (mediaRecorder) {
              mediaRecorder.stop();
            }
            if (captured.length + 1 < shots) {
              setStep("preview");
            } else {
              setStep("done");
            }
          } else {
            console.error('GIF creation error:', obj.error);
          }
          URL.revokeObjectURL(url);
        });
      };
      
      mediaRecorder.start();
      setMediaRecorder(mediaRecorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [shots, cameraRef, setCaptured, setStep]);

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;
    let recorder = null;
    let chunks = [];
    if (countdown === 3) {
      // Start recording at the beginning of countdown
      setRecordedChunks([]); // Reset for each shot
      const video = document.querySelector("video");
      if (video) {
        const stream = video.captureStream();
        recorder = new window.MediaRecorder(stream, { mimeType: "video/webm" });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = async () => {
          // Create GIF from video
          const videoBlob = new Blob(chunks, { type: "video/webm" });
          const url = URL.createObjectURL(videoBlob);
          
          // Dynamically import gifshot
          const gifshot = (await import('gifshot')).default;
          
          gifshot.createGIF({
            video: [url],
            gifWidth: 320,
            gifHeight: 240,
            numFrames: 10,
            frameDuration: 0.2,
          }, function(obj) {
            setCaptured((prev) => {
              // Update the last entry with the gif
              const updated = [...prev];
              if (updated.length > 0) {
                updated[updated.length - 1] = { ...updated[updated.length - 1], gif: obj.image };
              }
              return updated;
            });
            URL.revokeObjectURL(url);
          });
        };
        recorder.start();
        setMediaRecorder(recorder);
      }
    }
    if (countdown === 0) {
      setTimeout(() => {
        if (cameraRef.current) {
          const photo = cameraRef.current.takePhoto();
          setCaptured((prev) => [...prev, { photo, gif: null }]);
          if (mediaRecorder) {
            mediaRecorder.stop();
          }
          if (captured.length + 1 < shots) {
            setStep("preview");
          } else {
            setStep("done");
          }
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

  // Camera container style
  let cameraContainerStyle = {
    width: cameraSize.width,
    height: cameraSize.height,
    position: "relative",
    background: "transparent",
    borderRadius: "12px",
    overflow: "hidden"
  };
  // On mobile portrait, let the camera fill the container width and use a tall 3:4 aspect ratio
  if (isMobile && !isLandscape) {
    cameraContainerStyle = {
      width: "100%",
      maxWidth: "calc(48svh * 0.75)",
      aspectRatio: "3 / 4",
      position: "relative",
      background: "transparent",
      borderRadius: "12px",
      overflow: "hidden",
      margin: "0 auto",
    };
  }

  return (
    <div className="flex flex-col items-center relative w-full min-h-[100svh] bg-transparent overflow-x-hidden py-4 md:py-8 px-2 md:px-4">
      {/* Orientation Prompt */}
      {/* Removed: Landscape mode disclaimer */}

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
              className={`absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl`}
              onClick={() => setShowInstructions(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className={`text-2xl font-bold mb-4 text-gray-800`}>How to Use the Photobooth</h2>
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

      <div className="w-full max-w-5xl flex flex-col items-center">
        <BackButton className="mb-2 md:mb-4 self-start md:absolute md:top-8 md:left-8 z-10" onClick={onBack}>
          Go Back
        </BackButton>

        <div className={`relative w-full flex flex-col items-center mt-4 md:mt-8 ${
          isMobile ? `${colors.card} bg-opacity-70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white border-opacity-50 p-3 sm:p-6 mt-2` : ''
        }`}>
          <div className={`mb-3 md:mb-6 text-xl md:text-4xl font-pacifico font-bold ${colors.text} drop-shadow-sm`}>
            {step === "done"
              ? "All Photos Captured!"
              : step === "start"
                ? "Ready to Start?"
                : `Photo ${captured.length + 1} of ${shots}`}
          </div>

          {/* Camera Container */}
          <div className="mb-3 md:mb-6 flex justify-center w-full">
            <div 
              style={cameraContainerStyle}
              className="shadow-inner bg-black ring-4 ring-white ring-opacity-60 rounded-xl overflow-hidden relative"
            >
              <Camera
                ref={cameraRef}
                aspectRatio={isMobile && !isLandscape ? 3 / 4 : 4 / 3}
                facingMode="user"
                numberOfCamerasCallback={() => {}}
                errorMessages={{
                  noCameraAccessible: "No camera device accessible.",
                  permissionDenied: "Permission denied. Please refresh and give camera permission.",
                  switchCamera: "Unable to switch camera.",
                  canvas: "Canvas is not supported."
                }}
              />
              
              {/* Viewfinder brackets */}
              {step !== "start" && step !== "done" && (
                <div className="absolute inset-4 md:inset-8 pointer-events-none z-10 opacity-70">
                  <div className="absolute top-0 left-0 w-8 md:w-16 h-8 md:h-16 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-8 md:w-16 h-8 md:h-16 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 md:w-16 h-8 md:h-16 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 md:w-16 h-8 md:h-16 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                </div>
              )}

              {/* Countdown Overlay */}
              {step === "countdown" && countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-20 backdrop-blur-sm">
                  <span className="text-white text-8xl md:text-9xl font-bold drop-shadow-2xl animate-ping">{countdown}</span>
                </div>
              )}
            </div>
          </div>

          {/* Start Photo Session button */}
          {step === "start" && (
            <button
              className={`px-6 py-3 md:px-10 md:py-4 ${colors.button} text-white rounded-full shadow-lg transition-transform hover:scale-105 text-lg md:text-xl font-semibold`}
              onClick={handleStartSession}
            >
              Start Photo Session
            </button>
          )}

          {/* Take Photo button for each shot */}
          {step === "preview" && captured.length < shots && (
            <button
              className={`px-6 py-3 md:px-10 md:py-4 ${colors.button} text-white rounded-full shadow-lg transition-transform hover:scale-105 text-lg md:text-xl font-semibold`}
              onClick={handleStartCountdown}
            >
              Take Photo
            </button>
          )}

          {/* Slots UI */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-6 mt-4 md:mt-8 w-full">
            {Array.from({ length: shots }).map((_, i) =>
              captured[i] ? (
                <div key={i} className="flex flex-col items-center relative group">
                  <img
                    src={captured[i].photo}
                    alt={`Shot ${i + 1}`}
                    className="w-14 h-20 sm:w-20 sm:h-28 md:w-28 md:h-36 object-cover rounded-xl shadow-md border-2 border-white"
                  />
                  {captured[i].gif && (
                    <img
                      src={captured[i].gif}
                      alt={`GIF ${i + 1}`}
                      className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 object-cover rounded-lg shadow-sm border-2 border-white absolute -bottom-2 -right-2 bg-white"
                    />
                  )}
                </div>
              ) : (
                <div
                  key={i}
                  className={`w-14 h-20 sm:w-20 sm:h-28 md:w-28 md:h-36 rounded-xl border-4 border-dashed ${colors.borderLight} flex items-center justify-center ${colors.textSecondary} text-xl sm:text-2xl md:text-3xl font-bold opacity-70 bg-white bg-opacity-40 shadow-inner`}
                >
                  {i + 1}
                </div>
              )
            )}
          </div>

          {/* Retake/Choose Strip Design after all photos */}
          {step === "done" && (
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-4 md:mt-8">
              <button
                className={`px-6 py-3 md:px-8 md:py-4 ${colors.buttonSecondary} rounded-full shadow transition-transform hover:scale-105 text-base md:text-lg font-semibold`}
                onClick={handleStartOrRetake}
              >
                Retake
              </button>
              <button
                className={`px-6 py-3 md:px-8 md:py-4 ${colors.button} text-white rounded-full shadow-lg transition-transform hover:scale-105 text-base md:text-lg font-semibold`}
                onClick={() => onDone(captured)}
              >
                Choose Strip Design
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
