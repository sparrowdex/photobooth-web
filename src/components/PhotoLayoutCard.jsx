
// import frameMappings from "./frameMappings";

// export default function PhotoLayoutCard({ images, filters, selectedDesign }) {
//   // selectedDesign should be an object like { key: "1shot-design1", url: "/designs/1shot-design1.jpg" }
//   const mappingKey = selectedDesign?.key;
//   const mapping = mappingKey ? frameMappings[mappingKey] : null;

//   if (mapping) {
//     const { frame, frameWidth, frameHeight, windows } = mapping;
//     return (
//       <div
//         className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center"
//         style={{ width: frameWidth, height: frameHeight }}
//       >
//         <div className="relative" style={{ width: frameWidth, height: frameHeight }}>
//           {windows.map((win, idx) => (
//             <div
//               key={idx}
//               className="absolute"
//               style={{
//                 left: win.left,
//                 top: win.top,
//                 width: win.width,
//                 height: win.height,
//                 overflow: "hidden",
//                 borderRadius: win.borderRadius || 0,
//                 zIndex: 5,
//                 background: "#000", // fallback for empty area
//               }}
//             >
//               {images[idx] && (
//                 <img
//                   src={images[idx]}
//                   alt={`Photo ${idx + 1}`}
//                   className="w-full h-full object-cover"
//                   style={{
//                     filter: filters && filters[idx] ? filters[idx] : "none",
//                   }}
//                 />
//               )}
//             </div>
//           ))}
//           <img
//             src={frame}
//             alt="Frame Overlay"
//             className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
//             draggable={false}
//             style={{ display: "block" }}
//           />
//         </div>
//       </div>
//     );
//   }

//   // Fallback: generic grid for unmapped layouts
//   const isGrid = images.length === 6;
//   const columns = isGrid ? 2 : 1;
//   const imageWidth = 180;
//   const imageHeight = 160;
//   const gap = 16;
//   const rows = Math.ceil(images.length / columns);
//   const gridWidth = isGrid ? imageWidth * 2 + gap : imageWidth;
//   const gridHeight = rows * imageHeight + (rows - 1) * gap;

//   return (
//     <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center">
//       <div
//         className={`relative grid ${isGrid ? "grid-cols-2" : "grid-cols-1"} gap-4`}
//         style={{
//           width: `${gridWidth}px`,
//           height: `${gridHeight}px`,
//         }}
//       >
//         {selectedDesign?.url && (
//           <img
//             src={selectedDesign.url}
//             alt="Selected Design"
//             className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none z-10"
//             style={{
//               width: `${gridWidth}px`,
//               height: `${gridHeight}px`,
//             }}
//           />
//         )}
//         {images.map((img, i) => (
//           <img
//             key={i}
//             src={img}
//             alt={`Shot ${i + 1}`}
//             className="rounded-lg border-2 border-pink-200 object-cover relative z-20"
//             style={{
//               width: `${imageWidth}px`,
//               height: `${imageHeight}px`,
//               filter: filters[i],
//             }}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }
//needs modifications
import frameMappings from "./frameMappings";
import FrameLayout from "./FrameLayout";

export default function PhotoLayoutCard({ images, filters, selectedDesign }) {
  const mappingKey = selectedDesign?.key;
  const mapping = mappingKey ? frameMappings[mappingKey] : null;

  if (mapping) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center">
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
    <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center">
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
            className="rounded-lg border-2 border-pink-200 object-cover relative z-20"
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
