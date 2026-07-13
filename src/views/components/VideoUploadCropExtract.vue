<script setup lang="ts">
// VideoUploadCropExtract：视频转序列帧共享子组件

import { ref, reactive, computed, nextTick, inject } from 'vue'
import { dataUrlToFile, useLibrarySaver } from '../../composables/useLibrary'
import { estimateFrameCount, computeCropDisplayMetrics, clampCrop, fitCropToOutput } from '../../utils/videoCrop'
import HelpBtn from './HelpBtn.vue'
import UploadZone from './UploadZone.vue'


defineProps<{ modelValue: any }>()

const t = inject<(key: string) => string>('t', (key) => key)
const emit = defineEmits<{
  (e: 'status', msg: string): void
  (e: 'toast', text: string, type?: 'info' | 'success' | 'warning' | 'error'): void
  (e: 'loading', open: boolean, text?: string): void
  (e: 'update:modelValue', value: any): void
  (e: 'pick-asset', type: string, callback: (asset: any) => void, keepOpen?: boolean): void
}>()

function setStatus(msg: string) { emit('status', msg) }
function toast(text: string, type: any = 'success') { emit('toast', text, type) }

const { saveFileToLibrary } = useLibrarySaver()

const video = reactive({

  step: 1, file: null as File | null, url: '', duration: 0, width: 0, height: 0, nativeFps: 30, fps: 12, outW: 512, outH: 512,

  error: '', // 视频加载错误提示，如编码格式不受浏览器支持

  frames: [] as { url: string; selected: boolean; similarGroup: number; originalUrl?: string }[],

  previewFps: 12, playing: false, progress: 0, showCrop: true,

  crop: { x: 0, y: 0, w: 100, h: 100 },

  rangeStart: 0, rangeEnd: 0, lockAspect: true,

  export: { format: 'video', cols: 4, preset: 'custom', w: 512, h: 512, lockAspect: true, compression: 'none', delay: 100, name: 'artforge_export', preview: '', sizeEstimate: '' }

})

const sourceVideo = ref<HTMLVideoElement | null>(null)

const videoFileInput = ref<HTMLInputElement | null>(null) // 隐藏的视频文件输入框引用

const videoCropContainer = ref<HTMLDivElement | null>(null)

const cropPreviewCanvas = ref<HTMLCanvasElement | null>(null)

const videoPreviewCanvas = ref<HTMLCanvasElement | null>(null) // 裁剪后视频实时预览画布引用

const videoCropPreviewPlaying = ref(false) // 裁剪视频实时预览是否正在播放

let videoPreviewRaf: number | null = null // 视频预览动画帧请求 ID

let cropResizing = false



// 裁剪框在页面上显示时的缩放与偏移（因为视频可能被缩放显示）

const cropMetrics = reactive({ scale: 1, offsetX: 0, offsetY: 0 })



const videoCropStyle = computed(() => ({

  left: cropMetrics.offsetX + video.crop.x * cropMetrics.scale + 'px',

  top: cropMetrics.offsetY + video.crop.y * cropMetrics.scale + 'px',

  width: video.crop.w * cropMetrics.scale + 'px',

  height: video.crop.h * cropMetrics.scale + 'px'

}))



// 根据视频元素的实际显示尺寸更新裁剪框的显示缩放与偏移

function updateCropMetrics() {

  const container = videoCropContainer.value

  const v = sourceVideo.value

  if (!container || !v) return

  const metrics = computeCropDisplayMetrics(

    container.getBoundingClientRect(),

    v.getBoundingClientRect(),

    video.width || v.videoWidth,

    video.height || v.videoHeight

  )

  cropMetrics.scale = metrics.scale

  cropMetrics.offsetX = metrics.offsetX

  cropMetrics.offsetY = metrics.offsetY

}



function onVideoMeta() {

  const v = sourceVideo.value; if (!v) return

  // 部分编码格式在 loadedmetadata 阶段拿不到宽高，需等待首帧解码完成（loadeddata），这里先不报错

  if (!v.videoWidth || !v.videoHeight || !isFinite(v.duration)) return

  setVideoMeta(v)

}



// 首帧解码完成后补全视频信息，解决部分格式 loadedmetadata 时宽高为 0 的问题

function onVideoData() {

  const v = sourceVideo.value; if (!v) return

  if (v.videoWidth && v.videoHeight && (!video.width || !video.height)) {

    setVideoMeta(v)

    return

  }

  // 若首帧已加载但宽高仍不可用，先尝试再等一帧（部分高规格编码解码有延迟）

  if (!v.videoWidth || !v.videoHeight) {

    if (!video.error) {

      requestAnimationFrame(() => {

        const v2 = sourceVideo.value

        if (v2 && v2.videoWidth && v2.videoHeight && (!video.width || !video.height)) {

          setVideoMeta(v2)

        } else if (v2 && (!v2.videoWidth || !v2.videoHeight)) {

          const mimeType = video.file?.type || 'video/mp4'

          video.error = `无法读取视频画面（${mimeType}）。当前浏览器不支持该视频编码，常见原因是 H.265/HEVC 缺少解码器。建议用转码工具转换为 H.264 编码的 MP4 后重试。`

          video.width = 0; video.height = 0

        }

      })

    }

    return

  }

  updateCropMetrics()

}



// 将视频元素的有效元数据写入状态

function setVideoMeta(v: HTMLVideoElement) {

  video.error = '' // 元数据正常，清空错误提示

  video.duration = v.duration; video.width = v.videoWidth; video.height = v.videoHeight

  let detectedFps = 30

  const videoTracks = (v as HTMLVideoElement & { videoTracks?: { frameRate?: number }[] }).videoTracks

  if (videoTracks) {

    for (let i = 0; i < videoTracks.length; i++) {

      if (videoTracks[i]?.frameRate) { detectedFps = videoTracks[i].frameRate || 30; break }

    }

  }

  video.nativeFps = detectedFps

  video.crop = { x: 0, y: 0, w: v.videoWidth, h: v.videoHeight }

  video.outW = v.videoWidth

  video.outH = v.videoHeight

  video.rangeEnd = v.duration

  video.showCrop = true

  nextTick(() => { updateCropMetrics(); updateCropPreview(); drawVideoCropFrame() })

}



// 视频元素触发 error 事件时给出可读的错误提示

function onVideoError() {

  const v = sourceVideo.value; if (!v) return

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

    const container = videoCropContainer.value; if (!container) return

    const rect = container.getBoundingClientRect()

    const mx = (ev.clientX - rect.left - cropMetrics.offsetX) / cropMetrics.scale

    const my = (ev.clientY - rect.top - cropMetrics.offsetY) / cropMetrics.scale

    const vw = video.width || 640, vh = video.height || 360

    if (dir.includes('e')) { video.crop.w = Math.max(10, Math.min(mx, vw) - video.crop.x) }

    if (dir.includes('w')) {

      const newX = Math.max(0, Math.min(mx, video.crop.x + video.crop.w - 10))

      video.crop.w = video.crop.x + video.crop.w - newX

      video.crop.x = newX

    }

    if (dir.includes('s')) { video.crop.h = Math.max(10, Math.min(my, vh) - video.crop.y) }

    if (dir.includes('n')) {

      const newY = Math.max(0, Math.min(my, video.crop.y + video.crop.h - 10))

      video.crop.h = video.crop.y + video.crop.h - newY

      video.crop.y = newY

    }

    video.crop = clampCrop(video.crop, vw, vh)

  }

  const onUp = () => { cropResizing = false; updateCropPreview(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }

  window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)

}



function updateCropFromInputs() {

  video.showCrop = true

  video.crop = clampCrop(video.crop, video.width, video.height)

  updateCropPreview()

}



function updateCropPreview() {

  const v = sourceVideo.value; if (!v) return

  const c = cropPreviewCanvas.value; if (!c) return

  const ctx = c.getContext('2d')!

  c.width = video.outW || video.crop.w

  c.height = video.outH || video.crop.h

  ctx.fillStyle = '#14141c'

  ctx.fillRect(0, 0, c.width, c.height)

  try {

    const fit = fitCropToOutput(video.crop.w, video.crop.h, c.width, c.height)

    ctx.drawImage(v, video.crop.x, video.crop.y, video.crop.w, video.crop.h, fit.x, fit.y, fit.w, fit.h)

  } catch { /* canvas tainted or video not ready */ }

}



// 重新上传视频：点击时不立刻清空状态，仅弹出文件选择框

function reuploadVideo() {

  // 不立刻清空页面状态，仅弹出文件选择框；用户真正选择新文件后再在 loadVideo 中重置

  nextTick(() => videoFileInput.value?.click())

}



// 关闭视频：清除当前视频文件信息并释放资源

function closeVideo() {

  stopCropVideoPreview() // 停止视频预览

  if (video.url) URL.revokeObjectURL(video.url) // 释放对象 URL 占用的内存

  resetFrameEditor() // 关闭视频时清空帧编辑状态

  video.file = null; video.url = ''; video.frames = []; video.duration = 0

  video.width = 0; video.height = 0; video.rangeStart = 0; video.rangeEnd = 0

  video.step = 1; video.progress = 0; video.nativeFps = 30; video.error = ''

  video.crop = { x: 0, y: 0, w: 100, h: 100 }

  video.outW = 0; video.outH = 0; video.showCrop = false

}



// 切换裁剪视频实时预览的播放/暂停状态

function toggleCropVideoPreview() {

  if (videoCropPreviewPlaying.value) stopCropVideoPreview() // 正在播放则停止

  else startCropVideoPreview() // 未播放则开始

}



// 开始裁剪视频实时预览

function startCropVideoPreview() {

  const v = sourceVideo.value // 获取源视频元素

  if (!v) return // 未加载视频则返回

  if (v.currentTime < video.rangeStart || v.currentTime > video.rangeEnd) {

    v.currentTime = video.rangeStart // 若当前时间不在范围内则跳回起始时间

  }

  v.play().catch(() => {}) // 尝试播放视频

  videoCropPreviewPlaying.value = true // 标记为播放状态

  renderCropVideoPreview() // 启动渲染循环

}



// 停止裁剪视频实时预览

function stopCropVideoPreview() {

  videoCropPreviewPlaying.value = false // 标记为暂停状态

  if (videoPreviewRaf) { cancelAnimationFrame(videoPreviewRaf); videoPreviewRaf = null } // 取消动画帧

  const v = sourceVideo.value // 获取源视频元素

  if (v && !v.paused) v.pause() // 若视频正在播放则暂停

}



// 绘制单帧裁剪视频实时预览（无论播放/暂停都可用）

function drawVideoCropFrame() {

  const v = sourceVideo.value // 获取源视频元素

  const c = videoPreviewCanvas.value // 获取预览画布

  if (!v || !c) return // 任一元素不存在则返回

  const ctx = c.getContext('2d') // 获取 2D 上下文

  if (!ctx) return // 获取失败则返回

  c.width = video.outW || video.crop.w || c.clientWidth || 320 // 设置画布宽度

  c.height = video.outH || video.crop.h || c.clientHeight || 180 // 设置画布高度

  ctx.fillStyle = '#14141c' // 设置背景色

  ctx.fillRect(0, 0, c.width, c.height) // 填充背景

  try {

    const fit = fitCropToOutput(video.crop.w, video.crop.h, c.width, c.height) // 计算适配输出尺寸

    ctx.drawImage(v, video.crop.x, video.crop.y, video.crop.w, video.crop.h, fit.x, fit.y, fit.w, fit.h) // 绘制裁剪后的视频帧

  } catch { /* 跨域或视频未就绪时忽略 */ }

}



// 当时间范围变化后刷新裁剪视频实时预览（输入框失焦或滑块释放时触发）

function refreshVideoCropPreview() {

  const v = sourceVideo.value

  if (!v) return

  // 先把输入值规范化为数字，防止空字符串导致后续比较报错

  let start = num(video.rangeStart), end = num(video.rangeEnd)

  // 确保时间范围合法

  if (start < 0) start = 0

  if (end > video.duration) end = video.duration

  if (start > end) start = end

  video.rangeStart = start

  video.rangeEnd = end

  // 如果当前播放时间不在新范围内，则跳回起始时间

  if (v.currentTime < video.rangeStart || v.currentTime > video.rangeEnd) {

    v.currentTime = video.rangeStart

  }

  // 正在播放时渲染循环会自动使用新范围；暂停时绘制单帧

  if (videoCropPreviewPlaying.value) {

    if (v.paused) v.play().catch(() => {})

  } else {

    drawVideoCropFrame()

  }

}



// 渲染裁剪视频实时预览帧（RAF 循环）

function renderCropVideoPreview() {

  if (!videoCropPreviewPlaying.value) return // 未在播放状态则停止渲染

  const v = sourceVideo.value

  if (!v) return

  if (v.currentTime >= video.rangeEnd) {

    v.currentTime = video.rangeStart // 到达结束时间则跳回起始时间实现循环

    v.play().catch(() => {}) // 重新播放

  }

  drawVideoCropFrame()

  videoPreviewRaf = requestAnimationFrame(renderCropVideoPreview) // 请求下一帧继续渲染

}



async function loadVideo(files: FileList) {

  const file = files[0]; if (!file) return

  stopCropVideoPreview() // 加载新视频前停止旧预览

  if (video.url) URL.revokeObjectURL(video.url) // 释放旧视频 URL 占用的内存

  video.file = null; video.url = ''; video.frames = []; video.duration = 0

  video.width = 0; video.height = 0; video.rangeStart = 0; video.rangeEnd = 0

  video.step = 1; video.progress = 0; video.nativeFps = 30; video.error = ''

  video.crop = { x: 0, y: 0, w: 100, h: 100 }

  video.outW = 0; video.outH = 0; video.showCrop = false

  // 预检测浏览器是否能播放该文件类型（H.265/HEVC 在多数 Chrome/Edge 中返回空字符串）
  const mimeType = file.type || 'video/mp4'
  const playable = checkVideoPlayable(mimeType)
  if (!playable) {
    video.error = `当前浏览器不支持该视频格式（${mimeType}）。建议用转码工具转换为 H.264 编码的 MP4 后重试。`
    return
  }

  await nextTick()

  video.file = file; video.url = URL.createObjectURL(file)

  await nextTick()

  const v = sourceVideo.value; if (!v) return

  v.onloadedmetadata = () => { stopCropVideoPreview(); onVideoMeta() }

  // 视频加载成功后自动保存第一帧缩略图到资源库
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

    const dt = new DataTransfer(); dt.items.add(file)

    loadVideo(dt.files)

  }

  input.value = '' // 允许重复选择同一文件

}



// 独立组件默认只展示视频流程

const seqTab = ref('video')

const videoStepLabels = computed(() => [t('videoStep1'), t('videoStep2'), t('videoStep3')])

const videoEstFrames = computed(() => estimateFrameCount(video.rangeStart, video.rangeEnd, video.fps))



// 将任意值安全转换为数字

function num(v: any): number { return typeof v === 'number' && !isNaN(v) ? v : Number(v) || 0 }

// 安全格式化数字为固定小数位字符串

function fmtFixed(v: any, digits = 2): string { return num(v).toFixed(digits) }



// 输入框滚轮调整数字

function wheelNumber(e: WheelEvent, path: string, min: number, max: number) {

  e.preventDefault()

  const val = num(path === 'video.fps' ? video.fps : path === 'video.rangeStart' ? video.rangeStart : video.rangeEnd)

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



// 从资源库导入视频

function importVideoFromLibrary() {

  emit('pick-asset', 'video', async (asset: any) => {

    try {

      const file = await dataUrlToFile(asset.dataUrl, asset.name, 'video/mp4')

      const dt = new DataTransfer(); dt.items.add(file)

      await loadVideo(dt.files)

      toast(t('assetImported') || '已导入资源', 'success')

    } catch (err) {

      toast((t('assetImportFailed') || '导入失败') + ': ' + (err as Error).message, 'error')

    }

  })

}



// 提取视频帧：按裁剪区域和时间范围生成帧列表

async function extractVideoFrames() {

  if (video.error || !video.width || !video.height) {

    toast(video.error || '视频尚未正确加载，无法提取帧', 'warning')

    return

  }

  resetFrameEditor()

  video.progress = 0; setStatus(t('extractingFrames') || '正在提取帧')

  const total = estimateFrameCount(video.rangeStart, video.rangeEnd, video.fps)

  const v = sourceVideo.value!; video.frames = []

  const outW = Math.max(1, Math.round(video.crop.w))

  const outH = Math.max(1, Math.round(video.crop.h))

  video.outW = outW; video.outH = outH

  for (let i = 0; i < total; i++) {

    v.currentTime = video.rangeStart + i / video.fps

    await new Promise(r => v.addEventListener('seeked', r, { once: true }))

    const c = document.createElement('canvas'); c.width = outW; c.height = outH

    const ctx = c.getContext('2d')!

    ctx.drawImage(v, video.crop.x, video.crop.y, video.crop.w, video.crop.h, 0, 0, outW, outH)

    video.frames.push({ url: c.toDataURL('image/png'), selected: true, similarGroup: -1, originalUrl: c.toDataURL('image/png') })

    video.progress = Math.round(((i + 1) / total) * 100)

  }

  video.export.w = outW; video.export.h = outH

  video.step = 2; video.progress = 0; setStatus(t('extractDone') || '提取完成')

}



// 帧编辑器占位：组件内不展示编辑器，仅保证调用不报错

function resetFrameEditor() {}
</script>

<template>
<div class="space-y-3">
                <div v-show="seqTab === 'video'" class="space-y-3">

                  <div class="steps-bar">

                    <button v-for="n in 3" :key="n" class="step-pill" :class="video.step === n ? 'active' : ''" @click="video.step = n"><span class="step-num">{{ n }}</span><span>{{ videoStepLabels[n-1] }}</span></button>

                  </div>

                  <div v-if="video.step === 1" class="space-y-3">

                    <UploadZone v-if="!video.file" accept="video/mp4,video/webm,video/quicktime" :prompt="t('uploadVideo')" :hint="t('uploadVideoHint')" @files="loadVideo($event)" />

                    <button v-if="!video.file" class="btn-secondary btn-sm mt-2" @click="importVideoFromLibrary">{{ t('importFromLibrary') }}</button>

                    <input ref="videoFileInput" type="file" accept="video/mp4,video/webm,video/quicktime" class="hidden" @change.stop="handleVideoFileChange">

                    <div v-if="video.file" class="space-y-3">

                      <div class="flex gap-3 flex-wrap">

                        <div class="flex-1 min-w-[260px] relative">

                          <div class="panel-title"><span>{{ t('sourceVideo') }}</span><HelpBtn :text="t('videoCropHelp')" /></div>

                          <div class="bg-black rounded-lg overflow-hidden flex items-center justify-center h-[360px] relative" ref="videoCropContainer">

                            <video v-if="!video.error" ref="sourceVideo" :src="video.url" class="max-w-full max-h-full object-contain block" preload="auto" :crossorigin="video.url.startsWith('blob:') ? undefined : 'anonymous'" @loadedmetadata="onVideoMeta" @loadeddata="onVideoData" @error="onVideoError"></video>

                            <!-- 视频加载失败提示：通常是编码格式不受浏览器支持 -->

                            <div v-if="video.error" class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/80 text-white z-10">

                              <div class="text-red-400 font-medium mb-2">视频加载失败</div>

                              <div class="text-sm text-af-muted max-w-[280px]">{{ video.error }}</div>

                              <div class="text-xs text-af-muted/80 mt-2 max-w-[280px]">建议使用谷歌或谷歌内核浏览器打开网站重试。</div>

                            </div>

                            <div v-if="video.showCrop && !video.error" class="absolute border-2 border-af-accent pointer-events-none" :style="videoCropStyle">

                              <div class="absolute -top-1.5 -left-1.5 w-3 h-3 bg-af-accent cursor-nw-resize pointer-events-auto" @mousedown.stop="startCropResize($event, 'nw')"></div>

                              <div class="absolute -top-1.5 -right-1.5 w-3 h-3 bg-af-accent cursor-ne-resize pointer-events-auto" @mousedown.stop="startCropResize($event, 'ne')"></div>

                              <div class="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-af-accent cursor-sw-resize pointer-events-auto" @mousedown.stop="startCropResize($event, 'sw')"></div>

                              <div class="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-af-accent cursor-se-resize pointer-events-auto" @mousedown.stop="startCropResize($event, 'se')"></div>

                            </div>

                          </div>

                        </div>

                        <div class="flex-1 min-w-[260px]">

                          <div class="panel-title">{{ t('cropPreview') }}</div>

                          <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden flex items-center justify-center min-h-[280px]"><canvas ref="cropPreviewCanvas" class="max-w-full max-h-[360px]"></canvas></div>

                        </div>

                      </div>

                      <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                        <div class="panel-title">{{ t('videoInfo') }}</div>

                        <div class="form-row"><div class="form-group"><label class="form-label">{{ t('filename') }}</label><input :value="video.file?.name || ''" readonly class="form-input" /></div><div class="form-group"><label class="form-label">{{ t('duration') }}</label><input :value="video.duration.toFixed(2)+'s'" readonly class="form-input" /></div><div class="form-group"><label class="form-label">{{ t('resolution') }}</label><input :value="video.width+'x'+video.height" readonly class="form-input" /></div><div class="form-group"><label class="form-label">{{ t('nativeFps') }}</label><input :value="video.nativeFps.toFixed(1)" readonly class="form-input" /></div></div>

                        <div class="flex gap-2 mt-3"><button type="button" class="btn-secondary" @click="reuploadVideo">{{ t('reuploadVideo') }}</button><button type="button" class="btn-secondary" @click="closeVideo">{{ t('closeVideo') }}</button></div>

                        <div class="form-row mt-2">

                          <div class="form-group"><label class="form-label">{{ t('cropX') }}</label><input v-model.number="video.crop.x" type="number" min="0" class="form-input" @input="updateCropFromInputs" /></div>

                          <div class="form-group"><label class="form-label">{{ t('cropY') }}</label><input v-model.number="video.crop.y" type="number" min="0" class="form-input" @input="updateCropFromInputs" /></div>

                          <div class="form-group"><label class="form-label">{{ t('cropW') }}</label><input v-model.number="video.crop.w" type="number" min="1" class="form-input" @input="updateCropFromInputs" /></div>

                          <div class="form-group"><label class="form-label">{{ t('cropH') }}</label><input v-model.number="video.crop.h" type="number" min="1" class="form-input" @input="updateCropFromInputs" /></div>

                        </div>

                      </div>

                      <!-- 裁剪后视频实时预览面板：在选取的时间范围内循环播放并显示裁剪效果 -->

                      <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                        <div class="panel-title"><span>{{ t('cropVideoPreview') }}</span><HelpBtn :text="t('cropVideoPreviewHelp')" /></div>

                        <div class="flex gap-3 flex-wrap min-h-[280px]">

                          <div class="flex-1 min-w-[260px]">

                            <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden flex items-center justify-center h-[280px] relative">

                              <canvas ref="videoPreviewCanvas" class="max-w-full max-h-full object-contain"></canvas>

                              <div v-if="!videoCropPreviewPlaying" class="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">

                                <span class="text-white text-sm">{{ t('clickPlayPreview') }}</span>

                              </div>

                            </div>

                          </div>

                          <div class="flex-1 min-w-[260px] flex flex-col justify-center gap-3">

                            <button class="btn-primary w-fit" @click="toggleCropVideoPreview">{{ videoCropPreviewPlaying ? t('pausePreview') : t('playPreview') }}</button>

                            <div class="text-xs text-af-muted space-y-1">

                              <div>{{ t('previewRange') }}: {{ fmtFixed(video.rangeStart) }}s ~ {{ fmtFixed(video.rangeEnd) }}s</div>

                              <div>{{ t('currentTime') }}: {{ fmtFixed(sourceVideo?.currentTime) }}s</div>

                            </div>

                          </div>

                        </div>

                      </div>

                      <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                        <div class="panel-title"><span>{{ t('extractSettings') }}</span><HelpBtn :text="t('extractHelp')" /></div>

                        <div class="form-row">

                          <div class="form-group"><label class="form-label">{{ t('extractFps') }}</label><input v-model.number="video.fps" type="number" min="1" max="60" class="form-input" @wheel="wheelNumber($event, 'video.fps', 1, 60)" /></div>

                          <div class="form-group"><label class="form-label">{{ t('outputWidth') }}</label><input v-model.number="video.outW" type="number" min="1" max="2048" class="form-input" @input="syncVideoOutSize('width')" /></div>

                          <div class="form-group"><label class="form-label">{{ t('outputHeight') }}</label><input v-model.number="video.outH" type="number" min="1" max="2048" class="form-input" @input="syncVideoOutSize('height')" /></div>

                          <label class="flex items-center gap-1.5 text-xs text-af-muted self-end pb-2"><input v-model="video.lockAspect" type="checkbox"> {{ t('lockAspect') }}</label>

                          <div class="form-group"><label class="form-label">{{ t('estFrames') }}</label><input :value="videoEstFrames" readonly class="form-input" /></div>

                        </div>

                        <div class="form-row mt-2">

                          <div class="form-group"><label class="form-label">{{ t('rangeStart') }}</label><input v-model.number="video.rangeStart" type="number" min="0" :max="video.duration" step="0.01" class="form-input" @wheel="wheelNumber($event, 'video.rangeStart', 0, video.duration)" @blur="refreshVideoCropPreview" /></div>

                          <div class="form-group"><label class="form-label">{{ t('rangeEnd') }}</label><input v-model.number="video.rangeEnd" type="number" min="0" :max="video.duration" step="0.01" class="form-input" @wheel="wheelNumber($event, 'video.rangeEnd', 0, video.duration)" @blur="refreshVideoCropPreview" /></div>

                          <div class="form-group"><label class="form-label">{{ t('selectedDuration') }}</label><input :value="fmtFixed(num(video.rangeEnd) - num(video.rangeStart))+'s'" readonly class="form-input" /></div>

                        </div>

                        <div class="form-row mt-2">

                          <div class="form-group"><label class="form-label">{{ t('rangeStart') }} {{ fmtFixed(video.rangeStart) }}s</label><div class="slider-wrap"><input v-model.number="video.rangeStart" type="range" min="0" :max="video.duration" step="0.01" class="flex-1 accent-af-accent h-1" @change="refreshVideoCropPreview"></div></div>

                          <div class="form-group"><label class="form-label">{{ t('rangeEnd') }} {{ fmtFixed(video.rangeEnd) }}s</label><div class="slider-wrap"><input v-model.number="video.rangeEnd" type="range" min="0" :max="video.duration" step="0.01" class="flex-1 accent-af-accent h-1" @change="refreshVideoCropPreview"></div></div>

                        </div>

                        <div v-if="video.progress > 0" class="h-1 bg-af-bg rounded overflow-hidden mt-3"><div class="h-full rounded bg-gradient-to-r from-af-accent to-af-accent2 transition-all" :style="{ width: video.progress + '%' }"></div></div>

                        <div class="flex gap-2 mt-3"><button class="btn-primary" :disabled="!!video.error || !video.width || !video.height" @click="extractVideoFrames">{{ t('extractFrames') }}</button></div>

                      </div>

                    </div>

                  </div>

</div>
</template>

<style scoped>
/* 组件级局部样式 */
</style>
