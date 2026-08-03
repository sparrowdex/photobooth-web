# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Homescreen and PWA icons (`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) and Open Graph social sharing card (`og-image.png`) with centered logo on deep berry magenta (`#9b0e56`) background.
- Web App Manifest (`manifest.json`) and theme meta tags with standalone display settings and `#9b0e56` theme color.
- Dedicated hardware-accelerated `WandCursor.jsx` component and vector asset `wand-cursor.svg` with glowing star tip and sparkle accents.
- Fairy dust trailing sparkle engine rendered via hardware-accelerated Canvas with 4-pointed stars (`✦`, `✧`) in white, fairy pink, and starlight gold, plus click bursts.
- Specular crystal glass styling classes (`.crystal-glass` and `.pink-crystal-btn`) with top-edge glints, inner reflections, and multi-layered backdrop blur.
- Support for transparent GIF downloads natively using `gifenc` with alpha channel quantization.
- `gif-transparent` option in the download dropdown menu in `StripDesign.jsx`.
- Added `3shot-design6` template and corresponding configuration to `frameMappings.js` for the 3-shot layout.
- Added "Soft Focus" filter for subtle skin smoothing in `ControlsCard.jsx`.
- Introduced filter layering, allowing users to stack multiple filters on individual or all photos with numbered badges.
- Added swipe gesture support for both the `FilterCarousel` and `DesignGrid` on mobile devices.
- Added an elegant sliding popup drawer for controls on the `StripDesign` view for mobile screens.
- Added click-outside detection to automatically close the filter dropdown menu.
- Full-screen glossy glassmorphism background overlay on the Camera Setup screen.
- "Soft Focus" layering recommendation to the Camera Setup help modal.
- Background images (`customize_bg.png` / `strip_design_wide.png`) to the letter writing view in Strip Design.

### Changed
- Replaced the primary "Start Photobooth" landing button with a slimmer (`max-w-[290px]`), frosted pink crystal glass pill (`.pink-crystal-btn`) featuring a glowing camera shutter ring and corner sparkles.
- Redesigned the top-right Share button into a luminous `.crystal-glass` pill with high-contrast text and icon drop-shadows.
- Harmonized widescreen desktop landing typography with the mobile version while preserving the floating side photo strips.
- Narrowed the landing page hero sub-description to `max-w-[300px]` with balanced line wrapping.
- Hidden system default cursor on desktop pointer devices (`cursor: none !important;`) so only the magical wand cursor is visible.
- Replaced `gifshot` with dynamically imported `gifenc` in `StripDesign.jsx` for faster generation and proper transparent background support.
- Updated the standard GIF download to use high-quality `rgb565` quantization and a solid white background.
- Improved mobile responsiveness across `StripLayoutSelection`, `CameraSetup`, `FrameLayout`, and `ControlsCard` by scaling down elements to reduce vertical scrolling.
- Relocated Back buttons to be consistently anchored at the top-left corner across layout selection and camera views.
- Updated the "Retake" button in `CameraSetup` to match the theme's secondary button styling.
- Scaled down the interactive "Write Something" letter overlay to fit mobile screens proportionally.
- Made the `FrameLayout` background transparent to let the animated background show through.
- Refined `NextButton` and `BackButton` styles to display side-by-side within the controls card and scale down gracefully on mobile.
- Replaced the floating help circle SVG with a sleek camera outline icon.
- Removed the inner glassmorphism container from the camera preview area to clean up the UI.
- Detached the `FilterCarousel` "Apply To" panel from the button row to prevent horizontal scrolling clipping, and redesigned it as a compact vertical list.
- Disabled the custom wand cursor and mouse listeners on touch and mobile devices.

### Fixed
- Fixed a race condition in `CameraSetup.jsx` where taking multi-shots rapidly caused asynchronous GIF processing to overwrite the wrong image index, permanently freezing the "Choose Strip Design" button.
- Fixed an intermittent "silent freeze" bug when downloading multi-shot layouts (like 3-shot) caused by iOS/Android WebViews aggressively blocking cross-origin data URI loads. Removed `crossOrigin="anonymous"` from Base64 images and added `onerror` fallback handling to prevent the download Promises from hanging.
- Corrected CSS styling in `FrameLayout.jsx` to ensure frame overlays and photo windows are sized and positioned correctly based on `frameMappings.js`.
- Fixed the absolute positioning jumping issue for the Back button in `AppLayout` by adjusting container heights.
- Fixed `NextButton` ignoring the `disabled` prop state, ensuring the download button correctly disables while processing.
- Standardized download buttons in the `StripDesign` letter overlay to use the primary pink gradient theme.

### Performance
- Eliminated 100+ React component re-renders per second by decoupling mousemove cursor updates from React component state into direct GPU-accelerated DOM transforms.
- Built-in idle auto-sleep on the particle canvas loop to ensure 0% idle CPU and GPU usage when the cursor stops moving.
- Migrated heavy `.png` assets in the `/images/` directory to `.webp` format to drastically reduce loading times.
- Added `<link rel="preload">` tags in `index.html` for main background assets to prevent layout flash.
- Implemented `loading="lazy"` on paginated `DesignGrid` image thumbnails to speed up initial Strip Design loading.