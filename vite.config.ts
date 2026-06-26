import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

// 修复 Windows junction/虚拟化路径下 Vite/Rolldown 把 index.html 绝对路径当作 chunk name 的问题
function fixHtmlEmitPlugin() {
  return {
    name: 'fix-html-emit',
    enforce: 'pre' as const,
    buildStart() {
      const ctx = this as any
      const originalEmitFile = ctx.emitFile.bind(ctx)
      ctx.emitFile = (file: any) => {
        if (file && typeof file.fileName === 'string' && path.isAbsolute(file.fileName)) {
          file.fileName = path.basename(file.fileName)
        }
        if (file && typeof file.name === 'string' && path.isAbsolute(file.name)) {
          file.name = path.basename(file.name)
        }
        return originalEmitFile(file)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [fixHtmlEmitPlugin(), vue()],
  base: '/ArtForgeAi/',
})
