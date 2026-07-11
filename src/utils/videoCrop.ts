// 视频裁剪相关纯函数工具

// 矩形区域结构：x/y 为左上角坐标，w/h 为宽高
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/**
 * 根据容器与视频元素的实际显示矩形，计算源分辨率到显示坐标的缩放比例与偏移。
 * 用于在页面上绘制覆盖在视频上的裁剪框。
 */
export function computeCropDisplayMetrics(
  containerRect: { width: number; height: number; left: number; top: number },
  videoRect: { width: number; height: number; left: number; top: number },
  sourceWidth: number,
  sourceHeight: number
): { scale: number; offsetX: number; offsetY: number } {
  // 若源尺寸为空则返回默认值，避免除零
  if (!sourceWidth || !sourceHeight) {
    return { scale: 1, offsetX: 0, offsetY: 0 }
  }
  // 按等比缩放原则计算视频在容器内的实际显示缩放比例
  const scale = Math.min(videoRect.width / sourceWidth, videoRect.height / sourceHeight)
  const drawW = sourceWidth * scale
  const drawH = sourceHeight * scale
  // 计算视频绘制区域相对于容器的偏移（居中显示）
  const offsetX = videoRect.left - containerRect.left + (videoRect.width - drawW) / 2
  const offsetY = videoRect.top - containerRect.top + (videoRect.height - drawH) / 2
  return { scale, offsetX, offsetY }
}

/**
 * 将裁剪区域按照等比例缩放，使其完整放入输出尺寸内并居中。
 */
export function fitCropToOutput(cropW: number, cropH: number, outW: number, outH: number): { x: number; y: number; w: number; h: number } {
  // 使用 ||1 防止除零
  const scale = Math.min((outW || 1) / (cropW || 1), (outH || 1) / (cropH || 1))
  const w = (cropW || 1) * scale
  const h = (cropH || 1) * scale
  return {
    // 居中放置
    x: ((outW || w) - w) / 2,
    y: ((outH || h) - h) / 2,
    w,
    h,
  }
}

/**
 * 把裁剪框限制在源视频范围内，防止超出边界。
 */
export function clampCrop(crop: Rect, sourceWidth: number, sourceHeight: number): Rect {
  let { x, y, w, h } = crop
  // 限制左上角坐标
  x = Math.max(0, Math.min(x, sourceWidth - 1))
  y = Math.max(0, Math.min(y, sourceHeight - 1))
  // 限制宽高至少为 1，且不超过剩余区域
  w = Math.max(1, Math.min(w, sourceWidth - x))
  h = Math.max(1, Math.min(h, sourceHeight - y))
  return { x, y, w, h }
}

/**
 * 计算预计提取帧数，受最大帧数限制。
 */
export function estimateFrameCount(rangeStart: number, rangeEnd: number, fps: number, maxFrames = 120): number {
  const duration = Math.max(0, (rangeEnd || 0) - (rangeStart || 0))
  return Math.min(Math.floor(duration * (fps || 0)), maxFrames)
}
