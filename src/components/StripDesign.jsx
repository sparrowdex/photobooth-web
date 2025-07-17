import { useState, useEffect, useRef } from "react";
import PhotoLayoutCard from "./PhotoLayoutCard";
import ControlsCard from "./ControlsCard";
import BackButton from "./BackButton";
import NextButton from "./NextButton";
import frameMappings from "./frameMappings";
import { parseGIF, decompressFrames } from 'gifuct-js';
import { useTheme } from "./ThemeContext";

// PAGINATED DESIGN GRID
function DesignGrid({ designs, selectedDesign, onSelectDesign }) {
  const { colors } = useTheme();
  const pageSize = 2; // 2 per row × 2 rows
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(designs.length / pageSize);
  const start = page * pageSize;
  const paginatedDesigns = designs.slice(start, start + pageSize);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-4 place-items-center">
        {paginatedDesigns.map((design) => (
          <div
            key={design.key}
            className={`border-2 rounded-lg p-2 cursor-pointer transition ${
              selectedDesign?.key === design.key
                ? `${colors.border} ring-2 ring-${colors.primary}-300`
                : "border-gray-200"
            }`}
            onClick={() => onSelectDesign(design)}
          >
            <img src={design.url} alt={design.key} className="w-full h-auto mx-auto" />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 mb-2">
        {page > 0 && (
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition"
          >
            Previous
          </button>
        )}
        {[...Array(pageCount)].map((_, idx) => (
          <button
            key={idx}
            className={`px-2 py-1 rounded ${
              page === idx ? `bg-${colors.primary}-200 font-bold` : "bg-gray-100"
            }`}
            onClick={() => setPage(idx)}
          >
            {idx + 1}
          </button>
        ))}
        {page < pageCount - 1 && (
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition"
          >
            Next
          </button>
        )}
      </div>
    </>
  );
}

// Helper: Draw image with "cover" behavior (crops excess, keeps aspect ratio)
function drawImageCover(ctx, img, x, y, w, h) {
  const imgAspect = img.width / img.height;
  const winAspect = w / h;
  let sx, sy, sw, sh;

  if (imgAspect > winAspect) {
    // Crop left/right
    sh = img.height;
    sw = sh * winAspect;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    // Crop top/bottom
    sw = img.width;
    sh = sw / winAspect;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export default function StripDesign({ images, designs, onBack, captured = [], showLetterOverlay, setShowLetterOverlay }) {
  const { colors } = useTheme();
  const [step, setStep] = useState("filters");
  const [photoFilters, setPhotoFilters] = useState(images.map(() => ""));
  const [selectedDesign, setSelectedDesign] = useState(designs[0] || null);
  const [cardAnim, setCardAnim] = useState("card-enter");
  const [downloadType, setDownloadType] = useState("photo"); // 'photo' or 'gif'
  const [isDownloading, setIsDownloading] = useState(false);
  const [overlayImg, setOverlayImg] = useState(null); // Cache for overlay image
  const [showTextInput, setShowTextInput] = useState(false);
  const [letterText, setLetterText] = useState("");
  // Draggable state
  const [cardPos, setCardPos] = useState({ x: 0, y: 0 }); // relative to center
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mouseStart, setMouseStart] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const [showWriteConfirm, setShowWriteConfirm] = useState(false);
  // Resizable state
  const [cardAspectRatio, setCardAspectRatio] = useState(5 / 7);
  const minWidth = 250;
  const maxWidth = 700;
  const [cardSize, setCardSize] = useState({ width: 500, height: 700 });
  const [resizing, setResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, width: 500, height: 700 });
  // Drag/resize state
  const [dragMode, setDragMode] = useState(null); // 'drag' or 'resize' or null
  // Text box position state (relative to card)
  const [textBoxPos, setTextBoxPos] = useState({ x: 0, y: 0 }); // (0,0) is default center
  const [dragTextBox, setDragTextBox] = useState(false);
  const [textBoxDragStart, setTextBoxDragStart] = useState({ x: 0, y: 0 });
  const [textBoxMouseStart, setTextBoxMouseStart] = useState({ x: 0, y: 0 });
  // Text box rotation state
  const [textBoxRotation, setTextBoxRotation] = useState(0); // degrees
  const [rotatingTextBox, setRotatingTextBox] = useState(false);
  const [rotateStartAngle, setRotateStartAngle] = useState(0);
  const [rotateStartValue, setRotateStartValue] = useState(0);
  // Add state for text box size (width and height)
  const minTextBoxWidth = 120;
  const maxTextBoxWidth = cardSize.width * 0.95;
  const minTextBoxHeight = 40;
  const maxTextBoxHeight = cardSize.height * 0.95;
  const [textBoxSize, setTextBoxSize] = useState({
    width: cardSize.width * 0.8,
    height: Math.max(120, cardSize.height * 0.5),
  });
  const [resizingTextBox, setResizingTextBox] = useState(false);
  const [resizeTextBoxStart, setResizeTextBoxStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Text box drag handlers
  function handleTextBoxDragStart(e) {
    e.stopPropagation();
    setDragTextBox(true);
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    setTextBoxMouseStart({ x: clientX, y: clientY });
    setTextBoxDragStart({ x: textBoxPos.x, y: textBoxPos.y });
    document.body.style.cursor = 'move';
  }
  function handleTextBoxDrag(e) {
    if (!dragTextBox) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    let dx = clientX - textBoxMouseStart.x;
    let dy = clientY - textBoxMouseStart.y;
    let newX = textBoxDragStart.x + dx;
    let newY = textBoxDragStart.y + dy;
    // Clamp so the text box stays fully inside the card
    const boxW = textBoxSize.width;
    const boxH = textBoxSize.height;
    const minX = -cardSize.width / 2 + boxW / 2;
    const maxX = cardSize.width / 2 - boxW / 2;
    const minY = -cardSize.height / 2 + boxH / 2;
    const maxY = cardSize.height / 2 - boxH / 2;
    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));
    setTextBoxPos({ x: newX, y: newY });
  }
  function handleTextBoxDragEnd() {
    setDragTextBox(false);
    document.body.style.cursor = '';
  }

  // Rotation handlers
  function handleTextBoxRotateStart(e) {
    e.stopPropagation();
    setRotatingTextBox(true);
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI;
    setRotateStartAngle(angle);
    setRotateStartValue(textBoxRotation);
    document.body.style.cursor = 'crosshair';
  }
  function handleTextBoxRotate(e) {
    if (!rotatingTextBox) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI;
    let newAngle = rotateStartValue + (angle - rotateStartAngle);
    // Clamp to -90 to +90 for usability
    newAngle = Math.max(-90, Math.min(90, newAngle));
    setTextBoxRotation(newAngle);
  }
  function handleTextBoxRotateEnd() {
    setRotatingTextBox(false);
    document.body.style.cursor = '';
  }

  // Preload overlay image when selectedDesign changes
  useEffect(() => {
    let isMounted = true;
    async function loadOverlay() {
      let overlay = null;
      if (selectedDesign?.url) {
        overlay = new window.Image();
        overlay.crossOrigin = "anonymous";
        overlay.src = selectedDesign.url;
        await new Promise((resolve) => {
          overlay.onload = resolve;
        });
      }
      if (isMounted) {
        setOverlayImg(overlay);
      }
    }
    loadOverlay();
    return () => { isMounted = false; };
  }, [selectedDesign]);

  // Helper to draw text overlay for letter design
  function drawLetterText(ctx, mapping) {
    if (!mapping.textArea || !letterText) return;
    const area = mapping.textArea;
    ctx.save();
    ctx.font = `${area.fontSize || 32}px ${area.fontFamily || 'Pacifico, cursive'}`;
    ctx.fillStyle = area.color || '#b91c1c';
    ctx.textAlign = area.textAlign || 'center';
    ctx.textBaseline = 'top';
    // Word wrap
    const words = letterText.split(' ');
    let line = '';
    const lines = [];
    const maxWidth = area.width;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    const lineHeight = area.fontSize * 1.2;
    let y = area.top;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i].trim(), area.left + area.width / 2, y);
      y += lineHeight;
    }
    ctx.restore();
  }

  // Download logic with frame mapping support and cropping
  const handleDownload = async () => {
    const mappingKey = selectedDesign?.key;
    const mapping = mappingKey ? frameMappings[mappingKey] : null;

    let width, height;
    if (mapping) {
      width = mapping.frameWidth;
      height = mapping.frameHeight;
    } else {
      // fallback grid
      const isGrid = images.length === 6;
      const columns = isGrid ? 2 : 1;
      const imageWidth = 180;
      const imageHeight = 160;
      const gap = 16;
      const rows = Math.ceil(images.length / columns);
      width = columns * imageWidth + (columns - 1) * gap;
      height = rows * imageHeight + (rows - 1) * gap;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (mapping) {
      // Draw each photo in its mapped window, cropping excess
      for (let i = 0; i < mapping.windows.length; i++) {
        const win = mapping.windows[i];
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = images[i];
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.save();
            if (win.borderRadius) {
              ctx.beginPath();
              ctx.moveTo(win.left + win.borderRadius, win.top);
              ctx.lineTo(win.left + win.width - win.borderRadius, win.top);
              ctx.quadraticCurveTo(win.left + win.width, win.top, win.left + win.width, win.top + win.borderRadius);
              ctx.lineTo(win.left + win.width, win.top + win.height - win.borderRadius);
              ctx.quadraticCurveTo(win.left + win.width, win.top + win.height, win.left + win.width - win.borderRadius, win.top + win.height);
              ctx.lineTo(win.left + win.borderRadius, win.top + win.height);
              ctx.quadraticCurveTo(win.left, win.top + win.height, win.left, win.top + win.height - win.borderRadius);
              ctx.lineTo(win.left, win.top + win.borderRadius);
              ctx.quadraticCurveTo(win.left, win.top, win.left + win.borderRadius, win.top);
              ctx.closePath();
              ctx.clip();
            } else {
              ctx.beginPath();
              ctx.rect(win.left, win.top, win.width, win.height);
              ctx.closePath();
              ctx.clip();
            }
            ctx.filter = photoFilters[i] || "none";
            drawImageCover(ctx, img, win.left, win.top, win.width, win.height);
            ctx.restore();
            ctx.filter = "none";
            resolve();
          };
        });
      }
      // Draw overlay
      if (selectedDesign?.url) {
        const overlay = new window.Image();
        overlay.crossOrigin = "anonymous";
        overlay.src = selectedDesign.url;
        await new Promise((resolve) => {
          overlay.onload = () => {
            ctx.drawImage(overlay, 0, 0, width, height);
            resolve();
          };
        });
      }
      // Draw letter text if this is the letter design
      if (mappingKey === "1shot-letter") {
        drawLetterText(ctx, mapping);
      }
    } else {
      // fallback grid logic (your original code)
      const isGrid = images.length === 6;
      const columns = isGrid ? 2 : 1;
      const imageWidth = 180;
      const imageHeight = 160;
      const gap = 16;
      const rows = Math.ceil(images.length / columns);
      for (let i = 0; i < images.length; i++) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = images[i];
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.filter = photoFilters[i] || "none";
            const col = isGrid ? i % 2 : 0;
            const row = isGrid ? Math.floor(i / 2) : i;
            const x = col * (imageWidth + gap);
            const y = row * (imageHeight + gap);
            ctx.drawImage(img, x, y, imageWidth, imageHeight);
            ctx.filter = "none";
            resolve();
          };
        });
      }
      if (selectedDesign?.url) {
        const overlay = new window.Image();
        overlay.crossOrigin = "anonymous";
        overlay.src = selectedDesign.url;
        await new Promise((resolve) => {
          overlay.onload = () => {
            ctx.drawImage(overlay, 0, 0, width, height);
            resolve();
          };
        });
      }
    }

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "photobooth-strip.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // GIF strip download logic (uses only the GIFs in captured and overlayImg)
  const handleDownloadGif = async () => {
    if (!overlayImg || !overlayImg.complete) {
      alert("Frame overlay is still loading. Please wait a moment and try again.");
      return;
    }
    setIsDownloading(true);
    const mappingKey = selectedDesign?.key;
    const mapping = mappingKey ? frameMappings[mappingKey] : null;
    if (!mapping || !captured.length) {
      setIsDownloading(false);
      return;
    }
    const width = mapping.frameWidth;
    const height = mapping.frameHeight;
    // Parse all GIFs and extract frames using gifuct-js
    const gifFramesArr = await Promise.all(
      captured.map(async (cap) => {
        if (!cap.gif) return [];
        const binary = await fetch(cap.gif).then(r => r.arrayBuffer());
        const gif = parseGIF(binary);
        const frames = decompressFrames(gif, true);
        return frames;
      })
    );
    // Find the minimum number of frames across all GIFs
    const minFrames = Math.min(...gifFramesArr.map((arr) => arr.length));
    // For each frame index, composite the GIFs into the strip
    const frames = [];
    for (let frameIdx = 0; frameIdx < minFrames; frameIdx++) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      // Draw each GIF frame in its mapped window using drawImageCover
      for (let i = 0; i < mapping.windows.length; i++) {
        const win = mapping.windows[i];
        const gifFrame = gifFramesArr[i][frameIdx];
        if (!gifFrame) continue;
        // Create an image from the frame's patch
        const imageData = ctx.createImageData(gifFrame.dims.width, gifFrame.dims.height);
        imageData.data.set(gifFrame.patch);
        // Draw the frame patch to an offscreen canvas
        const offCanvas = document.createElement('canvas');
        offCanvas.width = gifFrame.dims.width;
        offCanvas.height = gifFrame.dims.height;
        const offCtx = offCanvas.getContext('2d');
        offCtx.putImageData(imageData, 0, 0);
        const img = new window.Image();
        img.src = offCanvas.toDataURL();
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.save();
            if (win.borderRadius) {
              ctx.beginPath();
              ctx.moveTo(win.left + win.borderRadius, win.top);
              ctx.lineTo(win.left + win.width - win.borderRadius, win.top);
              ctx.quadraticCurveTo(win.left + win.width, win.top, win.left + win.width, win.top + win.borderRadius);
              ctx.lineTo(win.left + win.width, win.top + win.height - win.borderRadius);
              ctx.quadraticCurveTo(win.left + win.width, win.top + win.height, win.left + win.width - win.borderRadius, win.top + win.height);
              ctx.lineTo(win.left + win.borderRadius, win.top + win.height);
              ctx.quadraticCurveTo(win.left, win.top + win.height, win.left, win.top + win.height - win.borderRadius);
              ctx.lineTo(win.left, win.top + win.borderRadius);
              ctx.quadraticCurveTo(win.left, win.top, win.left + win.borderRadius, win.top);
              ctx.closePath();
              ctx.clip();
            } else {
              ctx.beginPath();
              ctx.rect(win.left, win.top, win.width, win.height);
              ctx.closePath();
              ctx.clip();
            }
            drawImageCover(ctx, img, win.left, win.top, win.width, win.height);
            ctx.restore();
            resolve();
          };
        });
      }
      // Draw overlay (always after all GIF frames)
      if (overlayImg && overlayImg.complete) {
        ctx.drawImage(overlayImg, 0, 0, width, height);
      }
      frames.push(canvas.toDataURL("image/png"));
    }
    // Use gifshot to create the final GIF
    const gifshot = await import('gifshot');
    gifshot.createGIF({
      images: frames,
      gifWidth: width,
      gifHeight: height,
      frameDuration: 0.2,
      progressCallback: () => {},
    }, function(obj) {
      setIsDownloading(false);
      if (!obj.error) {
        const link = document.createElement("a");
        link.href = obj.image;
        link.download = "photobooth-strip.gif";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  // In handleDownloadLetter and handleDownloadLetterAndStrip, apply textBoxRotation to the text overlay

  // Download just the letter card as PNG
  const handleDownloadLetter = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = cardSize.width;
    canvas.height = cardSize.height;
    const ctx = canvas.getContext("2d");

    // Create rounded rectangle path
    const radius = 24; // Match the app's border-radius
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(cardSize.width - radius, 0);
    ctx.quadraticCurveTo(cardSize.width, 0, cardSize.width, radius);
    ctx.lineTo(cardSize.width, cardSize.height - radius);
    ctx.quadraticCurveTo(cardSize.width, cardSize.height, cardSize.width - radius, cardSize.height);
    ctx.lineTo(radius, cardSize.height);
    ctx.quadraticCurveTo(0, cardSize.height, 0, cardSize.height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();

    // Load and draw the background image
    const bgImage = new Image();
    bgImage.crossOrigin = "anonymous";
    bgImage.src = letterBgImage;
    
    await new Promise((resolve, reject) => {
      bgImage.onload = resolve;
      bgImage.onerror = reject;
    });

    // Draw background image
    ctx.drawImage(bgImage, 0, 0, cardSize.width, cardSize.height);

    // Draw the text overlay
    if (letterText) {
      // Load the Pacifico font
      const font = new FontFace('Pacifico', 'url(https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6H6MmBp0u-.woff2)');
      await font.load();
      document.fonts.add(font);

      ctx.save();
      // Calculate text area dimensions
      const fontSize = Math.max(18, cardSize.width * 0.056);
      const textAreaWidth = cardSize.width * 0.8;
      const textAreaHeight = Math.max(120, cardSize.height * 0.9); // Fill 90% of card height
      const textBoxCenterX = cardSize.width / 2 + textBoxPos.x;
      const textBoxCenterY = cardSize.height / 2 + textBoxPos.y;
      // Rotate context by textBoxRotation around the text box center
      ctx.translate(textBoxCenterX, textBoxCenterY);
      ctx.rotate((textBoxRotation * Math.PI) / 180);
      ctx.translate(-textBoxCenterX, -textBoxCenterY);
      ctx.font = `${fontSize}px Pacifico, cursive`;
      ctx.fillStyle = '#b91c1c';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      // Preserve line breaks and spaces
      const maxWidth = textAreaWidth * 0.9;
      const rawLines = letterText.split('\n');
      const wrappedLines = [];
      for (let rawLine of rawLines) {
        let line = '';
        const words = rawLine.split(' ');
        for (let n = 0; n < words.length; n++) {
          const testLine = line + (line ? ' ' : '') + words[n];
          const metrics = ctx.measureText(testLine.replace(/ /g, '\u00A0'));
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            wrappedLines.push(line);
            line = words[n];
          } else {
            line = testLine;
          }
        }
        wrappedLines.push(line);
      }
      const lineHeight = fontSize * 1.2;
      const textAreaTop = textBoxCenterY - textAreaHeight / 2;
      const startY = textAreaTop + (textAreaHeight * 0.1);
      const maxLines = Math.floor((textAreaHeight * 0.8) / lineHeight);
      for (let i = 0; i < Math.min(wrappedLines.length, maxLines); i++) {
        const y = startY + (i * lineHeight);
        ctx.fillText(wrappedLines[i].replace(/ /g, '\u00A0'), textBoxCenterX, y);
      }
      ctx.restore();
    }

    // Download the canvas as PNG
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "photobooth-letter.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download letter + strip as composite PNG
  const handleDownloadLetterAndStrip = async () => {
    // Calculate the bounding box that contains both the strip and the rotated letter card (with their current positions)
    const mappingKey = selectedDesign?.key;
    const mapping = mappingKey ? frameMappings[mappingKey] : null;
    const stripWidth = mapping ? mapping.frameWidth : 400;
    const stripHeight = mapping ? mapping.frameHeight : 600;
    // The strip is always at (0,0) in the preview
    const stripX = 0;
    const stripY = 0;
    // The letter card is positioned relative to the center of the preview area
    const previewCenterX = stripWidth / 2;
    const previewCenterY = stripHeight / 2;
    const cardAbsX = previewCenterX - cardSize.width / 2 + cardPos.x;
    const cardAbsY = previewCenterY - cardSize.height / 2 + cardPos.y;
    // Calculate the four corners of the rotated card
    const angle = -6 * Math.PI / 180;
    const cx = cardAbsX + cardSize.width / 2;
    const cy = cardAbsY + cardSize.height / 2;
    const w = cardSize.width;
    const h = cardSize.height;
    const corners = [
      { x: -w / 2, y: -h / 2 },
      { x: w / 2, y: -h / 2 },
      { x: w / 2, y: h / 2 },
      { x: -w / 2, y: h / 2 },
    ].map(pt => {
      // Rotate
      const xRot = pt.x * Math.cos(angle) - pt.y * Math.sin(angle);
      const yRot = pt.x * Math.sin(angle) + pt.y * Math.cos(angle);
      return { x: cx + xRot, y: cy + yRot };
    });
    // Bounding box for rotated card
    const cardMinX = Math.min(...corners.map(pt => pt.x));
    const cardMaxX = Math.max(...corners.map(pt => pt.x));
    const cardMinY = Math.min(...corners.map(pt => pt.y));
    const cardMaxY = Math.max(...corners.map(pt => pt.y));
    // Bounding box for both strip and card
    const minX = Math.min(stripX, cardMinX);
    const minY = Math.min(stripY, cardMinY);
    const maxX = Math.max(stripX + stripWidth, cardMaxX);
    const maxY = Math.max(stripY + stripHeight, cardMaxY);
    const outWidth = maxX - minX;
    const outHeight = maxY - minY;

    // Set a max download size
    const maxDownloadSize = 1200;
    let scale = 1;
    if (outWidth > maxDownloadSize || outHeight > maxDownloadSize) {
      scale = Math.min(maxDownloadSize / outWidth, maxDownloadSize / outHeight);
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(outWidth * scale);
    canvas.height = Math.round(outHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the photo strip at its offset
    const stripOffsetX = (stripX - minX) * scale;
    const stripOffsetY = (stripY - minY) * scale;
    if (mapping) {
      for (let i = 0; i < mapping.windows.length; i++) {
        const win = mapping.windows[i];
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = images[i];
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.save();
            ctx.translate(stripOffsetX, stripOffsetY);
            ctx.scale(scale, scale);
            if (win.borderRadius) {
              ctx.beginPath();
              ctx.moveTo(win.left + win.borderRadius, win.top);
              ctx.lineTo(win.left + win.width - win.borderRadius, win.top);
              ctx.quadraticCurveTo(win.left + win.width, win.top, win.left + win.width, win.top + win.borderRadius);
              ctx.lineTo(win.left + win.width, win.top + win.height - win.borderRadius);
              ctx.quadraticCurveTo(win.left + win.width, win.top + win.height, win.left + win.width - win.borderRadius, win.top + win.height);
              ctx.lineTo(win.left + win.borderRadius, win.top + win.height);
              ctx.quadraticCurveTo(win.left, win.top + win.height, win.left, win.top + win.height - win.borderRadius);
              ctx.lineTo(win.left, win.top + win.borderRadius);
              ctx.quadraticCurveTo(win.left, win.top, win.left + win.borderRadius, win.top);
              ctx.closePath();
              ctx.clip();
            } else {
              ctx.beginPath();
              ctx.rect(win.left, win.top, win.width, win.height);
              ctx.closePath();
              ctx.clip();
            }
            ctx.filter = photoFilters[i] || "none";
            drawImageCover(ctx, img, win.left, win.top, win.width, win.height);
            ctx.restore();
            ctx.filter = "none";
            resolve();
          };
        });
      }
      // Draw strip overlay
      if (selectedDesign?.url) {
        const overlay = new Image();
        overlay.crossOrigin = "anonymous";
        overlay.src = selectedDesign.url;
        await new Promise((resolve) => {
          overlay.onload = () => {
            ctx.save();
            ctx.translate(stripOffsetX, stripOffsetY);
            ctx.scale(scale, scale);
            ctx.drawImage(overlay, 0, 0, mapping.frameWidth, mapping.frameHeight);
            ctx.restore();
            resolve();
          };
        });
      }
    }

    // Draw the letter card at its actual on-screen position (relative to the preview area center)
    // Use the center of the card for rotation and translation
    const cardOffsetX = (cx - minX) * scale;
    const cardOffsetY = (cy - minY) * scale;
    ctx.save();
    ctx.translate(cardOffsetX, cardOffsetY);
    ctx.rotate(angle);
    ctx.translate(-(cardSize.width * scale) / 2, -(cardSize.height * scale) / 2);
    // Rounded rect path
    const radius = 24 * scale;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(cardSize.width * scale - radius, 0);
    ctx.quadraticCurveTo(cardSize.width * scale, 0, cardSize.width * scale, radius);
    ctx.lineTo(cardSize.width * scale, cardSize.height * scale - radius);
    ctx.quadraticCurveTo(cardSize.width * scale, cardSize.height * scale, cardSize.width * scale - radius, cardSize.height * scale);
    ctx.lineTo(radius, cardSize.height * scale);
    ctx.quadraticCurveTo(0, cardSize.height * scale, 0, cardSize.height * scale - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();
    // Draw letter background
    const bgImage = new Image();
    bgImage.crossOrigin = "anonymous";
    bgImage.src = letterBgImage;
    await new Promise((resolve, reject) => {
      bgImage.onload = resolve;
      bgImage.onerror = reject;
    });
    ctx.drawImage(bgImage, 0, 0, cardSize.width * scale, cardSize.height * scale);
    // Draw the text overlay
    if (letterText) {
      // Load the Pacifico font
      const font = new FontFace('Pacifico', 'url(https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6H6MmBp0u-.woff2)');
      await font.load();
      document.fonts.add(font);
      // Match the exact styling from the textarea
      const fontSize = Math.max(18, cardSize.width * 0.056) * scale;
      ctx.font = `${fontSize}px Pacifico, cursive`;
      ctx.fillStyle = '#b91c1c';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const textAreaWidth = cardSize.width * 0.8 * scale;
      const textAreaHeight = Math.max(120, cardSize.height * 0.9) * scale; // Fill 90% of card height
      // Use user-chosen position (scaled)
      const textBoxCenterX = (cardSize.width * scale) / 2 + textBoxPos.x * scale;
      const textBoxCenterY = (cardSize.height * scale) / 2 + textBoxPos.y * scale;
      const textAreaTop = textBoxCenterY - textAreaHeight / 2;
      // Rotate context by textBoxRotation around the text box center
      ctx.translate(textBoxCenterX, textBoxCenterY);
      ctx.rotate((textBoxRotation * Math.PI) / 180);
      ctx.translate(-textBoxCenterX, -textBoxCenterY);
      // Preserve line breaks and spaces
      const maxWidth = textAreaWidth * 0.9;
      const rawLines = letterText.split('\n');
      const wrappedLines = [];
      for (let rawLine of rawLines) {
        let line = '';
        const words = rawLine.split(' ');
        for (let n = 0; n < words.length; n++) {
          const testLine = line + (line ? ' ' : '') + words[n];
          const metrics = ctx.measureText(testLine.replace(/ /g, '\u00A0'));
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            wrappedLines.push(line);
            line = words[n];
          } else {
            line = testLine;
          }
        }
        wrappedLines.push(line);
      }
      const lineHeight = fontSize * 1.2;
      const startY = textAreaTop + (textAreaHeight * 0.1);
      const maxLines = Math.floor((textAreaHeight * 0.8) / lineHeight);
      for (let i = 0; i < Math.min(wrappedLines.length, maxLines); i++) {
        const y = startY + (i * lineHeight);
        ctx.fillText(wrappedLines[i].replace(/ /g, '\u00A0'), textBoxCenterX, y);
      }
    }
    ctx.restore();

    // Download the composite canvas as PNG
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "photobooth-letter-and-strip.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate max characters that fit in the textarea (based on unscaled card size)
  const calculateMaxChars = () => {
    const fontSize = Math.max(18, cardSize.width * 0.056); // unscaled
    const textAreaWidth = cardSize.width * 0.8 * 0.9; // Account for padding
    const maxBoxHeight = Math.max(120, cardSize.height * 0.9) * 0.8;
    const lineHeight = fontSize * 1.2;
    const avgCharsPerLine = Math.floor(textAreaWidth / (fontSize * 0.6)); // Approximate chars per line
    const maxLines = Math.floor(maxBoxHeight / lineHeight);
    return maxLines * avgCharsPerLine;
  };

  const maxChars = calculateMaxChars();
  const isTextOverflowing = letterText.length > maxChars;

  // Update text box size when card size changes
  useEffect(() => {
    setTextBoxSize({
      width: cardSize.width * 0.8,
      height: Math.max(120, cardSize.height * 0.5),
    });
  }, [cardSize.width, cardSize.height]);

  // Update font size and character limit based on text box size
  const fontSize = Math.max(18, textBoxSize.width * 0.07);
  const lineHeight = fontSize * 1.2;
  const avgCharsPerLine = Math.floor(textBoxSize.width * 0.9 / (fontSize * 0.6));
  const maxLines = Math.floor(textBoxSize.height / lineHeight);
  const dynamicTextBoxHeight = maxLines * lineHeight;

  // Drag/resize handlers
  function handleDragStart(e) {
    if (dragMode === 'resize') return;
    setDragMode('drag');
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    setMouseStart({ x: clientX, y: clientY });
    setDragStart({ x: cardPos.x, y: cardPos.y });
    document.body.style.cursor = 'grabbing';
  }
  function handleDrag(e) {
    if (dragMode !== 'drag') return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const dx = clientX - mouseStart.x;
    const dy = clientY - mouseStart.y;
    const maxX = 300;
    const maxY = 200;
    let newX = dragStart.x + dx;
    let newY = dragStart.y + dy;
    newX = Math.max(-maxX, Math.min(maxX, newX));
    newY = Math.max(-maxY, Math.min(maxY, newY));
    setCardPos({ x: newX, y: newY });
  }
  function handleDragEnd() {
    if (dragMode === 'drag') {
      setDragMode(null);
      document.body.style.cursor = '';
    }
  }
  function handleResizeStart(e) {
    e.stopPropagation();
    setDragMode('resize');
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    setResizeStart({ x: clientX, width: cardSize.width, height: cardSize.height });
    document.body.style.cursor = 'nwse-resize';
  }
  function handleResize(e) {
    if (dragMode !== 'resize') return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    let delta = clientX - resizeStart.x;
    let newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + delta));
    let newHeight = Math.round(newWidth / cardAspectRatio);
    setCardSize({ width: newWidth, height: newHeight });
  }
  function handleResizeEnd() {
    if (dragMode === 'resize') {
      setDragMode(null);
      document.body.style.cursor = '';
    }
  }

  // Handle text box resize start
  function handleTextBoxResizeStart(e) {
    e.stopPropagation();
    setResizingTextBox(true);
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    setResizeTextBoxStart({
      x: clientX,
      y: clientY,
      width: textBoxSize.width,
      height: textBoxSize.height,
    });
    document.body.style.cursor = 'nwse-resize';
  }
  function handleTextBoxResize(e) {
    if (!resizingTextBox) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    let newWidth = resizeTextBoxStart.width + (clientX - resizeTextBoxStart.x);
    let newHeight = resizeTextBoxStart.height + (clientY - resizeTextBoxStart.y);
    // Clamp so the box stays inside the card at its current position
    const centerX = cardSize.width / 2 + textBoxPos.x;
    const centerY = cardSize.height / 2 + textBoxPos.y;
    const maxW = Math.min(maxTextBoxWidth, centerX * 2, (cardSize.width - centerX) * 2);
    const maxH = Math.min(maxTextBoxHeight, centerY * 2, (cardSize.height - centerY) * 2);
    newWidth = Math.max(minTextBoxWidth, Math.min(maxW, newWidth));
    newHeight = Math.max(minTextBoxHeight, Math.min(maxH, newHeight));
    setTextBoxSize({ width: newWidth, height: newHeight });
  }
  function handleTextBoxResizeEnd() {
    if (resizingTextBox) {
      setResizingTextBox(false);
      document.body.style.cursor = '';
    }
  }

  // 1. Card (letter overlay) resize handle at bottom-right of the card
  // Card resize handle (bottom-right of the card, outside the text box)
  function handleCardResizeStart(e) {
    e.stopPropagation();
    setDragMode('resize');
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    setResizeStart({ x: clientX, width: cardSize.width, height: cardSize.height });
    document.body.style.cursor = 'nwse-resize';
  }

  // Shuffle animation keyframes
  const shuffleAnim = `@keyframes cardShuffle {
    0% { opacity: 0; z-index: 1; transform: translate(-50%, -80%) scale(0.8) rotate(-18deg); }
    60% { opacity: 1; z-index: 100; transform: translate(-50%, -40%) scale(1.05) rotate(-10deg); }
    80% { opacity: 1; z-index: 100; transform: translate(-50%, -55%) scale(1.02) rotate(-7deg); }
    100% { opacity: 1; z-index: 100; transform: translate(-50%, -50%) scale(1) rotate(-6deg); }
  }`;
  if (typeof document !== 'undefined' && !document.getElementById('cardShuffleAnim')) {
    const style = document.createElement('style');
    style.id = 'cardShuffleAnim';
    style.innerHTML = shuffleAnim;
    document.head.appendChild(style);
  }

  // Letter backgrounds for each layout
  const letterDesignsByLayout = {
    1: [
      '/photobooth-web/designs/1shot-letter.jpg',
      '/photobooth-web/designs/1shot-letter2.jpg',
    ],
    3: ['/photobooth-web/designs/3shot-letter.jpg',
      '/photobooth-web/designs/3shot-letter2.jpg'
    ],
    4: ['/photobooth-web/designs/4shot-letter.jpg',
      '/photobooth-web/designs/4shot-letter2.jpg'
    ],
    6: ['/photobooth-web/designs/6shot-letter.jpg',
      '/photobooth-web/designs/6shot-letter2.jpg'
    ],
  };
  const currentLayout = images.length;
  const availableLetterDesigns = letterDesignsByLayout[currentLayout] || [];
  const [letterDesignIdx, setLetterDesignIdx] = useState(0);
  let letterBgImage = availableLetterDesigns[letterDesignIdx] || availableLetterDesigns[0] || '/photobooth-web/designs/1shot-letter.jpg';

  // Letter frame mappings (fixed dimensions for each design)
  const letterFrameMappings = {
    '/photobooth-web/designs/1shot-letter.jpg': { width: 500, height: 700 },
    '/photobooth-web/designs/1shot-letter2.jpg': { width: 600, height: 400 },
    '/photobooth-web/designs/3shot-letter.jpg': { width: 500, height: 800 },
    '/photobooth-web/designs/3shot-letter2.jpg': { width: 540, height: 800 },
    '/photobooth-web/designs/4shot-letter.jpg': { width: 500, height: 900 },
    '/photobooth-web/designs/4shot-letter2.jpg': { width: 800, height: 500 },
    '/photobooth-web/designs/6shot-letter.jpg': { width: 480, height: 800 },
    '/photobooth-web/designs/6shot-letter2.jpg': { width: 730, height: 500 },
  };

  // When the user switches letter designs, set card size to the mapping's dimensions
  useEffect(() => {
    if (!letterBgImage) return;
    const mapping = letterFrameMappings[letterBgImage];
    if (mapping) {
      setCardSize({ width: mapping.width, height: mapping.height });
      setCardAspectRatio(mapping.width / mapping.height);
    }
  }, [letterBgImage]);

  // Next design handler
  const handleNextLetterDesign = () => {
    setLetterDesignIdx((idx) => (idx + 1) % availableLetterDesigns.length);
  };

  // Previous design handler
  const handlePrevLetterDesign = () => {
    setLetterDesignIdx((idx) => (idx - 1 + availableLetterDesigns.length) % availableLetterDesigns.length);
  };

  // Fix Go Back button (move to download row, always works)
  const handleGoBack = () => {
    setShowLetterOverlay(false);
    setLetterDesignIdx(0);
    setStep("filters");
  };

  // Smoother, springy card animation
  const cardStyle = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: cardSize.width,
    height: cardSize.height,
    zIndex: 100,
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    borderRadius: 24,
    background: `url('${letterBgImage}') center/cover no-repeat`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: dragMode ? 'none' : 'transform 1.1s cubic-bezier(.22,1.61,.36,1)',
    transform: showLetterOverlay
      ? `translate(-50%, -50%) translate(${cardPos.x}px, ${cardPos.y}px) rotate(-6deg) scale(1)`
      : 'translate(-50%, -100vh) scale(0.8)',
    opacity: showLetterOverlay ? 1 : 0,
    cursor: dragMode === 'drag' ? 'grabbing' : dragMode === 'resize' ? 'nwse-resize' : 'grab',
    userSelect: 'none',
    overflow: 'hidden',
    animation: showLetterOverlay ? 'cardShuffle 1.1s cubic-bezier(.22,1.61,.36,1)' : 'none',
  };

  // Show Write Something! button for all supported layouts
  const showLetterButton = [1, 3, 4, 6].includes(images.length);

  // Calculate preview scale for overlay mode
  let previewScale = 1;
  if (showLetterOverlay) {
    const maxPreviewHeight = window.innerHeight - 120; // leave some padding for controls
    const stripH = selectedDesign && frameMappings[selectedDesign.key] ? frameMappings[selectedDesign.key].frameHeight : 600;
    const cardH = cardSize.height;
    const maxH = Math.max(stripH, cardH);
    if (maxH > maxPreviewHeight) {
      previewScale = maxPreviewHeight / maxH;
    }
  }

  // Disclaimer modal state
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const handleShowDisclaimer = () => setShowDisclaimer(true);
  const handleCloseDisclaimer = () => setShowDisclaimer(false);

  // Wrap all download handlers to show disclaimer after download
  const handleDownloadWithDisclaimer = async (...args) => {
    await handleDownloadLetter(...args);
    handleShowDisclaimer();
  };
  const handleDownloadLetterAndStripWithDisclaimer = async (...args) => {
    await handleDownloadLetterAndStrip(...args);
    handleShowDisclaimer();
  };
  const handleDownloadStripWithDisclaimer = async (...args) => {
    await handleDownload(...args);
    handleShowDisclaimer();
  };

  if (showLetterOverlay) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center relative bg-transparent"
        style={{ overflow: 'auto' }}
        onMouseMove={e => { handleDrag(e); handleResize(e); handleTextBoxDrag(e); handleTextBoxRotate(e); handleTextBoxResize(e); }}
        onMouseUp={() => { handleDragEnd(); handleResizeEnd(); handleTextBoxDragEnd(); handleTextBoxRotateEnd(); handleTextBoxResizeEnd(); }}
        onMouseLeave={() => { handleDragEnd(); handleResizeEnd(); handleTextBoxDragEnd(); handleTextBoxRotateEnd(); handleTextBoxResizeEnd(); }}
        onTouchMove={e => { handleDrag(e); handleResize(e); handleTextBoxDrag(e); handleTextBoxRotate(e); handleTextBoxResize(e); }}
        onTouchEnd={() => { handleDragEnd(); handleResizeEnd(); handleTextBoxDragEnd(); handleTextBoxRotateEnd(); handleTextBoxResizeEnd(); }}
      >
        {/* Only scale the preview, not the buttons */}
        <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {/* Photo preview always visible on the left */}
          <div className="flex-shrink-0 z-10">
            <PhotoLayoutCard
              images={images}
              filters={photoFilters}
              selectedDesign={selectedDesign}
              transparentCard={true}
            />
          </div>
          {/* Draggable & Resizable & Rotatable Letter Card Overlay */}
          <div
            ref={cardRef}
            style={cardStyle}
            onMouseDown={e => {
              // Only start drag if not on resize handle
              if (e.target.dataset && e.target.dataset.resizeHandle) return;
              if (e.target.dataset && e.target.dataset.textBox) return;
              handleDragStart(e);
            }}
            onTouchStart={e => {
              if (e.target.dataset && e.target.dataset.resizeHandle) return;
              if (e.target.dataset && e.target.dataset.textBox) return;
              handleDragStart(e);
            }}
          >
            {/* Previous (<) Button for more designs */}
            {availableLetterDesigns.length > 1 && (
              <button
                onClick={handlePrevLetterDesign}
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  zIndex: 40,
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                }}
                aria-label="Previous Letter Design"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#b91c1c" strokeWidth="2"><polyline points="12 4 6 10 12 16" /></svg>
              </button>
            )}
            {/* Next (>) Button for more designs */}
            {availableLetterDesigns.length > 1 && (
              <button
                onClick={handleNextLetterDesign}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 40,
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                }}
                aria-label="Next Letter Design"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#b91c1c" strokeWidth="2"><polyline points="8 4 14 10 8 16" /></svg>
              </button>
            )}
            {/* Draggable & Rotatable Text Box */}
            <div
              data-text-box
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${textBoxPos.x}px, ${textBoxPos.y}px) rotate(${textBoxRotation}deg)`,
                width: textBoxSize.width,
                height: dynamicTextBoxHeight,
                cursor: dragTextBox ? 'move' : 'grab',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseDown={handleTextBoxDragStart}
              onTouchStart={handleTextBoxDragStart}
            >
              <textarea
                value={letterText}
                onChange={e => setLetterText(e.target.value)}
                placeholder="Type your message here..."
                maxLength={maxChars}
                style={{
                  width: '100%',
                  height: '100%',
                  background: isTextOverflowing ? 'rgba(255,200,200,0.8)' : 'rgba(255,255,255,0.7)',
                  border: isTextOverflowing ? '2px solid #ff6b6b' : 'none',
                  borderRadius: 16,
                  fontSize: fontSize,
                  fontFamily: 'Pacifico, cursive',
                  color: isTextOverflowing ? '#d63031' : '#b91c1c',
                  textAlign: 'center',
                  outline: 'none',
                  resize: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              {/* Rotate Handle */}
              <div
                onMouseDown={handleTextBoxRotateStart}
                onTouchStart={handleTextBoxRotateStart}
                style={{
                  position: 'absolute',
                  right: -16,
                  top: -16,
                  transform: 'none',
                  width: 32,
                  height: 32,
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '50%',
                  cursor: 'crosshair',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 30,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  userSelect: 'none',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#b91c1c" strokeWidth="2"><path d="M10 2a8 8 0 1 1-8 8" /><polyline points="2 2 10 2 10 10" /></svg>
              </div>
              {/* Character counter */}
              <div style={{
                position: 'absolute',
                bottom: 8,
                right: 16,
                fontSize: Math.max(12, cardSize.width * 0.03),
                color: isTextOverflowing ? '#d63031' : '#b91c1c',
                fontWeight: 'bold',
                background: 'rgba(255,255,255,0.8)',
                padding: '4px 8px',
                borderRadius: 8,
                zIndex: 15,
              }}>
                {letterText.length}/{maxChars}
              </div>
              {/* Resize Handle */}
              {/* 2. Text box resize handle at bottom-right of the text box */}
              <div
                data-resize-handle
                onMouseDown={e => { e.stopPropagation(); handleTextBoxResizeStart(e); }}
                onTouchStart={e => { e.stopPropagation(); handleTextBoxResizeStart(e); }}
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: 24,
                  height: 24,
                  background: 'rgba(255,255,255,0.7)',
                  borderTopLeftRadius: 8,
                  cursor: 'nwse-resize',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-end',
                  zIndex: 50, // highest
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  userSelect: 'none',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2"><polyline points="16 20 20 20 20 16" /><line x1="14" y1="20" x2="20" y2="14" /></svg>
              </div>
            </div>
            {/* Card (letter overlay) resize handle (bottom-right of card, outside text box) */}
            <div
              onMouseDown={handleCardResizeStart}
              onTouchStart={handleCardResizeStart}
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 32,
                height: 32,
                background: 'rgba(255,255,255,0.7)',
                borderTopLeftRadius: 12,
                cursor: 'nwse-resize',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                zIndex: 35, // between card and text box handle
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                userSelect: 'none',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2"><polyline points="16 20 20 20 20 16" /><line x1="14" y1="20" x2="20" y2="14" /></svg>
            </div>
            {/* Go Back Button */}
          </div>
        </div>
        {/* Download Buttons (not scaled) and Go Back */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-50">
          <button
            className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 text-white font-bold shadow hover:from-pink-500 hover:to-pink-700 transition-all text-sm"
            onClick={handleDownloadWithDisclaimer}
          >
            Download Letter
          </button>
          <button
            className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 text-white font-bold shadow hover:from-pink-500 hover:to-pink-700 transition-all text-sm"
            onClick={handleDownloadLetterAndStripWithDisclaimer}
          >
            Download Letter + Strip
          </button>
          <button
            className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 text-white font-bold shadow hover:from-pink-500 hover:to-pink-700 transition-all text-sm"
            onClick={handleDownloadStripWithDisclaimer}
          >
            Download Strip
          </button>
          <BackButton onClick={handleGoBack} className="!bg-pink-200 !text-white-600 !font-bold !shadow hover:!bg-pink-300 transition-all text-sm">
            Go Back
          </BackButton>
        </div>
        {/* Confirmation popup */}
        {showWriteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl"
                onClick={() => setShowWriteConfirm(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4 text-pink-600">Do you want to write something on your letter?</h2>
              <div className="flex gap-4 justify-center mt-4">
                <button
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 text-white font-semibold shadow hover:from-pink-500 hover:to-pink-700 transition-all duration-200"
                  onClick={() => {
                    setShowWriteConfirm(false);
                    setShowLetterOverlay(true);
                  }}
                >
                  Yes
                </button>
                <button
                  className="px-6 py-2 rounded-full bg-gray-200 text-pink-600 font-semibold shadow hover:bg-gray-300 transition-all duration-200"
                  onClick={() => setShowWriteConfirm(false)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Disclaimer Modal */}
        {showDisclaimer && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative text-center">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl"
                onClick={handleCloseDisclaimer}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4 text-pink-600">Sharing Tip</h2>
              <p className="mb-4 text-gray-700">
                To keep the background transparent, share this image as a <b>file</b> (e.g., in Docs or as an attachment), not as a photo.<br/>
                Some apps (like WhatsApp) may add a white background if sent as a photo.
              </p>
              <button
                className="mt-2 px-6 py-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 text-white font-semibold shadow hover:from-pink-500 hover:to-pink-700 transition-all duration-200"
                onClick={handleCloseDisclaimer}
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const goToStep = (nextStep) => {
    setCardAnim("card-exit");
    setTimeout(() => {
      setStep(nextStep);
      setCardAnim("card-enter");
    }, 400);
  };

  // Normal strip design UI
  return (
    <div className={`flex flex-col md:flex-row w-full min-h-screen justify-center items-center gap-8 ${colors.background} overflow-x-hidden`}>
      <div className="flex-shrink-0">
        <PhotoLayoutCard
          images={images}
          filters={photoFilters}
          selectedDesign={selectedDesign}
        />
      </div>
      <div className="flex items-center">
        <div className={`relative z-10 ${cardAnim} w-full max-w-md md:max-w-sm`}>
          {/* Download type dropdown */}
          <div className="mb-4 flex justify-end">
            <select
              className="border rounded px-2 py-1 text-base"
              value={downloadType}
              onChange={e => setDownloadType(e.target.value)}
              disabled={isDownloading}
            >
              <option value="photo">Download as Photo Strip (PNG)</option>
              <option value="gif">Download as GIF Strip (Animated)</option>
            </select>
          </div>
          {step === "filters" ? (
            <ControlsCard
              step={step}
              setStep={goToStep}
              filters={photoFilters}
              setFilters={setPhotoFilters}
              selectedDesign={selectedDesign}
              setSelectedDesign={setSelectedDesign}
              images={images}
              designs={designs}
              onDownload={downloadType === "gif" ? handleDownloadGif : handleDownload}
              onBack={onBack}
              NextButton={NextButton}
              BackButton={BackButton}
            />
          ) : (
            <div>
              <DesignGrid
                designs={designs}
                selectedDesign={selectedDesign}
                onSelectDesign={setSelectedDesign}
              />
              {/* Write Something! button for all supported layouts */}
              {showLetterButton && (
                <button
                  className="mt-6 mb-2 px-6 py-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 text-white font-semibold shadow hover:from-pink-500 hover:to-pink-700 transition-all duration-200 w-full"
                  onClick={() => setShowWriteConfirm(true)}
                >
                  Write Something!
                </button>
              )}
              {/* Confirmation popup */}
              {showWriteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
                    <button
                      className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl"
                      onClick={() => setShowWriteConfirm(false)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                    <h2 className="text-xl font-bold mb-4 text-pink-600">Do you want to write something on your letter?</h2>
                    <div className="flex gap-4 justify-center mt-4">
                      <button
                        className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 text-white font-semibold shadow hover:from-pink-500 hover:to-pink-700 transition-all duration-200"
                        onClick={() => {
                          setShowWriteConfirm(false);
                          setShowLetterOverlay(true);
                        }}
                      >
                        Yes
                      </button>
                      <button
                        className="px-6 py-2 rounded-full bg-gray-200 text-pink-600 font-semibold shadow hover:bg-gray-300 transition-all duration-200"
                        onClick={() => setShowWriteConfirm(false)}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-between mt-4">
                <BackButton onClick={() => goToStep("filters")}>Back</BackButton>
                <NextButton onClick={downloadType === "gif" ? handleDownloadGif : handleDownload} disabled={!selectedDesign || isDownloading}>
                  {isDownloading ? "Preparing..." : "Download"}
                </NextButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
