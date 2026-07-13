// useVideoToFrames：视频转序列帧共享逻辑
// 采用模块级单例状态，页面组件与子组件通过调用该 composable 共享同一套状态

import { ref, reactive, computed, nextTick, watch } from 'vue'
import { loadImage, generateExportPreview, downloadExport } from '../utils/export'
import { dataUrlToFile, useLibrarySaver } from './useLibrary'
import { computeCropDisplayMetrics, fitCropToOutput, clampCrop, estimateFrameCount } from '../utils/videoCrop'

// 事件类型定义
export interface VideoToFramesEmit {
  (e: 'status', msg: string): void
  (e: 'toast', text: string, type?: 'info' | 'success' | 'warning' | 'error'): void
  (e: 'loading', open: boolean, text?: string): void
  (e: 'pick-asset', type: string, callback: (asset: any) => void, keepOpen?: boolean): void
}

// 模块级共享状态与引用
let initialized = false
let tFn: (key: string) => string = (key) => key
let emitFn: VideoToFramesEmit | undefined

// 视频状态
const video = reactive({
  step: 1,
  file: null as File | null,
  url: '',
  duration: 0,
  width: 0,
  height: 0,
  nativeFps: 30,
  fps: 12,
  outW: 512,
  outH: 512,
  error: '', // 视频加载错误提示，如编码格式不受浏览器支持
  frames: [] as { url: string; selected: boolean; similarGroup: number; originalUrl?: string }[],
  previewFps: 12,
  playing: false,
  progress: 0,
  showCrop: true,
  crop: { x: 0, y: 0, w: 100, h: 100 },
  rangeStart: 0,
  rangeEnd: 0,
  lockAspect: true,
  export: {
    format: 'video',
    cols: 4,
    preset: 'custom',
    w: 512,
    h: 512,
    lockAspect: true,
    compression: 'none',
    delay: 100,
    name: 'artforge_export',
    preview: '',
    sizeEstimate: '',
  },
})

// DOM 引用
const sourceVideo = ref<HTMLVideoElement | null>(null)
const videoFileInput = ref<HTMLInputElement | null>(null)
const videoCropContainer = ref<HTMLDivElement | null>(null)
const cropPreviewCanvas = ref<HTMLCanvasElement | null>(null)
const videoPreviewCanvas = ref<HTMLCanvasElement | null>(null)
const videoAnimCanvas = ref<HTMLCanvasElement | null>(null)
const exportPreviewVideo = ref<HTMLVideoElement | null>(null)

// 播放与动画状态
const videoCropPreviewPlaying = ref(false)
let videoPreviewRaf: number | null = null
let cropResizing = false
let videoAnimRaf: number | null = null
let videoAnimFrame = 0

// 裁剪框显示缩放与偏移
const cropMetrics = reactive({ scale: 1, offsetX: 0, offsetY: 0 })

// 最近点击的帧索引，用于 Shift 连选
const lastFrameClickIndex = ref(-1)

// 相似帧配色
const similarColors = ['#ff4d4d', '#ffd000', '#28c76f', '#1f8bff', '#ff7a00', '#a04bff', '#ff3d9a', '#00c2a8', '#ffe14d', '#7c5cff']

// 资源库保存函数（延迟初始化，避免模块加载时 Pinia 尚未就绪）
let saveFileToLibrary: (file: File, dataUrl: string) => Promise<void>

// 初始化：仅执行一次，注册监听与计算属性
function init() {
  if (initialized) return
  initialized = true

  // 切换导出格式后自动重新生成预览
  watch(() => video.export.format, () => {
    if (video.frames.length && video.step === 3) generateVideoExportPreview()
  })

  // 切换压缩等级后立即刷新导出预览
  watch(() => video.export.compression, () => {
    if (video.frames.length && video.step === 3) generateVideoExportPreview()
  })

  // 修改导出尺寸、预设后也立即刷新预览
  watch(() => [video.export.preset, video.export.w, video.export.h], () => {
    if (video.frames.length && video.step === 3) generateVideoExportPreview()
  })

  // 修改精灵图/序列帧 ZIP 列数后立即刷新导出预览
  watch(() => video.export.cols, () => {
    if (video.frames.length && video.step === 3 && (video.export.format === 'sprite' || video.export.format === 'zip')) {
      generateVideoExportPreview()
    }
  })
}

// 本地化函数封装
function t(key: string): string {
  return tFn(key)
}

// 状态提示封装
function setStatus(msg: string) {
  emitFn?.('status', msg)
}

function toast(text: string, type: 'info' | 'success' | 'warning' | 'error' = 'success') {
  emitFn?.('toast', text, type)
}

function loading(open: boolean, text: string = '') {
  emitFn?.('loading', open, text)
}

function openAssetPicker(type: string, callback: (asset: any) => void, keepOpen = false) {
  emitFn?.('pick-asset', type, callback, keepOpen)
}

// 步骤标签
const videoStepLabels = computed(() => [t('videoStep1'), t('videoStep2'), t('videoStep3')])

// 裁剪框样式
const videoCropStyle = computed(() => ({
  left: cropMetrics.offsetX + video.crop.x * cropMetrics.scale + 'px',
  top: cropMetrics.offsetY + video.crop.y * cropMetrics.scale + 'px',
  width: video.crop.w * cropMetrics.scale + 'px',
  height: video.crop.h * cropMetrics.scale + 'px',
}))

// 估计提取帧数
const videoEstFrames = computed(() => estimateFrameCount(video.rangeStart, video.rangeEnd, video.fps))

// 相似帧配色样式
function similarFrameStyle(group: number): Record<string, string> {
  if (group === -1 || group === undefined) return {}
  const color = similarColors[group % similarColors.length]
  return {
    borderColor: color,
    borderWidth: '2px',
    borderStyle: 'solid',
    boxShadow: '0 0 0 2px ' + color,
  }
}

// 根据视频元素的实际显示尺寸更新裁剪框的显示缩放与偏移
function updateCropMetrics() {
  const container = videoCropContainer.value
  const v = sourceVideo.value
  if (!container || !v) return
  const metrics = computeCropDisplayMetrics(
    container.getBoundingClientRect(),
    v.getBoundingClientRect(),
    video.width || v.videoWidth,
    video.height || v.videoHeight,
  )
  cropMetrics.scale = metrics.scale
  cropMetrics.offsetX = metrics.offsetX
  cropMetrics.offsetY = metrics.offsetY
}

function onVideoMeta() {
  const v = sourceVideo.value
  if (!v) return
  if (!v.videoWidth || !v.videoHeight || !isFinite(v.duration)) return
  setVideoMeta(v)
}

// 首帧解码完成后补全视频信息
function onVideoData() {
  const v = sourceVideo.value
  if (!v) return
  if (v.videoWidth && v.videoHeight && (!video.width || !video.height)) {
    setVideoMeta(v)
    return
  }
  if (!v.videoWidth || !v.videoHeight) {
    if (!video.error) {
      requestAnimationFrame(() => {
        const v2 = sourceVideo.value
        if (v2 && v2.videoWidth && v2.videoHeight && (!video.width || !video.height)) {
          setVideoMeta(v2)
        } else if (v2 && (!v2.videoWidth || !v2.videoHeight)) {
          const mimeType = video.file?.type || 'video/mp4'
          video.error = `无法读取视频画面（${mimeType}）。当前浏览器不支持该视频编码，常见原因是 H.265/HEVC 缺少解码器。建议用转码工具转换为 H.264 编码的 MP4 后重试。`
          video.width = 0
          video.height = 0
        }
      })
    }
    return
  }
  updateCropMetrics()
}

// 将视频元素的有效元数据写入状态
function setVideoMeta(v: HTMLVideoElement) {
  video.error = ''
  video.duration = v.duration
  video.width = v.videoWidth
  video.height = v.videoHeight
  let detectedFps = 30
  const videoTracks = (v as HTMLVideoElement & { videoTracks?: { frameRate?: number }[] }).videoTracks
  if (videoTracks) {
    for (let i = 0; i < videoTracks.length; i++) {
      if (videoTracks[i]?.frameRate) {
        detectedFps = videoTracks[i].frameRate || 30
        break
      }
    }
  }
  video.nativeFps = detectedFps
  video.crop = { x: 0, y: 0, w: v.videoWidth, h: v.videoHeight }
  video.outW = v.videoWidth
  video.outH = v.videoHeight
  video.rangeEnd = v.duration
  video.showCrop = true
  nextTick(() => {
    updateCropMetrics()
    updateCropPreview()
    drawVideoCropFrame()
  })
}

// 视频元素触发 error 事件时给出可读的错误提示
function onVideoError() {
  const v = sourceVideo.value
  if (!v) return
  const code = v.error?.code
  const mimeType = video.file?.type || 'video/mp4'
  const baseHint = `（${mimeType}）。建议转换为 H.264 编码的 MP4 后重试。`
  const messages: Record<number, string> = {
    1: '视频加载被中止' + baseHint,
    2: '网络错误导致视频加载失败' + baseHint,
    3: '视频解码失败，当前浏览器不支持该编码格式' + baseHint,
    4: '视频格式不受支持' + baseHint,
  }
  video.error = messages[code || 0] || `视频加载失败，请检查视频格式或编码是否受浏览器支持${baseHint}`
}

function startCropResize(_e: MouseEvent, dir: string) {
  cropResizing = true
  const onMove = (ev: MouseEvent) => {
    if (!cropResizing) return
    const container = videoCropContainer.value
    if (!container) return
    const rect = container.getBoundingClientRect()
    const mx = (ev.clientX - rect.left - cropMetrics.offsetX) / cropMetrics.scale
    const my = (ev.clientY - rect.top - cropMetrics.offsetY) / cropMetrics.scale
    const vw = video.width || 640
    const vh = video.height || 360
    if (dir.includes('e')) {
      video.crop.w = Math.max(10, Math.min(mx, vw) - video.crop.x)
    }
    if (dir.includes('w')) {
      const newX = Math.max(0, Math.min(mx, video.crop.x + video.crop.w - 10))
      video.crop.w = video.crop.x + video.crop.w - newX
      video.crop.x = newX
    }
    if (dir.includes('s')) {
      video.crop.h = Math.max(10, Math.min(my, vh) - video.crop.y)
    }
    if (dir.includes('n')) {
      const newY = Math.max(0, Math.min(my, video.crop.y + video.crop.h - 10))
      video.crop.h = video.crop.y + video.crop.h - newY
      video.crop.y = newY
    }
    video.crop = clampCrop(video.crop, vw, vh)
  }
  const onUp = () => {
    cropResizing = false
    updateCropPreview()
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function updateCropFromInputs() {
  video.showCrop = true
  video.crop = clampCrop(video.crop, video.width, video.height)
  updateCropPreview()
}

function updateCropPreview() {
  const v = sourceVideo.value
  if (!v) return
  const c = cropPreviewCanvas.value
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  c.width = video.outW || video.crop.w
  c.height = video.outH || video.crop.h
  ctx.fillStyle = '#14141c'
  ctx.fillRect(0, 0, c.width, c.height)
  try {
    const fit = fitCropToOutput(video.crop.w, video.crop.h, c.width, c.height)
    ctx.drawImage(v, video.crop.x, video.crop.y, video.crop.w, video.crop.h, fit.x, fit.y, fit.w, fit.h)
  } catch {
    /* canvas tainted or video not ready */
  }
}

// 重新上传视频：仅弹出文件选择框
function reuploadVideo() {
  nextTick(() => videoFileInput.value?.click())
}

// 关闭视频：清除当前视频文件信息并释放资源
function closeVideo() {
  stopCropVideoPreview()
  if (video.url) URL.revokeObjectURL(video.url)
  resetFrameEditor()
  video.file = null
  video.url = ''
  video.frames = []
  video.duration = 0
  video.width = 0
  video.height = 0
  video.rangeStart = 0
  video.rangeEnd = 0
  video.step = 1
  video.progress = 0
  video.nativeFps = 30
  video.error = ''
  video.crop = { x: 0, y: 0, w: 100, h: 100 }
  video.outW = 0
  video.outH = 0
  video.showCrop = false
}

// 切换裁剪视频实时预览的播放/暂停状态
function toggleCropVideoPreview() {
  if (videoCropPreviewPlaying.value) stopCropVideoPreview()
  else startCropVideoPreview()
}

// 开始裁剪视频实时预览
function startCropVideoPreview() {
  const v = sourceVideo.value
  if (!v) return
  if (v.currentTime < video.rangeStart || v.currentTime > video.rangeEnd) {
    v.currentTime = video.rangeStart
  }
  v.play().catch(() => {})
  videoCropPreviewPlaying.value = true
  renderCropVideoPreview()
}

// 停止裁剪视频实时预览
function stopCropVideoPreview() {
  videoCropPreviewPlaying.value = false
  if (videoPreviewRaf) {
    cancelAnimationFrame(videoPreviewRaf)
    videoPreviewRaf = null
  }
  const v = sourceVideo.value
  if (v && !v.paused) v.pause()
}

// 绘制单帧裁剪视频实时预览
function drawVideoCropFrame() {
  const v = sourceVideo.value
  const c = videoPreviewCanvas.value
  if (!v || !c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  c.width = video.outW || video.crop.w || c.clientWidth || 320
  c.height = video.outH || video.crop.h || c.clientHeight || 180
  ctx.fillStyle = '#14141c'
  ctx.fillRect(0, 0, c.width, c.height)
  try {
    const fit = fitCropToOutput(video.crop.w, video.crop.h, c.width, c.height)
    ctx.drawImage(v, video.crop.x, video.crop.y, video.crop.w, video.crop.h, fit.x, fit.y, fit.w, fit.h)
  } catch {
    /* 跨域或视频未就绪时忽略 */
  }
}

// 当时间范围变化后刷新裁剪视频实时预览
function refreshVideoCropPreview() {
  const v = sourceVideo.value
  if (!v) return
  let start = num(video.rangeStart)
  let end = num(video.rangeEnd)
  if (start < 0) start = 0
  if (end > video.duration) end = video.duration
  if (start > end) start = end
  video.rangeStart = start
  video.rangeEnd = end
  if (v.currentTime < video.rangeStart || v.currentTime > video.rangeEnd) {
    v.currentTime = video.rangeStart
  }
  if (videoCropPreviewPlaying.value) {
    if (v.paused) v.play().catch(() => {})
  } else {
    drawVideoCropFrame()
  }
}

// 渲染裁剪视频实时预览帧（RAF 循环）
function renderCropVideoPreview() {
  if (!videoCropPreviewPlaying.value) return
  const v = sourceVideo.value
  if (!v) return
  if (v.currentTime >= video.rangeEnd) {
    v.currentTime = video.rangeStart
    v.play().catch(() => {})
  }
  drawVideoCropFrame()
  videoPreviewRaf = requestAnimationFrame(renderCropVideoPreview)
}

async function loadVideo(files: FileList) {
  const file = files[0]
  if (!file) return
  stopCropVideoPreview()
  if (video.url) URL.revokeObjectURL(video.url)
  video.file = null
  video.url = ''
  video.frames = []
  video.duration = 0
  video.width = 0
  video.height = 0
  video.rangeStart = 0
  video.rangeEnd = 0
  video.step = 1
  video.progress = 0
  video.nativeFps = 30
  video.error = ''
  video.crop = { x: 0, y: 0, w: 100, h: 100 }
  video.outW = 0
  video.outH = 0
  video.showCrop = false
  const mimeType = file.type || 'video/mp4'
  const playable = checkVideoPlayable(mimeType)
  if (!playable) {
    video.error = `当前浏览器不支持该视频格式（${mimeType}）。建议用转码工具转换为 H.264 编码的 MP4 后重试。`
    return
  }
  await nextTick()
  video.file = file
  video.url = URL.createObjectURL(file)
  await nextTick()
  const v = sourceVideo.value
  if (!v) return
  v.onloadedmetadata = () => {
    stopCropVideoPreview()
    onVideoMeta()
  }
  saveFileToLibrary(file, video.url)
}

// 检测浏览器是否能播放指定 MIME 类型的视频
function checkVideoPlayable(mimeType: string): boolean {
  const testVideo = document.createElement('video')
  const result = testVideo.canPlayType(mimeType)
  return result === 'probably' || result === 'maybe'
}

// 处理重新上传的视频文件
function handleVideoFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const dt = new DataTransfer()
    dt.items.add(file)
    loadVideo(dt.files)
  }
  input.value = ''
}

// 从资源库导入视频
function importVideoFromLibrary() {
  openAssetPicker('video', async (asset) => {
    try {
      const file = await dataUrlToFile(asset.dataUrl, asset.name, 'video/mp4')
      const dt = new DataTransfer()
      dt.items.add(file)
      await loadVideo(dt.files)
      setStatus(t('assetImported'))
    } catch (err) {
      setStatus(t('assetImportFailed') + ': ' + (err as Error).message)
    }
  })
}

async function extractVideoFrames() {
  if (video.error || !video.width || !video.height) {
    toast(video.error || '视频尚未正确加载，无法提取帧', 'warning')
    return
  }
  resetFrameEditor()
  video.progress = 0
  setStatus(t('extractingFrames'))
  const total = estimateFrameCount(video.rangeStart, video.rangeEnd, video.fps)
  const v = sourceVideo.value!
  video.frames = []
  const outW = Math.max(1, Math.round(video.crop.w))
  const outH = Math.max(1, Math.round(video.crop.h))
  video.outW = outW
  video.outH = outH
  for (let i = 0; i < total; i++) {
    v.currentTime = video.rangeStart + i / video.fps
    await new Promise((r) => v.addEventListener('seeked', r, { once: true }))
    const c = document.createElement('canvas')
    c.width = outW
    c.height = outH
    const ctx = c.getContext('2d')!
    ctx.drawImage(v, video.crop.x, video.crop.y, video.crop.w, video.crop.h, 0, 0, outW, outH)
    video.frames.push({
      url: c.toDataURL('image/png'),
      selected: true,
      similarGroup: -1,
      originalUrl: c.toDataURL('image/png'),
    })
    video.progress = Math.round(((i + 1) / total) * 100)
  }
  video.export.w = outW
  video.export.h = outH
  video.step = 2
  video.progress = 0
  setStatus(t('extractDone'))
}

async function detectSimilarFrames() {
  loading(true, t('loading'))
  const compareSize = 16
  const frameData: Uint8Array[] = []
  for (const f of video.frames) {
    const img = await loadImage(f.url)
    const c = document.createElement('canvas')
    c.width = compareSize
    c.height = compareSize
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0, compareSize, compareSize)
    frameData.push(new Uint8Array(ctx.getImageData(0, 0, compareSize, compareSize).data))
  }
  let groupId = 0
  const assigned = new Set<number>()
  for (let i = 0; i < video.frames.length; i++) {
    if (assigned.has(i)) continue
    const group: number[] = [i]
    for (let j = i + 1; j < video.frames.length; j++) {
      if (assigned.has(j)) continue
      let same = 0
      const total = compareSize * compareSize * 4
      for (let k = 0; k < total; k += 4) {
        if (
          Math.abs(frameData[i][k] - frameData[j][k]) < 5 &&
          Math.abs(frameData[i][k + 1] - frameData[j][k + 1]) < 5 &&
          Math.abs(frameData[i][k + 2] - frameData[j][k + 2]) < 5
        ) {
          same++
        }
      }
      if (same / (total / 4) >= 0.95) group.push(j)
    }
    group.forEach((idx) => {
      video.frames[idx].similarGroup = groupId
      assigned.add(idx)
    })
    if (group.length > 1) groupId++
    else video.frames[i].similarGroup = -1
  }
  loading(false)
  setStatus(t('detectDone'))
}

function selectAllFrames() {
  video.frames.forEach((f) => (f.selected = true))
}

function deselectAllFrames() {
  video.frames.forEach((f) => (f.selected = false))
}

function toggleVideoPreview() {
  if (video.playing) {
    stopVideoPreview()
    return
  }
  const selected = video.frames.filter((f) => f.selected)
  const frames = selected.length ? selected : video.frames
  if (!frames.length) return
  video.playing = true
  setStatus(t('playing'))
  videoAnimFrame = 0
  const canvas = videoAnimCanvas.value
  if (!canvas) {
    video.playing = false
    return
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const img = new Image()
  const render = () => {
    if (!video.playing) return
    const frame = frames[videoAnimFrame % frames.length]
    videoAnimFrame++
    img.onload = () => {
      if (!video.playing) return
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)
      videoAnimRaf = setTimeout(render, 1000 / video.previewFps) as any
    }
    img.onerror = () => {
      if (!video.playing) return
      videoAnimRaf = setTimeout(render, 1000 / video.previewFps) as any
    }
    img.src = frame.url
  }
  render()
}

function stopVideoPreview() {
  video.playing = false
  setStatus(t('paused'))
  if (videoAnimRaf) {
    clearTimeout(videoAnimRaf)
    videoAnimRaf = null
  }
}

// 确认导出：进入导出步骤并自动生成预览
async function confirmVideoExport() {
  video.step = 3
  await nextTick()
  await generateVideoExportPreview()
  if (video.export.format === 'video') {
    const el = exportPreviewVideo.value
    if (el) {
      el.loop = true
      el.play().catch(() => {})
    }
  }
}

async function generateVideoExportPreview() {
  const selected = video.frames.filter((f) => f.selected)
  const frames = selected.length ? selected : video.frames
  if (!frames.length) return
  loading(true, t('loading'))
  try {
    const result = await generateExportPreview(
      video.export.format as any,
      frames,
      {
        w: video.export.w,
        h: video.export.h,
        cols: video.export.cols,
        compression: video.export.compression as any,
        delay: video.export.delay,
      },
    )
    video.export.preview = result.url
    video.export.sizeEstimate = result.info || ''
    setStatus(t('exportPreviewDone'))
  } catch (e) {
    setStatus('预览生成失败')
  } finally {
    loading(false)
  }
}

async function downloadVideoExport() {
  const selected = video.frames.filter((f) => f.selected)
  const frames = selected.length ? selected : video.frames
  if (!frames.length) return
  loading(true, t('downloading'))
  try {
    await downloadExport(
      video.export.format as any,
      frames,
      {
        w: video.export.w,
        h: video.export.h,
        cols: video.export.cols,
        compression: video.export.compression as any,
        delay: video.export.delay,
      },
      video.export.name,
    )
  } catch (e) {
    setStatus('下载失败')
  } finally {
    loading(false)
  }
}

async function downloadVideoSprite(fmt: 'sprite' | 'sprite-zip' | 'sprite-json') {
  const selected = video.frames.filter((f) => f.selected)
  const frames = selected.length ? selected : video.frames
  if (!frames.length) return
  loading(true, t('downloading'))
  try {
    await downloadExport(
      fmt,
      frames,
      {
        w: video.export.w,
        h: video.export.h,
        cols: video.export.cols,
        compression: video.export.compression as any,
        delay: video.export.delay,
      },
      video.export.name,
    )
  } catch (e) {
    setStatus('下载失败')
  } finally {
    loading(false)
  }
}

function applyExportPreset() {
  const presets: Record<string, [number, number]> = {
    '64x64': [64, 64],
    '128x128': [128, 128],
    '256x455': [256, 455],
    '512x512': [512, 512],
    '512x910': [512, 910],
  }
  const p = presets[video.export.preset]
  if (p) {
    video.export.w = p[0]
    video.export.h = p[1]
  }
}

function wheelNumber(e: WheelEvent, path: string, min: number, max: number) {
  e.preventDefault()
  const val = num(
    path === 'video.fps' ? video.fps : path === 'video.rangeStart' ? video.rangeStart : video.rangeEnd,
  )
  const newVal = Math.max(min, Math.min(max, val + (e.deltaY > 0 ? -0.1 : 0.1)))
  if (path === 'video.fps') video.fps = Math.max(1, Math.round(newVal))
  else if (path === 'video.rangeStart') video.rangeStart = newVal
  else video.rangeEnd = newVal
}

// 当锁定宽高比时，同步视频提取输出尺寸的另一边
function syncVideoOutSize(changed: 'width' | 'height') {
  if (!video.lockAspect || !video.crop.w || !video.crop.h) return
  const ratio = video.crop.w / video.crop.h
  if (changed === 'width') {
    video.outH = Math.round(video.outW / ratio)
  } else {
    video.outW = Math.round(video.outH * ratio)
  }
}

// 将值规范化为数字
function num(v: any): number {
  return typeof v === 'number' && !isNaN(v) ? v : Number(v) || 0
}

// 将数字格式化为固定小数位字符串
function fmtFixed(v: any, digits = 2): string {
  return num(v).toFixed(digits)
}

// 输入框聚焦时全选内容
function selectOnFocus(e: FocusEvent) {
  const target = e.target as HTMLInputElement
  target.select()
}

// 导出文件名输入框快捷键
function handleExportNameKeydown(e: KeyboardEvent, _source: 'video' | 'gif') {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
    e.preventDefault()
    e.stopPropagation()
    const input = e.target as HTMLInputElement
    input.select()
  }
}

// 帧缩略图点击：Shift 连续选中，普通点击打开编辑器（占位）
function handleFrameClick(i: number, _source: 'video' | 'gif', e: MouseEvent) {
  const frames = video.frames
  if (e.shiftKey && lastFrameClickIndex.value >= 0) {
    const start = Math.min(lastFrameClickIndex.value, i)
    const end = Math.max(lastFrameClickIndex.value, i)
    const targetState = !frames[i].selected
    for (let idx = start; idx <= end; idx++) frames[idx].selected = targetState
    lastFrameClickIndex.value = i
    return
  }
  lastFrameClickIndex.value = i
  openFrameEditor(i, _source)
}

// 帧复选框点击：Shift 连续选中
function handleFrameCheckbox(i: number, _source: 'video' | 'gif', e: MouseEvent) {
  e.stopPropagation()
  const frames = video.frames
  if (e.shiftKey && lastFrameClickIndex.value >= 0) {
    const start = Math.min(lastFrameClickIndex.value, i)
    const end = Math.max(lastFrameClickIndex.value, i)
    const targetState = !frames[i].selected
    for (let idx = start; idx <= end; idx++) frames[idx].selected = targetState
  }
  lastFrameClickIndex.value = i
}

// 帧编辑器占位
function openFrameEditor(_i: number, _source: 'video' | 'gif' = 'video') {}

// 重置帧编辑器状态占位
function resetFrameEditor() {}

// 导出 composable 接口
export function useVideoToFrames(translate?: (key: string) => string, emit?: VideoToFramesEmit) {
  if (translate) tFn = translate
  if (emit) emitFn = emit
  if (!saveFileToLibrary) {
    const saver = useLibrarySaver()
    saveFileToLibrary = saver.saveFileToLibrary
  }
  init()
  return {
    t,
    video,
    sourceVideo,
    videoFileInput,
    videoCropContainer,
    cropPreviewCanvas,
    videoPreviewCanvas,
    videoAnimCanvas,
    exportPreviewVideo,
    videoCropPreviewPlaying,
    videoStepLabels,
    videoCropStyle,
    videoEstFrames,
    lastFrameClickIndex,
    similarColors,
    similarFrameStyle,
    updateCropMetrics,
    onVideoMeta,
    onVideoData,
    onVideoError,
    startCropResize,
    updateCropFromInputs,
    updateCropPreview,
    reuploadVideo,
    closeVideo,
    toggleCropVideoPreview,
    startCropVideoPreview,
    stopCropVideoPreview,
    drawVideoCropFrame,
    refreshVideoCropPreview,
    renderCropVideoPreview,
    loadVideo,
    handleVideoFileChange,
    importVideoFromLibrary,
    extractVideoFrames,
    detectSimilarFrames,
    selectAllFrames,
    deselectAllFrames,
    toggleVideoPreview,
    stopVideoPreview,
    confirmVideoExport,
    generateVideoExportPreview,
    downloadVideoExport,
    downloadVideoSprite,
    applyExportPreset,
    wheelNumber,
    syncVideoOutSize,
    num,
    fmtFixed,
    selectOnFocus,
    handleExportNameKeydown,
    handleFrameClick,
    handleFrameCheckbox,
    openFrameEditor,
    resetFrameEditor,
  }
}
