// 导入 Vue Router 创建函数与页面组件
import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import WorkspaceView from '../views/WorkspaceView.vue'

// 定义应用路由表
const routes = [
  // 首页（宣传页）
  { path: '/', name: 'landing', component: LandingView },
  // 工作台主页面
  { path: '/workspace', name: 'workspace', component: WorkspaceView },
  // 工作台子页面，screen 用于区分不同功能模块
  { path: '/workspace/:screen', name: 'workspace-screen', component: WorkspaceView },
]

// 创建 router 实例：使用 HTML5 history 模式，并基于构建配置设置 base URL
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
