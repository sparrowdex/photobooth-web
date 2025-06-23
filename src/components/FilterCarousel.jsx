import { useState } from "react";

// Carousel for paginating filters, 5 at a time
export function FilterCarousel({
  filters,
  activeFilter,
  setActiveFilter,
  images,
  filtersState,
  setFilters,
}) {
  const pageSize = 5;
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(filters.length / pageSize);
  const start = page * pageSize;
  const paginatedFilters = filters.slice(start, start + pageSize);

  return (
    <div className="flex items-center gap-2 mb-6">
      <button
        onClick={() => setPage((p) => Math.max(0, p - 1))}
        disabled={page === 0}
        className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50"
        aria-label="Previous Filters"
      >
        &lt;
      </button>
      <div className="flex flex-wrap gap-3 justify-center">
        {paginatedFilters.map((filter, idx) => {
          const realIdx = start + idx;
          return (
            <div key={filter.name} className="relative">
              <button
                className={`px-4 py-2 rounded-full font-semibold border-2 transition 
                  ${activeFilter === realIdx ? "border-pink-500 bg-pink-100" : "border-pink-200 bg-pink-50"}
                  hover:bg-pink-200`}
                onClick={() => setActiveFilter(activeFilter === realIdx ? null : realIdx)}
              >
                {filter.name}
              </button>
              {activeFilter === realIdx && (
                <div className="absolute left-0 z-20 mt-2 w-56 bg-white rounded-xl shadow-lg border border-pink-200">
                  <div className="p-2 text-sm text-pink-700 font-semibold">Apply to:</div>
                  {images.map((img, i) => (
                    <button
                      key={i}
                      className={`flex items-center gap-2 w-full px-4 py-2 hover:bg-pink-50 rounded-lg transition
                        ${filtersState[i] === filter.value ? "bg-pink-100 font-bold" : ""}
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
      <button
        onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
        disabled={page === pageCount - 1}
        className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50"
        aria-label="Next Filters"
      >
        &gt;
      </button>
    </div>
  );
}
