# Photobooth Web App

A modern, feature-rich, and fully responsive web-based photobooth application built with React and Vite. This project allows users to take single or multiple shots, create animated GIFs, apply filters, and design custom photo strips and letters.

**[Live Demo](https://pinkphotobooth.vercel.app/)**

---

## ✨ Features

- **Multiple Photo Layouts**: Choose from 1, 3, 4, or 6 shot layouts.
- **Animated GIFs**: Automatically creates an animated GIF from your photo session, including support for high-quality transparent GIFs.
- **Advanced Image Filters**: Apply creative filters like Noir, Vintage, and a "Soft Focus" skin-smoothing filter. Includes a filter layering system to stack multiple effects on individual or all photos!
- **"Write Something" Feature**:
    - **Interactive Letter Card**: Add a personal touch with a draggable, resizable, and rotatable letter overlay.
    - **Custom Text**: Type your own message onto the letter card.
    - **Flexible Downloads**: Download just the photo strip, the letter card, or a composite image of both.
- **Fully Responsive Design**:
    - The entire application is optimized for both desktop and mobile devices.
    - The camera view, strip design interface, and letter overlay all adapt to portrait and landscape orientations for a seamless mobile experience.
    - Includes mobile-first touch features like swipeable carousels and an elegant sliding popup drawer for customization controls.
- **Native Mobile Ready**: Converted into a native Android app using Capacitor, complete with device gallery saving capabilities.
- **Instructional Animations**: A friendly animated helper guides users through the features of the "Write Something" corner.

---

## 🛠️ Technologies Used

- **Framework**: [React](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **GIF Creation**: `gifenc`, `gifuct-js`, `gifshot`
- **Mobile Build**: Capacitor
- **Deployment**: GitHub Pages

---

## 🚀 Setup and Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/sparrowdex/photobooth-web.git
    cd photobooth-web
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

---

## 📜 Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Bundles the app for production.
- `npm run lint`: Lints the code using ESLint.
- `npm run preview`: Serves the production build locally.
- `npm run deploy`: Deploys the application to GitHub Pages.

---

## 📦 Deployment

This project is configured for easy deployment to GitHub Pages.

To deploy your changes, run the following script:
```sh
npm run deploy
```
This script will build the application and push the contents of the `dist` folder to the `gh-pages` branch of your repository.
