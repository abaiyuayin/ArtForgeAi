import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import fs from 'node:fs'

// 修复 Windows junction/虚拟化路径下 Vite/Rolldown 把 index.html 绝对路径当作 chunk name 的问题
function fixHtmlEmitPlugin() {
  return {
    name: 'fix-html-emit',
    enforce: 'pre' as const,
    configResolved(config: any) {
      // 拦截底层 emitFile，强制修正绝对路径为 basename
      const originalEmitFile = (config as any).__emitFile || (config as any).emitFile
      ;(config as any).__emitFile = originalEmitFile
    },
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
    generateBundle(_options: any, bundle: any) {
      // 兜底：在生成阶段再次检查并修正 index.html 的绝对路径 key
      for (const key of Object.keys(bundle)) {
        if (key.endsWith('index.html') && path.isAbsolute(key)) {
          const asset = bundle[key]
          delete bundle[key]
          bundle['index.html'] = asset
        }
      }
    },
  }
}

// 将项目根目录解析为真实路径，避免 Windows 虚拟化路径导致相对路径计算异常
const realRoot = fs.realpathSync(process.cwd())

// https://vite.dev/config/
export default defineConfig({
  plugins: [fixHtmlEmitPlugin(), vue()],
  root: realRoot,
  base: '/ArtForgeAi/',
  build: {
    rollupOptions: {
      input: path.join(realRoot, 'index.html'),
    },
  },
})
