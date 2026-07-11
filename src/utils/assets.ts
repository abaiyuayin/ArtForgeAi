// 导入 IndexedDB 封装库与导出工具函数
import { openDB } from 'idb'
import { dataUrlToBlob, loadImage } from './export'

/**
 * 资源库 IndexedDB 持久化工具
 * 使用 idb 的 openDB 封装，store 名为 assets，keyPath 为 id（自增），
 * 并创建 type 索引用于按类型查询。
 */

/** 资源记录结构 */
export interface AssetRecord {
  id?: number
  name: string
  type: string
  dataUrl: string
  thumb: string
  created: number
}

// 数据库配置常量
const DB_NAME = 'artforgeai-db'
const STORE_NAME = 'assets'
const DB_VERSION = 1

// 数据库实例 Promise 缓存
let dbPromise: ReturnType<typeof openDB> | null = null

/** 获取（或初始化）IndexedDB 数据库实例 */
export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 若对象存储不存在则创建
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
          // 创建 type 索引，便于按类型查询
          store.createIndex('type', 'type', { unique: false })
        }
      },
    })
  }
  return dbPromise
}

/** 为 dataUrl 图片生成缩略图 */
export async function createThumb(dataUrl: string, w: number, h: number): Promise<string> {
  const img = await loadImage(dataUrl)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  return c.toDataURL('image/png')
}

/** 向资源库添加一条资源，并返回新资源的 id */
export async function addAsset(name: string, type: string, dataUrl: string): Promise<number> {
  const db = await getDb()
  // 生成 120x120 缩略图
  const thumb = await createThumb(dataUrl, 120, 120)
  const record: AssetRecord = { name, type, dataUrl, thumb, created: Date.now() }
  return db.add(STORE_NAME, record as any) as Promise<number>
}

/** 保存文件到资源库：图片/gif 保存原图 dataUrl，视频保存第一帧缩略图，返回资源 id */
export async function addAssetFromFile(file: File, thumbDataUrl: string): Promise<number> {
  const db = await getDb()
  const record: AssetRecord = { name: file.name, type: file.type.startsWith('video/') ? 'video' : (file.type === 'image/gif' ? 'gif' : 'image'), dataUrl: thumbDataUrl, thumb: thumbDataUrl, created: Date.now() }
  return db.add(STORE_NAME, record as any) as Promise<number>
}

/** 获取资源库全部资源 */
export async function getAssets(): Promise<AssetRecord[]> {
  const db = await getDb()
  return (await db.getAll(STORE_NAME)) as AssetRecord[]
}

/** 按 id 删除资源 */
export async function deleteAsset(id: number): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_NAME, id)
}

/** 批量导出资源为 ZIP */
export async function exportAssetsZip(assets: AssetRecord[]): Promise<Blob> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  for (const a of assets) {
    zip.file(a.name, dataUrlToBlob(a.dataUrl))
  }
  return zip.generateAsync({ type: 'blob' })
}
