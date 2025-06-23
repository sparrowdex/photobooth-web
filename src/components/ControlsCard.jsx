
import { useState } from "react";
import BackButton from "./BackButton";
import { FilterCarousel } from "./FilterCarousel"; // Import the carousel

const FILTERS = [
  { name: "None", value: "" },
  { name: "Noir", value: "grayscale(1) contrast(1.2) brightness(0.8)" },
  { name: "Vintage", value: "sepia(0.6) contrast(1.1) brightness(0.9) saturate(0.8)" },
  { name: "Glam", value: "brightness(1.2) contrast(1.1) blur(1px)" },
  { name: "Pencil Sketch", value: "grayscale(1) contrast(2) brightness(1.2)" },
  { name: "Extra Sharp", value: "contrast(1.5) brightness(1.1)" },
  { name: "Warm", value: "sepia(0.4) brightness(1.1)" },
  { name: "Cool", value: "hue-rotate(180deg) saturate(0.8) brightness(1.1)" },
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
  const [activeFilter, setActiveFilter] = useState(null);

  if (step === "filters") {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center min-w-[340px]">
        <div className="text-xl font-bold text-pink-600 mb-4">Choose a Filter</div>
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
          className="mt-8 px-6 py-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 text-white font-semibold shadow hover:from-pink-500 hover:to-pink-700 transition-all duration-200"
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
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center min-w-[340px]">
        <div className="text-xl font-bold text-pink-600 mb-4">Choose a Design Overlay</div>
        <div className="flex gap-4 mb-8">
          {designs.map((design, i) => (
            <button
              key={i}
              onClick={() => setSelectedDesign(design)}
              className={`border-2 rounded-xl p-1 transition ${
                selectedDesign === design
                  ? "border-pink-500 shadow-lg"
                  : "border-transparent"
              }`}
            >
              <div className="w-32 h-28 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                <img
                  src={design}
                  alt={`Design ${i + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            </button>
          ))}
        </div>
        <button
          className="mt-8 px-6 py-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 text-white font-semibold shadow hover:from-pink-500 hover:to-pink-700 transition-all duration-200"
          onClick={onDownload}
          disabled={!selectedDesign}
        >
          Download Strip
        </button>
        <button
          className="mt-4 px-4 py-2 rounded-full bg-pink-100 text-pink-600 font-semibold hover:bg-pink-200 transition"
          onClick={() => setStep("filters")}
        >
          Back to Filters
        </button>
      </div>
    );
  }
}
