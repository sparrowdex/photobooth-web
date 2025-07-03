
import { useState } from "react";
import BackButton from "./BackButton";
import { FilterCarousel } from "./FilterCarousel"; // Import the carousel
import { useTheme } from "./ThemeContext";

const FILTERS = [
  { name: "None", value: "" },
  { name: "Noir", value: "grayscale(1) contrast(1.2) brightness(0.8)" },
  { name: "Vintage", value: "sepia(0.6) contrast(1.1) brightness(0.9) saturate(0.8)" },
  { name: "Glam", value: "brightness(1.2) contrast(1.1) blur(1px)" },
  { name: "Pencil Sketch", value: "grayscale(1) contrast(2) brightness(1.2)" },
  { name: "Extra Sharp", value: "contrast(1.5) brightness(1.1)" },
  { name: "Warm", value: "sepia(0.2) hue-rotate(5deg) brightness(1.1)" },
  { name: "Cool", value: "hue-rotate(25deg) saturate(1.1) brightness(1.05)" },
  { name: "Faded", value: "contrast(0.8) brightness(1.1) saturate(0.7)" },
  { name: "Black & White", value: "grayscale(1)" },
  { name: "Sepia", value: "sepia(1)" },
  { name: "Brightness", value: "brightness(1.3)" },
  { name: "Contrast", value: "contrast(1.5)" },
  { name: "Blur", value: "blur(2px)" },
  { name: "Invert", value: "invert(1)" },
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

  if (step === "filters") {
    return (
      <div className={`${colors.card} rounded-2xl ${colors.shadow} p-8 flex flex-col items-center min-w-[340px]`}>
        <div className={`text-xl font-bold ${colors.text} mb-4`}>Choose a Filter</div>
        {/* PAGINATED FILTER BUTTONS */}
        <FilterCarousel
          filters={FILTERS}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          images={images}
          filtersState={filters}
          setFilters={setFilters}
        />
        <button
          className={`mt-8 px-6 py-2 rounded-full bg-gradient-to-r ${colors.primaryGradient} text-white font-semibold shadow hover:${colors.primaryGradientHover} transition-all duration-200`}
          onClick={() => setStep("design")}
        >
          Next
        </button>
        <BackButton className="mt-4" onClick={onBack}>Go Back</BackButton>
      </div>
    );
  }

  // DESIGN SELECTION STEP
  if (step === "design") {
    const pageSize = 4; // Show 4 designs at a time
    const [page, setPage] = useState(0);
    const pageCount = Math.ceil(designs.length / pageSize);
    const start = page * pageSize;
    const paginatedDesigns = designs.slice(start, start + pageSize);

    return (
      <div className={`${colors.card} rounded-2xl ${colors.shadow} p-8 flex flex-col items-center min-w-[340px]`}>
        <div className={`text-xl font-bold ${colors.text} mb-4`}>Choose a Design Overlay</div>
        <div className="flex gap-4 mb-4">
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
              <div className={`w-32 h-28 flex items-center justify-center ${colors.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg overflow-hidden`}>
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
            {page > 0 && (
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition"
                aria-label="Previous Designs"
              >
                &lt;
              </button>
            )}
            <span className={`text-sm ${colors.isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {page + 1} of {pageCount}
            </span>
            {page < pageCount - 1 && (
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition"
                aria-label="Next Designs"
              >
                &gt;
              </button>
            )}
          </div>
        )}
        <button
          className={`mt-8 px-6 py-2 rounded-full bg-gradient-to-r ${colors.primaryGradient} text-white font-semibold shadow hover:${colors.primaryGradientHover} transition-all duration-200`}
          onClick={onDownload}
          disabled={!selectedDesign}
        >
          Download Strip
        </button>
        <button
          className={`mt-4 px-4 py-2 rounded-full ${colors.buttonSecondary} font-semibold transition`}
          onClick={() => setStep("filters")}
        >
          Back to Filters
        </button>
      </div>
    );
  }
}

// I want the filters to mimic their real use, like the cool effect just make the image hues of blue, that shouldn't happen, also is it possible to center the card accordingly to the frame layout bceause for 3 , 4 and 6 shot, the frames are quite large making the controls card look small