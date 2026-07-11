# ArtForgeAI 开发规范

## 技术栈

| 类别 | 技术 | 版本要求 |
|------|------|----------|
| 框架 | Vue 3 (Composition API) | ^3.5 |
| 构建工具 | Vite + Rolldown | ^8.1.0 |
| 语言 | TypeScript | ~6.0 |
| 样式 | Tailwind CSS | ^3.4 |
| 路由 | Vue Router 4 | ^4.6 |
| 状态管理 | Pinia | ^3.0 |
| 工具库 | @vueuse/core | ^14.3 |

## 核心依赖（优先使用已有库）

| 库 | 用途 | 调用方式 |
|----|------|----------|
| `pica` | 高质量图片缩放 | `import pica from 'pica'` |
| `gif.js` | GIF 编码/导出 | `import GIF from 'gif.js'` |
| `jszip` | ZIP 打包导出 | `import JSZip from 'jszip'` |
| `file-saver` | 文件下载 | `import { saveAs } from 'file-saver'` |
| `idb` | IndexedDB 封装 | `import { openDB } from 'idb'` |

## 编码规范

### 1. 文件结构
```
src/
├── views/          # 页面组件
│   ├── LandingView.vue      # 宣传首页
│   └── WorkspaceView.vue    # 工作台（核心，含全部子模块）
├── stores/         # Pinia 状态管理
│   └── theme.ts
├── router/         # 路由配置
│   └── index.ts
├── style.css       # 全局样式 + 主题变量
├── main.ts         # 应用入口
└── App.vue         # 根组件
```

### 2. Vue 组件规范
- 使用 `<script setup lang="ts">` 语法
- 状态使用 `ref()` / `reactive()`
- 计算属性使用 `computed()`
- 生命周期使用 `onMounted()` / `onUnmounted()`
- 所有代码添加中文注释

### 3. 样式规范
- 优先使用 Tailwind CSS 类名
- 自定义颜色使用 `af-*` 前缀（定义在 `tailwind.config.js`）
- 主题变量通过 CSS 类名切换：`.theme-light` / `.theme-book` / `.theme-eye-care` / `.theme-pink`
- 暗夜主题为默认，使用 Tailwind `dark` 类
- 组件内部样式使用 `<style scoped>`

### 4. 主题色彩体系

| 变量 | 暗夜 | 光亮 | 书籍 | 护眼 | 粉色 |
|------|------|------|------|------|------|
| bg | #0a0a0f | #f8f9fa | #f4e4bc | #f0f7e8 | #faf5f8 |
| surface | #14141c | #ffffff | #faf3e0 | #e8f0d8 | #fff0f5 |
| ink | #f0f0f5 | #1a1a2e | #3d3226 | #3a4a2e | #4a2a3a |
| muted | #8a8a9e | #6b7280 | #7a6b58 | #6b8a5e | #9a7a8a |
| rule | #1e1e2e | #e5e7eb | #d8c9a6 | #c8d8b0 | #f0d8e0 |
| accent | #00d4aa | #0d9e7f | #c9a86c | #5a8a4a | #d47a8a |

### 5. 功能开发原则
- **抠图算法**：使用已有的 flood fill + chroma key + k-means 算法，不引入新库
- **视频处理**：使用 HTML5 Canvas + Video API，不引入 FFmpeg
- **图像处理**：使用 Canvas 2D API + pica 缩放
- **导出功能**：视频用 MediaRecorder，GIF 用 gif.js，批量用 JSZip
- **AI 功能**：强制要求用户配置 API Key，不提供模拟/占位功能
- **存储**：资源库使用 IndexedDB（idb），用户数据使用 localStorage

### 6. 命名规范
- 组件文件：PascalCase（如 `WorkspaceView.vue`）
- 函数/变量：camelCase（如 `handleVideoUpload`）
- 常量：UPPER_SNAKE_CASE（如 `MAX_FRAME_COUNT`）
- CSS 类名：kebab-case（如 `frame-card`）
- 类型/接口：PascalCase（如 `VideoCropRect`）

### 7. 构建部署
- `npm run dev`：开发服务器
- `npm run build`：TypeScript 检查 + Vite 构建
- `npm run deploy`：部署到 GitHub Pages
- 部署路径：`https://abaiyuayin.github.io/ArtForgeAi/`
- base 路径：`/ArtForgeAi/`
- SPA 回退：`public/404.html`