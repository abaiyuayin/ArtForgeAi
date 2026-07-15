<template>

  <div class="flex flex-col h-screen overflow-hidden text-sm text-af-ink bg-af-bg font-sans">

    <!-- Header -->

    <!-- 顶部导航栏：左侧显示品牌与当前页面标题，中间放置外部链接，右侧放置语言/主题/API/资源库入口 -->
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

      <!-- 导航栏中心：外部链接 -->
      <div class="hidden md:flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
        <a href="https://github.com/abaiyuayin/ArtForgeAi" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-[13px] text-af-muted hover:text-af-ink transition-colors">
          <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23a11.49 11.49 0 0 1 3-.405c1.02 0 2.04.135 3 .405 2.28-1.56 3.285-1.23 3.285-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>
          <span>GitHub</span>
        </a>
        <a href="https://space.bilibili.com/382838394" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-[13px] text-af-muted hover:text-af-ink transition-colors">
          <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.659.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906l-1.174 1.12zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893V9.907c-.017-.764-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773H5.333zM8 11.107c.373 0 .68.124.92.373.25.249.373.551.373.907v4c0 .355-.124.657-.373.906-.24.249-.547.373-.92.373s-.68-.124-.92-.373c-.25-.249-.373-.551-.373-.906v-4c0-.356.124-.659.373-.907.24-.249.547-.373.92-.373zm8 0c.373 0 .68.124.92.373.25.249.373.551.373.907v4c0 .355-.124.657-.373.906-.24.249-.547.373-.92.373s-.68-.124-.92-.373c-.25-.249-.373-.551-.373-.906v-4c0-.356.124-.659.373-.907.24-.249.547-.373.92-.373z"/></svg>
          <span>Bilibili</span>
        </a>
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

    </header>



    <div class="flex flex-1 overflow-hidden">

      <!-- Sidebar -->

      <!-- 侧边栏：按 CREATE / PROCESS / ASSETS 分组展示功能入口 -->
      <aside class="shrink-0 flex flex-col overflow-hidden border-r border-af-rule bg-af-surface transition-[width] duration-300" :class="sidebarCollapsed ? 'w-14' : 'w-[230px]'">

        <div class="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2.5">

          <div class="mb-1">

            <button class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all" :class="currentScreen === 'home' ? 'text-af-accent bg-af-accent-soft shadow-sm' : 'text-af-muted hover:text-af-ink hover:bg-af-surface-hover'" @click="navigate('home')">

              <svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>

              <span class="whitespace-nowrap overflow-hidden transition-all" :class="sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'">{{ t('home') }}</span>

            </button>

          </div>

          <!-- CREATE 分组：AI 生成（无可见模块时隐藏标题） -->
          <div v-if="!sidebarCollapsed && aiTabs.length" class="px-2.5 pt-3 pb-1 text-[10px] font-bold tracking-wider text-af-muted/70 uppercase">{{ t('sectionCreate') }}</div>

          <!-- AI 工坊下所有模块暂时隐藏，整个分组也隐藏 -->
          <SidebarGroup v-if="aiTabs.length" v-model:open="groups.ai" :title="t('aiWorkshop')" :collapsed="sidebarCollapsed">

            <!-- 创建素材模块暂时隐藏 -->
            <SidebarItem v-if="false" :label="t('txt2img')" :active="currentScreen === 'ai-concept' && aiTab === 'txt2img'" @click="goSub('ai-concept','txt2img')" />

            <SidebarItem v-if="false" :label="t('styleTransfer')" :active="currentScreen === 'ai-concept' && aiTab === 'style'" @click="goSub('ai-concept','style')" />

            <SidebarItem v-if="false" :label="t('charSimplify')" :active="currentScreen === 'ai-concept' && aiTab === 'simplify'" @click="goSub('ai-concept','simplify')" />

            <SidebarItem v-if="false" :label="t('poseGen')" :active="currentScreen === 'ai-concept' && aiTab === 'pose'" @click="goSub('ai-concept','pose')" />

          </SidebarGroup>

          <!-- PROCESS 分组：图片/视频处理、序列帧、地图 -->
          <div v-if="!sidebarCollapsed" class="px-2.5 pt-3 pb-1 text-[10px] font-bold tracking-wider text-af-muted/70 uppercase">{{ t('sectionProcess') }}</div>

          <SidebarGroup v-model:open="groups.media" :title="t('mediaProcess')" :collapsed="sidebarCollapsed">

            <SidebarItem :label="t('imageProcessing')" :active="currentScreen === 'media-process' && mediaTab === 'image'" @click="goSub('media-process','image')" />

            <!-- <SidebarItem :label="t('videoProcessing')" :active="currentScreen === 'media-process' && mediaTab === 'video'" @click="goSub('media-process','video')" /> -->

          </SidebarGroup>

          <SidebarGroup v-model:open="groups.frame" :title="t('seqWorkshop')" :collapsed="sidebarCollapsed">

            <SidebarItem :label="t('videoToFrames')" :active="currentScreen === 'sequence-frame' && seqTab === 'video'" @click="goSub('sequence-frame','video')" />

            <SidebarItem :label="t('gifToFrames')" :active="currentScreen === 'sequence-frame' && seqTab === 'gif'" @click="goSub('sequence-frame','gif')" />

            <SidebarItem :label="t('spriteSheet')" :active="currentScreen === 'sequence-frame' && seqTab === 'sprite'" @click="goSub('sequence-frame','sprite')" />

          </SidebarGroup>

          <!-- 精灵图归一化独立页面入口 -->
          <SidebarGroup v-model:open="groups.normalizer" :title="t('spriteNormalizer')" :collapsed="sidebarCollapsed">

            <SidebarItem :label="t('spriteNormalizerPage')" :active="currentScreen === 'sprite-normalizer'" @click="navigate('sprite-normalizer')" />

          </SidebarGroup>




          <!-- ASSETS 分组：资源库 -->
          <div v-if="!sidebarCollapsed" class="px-2.5 pt-3 pb-1 text-[10px] font-bold tracking-wider text-af-muted/70 uppercase">{{ t('sectionAssets') }}</div>

          <div class="mb-1">

            <button class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all" :class="currentScreen === 'resource-library' ? 'text-af-accent bg-af-accent-soft shadow-sm' : 'text-af-muted hover:text-af-ink hover:bg-af-surface-hover'" @click="navigate('resource-library')">

              <svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>

              <span class="whitespace-nowrap overflow-hidden transition-all" :class="sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'">{{ t('resourceLibrary') }}</span>

            </button>

          </div>

        </div>

        <div class="border-t border-af-rule px-2.5 py-2 flex items-center justify-between">

          <span v-if="!sidebarCollapsed" class="text-[11px] text-af-muted px-2.5">v0.5</span>

          <button class="p-1 rounded text-af-muted hover:text-af-ink hover:bg-af-surface-hover transition-colors group ml-auto" @click="sidebarCollapsed = !sidebarCollapsed">

            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>

          </button>

        </div>

      </aside>



      <!-- 主工作区：根据 currentScreen 显示不同功能模块 -->

      <main class="flex flex-col flex-1 overflow-hidden min-w-0">

        <div class="flex flex-1 min-h-0 overflow-hidden">

          <div class="flex flex-col flex-1 overflow-hidden min-w-0">



            <!-- 首页：仪表盘式概览，按功能分类展示并显示关键统计 -->

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
                        <div class="text-lg font-bold text-af-accent">{{ assetsStore.assets.length }}</div>
                        <div class="text-[11px] text-af-muted">{{ t('statsResources') }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 功能分类卡片 -->
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

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
                  <div class="bg-af-surface border border-af-rule rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-af-accent hover:shadow-md hover:-translate-y-0.5 group" @click="goSub('media-process','image')">
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

            </section>



            <!-- AI CONCEPT：当前未开放具体模块，仅保留占位 -->

            <section v-show="currentScreen === 'ai-concept'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex-1 flex items-center justify-center text-af-muted px-5">

                {{ t('aiWorkshopDesc') }}

              </div>

            </section>



            <!-- 媒体处理：图片处理与视频处理独立分类 -->

            <section v-show="currentScreen === 'media-process'" class="flex flex-col flex-1 overflow-auto">
              <ImageProcessingPage @status="setStatus" @toast="showToast" @pick-asset="onPickAsset" />
            </section>



            <!-- SEQUENCE FRAME -->

            <section v-show="currentScreen === 'sequence-frame'" class="flex flex-col flex-1 overflow-auto">

              <!-- 序列帧工坊子页面快捷切换标签 -->

              <div class="flex items-center gap-2 px-5 pt-3.5 pb-2.5 shrink-0 border-b border-af-rule">

                <button

                  class="px-3 py-1.5 rounded-md text-sm transition-colors"

                  :class="seqTab === 'video' ? 'bg-af-accent text-af-ink' : 'text-af-muted hover:text-af-ink hover:bg-af-surface-hover'"

                  @click="goSub('sequence-frame', 'video')"

                >{{ t('videoToFrames') }}</button>

                <button

                  class="px-3 py-1.5 rounded-md text-sm transition-colors"

                  :class="seqTab === 'gif' ? 'bg-af-accent text-af-ink' : 'text-af-muted hover:text-af-ink hover:bg-af-surface-hover'"

                  @click="goSub('sequence-frame', 'gif')"

                >{{ t('gifToFrames') }}</button>

                <button

                  class="px-3 py-1.5 rounded-md text-sm transition-colors"

                  :class="seqTab === 'sprite' ? 'bg-af-accent text-af-ink' : 'text-af-muted hover:text-af-ink hover:bg-af-surface-hover'"

                  @click="goSub('sequence-frame', 'sprite')"

                >{{ t('spriteSheet') }}</button>

              </div>

              <!-- 使用 v-if + KeepAlive 替代 v-show，确保同一时刻只挂载一个页面组件，避免隐藏页面内容泄漏 -->
              <KeepAlive>
                <VideoToFramesPage v-if="seqTab === 'video'" @status="setStatus" @toast="showToast" @loading="setLoading" @pick-asset="onPickAsset" />
                <GifToFramesPage v-else-if="seqTab === 'gif'" @status="setStatus" @toast="showToast" @loading="setLoading" @pick-asset="onPickAsset" />
                <ImageToFramesPage v-else-if="seqTab === 'sprite'" @status="setStatus" @pick-asset="onPickAsset" />
              </KeepAlive>
            </section>



            <!-- 精灵图归一化页面：独立处理已有精灵图，跨角色统一画布尺寸 -->
            <section v-show="currentScreen === 'sprite-normalizer'" class="flex flex-col flex-1 overflow-auto">
              <SpriteNormalizerPage @status="setStatus" @toast="showToast" @loading="setLoading" />
            </section>



            <!-- 资源库页面：使用拆分后的独立组件 -->

            <ResourceLibraryPage v-show="currentScreen === 'resource-library'" @status="setStatus" @toast="showToast" />



          </div>

        </div>

      </main>

    </div>



    <!-- 底部状态栏：显示当前状态与附加信息 -->

    <div class="h-7 flex items-center justify-between px-3.5 text-[11px] text-af-muted border-t border-af-rule bg-af-surface shrink-0">

      <div class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-af-accent"></span><span>{{ statusText }}</span></div>

      <div>{{ statusExtra }}</div>

    </div>



    <!-- 加载中弹窗：阻断式提示长时间操作进度 -->

    <Teleport to="body">

      <div v-if="loadingOpen" class="fixed inset-0 bg-black/75 z-[110] flex items-center justify-center">

        <div class="bg-af-surface border border-af-rule rounded-lg p-6 flex flex-col items-center gap-3 min-w-[200px]">

          <div class="w-10 h-10 border-4 border-af-rule border-t-af-accent rounded-full animate-spin"></div>

          <span class="text-sm text-af-ink">{{ loadingText }}</span>

        </div>

      </div>

    </Teleport>



    <!-- API 设置右侧面板：配置模型、Endpoint、模型名、API Key 与额外参数，并支持保存为方案 -->

    <Teleport to="body">

      <div v-if="apiOpen" class="fixed inset-0 bg-black/50 z-[100]" @click.self="apiOpen = false">

        <div class="absolute right-0 top-0 h-full w-[420px] max-w-[90vw] bg-af-surface border-l border-af-rule shadow-xl flex flex-col overflow-hidden">

          <div class="flex items-center justify-between px-5 py-3.5 border-b border-af-rule shrink-0">

            <div class="text-base font-bold">{{ t('apiConfig') }}</div>

            <button class="w-11 h-11 rounded-md text-af-muted hover:text-af-ink hover:bg-af-surface-hover text-2xl flex items-center justify-center" @click="apiOpen = false">&times;</button>

          </div>

          <div class="flex-1 overflow-auto p-5 space-y-4">

            <!-- 已保存方案选择 -->

            <div class="form-group">

              <label class="form-label">{{ t('selectApiProfile') }}</label>

              <select v-model="apiProfileId" class="form-select" @change="selectApiProfile(apiProfileId)">

                <option value="">{{ t('customProfile') }}</option>

                <option v-for="p in apiProfiles" :key="p.id" :value="p.id">{{ p.name }}</option>

              </select>

            </div>

            <!-- 方案名称 -->

            <div class="form-group">

              <label class="form-label">{{ t('profileName') }} <span class="text-red-500">*</span></label>

              <input v-model="apiProfileName" type="text" :placeholder="t('profileNamePlaceholder')" class="form-input" :class="{ 'border-red-500': apiErrors.name }" @input="apiErrors.name = false" />

            </div>

            <!-- 原有配置项 -->

            <div class="form-group"><label class="form-label">{{ t('selectModel') }}</label><select v-model="apiProvider" class="form-select"><option value="tongyi">{{ t('tongyi') }}</option><option value="wenxin">{{ t('wenxin') }}</option><option value="doubao">{{ t('doubao') }}</option><option value="zhipu">{{ t('zhipu') }}</option><option value="kling">{{ t('kling') }}</option><option value="sd">Stable Diffusion</option><option value="openai">OpenAI / DALL-E</option><option value="gemini">Gemini</option><option value="custom">{{ t('customEndpoint') }}</option></select></div>

            <div class="form-group"><label class="form-label">{{ t('apiEndpoint') }} <span class="text-red-500">*</span></label><input v-model="apiEndpoint" type="text" placeholder="https://..." class="form-input" :class="{ 'border-red-500': apiErrors.url }" @input="apiErrors.url = false" /></div>

            <div class="form-group">

              <label class="form-label flex items-center justify-between">

                <span>{{ t('modelName') }} <span class="text-red-500">*</span></span>

                <button type="button" class="text-xs text-af-accent hover:underline disabled:opacity-50" :disabled="apiFetchingModels" @click="fetchApiModels">{{ apiFetchingModels ? '...' : t('fetchModels') }}</button>

              </label>

              <input v-model="apiModel" type="text" :placeholder="t('modelNamePlaceholder')" class="form-input" :class="{ 'border-red-500': apiErrors.model }" @input="apiErrors.model = false" @dblclick="($event.target as HTMLInputElement)?.select()" />

              <select v-if="apiAvailableModels.length" v-model="apiModel" class="form-select mt-2">

                <option value="">{{ t('modelList') }}</option>

                <option v-for="m in apiAvailableModels" :key="m" :value="m">{{ m }}</option>

              </select>

            </div>

            <div class="form-group"><label class="form-label">API Key <span class="text-red-500">*</span></label><input v-model="apiKey" type="password" placeholder="sk-..." class="form-input" :class="{ 'border-red-500': apiErrors.key }" @input="apiErrors.key = false" /></div>

            <div class="form-group"><label class="form-label">{{ t('extraParams') }}</label><textarea v-model="apiExtra" rows="2" placeholder='{"size":"1024x1024"}' class="form-textarea"></textarea></div>

            <div class="flex justify-end gap-2 pt-2">

              <button class="btn-secondary" @click="apiOpen = false">{{ t('cancel') }}</button>

              <button v-if="apiProfileId" class="btn-danger" @click="deleteApiProfile(apiProfileId)">{{ t('delete') }}</button>

              <button class="btn-primary" @click="saveApiProfile">{{ t('saveProfile') }}</button>

            </div>

          </div>

        </div>

      </div>

    </Teleport>



    <!-- 资源选择器：使用拆分后的独立组件 -->

    <AssetPicker />



    <!-- 通用弹框 Dialog：网站同风格，居中显示，需手动关闭 -->

    <Teleport to="body">

      <div v-if="dialogOpen" class="fixed inset-0 bg-black/75 z-[200] flex items-center justify-center" @click.self="dialogOpen = false">

        <div class="bg-af-surface border border-af-rule rounded-lg p-5 w-[400px] max-w-[92vw]">

          <div class="flex items-center justify-between mb-3.5">

            <div class="text-base font-bold">{{ t('notice') }}</div>

            <button class="w-9 h-9 rounded-md text-af-muted hover:text-af-ink hover:bg-af-surface-hover text-2xl flex items-center justify-center" @click="dialogOpen = false">&times;</button>

          </div>

          <div class="text-[13px] leading-relaxed text-af-muted mb-4">{{ dialogText }}</div>

          <div class="flex justify-end"><button class="btn-primary" @click="dialogOpen = false">{{ t('ok') }}</button></div>

        </div>

      </div>

    </Teleport>

    <!-- 确认弹框 ConfirmDialog：网站同风格，含确认/取消按钮 -->

    <Teleport to="body">

      <div v-if="confirmDialogOpen" class="fixed inset-0 bg-black/75 z-[210] flex items-center justify-center" @click.self="onConfirmDialogCancel">

        <div class="bg-af-surface border border-af-rule rounded-lg p-5 w-[420px] max-w-[92vw]">

          <div class="flex items-center justify-between mb-3.5">

            <div class="text-base font-bold">{{ confirmDialogTitle }}</div>

            <button class="w-9 h-9 rounded-md text-af-muted hover:text-af-ink hover:bg-af-surface-hover text-2xl flex items-center justify-center" @click="onConfirmDialogCancel">&times;</button>

          </div>

          <div class="text-[13px] leading-relaxed text-af-muted mb-5">{{ confirmDialogText }}</div>

          <div class="flex justify-end gap-2">

            <button class="btn-secondary" @click="onConfirmDialogCancel">{{ confirmDialogCancelText }}</button>

            <button class="btn-primary" @click="onConfirmDialogOk">{{ confirmDialogOkText }}</button>

          </div>

        </div>

      </div>

    </Teleport>

    <!-- 全局提示框 Toast：网站同风格，右下角弹出，自动消失 -->

    <Teleport to="body">

      <Transition name="toast-slide">

        <div v-if="toastOpen" class="fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border min-w-[260px] max-w-[400px]" :class="{

          'bg-af-surface border-af-accent text-af-ink': toastType === 'success',

          'bg-af-surface border-af-rule text-af-ink': toastType === 'info',

          'bg-af-surface border-yellow-500/50 text-af-ink': toastType === 'warning',

          'bg-af-surface border-red-500/50 text-af-ink': toastType === 'error'

        }">

          <span class="w-2 h-2 rounded-full shrink-0" :class="{

            'bg-af-accent': toastType === 'success',

            'bg-af-muted': toastType === 'info',

            'bg-yellow-500': toastType === 'warning',

            'bg-red-500': toastType === 'error'

          }"></span>

          <span class="text-sm flex-1">{{ toastText }}</span>

          <button class="text-af-muted hover:text-af-ink text-lg leading-none" @click="toastOpen = false">&times;</button>

        </div>

      </Transition>

    </Teleport>

  </div>

</template>

<!--TEMPLATE_END-->



<script lang="ts">

// 导入渲染函数与响应式 API，用于定义 JSX/渲染函数式子组件

import { defineComponent, h } from 'vue'



// 可折叠侧边栏分组组件：展开/收起子菜单项

export const SidebarGroup = defineComponent({

  props: { title: { type: String, required: true }, open: { type: Boolean, required: true }, collapsed: { type: Boolean, default: false } },

  emits: ['update:open'],

  setup(props, { emit, slots }) {

    return () => h('div', { class: 'mb-1' }, [

      !props.collapsed && h('button', {

        class: 'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-semibold text-af-muted hover:text-af-ink hover:bg-af-surface-hover transition-colors',

        onClick: () => emit('update:open', !props.open)

      }, [

        h('svg', { class: 'w-3.5 h-3.5 shrink-0 transition-transform', style: { transform: props.open ? 'rotate(90deg)' : 'rotate(0deg)' }, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [h('polyline', { points: '9 18 15 12 9 6' })]),

        props.title

      ]),

      props.open && !props.collapsed && h('div', { class: 'mt-0.5' }, slots.default?.())

    ])

  }

})



export const SidebarItem = defineComponent({

  props: { label: { type: String, required: true }, active: { type: Boolean, default: false } },

  emits: ['click'],

  setup(props, { emit }) {

    return () => h('button', {

      class: 'w-full text-left px-2.5 py-1.5 rounded-md text-[13px] transition-all ' + (props.active ? 'text-af-accent bg-af-accent-soft font-medium shadow-sm' : 'text-af-muted hover:text-af-ink hover:bg-af-surface-hover'),

      onClick: () => emit('click')

    }, props.label)

  }

})
</script>



<script setup lang="ts">

import { ref, reactive, computed, onMounted, onUnmounted, provide } from 'vue'

import { RouterLink } from 'vue-router'

import { useThemeStore } from '../stores/theme'

import { useAssetsStore } from '../stores/assets'

import AssetPicker from './components/AssetPicker.vue'

import ImageProcessingPage from './page/ImageProcessingPage.vue'

import VideoToFramesPage from './page/VideoToFramesPage.vue'

import GifToFramesPage from './page/GifToFramesPage.vue'

import ImageToFramesPage from './page/ImageToFramesPage.vue'

import SpriteNormalizerPage from './page/sprite-normalizer/SpriteNormalizerPage.vue'

import ResourceLibraryPage from './page/ResourceLibraryPage.vue'

const assetsStore = useAssetsStore()

const themeStore = useThemeStore()



// ==================== LANGUAGE SYSTEM ====================

const lang = ref<'zh' | 'en' | 'ja' | 'ko'>('zh')

const langOptions = [

  { key: 'zh' as const, label: '中' },

  { key: 'en' as const, label: 'EN' },

  { key: 'ja' as const, label: '日本語' },

  { key: 'ko' as const, label: '한국어' },

]



const langDict: Record<string, Record<string, string>> = {

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

  viewAll: { zh: '查看全部', en: 'View All', ja: 'すべて表示', ko: '모두 보기' },

  apiSettings: { zh: 'API 设置', en: 'API Settings', ja: 'API設定', ko: 'API 설정' },

  resourceLibrary: { zh: '资源库', en: 'Resource Library', ja: 'リソースライブラリ', ko: '리소스 라이브러리' },

  home: { zh: '首页', en: 'Home', ja: 'ホーム', ko: '홈' },

  aiWorkshop: { zh: 'AI概念工坊', en: 'AI Concept Workshop', ja: 'AIコンセプト工房', ko: 'AI 컨셉 워크숍' },

  aiWorkshopDesc: { zh: '文本生成、风格迁移与角色概念工具', en: 'Text generation, style transfer & character concept tools', ja: 'テキスト生成、スタイル変換、キャラクターコンセプトツール', ko: '텍스트 생성, 스타일 전이 및 캐릭터 컨셉 도구' },

  txt2img: { zh: '创建素材', en: 'Create Material', ja: '素材を作成', ko: '소재 생성' },

  txt2imgDesc: { zh: '通过文本描述创建游戏概念美术素材', en: 'Create game concept art material from text', ja: 'テキストからゲームコンセプトアート素材を作成', ko: '텍스트로 게임 컨셉 아트 소재 생성' },

  txt2imgHelp: { zh: '输入描述游戏画面的提示词，选择风格、尺寸等，点击生成。结果可直接保存到资源库。AI 调用需先在右上角配置 API。', en: 'Enter prompt, select style and size, click generate. Results can be saved to library. Configure API key first.', ja: 'プロンプトを入力し、スタイルとサイズを選択して生成。結果はライブラリに保存可能。右上のAPI設定が必要です。', ko: '프롬프트를 입력하고 스타일과 크기를 선택한 후 생성하세요. 결과는 라이브러리에 저장할 수 있습니다. API 키를 먼저 설정하세요.' },

  styleTransfer: { zh: '画风迁移', en: 'Style Transfer', ja: 'スタイル変換', ko: '스타일 전이' },

  styleTransferDesc: { zh: '将图像转换为目标画风', en: 'Convert image to target style', ja: '画像をターゲットスタイルに変換', ko: '이미지를 대상 스타일로 변환' },

  charSimplify: { zh: '角色简化', en: 'Character Simplify', ja: 'キャラクター簡略化', ko: '캐릭터 단순화' },

  poseGen: { zh: '姿势生成', en: 'Pose Generation', ja: 'ポーズ生成', ko: '포즈 생성' },

  imageMatting: { zh: '图片处理', en: 'Image Processing', ja: '画像処理', ko: '이미지 처리' }, // 图片处理菜单

  imageCropTab: { zh: '图片裁剪', en: 'Image Crop', ja: '画像切り抜き', ko: '이미지 자르기' }, // 图片裁剪子模块标签

  imageMattingTab: { zh: '图片抠图', en: 'Image Matting', ja: '画像マット', ko: '이미지 매팅' }, // 图片抠图子模块标签

  imageMattingDesc: { zh: '网格化一键裁剪或手动框选裁剪图片', en: 'Grid one-click crop or manual selection crop', ja: 'グリッド一括切り抜きまたは手動選択切り抜き', ko: '그리드 원클릭 자르기 또는 수동 선택 자르기' }, // 抠图功能描述翻译

  cropMode: { zh: '裁剪模式', en: 'Crop Mode', ja: '切り抜きモード', ko: '자르기 모드' }, // 裁剪模式翻译

  cropSubMode: { zh: '裁剪方式', en: 'Crop Method', ja: '切り抜き方法', ko: '자르기 방식' }, // 裁剪方式翻译

  cropGrid: { zh: '网格化裁剪', en: 'Grid Crop', ja: 'グリッド切り抜き', ko: '그리드 자르기' }, // 网格裁剪翻译

  cropManual: { zh: '手动框选', en: 'Manual Crop', ja: '手動選択', ko: '수동 선택' }, // 手动裁剪翻译

  mattingSource: { zh: '抠图源图', en: 'Matting Source', ja: 'マット元画像', ko: '마팅 원본' }, // 抠图源图标签

  mattingResult: { zh: '抠图结果', en: 'Matting Result', ja: 'マット結果', ko: '마팅 결과' }, // 抠图结果标签

  mattingPickHint: { zh: 'ALT+点击取色并实时抠图；右键拖动平移；滚轮缩放', en: 'ALT+click to pick color; right-drag to pan; wheel to zoom', ja: 'ALT+クリックで色選択；右ドラッグで移動；ホイールでズーム', ko: 'ALT+클릭으로 색상 선택; 우클릭 드래그로 이동; 휠로 확대' }, // 抠图提示

  mattingClickHint: { zh: '点击左侧源图开始抠图', en: 'Click left source image to start matting', ja: '左のソース画像をクリックしてマット開始', ko: '왼쪽 원본 이미지를 클릭하여 마팅 시작' }, // 抠图空状态提示

  mattingApply: { zh: '应用抠图', en: 'Apply Matting', ja: 'マット適用', ko: '마팅 적용' }, // 应用抠图按钮

  gridSize: { zh: '网格大小', en: 'Grid Size', ja: 'グリッドサイズ', ko: '그리드 크기' }, // 网格大小翻译

  gridCols: { zh: '网格列数', en: 'Grid Columns', ja: 'グリッド列数', ko: '그리드 열 수' }, // 网格列数翻译

  gridShiftHint: { zh: '按住 Shift 点击可连续多选网格', en: 'Hold Shift to multi-select grid cells', ja: 'Shiftキーを押しながらクリックで連続選択', ko: 'Shift를 누른 상태로 클릭하여 연속 선택' }, // 网格多选提示

  cropApply: { zh: '应用裁剪', en: 'Apply Crop', ja: '切り抜き適用', ko: '자르기 적용' }, // 应用裁剪翻译

  cropDownload: { zh: '下载结果', en: 'Download Result', ja: '結果をダウンロード', ko: '결과 다운로드' }, // 下载结果翻译

  cropReset: { zh: '重置', en: 'Reset', ja: 'リセット', ko: '재설정' }, // 重置翻译

  selectCropArea: { zh: '点击网格格子选择裁剪区域 | SHIFT 连续多选', en: 'Click grid cell to select | SHIFT for multi-select', ja: 'グリッドセルをクリックして選択 | SHIFTで複数選択', ko: '그리드 셀 클릭 선택 | SHIFT 다중 선택' },

  originalImage: { zh: '原图', en: 'Original', ja: '元画像', ko: '원본 이미지' }, // 原图标签翻译

  cropResult: { zh: '裁剪结果', en: 'Crop Result', ja: '切り抜き結果', ko: '자르기 결과' }, // 裁剪结果标签翻译

  uploadCropImage: { zh: '上传需要裁剪的图片', en: 'Upload image to crop', ja: '切り抜きたい画像をアップロード', ko: '자를 이미지 업로드' }, // 上传提示翻译

  cropHelp: { zh: '网格模式下点击格子即可选中裁剪区域；手动模式下拖拽鼠标框选区域后点击应用裁剪。', en: 'In grid mode click a cell; in manual mode drag to select and apply.', ja: 'グリッドモードではセルをクリック、手動モードではドラッグして適用。', ko: '그리드 모드에서는 셀 클릭, 수동 모드에서는 드래그 후 적용.' }, // 帮助说明翻译

  cropDone: { zh: '裁剪完成', en: 'Crop done', ja: '切り抜き完了', ko: '자르기 완료' }, // 裁剪完成提示翻译

  mediaProcess: { zh: '媒体处理', en: 'Media Processing', ja: 'メディア処理', ko: '미디어 처리' },

  mediaProcessDesc: { zh: '图片处理与视频处理工具集合', en: 'Image & video processing tools', ja: '画像・動画処理ツール集', ko: '이미지 및 비디오 처리 도구 모음' },

  imageProcessing: { zh: '图片处理', en: 'Image Processing', ja: '画像処理', ko: '이미지 처리' },

  videoProcessing: { zh: '视频处理', en: 'Video Processing', ja: '動画処理', ko: '비디오 처리' },

  videoMatting: { zh: '视频抠图', en: 'Video Matting', ja: '動画マット', ko: '비디오 마팅' },

  videoCrop: { zh: '视频裁剪', en: 'Video Crop', ja: '動画クロップ', ko: '비디오 자르기' },

  videoToAudio: { zh: '视频转音频', en: 'Video to Audio', ja: '動画→音声', ko: '비디오→오디오' },

  videoToGif: { zh: '视频转 GIF', en: 'Video to GIF', ja: '動画→GIF', ko: '비디오→GIF' },

  videoProcessOutputFormat: { zh: '输出格式', en: 'Output Format', ja: '出力形式', ko: '출력 형식' },

  videoProcessMaxFramesHint: { zh: '最大处理 120 帧，超出将自动截断', en: 'Max 120 frames; excess will be truncated', ja: '最大120フレーム、超過分は切り捨て', ko: '최대 120프레임, 초과분은 잘림' },

  videoProcessAudioHint: { zh: '提取视频音轨并导出为 WAV 文件', en: 'Extract video audio track to WAV', ja: '動画の音声トラックをWAVで出力', ko: '비디오 오디오 트랙을 WAV로 추출' },

  videoProcessOptions: { zh: '处理选项', en: 'Processing Options', ja: '処理オプション', ko: '처리 옵션' },

  seqWorkshop: { zh: '序列帧工坊', en: 'Sequence Frame Workshop', ja: 'シーケンスフレーム工房', ko: '시퀀스 프레임 워크숍' },

  seqWorkshopDesc: { zh: '视频/GIF 提取帧、合成精灵图', en: 'Video/GIF frame extraction, sprite sheet compositing', ja: '動画/GIFからフレーム抽出、スプライトシート合成', ko: '비디오/GIF 프레임 추출, 스프라이트 시트 합성' },

  videoToFrames: { zh: '视频转序列帧', en: 'Video to Frames', ja: '動画→フレーム', ko: '비디오→프레임' },

  videoToFramesDesc: { zh: '从视频提取帧序列，裁剪、抠图、导出', en: 'Extract frames from video, crop, export', ja: '動画からフレームを抽出、クロップ、エクスポート', ko: '비디오에서 프레임 추출, 자르기, 내보내기' },

  gifToFrames: { zh: 'GIF转序列帧', en: 'GIF to Frames', ja: 'GIF→フレーム', ko: 'GIF→프레임' },

  gifToFramesDesc: { zh: '解码GIF为逐帧图像', en: 'Decode GIF into frames', ja: 'GIFをフレームごとにデコード', ko: 'GIF를 프레임별로 디코딩' },

  spriteSheet: { zh: '图片转序列帧', en: 'Image to Frames', ja: '画像→フレーム', ko: '이미지→프레임' },

  spriteSheetDesc: { zh: '上传图片序列，预览并导出精灵图或视频', en: 'Upload image sequence, preview and export sprite sheet or video', ja: '画像シーケンスをアップロード、プレビューとエクスポート', ko: '스프라이트 시트 편집 및 내보내기' },

  topdownPreview: { zh: '序列帧预览', en: 'Sequence Preview', ja: 'シーケンスプレビュー', ko: '시퀀스 미리보기' },

  pixelWorkshop: { zh: '像素工坊', en: 'Pixel Workshop', ja: 'ピクセル工房', ko: '픽셀 워크숍' },

  pixelWorkshopDesc: { zh: '像素绘画、精细处理与动作生成', en: 'Pixel drawing, processing & action generation', ja: 'ピクセル描画、処理、アクション生成', ko: '픽셀 드로잉, 처리 및 액션 생성' },

  pixelDraw: { zh: '像素绘画', en: 'Pixel Draw', ja: 'ピクセル描画', ko: '픽셀 드로잉' },

  pixelDrawDesc: { zh: '在线像素画编辑器', en: 'Online pixel art editor', ja: 'オンラインピクセルアートエディタ', ko: '온라인 픽셀 아트 에디터' },

  pixelProcess: { zh: '精细处理', en: 'Fine Process', ja: '精密処理', ko: '정밀 처리' },

  pixelProcessHelp: { zh: '调整尺寸、颜色数、描边等参数对像素图进行放大/缩小与风格化重绘。', en: 'Adjust size, colors, outline and other params to rescale or restyle pixel art.', ja: 'サイズ、色数、アウトラインなどを調整してピクセルアートを拡大/縮小・スタイル化します。', ko: '크기, 색상 수, 외곽선 등을 조정하여 픽셀 아트를 확대/축소하고 스타일화합니다.' },

  pixelAction: { zh: '像素动作生成', en: 'Pixel Action Gen', ja: 'ピクセルアクション生成', ko: '픽셀 액션 생성' },

  pixelActionDesc: { zh: '生成像素角色动画', en: 'Generate pixel character animation', ja: 'ピクセルキャラクターアニメーション生成', ko: '픽셀 캐릭터 애니메이션 생성' },

  tileDualGrid: { zh: '瓦片双网格', en: 'Tile Dual Grid', ja: 'タイルデュアルグリッド', ko: '타일 듀얼 그리드' },

  tileDualGridDesc: { zh: '双网格瓦片地图绘制', en: 'Dual grid tile map drawing', ja: 'デュアルグリッドタイルマップ描画', ko: '듀얼 그리드 타일 맵 그리기' },

  mapEditor: { zh: '像素工坊', en: 'Pixel Workshop', ja: 'ピクセル工房', ko: '픽셀 워크숍' },

  mapEditorDesc: { zh: '瓦片地图绘制与序列帧预览', en: 'Tile map drawing & sequence preview', ja: 'タイルマップ描画とシーケンスプレビュー', ko: '타일 맵 그리기 및 시퀀스 미리보기' },

  resourceLibraryDesc: { zh: '本地 IndexedDB 资源管理', en: 'Local IndexedDB resource management', ja: 'ローカルIndexedDBリソース管理', ko: '로컬 IndexedDB 리소스 관리' },

  resourceLibraryDesc2: { zh: '本地 IndexedDB 资源管理', en: 'Local IndexedDB resource management', ja: 'ローカルIndexedDBリソース管理', ko: '로컬 IndexedDB 리소스 관리' },

  allAssets: { zh: '全部资源', en: 'All Assets', ja: 'すべてのリソース', ko: '모든 리소스' },

  allImages: { zh: '图片', en: 'Images', ja: '画像', ko: '이미지' },

  allGifs: { zh: 'GIF', en: 'GIF', ja: 'GIF', ko: 'GIF' },

  allFrames: { zh: '序列帧', en: 'Frames', ja: 'フレーム', ko: '프레임' },

  allSprites: { zh: '精灵图', en: 'Sprites', ja: 'スプライト', ko: '스프라이트' },

  allMaps: { zh: '地图', en: 'Maps', ja: 'マップ', ko: '맵' },

  allOutputs: { zh: '导出结果', en: 'Outputs', ja: '出力', ko: '출력' },

  allVideos: { zh: '视频', en: 'Videos', ja: '動画', ko: '비디오' },

  assetsImported: { zh: '资源导入完成', en: 'Assets imported', ja: 'リソースのインポート完了', ko: '리소스 가져오기 완료' },

  workspaceTitle: { zh: 'ArtForgeAI 工作台', en: 'ArtForgeAI Workspace', ja: 'ArtForgeAI ワークスペース', ko: 'ArtForgeAI 워크스페이스' },

  workspaceDesc: { zh: '纯前端独立游戏美术一站式解决方案 · AI功能需配置自有API密钥', en: 'All-in-one frontend game art solution · AI features require own API key', ja: 'フロントエンドゲームアート統合ソリューション · AI機能にはAPIキーが必要', ko: '프론트엔드 게임 아트 통합 솔루션 · AI 기능은 API 키 필요' },

  recentlyUsed: { zh: '最近使用', en: 'Recently Used', ja: '最近使用', ko: '최근 사용' },

  quickStart: { zh: '快速开始', en: 'Quick Start', ja: 'クイックスタート', ko: '빠른 시작' },

  prompt: { zh: '提示词', en: 'Prompt', ja: 'プロンプト', ko: '프롬프트' },

  promptPlaceholder: { zh: '描述你想要的画面...', en: 'Describe the image you want...', ja: '欲しい画像を説明...', ko: '원하는 이미지를 설명...' },

  negativePrompt: { zh: '反向提示词', en: 'Negative Prompt', ja: 'ネガティブプロンプト', ko: '네거티브 프롬프트' },

  style: { zh: '风格模板', en: 'Style', ja: 'スタイル', ko: '스타일' },

  stylePixel: { zh: '像素艺术', en: 'Pixel Art', ja: 'ピクセルアート', ko: '픽셀 아트' },

  styleAnime: { zh: '2D 动漫', en: '2D Anime', ja: '2Dアニメ', ko: '2D 애니메' },

  styleLowpoly: { zh: 'Low Poly', en: 'Low Poly', ja: 'ローポリ', ko: '로우 폴리' },

  styleHandDrawn: { zh: '手绘', en: 'Hand Drawn', ja: '手描き', ko: '핸드 드로잉' },

  styleRealistic: { zh: '写实', en: 'Realistic', ja: 'リアル', ko: '리얼리스틱' },

  count: { zh: '数量', en: 'Count', ja: '枚数', ko: '수량' },

  size: { zh: '尺寸', en: 'Size', ja: 'サイズ', ko: '크기' },

  steps: { zh: '步数 (SD)', en: 'Steps (SD)', ja: 'ステップ数', ko: '스텝' },

  quality: { zh: '质量', en: 'Quality', ja: '品質', ko: '품질' },

  standard: { zh: '标准', en: 'Standard', ja: '標準', ko: '표준' },

  hd: { zh: '高清', en: 'HD', ja: 'HD', ko: 'HD' },

  refImage: { zh: '参考图（可选）', en: 'Reference Image (optional)', ja: '参考画像（任意）', ko: '참조 이미지 (선택)' },

  refImageHelp: { zh: '上传参考图可帮助模型保持角色或风格一致。仅部分 API 支持参考图。', en: 'Upload reference images to help maintain consistency. Only some APIs support references.', ja: '参考画像でキャラクター/スタイルの一貫性を維持。一部APIのみ対応。', ko: '참조 이미지로 일관성 유지. 일부 API만 지원.' },

  refImagePrompt: { zh: '点击或拖拽上传 1 张或多张参考图', en: 'Click or drag to upload reference images', ja: 'クリックまたはドラッグで参考画像をアップロード', ko: '클릭 또는 드래그로 참조 이미지 업로드' },

  generating: { zh: '生成中...', en: 'Generating...', ja: '生成中...', ko: '생성 중...' },

  generateImage: { zh: '生成图像', en: 'Generate Image', ja: '画像を生成', ko: '이미지 생성' },

  generateCount: { zh: '生成数量', en: 'Count', ja: '生成枚数', ko: '생성 수량' },

  results: { zh: '生成结果', en: 'Results', ja: '生成結果', ko: '결과' },

  waiting: { zh: '等待生成', en: 'Waiting', ja: '生成待ち', ko: '대기 중' },

  targetImage: { zh: '目标图像', en: 'Target Image', ja: 'ターゲット画像', ko: '대상 이미지' },

  uploadTargetImage: { zh: '上传目标图像', en: 'Upload target image', ja: 'ターゲット画像をアップロード', ko: '대상 이미지 업로드' },

  styleRef: { zh: '风格参考', en: 'Style Reference', ja: 'スタイル参考', ko: '스타일 참조' },

  uploadStyleRef: { zh: '上传风格参考图', en: 'Upload style reference', ja: 'スタイル参考画像をアップロード', ko: '스타일 참조 이미지 업로드' },

  previewResult: { zh: '预览结果', en: 'Preview Result', ja: 'プレビュー結果', ko: '미리보기 결과' },

  previewResultPlaceholder: { zh: '迁移后的图像将显示在这里', en: 'Transferred image will appear here', ja: '変換後の画像がここに表示', ko: '변환된 이미지가 여기에 표시' },

  styleDesc: { zh: '风格描述 / 提示词', en: 'Style Description', ja: 'スタイル説明', ko: '스타일 설명' },

  styleDescPlaceholder: { zh: '可留空，使用参考图风格', en: 'Leave empty to use reference style', ja: '空欄で参考画像のスタイルを使用', ko: '비워두면 참조 이미지 스타일 사용' },

  transferring: { zh: '迁移中...', en: 'Transferring...', ja: '変換中...', ko: '변환 중...' },

  startTransfer: { zh: '开始迁移', en: 'Start Transfer', ja: '変換開始', ko: '변환 시작' },

  frontendColorTransfer: { zh: '前端色彩迁移（离线）', en: 'Frontend Color Transfer (Offline)', ja: 'フロントエンド色彩変換', ko: '프론트엔드 색상 전이' },

  saveToLibrary: { zh: '保存到资源库', en: 'Save to Library', ja: 'ライブラリに保存', ko: '라이브러리에 저장' },

  reupload: { zh: '重新上传', en: 'Re-upload', ja: '再アップロード', ko: '다시 업로드' },

  original: { zh: '原图', en: 'Original', ja: '原画', ko: '원본' },

  result: { zh: '结果', en: 'Result', ja: '結果', ko: '결과' },

  uploadCharImage: { zh: '上传角色图像', en: 'Upload character image', ja: 'キャラクター画像をアップロード', ko: '캐릭터 이미지 업로드' },

  processingResult: { zh: '处理结果', en: 'Processing result', ja: '処理結果', ko: '처리 결과' },

  simplifyLevel: { zh: '简化程度', en: 'Simplify Level', ja: '簡略化レベル', ko: '단순화 레벨' },

  simplifyHelp: { zh: '上传角色图像，选择简化程度、颜色数和输出尺寸，使用高质量缩放算法处理。', en: 'Upload character image, select level, colors and output size. Uses high-quality scaling.', ja: '画像をアップロードし、レベル、色数、出力サイズを選択。高品質スケーリング使用。', ko: '이미지 업로드 후 레벨, 색상 수, 출력 크기 선택. 고품질 스케일링 사용.' },

  targetWidth: { zh: '目标宽度', en: 'Target Width', ja: '目標幅', ko: '대상 너비' },

  targetHeight: { zh: '目标高度', en: 'Target Height', ja: '目標高さ', ko: '대상 높이' },

  colors: { zh: '颜色数', en: 'Colors', ja: '色数', ko: '색상 수' },

  processing: { zh: '处理中...', en: 'Processing...', ja: '処理中...', ko: '처리 중...' },

  process: { zh: '处理', en: 'Process', ja: '処理', ko: '처리' },

  charUpload: { zh: '角色上传', en: 'Character Upload', ja: 'キャラクターアップロード', ko: '캐릭터 업로드' },

  posePreview: { zh: '姿势预览', en: 'Pose Preview', ja: 'ポーズプレビュー', ko: '포즈 미리보기' },

  posePreviewPlaceholder: { zh: '选择预设姿势生成骨架', en: 'Select preset to generate skeleton', ja: 'プリセットを選択してスケルトン生成', ko: '프리셋 선택하여 스켈레톤 생성' },

  posePreset: { zh: '预设姿势', en: 'Preset Poses', ja: 'プリセットポーズ', ko: '프리셋 포즈' },

  poseHelp: { zh: '上传角色图像并选择姿势。未配置 API 时生成姿势骨架参考。', en: 'Upload character and select pose. Generates skeleton without API.', ja: 'キャラクターをアップロードしてポーズ選択。APIなしでスケルトン生成。', ko: '캐릭터 업로드 후 포즈 선택. API 없이 스켈레톤 생성.' },

  previewSkeleton: { zh: '预览骨架', en: 'Preview Skeleton', ja: 'スケルトンプレビュー', ko: '스켈레톤 미리보기' },

  apiGenerate: { zh: 'API生成（需配置）', en: 'API Generate (needs config)', ja: 'API生成（設定必要）', ko: 'API 생성 (설정 필요)' },

  brushSize: { zh: '画笔大小', en: 'Brush Size', ja: 'ブラシサイズ', ko: '브러시 크기' },

  zoom: { zh: '缩放', en: 'Zoom', ja: 'ズーム', ko: '확대' },

  importFromLibrary: { zh: '从资源库导入', en: 'Import from Library', ja: 'ライブラリからインポート', ko: '라이브러리에서 가져오기' },

  importFromLocal: { zh: '从本地导入', en: 'Import from Local', ja: 'ローカルからインポート', ko: '로컬에서 가져오기' },

  bg: { zh: '背景', en: 'BG', ja: '背景', ko: '배경' },

  black: { zh: '黑', en: 'Black', ja: '黒', ko: '검정' },

  white: { zh: '白', en: 'White', ja: '白', ko: '흰색' },

  currentColor: { zh: '当前色', en: 'Current Color', ja: '現在の色', ko: '현재 색상' },

  palette: { zh: '调色板', en: 'Palette', ja: 'パレット', ko: '팔레트' },

  recentColors: { zh: '最近颜色', en: 'Recent Colors', ja: '最近の色', ko: '최근 색상' },

  layers: { zh: '图层', en: 'Layers', ja: 'レイヤー', ko: '레이어' },

  exportPng: { zh: '导出 PNG', en: 'Export PNG', ja: 'PNGエクスポート', ko: 'PNG 내보내기' },

  shortcuts: { zh: '快捷键: Ctrl+Z 撤销, Ctrl+Shift+Z 重做, Ctrl+Y 重置画布', en: 'Shortcuts: Ctrl+Z Undo, Ctrl+Shift+Z Redo, Ctrl+Y Reset canvas', ja: 'Ctrl+Z 元に戻す, Ctrl+Shift+Z やり直し, Ctrl+Y キャンバスリセット', ko: 'Ctrl+Z 실행취소, Ctrl+Shift+Z 다시실행, Ctrl+Y 캔버스 초기화' },

  uploadPixelImage: { zh: '上传像素图像', en: 'Upload pixel image', ja: 'ピクセル画像をアップロード', ko: '픽셀 이미지 업로드' },

  custom: { zh: '自定义', en: 'Custom', ja: 'カスタム', ko: '사용자 정의' },

  customWidth: { zh: '自定义宽', en: 'Custom W', ja: 'カスタム幅', ko: '사용자 정의 너비' },

  scaleMode: { zh: '缩放算法', en: 'Scale Mode', ja: 'スケールモード', ko: '스케일 모드' },

  nearest: { zh: '最近邻', en: 'Nearest', ja: '最近傍', ko: '최근접' },

  pixelArt: { zh: '像素艺术', en: 'Pixel Art', ja: 'ピクセルアート', ko: '픽셀 아트' },

  outline: { zh: '描边', en: 'Outline', ja: 'アウトライン', ko: '외곽선' },

  none: { zh: '无', en: 'None', ja: 'なし', ko: '없음' },

  inner: { zh: '内描边', en: 'Inner', ja: '内側', ko: '내부' },

  outer: { zh: '外描边', en: 'Outer', ja: '外側', ko: '외부' },

  dither: { zh: '抖动', en: 'Dither', ja: 'ディザ', ko: '디더' },

  download: { zh: '下载', en: 'Download', ja: 'ダウンロード', ko: '다운로드' },

  downloading: { zh: '正在下载', en: 'Downloading', ja: 'ダウンロード中', ko: '다운로드 중' }, // 下载中提示翻译

  confirmExport: { zh: '确认导出', en: 'Confirm Export', ja: 'エクスポート確認', ko: '낳아내기 확인' }, // 确认导出按钮翻译

  frameSaved: { zh: '帧保存成功', en: 'Frame saved', ja: 'フレーム保存成功', ko: '프레임 저장 성공' }, // 帧保存成功提示翻译

  unsavedChanges: { zh: '有未保存的修改，确定关闭吗？', en: 'Unsaved changes. Close anyway?', ja: '未保存の変更があります。閉じますか？', ko: '저장되지 않은 변경사항이 있습니다. 닫으시겠습니까?' },

  restoreFrame: { zh: '还原当前帧', en: 'Restore Frame', ja: 'フレームを元に戻す', ko: '프레임 복원' },

  restoreAllFrames: { zh: '一键还原所有帧', en: 'Restore All Frames', ja: '全フレームを元に戻す', ko: '모든 프레임 복원' },

  frameRestored: { zh: '当前帧已还原', en: 'Frame restored', ja: 'フレームを元に戻しました', ko: '프레임 복원됨' },

  allFramesRestored: { zh: '所有帧已还原', en: 'All frames restored', ja: '全フレームを元に戻しました', ko: '모든 프레임 복원됨' },

  allFramesApplied: { zh: '已应用至所有帧', en: 'Applied to all frames', ja: '全フレームに適用', ko: '모든 프레임에 적용됨' },

  noFrameSelected: { zh: '没有选中的帧，已应用至当前帧', en: 'No frames selected, applied to current frame', ja: '選択されたフレームがありません。現在のフレームに適用しました', ko: '선택된 프레임 없음, 현재 프레임에 적용됨' },

  uploadRefImage: { zh: '上传参考图', en: 'Upload Reference', ja: '参考画像をアップロード', ko: '참조 이미지 업로드' },

  genResult: { zh: '生成结果', en: 'Generated Result', ja: '生成結果', ko: '생성 결과' },

  genResultPlaceholder: { zh: '生成结果', en: 'Generated result', ja: '生成結果', ko: '생성 결과' },

  templateStyle: { zh: '模板风格', en: 'Template Style', ja: 'テンプレートスタイル', ko: '템플릿 스타일' },

  pixelActionHelp: { zh: 'V1=4帧, V2=8帧, V3=2帧。选择动作类型后生成像素动画。', en: 'V1=4 frames, V2=8 frames, V3=2 frames. Select action type to generate.', ja: 'V1=4フレーム, V2=8フレーム, V3=2フレーム。アクションタイプを選択して生成。', ko: 'V1=4프레임, V2=8프레임, V3=2프레임. 액션 유형 선택하여 생성.' },

  actionType: { zh: '动作类型', en: 'Action Type', ja: 'アクションタイプ', ko: '액션 유형' },

  walk: { zh: '行走', en: 'Walk', ja: '歩行', ko: '걷기' },

  run: { zh: '奔跑', en: 'Run', ja: '走る', ko: '달리기' },

  idle: { zh: '待机', en: 'Idle', ja: '待機', ko: '대기' },

  outputWidth: { zh: '输出宽度', en: 'Output Width', ja: '出力幅', ko: '출력 너비' },

  generatePixelAction: { zh: '生成像素动作', en: 'Generate Pixel Action', ja: 'ピクセルアクション生成', ko: '픽셀 액션 생성' },

  downloadSprite: { zh: '下载动作精灵图', en: 'Download Sprite', ja: 'スプライトダウンロード', ko: '스프라이트 다운로드' },

  uploadVideo: { zh: '上传视频文件 (MP4, MOV, WebM)', en: 'Upload video (MP4, MOV, WebM)', ja: '動画をアップロード (MP4, MOV, WebM)', ko: '비디오 업로드 (MP4, MOV, WebM)' },

  uploadVideoHint: { zh: '点击选择或拖拽文件到此处', en: 'Click or drag file here', ja: 'クリックまたはドラッグで選択', ko: '클릭 또는 드래그로 선택' },

  sourceVideo: { zh: '源视频', en: 'Source Video', ja: 'ソース動画', ko: '소스 비디오' },

  videoCropHelp: { zh: '拖动裁剪框四角调整裁剪区域。右侧实时显示裁剪预览。', en: 'Drag corners to adjust crop region. Right shows live preview.', ja: '四隅をドラッグしてクロップ調整。右にライブプレビュー。', ko: '모서리를 드래그하여 자르기 영역 조정. 오른쪽에 미리보기.' },

  cropPreview: { zh: '裁剪预览', en: 'Crop Preview', ja: 'クロッププレビュー', ko: '자르기 미리보기' },

  rangePreview: { zh: '范围预览', en: 'Range Preview', ja: '範囲プレビュー', ko: '범위 미리보기' },

  rangePreviewHint: { zh: '在当前裁剪区域与时间范围内循环预览 GIF 帧', en: 'Loop preview GIF frames within current crop and time range', ja: '現在のクロップ範囲と時間範囲で GIF フレームをループプレビュー', ko: '현재 자르기 및 시간 범위 내에서 GIF 프레임 미리보기' },

  videoInfo: { zh: '视频信息', en: 'Video Info', ja: '動画情報', ko: '비디오 정보' },

  filename: { zh: '文件名', en: 'Filename', ja: 'ファイル名', ko: '파일명' },

  duration: { zh: '时长', en: 'Duration', ja: '長さ', ko: '길이' },

  resolution: { zh: '分辨率', en: 'Resolution', ja: '解像度', ko: '해상도' },

  nativeFps: { zh: '原生FPS', en: 'Native FPS', ja: 'ネイティブFPS', ko: '네이티브 FPS' },

  reuploadVideo: { zh: '重新上传视频', en: 'Reupload Video', ja: '動画を再アップロード', ko: '비디오 재업로드' }, // 重新上传视频按钮翻译

  cropVideoPreview: { zh: '裁剪视频预览', en: 'Crop Video Preview', ja: 'クロップ動画プレビュー', ko: '자르기 비디오 미리보기' }, // 裁剪视频预览标题翻译

  cropVideoPreviewHelp: { zh: '实时预览裁剪区域与选取时间范围内的视频效果', en: 'Live preview cropped video within selected time range', ja: '選択範囲内のクロップ動画をリアルタイムプレビュー', ko: '선택한 시간 범위 내에서 자른 비디오 미리보기' }, // 裁剪视频预览帮助翻译

  playPreview: { zh: '播放预览', en: 'Play Preview', ja: 'プレビュー再生', ko: '미리보기 재생' }, // 播放预览按钮翻译

  pausePreview: { zh: '暂停预览', en: 'Pause Preview', ja: 'プレビュー停止', ko: '미리보기 일시정지' }, // 暂停预览按钮翻译

  previewRange: { zh: '预览范围', en: 'Preview Range', ja: 'プレビュー範囲', ko: '미리보기 범위' }, // 预览范围标签翻译

  currentTime: { zh: '当前时间', en: 'Current Time', ja: '現在時刻', ko: '현재 시간' }, // 当前时间标签翻译

  clickPlayPreview: { zh: '点击播放预览', en: 'Click to play preview', ja: 'クリックしてプレビュー再生', ko: '클릭하여 미리보기 재생' }, // 点击播放提示翻译

  cropX: { zh: '裁剪X', en: 'Crop X', ja: 'クロップX', ko: '자르기 X' },

  cropY: { zh: '裁剪Y', en: 'Crop Y', ja: 'クロップY', ko: '자르기 Y' },

  cropW: { zh: '裁剪宽', en: 'Crop W', ja: 'クロップ幅', ko: '자르기 너비' },

  cropH: { zh: '裁剪高', en: 'Crop H', ja: 'クロップ高', ko: '자르기 높이' },

  extractSettings: { zh: '提取设置', en: 'Extract Settings', ja: '抽出設定', ko: '추출 설정' },

  extractHelp: { zh: '设置 FPS、输出尺寸、时间范围，点击提取帧。', en: 'Set FPS, output size, time range, then extract.', ja: 'FPS、出力サイズ、時間範囲を設定して抽出。', ko: 'FPS, 출력 크기, 시간 범위 설정 후 추출.' },

  extractFps: { zh: '每秒提取帧数', en: 'FPS', ja: 'FPS', ko: 'FPS' },

  outputHeight: { zh: '输出高度', en: 'Output Height', ja: '出力高さ', ko: '출력 높이' },

  estFrames: { zh: '预计帧数', en: 'Est. Frames', ja: '予想フレーム数', ko: '예상 프레임' },

  rangeStart: { zh: '开始时间', en: 'Start', ja: '開始', ko: '시작' },

  rangeEnd: { zh: '结束时间', en: 'End', ja: '終了', ko: '종료' },

  selectedDuration: { zh: '选中时长', en: 'Selected Duration', ja: '選択時間', ko: '선택 길이' },

  extractFrames: { zh: '提取帧', en: 'Extract Frames', ja: 'フレーム抽出', ko: '프레임 추출' },

  detectSimilar: { zh: '检测相似帧', en: 'Detect Similar', ja: '類似フレーム検出', ko: '유사 프레임 감지' },

  selectAll: { zh: '全选', en: 'Select All', ja: 'すべて選択', ko: '전체 선택' },

  deselectAll: { zh: '取消全选', en: 'Deselect All', ja: '選択解除', ko: '전체 해제' },

  selectEveryOther: { zh: '隔帧选取', en: 'Select Every Other', ja: '一つ飛ばし選択', ko: '하나 건너 선택' },

  deleteUnselected: { zh: '删除未选帧', en: 'Delete Unselected', ja: '未選択削除', ko: '미선택 삭제' },

  deleteUnselectedConfirm: { zh: '确定删除所有未选中的帧？此操作不可撤销。', en: 'Delete all unselected frames? This cannot be undone.', ja: '未選択のフレームをすべて削除しますか？元に戻せません。', ko: '선택되지 않은 프레임을 모두 삭제하시겠습니까? 되돌릴 수 없습니다.' },

  confirmDelete: { zh: '确认删除', en: 'Confirm Delete', ja: '削除確認', ko: '삭제 확인' },

  undoHint: { zh: 'Ctrl+Z 撤销', en: 'Ctrl+Z Undo', ja: 'Ctrl+Z 元に戻す', ko: 'Ctrl+Z 실행 취소' },

  undoDone: { zh: '已撤销上一步', en: 'Undone', ja: '元に戻しました', ko: '실행 취소됨' },

  noUndoHistory: { zh: '没有可撤销的操作', en: 'Nothing to undo', ja: '元に戻す操作はありません', ko: '실행 취소할 작업이 없습니다' },

  selectFramesFirst: { zh: '请先选择要导出的帧', en: 'Please select frames to export first', ja: 'エクスポートするフレームを選択してください', ko: '먼저 낳ㄹ할 프레ーム을 선택하세요' },

  totalFrames: { zh: '总帧数', en: 'Total Frames', ja: '総フレーム数', ko: '총 프레임 수' },

  selectedFrames: { zh: '已选帧', en: 'Selected Frames', ja: '選択済みフレーム', ko: '선택된 프레임' },

  frameClickHint: { zh: '点击缩略图编辑；点击复选框选择；Shift+点击连续选择', en: 'Click thumbnail to edit; checkbox to select; Shift+click range select', ja: 'サムネイルクリックで編集；チェックボックスで選択；Shift+クリックで範囲選択', ko: '썸네일 클릭으로 편집; 체크박스로 선택; Shift+클릭 범위 선택' },

  previewFps: { zh: '预览 FPS', en: 'Preview FPS', ja: 'プレビューFPS', ko: '미리보기 FPS' },

  frameLabel: { zh: '第', en: 'Frame', ja: 'フレーム', ko: '프레임' },

  firstFrame: { zh: '第一帧', en: 'First Frame', ja: '最初のフレーム', ko: '첫 프레임' },
  prevFrame: { zh: '上一帧', en: 'Previous Frame', ja: '前のフレーム', ko: '이전 프레임' },
  nextFrame: { zh: '下一帧', en: 'Next Frame', ja: '次のフレーム', ko: '다음 프레임' },
  lastFrame: { zh: '最后帧', en: 'Last Frame', ja: '最後のフレーム', ko: '마지막 프레임' },

  play: { zh: '播放', en: 'Play', ja: '再生', ko: '재생' },

  pause: { zh: '暂停', en: 'Pause', ja: '一時停止', ko: '일시정지' },

  exportOptions: { zh: '导出选项', en: 'Export Options', ja: 'エクスポートオプション', ko: '내보내기 옵션' },

  exportHelp: { zh: '选择格式、尺寸与压缩等级。精灵图附JSON元数据。', en: 'Select format, size and compression. Sprite includes JSON metadata.', ja: '形式、サイズ、圧縮レベルを選択。スプライトはJSONメタデータ付き。', ko: '형식, 크기, 압축 레벨 선택. 스프라이트는 JSON 메타데이터 포함.' },

  exportFormat: { zh: '导出格式', en: 'Export Format', ja: 'エクスポート形式', ko: '내보내기 형식' },

  videoWebm: { zh: '视频 (WebM)', en: 'Video (WebM)', ja: '動画 (WebM)', ko: '비디오 (WebM)' },

  framesZip: { zh: '序列帧 (ZIP)', en: 'Frames (ZIP)', ja: 'フレーム (ZIP)', ko: '프레임 (ZIP)' },

  sprite: { zh: '精灵图', en: 'Sprite', ja: 'スプライト', ko: '스프라이트' },

  spriteCols: { zh: '精灵图列数', en: 'Sprite Cols', ja: 'スプライト列数', ko: '스프라이트 열 수' },

  spriteZip: { zh: '精灵图 ZIP (PNG+JSON)', en: 'Sprite ZIP (PNG+JSON)', ja: 'スプライトZIP (PNG+JSON)', ko: '스프라이트 ZIP (PNG+JSON)' },

  spriteJson: { zh: '精灵图 JSON 元数据', en: 'Sprite JSON Metadata', ja: 'スプライトJSONメタデータ', ko: '스프라이트 JSON 메타데이터' },

  exportSize: { zh: '导出尺寸', en: 'Export Size', ja: '出力サイズ', ko: '낳아내기 크기' },

  preset: { zh: '预设', en: 'Preset', ja: 'プリセット', ko: '프리셋' },

  width: { zh: '宽', en: 'Width', ja: '幅', ko: '너비' },

  height: { zh: '高', en: 'Height', ja: '高さ', ko: '높이' },

  lockAspect: { zh: '锁定宽高比', en: 'Lock Aspect', ja: '縦横比固定', ko: '비율 고정' },

  compression: { zh: '压缩等级', en: 'Compression', ja: '圧縮レベル', ko: '압축 레벨' },

  compressionNone: { zh: '无压缩（PNG 原图画质）', en: 'None (PNG original)', ja: '無圧縮（PNG原画画質）', ko: '무압축 (PNG 원본 화질)' },

  compressionLow: { zh: '低压缩', en: 'Low (not lossless)', ja: '低（非可逆）', ko: '낮음 (비무손실)' },

  compressionMed: { zh: '中压缩', en: 'Medium', ja: '中', ko: '중간' },

  compressionHigh: { zh: '高压缩', en: 'High', ja: '高', ko: '높음' },

  gifDelay: { zh: 'GIF 延迟(ms)', en: 'GIF Delay(ms)', ja: 'GIF遅延(ms)', ko: 'GIF 지연(ms)' },

  sharpen: { zh: '锐化', en: 'Sharpen', ja: 'シャープ', ko: '선명도' },

  estSize: { zh: '预估大小', en: 'Est. Size', ja: '推定サイズ', ko: '예상 크기' },

  estCompressSize: { zh: '压缩后体积', en: 'Compressed Size', ja: '圧縮後サイズ', ko: '압축 후 크기' },

  perFrame: { zh: '每帧', en: 'per frame', ja: '/フレーム', ko: '/프레임' },

  calculating: { zh: '计算中...', en: 'Calculating...', ja: '計算中...', ko: '계산 중...' },

  generatePreview: { zh: '生成预览', en: 'Generate Preview', ja: 'プレビュー生成', ko: '미리보기 생성' },

  exportPreview: { zh: '导出预览', en: 'Export Preview', ja: 'エクスポートプレビュー', ko: '내보내기 미리보기' },

  exportPreviewHint: { zh: '点击"生成预览"后显示结果', en: 'Click "Generate Preview" to see result', ja: '「プレビュー生成」をクリック', ko: '"미리보기 생성" 클릭' },

  uploadGif: { zh: '上传 GIF 文件', en: 'Upload GIF file', ja: 'GIFファイルをアップロード', ko: 'GIF 파일 업로드' },

  uploadGifHint: { zh: '点击选择或拖拽文件到此处', en: 'Click or drag file here', ja: 'クリックまたはドラッグで選択', ko: '클릭 또는 드래그로 선택' },

  gifExtractHelp: { zh: '设置每秒提取帧数。GIF 按时间间隔抽取帧。', en: 'Set FPS for extraction. GIF frames extracted at intervals.', ja: 'FPSを設定。GIFフレームは間隔で抽出。', ko: 'FPS 설정. GIF 프레임은 간격으로 추출.' },

  uploadImages: { zh: '上传多张图像', en: 'Upload multiple images', ja: '複数画像をアップロード', ko: '여러 이미지 업로드' },

  uploadImagesHint: { zh: '支持 PNG (保留透明), JPG, WebP', en: 'Supports PNG, JPG, WebP', ja: 'PNG, JPG, WebP対応', ko: 'PNG, JPG, WebP 지원' },

  layoutSettings: { zh: '布局设置', en: 'Layout Settings', ja: 'レイアウト設定', ko: '레이아웃 설정' },

  spriteHelp: { zh: '上传图像，设置列数、间距与背景。下载 PNG 精灵图与 JSON 元数据。', en: 'Upload images, set columns, padding, background. Download PNG and JSON.', ja: '画像をアップロード、列数、間隔、背景を設定。PNGとJSONをダウンロード。', ko: '이미지 업로드, 열, 패딩, 배경 설정. PNG와 JSON 다운로드.' },

  columns: { zh: '列数', en: 'Columns', ja: '列数', ko: '열 수' },

  rows: { zh: '行数 (自动)', en: 'Rows (auto)', ja: '行数（自動）', ko: '행 수 (자동)' },

  padding: { zh: '帧间距 (px)', en: 'Padding (px)', ja: '間隔 (px)', ko: '간격 (px)' },

  transparent: { zh: '透明', en: 'Transparent', ja: '透明', ko: '투명' },

  downloadPng: { zh: '下载 PNG', en: 'Download PNG', ja: 'PNGダウンロード', ko: 'PNG 다운로드' },

  downloadJpg: { zh: '下载 JPG', en: 'Download JPG', ja: 'JPGダウンロード', ko: 'JPG 다운로드' }, // 下载JPG按钮翻译

  notice: { zh: '提示', en: 'Notice', ja: '通知', ko: '알림' }, // 弹框标题翻译

  ok: { zh: '确定', en: 'OK', ja: 'OK', ko: '확인' }, // 确定按钮翻译

  needApiProfile: { zh: '请先选择或配置 API 配置方案后再生成图像', en: 'Please select or configure an API profile before generating', ja: '画像生成前にAPIプロファイルを選択または設定してください', ko: '이미지 생성 전 API 프로필을 선택하거나 설정하세요' }, // 需要选择API方案提示

  downloadJson: { zh: '下载 JSON 元数据', en: 'Download JSON', ja: 'JSONダウンロード', ko: 'JSON 다운로드' },

  // 精灵图归一化相关翻译
  normalizeTitle: { zh: '归一化', en: 'Normalize', ja: '正規化', ko: '정규화' },
  normalizeHelp: { zh: '裁掉透明边缘并统一画布尺寸，解决不同角色精灵图大小不一的问题', en: 'Trim transparent edges and unify canvas size to fix inconsistent sprite sizes across characters', ja: '透明な余白を切り取り、キャンバスサイズを統一してキャラクター間のスプライトサイズ不一致を解決', ko: '투명 여백을 잘라내고 캔버스 크기를 통일하여 캐릭터 간 스프라이트 크기 불일치 해결' },
  normalizeMode: { zh: '归一化模式', en: 'Mode', ja: 'モード', ko: '모드' },
  normalizeModeUniform: { zh: '统一画布+trim', en: 'Uniform Canvas + Trim', ja: '統一キャンバス+トリム', ko: '통일 캔버스+트림' },
  normalizeModeBaseline: { zh: '基准线缩放', en: 'Baseline Scale', ja: 'ベースラインスケール', ko: '베이스라인 스케일' },
  normalizeCanvasW: { zh: '画布宽', en: 'Canvas W', ja: 'キャンバス幅', ko: '캔버스 너비' },
  normalizeCanvasH: { zh: '画布高', en: 'Canvas H', ja: 'キャンバス高', ko: '캔버스 높이' },
  normalizeScaleMode: { zh: '缩放基准', en: 'Scale Mode', ja: 'スケール基準', ko: '스케일 기준' },
  normalizeScaleMax: { zh: '以最大角色为基准（推荐）', en: 'By largest character (recommended)', ja: '最大キャラ基準（推奨）', ko: '가장 큰 캐릭터 기준（권장）' },
  normalizeScaleFit: { zh: '填充画布（强制等高）', en: 'Fill canvas (force equal height)', ja: 'キャンバス埋め（強制等高）', ko: '캔버스 채우기（강제 등고）' },
  normalizeScaleCustom: { zh: '自定义比例', en: 'Custom scale', ja: 'カスタム倍率', ko: '사용자 정의 배율' },
  normalizeCustomScale: { zh: '缩放比例', en: 'Scale', ja: '倍率', ko: '배율' },
  normalizeAlign: { zh: '对齐方式', en: 'Alignment', ja: '整列', ko: '정렬' },
  normalizeAlignBottom: { zh: '底部居中', en: 'Bottom Center', ja: '下中央', ko: '하단 중앙' },
  normalizeAlignCenter: { zh: '居中', en: 'Center', ja: '中央', ko: '중앙' },
  normalizeAlignTop: { zh: '顶部居中', en: 'Top Center', ja: '上中央', ko: '상단 중앙' },
  normalizePadding: { zh: '边距', en: 'Padding', ja: '余白', ko: '여백' },
  normalizeTargetHeight: { zh: '目标高度', en: 'Target Height', ja: '目標高さ', ko: '목표 높이' },
  normalizeBaselineY: { zh: '基准线 Y', en: 'Baseline Y', ja: 'ベースライン Y', ko: '베이스라인 Y' },

  // 精灵图归一化独立页面相关翻译
  spriteNormalizer: { zh: '精灵图归一化', en: 'Sprite Normalizer', ja: 'スプライト正規化', ko: '스프라이트 정규화' },
  spriteNormalizerPage: { zh: '跨角色统一', en: 'Cross-Character Normalize', ja: 'キャラクター間統一', ko: '캐릭터 간 통일' },
  normalizerStep1: { zh: '上传·切分', en: 'Upload·Slice', ja: 'アップロード·分割', ko: '업로드·분할' },
  normalizerStep2: { zh: '选择归一化方式', en: 'Choose Mode', ja: 'モード選択', ko: '모드 선택' },
  normalizerStep3: { zh: '预览对比', en: 'Preview Compare', ja: 'プレビュー比較', ko: '미리보기 비교' },
  normalizerStep4: { zh: '导出结果', en: 'Export', ja: 'エクスポート', ko: '내보내기' },
  normalizerUploadTitle: { zh: '上传精灵图（支持批量多角色）', en: 'Upload Sprite (Batch Multi-Char)', ja: 'スプライトをアップロード（複数キャラ対応）', ko: '스프라이트 업로드（다중 캐릭터）' },
  normalizerUploadHelp: { zh: '上传一张或多张精灵图，系统按列数切分为独立帧；多张图会作为不同角色批量归一化', en: 'Upload one or more sprite sheets, sliced by columns; multiple sheets are normalized together as different characters', ja: '1枚以上のスプライトをアップロード、列数で分割。複数枚は異なるキャラとして一括正規化', ko: '하나 이상의 스프라이트를 업로드하고 열 수로 분할. 여러 장은 서로 다른 캐릭터로 일괄 정규화' },
  normalizerModeTitle: { zh: '归一化方式', en: 'Normalize Mode', ja: '正規化モード', ko: '정규화 모드' },
  normalizerModeAnchor: { zh: '锚点对齐', en: 'Anchor Align', ja: 'アンカー整列', ko: '앵커 정렬' },
  normalizerRun: { zh: '开始归一化', en: 'Run Normalize', ja: '正規化開始', ko: '정규화 실행' },
  normalizerPreviewTitle: { zh: '前后对比预览', en: 'Before/After Compare', ja: '前後比較プレビュー', ko: '전후 비교 미리보기' },
  normalizerCrossCharTitle: { zh: '跨角色并排对比', en: 'Cross-Character Compare', ja: 'キャラ間並列比較', ko: '캐릭터 간 나란히 비교' },
  normalizerDownloadAll: { zh: '全部打包 ZIP', en: 'Download All (ZIP)', ja: '全てZIPでダウンロード', ko: '전체 ZIP 다운로드' },
  normalizerAnchorTip: { zh: '点击图像设置锚点（通常是脚底中心），归一化时所有帧锚点对齐到统一画布同一位置', en: 'Click to set anchor (usually foot center); all frames aligned to same position on canvas', ja: 'クリックでアンカー設定（通常は足元中央）。全フレームのアンカーがキャンバスの同じ位置に整列', ko: '클릭으로 앵커 설정 (보통 발 중앙). 모든 프레임의 앵커가 캔버스의 같은 위치에 정렬' },
  normalizerSelectChar: { zh: '角色', en: 'Character', ja: 'キャラクター', ko: '캐릭터' },
  normalizerFrame: { zh: '帧', en: 'Frame', ja: 'フレーム', ko: '프레임' },
  normalizerCols: { zh: '列数', en: 'Columns', ja: '列数', ko: '열 수' },
  normalizerFrames: { zh: '帧', en: 'frames', ja: 'フレーム', ko: '프레임' },
  normalizerUploaded: { zh: '已上传并切分', en: 'Uploaded & sliced', ja: 'アップロード・分割完了', ko: '업로드 및 분할 완료' },
  normalizerUploadFail: { zh: '上传失败', en: 'Upload failed', ja: 'アップロード失敗', ko: '업로드 실패' },
  normalizerResliced: { zh: '已重新切分', en: 'Resliced', ja: '再分割完了', ko: '재분할 완료' },
  normalizerProcessing: { zh: '正在归一化...', en: 'Normalizing...', ja: '正規化中...', ko: '정규화 중...' },
  normalizerDone: { zh: '归一化完成', en: 'Normalize done', ja: '正規化完了', ko: '정규화 완료' },
  normalizerFail: { zh: '归一化失败', en: 'Normalize failed', ja: '正規化失敗', ko: '정규화 실패' },
  normalizerDownloaded: { zh: '已下载', en: 'Downloaded', ja: 'ダウンロード完了', ko: '다운로드 완료' },
  normalizerAnchorSet: { zh: '锚点已设置', en: 'Anchor set', ja: 'アンカー設定完了', ko: '앵커 설정 완료' },
  remove: { zh: '移除', en: 'Remove', ja: '削除', ko: '제거' },

  preview: { zh: '预览', en: 'Preview', ja: 'プレビュー', ko: '미리보기' },

  sourceImages: { zh: '源图像', en: 'Source Images', ja: 'ソース画像', ko: '소스 이미지' },

  tileset: { zh: '瓦片集', en: 'Tileset', ja: 'タイルセット', ko: '타일셋' },

  uploadTileset: { zh: '上传瓦片集', en: 'Upload tileset', ja: 'タイルセットをアップロード', ko: '타일셋 업로드' },

  tileSelect: { zh: '图块选择', en: 'Tile Select', ja: 'タイル選択', ko: '타일 선택' },

  uploadTilesetFirst: { zh: '请先上传瓦片集', en: 'Upload tileset first', ja: '先にタイルセットをアップロード', ko: '먼저 타일셋 업로드' },

  tools: { zh: '工具', en: 'Tools', ja: 'ツール', ko: '도구' },

  showGrid: { zh: '显示网格', en: 'Show Grid', ja: 'グリッド表示', ko: '그리드 표시' },

  detailLayer: { zh: '细节层', en: 'Detail Layer', ja: '詳細レイヤー', ko: '디테일 레이어' },

  mapWidth: { zh: '地图宽', en: 'Map W', ja: 'マップ幅', ko: '맵 너비' },

  mapHeight: { zh: '地图高', en: 'Map H', ja: 'マップ高さ', ko: '맵 높이' },

  exportJson: { zh: '导出 JSON', en: 'Export JSON', ja: 'JSONエクスポート', ko: 'JSON 내보내기' },

  topdownControls: { zh: '控制: WASD 移动', en: 'Controls: WASD to move', ja: '操作: WASDで移動', ko: '조작: WASD 이동' },

  uploadLocalMap: { zh: '上传本地地图', en: 'Upload Local Map', ja: 'ローカルマップをアップロード', ko: '로컬 맵 업로드' },

  uploadLocalChar: { zh: '上传本地角色', en: 'Upload Local Char', ja: 'ローカルキャラをアップロード', ko: '로컬 캐릭터 업로드' },

  uploadLocalCharVideo: { zh: '上传视频角色', en: 'Upload Video Char', ja: 'ビデオキャラをアップロード', ko: '비디오 캐릭터 업로드' },

  screenshot: { zh: '截图', en: 'Screenshot', ja: 'スクリーンショット', ko: '스크린샷' },

  projectType: { zh: '项目 / 类型', en: 'Project / Type', ja: 'プロジェクト / タイプ', ko: '프로젝트 / 유형' },

  searchAssets: { zh: '搜索资源...', en: 'Search assets...', ja: 'リソースを検索...', ko: '리소스 검색...' },

  deleteSelected: { zh: '删除选中', en: 'Delete Selected', ja: '選択を削除', ko: '선택 삭제' },

  items: { zh: '项资源', en: 'items', ja: '項目', ko: '항목' },

  libraryEmpty: { zh: '资源库为空。点击"导入文件"或在工作区"保存到资源库"', en: 'Library empty. Click "Import Files" or "Save to Library" in workspace.', ja: 'ライブラリが空です。「インポート」またはワークスペースで「保存」', ko: '라이브러리가 비어 있습니다. "파일 가져오기" 또는 작업공간에서 "저장"' },

  exportAll: { zh: '导出全部', en: 'Export All', ja: 'すべてエクスポート', ko: '전체 내보내기' },

  importFiles: { zh: '导入文件', en: 'Import Files', ja: 'ファイルをインポート', ko: '파일 가져오기' },

  help: { zh: '帮助', en: 'Help', ja: 'ヘルプ', ko: '도움말' },

  close: { zh: '关闭', en: 'Close', ja: '閉じる', ko: '닫기' },

  frameEditor: { zh: '帧编辑', en: 'Frame Editor', ja: 'フレーム編集', ko: '프레임 편집' },

  previous: { zh: '上一帧', en: 'Previous', ja: '前', ko: '이전' },

  next: { zh: '下一帧', en: 'Next', ja: '次', ko: '다음' },

  frameSize: { zh: '帧尺寸', en: 'Frame Size', ja: 'フレームサイズ', ko: '프레임 크기' },

  copyDataUrl: { zh: '复制帧数据URL', en: 'Copy Data URL', ja: 'データURLコピー', ko: '데이터 URL 복사' },

  mattingMode: { zh: '抠图模式', en: 'Matting Mode', ja: '切り抜きモード', ko: '마팅 모드' },

  mattingFlood: { zh: '边缘填充', en: 'Flood Fill', ja: 'フロードフィル', ko: '플러드 필' },

  mattingGlobal: { zh: '全局色度键', en: 'Global Chroma', ja: 'グローバルクロマ', ko: '글로벌 크로마' },

  mattingSmart: { zh: '智能聚类', en: 'Smart Cluster', ja: 'スマートクラスタ', ko: '스마트 클러스터' },

  watermark: { zh: '水印去除', en: 'Watermark', ja: '透かし除去', ko: '워터마크 제거' },

  manualSelect: { zh: '手动框选', en: 'Box Select', ja: '範囲選択', ko: '영역 선택' },

  manualSelectHint: { zh: '拖拽框选区域→松手去除框内像素', en: 'Drag to select area, release to erase', ja: 'ドラッグ選択→リリースで削除', ko: '드래그 선택→해제로 삭제' },

  watermarkSelectHint: { zh: '水印去除中：拖拽框选水印区域，松手清除', en: 'Watermark mode: drag to select, release to erase', ja: '透かし削除中：ドラッグで選択、リリースで削除', ko: '워터마크 제거 중: 드래그 선택, 해제로 삭제' },

  watermarkNoApplyAll: { zh: '水印模式不支持应用到所有帧（已保存当前帧）', en: 'Apply-to-all not available in watermark mode (current frame saved)', ja: '透かしモードは全フレーム適用不可（現在のフレームを保存）', ko: '워터마크 모드는 전체 적용 불가 (현재 프레임 저장됨)' },

  watermarkAppliedAll: { zh: '水印去除已应用到所有帧', en: 'Watermark removal applied to all frames', ja: '透かし削除を全フレームに適用しました', ko: '워터마크 제거가 모든 프레임에 적용됨' }, // 水印应用到所有帧成功提示

  keyColor: { zh: '关键色', en: 'Key Color', ja: 'キーカラー', ko: '키 색상' },

  tolerance: { zh: '容差', en: 'Tolerance', ja: '許容値', ko: '허용 오차' },

  feather: { zh: '羽化', en: 'Feather', ja: 'フェザー', ko: '페더' },

  edgeErosion: { zh: '边缘侵蚀', en: 'Edge Erosion', ja: 'エッジ浸食', ko: '에지 침식' },

  clusters: { zh: '聚类数', en: 'Clusters', ja: 'クラスタ数', ko: '클리스터 수' },

  brightness: { zh: '亮度', en: 'Brightness', ja: '明度', ko: '밝기' },

  contrast: { zh: '对比度', en: 'Contrast', ja: 'コントラスト', ko: '대비' },

  saturation: { zh: '饱和度', en: 'Saturation', ja: '彩度', ko: '채도' },

  applyToAll: { zh: '应用至所有帧', en: 'Apply to All', ja: 'すべて適用', ko: '모두 적용' },

  saveFrame: { zh: '保存当前帧', en: 'Save Frame', ja: 'フレーム保存', ko: '프레임 저장' },

  eyedropperHint: { zh: '点击画布吸取关键色', en: 'Click canvas to pick key color', ja: 'キャンバスをクリックしてキーカラーを取得', ko: '캔버스 클릭으로 키 색상 추출' },

  selectModel: { zh: '选择模型 / 服务', en: 'Select Model / Service', ja: 'モデル/サービス選択', ko: '모델/서비스 선택' },

  apiEndpoint: { zh: 'API 请求地址', en: 'API Endpoint', ja: 'APIエンドポイント', ko: 'API 엔드포인트' },

  modelName: { zh: '模型名称', en: 'Model Name', ja: 'モデル名', ko: '모델 이름' },

  modelNamePlaceholder: { zh: 'model name', en: 'model name', ja: 'モデル名', ko: '모델 이름' },

  fetchModels: { zh: '获取模型', en: 'Fetch Models', ja: 'モデル取得', ko: '모델 가져오기' }, // 获取模型列表按钮

  modelList: { zh: '可用模型', en: 'Available Models', ja: '利用可能なモデル', ko: '사용 가능한 모델' }, // 可用模型下拉框标签

  fetchModelsFailed: { zh: '获取模型列表失败', en: 'Failed to fetch models', ja: 'モデル取得失敗', ko: '모델 가져오기 실패' }, // 获取模型失败提示

  extraParams: { zh: '额外参数 (JSON)', en: 'Extra Params (JSON)', ja: '追加パラメータ (JSON)', ko: '추가 파라미터 (JSON)' },

  cancel: { zh: '取消', en: 'Cancel', ja: 'キャンセル', ko: '취소' },

  save: { zh: '保存', en: 'Save', ja: '保存', ko: '저장' },

  tongyi: { zh: '通义万相 (Aliyun)', en: 'Tongyi Wanxiang', ja: '通義万相', ko: '통이 완샹' },

  wenxin: { zh: '文心一格 (Baidu)', en: 'Wenxin Yige', ja: '文心一格', ko: '원신 이거' },

  doubao: { zh: '豆包 / 即梦 (ByteDance)', en: 'Doubao / Jimeng', ja: '豆包/即夢', ko: '더우바오/지멍' },

  zhipu: { zh: '智谱清言 (Zhipu)', en: 'Zhipu Qingyan', ja: '智譜清言', ko: '즈푸 칭옌' },

  kling: { zh: '可灵 (Kling)', en: 'Kling', ja: '可霊', ko: '클링' },

  customEndpoint: { zh: '自定义配置', en: 'Custom endpoint', ja: 'カスタムエンドポイント', ko: '커스텀 엔드포인트' },

  loading: { zh: '正在生成预览...', en: 'Generating preview...', ja: 'プレビュー生成中...', ko: '미리보기 생성 중...' },

  ready: { zh: '就绪', en: 'Ready', ja: '準備完了', ko: '준비' },

  apiSaved: { zh: 'API 设置已保存', en: 'API settings saved', ja: 'API設定を保存しました', ko: 'API 설정 저장됨' },
  apiConfig: { zh: 'API 配置', en: 'API Config', ja: 'API設定', ko: 'API 설정' }, // API 配置按钮文本
  t2iHistory: { zh: '生成历史', en: 'Generation History', ja: '生成履歴', ko: '생성 기록' }, // T2I 历史记录面板标题
  t2iHistoryEmpty: { zh: '暂无生成记录', en: 'No generation history', ja: '履歴がありません', ko: '생성 기록 없음' }, // T2I 历史记录为空提示
  txt2imgFailed: { zh: '图像生成失败', en: 'Image generation failed', ja: '画像生成に失敗しました', ko: '이미지 생성 실패' }, // T2I 生成失败提示
  t2iHistoryHelp: { zh: '点击历史记录可快速恢复提示词与结果', en: 'Click history item to restore prompt and result', ja: '履歴をクリックしてプロンプトと結果を復元', ko: '기록을 클릭하여 프롬프트와 결과 복원' }, // T2I 历史记录帮助

  selectApiProfile: { zh: '选择配置方案', en: 'Select Profile', ja: 'プロファイルを選択', ko: '프로필 선택' }, // 选择 API 配置方案标签

  customProfile: { zh: '自定义配置', en: 'Custom', ja: 'カスタム', ko: '사용자 정의' }, // 未保存的自定义配置选项

  profileName: { zh: '方案名称', en: 'Profile Name', ja: 'プロファイル名', ko: '프로필 이름' }, // 方案名称标签

  profileNamePlaceholder: { zh: '例如：通义万相-角色设计', en: 'e.g. Tongyi Character Design', ja: '例：通義万相-キャラクターデザイン', ko: '예: 통이 - 캐릭터 디자인' }, // 方案名称占位符

  saveProfile: { zh: '保存配置方案', en: 'Save Profile', ja: 'プロファイルを保存', ko: '프로필 저장' }, // 保存方案按钮

  apiProfileSaved: { zh: '配置方案已保存', en: 'Profile saved', ja: 'プロファイルを保存しました', ko: '프로필 저장됨' }, // 保存成功提示

  apiProfileDeleted: { zh: '配置方案已删除', en: 'Profile deleted', ja: 'プロファイルを削除しました', ko: '프로필 삭제됨' }, // 删除提示

  apiRequiredFields: { zh: '请填写所有必填项（方案名称、API 地址、模型名称、API Key）', en: 'Please fill in all required fields', ja: '必須項目をすべて入力してください', ko: '모든 필수 항목을 입력해주세요' }, // 必填校验提示

  noProfile: { zh: '未选择配置方案', en: 'No profile', ja: 'プロファイル未選択', ko: '프로필 없음' }, // 未选择方案占位

  delete: { zh: '删除', en: 'Delete', ja: '削除', ko: '삭제' }, // 删除按钮翻译

  txt2imgDone: { zh: '创建素材完成', en: 'Create material done', ja: '素材作成完了', ko: '소재 생성 완료' },

  txt2imgNeedConfig: { zh: '请先输入提示词或上传参考图', en: 'Please enter a prompt or upload reference images', ja: 'プロンプトを入力するか参照画像をアップロードしてください', ko: '프롬프트를 입력하거나 참조 이미지를 업로드하세요' },

  styleTransferring: { zh: '风格迁移中...', en: 'Style transferring...', ja: 'スタイル変換中...', ko: '스타일 변환 중...' },

  styleTransferDone: { zh: '风格迁移完成', en: 'Style transfer done', ja: 'スタイル変換完了', ko: '스타일 변환 완료' },

  charSimplifyDone: { zh: '角色简化完成', en: 'Character simplify done', ja: 'キャラクター簡略化完了', ko: '캐릭터 단순화 완료' },

  skeletonDone: { zh: '骨架预览完成', en: 'Skeleton preview done', ja: 'スケルトンプレビュー完了', ko: '스켈레톤 미리보기 완료' },

  poseApiDone: { zh: 'API 姿势生成（模拟）', en: 'API pose gen (simulated)', ja: 'APIポーズ生成（シミュレーション）', ko: 'API 포즈 생성 (시뮬레이션)' },

  extractingFrames: { zh: '提取帧中...', en: 'Extracting frames...', ja: 'フレーム抽出中...', ko: '프레임 추출 중...' },

  extractDone: { zh: '提取完成', en: 'Extraction done', ja: '抽出完了', ko: '추출 완료' },

  processDone: { zh: '处理完成', en: 'Processing done', ja: '処理完了', ko: '처리 완료' },

  processFailed: { zh: '处理失败', en: 'Processing failed', ja: '処理に失敗しました', ko: '처리 실패' },

  detectDone: { zh: '相似帧检测完成', en: 'Similar frame detection done', ja: '類似フレーム検出完了', ko: '유사 프레임 감지 완료' },

  editFrame: { zh: '编辑帧', en: 'Edit Frame', ja: 'フレーム編集', ko: '프레임 편집' },

  playing: { zh: '播放中', en: 'Playing', ja: '再生中', ko: '재생 중' },

  paused: { zh: '已暂停', en: 'Paused', ja: '一時停止中', ko: '일시정지됨' },

  exportPreviewDone: { zh: '导出预览已生成', en: 'Export preview generated', ja: 'エクスポートプレビュー生成', ko: '내보내기 미리보기 생성됨' },

  clear: { zh: '清空', en: 'Clear', ja: 'クリア', ko: '비우기' },

  deleted: { zh: '已删除', en: 'Deleted', ja: '削除済み', ko: '삭제됨' },

  extractFailed: { zh: '提取失败', en: 'Extraction failed', ja: '抽出失敗', ko: '추출 실패' },

  clickGeneratePreview: { zh: '点击"生成预览"查看结果', en: 'Click "Generate Preview" to see results', ja: '「プレビュー生成」をクリックして結果を表示', ko: '"미리보기 생성"을 클릭하여 결과 확인' },

  gifInfo: { zh: 'GIF 信息', en: 'GIF Info', ja: 'GIF情報', ko: 'GIF 정보' },

  frameCount: { zh: '帧数', en: 'Frames', ja: 'フレーム数', ko: '프레임 수' },

  reuploadGif: { zh: '重新上传 GIF', en: 'Reupload GIF', ja: 'GIF再アップロード', ko: 'GIF 재업로드' },

  gifLoaded: { zh: 'GIF 已加载', en: 'GIF loaded', ja: 'GIF読み込み完了', ko: 'GIF 로드됨' },

  gifExtractDone: { zh: 'GIF 提取完成，共 {n} 帧', en: 'GIF extraction done, {n} frames', ja: 'GIF抽出完了（{n}フレーム）', ko: 'GIF 추출 완료, {n}프레임' },

  gifExtracting: { zh: '正在解码 GIF…', en: 'Decoding GIF…', ja: 'GIFをデコード中…', ko: 'GIF 디코딩 중…' },

  pleaseSelectGif: { zh: '请先选择 GIF 文件', en: 'Please select a GIF file first', ja: 'GIFファイルを選択してください', ko: 'GIF 파일을 먼저 선택하세요' },

  gifPlaying: { zh: 'GIF 播放中', en: 'GIF playing', ja: 'GIF再生中', ko: 'GIF 재생 중' },

  gifPaused: { zh: '已暂停', en: 'Paused', ja: '一時停止中', ko: '일시정지됨' },

  mapLoaded: { zh: '地图已加载', en: 'Map loaded', ja: 'マップ読み込み完了', ko: '맵 로드됨' },

  charLoaded: { zh: '角色已加载', en: 'Character loaded', ja: 'キャラクター読み込み完了', ko: '캐릭터 로드됨' },

  jsonExported: { zh: 'JSON 已导出', en: 'JSON exported', ja: 'JSONエクスポート完了', ko: 'JSON 내보내기 완료' },

  assetsExported: { zh: '资源库导出完成', en: 'Assets exported', ja: 'リソースエクスポート完了', ko: '리소스 내보내기 완료' },

  savedToLibrary: { zh: '已保存到资源库', en: 'Saved to library', ja: 'ライブラリに保存しました', ko: '라이브러리에 저장됨' },

  pixelProcessDone: { zh: '像素处理完成', en: 'Pixel process done', ja: 'ピクセル処理完了', ko: '픽셀 처리 완료' },

  pixelActionDone: { zh: '像素动作生成完成', en: 'Pixel action done', ja: 'ピクセルアクション生成完了', ko: '픽셀 액션 생성 완료' },

  importFromLibraryHint: { zh: '请从资源库选择图像', en: 'Select image from library', ja: 'ライブラリから画像を選択', ko: '라이브러리에서 이미지 선택' },

  videoStep1: { zh: '上传·裁剪·提取', en: 'Upload·Crop·Extract', ja: 'アップロード·クロップ·抽出', ko: '업로드·자르기·추출' },

  videoStep2: { zh: '处理提取帧', en: 'Process Frames', ja: 'フレーム処理', ko: '프레임 처리' },

  videoStep3: { zh: '导出处理结果', en: 'Export Results', ja: '結果エクスポート', ko: '결과 내보내기' },

  gifStep1: { zh: '上传·裁剪·提取', en: 'Upload·Crop·Extract', ja: 'アップロード·クロップ·抽出', ko: '업로드·자르기·추출' },

  gifStep2: { zh: '处理提取帧', en: 'Process Frames', ja: 'フレーム処理', ko: '프레임 처리' },

  gifStep3: { zh: '导出处理结果', en: 'Export Results', ja: '結果エクスポート', ko: '결과 내보내기' },

  imageStep1: { zh: '上传·裁剪·提取', en: 'Upload·Crop·Extract', ja: 'アップロード·クロップ·抽出', ko: '업로드·자르기·추출' },

  imageStep2: { zh: '处理提取帧', en: 'Process Frames', ja: 'フレーム処理', ko: '프레임 처리' },

  imageStep3: { zh: '导出处理结果', en: 'Export Results', ja: '結果エクスポート', ko: '결과 내보내기' },

  uploadMode: { zh: '上传方式', en: 'Upload Mode', ja: 'アップロード方式', ko: '업로드 방식' },

  uploadImagesMode: { zh: '多图上传', en: 'Multiple Images', ja: '複数画像', ko: '다중 이미지' },

  uploadSpriteMode: { zh: '精灵图裁剪', en: 'Sprite Sheet Slice', ja: 'スプライト分割', ko: '스프라이트 분할' },

  spriteSliceSettings: { zh: '裁剪设置', en: 'Slice Settings', ja: '分割設定', ko: '분할 설정' },

  sliceCols: { zh: '列数', en: 'Columns', ja: '列数', ko: '열 수' },

  sliceRows: { zh: '行数', en: 'Rows', ja: '行数', ko: '행 수' },

  slicePreview: { zh: '裁剪预览', en: 'Slice Preview', ja: '分割プレビュー', ko: '분할 미리보기' },

  sliceSprite: { zh: '裁剪为帧', en: 'Slice to Frames', ja: 'フレームに分割', ko: '프레임으로 분할' },

  spriteSliceHint: { zh: '上传一张精灵图，按列数和行数裁剪为多张独立帧图', en: 'Upload a sprite sheet, slice into individual frames by columns and rows', ja: 'スプライトシートをアップロードし、列数と行数で個別フレームに分割します', ko: '스프라이트 시트를 업로드하고 열과 행 수로 개별 프레임으로 분할합니다' },

  notImplemented: { zh: '未实现（当前为占位/模拟）', en: 'Not implemented (placeholder/simulated)', ja: '未実装（プレースホルダー）', ko: '미구현 (플레이스홀더)' },

  shapeTool: { zh: '形状', en: 'Shape', ja: '図形', ko: '도형' },

  shapeLine: { zh: '直线', en: 'Line', ja: '直線', ko: '직선' },

  shapeRect: { zh: '矩形', en: 'Rectangle', ja: '長方形', ko: '사각형' },

  shapeTriangle: { zh: '三角形', en: 'Triangle', ja: '三角形', ko: '삼각형' },

  shapeCircle: { zh: '圆形', en: 'Circle', ja: '円', ko: '원' },

  shapeEllipse: { zh: '椭圆形', en: 'Ellipse', ja: '楕円', ko: '타원' },

  shapeStar: { zh: '五角星', en: 'Star', ja: '星', ko: '별' },

  resetCanvasConfirm: { zh: '确定要重置画布吗？已绘制内容将清空。', en: 'Reset canvas? All drawn content will be cleared.', ja: 'キャンバスをリセットしますか？描画内容が消去されます。', ko: '캔버스를 초기화하시겠습니까? 그린 내용이 삭제됩니다.' },

  tileImportFromLibrary: { zh: '从资源库导入 tileset', en: 'Import tileset from library', ja: 'ライブラリからタイルセットをインポート', ko: '라이브러리에서 타일셋 가져오기' },

  pickerTitle: { zh: '选择资源', en: 'Select Asset', ja: 'リソースを選択', ko: '리소스 선택' },

  pickerFilterAll: { zh: '全部可选', en: 'All', ja: 'すべて', ko: '전체' },

}



function t(key: string): string {

  return langDict[key]?.[lang.value] || key

}

// 向子页面组件注入本地化函数
provide('t', t)





// 主题选项：暗夜、光亮、书籍、护眼、樱花

const themeOptions = [

  { key: 'dark' as const, label: '暗夜' },

  { key: 'light' as const, label: '光亮' },

  { key: 'book' as const, label: '书籍' },

  { key: 'eye-care' as const, label: '护眼' },

  { key: 'pink' as const, label: '樱花' },

]



// 当前激活的主题，与 Pinia store 同步

const activeTheme = computed(() => themeStore.theme)



// 设置主题，委托给 themeStore

function setTheme(key: 'dark' | 'light' | 'book' | 'eye-care' | 'pink') {

  themeStore.set(key)

}



// ==================== NAVIGATION ====================

const currentScreen = ref('home')

const sidebarCollapsed = ref(false)

// 当前页面标题：用于顶部面包屑展示
const currentScreenTitle = computed(() => {
  const titles: Record<string, string> = {
    home: t('home'),
    'ai-concept': t('aiWorkshop'),
    'media-process': t('mediaProcess'),
    'sequence-frame': t('seqWorkshop'),
    'sprite-normalizer': t('spriteNormalizer'),
    'resource-library': t('resourceLibrary'),
  }
  return titles[currentScreen.value] || currentScreen.value
})

// 最近资源预览：按创建时间倒序取前 6 个
const recentAssets = computed(() => {
  return [...assetsStore.assets].sort((a, b) => b.created - a.created).slice(0, 6)
})

const statusText = ref('就绪')

const statusExtra = ref('')



// 全局提示框（Toast）：网站同风格弹框，自动消失

const toastOpen = ref(false) // 是否显示提示框

const toastText = ref('') // 提示框文本

const toastType = ref<'info' | 'success' | 'warning' | 'error'>('info') // 提示框类型

let toastTimer: ReturnType<typeof setTimeout> | null = null // 自动关闭定时器

// 显示提示框：3 秒后自动关闭

function showToast(text: string, type: 'info' | 'success' | 'warning' | 'error' = 'success') {

  toastText.value = text // 设置文本

  toastType.value = type // 设置类型

  toastOpen.value = true // 显示

  if (toastTimer) clearTimeout(toastTimer) // 清除旧定时器

  toastTimer = setTimeout(() => { toastOpen.value = false }, 3000) // 3秒后自动关闭

}

// 子组件状态栏事件
function setStatus(msg: string) { statusText.value = msg }

// 子组件加载层事件
function setLoading(open: boolean, text = '') {
  loadingOpen.value = open
  loadingText.value = text
}

// 子组件资源选择事件
function onPickAsset(type: string, callback: (asset: any) => void, keepOpen = false) {
  openAssetPicker(type, callback, keepOpen)
}




// 通用弹框（Dialog）：需要用户确认的提示

const dialogOpen = ref(false) // 是否显示弹框

const dialogText = ref('') // 弹框文本

// 显示弹框

function showDialog(text: string) {

  dialogText.value = text

  dialogOpen.value = true

}



// 确认弹框（ConfirmDialog）状态与回调

const confirmDialogOpen = ref(false)

const confirmDialogTitle = ref('')

const confirmDialogText = ref('')

const confirmDialogOkText = ref('')

const confirmDialogCancelText = ref('')

function onConfirmDialogOk() {

  confirmDialogOpen.value = false

}

function onConfirmDialogCancel() {

  confirmDialogOpen.value = false

}



const groups = reactive({ ai: true, media: true, frame: true, normalizer: true })



const aiTab = ref('')

const aiTabs: { key: string; labelKey: string }[] = [

  // { key: 'txt2img', labelKey: 'txt2img' }, // 创建素材模块暂时隐藏

  // { key: 'style', labelKey: 'styleTransfer' }, // 暂时隐藏画风迁移

  // { key: 'simplify', labelKey: 'charSimplify' }, // 暂时隐藏角色简化

  // { key: 'pose', labelKey: 'poseGen' }, // 暂时隐藏姿势生成

]

const seqTab = ref('video')

// 媒体处理当前子标签（当前仅开放图片处理）

const mediaTab = ref('image')



const apiOpen = ref(false)

const apiProvider = ref('tongyi')

const apiEndpoint = ref('')

const apiModel = ref('')

const apiKey = ref('')

const apiExtra = ref('')

const apiAvailableModels = ref<string[]>([]) // 从 API 地址获取到的可用模型列表

const apiFetchingModels = ref(false) // 是否正在获取模型列表



// API 配置方案相关状态

interface ApiConfigProfile {

  id: string // 方案唯一标识

  name: string // 方案显示名称

  provider: string // 服务提供商

  endpoint: string // API 端点

  model: string // 模型名称

  key: string // API Key

  extra: string // 额外参数 JSON 字符串

}

const apiProfiles = ref<ApiConfigProfile[]>([]) // 已保存的配置方案列表

const apiProfileId = ref('') // 当前选中的方案 ID

const apiProfileName = ref('') // 当前编辑的方案名称

const apiErrors = reactive({ name: false, url: false, model: false, key: false }) // API 配置必填项校验状态



const helpOpen = ref(false)

const helpText = ref('')

const loadingOpen = ref(false)

const loadingText = ref('')



function navigate(screen: string) { currentScreen.value = screen; statusText.value = t('ready') }

function goSub(screen: string, tab: string) {

  currentScreen.value = screen

  if (screen === 'ai-concept') aiTab.value = tab

  if (screen === 'sequence-frame') seqTab.value = tab

  statusText.value = t('ready')

}

// 保存当前 API 配置为一个方案：若已选中方案则更新，否则新建

function saveApiProfile() {

  // 校验必填项

  apiErrors.name = !apiProfileName.value.trim()

  apiErrors.url = !apiEndpoint.value.trim()

  apiErrors.model = !apiModel.value.trim()

  apiErrors.key = !apiKey.value.trim()

  if (apiErrors.name || apiErrors.url || apiErrors.model || apiErrors.key) {

    showToast(t('apiRequiredFields'), 'warning')

    return

  }

  const profile: ApiConfigProfile = {

    id: apiProfileId.value || Date.now().toString(), // 无 ID 时生成时间戳 ID

    name: apiProfileName.value.trim() || `${apiProvider.value} - ${apiModel.value || t('customProfile')}`, // 未命名则自动生成名称

    provider: apiProvider.value,

    endpoint: apiEndpoint.value,

    model: apiModel.value,

    key: apiKey.value,

    extra: apiExtra.value,

  }

  const idx = apiProfiles.value.findIndex(p => p.id === profile.id)

  if (idx >= 0) apiProfiles.value[idx] = profile // 更新已有方案

  else apiProfiles.value.push(profile) // 添加新方案

  apiProfileId.value = profile.id // 设置为当前选中

  localStorage.setItem('af_api_profiles', JSON.stringify(apiProfiles.value)) // 持久化到 localStorage

  showToast(t('apiProfileSaved'), 'success') // 显示保存成功提示

}



// 选择并应用某个 API 配置方案到当前编辑区

function selectApiProfile(id: string) {

  const profile = apiProfiles.value.find(p => p.id === id)

  if (!profile) { // 选择空项时清空方案关联，保留当前输入

    apiProfileId.value = ''

    apiProfileName.value = ''

    return

  }

  apiProfileId.value = profile.id

  apiProfileName.value = profile.name

  apiProvider.value = profile.provider

  apiEndpoint.value = profile.endpoint

  apiModel.value = profile.model

  apiKey.value = profile.key

  apiExtra.value = profile.extra

}



// 诊断 fetch 错误，给出更具体的网络/安全原因提示
function diagnoseFetchError(err: Error, target: string): string {
  const msg = err.message || ''
  const isHttpsPage = typeof location !== 'undefined' && location.protocol === 'https:'
  const isHttpTarget = target.startsWith('http://')
  // 当前页面 HTTPS，目标 HTTP：浏览器会因混合内容策略直接拦截，后端收不到请求
  if (isHttpsPage && isHttpTarget) {
    return msg + '\n\n可能原因：当前页面通过 HTTPS 打开，而 API 地址是 HTTP，浏览器安全策略会阻止该请求发送。请将 API 地址改为 HTTPS，或在本地 http://localhost 开发环境下测试。'
  }
  // 常见跨域/网络被拦截提示
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS') || msg.includes('cross-origin')) {
    return msg + '\n\n可能原因：浏览器 CORS 策略拦截，或服务未启动、端口不通、请求被防火墙/插件阻止。请确认 API 服务已运行并允许跨域，或在浏览器控制台查看 Network 标签页获取详情。'
  }
  return msg
}

// 从 API 地址获取可用模型列表（OpenAI 兼容 /v1/models，SD WebUI /sdapi/v1/sd-models）
async function fetchApiModels() {
  const raw = apiEndpoint.value.trim()
  if (!raw) { showDialog(t('apiEndpoint') + ' 不能为空'); return }
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) { showDialog(t('apiEndpoint') + ' 必须以 http:// 或 https:// 开头'); return }
  const url = raw.replace(/\/$/, '')
  const target = apiProvider.value === 'sd' ? url + '/sdapi/v1/sd-models' : url + '/v1/models'
  apiFetchingModels.value = true
  apiAvailableModels.value = []
  try {
    console.log('[fetchApiModels] 开始请求', target)
    // SD WebUI 接口
    if (apiProvider.value === 'sd') {
      const res = await fetch(target, { mode: 'cors' })
      const text = await res.text()
      console.log('[fetchApiModels] SD 响应', res.status, text.slice(0, 200))
      if (!res.ok) throw new Error(text || res.status + ' ' + res.statusText)
      const data = JSON.parse(text)
      apiAvailableModels.value = (data || []).map((m: any) => m.model_name || m.title || String(m)).filter(Boolean)
    } else {
      // OpenAI 兼容接口
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey.value.trim()) headers['Authorization'] = 'Bearer ' + apiKey.value.trim()
      // 打印请求头（隐藏 API Key 大部分内容，仅保留前 15 位便于排查）
      const logHeaders = { ...headers }
      if (logHeaders.Authorization) logHeaders.Authorization = logHeaders.Authorization.slice(0, 15) + '...'
      console.log('[fetchApiModels] OpenAI 请求头', logHeaders)
      const res = await fetch(target, { mode: 'cors', headers })
      const text = await res.text()
      console.log('[fetchApiModels] OpenAI 响应', res.status, text.slice(0, 200))
      if (!res.ok) throw new Error(text || res.status + ' ' + res.statusText)
      const data = JSON.parse(text)
      apiAvailableModels.value = (data.data || data.models || data || []).map((m: any) => m.id || m.model || m.name || String(m)).filter(Boolean)
    }
    if (!apiAvailableModels.value.length) throw new Error('返回为空')
  } catch (e) {
    const err = e as Error
    console.error('[fetchApiModels] 失败', target, err)
    showDialog(t('fetchModelsFailed') + ': ' + diagnoseFetchError(err, target) + '\n目标地址: ' + target)
  } finally {
    apiFetchingModels.value = false
  }
}



// 删除指定 API 配置方案

function deleteApiProfile(id: string) {

  apiProfiles.value = apiProfiles.value.filter(p => p.id !== id) // 过滤掉要删除的方案

  localStorage.setItem('af_api_profiles', JSON.stringify(apiProfiles.value)) // 重新持久化

  if (apiProfileId.value === id) { // 若删除的是当前选中方案，则清空编辑区

    apiProfileId.value = ''

    apiProfileName.value = ''

    apiProvider.value = 'tongyi'

    apiEndpoint.value = ''

    apiModel.value = ''

    apiKey.value = ''

    apiExtra.value = ''

  }

  showToast(t('apiProfileDeleted'), 'info') // 显示删除提示

}

// ==================== ASSET PICKER ====================

// 打开资源选择器，按类型过滤并委托给全局资源库 store

function openAssetPicker(filterType: string, cb: (asset: any) => void, keepOpen = false) {

  assetsStore.openPicker(filterType, cb, keepOpen)

}



// ==================== LIFECYCLE ====================

onMounted(() => {

  // 从 localStorage 加载已保存的 API 配置方案

  try {

    const raw = localStorage.getItem('af_api_profiles')

    if (raw) apiProfiles.value = JSON.parse(raw)

  } catch { /* 忽略解析错误 */ }

  themeStore.init(); assetsStore.loadAssets()

  const onHelp = (e: Event) => { helpText.value = (e as CustomEvent).detail; helpOpen.value = true }

  window.addEventListener('af-open-help', onHelp)

})



onUnmounted(() => {

  /* 暂无全局键盘监听需要清理 */

})

</script>



<style scoped>

.btn-primary { @apply inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium bg-af-accent text-black border border-af-accent hover:brightness-110 transition-all disabled:opacity-60; }

.btn-secondary { @apply inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium bg-af-surface-hover text-af-ink border border-af-rule hover:border-af-muted transition-all; }

.btn-danger { @apply inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium bg-[#ff4d4d] text-white border border-[#ff4d4d] hover:brightness-110 transition-all; }

.btn-sm { @apply px-2.5 py-1 text-xs; }

.form-group { @apply mb-3 flex-1 min-w-[120px]; }

.form-label { @apply block text-xs font-medium text-af-muted mb-1.5; }

.form-input { @apply w-full bg-af-bg border border-af-rule rounded-md py-1.5 px-2.5 text-af-ink text-sm outline-none focus:border-af-accent; }

.form-input::placeholder { color: var(--af-muted); opacity: 0.6; }

.form-select { @apply w-full bg-af-bg border border-af-rule rounded-md py-1.5 px-2.5 text-af-ink text-sm outline-none focus:border-af-accent cursor-pointer; }

.form-textarea { @apply w-full bg-af-bg border border-af-rule rounded-md py-1.5 px-2.5 text-af-ink text-sm outline-none focus:border-af-accent resize-y min-h-[60px]; }

.form-textarea::placeholder { color: var(--af-muted); opacity: 0.6; }

.form-row { @apply flex gap-2.5 flex-wrap; }

.panel-title { @apply text-[13px] font-semibold mb-2.5 text-af-ink flex items-center gap-2; }

.preview-box { @apply bg-af-surface border border-af-rule rounded-lg min-h-[280px] flex items-center justify-center text-af-muted text-sm relative overflow-hidden; }

.preview-label { @apply absolute top-2 left-2.5 text-[10px] font-semibold uppercase tracking-wider text-af-muted bg-black/70 px-2 py-0.5 rounded pointer-events-none; }

.slider-wrap { @apply flex items-center gap-2.5; }

.slider-value { @apply w-12 text-right font-mono text-[13px] text-af-ink; }

.steps-bar { @apply flex gap-2 mb-3 flex-wrap; }

.step-pill { @apply flex items-center gap-2 px-3.5 py-2 rounded-full bg-af-bg border border-af-rule text-af-muted text-[13px] font-medium transition-colors; }

.step-pill.active { @apply border-af-accent text-af-accent bg-af-accent-soft; }

.step-num { @apply w-[22px] h-[22px] rounded-full bg-af-surface-hover text-af-muted flex items-center justify-center text-[11px] font-bold; }

.step-pill.active .step-num { @apply bg-af-accent text-black; }

.image-pixelated { image-rendering: pixelated; }

/* Toast 提示框滑入滑出动画 */

.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.3s ease; }

.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateX(40px); }

</style>