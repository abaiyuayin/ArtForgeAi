// GIF 解码器独立自检脚本（不依赖 Vite，直接用 Node 运行）。
// 用法：node --experimental-strip-types verify-gif-decode.mts
// 它通过内置的 LZW 编码器构造多组 GIF，再交给 src/utils/gifDecode.ts 解码，
// 验证「编码 -> 解码」逐像素完全一致，覆盖单像素、随机小图、交错、字典增长、透明、非法文件等场景。

import { decodeGif } from './src/utils/gifDecode.ts'
import assert from 'node:assert'

// ---- 内置 LZW 编码器（与解码器约定一致：提前变更 early-change）----
function lzwEncode(minCodeSize: number, indices: Uint8Array): Uint8Array {
  const clear = 1 << minCodeSize
  const eoi = clear + 1
  let codeSize = minCodeSize + 1
  let next = eoi + 1
  const table = new Map<string, number>()
  for (let i = 0; i < clear; i++) table.set(String(i), i)
  const out: number[] = []
  const writeCode = (c: number) => { for (let i = 0; i < codeSize; i++) out.push((c >> i) & 1) }
  writeCode(clear)
  let w = String(indices[0])
  for (let i = 1; i < indices.length; i++) {
    const k = String(indices[i])
    const combined = w + ',' + k
    if (table.has(combined)) { w = combined }
    else { writeCode(table.get(w)!); table.set(combined, next); next++; if (next === (1 << codeSize) && codeSize < 12) codeSize++; w = k }
  }
  writeCode(table.get(w)!); writeCode(eoi)
  const bytes: number[] = []
  for (let i = 0; i < out.length; i += 8) { let b = 0; for (let j = 0; j < 8 && i + j < out.length; j++) b |= out[i + j] << j; bytes.push(b) }
  return new Uint8Array(bytes)
}

function makeGct(colors: number): number[] {
  const gct: number[] = []
  for (let i = 0; i < colors; i++) gct.push(Math.round((i * 255) / Math.max(1, colors - 1)), (i * 123) & 0xff, (i * 77) & 0xff)
  return gct
}

function buildGif(width: number, height: number, indices: Uint8Array, gct: number[], opts: { interlace?: boolean; transparentIndex?: number } = {}): ArrayBuffer {
  const bytes: number[] = []
  const str = (s: string) => { for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i)) }
  const gctColors = gct.length / 3
  const gctBits = Math.round(Math.log2(gctColors)) - 1
  str('GIF89a')
  bytes.push(width & 0xff, (width >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff)
  bytes.push(0x80 | gctBits, 0, 0)
  for (const c of gct) bytes.push(c)
  if (opts.transparentIndex !== undefined) bytes.push(0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, opts.transparentIndex, 0x00)
  // 图像描述符必须包含「Packed」字节（第 10 字节）：0x40 表示交错
  bytes.push(0x2c, 0, 0, 0, 0, width & 0xff, (width >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff, opts.interlace ? 0x40 : 0x00)
  const minCode = Math.max(2, Math.ceil(Math.log2(gctColors)))
  bytes.push(minCode)
  const lzw = lzwEncode(minCode, indices)
  let i = 0
  while (i < lzw.length) { const n = Math.min(255, lzw.length - i); bytes.push(n); for (let j = 0; j < n; j++) bytes.push(lzw[i + j]); i += n }
  bytes.push(0x00, 0x3b)
  return new Uint8Array(bytes).buffer
}

function interlaceOrder(w: number, h: number, src: Uint8Array): Uint8Array {
  const out = new Uint8Array(src.length); const rows: number[] = []
  for (let y = 0; y < h; y += 8) rows.push(y)
  for (let y = 4; y < h; y += 8) rows.push(y)
  for (let y = 2; y < h; y += 4) rows.push(y)
  for (let y = 1; y < h; y += 2) rows.push(y)
  for (let r = 0; r < rows.length; r++) for (let x = 0; x < w; x++) out[r * w + x] = src[rows[r] * w + x]
  return out
}

function checkRoundTrip(width: number, height: number, indices: Uint8Array, colors: number, interlace = false) {
  const gct = makeGct(colors)
  const encoded = interlace ? interlaceOrder(width, height, indices) : indices
  const buf = buildGif(width, height, encoded, gct, { interlace })
  const frames = decodeGif(buf)
  assert.strictEqual(frames.length, 1)
  const f = frames[0]
  assert.strictEqual(f.width, width)
  assert.strictEqual(f.height, height)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const idx = indices[y * width + x]; const fi = (y * width + x) * 4
    const er = gct[idx * 3], eg = gct[idx * 3 + 1], eb = gct[idx * 3 + 2]
    assert.strictEqual(f.rgba[fi], er)
    assert.strictEqual(f.rgba[fi + 1], eg)
    assert.strictEqual(f.rgba[fi + 2], eb)
    assert.strictEqual(f.rgba[fi + 3], 255)
  }
}

console.log('STEP 0 ok: imports loaded')
checkRoundTrip(1, 1, new Uint8Array([0]), 4); console.log('STEP 1 ok: 1x1')
{
  const w = 12, h = 9, indices = new Uint8Array(w * h); let seed = 12345
  for (let i = 0; i < indices.length; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; indices[i] = seed % 4 }
  checkRoundTrip(w, h, indices, 4); console.log('STEP 2 ok: 12x9')
}
{
  const w = 16, h = 13, indices = new Uint8Array(w * h); let seed = 999
  for (let i = 0; i < indices.length; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; indices[i] = seed % 16 }
  checkRoundTrip(w, h, indices, 16, true); console.log('STEP 3 ok: 16x13 interlace')
}
{
  const w = 40, h = 40, indices = new Uint8Array(w * h); let seed = 7
  for (let i = 0; i < indices.length; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; indices[i] = seed % 256 }
  checkRoundTrip(w, h, indices, 256); console.log('STEP 4 ok: 40x40 dict growth')
}
{
  const w = 4, h = 4, indices = new Uint8Array([0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0])
  const gct = makeGct(4)
  const buf = buildGif(w, h, indices, gct, { transparentIndex: 1 })
  const f = decodeGif(buf)[0]
  for (let i = 0; i < indices.length; i++) {
    const fi = i * 4
    if (indices[i] === 1) assert.strictEqual(f.rgba[fi + 3], 0)
    else { assert.strictEqual(f.rgba[fi + 3], 255); assert.strictEqual(f.rgba[fi], gct[0]) }
  }
  console.log('STEP 5 ok: transparency')
}
assert.throws(() => decodeGif(new Uint8Array([1, 2, 3, 4, 5]).buffer))
console.log('STEP 6 ok: invalid throws')
console.log('✅ GIF 解码器自检全部通过')
