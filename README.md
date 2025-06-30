# Sreeja's Photobooth App

A modern, interactive web-based photobooth application built with React, p5.js, and Tailwind CSS. Create, customize, and download beautiful photo strips with multiple layout options and design templates.

## 🌟 Features

### 📸 **Photo Capture**
- **Real-time camera integration** using p5.js and React Camera Pro
- **Multiple shot layouts**: 1, 3, 4, or 6 photos per strip
- **Countdown timer** with visual feedback for perfect timing
- **Auto-capture** with customizable countdown (3 seconds)
- **Retake functionality** for multiple attempts

### 🎨 **Design Customization**
- **Multiple design templates** for each layout type
- **Paginated design selection** with 2 designs per page
- **Visual preview** of selected designs
- **Frame mapping system** for precise photo placement
- **Responsive design** that works on desktop and mobile

### 🖼️ **Photo Processing**
- **Smart image cropping** with aspect ratio preservation
- **Frame overlay system** with precise positioning
- **Border radius support** for rounded photo frames
- **High-quality output** suitable for printing

### 📱 **User Experience**
- **Beautiful landing page** with animated elements
- **Step-by-step workflow** with clear navigation
- **Responsive interface** optimized for all screen sizes
- **Interactive hover effects** and smooth transitions
- **Help system** with usage instructions

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
│   │   ├── designs/          # Photo strip design templates
│   │   └── logo.png          # Application logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppLayout.jsx           # Main layout wrapper
│   │   │   ├── BackButton.jsx          # Navigation button
│   │   │   ├── CameraSetup.jsx         # Camera capture logic
│   │   │   ├── ControlsCard.jsx        # Control interface
│   │   │   ├── FilterCarousel.jsx      # Photo filter options
│   │   │   ├── FrameLayout.jsx         # Frame layout component
│   │   │   ├── frameMappings.js        # Photo frame positioning data
│   │   │   ├── Landing.jsx             # Welcome page
│   │   │   ├── NextButton.jsx          # Navigation button
│   │   │   ├── Photobooth.jsx          # Main photobooth logic
│   │   │   ├── PhotoLayoutCard.jsx     # Layout selection cards
│   │   │   ├── StripDesign.jsx         # Design selection interface
│   │   │   └── StripLayoutSelection.jsx # Layout selection
│   │   ├── App.jsx                     # Main application component
│   │   ├── App.css                     # Application styles
│   │   ├── index.css                   # Global styles
│   │   └── main.jsx                    # Application entry point
│   ├── package.json                    # Dependencies and scripts
│   ├── tailwind.config.js             # Tailwind CSS configuration
│   └── vite.config.js                 # Vite build configuration
```

## 🎯 How It Works

### 1. **Landing Page**
- A beautiful animated welcome screen with wand cursor
- Interactive hover animations with sample photo strips
- "Start Photobooth" button to begin the experience

### 2. **Layout Selection**
- Choose from 4 different photo strip layouts:
  - **1 Shot**: Single photo layout
  - **3 Shot**: Vertical 3-photo strip
  - **4 Shot**: Vertical 4-photo strip  
  - **6 Shot**: 2x3 grid layout
- Visual preview of each layout option

### 3. **Photo Capture**
- Camera access with real-time preview
- Countdown timer with visual feedback
- Automatic photo capture after countdown
- Progress indicator showing current photo number
- Retake option for multiple attempts

### 4. **Design Selection**
- Multiple available filters mimicked through the help of Tailwind CSS
- Browse through available design templates
- Paginated interface (2 designs per page)
- Visual preview of selected design
- Responsive grid layout

### 5. **Download**
- Generate final photo strip with selected design
- Automatic photo positioning using frame mappings
- High-quality PNG output
- Direct download to device
- GIF download [not yet added]

## 🛠️ Technical Details

### **Core Technologies**
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **p5.js** - Creative coding library for camera handling
- **Tailwind CSS** - Utility-first CSS framework [newer version without Post CSS plug-in breaks on windows, revert to stable versions]
- **React Camera Pro** - Advanced camera integration

### **Key Dependencies**
- `@p5-wrapper/react` - React wrapper for p5.js
- `react-camera-pro` - Professional camera component
- `gifshot` - GIF creation capabilities (to be added soon)
- `react-webcam` - Webcam integration

### **Frame Mapping System**
The application uses a sophisticated frame mapping system (`frameMappings.js`) that defines:
- Exact positioning of photos within design templates
- Border radius for rounded corners
- Frame dimensions and aspect ratios
- Support for different layout types

### **Responsive Design**
- Mobile-first approach with Tailwind CSS
- Adaptive layouts for different screen sizes
- Touch-friendly interface elements
- Optimized camera viewport handling

## 🎨 Customization

### **Adding New Designs**
1. Add design images to `public/designs/`
2. Update `designOverlaysByLayout` in `Photobooth.jsx`
3. Add frame mapping in `frameMappings.js`
4. Test positioning and adjust coordinates

### **Modifying Layouts**
- Edit `StripLayoutSelection.jsx` to add new layout options
- Update preview images in `public/images/`
- Adjust frame mappings accordingly

### **Styling Changes**
- Modify Tailwind classes in components
- Update `tailwind.config.js` for custom colors/themes
- Edit CSS files for advanced styling

## 🌐 Deployment

The application is configured for GitHub Pages deployment:

```bash
npm run deploy
```

This will build the project and deploy it to the configured GitHub Pages URL.

(After committing and pushing the changes to main , do npm run build and then the deploy command)

## 📱 Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Mobile browsers**: Responsive design with camera access

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
