<script setup lang="ts">
// 帧编辑器共享组件：对序列帧进行抠图、调色与手动擦除

import { ref, reactive, computed, nextTick, watch, inject } from 'vue'

import { applyMattingParams, type MattingParams } from '../../utils/matting'

import { loadImage, downloadUrl } from '../../utils/export'



// 帧项结构

interface FrameItem {

  url: string

  selected: boolean

  similarGroup: number

  originalUrl?: string

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

const frameEditorOriginal = ref<ImageData | null>(null)

const frameEditorOriginalUrl = ref('')



const DEFAULT_FRAME_EDITOR_PARAMS: MattingParams = {

  mode: 'flood', key: '#00ff00', tolerance: 30, feather: 2, edge: 0, clusters: 4,

  brightness: 0, contrast: 0, saturation: 0,

}



const frameEditorParams = reactive<MattingParams>({ ...DEFAULT_FRAME_EDITOR_PARAMS })



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



// 上一次的点击索引，用于 Shift 连续选择

const lastFrameClickIndex = ref(-1)



// 打开帧编辑器

function openFrameEditor(i: number) {

  frameEditorIndex.value = i

  Object.assign(frameEditorParams, DEFAULT_FRAME_EDITOR_PARAMS)

  frameEditorErasedRegions.value = []

  frameEditorTool.value = 'none'

  frameEditorZoom.value = 1

  frameEditorDirty.value = false

  frameEditorOriginalUrl.value = frames.value[i]?.originalUrl || frames.value[i]?.url || ''

  frameEditorImage.value = frameEditorOriginalUrl.value

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

  lastFrameClickIndex.value = -1

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



function updateFrameEditorPreview() {

  const c = frameEditorCanvas.value

  const orig = frameEditorOriginal.value

  if (!c || !orig) return

  const ctx = c.getContext('2d')!

  const out = frameEditorParams.mode === 'watermark' ? orig : applyMattingParams(orig, frameEditorParams)

  ctx.putImageData(out, 0, 0)

  frameEditorImage.value = c.toDataURL('image/png')

}



function saveFrameEditor() {

  const c = frameEditorCanvas.value

  if (!c || frameEditorIndex.value < 0) return

  const url = c.toDataURL('image/png')

  const updated = [...frames.value]

  updated[frameEditorIndex.value] = { ...updated[frameEditorIndex.value], url }

  if (!updated[frameEditorIndex.value].originalUrl) {

    updated[frameEditorIndex.value] = { ...updated[frameEditorIndex.value], originalUrl: frameEditorOriginalUrl.value }

  }

  emit('update:modelValue', updated)

  frameEditorOriginal.value = c.getContext('2d')!.getImageData(0, 0, c.width, c.height)

  frameEditorImage.value = url

  frameEditorDirty.value = false

  emit('toast', t('frameSaved'))

}



async function applyFrameEditorToAll() {

  emit('loading', true, t('processing'))

  const currentFrames = frames.value

  const selectedIndexes = currentFrames.map((f, i) => f.selected ? i : -1).filter(i => i >= 0)

  if (!selectedIndexes.length) {

    emit('loading', false)

    emit('toast', t('noFrameSelected'))

    return

  }

  const updated = [...currentFrames]

  if (frameEditorParams.mode === 'watermark') {

    saveFrameEditor()

    const regions = [...frameEditorErasedRegions.value]

    if (!regions.length) {

      emit('loading', false)

      emit('toast', t('watermarkNoApplyAll'))

      return

    }

    for (const i of selectedIndexes) {

      if (i === frameEditorIndex.value) continue

      const img = await loadImage(updated[i].originalUrl || updated[i].url)

      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight

      const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0)

      const imgData = ctx.getImageData(0, 0, c.width, c.height)

      const data = imgData.data

      for (const r of regions) {

        for (let py = r.y; py < Math.min(r.y + r.h, c.height); py++) {

          for (let px = r.x; px < Math.min(r.x + r.w, c.width); px++) {

            const idx = (py * c.width + px) * 4

            data[idx + 3] = 0

          }

        }

      }

      ctx.putImageData(imgData, 0, 0)

      updated[i] = { ...updated[i], url: c.toDataURL('image/png') }

    }

    emit('update:modelValue', updated)

    emit('loading', false)

    emit('toast', t('watermarkAppliedAll'))

    return

  }

  for (const i of selectedIndexes) {

    const img = await loadImage(updated[i].originalUrl || updated[i].url)

    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight

    const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0)

    const orig = ctx.getImageData(0, 0, c.width, c.height)

    const out = applyMattingParams(orig, frameEditorParams)

    ctx.putImageData(out, 0, 0)

    updated[i] = { ...updated[i], url: c.toDataURL('image/png') }

    if (!updated[i].originalUrl) updated[i] = { ...updated[i], originalUrl: updated[i].url }

  }

  emit('update:modelValue', updated)

  saveFrameEditor()

  emit('loading', false)

  emit('toast', t('allFramesApplied'))

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

  updated[frameEditorIndex.value] = { ...updated[frameEditorIndex.value], url: frameEditorOriginalUrl.value }

  emit('update:modelValue', updated)

  frameEditorImage.value = frameEditorOriginalUrl.value

  const img = await loadImage(frameEditorOriginalUrl.value)

  const c = frameEditorCanvas.value

  if (!c) return

  c.width = img.naturalWidth

  c.height = img.naturalHeight

  const ctx = c.getContext('2d')!

  ctx.drawImage(img, 0, 0)

  frameEditorOriginal.value = ctx.getImageData(0, 0, c.width, c.height)

  emit('status', t('frameRestored'))

}



async function restoreAllFrames() {

  emit('loading', true, t('processing'))

  const updated = frames.value.map(f => f.originalUrl ? { ...f, url: f.originalUrl } : f)

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



function onFrameEditorModeChange() {

  frameEditorDirty.value = true

  if (frameEditorParams.mode === 'watermark') {

    frameEditorParams.key = '#ffffff'; frameEditorParams.tolerance = 80

    frameEditorParams.feather = 4; frameEditorParams.edge = 5

    frameEditorTool.value = 'manual'

    updateFrameEditorPreview()

  } else {

    frameEditorTool.value = 'none'

    updateFrameEditorPreview()

  }

}



function frameEditorCanvasPos(e: MouseEvent) {

  const c = frameEditorCanvas.value; if (!c) return { x: 0, y: 0 }

  const rect = c.getBoundingClientRect()

  const scaleX = c.width / rect.width

  const scaleY = c.height / rect.height

  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }

}



function frameEditorCanvasMouseDown(e: MouseEvent) {

  if (frameEditorTool.value !== 'manual') { frameEditorEyedropper(e); return }

  const pos = frameEditorCanvasPos(e)

  frameEditorSelStart.x = pos.x; frameEditorSelStart.y = pos.y

  frameEditorSelEnd.x = pos.x; frameEditorSelEnd.y = pos.y

  frameEditorSelecting.value = true

}



function frameEditorCanvasMouseMove(e: MouseEvent) {

  if (!frameEditorSelecting.value) return

  const pos = frameEditorCanvasPos(e)

  frameEditorSelEnd.x = pos.x; frameEditorSelEnd.y = pos.y

  drawFrameEditorSelection()

}



function drawFrameEditorSelection() {

  const c = frameEditorCanvas.value

  const orig = frameEditorOriginal.value

  if (!c || !orig) return

  const ctx = c.getContext('2d')!

  ctx.putImageData(orig, 0, 0)

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



function frameEditorCanvasMouseUp() {

  if (!frameEditorSelecting.value) return

  frameEditorSelecting.value = false

  applyManualSelection()

}



function applyManualSelection() {

  const orig = frameEditorOriginal.value

  if (!orig) return

  const x = Math.floor(Math.min(frameEditorSelStart.x, frameEditorSelEnd.x))

  const y = Math.floor(Math.min(frameEditorSelStart.y, frameEditorSelEnd.y))

  const w = Math.floor(Math.abs(frameEditorSelEnd.x - frameEditorSelStart.x))

  const h = Math.floor(Math.abs(frameEditorSelEnd.y - frameEditorSelStart.y))

  if (w < 2 || h < 2) return

  frameEditorErasedRegions.value.push({ x, y, w, h })

  const data = orig.data

  for (let py = y; py < Math.min(y + h, orig.height); py++) {

    for (let px = x; px < Math.min(x + w, orig.width); px++) {

      const i = (py * orig.width + px) * 4

      data[i + 3] = 0

    }

  }

  const c = frameEditorCanvas.value

  if (c) { const ctx = c.getContext('2d')!; ctx.putImageData(orig, 0, 0); frameEditorImage.value = c.toDataURL('image/png') }

  frameEditorDirty.value = true

}



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

        </div>

        <div class="flex gap-3 flex-wrap">

          <div class="flex-1 min-w-[260px] flex flex-col items-center">

            <div class="flex items-center gap-3 mb-3">

              <label class="text-xs text-af-muted">{{ t('zoom') }}:</label>

              <input v-model.number="frameEditorZoom" type="range" min="1" max="10" step="0.5" class="flex-1 accent-af-accent h-1" style="width:200px">

              <span class="slider-value">{{ frameEditorZoom }}x</span>

            </div>

            <div class="overflow-auto border border-af-rule rounded-lg flex items-center justify-center relative" style="width:100%; max-width:100%; max-height:75vh;">

              <canvas ref="frameEditorCanvas" class="object-contain image-pixelated" :class="frameEditorTool === 'manual' ? 'cursor-crosshair' : 'cursor-default'" :style="{ transform: `scale(${frameEditorZoom})`, transformOrigin: '0 0', width: '100%', height: '100%' }" @mousedown="frameEditorCanvasMouseDown" @mousemove="frameEditorCanvasMouseMove" @mouseup="frameEditorCanvasMouseUp" @wheel.prevent="onFrameEditorWheel" />

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

            <div class="form-group"><label class="form-label">{{ t('keyColor') }}</label><div class="flex items-center gap-2"><input v-model="frameEditorParams.key" type="color" class="w-10 h-10 rounded-md border-0 cursor-pointer bg-transparent"><span class="font-mono text-[12px] text-af-muted">{{ frameEditorParams.key }}</span></div></div>

            <div class="form-group"><label class="form-label">{{ t('tolerance') }} {{ frameEditorParams.tolerance }}</label><input v-model.number="frameEditorParams.tolerance" type="range" min="0" max="120" class="w-full accent-af-accent h-1" @wheel.prevent="onFrameEditorWheel($event, 'tolerance')"></div>

            <div class="form-group"><label class="form-label">{{ t('feather') }} {{ frameEditorParams.feather }}</label><input v-model.number="frameEditorParams.feather" type="range" min="0" max="20" class="w-full accent-af-accent h-1" @wheel.prevent="onFrameEditorWheel($event, 'feather')"></div>

            <div class="form-group"><label class="form-label">{{ t('edgeErosion') }} {{ frameEditorParams.edge }}</label><input v-model.number="frameEditorParams.edge" type="range" min="-10" max="10" class="w-full accent-af-accent h-1" @wheel.prevent="onFrameEditorWheel($event, 'edge')"></div>

            <div v-if="frameEditorParams.mode === 'smart'" class="form-group"><label class="form-label">{{ t('clusters') }}</label><input v-model.number="frameEditorParams.clusters" type="number" min="2" max="16" class="form-input"></div>

            <div class="form-group"><label class="form-label">{{ t('brightness') }} {{ frameEditorParams.brightness }}</label><input v-model.number="frameEditorParams.brightness" type="range" min="-100" max="100" class="w-full accent-af-accent h-1"></div>

            <div class="form-group"><label class="form-label">{{ t('contrast') }} {{ frameEditorParams.contrast }}</label><input v-model.number="frameEditorParams.contrast" type="range" min="-100" max="100" class="w-full accent-af-accent h-1"></div>

            <div class="form-group"><label class="form-label">{{ t('saturation') }} {{ frameEditorParams.saturation }}</label><input v-model.number="frameEditorParams.saturation" type="range" min="-100" max="100" class="w-full accent-af-accent h-1"></div>

            <div class="flex flex-col gap-2 mt-3">

              <button class="btn-primary btn-sm" @click="saveFrameEditor">{{ t('saveFrame') }}</button>

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

</style>
