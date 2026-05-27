// export default function StripLayoutSelection({ onSelectLayout }) {
//   const layouts = [
//     { id: 1, label: "1 Shot", img: "/images/strip-1.png", shots: 1 },
//     { id: 3, label: "3 Shot", img: "/images/strip-3.png", shots: 3 },
//     { id: 4, label: "4 Shot", img: "/images/strip-4.png", shots: 4 },
//     { id: 6, label: "6 Shot", img: "/images/strip-6.png", shots: 6 },
//   ];

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center">
//       <h2 className="text-3xl font-bold mb-8 text-pink-600">Choose Your Strip Layout</h2>
//       <div className="flex flex-wrap gap-8 justify-center items-center">
//         {layouts.map(layout => (
//           <button
//             key={layout.id}
//             onClick={() => onSelectLayout(layout)}
//             className="bg-white rounded-2xl shadow-xl flex flex-col items-center p-6 w-56 h-72 transition-transform hover:scale-105 hover:shadow-2xl focus:outline-none"
//           >
//             <div className="w-full h-40 flex items-center justify-center mb-4">
//               <img
//                 src={layout.img}
//                 alt={layout.label}
//                 className="object-contain h-full"
//               />
//             </div>
//             <span className="mt-auto text-lg font-semibold text-pink-500">{layout.label}</span>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { useTheme } from "./ThemeContext";

export default function StripLayoutSelection({ onSelectLayout }) {
  const { colors } = useTheme();
  const [animatingId, setAnimatingId] = useState(null);
  const layouts = [
    { id: 1, label: "1 Shot", img: "/images/strip-1.png", shots: 1 },
    { id: 3, label: "3 Shot", img: "/images/strip-3.png", shots: 3 },
    { id: 4, label: "4 Shot", img: "/images/strip-4.png", shots: 4 },
    { id: 6, label: "6 Shot", img: "/images/strip-6.png", shots: 6 },
  ];

  const handleSelect = (layout) => {
    setAnimatingId(layout.id);
    setTimeout(() => {
      onSelectLayout(layout);
    }, 250); // Small delay to let the click animation play out
  };

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 pt-16 md:pt-0">
      <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-8 ${colors.text} text-center`}>
        Choose Your Strip Layout
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 md:gap-8 w-full max-w-4xl">
        {layouts.map(layout => (
          <button
            key={layout.id}
            onClick={() => handleSelect(layout)}
            className={`group relative bg-white bg-opacity-20 backdrop-blur-md rounded-2xl shadow-xl flex flex-col items-center p-3 sm:p-4 md:p-6 w-full h-40 sm:h-56 md:h-72 transition-all duration-200 focus:outline-none ${
              animatingId === layout.id 
                ? 'scale-90 brightness-150 shadow-none' 
                : 'hover:scale-105 hover:bg-opacity-30 hover:shadow-2xl'
            }`}
          >
            {/* Viewfinder Brackets */}
            <div className="absolute inset-3 pointer-events-none z-10 opacity-0 scale-125 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out">
              {/* Top Left */}
              <div className={`absolute top-0 left-0 w-4 md:w-6 h-[2px] md:h-1 bg-gradient-to-r ${colors.primaryGradient} rounded-tl`}></div>
              <div className={`absolute top-0 left-0 w-[2px] md:w-1 h-4 md:h-6 bg-gradient-to-b ${colors.primaryGradient} rounded-tl`}></div>
              {/* Top Right */}
              <div className={`absolute top-0 right-0 w-4 md:w-6 h-[2px] md:h-1 bg-gradient-to-l ${colors.primaryGradient} rounded-tr`}></div>
              <div className={`absolute top-0 right-0 w-[2px] md:w-1 h-4 md:h-6 bg-gradient-to-b ${colors.primaryGradient} rounded-tr`}></div>
              {/* Bottom Left */}
              <div className={`absolute bottom-0 left-0 w-4 md:w-6 h-[2px] md:h-1 bg-gradient-to-r ${colors.primaryGradient} rounded-bl`}></div>
              <div className={`absolute bottom-0 left-0 w-[2px] md:w-1 h-4 md:h-6 bg-gradient-to-t ${colors.primaryGradient} rounded-bl`}></div>
              {/* Bottom Right */}
              <div className={`absolute bottom-0 right-0 w-4 md:w-6 h-[2px] md:h-1 bg-gradient-to-l ${colors.primaryGradient} rounded-br`}></div>
              <div className={`absolute bottom-0 right-0 w-[2px] md:w-1 h-4 md:h-6 bg-gradient-to-t ${colors.primaryGradient} rounded-br`}></div>
            </div>

            <div className="w-full h-20 sm:h-28 md:h-40 flex items-center justify-center mb-2 sm:mb-4 relative z-20">
              <img
                src={layout.img}
                alt={layout.label}
                className="object-contain h-full"
              />
            </div>
            <span className={`mt-auto text-sm sm:text-base md:text-lg font-bold ${colors.text} drop-shadow-sm relative z-20`}>{layout.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
