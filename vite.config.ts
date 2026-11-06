import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Older iPhones (iOS 14–16.3) can't read the newer "width<=640px" media queries,
    // so they showed the desktop layout. Targeting Safari 14 makes the build write
    // "max-width: 640px" (and older-safe JS) that every iPhone understands.
    target: ['es2020', 'safari14', 'chrome90', 'firefox90', 'edge90'],
    cssTarget: ['safari14', 'chrome90', 'firefox90', 'edge90'],
  },
})
