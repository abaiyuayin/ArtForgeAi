// 导入 Vue 应用创建函数与相关插件
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

// GitHub Pages SPA fallback: 404.html 会将访问路径以 ?redirect=/workspace 的形式带回
// 这里解析 redirect 参数，并用 history.replaceState 还原为干净路径，保证路由正常工作
const params = new URLSearchParams(window.location.search)
const redirect = params.get('redirect')
if (redirect) {
  const target = new URL(redirect, window.location.origin)
  const cleanSearch = target.search
  const cleanHash = target.hash
  window.history.replaceState({}, '', target.pathname + cleanSearch + cleanHash)
}

// 创建 Vue 应用实例并注册 Pinia、Vue Router，最后挂载到 #app
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
