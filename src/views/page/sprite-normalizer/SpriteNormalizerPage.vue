<script setup lang="ts">
// SpriteNormalizerPage：精灵图归一化独立页面
// 支持上传已有精灵图（可批量上传多角色），统一 trim + 缩放 + 对齐到统一画布，解决跨角色大小不一的问题
import { ref, reactive, inject } from 'vue'
import { loadImage } from '../../../utils/export'
import {
  normalizeToUniformCanvas,
  normalizeByBaseline,
  alignByAnchor,
  urlToImageData,
  imageDataToDataURL,
  type NormalizeOptions,
  type BaselineOptions,
  type NormalizedFrame,
} from '../../../utils/spriteBounds'
import UploadZone from '../../components/UploadZone.vue'
import HelpBtn from '../../components/HelpBtn.vue'
import AnchorPicker from './components/AnchorPicker.vue'
import NormalizePreview from './components/NormalizePreview.vue'

const t = inject<(key: string) => string>('t', (key) => key)
const emit = defineEmits<{
  (e: 'status', msg: string): void
  (e: 'toast', text: string, type?: 'info' | 'success' | 'warning' | 'error'): void
  (e: 'loading', open: boolean, text?: string): void
}>()

function setStatus(msg: string) { emit('status', msg) }
function toast(text: string, type: any = 'success') { emit('toast', text, type) }
function loading(open: boolean, text: string = '') { emit('loading', open, text) }

// ============ 状态 ============

// 角色（每个角色一张精灵图）列表
interface CharacterSprite {
  id: number
  name: string
  url: string              // 原始精灵图 URL
  width: number
  height: number
  cols: number             // 列数
  rows: number             // 行数
  frames: { url: string; width: number; height: number }[]  // 切分后的帧
}

const characters = ref<CharacterSprite[]>([])
let nextId = 1

// 当前步骤：1=上传切分 2=选择归一化方式 3=预览对比 4=导出
const step = ref(1)

// 归一化模式
const normalizeMode = ref<'uniform' | 'baseline' | 'anchor'>('uniform')

// 统一画布模式参数
const uniformOpts = reactive<NormalizeOptions>({
  mode: 'uniform',
  canvasW: 128,
  canvasH: 128,
  scaleMode: 'max',
  customScale: 1,
  align: 'bottom-center',
  padding: 0,
})

// 基准线模式参数
const baselineOpts = reactive<BaselineOptions>({
  mode: 'baseline',
  canvasW: 128,
  canvasH: 128,
  targetHeight: 64,
  baselineY: 120,
})

// 锚点模式：每帧的锚点（脚底中心），key = `${charId}-${frameIdx}`
const anchorMap = reactive<Record<string, { x: number; y: number }>>({})

// 归一化结果
const normalizedFrames = ref<{ charId: number; frames: NormalizedFrame[] }[]>([])

// 当前选中的角色（用于锚点选择交互）
const activeCharId = ref<number | null>(null)
const activeFrameIdx = ref(0)

// ============ 步骤 1：上传与切分 ============

// 处理上传：每个文件作为一个角色精灵图
async function handleFiles(files: File | File[]) {
  const list = Array.isArray(files) ? files : [files]
  loading(true, t('loading'))
  try {
    for (const file of list) {
      const url = URL.createObjectURL(file)
      const img = await loadImage(url)
      const char: CharacterSprite = {
        id: nextId++,
        name: file.name.replace(/\.[^.]+$/, ''),
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
        cols: 4,
        rows: Math.ceil(1),
        frames: [],
      }
      // 默认按 4 列切分，行数自动
      char.rows = Math.ceil(1) // 先占位，切分时计算
      characters.value.push(char)
    }
    // 切分所有角色
    for (const char of characters.value) {
      await sliceCharacter(char)
    }
    setStatus(t('normalizerUploaded') + ` (${characters.value.length})`)
    if (characters.value.length) {
      activeCharId.value = characters.value[0].id
      step.value = 2
    }
  } catch (e) {
    toast(t('normalizerUploadFail'), 'error')
  } finally {
    loading(false)
  }
}

// 按列数切分角色精灵图为独立帧
async function sliceCharacter(char: CharacterSprite) {
  const img = await loadImage(char.url)
  const cellW = Math.floor(char.width / char.cols)
  const rows = Math.ceil(img.naturalHeight / cellW)
  char.rows = rows
  char.frames = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < char.cols; c++) {
      const x = c * cellW
      const y = r * cellW
      if (x >= char.width || y >= img.naturalHeight) continue
      const canvas = document.createElement('canvas')
      canvas.width = cellW
      canvas.height = cellW
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, x, y, cellW, cellW, 0, 0, cellW, cellW)
      char.frames.push({
        url: canvas.toDataURL('image/png'),
        width: cellW,
        height: cellW,
      })
    }
  }
}

// 修改某角色列数后重新切分
async function onColsChange(char: CharacterSprite) {
  loading(true, t('loading'))
  try {
    await sliceCharacter(char)
    setStatus(t('normalizerResliced'))
  } finally {
    loading(false)
  }
}

// 删除角色
function removeCharacter(id: number) {
  const idx = characters.value.findIndex(c => c.id === id)
  if (idx >= 0) characters.value.splice(idx, 1)
  if (activeCharId.value === id) {
    activeCharId.value = characters.value[0]?.id ?? null
  }
}

// ============ 步骤 2：归一化 ============

// 收集所有角色的所有帧（用于跨角色统一归一化）
async function collectAllFrames(): Promise<{ charId: number; frames: ImageData[] }[]> {
  const result: { charId: number; frames: ImageData[] }[] = []
  for (const char of characters.value) {
    const frames = await Promise.all(char.frames.map(f => urlToImageData(f.url)))
    result.push({ charId: char.id, frames })
  }
  return result
}

// 执行归一化
async function runNormalize() {
  if (!characters.value.length) return
  loading(true, t('normalizerProcessing'))
  try {
    const allData = await collectAllFrames()
    normalizedFrames.value = []

    if (normalizeMode.value === 'anchor') {
      // 锚点模式：每角色单独处理（锚点可能不同）
      for (const { charId, frames } of allData) {
        const anchors = frames.map((_, i) => {
          const key = `${charId}-${i}`
          return anchorMap[key] || { x: frames[i].width / 2, y: frames[i].height }
        })
        const opts: NormalizeOptions = {
          mode: 'uniform',
          canvasW: uniformOpts.canvasW,
          canvasH: uniformOpts.canvasH,
          scaleMode: 'max',
          align: 'bottom-center',
          padding: uniformOpts.padding,
        }
        const normalized = alignByAnchor(frames, anchors, opts)
        normalizedFrames.value.push({ charId, frames: normalized })
      }
    } else if (normalizeMode.value === 'baseline') {
      // 基准线模式：每角色单独处理（参数相同）
      for (const { charId, frames } of allData) {
        const normalized = normalizeByBaseline(frames, {
          canvasW: baselineOpts.canvasW,
          canvasH: baselineOpts.canvasH,
          targetHeight: baselineOpts.targetHeight,
          baselineY: baselineOpts.baselineY,
        })
        normalizedFrames.value.push({ charId, frames: normalized })
      }
    } else {
      // 统一画布模式：跨角色统一处理（scaleMode='max' 时以所有帧最大内容高度为基准）
      const allFrames = allData.flatMap(d => d.frames)
      const normalized = normalizeToUniformCanvas(allFrames, uniformOpts)
      // 按角色重新分组
      let offset = 0
      for (const { charId, frames } of allData) {
        const charNormalized = normalized.slice(offset, offset + frames.length)
        normalizedFrames.value.push({ charId, frames: charNormalized })
        offset += frames.length
      }
    }
    step.value = 3
    setStatus(t('normalizerDone'))
  } catch (e) {
    toast(t('normalizerFail'), 'error')
  } finally {
    loading(false)
  }
}

// ============ 步骤 3/4：预览与导出 ============

// 获取归一化后的帧 URL（用于预览和导出）
function getNormalizedUrls(charId: number): string[] {
  const result = normalizedFrames.value.find(n => n.charId === charId)
  if (!result) return []
  return result.frames.map(f => imageDataToDataURL(f.data))
}

// 下载归一化后的精灵图（单角色）
async function downloadNormalized(charId: number) {
  const char = characters.value.find(c => c.id === charId)
  if (!char) return
  const urls = getNormalizedUrls(charId)
  if (!urls.length) return
  loading(true, t('downloading'))
  try {
    const cols = char.cols
    const cellW = uniformOpts.canvasW
    const cellH = uniformOpts.canvasH
    const rows = Math.ceil(urls.length / cols)
    const c = document.createElement('canvas')
    c.width = cols * cellW
    c.height = rows * cellH
    const ctx = c.getContext('2d')!
    for (let i = 0; i < urls.length; i++) {
      const img = await loadImage(urls[i])
      ctx.drawImage(img, (i % cols) * cellW, Math.floor(i / cols) * cellH)
    }
    const a = document.createElement('a')
    a.href = c.toDataURL('image/png')
    a.download = char.name + '_normalized.png'
    a.click()
    setStatus(t('normalizerDownloaded'))
  } finally {
    loading(false)
  }
}

// 下载所有角色的归一化精灵图（ZIP）
async function downloadAllNormalized() {
  if (!normalizedFrames.value.length) return
  loading(true, t('downloading'))
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    for (const char of characters.value) {
      const urls = getNormalizedUrls(char.id)
      if (!urls.length) continue
      const cols = char.cols
      const cellW = normalizeMode.value === 'baseline' ? baselineOpts.canvasW : uniformOpts.canvasW
      const cellH = normalizeMode.value === 'baseline' ? baselineOpts.canvasH : uniformOpts.canvasH
      const rows = Math.ceil(urls.length / cols)
      const c = document.createElement('canvas')
      c.width = cols * cellW
      c.height = rows * cellH
      const ctx = c.getContext('2d')!
      for (let i = 0; i < urls.length; i++) {
        const img = await loadImage(urls[i])
        ctx.drawImage(img, (i % cols) * cellW, Math.floor(i / cols) * cellH)
      }
      const blob = await new Promise<Blob>(resolve => c.toBlob(b => resolve(b!), 'image/png'))
      zip.file(char.name + '_normalized.png', blob)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const { saveAs } = await import('file-saver')
    saveAs(blob, 'normalized_sprites.zip')
    setStatus(t('normalizerDownloaded'))
  } finally {
    loading(false)
  }
}

// 锚点选择回调
function onAnchorSet(charId: number, frameIdx: number, x: number, y: number) {
  anchorMap[`${charId}-${frameIdx}`] = { x, y }
  toast(t('normalizerAnchorSet'), 'success')
}
</script>

<template>
  <div class="flex flex-col flex-1 overflow-auto p-5">
    <!-- 步骤指示器 -->
    <div class="flex items-center gap-2 mb-4 text-sm">
      <span v-for="(label, i) in [t('normalizerStep1'), t('normalizerStep2'), t('normalizerStep3'), t('normalizerStep4')]" :key="i"
        class="px-3 py-1 rounded-full" :class="step >= i + 1 ? 'bg-af-accent text-black' : 'bg-af-surface text-af-muted'">
        {{ i + 1 }}. {{ label }}
      </span>
    </div>

    <!-- 步骤 1：上传与切分 -->
    <section v-if="step === 1" class="space-y-4">
      <div class="bg-af-surface border border-af-rule rounded-lg p-4">
        <div class="panel-title">{{ t('normalizerUploadTitle') }}<HelpBtn :text="t('normalizerUploadHelp')" /></div>
        <UploadZone :multiple="true" accept="image/png,image/jpeg" @upload="handleFiles" />
      </div>
    </section>

    <!-- 已上传角色列表 -->
    <section v-if="characters.length" class="space-y-3">
      <div v-for="char in characters" :key="char.id" class="bg-af-surface border border-af-rule rounded-lg p-3">
        <div class="flex items-center gap-3 mb-2">
          <img :src="char.url" class="w-16 h-16 object-contain bg-af-bg rounded border border-af-rule" />
          <div class="flex-1">
            <div class="text-sm font-medium text-af-ink">{{ char.name }}</div>
            <div class="text-xs text-af-muted">{{ char.width }}×{{ char.height }} · {{ char.frames.length }} {{ t('normalizerFrames') }}</div>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-af-muted">{{ t('normalizerCols') }}</label>
            <input v-model.number="char.cols" type="number" min="1" class="form-input w-20" @change="onColsChange(char)" />
          </div>
          <button class="btn-secondary btn-sm" @click="removeCharacter(char.id)">{{ t('remove') }}</button>
        </div>
        <div class="grid grid-cols-8 gap-1">
          <img v-for="(f, i) in char.frames.slice(0, 16)" :key="i" :src="f.url" class="w-full aspect-square object-contain bg-af-bg rounded border border-af-rule" />
          <div v-if="char.frames.length > 16" class="flex items-center justify-center text-xs text-af-muted">+{{ char.frames.length - 16 }}</div>
        </div>
      </div>

      <!-- 步骤 2：选择归一化方式 -->
      <section v-if="step >= 2" class="bg-af-surface border border-af-rule rounded-lg p-4 space-y-3">
        <div class="panel-title">{{ t('normalizerModeTitle') }}</div>
        <div class="flex gap-2">
          <button v-for="m in [
            { v: 'uniform', label: t('normalizeModeUniform') },
            { v: 'baseline', label: t('normalizeModeBaseline') },
            { v: 'anchor', label: t('normalizerModeAnchor') }
          ]" :key="m.v" class="px-3 py-1.5 rounded-md text-sm"
            :class="normalizeMode === m.v ? 'bg-af-accent text-black' : 'bg-af-bg text-af-muted hover:text-af-ink'"
            @click="normalizeMode = m.v as any">
            {{ m.label }}
          </button>
        </div>

        <!-- 统一画布参数 -->
        <div v-if="normalizeMode === 'uniform'" class="form-row">
          <div class="form-group"><label class="form-label">{{ t('normalizeCanvasW') }}</label><input v-model.number="uniformOpts.canvasW" type="number" min="1" class="form-input" /></div>
          <div class="form-group"><label class="form-label">{{ t('normalizeCanvasH') }}</label><input v-model.number="uniformOpts.canvasH" type="number" min="1" class="form-input" /></div>
          <div class="form-group"><label class="form-label">{{ t('normalizeScaleMode') }}</label>
            <select v-model="uniformOpts.scaleMode" class="form-select">
              <option value="max">{{ t('normalizeScaleMax') }}</option>
              <option value="fit">{{ t('normalizeScaleFit') }}</option>
              <option value="custom">{{ t('normalizeScaleCustom') }}</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">{{ t('normalizeAlign') }}</label>
            <select v-model="uniformOpts.align" class="form-select">
              <option value="bottom-center">{{ t('normalizeAlignBottom') }}</option>
              <option value="center">{{ t('normalizeAlignCenter') }}</option>
              <option value="top-center">{{ t('normalizeAlignTop') }}</option>
            </select>
          </div>
        </div>

        <!-- 基准线参数 -->
        <div v-if="normalizeMode === 'baseline'" class="form-row">
          <div class="form-group"><label class="form-label">{{ t('normalizeCanvasW') }}</label><input v-model.number="baselineOpts.canvasW" type="number" min="1" class="form-input" /></div>
          <div class="form-group"><label class="form-label">{{ t('normalizeCanvasH') }}</label><input v-model.number="baselineOpts.canvasH" type="number" min="1" class="form-input" /></div>
          <div class="form-group"><label class="form-label">{{ t('normalizeTargetHeight') }}</label><input v-model.number="baselineOpts.targetHeight" type="number" min="1" class="form-input" /></div>
          <div class="form-group"><label class="form-label">{{ t('normalizeBaselineY') }}</label><input v-model.number="baselineOpts.baselineY" type="number" min="0" class="form-input" /></div>
        </div>

        <!-- 锚点选择 -->
        <div v-if="normalizeMode === 'anchor' && activeCharId !== null" class="space-y-2">
          <div class="flex items-center gap-2">
            <label class="text-sm text-af-muted">{{ t('normalizerSelectChar') }}</label>
            <select v-model="activeCharId" class="form-select">
              <option v-for="char in characters" :key="char.id" :value="char.id">{{ char.name }}</option>
            </select>
            <label class="text-sm text-af-muted">{{ t('normalizerFrame') }}</label>
            <input v-model.number="activeFrameIdx" type="number" min="0" :max="characters.find(c => c.id === activeCharId)?.frames.length || 0" class="form-input w-20" />
          </div>
          <AnchorPicker v-if="activeCharId !== null"
            :char-id="activeCharId"
            :frame-idx="activeFrameIdx"
            :frames="characters.find(c => c.id === activeCharId)?.frames || []"
            :anchors="anchorMap"
            @anchor-set="onAnchorSet" />
        </div>

        <button class="btn-primary" @click="runNormalize">{{ t('normalizerRun') }}</button>
      </section>

      <!-- 步骤 3：预览对比 -->
      <section v-if="step >= 3 && normalizedFrames.length" class="bg-af-surface border border-af-rule rounded-lg p-4 space-y-3">
        <div class="panel-title">{{ t('normalizerPreviewTitle') }}</div>
        <NormalizePreview :characters="characters" :normalized-frames="normalizedFrames" />
      </section>

      <!-- 步骤 4：导出 -->
      <section v-if="step >= 3 && normalizedFrames.length" class="bg-af-surface border border-af-rule rounded-lg p-4 space-y-2">
        <div class="panel-title">{{ t('exportOptions') }}</div>
        <div class="flex gap-2 flex-wrap">
          <button v-for="char in characters" :key="char.id" class="btn-secondary btn-sm" @click="downloadNormalized(char.id)">
            {{ char.name }} PNG
          </button>
          <button class="btn-primary" @click="downloadAllNormalized">{{ t('normalizerDownloadAll') }}</button>
        </div>
      </section>
    </section>
  </div>
</template>