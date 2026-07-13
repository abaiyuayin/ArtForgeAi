<script setup lang="ts">
// 资源选择器弹窗：从资源库中选择图片/视频/GIF 等资源供其他模块使用

import { computed, inject } from 'vue'

import { useAssetsStore, type AssetItem } from '../../stores/assets'



const assetsStore = useAssetsStore()

// 从父组件 WorkspaceView 注入翻译函数

const t = inject<(key: string) => string>('t', (key) => key)



// 资源库所有过滤类型

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



// 当指定了具体类型时只显示该类型按钮，避免用户切换到其他类型

const filterButtons = computed(() => {

  if (assetsStore.pickerFilter === 'all') return assetFilters

  return assetFilters.filter(f => f.key === assetsStore.pickerFilter)

})



function onSelect(a: AssetItem) {

  assetsStore.selectAsset(a)

}



function onClose() {

  assetsStore.closePicker()

}

</script>



<template>

  <Teleport to="body">

    <div v-if="assetsStore.pickerOpen" class="fixed inset-0 bg-black/75 z-[100] flex items-center justify-center p-4" @click.self="onClose">

      <div class="bg-af-surface border border-af-rule rounded-lg w-[900px] max-w-[96vw] h-[80vh] flex flex-col overflow-hidden">

        <div class="flex items-center justify-between px-4 py-3 border-b border-af-rule">

          <div class="text-base font-bold">{{ t('pickerTitle') }}</div>

          <button class="w-9 h-9 rounded-md text-af-muted hover:text-af-ink hover:bg-af-surface-hover text-2xl flex items-center justify-center" @click="onClose">&times;</button>

        </div>

        <div class="flex-1 overflow-hidden p-4 flex flex-col">

          <div class="flex gap-2 mb-3 flex-wrap">

            <button v-for="f in filterButtons" :key="f.key" class="px-2.5 py-1 rounded-md text-xs border transition-colors" :class="assetsStore.pickerFilter === f.key ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'bg-af-bg border-af-rule text-af-muted hover:text-af-ink'" @click="assetsStore.pickerFilter = f.key">{{ t(f.labelKey) }}</button>

          </div>

          <div v-if="!assetsStore.pickerItems.length" class="flex-1 flex items-center justify-center text-af-muted">{{ t('libraryEmpty') }}</div>

          <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 overflow-y-auto flex-1 content-start">

            <div v-for="a in assetsStore.pickerItems" :key="a.id" class="aspect-square bg-af-surface border border-af-rule rounded-md overflow-hidden cursor-pointer hover:border-af-accent transition-colors group relative" @click="onSelect(a)">

              <img :src="a.thumb" class="w-full h-full object-cover bg-[#0e0e14]" />

              <div class="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-[11px] bg-black/70 text-af-ink truncate">{{ a.name }}</div>

            </div>

          </div>

        </div>

        <div class="px-4 py-3 border-t border-af-rule flex items-center justify-between text-xs text-af-muted">

          <span>{{ assetsStore.pickerItems.length }} {{ t('items') }}</span>

          <button class="btn-secondary btn-sm" @click="onClose">{{ t('cancel') }}</button>

        </div>

      </div>

    </div>

  </Teleport>

</template>
