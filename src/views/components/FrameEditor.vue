<script setup lang="ts">
// 帧编辑器共享组件：对序列帧进行抠图、调色与手动擦除
// 核心设计：抠图和水印是可叠加的流水线，不是互斥操作
// 流水线顺序：原始图 → 抠图参数 → 水印区域擦除 → 最终结果

import { ref, reactive, computed, nextTick, watch, inject, onMounted, onUnmounted } from 'vue'

import { applyMattingParams, type MattingParams } from '../../utils/matting'

import { loadImage, downloadUrl } from '../../utils/export'

// 帧项结构
// mattingParams / erasedRegions：每帧持久化的处理参数，用于跨会话恢复流水线状态
interface ErasedRegion { x: number; y: number; w: number; h: number }
interface FrameItem {
  url: string
  selected: boolean
  similarGroup: number
  originalUrl?: string
  mattingParams?: MattingParams | null  // 该帧已应用的抠图参数（null=未抠图）
  erasedRegions?: ErasedRegion[]          // 该帧已应用的水印擦除区域
}

const props = defineProps<{ modelValue: FrameItem[] }>()

const emit = defineEmits<{
  (e: 'update:modelValue', frames: FrameItem[]): void
  (e: 'toast', text: string, type?: 'info' | 'success' | 'warning' | 'error'): void
  (e: 'loading', open: boolean, text?: string): void
  (e: 'status', msg: string): void
}>()

const t = inject<(key: string) => string>('t', (key) => key)

// 当前帧数组（只读，更新时通过 emit）
const frames = computed(() => props.modelValue)

const frameEditorOpen = ref(false)
const frameEditorIndex = ref(0)
const frameEditorImage = ref('')
const frameEditorDirty = ref(false)
const frameEditorZoom = ref(1)
const frameEditorCanvas = ref<HTMLCanvasElement | null>(null)

// frameEditorOriginal：当前帧的基底图像数据（不可变，每次渲染时复制）
// 保存后会更新为画布状态（已包含所有效果），作为新的基底
const frameEditorOriginal = ref<ImageData | null>(null)
const frameEditorOriginalUrl = ref('')

const DEFAULT_FRAME_EDITOR_PARAMS: MattingParams = {
  mode: 'flood', key: '#00ff00', tolerance: 30, feather: 2, edge: 0, clusters: 4,
  brightness: 0, contrast: 0, saturation: 0,
}

const frameEditorParams = reactive<MattingParams>({ ...DEFAULT_FRAME_EDITOR_PARAMS })

// 流水线状态追踪
// hasMatting：用户是否已启用抠图（调整过参数或选择了抠图模式）
// lastMattingMode：切换到水印模式前保留的抠图模式，用于在水印模式下仍应用抠图
const hasMatting = ref(false)
const lastMattingMode = ref<'flood' | 'global' | 'smart'>('flood')

const frameEditorSize = computed(() => {
  const orig = frameEditorOriginal.value
  if (!orig) return '-'
  return orig.width + 'x' + orig.height
})

const frameEditorMax = computed(() => frames.value.length)

// 手动框选工具状态
const frameEditorTool = ref<'none' | 'manual'>('none')
const frameEditorSelecting = ref(false)
const frameEditorSelStart = reactive({ x: 0, y: 0 })
const frameEditorSelEnd = reactive({ x: 0, y: 0 })
const frameEditorErasedRegions = ref<{ x: number; y: number; w: number; h: number }[]>([])

// 保存反馈状态：点击保存后短暂高亮按钮
const savedFlash = ref(false)

// 撤销栈：记录编辑器完整状态快照，Ctrl+Z 时弹出恢复
interface EditorSnapshot {
  original: ImageData
  params: MattingParams
  erasedRegions: { x: number; y: number; w: number; h: number }[]
  hasMatting: boolean
  lastMattingMode: 'flood' | 'global' | 'smart'
}
const undoStack = ref<EditorSnapshot[]>([])
const MAX_UNDO = 30 // 最多保留 30 步历史

// 推入撤销快照：在每次修改性操作前调用
function pushUndoSnapshot() {
  const orig = frameEditorOriginal.value
  if (!orig) return
  undoStack.value.push({
    original: new ImageData(new Uint8ClampedArray(orig.data), orig.width, orig.height),
    params: { ...frameEditorParams },
    erasedRegions: frameEditorErasedRegions.value.map(r => ({ ...r })),
    hasMatting: hasMatting.value,
    lastMattingMode: lastMattingMode.value,
  })
  // 超出上限时丢弃最早的记录
  if (undoStack.value.length > MAX_UNDO) undoStack.value.shift()
}

// 撤销：弹出最近一次快照并恢复
function undo() {
  const snap = undoStack.value.pop()
  if (!snap) {
    emit('toast', t('noUndoHistory'), 'info')
    return
  }
  frameEditorOriginal.value = snap.original
  Object.assign(frameEditorParams, snap.params)
  frameEditorErasedRegions.value = snap.erasedRegions.map(r => ({ ...r }))
  hasMatting.value = snap.hasMatting
  lastMattingMode.value = snap.lastMattingMode
  updateFrameEditorPreview()
  frameEditorDirty.value = true
  emit('toast', t('undoDone'), 'info')
}

// Ctrl+Z 键盘监听
function onKeydown(e: KeyboardEvent) {
  if (!frameEditorOpen.value) return
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

/**
 * 渲染流水线核心：将基底图 → 抠图 → 水印擦除 → 输出到 canvas
 * 不调用 toDataURL，供 drawFrameEditorSelection 复用
 */
function renderToCanvas(): ImageData | null {
  const c = frameEditorCanvas.value
  const orig = frameEditorOriginal.value
  if (!c || !orig) return null
  const ctx = c.getContext('2d')!

  // 第一步：抠图（若已启用）
  let result: ImageData
  if (hasMatting.value) {
    // 水印模式下使用之前保存的抠图模式，保持抠图效果不丢失
    const effectiveParams = { ...frameEditorParams }
    if (frameEditorParams.mode === 'watermark') {
      effectiveParams.mode = lastMattingMode.value
    }
    result = applyMattingParams(orig, effectiveParams)
  } else {
    // 未启用抠图：复制原始数据
    result = new ImageData(new Uint8ClampedArray(orig.data), orig.width, orig.height)
  }

  // 第二步：水印区域擦除（叠加在抠图结果上）
  if (frameEditorErasedRegions.value.length > 0) {
    const data = result.data
    for (const r of frameEditorErasedRegions.value) {
      for (let py = r.y; py < Math.min(r.y + r.h, result.height); py++) {
        for (let px = r.x; px < Math.min(r.x + r.w, result.width); px++) {
          const idx = (py * result.width + px) * 4
          data[idx + 3] = 0
        }
      }
    }
  }

  ctx.putImageData(result, 0, 0)
  return result
}

/**
 * 更新预览：渲染流水线并生成 dataURL
 */
function updateFrameEditorPreview() {
  const result = renderToCanvas()
  if (!result) return
  const c = frameEditorCanvas.value!
  frameEditorImage.value = c.toDataURL('image/png')
}

// 打开帧编辑器
// 从帧的 mattingParams / erasedRegions 元数据恢复流水线状态，确保跨会话一致
function openFrameEditor(i: number) {
  frameEditorIndex.value = i
  Object.assign(frameEditorParams, DEFAULT_FRAME_EDITOR_PARAMS)
  frameEditorErasedRegions.value = []
  frameEditorTool.value = 'none'
  frameEditorZoom.value = 1
  frameEditorDirty.value = false
  hasMatting.value = false
  lastMattingMode.value = 'flood'
  undoStack.value = [] // 切换帧时清空撤销栈

  // 优先加载当前 url（可能已被处理过），保留 originalUrl 用于"还原"功能
  const currentFrame = frames.value[i]
  frameEditorOriginalUrl.value = currentFrame?.originalUrl || currentFrame?.url || ''
  frameEditorImage.value = currentFrame?.url || ''

  // 恢复该帧已保存的处理参数：抠图参数 + 水印区域
  if (currentFrame?.mattingParams) {
    Object.assign(frameEditorParams, currentFrame.mattingParams)
    hasMatting.value = true
    lastMattingMode.value = currentFrame.mattingParams.mode as 'flood' | 'global' | 'smart'
  }
  if (currentFrame?.erasedRegions && currentFrame.erasedRegions.length > 0) {
    frameEditorErasedRegions.value = currentFrame.erasedRegions.map(r => ({ ...r }))
  }

  frameEditorOpen.value = true
  nextTick(() => loadFrameEditorImage(frameEditorImage.value))
}

// 完全重置帧编辑器状态
function resetFrameEditor() {
  frameEditorOpen.value = false
  frameEditorIndex.value = 0
  frameEditorImage.value = ''
  frameEditorOriginalUrl.value = ''
  frameEditorOriginal.value = null
  Object.assign(frameEditorParams, DEFAULT_FRAME_EDITOR_PARAMS)
  frameEditorErasedRegions.value = []
  frameEditorTool.value = 'none'
  frameEditorSelecting.value = false
  frameEditorSelStart.x = 0; frameEditorSelStart.y = 0
  frameEditorSelEnd.x = 0; frameEditorSelEnd.y = 0
  frameEditorZoom.value = 1
  frameEditorDirty.value = false
  hasMatting.value = false
  lastMattingMode.value = 'flood'
  undoStack.value = [] // 重置时清空撤销栈
}

async function loadFrameEditorImage(url: string) {
  if (!url) return
  const img = await loadImage(url)
  const c = frameEditorCanvas.value
  if (!c) return
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  frameEditorOriginal.value = ctx.getImageData(0, 0, c.width, c.height)
  updateFrameEditorPreview()
}

// 构建当前帧的有效抠图参数快照（水印模式下用 lastMattingMode 替换 mode）
function buildEffectiveMattingParams(): MattingParams | null {
  if (!hasMatting.value) return null
  const p = { ...frameEditorParams }
  if (p.mode === 'watermark') p.mode = lastMattingMode.value
  return p
}

function saveFrameEditor() {
  const c = frameEditorCanvas.value
  if (!c || frameEditorIndex.value < 0) return
  const url = c.toDataURL('image/png')
  const updated = [...frames.value]

  // 保留 originalUrl：若不存在则用编辑前的原图 URL
  if (!updated[frameEditorIndex.value].originalUrl) {
    updated[frameEditorIndex.value] = { ...updated[frameEditorIndex.value], originalUrl: frameEditorOriginalUrl.value }
  }
  // 持久化当前帧的处理参数，供下次打开或"应用至全部"时恢复
  updated[frameEditorIndex.value] = {
    ...updated[frameEditorIndex.value],
    url,
    mattingParams: buildEffectiveMattingParams(),
    erasedRegions: frameEditorErasedRegions.value.map(r => ({ ...r })),
  }
  emit('update:modelValue', updated)

  // 更新编辑器内部状态：当前画布像素作为新的基底（已包含所有效果）
  frameEditorOriginal.value = c.getContext('2d')!.getImageData(0, 0, c.width, c.height)
  frameEditorImage.value = url
  frameEditorDirty.value = false

  // 保存成功视觉反馈
  savedFlash.value = true
  setTimeout(() => { savedFlash.value = false }, 1500)
  emit('toast', t('frameSaved'), 'success')
  emit('status', t('frameSaved'))
}

/**
 * 应用至所有选中帧：将当前帧的完整处理流水线（抠图参数 + 水印区域）应用到所有选中帧
 * 关键：使用当前帧已持久化的 mattingParams / erasedRegions，而非仅当前会话状态
 * 这样即使先抠图保存、再打开去水印，两次"应用至全部"也能叠加效果
 * 对每帧从其原始图开始，依次执行：抠图 → 水印擦除
 */
async function applyFrameEditorToAll() {
  emit('loading', true, t('processing'))

  const currentFrames = frames.value
  // 选中的帧索引；若无选中则使用当前编辑帧
  let selectedIndexes = currentFrames.map((f, i) => f.selected ? i : -1).filter(i => i >= 0)
  if (!selectedIndexes.length) {
    selectedIndexes = [frameEditorIndex.value]
  }

  const updated = [...currentFrames]

  // 先保存当前帧的画布状态和处理参数到 updated 数组
  const editorCanvas = frameEditorCanvas.value
  if (editorCanvas && frameEditorIndex.value >= 0) {
    const currentUrl = editorCanvas.toDataURL('image/png')
    if (!updated[frameEditorIndex.value].originalUrl) {
      updated[frameEditorIndex.value] = { ...updated[frameEditorIndex.value], originalUrl: frameEditorOriginalUrl.value }
    }
    updated[frameEditorIndex.value] = {
      ...updated[frameEditorIndex.value],
      url: currentUrl,
      mattingParams: buildEffectiveMattingParams(),
      erasedRegions: frameEditorErasedRegions.value.map(r => ({ ...r })),
    }
  }

  // 取当前帧的完整流水线快照（抠图参数 + 水印区域）
  const currentSnapshot = updated[frameEditorIndex.value]
  const mattingParams = currentSnapshot?.mattingParams || null
  const regions = currentSnapshot?.erasedRegions ? currentSnapshot.erasedRegions.map(r => ({ ...r })) : []

  // 对除当前帧外的所有选中帧应用完整流水线
  for (const i of selectedIndexes) {
    if (i === frameEditorIndex.value) continue

    // 使用原始图（未处理）作为基底，确保从干净状态重新应用完整流水线
    const origUrl = updated[i].originalUrl || updated[i].url
    const img = await loadImage(origUrl)
    const c = document.createElement('canvas')
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const orig = ctx.getImageData(0, 0, c.width, c.height)

    // 第一步：抠图（若当前帧已启用抠图）
    let result: ImageData
    if (mattingParams) {
      result = applyMattingParams(orig, mattingParams)
    } else {
      result = new ImageData(new Uint8ClampedArray(orig.data), orig.width, orig.height)
    }

    // 第二步：水印区域擦除
    if (regions.length > 0) {
      const data = result.data
      for (const r of regions) {
        for (let py = r.y; py < Math.min(r.y + r.h, result.height); py++) {
          for (let px = r.x; px < Math.min(r.x + r.w, result.width); px++) {
            const idx = (py * result.width + px) * 4
            data[idx + 3] = 0
          }
        }
      }
    }

    ctx.putImageData(result, 0, 0)

    // 保留 originalUrl，并同步当前帧的处理参数到目标帧
    const prevOriginalUrl = updated[i].originalUrl || origUrl
    updated[i] = {
      ...updated[i],
      originalUrl: prevOriginalUrl,
      url: c.toDataURL('image/png'),
      mattingParams: mattingParams ? { ...mattingParams } : null,
      erasedRegions: regions.map(r => ({ ...r })),
    }
  }

  // 一次性 emit 更新
  emit('update:modelValue', updated)

  // 同步编辑器内部状态
  frameEditorDirty.value = false
  savedFlash.value = true
  setTimeout(() => { savedFlash.value = false }, 1500)

  emit('loading', false)
  emit('toast', t('allFramesApplied'), 'success')
  emit('status', t('allFramesApplied'))
}

async function closeFrameEditor() {
  if (frameEditorDirty.value) {
    const ok = window.confirm(t('unsavedChanges'))
    if (!ok) return
  }
  frameEditorOpen.value = false
}

async function restoreFrameEditor() {
  if (!frameEditorOriginalUrl.value || frameEditorIndex.value < 0) return
  const updated = [...frames.value]
  // 还原时清空该帧的处理参数元数据
  updated[frameEditorIndex.value] = {
    ...updated[frameEditorIndex.value],
    url: frameEditorOriginalUrl.value,
    mattingParams: null,
    erasedRegions: [],
  }
  emit('update:modelValue', updated)
  frameEditorImage.value = frameEditorOriginalUrl.value
  // 还原时清空水印区域和抠图状态
  frameEditorErasedRegions.value = []
  hasMatting.value = false
  Object.assign(frameEditorParams, DEFAULT_FRAME_EDITOR_PARAMS)
  const img = await loadImage(frameEditorOriginalUrl.value)
  const c = frameEditorCanvas.value
  if (!c) return
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  frameEditorOriginal.value = ctx.getImageData(0, 0, c.width, c.height)
  updateFrameEditorPreview()
  emit('status', t('frameRestored'))
}

async function restoreAllFrames() {
  emit('loading', true, t('processing'))
  // 还原所有帧至原图，并清空处理参数元数据
  const updated = frames.value.map(f => f.originalUrl
    ? { ...f, url: f.originalUrl, mattingParams: null, erasedRegions: [] }
    : { ...f, mattingParams: null, erasedRegions: [] }
  )
  emit('update:modelValue', updated)
  emit('loading', false)
  emit('status', t('allFramesRestored'))
  if (frameEditorOpen.value) await restoreFrameEditor()
}

function onFrameEditorWheel(e: WheelEvent, key?: 'tolerance' | 'feather' | 'edge') {
  if (key) {
    const delta = e.deltaY > 0 ? -1 : 1
    if (key === 'tolerance') frameEditorParams.tolerance = Math.max(0, Math.min(120, frameEditorParams.tolerance + delta))
    else if (key === 'feather') frameEditorParams.feather = Math.max(0, Math.min(20, frameEditorParams.feather + delta))
    else if (key === 'edge') frameEditorParams.edge = Math.max(-10, Math.min(10, frameEditorParams.edge + delta))
    return
  }
  const delta = e.deltaY > 0 ? -0.5 : 0.5
  frameEditorZoom.value = Math.max(1, Math.min(10, frameEditorZoom.value + delta))
}

function frameEditorEyedropper(e: MouseEvent) {
  const c = frameEditorCanvas.value
  if (!c || !frameEditorOriginal.value) return
  const r = c.getBoundingClientRect()
  const x = Math.floor((e.clientX - r.left) * (c.width / r.width))
  const y = Math.floor((e.clientY - r.top) * (c.height / r.height))
  const i = (y * c.width + x) * 4
  const d = frameEditorOriginal.value.data
  const hex = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('')
  frameEditorParams.key = hex
}

function frameEditorPrev() {
  if (frameEditorIndex.value > 0) { saveFrameEditor(); openFrameEditor(frameEditorIndex.value - 1) }
}

function frameEditorNext() {
  if (frameEditorIndex.value < frameEditorMax.value - 1) { saveFrameEditor(); openFrameEditor(frameEditorIndex.value + 1) }
}

function copyFrameDataUrl() {
  if (frameEditorImage.value) {
    navigator.clipboard.writeText(frameEditorImage.value).catch(() => {})
    emit('status', 'Data URL copied')
  }
}

/**
 * 模式切换：不再重置抠图参数，只切换工具
 * 水印模式下保留之前的抠图参数，通过 lastMattingMode 确保抠图效果不丢失
 */
function onFrameEditorModeChange() {
  // 推入撤销快照，记录模式切换前的状态
  pushUndoSnapshot()
  frameEditorDirty.value = true
  if (frameEditorParams.mode === 'watermark') {
    // 切换到水印模式：不修改抠图参数，只切换为手动框选工具
    frameEditorTool.value = 'manual'
  } else {
    // 切换到抠图模式：标记已启用抠图，记录模式
    frameEditorTool.value = 'none'
    hasMatting.value = true
    lastMattingMode.value = frameEditorParams.mode as 'flood' | 'global' | 'smart'
  }
  updateFrameEditorPreview()
}

/**
 * 将鼠标坐标转换为画布内部坐标，并 clamp 到画布边界内
 * 确保鼠标移出画布时仍能框选边缘区域
 */
function frameEditorCanvasPos(e: MouseEvent) {
  const c = frameEditorCanvas.value; if (!c) return { x: 0, y: 0 }
  const rect = c.getBoundingClientRect()
  const scaleX = c.width / rect.width
  const scaleY = c.height / rect.height
  const rawX = (e.clientX - rect.left) * scaleX
  const rawY = (e.clientY - rect.top) * scaleY
  // clamp 到画布边界，确保边缘区域可被选中
  return {
    x: Math.max(0, Math.min(rawX, c.width)),
    y: Math.max(0, Math.min(rawY, c.height))
  }
}

/**
 * 鼠标按下：启动框选，使用 window 级事件监听确保拖出画布不中断
 */
function frameEditorCanvasMouseDown(e: MouseEvent) {
  if (frameEditorTool.value !== 'manual') { frameEditorEyedropper(e); return }
  const pos = frameEditorCanvasPos(e)
  frameEditorSelStart.x = pos.x; frameEditorSelStart.y = pos.y
  frameEditorSelEnd.x = pos.x; frameEditorSelEnd.y = pos.y
  frameEditorSelecting.value = true
  // 挂载 window 级监听，鼠标移出画布也能继续拖拽
  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
}

/** window 级 mousemove：框选拖拽中 */
function onWindowMouseMove(e: MouseEvent) {
  if (!frameEditorSelecting.value) return
  const pos = frameEditorCanvasPos(e)
  frameEditorSelEnd.x = pos.x; frameEditorSelEnd.y = pos.y
  drawFrameEditorSelection()
}

/** window 级 mouseup：结束框选 */
function onWindowMouseUp() {
  if (!frameEditorSelecting.value) return
  frameEditorSelecting.value = false
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
  applyManualSelection()
}

/**
 * 绘制框选预览：先渲染流水线结果，再叠加选框
 */
function drawFrameEditorSelection() {
  const c = frameEditorCanvas.value
  if (!c) return
  // 先渲染当前流水线状态（抠图 + 已有水印区域）
  renderToCanvas()
  // 再叠加当前选框
  const ctx = c.getContext('2d')!
  const x = Math.min(frameEditorSelStart.x, frameEditorSelEnd.x)
  const y = Math.min(frameEditorSelStart.y, frameEditorSelEnd.y)
  const w = Math.abs(frameEditorSelEnd.x - frameEditorSelStart.x)
  const h = Math.abs(frameEditorSelEnd.y - frameEditorSelStart.y)
  if (w < 1 || h < 1) return
  ctx.save()
  ctx.strokeStyle = '#00d4aa'
  ctx.fillStyle = 'rgba(0, 212, 170, 0.15)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.strokeRect(x, y, w, h)
  ctx.fillRect(x, y, w, h)
  ctx.restore()
}

/**
 * 应用手动框选：将选区添加到水印区域列表，重新渲染流水线
 * 不直接修改 frameEditorOriginal，保持基底数据不变
 */
function applyManualSelection() {
  const orig = frameEditorOriginal.value
  if (!orig) return
  const x = Math.floor(Math.min(frameEditorSelStart.x, frameEditorSelEnd.x))
  const y = Math.floor(Math.min(frameEditorSelStart.y, frameEditorSelEnd.y))
  const w = Math.floor(Math.abs(frameEditorSelEnd.x - frameEditorSelStart.x))
  const h = Math.floor(Math.abs(frameEditorSelEnd.y - frameEditorSelStart.y))
  if (w < 2 || h < 2) return
  // 推入撤销快照，记录添加水印区域前的状态
  pushUndoSnapshot()
  // 添加到水印区域列表，由流水线统一处理
  frameEditorErasedRegions.value.push({ x, y, w, h })
  // 重新渲染流水线（抠图 + 所有水印区域）
  updateFrameEditorPreview()
  frameEditorDirty.value = true
}

// 监听参数变化：用户调整抠图参数时标记已启用抠图
watch(frameEditorParams, () => {
  if (frameEditorParams.mode !== 'watermark') {
    hasMatting.value = true
    lastMattingMode.value = frameEditorParams.mode as 'flood' | 'global' | 'smart'
  }
}, { deep: true, flush: 'sync' })

// 监听参数变化：重新渲染预览
watch(frameEditorParams, updateFrameEditorPreview, { deep: true })

// 暴露打开/重置方法给父组件
defineExpose({ openFrameEditor, resetFrameEditor })
</script>

<template>
  <Teleport to="body">
    <div v-if="frameEditorOpen" class="fixed inset-0 bg-black/75 z-[100] flex items-center justify-center" @click.self="closeFrameEditor">
      <div class="bg-af-surface border border-af-rule rounded-lg p-5 max-w-[96vw] max-h-[96vh] flex flex-col overflow-auto">
        <div class="w-full flex items-center justify-between mb-3.5">
          <div class="text-base font-bold">{{ t('frameEditor') }} #{{ frameEditorIndex + 1 }}</div>
          <button class="w-11 h-11 rounded-md text-af-muted hover:text-af-ink hover:bg-af-surface-hover text-2xl flex items-center justify-center" @click="closeFrameEditor">&times;</button>
        </div>
        <div class="flex items-center gap-4 mb-3">
          <button class="btn-secondary btn-sm" :disabled="frameEditorIndex <= 0" @click="frameEditorPrev">&larr; {{ t('previous') }}</button>
          <span class="text-xs text-af-muted">{{ t('frameSize') }}: {{ frameEditorSize }}</span>
          <button class="btn-secondary btn-sm" :disabled="frameEditorIndex >= frameEditorMax - 1" @click="frameEditorNext">{{ t('next') }} &rarr;</button>
          <span class="text-[11px] text-af-muted ml-2 px-2 py-0.5 rounded bg-af-bg border border-af-rule">{{ t('undoHint') }}</span>
        </div>
        <div class="flex gap-3 flex-wrap">
          <div class="flex-1 min-w-[260px] flex flex-col items-center">
            <div class="flex items-center gap-3 mb-3">
              <label class="text-xs text-af-muted">{{ t('zoom') }}:</label>
              <input v-model.number="frameEditorZoom" type="range" min="1" max="10" step="0.5" class="flex-1 accent-af-accent h-1" style="width:200px">
              <span class="slider-value">{{ frameEditorZoom }}x</span>
            </div>
            <div class="overflow-auto border border-af-rule rounded-lg relative" style="width:100%; max-width:100%; max-height:75vh;">
              <canvas ref="frameEditorCanvas" class="image-pixelated block" :class="frameEditorTool === 'manual' ? 'cursor-crosshair' : 'cursor-default'" :style="{ transform: `scale(${frameEditorZoom})`, transformOrigin: '0 0' }" @mousedown="frameEditorCanvasMouseDown" @wheel.prevent="onFrameEditorWheel" />
            </div>
            <div class="text-[11px] text-af-muted mt-2">{{ frameEditorTool === 'manual' ? t('watermarkSelectHint') : t('eyedropperHint') }}</div>
          </div>
          <div class="w-[230px] shrink-0 bg-af-bg border border-af-rule rounded-lg p-3.5 overflow-y-auto max-h-[65vh]">
            <div class="panel-title">{{ t('mattingMode') }}</div>
            <select v-model="frameEditorParams.mode" class="form-select mb-3" @change="onFrameEditorModeChange">
              <option value="flood">{{ t('mattingFlood') }}</option>
              <option value="global">{{ t('mattingGlobal') }}</option>
              <option value="smart">{{ t('mattingSmart') }}</option>
              <option value="watermark">{{ t('watermark') }}</option>
            </select>
            <div class="text-[11px] text-af-muted mt-2">{{ frameEditorTool === 'manual' ? t('watermarkSelectHint') : t('eyedropperHint') }}</div>
            <div class="form-group"><label class="form-label">{{ t('keyColor') }}</label><div class="flex items-center gap-2"><input v-model="frameEditorParams.key" type="color" class="w-10 h-10 rounded-md border-0 cursor-pointer bg-transparent" @pointerdown="pushUndoSnapshot"><span class="font-mono text-[12px] text-af-muted">{{ frameEditorParams.key }}</span></div></div>
            <div class="form-group"><label class="form-label">{{ t('tolerance') }} {{ frameEditorParams.tolerance }}</label><input v-model.number="frameEditorParams.tolerance" type="range" min="0" max="120" class="w-full accent-af-accent h-1" @pointerdown="pushUndoSnapshot" @wheel.prevent="onFrameEditorWheel($event, 'tolerance')"></div>
            <div class="form-group"><label class="form-label">{{ t('feather') }} {{ frameEditorParams.feather }}</label><input v-model.number="frameEditorParams.feather" type="range" min="0" max="20" class="w-full accent-af-accent h-1" @pointerdown="pushUndoSnapshot" @wheel.prevent="onFrameEditorWheel($event, 'feather')"></div>
            <div class="form-group"><label class="form-label">{{ t('edgeErosion') }} {{ frameEditorParams.edge }}</label><input v-model.number="frameEditorParams.edge" type="range" min="-10" max="10" class="w-full accent-af-accent h-1" @pointerdown="pushUndoSnapshot" @wheel.prevent="onFrameEditorWheel($event, 'edge')"></div>
            <div v-if="frameEditorParams.mode === 'smart'" class="form-group"><label class="form-label">{{ t('clusters') }}</label><input v-model.number="frameEditorParams.clusters" type="number" min="2" max="16" class="form-input"></div>
            <div class="form-group"><label class="form-label">{{ t('brightness') }} {{ frameEditorParams.brightness }}</label><input v-model.number="frameEditorParams.brightness" type="range" min="-100" max="100" class="w-full accent-af-accent h-1" @pointerdown="pushUndoSnapshot"></div>
            <div class="form-group"><label class="form-label">{{ t('contrast') }} {{ frameEditorParams.contrast }}</label><input v-model.number="frameEditorParams.contrast" type="range" min="-100" max="100" class="w-full accent-af-accent h-1" @pointerdown="pushUndoSnapshot"></div>
            <div class="form-group"><label class="form-label">{{ t('saturation') }} {{ frameEditorParams.saturation }}</label><input v-model.number="frameEditorParams.saturation" type="range" min="-100" max="100" class="w-full accent-af-accent h-1" @pointerdown="pushUndoSnapshot"></div>
            <div class="flex flex-col gap-2 mt-3">
              <button class="btn-primary btn-sm" :class="savedFlash ? 'saved-flash' : ''" @click="saveFrameEditor">{{ savedFlash ? '✓ ' + t('frameSaved') : t('saveFrame') }}</button>
              <button class="btn-secondary btn-sm" @click="applyFrameEditorToAll">{{ t('applyToAll') }}</button>
              <button class="btn-secondary btn-sm" @click="copyFrameDataUrl">{{ t('copyDataUrl') }}</button>
              <button class="btn-secondary btn-sm" @click="downloadUrl(frameEditorImage, 'frame_'+(frameEditorIndex+1)+'.png')">{{ t('download') }}</button>
              <button class="btn-secondary btn-sm" @click="restoreFrameEditor">{{ t('restoreFrame') }}</button>
              <button class="btn-secondary btn-sm" @click="restoreAllFrames">{{ t('restoreAllFrames') }}</button>
              <button class="btn-secondary btn-sm" @click="closeFrameEditor">{{ t('close') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.btn-primary { @apply inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium bg-af-accent text-black border border-af-accent hover:brightness-110 transition-all disabled:opacity-60; }
.btn-secondary { @apply inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium bg-af-surface-hover text-af-ink border border-af-rule hover:border-af-muted transition-all; }
.btn-sm { @apply px-2.5 py-1 text-xs; }
.form-group { @apply mb-3 flex-1 min-w-[120px]; }
.form-label { @apply block text-xs font-medium text-af-muted mb-1.5; }
.form-input { @apply w-full bg-af-bg border border-af-rule rounded-md py-1.5 px-2.5 text-af-ink text-sm outline-none focus:border-af-accent; }
.form-select { @apply w-full bg-af-bg border border-af-rule rounded-md py-1.5 px-2.5 text-af-ink text-sm outline-none focus:border-af-accent cursor-pointer; }
.panel-title { @apply text-[13px] font-semibold mb-2.5 text-af-ink flex items-center gap-2; }
.slider-value { @apply w-12 text-right font-mono text-[13px] text-af-ink; }
.image-pixelated { image-rendering: pixelated; }
/* 保存成功按钮高亮动画 */
.saved-flash {
  background: #28c76f !important;
  border-color: #28c76f !important;
  color: #fff !important;
  transition: all 0.2s ease;
}
</style>
