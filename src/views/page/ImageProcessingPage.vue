<script setup lang="ts">
// ImageProcessingPage：从 WorkspaceView.vue 抽取的独立页面组件

import { ref, reactive, computed, nextTick, inject } from 'vue'
import { applyMattingParams } from '../../utils/matting'
import { loadImage, downloadUrl } from '../../utils/export'
import { fileToDataUrl, useLibrarySaver } from '../../composables/useLibrary'
import UploadZone from '../components/UploadZone.vue'


const t = inject<(key: string) => string>('t', (key) => key)
const emit = defineEmits<{
  (e: 'status', msg: string): void
  (e: 'toast', text: string, type?: 'info' | 'success' | 'warning' | 'error'): void
  (e: 'pick-asset', type: string, callback: (asset: any) => void, keepOpen?: boolean): void
}>()

// 简化版状态提示：从父组件注入或使用 emit
function setStatus(msg: string) { emit('status', msg) }
function openAssetPicker(type: string, callback: (asset: any) => void, keepOpen = false) {
  emit('pick-asset', type, callback, keepOpen)
}

// 资源库保存函数
const { saveToLibrary } = useLibrarySaver()

// 图片处理子模块标签
const mtTabs = [
  { key: 'crop', labelKey: 'imageCropTab' },
  { key: 'matting', labelKey: 'imageMattingTab' },
]

// ==================== AI MATTING / CROP ====================

const mt = reactive({

  sourceUrl: '',        // 原图数据 URL

  tab: 'crop', // 顶层模块：图片裁剪 / 图片抠图

  cropSubMode: 'grid' as 'grid' | 'manual', // 裁剪子模式：网格 / 手动框选

  gridSize: 3,            // 网格列数

  selectedCells: [] as { col: number; row: number }[], // 网格裁剪已选中的格子列表

  selCol: 1,              // 网格选中列

  selRow: 1,              // 网格选中行

  cropX: 0,               // 手动选区左上角 X

  cropY: 0,               // 手动选区左上角 Y

  cropW: 0,               // 手动选区宽度

  cropH: 0,               // 手动选区高度

  isSelecting: false,     // 是否正在拖拽选区

  startX: 0,              // 拖拽起始 X

  startY: 0,              // 拖拽起始 Y

  resultUrl: '',          // 裁剪/抠图结果数据 URL

  zoom: 1,                // 抠图模式画布缩放

  panX: 0,                // 抠图模式画布平移 X

  panY: 0,                // 抠图模式画布平移 Y

  panning: false,         // 是否正在右键拖动平移

  panStartX: 0,           // 平移起始点 X（屏幕坐标）

  panStartY: 0,           // 平移起始点 Y（屏幕坐标）

  panOrigX: 0,            // 平移开始时的 panX

  panOrigY: 0,            // 平移开始时的 panY

  resultZoom: 1,          // 裁剪/抠图结果画布缩放

  resultPanX: 0,          // 抠图结果预览水平平移

  resultPanY: 0,          // 抠图结果预览垂直平移

  resultPanning: false,   // 是否正在平移结果预览

  resultPanStartX: 0,     // 平移起始鼠标 X

  resultPanStartY: 0,     // 平移起始鼠标 Y

  resultPanOrigX: 0,      // 平移起始结果 X

  resultPanOrigY: 0,      // 平移起始结果 Y

  // 抠图模式参数

  mattingKey: '#00ff00',

  mattingTolerance: 30,

  mattingFeather: 2,

  mattingEdge: 0,

  mattingClusters: 4,

  mattingSubMode: 'flood' as 'flood' | 'global' | 'smart',

})

const mtSourceCanvas = ref<HTMLCanvasElement | null>(null) // 源图画布引用

const mtResultCanvas = ref<HTMLCanvasElement | null>(null) // 结果画布引用

const mtSourceImageData = ref<ImageData | null>(null) // 抠图模式原始像素数据

// 手动裁剪框显示度量（画布内部像素 → 容器内显示像素）

const mtCropMetrics = reactive({ scale: 1, offsetX: 0, offsetY: 0 })

const mtCropStyleOverlay = computed(() => {

  if (mt.tab !== 'crop' || mt.cropSubMode !== 'manual' || mt.cropW <= 0) return { display: 'none' }

  return {

    display: 'block',

    left: mtCropMetrics.offsetX + mt.cropX * mtCropMetrics.scale + 'px',

    top: mtCropMetrics.offsetY + mt.cropY * mtCropMetrics.scale + 'px',

    width: mt.cropW * mtCropMetrics.scale + 'px',

    height: mt.cropH * mtCropMetrics.scale + 'px',

  }

})

// mtGridSelections: 保留兼容旧代码（已不再使用，由 canvas 绘制替代）

const mtGridSelections = reactive<{ col: number; row: number }[]>([])



// 加载图片到抠图功能（严格限制为图片类型）

async function loadMtImage(files: FileList) {

  const file = files[0]; if (!file) return // 没有文件则直接返回

  if (!file.type.startsWith('image/')) { emit('toast', '请选择图片文件', 'warning'); return } // 非图片类型拒绝加载

  mt.sourceUrl = await fileToDataUrl(file) // 转为 Data URL

  mt.selectedCells = [] // 新图片清空网格选中状态

  mt.resultUrl = '' // 清空旧结果

  await nextTick() // 等待 DOM 更新

  initMtSource() // 初始化源图画布

}



// 从资源库导入图片到抠图/裁剪模块

function importMtFromLibrary() {

  openAssetPicker('image', async (asset) => {

    mt.sourceUrl = asset.dataUrl

    mt.selectedCells = []

    mt.resultUrl = ''

    await nextTick()

    initMtSource()

    setStatus(t('assetImported'))

  })

}



// 初始化源图画布：绘制原图、网格或选区

async function initMtSource() {

  const c = mtSourceCanvas.value // 获取源画布

  if (!c || !mt.sourceUrl) return // 未加载则返回

  const img = await loadImage(mt.sourceUrl) // 加载图片对象

  c.width = img.naturalWidth // 设置画布宽度为图片宽度

  c.height = img.naturalHeight // 设置画布高度为图片高度

  const ctx = c.getContext('2d') // 获取 2D 上下文

  if (!ctx) return // 获取失败则返回

  ctx.clearRect(0, 0, c.width, c.height) // 清空画布

  ctx.drawImage(img, 0, 0) // 绘制原图

  // 抠图模式缓存原始像素数据，供左键取色与实时抠图使用

  if (mt.tab === 'matting') {

    mtSourceImageData.value = ctx.getImageData(0, 0, c.width, c.height)

    // 抠图模式：默认让图片完整显示在容器内，初始缩放为 1（CSS max-width/height 会自适应）

    mt.zoom = 1; mt.panX = 0; mt.panY = 0

  }

  if (mt.tab === 'crop' && mt.cropSubMode === 'grid') { drawMtGrid(ctx, c.width, c.height) } // 网格模式绘制网格线与选中高亮

  drawMtOverlay(ctx) // 绘制选区高亮覆盖层

  updateMtCropMetrics() // 更新手动裁剪框显示度量

}



// 计算手动裁剪框在容器内的显示位置（canvas 内部像素 → 容器 CSS 像素）

function updateMtCropMetrics() {

  const c = mtSourceCanvas.value

  if (!c) return

  const rect = c.getBoundingClientRect()

  const container = c.parentElement

  if (!container) return

  const contRect = container.getBoundingClientRect()

  mtCropMetrics.scale = rect.width / c.width

  mtCropMetrics.offsetX = rect.left - contRect.left

  mtCropMetrics.offsetY = rect.top - contRect.top

}



// 从画布指定坐标取色，返回十六进制颜色字符串

function pickMtColor(canvas: HTMLCanvasElement, x: number, y: number): string | null {

  const ctx = canvas.getContext('2d') // 获取 2D 上下文

  if (!ctx) return null // 获取失败则返回 null

  const pixel = ctx.getImageData(x, y, 1, 1).data // 读取单像素数据

  // 将 RGB 值转为十六进制颜色字符串

  return '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('')

}



let mtCropResizing = false

function startMtCropResize(_e: MouseEvent, dir: string) {

  mtCropResizing = true

  const c = mtSourceCanvas.value; if (!c) return

  const onMove = (ev: MouseEvent) => {

    if (!mtCropResizing) return

    const container = c.parentElement; if (!container) return

    const contRect = container.getBoundingClientRect()

    const mx = (ev.clientX - contRect.left - mtCropMetrics.offsetX) / mtCropMetrics.scale

    const my = (ev.clientY - contRect.top - mtCropMetrics.offsetY) / mtCropMetrics.scale

    const cw = c.width; const ch = c.height

    if (dir.includes('e')) mt.cropW = Math.max(10, Math.min(mx, cw) - mt.cropX)

    if (dir.includes('w')) { const newX = Math.max(0, Math.min(mx, mt.cropX + mt.cropW - 10)); mt.cropW = mt.cropX + mt.cropW - newX; mt.cropX = newX }

    if (dir.includes('s')) mt.cropH = Math.max(10, Math.min(my, ch) - mt.cropY)

    if (dir.includes('n')) { const newY = Math.max(0, Math.min(my, mt.cropY + mt.cropH - 10)); mt.cropH = mt.cropY + mt.cropH - newY; mt.cropY = newY }

    initMtSource()

  }

  const onUp = () => { mtCropResizing = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }

  document.addEventListener('mousemove', onMove)

  document.addEventListener('mouseup', onUp)

}



// 在画布上绘制网格线，并高亮显示已选中的格子

function drawMtGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {

  const n = mt.gridSize // 获取网格列数

  if (n < 1) return // 列数无效则直接返回

  const cw = w / n // 单个格子宽度

  const ch = h / n // 单个格子高度（保持正方形网格）

  ctx.strokeStyle = 'rgba(0, 212, 170, 0.6)' // 网格线颜色

  ctx.lineWidth = 1 // 线宽

  // 绘制垂直线

  for (let i = 1; i < n; i++) {

    ctx.beginPath()

    ctx.moveTo(cw * i, 0)

    ctx.lineTo(cw * i, h)

    ctx.stroke()

  }

  // 绘制水平线

  for (let i = 1; i < n; i++) {

    ctx.beginPath()

    ctx.moveTo(0, ch * i)

    ctx.lineTo(w, ch * i)

    ctx.stroke()

  }

  // 高亮已选中的格子

  ctx.fillStyle = 'rgba(0, 212, 170, 0.25)' // 选中格子的填充颜色

  for (const cell of mt.selectedCells) {

    const x = cell.col * cw

    const y = cell.row * ch

    ctx.fillRect(x, y, cw, ch)

  }

}



// 根据选中的网格格子计算整体裁剪区域

function updateGridCropArea() {

  const c = mtSourceCanvas.value

  if (!c || !mt.selectedCells.length) return

  const n = mt.gridSize

  const cw = c.width / n

  const ch = c.height / n

  const minCol = Math.min(...mt.selectedCells.map(c => c.col))

  const maxCol = Math.max(...mt.selectedCells.map(c => c.col))

  const minRow = Math.min(...mt.selectedCells.map(c => c.row))

  const maxRow = Math.max(...mt.selectedCells.map(c => c.row))

  mt.cropX = minCol * cw

  mt.cropY = minRow * ch

  mt.cropW = (maxCol - minCol + 1) * cw

  mt.cropH = (maxRow - minRow + 1) * ch

}



// 绘制选区高亮覆盖层

function drawMtOverlay(ctx: CanvasRenderingContext2D) {

  const c = mtSourceCanvas.value // 获取画布

  if (!c) return // 未获取则返回

  if (mt.tab === 'crop' && mt.cropSubMode === 'manual' && mt.cropW > 0 && mt.cropH > 0) { // 手动模式高亮矩形选区

    ctx.fillStyle = 'rgba(0, 212, 170, 0.25)' // 半透明填充

    ctx.fillRect(mt.cropX, mt.cropY, mt.cropW, mt.cropH) // 填充选区

    ctx.strokeStyle = '#00d4aa' // 选区边框色

    ctx.lineWidth = 2 // 边框宽度

    ctx.strokeRect(mt.cropX, mt.cropY, mt.cropW, mt.cropH) // 绘制选区边框

  }

}



// 处理鼠标按下事件：网格点击或手动拖拽起始

function onMtMouseDown(e: MouseEvent) {

  if (e.button === 1) { // 中键：回归默认大小与位置

    e.preventDefault()

    mt.zoom = 1; mt.panX = 0; mt.panY = 0

    mt.resultZoom = 1; mt.resultPanX = 0; mt.resultPanY = 0

    return

  }

  // 右键开始拖动平移画布（抠图模式）

  if (e.button === 2 && mt.tab === 'matting') {

    mt.panning = true

    mt.panStartX = e.clientX

    mt.panStartY = e.clientY

    mt.panOrigX = mt.panX

    mt.panOrigY = mt.panY

    return

  }

  // 左键：取色抠图或裁剪选区

  if (e.button !== 0) return

  const c = mtSourceCanvas.value

  if (!c) return

  const rect = c.getBoundingClientRect()

  const scaleX = c.width / rect.width

  const scaleY = c.height / rect.height

  const x = (e.clientX - rect.left) * scaleX

  const y = (e.clientY - rect.top) * scaleY

  if (mt.tab === 'matting') {

    // 抠图模式：按住 ALT 取色并实时抠图

    if (e.altKey) {

      const color = pickMtColor(c, Math.round(x), Math.round(y))

      if (color) { mt.mattingKey = color; applyMtMattingPreview() }

    }

    return

  }

  if (mt.tab === 'crop' && mt.cropSubMode === 'grid') {

    const n = mt.gridSize

    const cw = c.width / n

    const ch = c.height / n

    const selCol = Math.min(n - 1, Math.max(0, Math.floor(x / cw)))

    const selRow = Math.min(n - 1, Math.max(0, Math.floor(y / ch)))

    const clicked = { col: selCol, row: selRow }

    // 若按住 Shift 则连续多选，否则单选

    if (e.shiftKey && mt.selectedCells.length) {

      // 以最后一个选中格子为起点，矩形范围连续选择

      const last = mt.selectedCells[mt.selectedCells.length - 1]

      const minCol = Math.min(last.col, clicked.col)

      const maxCol = Math.max(last.col, clicked.col)

      const minRow = Math.min(last.row, clicked.row)

      const maxRow = Math.max(last.row, clicked.row)

      for (let r = minRow; r <= maxRow; r++) {

        for (let col = minCol; col <= maxCol; col++) {

          if (!mt.selectedCells.some(c => c.col === col && c.row === r)) {

            mt.selectedCells.push({ col, row: r })

          }

        }

      }

    } else {

      mt.selectedCells = [clicked] // 单选模式

    }

    // 根据选中格子更新裁剪区域

    updateGridCropArea()

    initMtSource()

  } else if (mt.tab === 'crop' && mt.cropSubMode === 'manual') {

    mt.isSelecting = true

    mt.startX = x; mt.startY = y

    mt.cropX = x; mt.cropY = y

    mt.cropW = 0; mt.cropH = 0

  }

}



function onMtMouseMove(e: MouseEvent) {

  // 右键拖动平移（抠图模式）

  if (mt.panning) {

    mt.panX = mt.panOrigX + (e.clientX - mt.panStartX)

    mt.panY = mt.panOrigY + (e.clientY - mt.panStartY)

    return

  }

  if (!mt.isSelecting || mt.tab !== 'crop' || mt.cropSubMode !== 'manual') return

  const c = mtSourceCanvas.value; if (!c) return

  const rect = c.getBoundingClientRect()

  const scaleX = c.width / rect.width

  const scaleY = c.height / rect.height

  const x = (e.clientX - rect.left) * scaleX

  const y = (e.clientY - rect.top) * scaleY

  mt.cropX = Math.min(mt.startX, x)

  mt.cropY = Math.min(mt.startY, y)

  mt.cropW = Math.abs(x - mt.startX)

  mt.cropH = Math.abs(y - mt.startY)

  initMtSource()

}



// 处理鼠标释放事件：结束手动选取

function onMtMouseUp(_e: MouseEvent) {

  if (mt.panning) { mt.panning = false; return }

  mt.isSelecting = false // 标记选取结束

}



// 抠图模式滚轮缩放画布

function onMtWheel(e: WheelEvent) {

  if (mt.tab !== 'matting') return

  e.preventDefault()

  const delta = e.deltaY > 0 ? -0.5 : 0.5

  mt.zoom = Math.max(1, Math.min(10, mt.zoom + delta))

}

// 抠图结果预览区：鼠标滚轮缩放

function onMtResultWheel(e: WheelEvent) {

  if (!mt.resultUrl) return

  e.preventDefault()

  const delta = e.deltaY > 0 ? -0.2 : 0.2 // 向下滚缩小，向上滚放大

  mt.resultZoom = Math.max(0.2, Math.min(10, mt.resultZoom + delta)) // 限制缩放范围 0.2x~10x

}

// 抠图结果预览区：右键拖拽平移画布

function onMtResultMouseDown(e: MouseEvent) {

  if (e.button === 1) { // 中键：回归默认大小与位置

    e.preventDefault()

    mt.resultZoom = 1; mt.resultPanX = 0; mt.resultPanY = 0

    return

  }

  if (e.button !== 2 || !mt.resultUrl) return // 仅右键且已有结果时生效

  mt.resultPanning = true // 标记开始平移

  mt.resultPanStartX = e.clientX // 记录起始鼠标位置

  mt.resultPanStartY = e.clientY

  mt.resultPanOrigX = mt.resultPanX // 记录起始平移量

  mt.resultPanOrigY = mt.resultPanY

}

function onMtResultMouseMove(e: MouseEvent) {

  if (!mt.resultPanning) return // 未平移则返回

  mt.resultPanX = mt.resultPanOrigX + (e.clientX - mt.resultPanStartX) // 更新水平平移

  mt.resultPanY = mt.resultPanOrigY + (e.clientY - mt.resultPanStartY) // 更新垂直平移

}

function onMtResultMouseUp(_e: MouseEvent) {

  mt.resultPanning = false // 结束平移

}



// 应用裁剪：根据当前模式生成结果

async function applyMtCrop() {

  // 抠图模式使用抠图逻辑

  if (mt.tab === 'matting') { await applyMtMattingPreview(); setStatus(t('cropDone')); return }

  const c = mtSourceCanvas.value // 获取源画布

  if (!c || !mt.sourceUrl) return // 没有源图则返回

  const img = await loadImage(mt.sourceUrl) // 加载原图

  const w = img.naturalWidth // 原图宽度

  const h = img.naturalHeight // 原图高度

  let x = 0, y = 0, cw = w, ch = h // 默认裁剪全图

  let cellW = 0, cellH = 0 // 网格模式单个格子宽高

  if (mt.cropSubMode === 'grid') { // 网格模式：按选中格子计算区域

    cellW = w / mt.gridSize // 单个格子宽

    cellH = h / mt.gridSize // 单个格子高

    if (mt.selectedCells.length === 0) return // 未选择格子则不裁剪

    // 计算所有选中格子的包围盒

    const minCol = Math.min(...mt.selectedCells.map(c => c.col))

    const maxCol = Math.max(...mt.selectedCells.map(c => c.col))

    const minRow = Math.min(...mt.selectedCells.map(c => c.row))

    const maxRow = Math.max(...mt.selectedCells.map(c => c.row))

    x = Math.floor(minCol * cellW) // 左上角 X

    y = Math.floor(minRow * cellH) // 左上角 Y

    cw = Math.floor((maxCol - minCol + 1) * cellW) // 裁剪宽度

    ch = Math.floor((maxRow - minRow + 1) * cellH) // 裁剪高度

  } else { // 手动模式：使用拖拽选区

    x = Math.floor(mt.cropX) // 左上角 X

    y = Math.floor(mt.cropY) // 左上角 Y

    cw = Math.floor(mt.cropW) // 裁剪宽度

    ch = Math.floor(mt.cropH) // 裁剪高度

  }

  cw = Math.max(1, Math.min(cw, w - x)) // 限制宽度在有效范围

  ch = Math.max(1, Math.min(ch, h - y)) // 限制高度在有效范围

  const rc = mtResultCanvas.value // 获取结果画布

  if (!rc) return // 未获取则返回

  rc.width = cw // 设置结果画布宽度

  rc.height = ch // 设置结果画布高度

  const rctx = rc.getContext('2d') // 获取结果画布上下文

  if (!rctx) return // 获取失败则返回

  rctx.clearRect(0, 0, cw, ch) // 清空结果画布

  if (mt.cropSubMode === 'grid') {

    // 网格模式：逐个绘制选中格子的内容，未选中格子保持透明

    for (const cell of mt.selectedCells) {

      const sx = Math.floor(cell.col * cellW)

      const sy = Math.floor(cell.row * cellH)

      const scw = Math.floor(cellW)

      const sch = Math.floor(cellH)

      rctx.drawImage(img, sx, sy, scw, sch, sx - x, sy - y, scw, sch)

    }

  } else {

    rctx.drawImage(img, x, y, cw, ch, 0, 0, cw, ch) // 绘制裁剪区域

  }

  mt.resultUrl = rc.toDataURL('image/png') // 生成结果 Data URL

  setStatus(t('cropDone')) // 更新状态文本

}



// 重置裁剪状态和结果

function resetMtCrop() {

  mt.selCol = 1; mt.selRow = 1

  mt.cropX = 0; mt.cropY = 0; mt.cropW = 0; mt.cropH = 0

  mt.resultUrl = ''

  mt.zoom = 1; mt.panX = 0; mt.panY = 0; mt.resultZoom = 1; mt.resultPanX = 0; mt.resultPanY = 0

  mt.selectedCells = [] // 清空网格裁剪选中的格子

  mtGridSelections.splice(0, mtGridSelections.length)

  initMtSource()

}



// 模式切换时重置状态并重绘源画布

function onMtModeChange() {

  mt.resultUrl = ''

  mt.selCol = 1; mt.selRow = 1

  mt.cropX = 0; mt.cropY = 0; mt.cropW = 0; mt.cropH = 0

  mt.zoom = 1; mt.panX = 0; mt.panY = 0; mt.resultZoom = 1; mt.resultPanX = 0; mt.resultPanY = 0

  if (mt.tab !== 'crop' || mt.cropSubMode !== 'grid') { mt.selectedCells = [] } // 离开网格模式时清空选中

  if (mt.tab === 'matting') {

    nextTick(() => { initMtSource(); applyMtMattingPreview() })

  } else {

    nextTick(initMtSource)

  }

}



// 抠图模式预览：对源图应用抠图参数，结果显示在右侧

async function applyMtMattingPreview() {

  if (mt.tab !== 'matting' || !mt.sourceUrl) return

  let orig = mtSourceImageData.value

  if (!orig) {

    const img = await loadImage(mt.sourceUrl)

    const tmpC = document.createElement('canvas')

    tmpC.width = img.naturalWidth; tmpC.height = img.naturalHeight

    const tmpCtx = tmpC.getContext('2d')!

    tmpCtx.drawImage(img, 0, 0)

    orig = tmpCtx.getImageData(0, 0, tmpC.width, tmpC.height)

    mtSourceImageData.value = orig

  }

  const out = applyMattingParams(orig, {

    mode: mt.mattingSubMode,

    key: mt.mattingKey,

    tolerance: mt.mattingTolerance,

    feather: mt.mattingFeather,

    edge: mt.mattingEdge,

    clusters: mt.mattingClusters,

    brightness: 0, contrast: 0, saturation: 0,

  })

  const rc = mtResultCanvas.value

  if (rc) {

    rc.width = orig.width; rc.height = orig.height

    const rctx = rc.getContext('2d')!

    rctx.putImageData(out, 0, 0)

    mt.resultUrl = rc.toDataURL('image/png')

  }

}



// 下载裁剪/抠图结果

function downloadMtResult() {

  if (!mt.resultUrl) return

  downloadUrl(mt.resultUrl, 'crop_result.png')

}



// ==================== MEDIA VIDEO PROCESS ====================
</script>

<template>
<div class="space-y-3">
                <!-- 图片处理：裁剪模式与抠图模式 -->

                <div class="space-y-3">

                  <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                    <!-- 图片处理子模块标签：对齐视频处理的标签样式 -->

                    <div class="flex gap-2 mb-3 flex-wrap">

                      <button v-for="tb in mtTabs" :key="tb.key" class="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors" :class="mt.tab === tb.key ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'bg-af-surface border-af-rule text-af-muted hover:text-af-ink hover:border-af-ink/30'" @click="mt.tab = tb.key; onMtModeChange()">{{ t(tb.labelKey) }}</button>

                    </div>

                    <div class="form-row">

                      <div v-if="mt.tab === 'crop'" class="form-group">

                        <label class="form-label">{{ t('cropSubMode') }}</label>

                        <select v-model="mt.cropSubMode" class="form-select" @change="initMtSource">

                          <option value="grid">{{ t('cropGrid') }}</option>

                          <option value="manual">{{ t('cropManual') }}</option>

                        </select>

                      </div>

                      <div v-if="mt.tab === 'crop' && mt.cropSubMode === 'grid'" class="form-group">

                        <label class="form-label">{{ t('gridCols') }}</label>

                        <input v-model.number="mt.gridSize" type="number" min="1" max="20" class="form-input" @change="initMtSource" />

                        <div class="text-[11px] text-af-muted mt-1.5">{{ t('gridShiftHint') }}</div>

                      </div>

                    </div>

                    <div class="flex gap-3 flex-wrap min-h-[320px] mt-3">

                      <div class="flex-1 min-w-[260px] flex flex-col">

                        <div class="panel-title">{{ mt.tab === 'matting' ? t('mattingSource') : t('originalImage') }}</div>

                        <!-- 抠图模式：无 object-contain，原始尺寸展示 + 溢出滚动；裁剪模式：object-contain 自适应 -->

                        <div class="preview-box h-[400px] relative overflow-auto" @wheel.prevent="onMtWheel" @contextmenu.prevent @mousedown="onMtMouseDown" @mousemove="onMtMouseMove" @mouseup="onMtMouseUp" @mouseleave="onMtMouseUp">

                          <UploadZone v-if="!mt.sourceUrl" accept="image/*" :prompt="t('uploadCropImage')" class="w-[90%] h-[90%]" @files="loadMtImage($event)" />

                          <canvas v-else ref="mtSourceCanvas" class="object-contain image-pixelated" :class="mt.tab === 'matting' ? 'cursor-crosshair' : 'cursor-crosshair'" :style="mt.tab === 'matting' ? { transform: `translate(${mt.panX}px, ${mt.panY}px) scale(${mt.zoom})`, transformOrigin: 'center center', maxWidth: 'none', maxHeight: 'none' } : { maxWidth: '100%', maxHeight: '100%' }" ></canvas>

                          <!-- 手动框选裁剪框：四角拖拽手柄，对齐视频裁剪 -->

                          <div v-if="mt.tab==='crop' && mt.cropSubMode==='manual' && mt.cropW>0" class="absolute border-2 border-af-accent pointer-events-none" :style="mtCropStyleOverlay">

                            <div class="absolute -top-1.5 -left-1.5 w-3 h-3 bg-af-accent cursor-nw-resize pointer-events-auto" @mousedown.stop="startMtCropResize($event,'nw')"></div>

                            <div class="absolute -top-1.5 -right-1.5 w-3 h-3 bg-af-accent cursor-ne-resize pointer-events-auto" @mousedown.stop="startMtCropResize($event,'ne')"></div>

                            <div class="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-af-accent cursor-sw-resize pointer-events-auto" @mousedown.stop="startMtCropResize($event,'sw')"></div>

                            <div class="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-af-accent cursor-se-resize pointer-events-auto" @mousedown.stop="startMtCropResize($event,'se')"></div>

                          </div>

                        </div>

                        <div v-if="mt.tab === 'crop' && mt.cropSubMode === 'grid' && mt.sourceUrl" class="text-xs text-af-muted mt-1.5">{{ t('selectCropArea') }}</div>

                        <div v-if="mt.tab === 'matting' && mt.sourceUrl" class="text-xs text-af-muted mt-1.5">{{ t('mattingPickHint') }} | {{ t('zoom') }} {{ mt.zoom }}x</div>

                        <button v-if="!mt.sourceUrl" class="btn-secondary btn-sm mt-3 self-start" @click="importMtFromLibrary">{{ t('importFromLibrary') }}</button>

                      </div>

                      <div class="flex-1 min-w-[260px]">

                        <div class="panel-title">{{ mt.tab === 'matting' ? t('mattingResult') : t('cropResult') }}</div>

                        <div class="preview-box h-[400px] flex items-center justify-center relative overflow-hidden" @wheel.prevent="onMtResultWheel" @contextmenu.prevent @mousedown="onMtResultMouseDown" @mousemove="onMtResultMouseMove" @mouseup="onMtResultMouseUp" @mouseleave="onMtResultMouseUp">

                          <canvas v-show="mt.resultUrl" ref="mtResultCanvas" class="object-contain image-pixelated" :style="{ transform: `translate(${mt.resultPanX}px, ${mt.resultPanY}px) scale(${mt.resultZoom})`, transformOrigin: 'center center', maxWidth: 'none', maxHeight: 'none' }"></canvas>

                          <span v-show="!mt.resultUrl" class="text-af-muted text-sm absolute">{{ mt.tab === 'matting' ? t('mattingClickHint') : t('processingResult') }}</span>

                        </div>

                      </div>

                    </div>

                    <!-- 抠图模式参数面板 -->

                    <div v-if="mt.tab === 'matting' && mt.sourceUrl" class="bg-af-bg border border-af-rule rounded-lg p-3.5 mt-3">

                      <div class="panel-title">{{ t('mattingMode') }}</div>

                      <select v-model="mt.mattingSubMode" class="form-select mb-3" @change="applyMtMattingPreview">

                        <option value="flood">{{ t('mattingFlood') }}</option>

                        <option value="global">{{ t('mattingGlobal') }}</option>

                        <option value="smart">{{ t('mattingSmart') }}</option>

                      </select>

                      <div class="form-row">

                        <div class="form-group"><label class="form-label">{{ t('keyColor') }}</label><div class="flex items-center gap-2"><input v-model="mt.mattingKey" type="color" class="w-10 h-10 rounded-md border-0 cursor-pointer bg-transparent" @change="applyMtMattingPreview"><span class="font-mono text-[12px] text-af-muted">{{ mt.mattingKey }}</span></div></div>

                        <div class="form-group"><label class="form-label">{{ t('tolerance') }} {{ mt.mattingTolerance }}</label><input v-model.number="mt.mattingTolerance" type="range" min="0" max="120" class="w-full accent-af-accent h-1" @change="applyMtMattingPreview"></div>

                        <div class="form-group"><label class="form-label">{{ t('feather') }} {{ mt.mattingFeather }}</label><input v-model.number="mt.mattingFeather" type="range" min="0" max="20" class="w-full accent-af-accent h-1" @change="applyMtMattingPreview"></div>

                        <div class="form-group"><label class="form-label">{{ t('edgeErosion') }} {{ mt.mattingEdge }}</label><input v-model.number="mt.mattingEdge" type="range" min="-10" max="10" class="w-full accent-af-accent h-1" @change="applyMtMattingPreview"></div>

                        <div v-if="mt.mattingSubMode === 'smart'" class="form-group"><label class="form-label">{{ t('clusters') }}</label><input v-model.number="mt.mattingClusters" type="number" min="2" max="16" class="form-input" @change="applyMtMattingPreview"></div>

                      </div>

                    </div>

                    <div class="flex gap-2 flex-wrap mt-3">

                      <button class="btn-primary" :disabled="!mt.sourceUrl" @click="applyMtCrop">{{ mt.tab === 'matting' ? t('mattingApply') : t('cropApply') }}</button>

                      <button class="btn-secondary" :disabled="!mt.resultUrl" @click="downloadMtResult">{{ t('cropDownload') }}</button>

                      <button class="btn-secondary" :disabled="!mt.sourceUrl" @click="resetMtCrop">{{ t('cropReset') }}</button>

                      <button v-if="mt.resultUrl" class="btn-secondary" @click="saveToLibrary(mt.resultUrl, 'output')">{{ t('saveToLibrary') }}</button>

                    </div>

                  </div>

                </div>
</div>
</template>

<style scoped>
/* 页面级局部样式，优先使用 Tailwind */
</style>
