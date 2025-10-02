import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path' // استيراد resolve

export default defineConfig({
  // تحديد المجلد الجذر لمشروع الواجهة
  root: resolve(__dirname, 'src/renderer'),
  
  // تحديد المجلد الذي سيتم بناء الملفات فيه (سيصبح مهمًا لاحقًا)
  build: {
    outDir: resolve(__dirname, 'dist/renderer')
  },
  
  plugins: [react()],
})