#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Redesign WorkspaceView.vue targeted sections."""

from pathlib import Path

FILE = Path(r"c:\Users\30684\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a395283fab124df8d97b1d2\artforgeai-web\src\views\WorkspaceView.vue")

def main():
    text = FILE.read_text(encoding="utf-8")

    # ========== Section A: Header ==========
    old_header = '''    <header class="h-[52px] flex items-center justify-between px-4 shrink-0 z-50 border-b border-af-rule bg-af-surface">

      <div class="flex items-center gap-3">

        <RouterLink to="/" class="flex items-center gap-2.5 font-bold text-[15px] tracking-wide text-af-ink no-underline">

          <div class="w-7 h-7 rounded-md flex items-center justify-center text-sm text-white bg-gradient-to-br from-af-accent to-af-accent2">AF</div>

          <span>ArtForgeAI</span>

        </RouterLink>

        <div class="relative w-80">

          <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-af-muted pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>

          <input v-model="globalSearch" type="text" :placeholder="t('searchPlaceholder')" class="w-full bg-af-bg border border-af-rule rounded-md py-1.5 pl-8 pr-3 text-af-ink text-[13px] outline-none focus:border-af-accent placeholder:text-af-muted" />

        </div>

      </div>

      <div class="flex items-center gap-2.5">

        <div class="flex items-center gap-0.5 bg-af-bg border border-af-rule rounded-md overflow-hidden">

          <button v-for="l in langOptions" :key="l.key" class="px-1.5 py-1 text-[11px] font-medium transition-colors" :class="lang === l.key ? 'bg-af-accent text-black' : 'text-af-muted hover:text-af-ink'" @click="lang = l.key">{{ l.label }}</button>

        </div>

        <div class="flex items-center gap-0.5 bg-af-bg border border-af-rule rounded-md overflow-hidden">

          <button v-for="th in themeOptions" :key="th.key" class="px-1.5 py-1 text-[11px] font-medium transition-colors" :class="activeTheme === th.key ? 'bg-af-accent text-black' : 'text-af-muted hover:text-af-ink'" @click="setTheme(th.key)">{{ th.label }}</button>

        </div>

        <button class="relative p-1.5 rounded-md text-af-muted hover:text-af-ink hover:bg-af-surface-hover transition-colors group" @click="apiOpen = true">

          <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>

          <span v-if="apiKey" class="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-af-accent ring-2 ring-af-surface"></span>

          <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-[11px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">{{ t('apiSettings') }}</span>

        </button>

        <button class="relative p-1.5 rounded-md text-af-muted hover:text-af-ink hover:bg-af-surface-hover transition-colors group" @click="navigate('resource-library')">

          <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>

          <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-[11px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">{{ t('resourceLibrary') }}</span>

        </button>

      </div>

    </header>'''

    new_header = '''    <!-- 顶部导航栏：左侧显示品牌与当前页面标题，右侧放置语言/主题/API/资源库入口 -->
    <header class="h-[52px] flex items-center justify-between px-4 shrink-0 z-50 border-b border-af-rule bg-af-surface">

      <div class="flex items-center gap-4 min-w-0">
        <!-- 品牌 Logo -->
        <RouterLink to="/" class="flex items-center gap-2.5 font-bold text-[15px] tracking-wide text-af-ink no-underline shrink-0">
          <div class="w-7 h-7 rounded-md flex items-center justify-center text-sm text-white bg-gradient-to-br from-af-accent to-af-accent2">AF</div>
          <span>ArtForgeAI</span>
        </RouterLink>

        <!-- 页面面包屑/标题 -->
        <div class="h-5 w-px bg-af-rule shrink-0"></div>
        <div class="flex items-center gap-2 text-[13px] text-af-muted min-w-0">
          <span class="whitespace-nowrap">{{ t('workspace') }}</span>
          <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          <span class="font-medium text-af-ink truncate">{{ currentScreenTitle }}</span>
        </div>
      </div>

      <div class="flex items-center gap-2.5 shrink-0">
        <!-- 语言切换 -->
        <div class="flex items-center gap-0.5 bg-af-bg border border-af-rule rounded-md overflow-hidden">
          <button v-for="l in langOptions" :key="l.key" class="px-1.5 py-1 text-[11px] font-medium transition-colors" :class="lang === l.key ? 'bg-af-accent text-black' : 'text-af-muted hover:text-af-ink'" @click="lang = l.key">{{ l.label }}</button>
        </div>
        <!-- 主题切换 -->
        <div class="flex items-center gap-0.5 bg-af-bg border border-af-rule rounded-md overflow-hidden">
          <button v-for="th in themeOptions" :key="th.key" class="px-1.5 py-1 text-[11px] font-medium transition-colors" :class="activeTheme === th.key ? 'bg-af-accent text-black' : 'text-af-muted hover:text-af-ink'" @click="setTheme(th.key)">{{ th.label }}</button>
        </div>
        <!-- API 设置 -->
        <button class="relative p-1.5 rounded-md text-af-muted hover:text-af-ink hover:bg-af-surface-hover transition-colors group" @click="apiOpen = true">
          <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          <span v-if="apiKey" class="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-af-accent ring-2 ring-af-surface"></span>
          <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-[11px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">{{ t('apiSettings') }}</span>
        </button>
        <!-- 资源库入口 -->
        <button class="relative p-1.5 rounded-md text-af-muted hover:text-af-ink hover:bg-af-surface-hover transition-colors group" @click="navigate('resource-library')">
          <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-[11px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">{{ t('resourceLibrary') }}</span>
        </button>
      </div>

    </header>'''

    assert old_header in text, "Header block not found"
    text = text.replace(old_header, new_header)

    # ========== Section B: Sidebar ==========
    old_sidebar = '''      <aside class="shrink-0 flex flex-col overflow-hidden border-r border-af-rule bg-af-surface transition-[width] duration-300" :class="sidebarCollapsed ? 'w-14' : 'w-[230px]'">

        <div class="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2.5">

          <div class="mb-1">

            <button class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors" :class="currentScreen === 'home' ? 'text-af-accent bg-af-accent-soft' : 'text-af-muted hover:text-af-ink hover:bg-af-surface-hover'" @click="navigate('home')">

              <svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>

              <span class="whitespace-nowrap overflow-hidden transition-all" :class="sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'">{{ t('home') }}</span>

            </button>

          </div>

          <SidebarGroup v-model:open="groups.ai" :title="t('aiWorkshop')" :collapsed="sidebarCollapsed">

            <SidebarItem :label="t('txt2img')" :active="currentScreen === 'ai-concept' && aiTab === 'txt2img'" @click="goSub('ai-concept','txt2img')" />

            <SidebarItem v-if="false" :label="t('styleTransfer')" :active="currentScreen === 'ai-concept' && aiTab === 'style'" @click="goSub('ai-concept','style')" />

            <SidebarItem v-if="false" :label="t('charSimplify')" :active="currentScreen === 'ai-concept' && aiTab === 'simplify'" @click="goSub('ai-concept','simplify')" />

            <SidebarItem v-if="false" :label="t('poseGen')" :active="currentScreen === 'ai-concept' && aiTab === 'pose'" @click="goSub('ai-concept','pose')" />

            <SidebarItem :label="t('imageMatting')" :active="currentScreen === 'ai-concept' && aiTab === 'matting'" @click="goSub('ai-concept','matting')" />

          </SidebarGroup>

          <SidebarGroup v-model:open="groups.frame" :title="t('seqWorkshop')" :collapsed="sidebarCollapsed">

            <SidebarItem :label="t('videoToFrames')" :active="currentScreen === 'sequence-frame' && seqTab === 'video'" @click="goSub('sequence-frame','video')" />

            <SidebarItem :label="t('gifToFrames')" :active="currentScreen === 'sequence-frame' && seqTab === 'gif'" @click="goSub('sequence-frame','gif')" />

            <SidebarItem :label="t('spriteSheet')" :active="currentScreen === 'sequence-frame' && seqTab === 'sprite'" @click="goSub('sequence-frame','sprite')" />

            <SidebarItem :label="t('topdownPreview')" :active="currentScreen === 'map-editor' && mapTab === 'preview'" @click="goSub('map-editor','preview')" />

          </SidebarGroup>

          <SidebarGroup v-if="false" v-model:open="groups.pixel" :title="t('pixelWorkshop')" :collapsed="sidebarCollapsed">

            <SidebarItem :label="t('pixelDraw')" :active="currentScreen === 'pixel-studio' && pixelTab === 'draw'" @click="goSub('pixel-studio','draw')" />

            <SidebarItem :label="t('pixelProcess')" :active="currentScreen === 'pixel-studio' && pixelTab === 'process'" @click="goSub('pixel-studio','process')" />

            <SidebarItem :label="t('pixelAction')" :active="currentScreen === 'pixel-studio' && pixelTab === 'action'" @click="goSub('pixel-studio','action')" />

            <SidebarItem :label="t('tileDualGrid')" :active="currentScreen === 'map-editor' && mapTab === 'tilemap'" @click="goSub('map-editor','tilemap')" />

          </SidebarGroup>

          <div class="mb-1">

            <button class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors" :class="currentScreen === 'resource-library' ? 'text-af-accent bg-af-accent-soft' : 'text-af-muted hover:text-af-ink hover:bg-af-surface-hover'" @click="navigate('resource-library')">

              <svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>

              <span class="whitespace-nowrap overflow-hidden transition-all" :class="sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'">{{ t('resourceLibrary') }}</span>

            </button>

          </div>

        </div>'''

    new_sidebar = '''      <!-- 侧边栏：按 CREATE / PROCESS / ASSETS 分组展示功能入口 -->
      <aside class="shrink-0 flex flex-col overflow-hidden border-r border-af-rule bg-af-surface transition-[width] duration-300" :class="sidebarCollapsed ? 'w-14' : 'w-[230px]'">

        <div class="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2.5">

          <div class="mb-1">

            <button class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all" :class="currentScreen === 'home' ? 'text-af-accent bg-af-accent-soft shadow-sm' : 'text-af-muted hover:text-af-ink hover:bg-af-surface-hover'" @click="navigate('home')">

              <svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>

              <span class="whitespace-nowrap overflow-hidden transition-all" :class="sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'">{{ t('home') }}</span>

            </button>

          </div>

          <!-- CREATE 分组：AI 生成 -->
          <div v-if="!sidebarCollapsed" class="px-2.5 pt-3 pb-1 text-[10px] font-bold tracking-wider text-af-muted/70 uppercase">{{ t('sectionCreate') }}</div>

          <SidebarGroup v-model:open="groups.ai" :title="t('aiWorkshop')" :collapsed="sidebarCollapsed">

            <SidebarItem :label="t('txt2img')" :active="currentScreen === 'ai-concept' && aiTab === 'txt2img'" @click="goSub('ai-concept','txt2img')" />

            <SidebarItem v-if="false" :label="t('styleTransfer')" :active="currentScreen === 'ai-concept' && aiTab === 'style'" @click="goSub('ai-concept','style')" />

            <SidebarItem v-if="false" :label="t('charSimplify')" :active="currentScreen === 'ai-concept' && aiTab === 'simplify'" @click="goSub('ai-concept','simplify')" />

            <SidebarItem v-if="false" :label="t('poseGen')" :active="currentScreen === 'ai-concept' && aiTab === 'pose'" @click="goSub('ai-concept','pose')" />

            <SidebarItem :label="t('imageMatting')" :active="currentScreen === 'ai-concept' && aiTab === 'matting'" @click="goSub('ai-concept','matting')" />

          </SidebarGroup>

          <!-- PROCESS 分组：序列帧、像素、地图 -->
          <div v-if="!sidebarCollapsed" class="px-2.5 pt-3 pb-1 text-[10px] font-bold tracking-wider text-af-muted/70 uppercase">{{ t('sectionProcess') }}</div>

          <SidebarGroup v-model:open="groups.frame" :title="t('seqWorkshop')" :collapsed="sidebarCollapsed">

            <SidebarItem :label="t('videoToFrames')" :active="currentScreen === 'sequence-frame' && seqTab === 'video'" @click="goSub('sequence-frame','video')" />

            <SidebarItem :label="t('gifToFrames')" :active="currentScreen === 'sequence-frame' && seqTab === 'gif'" @click="goSub('sequence-frame','gif')" />

            <SidebarItem :label="t('spriteSheet')" :active="currentScreen === 'sequence-frame' && seqTab === 'sprite'" @click="goSub('sequence-frame','sprite')" />

            <SidebarItem :label="t('topdownPreview')" :active="currentScreen === 'map-editor' && mapTab === 'preview'" @click="goSub('map-editor','preview')" />

          </SidebarGroup>

          <SidebarGroup v-model:open="groups.pixel" :title="t('pixelWorkshop')" :collapsed="sidebarCollapsed">

            <SidebarItem :label="t('pixelDraw')" :active="currentScreen === 'pixel-studio' && pixelTab === 'draw'" @click="goSub('pixel-studio','draw')" />

            <SidebarItem :label="t('pixelProcess')" :active="currentScreen === 'pixel-studio' && pixelTab === 'process'" @click="goSub('pixel-studio','process')" />

            <SidebarItem :label="t('pixelAction')" :active="currentScreen === 'pixel-studio' && pixelTab === 'action'" @click="goSub('pixel-studio','action')" />

            <SidebarItem :label="t('tileDualGrid')" :active="currentScreen === 'map-editor' && mapTab === 'tilemap'" @click="goSub('map-editor','tilemap')" />

          </SidebarGroup>

          <!-- ASSETS 分组：资源库 -->
          <div v-if="!sidebarCollapsed" class="px-2.5 pt-3 pb-1 text-[10px] font-bold tracking-wider text-af-muted/70 uppercase">{{ t('sectionAssets') }}</div>

          <div class="mb-1">

            <button class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all" :class="currentScreen === 'resource-library' ? 'text-af-accent bg-af-accent-soft shadow-sm' : 'text-af-muted hover:text-af-ink hover:bg-af-surface-hover'" @click="navigate('resource-library')">

              <svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>

              <span class="whitespace-nowrap overflow-hidden transition-all" :class="sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'">{{ t('resourceLibrary') }}</span>

            </button>

          </div>

        </div>'''

    assert old_sidebar in text, "Sidebar block not found"
    text = text.replace(old_sidebar, new_sidebar)

    # ========== Section C: Home overview ==========
    old_home = '''            <!-- 首页：展示最近使用与快速开始入口 -->

            <section v-show="currentScreen === 'home'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0">

                <div><h1 class="text-[22px] font-bold tracking-tight">{{ t('workspaceTitle') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('workspaceDesc') }}</p></div>

                <button class="btn-secondary inline-flex items-center gap-1.5" @click="apiOpen = true">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-10-10 10 10 0 0 1 10-10z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {{ t('apiConfig') }}
                </button>

              </div>

              <div class="flex-1 overflow-y-auto px-5 pb-4">

                <div class="text-[13px] font-semibold mb-2.5">{{ t('recentlyUsed') }}</div>

                <div class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5 pb-5">

                  <div class="bg-af-surface border border-af-rule rounded-lg p-4 cursor-pointer transition-all hover:border-af-accent hover:bg-af-surface-hover hover:-translate-y-0.5" @click="goSub('ai-concept','txt2img')"><div class="w-8 h-8 rounded-lg bg-af-accent-soft text-af-accent flex items-center justify-center mb-2.5"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg></div><div class="text-base font-semibold mb-1">{{ t('txt2img') }}</div><div class="text-xs text-af-muted leading-relaxed">{{ t('txt2imgDesc') }}</div></div>

                  <div class="bg-af-surface border border-af-rule rounded-lg p-4 cursor-pointer transition-all hover:border-af-accent hover:bg-af-surface-hover hover:-translate-y-0.5" @click="goSub('sequence-frame','video')"><div class="w-8 h-8 rounded-lg bg-af-warning/10 text-af-warning flex items-center justify-center mb-2.5"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></div><div class="text-base font-semibold mb-1">{{ t('videoToFrames') }}</div><div class="text-xs text-af-muted leading-relaxed">{{ t('videoToFramesDesc') }}</div></div>

                  <div class="bg-af-surface border border-af-rule rounded-lg p-4 cursor-pointer transition-all hover:border-af-accent hover:bg-af-surface-hover hover:-translate-y-0.5" @click="goSub('sequence-frame','sprite')"><div class="w-8 h-8 rounded-lg bg-af-accent2/10 text-af-accent2 flex items-center justify-center mb-2.5"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></div><div class="text-base font-semibold mb-1">{{ t('spriteSheet') }}</div><div class="text-xs text-af-muted leading-relaxed">{{ t('spriteSheetDesc') }}</div></div>

                  <div class="bg-af-surface border border-af-rule rounded-lg p-4 cursor-pointer transition-all hover:border-af-accent hover:bg-af-surface-hover hover:-translate-y-0.5" @click="goSub('pixel-studio','draw')"><div class="w-8 h-8 rounded-lg bg-af-accent-soft text-af-accent flex items-center justify-center mb-2.5"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></div><div class="text-base font-semibold mb-1">{{ t('pixelDraw') }}</div><div class="text-xs text-af-muted leading-relaxed">{{ t('pixelDrawDesc') }}</div></div>

                  <div class="bg-af-surface border border-af-rule rounded-lg p-4 cursor-pointer transition-all hover:border-af-accent hover:bg-af-surface-hover hover:-translate-y-0.5" @click="navigate('resource-library')"><div class="w-8 h-8 rounded-lg bg-af-accent-soft text-af-accent flex items-center justify-center mb-2.5"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div><div class="text-base font-semibold mb-1">{{ t('resourceLibrary') }}</div><div class="text-xs text-af-muted leading-relaxed">{{ t('resourceLibraryDesc') }}</div></div>

                </div>

                <div class="text-[13px] font-semibold mb-2.5">{{ t('quickStart') }}</div>

                <div class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">

                  <div class="bg-af-surface border border-af-rule rounded-lg p-4 cursor-pointer transition-all hover:border-af-accent hover:bg-af-surface-hover hover:-translate-y-0.5" @click="goSub('sequence-frame','gif')"><div class="text-base font-semibold mb-1">{{ t('gifToFrames') }}</div><div class="text-xs text-af-muted leading-relaxed">{{ t('gifToFramesDesc') }}</div></div>

                  <div class="bg-af-surface border border-af-rule rounded-lg p-4 cursor-pointer transition-all hover:border-af-accent hover:bg-af-surface-hover hover:-translate-y-0.5" @click="goSub('map-editor','tilemap')"><div class="text-base font-semibold mb-1">{{ t('tileDualGrid') }}</div><div class="text-xs text-af-muted leading-relaxed">{{ t('tileDualGridDesc') }}</div></div>

                  <div class="bg-af-surface border border-af-rule rounded-lg p-4 cursor-pointer transition-all hover:border-af-accent hover:bg-af-surface-hover hover:-translate-y-0.5" @click="goSub('pixel-studio','action')"><div class="text-base font-semibold mb-1">{{ t('pixelAction') }}</div><div class="text-xs text-af-muted leading-relaxed">{{ t('pixelActionDesc') }}</div></div>

                </div>

              </div>

            </section>'''

    new_home = '''            <!-- 首页：仪表盘式概览，按功能分类展示并显示关键统计 -->

            <section v-show="currentScreen === 'home'" class="flex flex-col flex-1 overflow-auto">

              <!-- 欢迎区域与快捷统计 -->
              <div class="px-5 pt-5 pb-4 shrink-0">
                <div class="bg-gradient-to-r from-af-accent/10 to-af-accent2/10 border border-af-accent/20 rounded-xl p-5 mb-5">
                  <div class="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h1 class="text-[22px] font-bold tracking-tight text-af-ink">{{ t('homeHeroTitle') }}</h1>
                      <p class="text-[13px] text-af-muted mt-1 max-w-xl leading-relaxed">{{ t('homeHeroDesc') }}</p>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="px-3 py-2 bg-af-surface border border-af-rule rounded-lg text-center min-w-[80px]">
                        <div class="text-lg font-bold text-af-accent">{{ assets.length }}</div>
                        <div class="text-[11px] text-af-muted">{{ t('statsResources') }}</div>
                      </div>
                      <div class="px-3 py-2 bg-af-surface border border-af-rule rounded-lg text-center min-w-[80px]">
                        <div class="text-lg font-bold text-af-accent2">{{ t2iHistory.length }}</div>
                        <div class="text-[11px] text-af-muted">{{ t('statsGenerations') }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 功能分类卡片 -->
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                  <!-- AI 生成 -->
                  <div class="bg-af-surface border border-af-rule rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-af-accent hover:shadow-md hover:-translate-y-0.5 group" @click="goSub('ai-concept','txt2img')">
                    <div class="flex items-start gap-3.5">
                      <div class="w-11 h-11 rounded-xl bg-af-accent/15 text-af-accent flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
                      </div>
                      <div class="min-w-0">
                        <div class="text-[15px] font-semibold mb-0.5">{{ t('aiGenerationCategory') }}</div>
                        <div class="text-xs text-af-muted leading-relaxed">{{ t('txt2imgDesc') }}</div>
                      </div>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-1.5">
                      <span class="px-2 py-0.5 rounded-full text-[11px] bg-af-accent-soft text-af-accent">{{ t('txt2img') }}</span>
                      <span class="px-2 py-0.5 rounded-full text-[11px] bg-af-accent-soft text-af-accent">{{ t('imageMatting') }}</span>
                    </div>
                  </div>

                  <!-- 序列帧 -->
                  <div class="bg-af-surface border border-af-rule rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-af-warning hover:shadow-md hover:-translate-y-0.5 group" @click="goSub('sequence-frame','video')">
                    <div class="flex items-start gap-3.5">
                      <div class="w-11 h-11 rounded-xl bg-af-warning/15 text-af-warning flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                      </div>
                      <div class="min-w-0">
                        <div class="text-[15px] font-semibold mb-0.5">{{ t('sequenceFramesCategory') }}</div>
                        <div class="text-xs text-af-muted leading-relaxed">{{ t('videoToFramesDesc') }}</div>
                      </div>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-1.5">
                      <span class="px-2 py-0.5 rounded-full text-[11px] bg-af-warning/10 text-af-warning">{{ t('videoToFrames') }}</span>
                      <span class="px-2 py-0.5 rounded-full text-[11px] bg-af-warning/10 text-af-warning">{{ t('gifToFrames') }}</span>
                      <span class="px-2 py-0.5 rounded-full text-[11px] bg-af-warning/10 text-af-warning">{{ t('spriteSheet') }}</span>
                    </div>
                  </div>

                  <!-- 图像处理 -->
                  <div class="bg-af-surface border border-af-rule rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-af-accent hover:shadow-md hover:-translate-y-0.5 group" @click="goSub('ai-concept','matting')">
                    <div class="flex items-start gap-3.5">
                      <div class="w-11 h-11 rounded-xl bg-af-accent2/15 text-af-accent2 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </div>
                      <div class="min-w-0">
                        <div class="text-[15px] font-semibold mb-0.5">{{ t('imageProcessingCategory') }}</div>
                        <div class="text-xs text-af-muted leading-relaxed">{{ t('imageMattingDesc') }}</div>
                      </div>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-1.5">
                      <span class="px-2 py-0.5 rounded-full text-[11px] bg-af-accent2/10 text-af-accent2">{{ t('cropGrid') }}</span>
                      <span class="px-2 py-0.5 rounded-full text-[11px] bg-af-accent2/10 text-af-accent2">{{ t('mattingApply') }}</span>
                    </div>
                  </div>

                  <!-- 像素工坊 -->
                  <div class="bg-af-surface border border-af-rule rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-af-accent hover:shadow-md hover:-translate-y-0.5 group" @click="goSub('pixel-studio','draw')">
                    <div class="flex items-start gap-3.5">
                      <div class="w-11 h-11 rounded-xl bg-af-accent/15 text-af-accent flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                      </div>
                      <div class="min-w-0">
                        <div class="text-[15px] font-semibold mb-0.5">{{ t('pixelStudioCategory') }}</div>
                        <div class="text-xs text-af-muted leading-relaxed">{{ t('pixelDrawDesc') }}</div>
                      </div>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-1.5">
                      <span class="px-2 py-0.5 rounded-full text-[11px] bg-af-accent-soft text-af-accent">{{ t('pixelDraw') }}</span>
                      <span class="px-2 py-0.5 rounded-full text-[11px] bg-af-accent-soft text-af-accent">{{ t('pixelProcess') }}</span>
                      <span class="px-2 py-0.5 rounded-full text-[11px] bg-af-accent-soft text-af-accent">{{ t('pixelAction') }}</span>
                    </div>
                  </div>

                  <!-- 地图编辑器 -->
                  <div class="bg-af-surface border border-af-rule rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-af-accent2 hover:shadow-md hover:-translate-y-0.5 group" @click="goSub('map-editor','tilemap')">
                    <div class="flex items-start gap-3.5">
                      <div class="w-11 h-11 rounded-xl bg-af-accent2/15 text-af-accent2 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                      </div>
                      <div class="min-w-0">
                        <div class="text-[15px] font-semibold mb-0.5">{{ t('mapEditorCategory') }}</div>
                        <div class="text-xs text-af-muted leading-relaxed">{{ t('tileDualGridDesc') }}</div>
                      </div>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-1.5">
                      <span class="px-2 py-0.5 rounded-full text-[11px] bg-af-accent2/10 text-af-accent2">{{ t('tileDualGrid') }}</span>
                      <span class="px-2 py-0.5 rounded-full text-[11px] bg-af-accent2/10 text-af-accent2">{{ t('topdownPreview') }}</span>
                    </div>
                  </div>

                  <!-- 资源库 -->
                  <div class="bg-af-surface border border-af-rule rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-af-accent hover:shadow-md hover:-translate-y-0.5 group" @click="navigate('resource-library')">
                    <div class="flex items-start gap-3.5">
                      <div class="w-11 h-11 rounded-xl bg-af-accent/15 text-af-accent flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                      </div>
                      <div class="min-w-0">
                        <div class="text-[15px] font-semibold mb-0.5">{{ t('resourceLibrary') }}</div>
                        <div class="text-xs text-af-muted leading-relaxed">{{ t('resourceLibraryDesc') }}</div>
                      </div>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-1.5">
                      <span class="px-2 py-0.5 rounded-full text-[11px] bg-af-accent-soft text-af-accent">{{ t('importFiles') }}</span>
                      <span class="px-2 py-0.5 rounded-full text-[11px] bg-af-accent-soft text-af-accent">{{ t('exportAll') }}</span>
                    </div>
                  </div>

                </div>

                <!-- 最近资源预览条 -->
                <div v-if="recentAssets.length" class="mt-5">
                  <div class="flex items-center justify-between mb-2.5">
                    <div class="text-[13px] font-semibold">{{ t('recentResources') }}</div>
                    <button class="text-xs text-af-accent hover:underline" @click="navigate('resource-library')">{{ t('viewAll') }}</button>
                  </div>
                  <div class="flex gap-2 overflow-x-auto pb-1">
                    <div v-for="a in recentAssets" :key="a.id" class="shrink-0 w-20 cursor-pointer group" @click="navigate('resource-library')">
                      <div class="w-20 h-20 rounded-lg border border-af-rule overflow-hidden bg-af-bg transition-all group-hover:border-af-accent group-hover:shadow-sm">
                        <img :src="a.thumb" class="w-full h-full object-cover" />
                      </div>
                      <div class="text-[10px] text-af-muted mt-1 truncate px-0.5">{{ a.name }}</div>
                    </div>
                  </div>
                </div>

              </div>

            </section>'''

    assert old_home in text, "Home block not found"
    text = text.replace(old_home, new_home)

    # ========== Section D: Module headers ==========
    # Sequence Frame
    old_seq_header = '''            <section v-show="currentScreen === 'sequence-frame'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0"><div><h1 class="text-[22px] font-bold tracking-tight">{{ t('seqWorkshop') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('seqWorkshopDesc') }}</p></div></div>'''
    new_seq_header = '''            <section v-show="currentScreen === 'sequence-frame'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0">
                <div><h1 class="text-[22px] font-bold tracking-tight">{{ t('seqWorkshop') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('seqWorkshopDesc') }}</p></div>
                <div class="flex items-center gap-2">
                  <button class="btn-secondary btn-sm" @click="seqTab = 'video'">{{ t('videoToFrames') }}</button>
                  <button class="btn-primary btn-sm" @click="seqTab = 'sprite'">{{ t('spriteSheet') }}</button>
                </div>
              </div>'''
    assert old_seq_header in text, "Sequence header not found"
    text = text.replace(old_seq_header, new_seq_header)

    # Pixel Studio
    old_pixel_header = '''            <section v-show="currentScreen === 'pixel-studio'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0"><div><h1 class="text-[22px] font-bold tracking-tight">{{ t('pixelWorkshop') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('pixelWorkshopDesc') }}</p></div></div>'''
    new_pixel_header = '''            <section v-show="currentScreen === 'pixel-studio'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0">
                <div><h1 class="text-[22px] font-bold tracking-tight">{{ t('pixelWorkshop') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('pixelWorkshopDesc') }}</p></div>
                <div class="flex items-center gap-2">
                  <button class="btn-secondary btn-sm" @click="pixelTab = 'draw'">{{ t('pixelDraw') }}</button>
                  <button class="btn-primary btn-sm" @click="pixelTab = 'action'">{{ t('pixelAction') }}</button>
                </div>
              </div>'''
    assert old_pixel_header in text, "Pixel header not found"
    text = text.replace(old_pixel_header, new_pixel_header)

    # Map Editor
    old_map_header = '''            <section v-show="currentScreen === 'map-editor'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0"><div><h1 class="text-[22px] font-bold tracking-tight">{{ t('mapEditor') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('mapEditorDesc') }}</p></div></div>'''
    new_map_header = '''            <section v-show="currentScreen === 'map-editor'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0">
                <div><h1 class="text-[22px] font-bold tracking-tight">{{ t('mapEditor') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('mapEditorDesc') }}</p></div>
                <div class="flex items-center gap-2">
                  <button class="btn-secondary btn-sm" @click="mapTab = 'tilemap'">{{ t('tileDualGrid') }}</button>
                  <button class="btn-primary btn-sm" @click="mapTab = 'preview'">{{ t('topdownPreview') }}</button>
                </div>
              </div>'''
    assert old_map_header in text, "Map header not found"
    text = text.replace(old_map_header, new_map_header)

    # Resource Library (already has actions, just normalize style if needed)
    old_res_header = '''            <section v-show="currentScreen === 'resource-library'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0">

                <div><h1 class="text-[22px] font-bold tracking-tight">{{ t('resourceLibrary') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('resourceLibraryDesc2') }}</p></div>

                <div class="flex gap-2"><button class="btn-secondary" @click="exportAssets">{{ t('exportAll') }}</button><button class="btn-primary" @click="triggerAssetImport">{{ t('importFiles') }}</button><input ref="assetImportInput" type="file" accept="image/*,video/*,image/gif" multiple class="hidden" @change="handleAssetImport" /></div>

              </div>'''
    new_res_header = '''            <section v-show="currentScreen === 'resource-library'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0">
                <div><h1 class="text-[22px] font-bold tracking-tight">{{ t('resourceLibrary') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('resourceLibraryDesc2') }}</p></div>
                <div class="flex items-center gap-2"><button class="btn-secondary" @click="exportAssets">{{ t('exportAll') }}</button><button class="btn-primary" @click="triggerAssetImport">{{ t('importFiles') }}</button><input ref="assetImportInput" type="file" accept="image/*,video/*,image/gif" multiple class="hidden" @change="handleAssetImport" /></div>
              </div>'''
    assert old_res_header in text, "Resource header not found"
    text = text.replace(old_res_header, new_res_header)

    # ========== Section E: UploadZone hover effect ==========
    old_uploadzone_class = "      class: ['border-2 border-dashed border-af-rule rounded-lg bg-af-surface text-af-muted text-center cursor-pointer transition-all hover:border-af-accent hover:bg-af-accent-soft hover:text-af-ink relative flex flex-col items-center justify-center p-6', drag.value ? 'border-af-accent bg-af-accent-soft text-af-ink' : '', props.class],"
    new_uploadzone_class = "      class: ['border-2 border-dashed border-af-rule rounded-lg bg-af-surface text-af-muted text-center cursor-pointer transition-all duration-200 hover:border-af-accent hover:bg-af-accent-soft hover:text-af-ink hover:shadow-md hover:-translate-y-0.5 relative flex flex-col items-center justify-center p-6', drag.value ? 'border-af-accent bg-af-accent-soft text-af-ink shadow-md' : '', props.class],"
    assert old_uploadzone_class in text, "UploadZone class not found"
    text = text.replace(old_uploadzone_class, new_uploadzone_class)

    # ========== Section F: SidebarItem active state ==========
    old_sidebar_item_class = "      class: 'w-full text-left px-2.5 py-1.5 rounded-md text-[13px] transition-colors ' + (props.active ? 'text-af-accent bg-af-accent-soft' : 'text-af-muted hover:text-af-ink hover:bg-af-surface-hover'),"
    new_sidebar_item_class = "      class: 'w-full text-left px-2.5 py-1.5 rounded-md text-[13px] transition-all ' + (props.active ? 'text-af-accent bg-af-accent-soft font-medium shadow-sm' : 'text-af-muted hover:text-af-ink hover:bg-af-surface-hover'),"
    assert old_sidebar_item_class in text, "SidebarItem class not found"
    text = text.replace(old_sidebar_item_class, new_sidebar_item_class)

    # ========== Translations ==========
    # Add new keys after searchPlaceholder
    old_dict_start = '''const langDict: Record<string, Record<string, string>> = {

  searchPlaceholder: { zh: '搜索功能、资源或项目...', en: 'Search features, resources or projects...', ja: '機能、リソース、プロジェクトを検索...', ko: '기능, 리소스 또는 프로젝트 검색...' },'''
    new_dict_start = '''const langDict: Record<string, Record<string, string>> = {

  searchPlaceholder: { zh: '搜索功能、资源或项目...', en: 'Search features, resources or projects...', ja: '機能、リソース、プロジェクトを検索...', ko: '기능, 리소스 또는 프로젝트 검색...' },

  workspace: { zh: '工作台', en: 'Workspace', ja: 'ワークスペース', ko: '워크스페이스' },

  sectionCreate: { zh: 'CREATE · 创作', en: 'CREATE', ja: 'CREATE · 作成', ko: 'CREATE · 창작' },

  sectionProcess: { zh: 'PROCESS · 处理', en: 'PROCESS', ja: 'PROCESS · 処理', ko: 'PROCESS · 처리' },

  sectionAssets: { zh: 'ASSETS · 资源', en: 'ASSETS', ja: 'ASSETS · アセット', ko: 'ASSETS ·  자산' },

  homeHeroTitle: { zh: '欢迎回到 ArtForgeAI', en: 'Welcome back to ArtForgeAI', ja: 'ArtForgeAI へようこそ', ko: 'ArtForgeAI에 오신 것을 환영합니다' },

  homeHeroDesc: { zh: '纯前端独立游戏美术一站式解决方案。从 AI 概念图到序列帧、像素画与瓦片地图，所有工具尽在掌控。', en: 'All-in-one frontend game art solution. From AI concept art to frames, pixel art and tile maps.', ja: 'フロントエンドゲームアート統合ソリューション。AIコンセプトアートからフレーム、ピクセルアート、タイルマップまで。', ko: '프론트엔드 게임 아트 통합 솔루션. AI 컨셉 아트부터 프레임, 픽셀 아트 및 타일 맵까지.' },

  statsResources: { zh: '资源数', en: 'Resources', ja: 'リソース', ko: '리소스' },

  statsGenerations: { zh: '近期生成', en: 'Generations', ja: '生成数', ko: '생성' },

  aiGenerationCategory: { zh: 'AI 生成', en: 'AI Generation', ja: 'AI 生成', ko: 'AI 생성' },

  sequenceFramesCategory: { zh: '序列帧', en: 'Sequence Frames', ja: 'シーケンスフレーム', ko: '시퀀스 프레임' },

  imageProcessingCategory: { zh: '图像处理', en: 'Image Processing', ja: '画像処理', ko: '이미지 처리' },

  pixelStudioCategory: { zh: '像素工坊', en: 'Pixel Studio', ja: 'ピクセル工房', ko: '픽셀 스튜디오' },

  mapEditorCategory: { zh: '地图编辑', en: 'Map Editor', ja: 'マップエディタ', ko: '맵 에디터' },

  recentResources: { zh: '最近资源', en: 'Recent Resources', ja: '最近のリソース', ko: '최근 리소스' },

  viewAll: { zh: '查看全部', en: 'View All', ja: 'すべて表示', ko: '모두 보기' },'''
    assert old_dict_start in text, "langDict start not found"
    text = text.replace(old_dict_start, new_dict_start)

    # ========== State: currentScreenTitle computed, recentAssets computed ==========
    # Insert after globalSearch/status refs
    old_nav_state = '''const currentScreen = ref('home')

const sidebarCollapsed = ref(false)

const globalSearch = ref('')

const statusText = ref('就绪')

const statusExtra = ref('')'''
    new_nav_state = '''const currentScreen = ref('home')

const sidebarCollapsed = ref(false)

const globalSearch = ref('')

// 当前页面标题：用于顶部面包屑展示
const currentScreenTitle = computed(() => {
  const titles: Record<string, string> = {
    home: t('home'),
    'ai-concept': t('aiWorkshop'),
    'sequence-frame': t('seqWorkshop'),
    'pixel-studio': t('pixelWorkshop'),
    'map-editor': t('mapEditor'),
    'resource-library': t('resourceLibrary'),
  }
  return titles[currentScreen.value] || currentScreen.value
})

// 最近资源预览：按创建时间倒序取前 6 个
const recentAssets = computed(() => {
  return [...assets.value].sort((a, b) => b.created - a.created).slice(0, 6)
})

const statusText = ref('就绪')

const statusExtra = ref('')'''
    assert old_nav_state in text, "Nav state block not found"
    text = text.replace(old_nav_state, new_nav_state)

    FILE.write_text(text, encoding="utf-8")
    print("WorkspaceView.vue redesign applied successfully.")

if __name__ == '__main__':
    main()
