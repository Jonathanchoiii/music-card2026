import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    /** 优先使用 5173；若已被其它 Vite 占用则自动递增（关掉旧 dev 可回到 5173） */
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  assetsInclude: ['**/*.glsl', '**/*.vert', '**/*.frag'],
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
