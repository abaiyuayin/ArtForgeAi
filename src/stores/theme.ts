// 导入 Pinia 与 Vue 响应式 API
import { ref } from 'vue'
import { defineStore } from 'pinia'

// 支持的主题类型：暗夜（默认）、光亮、书籍、护眼、樱花
type Theme = 'dark' | 'light' | 'book' | 'eye-care' | 'pink'

// 定义主题状态管理 store
export const useThemeStore = defineStore('theme', () => {
  // 默认使用暗夜主题
  const theme = ref<Theme>('dark')

  // 切换到指定主题
  function set(next: Theme) {
    theme.value = next
    apply()
  }

  // 循环切换主题：按 dark → light → book → eye-care → pink → dark 的顺序
  function cycle() {
    const order: Theme[] = ['dark', 'light', 'book', 'eye-care', 'pink']
    const idx = order.indexOf(theme.value)
    set(order[(idx + 1) % order.length])
  }

  // 将当前主题应用到根元素，并持久化到 localStorage
  function apply() {
    const root = document.documentElement
    // 先移除所有主题类名，避免多个主题类同时存在
    root.classList.remove('theme-light', 'theme-book', 'theme-eye-care', 'theme-pink', 'dark')
    // 暗夜主题使用 Tailwind 的 dark 模式
    if (theme.value === 'dark') {
      root.classList.add('dark')
    } else {
      // 非暗夜主题需要保留 dark 类以保持当前暗色组件样式，同时附加对应主题类
      root.classList.add('dark', `theme-${theme.value}`)
    }
    // 保存用户选择到本地存储
    localStorage.setItem('af-theme', theme.value)
  }

  // 初始化主题：读取 localStorage 中保存的设置并应用
  function init() {
    const saved = localStorage.getItem('af-theme') as Theme | null
    // 仅当保存值合法时才使用
    if (saved && ['dark', 'light', 'book', 'eye-care', 'pink'].includes(saved)) {
      theme.value = saved
    }
    apply()
  }

  return { theme, set, cycle, apply, init }
})
