// 导入 GIF 编码库与文件保存工具
import GIF from 'gif.js'
// 将 GIF worker 脚本作为静态资源打包，避免依赖外部 CDN（离线 / 内网环境下也能导出）
import gifWorkerUrl from 'gif.js/dist/gif.worker.js?url'
import { saveAs } from 'file-saver'
// jszip 在 zip 导出时动态导入，避免与资源库导出重复静态打包

/**
 * 将字节数格式化为人类可读的字符串（B / KB / MB）。
 */
export function formatBytes(b: number): string {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(2) + ' MB'
}

/**
 * 根据压缩等级返回导出使用的分辨率缩放比例。
 * 最终导出格式固定为 PNG；压缩通过降低分辨率实现。
 * - none: 不压缩，保持用户设置尺寸
 * - low: 75% 分辨率
 * - medium: 50% 分辨率
 * - high: 25% 分辨率
 */
export function compressionQuality(level: 'none' | 'low' | 'medium' | 'high'): { type: string; scale: number; label: string } {
  switch (level) {
    case 'none': return { type: 'image/png', scale: 1, label: '无压缩' }
    case 'low': return { type: 'image/png', scale: 0.75, label: '低压缩' }
    case 'medium': return { type: 'image/png', scale: 0.5, label: '中压缩' }
    case 'high': return { type: 'image/png', scale: 0.25, label: '高压缩' }
    default: return { type: 'image/png', scale: 1, label: '无压缩' }
  }
}

/**
 * 将 dataURL 转换为 Blob。
 */
export function dataUrlToBlob(url: string): Blob {
  // 拆分 MIME 声明与 Base64 数据
  const arr = url.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  // 将 Base64 解码后的字符转换为 Uint8Array
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new Blob([u8arr], { type: mime })
}

/**
 * 加载图像并返回 HTMLImageElement。
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * 对 Canvas 像素数据应用锐化卷积核。
 * intensity 范围 0-100，0 表示无锐化。
 * 核元素之和恒为 1，避免整体亮度变化；强度越大边缘反差越大。
 */
function applySharpen(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
  if (intensity <= 0 || w < 3 || h < 3) return
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  const amount = intensity / 100 // 0 → 恒等，100 → 强锐化
  // 3×3 卷积核：中心 1+8a，四周 -a，总和为 1
  const kernel = [-amount, -amount, -amount, -amount, 1 + 8 * amount, -amount, -amount, -amount, -amount]
  const copy = new Uint8ClampedArray(data)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let ky = -1; ky <= 1; ky++)
          for (let kx = -1; kx <= 1; kx++)
            sum += copy[((y + ky) * w + (x + kx)) * 4 + c] * kernel[(ky + 1) * 3 + (kx + 1)]
        data[i + c] = Math.max(0, Math.min(255, sum))
      }
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

/**
 * 将一帧图像按压缩等级缩放后输出为 PNG 格式。
 * 压缩通过降低分辨率实现，导出格式始终为 PNG。
 * sharpen: 锐化强度 0-100，0 为不锐化。
 */
export async function resizeExportFrame(
  url: string,
  w: number,
  h: number,
  compression: 'none' | 'low' | 'medium' | 'high',
  sharpen = 0
): Promise<string> {
  const img = await loadImage(url)
  const q = compressionQuality(compression)
  const outW = Math.max(1, Math.round(w * q.scale))
  const outH = Math.max(1, Math.round(h * q.scale))
  const c = document.createElement('canvas')
  c.width = outW
  c.height = outH
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, 0, 0, outW, outH)
  // 如果启用锐化，在缩放后应用
  applySharpen(ctx, outW, outH, sharpen)
  // 导出格式固定为 PNG
  return c.toDataURL('image/png')
}

/**
 * 准备导出帧：按压缩等级缩放后统一输出为 PNG，返回实际尺寸与大小对比。
 */
export async function prepareExportFrames(
  frames: { url: string }[],
  w: number,
  h: number,
  compression: 'none' | 'low' | 'medium' | 'high',
  sharpen = 0
): Promise<{ frames: { url: string; width: number; height: number }[]; origSize: number; newSize: number }> {
  const q = compressionQuality(compression)
  const outW = Math.max(1, Math.round(w * q.scale))
  const outH = Math.max(1, Math.round(h * q.scale))
  let origSize = 0
  let newSize = 0
  const out: { url: string; width: number; height: number }[] = []
  for (const f of frames) {
    // 统计原始帧总大小
    const origBlob = dataUrlToBlob(f.url)
    origSize += origBlob.size
    // 缩放、压缩并可选锐化后统计新大小
    const url = await resizeExportFrame(f.url, w, h, compression, sharpen)
    newSize += dataUrlToBlob(url).size
    out.push({ url, width: outW, height: outH })
  }
  return { frames: out, origSize, newSize }
}

/**
 * 将帧序列合成为 WebM 视频（使用 MediaRecorder）。
 * 自动检测浏览器支持的编码器，优先 vp8，其次任何 webm 编码器。
 */
export function framesToVideo(frames: { url: string; width: number; height: number }[], delay = 100): Promise<string> {
  return new Promise((resolve, reject) => {
    const c = document.createElement('canvas')
    c.width = frames[0].width
    c.height = frames[0].height
    // 从 canvas 捕获媒体流
    const stream = c.captureStream()
    // 检测浏览器支持的 video/webm 编码器
    let mimeType = 'video/webm'
    const codecs = ['video/webm;codecs=vp8', 'video/webm;codecs=vp9', 'video/webm']
    for (const codec of codecs) {
      if (MediaRecorder.isTypeSupported(codec)) { mimeType = codec; break }
    }
    const rec = new MediaRecorder(stream, { mimeType })
    const chunks: Blob[] = []
    // 收集录制的数据块
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      resolve(URL.createObjectURL(blob))
    }
    rec.onerror = () => reject(new Error('视频编码失败，请尝试其他格式'))
    rec.start()
    let i = 0
    // 逐帧绘制到 canvas
    function addFrame() {
      if (i >= frames.length) { rec.stop(); return }
      const img = new Image()
      img.onload = () => {
        const ctx = c.getContext('2d')!
        ctx.clearRect(0, 0, c.width, c.height)
        ctx.drawImage(img, 0, 0)
        setTimeout(addFrame, delay)
      }
      img.onerror = reject
      img.src = frames[i++].url
    }
    addFrame()
  })
}

/**
 * 根据压缩等级返回 GIF 编码器质量参数（gif.js NeuQuant 采样因子）。
 * 值越小质量越高、文件越大；值越大质量越低、文件越小。
 */
function gifJsQuality(level: 'none' | 'low' | 'medium' | 'high'): number {
  switch (level) {
    case 'none': return 1
    case 'low': return 10
    case 'medium': return 20
    case 'high': return 30
    default: return 10
  }
}

/**
 * 将帧序列合成为 GIF（使用 gif.js）。
 */
export function framesToGif(
  frames: { url: string; width: number; height: number }[],
  delay = 100,
  compression: 'none' | 'low' | 'medium' | 'high' = 'none'
): Promise<{ url: string; size: number }> {
  return new Promise((resolve, reject) => {
    const gif = new GIF({
      workers: 2,
      quality: gifJsQuality(compression),
      width: frames[0].width,
      height: frames[0].height,
      workerScript: gifWorkerUrl,
    })
    let loaded = 0
    for (const f of frames) {
      const img = new Image()
      img.onload = () => {
        gif.addFrame(img, { delay })
        loaded++
        // 所有帧加载完成后开始渲染
        if (loaded === frames.length) gif.render()
      }
      img.onerror = reject
      img.src = f.url
    }
    gif.on('finished', (blob: Blob) => resolve({ url: URL.createObjectURL(blob), size: blob.size }))
    // gif.js 类型声明未包含 error 事件，但实际会触发；使用 any 绕过类型检查
    ;(gif as any).on('error', reject)
  })
}

/**
 * 生成 Sprite Sheet PNG 与元数据。
 */
async function generateSpriteSheet(
  frames: { url: string; width: number; height: number }[],
  opts: { cols: number }
): Promise<{ url: string; width: number; height: number; cellW: number; cellH: number; cols: number; rows: number }> {
  const cols = opts.cols || 4
  const rows = Math.ceil(frames.length / cols)
  const cellW = frames[0]?.width || 64
  const cellH = frames[0]?.height || 64
  const c = document.createElement('canvas')
  c.width = cols * cellW
  c.height = rows * cellH
  const ctx = c.getContext('2d')!
  for (let i = 0; i < frames.length; i++) {
    const img = await loadImage(frames[i].url)
    ctx.drawImage(img, (i % cols) * cellW, Math.floor(i / cols) * cellH)
  }
  return { url: c.toDataURL('image/png'), width: c.width, height: c.height, cellW, cellH, cols, rows }
}

/**
 * 生成 Sprite Sheet JSON 元数据字符串。
 */
function generateSpriteJson(
  name: string,
  frames: { url: string; width: number; height: number }[],
  opts: { cols: number; delay: number }
): string {
  const cols = opts.cols || 4
  const rows = Math.ceil(frames.length / cols)
  const cellW = frames[0]?.width || 64
  const cellH = frames[0]?.height || 64
  const meta = {
    name,
    frameCount: frames.length,
    columns: cols,
    rows,
    frameWidth: cellW,
    frameHeight: cellH,
    sheetWidth: cols * cellW,
    sheetHeight: rows * cellH,
    delay: opts.delay,
    frames: frames.map((_, i) => ({
      index: i,
      x: (i % cols) * cellW,
      y: Math.floor(i / cols) * cellH,
      width: cellW,
      height: cellH
    }))
  }
  return JSON.stringify(meta, null, 2)
}

/**
 * 根据导出格式生成预览 URL 或元素配置。
 */
export async function generateExportPreview(
  format: 'video' | 'gif' | 'zip' | 'sprite' | 'sprite-zip' | 'sprite-json',
  frames: { url: string }[],
  opts: { w: number; h: number; cols: number; compression: 'none' | 'low' | 'medium' | 'high'; delay: number; sharpen?: number }
): Promise<{ type: string; url: string; info?: string }> {
  const sharpen = opts.sharpen ?? 0
  // GIF 导出：不预压缩为 JPEG，保持 PNG 输入让 gif.js 自己量化颜色
  const preparedForGif = format === 'gif' ? await prepareExportFrames(frames, opts.w, opts.h, 'none') : null
  if (format === 'gif') {
    const { url, size } = await framesToGif(preparedForGif!.frames, opts.delay, opts.compression)
    return { type: 'gif', url, info: `原始 ${formatBytes(preparedForGif!.origSize)} → 导出 ${formatBytes(size)}` }
  }
  // ZIP 无压缩：直接使用原始帧 URL，避免 canvas 重编码改变体积
  if (format === 'zip' && opts.compression === 'none') {
    let totalSize = 0
    const c = document.createElement('canvas')
    const thumbW = 120
    const thumbH = Math.round(opts.h * (thumbW / opts.w))
    const cols = opts.cols || 4
    const rows = Math.ceil(frames.length / cols)
    c.width = cols * thumbW
    c.height = rows * thumbH
    const ctx = c.getContext('2d')!
    for (let i = 0; i < frames.length; i++) {
      const img = await loadImage(frames[i].url)
      ctx.drawImage(img, (i % cols) * thumbW, Math.floor(i / cols) * thumbH, thumbW, thumbH)
      totalSize += dataUrlToBlob(frames[i].url).size
    }
    const url = c.toDataURL('image/png')
    return { type: 'image', url, info: `${frames.length} 帧, ${formatBytes(totalSize)}` }
  }
  // 其余格式按压缩等级处理帧（含锐化），输出均为 PNG
  const prepared = await prepareExportFrames(frames, opts.w, opts.h, opts.compression, sharpen)
  if (format === 'video') {
    const url = await framesToVideo(prepared.frames, opts.delay)
    return { type: 'video', url, info: `原始 ${formatBytes(prepared.origSize)} → 导出 ${formatBytes(prepared.newSize)}` }
  }
  if (format === 'sprite' || format === 'sprite-zip' || format === 'sprite-json') {
    // 精灵图 / 精灵图 ZIP / 精灵图 JSON：均使用相同 PNG 预览
    const sheet = await generateSpriteSheet(prepared.frames, { cols: opts.cols })
    return { type: 'image', url: sheet.url, info: `${prepared.frames.length} 帧, ${formatBytes(dataUrlToBlob(sheet.url).size)}` }
  }
  // zip 格式预览：拼接所有帧的小图与总大小
  let totalSize = 0
  const c = document.createElement('canvas')
  const thumbW = 120
  const thumbH = Math.round((prepared.frames[0]?.height || opts.h) * (thumbW / (prepared.frames[0]?.width || opts.w)))
  const cols = opts.cols || 4
  const rows = Math.ceil(prepared.frames.length / cols)
  c.width = cols * thumbW
  c.height = rows * thumbH
  const ctx = c.getContext('2d')!
  for (let i = 0; i < prepared.frames.length; i++) {
    const img = await loadImage(prepared.frames[i].url)
    ctx.drawImage(img, (i % cols) * thumbW, Math.floor(i / cols) * thumbH, thumbW, thumbH)
    totalSize += dataUrlToBlob(prepared.frames[i].url).size
  }
  const url = c.toDataURL('image/png')
  return { type: 'image', url, info: `${prepared.frames.length} 帧, ${formatBytes(totalSize)}` }
}

/**
 * 下载导出结果：根据格式触发下载或保存 ZIP。
 */
export async function downloadExport(
  format: 'video' | 'gif' | 'zip' | 'sprite' | 'sprite-zip' | 'sprite-json',
  frames: { url: string }[],
  opts: { w: number; h: number; cols: number; compression: 'none' | 'low' | 'medium' | 'high'; delay: number; sharpen?: number },
  name: string
) {
  const sharpen = opts.sharpen ?? 0
  // GIF 导出：不预压缩为 JPEG，保持 PNG 输入让 gif.js 量化颜色
  const preparedForGif = format === 'gif' ? await prepareExportFrames(frames, opts.w, opts.h, 'none') : null
  if (format === 'gif') {
    const { url } = await framesToGif(preparedForGif!.frames, opts.delay, opts.compression)
    const a = document.createElement('a')
    a.href = url
    a.download = name + '.gif'
    a.click()
    return
  }
  // ZIP 无压缩：直接打包原始帧，避免 canvas 重编码
  if (format === 'zip' && opts.compression === 'none') {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    frames.forEach((f, i) => {
      const blob = dataUrlToBlob(f.url)
      zip.file(name + '_' + String(i).padStart(4, '0') + '.png', blob)
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, name + '.zip')
    return
  }
  const prepared = await prepareExportFrames(frames, opts.w, opts.h, opts.compression, sharpen)
  if (format === 'video') {
    const url = await framesToVideo(prepared.frames, opts.delay)
    const a = document.createElement('a')
    a.href = url
    a.download = name + '.webm'
    a.click()
    return
  }
  if (format === 'sprite' || format === 'sprite-zip' || format === 'sprite-json') {
    const sheet = await generateSpriteSheet(prepared.frames, { cols: opts.cols })
    const json = generateSpriteJson(name, prepared.frames, { cols: opts.cols, delay: opts.delay })
    // 仅下载 JSON 元数据
    if (format === 'sprite-json') {
      const blob = new Blob([json], { type: 'application/json' })
      saveAs(blob, name + '_sprite.json')
      return
    }
    // 下载 PNG 精灵图
    if (format === 'sprite') {
      const a = document.createElement('a')
      a.href = sheet.url
      a.download = name + '_sprite.png'
      a.click()
      return
    }
    // 打包 PNG + JSON 为 ZIP
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    zip.file(name + '_sprite.png', dataUrlToBlob(sheet.url))
    zip.file(name + '_sprite.json', json)
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, name + '_sprite.zip')
    return
  }
  // zip 格式：使用 JSZip 打包所有帧，扩展名固定为 PNG
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  prepared.frames.forEach((f, i) => {
    const blob = dataUrlToBlob(f.url)
    zip.file(name + '_' + String(i).padStart(4, '0') + '.png', blob)
  })
  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, name + '.zip')
}

/**
 * 通过创建临时 <a> 元素触发文件下载。
 */
export function downloadUrl(url: string, name: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
}
