import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  // تحديد المجلد الجذر لمشروع الواجهة
  root: resolve(__dirname, 'src/renderer'),
  
  // تحديد المجلد الذي سيتم بناء الملفات فيه
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/index.html')
    }
  },
  
  // إعدادات التطوير
  server: {
    port: 5173
  },
  
  plugins: [react()],
  
  // إعدادات إضافية للإنتاج
  base: './',
})