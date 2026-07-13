// 资源库保存相关可组合函数

import { useAssetsStore } from '../stores/assets'



/** 将 File 读取为 Data URL */

export function fileToDataUrl(file: File): Promise<string> {

  return new Promise((resolve, reject) => {

    const r = new FileReader()

    r.onload = e => resolve(e.target?.result as string)

    r.onerror = reject

    r.readAsDataURL(file)

  })

}



/** 将 Data URL 还原为 File 对象 */

export async function dataUrlToFile(dataUrl: string, filename: string, mimeType: string): Promise<File> {

  const res = await fetch(dataUrl)

  const blob = await res.blob()

  return new File([blob], filename, { type: mimeType || blob.type || 'application/octet-stream' })

}



/** 使用资源库保存逻辑的可组合函数 */

export function useLibrarySaver() {

  const assetsStore = useAssetsStore()



  // 保存 dataUrl 到资源库并持久化

  async function saveToLibrary(url: string, type: string, name?: string) {

    const n = name || `asset_${Date.now()}.png`

    await assetsStore.addAssetToLibrary(n, type, url)

  }



  // 自动保存上传的文件到资源库：图片/gif 保存原图；视频保存完整 dataUrl，缩略图取第一帧

  async function saveFileToLibrary(file: File, dataUrl: string) {

    const type = file.type.startsWith('video/') ? 'video' : (file.type === 'image/gif' ? 'gif' : 'image')

    let thumb = dataUrl

    let finalDataUrl = dataUrl

    if (file.type.startsWith('video/')) {

      const v = document.createElement('video')

      v.src = dataUrl

      v.muted = true

      v.playsInline = true

      await new Promise<void>((resolve, reject) => { v.onloadeddata = () => resolve(); v.onerror = reject })

      v.currentTime = 0

      await new Promise<void>(r => v.addEventListener('seeked', () => r(), { once: true }))

      const c = document.createElement('canvas'); c.width = 120; c.height = 120

      const ctx = c.getContext('2d')!; ctx.drawImage(v, 0, 0, 120, 120)

      thumb = c.toDataURL('image/png')

      v.pause(); v.src = ''

      finalDataUrl = await fileToDataUrl(file)

    }

    await assetsStore.addAssetToLibrary(file.name, type, finalDataUrl, thumb)

  }



  return { saveToLibrary, saveFileToLibrary, fileToDataUrl, dataUrlToFile }

}
