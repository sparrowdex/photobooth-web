# Mobile Changelog

## [1.0.0-mobile] - 2026-05-20

### Added
- Initial setup for Android application using Capacitor.
- Converted web app into a native Android build.
- Implemented native file saving to the device's photo gallery using `@capacitor/filesystem`.
- Configured Android permissions for Camera and Storage.
- Set up production build process to create a self-contained application.

## [1.0.1-mobile] - 2026-05-23

### Changed
- Changed the default Android file save destination from `Directory.Photos` to `Directory.Documents` to ensure reliable write access.

### Fixed
- Fixed a "file not created" error by correctly stripping the MIME type header (`data:image/png;base64,`) before passing data to Capacitor's `Filesystem` API.
- Fixed corrupted GIF generation (the `!` image issue in the gallery) by bypassing the `fetch()` API for large base64 data URIs and decoding them directly in memory.
- Prevented a race condition on slower mobile devices by disabling the "Choose Strip Design" button until all background GIF processing is finished.

## [1.0.2-mobile] - 2026-05-27

### Changed
- Disabled the custom "Shooting Star" cursor on touch devices to improve UX and prevent ghost pointers.

### Fixed
- Fixed GIF letterboxing on mobile by dynamically swapping `gifWidth` and `gifHeight` in `gifshot` when the device is in portrait mode.
- Fixed background styling in the Letter Design view to correctly display the portrait background image on mobile devices.