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

  return (
    <div className="flex flex-col items-center relative min-h-screen bg-transparent overflow-x-hidden">
      {/* Orientation Prompt */}
      {!isLandscape && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className={`flex flex-col items-center text-white text-center text-2xl p-8 rounded-xl ${colors.button} shadow-2xl`}>
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
          className={`px-8 py-4 ${colors.button} text-white rounded-xl shadow transition text-xl font-semibold`}
          onClick={handleStartSession}
        >
          Start Photo Session
        </button>
      )}

      {/* Take Photo button for each shot */}
      {step === "preview" && captured.length < shots && (
        <button
          className={`px-8 py-4 ${colors.button} text-white rounded-xl shadow transition text-xl font-semibold`}
          onClick={handleStartCountdown}
        >
          Take Photo
        </button>
      )}

      {/* Slots UI - transparent */}
      <div className="flex gap-4 mt-8 bg-transparent">
        {Array.from({ length: shots }).map((_, i) =>
          captured[i] ? (
            <div key={i} className="flex flex-col items-center">
              <img
                src={captured[i].photo}
                alt={`Shot ${i + 1}`}
                className="w-24 h-32 object-cover rounded-lg bg-transparent mb-2"
                style={{ background: "transparent" }}
              />
              {captured[i].gif && (
                <img
                  src={captured[i].gif}
                  alt={`GIF ${i + 1}`}
                  className="w-16 h-16 object-cover rounded bg-gray-100"
                  style={{ background: "transparent" }}
                />
              )}
            </div>
          ) : (
            <div
              key={i}
              className={`w-24 h-32 rounded-lg border-2 ${colors.borderLight} flex items-center justify-center ${colors.textSecondary} text-3xl bg-transparent`}
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
            className={`px-8 py-4 ${colors.button} text-white rounded-xl shadow transition text-xl font-semibold`}
            onClick={handleStartOrRetake}
          >
            Retake
          </button>
          <button
            className={`px-8 py-4 ${colors.button} text-white rounded-xl shadow transition text-xl font-semibold`}
            onClick={() => onDone(captured)}
          >
            Choose Strip Design
          </button>
        </div>
      )}
    </div>
  );
}
