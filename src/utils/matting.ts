// 帧编辑器抠图工具：flood fill、色度键、k-means 聚类与基础调色

// RGB 颜色结构
export interface Rgb { r: number; g: number; b: number }

// 将十六进制颜色字符串解析为 RGB 对象
export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '')
  // 支持 #RGB 简写扩展为 #RRGGBB
  const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16)
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
}

// 计算两个颜色之间的欧几里得距离
export function colorDist(a: number[], b: Rgb): number {
  return Math.sqrt((a[0] - b.r) ** 2 + (a[1] - b.g) ** 2 + (a[2] - b.b) ** 2)
}

// 将数值限制在 [min, max] 范围内
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// 创建指定尺寸的 ImageData
export function ctxCreateImageData(w: number, h: number): ImageData {
  // 优先使用全局 ImageData 构造函数，避免 jsdom/node-canvas 环境下创建 canvas 导致内存溢出
  if (typeof ImageData !== 'undefined') return new ImageData(w, h)
  return document.createElement('canvas').getContext('2d')!.createImageData(w, h)
}

/** 连续抠图：从四角 flood fill 移除与关键色相近的像素 */
export function applyFloodRemoval(imgData: ImageData, key: Rgb, tol: number): ImageData {
  const w = imgData.width, h = imgData.height, d = imgData.data
  // 访问标记数组：1 表示已标记为背景
  const mask = new Uint8Array(w * h)
  const q: [number, number][] = []
  const edge: [number, number][] = []
  // 将四条边的像素坐标加入边缘队列
  for (let x = 0; x < w; x++) { edge.push([x, 0], [x, h - 1]) }
  for (let y = 1; y < h - 1; y++) { edge.push([0, y], [w - 1, y]) }
  // 从边缘开始，将接近关键色的像素加入队列
  edge.forEach(([x, y]) => {
    const i = (y * w + x) * 4
    const col = [d[i], d[i + 1], d[i + 2]]
    if (colorDist(col, key) < tol + 10) { q.push([x, y]); mask[y * w + x] = 1 }
  })
  // 八邻域 flood fill 扩展
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i]
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || mask[ny * w + nx]) continue
        const j = (ny * w + nx) * 4
        const col = [d[j], d[j + 1], d[j + 2]]
        if (colorDist(col, key) < tol) { mask[ny * w + nx] = 1; q.push([nx, ny]) }
      }
    }
  }
  // 根据 mask 生成输出：背景像素透明，其余复制原像素
  const out = ctxCreateImageData(w, h)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    if (mask[i]) { out.data[j + 3] = 0 }
    else { for (let k = 0; k < 4; k++) out.data[j + k] = d[j + k] }
  }
  return out
}

/** 全图色度键：按颜色距离透明化 */
export function applyGlobalChroma(imgData: ImageData, key: Rgb, tol: number): ImageData {
  const w = imgData.width, h = imgData.height, d = imgData.data
  const out = ctxCreateImageData(w, h)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const col = [d[j], d[j + 1], d[j + 2]]
    if (colorDist(col, key) < tol) { out.data[j + 3] = 0 }
    else { for (let k = 0; k < 4; k++) out.data[j + k] = d[j + k] }
  }
  return out
}

/** k-means 聚类，返回聚类中心 */
export function kMeans(points: number[][], k: number, maxIter = 10): number[][] {
  if (!points.length) return Array.from({ length: k }, () => [0, 0, 0])
  // 初始中心取前 k 个点
  let cents = points.slice(0, k)
  for (let it = 0; it < maxIter; it++) {
    const clusters: number[][][] = Array.from({ length: k }, () => [])
    // 将每个点分配到最近的中心
    points.forEach(p => {
      let best = 0, bd = Infinity
      cents.forEach((c, idx) => {
        const d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2
        if (d < bd) { bd = d; best = idx }
      })
      clusters[best].push(p)
    })
    // 重新计算中心
    const nc = clusters.map(cl => cl.length
      ? cl.reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], [0, 0, 0]).map(v => v / cl.length)
      : cents[0])
    cents = nc
  }
  return cents
}

/** 智能抠图：k-means 聚类后将最暗聚类作为背景移除；tol 控制背景聚类附近的像素也被透明化 */
export function applySmartCut(imgData: ImageData, k: number, tol = 0): ImageData {
  const w = imgData.width, h = imgData.height, d = imgData.data
  // 按每 10 个像素采样一次，提升性能
  const samples: number[][] = []
  for (let i = 0; i < d.length; i += 4 * 10) samples.push([d[i], d[i + 1], d[i + 2]])
  const centroids = kMeans(samples, k, 10)
  // 选择亮度总和最小的聚类作为背景
  const bg = centroids.reduce((a, b) => (a[0] + a[1] + a[2] < b[0] + b[1] + b[2] ? a : b))
  const bgIdx = centroids.indexOf(bg)
  const bgRgb = { r: bg[0], g: bg[1], b: bg[2] }
  const out = ctxCreateImageData(w, h)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const col = [d[j], d[j + 1], d[j + 2]]
    let min = Infinity, ci = 0
    // 找到像素所属最近的聚类
    centroids.forEach((c, idx) => {
      const dist = (c[0] - col[0]) ** 2 + (c[1] - col[1]) ** 2 + (c[2] - col[2]) ** 2
      if (dist < min) { min = dist; ci = idx }
    })
    // 属于背景聚类，或颜色在容差范围内接近背景，则透明化
    if (ci === bgIdx || colorDist(col, bgRgb) < tol) { out.data[j + 3] = 0 }
    else { for (let k2 = 0; k2 < 4; k2++) out.data[j + k2] = d[j + k2] }
  }
  return out
}

/** 边缘调整：根据 px 值对 alpha 通道进行腐蚀或膨胀
 * 正数向内侵蚀（缩小不透明区域），负数向外膨胀（扩展不透明区域）
 */
export function adjustAlphaEdge(imgData: ImageData, px: number): ImageData {
  const w = imgData.width // 图像宽度
  const h = imgData.height // 图像高度
  const d = imgData.data // 原始像素数据
  const out = ctxCreateImageData(w, h) // 创建输出 ImageData
  for (let i = 0; i < d.length; i++) out.data[i] = d[i] // 复制原始数据
  if (px === 0) return out // 无需调整时直接返回
  const radius = Math.abs(px) // 影响半径
  const dilate = px < 0 // 负数表示膨胀（向外扩展）
  for (let y = 0; y < h; y++) { // 遍历每一行
    for (let x = 0; x < w; x++) { // 遍历每一列
      const idx = (y * w + x) * 4 // 当前像素索引
      if (dilate) { // 膨胀：透明像素若邻域有不透明则变为不透明
        if (d[idx + 3] === 0) {
          let hasOpaque = false
          for (let dy = -radius; dy <= radius && !hasOpaque; dy++) {
            for (let dx = -radius; dx <= radius && !hasOpaque; dx++) {
              const ny = y + dy, nx = x + dx
              if (ny < 0 || ny >= h || nx < 0 || nx >= w) continue
              if (d[(ny * w + nx) * 4 + 3] > 0) hasOpaque = true
            }
          }
          if (hasOpaque) {
            for (let k = 0; k < 3; k++) out.data[idx + k] = d[idx + k]
            out.data[idx + 3] = 255
          }
        }
      } else { // 腐蚀：不透明像素若邻域有透明则变为透明
        if (d[idx + 3] > 0) {
          let hasTransparent = false
          for (let dy = -radius; dy <= radius && !hasTransparent; dy++) {
            for (let dx = -radius; dx <= radius && !hasTransparent; dx++) {
              const ny = y + dy, nx = x + dx
              if (ny < 0 || ny >= h || nx < 0 || nx >= w) continue
              if (d[(ny * w + nx) * 4 + 3] === 0) hasTransparent = true
            }
          }
          if (hasTransparent) out.data[idx + 3] = 0
        }
      }
    }
  }
  return out // 返回处理结果
}

/** 边缘羽化：对 alpha 边缘进行柔和过渡，px 为羽化半径 */
export function applyFeather(imgData: ImageData, px: number): ImageData {
  const w = imgData.width // 图像宽度
  const h = imgData.height // 图像高度
  const d = imgData.data // 原始像素数据
  const out = ctxCreateImageData(w, h) // 创建输出 ImageData
  for (let i = 0; i < d.length; i++) out.data[i] = d[i] // 复制原始数据
  if (px <= 0) return out // 无需羽化时直接返回
  const radius = Math.ceil(px) // 羽化影响半径
  const dist = new Float32Array(w * h) // 每个像素到最近透明像素的距离
  for (let i = 0; i < w * h; i++) dist[i] = d[i * 4 + 3] === 0 ? 0 : Infinity // 透明像素距离为 0
  // 通过多轮传播计算距离场
  for (let r = 0; r < radius; r++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x
        if (dist[i] <= r) continue
        let min = dist[i]
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy, nx = x + dx
            if (ny < 0 || ny >= h || nx < 0 || nx >= w) continue
            const ni = ny * w + nx
            if (dist[ni] + 1 < min) min = dist[ni] + 1
          }
        }
        dist[i] = min
      }
    }
  }
  // 根据距离场调整边缘 alpha，实现羽化效果
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      const distance = dist[y * w + x]
      const alpha = d[idx + 3]
      if (alpha > 0 && distance <= px) {
        out.data[idx + 3] = Math.round(alpha * (distance / px)) // 距离越近 alpha 越低
      }
    }
  }
  return out // 返回羽化结果
}

/** 亮度 / 对比度 / 饱和度调整 */
export function applyBrightnessContrastSaturation(
  imgData: ImageData, bri: number, con: number, sat: number
): ImageData {
  const w = imgData.width, h = imgData.height, d = imgData.data
  const out = ctxCreateImageData(w, h)
  const bf = bri, cf = (con + 100) / 100, sf = (sat + 100) / 100
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    let r = d[j], g = d[j + 1], b = d[j + 2]
    // 对比度调整
    r = clamp((r - 128) * cf + 128 + bf, 0, 255)
    g = clamp((g - 128) * cf + 128 + bf, 0, 255)
    b = clamp((b - 128) * cf + 128 + bf, 0, 255)
    // 饱和度调整：先转灰度再按比例混合
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    r = clamp(gray + (r - gray) * sf, 0, 255)
    g = clamp(gray + (g - gray) * sf, 0, 255)
    b = clamp(gray + (b - gray) * sf, 0, 255)
    out.data[j] = r; out.data[j + 1] = g; out.data[j + 2] = b; out.data[j + 3] = d[j + 3]
  }
  return out
}

/** 抠图处理参数接口 */
export interface MattingParams {
  mode: 'flood' | 'global' | 'smart' | 'watermark'
  key: string
  tolerance: number
  feather: number
  edge: number
  clusters: number
  brightness: number
  contrast: number
  saturation: number
}

/** 将原始帧数据按参数应用全部处理流程 */
export function applyMattingParams(origData: ImageData, params: MattingParams): ImageData {
  const key = hexToRgb(params.key)
  const tol = params.tolerance || 0
  const feather = params.feather || 0
  const edge = params.edge || 0
  // 复制原始数据，避免直接修改
  let d = ctxCreateImageData(origData.width, origData.height)
  for (let i = 0; i < origData.data.length; i++) d.data[i] = origData.data[i]
  // 根据模式选择抠图算法（水印模式只由手动框选删除区域，不应用算法）
  if (params.mode === 'watermark') { /* 直接返回原图 */ }
  else if (params.mode === 'flood') d = applyFloodRemoval(d, key, tol)
  else if (params.mode === 'global') d = applyGlobalChroma(d, key, tol)
  else if (params.mode === 'smart') d = applySmartCut(d, params.clusters || 4, tol)
  // 应用边缘调整与羽化
  if (edge !== 0 && params.mode !== 'watermark') d = adjustAlphaEdge(d, edge)
  if (feather > 0 && params.mode !== 'watermark') d = applyFeather(d, feather)
  // 应用亮度/对比度/饱和度调整

  d = applyBrightnessContrastSaturation(d, params.brightness || 0, params.contrast || 0, params.saturation || 0)

  // 保留原始透明像素：若输入像素 alpha=0，则输出仍保持 alpha=0，避免水印去除等前置操作被抠图覆盖

  for (let i = 0; i < origData.data.length; i += 4) {

    if (origData.data[i + 3] === 0) d.data[i + 3] = 0

  }

  return d

}

/**
 * 网格化裁剪图片：按指定行列数将图片分割后，裁剪出选中的单个格子区域
 * @param source 原始 ImageData
 * @param gridSize 网格行列数
 * @param selectedX 选中的网格列索引（从 0 开始）
 * @param selectedY 选中的网格行索引（从 0 开始）
 * @returns 裁剪后的 ImageData
 */
export function gridCrop(source: ImageData, gridSize: number, selectedX: number, selectedY: number): ImageData {
  const w = source.width // 获取原始宽度
  const h = source.height // 获取原始高度
  const cellW = Math.floor(w / gridSize) // 计算每个格子宽度
  const cellH = Math.floor(h / gridSize) // 计算每个格子高度
  const x = Math.min(w - 1, selectedX * cellW) // 计算裁剪左上角 X 并限制边界
  const y = Math.min(h - 1, selectedY * cellH) // 计算裁剪左上角 Y 并限制边界
  const cw = Math.min(cellW, w - x) // 计算实际裁剪宽度
  const ch = Math.min(cellH, h - y) // 计算实际裁剪高度
  return manualCrop(source, x, y, cw, ch) // 复用手动裁剪函数
}

/**
 * 手动区域裁剪图片：复制指定矩形区域的像素
 * @param source 原始 ImageData
 * @param x 裁剪区域左上角 x 坐标
 * @param y 裁剪区域左上角 y 坐标
 * @param w 裁剪区域宽度
 * @param h 裁剪区域高度
 * @returns 裁剪后的 ImageData
 */
export function manualCrop(source: ImageData, x: number, y: number, w: number, h: number): ImageData {
  const srcW = source.width // 获取源图宽度
  const srcH = source.height // 获取源图高度
  const startX = Math.max(0, Math.min(srcW - 1, x)) // 限制起始 X 在有效范围
  const startY = Math.max(0, Math.min(srcH - 1, y)) // 限制起始 Y 在有效范围
  const cw = Math.max(1, Math.min(w, srcW - startX)) // 限制裁剪宽度在有效范围
  const ch = Math.max(1, Math.min(h, srcH - startY)) // 限制裁剪高度在有效范围
  const out = ctxCreateImageData(cw, ch) // 创建目标 ImageData
  const src = source.data // 源像素数组
  const dst = out.data // 目标像素数组
  for (let row = 0; row < ch; row++) { // 遍历每一行
    for (let col = 0; col < cw; col++) { // 遍历每一列
      const srcIdx = ((startY + row) * srcW + (startX + col)) * 4 // 源像素索引
      const dstIdx = (row * cw + col) * 4 // 目标像素索引
      dst[dstIdx] = src[srcIdx] // 复制 R 通道
      dst[dstIdx + 1] = src[srcIdx + 1] // 复制 G 通道
      dst[dstIdx + 2] = src[srcIdx + 2] // 复制 B 通道
      dst[dstIdx + 3] = src[srcIdx + 3] // 复制 A 通道
    }
  }
  return out // 返回裁剪结果
}
