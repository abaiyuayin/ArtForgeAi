// 导入 vitest 测试工具与待测函数
import { describe, it, expect } from 'vitest'
import { computeCropDisplayMetrics, fitCropToOutput, clampCrop, estimateFrameCount } from './videoCrop'

describe('videoCrop utils', () => {
  // 测试视频显示缩放与偏移计算
  it('计算视频显示缩放与偏移', () => {
    const container = { width: 800, height: 400, left: 0, top: 0 }
    const video = { width: 640, height: 360, left: 80, top: 20 }
    const { scale, offsetX, offsetY } = computeCropDisplayMetrics(container, video, 1920, 1080)
    expect(scale).toBeCloseTo(0.33333, 3)
    expect(offsetX).toBeCloseTo(80, 1)
    expect(offsetY).toBeCloseTo(20, 1)
  })

  // 测试裁剪区域按等比例适配输出尺寸
  it('裁剪区域按等比例适配输出尺寸', () => {
    const r = fitCropToOutput(1920, 1080, 512, 512)
    expect(r.w / r.h).toBeCloseTo(1920 / 1080, 2)
    expect(r.x + r.w / 2).toBeCloseTo(256, 1)
    expect(r.y + r.h / 2).toBeCloseTo(256, 1)
  })

  // 测试裁剪框被限制在视频范围内
  it('把裁剪框限制在视频范围内', () => {
    expect(clampCrop({ x: 50, y: 50, w: 200, h: 200 }, 100, 100)).toEqual({ x: 50, y: 50, w: 50, h: 50 })
    expect(clampCrop({ x: -10, y: -10, w: 20, h: 20 }, 100, 100)).toEqual({ x: 0, y: 0, w: 20, h: 20 })
  })

  // 测试根据时间范围和 FPS 计算预计帧数并限制最大帧数
  it('根据时间范围和 FPS 计算预计帧数并限制最大帧数', () => {
    expect(estimateFrameCount(0, 5, 12)).toBe(60)
    expect(estimateFrameCount(1, 11, 30)).toBe(120)
    expect(estimateFrameCount(5, 5, 30)).toBe(0)
  })
})
