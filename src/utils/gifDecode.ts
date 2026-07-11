// 纯前端 GIF 解码器（无第三方依赖）：解析 GIF87a / GIF89a，
// 解 LZW 压缩，并按 Graphic Control Extension 的透明色与处置方式合成逐帧 RGBA。
// 用于「GIF 转序列帧」功能，替代原来的占位假数据。

export interface GifFrame {
  width: number
  height: number
  /** 合成后的整帧 RGBA 像素数据，长度为 width * height * 4 */
  rgba: Uint8ClampedArray
  /** 单帧延迟（毫秒） */
  delay: number
}

/** 解交织：GIF 交错的 4 趟扫描行顺序还原为正常行顺序 */
function deinterlace(indices: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(indices.length)
  // 四趟扫描的起始行与步长（与 GIF 编码端完全一致）
  const passes: Array<[number, number]> = [
    [0, 8],
    [4, 8],
    [2, 4],
    [1, 2],
  ]
  let src = 0
  for (const [start, step] of passes) {
    for (let y = start; y < h; y += step) {
      for (let x = 0; x < w; x++) out[y * w + x] = indices[src * w + x]
      src++
    }
  }
  return out
}

/** LZW 解码：将 GIF 图像数据解压为颜色索引数组 */
function lzwDecode(minCodeSize: number, data: Uint8Array, out: Uint8Array): void {
  const clearCode = 1 << minCodeSize
  const eoiCode = clearCode + 1
  const MAX = 4096
  const prefix = new Int32Array(MAX)
  const suffix = new Int32Array(MAX)
  const stack = new Int32Array(MAX)
  let sp = 0
  let codeSize = minCodeSize + 1
  let next = eoiCode + 1
  let prev = -1
  let bitBuf = 0
  let bitCnt = 0
  let bytePos = 0
  let op = 0

  const readCode = (): number => {
    while (bitCnt < codeSize) {
      if (bytePos >= data.length) return eoiCode
      bitBuf |= data[bytePos++] << bitCnt
      bitCnt += 8
    }
    const code = bitBuf & ((1 << codeSize) - 1)
    bitBuf >>>= codeSize
    bitCnt -= codeSize
    return code
  }

  // 把某个 code 的展开（符号链）压入 stack，并返回首符号（根符号）
  const pushChain = (c: number): number => {
    let cur = c
    while (cur >= clearCode) {
      stack[sp++] = suffix[cur]
      cur = prefix[cur]
    }
    stack[sp++] = cur
    return cur
  }

  while (op < out.length) {
    const code = readCode()
    if (code === clearCode) {
      codeSize = minCodeSize + 1
      next = eoiCode + 1
      prev = -1
      continue
    }
    if (code === eoiCode) break
    if (prev === -1) {
      // 清空码后的第一个码必须是字面量
      out[op++] = code
      prev = code
      continue
    }
    let firstSym: number
    if (code < next) {
      firstSym = pushChain(code)
    } else if (code === next) {
      // KwKwK 特殊情形：code 的展开 = prev 的展开 + prev 的首符号（首符号即 prev 链的根）
      let r = prev
      while (r >= clearCode) r = prefix[r]
      firstSym = r
      // 注意顺序：先把首符号压栈打底，再压 prev 的整条链，
      // 出栈后得到 [expansion(prev), firstSym]，顺序才正确。
      stack[sp++] = firstSym
      pushChain(prev)
    } else {
      break // 非法码，终止
    }
    while (sp > 0) out[op++] = stack[--sp]
    if (next < MAX) {
      prefix[next] = prev
      suffix[next] = firstSym
      next++
    }
    prev = code
    // 码长加宽：字典项占满 0..(1<<codeSize)-1 后，下一个待分配码 next == 1<<codeSize，
    // 此时在继续解码前必须加宽码长（编码器在同一时刻加宽）。
    if (next === (1 << codeSize) && codeSize < 12) codeSize++
  }
}

/**
 * 解码 GIF 文件为逐帧 RGBA 帧列表。
 * @param buffer GIF 文件的 ArrayBuffer
 * @returns 合成后的逐帧数据（每帧均为完整画布尺寸）
 */
export function decodeGif(buffer: ArrayBuffer): GifFrame[] {
  const data = new Uint8Array(buffer)
  let p = 0
  const u8 = (): number => data[p++]
  const u16 = (): number => {
    const v = data[p] | (data[p + 1] << 8)
    p += 2
    return v
  }
  const str = (n: number): string => {
    let s = ''
    for (let i = 0; i < n; i++) s += String.fromCharCode(data[p++])
    return s
  }
  const readColorTable = (n: number): number[] => {
    const t: number[] = []
    for (let i = 0; i < n; i++) {
      t.push(data[p++], data[p++], data[p++])
    }
    return t
  }
  const skipSubBlocks = (): void => {
    let s: number
    while ((s = u8()) !== 0) p += s
  }
  const readSubBlocks = (): Uint8Array => {
    const chunks: number[] = []
    let s: number
    while ((s = u8()) !== 0) {
      for (let i = 0; i < s; i++) chunks.push(data[p++])
    }
    return new Uint8Array(chunks)
  }

  const sig = str(6)
  if (sig !== 'GIF87a' && sig !== 'GIF89a') {
    throw new Error('不是有效的 GIF 文件')
  }
  const W = u16()
  const H = u16()
  const packed = u8()
  const gctFlag = (packed & 0x80) !== 0
  const gctSize = 1 << ((packed & 0x07) + 1)
  u8() // 背景色索引（本解码器未使用）
  u8() // 像素宽高比（未使用）
  const gct = gctFlag ? readColorTable(gctSize) : [] as number[]

  const frames: GifFrame[] = []
  // 合成缓冲区与处置状态
  const full = new Uint8ClampedArray(W * H * 4)
  let saved: Uint8ClampedArray | null = null
  let prevDisposal = 0
  let prevRect = { left: 0, top: 0, w: W, h: H }

  // 逐帧 GCE 状态
  let transparentIndex = -1
  let hasTransparency = false
  let delay = 0
  let disposal = 0

  while (p < data.length) {
    const block = u8()
    if (block === 0x3b) break // 文件结束符
    if (block === 0x21) {
      // 扩展块
      const label = u8()
      if (label === 0xf9) {
        u8() // 块大小（固定 4）
        const ep = u8()
        hasTransparency = (ep & 0x01) !== 0
        disposal = (ep >> 2) & 0x07
        delay = u16()
        transparentIndex = u8()
        u8() // 子块结束符
      } else {
        skipSubBlocks()
      }
    } else if (block === 0x2c) {
      // 图像描述符
      const left = u16()
      const top = u16()
      const iw = u16()
      const ih = u16()
      const ipacked = u8()
      const lctFlag = (ipacked & 0x80) !== 0
      const interlace = (ipacked & 0x40) !== 0
      const lctSize = 1 << ((ipacked & 0x07) + 1)
      const ct = lctFlag ? readColorTable(lctSize) : gct

      // 应用上一帧的处置方式
      if (prevDisposal === 2) {
        // 恢复到背景：清掉上一帧区域为透明
        for (let y = 0; y < prevRect.h; y++) {
          for (let x = 0; x < prevRect.w; x++) {
            const fi = ((prevRect.top + y) * W + (prevRect.left + x)) * 4
            full[fi] = 0
            full[fi + 1] = 0
            full[fi + 2] = 0
            full[fi + 3] = 0
          }
        }
      } else if (prevDisposal === 3 && saved) {
        full.set(saved)
      }

      // 若当前帧使用「恢复到上一帧(3)」，需在绘制前保存“绘制前”的画布快照。
      // 注意：必须在合成当前帧之前捕获，下一帧应用处置时才能还原到本帧之前的状态。
      if (disposal === 3) saved = new Uint8ClampedArray(full)

      const minCode = u8()
      const lzwData = readSubBlocks()
      const indices = new Uint8Array(iw * ih)
      lzwDecode(minCode, lzwData, indices)
      const ordered = interlace ? deinterlace(indices, iw, ih) : indices

      // 合成当前帧到整画布
      for (let y = 0; y < ih; y++) {
        for (let x = 0; x < iw; x++) {
          const idx = ordered[y * iw + x]
          const fi = ((top + y) * W + (left + x)) * 4
          if (hasTransparency && idx === transparentIndex) continue
          const ci = idx * 3
          full[fi] = ct[ci] ?? 0
          full[fi + 1] = ct[ci + 1] ?? 0
          full[fi + 2] = ct[ci + 2] ?? 0
          full[fi + 3] = 255
        }
      }

      // 抓取当前帧（整画布副本）
      const rgba = new Uint8ClampedArray(full)
      frames.push({ width: W, height: H, rgba, delay: delay > 0 ? delay * 10 : 100 })

      prevDisposal = disposal
      prevRect = { left, top, w: iw, h: ih }

      // 重置逐帧 GCE
      hasTransparency = false
      transparentIndex = -1
      delay = 0
      disposal = 0
    } else {
      // 未知块，停止解析
      break
    }
  }

  return frames
}
