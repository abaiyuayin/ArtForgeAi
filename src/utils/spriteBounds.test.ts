// 导入 vitest 测试工具与待测函数
import { describe, it, expect } from 'vitest'
import { detectContentBounds, trimFrame } from './spriteBounds'
// 复用 matting.ts 的 ctxCreateImageData（兼容 jsdom 环境下缺少全局 ImageData 构造函数）
import { ctxCreateImageData } from './matting'

// 创建测试用 ImageData（通过 canvas context 创建，兼容 jsdom）
function makeImageData(w: number, h: number, fill: (x: number, y: number) => [number, number, number, number]): ImageData {
  const img = ctxCreateImageData(w, h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = fill(x, y)
      const i = (y * w + x) * 4
      img.data[i] = r
      img.data[i + 1] = g
      img.data[i + 2] = b
      img.data[i + 3] = a
    }
  }
  return img
}

describe('spriteBounds: detectContentBounds', () => {
  // 全透明图应返回 null
  it('全透明图返回 null', () => {
    const img = makeImageData(4, 4, () => [0, 0, 0, 0])
    expect(detectContentBounds(img)).toBeNull()
  })

  // 满图不透明：边界等于整图
  it('满图不透明：边界等于整图', () => {
    const img = makeImageData(4, 4, () => [255, 0, 0, 255])
    expect(detectContentBounds(img)).toEqual({ x: 0, y: 0, w: 4, h: 4 })
  })

  // 中心有内容：边界正确缩小
  it('中心 2x2 内容：边界为 (1,1,2,2)', () => {
    const img = makeImageData(4, 4, (x, y) => {
      const inCenter = x >= 1 && x <= 2 && y >= 1 && y <= 2
      return inCenter ? [255, 0, 0, 255] : [0, 0, 0, 0]
    })
    expect(detectContentBounds(img)).toEqual({ x: 1, y: 1, w: 2, h: 2 })
  })

  // 部分透明（alpha=128）仍算内容
  it('半透明像素也算内容', () => {
    const img = makeImageData(3, 3, (x, y) => {
      return x === 1 && y === 1 ? [0, 255, 0, 128] : [0, 0, 0, 0]
    })
    expect(detectContentBounds(img)).toEqual({ x: 1, y: 1, w: 1, h: 1 })
  })
})

describe('spriteBounds: trimFrame', () => {
  // trim 后尺寸应等于内容边界
  it('trim 后尺寸等于内容边界', () => {
    const img = makeImageData(5, 5, (x, y) => {
      const inContent = x >= 1 && x <= 3 && y >= 2 && y <= 4
      return inContent ? [0, 0, 255, 255] : [0, 0, 0, 0]
    })
    const result = trimFrame(img)
    expect(result.data.width).toBe(3)
    expect(result.data.height).toBe(3)
    expect(result.bounds).toEqual({ x: 1, y: 2, w: 3, h: 3 })
    expect(result.offset).toEqual({ x: 1, y: 2 })
  })

  // trim 后的像素应与原图对应位置一致
  it('trim 后像素与原图对应位置一致', () => {
    const img = makeImageData(4, 4, (x, y) => {
      return x >= 1 && x <= 2 && y >= 1 && y <= 2 ? [100, 150, 200, 255] : [0, 0, 0, 0]
    })
    const result = trimFrame(img)
    // 结果应是 2x2，所有像素都是 [100,150,200,255]
    expect(result.data.width).toBe(2)
    expect(result.data.height).toBe(2)
    for (let i = 0; i < result.data.data.length; i += 4) {
      expect(result.data.data[i]).toBe(100)
      expect(result.data.data[i + 1]).toBe(150)
      expect(result.data.data[i + 2]).toBe(200)
      expect(result.data.data[i + 3]).toBe(255)
    }
  })

  // 全透明图 trim 返回 1x1 透明像素
  it('全透明图 trim 返回 1x1 透明像素', () => {
    const img = makeImageData(3, 3, () => [0, 0, 0, 0])
    const result = trimFrame(img)
    expect(result.data.width).toBe(1)
    expect(result.data.height).toBe(1)
    expect(result.data.data[3]).toBe(0)  // alpha=0
  })
})
