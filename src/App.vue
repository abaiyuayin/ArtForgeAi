<template>
  <!-- 根路由出口：根据当前路由渲染对应页面组件 -->
  <router-view />
</template>

<script setup lang="ts">
// 导入 Vue 生命周期钩子与主题状态管理
import { onMounted } from 'vue'
import { useThemeStore } from './stores/theme'

// 应用根组件：负责在挂载时初始化主题
const themeStore = useThemeStore()
onMounted(() => {
  // 初始化并应用用户保存的主题设置
  themeStore.init()
})
</script>
