// Stackable CSS filters for the photos (applied in order as layers)
export const FILTERS = [
  { name: "None", value: "" },
  { name: "Soft Focus", value: "blur(0.5px) contrast(0.98) saturate(1.05)" }, // New filter for subtle skin smoothing
  // Classic Pop & Vibrant
  { name: "Clarendon", value: "contrast(1.2) saturate(1.35) brightness(1.1)" },
  { name: "Lark", value: "brightness(1.1) contrast(0.9) saturate(1.5)" },
  { name: "Juno", value: "saturate(1.4) contrast(1.1) sepia(0.1) hue-rotate(-10deg)" },
  { name: "Mayfair", value: "contrast(1.1) saturate(1.1)" },
  { name: "Perpetua", value: "saturate(1.2) contrast(1.1)" },
  // Warm & Vintage Fades
  { name: "Gingham", value: "brightness(1.05) hue-rotate(350deg) contrast(0.9) saturate(0.8)" },
  { name: "Reyes", value: "sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)" },
  { name: "Crema", value: "sepia(0.5) brightness(1.15) contrast(0.9) hue-rotate(-2deg)" },
  { name: "Ludwig", value: "sepia(0.25) contrast(1.05) saturate(1.5) hue-rotate(-15deg)" },
  { name: "Aden", value: "hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)" },
  { name: "Slumber", value: "saturate(0.66) brightness(1.05) contrast(0.9)" },
  { name: "Amaro", value: "sepia(0.35) contrast(0.9) brightness(1.1) saturate(1.3)" },
  { name: "Rise", value: "sepia(0.2) brightness(1.05) contrast(0.9)" },
  { name: "Hudson", value: "sepia(0.25) contrast(0.9) brightness(1.2) saturate(1.1) hue-rotate(-15deg)" },
  { name: "Valencia", value: "sepia(0.08) contrast(1.08) brightness(1.08)" },
  { name: "Sierra", value: "sepia(0.21) contrast(0.8) brightness(1.02) saturate(0.87)" },
  { name: "Willow", value: "sepia(0.2) contrast(0.95) brightness(0.9) saturate(0.85)" },
  // High Contrast & Dramatic
  { name: "X-Pro II", value: "sepia(0.3) contrast(1.25) brightness(1.1) hue-rotate(-5deg)" },
  { name: "Lo-Fi", value: "sepia(0.4) contrast(1.5) saturate(1.1)" },
  { name: "Hefe", value: "sepia(0.4) contrast(1.5) brightness(1.2) saturate(1.4) hue-rotate(-10deg)" },
  { name: "Nashville", value: "sepia(0.2) contrast(1.2) brightness(1.05) saturate(1.2) hue-rotate(15deg)" },
  { name: "1977", value: "sepia(0.3) contrast(1.1) brightness(1.1) saturate(1.3)" },
  { name: "Kelvin", value: "sepia(0.4) contrast(1.1) brightness(1.1) saturate(2.4) hue-rotate(-10deg)" },
  // Black & White
  { name: "Inkwell", value: "grayscale(1) contrast(1.2) brightness(1.05)" },
  { name: "Moon", value: "grayscale(1) contrast(1.1) brightness(1.1)" },
  { name: "Noir", value: "grayscale(1) contrast(1.3) brightness(0.9)" },
  // Specialty / Artistic
  { name: "Cyberpunk", value: "contrast(1.5) saturate(2.5) hue-rotate(150deg) brightness(0.9)" },
  { name: "Matrix", value: "contrast(1.3) saturate(1.5) hue-rotate(270deg)" },
];
