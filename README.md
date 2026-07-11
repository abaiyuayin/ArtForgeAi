# ArtForgeAI

ArtForgeAI 是一款面向独立游戏开发者的**本地离线美术资产工作台**。所有核心功能均在浏览器端运行，素材使用 IndexedDB 存储在本地，无需上传云端，无需订阅，完全开源免费。

> 当前版本：v0.4.0 · MIT License

---

## 功能介绍

ArtForgeAI 将常用游戏美术处理流程整合到一个工具中，目前开放的功能包括：

### 图像处理
- **图片裁剪**：自由框选、固定比例裁剪，输出尺寸实时可见。
- **智能抠图**：基于 flood fill + chroma key + k-means 的本地抠图算法，支持取色、边缘腐蚀。
- **网格切分**：按行列或固定尺寸切分 Sprite Sheet，支持批量导出。

### 序列帧工场
- **视频转序列帧**：使用 HTML5 Video + Canvas API 抽取视频帧。
- **GIF 拆解**：解析 GIF 文件并导出为逐帧图片。
- **精灵图合成**：将多帧图片合并为 Sprite Sheet，并导出 PNG / ZIP / JSON 元数据。

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

## 注意事项

1. **素材隐私**：所有图片、序列帧、精灵图等素材均保存在本地 IndexedDB，不会离开你的设备。
2. **浏览器兼容性**：推荐使用最新版 Chrome、Edge 或 Firefox。部分功能（如大文件处理、Canvas 操作）对内存有一定要求。
3. **无后端服务**：本项目是纯前端开源项目，不依赖任何付费或私有网络服务。

---

## 开源协议

本项目基于 [MIT License](LICENSE) 开源。
