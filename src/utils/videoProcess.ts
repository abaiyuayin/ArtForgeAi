// 视频处理工具函数：视频抠图、裁剪、转 GIF、转音频

import { applyMattingParams, type MattingParams } from './matting'
import { framesToGif, framesToVideo } from './export'

/**
 * 视频基本信息结构
 */
export interface VideoInfo {
  duration: number
  width: number
  height: number
}

/**
 * 裁剪区域结构
 */
export interface VideoCropRect {
  x: number
  y: number
  w: number
  h: number
}

/**
 * 提取帧选项
 */
export interface ExtractFramesOpts {
  start: number
  end: number
  fps: number
  crop?: VideoCropRect
  maxFrames?: number
}

/**
 * 加载视频并返回时长与分辨率
 */
export function getVideoInfo(url: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.crossOrigin = 'anonymous'
    v.preload = 'metadata'
    v.onloadedmetadata = () => resolve({ duration: v.duration, width: v.videoWidth, height: v.videoHeight })
    v.onerror = () => reject(new Error('视频加载失败'))
    v.src = url
  })
}

/**
 * 从视频中按时间范围与帧率提取帧序列。
 * 若指定 crop 则只保留裁剪区域，输出尺寸等于裁剪尺寸。
 * 最大帧数默认 120，超出时自动降低采样密度。
 */
export async function extractVideoFrames(
  url: string,
  opts: ExtractFramesOpts
): Promise<{ url: string; width: number; height: number }[]> {
  const { start, end, fps, crop, maxFrames = 120 } = opts
  const v = document.createElement('video')
  v.muted = true
  v.playsInline = true
  v.preload = 'auto'
  // blob URL 为同源，设置 crossOrigin 反而可能污染 canvas；仅对 http/https 启用
  if (!url.startsWith('blob:')) v.crossOrigin = 'anonymous'
  v.src = url
  await new Promise<void>((resolve, reject) => {
    v.onloadeddata = () => resolve()
    v.onerror = () => reject(new Error('视频加载失败'))
  })

  const s = Math.max(0, start)
  const e = Math.min(v.duration, end || v.duration)
  const duration = Math.max(0, e - s)
  let count = Math.floor(duration * Math.max(1, fps))
  if (count > maxFrames) count = maxFrames
  if (count < 1) count = 1

  const outW = crop ? Math.max(1, Math.round(crop.w)) : v.videoWidth
  const outH = crop ? Math.max(1, Math.round(crop.h)) : v.videoHeight

  // 辅助：确保视频已 seek 到指定时间且帧已解码
  async function seekTo(time: number) {
    if (Math.abs(v.currentTime - time) < 0.001) return
    await new Promise<void>((resolve, reject) => {
      const onSeeked = () => {
        v.removeEventListener('seeked', onSeeked)
        v.removeEventListener('error', onError)
        resolve()
      }
      const onError = () => {
        v.removeEventListener('seeked', onSeeked)
        v.removeEventListener('error', onError)
        reject(new Error('视频 seek 失败'))
      }
      v.addEventListener('seeked', onSeeked, { once: true })
      v.addEventListener('error', onError, { once: true })
      v.currentTime = time
    })
  }

  // 辅助：等待下一帧渲染完成（现代浏览器可用 requestVideoFrameCallback）
  async function waitFrame() {
    if ('requestVideoFrameCallback' in v) {
      await new Promise<void>(r => (v as any).requestVideoFrameCallback(() => r()))
    }
  }

  const frames: { url: string; width: number; height: number }[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? s : s + (duration * i) / (count - 1)
    await seekTo(t)
    await waitFrame()
    const c = document.createElement('canvas')
    c.width = outW
    c.height = outH
    const ctx = c.getContext('2d')!
    if (crop) {
      ctx.drawImage(v, crop.x, crop.y, crop.w, crop.h, 0, 0, outW, outH)
    } else {
      ctx.drawImage(v, 0, 0, outW, outH)
    }
    frames.push({ url: c.toDataURL('image/png'), width: outW, height: outH })
  }
  v.pause()
  v.src = ''
  return frames
}

/**
 * 对单帧图像应用抠图参数，返回 PNG Data URL。
 */
export async function mattingFrame(url: string, params: MattingParams): Promise<string> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const src = ctx.getImageData(0, 0, c.width, c.height)
  const out = applyMattingParams(src, params)
  ctx.putImageData(out, 0, 0)
  return c.toDataURL('image/png')
}

/**
 * 将帧序列合成为 GIF，返回对象 URL 与大小。
 */
export async function renderFramesToGif(
  frames: { url: string; width: number; height: number }[],
  delay = 100
): Promise<{ url: string; size: number }> {
  return framesToGif(frames, delay)
}

/**
 * 将帧序列合成为 WebM 视频，返回对象 URL。
 */
export async function renderFramesToVideo(
  frames: { url: string; width: number; height: number }[],
  delay = 100
): Promise<string> {
  return framesToVideo(frames, delay)
}

/**
 * 将 AudioBuffer 编码为 WAV Blob。
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels
  const length = buffer.length * numOfChan * 2 + 44
  const arrayBuffer = new ArrayBuffer(length)
  const view = new DataView(arrayBuffer)
  const channels: Float32Array[] = []
  let sample: number
  let offset = 0
  let pos = 0

  // 写入 WAV 文件头
  setUint32(0x46464952) // 'RIFF'
  setUint32(length - 8) // file length
  setUint32(0x45564157) // 'WAVE'
  setUint32(0x20746d66) // 'fmt ' chunk
  setUint32(16) // length = 16
  setUint16(1) // PCM
  setUint16(numOfChan)
  setUint32(buffer.sampleRate)
  setUint32(buffer.sampleRate * 2 * numOfChan) // avg. bytes/sec
  setUint16(numOfChan * 2) // block-align
  setUint16(16) // 16-bit
  setUint32(0x61746164) // 'data' chunk
  setUint32(length - pos - 4) // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i))

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]))
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(pos, sample, true)
      pos += 2
    }
    offset++
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })

  function setUint16(data: number) {
    view.setUint16(pos, data, true)
    pos += 2
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true)
    pos += 4
  }
}

/**
 * 从视频文件中提取音频并编码为 WAV Blob。
 * 使用 AudioContext.decodeAudioData 解码整个文件。
 */
export async function extractVideoAudio(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  const ctx = new AudioContext()
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    return audioBufferToWav(audioBuffer)
  } finally {
    await ctx.close()
  }
}
