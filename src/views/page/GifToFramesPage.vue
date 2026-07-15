<script setup lang="ts">// GifToFramesPage：从 WorkspaceView.vue 抽取的独立页面组件
import { ref, reactive, computed, nextTick, watch, inject } from 'vue'
import { loadImage, generateExportPreview, downloadExport } from '../../utils/export'
import { dataUrlToFile, useLibrarySaver } from '../../composables/useLibrary'
import { estimateFrameCount } from '../../utils/videoCrop'

import { decodeGif } from '../../utils/gifDecode'

import UploadZone from '../components/UploadZone.vue'

import HelpBtn from '../components/HelpBtn.vue'

import FrameEditor from '../components/FrameEditor.vue'

const t = inject<(key: string) => string>('t', (key) => key)
const gifStepLabels = computed(() => [t('gifStep1'), t('gifStep2'), t('gifStep3')])
const emit = defineEmits<{
  (e: 'status', msg: string): void
  (e: 'toast', text: string, type?: 'info' | 'success' | 'warning' | 'error'): void
  (e: 'loading', open: boolean, text?: string): void
  (e: 'pick-asset', type: string, callback: (asset: any) => void, keepOpen?: boolean): void
}>()

// 简化版状态/提示/确认：从父组件注入或使用 emit
function setStatus(msg: string) { emit('status', msg) }
function toast(text: string, type: any = 'success') { emit('toast', text, type) }
function loading(open: boolean, text: string = '') { emit('loading', open, text) }
function openAssetPicker(type: string, callback: (asset: any) => void, keepOpen = false) {
  emit('pick-asset', type, callback, keepOpen)
}

// 资源库保存函数
const { saveFileToLibrary } = useLibrarySaver()

const gif = reactive({

  step: 1, file: null as File | null, frames: [] as { url: string; selected: boolean; similarGroup: number; originalUrl?: string }[],

  fps: 12, outW: 512, outH: 512, previewFps: 10, playing: false,

  duration: 0, nativeFps: 12, rangeStart: 0, rangeEnd: 0,

  sourceFrames: [] as { rgba: Uint8ClampedArray; width: number; height: number; delay: number }[],

  export: { format: 'gif', cols: 4, w: 512, h: 512, compression: 'none', delay: 100, name: 'artforge_export', preview: '', sizeEstimate: '' },

  crop: { x: 0, y: 0, w: 0, h: 0 }, showCrop: true

})

const gifCropCanvas = ref<HTMLCanvasElement | null>(null)

const gifCropPreviewCanvas = ref<HTMLCanvasElement | null>(null) // GIF 裁剪后实时预览画布

const gifAnimCanvas = ref<HTMLCanvasElement | null>(null)

const gifExportPreviewVideo = ref<HTMLVideoElement | null>(null) // GIF 导出视频预览元素引用

const frameEditorRef = ref<InstanceType<typeof FrameEditor> | null>(null) // 帧编辑器组件引用

let gifAnimRaf: number | null = null

let gifAnimFrame = 0

const gifCropContainer = ref<HTMLDivElement | null>(null)

const gifFileInput = ref<HTMLInputElement | null>(null)

const gifRangePreviewCanvas = ref<HTMLCanvasElement | null>(null)

const gifRangePreviewTimer = ref<number | null>(null)

let gifRangePreviewStart = 0

const gifRangePreviewPlaying = ref(false) // GIF 范围预览是否正在播放
const gifRangeCurrentTime = ref(0) // GIF 范围预览当前时间（秒）

let gifCropResizing = false



// GIF 裁剪框度量和显示缩放

const gifCropMetrics = reactive({ scale: 1, offsetX: 0, offsetY: 0 })



// 根据画布在容器中的实际显示位置计算裁剪框的缩放与偏移

function updateGifCropMetrics() {

  const container = gifCropContainer.value

  const c = gifCropCanvas.value

  if (!container || !c || !gif.crop.w) return

  const contRect = container.getBoundingClientRect()

  const canvasRect = c.getBoundingClientRect()

  // 画布可能被 object-contain 缩放居中显示

  const scaleX = c.width > 0 ? canvasRect.width / c.width : 1

  const scaleY = c.height > 0 ? canvasRect.height / c.height : 1

  gifCropMetrics.scale = Math.min(scaleX, scaleY)

  gifCropMetrics.offsetX = canvasRect.left - contRect.left + (canvasRect.width - c.width * gifCropMetrics.scale) / 2

  gifCropMetrics.offsetY = canvasRect.top - contRect.top + (canvasRect.height - c.height * gifCropMetrics.scale) / 2

}



// GIF 裁剪框显示样式：使用度量系统计算绝对定位

const gifCropStyle = computed(() => {

  const c = gifCropCanvas.value

  if (!c || !gif.crop.w) return { display: 'none' }

  updateGifCropMetrics()

  return {

    left: gifCropMetrics.offsetX + gif.crop.x * gifCropMetrics.scale + 'px',

    top: gifCropMetrics.offsetY + gif.crop.y * gifCropMetrics.scale + 'px',

    width: gif.crop.w * gifCropMetrics.scale + 'px',

    height: gif.crop.h * gifCropMetrics.scale + 'px',

  }

})



// 绘制 GIF 第一帧到裁剪预览画布，初始化裁剪区域为整图

function drawGifCropPreview() {

  const c = gifCropCanvas.value

  if (!c || !gif.sourceFrames.length) return

  const sf = gif.sourceFrames[0]

  c.width = sf.width

  c.height = sf.height

  const ctx = c.getContext('2d')!

  const imgData = new ImageData(new Uint8ClampedArray(sf.rgba), sf.width, sf.height)

  ctx.putImageData(imgData, 0, 0)

  // 首次初始化裁剪为整图

  if (!gif.crop.w) { gif.crop.x = 0; gif.crop.y = 0; gif.crop.w = sf.width; gif.crop.h = sf.height }

  // 更新右侧裁剪预览

  nextTick(() => { updateGifCropMetrics(); drawGifCropPreviewCanvas() })

}



// 绘制 GIF 裁剪后的预览图到右侧预览画布，并保持裁剪区域宽高比适配容器

function drawGifCropPreviewCanvas() {
  const srcCanvas = gifCropCanvas.value
  const dstCanvas = gifCropPreviewCanvas.value
  if (!srcCanvas || !dstCanvas || !gif.crop.w) return
  // 使用 canvas 自身 CSS 尺寸或父容器尺寸，避免 0 尺寸导致空白
  const contW = dstCanvas.clientWidth || dstCanvas.parentElement?.clientWidth || 320
  // 完整显示裁剪区域，宽度填满容器，高度按裁剪宽高比自适应
  const ratio = gif.crop.h / gif.crop.w
  const drawW = contW
  const drawH = contW * ratio
  dstCanvas.width = drawW
  dstCanvas.height = drawH
  const ctx = dstCanvas.getContext('2d')!
  ctx.fillStyle = '#0e0e14'
  ctx.fillRect(0, 0, drawW, drawH)
  ctx.drawImage(srcCanvas, gif.crop.x, gif.crop.y, gif.crop.w, gif.crop.h, 0, 0, drawW, drawH)
}



// 启动 GIF 时间范围预览循环

function startGifRangePreview() {

  stopGifRangePreview()

  if (!gif.sourceFrames.length) return

  gifRangePreviewPlaying.value = true // 标记为播放状态

  gifRangePreviewStart = performance.now()

  renderGifRangePreviewLoop()

}



// 停止 GIF 时间范围预览循环

function stopGifRangePreview() {

  gifRangePreviewPlaying.value = false // 标记为暂停状态

  if (gifRangePreviewTimer.value) {

    clearTimeout(gifRangePreviewTimer.value)

    gifRangePreviewTimer.value = null

  }

}



// 切换 GIF 范围预览的播放/暂停状态

function toggleGifRangePreview() {

  if (gifRangePreviewPlaying.value) stopGifRangePreview() // 正在播放则停止

  else startGifRangePreview() // 未播放则开始

}



// 循环渲染 GIF 范围预览帧

function renderGifRangePreviewLoop() {

  if (!gifRangePreviewPlaying.value) return // 未在播放状态则停止渲染

  renderGifRangePreview()

  gifRangePreviewTimer.value = window.setTimeout(renderGifRangePreviewLoop, 1000 / gif.previewFps)

}



// 渲染当前时间范围内的 GIF 帧到预览画布

function renderGifRangePreview() {

  const c = gifRangePreviewCanvas.value

  if (!c || !gif.sourceFrames.length) return

  const src = gif.sourceFrames

  const rangeDur = Math.max(0.001, gif.rangeEnd - gif.rangeStart)

  const elapsed = (performance.now() - gifRangePreviewStart) / 1000

  const t = gif.rangeStart + (elapsed % rangeDur)

  const cum: number[] = [0]

  for (let i = 1; i < src.length; i++) cum.push(cum[i - 1] + src[i - 1].delay / 1000)

  let idx = 0

  for (let k = 0; k < cum.length; k++) { if (cum[k] <= t) idx = k; else break }

  const sf = src[idx]

  gifRangeCurrentTime.value = t // 记录当前预览时间用于界面显示

  const rc = document.createElement('canvas')

  rc.width = sf.width

  rc.height = sf.height

  const rctx = rc.getContext('2d')!

  rctx.putImageData(new ImageData(new Uint8ClampedArray(sf.rgba), sf.width, sf.height), 0, 0)



  // 使用与视频预览相同的容器适配逻辑

  const contW = c.clientWidth || c.parentElement?.clientWidth || 320

  const contH = c.clientHeight || c.parentElement?.clientHeight || 240

  const ctx = c.getContext('2d')!
  if (gif.crop.w && gif.crop.h) {
    // 完整显示裁剪区域，宽度填满容器，高度按裁剪宽高比自适应
    const ratio = gif.crop.h / gif.crop.w
    const drawW = contW
    const drawH = contW * ratio
    c.width = drawW
    c.height = drawH
    ctx.fillStyle = '#14141c'
    ctx.fillRect(0, 0, drawW, drawH)
    ctx.drawImage(rc, gif.crop.x, gif.crop.y, gif.crop.w, gif.crop.h, 0, 0, drawW, drawH)
  } else {
    c.width = contW; c.height = contH
    ctx.fillStyle = '#14141c'
    ctx.fillRect(0, 0, contW, contH)
  }

}



// GIF 裁剪框拖拽调整大小：与视频裁剪框拖拽逻辑对齐

function startGifCropResize(_e: MouseEvent, dir: string) {

  gifCropResizing = true

  const c = gifCropCanvas.value

  if (!c) return

  const origW = c.width, origH = c.height

  const onMove = (ev: MouseEvent) => {

    if (!gifCropResizing) return

    const container = gifCropContainer.value; if (!container) return

    const contRect = container.getBoundingClientRect()

    // const canvasRect = c.getBoundingClientRect() // 未使用，已注释

    const scale = gifCropMetrics.scale

    const mx = (ev.clientX - contRect.left - gifCropMetrics.offsetX) / scale

    const my = (ev.clientY - contRect.top - gifCropMetrics.offsetY) / scale

    if (dir.includes('e')) { gif.crop.w = Math.max(10, Math.min(mx, origW) - gif.crop.x) }

    if (dir.includes('w')) {

      const newX = Math.max(0, Math.min(mx, gif.crop.x + gif.crop.w - 10))

      gif.crop.w = gif.crop.x + gif.crop.w - newX

      gif.crop.x = newX

    }

    if (dir.includes('s')) { gif.crop.h = Math.max(10, Math.min(my, origH) - gif.crop.y) }

    if (dir.includes('n')) {

      const newY = Math.max(0, Math.min(my, gif.crop.y + gif.crop.h - 10))

      gif.crop.h = gif.crop.y + gif.crop.h - newY

      gif.crop.y = newY

    }

  }

  const onUp = () => {

    gifCropResizing = false

    drawGifCropPreviewCanvas()

    window.removeEventListener('mousemove', onMove)

    window.removeEventListener('mouseup', onUp)

  }

  window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)

}



// 加载 GIF 文件：上传后立即解码全部帧，用于时间选择和提取（与视频 Seek 逻辑对等）

async function loadGif(files: FileList) {

  const file = files[0]; if (!file) return

  gif.file = file; gif.sourceFrames = []; gif.frames = []; gif.duration = 0

  resetFrameEditor() // 上传新 GIF 时清空旧帧编辑状态

  loading(true, t('gifExtracting') || '正在解码 GIF…');

  try {

    const buf = await file.arrayBuffer()

    const all = decodeGif(buf)

    gif.sourceFrames = all

    let totalMs = 0

    for (const f of all) totalMs += f.delay

    gif.duration = totalMs / 1000

    gif.nativeFps = gif.duration > 0 ? all.length / gif.duration : 12

    gif.rangeStart = 0

    gif.rangeEnd = gif.duration

    gif.fps = Math.min(12, Math.max(1, Math.round(gif.nativeFps)))

    gif.step = 1

    setStatus(t('gifLoaded'));

    // GIF 解码成功后自动保存到资源库（使用第一帧作为缩略图）
    const firstFrameCanvas = document.createElement('canvas')
    firstFrameCanvas.width = gif.sourceFrames[0].width
    firstFrameCanvas.height = gif.sourceFrames[0].height
    const firstFrameCtx = firstFrameCanvas.getContext('2d')!
    firstFrameCtx.putImageData(new ImageData(new Uint8ClampedArray(gif.sourceFrames[0].rgba), gif.sourceFrames[0].width, gif.sourceFrames[0].height), 0, 0)
    saveFileToLibrary(file, firstFrameCanvas.toDataURL('image/png'))

    nextTick(() => { drawGifCropPreview(); startGifRangePreview() }) // 上传后立即显示第一帧裁剪预览并启动范围预览

  } catch (e) {

    setStatus('GIF 解码失败：' + (e as Error).message);

    gif.file = null

  } finally {

    loading(false);
  }

}



// 从资源库导入 GIF 到 GIF 拆解模块

function importGifFromLibrary() {

  openAssetPicker('gif', async (asset) => {

    try {

      const file = await dataUrlToFile(asset.dataUrl, asset.name, 'image/gif')

      const dt = new DataTransfer(); dt.items.add(file)

      await loadGif(dt.files)

      setStatus(t('assetImported'));

    } catch (err) {

      setStatus(t('assetImportFailed') + ': ' + (err as Error).message);

    }

  })

}



// 触发 GIF 重新上传：点击时不立刻清空状态，仅弹出文件选择框

function triggerGifReupload() {

  // 不立刻清空页面状态，仅弹出文件选择框；用户真正选择新文件后再在 handleGifFileChange 中重置

  nextTick(() => gifFileInput.value?.click())

}



// 处理重新上传的 GIF 文件

function handleGifFileChange(e: Event) {

  const input = e.target as HTMLInputElement

  const file = input.files?.[0]

  if (!file) return

  // 用户真正选择了新文件后再清空旧状态

  gif.file = null; gif.sourceFrames = []; gif.frames = []; gif.duration = 0

  gif.step = 1; gif.crop = { x: 0, y: 0, w: 0, h: 0 }

  gif.rangeStart = 0; gif.rangeEnd = 0

  const dt = new DataTransfer(); dt.items.add(file)

  loadGif(dt.files)

  input.value = '' // 允许重复选择同一文件

}



// GIF 帧提取：按时间范围 + FPS 从已解码的 sourceFrames 中采样（与视频 Seek 对等）

async function extractGifFrames() {

  if (!gif.sourceFrames.length) { setStatus(t('pleaseSelectGif') || '请先选择 GIF 文件'); return }

  resetFrameEditor() // 提取新 GIF 帧前清空旧帧编辑状态

  loading(true, t('gifExtracting') || '正在解码 GIF…');

  try {

    const src = gif.sourceFrames

    // 构建每帧累计时间（秒）

    const cum: number[] = [0]

    for (let i = 1; i < src.length; i++) cum.push(cum[i - 1] + src[i - 1].delay / 1000)

    const total = estimateFrameCount(gif.rangeStart, gif.rangeEnd, gif.fps)

    const outW = Math.max(1, Math.round(gif.outW))

    const outH = Math.max(1, Math.round(gif.outH))

    gif.frames = []

    for (let i = 0; i < total; i++) {

      const t = gif.rangeStart + i / gif.fps

      let idx = 0

      for (let k = 0; k < cum.length; k++) { if (cum[k] <= t) idx = k; else break }

      const sf = src[idx]

  const rc = document.createElement('canvas'); rc.width = sf.width; rc.height = sf.height

      const rctx = rc.getContext('2d')!

      rctx.putImageData(new ImageData(new Uint8ClampedArray(sf.rgba), sf.width, sf.height), 0, 0)

      const c = document.createElement('canvas'); c.width = outW; c.height = outH

      const ctx = c.getContext('2d')!

      // GIF 帧可能有透明背景 — 先填充白底再贴帧，使缩略图/预览始终可见内容（解决"色块"错觉）

      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, outW, outH)

      // 应用裁剪区域（若有）

      if (gif.crop.w && gif.crop.h) {

        ctx.drawImage(rc, gif.crop.x, gif.crop.y, gif.crop.w, gif.crop.h, 0, 0, outW, outH)

      } else {

        ctx.drawImage(rc, 0, 0, outW, outH)

      }

      const url = c.toDataURL('image/png')

      gif.frames.push({ url, selected: true, similarGroup: -1, originalUrl: url })

    }

    gif.export.w = outW; gif.export.h = outH

    gif.step = 2

    setStatus((t('gifExtractDone') || '已提取 {n} 帧').replace('{n}', String(total)));

  } catch (e) {

    setStatus('GIF 提取失败：' + (e as Error).message);

  } finally {

    loading(false);
  }

}

// GIF 相似帧检测：按像素相似度分组（与视频模块一致）

async function detectSimilarGifFrames() {

  loading(true, t('loading'));

  const compareSize = 16

  const frameData: Uint8Array[] = []

  for (const f of gif.frames) {

    const img = await loadImage(f.url)

    const c = document.createElement('canvas'); c.width = compareSize; c.height = compareSize

    const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0, compareSize, compareSize)

    frameData.push(new Uint8Array(ctx.getImageData(0, 0, compareSize, compareSize).data))

  }

  let groupId = 0

  const assigned = new Set<number>()

  for (let i = 0; i < gif.frames.length; i++) {

    if (assigned.has(i)) continue

    const group: number[] = [i]

    for (let j = i + 1; j < gif.frames.length; j++) {

      if (assigned.has(j)) continue

      let same = 0, total = compareSize * compareSize * 4

      for (let k = 0; k < total; k += 4) {

        if (Math.abs(frameData[i][k] - frameData[j][k]) < 5 &&

            Math.abs(frameData[i][k + 1] - frameData[j][k + 1]) < 5 &&

            Math.abs(frameData[i][k + 2] - frameData[j][k + 2]) < 5) same++

      }

      if (same / (total / 4) >= 0.95) group.push(j)

    }

    group.forEach(idx => { gif.frames[idx].similarGroup = groupId; assigned.add(idx) })

    if (group.length > 1) groupId++

    else gif.frames[i].similarGroup = -1

  }

  loading(false);
  setStatus(t('detectDone'));

}

function selectAllGifFrames() { gif.frames.forEach(f => f.selected = true) }

// 隔帧选取：按每隔一帧的规律自动选取所有帧（第0、2、4...帧）
function selectEveryOtherGifFrame() {
  gif.frames.forEach((f, i) => { f.selected = (i % 2 === 0) })
}

// 删除未选帧的二次确认弹框状态
const showDeleteUnselectedConfirm = ref(false)

// 确认删除：保留已选帧，移除未选帧
function confirmDeleteUnselected() {
  gif.frames = gif.frames.filter(f => f.selected)
  showDeleteUnselectedConfirm.value = false
  emit('status', t('deleted'))
}

function deselectAllGifFrames() { gif.frames.forEach(f => f.selected = false) }

function confirmGifExport() {

  const selected = gif.frames.filter(f => f.selected)

  if (!selected.length) {

    toast(t('selectFramesFirst'), 'warning')

    return

  }

  setStatus(`已选择 ${selected.length} / ${gif.frames.length} 帧，准备导出`)

  gif.step = 3

  nextTick().then(() => generateGifExportPreview().then(() => {

    // 若导出格式为视频，则自动循环播放预览视频

    if (gif.export.format === 'video') {

      const el = gifExportPreviewVideo.value

      if (el) { el.loop = true; el.play().catch(() => {}) }

    }

  }))

}



function toggleGifPreview() {

  if (gif.playing) { gif.playing = false; setStatus(t('paused')); if (gifAnimRaf) { clearTimeout(gifAnimRaf); gifAnimRaf = null }; return }

  const frames = gif.frames.filter(f => f.selected)

  if (!frames.length) return

  gif.playing = true; setStatus(t('gifPlaying'))

  gifAnimFrame = 0

  const canvas = gifAnimCanvas.value

  if (!canvas) { gif.playing = false; return }

  const ctx = canvas.getContext('2d')!

  const img = new Image()

  const render = () => {

    if (!gif.playing) return

    const frame = frames[gifAnimFrame % frames.length]

    gifAnimFrame++

    img.onload = () => {

      if (!gif.playing) return

      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight

      ctx.drawImage(img, 0, 0)

      gifAnimRaf = setTimeout(render, 1000 / gif.previewFps) as any

    }

    img.onerror = () => {

      if (!gif.playing) return

      gifAnimRaf = setTimeout(render, 1000 / gif.previewFps) as any

    }

    img.src = frame.url

  }

  render()

}



// 生成 GIF 导出预览：使用 export.ts 中的通用预览生成

async function generateGifExportPreview() {

  const frames = gif.frames.filter(f => f.selected)

  if (!frames.length) return

  loading(true, t('loading'));

  try {

    const result = await generateExportPreview(

      gif.export.format as any,

      frames,

      { w: gif.export.w, h: gif.export.h, cols: gif.export.cols, compression: gif.export.compression as any, delay: gif.export.delay }

    )

    gif.export.preview = result.url

    gif.export.sizeEstimate = result.info || ''

    setStatus(t('exportPreviewDone'));

  } catch (e) {

    setStatus('预览生成失败');

  } finally {

    loading(false);
  }

}



// 下载 GIF 导出结果：根据所选格式调用 downloadExport

async function downloadGifExport() {

  const frames = gif.frames.filter(f => f.selected)

  if (!frames.length) return

  loading(true, t('downloading'));

  try {

    await downloadExport(

      gif.export.format as any,

      frames,

      { w: gif.export.w, h: gif.export.h, cols: gif.export.cols, compression: gif.export.compression as any, delay: gif.export.delay },

      gif.export.name

    )

  } catch (e) {

    setStatus('下载失败');

  } finally {

    loading(false);
  }

}

// 下载 GIF 精灵图子选项：PNG / ZIP(PNG+JSON) / JSON 元数据

async function downloadGifSprite(fmt: 'sprite' | 'sprite-zip' | 'sprite-json') {

  const frames = gif.frames.filter(f => f.selected)

  if (!frames.length) return

  loading(true, t('downloading'));

  try {

    await downloadExport(

      fmt,

      frames,

      { w: gif.export.w, h: gif.export.h, cols: gif.export.cols, compression: gif.export.compression as any, delay: gif.export.delay },

      gif.export.name

    )

  } catch (e) {

    setStatus('下载失败');

  } finally {

    loading(false);
  }

}



// 切换 GIF 导出格式后自动重新生成预览

watch(() => gif.export.format, () => {

  if (gif.frames.length && gif.step === 3) { generateGifExportPreview() }

})

// 切换压缩等级后立即刷新导出预览

watch(() => gif.export.compression, () => {

  if (gif.frames.length && gif.step === 3) { generateGifExportPreview() }

})

// 修改导出尺寸后也立即刷新预览

watch(() => [gif.export.w, gif.export.h], () => {

  if (gif.frames.length && gif.step === 3) { generateGifExportPreview() }

})

// 修改精灵图/序列帧 ZIP 列数后立即刷新导出预览

watch(() => gif.export.cols, () => {

  if (gif.frames.length && gif.step === 3 && (gif.export.format === 'sprite' || gif.export.format === 'zip')) { generateGifExportPreview() }

})

// 从处理页返回 GIF 上传/裁剪页时，重新绘制裁剪与时间预览

watch(() => gif.step, () => {

  if (gif.step === 1 && gif.sourceFrames.length) {

    nextTick(() => {

      updateGifCropMetrics()

      drawGifCropPreview()

      drawGifCropPreviewCanvas()

      startGifRangePreview()

    })

  }

})

// 将值规范化为数字
function num(v: any): number { return typeof v === 'number' && !isNaN(v) ? v : Number(v) || 0 }

// 将数字格式化为固定小数位字符串
function fmtFixed(v: any, digits = 2): string { return num(v).toFixed(digits) }

// GIF 估计提取帧数
const gifEstFrames = computed(() => estimateFrameCount(gif.rangeStart, gif.rangeEnd, gif.fps))

// 相似帧配色
const similarColors = ['#ff4d4d','#ffd000','#28c76f','#1f8bff','#ff7a00','#a04bff','#ff3d9a','#00c2a8','#ffe14d','#7c5cff']

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

// 帧点击连选状态
const lastFrameClickIndex = ref(-1)

// 输入框聚焦时全选内容
function selectOnFocus(e: FocusEvent) {
  const t = e.target as HTMLInputElement
  t.select()
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

// 帧缩略图点击
function handleFrameClick(i: number, _source: 'video' | 'gif', e: MouseEvent) {
  const frames = gif.frames
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

// 帧复选框点击
// 当前已选帧数量（实时显示，避免用户误以为全选）
const selectedCount = computed(() => gif.frames.filter(f => f.selected).length)

// 帧复选框点击：用 @click 捕获 MouseEvent 以正确读取 shiftKey
// @change 事件不含 shiftKey 属性，导致 Shift+点击复选框无法连续选取
function onFrameCheckboxClick(i: number, e: MouseEvent) {
  const frames = gif.frames
  const shift = e.shiftKey
  if (shift && lastFrameClickIndex.value >= 0) {
    e.preventDefault() // 阻止默认 toggle，由我们手动设置选中状态
    const targetState = !frames[i].selected
    const start = Math.min(lastFrameClickIndex.value, i)
    const end = Math.max(lastFrameClickIndex.value, i)
    for (let idx = start; idx <= end; idx++) frames[idx].selected = targetState
  } else {
    // 普通点击：手动切换选中状态（因为 @click.stop 阻止了默认行为）
    frames[i].selected = !frames[i].selected
  }
  lastFrameClickIndex.value = i
}

// 打开帧编辑器
function openFrameEditor(i: number, _source: 'video' | 'gif' = 'video') {
  frameEditorRef.value?.openFrameEditor(i)
}

// 重置帧编辑器状态
function resetFrameEditor() {
  frameEditorRef.value?.resetFrameEditor()
}</script>

<template>
<div class="space-y-3">
<div class="steps-bar">

                    <button v-for="n in 3" :key="n" class="step-pill" :class="gif.step === n ? 'active' : ''" @click="gif.step = n"><span class="step-num">{{ n }}</span><span>{{ gifStepLabels[n-1] }}</span></button>

                  </div>

                  <div v-if="gif.step === 1" class="space-y-3">

                    <UploadZone v-if="!gif.file" accept="image/gif" :prompt="t('uploadGif')" :hint="t('uploadGifHint')" @files="loadGif($event)" />

                    <button v-if="!gif.file" class="btn-secondary btn-sm mt-2" @click="importGifFromLibrary">{{ t('importFromLibrary') }}</button>

                    <input ref="gifFileInput" type="file" accept="image/gif" class="hidden" @change.stop="handleGifFileChange">

                    <div v-if="gif.file" class="space-y-3">

                      <!-- GIF 信息面板：与视频信息面板一致，一个上传视频一个上传 GIF -->

                      <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                        <div class="panel-title">{{ t('gifInfo') }}</div>

                        <div class="form-row">

                          <div class="form-group"><label class="form-label">{{ t('filename') }}</label><input :value="gif.file?.name || ''" readonly class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('duration') }}</label><input :value="gif.duration.toFixed(2)+'s'" readonly class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('resolution') }}</label><input :value="gif.sourceFrames.length ? gif.sourceFrames[0].width+'x'+gif.sourceFrames[0].height : '-'" readonly class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('frameCount') }}</label><input :value="gif.sourceFrames.length" readonly class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('nativeFps') }}</label><input :value="gif.nativeFps.toFixed(1)" readonly class="form-input" /></div>

                        </div>

                      <div class="flex gap-2 mt-3"><button type="button" class="btn-secondary" @click="triggerGifReupload">{{ t('reuploadGif') }}</button></div>

                    </div>

                    <!-- GIF 裁剪预览面板：完整照搬视频转序列帧的裁剪功能（拖拽手柄 + 实时预览） -->

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                      <div class="panel-title"><span>{{ t('cropSettings') }}</span><HelpBtn :text="t('videoCropHelp')" /></div>

                      <div class="flex gap-3 flex-wrap">

                        <div class="flex-1 min-w-[260px] relative">

                          <div class="bg-black rounded-lg overflow-hidden flex items-center justify-center h-[360px] relative" ref="gifCropContainer">

                            <canvas ref="gifCropCanvas" class="max-w-full max-h-full object-contain block"></canvas>

                            <div v-if="gif.showCrop && gif.crop.w" class="absolute border-2 border-af-accent pointer-events-none" :style="gifCropStyle">

                              <div class="absolute -top-1.5 -left-1.5 w-3 h-3 bg-af-accent cursor-nw-resize pointer-events-auto" @mousedown.stop="startGifCropResize($event, 'nw')"></div>

                              <div class="absolute -top-1.5 -right-1.5 w-3 h-3 bg-af-accent cursor-ne-resize pointer-events-auto" @mousedown.stop="startGifCropResize($event, 'ne')"></div>

                              <div class="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-af-accent cursor-sw-resize pointer-events-auto" @mousedown.stop="startGifCropResize($event, 'sw')"></div>

                              <div class="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-af-accent cursor-se-resize pointer-events-auto" @mousedown.stop="startGifCropResize($event, 'se')"></div>

                            </div>

                          </div>

                        </div>

                        <div class="flex-1 min-w-[260px]">

                          <div class="panel-title">{{ t('cropPreview') }}</div>

                          <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden flex items-center justify-center min-h-[160px]"><canvas ref="gifCropPreviewCanvas" class="max-w-full"></canvas></div>

                        </div>

                      </div>

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5 mt-3">
                      <div class="panel-title"><span>{{ t('cropVideoPreview') }}</span><HelpBtn :text="t('cropVideoPreviewHelp')" /></div>
                      <div class="flex gap-3 flex-wrap min-h-[280px]">
                        <div class="flex-1 min-w-[260px]">
                          <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden flex items-center justify-center h-[280px] relative">
                            <canvas ref="gifRangePreviewCanvas" class="max-w-full"></canvas>
                            <div v-if="!gifRangePreviewPlaying" class="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                              <span class="text-white text-sm">{{ t('clickPlayPreview') }}</span>
                            </div>
                          </div>
                        </div>
                        <div class="flex-1 min-w-[260px] flex flex-col justify-center gap-3">
                          <button type="button" class="btn-primary w-fit" @click="toggleGifRangePreview">{{ gifRangePreviewPlaying ? t('pausePreview') : t('playPreview') }}</button>
                          <div class="text-xs text-af-muted space-y-1">
                            <div>{{ t('previewRange') }}: {{ fmtFixed(gif.rangeStart) }}s ~ {{ fmtFixed(gif.rangeEnd) }}s</div>
                            <div>{{ t('currentTime') }}: {{ fmtFixed(gifRangeCurrentTime) }}s</div>
                          </div>
                        </div>
                      </div>
                    </div>

                      <div class="form-row mt-2">

                        <div class="form-group"><label class="form-label">{{ t('cropX') }}</label><input v-model.number="gif.crop.x" type="number" min="0" class="form-input" @change="drawGifCropPreview(); drawGifCropPreviewCanvas()" /></div>

                        <div class="form-group"><label class="form-label">{{ t('cropY') }}</label><input v-model.number="gif.crop.y" type="number" min="0" class="form-input" @change="drawGifCropPreview(); drawGifCropPreviewCanvas()" /></div>

                        <div class="form-group"><label class="form-label">{{ t('cropW') }}</label><input v-model.number="gif.crop.w" type="number" min="1" class="form-input" @change="drawGifCropPreview(); drawGifCropPreviewCanvas()" /></div>

                        <div class="form-group"><label class="form-label">{{ t('cropH') }}</label><input v-model.number="gif.crop.h" type="number" min="1" class="form-input" @change="drawGifCropPreview(); drawGifCropPreviewCanvas()" /></div>

                      </div>

                    </div>

                    <!-- 时间选择 + 输出设置：直接复用视频侧的 extractSettings 面板结构 -->

                      <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                        <div class="panel-title"><span>{{ t('extractSettings') }}</span><HelpBtn :text="t('extractHelp')" /></div>

                        <div class="form-row">

                          <div class="form-group"><label class="form-label">{{ t('extractFps') }}</label><input v-model.number="gif.fps" type="number" min="1" max="60" class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('outputWidth') }}</label><input v-model.number="gif.outW" type="number" min="1" max="2048" class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('outputHeight') }}</label><input v-model.number="gif.outH" type="number" min="1" max="2048" class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('estFrames') }}</label><input :value="gifEstFrames" readonly class="form-input" /></div>

                        </div>

                        <div class="form-row mt-2">

                          <div class="form-group"><label class="form-label">{{ t('rangeStart') }}</label><input v-model.number="gif.rangeStart" type="number" min="0" :max="gif.duration" step="0.01" class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('rangeEnd') }}</label><input v-model.number="gif.rangeEnd" type="number" min="0" :max="gif.duration" step="0.01" class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('selectedDuration') }}</label><input :value="fmtFixed(num(gif.rangeEnd) - num(gif.rangeStart))+'s'" readonly class="form-input" /></div>

                        </div>

                        <div class="form-row mt-2">

                          <div class="form-group"><label class="form-label">{{ t('rangeStart') }} {{ fmtFixed(gif.rangeStart) }}s</label><div class="slider-wrap"><input v-model.number="gif.rangeStart" type="range" min="0" :max="gif.duration" step="0.01" class="flex-1 accent-af-accent h-1" /></div></div>

                          <div class="form-group"><label class="form-label">{{ t('rangeEnd') }} {{ fmtFixed(gif.rangeEnd) }}s</label><div class="slider-wrap"><input v-model.number="gif.rangeEnd" type="range" min="0" :max="gif.duration" step="0.01" class="flex-1 accent-af-accent h-1" /></div></div>

                        </div>

                        <div class="flex gap-2 mt-3"><button class="btn-primary" @click="extractGifFrames">{{ t('extractFrames') }}</button></div>

                      </div>

                    </div>

                  </div>

                  <div v-if="gif.step === 2" class="space-y-3">

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5 flex gap-2 flex-wrap items-center">

                      <button class="btn-secondary" @click="detectSimilarGifFrames">{{ t('detectSimilar') }}</button>

                      <button class="btn-secondary" @click="selectEveryOtherGifFrame">{{ t('selectEveryOther') }}</button>

                      <button class="btn-secondary" @click="selectAllGifFrames">{{ t('selectAll') }}</button>

                      <button class="btn-secondary" @click="deselectAllGifFrames">{{ t('deselectAll') }}</button>

                      <button class="btn-secondary" @click="showDeleteUnselectedConfirm = true">{{ t('deleteUnselected') }}</button>

                      <div class="flex-1"></div>

                      <span class="text-xs text-af-muted">{{ t('frameClickHint') }}</span>

                    </div>

                    <div class="flex gap-3 flex-wrap">

                      <!-- 左侧：帧网格，7 列 -->

                      <div class="flex-1 min-w-[260px] space-y-2.5">

                        <div class="flex items-center justify-between text-xs text-af-muted px-1">
                          <span>{{ t('totalFrames') }}: {{ gif.frames.length }}</span>
                          <span class="text-af-accent font-medium">{{ t('selectedFrames') }}: {{ selectedCount }}</span>
                        </div>

                        <div class="grid grid-cols-7 gap-2.5">

                          <div v-for="(f,i) in gif.frames" :key="i" class="bg-af-surface border rounded-md overflow-hidden cursor-pointer relative transition-all hover:border-af-accent" :class="f.selected ? 'border-af-accent' : 'border-af-rule'" :style="similarFrameStyle(f.similarGroup)" @click="handleFrameClick(i, 'gif', $event)"><input type="checkbox" :checked="f.selected" class="absolute top-2 left-2 w-7 h-7 z-10 accent-af-accent cursor-pointer" @click.stop="onFrameCheckboxClick(i, $event)"><div v-if="f.similarGroup !== -1" class="absolute top-0 left-0 right-0 h-1.5 z-10" :style="{ background: similarColors[f.similarGroup % similarColors.length] }"></div><img :src="f.url" class="w-full object-contain bg-[#0e0e14]"><div class="px-2 py-1 text-[11px] text-af-muted flex justify-between"><span>#{{ i+1 }}</span><span v-if="f.similarGroup !== -1" class="text-xs font-bold" :style="{ color: similarColors[f.similarGroup % similarColors.length] }">G{{ f.similarGroup }}</span></div></div>

                        </div>

                      </div>

                      <!-- 右侧：预览画布 + 播放/导出按钮紧随 FPS 滚动条下方，预览区域放大为两倍 -->

                      <div class="w-80 shrink-0 self-start flex flex-col gap-2.5">

                        <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden relative min-h-[400px]"><canvas ref="gifAnimCanvas" class="max-w-full max-h-full"></canvas></div>

                        <div class="form-group !mb-0 py-2">

                          <label class="form-label text-sm">{{ t('previewFps') }}</label>

                          <div class="slider-wrap items-center h-10">

                            <input v-model.number="gif.previewFps" type="range" min="1" max="60" class="flex-1 accent-af-accent h-2.5">

                            <span class="slider-value text-base font-semibold w-10">{{ gif.previewFps }}</span>

                          </div>

                        </div>

                        <button class="btn-primary btn-sm w-full" @click="toggleGifPreview">{{ gif.playing ? t('pause') : t('play') }}</button>

                        <button class="btn-primary w-full" @click="confirmGifExport">{{ t('confirmExport') }}</button>

                      </div>

                    </div>

                  </div>

                  <div v-if="gif.step === 3" class="space-y-3">

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                      <div class="panel-title">{{ t('exportOptions') }}</div>

                      <div class="form-row">

                        <div class="form-group"><label class="form-label">{{ t('exportFormat') }}</label><select v-model="gif.export.format" class="form-select"><option value="video">{{ t('videoWebm') }}</option><option value="gif">GIF</option><option value="zip">{{ t('framesZip') }}</option><option value="sprite">{{ t('sprite') }}</option></select></div>

                        <div v-if="gif.export.format === 'sprite' || gif.export.format === 'zip'" class="form-group"><label class="form-label">{{ t('spriteCols') }}</label><input v-model.number="gif.export.cols" type="number" min="1" class="form-input" /></div>

                      </div>

                      <div class="form-row">

                        <div class="form-group"><label class="form-label">{{ t('compression') }}</label><select v-model="gif.export.compression" class="form-select"><option value="none">{{ t('compressionNone') }}</option><option value="low">{{ t('compressionLow') }}</option><option value="medium">{{ t('compressionMed') }}</option><option value="high">{{ t('compressionHigh') }}</option></select></div>

                        <div v-if="gif.export.format === 'gif'" class="form-group"><label class="form-label">{{ t('gifDelay') }}</label><input v-model.number="gif.export.delay" type="number" min="20" class="form-input" @change="generateGifExportPreview()" /></div>

                        <div class="form-group"><label class="form-label">{{ t('filename') }}</label><input v-model="gif.export.name" class="form-input" @focus="selectOnFocus($event)" @keydown="handleExportNameKeydown($event, 'gif')"></div>

                      </div>

                      <div v-if="gif.export.sizeEstimate" class="text-xs text-af-muted mt-2">{{ t('estSize') }}: {{ gif.export.sizeEstimate }}</div>

                      <div class="flex gap-2 mt-3 flex-wrap">

                        <button class="btn-primary" @click="generateGifExportPreview">{{ t('generatePreview') }}</button>

                        <template v-if="gif.export.format === 'sprite' && gif.export.preview">

                          <button class="btn-secondary" @click="downloadGifSprite('sprite')">{{ t('downloadPng') }}</button>

                          <button class="btn-secondary" @click="downloadGifSprite('sprite-zip')">{{ t('spriteZip') }}</button>

                          <button class="btn-secondary" @click="downloadGifSprite('sprite-json')">{{ t('downloadJson') }}</button>

                        </template>

                        <button v-else-if="gif.export.preview" class="btn-secondary" @click="downloadGifExport">{{ t('download') }}</button>

                      </div>

                    </div>

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5"><div class="panel-title">{{ t('exportPreview') }}</div><div class="preview-box min-h-[320px]"><video v-if="gif.export.preview && gif.export.format === 'video'" ref="gifExportPreviewVideo" :src="gif.export.preview" class="max-w-full max-h-full object-contain" controls autoplay loop muted></video><img v-else-if="gif.export.preview" :src="gif.export.preview" class="max-w-full max-h-full object-contain" /><span v-else class="text-af-muted text-sm">{{ t('exportPreviewHint') }}</span></div></div>

                  </div>

                </div>

                <!-- 帧编辑器 -->
                <FrameEditor ref="frameEditorRef" v-model="gif.frames" @toast="toast" @loading="loading" @status="setStatus" />

                <!-- 删除未选帧二次确认弹框 -->
                <Teleport to="body">
                  <div v-if="showDeleteUnselectedConfirm" class="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center" @click.self="showDeleteUnselectedConfirm = false">
                    <div class="bg-af-surface border border-af-rule rounded-lg p-6 max-w-sm w-[90vw]">
                      <div class="text-sm text-af-ink mb-4 leading-relaxed">{{ t('deleteUnselectedConfirm') }}</div>
                      <div class="flex gap-2 justify-end">
                        <button class="btn-secondary btn-sm" @click="showDeleteUnselectedConfirm = false">{{ t('cancel') }}</button>
                        <button class="btn-danger btn-sm" @click="confirmDeleteUnselected">{{ t('confirmDelete') }}</button>
                      </div>
                    </div>
                  </div>
                </Teleport>


</template>
<style scoped>
/* 页面级局部样式，优先使用 Tailwind */
</style>