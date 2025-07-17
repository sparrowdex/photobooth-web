
import frameMappings from "./frameMappings";
import FrameLayout from "./FrameLayout";
import { useTheme } from "./ThemeContext";

export default function PhotoLayoutCard({ images, filters, selectedDesign, transparentCard }) {
  const { colors } = useTheme();
  const mappingKey = selectedDesign?.key;
  const mapping = mappingKey ? frameMappings[mappingKey] : null;

  if (mapping) {
    return (
      <div className={transparentCard ? "bg-transparent shadow-none p-6 flex flex-col items-center" : `${colors.card} rounded-2xl shadow-2xl p-6 flex flex-col items-center`}>
        <FrameLayout images={images} mapping={mapping} filters={filters} />
      </div>
    );
  }

  // Fallback: generic grid
  const isGrid = images.length === 6;
  const columns = isGrid ? 2 : 1;
  const imageWidth = 180;
  const imageHeight = 160;
  const gap = 16;
  const rows = Math.ceil(images.length / columns);
  const gridWidth = isGrid ? imageWidth * 2 + gap : imageWidth;
  const gridHeight = rows * imageHeight + (rows - 1) * gap;

  return (
    <div className={`${colors.card} rounded-2xl shadow-2xl p-6 flex flex-col items-center`}>
      <div
        className={`relative grid ${isGrid ? "grid-cols-2" : "grid-cols-1"} gap-4`}
        style={{
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
        }}
      >
        {selectedDesign?.url && (
          <img
            src={selectedDesign.url}
            alt="Selected Design"
            className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none z-10"
            style={{
              width: `${gridWidth}px`,
              height: `${gridHeight}px`,
            }}
          />
        )}
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Shot ${i + 1}`}
            className={`rounded-lg border-2 ${colors.borderLight} object-cover relative z-20`}
            style={{
              width: `${imageWidth}px`,
              height: `${imageHeight}px`,
              filter: filters[i],
            }}
          />
        ))}
      </div>
    </div>
  );
}
