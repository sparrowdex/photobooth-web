import { useState } from "react";
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

  return (
    <div className="flex items-center gap-2 mb-6">
      {page > 0 && (
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className={`px-2 py-1 rounded ${colors.isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition`}
          aria-label="Previous Filters"
        >
          &lt;
        </button>
      )}
      <div className="flex flex-wrap gap-3 justify-center">
        {paginatedFilters.map((filter, idx) => {
          const realIdx = start + idx;
          return (
            <div key={filter.name} className="relative">
              <button
                className={`px-4 py-2 rounded-full font-semibold border-2 transition 
                  ${activeFilter === realIdx ? `${colors.border} bg-${colors.primary}-100` : `${colors.borderLight} bg-${colors.primary}-50`}
                  hover:bg-${colors.primary}-200`}
                onClick={() => setActiveFilter(activeFilter === realIdx ? null : realIdx)}
              >
                {filter.name}
              </button>
              {activeFilter === realIdx && (
                <div className={`absolute left-0 z-20 mt-2 w-56 ${colors.overlay} rounded-xl shadow-lg border ${colors.borderLight}`}>
                  <div className={`p-2 text-sm ${colors.text} font-semibold`}>Apply to:</div>
                  
                  {/* All Photos Option */}
                  <button
                    className={`flex items-center gap-2 w-full px-4 py-2 hover:bg-${colors.primary}-50 rounded-lg transition border-b ${colors.borderLight}
                      ${filtersState.every(f => f === filter.value) ? `bg-${colors.primary}-100 font-bold` : ""}
                    `}
                    onClick={() => {
                      const newFilters = images.map(() => filter.value);
                      setFilters(newFilters);
                      setActiveFilter(null);
                    }}
                  >
                    <span className="font-semibold">All Photos</span>
                  </button>
                  
                  {/* Individual Photo Options */}
                  {images.map((img, i) => (
                    <button
                      key={i}
                      className={`flex items-center gap-2 w-full px-4 py-2 hover:bg-${colors.primary}-50 rounded-lg transition
                        ${filtersState[i] === filter.value ? `bg-${colors.primary}-100 font-bold` : ""}
                      `}
                      onClick={() => {
                        const newFilters = [...filtersState];
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
          );
        })}
      </div>
      {page < pageCount - 1 && (
        <button
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          className={`px-2 py-1 rounded ${colors.isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition`}
          aria-label="Next Filters"
        >
          &gt;
        </button>
      )}
    </div>
  );
}
