// 导入 vitest 测试工具与 Pinia
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from './theme'

// 主题切换 store 的单元测试
describe('useThemeStore', () => {
  // 每个测试前重置 Pinia、清空 localStorage 与根元素类名
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.className = ''
  })

  // 测试默认主题为暗夜，且应用 dark 类
  it('默认主题为暗夜，且应用 dark 类', () => {
    const store = useThemeStore()
    store.init()
    expect(store.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('theme-light')).toBe(false)
  })

  // 测试切换到光亮主题后添加 theme-light 类
  it('切换到光亮主题后添加 theme-light 类', () => {
    const store = useThemeStore()
    store.init()
    store.set('light')
    expect(store.theme).toBe('light')
    expect(document.documentElement.classList.contains('theme-light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  // 测试循环切换主题按正确顺序进行
  it('循环切换主题按正确顺序进行', () => {
    const store = useThemeStore()
    store.init()
    const order = ['dark', 'light', 'book', 'eye-care', 'pink']
    order.forEach((expected) => {
      expect(store.theme).toBe(expected)
      store.cycle()
    })
    expect(store.theme).toBe('dark')
  })

  // 测试初始化时读取 localStorage 保存的主题
  it('初始化时读取 localStorage 保存的主题', () => {
    localStorage.setItem('af-theme', 'pink')
    const store = useThemeStore()
    store.init()
    expect(store.theme).toBe('pink')
    expect(document.documentElement.classList.contains('theme-pink')).toBe(true)
  })
})
