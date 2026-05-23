
import { useState } from "react";
import BackButton from "./BackButton";
import NextButton from "./NextButton";
import { FilterCarousel } from "./FilterCarousel"; // Import the carousel
import { useTheme } from "./ThemeContext";

const FILTERS = [
  { name: "None", value: "" },
  { name: "Soft Focus", value: "blur(0.5px) contrast(0.98) saturate(1.05)" }, // New filter for subtle skin smoothing
  // Classic Pop & Vibrant
  { name: "Clarendon", value: "contrast(1.2) saturate(1.35) brightness(1.1)" },
  { name: "Lark", value: "brightness(1.1) contrast(0.9) saturate(1.5)" },
  { name: "Juno", value: "saturate(1.4) contrast(1.1) sepia(0.1) hue-rotate(-10deg)" },
  { name: "Mayfair", value: "contrast(1.1) saturate(1.1)" },
  { name: "Perpetua", value: "saturate(1.2) contrast(1.1)" },
  // Warm & Vintage Fades
  { name: "Gingham", value: "brightness(1.05) hue-rotate(350deg) contrast(0.9) saturate(0.8)" },
  { name: "Reyes", value: "sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)" },
  { name: "Crema", value: "sepia(0.5) brightness(1.15) contrast(0.9) hue-rotate(-2deg)" },
  { name: "Ludwig", value: "sepia(0.25) contrast(1.05) saturate(1.5) hue-rotate(-15deg)" },
  { name: "Aden", value: "hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)" },
  { name: "Slumber", value: "saturate(0.66) brightness(1.05) contrast(0.9)" },
  { name: "Amaro", value: "sepia(0.35) contrast(0.9) brightness(1.1) saturate(1.3)" },
  { name: "Rise", value: "sepia(0.2) brightness(1.05) contrast(0.9)" },
  { name: "Hudson", value: "sepia(0.25) contrast(0.9) brightness(1.2) saturate(1.1) hue-rotate(-15deg)" },
  { name: "Valencia", value: "sepia(0.08) contrast(1.08) brightness(1.08)" },
  { name: "Sierra", value: "sepia(0.21) contrast(0.8) brightness(1.02) saturate(0.87)" },
  { name: "Willow", value: "sepia(0.2) contrast(0.95) brightness(0.9) saturate(0.85)" },
  // High Contrast & Dramatic
  { name: "X-Pro II", value: "sepia(0.3) contrast(1.25) brightness(1.1) hue-rotate(-5deg)" },
  { name: "Lo-Fi", value: "sepia(0.4) contrast(1.5) saturate(1.1)" },
  { name: "Hefe", value: "sepia(0.4) contrast(1.5) brightness(1.2) saturate(1.4) hue-rotate(-10deg)" },
  { name: "Nashville", value: "sepia(0.2) contrast(1.2) brightness(1.05) saturate(1.2) hue-rotate(15deg)" },
  { name: "1977", value: "sepia(0.3) contrast(1.1) brightness(1.1) saturate(1.3)" },
  { name: "Kelvin", value: "sepia(0.4) contrast(1.1) brightness(1.1) saturate(2.4) hue-rotate(-10deg)" },
  // Black & White
  { name: "Inkwell", value: "grayscale(1) contrast(1.2) brightness(1.05)" },
  { name: "Moon", value: "grayscale(1) contrast(1.1) brightness(1.1)" },
  { name: "Noir", value: "grayscale(1) contrast(1.3) brightness(0.9)" },
  // Specialty / Artistic
  { name: "Cyberpunk", value: "contrast(1.5) saturate(2.5) hue-rotate(150deg) brightness(0.9)" },
  { name: "Matrix", value: "contrast(1.3) saturate(1.5) hue-rotate(270deg)" },
];

export default function ControlsCard({
  step,
  setStep,
  filters,
  setFilters,
  selectedDesign,
  setSelectedDesign,
  images,
  designs,
  onDownload,
  onBack,
}) {
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState(null);
  
  // Lifted state to avoid React Hook conditional call errors
  const pageSize = 4; // Show 4 designs at a time
  const [designPage, setDesignPage] = useState(0);
  const pageCount = Math.ceil(designs.length / pageSize);

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);

  function handleTouchStart(e) {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  }

  function handleTouchMove(e) {
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  }

  function handleTouchEnd() {
    if (!touchStartX || !touchEndX) return;
    const distanceX = touchStartX - touchEndX;
    const distanceY = touchStartY - touchEndY;
    const minSwipeDistance = 40;
    
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (distanceX > minSwipeDistance && designPage < pageCount - 1) setDesignPage((p) => p + 1);
      if (distanceX < -minSwipeDistance && designPage > 0) setDesignPage((p) => p - 1);
    }
  }

  if (step === "filters") {
    return (
      <div className={`flex flex-col items-center w-full`}>
        <div className={`text-lg md:text-xl font-bold ${colors.text} mb-2 md:mb-4`}>Choose a Filter</div>
        {/* PAGINATED FILTER BUTTONS */}
        <FilterCarousel
          filters={FILTERS}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          images={images}
          filtersState={filters}
          setFilters={setFilters}
        />
        <div className="flex w-full gap-2 md:gap-3 mt-3 md:mt-6">
          <BackButton className="flex-1 justify-center" onClick={onBack}>Go Back</BackButton>
          <NextButton className="flex-1 justify-center" onClick={() => setStep("design")}>Next</NextButton>
        </div>
      </div>
    );
  }

  // DESIGN SELECTION STEP
  if (step === "design") {
    const start = designPage * pageSize;
    const paginatedDesigns = designs.slice(start, start + pageSize);

    return (
      <div className={`flex flex-col items-center w-full`} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className={`text-lg md:text-xl font-bold ${colors.text} mb-2 md:mb-4`}>Choose a Design Overlay</div>
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-2 md:mb-4">
          {paginatedDesigns.map((design, i) => (
            <button
              key={start + i}
              onClick={() => setSelectedDesign(design)}
              className={`border-2 rounded-xl p-1 transition ${
                selectedDesign === design
                  ? `${colors.border} shadow-lg`
                  : "border-transparent"
              }`}
            >
              <div className={`w-20 h-16 sm:w-24 sm:h-20 md:w-32 md:h-28 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden`}>
                <img
                  src={design}
                  alt={`Design ${start + i + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            </button>
          ))}
        </div>
        {/* Pagination controls */}
        {pageCount > 1 && (
          <div className="flex items-center gap-2 mb-6">
            {designPage > 0 && (
              <button
                onClick={() => setDesignPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition"
                aria-label="Previous Designs"
              >
                &lt;
              </button>
            )}
            <span className={`text-sm text-gray-600`}>
              {designPage + 1} of {pageCount}
            </span>
            {designPage < pageCount - 1 && (
              <button
                onClick={() => setDesignPage((p) => Math.min(pageCount - 1, p + 1))}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition"
                aria-label="Next Designs"
              >
                &gt;
              </button>
            )}
          </div>
        )}
        <div className="flex w-full gap-2 md:gap-3 mt-3 md:mt-6">
          <BackButton className="flex-1 justify-center" onClick={() => setStep("filters")}>Back</BackButton>
          <NextButton 
            className="flex-1 justify-center" 
            onClick={onDownload} 
            disabled={!selectedDesign}>
            Download
          </NextButton>
        </div>
      </div>
    );
  }
}