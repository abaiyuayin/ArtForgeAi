<script setup lang="ts">
// VideoProcessExtractFrames：视频转序列帧步骤 2 —— 帧网格、相似帧检测、预览播放、确认导出

import { useVideoToFrames } from '../../composables/useVideoToFrames'

// 通过共享 composable 获取视频步骤 2 所需状态与方法
const {
  t,
  video,
  videoAnimCanvas,
  similarColors,
  similarFrameStyle,
  detectSimilarFrames,
  selectAllFrames,
  deselectAllFrames,
  toggleVideoPreview,
  confirmVideoExport,
  handleFrameClick,
  handleFrameCheckbox,
} = useVideoToFrames()
</script>

<template>
  <div v-if="video.step === 2" class="space-y-3">

    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5 flex gap-2 flex-wrap items-center">

      <button class="btn-secondary" @click="detectSimilarFrames">{{ t('detectSimilar') }}</button>

      <button class="btn-secondary" @click="selectAllFrames">{{ t('selectAll') }}</button>

      <button class="btn-secondary" @click="deselectAllFrames">{{ t('deselectAll') }}</button>

      <div class="flex-1"></div>

      <span class="text-xs text-af-muted">{{ t('frameClickHint') }}</span>

    </div>

    <div class="flex gap-3 flex-wrap">

      <!-- 左侧：帧网格，7 列 -->
      <div class="flex-1 min-w-[260px] space-y-2.5">

        <div class="grid grid-cols-7 gap-2.5">
          <div v-for="(f, i) in video.frames" :key="i" class="bg-af-surface border rounded-md overflow-hidden cursor-pointer relative transition-all hover:border-af-accent" :class="f.selected ? 'border-af-accent' : 'border-af-rule'" :style="similarFrameStyle(f.similarGroup)" @click="handleFrameClick(i, 'video', $event)">
            <input type="checkbox" v-model="f.selected" class="absolute top-2 left-2 w-5 h-5 z-10 accent-af-accent" @click="handleFrameCheckbox(i, 'video', $event)">
            <div v-if="f.similarGroup !== -1" class="absolute top-0 left-0 right-0 h-1.5 z-10" :style="{ background: similarColors[f.similarGroup % similarColors.length] }"></div>
            <img :src="f.url" class="w-full object-contain bg-[#0e0e14]">
            <div class="px-2 py-1 text-[11px] text-af-muted flex justify-between">
              <span>#{{ i + 1 }}</span>
              <span v-if="f.similarGroup !== -1" class="text-xs font-bold" :style="{ color: similarColors[f.similarGroup % similarColors.length] }">G{{ f.similarGroup }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- 右侧：预览画布 + 播放/导出按钮 -->
      <div class="w-80 shrink-0 self-start flex flex-col gap-2.5">

        <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden relative min-h-[400px]"><canvas ref="videoAnimCanvas" class="max-w-full max-h-full"></canvas></div>

        <div class="form-group !mb-0 py-2">

          <label class="form-label text-sm">{{ t('previewFps') }}</label>

          <div class="slider-wrap items-center h-10">

            <input v-model.number="video.previewFps" type="range" min="1" max="60" class="flex-1 accent-af-accent h-2.5">

            <span class="slider-value text-base font-semibold w-10">{{ video.previewFps }}</span>

          </div>

        </div>

        <button class="btn-primary btn-sm w-full" @click="toggleVideoPreview">{{ video.playing ? t('pause') : t('play') }}</button>

        <button class="btn-primary w-full" @click="confirmVideoExport">{{ t('confirmExport') }}</button>

      </div>

    </div>

  </div>
</template>

<style scoped>
/* 组件级局部样式，优先使用 Tailwind */
</style>
