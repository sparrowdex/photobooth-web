import { useState, useEffect, useRef } from "react";
import PhotoLayoutCard from "./PhotoLayoutCard";
import StudioPanel from "./StudioPanel";
import PostcardStudio from "./PostcardStudio";
import frameMappings, { registerFrame } from "./frameMappings";
import FrameStudio from "./FrameStudio";
import { loadSavedFrames, saveFrame } from "./frameEngine";
import { parseGIF, decompressFrames } from 'gifuct-js';
import { Capacitor } from '@capacitor/core';
import { saveImage, shareImage } from './saveAndShare';
import { drawFrameText, ensureFrameFonts } from './frameText';

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

// Helper: detect mobile device
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      setIsMobile(/Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent));
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// Helper: save the image (Gallery on Android, download on web) and report the result
const downloadFile = async (data, filename, onResult) => {
  const result = await saveImage(data, filename);
  if (onResult) onResult({ ...result, data, filename });
};

export default function StripDesign({ images, designs, onBack, captured = [] }) {
  const [step, setStep] = useState("mood"); // studio tab: mood | frame | save
  const [filterTarget, setFilterTarget] = useState("all"); // which photo(s) filters apply to
  const [showPostcard, setShowPostcard] = useState(false);
  const [postcardSaving, setPostcardSaving] = useState(false);
  const [photoFilters, setPhotoFilters] = useState(images.map(() => []));
  const cssFilters = photoFilters.map(layers => layers.length > 0 ? layers.map(f => f.value).join(' ') : "");
  // frames made in the frame studio (this session + a few remembered on this device)
  const [customDesigns, setCustomDesigns] = useState(() =>
    loadSavedFrames(images.length).map((f) => {
      registerFrame(f.key, f.mapping);
      return { key: f.key, url: f.url, custom: true };
    })
  );
  const [showFrameStudio, setShowFrameStudio] = useState(false);
  const allDesigns = [...customDesigns, ...designs];
  const [selectedDesign, setSelectedDesign] = useState(designs[0] || null);
  const [frameText, setFrameText] = useState({}); // fill-in blanks (e.g. license name/DOB/signature)
  const [developed, setDeveloped] = useState(false); // instant-film develop plays once per session
  const [downloadType, setDownloadType] = useState("photo"); // 'photo' or 'gif'
  const [isDownloading, setIsDownloading] = useState(false);
  const [overlayImg, setOverlayImg] = useState(null); // Cache for overlay image

  const isMobile = useIsMobile();
  const isPortrait = window.innerHeight > window.innerWidth;

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

  // Download logic with frame mapping support and cropping
  // Render the finished strip (photos + filters + frame + fill-in text) to a PNG data URL
  const renderStrip = async () => {
    await ensureFrameFonts();
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
        if (!images[i].startsWith('data:')) {
          img.crossOrigin = "anonymous";
        }
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
            ctx.filter = cssFilters[i] || "none";
            drawImageCover(ctx, img, win.left, win.top, win.width, win.height);
            ctx.restore();
            ctx.filter = "none";
            resolve();
          };
          img.onerror = () => {
            console.error("Failed to load photo", i);
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
          overlay.onerror = () => {
            console.error("Failed to load overlay");
            resolve();
          };
        });
      }
      drawFrameText(ctx, mapping, frameText);
    } else {
      // fallback grid logic (your original code)
      const isGrid = images.length === 6;
      const imageWidth = 180;
      const imageHeight = 160;
      const gap = 16;
      for (let i = 0; i < images.length; i++) {
        const img = new window.Image();
        if (!images[i].startsWith('data:')) {
          img.crossOrigin = "anonymous";
        }
        img.src = images[i];
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.filter = cssFilters[i] || "none";
            const col = isGrid ? i % 2 : 0;
            const row = isGrid ? Math.floor(i / 2) : i;
            const x = col * (imageWidth + gap);
            const y = row * (imageHeight + gap);
            ctx.drawImage(img, x, y, imageWidth, imageHeight);
            ctx.filter = "none";
            resolve();
          };
          img.onerror = () => {
            console.error("Failed to load photo in fallback", i);
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
          overlay.onerror = () => {
            console.error("Failed to load overlay in fallback");
            resolve();
          };
        });
      }
    }

    return canvas.toDataURL('image/png');
  };

  const handleDownload = async () => {
    const dataUrl = await renderStrip();
    await downloadFile(dataUrl, `photobooth-strip-${Date.now()}.png`, handleSaved);
  };

  // GIF strip download logic (uses only the GIFs in captured and overlayImg)
  const handleDownloadGif = async () => {
    await ensureFrameFonts();
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
    const parsedGifs = await Promise.all(
      captured.map(async (cap) => {
        if (!cap.gif) return null;
        try {
          let binary;
          // Bypass fetch() for data URIs as some Android WebViews fail to load large data strings
          if (cap.gif.startsWith('data:')) {
            const base64Data = cap.gif.split(',')[1];
            const binaryString = window.atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            binary = bytes.buffer;
          } else {
            binary = await fetch(cap.gif).then(r => r.arrayBuffer());
          }
          const gif = parseGIF(binary);
          const frames = decompressFrames(gif, true);
          return {
            width: (gif.lsd && gif.lsd.width) || (frames[0] && frames[0].dims.width) || 240,
            height: (gif.lsd && gif.lsd.height) || (frames[0] && frames[0].dims.height) || 320,
            frames
          };
        } catch (err) {
          console.error("Error parsing GIF:", err);
          return null;
        }
      })
    );

    const validGifs = parsedGifs.filter(Boolean);
    if (validGifs.length === 0) {
      alert("Oops! The animations aren't ready or are corrupted. Please try taking the photos again.");
      setIsDownloading(false);
      return;
    }

    // Find the minimum number of frames across all valid GIFs
    const minFrames = Math.min(...validGifs.map((g) => g.frames.length));
    if (minFrames === 0 || minFrames === Infinity) {
      alert("Oops! The animations aren't ready or are corrupted. Please try taking the photos again.");
      setIsDownloading(false);
      return;
    }
    
    // Dynamically import gifenc
    const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
    const gif = GIFEncoder();

    // Create a persistent full-size compositing canvas and patch canvas for each photo slot
    const slotCompositors = parsedGifs.map((gifObj) => {
      if (!gifObj) return null;
      const canvas = document.createElement("canvas");
      canvas.width = gifObj.width;
      canvas.height = gifObj.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      
      const patchCanvas = document.createElement("canvas");
      const patchCtx = patchCanvas.getContext("2d", { willReadFrequently: true });
      
      return {
        canvas,
        ctx,
        patchCanvas,
        patchCtx,
        width: gifObj.width,
        height: gifObj.height,
        frames: gifObj.frames,
        prevFrame: null
      };
    });

    // For each frame index, composite the GIFs into the strip
    for (let frameIdx = 0; frameIdx < minFrames; frameIdx++) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // Draw a solid white background for standard (non-transparent) GIFs
      if (downloadType !== "gif-transparent") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }

      // Draw each GIF frame in its mapped window using drawImageCover
      for (let i = 0; i < mapping.windows.length; i++) {
        const win = mapping.windows[i];
        const comp = slotCompositors[i];
        if (!comp) continue;
        const gifFrame = comp.frames[frameIdx];
        if (!gifFrame) continue;

        // Handle disposal method from previous frame
        if (comp.prevFrame && comp.prevFrame.disposalType === 2) {
          comp.ctx.clearRect(
            comp.prevFrame.dims.left,
            comp.prevFrame.dims.top,
            comp.prevFrame.dims.width,
            comp.prevFrame.dims.height
          );
        }

        // Render the frame patch into the temporary patch canvas
        comp.patchCanvas.width = gifFrame.dims.width;
        comp.patchCanvas.height = gifFrame.dims.height;
        const patchData = comp.patchCtx.createImageData(gifFrame.dims.width, gifFrame.dims.height);
        patchData.data.set(gifFrame.patch);
        comp.patchCtx.putImageData(patchData, 0, 0);

        // Composite the patch onto the full-size slot canvas at its true (left, top) offset
        comp.ctx.drawImage(comp.patchCanvas, gifFrame.dims.left, gifFrame.dims.top);
        comp.prevFrame = gifFrame;

        // Now comp.canvas has the FULL correctly composited photo for this frame!
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
        ctx.filter = cssFilters[i] || "none";
        drawImageCover(ctx, comp.canvas, win.left, win.top, win.width, win.height);
        ctx.restore();
        ctx.filter = "none";
      }

      // Draw overlay (always after all GIF frames)
      if (overlayImg && overlayImg.complete) {
        ctx.drawImage(overlayImg, 0, 0, width, height);
      }
      drawFrameText(ctx, mapping, frameText);
      
      // Extract image data and encode it to the GIF
      const { data } = ctx.getImageData(0, 0, width, height);
      
      let palette, index, transparentIndex;
      if (downloadType === "gif-transparent") {
        // Quantize the colors and preserve alpha channels for transparent GIFs
        palette = quantize(data, 256, { format: 'rgba4444', clearAlpha: true, clearAlphaThreshold: 50 });
        index = applyPalette(data, palette, 'rgba4444');
        transparentIndex = palette.findIndex(c => c[3] === 0);
      } else {
        // Standard high-quality quantization for normal opaque GIFs
        palette = quantize(data, 256, { format: 'rgb565' });
        index = applyPalette(data, palette, 'rgb565');
        transparentIndex = -1;
      }
      
      gif.writeFrame(index, width, height, {
        palette,
        transparent: transparentIndex >= 0,
        transparentIndex: transparentIndex >= 0 ? transparentIndex : 0,
        delay: 200, // 0.2 seconds per frame
      });
    }

    // Export the finalized GIF
    gif.finish();
    const output = gif.bytes();
    const blob = new Blob([output], { type: 'image/gif' });
    
    await downloadFile(blob, `photobooth-strip-${Date.now()}.gif`, handleSaved);

    setIsDownloading(false);
  };

  // Phones: fit the strip into the space above the bottom sheet
  const sheetRef = useRef(null);
  const topRef = useRef(null);
  const stripInnerRef = useRef(null);
  const [mobileFit, setMobileFit] = useState(null); // { avail, scale } or null on larger screens
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => {
      const inner = stripInnerRef.current;
      if (!inner) return;
      if (!mq.matches) {
        // widescreen: shrink tall strips so they fit the window height
        const scale = Math.min(1, (window.innerHeight - 72) / inner.offsetHeight);
        setMobileFit(scale < 1 ? { desk: true, scale, w: inner.offsetWidth, h: inner.offsetHeight } : null);
        return;
      }
      const top = topRef.current?.offsetHeight || 0;
      const avail = window.innerHeight - top - (sheetRef.current?.offsetHeight || 0);
      // let the strip grow past its desktop size on phones, but never overflow the space
      const scale = Math.min(1.6, (avail - 24) / inner.offsetHeight, (window.innerWidth - 28) / inner.offsetWidth);
      setMobileFit({ top, avail, scale: Math.max(0.2, scale) });
    };
    update();
    const ro = new ResizeObserver(update);
    if (sheetRef.current) ro.observe(sheetRef.current);
    if (topRef.current) ro.observe(topRef.current);
    if (stripInnerRef.current) ro.observe(stripInnerRef.current);
    window.addEventListener("resize", update);
    mq.addEventListener?.("change", update);
    return () => { ro.disconnect(); window.removeEventListener("resize", update); mq.removeEventListener?.("change", update); };
  }, []);

  // Save result toast (with Share button)
  const [saveToast, setSaveToast] = useState(null);
  const handleSaved = (result) => {
    // Transparent GIFs lose their see-through background if an app re-sends them as a "photo"
    const tip = result.ok && downloadType === "gif-transparent" && !Capacitor.isNativePlatform()
      ? " · share it as a file to keep it see-through" : "";
    setSaveToast({ ...result, message: result.message + tip });
  };
  useEffect(() => {
    if (!saveToast) return;
    const t = setTimeout(() => setSaveToast(null), 6000);
    return () => clearTimeout(t);
  }, [saveToast]);
  const saveToastEl = saveToast && (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-20 md:bottom-8 z-[60] flex items-center gap-3 bg-white/95 backdrop-blur border border-pink-200 shadow-2xl rounded-full pl-5 pr-2 py-2 max-w-[92vw]">
      <span className={`text-sm font-medium ${saveToast.ok ? 'text-pink-700' : 'text-red-600'}`}>{saveToast.message}</span>
      {saveToast.canShare && (
        <button
          className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 text-white text-sm font-semibold shadow hover:from-pink-500 hover:to-pink-700 transition-all"
          onClick={() => shareImage(saveToast.data, saveToast.filename)}
        >
          Share
        </button>
      )}
      <button className="text-gray-400 hover:text-pink-500 text-xl px-1" onClick={() => setSaveToast(null)} aria-label="Close">&times;</button>
    </div>
  );

  const backgroundImage = isMobile && isPortrait
    ? "url('./images/customize_bg.webp')"
    : "url('./images/strip_design_wide.webp')";

  // Normal strip design UI
  const mainContainerStyle = {
    position: 'relative',
  };

  if (isMobile && isPortrait) {
    Object.assign(mainContainerStyle, {
      width: '100%',
      minHeight: '100svh',
      overflowX: 'hidden',
      padding: '0',
      margin: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    });
  }

  return (
    <div className={`flex flex-col md:flex-row w-full min-h-[100svh] justify-center items-center overflow-hidden gap-0 md:gap-12 md:p-8`}
      style={mainContainerStyle}
    >
      <div
        className="absolute inset-0 w-full h-full bg-center bg-cover bg-no-repeat z-0"
        style={{ backgroundImage }}
      ></div>
      {/* On phones the strip is scaled to fit the space above the bottom sheet */}
      <div
        className={mobileFit && !mobileFit.desk ? "fixed inset-x-0 top-0 z-10 flex items-center justify-center transition-[height] duration-500" : "relative z-10 flex-shrink-0"}
        style={mobileFit ? (mobileFit.desk ? { width: mobileFit.w * mobileFit.scale, height: mobileFit.h * mobileFit.scale } : { top: mobileFit.top, height: mobileFit.avail }) : undefined}
      >
        <div
          ref={stripInnerRef}
          style={mobileFit ? { transform: `scale(${mobileFit.scale})`, transformOrigin: mobileFit.desk ? "top left" : "center", transition: "transform .5s cubic-bezier(.2,.9,.3,1)" } : undefined}
        >
          <PhotoLayoutCard
            images={images}
            filters={cssFilters}
            selectedDesign={selectedDesign}
            transparentCard={true}
            textValues={frameText}
            develop={!developed}
            onDeveloped={() => setDeveloped(true)}
          />
        </div>
      </div>
      <StudioPanel
        tab={step}
        setTab={setStep}
        images={images}
        photoFilters={photoFilters}
        setPhotoFilters={setPhotoFilters}
        filterTarget={filterTarget}
        setFilterTarget={setFilterTarget}
        designs={allDesigns}
        onOpenStudio={() => setShowFrameStudio(true)}
        selectedDesign={selectedDesign}
        setSelectedDesign={setSelectedDesign}
        frameText={frameText}
        setFrameText={setFrameText}
        downloadType={downloadType}
        setDownloadType={setDownloadType}
        isDownloading={isDownloading}
        onSave={downloadType.startsWith("gif") ? handleDownloadGif : handleDownload}
        onRetake={onBack}
        sheetRef={sheetRef}
        topRef={topRef}
        extra={
          <button className="studio-extra" onClick={() => setShowPostcard(true)}>
            <span className="studio-extra-icon">✉︎</span>
            <span className="flex flex-col text-left">
              <span className="text-sm font-semibold text-pink-600">Make it a postcard</span>
              <span className="text-[11px] text-pink-400">your strip on the front, a note + stamp on the back</span>
            </span>
            <span className="ml-auto text-pink-300">→</span>
          </button>
        }
      />
      {showFrameStudio && (
        <FrameStudio
          images={images}
          filters={cssFilters}
          onClose={() => setShowFrameStudio(false)}
          onDone={({ url, mapping }) => {
            const key = `custom-${Date.now()}`;
            registerFrame(key, mapping);
            const design = { key, url, custom: true };
            setCustomDesigns((list) => [design, ...list]);
            setSelectedDesign(design);
            saveFrame({ key, url, mapping, shots: images.length });
            setShowFrameStudio(false);
          }}
        />
      )}
      {showPostcard && (
        <PostcardStudio
          renderStrip={renderStrip}
          photo={images[0]}
          photoFilter={cssFilters[0]}
          isSaving={postcardSaving}
          onClose={() => setShowPostcard(false)}
          onSave={async (dataUrl, filename) => {
            setPostcardSaving(true);
            try { await downloadFile(dataUrl, filename, (r) => setSaveToast({ ...r, data: dataUrl, filename })); }
            finally { setPostcardSaving(false); }
          }}
        />
      )}
      {saveToastEl}
    </div>
  );
}
