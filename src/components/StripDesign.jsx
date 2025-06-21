

import { useState } from "react";
import PhotoLayoutCard from "./PhotoLayoutCard";
import ControlsCard from "./ControlsCard";
import BackButton from "./BackButton";
import NextButton from "./NextButton";
import frameMappings from "./frameMappings";

// PAGINATED DESIGN GRID
function DesignGrid({ designs, selectedDesign, onSelectDesign }) {
  const pageSize = 2; // 2 per row × 2 rows
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(designs.length / pageSize);
  const start = page * pageSize;
  const paginatedDesigns = designs.slice(start, start + pageSize);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-4 place-items-center">
        {paginatedDesigns.map((design) => (
          <div
            key={design.key}
            className={`border-2 rounded-lg p-2 cursor-pointer transition ${
              selectedDesign?.key === design.key
                ? "border-pink-500 ring-2 ring-pink-300"
                : "border-gray-200"
            }`}
            onClick={() => onSelectDesign(design)}
          >
            <img src={design.url} alt={design.key} className="w-full h-auto mx-auto" />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 mb-2">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-2 py-1 rounded bg-gray-100"
        >
          Previous
        </button>
        {[...Array(pageCount)].map((_, idx) => (
          <button
            key={idx}
            className={`px-2 py-1 rounded ${
              page === idx ? "bg-pink-200 font-bold" : "bg-gray-100"
            }`}
            onClick={() => setPage(idx)}
          >
            {idx + 1}
          </button>
        ))}
        <button
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={page === pageCount - 1}
          className="px-2 py-1 rounded bg-gray-100"
        >
          Next
        </button>
      </div>
    </>
  );
}

// Helper: Draw image with "cover" behavior (crops excess, keeps aspect ratio)
function drawImageCover(ctx, img, x, y, w, h) {
  const imgAspect = img.width / img.height;
  const winAspect = w / h;
  let sx, sy, sw, sh;

  if (imgAspect > winAspect) {
    // Crop left/right
    sh = img.height;
    sw = sh * winAspect;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    // Crop top/bottom
    sw = img.width;
    sh = sw / winAspect;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export default function StripDesign({ images, designs, onBack }) {
  const [step, setStep] = useState("filters"); // "filters" | "design"
  const [photoFilters, setPhotoFilters] = useState(images.map(() => ""));
  const [selectedDesign, setSelectedDesign] = useState(designs[0] || null);
  const [cardAnim, setCardAnim] = useState("card-enter"); // For animation

  // Download logic with frame mapping support and cropping
  const handleDownload = async () => {
    const mappingKey = selectedDesign?.key;
    const mapping = mappingKey ? frameMappings[mappingKey] : null;

    let width, height;
    if (mapping) {
      width = mapping.frameWidth;
      height = mapping.frameHeight;
    } else {
      // fallback grid
      const isGrid = images.length === 6;
      const columns = isGrid ? 2 : 1;
      const imageWidth = 180;
      const imageHeight = 160;
      const gap = 16;
      const rows = Math.ceil(images.length / columns);
      width = columns * imageWidth + (columns - 1) * gap;
      height = rows * imageHeight + (rows - 1) * gap;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (mapping) {
      // Draw each photo in its mapped window, cropping excess
      for (let i = 0; i < mapping.windows.length; i++) {
        const win = mapping.windows[i];
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = images[i];
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.save();
            if (win.borderRadius) {
              ctx.beginPath();
              ctx.moveTo(win.left + win.borderRadius, win.top);
              ctx.lineTo(win.left + win.width - win.borderRadius, win.top);
              ctx.quadraticCurveTo(win.left + win.width, win.top, win.left + win.width, win.top + win.borderRadius);
              ctx.lineTo(win.left + win.width, win.top + win.height - win.borderRadius);
              ctx.quadraticCurveTo(win.left + win.width, win.top + win.height, win.left + win.width - win.borderRadius, win.top + win.height);
              ctx.lineTo(win.left + win.borderRadius, win.top + win.height);
              ctx.quadraticCurveTo(win.left, win.top + win.height, win.left, win.top + win.height - win.borderRadius);
              ctx.lineTo(win.left, win.top + win.borderRadius);
              ctx.quadraticCurveTo(win.left, win.top, win.left + win.borderRadius, win.top);
              ctx.closePath();
              ctx.clip();
            } else {
              // Rectangle clip
              ctx.beginPath();
              ctx.rect(win.left, win.top, win.width, win.height);
              ctx.closePath();
              ctx.clip();
            }
            ctx.filter = photoFilters[i] || "none";
            drawImageCover(ctx, img, win.left, win.top, win.width, win.height);
            ctx.restore();
            ctx.filter = "none";
            resolve();
          };
        });
      }
      // Draw overlay
      if (selectedDesign?.url) {
        const overlay = new window.Image();
        overlay.crossOrigin = "anonymous";
        overlay.src = selectedDesign.url;
        await new Promise((resolve) => {
          overlay.onload = () => {
            ctx.drawImage(overlay, 0, 0, width, height);
            resolve();
          };
        });
      }
    } else {
      // fallback grid logic (your original code)
      const isGrid = images.length === 6;
      const columns = isGrid ? 2 : 1;
      const imageWidth = 180;
      const imageHeight = 160;
      const gap = 16;
      const rows = Math.ceil(images.length / columns);
      for (let i = 0; i < images.length; i++) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = images[i];
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.filter = photoFilters[i] || "none";
            const col = isGrid ? i % 2 : 0;
            const row = isGrid ? Math.floor(i / 2) : i;
            const x = col * (imageWidth + gap);
            const y = row * (imageHeight + gap);
            ctx.drawImage(img, x, y, imageWidth, imageHeight);
            ctx.filter = "none";
            resolve();
          };
        });
      }
      if (selectedDesign?.url) {
        const overlay = new window.Image();
        overlay.crossOrigin = "anonymous";
        overlay.src = selectedDesign.url;
        await new Promise((resolve) => {
          overlay.onload = () => {
            ctx.drawImage(overlay, 0, 0, width, height);
            resolve();
          };
        });
      }
    }

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "photobooth-strip.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Card transition handler
  const goToStep = (nextStep) => {
    setCardAnim("card-exit");
    setTimeout(() => {
      setStep(nextStep);
      setCardAnim("card-enter");
    }, 400); // Match animation duration
  };

  return (
    <div className="flex w-full h-full items-center justify-center gap-8 relative">
      <PhotoLayoutCard
        images={images}
        filters={photoFilters}
        selectedDesign={selectedDesign}
      />
      <div className="relative min-w-[340px] h-[540px] flex items-center">
        <div className={`absolute inset-0 z-10 ${cardAnim}`}>
          {step === "filters" ? (
            <ControlsCard
              step={step}
              setStep={goToStep}
              filters={photoFilters}
              setFilters={setPhotoFilters}
              selectedDesign={selectedDesign}
              setSelectedDesign={setSelectedDesign}
              images={images}
              designs={designs}
              onDownload={handleDownload}
              onBack={onBack}
              NextButton={NextButton}
              BackButton={BackButton}
            />
          ) : (
            <div>
              <DesignGrid
                designs={designs}
                selectedDesign={selectedDesign}
                onSelectDesign={setSelectedDesign}
              />
              <div className="flex justify-between mt-4">
                <BackButton onClick={() => goToStep("filters")}>Back</BackButton>
                <NextButton onClick={handleDownload} disabled={!selectedDesign}>
                  Download
                </NextButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
