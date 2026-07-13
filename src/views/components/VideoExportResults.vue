<script setup lang="ts">
// VideoExportResults：视频转序列帧步骤 3 —— 导出选项、生成预览、下载

import { useVideoToFrames } from '../../composables/useVideoToFrames'
import HelpBtn from './HelpBtn.vue'

// 通过共享 composable 获取视频步骤 3 所需状态与方法
const {
  t,
  video,
  exportPreviewVideo,
  generateVideoExportPreview,
  downloadVideoExport,
  downloadVideoSprite,
  applyExportPreset,
  selectOnFocus,
  handleExportNameKeydown,
} = useVideoToFrames()
</script>

<template>
  <div v-if="video.step === 3" class="space-y-3">

    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

      <div class="panel-title"><span>{{ t('exportOptions') }}</span><HelpBtn :text="t('exportHelp')" /></div>

      <div class="form-row">

        <div class="form-group"><label class="form-label">{{ t('exportFormat') }}</label><select v-model="video.export.format" class="form-select"><option value="video">{{ t('videoWebm') }}</option><option value="gif">GIF</option><option value="zip">{{ t('framesZip') }}</option><option value="sprite">{{ t('sprite') }}</option></select></div>

        <div v-if="video.export.format === 'sprite' || video.export.format === 'zip'" class="form-group"><label class="form-label">{{ t('spriteCols') }}</label><input v-model.number="video.export.cols" type="number" min="1" class="form-input" /></div>

      </div>

      <div class="panel-title mt-2">{{ t('exportSize') }}</div>

      <div class="form-row">

        <div class="form-group"><label class="form-label">{{ t('preset') }}</label><select v-model="video.export.preset" class="form-select" @change="applyExportPreset"><option value="custom">{{ t('custom') }}</option><option value="64x64">64x64</option><option value="128x128">128x128</option><option value="256x455">256x455</option><option value="512x512">512x512</option><option value="512x910">512x910</option></select></div>

        <div class="form-group"><label class="form-label">{{ t('width') }}</label><input v-model.number="video.export.w" type="number" min="1" class="form-input" /></div>

        <div class="form-group"><label class="form-label">{{ t('height') }}</label><input v-model.number="video.export.h" type="number" min="1" class="form-input" /></div>

        <label class="flex items-center gap-1.5 text-xs text-af-muted self-end pb-2"><input v-model="video.export.lockAspect" type="checkbox" checked> {{ t('lockAspect') }}</label>

      </div>

      <div class="form-row">

        <div class="form-group"><label class="form-label">{{ t('compression') }}</label><select v-model="video.export.compression" class="form-select"><option value="none">{{ t('compressionNone') }}</option><option value="low">{{ t('compressionLow') }}</option><option value="medium">{{ t('compressionMed') }}</option><option value="high">{{ t('compressionHigh') }}</option></select></div>

        <div v-if="video.export.format === 'gif'" class="form-group"><label class="form-label">{{ t('gifDelay') }}</label><input v-model.number="video.export.delay" type="number" min="20" class="form-input" /></div>

        <div class="form-group"><label class="form-label">{{ t('filename') }}</label><input v-model="video.export.name" class="form-input" @focus="selectOnFocus($event)" @keydown="handleExportNameKeydown($event, 'video')"></div>

      </div>

      <div v-if="video.export.sizeEstimate" class="text-xs text-af-muted mt-2">{{ t('estSize') }}: {{ video.export.sizeEstimate }}</div>

      <div class="flex gap-2 mt-3 flex-wrap">

        <button class="btn-primary" @click="generateVideoExportPreview">{{ t('generatePreview') }}</button>

        <template v-if="video.export.format === 'sprite' && video.export.preview">

          <button class="btn-secondary" @click="downloadVideoSprite('sprite')">{{ t('downloadPng') }}</button>

          <button class="btn-secondary" @click="downloadVideoSprite('sprite-zip')">{{ t('spriteZip') }}</button>

          <button class="btn-secondary" @click="downloadVideoSprite('sprite-json')">{{ t('downloadJson') }}</button>

        </template>

        <button v-else-if="video.export.preview" class="btn-secondary" @click="downloadVideoExport">{{ t('download') }}</button>

      </div>

    </div>

    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

      <div class="panel-title">{{ t('exportPreview') }}</div>

      <div class="preview-box min-h-[320px]">

        <video v-if="video.export.preview && video.export.format === 'video'" ref="exportPreviewVideo" :src="video.export.preview" class="max-w-full max-h-full object-contain" controls autoplay loop muted></video>

        <img v-else-if="video.export.preview" :src="video.export.preview" class="max-w-full max-h-full object-contain" />

        <span v-else class="text-af-muted text-sm">{{ t('exportPreviewHint') }}</span>

      </div>

    </div>

  </div>
</template>

<style scoped>
/* 组件级局部样式，优先使用 Tailwind */
</style>
