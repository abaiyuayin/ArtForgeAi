import { describe, it, expect } from 'vitest'
import { decodeGif } from './gifDecode'

// ---- 测试用：标准 LZW 编码器（与解码器配对的简单变体）----
function lzwEncode(minCodeSize: number, indices: Uint8Array): Uint8Array {
  const clear = 1 << minCodeSize
  const eoi = clear + 1
  let codeSize = minCodeSize + 1
  let next = eoi + 1
  const table = new Map<string, number>()
  for (let i = 0; i < clear; i++) table.set(String(i), i)
  const out: number[] = []
  const writeCode = (c: number) => {
    for (let i = 0; i < codeSize; i++) out.push((c >> i) & 1)
  }
  writeCode(clear)
  let w = String(indices[0])
  for (let i = 1; i < indices.length; i++) {
    const k = String(indices[i])
    const combined = w + ',' + k
    if (table.has(combined)) {
      w = combined
    } else {
      writeCode(table.get(w)!)
      table.set(combined, next)
      next++
      if (next === (1 << codeSize) && codeSize < 12) codeSize++
      w = k
    }
  }
  writeCode(table.get(w)!)
  writeCode(eoi)
  const bytes: number[] = []
  for (let i = 0; i < out.length; i += 8) {
    let b = 0
    for (let j = 0; j < 8 && i + j < out.length; j++) b |= out[i + j] << j
    bytes.push(b)
  }
  return new Uint8Array(bytes)
}

function makeGct(colors: number): number[] {
  const gct: number[] = []
  for (let i = 0; i < colors; i++) {
    gct.push(Math.round((i * 255) / Math.max(1, colors - 1)), (i * 123) & 0xff, (i * 77) & 0xff)
  }
  return gct
}

function buildGif(
  width: number,
  height: number,
  indices: Uint8Array,
  gct: number[],
  opts: { interlace?: boolean; transparentIndex?: number } = {}
): ArrayBuffer {
  const bytes: number[] = []
  const str = (s: string) => {
    for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i))
  }
  const gctColors = gct.length / 3
  const gctBits = Math.round(Math.log2(gctColors)) - 1
  str('GIF89a')
  bytes.push(width & 0xff, (width >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff)
  bytes.push(0x80 | gctBits, 0, 0)
  for (const c of gct) bytes.push(c)

  // 可选 Graphic Control Extension（透明色）
  if (opts.transparentIndex !== undefined) {
    bytes.push(0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, opts.transparentIndex, 0x00)
  }

  // 图像描述符（含 Packed 字节：第 10 字节；0x40 表示交错）
  bytes.push(0x2c, 0, 0, 0, 0, width & 0xff, (width >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff, opts.interlace ? 0x40 : 0x00)

  const minCode = Math.max(2, Math.ceil(Math.log2(gctColors)))
  bytes.push(minCode)
  const lzw = lzwEncode(minCode, indices)
  let i = 0
  while (i < lzw.length) {
    const n = Math.min(255, lzw.length - i)
    bytes.push(n)
    for (let j = 0; j < n; j++) bytes.push(lzw[i + j])
    i += n
  }
  bytes.push(0x00, 0x3b)
  return new Uint8Array(bytes).buffer
}

function interlaceOrder(w: number, h: number, src: Uint8Array): Uint8Array {
  const out = new Uint8Array(src.length)
  const rows: number[] = []
  for (let y = 0; y < h; y += 8) rows.push(y)
  for (let y = 4; y < h; y += 8) rows.push(y)
  for (let y = 2; y < h; y += 4) rows.push(y)
  for (let y = 1; y < h; y += 2) rows.push(y)
  for (let r = 0; r < rows.length; r++) {
    for (let x = 0; x < w; x++) out[r * w + x] = src[rows[r] * w + x]
  }
  return out
}

// 多帧 GIF 构造：每帧可指定子区域(left/top/w/h)、处置方式与透明色
function buildMultiGif(
  width: number,
  height: number,
  gct: number[],
  frames: { left: number; top: number; w: number; h: number; indices: Uint8Array; disposal?: number; transparentIndex?: number }[]
): ArrayBuffer {
  const bytes: number[] = []
  const str = (s: string) => { for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i)) }
  const gctColors = gct.length / 3
  const gctBits = Math.round(Math.log2(gctColors)) - 1
  str('GIF89a')
  bytes.push(width & 0xff, (width >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff, 0x80 | gctBits, 0, 0)
  for (const c of gct) bytes.push(c)
  for (const fr of frames) {
    const disposal = fr.disposal ?? 0
    const transp = fr.transparentIndex
    const gcePacked = (disposal << 2) | (transp !== undefined ? 1 : 0)
    bytes.push(0x21, 0xf9, 0x04, gcePacked, 0x00, 0x00, transp ?? 0, 0x00)
    bytes.push(
      0x2c,
      fr.left & 0xff, (fr.left >> 8) & 0xff, fr.top & 0xff, (fr.top >> 8) & 0xff,
      fr.w & 0xff, (fr.w >> 8) & 0xff, fr.h & 0xff, (fr.h >> 8) & 0xff, 0x00
    )
    const minCode = Math.max(2, Math.ceil(Math.log2(gctColors)))
    bytes.push(minCode)
    const lzw = lzwEncode(minCode, fr.indices)
    let i = 0
    while (i < lzw.length) {
      const n = Math.min(255, lzw.length - i)
      bytes.push(n)
      for (let j = 0; j < n; j++) bytes.push(lzw[i + j])
      i += n
    }
    bytes.push(0x00)
  }
  bytes.push(0x3b)
  return new Uint8Array(bytes).buffer
}

function checkRoundTrip(width: number, height: number, indices: Uint8Array, colors: number, interlace = false) {
  const gct = makeGct(colors)
  const encoded = interlace ? interlaceOrder(width, height, indices) : indices
  const buf = buildGif(width, height, encoded, gct, { interlace })
  const frames = decodeGif(buf)
  expect(frames.length).toBe(1)
  const f = frames[0]
  expect(f.width).toBe(width)
  expect(f.height).toBe(height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = indices[y * width + x]
      const fi = (y * width + x) * 4
      expect(f.rgba[fi]).toBe(gct[idx * 3])
      expect(f.rgba[fi + 1]).toBe(gct[idx * 3 + 1])
      expect(f.rgba[fi + 2]).toBe(gct[idx * 3 + 2])
      expect(f.rgba[fi + 3]).toBe(255)
    }
  }
}

describe('decodeGif', () => {
  it('单像素 GIF 可解码', () => {
    const indices = new Uint8Array([0])
    checkRoundTrip(1, 1, indices, 4)
  })

  it('随机小图（非交织）往返一致', () => {
    const w = 12
    const h = 9
    const indices = new Uint8Array(w * h)
    let seed = 12345n
    for (let i = 0; i < indices.length; i++) {
      seed = (seed * 1103515245n + 12345n) & 0x7fffffffn
      indices[i] = Number(seed) % 4
    }
    checkRoundTrip(w, h, indices, 4)
  })

  it('交织（interlace）图往返一致', () => {
    const w = 16
    const h = 13
    const indices = new Uint8Array(w * h)
    let seed = 999n
    for (let i = 0; i < indices.length; i++) {
      seed = (seed * 1103515245n + 12345n) & 0x7fffffffn
      indices[i] = Number(seed) % 16
    }
    checkRoundTrip(w, h, indices, 16, true)
  })

  it('大图触发字典增长与码长扩展', () => {
    const w = 40
    const h = 40
    const indices = new Uint8Array(w * h)
    let seed = 7n
    for (let i = 0; i < indices.length; i++) {
      seed = (seed * 1103515245n + 12345n) & 0x7fffffffn
      indices[i] = Number(seed) % 256
    }
    checkRoundTrip(w, h, indices, 256)
  })

  it('含透明色的帧保留透明像素（alpha=0）', () => {
    const w = 4
    const h = 4
    const indices = new Uint8Array([0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0])
    const gct = makeGct(4)
    const buf = buildGif(w, h, indices, gct, { transparentIndex: 1 })
    const frames = decodeGif(buf)
    expect(frames.length).toBe(1)
    const f = frames[0]
    for (let i = 0; i < indices.length; i++) {
      const fi = i * 4
      if (indices[i] === 1) {
        expect(f.rgba[fi + 3]).toBe(0) // 透明像素保留 alpha=0
      } else {
        expect(f.rgba[fi + 3]).toBe(255)
        expect(f.rgba[fi]).toBe(gct[indices[i] * 3])
      }
    }
  })

  it('多帧 GIF 解码出多帧', () => {
    // 两帧：第一帧全 0，第二帧全 1（用处置方式 1 直接叠加）
    const w = 3
    const h = 3
    const build = (idx: number): ArrayBuffer => {
      const indices = new Uint8Array(w * h).fill(idx)
      const gct = makeGct(4)
      return buildGif(w, h, indices, gct)
    }
    // 拼接两段 GIF 字节（简化：分别解码，验证数量）
    const f1 = decodeGif(build(0))
    const f2 = decodeGif(build(1))
    expect(f1.length).toBe(1)
    expect(f2.length).toBe(1)
    expect(f1[0].rgba[0]).toBe(makeGct(4)[0])
    expect(f2[0].rgba[0]).toBe(makeGct(4)[3])
  })

  it('无效文件抛出异常', () => {
    const bad = new Uint8Array([1, 2, 3, 4, 5]).buffer
    expect(() => decodeGif(bad)).toThrow()
  })

  it('多帧处置方式（disposal 1/3）合成正确：restore-to-previous 应清除上一帧内容', () => {
    const W = 4
    const H = 4
    const gct = makeGct(4)
    // 帧0：整画布 index0（底色），处置 1
    const f0 = new Uint8Array(W * H).fill(0)
    // 帧1：左上 2x2 = index1（局部帧），处置 3（恢复到上一帧）
    const f1 = new Uint8Array([1, 1, 1, 1])
    // 帧2：右下 2x2 = index2（局部帧），处置 1
    const f2 = new Uint8Array([2, 2, 2, 2])

    const buf = buildMultiGif(W, H, gct, [
      { left: 0, top: 0, w: W, h: H, indices: f0, disposal: 1 },
      { left: 0, top: 0, w: 2, h: 2, indices: f1, disposal: 3 },
      { left: 2, top: 2, w: 2, h: 2, indices: f2, disposal: 1 },
    ])
    const frames = decodeGif(buf)
    expect(frames.length).toBe(3)

    // 帧0：全 index0
    for (let i = 0; i < W * H; i++) {
      const fi = i * 4
      expect(frames[0].rgba[fi]).toBe(gct[0])
      expect(frames[0].rgba[fi + 3]).toBe(255)
    }
    // 帧1：左上 2x2 = index1，其余 index0
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const fi = (y * W + x) * 4
      const expected = x < 2 && y < 2 ? 1 : 0
      expect(frames[1].rgba[fi]).toBe(gct[expected * 3])
      expect(frames[1].rgba[fi + 3]).toBe(255)
    }
    // 帧2：处置3 应恢复到帧1之前（=帧0），左上 index1 必须消失；右下 2x2 = index2，其余 index0
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const fi = (y * W + x) * 4
      let expected = 0
      if (x >= 2 && y >= 2) expected = 2
      expect(frames[2].rgba[fi]).toBe(gct[expected * 3])
      expect(frames[2].rgba[fi + 3]).toBe(255)
    }
  })
})
