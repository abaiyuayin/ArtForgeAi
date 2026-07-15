<script setup lang="ts">
// AnchorPicker：锚点选择器组件
// 在画布上显示当前帧，用户点击设置锚点（通常是脚底位置）
import { ref, watch, onMounted, inject } from 'vue'
import { loadImage } from '../../../../utils/export'

// 注入本地化函数（用于底部提示文字）
const t = inject<(key: string) => string>('t', (key) => key)

const props = defineProps<{
  charId: number
  frameIdx: number
  frames: { url: string; width: number; height: number }[]
  anchors: Record<string, { x: number; y: number }>
}>()

const emit = defineEmits<{
  (e: 'anchor-set', charId: number, frameIdx: number, x: number, y: number): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

// 绘制当前帧 + 已设锚点
async function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const frame = props.frames[props.frameIdx]
  if (!frame) return
  const img = await loadImage(frame.url)
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  // 已设锚点用红色十字标记
  const key = `${props.charId}-${props.frameIdx}`
  const anchor = props.anchors[key]
  if (anchor) {
    ctx.strokeStyle = '#ff4d4d'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(anchor.x - 8, anchor.y)
    ctx.lineTo(anchor.x + 8, anchor.y)
    ctx.moveTo(anchor.x, anchor.y - 8)
    ctx.lineTo(anchor.x, anchor.y + 8)
    ctx.stroke()
  }
}

// 点击设置锚点
function onClick(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width))
  const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height))
  emit('anchor-set', props.charId, props.frameIdx, x, y)
  draw()
}

watch(() => [props.charId, props.frameIdx, props.frames], draw, { deep: true })
onMounted(draw)
</script>

<template>
  <div class="inline-block">
    <canvas ref="canvasRef" @click="onClick" class="max-w-full max-h-[40vh] border border-af-rule rounded cursor-crosshair bg-af-bg" />
    <div class="text-xs text-af-muted mt-1">{{ t('normalizerAnchorTip') }}</div>
  </div>
</template>
