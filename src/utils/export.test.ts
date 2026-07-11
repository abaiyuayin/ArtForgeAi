// 导入 vitest 测试工具与待测函数
import { describe, it, expect } from 'vitest'
import { formatBytes, compressionQuality, dataUrlToBlob, loadImage } from './export'

// 导出工具函数单元测试
describe('export utils', () => {
  // 测试 formatBytes 正确格式化字节数
  it('formatBytes 正确格式化字节数', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB')
  })

  // 测试 compressionQuality 返回正确的压缩参数
  it('compressionQuality 返回正确的压缩参数', () => {
    expect(compressionQuality('none')).toEqual({ type: 'image/png', scale: 1, label: '无压缩' })
    expect(compressionQuality('low')).toEqual({ type: 'image/png', scale: 0.75, label: '低压缩' })
    expect(compressionQuality('medium')).toEqual({ type: 'image/png', scale: 0.5, label: '中压缩' })
    expect(compressionQuality('high')).toEqual({ type: 'image/png', scale: 0.25, label: '高压缩' })
  })

  // 测试 dataUrlToBlob 将 dataURL 转换为 Blob
  it('dataUrlToBlob 将 dataURL 转换为 Blob', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    const blob = dataUrlToBlob(dataUrl)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
    expect(blob.size).toBeGreaterThan(0)
  })

  // 测试 loadImage 返回 Promise
  it('loadImage 返回 Promise', () => {
    // jsdom 中 Image 加载 dataURL 不会触发 onload，因此仅验证返回 Promise
    const result = loadImage('data:image/png;base64,')
    expect(result).toBeInstanceOf(Promise)
  })
})
