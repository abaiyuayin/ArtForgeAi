// spriteBounds.ts：精灵图归一化核心算法层
// 提供内容边界检测、trim 裁剪、统一画布归一化、锚点对齐、基准线缩放等能力

// 复用 export.ts 的 loadImage（避免重复实现）
import { loadImage } from './export'

// ============ 数据结构 ============

// 矩形：内容边界或裁剪区域
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

// 单帧 trim 结果：裁剪后的 ImageData + 原图中的边界 + 偏移量
export interface TrimResult {
  data: ImageData       // 裁剪后的图像数据
  bounds: Rect          // 在原图中的位置
  offset: { x: number; y: number }  // 原图原点 → 新图原点的偏移
}

// 归一化缩放模式
export type ScaleMode = 'max' | 'fit' | 'custom'

// 对齐方式
export type AlignMode = 'bottom-center' | 'center' | 'top-center'

// 归一化选项（统一画布模式）
export interface NormalizeOptions {
  mode?: 'uniform'          // 归一化模式标记，默认 uniform
  canvasW: number           // 统一画布宽
  canvasH: number           // 统一画布高
  scaleMode: ScaleMode      // 缩放基准
  customScale?: number      // scaleMode='custom' 时使用
  align: AlignMode          // 对齐方式
  padding: number           // 画布边距（默认 0）
}

// 基准线缩放选项
export interface BaselineOptions {
  mode: 'baseline'          // 归一化模式标记
  canvasW: number           // 画布宽
  canvasH: number           // 画布高
  targetHeight: number      // 目标内容高度（等比缩放使内容高度等于此值）
  baselineY: number         // 基准线 Y 坐标（脚底对齐到此线）
}

// 归一化选项联合类型
export type AnyNormalizeOptions = NormalizeOptions | BaselineOptions

// 单帧元数据（输出到 JSON）
export interface FrameMeta {
  index: number
  sourceBounds: Rect                 // trim 后的原始内容边界
  scale: number                      // 缩放比例
  canvasOffset: { x: number; y: number }  // 在统一画布中的位置
  anchor: { x: number; y: number }   // 锚点（脚底中心，相对画布）
}

// 归一化后的单帧结果
export interface NormalizedFrame {
  data: ImageData      // 归一化后画布的图像数据
  meta: FrameMeta      // 该帧元数据
}

// ============ 辅助函数 ============

// 创建空白 ImageData
// 优先使用全局 ImageData 构造函数（浏览器环境）；jsdom 环境下回退到 canvas context 创建
function createImageData(w: number, h: number): ImageData {
  if (typeof ImageData !== 'undefined') return new ImageData(w, h)
  return document.createElement('canvas').getContext('2d')!.createImageData(w, h)
}

// 缩放 ImageData 到指定尺寸（返回新的 ImageData）
function scaleImageData(src: ImageData, dstW: number, dstH: number): ImageData {
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = src.width
  srcCanvas.height = src.height
  srcCanvas.getContext('2d')!.putImageData(src, 0, 0)

  const dstCanvas = document.createElement('canvas')
  dstCanvas.width = dstW
  dstCanvas.height = dstH
  const ctx = dstCanvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(srcCanvas, 0, 0, src.width, src.height, 0, 0, dstW, dstH)

  return ctx.getImageData(0, 0, dstW, dstH)
}

// ============ 核心算法 ============

// 扫描 alpha 通道，找到非透明像素的最小包围盒
// O(n) 复杂度：遍历一次像素即可
export function detectContentBounds(imgData: ImageData): Rect | null {
  const { width, height, data } = imgData
  let minX = width, minY = height, maxX = -1, maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 0) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  // 全透明图返回 null
  if (maxX < 0) return null

  return {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  }
}

// 裁剪掉透明边缘，返回裁剪后的 ImageData + 边界 + 偏移
export function trimFrame(imgData: ImageData): TrimResult {
  const bounds = detectContentBounds(imgData)
  if (!bounds) {
    // 全透明：返回 1x1 透明像素
    return {
      data: createImageData(1, 1),
      bounds: { x: 0, y: 0, w: 1, h: 1 },
      offset: { x: 0, y: 0 },
    }
  }

  const { x, y, w, h } = bounds
  const trimmed = createImageData(w, h)

  // 逐行复制像素
  for (let row = 0; row < h; row++) {
    const srcStart = ((y + row) * imgData.width + x) * 4
    const dstStart = row * w * 4
    for (let i = 0; i < w * 4; i++) {
      trimmed.data[dstStart + i] = imgData.data[srcStart + i]
    }
  }

  return {
    data: trimmed,
    bounds,
    offset: { x, y },
  }
}

// 核心归一化函数：所有帧 trim → 统一参考高度 → 等比缩放 → 放置到统一画布
export function normalizeToUniformCanvas(
  frames: ImageData[],
  opts: NormalizeOptions
): NormalizedFrame[] {
  // 第一步：所有帧 trim
  const trimmed = frames.map(trimFrame)

  // 第二步：确定参考高度
  let refHeight: number
  if (opts.scaleMode === 'max') {
    // 以所有帧中最大内容高度为基准（保留角色间相对大小）
    refHeight = Math.max(...trimmed.map(t => t.bounds.h))
  } else if (opts.scaleMode === 'fit') {
    // 填满画布（强制等高）
    refHeight = opts.canvasH - opts.padding * 2
  } else {
    // custom 模式由 customScale 决定，refHeight 不直接使用
    refHeight = trimmed[0]?.bounds.h || 1
  }

  // 第三步：逐帧等比缩放 + 放置到统一画布
  return trimmed.map((t, i) => {
    const scale = opts.scaleMode === 'custom'
      ? (opts.customScale ?? 1)
      : refHeight / t.bounds.h

    const scaledW = Math.max(1, Math.round(t.bounds.w * scale))
    const scaledH = Math.max(1, Math.round(t.bounds.h * scale))

    // 计算放置位置（按 align 对齐）
    let x: number, y: number
    if (opts.align === 'bottom-center') {
      x = Math.round((opts.canvasW - scaledW) / 2)
      y = opts.canvasH - scaledH - opts.padding
    } else if (opts.align === 'center') {
      x = Math.round((opts.canvasW - scaledW) / 2)
      y = Math.round((opts.canvasH - scaledH) / 2)
    } else {
      // top-center
      x = Math.round((opts.canvasW - scaledW) / 2)
      y = opts.padding
    }

    // 创建统一画布，绘制缩放后的图像
    const canvas = createImageData(opts.canvasW, opts.canvasH)
    const scaled = scaleImageData(t.data, scaledW, scaledH)

    // 把缩放后的图像放到画布的 (x, y) 位置
    for (let row = 0; row < scaledH; row++) {
      for (let col = 0; col < scaledW; col++) {
        const dx = x + col
        const dy = y + row
        if (dx < 0 || dx >= opts.canvasW || dy < 0 || dy >= opts.canvasH) continue
        const srcIdx = (row * scaledW + col) * 4
        const dstIdx = (dy * opts.canvasW + dx) * 4
        canvas.data[dstIdx] = scaled.data[srcIdx]
        canvas.data[dstIdx + 1] = scaled.data[srcIdx + 1]
        canvas.data[dstIdx + 2] = scaled.data[srcIdx + 2]
        canvas.data[dstIdx + 3] = scaled.data[srcIdx + 3]
      }
    }

    return {
      data: canvas,
      meta: {
        index: i,
        sourceBounds: t.bounds,
        scale,
        canvasOffset: { x, y },
        anchor: { x: x + scaledW / 2, y: y + scaledH },
      },
    }
  })
}

// 锚点对齐：用户为每帧点击设置锚点（通常是脚底），所有帧按锚点对齐到画布同一位置
export function alignByAnchor(
  frames: ImageData[],
  anchors: { x: number; y: number }[],
  opts: NormalizeOptions
): NormalizedFrame[] {
  return frames.map((imgData, i) => {
    const anchor = anchors[i] || { x: imgData.width / 2, y: imgData.height }
    const trimmed = trimFrame(imgData)

    // trim 后的锚点位置 = 原锚点 - trim 偏移
    const trimmedAnchorX = anchor.x - trimmed.offset.x
    const trimmedAnchorY = anchor.y - trimmed.offset.y

    // 统一画布上的锚点位置（底部居中）
    const targetAnchorX = opts.canvasW / 2
    const targetAnchorY = opts.canvasH - opts.padding

    // 计算放置位置：使 trim 后的锚点对齐到目标锚点
    const x = Math.round(targetAnchorX - trimmedAnchorX)
    const y = Math.round(targetAnchorY - trimmedAnchorY)

    // 创建统一画布，把 trim 后的图像放到 (x, y)
    const canvas = createImageData(opts.canvasW, opts.canvasH)
    for (let row = 0; row < trimmed.data.height; row++) {
      for (let col = 0; col < trimmed.data.width; col++) {
        const dx = x + col
        const dy = y + row
        if (dx < 0 || dx >= opts.canvasW || dy < 0 || dy >= opts.canvasH) continue
        const srcIdx = (row * trimmed.data.width + col) * 4
        const dstIdx = (dy * opts.canvasW + dx) * 4
        canvas.data[dstIdx] = trimmed.data.data[srcIdx]
        canvas.data[dstIdx + 1] = trimmed.data.data[srcIdx + 1]
        canvas.data[dstIdx + 2] = trimmed.data.data[srcIdx + 2]
        canvas.data[dstIdx + 3] = trimmed.data.data[srcIdx + 3]
      }
    }

    return {
      data: canvas,
      meta: {
        index: i,
        sourceBounds: trimmed.bounds,
        scale: 1,
        canvasOffset: { x, y },
        anchor: { x: targetAnchorX, y: targetAnchorY },
      },
    }
  })
}

// 基准线缩放：所有帧底部对齐到 baselineY，按 targetHeight 等比缩放
export function normalizeByBaseline(
  frames: ImageData[],
  opts: {
    canvasW: number
    canvasH: number
    targetHeight: number
    baselineY: number
  }
): NormalizedFrame[] {
  return frames.map((imgData, i) => {
    const trimmed = trimFrame(imgData)

    // 等比缩放使内容高度等于 targetHeight
    const scale = opts.targetHeight / trimmed.bounds.h
    const scaledW = Math.max(1, Math.round(trimmed.bounds.w * scale))
    const scaledH = Math.max(1, Math.round(trimmed.bounds.h * scale))
    const scaled = scaleImageData(trimmed.data, scaledW, scaledH)

    // 底部对齐到 baselineY，水平居中
    const x = Math.round((opts.canvasW - scaledW) / 2)
    const y = Math.round(opts.baselineY - scaledH)

    const canvas = createImageData(opts.canvasW, opts.canvasH)
    for (let row = 0; row < scaledH; row++) {
      for (let col = 0; col < scaledW; col++) {
        const dx = x + col
        const dy = y + row
        if (dx < 0 || dx >= opts.canvasW || dy < 0 || dy >= opts.canvasH) continue
        const srcIdx = (row * scaledW + col) * 4
        const dstIdx = (dy * opts.canvasW + dx) * 4
        canvas.data[dstIdx] = scaled.data[srcIdx]
        canvas.data[dstIdx + 1] = scaled.data[srcIdx + 1]
        canvas.data[dstIdx + 2] = scaled.data[srcIdx + 2]
        canvas.data[dstIdx + 3] = scaled.data[srcIdx + 3]
      }
    }

    return {
      data: canvas,
      meta: {
        index: i,
        sourceBounds: trimmed.bounds,
        scale,
        canvasOffset: { x, y },
        anchor: { x: x + scaledW / 2, y: opts.baselineY },
      },
    }
  })
}

// ============ 工具函数：URL ↔ ImageData 转换 ============

// 从图片 URL 加载为 ImageData
export async function urlToImageData(url: string): Promise<ImageData> {
  const img = await loadImage(url)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

// ImageData 转为 canvas DataURL（PNG）
export function imageDataToDataURL(imgData: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = imgData.width
  canvas.height = imgData.height
  canvas.getContext('2d')!.putImageData(imgData, 0, 0)
  return canvas.toDataURL('image/png')
}
