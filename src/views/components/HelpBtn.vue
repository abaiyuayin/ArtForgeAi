<script setup lang="ts">
// 帮助按钮组件：点击后通过全局自定义事件显示帮助文本

// 组件属性
const props = defineProps<{
  text: string
}>()

// 点击时触发全局帮助事件
function onClick(e: MouseEvent) {
  e.stopPropagation()
  window.dispatchEvent(new CustomEvent('af-open-help', { detail: props.text }))
}
</script>

<template>
  <button
    class="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-af-surface-hover text-af-muted border border-af-rule text-[11px] ml-1.5 cursor-help hover:text-af-accent hover:border-af-accent"
    @click="onClick"
  >
    ?
  </button>
</template>
