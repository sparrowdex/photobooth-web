//used to map the photo frames to the captured image for all types of shots
const frameMappings = {
  "1shot-design1": {
    frame: "/designs/1shot-design1.png",
    frameWidth: 350,
    frameHeight: 430,
    windows: [
      { left: 20, top: 25, width: 310, height: 320, borderRadius: 0 }
    ],
  },
  "1shot-design2": {
    frame: "/designs/1shot-design2.png",
    frameWidth: 500,
    frameHeight: 375,
    windows: [
      { left: 40, top: 50, width: 300, height: 270, borderRadius: 24 }
    ],
  },
  "1shot-design3": {
    frame: "/designs/1shot-design3.png",
    frameWidth: 400,
    frameHeight: 500,
    windows: [
      { left: 20, top: 10, width: 350, height: 400, borderRadius: 24 }
    ],
  },
  "1shot-design4": {
    frame: "/designs/1shot-design4.png",
    frameWidth: 500,
    frameHeight: 450,
    windows: [
      { left: 90, top: 10, width: 300, height: 350, borderRadius: 10 }
    ],
  },
  "1shot-design5": {
    frame: "/designs/1shot-design5.png",
    frameWidth: 600,
    frameHeight: 375,
    windows: [
      { left: 40, top: 50, width: 400, height: 295, borderRadius: 24 }
    ],
  },
  "1shot-design6": {
    frame: "/designs/1shot-design6.png",
    frameWidth: 530,
    frameHeight: 535,
    windows: [
      { left: 115, top: 100, width: 300, height: 305, borderRadius: 120 }
    ],
  },
  "1shot-design7": {
    frame: "/designs/1shot-design7.png",
    frameWidth: 550,
    frameHeight: 350,
    windows: [
      { left: 38, top: 50, width: 250, height: 270, borderRadius: 0 }
    ],
    // look of the fill-in form for this frame (matches the card's paper + ink)
    formTheme: { title: "Girlfriend", paper: "#fbe3ec", edge: "#f3bfd2", ink: "#2b2f4a", stamp: "#d0487f" },
    // fill-in blanks on the license card (frame units; y = middle of the writing line)
    textFields: [
      { id: "name", label: "Name", x: 312, y: 106, width: 188, fontSize: 15 },
      { id: "dob", label: "Date of birth", x: 366, y: 141, width: 134, fontSize: 15 },
      { id: "signature", label: "Signature", x: 268, y: 296, width: 240, fontSize: 15, font: "signature", align: "center", color: "#1d3b8a" },
    ],
  },
  "1shot-design8": {
    frame: "/designs/1shot-design8.png",
    frameWidth: 500,
    frameHeight: 500,
    windows: [
      { left: 50, top: 140, width: 300, height: 230, borderRadius: 24 }
    ],
  },
  "1shot-design9": {
    frame: "/designs/1shot-design9.png",
    frameWidth: 500,
    frameHeight: 630,
    windows: [
      { left: 40, top: 48, width: 420, height: 435, borderRadius: 0 }
    ],
  },

  "1shot-design10": {
    frame: "/designs/1shot-design10.png",
    frameWidth: 500,
    frameHeight: 302, // matches the 736x445 PNG aspect ratio so the frame isn't stretched
    windows: [
      // photo cutout is on the LEFT side of this license card (the right side is opaque text)
      { left: 35, top: 50, width: 198, height: 214, borderRadius: 0 }
    ],
    formTheme: { title: "Boyfriend", paper: "#e2eef6", edge: "#b9d3e5", ink: "#24324f", stamp: "#d0487f" },
    textFields: [
      { id: "name", label: "Name", x: 284, y: 92, width: 172, fontSize: 14 },
      { id: "dob", label: "Date of birth", x: 334, y: 124, width: 122, fontSize: 14 },
      { id: "signature", label: "Signature", x: 244, y: 263, width: 222, fontSize: 14, font: "signature", align: "center", color: "#1d3b8a" },
    ],
  },
  "1shot-design11": {
    frame: "/designs/1shot-design11.png",
    frameWidth: 550,
    frameHeight: 500,
    windows: [
      // Placeholder coordinates, adjust to fit your design
      { left: 25, top: 25, width: 500, height: 400, borderRadius: 0 }
    ],
  },
  "1shot-design12": {
    frame: "/designs/1shot-design12.png",
    frameWidth: 500,
    frameHeight: 600,
    windows: [
      // Placeholder coordinates, adjust to fit your design
      { left: 60, top: 85, width: 355, height: 400, borderRadius: 0 }
    ],
  },
  "1shot-design13": {
    frame: "/designs/1shot-design13.png",
    frameWidth: 500,
    frameHeight: 500,
    windows: [
      // Placeholder coordinates, adjust to fit your design
      { left: 80, top: 155, width: 300, height: 225, borderRadius: 0 }
    ],
  },

  "3shot-design1": {
    frame: "/designs/3shot-design1.png",
    frameWidth: 450,
    frameHeight: 1000,
    windows: [
      { left: 65, top: 10, width: 317, height: 280, borderRadius: 24 },
      { left: 65, top: 300, width: 317, height: 250, borderRadius: 24 },
      { left: 65, top: 560, width: 317, height: 280, borderRadius: 24 },
    ],
  },
  "3shot-design2": {
    frame: "/designs/3shot-design2.png",
    frameWidth: 450,
    frameHeight: 1000,
    windows: [
      { left: 40, top: 10, width: 370, height: 330, borderRadius: 0 },
      { left: 40, top: 335, width: 370, height: 330, borderRadius: 24 },
      { left: 40, top: 657, width: 370, height: 340, borderRadius: 24 },
    ],
  },
  "3shot-design3": {
    frame: "/designs/3shot-design3.png",
    frameWidth: 496,
    frameHeight: 1200,
    windows: [
      { left: 20, top: 40, width: 450, height: 330, borderRadius: 24 },
      { left: 20, top: 376, width: 450, height: 330, borderRadius: 24 },
      { left: 20, top: 710, width: 450, height: 340, borderRadius: 24 },
    ],
  },

  "3shot-design4": {
    frame: "/designs/3shot-design4.png",
    frameWidth: 400,
    frameHeight: 900,
    windows: [
      { left: 80, top: 25, width: 250, height: 250, borderRadius: 0 },
      { left: 80, top: 293, width: 250, height: 250, borderRadius: 0 },
      { left: 80, top: 563, width: 250, height: 250, borderRadius: 0 },
    ],
  },
  "3shot-design5": {
    frame: "/designs/3shot-design5.png",
    frameWidth: 450,
    frameHeight: 1000,
    windows: [
      { left: 45, top: 30, width: 350, height: 290, borderRadius: 0 },
      { left: 45, top: 345, width: 350, height: 290, borderRadius: 0 },
      { left: 45, top: 667, width: 350, height: 290, borderRadius: 0 },
    ],
  },
  "3shot-design6": {
    frame: "/designs/3shot-design6.png",
    frameWidth: 470,
    frameHeight: 1020,
    windows: [
      // You may need to tweak left, top, width, and height to perfectly align with your transparent cutouts
      { left: 55, top: 52, width: 350, height: 280, borderRadius: 0 },
      { left: 62, top: 380, width: 350, height: 280, borderRadius: 0 },
      { left: 55, top: 710, width: 350, height: 280, borderRadius: 0 },
    ],
  },
  "3shot-design7": {
    frame: "/designs/3shot-design7.png",
    frameWidth: 480,
    frameHeight: 1000,
    windows: [
      // Placeholder coordinates, adjust to fit your design
      { left: 95, top: 50, width: 270, height: 260, borderRadius: 0 },
      { left: 95, top: 300, width: 270, height: 240, borderRadius: 0 },
      { left: 95, top: 545, width: 270, height: 240, borderRadius: 0 },
    ],
  },
  "3shot-design8": {
    frame: "/designs/3shot-design8.png",
    frameWidth: 470,
    frameHeight: 1020,
    windows: [
      // Placeholder coordinates, adjust to fit your design
      { left: 69, top: 30, width: 340, height: 270, borderRadius: 0 },
      { left: 69, top: 370, width: 340, height: 280, borderRadius: 0 },
      { left: 69, top: 710, width: 340, height: 280, borderRadius: 0 },
    ],
  },
  // "3shot-design9": {
  //   frame: "/designs/3shot-design9.png",
  //   frameWidth: 470,
  //   frameHeight: 1020,
  //   windows: [
  //     // Placeholder coordinates, adjust to fit your design
  //     { left: 55, top: 50, width: 350, height: 280, borderRadius: 0 },
  //     { left: 55, top: 380, width: 350, height: 280, borderRadius: 0 },
  //     { left: 55, top: 710, width: 350, height: 280, borderRadius: 0 },
  //   ],
  // },
  "4shot-design1": {
    frame: "/designs/4shot-design1.png",
    frameWidth: 525,
    frameHeight: 1259,
    windows: [
      { left: 75, top: 25, width: 378, height: 290, borderRadius: 24 },
      { left: 75, top: 330, width: 378, height: 290, borderRadius: 24 },
      { left: 75, top: 934, width: 378, height: 290, borderRadius: 24 },//4th picture
      { left: 75, top: 640, width: 378, height: 290, borderRadius: 24 }, //3rd picture
    ],
  },
  "4shot-design2": {
    frame: "/designs/4shot-design2.png",
    frameWidth: 500,
    frameHeight: 1200,
    windows: [
      { left: 109, top: 10, width: 383, height: 295, borderRadius: 0 },
      { left: 109, top: 325, width: 383, height: 293, borderRadius: 0 },
      { left: 109, top: 915, width: 383, height: 285, borderRadius: 0 },
      { left: 109, top: 620, width: 383, height: 290, borderRadius: 0 },
    ],
  },
  "4shot-design3": {
    frame: "/designs/4shot-design3.png",
    frameWidth: 525,
    frameHeight: 1259,
    windows: [
      { left: 50, top: 25, width: 418, height: 290, borderRadius: 24 },
      { left: 50, top: 290, width: 418, height: 290, borderRadius: 24 },
      { left: 50, top: 810, width: 418, height: 290, borderRadius: 24 },//4th picture
      { left: 50, top: 555, width: 418, height: 290, borderRadius: 24 }, //3rd picture
    ],
  },
  "4shot-design4": {
    frame: "/designs/4shot-design4.png",
    frameWidth: 500,
    frameHeight: 1200,
    windows: [
      { left: 70, top: 62, width: 350, height: 285, borderRadius: 24 },
      { left: 70, top: 345, width: 350, height: 270, borderRadius: 24 },
      { left: 70, top: 910, width: 350, height: 270, borderRadius: 24 },
      { left: 70, top: 630, width: 350, height: 280, borderRadius: 24 },
    ],
  },
  "4shot-design5": {
    frame: "/designs/4shot-design5.png",
    frameWidth: 525,
    frameHeight: 1259,
    windows: [
      { left: 70, top: 25, width: 383, height: 290, borderRadius: 24 },
      { left: 70, top: 330, width: 383, height: 290, borderRadius: 24 },
      { left: 70, top: 930, width: 383, height: 290, borderRadius: 24 },
      { left: 70, top: 645, width: 383, height: 290, borderRadius: 24 },
    ],
  },
  "4shot-design6": {
    frame: "/designs/4shot-design6.png",
    frameWidth: 525,
    frameHeight: 1259,
    windows: [
      // Placeholder coordinates, adjust to fit your design
      { left: 80, top: 25, width: 365, height: 290, borderRadius: 0 },
      { left: 80, top: 330, width: 365, height: 290, borderRadius: 0 },
      { left: 80, top: 645, width: 365, height: 290, borderRadius: 0 },
      { left: 80, top: 930, width: 365, height: 290, borderRadius: 0 },
    ],
  },
  "4shot-design7": {
    frame: "/designs/4shot-design7.png",
    frameWidth: 525,
    frameHeight: 1259,
    windows: [
      // Placeholder coordinates, adjust to fit your design
      { left: 80, top: 25, width: 365, height: 268, borderRadius: 0 },
      { left: 80, top: 295, width: 365, height: 260, borderRadius: 0 },
      { left: 80, top: 560, width: 365, height: 260, borderRadius: 0 },
      { left: 80, top: 800, width: 365, height: 260, borderRadius: 0 },
    ],
  },
  "4shot-design8": {
    frame: "/designs/4shot-design8.png",
    frameWidth: 525,
    frameHeight: 1259,
    windows: [
      // Placeholder coordinates, adjust to fit your design
      { left: 80, top: 25, width: 365, height: 250, borderRadius: 0 },
      { left: 80, top: 275, width: 365, height: 260, borderRadius: 0 },
      { left: 80, top: 550, width: 365, height: 260, borderRadius: 0 },
      { left: 80, top: 820, width: 365, height: 260, borderRadius: 0 },
    ],
  },
  "6shot-design1": {
    frame: "/designs/6shot-design1.png",
    frameWidth: 525,
    frameHeight: 1000,
    windows: [
      { left: 10, top: 10, width: 230, height: 290, borderRadius: 24 },
      { left: 10, top: 340, width: 230, height: 290, borderRadius: 24 },
      { left: 10, top: 677, width: 230, height: 290, borderRadius: 24 },
      { left: 280, top: 10, width: 230, height: 290, borderRadius: 24 },
      { left: 280, top: 340, width: 230, height: 290, borderRadius: 24 },
      { left: 280, top: 677, width: 230, height: 290, borderRadius: 24 },
    ],
  },
  "6shot-design2": {
    frame: "/designs/6shot-design2.png",
    frameWidth: 525,
    frameHeight: 1000,
    windows: [
      { left: 15, top: 10, width: 317, height: 290, borderRadius: 24 }, //images do not seem stretched with this particular width and height
      { left: 15, top: 340, width: 317, height: 290, borderRadius: 24 },
      { left: 15, top: 677, width: 317, height: 290, borderRadius: 24 },
      { left: 270, top: 10, width: 250, height: 290, borderRadius: 24 },
      { left: 270, top: 340, width: 250, height: 290, borderRadius: 24 },
      { left: 270, top: 677, width: 250, height: 290, borderRadius: 24 },
    ],
  },
  "6shot-design3": {
    frame: "/designs/6shot-design3.png",
    frameWidth: 525,
    frameHeight: 1100,
    windows: [
      { left: 10, top: 10, width: 230, height: 280, borderRadius: 10 },
      { left: 10, top: 340, width: 230, height: 297, borderRadius: 10 },
      { left: 10, top: 677, width: 230, height: 305, borderRadius: 10 },
      { left: 277, top: 10, width: 230, height: 290, borderRadius: 10 },
      { left: 277, top: 340, width: 230, height: 305, borderRadius: 10 },
      { left: 270, top: 677, width: 230, height: 300, borderRadius: 10 },
    ],
  },
  // "6shot-design4": {
  //   frame: "/photobooth-web/designs/6shot-design4.png",
  //   frameWidth: 525,
  //   frameHeight: 1000,
  //   windows: [
  //     { left: 10, top: 10, width: 230, height: 290, borderRadius: 24 },
  //     { left: 10, top: 340, width: 230, height: 290, borderRadius: 24 },
  //     { left: 10, top: 677, width: 230, height: 290, borderRadius: 24 },
  //     { left: 280, top: 10, width: 230, height: 290, borderRadius: 24 },
  //     { left: 280, top: 340, width: 230, height: 290, borderRadius: 24 },
  //     { left: 280, top: 677, width: 230, height: 290, borderRadius: 24 },
  //   ],
  // },
  // Add more mappings as needed
  //when you want to check if images are aligned properly set borderRadius:71
};
export default frameMappings;

// Frames made in the frame studio are added here at runtime, so every part of the app that
// looks up frameMappings[key] (preview, PNG/GIF saving, postcard) handles them like built-ins.
export function registerFrame(key, mapping) {
  frameMappings[key] = mapping;
}
//[fixed]current problem: Photo is mapped but after downloading some of them get stretched(updated download logic in stripdesign)
//solution: add a feature where if the photo excedds the photo overlay, the exceeded part disappears
//solution: choose photo frames with more feasible mapping to the original 640x480 camera view
//[fixed]problem:if zoom more than 50% the 3shot designs exceed the webpage, need to fix that (now fixed with 2 designs per page)