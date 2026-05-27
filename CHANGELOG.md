# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
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
- Disabled the custom "Shooting Star" floating cursor on mobile devices.

### Fixed
- Corrected CSS styling in `FrameLayout.jsx` to ensure frame overlays and photo windows are sized and positioned correctly based on `frameMappings.js`.
- Fixed the absolute positioning jumping issue for the Back button in `AppLayout` by adjusting container heights.
- Fixed `NextButton` ignoring the `disabled` prop state, ensuring the download button correctly disables while processing.
- Standardized download buttons in the `StripDesign` letter overlay to use the primary pink gradient theme.