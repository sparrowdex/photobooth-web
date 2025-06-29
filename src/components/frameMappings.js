//used to map the photo frames to the captured image for all types of shots
const frameMappings = {
  "1shot-design1": {
    frame: "/photobooth-web/designs/1shot-design1.png",
    frameWidth: 487,
    frameHeight: 587,
    windows: [
      { left: 95, top: 100, width: 300, height: 315, borderRadius: 24 }
    ],
  },
  "1shot-design2": {
    frame: "/photobooth-web/designs/1shot-design2.png",
    frameWidth: 500,
    frameHeight: 375,
    windows: [
      { left: 40, top: 50, width: 300, height: 270, borderRadius: 24 }
    ],
  },
  "1shot-design3": {
    frame: "/photobooth-web/designs/1shot-design3.png",
    frameWidth: 400,
    frameHeight: 500,
    windows: [
      { left: 20, top: 10, width: 350, height: 400, borderRadius: 24 }
    ],
  },
  "1shot-design4": {
    frame: "/photobooth-web/designs/1shot-design4.png",
    frameWidth: 500,
    frameHeight: 450,
    windows: [
      { left: 90, top: 10, width: 300, height: 350, borderRadius: 10 }
    ],
  },
  "1shot-design5": {
    frame: "/photobooth-web/designs/1shot-design5.png",
    frameWidth: 600,
    frameHeight: 375,
    windows: [
      { left: 40, top: 50, width: 400, height: 295, borderRadius: 24 }
    ],
  },
  "1shot-design6": {
    frame: "/photobooth-web/designs/1shot-design6.png",
    frameWidth: 510,
    frameHeight: 530,
    windows: [
      { left: 100, top: 90, width: 300, height: 295, borderRadius: 100 }
    ],
  },
  "1shot-design7": {
    frame: "/photobooth-web/designs/1shot-design7.png",
    frameWidth: 550,
    frameHeight: 350,
    windows: [
      { left: 38, top: 50, width: 250, height: 270, borderRadius: 0 }
    ],
  },
  "1shot-design8": {
    frame: "/photobooth-web/designs/1shot-design8.png",
    frameWidth: 500,
    frameHeight: 500,
    windows: [
      { left: 50, top: 140, width: 300, height: 230, borderRadius: 24 }
    ],
  },
  "1shot-design9": {
    frame: "/photobooth-web/designs/1shot-design9.png",
    frameWidth: 500,
    frameHeight: 630,
    windows: [
      { left: 40, top: 48, width: 420, height: 435, borderRadius: 0 }
    ],
  },

  "3shot-design1": {
    frame: "/photobooth-web/designs/3shot-design1.png",
    frameWidth: 450,
    frameHeight: 1000,
    windows: [
      { left: 65, top: 10, width: 317, height: 290, borderRadius: 24 },
      { left: 65, top: 340, width: 317, height: 290, borderRadius: 24 },
      { left: 65, top: 677, width: 317, height: 290, borderRadius: 24 },
    ],
  },
  "3shot-design2": {
    frame: "/photobooth-web/designs/3shot-design2.png",
    frameWidth: 450,
    frameHeight: 1000,
    windows: [
      { left: 40, top: 10, width: 370, height: 330, borderRadius: 24 },
      { left: 40, top: 335, width: 370, height: 330, borderRadius: 24 },
      { left: 40, top: 657, width: 370, height: 340, borderRadius: 24 },
    ],
  },
  "3shot-design3": {
    frame: "/photobooth-web/designs/3shot-design3.png",
    frameWidth: 496,
    frameHeight: 1200,
    windows: [
      { left: 20, top: 40, width: 450, height: 330, borderRadius: 24 },
      { left: 20, top: 376, width: 450, height: 330, borderRadius: 24 },
      { left: 20, top: 710, width: 450, height: 340, borderRadius: 24 },
    ],
  },
  
  "3shot-design4": {
    frame: "/photobooth-web/designs/3shot-design4.png",
    frameWidth: 350,
    frameHeight: 1100,
    windows: [
      { left: 40, top: 95, width: 250, height: 225, borderRadius: 24 },
      { left: 40, top: 300, width: 300, height: 325, borderRadius: 24 },
      { left: 30, top: 680, width: 300, height: 330, borderRadius: 10 },
    ],
  },
  "3shot-design5": {
    frame: "/photobooth-web/designs/3shot-design5.png",
    frameWidth: 450,
    frameHeight: 1000,
    windows: [
      { left: 45, top: 30, width: 350, height: 290, borderRadius: 0 },
      { left: 45, top: 345, width: 350, height: 290, borderRadius: 0 },
      { left: 45, top: 667, width: 350, height: 290, borderRadius: 0 },
    ],
  },
  "4shot-design1": {
    frame: "/photobooth-web/designs/4shot-design1.png",
    frameWidth: 525,
    frameHeight: 1259,
    windows: [
      { left: 70, top: 25, width: 383, height: 290, borderRadius: 24 },
      { left: 70, top: 330, width: 383, height: 290, borderRadius: 24 },
      { left: 70, top: 930, width: 383, height: 290, borderRadius: 24 },//4th picture
      { left: 70, top: 645, width: 383, height: 290, borderRadius: 24 }, //3rd picture
    ],
  },
  "4shot-design2": {
    frame: "/photobooth-web/designs/4shot-design2.png",
    frameWidth: 720,
    frameHeight: 1270,
    windows: [
      { left: 210, top: 38, width: 383, height: 295, borderRadius: 0 },
      { left: 210, top: 330, width: 383, height: 293, borderRadius: 0 },
      { left: 210, top: 930, width: 383, height: 290, borderRadius: 0 },
      { left: 210, top: 645, width: 383, height: 290, borderRadius: 0 },
    ],
  },
  "4shot-design3": {
    frame: "/photobooth-web/designs/4shot-design3.png",
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
    frame: "/photobooth-web/designs/4shot-design4.png",
    frameWidth: 615,
    frameHeight: 1275,
    windows: [
      { left: 108, top: 100, width: 383, height: 285, borderRadius: 24 },
      { left: 108, top: 383, width: 383, height: 270, borderRadius: 24 },
      { left: 108, top: 930, width: 383, height: 270, borderRadius: 24 },
      { left: 108, top: 645, width: 383, height: 280, borderRadius: 24 },
    ],
  },
  "4shot-design5": {
    frame: "/photobooth-web/designs/4shot-design5.png",
    frameWidth: 525,
    frameHeight: 1259,
    windows: [
      { left: 70, top: 25, width: 383, height: 290, borderRadius: 24 },
      { left: 70, top: 330, width: 383, height: 290, borderRadius: 24 },
      { left: 70, top: 930, width: 383, height: 290, borderRadius: 24 },
      { left: 70, top: 645, width: 383, height: 290, borderRadius: 24 },
    ],
  },
  "6shot-design1": {
    frame: "/photobooth-web/designs/6shot-design1.png",
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
    frame: "/photobooth-web/designs/6shot-design2.png",
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
    frame: "/photobooth-web/designs/6shot-design3.png",
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
//[fixed]current problem: Photo is mapped but after downloading some of them get stretched(updated download logic in stripdesign)
//solution: add a feature where if the photo excedds the photo overlay, the exceeded part disappears 
//solution: choose photo frames with more feasible mapping to the original 640x480 camera view
//[fixed]problem:if zoom more than 50% the 3shot designs exceed the webpage, need to fix that (now fixed with 2 designs per page)