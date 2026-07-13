// 资源库全局状态管理：资源列表、导入、导出、资源选择器

import { defineStore } from 'pinia'

import { ref, computed } from 'vue'

import { addAsset, getAssets, deleteAsset, exportAssetsZip, type AssetRecord } from '../utils/assets'



/** 内存中的资源项，包含 UI 选中状态 */

export interface AssetItem extends AssetRecord {

  selected: boolean

}



/** 资源选择器回调类型 */

export type AssetPickerCallback = (asset: AssetItem) => void



export const useAssetsStore = defineStore('assets', () => {

  // 资源列表

  const assets = ref<AssetItem[]>([])



  // 资源选择器状态

  const pickerOpen = ref(false)

  const pickerFilter = ref('all')

  let pickerCallback: AssetPickerCallback | null = null

  let pickerKeepOpen = false



  // 当前过滤后的资源项

  const pickerItems = computed(() => {

    return assets.value.filter(a => pickerFilter.value === 'all' || a.type === pickerFilter.value)

  })



  /** 从 IndexedDB 加载资源列表 */

  async function loadAssets() {

    const records = await getAssets()

    assets.value = records.map(a => ({ ...a, selected: false }))

  }



  /** 添加资源到库 */

  async function addAssetToLibrary(name: string, type: string, dataUrl: string, thumb?: string) {

    const id = await addAsset(name, type, dataUrl, thumb)

    assets.value.push({ id, name, type, dataUrl, thumb: thumb || dataUrl, created: Date.now(), selected: false })

    return id

  }



  /** 删除指定资源 */

  async function removeAsset(id: number) {

    await deleteAsset(id)

    assets.value = assets.value.filter(a => a.id !== id)

  }



  /** 导出全部资源为 ZIP */

  async function exportAllAssets(): Promise<Blob> {

    return exportAssetsZip(assets.value)

  }



  /** 打开资源选择器 */

  function openPicker(filterType: string, cb: AssetPickerCallback, keepOpen = false) {

    pickerFilter.value = filterType

    pickerCallback = cb

    pickerKeepOpen = keepOpen

    pickerOpen.value = true

  }



  /** 关闭资源选择器 */

  function closePicker() {

    pickerOpen.value = false

    pickerCallback = null

    pickerKeepOpen = false

  }



  /** 选择资源 */

  function selectAsset(asset: AssetItem) {

    pickerCallback?.(asset)

    if (!pickerKeepOpen) closePicker()

  }



  return {

    assets,

    pickerOpen,

    pickerFilter,

    pickerItems,

    loadAssets,

    addAssetToLibrary,

    removeAsset,

    exportAllAssets,

    openPicker,

    closePicker,

    selectAsset,

  }

})
