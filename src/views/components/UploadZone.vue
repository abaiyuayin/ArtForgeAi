<script setup lang="ts">
// 文件拖拽上传区域组件：支持点击选择或拖拽上传

import { ref } from 'vue'

// 组件属性
const props = withDefaults(defineProps<{
  accept?: string
  multiple?: boolean
  prompt?: string
  hint?: string
}>(), {
  accept: '*',
  multiple: false,
  prompt: '点击或拖拽上传',
  hint: ''
})

// 组件事件：统一输出 FileList，便于调用方统一处理
const emit = defineEmits<{
  (e: 'files', files: FileList): void
}>()

// 拖拽高亮状态
const drag = ref(false)
// 隐藏的文件输入框引用
const input = ref<HTMLInputElement | null>(null)

// 处理文件选择：无论单文件/多文件都包装为 FileList 再 emit
function onFiles(files: FileList | null) {
  if (files && files.length) {
    const list = files.length === 1 && !props.multiple
      ? (() => {
          const dt = new DataTransfer()
          dt.items.add(files[0])
          return dt.files
        })()
      : files
    emit('files', list)
  }
  if (input.value) input.value.value = ''
}

// 处理拖拽放下
function onDrop(e: DragEvent) {
  e.preventDefault()
  drag.value = false
  onFiles(e.dataTransfer?.files || null)
}

// 处理文件输入变化
function onChange(e: Event) {
  onFiles((e.target as HTMLInputElement).files)
}
</script>

<template>
  <div
    :class="[
      'border-2 border-dashed border-af-rule rounded-lg bg-af-surface text-af-muted text-center cursor-pointer transition-all duration-200 hover:border-af-accent hover:bg-af-accent-soft hover:text-af-ink hover:shadow-md hover:-translate-y-0.5 relative flex flex-col items-center justify-center p-6',
      drag ? 'border-af-accent bg-af-accent-soft text-af-ink shadow-md' : ''
    ]"
    @dragover.prevent="drag = true"
    @dragleave="drag = false"
    @drop.prevent="onDrop"
  >
    <svg class="w-9 h-9 mb-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
    <div class="text-sm">{{ prompt }}</div>
    <div v-if="hint" class="text-xs text-af-muted mt-1.5">{{ hint }}</div>
    <input
      ref="input"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="absolute inset-0 opacity-0 cursor-pointer"
      @change="onChange"
    >
  </div>
</template>
