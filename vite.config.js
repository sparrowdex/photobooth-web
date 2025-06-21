import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  base: '/photobooth-web/', // <-- Add this line (replace with your repo name)
  plugins: [react()],
})
