import { useState } from "react";
import BackButton from "./BackButton";

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
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {FILTERS.map((filter, idx) => (
            <div key={filter.name} className="relative">
              <button
                className={`px-4 py-2 rounded-full font-semibold border-2 transition 
                  ${activeFilter === idx ? "border-pink-500 bg-pink-100" : "border-pink-200 bg-pink-50"}
                  hover:bg-pink-200`}
                onClick={() => setActiveFilter(activeFilter === idx ? null : idx)}
              >
                {filter.name}
              </button>
              {activeFilter === idx && (
                <div className="absolute left-0 z-20 mt-2 w-56 bg-white rounded-xl shadow-lg border border-pink-200">
                  <div className="p-2 text-sm text-pink-700 font-semibold">Apply to:</div>
                  {images.map((img, i) => (
                    <button
                      key={i}
                      className={`flex items-center gap-2 w-full px-4 py-2 hover:bg-pink-50 rounded-lg transition
                        ${filters[i] === filter.value ? "bg-pink-100 font-bold" : ""}
                      `}
                      onClick={() => {
                        const newFilters = [...filters];
                        newFilters[i] = filter.value;
                        setFilters(newFilters);
                        setActiveFilter(null);
                      }}
                    >
                      <img
                        src={img}
                        alt={`Shot ${i + 1}`}
                        className="w-10 h-10 object-cover rounded border"
                        style={{ filter: filter.value }}
                      />
                      <span>Photo {i + 1}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
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
