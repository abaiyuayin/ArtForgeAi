# ArtForgeAI

ArtForgeAI 是一款面向独立游戏开发者的**本地离线美术资产工作台**。所有核心功能均在浏览器端运行，素材使用 IndexedDB 存储在本地，无需上传云端，无需订阅，完全开源免费。

> 当前版本：v0.5.0 · MIT License

---

## 功能介绍

ArtForgeAI 将常用游戏美术处理流程整合到一个工具中，目前开放的功能包括：

### 图像处理
- **图片裁剪**：自由框选、固定比例裁剪，输出尺寸实时可见。
- **智能抠图**：基于 flood fill + chroma key + k-means 的本地抠图算法，支持取色、边缘腐蚀。
- **网格切分**：按行列或固定尺寸切分 Sprite Sheet，支持批量导出。

### 序列帧工坊
- **视频转序列帧**：使用 HTML5 Video + Canvas API 抽取视频帧。
- **GIF 拆解**：解析 GIF 文件并导出为逐帧图片。
- **精灵图裁剪**：上传一张精灵图，按列数行数自动裁剪为独立 PNG 帧图，实时网格预览。
- **精灵图合成**：将多帧图片合并为 Sprite Sheet，并导出 PNG / ZIP / JSON 元数据。

### 帧编辑器
- **抠图 + 水印流水线**：两种效果可叠加，不互斥。无论先抠图后去水印、还是先去水印后抠图，效果都能正确保留。
- **Ctrl+Z 撤销**：支持最多 30 步撤销，覆盖滑块、颜色、模式切换、水印框选等操作。
- **边界框选**：水印去除框选支持鼠标移出画布继续操作，边缘水印也能选中。
- **应用至所有帧**：将当前帧的抠图参数 + 水印区域一次性应用到所有选中帧，保留完整流水线效果。
- **跨会话状态持久化**：每帧保存 `mattingParams` 和 `erasedRegions` 元数据，重新打开编辑器或多次应用都能恢复叠加状态。

### 帧选择工具
- **SHIFT 连续选取**：按住 SHIFT 点击复选框，批量选取范围内的帧。
- **隔帧选取**：按每隔一帧的规律自动选取所有帧（第 0、2、4... 帧）。
- **删除未选帧**：一键删除未选中帧，带二次确认弹框。
- **相似帧检测**：全量对比帧相似度，按颜色分组高亮显示。

### 本地资源库
- 所有处理结果自动保存到浏览器 IndexedDB。
- 支持按类型（图片 / 序列帧 / 精灵图）分类、标签、搜索和复用。
- 数据完全保存在本地，关闭页面或刷新后不会丢失。

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3（Composition API） |
| 构建工具 | Vite 8 + Rolldown |
| 语言 | TypeScript 6 |
| 样式 | Tailwind CSS 3 |
| 路由 | Vue Router 4 |
| 状态管理 | Pinia 3 |
| 本地存储 | IndexedDB（idb） |
| 图像处理 | HTML5 Canvas 2D API + pica |
| 动画导出 | gif.js |
| 批量打包 | JSZip + file-saver |

---

## 本地安装与运行

### 环境要求
- Node.js 18+
- npm 9+

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/abaiyuayin/ArtForgeAi.git
cd ArtForgeAi/artforgeai-web

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

开发服务器默认运行在 `http://localhost:5173/ArtForgeAi/`（如果端口被占用，Vite 会自动尝试下一个端口）。

### 常用命令

```bash
npm run dev        # 启动开发服务器
npm run build      # TypeScript 类型检查 + 生产构建
npm run preview    # 本地预览生产构建产物
npm run test       # 运行单元测试
```

---

## 项目结构

```
artforgeai-web/
├── src/
│   ├── views/
│   │   ├── components/       # 共享组件
│   │   │   ├── FrameEditor.vue    # 帧编辑器（流水线架构）
│   │   │   ├── UploadZone.vue      # 上传区域
│   │   │   └── HelpBtn.vue          # 帮助按钮
│   │   └── page/             # 独立页面
│   │       ├── VideoToFramesPage.vue   # 视频转序列帧
│   │       ├── GifToFramesPage.vue     # GIF 转序列帧
│   │       └── ImageToFramesPage.vue    # 图片转序列帧（含精灵图裁剪）
│   ├── stores/               # Pinia 状态管理
│   ├── utils/                # 工具函数
│   │   ├── matting.ts        # 抠图算法
│   │   └── export.ts         # 导出功能
│   ├── router/               # 路由配置
│   └── style.css             # 全局样式 + 主题变量
├── public/                   # 静态资源
└── vite.config.ts            # Vite 配置
```

---

## 更新日志

### v0.5.0（2026-07-14）
- **新增** 精灵图裁剪功能：上传精灵图按行列裁剪为独立 PNG 帧图
- **重写** 帧编辑器流水线架构：抠图 + 水印可叠加，不再互斥
- **新增** Ctrl+Z 撤销功能（最多 30 步）
- **新增** 隔帧选取、删除未选帧按钮
- **修复** SHIFT + 点击复选框连续选取失效（改用 @click 捕获 MouseEvent）
- **修复** 水印框选边界失焦问题（window 级事件监听 + 坐标 clamp）
- **修复** 跨会话状态丢失（每帧持久化 mattingParams + erasedRegions）
- **同步** 三页面（视频/GIF/图片）帧选择工具一致性
- 模块化重构：WorkspaceView.vue 拆分为独立页面 + 共享组件
- 修复序列帧工坊上传框消失、资源库变英文等问题

### v0.4.0
- 实现视频裁剪叠加层、相似帧检测、GIF 解码
- 完成 AI 抠图算法（Flood Fill / Chroma Key / K-Means）

---

## 注意事项

1. **素材隐私**：所有图片、序列帧、精灵图等素材均保存在本地 IndexedDB，不会离开你的设备。
2. **浏览器兼容性**：推荐使用最新版 Chrome、Edge 或 Firefox。部分功能（如大文件处理、Canvas 操作）对内存有一定要求。
3. **无后端服务**：本项目是纯前端开源项目，不依赖任何付费或私有网络服务。
4. **AI 功能**：文生图等 AI 功能需用户自配 API Key，不提供模拟/占位功能。
5. **视频解码**：H.265/HEVC 编码视频可能因浏览器解码器限制出现黑屏，建议使用 H.264 编码。

---

## 开源协议

本项目基于 [MIT License](LICENSE) 开源。
