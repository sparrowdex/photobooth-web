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

import { useTheme } from "./ThemeContext";

export default function StripLayoutSelection({ onSelectLayout }) {
  const { colors } = useTheme();
  const layouts = [
    { id: 1, label: "1 Shot", img: "/images/strip-1.png", shots: 1 },
    { id: 3, label: "3 Shot", img: "/images/strip-3.png", shots: 3 },
    { id: 4, label: "4 Shot", img: "/images/strip-4.png", shots: 4 },
    { id: 6, label: "6 Shot", img: "/images/strip-6.png", shots: 6 },
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 pt-16 md:pt-0">
      <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-8 ${colors.text} text-center`}>
        Choose Your Strip Layout
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 md:gap-8 w-full max-w-4xl">
        {layouts.map(layout => (
          <button
            key={layout.id}
            onClick={() => onSelectLayout(layout)}
            className={`${colors.card} rounded-2xl shadow-xl flex flex-col items-center p-3 sm:p-4 md:p-6 w-full h-40 sm:h-56 md:h-72 transition-transform hover:scale-105 hover:shadow-2xl focus:outline-none`}
          >
            <div className="w-full h-20 sm:h-28 md:h-40 flex items-center justify-center mb-2 sm:mb-4">
              <img
                src={layout.img}
                alt={layout.label}
                className="object-contain h-full"
              />
            </div>
            <span className={`mt-auto text-sm sm:text-base md:text-lg font-semibold ${colors.text}`}>{layout.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
