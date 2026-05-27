import { useState, useEffect, useRef } from "react";
import { useTheme } from "./ThemeContext";

// Carousel for paginating filters, 5 at a time
export function FilterCarousel({
  filters,
  activeFilter,
  setActiveFilter,
  images,
  filtersState,
  setFilters,
}) {
  const { colors } = useTheme();
  const pageSize = 5;
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(filters.length / pageSize);
  const start = page * pageSize;
  const paginatedFilters = filters.slice(start, start + pageSize);

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);

  const carouselRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (carouselRef.current && !carouselRef.current.contains(event.target)) {
        setActiveFilter(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setActiveFilter]);

  // Helper to determine the global layer index (1, 2, 3...) of a filter to show on the main button
  const getGlobalLayerIndex = (filter) => {
    if (filter.name === "None") return null;
    for (let i = 0; i < filtersState.length; i++) {
      const idx = filtersState[i].findIndex(f => f.name === filter.name);
      if (idx !== -1) return idx + 1;
    }
    return null;
  };

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
    
    // Check if the swipe is mostly horizontal (to avoid triggering during scrolling)
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (distanceX > minSwipeDistance && page < pageCount - 1) setPage((p) => p + 1);
      if (distanceX < -minSwipeDistance && page > 0) setPage((p) => p - 1);
    }
  }

  const activeFilterObj = activeFilter !== null ? filters[activeFilter] : null;
  const isNone = activeFilterObj ? activeFilterObj.name === "None" : false;
  const isAppliedToAll = activeFilterObj ? (isNone ? filtersState.every(photoLayers => photoLayers.length === 0) : filtersState.every(photoLayers => photoLayers.some(f => f.name === activeFilterObj.name))) : false;

  return (
    <div className="flex flex-col items-center mb-6 w-full" ref={carouselRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div className="flex items-center justify-center gap-2 w-full">
      {page > 0 && (
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className={`hidden md:block px-2 py-1 md:px-3 md:py-1.5 rounded bg-gray-200 hover:bg-gray-300 transition text-sm md:text-base`}
          aria-label="Previous Filters"
        >
          &lt;
        </button>
      )}
      <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
        {paginatedFilters.map((filter, idx) => {
          const realIdx = start + idx;
          const layerIdx = getGlobalLayerIndex(filter);

          return (
            <div key={filter.name} className="relative">
              <button
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full font-semibold border-2 transition text-sm md:text-base
                  ${activeFilter === realIdx ? `${colors.border} bg-${colors.primary}-100` : `${colors.borderLight} bg-${colors.primary}-50`}
                  hover:bg-${colors.primary}-200`}
                onClick={() => setActiveFilter(activeFilter === realIdx ? null : realIdx)}
              >
                {filter.name}
              </button>
              {layerIdx !== null && (
                <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${colors.button} text-white flex items-center justify-center text-xs font-bold shadow-md z-10 pointer-events-none`}>
                  {layerIdx}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {page < pageCount - 1 && (
        <button
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          className={`hidden md:block px-2 py-1 md:px-3 md:py-1.5 rounded bg-gray-200 hover:bg-gray-300 transition text-sm md:text-base`}
          aria-label="Next Filters"
        >
          &gt;
        </button>
      )}
      </div>
      {/* Mobile Pagination Indicator */}
      <div className="flex md:hidden gap-1.5 justify-center mt-4">
        {[...Array(pageCount)].map((_, idx) => (
          <div key={idx} className={`w-2 h-2 rounded-full transition-all duration-300 ${page === idx ? `bg-${colors.primary}-400 scale-110` : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Apply To Panel (Rendered outside the overflow-constrained flex items) */}
      {activeFilterObj && (
        <div className={`mt-4 w-full max-w-md z-20 ${colors.overlay} rounded-xl shadow-lg border ${colors.borderLight} overflow-hidden animate-fadeInUp`}>
          <div className={`p-2 px-4 text-sm ${colors.text} font-semibold border-b ${colors.borderLight} bg-gray-50`}>Apply "{activeFilterObj.name}" to:</div>
          
          {/* All Photos Option */}
          <button
            className={`flex items-center gap-2 w-full px-4 py-3 hover:bg-${colors.primary}-50 transition border-b ${colors.borderLight}
              ${isAppliedToAll ? `bg-${colors.primary}-100 font-bold` : ""}
            `}
            onClick={() => {
              if (isNone) {
                setFilters(filtersState.map(() => []));
              } else {
                const newFilters = filtersState.map(photoLayers => {
                  if (isAppliedToAll) {
                    return photoLayers.filter(f => f.name !== activeFilterObj.name);
                  } else {
                    if (photoLayers.some(f => f.name === activeFilterObj.name)) return photoLayers;
                    return [...photoLayers, activeFilterObj];
                  }
                });
                setFilters(newFilters);
              }
            }}
          >
            <span className="font-semibold text-sm">All Photos</span>
            {isAppliedToAll && (
              <span className={`ml-auto w-5 h-5 rounded-full ${colors.button} text-white flex items-center justify-center text-xs font-bold shadow-sm`}>✓</span>
            )}
          </button>

          {/* Individual Photo Options */}
          <div className="flex flex-col max-h-64 overflow-y-auto pb-2">
            {images.map((img, i) => {
              const photoLayerIdx = isNone ? -1 : filtersState[i].findIndex(f => f.name === activeFilterObj.name);
              const hasFilter = isNone ? filtersState[i].length === 0 : photoLayerIdx !== -1;
              return (
                <button
                  key={i}
                  className={`flex items-center gap-3 w-full px-4 py-2 hover:bg-${colors.primary}-50 transition ${hasFilter ? `bg-${colors.primary}-50 font-bold` : ""}`}
                  onClick={() => {
                    if (isNone) {
                      const newFilters = [...filtersState];
                      newFilters[i] = [];
                      setFilters(newFilters);
                    } else {
                      const newFilters = [...filtersState];
                      const photoLayers = newFilters[i];
                      if (hasFilter) {
                        newFilters[i] = photoLayers.filter(f => f.name !== activeFilterObj.name);
                      } else {
                        newFilters[i] = [...photoLayers, activeFilterObj];
                      }
                      setFilters(newFilters);
                    }
                  }}
                >
                  <img
                    src={img}
                    alt={`Shot ${i + 1}`}
                    className="w-8 h-10 object-cover rounded border border-gray-200 shadow-sm"
                    style={{ filter: activeFilterObj.value }}
                  />
                  <span className="text-sm text-gray-700">Photo {i + 1}</span>
                  {hasFilter && !isNone && (
                    <span className={`ml-auto w-5 h-5 rounded-full ${colors.button} text-white flex items-center justify-center text-[11px] font-bold shadow-sm`}>
                      {photoLayerIdx + 1}
                    </span>
                  )}
                  {hasFilter && isNone && (
                    <span className={`ml-auto w-5 h-5 rounded-full ${colors.button} text-white flex items-center justify-center text-[11px] font-bold shadow-sm`}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
