# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Support for transparent GIF downloads natively using `gifenc` with alpha channel quantization.
- `gif-transparent` option in the download dropdown menu in `StripDesign.jsx`.
- Added `3shot-design6` template and corresponding configuration to `frameMappings.js` for the 3-shot layout.

### Changed
- Replaced `gifshot` with dynamically imported `gifenc` in `StripDesign.jsx` for faster generation and proper transparent background support.
- Updated the standard GIF download to use high-quality `rgb565` quantization and a solid white background.