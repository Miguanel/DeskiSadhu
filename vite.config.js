import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Ścieżki względne – build działa na GitHub Pages (/DeskiFakirskieSadhu/),
  // pod własną domeną i w podkatalogu na serwerze klienta (np. /konfigurator-desek/).
  base: './',
  build: {
    // three.js jest duży z natury; scena 3D ładuje się osobnym chunkiem (lazy import)
    chunkSizeWarningLimit: 1500,
  },
})
