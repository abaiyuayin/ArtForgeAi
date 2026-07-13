<script setup lang="ts">// ImageToFramesPage：从 WorkspaceView.vue 抽取的独立页面组件
import { ref, reactive, computed, nextTick, watch, inject } from 'vue'
import { loadImage, downloadUrl, formatBytes, dataUrlToBlob, compressionQuality } from '../../utils/export'
import { fileToDataUrl, useLibrarySaver } from '../../composables/useLibrary'

import UploadZone from '../components/UploadZone.vue'

import HelpBtn from '../components/HelpBtn.vue'

const t = inject<(key: string) => string>('t', (key) => key)
const emit = defineEmits<{
  (e: 'status', msg: string): void
  (e: 'pick-asset', type: string, callback: (asset: any) => void, keepOpen?: boolean): void
}>()

// 简化版状态/提示/确认：从父组件注入或使用 emit
function setStatus(msg: string) { emit('status', msg) }
function openAssetPicker(type: string, callback: (asset: any) => void, keepOpen = false) {
  emit('pick-asset', type, callback, keepOpen)
}

// 资源库保存函数
const { saveToLibrary } = useLibrarySaver()

// 图片转序列帧状态：源图列表、布局参数、预览动画参数

const sprite = reactive({

  images: [] as { url: string; file?: File | null }[],

  cols: 4, padding: 2, bg: 'transparent',

  previewFps: 10, playing: false, animFrame: 0,

  compression: 'none' as 'none' | 'low' | 'medium' | 'high'

})



// 右侧预览模块的画布引用

const spritePreviewCanvas = ref<HTMLCanvasElement | null>(null)



// 压缩大小估算：实时显示所有帧在选定压缩等级下的总预估体积与平均每帧体积

const spriteCompressionSize = ref('')

async function updateSpriteCompressionSize() {

  if (!sprite.images.length) { spriteCompressionSize.value = ''; return }

  try {

    if (sprite.compression === 'none') {

      // 无压缩模式：直接用原始文件大小累加

      let total = 0

      for (const im of sprite.images) total += im.file?.size || 0

      const perFrame = Math.round(total / Math.max(1, sprite.images.length))

      spriteCompressionSize.value = `${formatBytes(total)} (${t('perFrame')}${formatBytes(perFrame)})`

    } else {

      // 压缩模式：按压缩等级降低分辨率后导出 PNG，测量压缩后体积

      let total = 0

      const q = compressionQuality(sprite.compression)

      for (const im of sprite.images) {

        const img = await loadImage(im.url)

        const outW = Math.max(1, Math.round(img.naturalWidth * q.scale))

        const outH = Math.max(1, Math.round(img.naturalHeight * q.scale))

        const c = document.createElement('canvas')

        c.width = outW; c.height = outH

        c.getContext('2d')!.drawImage(img, 0, 0, outW, outH)

        const dataUrl = c.toDataURL('image/png')

        total += dataUrlToBlob(dataUrl).size

      }

      const perFrame = Math.round(total / Math.max(1, sprite.images.length))

      spriteCompressionSize.value = `${formatBytes(total)} (${t('perFrame')}${formatBytes(perFrame)})`

    }

  } catch {

    spriteCompressionSize.value = ''

  }

}

// 监听压缩等级、图片列表变化，实时重新计算

watch(() => [sprite.compression, sprite.images.length], () => updateSpriteCompressionSize(), { immediate: true })



// 根据总帧数和列数自动计算行数

const spriteRows = computed(() => Math.ceil(sprite.images.length / sprite.cols))



// 动画循环的定时器引用

let spriteAnimTimer: ReturnType<typeof setTimeout> | null = null



// 压缩预览图片缓存：key = 原图 URL + 压缩等级

const spriteImageCache = new Map<string, string>()



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

  ctx.drawImage(img, 0, 0, outW, outH)

  const compressed = c.toDataURL('image/png')

  spriteImageCache.set(key, compressed)

  return compressed

}



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

// 若启用压缩，则预览中显示压缩后的图像效果

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

// 若启用压缩，预览中显示压缩后的图像效果

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

// 压缩等级变化时清空缓存并重新绘制预览，以实时展示压缩效果

watch(() => sprite.compression, () => {

  spriteImageCache.clear()

  if (!sprite.playing) drawSpritePreview()

})



// 导出用：在独立画布上绘制原始分辨率的 Sprite Sheet

function exportSpriteSheet(): Promise<string> {

  return new Promise((resolve) => {

    const c = document.createElement('canvas')

    const ctx = c.getContext('2d')!

    const img = new Image()

    img.onload = () => {

      const cellW = img.width, cellH = img.height

      const fullW = sprite.cols * cellW + (sprite.cols + 1) * sprite.padding

      const fullH = spriteRows.value * cellH + (spriteRows.value + 1) * sprite.padding

      c.width = fullW

      c.height = fullH

      // 始终导出 PNG 格式；透明背景保持透明，非透明背景按用户选择填充

      if (sprite.bg !== 'transparent') {

        ctx.fillStyle = sprite.bg

        ctx.fillRect(0, 0, c.width, c.height)

      }

      // 并发加载所有源图，全部就绪后一次性绘制

      Promise.all(sprite.images.map(im => new Promise<HTMLImageElement>((res) => {

        const img2 = new Image()

        img2.onload = () => res(img2)

        img2.src = im.url

      }))).then((loadedImages) => {

        loadedImages.forEach((img2, i) => {

          const x = (i % sprite.cols) * cellW + ((i % sprite.cols) + 1) * sprite.padding

          const y = Math.floor(i / sprite.cols) * cellH + (Math.floor(i / sprite.cols) + 1) * sprite.padding

          ctx.drawImage(img2, x, y)

        })

        // 导出格式固定为 PNG

        resolve(c.toDataURL('image/png'))

      })

    }

    img.src = sprite.images[0].url

  })

}



// 下载原始分辨率 Sprite Sheet PNG

async function downloadSpriteSheet() {

  const dataUrl = await exportSpriteSheet()

  downloadUrl(dataUrl, 'sprite_sheet.png')

}



// 下载 Sprite Sheet JSON 元数据（列、行、间距、帧数）

function downloadSpriteJson() {

  const data = { cols: sprite.cols, rows: spriteRows.value, padding: sprite.padding, frames: sprite.images.length }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })

  downloadUrl(URL.createObjectURL(blob), 'sprite_sheet.json')

}



// 保存原始分辨率 Sprite Sheet 到资源库

async function saveSpriteToLibrary() {

  const dataUrl = await exportSpriteSheet()

  saveToLibrary(dataUrl, 'sprite')

}
</script>

<template>
<div class="space-y-3">
<UploadZone v-if="!sprite.images.length" accept="image/*" multiple :prompt="t('uploadImages')" :hint="t('uploadImagesHint')" @files="loadSpriteImages($event)" />

                  <button v-if="!sprite.images.length" class="btn-secondary btn-sm mt-2" @click="importSpriteFromLibrary">{{ t('importFromLibrary') }}</button>

                  <div v-else class="space-y-3">

                    <!-- 布局设置面板：与视频/GIF 提取设置面板对齐（顶部整宽） -->

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                      <div class="panel-title"><span>{{ t('layoutSettings') }}</span><HelpBtn :text="t('spriteHelp')" /></div>

                      <div class="form-row">

                        <div class="form-group"><label class="form-label">{{ t('columns') }}</label><input v-model.number="sprite.cols" type="number" min="1" class="form-input" /></div>

                        <div class="form-group"><label class="form-label">{{ t('rows') }}</label><input :value="spriteRows" readonly class="form-input" /></div>

                        <div class="form-group"><label class="form-label">{{ t('padding') }}</label><input v-model.number="sprite.padding" type="number" min="0" class="form-input" /></div>

                        <div class="form-group"><label class="form-label">{{ t('bg') }}</label><select v-model="sprite.bg" class="form-select"><option value="transparent">{{ t('transparent') }}</option><option value="#000000">{{ t('black') }}</option><option value="#ffffff">{{ t('white') }}</option></select></div>

                        <div class="form-group">

                          <label class="form-label">{{ t('compression') }}</label>

                          <select v-model="sprite.compression" class="form-select"><option value="none">{{ t('compressionNone') }}</option><option value="low">{{ t('compressionLow') }}</option><option value="medium">{{ t('compressionMed') }}</option><option value="high">{{ t('compressionHigh') }}</option></select>

                          <div class="text-[11px] text-af-muted mt-1.5 block">{{ t('estCompressSize') }}: {{ spriteCompressionSize || t('calculating') }}</div>

                        </div>

                      </div>

                      <div class="flex gap-2 mt-3"><button class="btn-primary" @click="downloadSpriteSheet">{{ t('downloadPng') }}</button><button class="btn-secondary" @click="downloadSpriteJson">{{ t('downloadJson') }}</button><button class="btn-secondary" @click="saveSpriteToLibrary">{{ t('saveToLibrary') }}</button></div>

                    </div>

                    <!-- 两栏布局：左侧为源图片网格，右侧为独立预览模块，与视频/GIF 转序列帧对齐 -->

                    <div class="flex gap-3 flex-wrap">

                      <!-- 左侧：源图片网格，7 列，与视频/GIF 帧网格对齐 -->

                      <div class="flex-1 min-w-[260px] space-y-2.5">

                        <div class="text-[13px] font-semibold mb-0.5">{{ t('sourceImages') }} ({{ sprite.images.length }})</div>

                        <div class="grid grid-cols-7 gap-2.5">

                          <div v-for="(img,i) in sprite.images" :key="i" class="bg-af-surface border border-af-rule rounded-md overflow-hidden relative group"><img :src="img.url" class="w-full object-contain bg-[#0e0e14]"><div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button class="w-7 h-7 rounded-md bg-white/15 text-white flex items-center justify-center" @click="sprite.images.splice(i,1)"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div></div>

                        </div>

                      </div>

                      <!-- 右侧：序列帧预览模块（画布放大填充 + FPS + 播放按钮紧随滚动条下方） -->

                      <div class="w-72 shrink-0 self-start flex flex-col gap-2.5">

                        <!-- 预览画布容器：固定 320px 高度，让右侧模块有足够空间放大展示小图 -->

                        <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden relative h-[320px]"><canvas ref="spritePreviewCanvas" class="w-full h-full block"></canvas></div>

                        <!-- FPS 控制面板：播放按钮紧跟在滚动条正下方，不被推到底部 -->

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

                  </div>

                </div>
</template>
