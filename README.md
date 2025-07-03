# Sreeja's Photobooth App

A modern, interactive web-based photobooth application built with React, Vite, and Tailwind CSS. Create, customize, and download beautiful photo strips with multiple layout options, design templates, and animated GIFs.

## 🌟 Features

### 📸 **Photo & GIF Capture**
- **Real-time camera integration** with high-quality photo capture
- **Animated GIF creation** - captures motion during photo sessions
- **Multiple shot layouts**: 1, 3, 4, or 6 photos per strip
- **Countdown timer** with visual feedback for perfect timing
- **Auto-capture** with customizable countdown (3 seconds)
- **Retake functionality** for multiple attempts
- **Dual download options**: Photo strips (PNG) or animated GIF strips

### 🎨 **Design Customization**
- **Multiple design templates** for each layout type
- **Paginated design selection** with visual preview
- **Frame mapping system** for precise photo placement
- **Responsive design** that works on desktop and mobile
- **Smart cropping** with aspect ratio preservation

### 🎭 **Photo Filters**
- **15+ filter effects**: Noir, Vintage, Glam, Pencil Sketch, Extra Sharp, Warm, Cool, Faded, Black & White, Sepia, Brightness, Contrast, Blur, Invert, and more
- **Individual photo filtering** - apply different filters to each photo
- **"All Photos" option** - apply the same filter to all photos at once
- **Real-time preview** - see filter effects on photo thumbnails
- **Paginated filter selection** - browse through all available filters

### 🌈 **Theme System**
- **Dual theme support**: Pink (Light) and Blue (Dark) modes
- **Theme toggle** with sun/moon icons
- **Persistent theme preference** saved in localStorage
- **Cream-colored cards** in blue theme for better contrast
- **Animated backgrounds** with gradient effects
- **Shooting star cursor** that adapts to theme colors

### 🖼️ **Photo Processing**
- **Smart image cropping** with aspect ratio preservation
- **Frame overlay system** with precise positioning
- **Border radius support** for rounded photo frames
- **High-quality output** suitable for printing
- **GIF compositing** with frame overlays for animated strips

### 📱 **User Experience**
- **Beautiful landing page** with animated elements and shooting star cursor
- **Step-by-step workflow** with clear navigation
- **Responsive interface** optimized for all screen sizes
- **Interactive hover effects** and smooth transitions
- **Help system** with usage instructions
- **Pagination controls** that hide when not needed

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd photobooth
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to access the application

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🏗️ Project Structure

```
photobooth/
├── public/
│   ├── designs/          # Photo strip design templates
│   │   ├── 1shot-design1.png to 1shot-design9.png
│   │   ├── 3shot-design1.png to 3shot-design5.png
│   │   ├── 4shot-design1.png to 4shot-design5.png
│   │   └── 6shot-design1.png to 6shot-design3.png
│   ├── images/           # Layout preview images
│   └── logo.png          # Application logo
├── src/
│   ├── components/
│   │   ├── AppLayout.jsx           # Main layout wrapper with shooting star
│   │   ├── BackButton.jsx          # Navigation button
│   │   ├── CameraSetup.jsx         # Camera capture logic with GIF support
│   │   ├── ControlsCard.jsx        # Control interface
│   │   ├── FilterCarousel.jsx      # Photo filter options with "All Photos"
│   │   ├── FrameLayout.jsx         # Frame layout component
│   │   ├── frameMappings.js        # Photo frame positioning data
│   │   ├── Landing.jsx             # Welcome page with animations
│   │   ├── NextButton.jsx          # Navigation button
│   │   ├── Photobooth.jsx          # Main photobooth logic
│   │   ├── PhotoLayoutCard.jsx     # Layout selection cards
│   │   ├── StripDesign.jsx         # Design selection with GIF download
│   │   ├── StripLayoutSelection.jsx # Layout selection
│   │   └── ThemeContext.jsx        # Theme management system
│   ├── App.jsx                     # Main application component
│   ├── App.css                     # Application styles
│   ├── index.css                   # Global styles with animations
│   └── main.jsx                    # Application entry point
├── package.json                    # Dependencies and scripts
├── tailwind.config.js             # Tailwind CSS configuration
└── vite.config.js                 # Vite build configuration
```

## 🎯 How It Works

### 1. **Landing Page**
- Beautiful animated welcome screen with shooting star cursor
- Interactive hover animations with sample photo strips
- Theme-aware styling with pink/blue color schemes
- "Start Photobooth" button to begin the experience

### 2. **Layout Selection**
- Choose from 4 different photo strip layouts:
  - **1 Shot**: Single photo layout
  - **3 Shot**: Vertical 3-photo strip
  - **4 Shot**: Vertical 4-photo strip  
  - **6 Shot**: 2x3 grid layout
- Visual preview of each layout option
- Responsive grid layout for mobile devices

### 3. **Photo Capture**
- Camera access with real-time preview
- Countdown timer with visual feedback
- Automatic photo capture after countdown
- **GIF capture** during photo sessions for animated strips
- Progress indicator showing current photo number
- Retake option for multiple attempts
- Theme-aware camera interface

### 4. **Filter Selection**
- **15+ filter effects** with real-time preview
- **Individual photo filtering** - apply different filters to each photo
- **"All Photos" option** - apply the same filter to all photos at once
- **Paginated filter selection** - browse through all available filters
- **Smart highlighting** - shows which photos have which filters

### 5. **Design Selection**
- Multiple available design templates for each layout
- Browse through available design templates
- Paginated interface with visual preview
- Responsive grid layout
- Theme-aware design cards

### 6. **Download Options**
- **Photo Strip (PNG)**: Static photo strip with selected design
- **GIF Strip (Animated)**: Animated strip with captured GIFs
- Automatic photo positioning using frame mappings
- High-quality output suitable for printing
- Direct download to device

## 🛠️ Technical Details

### **Core Technologies**
- **React 18** - Modern React with hooks and context
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **MediaRecorder API** - For GIF capture functionality
- **gifshot** - GIF creation and compositing
- **gifuct-js** - GIF processing and manipulation

### **Key Dependencies**
- `gifshot` - GIF creation capabilities
- `gifuct-js` - GIF processing and frame extraction
- `react-webcam` - Webcam integration
- **Dynamic imports** for optimized loading

### **Theme System**
- **Context-based theme management** with React Context
- **Persistent theme storage** in localStorage
- **Animated backgrounds** with CSS gradients
- **Theme-aware components** that adapt colors automatically
- **Shooting star cursor** that reflects current theme

### **Filter System**
- **CSS filter effects** applied in real-time
- **Individual photo targeting** with smart UI
- **"All Photos" bulk application** for efficiency
- **Paginated filter selection** for better UX
- **Visual feedback** showing applied filters

### **GIF System**
- **MediaRecorder integration** for motion capture
- **Frame-by-frame processing** with gifuct-js
- **GIF compositing** with design overlays
- **Optimized file sizes** for web sharing
- **Cross-browser compatibility**

### **Frame Mapping System**
The application uses a sophisticated frame mapping system (`frameMappings.js`) that defines:
- Exact positioning of photos within design templates
- Border radius for rounded corners
- Frame dimensions and aspect ratios
- Support for different layout types
- GIF frame positioning for animated strips

### **Responsive Design**
- Mobile-first approach with Tailwind CSS
- Adaptive layouts for different screen sizes
- Touch-friendly interface elements
- Optimized camera viewport handling
- Responsive pagination controls

## 🎨 Customization

### **Adding New Designs**
1. Add design images to `public/designs/`
2. Update `designOverlaysByLayout` in `Photobooth.jsx`
3. Add frame mapping in `frameMappings.js`
4. Test positioning and adjust coordinates

### **Adding New Filters**
1. Add filter definition to `FILTERS` array in `ControlsCard.jsx`
2. Test filter effects on different photo types
3. Ensure cross-browser compatibility

### **Modifying Layouts**
- Edit `StripLayoutSelection.jsx` to add new layout options
- Update preview images in `public/images/`
- Adjust frame mappings accordingly

### **Theme Customization**
- Modify theme colors in `ThemeContext.jsx`
- Update CSS animations in `index.css`
- Customize shooting star behavior in `AppLayout.jsx`

## 🌐 Deployment

The application is configured for GitHub Pages deployment:

```bash
npm run deploy
```

This will build the project and deploy it to the configured GitHub Pages URL.

**Note**: After committing and pushing changes to main, run `npm run build` and then the deploy command.

## 📱 Browser Compatibility

- **Chrome/Edge**: Full support with all features
- **Firefox**: Full support with all features
- **Safari**: Full support with all features
- **Mobile browsers**: Responsive design with camera access
- **GIF features**: Supported in all modern browsers

## 🎉 Recent Updates

- ✅ **GIF capture and download** functionality
- ✅ **Theme system** with pink/blue modes
- ✅ **Enhanced filter system** with "All Photos" option
- ✅ **Improved pagination** controls
- ✅ **Shooting star cursor** animation
- ✅ **Cream-colored cards** in blue theme
- ✅ **Animated backgrounds** with gradient effects
- ✅ **Responsive design** improvements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with React and Vite
- Camera integration powered by p5.js
- Styling with Tailwind CSS
- Design templates created for optimal photo placement

---

**Created with ❤️ by Sreeja**
