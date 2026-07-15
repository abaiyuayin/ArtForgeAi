<script setup lang="ts">
// NormalizePreview：归一化前后对比预览组件
// 左侧显示原始帧网格，右侧显示归一化后帧网格，底部显示跨角色并排对比
import { computed, inject } from 'vue'
import { imageDataToDataURL, type NormalizedFrame } from '../../../../utils/spriteBounds'

// 注入本地化函数
const t = inject<(key: string) => string>('t', (key) => key)

// 组件属性：原始角色列表 + 归一化结果
const props = defineProps<{
  characters: {
    id: number
    name: string
    url: string
    width: number
    height: number
    cols: number
    rows: number
    frames: { url: string; width: number; height: number }[]
  }[]
  normalizedFrames: { charId: number; frames: NormalizedFrame[] }[]
}>()

// 归一化后的帧 URL 映射：charId → dataURL[]
const normalizedUrls = computed(() => {
  const map: Record<number, string[]> = {}
  for (const item of props.normalizedFrames) {
    // 缓存归一化帧的 dataURL，避免每次渲染重复转换
    map[item.charId] = item.frames.map(f => imageDataToDataURL(f.data))
  }
  return map
})

// 获取某角色的归一化帧 URL
function getNormalizedUrls(charId: number): string[] {
  return normalizedUrls.value[charId] || []
}

// 获取某角色归一化后首帧的画布尺寸（用于显示 X→Y 对比）
function getNormalizedSize(charId: number): { w: number; h: number } {
  const frames = props.normalizedFrames.find(n => n.charId === charId)?.frames
  if (frames && frames[0]) return { w: frames[0].data.width, h: frames[0].data.height }
  return { w: 0, h: 0 }
}
</script>

<template>
  <div class="space-y-4">
    <!-- 逐角色前后对比 -->
    <div v-for="char in characters" :key="char.id" class="border border-af-rule rounded-lg p-3">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm font-medium text-af-ink">{{ char.name }}</div>
        <div class="text-xs text-af-muted">
          {{ char.width }}×{{ char.height }} → {{ getNormalizedSize(char.id).w }}×{{ getNormalizedSize(char.id).h }}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <!-- 左侧：原始帧网格 -->
        <div>
          <div class="text-xs text-af-muted mb-1.5">{{ t('original') }}</div>
          <div class="grid grid-cols-8 gap-1 bg-af-bg p-1.5 rounded border border-af-rule">
            <div v-for="(f, i) in char.frames" :key="i" class="aspect-square flex items-center justify-center">
              <img :src="f.url" class="max-w-full max-h-full object-contain" />
            </div>
          </div>
        </div>

        <!-- 右侧：归一化后帧网格 -->
        <div>
          <div class="text-xs text-af-muted mb-1.5">{{ t('normalizeTitle') }}</div>
          <div class="grid grid-cols-8 gap-1 bg-af-bg p-1.5 rounded border border-af-rule">
            <div v-for="(url, i) in getNormalizedUrls(char.id)" :key="i" class="aspect-square flex items-center justify-center">
              <img :src="url" class="max-w-full max-h-full object-contain" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 跨角色并排对比预览：验证所有角色画布尺寸与视觉身高一致 -->
    <div class="border border-af-rule rounded-lg p-3">
      <div class="text-sm font-medium text-af-ink mb-2">{{ t('normalizerCrossCharTitle') }}</div>
      <div class="flex gap-3 flex-wrap items-end">
        <div v-for="char in characters" :key="'cross-' + char.id" class="flex flex-col items-center gap-1">
          <!-- 显示每个角色的第一帧归一化结果，便于横向对比尺寸 -->
          <div v-if="getNormalizedUrls(char.id)[0]" class="w-24 h-24 flex items-center justify-center bg-af-bg rounded border border-af-rule">
            <img
              :src="getNormalizedUrls(char.id)[0]"
              class="max-w-full max-h-full object-contain"
              style="image-rendering: pixelated;"
            />
          </div>
          <div v-else class="w-24 h-24 flex items-center justify-center text-xs text-af-muted bg-af-bg rounded border border-af-rule">-</div>
          <div class="text-xs text-af-muted truncate max-w-[100px]">{{ char.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
