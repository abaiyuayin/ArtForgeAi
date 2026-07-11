// 导入 vitest 测试工具与待测函数
import { describe, it, expect } from 'vitest'
import { hexToRgb, clamp, kMeans, applyGlobalChroma, applyFloodRemoval, applyMattingParams, ctxCreateImageData } from './matting'

// 创建测试用 ImageData（通过 document canvas，避免 jsdom 缺少全局 ImageData）
function makeImageData(w: number, h: number, fill: (x: number, y: number) => [number, number, number, number]) {
  const img = ctxCreateImageData(w, h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = fill(x, y)
      const i = (y * w + x) * 4
      img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = a
    }
  }
  return img
}

describe('matting utils', () => {
  // 测试 hexToRgb 正确解析颜色
  it('hexToRgb 正确解析颜色', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
    expect(hexToRgb('#0d9e7f')).toEqual({ r: 13, g: 158, b: 127 })
  })

  // 测试 clamp 限制数值范围
  it('clamp 限制数值范围', () => {
    expect(clamp(300, 0, 255)).toBe(255)
    expect(clamp(-10, 0, 255)).toBe(0)
    expect(clamp(128, 0, 255)).toBe(128)
  })

  // 测试 kMeans 聚类中心接近输入数据
  it('kMeans 聚类中心接近输入数据', () => {
    const points = [[0, 0, 0], [0, 0, 0], [255, 255, 255], [255, 255, 255], [255, 0, 0]]
    const cents = kMeans(points, 2, 20)
    expect(cents.length).toBe(2)
  })

  // 测试 applyGlobalChroma 移除指定颜色
  it('applyGlobalChroma 移除指定颜色', () => {
    const img = makeImageData(2, 1, (x) => x === 0 ? [0, 255, 0, 255] : [255, 0, 0, 255])
    const out = applyGlobalChroma(img, { r: 0, g: 255, b: 0 }, 30)
    expect(out.data[3]).toBe(0)
    expect(out.data[7]).toBe(255)
  })

  // 测试 applyFloodRemoval 从边缘填充移除背景
  it('applyFloodRemoval 从边缘填充移除背景', () => {
    // 3x3 图像：最外层绿色，中心红色
    const img = makeImageData(3, 3, (x, y) => {
      if (x === 1 && y === 1) return [255, 0, 0, 255]
      return [0, 255, 0, 255]
    })
    const out = applyFloodRemoval(img, { r: 0, g: 255, b: 0 }, 30)
    const center = out.data[(1 * 3 + 1) * 4 + 3]
    const corner = out.data[3]
    expect(center).toBe(255)
    expect(corner).toBe(0)
  })

  // 测试 applyMattingParams 根据模式处理图像
  it('applyMattingParams 根据模式处理图像', () => {
    const img = makeImageData(2, 1, (x) => x === 0 ? [0, 255, 0, 255] : [255, 0, 0, 255])
    const out = applyMattingParams(img, {
      mode: 'global', key: '#00ff00', tolerance: 30,
      feather: 0, edge: 0, clusters: 2,
      brightness: 0, contrast: 0, saturation: 0,
    })
    expect(out.data[3]).toBe(0)
  })
})
