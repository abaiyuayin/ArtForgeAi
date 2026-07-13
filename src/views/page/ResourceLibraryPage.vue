<script setup lang="ts">
// 资源库页面：本地 IndexedDB 资源管理

import { ref, computed, inject, onMounted } from 'vue'

import { saveAs } from 'file-saver'

import { useAssetsStore } from '../../stores/assets'

import { useLibrarySaver, fileToDataUrl } from '../../composables/useLibrary'



const assetsStore = useAssetsStore()

const { saveFileToLibrary } = useLibrarySaver()

const t = inject<(key: string) => string>('t', (key) => key)

const emit = defineEmits<{ (e: 'status', msg: string): void; (e: 'toast', text: string, type?: 'info' | 'success' | 'warning' | 'error'): void }>()



// 资源过滤与搜索

const assetFilters = [

  { key: 'all', labelKey: 'allAssets' },

  { key: 'image', labelKey: 'allImages' },

  { key: 'gif', labelKey: 'allGifs' },

  { key: 'frame', labelKey: 'allFrames' },

  { key: 'sprite', labelKey: 'allSprites' },

  { key: 'map', labelKey: 'allMaps' },

  { key: 'output', labelKey: 'allOutputs' },

  { key: 'video', labelKey: 'allVideos' },

]

const assetFilter = ref('all')

const assetSearch = ref('')

const assetDragOver = ref(false)

const assetImportInput = ref<HTMLInputElement | null>(null)

const previewOpen = ref(false)

const previewUrl = ref('')



const filteredAssets = computed(() => {

  let list = assetsStore.assets

  if (assetFilter.value !== 'all') list = list.filter(a => a.type === assetFilter.value)

  if (assetSearch.value.trim()) {

    const q = assetSearch.value.toLowerCase()

    list = list.filter(a => a.name.toLowerCase().includes(q))

  }

  return list

})



onMounted(() => {

  assetsStore.loadAssets()

})



function triggerAssetImport() {

  assetImportInput.value?.click()

}



async function handleAssetImport(e: Event) {

  const target = e.target as HTMLInputElement

  if (!target.files) return

  try {

    for (const f of Array.from(target.files)) {

      const dataUrl = await fileToDataUrl(f)

      await saveFileToLibrary(f, dataUrl)

    }

    emit('status', t('assetsImported') || '导入完成')

  } catch (err: any) {

    emit('toast', (err?.message as string) || '导入失败', 'error')

  } finally {

    target.value = ''

  }

}



async function handleAssetDrop(e: DragEvent) {

  assetDragOver.value = false

  if (!e.dataTransfer?.files) return

  try {

    for (const f of Array.from(e.dataTransfer.files)) {

      const dataUrl = await fileToDataUrl(f)

      await saveFileToLibrary(f, dataUrl)

    }

    emit('status', t('assetsImported') || '导入完成')

  } catch (err: any) {

    emit('toast', (err?.message as string) || '导入失败', 'error')

  }

}



function selectAllAssets() {

  filteredAssets.value.forEach(a => a.selected = true)

}



async function deleteSelectedAssets() {

  const selected = assetsStore.assets.filter(a => a.selected)

  for (const a of selected) {

    if (a.id !== undefined) await assetsStore.removeAsset(a.id)

  }

}



async function exportAssets() {

  if (!assetsStore.assets.length) return

  const blob = await assetsStore.exportAllAssets()

  saveAs(blob, 'artforge_assets.zip')

  emit('status', t('assetsExported') || '导出完成')

}



function openPreview(url: string) {

  previewUrl.value = url

  previewOpen.value = true

}

</script>



<template>

  <section class="flex flex-col flex-1 overflow-auto">

    <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0">

      <div>

        <h1 class="text-[22px] font-bold tracking-tight">{{ t('resourceLibrary') }}</h1>

        <p class="text-[13px] text-af-muted mt-0.5">{{ t('resourceLibraryDesc2') }}</p>

      </div>

      <div class="flex items-center gap-2">

        <button class="btn-secondary" @click="exportAssets">{{ t('exportAll') }}</button>

        <button class="btn-primary" @click="triggerAssetImport">{{ t('importFiles') }}</button>

        <input ref="assetImportInput" type="file" accept="image/*,video/*,image/gif" multiple class="hidden" @change="handleAssetImport" />

      </div>

    </div>



    <div class="flex-1 overflow-hidden px-5 pb-4" @dragover.prevent="assetDragOver = true" @dragleave.prevent="assetDragOver = false" @drop.prevent="handleAssetDrop">

      <div class="flex h-full border border-af-rule rounded-lg overflow-hidden" :class="assetDragOver ? 'border-af-accent' : ''">

        <div class="w-44 shrink-0 border-r border-af-rule bg-af-surface flex flex-col overflow-hidden">

          <div class="px-3.5 py-3 font-semibold text-[13px] border-b border-af-rule">{{ t('projectType') }}</div>

          <button v-for="f in assetFilters" :key="f.key" class="px-3.5 py-2 text-[13px] text-left transition-colors" :class="assetFilter === f.key ? 'text-af-accent bg-af-accent-soft' : 'text-af-muted hover:text-af-ink hover:bg-af-surface-hover'" @click="assetFilter = f.key">{{ t(f.labelKey) }}</button>

        </div>

        <div class="flex-1 flex flex-col overflow-hidden min-w-0">

          <div class="px-4 py-2.5 border-b border-af-rule flex items-center justify-between gap-2 flex-wrap">

            <div class="relative w-64">

              <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-af-muted pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>

              <input v-model="assetSearch" type="text" :placeholder="t('searchAssets')" class="w-full bg-af-bg border border-af-rule rounded-md py-1.5 pl-8 pr-3 text-af-ink text-[13px] outline-none focus:border-af-accent placeholder:text-af-muted" />

            </div>

            <div class="flex gap-2 items-center">

              <button class="btn-secondary btn-sm" @click="selectAllAssets">{{ t('selectAll') }}</button>

              <button class="btn-danger btn-sm" @click="deleteSelectedAssets">{{ t('deleteSelected') }}</button>

              <span class="text-xs text-af-muted">{{ filteredAssets.length }} {{ t('items') }}</span>

            </div>

          </div>

          <div class="flex-1 overflow-y-auto p-3.5">

            <div v-if="!filteredAssets.length" class="h-full flex items-center justify-center text-af-muted text-lg text-center p-10">{{ t('libraryEmpty') }}</div>

            <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">

              <div v-for="a in filteredAssets" :key="a.id" class="aspect-square bg-af-surface border border-af-rule rounded-md overflow-hidden cursor-pointer relative transition-all hover:border-af-accent" :class="a.selected ? 'border-af-accent' : ''" @click="openPreview(a.thumb)">

                <img :src="a.thumb" class="w-full h-full object-cover bg-[#0e0e14]">

                <div class="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-[11px] bg-black/70 text-af-ink truncate">{{ a.name }}</div>

                <input type="checkbox" v-model="a.selected" class="absolute top-1.5 left-1.5 w-4 h-4 accent-af-accent z-10" @click.stop>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>



    <!-- 图片预览弹窗 -->

    <Teleport to="body">

      <div v-if="previewOpen" class="fixed inset-0 bg-black/75 z-[100] flex items-center justify-center" @click.self="previewOpen = false">

        <div class="bg-af-surface border border-af-rule rounded-lg p-5 max-w-[96vw] max-h-[96vh] flex flex-col items-center overflow-auto">

          <div class="w-full flex items-center justify-between mb-3.5">

            <div class="text-base font-bold">{{ t('preview') }}</div>

            <button class="w-11 h-11 rounded-md text-af-muted hover:text-af-ink hover:bg-af-surface-hover text-2xl flex items-center justify-center" @click="previewOpen = false">&times;</button>

          </div>

          <img :src="previewUrl" alt="preview" class="max-w-full max-h-[70vh] object-contain" />

          <div class="mt-3"><button class="btn-secondary" @click="previewOpen = false">{{ t('close') }}</button></div>

        </div>

      </div>

    </Teleport>

  </section>

</template>
