<script setup lang="ts">// ImageToFramesPage：图片转序列帧页面
// 两种模式：
//   1. 多图上传：单页面流程（上传→合成设置→预览→导出）
//   2. 精灵图裁剪：三步流程（1.上传裁剪提取 2.处理帧 3.导出）
import { ref, reactive, computed, nextTick, watch, inject } from 'vue'
import { loadImage, formatBytes, dataUrlToBlob, compressionQuality, generateExportPreview, downloadExport } from '../../utils/export'
import { fileToDataUrl } from '../../composables/useLibrary'

import UploadZone from '../components/UploadZone.vue'
import HelpBtn from '../components/HelpBtn.vue'
import FrameEditor from '../components/FrameEditor.vue'

const t = inject<(key: string) => string>('t', (key) => key)
const emit = defineEmits<{
  (e: 'status', msg: string): void
  (e: 'toast', text: string, type?: 'info' | 'success' | 'warning' | 'error'): void
  (e: 'loading', open: boolean, text?: string): void
  (e: 'pick-asset', type: string, callback: (asset: any) => void, keepOpen?: boolean): void
}>()

// 简化版状态/提示/确认：从父组件注入或使用 emit
function setStatus(msg: string) { emit('status', msg) }
function toast(text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') { emit('toast', text, type) }
function loading(open: boolean, text?: string) { emit('loading', open, text) }
function openAssetPicker(type: string, callback: (asset: any) => void, keepOpen = false) {
  emit('pick-asset', type, callback, keepOpen)
}

// 帧项结构：与 FrameEditor 组件一致
interface ErasedRegion { x: number; y: number; w: number; h: number }
interface FrameItem {
  url: string
  selected: boolean
  similarGroup: number
  originalUrl?: string
  mattingParams?: any | null
  erasedRegions?: ErasedRegion[]
}

// ============ 共享状态 ============
const uploadMode = ref<'images' | 'sprite-sheet'>('images') // 上传方式

// ============ 多图上传模式状态（单页面流程） ============
const sprite = reactive({
  images: [] as { url: string; file?: File | null }[],
  cols: 4, padding: 2, bg: 'transparent',
  previewFps: 10, playing: false, animFrame: 0,
  compression: 'none' as 'none' | 'low' | 'medium' | 'high',
  // 导出设置
  exportFormat: 'sprite' as 'sprite' | 'zip' | 'gif' | 'video',
  exportW: 128, exportH: 128,
  exportName: 'image_frames',
  exportPreset: 'custom',
  exportDelay: 100,
  exportPreview: '',
  exportSizeEstimate: '',
})

// 右侧预览画布引用（多图上传模式）
const spritePreviewCanvas = ref<HTMLCanvasElement | null>(null)

// 压缩大小估算
const spriteCompressionSize = ref('')

// 压缩预览图片缓存：key = 原图 URL + 压缩等级
const spriteImageCache = new Map<string, string>()

// 根据总帧数和列数自动计算行数
const spriteRows = computed(() => Math.ceil(sprite.images.length / sprite.cols))

// 动画循环的定时器引用
let spriteAnimTimer: ReturnType<typeof setTimeout> | null = null

// 获取用于预览的图片 URL（若启用压缩则先生成压缩版本）
async function getSpritePreviewImage(url: string): Promise<string> {
  if (sprite.compression === 'none') return url
  const key = url + '|' + sprite.compression
  if (spriteImageCache.has(key)) return spriteImageCache.get(key)!
  const img = await loadImage(url)
  const q = compressionQuality(sprite.compression)
  const outW = Math.max(1, Math.round(img.naturalWidth * q.scale))
  const outH = Math.max(1, Math.round(img.naturalHeight * q.scale))
  const c = document.createElement('canvas')
  c.width = outW; c.height = outH
  const ctx = c.getContext('2d')!
  // 压缩模式使用有损编码，避免重新编码 PNG 反而变大
  ctx.imageSmoothingEnabled = q.scale === 1 || q.type === 'image/png'
  ctx.drawImage(img, 0, 0, outW, outH)
  const compressed = q.quality < 1 ? c.toDataURL(q.type, q.quality) : c.toDataURL('image/png')
  // 若压缩后体积反而更大，则回退原图，确保不会"越压越大"
  const origSize = dataUrlToBlob(url).size
  const compressedSize = dataUrlToBlob(compressed).size
  const result = compressedSize < origSize ? compressed : url
  spriteImageCache.set(key, result)
  return result
}

// 实时显示所有帧在选定压缩等级下的总预估体积与平均每帧体积
async function updateSpriteCompressionSize() {
  if (!sprite.images.length) { spriteCompressionSize.value = ''; return }
  try {
    let total = 0
    for (const im of sprite.images) total += dataUrlToBlob(im.url).size
    if (sprite.compression !== 'none') {
      let compressedTotal = 0
      const q = compressionQuality(sprite.compression)
      for (const im of sprite.images) {
        const img = await loadImage(im.url)
        const outW = Math.max(1, Math.round(img.naturalWidth * q.scale))
        const outH = Math.max(1, Math.round(img.naturalHeight * q.scale))
        const c = document.createElement('canvas')
        c.width = outW; c.height = outH
        const ctx = c.getContext('2d')!
        ctx.imageSmoothingEnabled = q.scale === 1 || q.type === 'image/png'
        ctx.drawImage(img, 0, 0, outW, outH)
        const dataUrl = q.quality < 1 ? c.toDataURL(q.type, q.quality) : c.toDataURL('image/png')
        const origSize = dataUrlToBlob(im.url).size
        const compressedSize = dataUrlToBlob(dataUrl).size
        compressedTotal += Math.min(origSize, compressedSize)
      }
      total = compressedTotal
    }
    const perFrame = Math.round(total / Math.max(1, sprite.images.length))
    spriteCompressionSize.value = `${formatBytes(total)} (${t('perFrame')}${formatBytes(perFrame)})`
  } catch {
    spriteCompressionSize.value = ''
  }
}

// 监听压缩等级、图片列表变化，实时重新计算
watch(() => [sprite.compression, sprite.images.length], () => updateSpriteCompressionSize(), { immediate: true })

// 加载用户上传的多张本地图片，追加到序列帧列表
async function loadSpriteImages(files: FileList | null) {
  if (!files) return
  for (const f of Array.from(files)) {
    sprite.images.push({ url: await fileToDataUrl(f), file: f })
  }
  nextTick(drawSpritePreview)
  updateSpriteCompressionSize()
}

// 从资源库导入图片到精灵图合成模块；keepOpen 为 true，方便连续选择多张
function importSpriteFromLibrary() {
  openAssetPicker('image', (asset) => {
    sprite.images.push({ url: asset.dataUrl, file: null })
    nextTick(drawSpritePreview)
    updateSpriteCompressionSize()
    setStatus(t('assetImported'));
  }, true)
}

// 根据预览容器尺寸设置高清画布（DPR 缩放，保证高分屏清晰）
function setupSpriteCanvasSize(c: HTMLCanvasElement) {
  const rect = c.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  c.width = Math.max(1, Math.floor(rect.width * dpr))
  c.height = Math.max(1, Math.floor(rect.height * dpr))
  const ctx = c.getContext('2d')!
  ctx.scale(dpr, dpr)
  return { ctx, rect }
}

// 绘制完整 Sprite Sheet 预览：按右侧模块尺寸缩放，小图也会放大铺满
function drawSpritePreview() {
  const c = spritePreviewCanvas.value
  if (!c || !sprite.images.length) return
  const { ctx, rect } = setupSpriteCanvasSize(c)
  // 先填充背景色
  if (sprite.bg !== 'transparent') {
    ctx.fillStyle = sprite.bg
    ctx.fillRect(0, 0, rect.width, rect.height)
  } else {
    ctx.fillStyle = '#0e0e14'
    ctx.fillRect(0, 0, rect.width, rect.height)
  }
  // 异步获取第一张图的预览版（压缩或原图），并以其尺寸计算布局
  getSpritePreviewImage(sprite.images[0].url).then((src0) => {
    const img0 = new Image()
    img0.onload = () => {
      const cellW = img0.width, cellH = img0.height
      const fullW = sprite.cols * cellW + (sprite.cols + 1) * sprite.padding
      const fullH = spriteRows.value * cellH + (spriteRows.value + 1) * sprite.padding
      // 计算缩放比例，允许大于 1，避免小图预览过小
      const scale = Math.min(rect.width / fullW, rect.height / fullH)
      const offsetX = (rect.width - fullW * scale) / 2
      const offsetY = (rect.height - fullH * scale) / 2
      // 逐帧绘制到预览画布，整体居中
      sprite.images.forEach((im, i) => {
        getSpritePreviewImage(im.url).then((src) => {
          const img2 = new Image()
          img2.onload = () => {
            const sx = (i % sprite.cols) * cellW + ((i % sprite.cols) + 1) * sprite.padding
            const sy = Math.floor(i / sprite.cols) * cellH + (Math.floor(i / sprite.cols) + 1) * sprite.padding
            ctx.drawImage(img2, offsetX + sx * scale, offsetY + sy * scale, img2.width * scale, img2.height * scale)
          }
          img2.src = src
        })
      })
    }
    img0.src = src0
  })
}

// 绘制当前播放的某一帧：按容器尺寸缩放并居中，允许放大
function drawSpriteFrame(idx: number) {
  const c = spritePreviewCanvas.value
  if (!c || !sprite.images.length) return
  const { ctx, rect } = setupSpriteCanvasSize(c)
  ctx.fillStyle = sprite.bg === 'transparent' ? '#0e0e14' : sprite.bg
  ctx.fillRect(0, 0, rect.width, rect.height)
  getSpritePreviewImage(sprite.images[idx].url).then((src) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(rect.width / img.width, rect.height / img.height)
      const w = img.width * scale, h = img.height * scale
      ctx.drawImage(img, (rect.width - w) / 2, (rect.height - h) / 2, w, h)
    }
    img.src = src
  })
}

// 动画循环：按预览 FPS 逐帧播放
function playSpriteLoop() {
  if (!sprite.playing || !sprite.images.length) return
  drawSpriteFrame(sprite.animFrame)
  sprite.animFrame = (sprite.animFrame + 1) % sprite.images.length
  spriteAnimTimer = setTimeout(playSpriteLoop, 1000 / sprite.previewFps)
}

// 切换播放/暂停状态，停止时回到完整 Sprite Sheet 预览
function toggleSpritePreview() {
  if (sprite.playing) {
    sprite.playing = false
    if (spriteAnimTimer) { clearTimeout(spriteAnimTimer); spriteAnimTimer = null }
    drawSpritePreview()
  } else {
    sprite.playing = true
    sprite.animFrame = 0
    playSpriteLoop()
  }
}

// 当布局参数或图片数量变化时自动重绘（播放中不重绘，避免打断动画）
watch(() => [sprite.cols, sprite.padding, sprite.bg, sprite.images.length], () => {
  if (!sprite.playing) drawSpritePreview()
})

// 压缩等级变化时清空缓存并重新绘制预览
watch(() => sprite.compression, () => {
  spriteImageCache.clear()
  if (!sprite.playing) drawSpritePreview()
  updateSpriteCompressionSize()
})

// ============ 多图上传模式导出 ============

// 多图上传模式的导出：将 images 转为 FrameItem 格式调用导出函数
function imagesToFrames(): FrameItem[] {
  return sprite.images.map(im => ({ url: im.url, selected: true, similarGroup: -1, originalUrl: im.url }))
}

// 生成多图上传导出预览
async function generateImagesExportPreview() {
  const frames = imagesToFrames()
  if (!frames.length) return
  loading(true, t('loading'))
  try {
    const result = await generateExportPreview(
      sprite.exportFormat as any,
      frames,
      { w: sprite.exportW, h: sprite.exportH, cols: sprite.cols, compression: sprite.compression as any, delay: sprite.exportDelay }
    )
    sprite.exportPreview = result.url
    sprite.exportSizeEstimate = result.info || ''
    setStatus(t('exportPreviewDone'))
  } catch (e) {
    setStatus('预览生成失败')
  } finally {
    loading(false)
  }
}

// 下载多图上传导出结果
async function downloadImagesExport() {
  const frames = imagesToFrames()
  if (!frames.length) return
  loading(true, t('downloading'))
  try {
    await downloadExport(
      sprite.exportFormat as any,
      frames,
      { w: sprite.exportW, h: sprite.exportH, cols: sprite.cols, compression: sprite.compression as any, delay: sprite.exportDelay },
      sprite.exportName
    )
  } catch (e) {
    setStatus('下载失败')
  } finally {
    loading(false)
  }
}

// 下载精灵图子选项（多图上传模式）
async function downloadImagesSpriteExport(fmt: 'sprite' | 'sprite-zip' | 'sprite-json') {
  const frames = imagesToFrames()
  if (!frames.length) return
  loading(true, t('downloading'))
  try {
    await downloadExport(
      fmt,
      frames,
      { w: sprite.exportW, h: sprite.exportH, cols: sprite.cols, compression: sprite.compression as any, delay: sprite.exportDelay },
      sprite.exportName
    )
  } catch (e) {
    setStatus('下载失败')
  } finally {
    loading(false)
  }
}

// 应用多图上传导出尺寸预设
function applyImagesExportPreset() {
  const presets: Record<string, [number, number]> = {
    '64x64': [64, 64], '128x128': [128, 128], '256x256': [256, 256],
    '256x455': [256, 455], '512x512': [512, 512], '512x910': [512, 910],
  }
  const p = presets[sprite.exportPreset]
  if (p) { sprite.exportW = p[0]; sprite.exportH = p[1] }
}

// 导出格式/压缩变化后重新生成预览
watch(() => sprite.exportFormat, () => {
  if (sprite.images.length && sprite.exportPreview) generateImagesExportPreview()
})

// 输入框聚焦时全选内容
function selectOnFocus(e: FocusEvent) {
  const el = e.target as HTMLInputElement
  el.select()
}

// 导出文件名输入框快捷键：支持 Ctrl+A 全选
function handleExportNameKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
    e.preventDefault()
    e.stopPropagation()
    const input = e.target as HTMLInputElement
    input.select()
  }
}

// ============ 精灵图裁剪模式状态（三步流程） ============
const spriteSheet = reactive({
  step: 1, // 当前流程步骤：1=上传裁剪 2=处理帧 3=导出
  url: '',          // 精灵图源 URL
  cols: 4,         // 裁剪列数
  rows: 4,         // 裁剪行数
  name: '',        // 文件名

  // 提取后的帧列表
  frames: [] as FrameItem[],

  // 预览动画参数
  previewFps: 10, playing: false, animFrame: 0,

  // 导出设置
  export: {
    format: 'sprite' as 'sprite' | 'zip' | 'gif' | 'video',
    cols: 4, w: 128, h: 128,
    compression: 'none' as 'none' | 'low' | 'medium' | 'high',
    delay: 100, name: 'sprite_frames',
    preset: 'custom',
    preview: '', sizeEstimate: '',
  },
})

// 步骤标签
const imageStepLabels = computed(() => [t('imageStep1'), t('imageStep2'), t('imageStep3')])

// 帧编辑器组件引用（精灵图裁剪模式）
const frameEditorRef = ref<InstanceType<typeof FrameEditor> | null>(null)

// 精灵图裁剪预览画布引用
const spriteSliceCanvas = ref<HTMLCanvasElement | null>(null)

// 帧处理预览画布引用
const framePreviewCanvas = ref<HTMLCanvasElement | null>(null)

// 导出视频预览元素引用
const exportPreviewVideo = ref<HTMLVideoElement | null>(null)

// 删除未选帧的二次确认弹框状态
const showDeleteUnselectedConfirm = ref(false)

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

// 当前已选帧数量
const selectedCount = computed(() => spriteSheet.frames.filter(f => f.selected).length)

// 帧点击连选状态
const lastFrameClickIndex = ref(-1)

// 动画循环定时器（精灵图裁剪模式）
let frameAnimTimer: ReturnType<typeof setTimeout> | null = null

// ============ 精灵图裁剪：步骤 1 ============

// 加载精灵图文件
async function loadSpriteSheet(files: FileList | null) {
  if (!files || !files.length) return
  const f = files[0]
  spriteSheet.url = await fileToDataUrl(f)
  spriteSheet.name = f.name
  nextTick(drawSpriteSlicePreview)
}

// 从资源库导入精灵图
function importSpriteSheetFromLibrary() {
  openAssetPicker('image', (asset) => {
    spriteSheet.url = asset.dataUrl
    spriteSheet.name = asset.name || 'sprite_sheet'
    nextTick(drawSpriteSlicePreview)
  }, false)
}

// 绘制精灵图裁剪预览：显示原图并叠加网格线
async function drawSpriteSlicePreview() {
  const c = spriteSliceCanvas.value
  if (!c || !spriteSheet.url) return
  const img = await loadImage(spriteSheet.url)
  const cols = spriteSheet.cols
  const rows = spriteSheet.rows
  // 画布尺寸限制最大 600px 宽度，保持比例
  const maxW = 600
  const scale = Math.min(1, maxW / img.naturalWidth)
  c.width = img.naturalWidth * scale
  c.height = img.naturalHeight * scale
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, 0, 0, c.width, c.height)
  // 绘制网格线
  const cellW = c.width / cols
  const cellH = c.height / rows
  ctx.strokeStyle = 'rgba(0, 212, 170, 0.8)'
  ctx.lineWidth = 1
  for (let i = 1; i < cols; i++) {
    ctx.beginPath()
    ctx.moveTo(i * cellW, 0)
    ctx.lineTo(i * cellW, c.height)
    ctx.stroke()
  }
  for (let i = 1; i < rows; i++) {
    ctx.beginPath()
    ctx.moveTo(0, i * cellH)
    ctx.lineTo(c.width, i * cellH)
    ctx.stroke()
  }
}

// 监听裁剪参数变化，重新绘制预览
watch(() => [spriteSheet.cols, spriteSheet.rows], () => {
  if (spriteSheet.url) nextTick(drawSpriteSlicePreview)
})

// 执行精灵图裁剪：按列数行数分割为独立 PNG 帧图，进入步骤 2
async function sliceSpriteSheet() {
  if (!spriteSheet.url) {
    toast(t('uploadImages'), 'warning')
    return
  }
  loading(true, t('processing'))
  try {
    const img = await loadImage(spriteSheet.url)
    const cols = spriteSheet.cols
    const rows = spriteSheet.rows
    const cellW = Math.floor(img.naturalWidth / cols)
    const cellH = Math.floor(img.naturalHeight / rows)
    const frames: FrameItem[] = []
    // 按行优先顺序裁剪每个单元格
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const canvas = document.createElement('canvas')
        canvas.width = cellW
        canvas.height = cellH
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, c * cellW, r * cellH, cellW, cellH, 0, 0, cellW, cellH)
        const url = canvas.toDataURL('image/png')
        frames.push({ url, selected: true, similarGroup: -1, originalUrl: url })
      }
    }
    spriteSheet.frames = frames
    spriteSheet.step = 2
    setStatus(t('extractDone'))
    nextTick(drawFramePreview)
  } catch (e) {
    toast(t('extractFailed') || '裁剪失败', 'error')
  } finally {
    loading(false)
  }
}

// 重新上传精灵图
function triggerSpriteSheetReupload() {
  spriteSheet.url = ''
  spriteSheet.name = ''
}

// ============ 精灵图裁剪：步骤 2 ============

// 绘制帧预览：按容器尺寸缩放并居中
function drawFramePreview() {
  const c = framePreviewCanvas.value
  if (!c || !spriteSheet.frames.length) return
  const { ctx, rect } = setupSpriteCanvasSize(c)
  ctx.fillStyle = '#0e0e14'
  ctx.fillRect(0, 0, rect.width, rect.height)
  const img0 = new Image()
  img0.onload = () => {
    const cellW = img0.width, cellH = img0.height
    const cols = spriteSheet.export.cols
    const rows = Math.ceil(spriteSheet.frames.length / cols)
    const fullW = cols * cellW + (cols + 1) * 2
    const fullH = rows * cellH + (rows + 1) * 2
    const scale = Math.min(rect.width / fullW, rect.height / fullH)
    const offsetX = (rect.width - fullW * scale) / 2
    const offsetY = (rect.height - fullH * scale) / 2
    spriteSheet.frames.forEach((f, i) => {
      const img2 = new Image()
      img2.onload = () => {
        const sx = (i % cols) * cellW + ((i % cols) + 1) * 2
        const sy = Math.floor(i / cols) * cellH + (Math.floor(i / cols) + 1) * 2
        ctx.drawImage(img2, offsetX + sx * scale, offsetY + sy * scale, img2.width * scale, img2.height * scale)
      }
      img2.src = f.url
    })
  }
  img0.src = spriteSheet.frames[0].url
}

// 绘制单帧预览
function drawFrameSingle(idx: number) {
  const c = framePreviewCanvas.value
  if (!c || !spriteSheet.frames.length) return
  const { ctx, rect } = setupSpriteCanvasSize(c)
  ctx.fillStyle = '#0e0e14'
  ctx.fillRect(0, 0, rect.width, rect.height)
  const img = new Image()
  img.onload = () => {
    const scale = Math.min(rect.width / img.width, rect.height / img.height)
    const w = img.width * scale, h = img.height * scale
    ctx.drawImage(img, (rect.width - w) / 2, (rect.height - h) / 2, w, h)
  }
  img.src = spriteSheet.frames[idx].url
}

// 动画循环
function playFrameLoop() {
  if (!spriteSheet.playing || !spriteSheet.frames.length) return
  drawFrameSingle(spriteSheet.animFrame)
  spriteSheet.animFrame = (spriteSheet.animFrame + 1) % spriteSheet.frames.length
  frameAnimTimer = setTimeout(playFrameLoop, 1000 / spriteSheet.previewFps)
}

// 切换播放/暂停
function toggleFramePreview() {
  if (spriteSheet.playing) {
    spriteSheet.playing = false
    if (frameAnimTimer) { clearTimeout(frameAnimTimer); frameAnimTimer = null }
    drawFramePreview()
  } else {
    const selected = spriteSheet.frames.filter(f => f.selected)
    if (!selected.length) return
    spriteSheet.playing = true
    spriteSheet.animFrame = 0
    playFrameLoop()
  }
}

// 全选 / 取消全选 / 隔帧选取
function selectAllFrames() { spriteSheet.frames.forEach(f => f.selected = true) }
function deselectAllFrames() { spriteSheet.frames.forEach(f => f.selected = false) }
function selectEveryOtherFrame() { spriteSheet.frames.forEach((f, i) => { f.selected = (i % 2 === 0) }) }

// 确认删除未选帧
function confirmDeleteUnselected() {
  spriteSheet.frames = spriteSheet.frames.filter(f => f.selected)
  showDeleteUnselectedConfirm.value = false
  setStatus(t('deleted'))
}

// 检测相似帧
async function detectSimilarFrames() {
  loading(true, t('loading'))
  const compareSize = 16
  const frameData: Uint8Array[] = []
  for (const f of spriteSheet.frames) {
    const img = await loadImage(f.url)
    const c = document.createElement('canvas')
    c.width = compareSize; c.height = compareSize
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0, compareSize, compareSize)
    frameData.push(new Uint8Array(ctx.getImageData(0, 0, compareSize, compareSize).data))
  }
  let groupId = 0
  const assigned = new Set<number>()
  for (let i = 0; i < spriteSheet.frames.length; i++) {
    if (assigned.has(i)) continue
    const group: number[] = [i]
    for (let j = i + 1; j < spriteSheet.frames.length; j++) {
      if (assigned.has(j)) continue
      let same = 0, total = compareSize * compareSize * 4
      for (let k = 0; k < total; k += 4) {
        if (Math.abs(frameData[i][k] - frameData[j][k]) < 5 &&
            Math.abs(frameData[i][k+1] - frameData[j][k+1]) < 5 &&
            Math.abs(frameData[i][k+2] - frameData[j][k+2]) < 5) same++
      }
      if (same / (total / 4) >= 0.95) group.push(j)
    }
    group.forEach(idx => { spriteSheet.frames[idx].similarGroup = groupId; assigned.add(idx) })
    if (group.length > 1) groupId++
    else spriteSheet.frames[i].similarGroup = -1
  }
  loading(false)
  setStatus(t('detectDone'))
}

// 帧缩略图点击：Shift 连续选中，普通点击打开编辑器
function handleFrameClick(i: number, e: MouseEvent) {
  if (e.shiftKey && lastFrameClickIndex.value >= 0) {
    const start = Math.min(lastFrameClickIndex.value, i)
    const end = Math.max(lastFrameClickIndex.value, i)
    const targetState = !spriteSheet.frames[i].selected
    for (let idx = start; idx <= end; idx++) spriteSheet.frames[idx].selected = targetState
    lastFrameClickIndex.value = i
    return
  }
  lastFrameClickIndex.value = i
  openFrameEditor(i)
}

// 帧复选框点击
function onFrameCheckboxClick(i: number, e: MouseEvent) {
  const shift = e.shiftKey
  if (shift && lastFrameClickIndex.value >= 0) {
    e.preventDefault()
    const targetState = !spriteSheet.frames[i].selected
    const start = Math.min(lastFrameClickIndex.value, i)
    const end = Math.max(lastFrameClickIndex.value, i)
    for (let idx = start; idx <= end; idx++) spriteSheet.frames[idx].selected = targetState
  } else {
    spriteSheet.frames[i].selected = !spriteSheet.frames[i].selected
  }
  lastFrameClickIndex.value = i
}

// 打开帧编辑器
function openFrameEditor(i: number) {
  frameEditorRef.value?.openFrameEditor(i)
}

// 确认导出：进入步骤 3
function confirmExport() {
  const selected = spriteSheet.frames.filter(f => f.selected)
  if (!selected.length) {
    toast(t('selectFramesFirst'), 'warning')
    return
  }
  setStatus(`${t('selectedFrames')}: ${selected.length} / ${spriteSheet.frames.length}`)
  spriteSheet.step = 3
  nextTick().then(() => generateExportPreviewAll().then(() => {
    if (spriteSheet.export.format === 'video') {
      const el = exportPreviewVideo.value
      if (el) { el.loop = true; el.play().catch(() => {}) }
    }
  }))
}

// ============ 精灵图裁剪：步骤 3 ============

// 应用导出尺寸预设
function applyExportPreset() {
  const presets: Record<string, [number, number]> = {
    '64x64': [64, 64], '128x128': [128, 128], '256x256': [256, 256],
    '256x455': [256, 455], '512x512': [512, 512], '512x910': [512, 910],
  }
  const p = presets[spriteSheet.export.preset]
  if (p) { spriteSheet.export.w = p[0]; spriteSheet.export.h = p[1] }
}

// 生成导出预览
async function generateExportPreviewAll() {
  const frames = spriteSheet.frames.filter(f => f.selected)
  if (!frames.length) return
  loading(true, t('loading'))
  try {
    const result = await generateExportPreview(
      spriteSheet.export.format as any,
      frames,
      { w: spriteSheet.export.w, h: spriteSheet.export.h, cols: spriteSheet.export.cols, compression: spriteSheet.export.compression as any, delay: spriteSheet.export.delay }
    )
    spriteSheet.export.preview = result.url
    spriteSheet.export.sizeEstimate = result.info || ''
    setStatus(t('exportPreviewDone'))
  } catch (e) {
    setStatus('预览生成失败')
  } finally {
    loading(false)
  }
}

// 下载导出结果
async function downloadExportAll() {
  const frames = spriteSheet.frames.filter(f => f.selected)
  if (!frames.length) return
  loading(true, t('downloading'))
  try {
    await downloadExport(
      spriteSheet.export.format as any,
      frames,
      { w: spriteSheet.export.w, h: spriteSheet.export.h, cols: spriteSheet.export.cols, compression: spriteSheet.export.compression as any, delay: spriteSheet.export.delay },
      spriteSheet.export.name
    )
  } catch (e) {
    setStatus('下载失败')
  } finally {
    loading(false)
  }
}

// 下载精灵图子选项：PNG / ZIP(PNG+JSON) / JSON 元数据
async function downloadSpriteExport(fmt: 'sprite' | 'sprite-zip' | 'sprite-json') {
  const frames = spriteSheet.frames.filter(f => f.selected)
  if (!frames.length) return
  loading(true, t('downloading'))
  try {
    await downloadExport(
      fmt,
      frames,
      { w: spriteSheet.export.w, h: spriteSheet.export.h, cols: spriteSheet.export.cols, compression: spriteSheet.export.compression as any, delay: spriteSheet.export.delay },
      spriteSheet.export.name
    )
  } catch (e) {
    setStatus('下载失败')
  } finally {
    loading(false)
  }
}

// 切换导出格式后自动重新生成预览
watch(() => spriteSheet.export.format, () => {
  if (spriteSheet.frames.length && spriteSheet.step === 3) generateExportPreviewAll()
})

// 当布局参数或帧数量变化时自动重绘预览
watch(() => [spriteSheet.export.cols, spriteSheet.frames.length], () => {
  if (spriteSheet.step === 2 && !spriteSheet.playing) drawFramePreview()
})
</script>

<template>
<div class="space-y-3">
<!-- 上传方式选择 -->
<div class="bg-af-bg border border-af-rule rounded-lg p-3.5">
  <div class="panel-title">{{ t('uploadMode') }}</div>
  <div class="flex gap-2 mt-2">
    <button class="btn-secondary" :class="uploadMode === 'images' ? '!border-af-accent !text-af-accent' : ''" @click="uploadMode = 'images'">{{ t('uploadImagesMode') }}</button>
    <button class="btn-secondary" :class="uploadMode === 'sprite-sheet' ? '!border-af-accent !text-af-accent' : ''" @click="uploadMode = 'sprite-sheet'">{{ t('uploadSpriteMode') }}</button>
  </div>
</div>

<!-- ============ 多图上传模式：单页面流程 ============ -->
<div v-if="uploadMode === 'images'" class="space-y-3">
  <UploadZone v-if="!sprite.images.length" accept="image/*" multiple :prompt="t('uploadImages')" :hint="t('uploadImagesHint')" @files="loadSpriteImages($event)" />
  <button v-if="!sprite.images.length" class="btn-secondary btn-sm" @click="importSpriteFromLibrary">{{ t('importFromLibrary') }}</button>

  <div v-if="sprite.images.length" class="flex gap-3 flex-wrap">
    <!-- 左侧：图片列表 + 合成设置 -->
    <div class="flex-1 min-w-[260px] space-y-3">
      <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[13px] font-semibold">{{ t('sourceImages') }} ({{ sprite.images.length }})</span>
          <button class="btn-secondary btn-sm" @click="sprite.images = []; spriteImageCache.clear()">{{ t('clear') }}</button>
        </div>
        <div class="grid grid-cols-7 gap-2.5">
          <div v-for="(img,i) in sprite.images" :key="i" class="bg-af-surface border border-af-rule rounded-md overflow-hidden relative group">
            <img :src="img.url" class="w-full object-contain bg-[#0e0e14]">
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button class="w-7 h-7 rounded-md bg-white/15 text-white flex items-center justify-center" @click="sprite.images.splice(i,1); spriteImageCache.clear(); nextTick(drawSpritePreview)">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 合成设置 -->
      <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">
        <div class="panel-title"><span>{{ t('spriteSettings') }}</span><HelpBtn :text="t('spriteSettingsHint')" /></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">{{ t('spriteCols') }}</label><input v-model.number="sprite.cols" type="number" min="1" class="form-input"></div>
          <div class="form-group"><label class="form-label">{{ t('padding') }}</label><input v-model.number="sprite.padding" type="number" min="0" class="form-input"></div>
          <div class="form-group"><label class="form-label">{{ t('bgColor') }}</label><select v-model="sprite.bg" class="form-select"><option value="transparent">{{ t('transparent') }}</option><option value="#000000">#000000</option><option value="#ffffff">#ffffff</option><option value="#ff00ff">#ff00ff</option></select></div>
        </div>
        <div class="form-group"><label class="form-label">{{ t('compression') }}</label>
          <select v-model="sprite.compression" class="form-select">
            <option value="none">{{ t('compressionNone') }}</option>
            <option value="low">{{ t('compressionLow') }}</option>
            <option value="medium">{{ t('compressionMed') }}</option>
            <option value="high">{{ t('compressionHigh') }}</option>
          </select>
        </div>
        <div v-if="spriteCompressionSize" class="text-xs text-af-muted mt-1">{{ t('estSize') }}: {{ spriteCompressionSize }}</div>
      </div>

      <!-- 导出设置 -->
      <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">
        <div class="panel-title"><span>{{ t('exportOptions') }}</span><HelpBtn :text="t('exportHelp')" /></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">{{ t('exportFormat') }}</label>
            <select v-model="sprite.exportFormat" class="form-select">
              <option value="video">{{ t('videoWebm') }}</option>
              <option value="gif">GIF</option>
              <option value="zip">{{ t('framesZip') }}</option>
              <option value="sprite">{{ t('sprite') }}</option>
            </select>
          </div>
          <div v-if="sprite.exportFormat === 'sprite' || sprite.exportFormat === 'zip'" class="form-group">
            <label class="form-label">{{ t('spriteCols') }}</label>
            <input v-model.number="sprite.cols" type="number" min="1" class="form-input" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">{{ t('preset') }}</label>
            <select v-model="sprite.exportPreset" class="form-select" @change="applyImagesExportPreset">
              <option value="custom">{{ t('custom') }}</option>
              <option value="64x64">64x64</option>
              <option value="128x128">128x128</option>
              <option value="256x256">256x256</option>
              <option value="256x455">256x455</option>
              <option value="512x512">512x512</option>
              <option value="512x910">512x910</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">{{ t('width') }}</label><input v-model.number="sprite.exportW" type="number" min="1" class="form-input" /></div>
          <div class="form-group"><label class="form-label">{{ t('height') }}</label><input v-model.number="sprite.exportH" type="number" min="1" class="form-input" /></div>
        </div>
        <div class="form-row">
          <div v-if="sprite.exportFormat === 'gif'" class="form-group"><label class="form-label">{{ t('gifDelay') }}</label><input v-model.number="sprite.exportDelay" type="number" min="20" class="form-input" /></div>
          <div class="form-group"><label class="form-label">{{ t('filename') }}</label><input v-model="sprite.exportName" class="form-input" @focus="selectOnFocus($event)" @keydown="handleExportNameKeydown($event)"></div>
        </div>
        <div v-if="sprite.exportSizeEstimate" class="text-xs text-af-muted mt-2">{{ t('estSize') }}: {{ sprite.exportSizeEstimate }}</div>
        <div class="flex gap-2 mt-3 flex-wrap">
          <button class="btn-primary" @click="generateImagesExportPreview">{{ t('generatePreview') }}</button>
          <template v-if="sprite.exportFormat === 'sprite' && sprite.exportPreview">
            <button class="btn-secondary" @click="downloadImagesSpriteExport('sprite')">{{ t('downloadPng') }}</button>
            <button class="btn-secondary" @click="downloadImagesSpriteExport('sprite-zip')">{{ t('spriteZip') }}</button>
            <button class="btn-secondary" @click="downloadImagesSpriteExport('sprite-json')">{{ t('downloadJson') }}</button>
          </template>
          <button v-else-if="sprite.exportPreview" class="btn-secondary" @click="downloadImagesExport">{{ t('download') }}</button>
        </div>
      </div>
    </div>

    <!-- 右侧：预览画布 -->
    <div class="w-80 shrink-0 self-start flex flex-col gap-2.5">
      <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden relative min-h-[400px]">
        <canvas ref="spritePreviewCanvas" class="max-w-full max-h-full"></canvas>
      </div>
      <div class="form-group !mb-0 py-2">
        <label class="form-label text-sm">{{ t('previewFps') }}</label>
        <div class="slider-wrap items-center h-10">
          <input v-model.number="sprite.previewFps" type="range" min="1" max="60" class="flex-1 accent-af-accent h-2.5">
          <span class="slider-value text-base font-semibold w-10">{{ sprite.previewFps }}</span>
        </div>
      </div>
      <button class="btn-primary btn-sm w-full" @click="toggleSpritePreview">{{ sprite.playing ? t('pause') : t('play') }}</button>
    </div>
  </div>

  <!-- 导出预览 -->
  <div v-if="sprite.exportPreview" class="bg-af-bg border border-af-rule rounded-lg p-3.5">
    <div class="panel-title">{{ t('exportPreview') }}</div>
    <div class="preview-box min-h-[320px]">
      <video v-if="sprite.exportFormat === 'video' && sprite.exportPreview" :src="sprite.exportPreview" controls class="max-w-full max-h-[60vh] mx-auto"></video>
      <img v-else-if="sprite.exportPreview && sprite.exportFormat !== 'zip'" :src="sprite.exportPreview" class="max-w-full max-h-[60vh] mx-auto">
      <div v-else class="text-center text-af-muted py-12">{{ t('clickGeneratePreview') }}</div>
    </div>
  </div>
</div>

<!-- ============ 精灵图裁剪模式：三步流程 ============ -->
<div v-if="uploadMode === 'sprite-sheet'" class="space-y-3">
  <!-- 步骤指示栏 -->
  <div class="steps-bar">
    <button v-for="n in 3" :key="n" class="step-pill" :class="spriteSheet.step === n ? 'active' : ''" @click="spriteSheet.step = n">
      <span class="step-num">{{ n }}</span>
      <span>{{ imageStepLabels[n-1] }}</span>
    </button>
  </div>

  <!-- 步骤 1：上传·裁剪·提取 -->
  <div v-if="spriteSheet.step === 1" class="space-y-3">
    <UploadZone v-if="!spriteSheet.url" accept="image/*" :prompt="t('uploadSpriteMode')" :hint="t('spriteSliceHint')" @files="loadSpriteSheet($event)" />
    <button v-if="!spriteSheet.url" class="btn-secondary btn-sm" @click="importSpriteSheetFromLibrary">{{ t('importFromLibrary') }}</button>

    <div v-if="spriteSheet.url" class="bg-af-bg border border-af-rule rounded-lg p-3.5 space-y-3">
      <div class="panel-title"><span>{{ t('spriteSliceSettings') }}</span><HelpBtn :text="t('spriteSliceHint')" /></div>

      <div class="form-row">
        <div class="form-group"><label class="form-label">{{ t('filename') }}</label><input :value="spriteSheet.name" readonly class="form-input" /></div>
        <div class="form-group"><label class="form-label">{{ t('sliceCols') }}</label><input v-model.number="spriteSheet.cols" type="number" min="1" class="form-input" /></div>
        <div class="form-group"><label class="form-label">{{ t('sliceRows') }}</label><input v-model.number="spriteSheet.rows" type="number" min="1" class="form-input" /></div>
      </div>

      <div>
        <div class="text-[13px] font-semibold mb-2">{{ t('slicePreview') }}</div>
        <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden flex justify-center">
          <canvas ref="spriteSliceCanvas" class="max-w-full block"></canvas>
        </div>
      </div>

      <div class="flex gap-2">
        <button type="button" class="btn-secondary" @click="triggerSpriteSheetReupload">{{ t('reupload') }}</button>
        <button class="btn-primary" @click="sliceSpriteSheet">{{ t('sliceSprite') }}</button>
      </div>
    </div>
  </div>

  <!-- 步骤 2：处理提取帧 -->
  <div v-if="spriteSheet.step === 2" class="space-y-3">
    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5 flex gap-2 flex-wrap items-center">
      <button class="btn-secondary" @click="detectSimilarFrames">{{ t('detectSimilar') }}</button>
      <button class="btn-secondary" @click="selectEveryOtherFrame">{{ t('selectEveryOther') }}</button>
      <button class="btn-secondary" @click="selectAllFrames">{{ t('selectAll') }}</button>
      <button class="btn-secondary" @click="deselectAllFrames">{{ t('deselectAll') }}</button>
      <button class="btn-secondary" @click="showDeleteUnselectedConfirm = true">{{ t('deleteUnselected') }}</button>
      <div class="flex-1"></div>
      <span class="text-xs text-af-muted">{{ t('frameClickHint') }}</span>
    </div>

    <div class="flex gap-3 flex-wrap">
      <!-- 左侧：帧网格 -->
      <div class="flex-1 min-w-[260px] space-y-2.5">
        <div class="flex items-center justify-between text-xs text-af-muted px-1">
          <span>{{ t('totalFrames') }}: {{ spriteSheet.frames.length }}</span>
          <span class="text-af-accent font-medium">{{ t('selectedFrames') }}: {{ selectedCount }}</span>
        </div>
        <div class="grid grid-cols-7 gap-2.5">
          <div v-for="(f,i) in spriteSheet.frames" :key="i"
            class="bg-af-surface border rounded-md overflow-hidden cursor-pointer relative transition-all hover:border-af-accent"
            :class="f.selected ? 'border-af-accent' : 'border-af-rule'"
            :style="similarFrameStyle(f.similarGroup)"
            @click="handleFrameClick(i, $event)">
            <input type="checkbox" :checked="f.selected" class="absolute top-2 left-2 w-7 h-7 z-10 accent-af-accent cursor-pointer" @click.stop="onFrameCheckboxClick(i, $event)">
            <div v-if="f.similarGroup !== -1" class="absolute top-0 left-0 right-0 h-1.5 z-10" :style="{ background: similarColors[f.similarGroup % similarColors.length] }"></div>
            <img :src="f.url" class="w-full object-contain bg-[#0e0e14]">
            <div class="px-2 py-1 text-[11px] text-af-muted flex justify-between">
              <span>#{{ i+1 }}</span>
              <span v-if="f.similarGroup !== -1" class="text-xs font-bold" :style="{ color: similarColors[f.similarGroup % similarColors.length] }">G{{ f.similarGroup }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览画布 + 播放/导出按钮 -->
      <div class="w-80 shrink-0 self-start flex flex-col gap-2.5">
        <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden relative min-h-[400px]">
          <canvas ref="framePreviewCanvas" class="max-w-full max-h-full"></canvas>
        </div>
        <div class="form-group !mb-0 py-2">
          <label class="form-label text-sm">{{ t('previewFps') }}</label>
          <div class="slider-wrap items-center h-10">
            <input v-model.number="spriteSheet.previewFps" type="range" min="1" max="60" class="flex-1 accent-af-accent h-2.5">
            <span class="slider-value text-base font-semibold w-10">{{ spriteSheet.previewFps }}</span>
          </div>
        </div>
        <button class="btn-primary btn-sm w-full" @click="toggleFramePreview">{{ spriteSheet.playing ? t('pause') : t('play') }}</button>
        <button class="btn-primary w-full" @click="confirmExport">{{ t('confirmExport') }}</button>
      </div>
    </div>
  </div>

  <!-- 步骤 3：导出处理结果 -->
  <div v-if="spriteSheet.step === 3" class="space-y-3">
    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">
      <div class="panel-title"><span>{{ t('exportOptions') }}</span><HelpBtn :text="t('exportHelp')" /></div>

      <div class="form-row">
        <div class="form-group"><label class="form-label">{{ t('exportFormat') }}</label>
          <select v-model="spriteSheet.export.format" class="form-select">
            <option value="video">{{ t('videoWebm') }}</option>
            <option value="gif">GIF</option>
            <option value="zip">{{ t('framesZip') }}</option>
            <option value="sprite">{{ t('sprite') }}</option>
          </select>
        </div>
        <div v-if="spriteSheet.export.format === 'sprite' || spriteSheet.export.format === 'zip'" class="form-group">
          <label class="form-label">{{ t('spriteCols') }}</label>
          <input v-model.number="spriteSheet.export.cols" type="number" min="1" class="form-input" />
        </div>
      </div>

      <div class="panel-title mt-2">{{ t('exportSize') }}</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">{{ t('preset') }}</label>
          <select v-model="spriteSheet.export.preset" class="form-select" @change="applyExportPreset">
            <option value="custom">{{ t('custom') }}</option>
            <option value="64x64">64x64</option>
            <option value="128x128">128x128</option>
            <option value="256x256">256x256</option>
            <option value="256x455">256x455</option>
            <option value="512x512">512x512</option>
            <option value="512x910">512x910</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">{{ t('width') }}</label><input v-model.number="spriteSheet.export.w" type="number" min="1" class="form-input" /></div>
        <div class="form-group"><label class="form-label">{{ t('height') }}</label><input v-model.number="spriteSheet.export.h" type="number" min="1" class="form-input" /></div>
      </div>

      <div class="form-row">
        <div class="form-group"><label class="form-label">{{ t('compression') }}</label>
          <select v-model="spriteSheet.export.compression" class="form-select">
            <option value="none">{{ t('compressionNone') }}</option>
            <option value="low">{{ t('compressionLow') }}</option>
            <option value="medium">{{ t('compressionMed') }}</option>
            <option value="high">{{ t('compressionHigh') }}</option>
          </select>
        </div>
        <div v-if="spriteSheet.export.format === 'gif'" class="form-group"><label class="form-label">{{ t('gifDelay') }}</label><input v-model.number="spriteSheet.export.delay" type="number" min="20" class="form-input" /></div>
        <div class="form-group"><label class="form-label">{{ t('filename') }}</label><input v-model="spriteSheet.export.name" class="form-input" @focus="selectOnFocus($event)" @keydown="handleExportNameKeydown($event)"></div>
      </div>

      <div v-if="spriteSheet.export.sizeEstimate" class="text-xs text-af-muted mt-2">{{ t('estSize') }}: {{ spriteSheet.export.sizeEstimate }}</div>

      <div class="flex gap-2 mt-3 flex-wrap">
        <button class="btn-primary" @click="generateExportPreviewAll">{{ t('generatePreview') }}</button>
        <template v-if="spriteSheet.export.format === 'sprite' && spriteSheet.export.preview">
          <button class="btn-secondary" @click="downloadSpriteExport('sprite')">{{ t('downloadPng') }}</button>
          <button class="btn-secondary" @click="downloadSpriteExport('sprite-zip')">{{ t('spriteZip') }}</button>
          <button class="btn-secondary" @click="downloadSpriteExport('sprite-json')">{{ t('downloadJson') }}</button>
        </template>
        <button v-else-if="spriteSheet.export.preview" class="btn-secondary" @click="downloadExportAll">{{ t('download') }}</button>
      </div>
    </div>

    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">
      <div class="panel-title">{{ t('exportPreview') }}</div>
      <div class="preview-box min-h-[320px]">
        <video v-if="spriteSheet.export.format === 'video' && spriteSheet.export.preview" ref="exportPreviewVideo" :src="spriteSheet.export.preview" controls class="max-w-full max-h-[60vh] mx-auto"></video>
        <img v-else-if="spriteSheet.export.preview && spriteSheet.export.format !== 'zip'" :src="spriteSheet.export.preview" class="max-w-full max-h-[60vh] mx-auto">
        <div v-else class="text-center text-af-muted py-12">{{ t('clickGeneratePreview') }}</div>
      </div>
    </div>
  </div>

  <!-- 帧编辑器（精灵图裁剪模式） -->
  <FrameEditor ref="frameEditorRef" v-model="spriteSheet.frames" @toast="toast" @loading="loading" @status="setStatus" />

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
</div>
</div>
</template>
<style scoped>
/* 页面级局部样式，优先使用 Tailwind */
</style>
