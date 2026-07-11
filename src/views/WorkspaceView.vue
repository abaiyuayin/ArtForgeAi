<template>

  <div class="flex flex-col h-screen overflow-hidden text-sm text-af-ink bg-af-bg font-sans">

    <!-- Header -->

    <!-- 顶部导航栏：左侧显示品牌与当前页面标题，右侧放置语言/主题/API/资源库入口 -->
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

            <!-- 序列帧预览与瓦片双网格模块暂时隐藏 -->
            <SidebarItem v-if="false" :label="t('topdownPreview')" :active="currentScreen === 'map-editor' && mapTab === 'preview'" @click="goSub('map-editor','preview')" />

            <SidebarItem v-if="false" :label="t('tileDualGrid')" :active="currentScreen === 'map-editor' && mapTab === 'tilemap'" @click="goSub('map-editor','tilemap')" />

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

          <span v-if="!sidebarCollapsed" class="text-[11px] text-af-muted px-2.5">v0.4</span>

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

                  <!-- AI 生成 / 创建素材模块暂时隐藏 -->
                  <div v-if="false" class="bg-af-surface border border-af-rule rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-af-accent hover:shadow-md hover:-translate-y-0.5 group" @click="goSub('ai-concept','txt2img')">
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




                  <!-- 地图编辑器模块暂时隐藏 -->
                  <div v-if="false" class="bg-af-surface border border-af-rule rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-af-accent2 hover:shadow-md hover:-translate-y-0.5 group" @click="goSub('map-editor','tilemap')">
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

            </section>



            <!-- AI CONCEPT -->

            <section v-show="currentScreen === 'ai-concept'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0">

                <div><h1 class="text-[22px] font-bold tracking-tight">{{ t('aiWorkshop') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('aiWorkshopDesc') }}</p></div>

                <div class="flex items-center gap-2">

                  <select v-model="apiProfileId" class="form-select w-44" @change="selectApiProfile(apiProfileId)">

                    <option value="">{{ t('noProfile') }}</option>

                    <option v-for="p in apiProfiles" :key="p.id" :value="p.id">{{ p.name }}</option>

                  </select>

                  <button class="btn-secondary inline-flex items-center gap-1.5 w-[200px] justify-center" @click="apiOpen = true">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-10-10 10 10 0 0 1 10-10z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {{ t('apiConfig') }}
                </button>

                </div>

              </div>

              <div class="flex-1 overflow-y-auto px-5 pb-4">

                <div class="flex gap-2 mb-3 flex-wrap">

                  <button v-for="tb in aiTabs" :key="tb.key" class="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors" :class="aiTab === tb.key ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'bg-af-surface border-af-rule text-af-muted hover:text-af-ink hover:border-af-ink/30'" @click="aiTab = tb.key">{{ t(tb.labelKey) }}</button>

                </div>



                <!-- 创建素材 / txt2img 模块暂时隐藏 -->
                <div v-if="false && aiTab === 'txt2img'" class="flex gap-3 items-start">
                  <div class="flex-1 min-w-0 space-y-3">
                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">
                      <div class="panel-title"><span>{{ t('prompt') }}</span><HelpBtn :text="t('txt2imgHelp')" /></div>
                      <textarea v-model="t2i.prompt" rows="3" :placeholder="t('promptPlaceholder')" class="form-textarea mb-3"></textarea>
                      <div class="form-group"><label class="form-label">{{ t('negativePrompt') }}</label><textarea v-model="t2i.negative" rows="2" class="form-textarea"></textarea></div>
                      <div class="form-group mt-3">
                        <label class="form-label">{{ t('refImage') }}<HelpBtn :text="t('refImageHelp')" /></label>
                        <UploadZone accept="image/*" multiple :prompt="t('refImagePrompt')" @files="t2i.refs = $event; previewT2iRefs()" />
                        <div v-if="t2i.refPreviews.length" class="flex flex-wrap gap-1.5 mt-2"><img v-for="(u,i) in t2i.refPreviews" :key="i" :src="u" class="w-16 h-16 object-cover rounded border border-af-rule" /></div>
                      </div>
                      <div class="flex gap-2 mt-3 items-center flex-wrap">
                        <button class="btn-primary" :disabled="t2i.generating" @click="generateTxt2Img">{{ t2i.generating ? t('generating') : t('generateImage') }}</button>
                        <div class="flex items-center gap-2">
                          <label class="text-xs text-af-muted">{{ t('generateCount') }}</label>
                          <select v-model.number="t2i.count" class="form-select w-[70px] text-xs" :disabled="t2i.generating">
                            <option v-for="n in 4" :key="n" :value="n">{{ n }}</option>
                          </select>
                        </div>
                      </div>
                      <div v-if="t2i.progress > 0" class="h-1 bg-af-bg rounded overflow-hidden mt-3"><div class="h-full rounded bg-gradient-to-r from-af-accent to-af-accent2 transition-all" :style="{ width: t2i.progress + '%' }"></div></div>
                    </div>
                    <div class="text-[13px] font-semibold mb-2">{{ t('results') }} ({{ t2i.resultUrls.length }})</div>
                    <div v-if="t2i.resultUrls.length" class="grid grid-cols-2 gap-3">
                      <div v-for="(url, idx) in t2i.resultUrls" :key="idx" class="bg-af-surface border border-af-rule rounded-lg aspect-square overflow-hidden relative group cursor-pointer" @click="openPreview(url)">
                        <img :src="url" class="w-full h-full object-cover" />
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button class="w-7 h-7 rounded-md bg-white/15 text-white flex items-center justify-center" @click.stop="saveToLibrary(url, 'output')"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></button>
                        </div>
                      </div>
                    </div>
                    <div v-else class="bg-af-surface border border-af-rule rounded-lg aspect-square w-full max-w-[300px] flex items-center justify-center text-xs text-af-muted">{{ t('waiting') }}</div>
                  </div>
                  <div class="w-[260px] shrink-0 bg-af-bg border border-af-rule rounded-lg p-3.5 flex flex-col h-fit max-h-[calc(100vh-180px)]">
                    <div class="panel-title mb-2">{{ t('t2iHistory') }}</div>
                    <div v-if="!t2iHistory.length" class="text-xs text-af-muted py-4 text-center">{{ t('t2iHistoryEmpty') }}</div>
                    <div v-else class="flex flex-col gap-2 overflow-y-auto pr-1">
                      <div v-for="(h, i) in t2iHistory" :key="i" class="bg-af-surface border border-af-rule rounded-lg p-2 cursor-pointer hover:border-af-accent transition-colors" @click="loadT2iHistory(h)">
                        <img :src="h.resultUrls[0]" class="w-full aspect-square object-cover rounded-md bg-[#0e0e14] mb-2" />
                        <div class="text-[11px] text-af-muted line-clamp-2">{{ h.prompt }}</div>
                        <div v-if="h.refPreviews.length" class="flex gap-1 mt-1"><img v-for="(u, ri) in h.refPreviews.slice(0,3)" :key="ri" :src="u" class="w-5 h-5 object-cover rounded border border-af-rule" /></div>
                      </div>
                    </div>
                  </div>
                </div>



                <!-- 画风迁移：上传目标图与风格参考图，生成风格化结果 -->

                <div v-if="aiTab === 'style'" class="space-y-3">

                  <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                    <div class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 items-start">

                      <div><div class="panel-title">{{ t('targetImage') }}</div><div class="preview-box h-[220px] relative"><UploadZone v-if="!st.targetUrl" accept="image/*" :prompt="t('uploadTargetImage')" class="absolute inset-0" @files="loadStTarget($event)" /><img v-else :src="st.targetUrl" class="max-w-full max-h-full object-contain" /><button v-if="st.targetUrl" class="absolute bottom-2 left-1/2 -translate-x-1/2 btn-secondary btn-sm z-10" @click="st.targetUrl = ''">{{ t('reupload') }}</button></div></div>

                      <div><div class="panel-title">{{ t('styleRef') }}</div><div class="preview-box h-[220px] relative"><UploadZone v-if="!st.styleUrl" accept="image/*" :prompt="t('uploadStyleRef')" class="absolute inset-0" @files="loadStStyle($event)" /><img v-else :src="st.styleUrl" class="max-w-full max-h-full object-contain" /><button v-if="st.styleUrl" class="absolute bottom-2 left-1/2 -translate-x-1/2 btn-secondary btn-sm z-10" @click="st.styleUrl = ''">{{ t('reupload') }}</button></div></div>

                      <div><div class="panel-title">{{ t('previewResult') }}</div><div class="preview-box h-[220px]"><img v-if="st.resultUrl" :src="st.resultUrl" class="max-w-full max-h-full object-contain" /><span v-else class="text-af-muted text-sm">{{ t('previewResultPlaceholder') }}</span></div></div>

                    </div>

                    <div class="form-group mt-3"><label class="form-label">{{ t('styleDesc') }}</label><textarea v-model="st.prompt" rows="2" :placeholder="t('styleDescPlaceholder')" class="form-textarea"></textarea></div>

                    <div class="flex gap-2 flex-wrap mt-3">

                      <button class="btn-primary" :disabled="st.running" :title="t('notImplemented')" @click="runStyleTransfer">{{ st.running ? t('transferring') : t('startTransfer') }}</button>

                      <button class="btn-secondary" @click="frontendStyleTransfer">{{ t('frontendColorTransfer') }}</button>

                      <button v-if="st.resultUrl" class="btn-secondary" @click="saveToLibrary(st.resultUrl, 'output')">{{ t('saveToLibrary') }}</button>

                    </div>

                  </div>

                </div>



                <!-- char simplify -->

                <div v-if="aiTab === 'simplify'" class="space-y-3">

                  <div class="flex gap-3 flex-wrap min-h-[320px]">

                    <div class="flex-1 min-w-[260px]"><div class="preview-box h-[320px] relative"><span class="preview-label">{{ t('original') }}</span><UploadZone v-if="!cs.sourceUrl" accept="image/*" :prompt="t('uploadCharImage')" class="w-[90%] h-[90%]" @files="loadCharSimplify($event)" /><img v-else :src="cs.sourceUrl" class="max-w-full max-h-full object-contain" /></div></div>

                    <div class="flex-1 min-w-[260px]"><div class="preview-box h-[320px] relative"><span class="preview-label">{{ t('result') }}</span><img v-if="cs.resultUrl" :src="cs.resultUrl" class="max-w-full max-h-full object-contain" /><span v-else class="text-af-muted text-sm">{{ t('processingResult') }}</span></div></div>

                  </div>

                  <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                    <div class="panel-title"><span>{{ t('simplifyLevel') }}</span><HelpBtn :text="t('simplifyHelp')" /></div>

                    <div class="flex gap-1"><button v-for="l in simplifyLevels" :key="l.key" class="flex-1 px-2 py-1.5 rounded-md text-xs border transition-colors" :class="cs.level === l.key ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'bg-af-bg border-af-rule text-af-muted hover:text-af-ink'" @click="cs.level = l.key">{{ l.label }}</button></div>

                    <div class="form-row mt-3">

                      <div class="form-group"><label class="form-label">{{ t('targetWidth') }}</label><input v-model.number="cs.width" type="number" min="16" max="512" class="form-input" /></div>

                      <div class="form-group"><label class="form-label">{{ t('targetHeight') }}</label><input v-model.number="cs.height" type="number" min="16" max="512" class="form-input" /></div>

                      <div class="form-group"><label class="form-label">{{ t('colors') }}</label><input v-model.number="cs.colors" type="number" min="2" max="64" class="form-input" /></div>

                      <div class="form-group"><label class="form-label">{{ t('quality') }}</label><input v-model.number="cs.quality" type="number" min="10" max="100" class="form-input" /></div>

                    </div>

                    <div v-if="cs.progress > 0" class="h-1 bg-af-bg rounded overflow-hidden mt-3"><div class="h-full rounded bg-gradient-to-r from-af-accent to-af-accent2 transition-all" :style="{ width: cs.progress + '%' }"></div></div>

                    <div class="flex gap-2 mt-3">

                      <button class="btn-primary" :disabled="cs.running" @click="processCharSimplify">{{ cs.running ? t('processing') : t('process') }}</button>

                      <button v-if="cs.resultUrl" class="btn-secondary" @click="saveToLibrary(cs.resultUrl, 'output')">{{ t('saveToLibrary') }}</button>

                    </div>

                  </div>

                </div>



                <!-- pose gen -->

                <div v-if="aiTab === 'pose'" class="space-y-3">

                  <div class="flex gap-3 flex-wrap min-h-[300px]">

                    <div class="flex-1 min-w-[260px]"><div class="preview-box h-[300px] relative"><span class="preview-label">{{ t('charUpload') }}</span><UploadZone v-if="!pg.sourceUrl" accept="image/*" :prompt="t('uploadCharImage')" class="w-[90%] h-[90%]" @files="loadPose($event)" /><img v-else :src="pg.sourceUrl" class="max-w-full max-h-full object-contain" /><button v-if="pg.sourceUrl" class="absolute bottom-2 left-1/2 -translate-x-1/2 btn-secondary btn-sm z-10" @click="pg.sourceUrl = ''">{{ t('reupload') }}</button></div></div>

                    <div class="flex-1 min-w-[260px]"><div class="preview-box h-[300px] relative"><span class="preview-label">{{ t('posePreview') }}</span><canvas v-if="pg.resultCanvas" ref="pgResultCanvas" class="max-w-full max-h-full"></canvas><span v-else class="text-af-muted text-sm">{{ t('posePreviewPlaceholder') }}</span></div></div>

                  </div>

                  <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                    <div class="form-group"><label class="form-label">{{ t('posePreset') }}<HelpBtn :text="t('poseHelp')" /></label></div>

                    <div class="flex flex-wrap gap-1.5">

                      <button v-for="p in posePresets" :key="p" class="px-3 py-1 rounded-full text-xs border transition-colors" :class="pg.pose === p ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'bg-af-bg border-af-rule text-af-muted hover:text-af-ink'" @click="pg.pose = p">{{ poseNames[p] }}</button>

                    </div>

                    <div class="flex gap-2 mt-3"><button class="btn-primary" @click="generatePoseFrontend">{{ t('previewSkeleton') }}</button><button class="btn-secondary" :title="t('notImplemented')" @click="generatePoseApi">{{ t('apiGenerate') }}</button></div>

                  </div>

                </div>﻿

              </div>

            </section>



            <!-- 媒体处理：图片处理与视频处理独立分类 -->

            <section v-show="currentScreen === 'media-process'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0">

                <div><h1 class="text-[22px] font-bold tracking-tight">{{ t('mediaProcess') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('mediaProcessDesc') }}</p></div>

              </div>

              <div class="flex-1 overflow-y-auto px-5 pb-4">

                <div class="flex gap-2 mb-3 flex-wrap">

                  <button v-for="tb in mediaTabs" :key="tb.key" class="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors" :class="mediaTab === tb.key ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'bg-af-surface border-af-rule text-af-muted hover:text-af-ink hover:border-af-ink/30'" @click="mediaTab = tb.key">{{ t(tb.labelKey) }}</button>

                </div>

                <!-- 图片处理：裁剪模式与抠图模式 -->

                <div v-if="mediaTab === 'image'" class="space-y-3">

                  <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                    <!-- 图片处理子模块标签：对齐视频处理的标签样式 -->

                    <div class="flex gap-2 mb-3 flex-wrap">

                      <button v-for="tb in mtTabs" :key="tb.key" class="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors" :class="mt.tab === tb.key ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'bg-af-surface border-af-rule text-af-muted hover:text-af-ink hover:border-af-ink/30'" @click="mt.tab = tb.key; onMtModeChange()">{{ t(tb.labelKey) }}</button>

                    </div>

                    <div class="form-row">

                      <div v-if="mt.tab === 'crop'" class="form-group">

                        <label class="form-label">{{ t('cropSubMode') }}</label>

                        <select v-model="mt.cropSubMode" class="form-select" @change="initMtSource">

                          <option value="grid">{{ t('cropGrid') }}</option>

                          <option value="manual">{{ t('cropManual') }}</option>

                        </select>

                      </div>

                      <div v-if="mt.tab === 'crop' && mt.cropSubMode === 'grid'" class="form-group">

                        <label class="form-label">{{ t('gridCols') }}</label>

                        <input v-model.number="mt.gridSize" type="number" min="1" max="20" class="form-input" @change="initMtSource" />

                        <div class="text-[11px] text-af-muted mt-1.5">{{ t('gridShiftHint') }}</div>

                      </div>

                    </div>

                    <div class="flex gap-3 flex-wrap min-h-[320px] mt-3">

                      <div class="flex-1 min-w-[260px]">

                        <div class="panel-title">{{ mt.tab === 'matting' ? t('mattingSource') : t('originalImage') }}</div>

                        <!-- 抠图模式：无 object-contain，原始尺寸展示 + 溢出滚动；裁剪模式：object-contain 自适应 -->

                        <div class="preview-box h-[400px] relative overflow-auto" @wheel.prevent="onMtWheel" @contextmenu.prevent @mousedown="onMtMouseDown" @mousemove="onMtMouseMove" @mouseup="onMtMouseUp" @mouseleave="onMtMouseUp">

                          <UploadZone v-if="!mt.sourceUrl" accept="image/*" :prompt="t('uploadCropImage')" class="w-[90%] h-[90%]" @files="loadMtImage($event)" />

                          <canvas v-else ref="mtSourceCanvas" class="object-contain image-pixelated" :class="mt.tab === 'matting' ? 'cursor-crosshair' : 'cursor-crosshair'" :style="mt.tab === 'matting' ? { transform: `translate(${mt.panX}px, ${mt.panY}px) scale(${mt.zoom})`, transformOrigin: 'center center', maxWidth: 'none', maxHeight: 'none' } : { maxWidth: '100%', maxHeight: '100%' }" ></canvas>

                          <!-- 手动框选裁剪框：四角拖拽手柄，对齐视频裁剪 -->

                          <div v-if="mt.tab==='crop' && mt.cropSubMode==='manual' && mt.cropW>0" class="absolute border-2 border-af-accent pointer-events-none" :style="mtCropStyleOverlay">

                            <div class="absolute -top-1.5 -left-1.5 w-3 h-3 bg-af-accent cursor-nw-resize pointer-events-auto" @mousedown.stop="startMtCropResize($event,'nw')"></div>

                            <div class="absolute -top-1.5 -right-1.5 w-3 h-3 bg-af-accent cursor-ne-resize pointer-events-auto" @mousedown.stop="startMtCropResize($event,'ne')"></div>

                            <div class="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-af-accent cursor-sw-resize pointer-events-auto" @mousedown.stop="startMtCropResize($event,'sw')"></div>

                            <div class="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-af-accent cursor-se-resize pointer-events-auto" @mousedown.stop="startMtCropResize($event,'se')"></div>

                          </div>

                        </div>

                        <div v-if="mt.tab === 'crop' && mt.cropSubMode === 'grid' && mt.sourceUrl" class="text-xs text-af-muted mt-1.5">{{ t('selectCropArea') }}</div>

                        <div v-if="mt.tab === 'matting' && mt.sourceUrl" class="text-xs text-af-muted mt-1.5">{{ t('mattingPickHint') }} | {{ t('zoom') }} {{ mt.zoom }}x</div>

                      </div>

                      <div class="flex-1 min-w-[260px]">

                        <div class="panel-title">{{ mt.tab === 'matting' ? t('mattingResult') : t('cropResult') }}</div>

                        <div class="preview-box h-[400px] flex items-center justify-center relative overflow-hidden" @wheel.prevent="onMtResultWheel" @contextmenu.prevent @mousedown="onMtResultMouseDown" @mousemove="onMtResultMouseMove" @mouseup="onMtResultMouseUp" @mouseleave="onMtResultMouseUp">

                          <canvas v-show="mt.resultUrl" ref="mtResultCanvas" class="object-contain image-pixelated" :style="{ transform: `translate(${mt.resultPanX}px, ${mt.resultPanY}px) scale(${mt.resultZoom})`, transformOrigin: 'center center', maxWidth: 'none', maxHeight: 'none' }"></canvas>

                          <span v-show="!mt.resultUrl" class="text-af-muted text-sm absolute">{{ mt.tab === 'matting' ? t('mattingClickHint') : t('processingResult') }}</span>

                        </div>

                      </div>

                    </div>

                    <!-- 抠图模式参数面板 -->

                    <div v-if="mt.tab === 'matting' && mt.sourceUrl" class="bg-af-bg border border-af-rule rounded-lg p-3.5 mt-3">

                      <div class="panel-title">{{ t('mattingMode') }}</div>

                      <select v-model="mt.mattingSubMode" class="form-select mb-3" @change="applyMtMattingPreview">

                        <option value="flood">{{ t('mattingFlood') }}</option>

                        <option value="global">{{ t('mattingGlobal') }}</option>

                        <option value="smart">{{ t('mattingSmart') }}</option>

                      </select>

                      <div class="form-row">

                        <div class="form-group"><label class="form-label">{{ t('keyColor') }}</label><div class="flex items-center gap-2"><input v-model="mt.mattingKey" type="color" class="w-10 h-10 rounded-md border-0 cursor-pointer bg-transparent" @change="applyMtMattingPreview"><span class="font-mono text-[12px] text-af-muted">{{ mt.mattingKey }}</span></div></div>

                        <div class="form-group"><label class="form-label">{{ t('tolerance') }} {{ mt.mattingTolerance }}</label><input v-model.number="mt.mattingTolerance" type="range" min="0" max="120" class="w-full accent-af-accent h-1" @change="applyMtMattingPreview"></div>

                        <div class="form-group"><label class="form-label">{{ t('feather') }} {{ mt.mattingFeather }}</label><input v-model.number="mt.mattingFeather" type="range" min="0" max="20" class="w-full accent-af-accent h-1" @change="applyMtMattingPreview"></div>

                        <div class="form-group"><label class="form-label">{{ t('edgeErosion') }} {{ mt.mattingEdge }}</label><input v-model.number="mt.mattingEdge" type="range" min="-10" max="10" class="w-full accent-af-accent h-1" @change="applyMtMattingPreview"></div>

                        <div v-if="mt.mattingSubMode === 'smart'" class="form-group"><label class="form-label">{{ t('clusters') }}</label><input v-model.number="mt.mattingClusters" type="number" min="2" max="16" class="form-input" @change="applyMtMattingPreview"></div>

                      </div>

                    </div>

                    <div class="flex gap-2 flex-wrap mt-3">

                      <button class="btn-primary" :disabled="!mt.sourceUrl" @click="applyMtCrop">{{ mt.tab === 'matting' ? t('mattingApply') : t('cropApply') }}</button>

                      <button class="btn-secondary" :disabled="!mt.resultUrl" @click="downloadMtResult">{{ t('cropDownload') }}</button>

                      <button class="btn-secondary" :disabled="!mt.sourceUrl" @click="resetMtCrop">{{ t('cropReset') }}</button>

                      <button v-if="mt.resultUrl" class="btn-secondary" @click="saveToLibrary(mt.resultUrl, 'output')">{{ t('saveToLibrary') }}</button>

                    </div>

                  </div>

                </div>

                <!-- 视频处理：视频抠图、裁剪、转音频、转GIF -->

                <div v-if="mediaTab === 'video'" class="space-y-3">

                  <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                    <div class="flex gap-2 mb-3 flex-wrap">

                      <button v-for="tb in vpTabs" :key="tb.key" class="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors" :class="vp.tab === tb.key ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'bg-af-surface border-af-rule text-af-muted hover:text-af-ink hover:border-af-ink/30'" @click="vp.tab = tb.key">{{ t(tb.labelKey) }}</button>

                    </div>

                    <div v-if="!vp.file" class="preview-box h-[360px]">

                      <UploadZone accept="video/*" :prompt="t('uploadVideo')" :hint="t('uploadVideoHint')" @files="loadVpVideo($event)" />

                    </div>

                    <div v-else class="flex gap-3 flex-wrap">

                      <div class="flex-[2] min-w-[260px] space-y-3">

                        <div class="panel-title">{{ t('sourceVideo') }}</div>

                        <div ref="vpVideoContainer" class="relative bg-black rounded-lg overflow-hidden flex items-center justify-center h-[300px]">

                          <video ref="vpVideo" :src="vp.url" class="max-w-full max-h-full" controls crossorigin="anonymous" @loadedmetadata="onVpVideoMeta"></video>

                          <!-- 视频裁剪可拖拽选取框：仅在裁剪标签下显示 -->

                          <div v-if="vp.tab === 'crop'" class="absolute inset-0 pointer-events-none">

                            <div class="absolute pointer-events-auto border-2 border-af-accent bg-white/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" :style="vpCropBoxStyle" @mousedown="onCropBoxMouseDown">

                              <div class="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-af-accent rounded-full cursor-se-resize pointer-events-auto" @mousedown.stop="onCropResizeStart('se', $event)"></div>

                            </div>

                          </div>

                        </div>

                        <div class="form-row">

                          <div class="form-group"><label class="form-label">{{ t('rangeStart') }}</label><input v-model.number="vp.rangeStart" type="number" min="0" step="0.1" class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('rangeEnd') }}</label><input v-model.number="vp.rangeEnd" type="number" min="0" step="0.1" class="form-input" /></div>

                          <div v-if="vp.tab !== 'audio'" class="form-group"><label class="form-label">{{ t('extractFps') }}</label><input v-model.number="vp.fps" type="number" min="1" max="30" class="form-input" /></div>

                        </div>

                        <div class="text-xs text-af-muted">{{ t('videoProcessMaxFramesHint') }}</div>

                      </div>

                      <div class="w-[300px] shrink-0 bg-af-bg border border-af-rule rounded-lg p-3.5 space-y-3">

                        <div class="panel-title">{{ t('videoProcessOptions') }}</div>

                        <div v-if="vp.tab === 'matting'" class="space-y-3">

                          <div class="form-group"><label class="form-label">{{ t('mattingMode') }}</label><select v-model="vp.matting.mode" class="form-select"><option value="flood">{{ t('mattingFlood') }}</option><option value="global">{{ t('mattingGlobal') }}</option><option value="smart">{{ t('mattingSmart') }}</option></select></div>

                          <div class="form-group"><label class="form-label">{{ t('keyColor') }}</label><div class="flex items-center gap-2"><input v-model="vp.matting.key" type="color" class="w-10 h-10 rounded-md border-0 cursor-pointer bg-transparent"><span class="font-mono text-[12px] text-af-muted">{{ vp.matting.key }}</span></div></div>

                          <div class="form-group"><label class="form-label">{{ t('tolerance') }} {{ vp.matting.tolerance }}</label><input v-model.number="vp.matting.tolerance" type="range" min="0" max="120" class="w-full accent-af-accent h-1"></div>

                          <div class="form-group"><label class="form-label">{{ t('feather') }} {{ vp.matting.feather }}</label><input v-model.number="vp.matting.feather" type="range" min="0" max="20" class="w-full accent-af-accent h-1"></div>

                          <div class="form-group"><label class="form-label">{{ t('edgeErosion') }} {{ vp.matting.edge }}</label><input v-model.number="vp.matting.edge" type="range" min="-10" max="10" class="w-full accent-af-accent h-1"></div>

                          <div v-if="vp.matting.mode === 'smart'" class="form-group"><label class="form-label">{{ t('clusters') }}</label><input v-model.number="vp.matting.clusters" type="number" min="2" max="16" class="form-input"></div>

                          <div class="form-group"><label class="form-label">{{ t('videoProcessOutputFormat') }}</label><select v-model="vp.outputFormat" class="form-select"><option value="video">{{ t('videoWebm') }}</option><option value="gif">GIF</option></select></div>

                        </div>

                        <div v-if="vp.tab === 'crop'" class="space-y-3">

                          <div class="form-row">

                            <div class="form-group"><label class="form-label">{{ t('cropX') }}</label><input v-model.number="vp.crop.x" type="number" min="0" class="form-input" /></div>

                            <div class="form-group"><label class="form-label">{{ t('cropY') }}</label><input v-model.number="vp.crop.y" type="number" min="0" class="form-input" /></div>

                            <div class="form-group"><label class="form-label">{{ t('cropW') }}</label><input v-model.number="vp.crop.w" type="number" min="1" class="form-input" /></div>

                            <div class="form-group"><label class="form-label">{{ t('cropH') }}</label><input v-model.number="vp.crop.h" type="number" min="1" class="form-input" /></div>

                          </div>

                          <div class="form-group"><label class="form-label">{{ t('videoProcessOutputFormat') }}</label><select v-model="vp.outputFormat" class="form-select"><option value="video">{{ t('videoWebm') }}</option><option value="gif">GIF</option></select></div>

                        </div>

                        <div v-if="vp.tab === 'audio'" class="text-xs text-af-muted">{{ t('videoProcessAudioHint') }}</div>

                        <div v-if="vp.tab === 'gif'" class="space-y-3">

                          <div class="form-group"><label class="form-label">{{ t('gifDelay') }}</label><input v-model.number="vp.gif.delay" type="number" min="20" class="form-input" /></div>

                        </div>

                        <div v-if="vp.progress > 0" class="h-1 bg-af-bg rounded overflow-hidden"><div class="h-full rounded bg-gradient-to-r from-af-accent to-af-accent2 transition-all" :style="{ width: vp.progress + '%' }"></div></div>

                        <button class="btn-primary w-full" :disabled="vp.processing" @click="processVideo">{{ vp.processing ? t('processing') : t('process') }}</button>

                        <button v-if="vp.outputUrl" class="btn-secondary w-full" @click="downloadVpResult">{{ t('download') }}</button>

                      </div>

                      <div class="flex-[2] min-w-[260px]">

                        <div class="panel-title">{{ t('result') }}</div>

                        <div class="preview-box h-[300px] flex items-center justify-center">

                          <video v-if="vp.outputUrl && vp.tab !== 'audio'" :src="vp.outputUrl" class="max-w-full max-h-full" controls autoplay loop muted></video>

                          <audio v-else-if="vp.outputUrl && vp.tab === 'audio'" :src="vp.outputUrl" class="w-full" controls></audio>

                          <span v-else class="text-af-muted text-sm">{{ t('processingResult') }}</span>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </section>



            <!-- 像素工坊：像素绘画、精细处理与动作生成 -->

            <section v-show="currentScreen === 'pixel-studio'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0">
                <div><h1 class="text-[22px] font-bold tracking-tight">{{ t('pixelWorkshop') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('pixelWorkshopDesc') }}</p></div>
                <div class="flex items-center gap-2">
                  <button class="btn-secondary btn-sm" @click="pixelTab = 'draw'">{{ t('pixelDraw') }}</button>
                  <button class="btn-primary btn-sm" @click="pixelTab = 'action'">{{ t('pixelAction') }}</button>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto px-5 pb-4">

                <div class="flex gap-2 mb-3 flex-wrap">

                  <button v-for="tb in pixelTabs" :key="tb.key" class="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors" :class="pixelTab === tb.key ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'bg-af-surface border-af-rule text-af-muted hover:text-af-ink hover:border-af-ink/30'" @click="pixelTab = tb.key">{{ t(tb.labelKey) }}</button>

                </div>



                <!-- pixel draw -->

                <div v-if="pixelTab === 'draw'" class="space-y-3">

                  <div class="flex gap-2 items-center flex-wrap mb-3">

                    <button v-for="tl in pixelTools" :key="tl.key" class="w-8 h-8 rounded-md bg-af-bg border border-af-rule text-af-muted flex items-center justify-center" :class="pd.tool === tl.key ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'hover:text-af-ink'" :title="tl.label" @click="pd.tool = tl.key"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="tl.icon"></svg></button>

                    <!-- 形状工具下拉框：替代旧版多边形工具 -->

                    <div class="form-group !mb-0 w-28">

                      <label class="form-label">{{ t('shapeTool') }}</label>

                      <select v-model="pd.tool" class="form-select">

                        <option value="" disabled>{{ t('shapeTool') }}</option>

                        <option value="line">{{ t('shapeLine') }}</option>

                        <option value="rect">{{ t('shapeRect') }}</option>

                        <option value="triangle">{{ t('shapeTriangle') }}</option>

                        <option value="circle">{{ t('shapeCircle') }}</option>

                        <option value="ellipse">{{ t('shapeEllipse') }}</option>

                        <option value="star">{{ t('shapeStar') }}</option>

                      </select>

                    </div>

                    <div class="w-px h-6 bg-af-rule mx-1"></div>

                    <div class="form-group w-20 !mb-0"><label class="form-label">{{ t('brushSize') }}</label><input v-model.number="pd.brush" type="number" min="1" max="8" class="form-input" /></div>

                    <div class="form-group w-28 !mb-0"><label class="form-label">{{ t('zoom') }}</label><div class="slider-wrap"><input v-model.number="pd.zoom" type="range" min="1" max="32" class="flex-1 accent-af-accent h-1"><span class="slider-value">{{ pd.zoom }}x</span></div></div>

                    <div class="w-px h-6 bg-af-rule mx-1"></div>

                    <button class="btn-secondary btn-sm" @click="importPixelFromLibrary">{{ t('importFromLibrary') }}</button>

                    <button class="btn-secondary btn-sm" @click="triggerPixelImport">{{ t('importFromLocal') }}</button>

                    <input ref="pixelImportInput" type="file" accept="image/*" class="hidden" @change="handlePixelImport" />

                    <button class="btn-secondary btn-sm" @click="togglePixelBg">{{ t('bg') }}: {{ pd.bg === 'black' ? t('black') : pd.bg === 'white' ? t('white') : t('transparent') }}</button>

                  </div>

                  <div class="flex gap-3 flex-wrap h-[520px]">

                    <div class="flex-1 min-w-[260px] bg-[#0e0e14] border border-af-rule rounded-lg overflow-hidden flex items-center justify-center relative" @mousedown="pdMouseDown" @mousemove="pdMouseMove" @mouseup="pdMouseUp" @mouseleave="pdMouseUp" @wheel.prevent="pdMouseWheel" @contextmenu.prevent>

                      <canvas ref="pixelCanvas" :width="pd.w * pd.zoom" :height="pd.h * pd.zoom" class="image-pixelated absolute" :style="{ transform: `translate(${pd.panX}px, ${pd.panY}px)` }"></canvas>

                    </div>

                    <div class="w-[210px] bg-af-surface border border-af-rule rounded-lg p-3 overflow-y-auto shrink-0">

                      <div class="panel-title">{{ t('currentColor') }}</div>

                      <div class="flex items-center gap-2 mb-3"><input v-model="pd.color" type="color" class="w-10 h-10 rounded-md border-0 cursor-pointer bg-transparent"><span class="font-mono text-[13px] text-af-muted">{{ pd.color }}</span></div>

                      <div class="panel-title">{{ t('palette') }}</div>

                      <div class="grid grid-cols-8 gap-1 mb-3"><button v-for="c in pixelPalette" :key="c" class="aspect-square rounded-sm border border-af-rule" :style="{ background: c }" @click="pd.color = c"></button></div>

                      <div class="panel-title">{{ t('recentColors') }}</div>

                      <div class="grid grid-cols-8 gap-1 mb-3"><button v-for="c in pd.recent" :key="c" class="aspect-square rounded-sm border border-af-rule" :style="{ background: c }" @click="pd.color = c"></button></div>

                      <div class="panel-title">{{ t('layers') }}</div>

                      <div class="space-y-1.5"><div v-for="(l,i) in pd.layers" :key="i" class="flex items-center gap-2 px-1.5 py-1 bg-af-bg border border-af-rule rounded-md cursor-pointer text-xs" :class="pd.layer === i ? 'border-af-accent' : ''" @click="pd.layer = i"><span>{{ l.name }}</span><span class="ml-auto text-af-muted">{{ l.visible ? 'V' : '' }}</span></div></div>

                      <div class="flex gap-2 mt-3"><button class="btn-primary btn-sm" @click="exportPixelPng">{{ t('exportPng') }}</button><button class="btn-secondary btn-sm" @click="savePixelToLibrary">{{ t('saveToLibrary') }}</button></div>

                      <div class="text-[11px] text-af-muted mt-2">{{ t('shortcuts') }}</div>

                    </div>

                  </div>

                </div>



                <!-- pixel process -->

                <div v-if="pixelTab === 'process'" class="space-y-3">

                  <div class="flex items-center gap-2 mb-1">

                    <span class="panel-title !mb-0">{{ t('pixelProcess') }}</span>

                    <HelpBtn :text="t('pixelProcessHelp')" />

                  </div>

                  <div class="flex gap-3 flex-wrap min-h-[340px]">

                    <div class="flex-1 min-w-[260px]"><div class="preview-box h-[340px] relative"><span class="preview-label">{{ t('original') }}</span><UploadZone v-if="!pp.sourceUrl" accept="image/*" :prompt="t('uploadPixelImage')" class="w-[90%] h-[90%]" @files="loadPixelProcess($event)" /><img v-else :src="pp.sourceUrl" class="max-w-full max-h-full object-contain" /><button v-if="pp.sourceUrl" class="absolute bottom-2 left-1/2 -translate-x-1/2 btn-secondary btn-sm" @click="pp.sourceUrl = ''">{{ t('reupload') }}</button></div></div>

                    <div class="flex-1 min-w-[260px]"><div class="preview-box h-[340px] relative"><span class="preview-label">{{ t('result') }}</span><img v-if="pp.resultUrl" :src="pp.resultUrl" class="max-w-full max-h-full object-contain" /><span v-else class="text-af-muted text-sm">{{ t('processingResult') }}</span></div></div>

                  </div>

                  <div class="form-row flex-wrap">

                    <div class="form-group w-36"><label class="form-label">{{ t('width') }}</label><select v-model="pp.width" class="form-select"><option value="32">32px</option><option value="64">64px</option><option value="128">128px</option><option value="256">256px</option><option value="custom">{{ t('custom') }}</option></select></div>

                    <div v-if="pp.width === 'custom'" class="form-group w-24"><label class="form-label">{{ t('customWidth') }}</label><input v-model.number="pp.customWidth" type="number" min="8" max="1024" class="form-input" /></div>

                    <div class="form-group w-36"><label class="form-label">{{ t('scaleMode') }}</label><select v-model="pp.scaleMode" class="form-select"><option value="nearest">{{ t('nearest') }}</option><option value="pixel">{{ t('pixelArt') }}</option></select></div>

                    <div class="form-group w-28"><label class="form-label">{{ t('outline') }}</label><select v-model="pp.outline" class="form-select"><option value="none">{{ t('none') }}</option><option value="inner">{{ t('inner') }}</option><option value="outline">{{ t('outer') }}</option></select></div>

                    <div class="form-group w-28"><label class="form-label">{{ t('colors') }}</label><input v-model.number="pp.colors" type="number" min="2" max="256" class="form-input" /></div>

                    <div class="form-group w-36"><label class="form-label">{{ t('dither') }}</label><select v-model="pp.dither" class="form-select"><option value="none">{{ t('none') }}</option><option value="bayer">Bayer</option></select></div>

                  </div>

                  <div class="flex gap-2"><button class="btn-primary" @click="applyPixelProcess">{{ t('process') }}</button><button v-if="pp.resultUrl" class="btn-secondary" @click="downloadUrl(pp.resultUrl, 'pixel_process.png')">{{ t('download') }}</button><button v-if="pp.resultUrl" class="btn-secondary" @click="saveToLibrary(pp.resultUrl, 'output')">{{ t('saveToLibrary') }}</button></div>

                </div>



                <!-- pixel action -->

                <div v-if="pixelTab === 'action'" class="space-y-3">

                  <div class="flex gap-3 flex-wrap min-h-[300px]">

                    <div class="flex-1 min-w-[260px]"><div class="preview-box h-[300px] relative"><span class="preview-label">{{ t('refImage') }}</span><UploadZone v-if="!pc.sourceUrl" accept="image/*" :prompt="t('uploadRefImage')" class="w-[90%] h-[90%]" @files="loadPixelChar($event)" /><img v-else :src="pc.sourceUrl" class="max-w-full max-h-full object-contain" /></div></div>

                    <div class="flex-1 min-w-[260px]"><div class="preview-box h-[300px] relative"><span class="preview-label">{{ t('genResult') }}</span><canvas v-if="pc.resultCanvas" ref="pcResultCanvas" class="max-w-full max-h-full"></canvas><span v-else class="text-af-muted text-sm">{{ t('genResultPlaceholder') }}</span></div></div>

                  </div>

                  <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                    <div class="panel-title"><span>{{ t('templateStyle') }}</span><HelpBtn :text="t('pixelActionHelp')" /></div>

                    <div class="flex items-center gap-3 flex-wrap mb-3">

                      <div class="flex flex-wrap gap-1.5"><button v-for="s in pcStyles" :key="s.key" class="px-3 py-1 rounded-full text-xs border transition-colors" :class="pc.style === s.key ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'bg-af-bg border-af-rule text-af-muted hover:text-af-ink'" @click="pc.style = s.key">{{ s.label }}</button></div>

                      <span class="text-xs text-af-muted">{{ pcStyleDesc }}</span>

                    </div>

                    <div class="form-row">

                      <div class="form-group"><label class="form-label">{{ t('actionType') }}</label><select v-model="pc.action" class="form-select"><option value="walk">{{ t('walk') }}</option><option value="run">{{ t('run') }}</option><option value="idle">{{ t('idle') }}</option></select></div>

                      <div class="form-group"><label class="form-label">{{ t('outputWidth') }}</label><input v-model.number="pc.width" type="number" min="16" max="128" class="form-input" /></div>

                      <div class="form-group"><label class="form-label">{{ t('colors') }}</label><input v-model.number="pc.colors" type="number" min="4" max="64" class="form-input" /></div>

                    </div>

                    <div class="flex gap-2 mt-3"><button class="btn-primary" :title="t('notImplemented')" @click="generatePixelChar">{{ t('generatePixelAction') }}</button><button v-if="pc.resultCanvas" class="btn-secondary" @click="downloadPixelCharSprite">{{ t('downloadSprite') }}</button><button v-if="pc.resultCanvas" class="btn-secondary" @click="savePixelCharToLibrary">{{ t('saveToLibrary') }}</button></div>

                  </div>

                </div>

              </div>

            </section>



            <!-- SEQUENCE FRAME -->

            <section v-show="currentScreen === 'sequence-frame'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0">
                <div><h1 class="text-[22px] font-bold tracking-tight">{{ t('seqWorkshop') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('seqWorkshopDesc') }}</p></div>
                <div class="flex items-center gap-2">
                  <button class="btn-secondary btn-sm" @click="seqTab = 'video'">{{ t('videoToFrames') }}</button>
                  <button class="btn-primary btn-sm" @click="seqTab = 'sprite'">{{ t('spriteSheet') }}</button>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto px-5 pb-4">

                <div class="flex gap-2 mb-3 flex-wrap">

                  <button v-for="tb in seqTabs" :key="tb.key" class="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors" :class="seqTab === tb.key ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'bg-af-surface border-af-rule text-af-muted hover:text-af-ink hover:border-af-ink/30'" @click="seqTab = tb.key">{{ t(tb.labelKey) }}</button>

                </div>



                <!-- video frames -->

                <div v-show="seqTab === 'video'" class="space-y-3">

                  <div class="steps-bar">

                    <button v-for="n in 3" :key="n" class="step-pill" :class="video.step === n ? 'active' : ''" @click="video.step = n"><span class="step-num">{{ n }}</span><span>{{ videoStepLabels[n-1] }}</span></button>

                  </div>

                  <div v-if="video.step === 1" class="space-y-3">

                    <UploadZone v-if="!video.file" accept="video/mp4,video/webm,video/quicktime" :prompt="t('uploadVideo')" :hint="t('uploadVideoHint')" @files="loadVideo($event)" />

                    <input ref="videoFileInput" type="file" accept="video/mp4,video/webm,video/quicktime" class="hidden" @change.stop="handleVideoFileChange">

                    <div v-if="video.file" class="space-y-3">

                      <div class="flex gap-3 flex-wrap">

                        <div class="flex-1 min-w-[260px] relative">

                          <div class="panel-title"><span>{{ t('sourceVideo') }}</span><HelpBtn :text="t('videoCropHelp')" /></div>

                          <div class="bg-black rounded-lg overflow-hidden flex items-center justify-center h-[360px] relative" ref="videoCropContainer">

                            <video ref="sourceVideo" :src="video.url" class="max-w-full max-h-full object-contain block" crossorigin="anonymous" @loadedmetadata="onVideoMeta" @loadeddata="updateCropMetrics"></video>

                            <div v-if="video.showCrop" class="absolute border-2 border-af-accent pointer-events-none" :style="videoCropStyle">

                              <div class="absolute -top-1.5 -left-1.5 w-3 h-3 bg-af-accent cursor-nw-resize pointer-events-auto" @mousedown.stop="startCropResize($event, 'nw')"></div>

                              <div class="absolute -top-1.5 -right-1.5 w-3 h-3 bg-af-accent cursor-ne-resize pointer-events-auto" @mousedown.stop="startCropResize($event, 'ne')"></div>

                              <div class="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-af-accent cursor-sw-resize pointer-events-auto" @mousedown.stop="startCropResize($event, 'sw')"></div>

                              <div class="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-af-accent cursor-se-resize pointer-events-auto" @mousedown.stop="startCropResize($event, 'se')"></div>

                            </div>

                          </div>

                        </div>

                        <div class="flex-1 min-w-[260px]">

                          <div class="panel-title">{{ t('cropPreview') }}</div>

                          <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden flex items-center justify-center min-h-[280px]"><canvas ref="cropPreviewCanvas" class="max-w-full max-h-[360px]"></canvas></div>

                        </div>

                      </div>

                      <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                        <div class="panel-title">{{ t('videoInfo') }}</div>

                        <div class="form-row"><div class="form-group"><label class="form-label">{{ t('filename') }}</label><input :value="video.file?.name || ''" readonly class="form-input" /></div><div class="form-group"><label class="form-label">{{ t('duration') }}</label><input :value="video.duration.toFixed(2)+'s'" readonly class="form-input" /></div><div class="form-group"><label class="form-label">{{ t('resolution') }}</label><input :value="video.width+'x'+video.height" readonly class="form-input" /></div><div class="form-group"><label class="form-label">{{ t('nativeFps') }}</label><input :value="video.nativeFps.toFixed(1)" readonly class="form-input" /></div></div>

                        <div class="flex gap-2 mt-3"><button type="button" class="btn-secondary" @click="reuploadVideo">{{ t('reuploadVideo') }}</button></div>

                        <div class="form-row mt-2">

                          <div class="form-group"><label class="form-label">{{ t('cropX') }}</label><input v-model.number="video.crop.x" type="number" min="0" class="form-input" @input="updateCropFromInputs" /></div>

                          <div class="form-group"><label class="form-label">{{ t('cropY') }}</label><input v-model.number="video.crop.y" type="number" min="0" class="form-input" @input="updateCropFromInputs" /></div>

                          <div class="form-group"><label class="form-label">{{ t('cropW') }}</label><input v-model.number="video.crop.w" type="number" min="1" class="form-input" @input="updateCropFromInputs" /></div>

                          <div class="form-group"><label class="form-label">{{ t('cropH') }}</label><input v-model.number="video.crop.h" type="number" min="1" class="form-input" @input="updateCropFromInputs" /></div>

                        </div>

                      </div>

                      <!-- 裁剪后视频实时预览面板：在选取的时间范围内循环播放并显示裁剪效果 -->

                      <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                        <div class="panel-title"><span>{{ t('cropVideoPreview') }}</span><HelpBtn :text="t('cropVideoPreviewHelp')" /></div>

                        <div class="flex gap-3 flex-wrap min-h-[280px]">

                          <div class="flex-1 min-w-[260px]">

                            <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden flex items-center justify-center h-[280px] relative">

                              <canvas ref="videoPreviewCanvas" class="max-w-full max-h-full object-contain"></canvas>

                              <div v-if="!videoCropPreviewPlaying" class="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">

                                <span class="text-white text-sm">{{ t('clickPlayPreview') }}</span>

                              </div>

                            </div>

                          </div>

                          <div class="flex-1 min-w-[260px] flex flex-col justify-center gap-3">

                            <button class="btn-primary w-fit" @click="toggleCropVideoPreview">{{ videoCropPreviewPlaying ? t('pausePreview') : t('playPreview') }}</button>

                            <div class="text-xs text-af-muted space-y-1">

                              <div>{{ t('previewRange') }}: {{ fmtFixed(video.rangeStart) }}s ~ {{ fmtFixed(video.rangeEnd) }}s</div>

                              <div>{{ t('currentTime') }}: {{ fmtFixed(sourceVideo?.currentTime) }}s</div>

                            </div>

                          </div>

                        </div>

                      </div>

                      <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                        <div class="panel-title"><span>{{ t('extractSettings') }}</span><HelpBtn :text="t('extractHelp')" /></div>

                        <div class="form-row">

                          <div class="form-group"><label class="form-label">{{ t('extractFps') }}</label><input v-model.number="video.fps" type="number" min="1" max="60" class="form-input" @wheel="wheelNumber($event, 'video.fps', 1, 60)" /></div>

                          <div class="form-group"><label class="form-label">{{ t('outputWidth') }}</label><input v-model.number="video.outW" type="number" min="1" max="2048" class="form-input" @input="syncVideoOutSize('width')" /></div>

                          <div class="form-group"><label class="form-label">{{ t('outputHeight') }}</label><input v-model.number="video.outH" type="number" min="1" max="2048" class="form-input" @input="syncVideoOutSize('height')" /></div>

                          <label class="flex items-center gap-1.5 text-xs text-af-muted self-end pb-2"><input v-model="video.lockAspect" type="checkbox"> {{ t('lockAspect') }}</label>

                          <div class="form-group"><label class="form-label">{{ t('estFrames') }}</label><input :value="videoEstFrames" readonly class="form-input" /></div>

                        </div>

                        <div class="form-row mt-2">

                          <div class="form-group"><label class="form-label">{{ t('rangeStart') }}</label><input v-model.number="video.rangeStart" type="number" min="0" :max="video.duration" step="0.01" class="form-input" @wheel="wheelNumber($event, 'video.rangeStart', 0, video.duration)" @blur="refreshVideoCropPreview" /></div>

                          <div class="form-group"><label class="form-label">{{ t('rangeEnd') }}</label><input v-model.number="video.rangeEnd" type="number" min="0" :max="video.duration" step="0.01" class="form-input" @wheel="wheelNumber($event, 'video.rangeEnd', 0, video.duration)" @blur="refreshVideoCropPreview" /></div>

                          <div class="form-group"><label class="form-label">{{ t('selectedDuration') }}</label><input :value="fmtFixed(num(video.rangeEnd) - num(video.rangeStart))+'s'" readonly class="form-input" /></div>

                        </div>

                        <div class="form-row mt-2">

                          <div class="form-group"><label class="form-label">{{ t('rangeStart') }} {{ fmtFixed(video.rangeStart) }}s</label><div class="slider-wrap"><input v-model.number="video.rangeStart" type="range" min="0" :max="video.duration" step="0.01" class="flex-1 accent-af-accent h-1" @change="refreshVideoCropPreview"></div></div>

                          <div class="form-group"><label class="form-label">{{ t('rangeEnd') }} {{ fmtFixed(video.rangeEnd) }}s</label><div class="slider-wrap"><input v-model.number="video.rangeEnd" type="range" min="0" :max="video.duration" step="0.01" class="flex-1 accent-af-accent h-1" @change="refreshVideoCropPreview"></div></div>

                        </div>

                        <div v-if="video.progress > 0" class="h-1 bg-af-bg rounded overflow-hidden mt-3"><div class="h-full rounded bg-gradient-to-r from-af-accent to-af-accent2 transition-all" :style="{ width: video.progress + '%' }"></div></div>

                        <div class="flex gap-2 mt-3"><button class="btn-primary" @click="extractVideoFrames">{{ t('extractFrames') }}</button></div>

                      </div>

                    </div>

                  </div>

                  <div v-if="video.step === 2" class="space-y-3">

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5 flex gap-2 flex-wrap items-center">

                      <button class="btn-secondary" @click="detectSimilarFrames">{{ t('detectSimilar') }}</button>

                      <button class="btn-secondary" @click="selectAllFrames">{{ t('selectAll') }}</button>

                      <button class="btn-secondary" @click="deselectAllFrames">{{ t('deselectAll') }}</button>

                      <div class="flex-1"></div>

                      <span class="text-xs text-af-muted">{{ t('frameClickHint') }}</span>

                    </div>

                    <div class="flex gap-3 flex-wrap">

                      <!-- 左侧：帧网格，7 列 -->

                      <div class="flex-1 min-w-[260px] space-y-2.5">

                        <div class="grid grid-cols-7 gap-2.5"><div v-for="(f,i) in video.frames" :key="i" class="bg-af-surface border rounded-md overflow-hidden cursor-pointer relative transition-all hover:border-af-accent" :class="f.selected ? 'border-af-accent' : 'border-af-rule'" :style="similarFrameStyle(f.similarGroup)" @click="handleFrameClick(i, 'video', $event)"><input type="checkbox" v-model="f.selected" class="absolute top-2 left-2 w-5 h-5 z-10 accent-af-accent" @click="handleFrameCheckbox(i, 'video', $event)"><div v-if="f.similarGroup !== -1" class="absolute top-0 left-0 right-0 h-1.5 z-10" :style="{ background: similarColors[f.similarGroup % similarColors.length] }"></div><img :src="f.url" class="w-full object-contain bg-[#0e0e14]"><div class="px-2 py-1 text-[11px] text-af-muted flex justify-between"><span>#{{ i+1 }}</span><span v-if="f.similarGroup !== -1" class="text-xs font-bold" :style="{ color: similarColors[f.similarGroup % similarColors.length] }">G{{ f.similarGroup }}</span></div></div></div>

                      </div>

                      <!-- 右侧：预览画布（取消垂直居中）+ 播放/导出按钮紧随 FPS 滚动条下方，预览区域放大为两倍 -->

                      <div class="w-80 shrink-0 self-start flex flex-col gap-2.5">

                        <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden relative min-h-[400px]"><canvas ref="videoAnimCanvas" class="max-w-full max-h-full"></canvas></div>

                        <div class="form-group !mb-0 py-2">

                          <label class="form-label text-sm">{{ t('previewFps') }}</label>

                          <div class="slider-wrap items-center h-10">

                            <input v-model.number="video.previewFps" type="range" min="1" max="60" class="flex-1 accent-af-accent h-2.5">

                            <span class="slider-value text-base font-semibold w-10">{{ video.previewFps }}</span>

                          </div>

                        </div>

                        <button class="btn-primary btn-sm w-full" @click="toggleVideoPreview">{{ video.playing ? t('pause') : t('play') }}</button>

                        <button class="btn-primary w-full" @click="confirmVideoExport">{{ t('confirmExport') }}</button>

                      </div>

                    </div>

                  </div>

                  <div v-if="video.step === 3" class="space-y-3">

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                      <div class="panel-title"><span>{{ t('exportOptions') }}</span><HelpBtn :text="t('exportHelp')" /></div>

                      <div class="form-row">

                        <div class="form-group"><label class="form-label">{{ t('exportFormat') }}</label><select v-model="video.export.format" class="form-select"><option value="video">{{ t('videoWebm') }}</option><option value="gif">GIF</option><option value="zip">{{ t('framesZip') }}</option><option value="sprite">{{ t('sprite') }}</option></select></div>

                        <div v-if="video.export.format === 'sprite' || video.export.format === 'zip'" class="form-group"><label class="form-label">{{ t('spriteCols') }}</label><input v-model.number="video.export.cols" type="number" min="1" class="form-input" /></div>

                      </div>

                      <div class="panel-title mt-2">{{ t('exportSize') }}</div>

                      <div class="form-row">

                        <div class="form-group"><label class="form-label">{{ t('preset') }}</label><select v-model="video.export.preset" class="form-select" @change="applyExportPreset"><option value="custom">{{ t('custom') }}</option><option value="64x64">64x64</option><option value="128x128">128x128</option><option value="256x455">256x455</option><option value="512x512">512x512</option><option value="512x910">512x910</option></select></div>

                        <div class="form-group"><label class="form-label">{{ t('width') }}</label><input v-model.number="video.export.w" type="number" min="1" class="form-input" /></div>

                        <div class="form-group"><label class="form-label">{{ t('height') }}</label><input v-model.number="video.export.h" type="number" min="1" class="form-input" /></div>

                        <label class="flex items-center gap-1.5 text-xs text-af-muted self-end pb-2"><input v-model="video.export.lockAspect" type="checkbox" checked> {{ t('lockAspect') }}</label>

                      </div>

                      <div class="form-row">

                        <div class="form-group"><label class="form-label">{{ t('compression') }}</label><select v-model="video.export.compression" class="form-select"><option value="none">{{ t('compressionNone') }}</option><option value="low">{{ t('compressionLow') }}</option><option value="medium">{{ t('compressionMed') }}</option><option value="high">{{ t('compressionHigh') }}</option></select></div>

                        <div v-if="video.export.format === 'gif'" class="form-group"><label class="form-label">{{ t('gifDelay') }}</label><input v-model.number="video.export.delay" type="number" min="20" class="form-input" /></div>

                        <div class="form-group"><label class="form-label">{{ t('filename') }}</label><input v-model="video.export.name" class="form-input" @focus="selectOnFocus($event)" @keydown="handleExportNameKeydown($event, 'video')"></div>

                      </div>

                      <div v-if="video.export.sizeEstimate" class="text-xs text-af-muted mt-2">{{ t('estSize') }}: {{ video.export.sizeEstimate }}</div>

                      <div class="flex gap-2 mt-3 flex-wrap">

                        <button class="btn-primary" @click="generateVideoExportPreview">{{ t('generatePreview') }}</button>

                        <template v-if="video.export.format === 'sprite' && video.export.preview">

                          <button class="btn-secondary" @click="downloadVideoSprite('sprite')">{{ t('downloadPng') }}</button>

                          <button class="btn-secondary" @click="downloadVideoSprite('sprite-zip')">{{ t('spriteZip') }}</button>

                          <button class="btn-secondary" @click="downloadVideoSprite('sprite-json')">{{ t('downloadJson') }}</button>

                        </template>

                        <button v-else-if="video.export.preview" class="btn-secondary" @click="downloadVideoExport">{{ t('download') }}</button>

                      </div>

                    </div>

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                      <div class="panel-title">{{ t('exportPreview') }}</div>

                      <div class="preview-box min-h-[320px]">

                        <video v-if="video.export.preview && video.export.format === 'video'" ref="exportPreviewVideo" :src="video.export.preview" class="max-w-full max-h-full object-contain" controls autoplay loop muted></video>

                        <img v-else-if="video.export.preview" :src="video.export.preview" class="max-w-full max-h-full object-contain" />

                        <span v-else class="text-af-muted text-sm">{{ t('exportPreviewHint') }}</span>

                      </div>

                    </div>

                  </div>

                </div>



                <!-- gif frames -->

                <div v-show="seqTab === 'gif'" class="space-y-3">

                  <div class="steps-bar">

                    <button v-for="n in 3" :key="n" class="step-pill" :class="gif.step === n ? 'active' : ''" @click="gif.step = n"><span class="step-num">{{ n }}</span><span>{{ gifStepLabels[n-1] }}</span></button>

                  </div>

                  <div v-if="gif.step === 1" class="space-y-3">

                    <UploadZone v-if="!gif.file" accept="image/gif" :prompt="t('uploadGif')" :hint="t('uploadGifHint')" @files="loadGif($event)" />

                    <input ref="gifFileInput" type="file" accept="image/gif" class="hidden" @change.stop="handleGifFileChange">

                    <div v-if="gif.file" class="space-y-3">

                      <!-- GIF 信息面板：与视频信息面板一致，一个上传视频一个上传 GIF -->

                      <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                        <div class="panel-title">{{ t('gifInfo') }}</div>

                        <div class="form-row">

                          <div class="form-group"><label class="form-label">{{ t('filename') }}</label><input :value="gif.file?.name || ''" readonly class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('duration') }}</label><input :value="gif.duration.toFixed(2)+'s'" readonly class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('resolution') }}</label><input :value="gif.sourceFrames.length ? gif.sourceFrames[0].width+'x'+gif.sourceFrames[0].height : '-'" readonly class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('frameCount') }}</label><input :value="gif.sourceFrames.length" readonly class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('nativeFps') }}</label><input :value="gif.nativeFps.toFixed(1)" readonly class="form-input" /></div>

                        </div>

                      <div class="flex gap-2 mt-3"><button type="button" class="btn-secondary" @click="triggerGifReupload">{{ t('reuploadGif') }}</button></div>

                    </div>

                    <!-- GIF 裁剪预览面板：完整照搬视频转序列帧的裁剪功能（拖拽手柄 + 实时预览） -->

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                      <div class="panel-title"><span>{{ t('cropSettings') }}</span><HelpBtn :text="t('videoCropHelp')" /></div>

                      <div class="flex gap-3 flex-wrap">

                        <div class="flex-1 min-w-[260px] relative">

                          <div class="bg-black rounded-lg overflow-hidden flex items-center justify-center h-[360px] relative" ref="gifCropContainer">

                            <canvas ref="gifCropCanvas" class="max-w-full max-h-full object-contain block"></canvas>

                            <div v-if="gif.showCrop && gif.crop.w" class="absolute border-2 border-af-accent pointer-events-none" :style="gifCropStyle">

                              <div class="absolute -top-1.5 -left-1.5 w-3 h-3 bg-af-accent cursor-nw-resize pointer-events-auto" @mousedown.stop="startGifCropResize($event, 'nw')"></div>

                              <div class="absolute -top-1.5 -right-1.5 w-3 h-3 bg-af-accent cursor-ne-resize pointer-events-auto" @mousedown.stop="startGifCropResize($event, 'ne')"></div>

                              <div class="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-af-accent cursor-sw-resize pointer-events-auto" @mousedown.stop="startGifCropResize($event, 'sw')"></div>

                              <div class="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-af-accent cursor-se-resize pointer-events-auto" @mousedown.stop="startGifCropResize($event, 'se')"></div>

                            </div>

                          </div>

                        </div>

                        <div class="flex-1 min-w-[260px]">

                          <div class="panel-title">{{ t('cropPreview') }}</div>

                          <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden flex items-center justify-center min-h-[160px]"><canvas ref="gifCropPreviewCanvas" class="max-w-full"></canvas></div>

                        </div>

                      </div>

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5 mt-3">
                      <div class="panel-title"><span>{{ t('cropVideoPreview') }}</span><HelpBtn :text="t('cropVideoPreviewHelp')" /></div>
                      <div class="flex gap-3 flex-wrap min-h-[280px]">
                        <div class="flex-1 min-w-[260px]">
                          <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden flex items-center justify-center h-[280px] relative">
                            <canvas ref="gifRangePreviewCanvas" class="max-w-full"></canvas>
                            <div v-if="!gifRangePreviewPlaying" class="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                              <span class="text-white text-sm">{{ t('clickPlayPreview') }}</span>
                            </div>
                          </div>
                        </div>
                        <div class="flex-1 min-w-[260px] flex flex-col justify-center gap-3">
                          <button type="button" class="btn-primary w-fit" @click="toggleGifRangePreview">{{ gifRangePreviewPlaying ? t('pausePreview') : t('playPreview') }}</button>
                          <div class="text-xs text-af-muted space-y-1">
                            <div>{{ t('previewRange') }}: {{ fmtFixed(gif.rangeStart) }}s ~ {{ fmtFixed(gif.rangeEnd) }}s</div>
                            <div>{{ t('currentTime') }}: {{ fmtFixed(gifRangeCurrentTime) }}s</div>
                          </div>
                        </div>
                      </div>
                    </div>

                      <div class="form-row mt-2">

                        <div class="form-group"><label class="form-label">{{ t('cropX') }}</label><input v-model.number="gif.crop.x" type="number" min="0" class="form-input" @change="drawGifCropPreview(); drawGifCropPreviewCanvas()" /></div>

                        <div class="form-group"><label class="form-label">{{ t('cropY') }}</label><input v-model.number="gif.crop.y" type="number" min="0" class="form-input" @change="drawGifCropPreview(); drawGifCropPreviewCanvas()" /></div>

                        <div class="form-group"><label class="form-label">{{ t('cropW') }}</label><input v-model.number="gif.crop.w" type="number" min="1" class="form-input" @change="drawGifCropPreview(); drawGifCropPreviewCanvas()" /></div>

                        <div class="form-group"><label class="form-label">{{ t('cropH') }}</label><input v-model.number="gif.crop.h" type="number" min="1" class="form-input" @change="drawGifCropPreview(); drawGifCropPreviewCanvas()" /></div>

                      </div>

                    </div>

                    <!-- 时间选择 + 输出设置：直接复用视频侧的 extractSettings 面板结构 -->

                      <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                        <div class="panel-title"><span>{{ t('extractSettings') }}</span><HelpBtn :text="t('extractHelp')" /></div>

                        <div class="form-row">

                          <div class="form-group"><label class="form-label">{{ t('extractFps') }}</label><input v-model.number="gif.fps" type="number" min="1" max="60" class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('outputWidth') }}</label><input v-model.number="gif.outW" type="number" min="1" max="2048" class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('outputHeight') }}</label><input v-model.number="gif.outH" type="number" min="1" max="2048" class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('estFrames') }}</label><input :value="gifEstFrames" readonly class="form-input" /></div>

                        </div>

                        <div class="form-row mt-2">

                          <div class="form-group"><label class="form-label">{{ t('rangeStart') }}</label><input v-model.number="gif.rangeStart" type="number" min="0" :max="gif.duration" step="0.01" class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('rangeEnd') }}</label><input v-model.number="gif.rangeEnd" type="number" min="0" :max="gif.duration" step="0.01" class="form-input" /></div>

                          <div class="form-group"><label class="form-label">{{ t('selectedDuration') }}</label><input :value="fmtFixed(num(gif.rangeEnd) - num(gif.rangeStart))+'s'" readonly class="form-input" /></div>

                        </div>

                        <div class="form-row mt-2">

                          <div class="form-group"><label class="form-label">{{ t('rangeStart') }} {{ fmtFixed(gif.rangeStart) }}s</label><div class="slider-wrap"><input v-model.number="gif.rangeStart" type="range" min="0" :max="gif.duration" step="0.01" class="flex-1 accent-af-accent h-1" /></div></div>

                          <div class="form-group"><label class="form-label">{{ t('rangeEnd') }} {{ fmtFixed(gif.rangeEnd) }}s</label><div class="slider-wrap"><input v-model.number="gif.rangeEnd" type="range" min="0" :max="gif.duration" step="0.01" class="flex-1 accent-af-accent h-1" /></div></div>

                        </div>

                        <div class="flex gap-2 mt-3"><button class="btn-primary" @click="extractGifFrames">{{ t('extractFrames') }}</button></div>

                      </div>

                    </div>

                  </div>

                  <div v-if="gif.step === 2" class="space-y-3">

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5 flex gap-2 flex-wrap items-center">

                      <button class="btn-secondary" @click="detectSimilarGifFrames">{{ t('detectSimilar') }}</button>

                      <button class="btn-secondary" @click="selectAllGifFrames">{{ t('selectAll') }}</button>

                      <button class="btn-secondary" @click="deselectAllGifFrames">{{ t('deselectAll') }}</button>

                      <div class="flex-1"></div>

                      <span class="text-xs text-af-muted">{{ t('frameClickHint') }}</span>

                    </div>

                    <div class="flex gap-3 flex-wrap">

                      <!-- 左侧：帧网格，7 列 -->

                      <div class="flex-1 min-w-[260px] space-y-2.5">

                        <div class="grid grid-cols-7 gap-2.5">

                          <div v-for="(f,i) in gif.frames" :key="i" class="bg-af-surface border rounded-md overflow-hidden cursor-pointer relative transition-all hover:border-af-accent" :class="f.selected ? 'border-af-accent' : 'border-af-rule'" :style="similarFrameStyle(f.similarGroup)" @click="handleFrameClick(i, 'gif', $event)"><input type="checkbox" v-model="f.selected" class="absolute top-2 left-2 w-5 h-5 z-10 accent-af-accent" @click="handleFrameCheckbox(i, 'gif', $event)"><div v-if="f.similarGroup !== -1" class="absolute top-0 left-0 right-0 h-1.5 z-10" :style="{ background: similarColors[f.similarGroup % similarColors.length] }"></div><img :src="f.url" class="w-full object-contain bg-[#0e0e14]"><div class="px-2 py-1 text-[11px] text-af-muted flex justify-between"><span>#{{ i+1 }}</span><span v-if="f.similarGroup !== -1" class="text-xs font-bold" :style="{ color: similarColors[f.similarGroup % similarColors.length] }">G{{ f.similarGroup }}</span></div></div>

                        </div>

                      </div>

                      <!-- 右侧：预览画布 + 播放/导出按钮紧随 FPS 滚动条下方，预览区域放大为两倍 -->

                      <div class="w-80 shrink-0 self-start flex flex-col gap-2.5">

                        <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden relative min-h-[400px]"><canvas ref="gifAnimCanvas" class="max-w-full max-h-full"></canvas></div>

                        <div class="form-group !mb-0 py-2">

                          <label class="form-label text-sm">{{ t('previewFps') }}</label>

                          <div class="slider-wrap items-center h-10">

                            <input v-model.number="gif.previewFps" type="range" min="1" max="60" class="flex-1 accent-af-accent h-2.5">

                            <span class="slider-value text-base font-semibold w-10">{{ gif.previewFps }}</span>

                          </div>

                        </div>

                        <button class="btn-primary btn-sm w-full" @click="toggleGifPreview">{{ gif.playing ? t('pause') : t('play') }}</button>

                        <button class="btn-primary w-full" @click="confirmGifExport">{{ t('confirmExport') }}</button>

                      </div>

                    </div>

                  </div>

                  <div v-if="gif.step === 3" class="space-y-3">

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                      <div class="panel-title">{{ t('exportOptions') }}</div>

                      <div class="form-row">

                        <div class="form-group"><label class="form-label">{{ t('exportFormat') }}</label><select v-model="gif.export.format" class="form-select"><option value="video">{{ t('videoWebm') }}</option><option value="gif">GIF</option><option value="zip">{{ t('framesZip') }}</option><option value="sprite">{{ t('sprite') }}</option></select></div>

                        <div v-if="gif.export.format === 'sprite' || gif.export.format === 'zip'" class="form-group"><label class="form-label">{{ t('spriteCols') }}</label><input v-model.number="gif.export.cols" type="number" min="1" class="form-input" /></div>

                      </div>

                      <div class="form-row">

                        <div class="form-group"><label class="form-label">{{ t('compression') }}</label><select v-model="gif.export.compression" class="form-select"><option value="none">{{ t('compressionNone') }}</option><option value="low">{{ t('compressionLow') }}</option><option value="medium">{{ t('compressionMed') }}</option><option value="high">{{ t('compressionHigh') }}</option></select></div>

                        <div v-if="gif.export.format === 'gif'" class="form-group"><label class="form-label">{{ t('gifDelay') }}</label><input v-model.number="gif.export.delay" type="number" min="20" class="form-input" @change="generateGifExportPreview()" /></div>

                        <div class="form-group"><label class="form-label">{{ t('filename') }}</label><input v-model="gif.export.name" class="form-input" @focus="selectOnFocus($event)" @keydown="handleExportNameKeydown($event, 'gif')"></div>

                      </div>

                      <div v-if="gif.export.sizeEstimate" class="text-xs text-af-muted mt-2">{{ t('estSize') }}: {{ gif.export.sizeEstimate }}</div>

                      <div class="flex gap-2 mt-3 flex-wrap">

                        <button class="btn-primary" @click="generateGifExportPreview">{{ t('generatePreview') }}</button>

                        <template v-if="gif.export.format === 'sprite' && gif.export.preview">

                          <button class="btn-secondary" @click="downloadGifSprite('sprite')">{{ t('downloadPng') }}</button>

                          <button class="btn-secondary" @click="downloadGifSprite('sprite-zip')">{{ t('spriteZip') }}</button>

                          <button class="btn-secondary" @click="downloadGifSprite('sprite-json')">{{ t('downloadJson') }}</button>

                        </template>

                        <button v-else-if="gif.export.preview" class="btn-secondary" @click="downloadGifExport">{{ t('download') }}</button>

                      </div>

                    </div>

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5"><div class="panel-title">{{ t('exportPreview') }}</div><div class="preview-box min-h-[320px]"><video v-if="gif.export.preview && gif.export.format === 'video'" ref="gifExportPreviewVideo" :src="gif.export.preview" class="max-w-full max-h-full object-contain" controls autoplay loop muted></video><img v-else-if="gif.export.preview" :src="gif.export.preview" class="max-w-full max-h-full object-contain" /><span v-else class="text-af-muted text-sm">{{ t('exportPreviewHint') }}</span></div></div>

                  </div>

                </div>



                <!-- 图片转序列帧：上传多张图像并排列为 Sprite Sheet，预览模块单独放右侧，对齐视频/GIF 转序列帧 -->

                <div v-show="seqTab === 'sprite'" class="space-y-3">

                  <UploadZone v-if="!sprite.images.length" accept="image/*" multiple :prompt="t('uploadImages')" :hint="t('uploadImagesHint')" @files="loadSpriteImages($event)" />

                  <div v-else class="space-y-3">

                    <!-- 布局设置面板：与视频/GIF 提取设置面板对齐（顶部整宽） -->

                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">

                      <div class="panel-title"><span>{{ t('layoutSettings') }}</span><HelpBtn :text="t('spriteHelp')" /></div>

                      <div class="form-row">

                        <div class="form-group"><label class="form-label">{{ t('columns') }}</label><input v-model.number="sprite.cols" type="number" min="1" class="form-input" /></div>

                        <div class="form-group"><label class="form-label">{{ t('rows') }}</label><input :value="spriteRows" readonly class="form-input" /></div>

                        <div class="form-group"><label class="form-label">{{ t('padding') }}</label><input v-model.number="sprite.padding" type="number" min="0" class="form-input" /></div>

                        <div class="form-group"><label class="form-label">{{ t('bg') }}</label><select v-model="sprite.bg" class="form-select"><option value="transparent">{{ t('transparent') }}</option><option value="#000000">{{ t('black') }}</option><option value="#ffffff">{{ t('white') }}</option></select></div>

                        <div class="form-group">

                          <label class="form-label">{{ t('compression') }}</label>

                          <select v-model="sprite.compression" class="form-select"><option value="none">{{ t('compressionNone') }}</option><option value="low">{{ t('compressionLow') }}</option><option value="medium">{{ t('compressionMed') }}</option><option value="high">{{ t('compressionHigh') }}</option></select>

                          <div class="text-[11px] text-af-muted mt-1.5 block">{{ t('estCompressSize') }}: {{ spriteCompressionSize || t('calculating') }}</div>

                        </div>

                      </div>

                      <div class="flex gap-2 mt-3"><button class="btn-primary" @click="downloadSpriteSheet">{{ t('downloadPng') }}</button><button class="btn-secondary" @click="downloadSpriteJson">{{ t('downloadJson') }}</button><button class="btn-secondary" @click="saveSpriteToLibrary">{{ t('saveToLibrary') }}</button></div>

                    </div>

                    <!-- 两栏布局：左侧为源图片网格，右侧为独立预览模块，与视频/GIF 转序列帧对齐 -->

                    <div class="flex gap-3 flex-wrap">

                      <!-- 左侧：源图片网格，7 列，与视频/GIF 帧网格对齐 -->

                      <div class="flex-1 min-w-[260px] space-y-2.5">

                        <div class="text-[13px] font-semibold mb-0.5">{{ t('sourceImages') }} ({{ sprite.images.length }})</div>

                        <div class="grid grid-cols-7 gap-2.5">

                          <div v-for="(img,i) in sprite.images" :key="i" class="bg-af-surface border border-af-rule rounded-md overflow-hidden relative group"><img :src="img.url" class="w-full object-contain bg-[#0e0e14]"><div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button class="w-7 h-7 rounded-md bg-white/15 text-white flex items-center justify-center" @click="sprite.images.splice(i,1)"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div></div>

                        </div>

                      </div>

                      <!-- 右侧：序列帧预览模块（画布放大填充 + FPS + 播放按钮紧随滚动条下方） -->

                      <div class="w-72 shrink-0 self-start flex flex-col gap-2.5">

                        <!-- 预览画布容器：固定 320px 高度，让右侧模块有足够空间放大展示小图 -->

                        <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden relative h-[320px]"><canvas ref="spritePreviewCanvas" class="w-full h-full block"></canvas></div>

                        <!-- FPS 控制面板：播放按钮紧跟在滚动条正下方，不被推到底部 -->

                        <div class="form-group !mb-0 py-2">

                          <label class="form-label text-sm">{{ t('previewFps') }}</label>

                          <div class="slider-wrap items-center h-10">

                            <input v-model.number="sprite.previewFps" type="range" min="1" max="60" class="flex-1 accent-af-accent h-2.5">

                            <span class="slider-value text-base font-semibold w-10">{{ sprite.previewFps }}</span>

                          </div>

                        </div>

                        <button class="btn-primary btn-sm w-full" @click="toggleSpritePreview">{{ sprite.playing ? t('pause') : t('play') }}</button>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </section>



            <!-- 地图编辑器：瓦片双网格与序列帧预览暂时隐藏 -->

            <section v-if="false" v-show="currentScreen === 'map-editor'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0">
                <div><h1 class="text-[22px] font-bold tracking-tight">{{ t('mapEditor') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('mapEditorDesc') }}</p></div>
                <div class="flex items-center gap-2">
                  <button class="btn-secondary btn-sm" @click="mapTab = 'tilemap'">{{ t('tileDualGrid') }}</button>
                  <button class="btn-primary btn-sm" @click="mapTab = 'preview'">{{ t('topdownPreview') }}</button>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto px-5 pb-4">

                <div class="flex gap-2 mb-3 flex-wrap">

                  <button v-for="tb in mapTabs" :key="tb.key" class="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors" :class="mapTab === tb.key ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'bg-af-surface border-af-rule text-af-muted hover:text-af-ink hover:border-af-ink/30'" @click="mapTab = tb.key">{{ t(tb.labelKey) }}</button>

                </div>



                <!-- tilemap -->

                <div v-if="mapTab === 'tilemap'" class="space-y-3">

                  <div class="flex gap-3 flex-wrap mb-3">

                    <div class="flex flex-col gap-2.5 w-[200px] shrink-0">

                      <div class="form-group"><label class="form-label">{{ t('tileset') }}</label><UploadZone accept="image/*" :prompt="t('uploadTileset')" class="py-5" @files="loadTileset($event)" /></div>

                      <button class="btn-secondary btn-sm w-full" @click="importTilesetFromLibrary">{{ t('tileImportFromLibrary') }}</button>

                      <!-- 图块选择区：加高并以小图展示瓦片，悬停时放大预览 -->

                      <div class="bg-af-bg border border-af-rule rounded-lg p-3 flex-1 overflow-auto min-h-[360px]">

                        <div class="panel-title">{{ t('tileSelect') }}</div>

                        <div v-if="!tm.tilesetUrl" class="text-xs text-af-muted">{{ t('uploadTilesetFirst') }}</div>

                        <div v-else class="grid grid-cols-4 gap-1.5">

                          <div v-for="(tile, i) in tm.tiles" :key="i" class="relative aspect-square border rounded cursor-pointer overflow-hidden bg-cover transition-transform hover:scale-110 hover:z-10 hover:border-af-accent" :class="tm.selectedTile === i ? 'border-af-accent' : 'border-af-rule'" :style="tileThumbStyle(tile)" @mouseenter="tm.hoverTile = i" @mouseleave="tm.hoverTile = -1" @click="tm.selectedTile = i">

                          </div>

                        </div>

                      </div>

                    </div>

                    <div class="flex-1 min-w-[260px]"><div class="bg-[#0e0e14] border border-af-rule rounded-lg overflow-hidden h-[460px] flex items-center justify-center"><canvas ref="tilemapCanvas" width="800" height="460" class="max-w-full max-h-full" @mousedown="tmMouseDown" @mousemove="tmMouseMove" @mouseup="tmMouseUp" @mouseleave="tmMouseUp"></canvas></div></div>

                  </div>

                  <div class="flex gap-2.5 items-center flex-wrap">

                    <div class="text-xs font-semibold">{{ t('tools') }}</div>

                    <button v-for="tl in tmTools" :key="tl.key" class="w-8 h-8 rounded-md bg-af-bg border border-af-rule text-af-muted flex items-center justify-center" :class="tm.tool === tl.key ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'hover:text-af-ink'" :title="tl.label" @click="tm.tool = tl.key"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="tl.icon"></svg></button>

                    <div class="w-px h-6 bg-af-rule mx-1"></div>

                    <label class="flex items-center gap-1.5 text-xs text-af-muted"><input v-model="tm.showGrid" type="checkbox" checked> {{ t('showGrid') }}</label>

                    <label class="flex items-center gap-1.5 text-xs text-af-muted"><input v-model="tm.detail" type="checkbox"> {{ t('detailLayer') }}</label>

                    <div class="flex-1"></div>

                    <div class="form-group w-24 !mb-0"><label class="form-label">{{ t('mapWidth') }}</label><input v-model.number="tm.w" type="number" min="4" max="128" class="form-input" /></div>

                    <div class="form-group w-24 !mb-0"><label class="form-label">{{ t('mapHeight') }}</label><input v-model.number="tm.h" type="number" min="4" max="128" class="form-input" /></div>

                  </div>

                  <div class="flex gap-2 flex-wrap"><button class="btn-primary" @click="exportTilemapJson">{{ t('exportJson') }}</button><button class="btn-secondary" @click="exportTilemapPng">{{ t('exportPng') }}</button><button class="btn-secondary" @click="saveTilemapToLibrary">{{ t('saveToLibrary') }}</button></div>

                </div>



                <!-- topdown preview -->

                <div v-if="mapTab === 'preview'" class="space-y-3">

                  <div class="bg-[#0e0e14] border border-af-rule rounded-lg overflow-hidden h-[460px] flex items-center justify-center"><canvas ref="topdownCanvas" width="800" height="460" class="max-w-full max-h-full"></canvas></div>

                  <div class="flex gap-2.5 items-center flex-wrap">

                    <div class="text-xs text-af-muted">{{ t('topdownControls') }}</div>

                    <div class="w-px h-4 bg-af-rule"></div>

                    <button class="btn-secondary btn-sm" @click="triggerTopdownMap">{{ t('uploadLocalMap') }}</button>

                    <button class="btn-secondary btn-sm" @click="triggerTopdownChar">{{ t('uploadLocalChar') }}</button>

                    <button class="btn-secondary btn-sm" @click="triggerTopdownVideo">{{ t('uploadLocalCharVideo') }}</button>

                    <button class="btn-secondary btn-sm" @click="importTopdownFromLibrary">{{ t('importFromLibrary') }}</button>

                    <input ref="topdownMapInput" type="file" accept="image/*" class="hidden" @change="loadTopdownMap($event)" />

                    <input ref="topdownCharInput" type="file" accept="image/gif,image/*" class="hidden" @change="loadTopdownChar($event)" />

                    <input ref="topdownVideoInput" type="file" accept="video/*" class="hidden" @change="loadTopdownVideo($event)" />

                    <div class="flex-1"></div>

                    <button class="btn-primary btn-sm" @click="topdownScreenshot">{{ t('screenshot') }}</button>

                  </div>

                </div>

              </div>

            </section>



            <!-- RESOURCE LIBRARY -->

            <section v-show="currentScreen === 'resource-library'" class="flex flex-col flex-1 overflow-auto">

              <div class="flex items-center justify-between px-5 pt-3.5 pb-2.5 shrink-0">
                <div><h1 class="text-[22px] font-bold tracking-tight">{{ t('resourceLibrary') }}</h1><p class="text-[13px] text-af-muted mt-0.5">{{ t('resourceLibraryDesc2') }}</p></div>
                <div class="flex items-center gap-2"><button class="btn-secondary" @click="exportAssets">{{ t('exportAll') }}</button><button class="btn-primary" @click="triggerAssetImport">{{ t('importFiles') }}</button><input ref="assetImportInput" type="file" accept="image/*,video/*,image/gif" multiple class="hidden" @change="handleAssetImport" /></div>
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

                      <div class="flex gap-2 items-center"><button class="btn-secondary btn-sm" @click="selectAllAssets">{{ t('selectAll') }}</button><button class="btn-danger btn-sm" @click="deleteSelectedAssets">{{ t('deleteSelected') }}</button><span class="text-xs text-af-muted">{{ filteredAssets.length }} {{ t('items') }}</span></div>

                    </div>

                    <div class="flex-1 overflow-y-auto p-3.5">

                      <div v-if="!filteredAssets.length" class="h-full flex items-center justify-center text-af-muted text-lg text-center p-10">{{ t('libraryEmpty') }}</div>

                      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5"><div v-for="a in filteredAssets" :key="a.id" class="aspect-square bg-af-surface border border-af-rule rounded-md overflow-hidden cursor-pointer relative transition-all hover:border-af-accent" :class="a.selected ? 'border-af-accent' : ''" @click="openPreview(a.thumb)"><img :src="a.thumb" class="w-full h-full object-cover bg-[#0e0e14]"><div class="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-[11px] bg-black/70 text-af-ink truncate">{{ a.name }}</div><input type="checkbox" v-model="a.selected" class="absolute top-1.5 left-1.5 w-4 h-4 accent-af-accent z-10" @click.stop></div></div>

                    </div>

                  </div>

                </div>

              </div>

            </section>



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



    <!-- Help Modal -->

    <Teleport to="body">

      <div v-if="helpOpen" class="fixed inset-0 bg-black/75 z-[100] flex items-center justify-center" @click.self="helpOpen = false">

        <div class="bg-af-surface border border-af-rule rounded-lg p-5 w-[420px] max-w-[92vw]">

          <div class="flex items-center justify-between mb-3.5"><div class="text-base font-bold">{{ t('help') }}</div><button class="w-11 h-11 rounded-md text-af-muted hover:text-af-ink hover:bg-af-surface-hover text-2xl flex items-center justify-center" @click="helpOpen = false">&times;</button></div>

          <div class="text-[13px] leading-relaxed text-af-muted">{{ helpText }}</div>

        </div>

      </div>

    </Teleport>



    <!-- Image Preview Modal -->

    <Teleport to="body">

      <div v-if="previewOpen" class="fixed inset-0 bg-black/75 z-[100] flex items-center justify-center" @click.self="previewOpen = false">

        <div class="bg-af-surface border border-af-rule rounded-lg p-5 max-w-[96vw] max-h-[96vh] flex flex-col items-center overflow-auto">

          <div class="w-full flex items-center justify-between mb-3.5"><div class="text-base font-bold">{{ t('preview') }}</div><button class="w-11 h-11 rounded-md text-af-muted hover:text-af-ink hover:bg-af-surface-hover text-2xl flex items-center justify-center" @click="previewOpen = false">&times;</button></div>

          <img :src="previewUrl" alt="preview" class="max-w-full max-h-[70vh] object-contain" />

          <div class="mt-3"><button class="btn-secondary" @click="previewOpen = false">{{ t('close') }}</button></div>

        </div>

      </div>

    </Teleport>



    <!-- 资源选择器弹窗：从资源库中选择图片供其他模块使用 -->

    <Teleport to="body">

      <div v-if="assetPickerOpen" class="fixed inset-0 bg-black/75 z-[100] flex items-center justify-center p-4" @click.self="closeAssetPicker">

        <div class="bg-af-surface border border-af-rule rounded-lg w-[900px] max-w-[96vw] h-[80vh] flex flex-col overflow-hidden">

          <div class="flex items-center justify-between px-4 py-3 border-b border-af-rule">

            <div class="text-base font-bold">{{ t('pickerTitle') }}</div>

            <button class="w-9 h-9 rounded-md text-af-muted hover:text-af-ink hover:bg-af-surface-hover text-2xl flex items-center justify-center" @click="closeAssetPicker">&times;</button>

          </div>

          <div class="flex-1 overflow-hidden p-4 flex flex-col">

            <div class="flex gap-2 mb-3 flex-wrap">

              <button v-for="f in assetFilters" :key="f.key" class="px-2.5 py-1 rounded-md text-xs border transition-colors" :class="assetPickerFilter === f.key ? 'bg-af-accent-soft border-af-accent text-af-accent' : 'bg-af-bg border-af-rule text-af-muted hover:text-af-ink'" @click="assetPickerFilter = f.key">{{ t(f.labelKey) }}</button>

            </div>

            <div v-if="!assetPickerItems.length" class="flex-1 flex items-center justify-center text-af-muted">{{ t('libraryEmpty') }}</div>

            <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 overflow-y-auto flex-1 content-start">

              <div v-for="a in assetPickerItems" :key="a.id" class="aspect-square bg-af-surface border border-af-rule rounded-md overflow-hidden cursor-pointer hover:border-af-accent transition-colors group relative" @click="selectAssetFromPicker(a)">

                <img :src="a.thumb" class="w-full h-full object-cover bg-[#0e0e14]" />

                <div class="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-[11px] bg-black/70 text-af-ink truncate">{{ a.name }}</div>

              </div>

            </div>

          </div>

          <div class="px-4 py-3 border-t border-af-rule flex items-center justify-between text-xs text-af-muted">

            <span>{{ assetPickerItems.length }} {{ t('items') }}</span>

            <button class="btn-secondary btn-sm" @click="closeAssetPicker">{{ t('cancel') }}</button>

          </div>

        </div>

      </div>

    </Teleport>



    <!-- 帧编辑器弹窗：对单帧进行抠图、调色与参数应用 -->

    <Teleport to="body">

      <div v-if="frameEditorOpen" class="fixed inset-0 bg-black/75 z-[100] flex items-center justify-center" @click.self="closeFrameEditor">

        <div class="bg-af-surface border border-af-rule rounded-lg p-5 max-w-[96vw] max-h-[96vh] flex flex-col overflow-auto">

          <div class="w-full flex items-center justify-between mb-3.5">

            <div class="text-base font-bold">{{ t('frameEditor') }} #{{ frameEditorIndex + 1 }}</div>

            <button class="w-11 h-11 rounded-md text-af-muted hover:text-af-ink hover:bg-af-surface-hover text-2xl flex items-center justify-center" @click="closeFrameEditor">&times;</button>

          </div>

          <div class="flex items-center gap-4 mb-3">

            <button class="btn-secondary btn-sm" :disabled="frameEditorIndex <= 0" @click="frameEditorPrev">&larr; {{ t('previous') }}</button>

            <span class="text-xs text-af-muted">{{ t('frameSize') }}: {{ frameEditorSize }}</span>

            <button class="btn-secondary btn-sm" :disabled="frameEditorIndex >= frameEditorMax - 1" @click="frameEditorNext">{{ t('next') }} &rarr;</button>

          </div>

          <div class="flex gap-3 flex-wrap">

            <div class="flex-1 min-w-[260px] flex flex-col items-center">

              <div class="flex items-center gap-3 mb-3">

                <label class="text-xs text-af-muted">{{ t('zoom') }}:</label>

                <input v-model.number="frameEditorZoom" type="range" min="1" max="10" step="0.5" class="flex-1 accent-af-accent h-1" style="width:200px">

                <span class="slider-value">{{ frameEditorZoom }}x</span>

              </div>

              <div class="overflow-auto border border-af-rule rounded-lg flex items-center justify-center relative" style="width:100%; max-width:100%; max-height:75vh;">

                <canvas ref="frameEditorCanvas" class="object-contain image-pixelated" :class="frameEditorTool === 'manual' ? 'cursor-crosshair' : 'cursor-default'" :style="{ transform: `scale(${frameEditorZoom})`, transformOrigin: '0 0', width: '100%', height: '100%' }" @mousedown="frameEditorCanvasMouseDown" @mousemove="frameEditorCanvasMouseMove" @mouseup="frameEditorCanvasMouseUp" @wheel.prevent="onFrameEditorWheel" />

              </div>

              <div class="text-[11px] text-af-muted mt-2">{{ frameEditorTool === 'manual' ? t('watermarkSelectHint') : t('eyedropperHint') }}</div>

            </div>

            <div class="w-[230px] shrink-0 bg-af-bg border border-af-rule rounded-lg p-3.5 overflow-y-auto max-h-[65vh]">

              <div class="panel-title">{{ t('mattingMode') }}</div>

              <select v-model="frameEditorParams.mode" class="form-select mb-3" @change="onFrameEditorModeChange">

                <option value="flood">{{ t('mattingFlood') }}</option>

                <option value="global">{{ t('mattingGlobal') }}</option>

                <option value="smart">{{ t('mattingSmart') }}</option>

                <option value="watermark">{{ t('watermark') }}</option>

              </select>

              <!-- 手动框选去除工具：水印去除模式下自动进入框选模式 -->

              <div class="text-[11px] text-af-muted mt-2">{{ frameEditorTool === 'manual' ? t('watermarkSelectHint') : t('eyedropperHint') }}</div>

              <div class="form-group"><label class="form-label">{{ t('keyColor') }}</label><div class="flex items-center gap-2"><input v-model="frameEditorParams.key" type="color" class="w-10 h-10 rounded-md border-0 cursor-pointer bg-transparent"><span class="font-mono text-[12px] text-af-muted">{{ frameEditorParams.key }}</span></div></div>

              <div class="form-group"><label class="form-label">{{ t('tolerance') }} {{ frameEditorParams.tolerance }}</label><input v-model.number="frameEditorParams.tolerance" type="range" min="0" max="120" class="w-full accent-af-accent h-1" @wheel.prevent="onFrameEditorWheel($event, 'tolerance')"></div>

              <div class="form-group"><label class="form-label">{{ t('feather') }} {{ frameEditorParams.feather }}</label><input v-model.number="frameEditorParams.feather" type="range" min="0" max="20" class="w-full accent-af-accent h-1" @wheel.prevent="onFrameEditorWheel($event, 'feather')"></div>

              <div class="form-group"><label class="form-label">{{ t('edgeErosion') }} {{ frameEditorParams.edge }}</label><input v-model.number="frameEditorParams.edge" type="range" min="-10" max="10" class="w-full accent-af-accent h-1" @wheel.prevent="onFrameEditorWheel($event, 'edge')"></div>

              <div v-if="frameEditorParams.mode === 'smart'" class="form-group"><label class="form-label">{{ t('clusters') }}</label><input v-model.number="frameEditorParams.clusters" type="number" min="2" max="16" class="form-input"></div>

              <div class="form-group"><label class="form-label">{{ t('brightness') }} {{ frameEditorParams.brightness }}</label><input v-model.number="frameEditorParams.brightness" type="range" min="-100" max="100" class="w-full accent-af-accent h-1"></div>

              <div class="form-group"><label class="form-label">{{ t('contrast') }} {{ frameEditorParams.contrast }}</label><input v-model.number="frameEditorParams.contrast" type="range" min="-100" max="100" class="w-full accent-af-accent h-1"></div>

              <div class="form-group"><label class="form-label">{{ t('saturation') }} {{ frameEditorParams.saturation }}</label><input v-model.number="frameEditorParams.saturation" type="range" min="-100" max="100" class="w-full accent-af-accent h-1"></div>

              <div class="flex flex-col gap-2 mt-3">

                <button class="btn-primary btn-sm" @click="saveFrameEditor">{{ t('saveFrame') }}</button>

                <button class="btn-secondary btn-sm" @click="applyFrameEditorToAll">{{ t('applyToAll') }}</button>

                <button class="btn-secondary btn-sm" @click="copyFrameDataUrl">{{ t('copyDataUrl') }}</button>

                <button class="btn-secondary btn-sm" @click="downloadUrl(frameEditorImage, 'frame_'+(frameEditorIndex+1)+'.png')">{{ t('download') }}</button>

                <button class="btn-secondary btn-sm" @click="restoreFrameEditor">{{ t('restoreFrame') }}</button>

                <button class="btn-secondary btn-sm" @click="restoreAllFrames">{{ t('restoreAllFrames') }}</button>

                <button class="btn-secondary btn-sm" @click="closeFrameEditor">{{ t('close') }}</button>

              </div>

            </div>

          </div>

        </div>

      </div>

    </Teleport>



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



export const UploadZone = defineComponent({

  props: { accept: { type: String, default: '*' }, multiple: { type: Boolean, default: false }, prompt: { type: String, default: '点击或拖拽上传' }, hint: { type: String, default: '' }, class: { type: String, default: '' } },

  emits: ['files'],

  setup(props, { emit }) {

    const drag = ref(false)

    const input = ref<HTMLInputElement | null>(null)

    function onFiles(files: FileList | null) {

      if (files && files.length) emit('files', props.multiple ? files : files[0])

      if (input.value) input.value.value = ''

    }

    return () => h('div', {

      class: ['border-2 border-dashed border-af-rule rounded-lg bg-af-surface text-af-muted text-center cursor-pointer transition-all duration-200 hover:border-af-accent hover:bg-af-accent-soft hover:text-af-ink hover:shadow-md hover:-translate-y-0.5 relative flex flex-col items-center justify-center p-6', drag.value ? 'border-af-accent bg-af-accent-soft text-af-ink shadow-md' : '', props.class],

      onDragover: (e: DragEvent) => { e.preventDefault(); drag.value = true },

      onDragleave: () => { drag.value = false },

      onDrop: (e: DragEvent) => { e.preventDefault(); drag.value = false; onFiles(e.dataTransfer?.files || null) }

    }, [

      h('svg', { class: 'w-9 h-9 mb-2.5', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }), h('polyline', { points: '17 8 12 3 7 8' }), h('line', { x1: '12', y1: '3', x2: '12', y2: '15' })]),

      h('div', { class: 'text-sm' }, props.prompt),

      props.hint && h('div', { class: 'text-xs text-af-muted mt-1.5' }, props.hint),

      h('input', { ref: input, type: 'file', accept: props.accept, multiple: props.multiple, class: 'absolute inset-0 opacity-0 cursor-pointer', onChange: (e: Event) => onFiles((e.target as HTMLInputElement).files) })

    ])

  }

})



export const HelpBtn = defineComponent({

  props: { text: { type: String, required: true } },

  setup(props) {

    return () => h('button', {

      class: 'inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-af-surface-hover text-af-muted border border-af-rule text-[11px] ml-1.5 cursor-help hover:text-af-accent hover:border-af-accent',

      onClick: (e: MouseEvent) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('af-open-help', { detail: props.text })) }

    }, '?')

  }

})

</script>



<script setup lang="ts">

import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

import { RouterLink } from 'vue-router'

import { useThemeStore } from '../stores/theme'

import { computeCropDisplayMetrics, fitCropToOutput, clampCrop, estimateFrameCount } from '../utils/videoCrop'

import { applyMattingParams, type MattingParams } from '../utils/matting'

import { extractVideoFrames as extractVpFrames, extractVideoAudio, mattingFrame, renderFramesToGif, renderFramesToVideo, type VideoCropRect } from '../utils/videoProcess'

import { generateExportPreview, downloadExport, compressionQuality, formatBytes, dataUrlToBlob } from '../utils/export'

import { addAsset, addAssetFromFile, getAssets, deleteAsset, exportAssetsZip } from '../utils/assets'

import { decodeGif } from '../utils/gifDecode'

import { saveAs } from 'file-saver'

import Pica from 'pica'



const pica = Pica({ features: ['js', 'wasm', 'ww'] })



// 将任意值安全转换为数字，无效时返回 0（用于防止 input 空值导致 toFixed 报错）

function num(v: any): number { return typeof v === 'number' && !isNaN(v) ? v : Number(v) || 0 }

// 安全格式化数字为固定小数位字符串

function fmtFixed(v: any, digits = 2): string { return num(v).toFixed(digits) }

// 输入框聚焦时全选内容

function selectOnFocus(e: FocusEvent) {

  const t = e.target as HTMLInputElement

  t.select()

}

// 导出文件名输入框快捷键：支持 Ctrl+A 全选，阻止全局快捷键拦截

function handleExportNameKeydown(e: KeyboardEvent, _source: 'video' | 'gif') {

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {

    e.preventDefault()

    e.stopPropagation()

    const input = e.target as HTMLInputElement

    input.select()

  }

}



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

  frameClickHint: { zh: '点击缩略图编辑；点击复选框选择；Shift+点击连续选择', en: 'Click thumbnail to edit; checkbox to select; Shift+click range select', ja: 'サムネイルクリックで編集；チェックボックスで選択；Shift+クリックで範囲選択', ko: '썸네일 클릭으로 편집; 체크박스로 선택; Shift+클릭 범위 선택' },

  previewFps: { zh: '预览 FPS', en: 'Preview FPS', ja: 'プレビューFPS', ko: '미리보기 FPS' },

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

  gifStep3: { zh: '导出处理结果', en: 'Export Results', ja: '結果エクスポート', ko: '결과 난볶기' },

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

let confirmDialogResolve: ((value: boolean) => void) | null = null

// 显示确认弹框，返回 Promise<boolean>

function showConfirmDialog(
  text: string,
  title = '',
  okText = '',
  cancelText = ''
): Promise<boolean> {

  return new Promise((resolve) => {

    confirmDialogTitle.value = title || t('notice')

    confirmDialogText.value = text

    confirmDialogOkText.value = okText || t('ok')

    confirmDialogCancelText.value = cancelText || t('cancel')

    confirmDialogResolve = resolve

    confirmDialogOpen.value = true

  })

}

function onConfirmDialogOk() {

  confirmDialogOpen.value = false

  if (confirmDialogResolve) { confirmDialogResolve(true); confirmDialogResolve = null }

}

function onConfirmDialogCancel() {

  confirmDialogOpen.value = false

  if (confirmDialogResolve) { confirmDialogResolve(false); confirmDialogResolve = null }

}



const groups = reactive({ ai: true, media: true, frame: true, pixel: true })



const aiTab = ref('')

const aiTabs: { key: string; labelKey: string }[] = [

  // { key: 'txt2img', labelKey: 'txt2img' }, // 创建素材模块暂时隐藏

  // { key: 'style', labelKey: 'styleTransfer' }, // 暂时隐藏画风迁移

  // { key: 'simplify', labelKey: 'charSimplify' }, // 暂时隐藏角色简化

  // { key: 'pose', labelKey: 'poseGen' }, // 暂时隐藏姿势生成

]

const mediaTab = ref('image')

const mediaTabs = [

  { key: 'image', labelKey: 'imageProcessing' },

  // { key: 'video', labelKey: 'videoProcessing' }, // 视频处理模块暂时隐藏

]

const vpTabs = [

  { key: 'crop', labelKey: 'videoCrop' },

  { key: 'audio', labelKey: 'videoToAudio' },

  { key: 'gif', labelKey: 'videoToGif' },

]

// 图片处理子模块标签：图片裁剪 / 图片抠图

const mtTabs = [

  { key: 'crop', labelKey: 'imageCropTab' },

  { key: 'matting', labelKey: 'imageMattingTab' },

]

const pixelTab = ref('draw')

const pixelTabs = [

  { key: 'draw', labelKey: 'pixelDraw' },

  { key: 'process', labelKey: 'pixelProcess' },

  { key: 'action', labelKey: 'pixelAction' },

]

const seqTab = ref('video')

const seqTabs = [

  { key: 'video', labelKey: 'videoToFrames' },

  { key: 'gif', labelKey: 'gifToFrames' },

  { key: 'sprite', labelKey: 'spriteSheet' },

]

const mapTab = ref('tilemap')

const mapTabs: { key: string; labelKey: string }[] = [

  // { key: 'tilemap', labelKey: 'tileDualGrid' }, // 瓦片双网格暂时隐藏

  // { key: 'preview', labelKey: 'topdownPreview' }, // 序列帧预览暂时隐藏

]



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

const previewOpen = ref(false)

const previewUrl = ref('')



const loadingOpen = ref(false)

const loadingText = ref('')



function navigate(screen: string) { currentScreen.value = screen; statusText.value = t('ready') }

function goSub(screen: string, tab: string) {

  currentScreen.value = screen

  if (screen === 'ai-concept') aiTab.value = tab

  if (screen === 'media-process') mediaTab.value = tab

  if (screen === 'pixel-studio') pixelTab.value = tab

  if (screen === 'sequence-frame') seqTab.value = tab

  if (screen === 'map-editor') mapTab.value = tab

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

function openPreview(url: string) { previewUrl.value = url; previewOpen.value = true }



// Utility

function fileToDataUrl(file: File): Promise<string> {

  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = e => resolve(e.target?.result as string); r.onerror = reject; r.readAsDataURL(file) })

}

function loadImage(src: string): Promise<HTMLImageElement> {

  return new Promise((resolve, reject) => { const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => resolve(img); img.onerror = reject; img.src = src })

}

function downloadUrl(url: string, name: string) {

  const a = document.createElement('a'); a.href = url; a.download = name; a.click()

}

function placeholderUrl() {

  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const ctx = c.getContext('2d')!; ctx.fillStyle = '#1a1a24'; ctx.fillRect(0,0,256,256); ctx.fillStyle = '#8a8a9e'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('placeholder',128,128); return c.toDataURL()

}



// ==================== AI TXT2IMG ====================

const t2i = reactive({ prompt: '', negative: '', refs: [] as File[], refPreviews: [] as string[], resultUrls: [] as string[], generating: false, progress: 0, count: 1 })

// T2I 历史记录项结构
interface T2iHistoryItem { prompt: string; negative: string; resultUrls: string[]; refPreviews: string[]; created: number }

// T2I 生成历史记录列表
const t2iHistory = ref<T2iHistoryItem[]>([])

async function previewT2iRefs() { t2i.refPreviews = await Promise.all(t2i.refs.map(fileToDataUrl)) }

// 将当前生成结果加入历史记录并持久化到 localStorage
function addT2iHistory() {
  if (!t2i.resultUrls.length) return
  t2iHistory.value.unshift({ prompt: t2i.prompt, negative: t2i.negative, resultUrls: [...t2i.resultUrls], refPreviews: [...t2i.refPreviews], created: Date.now() })
  if (t2iHistory.value.length > 50) t2iHistory.value = t2iHistory.value.slice(0, 50)
  localStorage.setItem('af_t2i_history', JSON.stringify(t2iHistory.value))
}

// 从历史记录加载一次生成参数到编辑区
function loadT2iHistory(h: T2iHistoryItem) {
  t2i.prompt = h.prompt
  t2i.negative = h.negative
  t2i.refPreviews = [...h.refPreviews]
  t2i.resultUrls = [...h.resultUrls]
}

// 从 localStorage 恢复 T2I 历史记录
function loadT2iHistoryFromStorage() {
  try {
    const raw = localStorage.getItem('af_t2i_history')
    if (raw) t2iHistory.value = JSON.parse(raw)
  } catch { /* 忽略解析错误 */ }
}

async function generateTxt2Img() {

  // 验证：必须先选择 API 配置方案

  if (!apiProfileId.value) { showDialog(t('needApiProfile')); return }

  // 验证：至少需要提示词或参考图

  if (!t2i.prompt.trim() && !t2i.refs.length) { showDialog(t('txt2imgNeedConfig')); return }

  const profile = apiProfiles.value.find(p => p.id === apiProfileId.value)

  if (!profile) { showDialog(t('needApiProfile')); return }

  t2i.generating = true; t2i.progress = 10; t2i.resultUrls = []

  try {

    const urls = t2i.refs.length ? await callImg2ImgApi(profile) : await callTxt2ImgApi(profile)

    if (!urls.length) throw new Error('Empty response')

    t2i.resultUrls = urls

    t2i.progress = 100

    addT2iHistory()

    statusText.value = t('txt2imgDone')

  } catch (e) {

    showDialog(t('txt2imgFailed') + ': ' + (e as Error).message)

    t2i.progress = 0

  } finally {

    t2i.generating = false

  }

}

// 将文件转换为 Base64 字符串（去掉 data URL 前缀）
async function fileToBase64(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file)
  return dataUrl.split(',')[1]
}

// 解析用户填写的额外参数 JSON
function parseExtraParams(profile: ApiConfigProfile): Record<string, any> {
  try { return profile.extra ? JSON.parse(profile.extra) : {} } catch { return {} }
}

// 调用文生图 API：支持 OpenAI 兼容、SD WebUI、Gemini 等常见接口格式
async function callTxt2ImgApi(profile: ApiConfigProfile): Promise<string[]> {
  const extra = parseExtraParams(profile)
  const size = extra.size || '1024x1024'
  const [width, height] = size.split('x').map((s: string) => parseInt(s, 10) || 1024)
  const count = Math.max(1, Math.min(4, t2i.count || 1))

  // Stable Diffusion WebUI 格式
  if (profile.provider === 'sd') {
    const body = { prompt: t2i.prompt, negative_prompt: t2i.negative, width, height, steps: extra.steps || 20, sampler_name: extra.sampler || 'Euler a', n_iter: count, seed: extra.seed || -1 }
    const target = profile.endpoint.replace(/\/$/, '') + '/sdapi/v1/txt2img'
    console.log('[callTxt2ImgApi] SD 请求', target, body)
    try {
      const res = await fetch(target, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const text = await res.text()
      console.log('[callTxt2ImgApi] SD 响应', res.status, text.slice(0, 200))
      if (!res.ok) {
        let msg = text
        try { msg = JSON.parse(text).detail || text } catch {}
        throw new Error((msg || res.status + ' ' + res.statusText) + '\n' + target)
      }
      const data = JSON.parse(text)
      return (data.images || []).slice(0, count).map((b64: string) => 'data:image/png;base64,' + b64)
    } catch (e) {
      throw new Error(diagnoseFetchError(e as Error, target))
    }
  }

  // OpenAI / DALL-E 兼容格式（通义万相、豆包、智谱、可灵、自定义等）
  const body: any = { model: profile.model, prompt: t2i.prompt, n: count, size: `${width}x${height}`, response_format: 'b64_json' }
  if (extra.quality) body.quality = extra.quality
  if (extra.style) body.style = extra.style
  const target = profile.endpoint.replace(/\/$/, '') + '/v1/images/generations'
  console.log('[callTxt2ImgApi] OpenAI 兼容请求', target, body)
  try {
    const res = await fetch(target, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + profile.key }, body: JSON.stringify(body) })
    const text = await res.text()
    console.log('[callTxt2ImgApi] OpenAI 兼容响应', res.status, text.slice(0, 200))
    if (!res.ok) {
      let msg = text
      try { msg = JSON.parse(text).error?.message || text } catch {}
      throw new Error((msg || res.status + ' ' + res.statusText) + '\n' + target)
    }
    const data = JSON.parse(text)
    return (data.data || []).slice(0, count).map((item: any) => {
      const b64 = item?.b64_json || item?.url
      return b64.startsWith('data:') ? b64 : 'data:image/png;base64,' + b64
    })
  } catch (e) {
    throw new Error(diagnoseFetchError(e as Error, target))
  }
}

// 调用图生图 API：支持 OpenAI 兼容 image 参数与 SD WebUI img2img
async function callImg2ImgApi(profile: ApiConfigProfile): Promise<string[]> {
  const extra = parseExtraParams(profile)
  const size = extra.size || '1024x1024'
  const [width, height] = size.split('x').map((s: string) => parseInt(s, 10) || 1024)
  const initImage = await fileToBase64(t2i.refs[0])
  const count = Math.max(1, Math.min(4, t2i.count || 1))

  // Stable Diffusion WebUI 格式
  if (profile.provider === 'sd') {
    const body = { prompt: t2i.prompt, negative_prompt: t2i.negative, init_images: [initImage], width, height, steps: extra.steps || 20, sampler_name: extra.sampler || 'Euler a', denoising_strength: extra.denoising_strength ?? 0.75, n_iter: count }
    const target = profile.endpoint.replace(/\/$/, '') + '/sdapi/v1/img2img'
    console.log('[callImg2ImgApi] SD 请求', target, body)
    try {
      const res = await fetch(target, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const text = await res.text()
      console.log('[callImg2ImgApi] SD 响应', res.status, text.slice(0, 200))
      if (!res.ok) {
        let msg = text
        try { msg = JSON.parse(text).detail || text } catch {}
        throw new Error((msg || res.status + ' ' + res.statusText) + '\n' + target)
      }
      const data = JSON.parse(text)
      return (data.images || []).slice(0, count).map((b64: string) => 'data:image/png;base64,' + b64)
    } catch (e) {
      throw new Error(diagnoseFetchError(e as Error, target))
    }
  }

  // OpenAI 兼容格式：部分国内平台支持 image 参数
  const body: any = { model: profile.model, prompt: t2i.prompt, image: initImage, n: count, size: `${width}x${height}`, response_format: 'b64_json' }
  if (extra.quality) body.quality = extra.quality
  if (extra.style) body.style = extra.style
  const target = profile.endpoint.replace(/\/$/, '') + '/v1/images/generations'
  console.log('[callImg2ImgApi] OpenAI 兼容请求', target, body)
  try {
    const res = await fetch(target, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + profile.key }, body: JSON.stringify(body) })
    const text = await res.text()
    console.log('[callImg2ImgApi] OpenAI 兼容响应', res.status, text.slice(0, 200))
    if (!res.ok) {
      let msg = text
      try { msg = JSON.parse(text).error?.message || text } catch {}
      throw new Error((msg || res.status + ' ' + res.statusText) + '\n' + target)
    }
    const data = JSON.parse(text)
    return (data.data || []).slice(0, count).map((item: any) => {
      const b64 = item?.b64_json || item?.url
      return b64.startsWith('data:') ? b64 : 'data:image/png;base64,' + b64
    })
  } catch (e) {
    throw new Error(diagnoseFetchError(e as Error, target))
  }
}



// ==================== STYLE TRANSFER ====================

const st = reactive({ targetUrl: '', styleUrl: '', prompt: '转换为像素艺术风格', resultUrl: '', running: false })

async function loadStTarget(file: File) { st.targetUrl = await fileToDataUrl(file) }

async function loadStStyle(file: File) { st.styleUrl = await fileToDataUrl(file) }

async function runStyleTransfer() {

  st.running = true; statusText.value = t('styleTransferring')

  await new Promise(r => setTimeout(r, 1200))

  st.resultUrl = st.targetUrl || placeholderUrl(); st.running = false; statusText.value = t('styleTransferDone')

}

async function frontendStyleTransfer() {

  if (!st.targetUrl) return

  const img = await loadImage(st.targetUrl)

  if (st.styleUrl) {

    const styleImg = await loadImage(st.styleUrl)

    const sc = document.createElement('canvas'); sc.width = 50; sc.height = 50

    const sctx = sc.getContext('2d')!; sctx.drawImage(styleImg, 0, 0, 50, 50)

    const sd = sctx.getImageData(0, 0, 50, 50).data

    let sr = 0, sg = 0, sb = 0, cnt = 0

    for (let i = 0; i < sd.length; i += 4) { sr += sd[i]; sg += sd[i+1]; sb += sd[i+2]; cnt++ }

    sr /= cnt; sg /= cnt; sb /= cnt

    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight

    const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0)

    const id = ctx.getImageData(0, 0, c.width, c.height)

    for (let i = 0; i < id.data.length; i += 4) {

      const gray = id.data[i] * 0.299 + id.data[i+1] * 0.587 + id.data[i+2] * 0.114

      id.data[i] = Math.min(255, gray * sr / 128)

      id.data[i+1] = Math.min(255, gray * sg / 128)

      id.data[i+2] = Math.min(255, gray * sb / 128)

    }

    ctx.putImageData(id, 0, 0); st.resultUrl = c.toDataURL()

  } else {

    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight

    const ctx = c.getContext('2d')!; ctx.filter = 'sepia(0.4) saturate(1.4) hue-rotate(-20deg)'; ctx.drawImage(img, 0, 0)

    st.resultUrl = c.toDataURL()

  }

}



// ==================== CHAR SIMPLIFY ====================

const cs = reactive({ sourceUrl: '', resultUrl: '', level: 'medium', width: 64, height: 64, colors: 16, quality: 90, running: false, progress: 0 })

const simplifyLevels = [

  { key: 'light' as const, label: '轻度' },

  { key: 'medium' as const, label: '中度' },

  { key: 'heavy' as const, label: '重度' },

]

async function loadCharSimplify(file: File) { const dataUrl = await fileToDataUrl(file); cs.sourceUrl = dataUrl; await saveFileToLibrary(file, dataUrl) }

async function processCharSimplify() {

  if (!cs.sourceUrl) return

  cs.running = true; cs.progress = 0; statusText.value = t('processing')

  const img = await loadImage(cs.sourceUrl)

  const srcCanvas = document.createElement('canvas'); srcCanvas.width = img.naturalWidth; srcCanvas.height = img.naturalHeight

  const srcCtx = srcCanvas.getContext('2d')!; srcCtx.drawImage(img, 0, 0)

  const destCanvas = document.createElement('canvas'); destCanvas.width = cs.width; destCanvas.height = cs.height

  cs.progress = 30

  try {

    const quality = Math.min(3, Math.max(0, Math.round((cs.quality / 100) * 3))) as 0 | 1 | 2 | 3

    await pica.resize(srcCanvas, destCanvas, { quality })

  } catch {

    const dctx = destCanvas.getContext('2d')!; dctx.imageSmoothingEnabled = false; dctx.drawImage(img, 0, 0, cs.width, cs.height)

  }

  cs.progress = 70

  const dctx = destCanvas.getContext('2d')!

  const id = dctx.getImageData(0, 0, cs.width, cs.height)

  for (let i = 0; i < id.data.length; i += 4) {

    id.data[i] = Math.round(id.data[i] / (256 / cs.colors)) * (256 / (cs.colors - 1))

    id.data[i+1] = Math.round(id.data[i+1] / (256 / cs.colors)) * (256 / (cs.colors - 1))

    id.data[i+2] = Math.round(id.data[i+2] / (256 / cs.colors)) * (256 / (cs.colors - 1))

  }

  dctx.putImageData(id, 0, 0)

  cs.progress = 100; cs.resultUrl = destCanvas.toDataURL(); cs.running = false; statusText.value = t('charSimplifyDone')

}



// ==================== POSE GEN ====================

const pg = reactive({ sourceUrl: '', pose: 'stand', resultCanvas: false })

const pgResultCanvas = ref<HTMLCanvasElement | null>(null)

const posePresets = ['stand','walk','run','attack','jump','cast','crouch','hurt']

const poseNames: Record<string, string> = { stand:'站立', walk:'行走', run:'奔跑', attack:'攻击', jump:'跳跃', cast:'施法', crouch:'蹲下', hurt:'受伤' }

async function loadPose(file: File) { pg.sourceUrl = await fileToDataUrl(file) }

function drawSkeleton() {

  pg.resultCanvas = true

  nextTick(() => {

    const c = pgResultCanvas.value; if (!c) return

    c.width = 300; c.height = 300; const ctx = c.getContext('2d')!

    ctx.clearRect(0,0,300,300); ctx.strokeStyle = '#00d4aa'; ctx.lineWidth = 3; ctx.lineCap = 'round'

    const baseY = pg.pose === 'crouch' ? 200 : 150

    ctx.beginPath(); ctx.arc(150, baseY - 70, 20, 0, Math.PI * 2); ctx.stroke()

    ctx.beginPath(); ctx.moveTo(150, baseY - 50); ctx.lineTo(150, baseY + 20); ctx.stroke()

    ctx.beginPath(); ctx.moveTo(150, baseY - 30); ctx.lineTo(110, baseY + 10); ctx.moveTo(150, baseY - 30); ctx.lineTo(190, baseY + 10); ctx.stroke()

    const ly = pg.pose === 'walk' ? 240 : pg.pose === 'run' ? 250 : pg.pose === 'jump' ? 210 : 240

    ctx.beginPath(); ctx.moveTo(150, baseY + 20); ctx.lineTo(120, ly); ctx.moveTo(150, baseY + 20); ctx.lineTo(180, ly); ctx.stroke()

  })

}

function generatePoseFrontend() { drawSkeleton(); statusText.value = t('skeletonDone') }

async function generatePoseApi() { drawSkeleton(); statusText.value = t('poseApiDone') }﻿

// ==================== AI MATTING / CROP ====================

const mt = reactive({

  sourceUrl: '',        // 原图数据 URL

  tab: 'crop', // 顶层模块：图片裁剪 / 图片抠图

  cropSubMode: 'grid' as 'grid' | 'manual', // 裁剪子模式：网格 / 手动框选

  gridSize: 3,            // 网格列数

  selectedCells: [] as { col: number; row: number }[], // 网格裁剪已选中的格子列表

  selCol: 1,              // 网格选中列

  selRow: 1,              // 网格选中行

  cropX: 0,               // 手动选区左上角 X

  cropY: 0,               // 手动选区左上角 Y

  cropW: 0,               // 手动选区宽度

  cropH: 0,               // 手动选区高度

  isSelecting: false,     // 是否正在拖拽选区

  startX: 0,              // 拖拽起始 X

  startY: 0,              // 拖拽起始 Y

  resultUrl: '',          // 裁剪/抠图结果数据 URL

  zoom: 1,                // 抠图模式画布缩放

  panX: 0,                // 抠图模式画布平移 X

  panY: 0,                // 抠图模式画布平移 Y

  panning: false,         // 是否正在右键拖动平移

  panStartX: 0,           // 平移起始点 X（屏幕坐标）

  panStartY: 0,           // 平移起始点 Y（屏幕坐标）

  panOrigX: 0,            // 平移开始时的 panX

  panOrigY: 0,            // 平移开始时的 panY

  resultZoom: 1,          // 裁剪/抠图结果画布缩放

  resultPanX: 0,          // 抠图结果预览水平平移

  resultPanY: 0,          // 抠图结果预览垂直平移

  resultPanning: false,   // 是否正在平移结果预览

  resultPanStartX: 0,     // 平移起始鼠标 X

  resultPanStartY: 0,     // 平移起始鼠标 Y

  resultPanOrigX: 0,      // 平移起始结果 X

  resultPanOrigY: 0,      // 平移起始结果 Y

  // 抠图模式参数

  mattingKey: '#00ff00',

  mattingTolerance: 30,

  mattingFeather: 2,

  mattingEdge: 0,

  mattingClusters: 4,

  mattingSubMode: 'flood' as 'flood' | 'global' | 'smart',

})

const mtSourceCanvas = ref<HTMLCanvasElement | null>(null) // 源图画布引用

const mtResultCanvas = ref<HTMLCanvasElement | null>(null) // 结果画布引用

const mtSourceImageData = ref<ImageData | null>(null) // 抠图模式原始像素数据

// 手动裁剪框显示度量（画布内部像素 → 容器内显示像素）

const mtCropMetrics = reactive({ scale: 1, offsetX: 0, offsetY: 0 })

const mtCropStyleOverlay = computed(() => {

  if (mt.tab !== 'crop' || mt.cropSubMode !== 'manual' || mt.cropW <= 0) return { display: 'none' }

  return {

    display: 'block',

    left: mtCropMetrics.offsetX + mt.cropX * mtCropMetrics.scale + 'px',

    top: mtCropMetrics.offsetY + mt.cropY * mtCropMetrics.scale + 'px',

    width: mt.cropW * mtCropMetrics.scale + 'px',

    height: mt.cropH * mtCropMetrics.scale + 'px',

  }

})

// mtGridSelections: 保留兼容旧代码（已不再使用，由 canvas 绘制替代）

const mtGridSelections = reactive<{ col: number; row: number }[]>([])



// 加载图片到抠图功能

async function loadMtImage(file: File) {

  if (!file) return // 没有文件则直接返回

  mt.sourceUrl = await fileToDataUrl(file) // 转为 Data URL

  mt.selectedCells = [] // 新图片清空网格选中状态

  mt.resultUrl = '' // 清空旧结果

  await nextTick() // 等待 DOM 更新

  initMtSource() // 初始化源图画布

}



// 初始化源图画布：绘制原图、网格或选区

async function initMtSource() {

  const c = mtSourceCanvas.value // 获取源画布

  if (!c || !mt.sourceUrl) return // 未加载则返回

  const img = await loadImage(mt.sourceUrl) // 加载图片对象

  c.width = img.naturalWidth // 设置画布宽度为图片宽度

  c.height = img.naturalHeight // 设置画布高度为图片高度

  const ctx = c.getContext('2d') // 获取 2D 上下文

  if (!ctx) return // 获取失败则返回

  ctx.clearRect(0, 0, c.width, c.height) // 清空画布

  ctx.drawImage(img, 0, 0) // 绘制原图

  // 抠图模式缓存原始像素数据，供左键取色与实时抠图使用

  if (mt.tab === 'matting') {

    mtSourceImageData.value = ctx.getImageData(0, 0, c.width, c.height)

    // 抠图模式：默认让图片完整显示在容器内，初始缩放为 1（CSS max-width/height 会自适应）

    mt.zoom = 1; mt.panX = 0; mt.panY = 0

  }

  if (mt.tab === 'crop' && mt.cropSubMode === 'grid') { drawMtGrid(ctx, c.width, c.height) } // 网格模式绘制网格线与选中高亮

  drawMtOverlay(ctx) // 绘制选区高亮覆盖层

  updateMtCropMetrics() // 更新手动裁剪框显示度量

}



// 计算手动裁剪框在容器内的显示位置（canvas 内部像素 → 容器 CSS 像素）

function updateMtCropMetrics() {

  const c = mtSourceCanvas.value

  if (!c) return

  const rect = c.getBoundingClientRect()

  const container = c.parentElement

  if (!container) return

  const contRect = container.getBoundingClientRect()

  mtCropMetrics.scale = rect.width / c.width

  mtCropMetrics.offsetX = rect.left - contRect.left

  mtCropMetrics.offsetY = rect.top - contRect.top

}



// 从画布指定坐标取色，返回十六进制颜色字符串

function pickMtColor(canvas: HTMLCanvasElement, x: number, y: number): string | null {

  const ctx = canvas.getContext('2d') // 获取 2D 上下文

  if (!ctx) return null // 获取失败则返回 null

  const pixel = ctx.getImageData(x, y, 1, 1).data // 读取单像素数据

  // 将 RGB 值转为十六进制颜色字符串

  return '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('')

}



let mtCropResizing = false

function startMtCropResize(_e: MouseEvent, dir: string) {

  mtCropResizing = true

  const c = mtSourceCanvas.value; if (!c) return

  const onMove = (ev: MouseEvent) => {

    if (!mtCropResizing) return

    const container = c.parentElement; if (!container) return

    const contRect = container.getBoundingClientRect()

    const mx = (ev.clientX - contRect.left - mtCropMetrics.offsetX) / mtCropMetrics.scale

    const my = (ev.clientY - contRect.top - mtCropMetrics.offsetY) / mtCropMetrics.scale

    const cw = c.width; const ch = c.height

    if (dir.includes('e')) mt.cropW = Math.max(10, Math.min(mx, cw) - mt.cropX)

    if (dir.includes('w')) { const newX = Math.max(0, Math.min(mx, mt.cropX + mt.cropW - 10)); mt.cropW = mt.cropX + mt.cropW - newX; mt.cropX = newX }

    if (dir.includes('s')) mt.cropH = Math.max(10, Math.min(my, ch) - mt.cropY)

    if (dir.includes('n')) { const newY = Math.max(0, Math.min(my, mt.cropY + mt.cropH - 10)); mt.cropH = mt.cropY + mt.cropH - newY; mt.cropY = newY }

    initMtSource()

  }

  const onUp = () => { mtCropResizing = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }

  document.addEventListener('mousemove', onMove)

  document.addEventListener('mouseup', onUp)

}



// 在画布上绘制网格线，并高亮显示已选中的格子

function drawMtGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {

  const n = mt.gridSize // 获取网格列数

  if (n < 1) return // 列数无效则直接返回

  const cw = w / n // 单个格子宽度

  const ch = h / n // 单个格子高度（保持正方形网格）

  ctx.strokeStyle = 'rgba(0, 212, 170, 0.6)' // 网格线颜色

  ctx.lineWidth = 1 // 线宽

  // 绘制垂直线

  for (let i = 1; i < n; i++) {

    ctx.beginPath()

    ctx.moveTo(cw * i, 0)

    ctx.lineTo(cw * i, h)

    ctx.stroke()

  }

  // 绘制水平线

  for (let i = 1; i < n; i++) {

    ctx.beginPath()

    ctx.moveTo(0, ch * i)

    ctx.lineTo(w, ch * i)

    ctx.stroke()

  }

  // 高亮已选中的格子

  ctx.fillStyle = 'rgba(0, 212, 170, 0.25)' // 选中格子的填充颜色

  for (const cell of mt.selectedCells) {

    const x = cell.col * cw

    const y = cell.row * ch

    ctx.fillRect(x, y, cw, ch)

  }

}



// 根据选中的网格格子计算整体裁剪区域

function updateGridCropArea() {

  const c = mtSourceCanvas.value

  if (!c || !mt.selectedCells.length) return

  const n = mt.gridSize

  const cw = c.width / n

  const ch = c.height / n

  const minCol = Math.min(...mt.selectedCells.map(c => c.col))

  const maxCol = Math.max(...mt.selectedCells.map(c => c.col))

  const minRow = Math.min(...mt.selectedCells.map(c => c.row))

  const maxRow = Math.max(...mt.selectedCells.map(c => c.row))

  mt.cropX = minCol * cw

  mt.cropY = minRow * ch

  mt.cropW = (maxCol - minCol + 1) * cw

  mt.cropH = (maxRow - minRow + 1) * ch

}



// 绘制选区高亮覆盖层

function drawMtOverlay(ctx: CanvasRenderingContext2D) {

  const c = mtSourceCanvas.value // 获取画布

  if (!c) return // 未获取则返回

  if (mt.tab === 'crop' && mt.cropSubMode === 'manual' && mt.cropW > 0 && mt.cropH > 0) { // 手动模式高亮矩形选区

    ctx.fillStyle = 'rgba(0, 212, 170, 0.25)' // 半透明填充

    ctx.fillRect(mt.cropX, mt.cropY, mt.cropW, mt.cropH) // 填充选区

    ctx.strokeStyle = '#00d4aa' // 选区边框色

    ctx.lineWidth = 2 // 边框宽度

    ctx.strokeRect(mt.cropX, mt.cropY, mt.cropW, mt.cropH) // 绘制选区边框

  }

}



// 处理鼠标按下事件：网格点击或手动拖拽起始

function onMtMouseDown(e: MouseEvent) {

  if (e.button === 1) { // 中键：回归默认大小与位置

    e.preventDefault()

    mt.zoom = 1; mt.panX = 0; mt.panY = 0

    mt.resultZoom = 1; mt.resultPanX = 0; mt.resultPanY = 0

    return

  }

  // 右键开始拖动平移画布（抠图模式）

  if (e.button === 2 && mt.tab === 'matting') {

    mt.panning = true

    mt.panStartX = e.clientX

    mt.panStartY = e.clientY

    mt.panOrigX = mt.panX

    mt.panOrigY = mt.panY

    return

  }

  // 左键：取色抠图或裁剪选区

  if (e.button !== 0) return

  const c = mtSourceCanvas.value

  if (!c) return

  const rect = c.getBoundingClientRect()

  const scaleX = c.width / rect.width

  const scaleY = c.height / rect.height

  const x = (e.clientX - rect.left) * scaleX

  const y = (e.clientY - rect.top) * scaleY

  if (mt.tab === 'matting') {

    // 抠图模式：按住 ALT 取色并实时抠图

    if (e.altKey) {

      const color = pickMtColor(c, Math.round(x), Math.round(y))

      if (color) { mt.mattingKey = color; applyMtMattingPreview() }

    }

    return

  }

  if (mt.tab === 'crop' && mt.cropSubMode === 'grid') {

    const n = mt.gridSize

    const cw = c.width / n

    const ch = c.height / n

    const selCol = Math.min(n - 1, Math.max(0, Math.floor(x / cw)))

    const selRow = Math.min(n - 1, Math.max(0, Math.floor(y / ch)))

    const clicked = { col: selCol, row: selRow }

    // 若按住 Shift 则连续多选，否则单选

    if (e.shiftKey && mt.selectedCells.length) {

      // 以最后一个选中格子为起点，矩形范围连续选择

      const last = mt.selectedCells[mt.selectedCells.length - 1]

      const minCol = Math.min(last.col, clicked.col)

      const maxCol = Math.max(last.col, clicked.col)

      const minRow = Math.min(last.row, clicked.row)

      const maxRow = Math.max(last.row, clicked.row)

      for (let r = minRow; r <= maxRow; r++) {

        for (let col = minCol; col <= maxCol; col++) {

          if (!mt.selectedCells.some(c => c.col === col && c.row === r)) {

            mt.selectedCells.push({ col, row: r })

          }

        }

      }

    } else {

      mt.selectedCells = [clicked] // 单选模式

    }

    // 根据选中格子更新裁剪区域

    updateGridCropArea()

    initMtSource()

  } else if (mt.tab === 'crop' && mt.cropSubMode === 'manual') {

    mt.isSelecting = true

    mt.startX = x; mt.startY = y

    mt.cropX = x; mt.cropY = y

    mt.cropW = 0; mt.cropH = 0

  }

}



function onMtMouseMove(e: MouseEvent) {

  // 右键拖动平移（抠图模式）

  if (mt.panning) {

    mt.panX = mt.panOrigX + (e.clientX - mt.panStartX)

    mt.panY = mt.panOrigY + (e.clientY - mt.panStartY)

    return

  }

  if (!mt.isSelecting || mt.tab !== 'crop' || mt.cropSubMode !== 'manual') return

  const c = mtSourceCanvas.value; if (!c) return

  const rect = c.getBoundingClientRect()

  const scaleX = c.width / rect.width

  const scaleY = c.height / rect.height

  const x = (e.clientX - rect.left) * scaleX

  const y = (e.clientY - rect.top) * scaleY

  mt.cropX = Math.min(mt.startX, x)

  mt.cropY = Math.min(mt.startY, y)

  mt.cropW = Math.abs(x - mt.startX)

  mt.cropH = Math.abs(y - mt.startY)

  initMtSource()

}



// 处理鼠标释放事件：结束手动选取

function onMtMouseUp(_e: MouseEvent) {

  if (mt.panning) { mt.panning = false; return }

  mt.isSelecting = false // 标记选取结束

}



// 抠图模式滚轮缩放画布

function onMtWheel(e: WheelEvent) {

  if (mt.tab !== 'matting') return

  e.preventDefault()

  const delta = e.deltaY > 0 ? -0.5 : 0.5

  mt.zoom = Math.max(1, Math.min(10, mt.zoom + delta))

}

// 抠图结果预览区：鼠标滚轮缩放

function onMtResultWheel(e: WheelEvent) {

  if (!mt.resultUrl) return

  e.preventDefault()

  const delta = e.deltaY > 0 ? -0.2 : 0.2 // 向下滚缩小，向上滚放大

  mt.resultZoom = Math.max(0.2, Math.min(10, mt.resultZoom + delta)) // 限制缩放范围 0.2x~10x

}

// 抠图结果预览区：右键拖拽平移画布

function onMtResultMouseDown(e: MouseEvent) {

  if (e.button === 1) { // 中键：回归默认大小与位置

    e.preventDefault()

    mt.resultZoom = 1; mt.resultPanX = 0; mt.resultPanY = 0

    return

  }

  if (e.button !== 2 || !mt.resultUrl) return // 仅右键且已有结果时生效

  mt.resultPanning = true // 标记开始平移

  mt.resultPanStartX = e.clientX // 记录起始鼠标位置

  mt.resultPanStartY = e.clientY

  mt.resultPanOrigX = mt.resultPanX // 记录起始平移量

  mt.resultPanOrigY = mt.resultPanY

}

function onMtResultMouseMove(e: MouseEvent) {

  if (!mt.resultPanning) return // 未平移则返回

  mt.resultPanX = mt.resultPanOrigX + (e.clientX - mt.resultPanStartX) // 更新水平平移

  mt.resultPanY = mt.resultPanOrigY + (e.clientY - mt.resultPanStartY) // 更新垂直平移

}

function onMtResultMouseUp(_e: MouseEvent) {

  mt.resultPanning = false // 结束平移

}



// 应用裁剪：根据当前模式生成结果

async function applyMtCrop() {

  // 抠图模式使用抠图逻辑

  if (mt.tab === 'matting') { await applyMtMattingPreview(); statusText.value = t('cropDone'); return }

  const c = mtSourceCanvas.value // 获取源画布

  if (!c || !mt.sourceUrl) return // 没有源图则返回

  const img = await loadImage(mt.sourceUrl) // 加载原图

  const w = img.naturalWidth // 原图宽度

  const h = img.naturalHeight // 原图高度

  let x = 0, y = 0, cw = w, ch = h // 默认裁剪全图

  let cellW = 0, cellH = 0 // 网格模式单个格子宽高

  if (mt.cropSubMode === 'grid') { // 网格模式：按选中格子计算区域

    cellW = w / mt.gridSize // 单个格子宽

    cellH = h / mt.gridSize // 单个格子高

    if (mt.selectedCells.length === 0) return // 未选择格子则不裁剪

    // 计算所有选中格子的包围盒

    const minCol = Math.min(...mt.selectedCells.map(c => c.col))

    const maxCol = Math.max(...mt.selectedCells.map(c => c.col))

    const minRow = Math.min(...mt.selectedCells.map(c => c.row))

    const maxRow = Math.max(...mt.selectedCells.map(c => c.row))

    x = Math.floor(minCol * cellW) // 左上角 X

    y = Math.floor(minRow * cellH) // 左上角 Y

    cw = Math.floor((maxCol - minCol + 1) * cellW) // 裁剪宽度

    ch = Math.floor((maxRow - minRow + 1) * cellH) // 裁剪高度

  } else { // 手动模式：使用拖拽选区

    x = Math.floor(mt.cropX) // 左上角 X

    y = Math.floor(mt.cropY) // 左上角 Y

    cw = Math.floor(mt.cropW) // 裁剪宽度

    ch = Math.floor(mt.cropH) // 裁剪高度

  }

  cw = Math.max(1, Math.min(cw, w - x)) // 限制宽度在有效范围

  ch = Math.max(1, Math.min(ch, h - y)) // 限制高度在有效范围

  const rc = mtResultCanvas.value // 获取结果画布

  if (!rc) return // 未获取则返回

  rc.width = cw // 设置结果画布宽度

  rc.height = ch // 设置结果画布高度

  const rctx = rc.getContext('2d') // 获取结果画布上下文

  if (!rctx) return // 获取失败则返回

  rctx.clearRect(0, 0, cw, ch) // 清空结果画布

  if (mt.cropSubMode === 'grid') {

    // 网格模式：逐个绘制选中格子的内容，未选中格子保持透明

    for (const cell of mt.selectedCells) {

      const sx = Math.floor(cell.col * cellW)

      const sy = Math.floor(cell.row * cellH)

      const scw = Math.floor(cellW)

      const sch = Math.floor(cellH)

      rctx.drawImage(img, sx, sy, scw, sch, sx - x, sy - y, scw, sch)

    }

  } else {

    rctx.drawImage(img, x, y, cw, ch, 0, 0, cw, ch) // 绘制裁剪区域

  }

  mt.resultUrl = rc.toDataURL('image/png') // 生成结果 Data URL

  statusText.value = t('cropDone') // 更新状态文本

}



// 重置裁剪状态和结果

function resetMtCrop() {

  mt.selCol = 1; mt.selRow = 1

  mt.cropX = 0; mt.cropY = 0; mt.cropW = 0; mt.cropH = 0

  mt.resultUrl = ''

  mt.zoom = 1; mt.panX = 0; mt.panY = 0; mt.resultZoom = 1; mt.resultPanX = 0; mt.resultPanY = 0

  mt.selectedCells = [] // 清空网格裁剪选中的格子

  mtGridSelections.splice(0, mtGridSelections.length)

  initMtSource()

}



// 模式切换时重置状态并重绘源画布

function onMtModeChange() {

  mt.resultUrl = ''

  mt.selCol = 1; mt.selRow = 1

  mt.cropX = 0; mt.cropY = 0; mt.cropW = 0; mt.cropH = 0

  mt.zoom = 1; mt.panX = 0; mt.panY = 0; mt.resultZoom = 1; mt.resultPanX = 0; mt.resultPanY = 0

  if (mt.tab !== 'crop' || mt.cropSubMode !== 'grid') { mt.selectedCells = [] } // 离开网格模式时清空选中

  if (mt.tab === 'matting') {

    nextTick(() => { initMtSource(); applyMtMattingPreview() })

  } else {

    nextTick(initMtSource)

  }

}



// 抠图模式预览：对源图应用抠图参数，结果显示在右侧

async function applyMtMattingPreview() {

  if (mt.tab !== 'matting' || !mt.sourceUrl) return

  let orig = mtSourceImageData.value

  if (!orig) {

    const img = await loadImage(mt.sourceUrl)

    const tmpC = document.createElement('canvas')

    tmpC.width = img.naturalWidth; tmpC.height = img.naturalHeight

    const tmpCtx = tmpC.getContext('2d')!

    tmpCtx.drawImage(img, 0, 0)

    orig = tmpCtx.getImageData(0, 0, tmpC.width, tmpC.height)

    mtSourceImageData.value = orig

  }

  const out = applyMattingParams(orig, {

    mode: mt.mattingSubMode,

    key: mt.mattingKey,

    tolerance: mt.mattingTolerance,

    feather: mt.mattingFeather,

    edge: mt.mattingEdge,

    clusters: mt.mattingClusters,

    brightness: 0, contrast: 0, saturation: 0,

  })

  const rc = mtResultCanvas.value

  if (rc) {

    rc.width = orig.width; rc.height = orig.height

    const rctx = rc.getContext('2d')!

    rctx.putImageData(out, 0, 0)

    mt.resultUrl = rc.toDataURL('image/png')

  }

}



// 下载裁剪/抠图结果

function downloadMtResult() {

  if (!mt.resultUrl) return

  downloadUrl(mt.resultUrl, 'crop_result.png')

}



// ==================== MEDIA VIDEO PROCESS ====================

// 媒体处理-视频处理状态：支持视频抠图、裁剪、转音频、转 GIF

const vp = reactive({

  tab: 'crop', // 当前视频处理子标签

  file: null as File | null, // 上传的视频文件

  url: '', // 视频对象 URL

  duration: 0, // 视频时长（秒）

  width: 0, // 视频原始宽度

  height: 0, // 视频原始高度

  rangeStart: 0, // 处理起始时间（秒）

  rangeEnd: 0, // 处理结束时间（秒）

  fps: 12, // 抽帧帧率

  outputFormat: 'video' as 'video' | 'gif', // 帧处理结果输出格式

  processing: false, // 是否正在处理

  progress: 0, // 处理进度 0-100

  outputUrl: '', // 结果对象 URL

  outputBlob: null as Blob | null, // 结果 Blob（音频导出用）

  outputName: '', // 下载文件名

  // 抠图参数

  matting: {

    mode: 'flood' as 'flood' | 'global' | 'smart',

    key: '#00ff00',

    tolerance: 30,

    feather: 2,

    edge: 0,

    clusters: 4,

  },

  // 裁剪参数

  crop: { x: 0, y: 0, w: 0, h: 0 },

  // 转 GIF 参数

  gif: { delay: 100 },

})

const vpVideo = ref<HTMLVideoElement | null>(null) // 视频预览元素引用

const vpVideoContainer = ref<HTMLDivElement | null>(null) // 视频裁剪 overlay 容器引用

// 裁剪框拖拽/缩放状态

const cropDrag = ref<{ active: boolean; startX: number; startY: number; startCrop: { x: number; y: number; w: number; h: number } } | null>(null)

const cropResize = ref<{ active: boolean; dir: string; startX: number; startY: number; startCrop: { x: number; y: number; w: number; h: number } } | null>(null)

// 加载视频到媒体处理模块

async function loadVpVideo(file: File) {

  if (!file) return // 没有文件则直接返回

  if (vp.url) URL.revokeObjectURL(vp.url) // 释放旧视频 URL

  vp.file = file

  vp.url = URL.createObjectURL(file)

  vp.outputUrl = ''

  vp.outputBlob = null

  vp.progress = 0

  vp.processing = false

  await nextTick()

  // 自动保存上传的视频到资源库

  saveFileToLibrary(file, vp.url)

}

// 视频元数据加载后初始化处理参数

function onVpVideoMeta() {

  const v = vpVideo.value

  if (!v) return

  vp.duration = v.duration

  vp.width = v.videoWidth

  vp.height = v.videoHeight

  vp.rangeStart = 0

  vp.rangeEnd = v.duration

  // 默认裁剪区域为全视频

  vp.crop = { x: 0, y: 0, w: v.videoWidth, h: v.videoHeight }

}

// 计算视频在当前容器中的实际显示区域（等比缩放后居中）

function getVideoDisplayRect() {

  const container = vpVideoContainer.value

  const v = vpVideo.value

  if (!container || !v || !vp.width || !vp.height) return null

  const rect = container.getBoundingClientRect()

  const scale = Math.min(rect.width / vp.width, rect.height / vp.height)

  const drawW = vp.width * scale

  const drawH = vp.height * scale

  return {

    scale,

    x: (rect.width - drawW) / 2,

    y: (rect.height - drawH) / 2,

    w: drawW,

    h: drawH,

  }

}

// 将源分辨率裁剪坐标转换为显示像素坐标

function cropToDisplay(crop: { x: number; y: number; w: number; h: number }) {

  const d = getVideoDisplayRect()

  if (!d) return { x: 0, y: 0, w: 0, h: 0 }

  return {

    x: d.x + crop.x * d.scale,

    y: d.y + crop.y * d.scale,

    w: crop.w * d.scale,

    h: crop.h * d.scale,

  }

}

// 限制裁剪区域不超出视频源范围

function clampCropToSource(crop: { x: number; y: number; w: number; h: number }) {

  let x = Math.max(0, Math.min(crop.x, vp.width - 1))

  let y = Math.max(0, Math.min(crop.y, vp.height - 1))

  let w = Math.max(1, Math.min(crop.w, vp.width - x))

  let h = Math.max(1, Math.min(crop.h, vp.height - y))

  return { x, y, w, h }

}

// 鼠标在裁剪框上按下：开始拖拽

function onCropBoxMouseDown(e: MouseEvent) {

  if (cropResize.value?.active) return

  e.preventDefault()

  e.stopPropagation()

  cropDrag.value = {

    active: true,

    startX: e.clientX,

    startY: e.clientY,

    startCrop: { ...vp.crop },

  }

  window.addEventListener('mousemove', onCropMouseMove)

  window.addEventListener('mouseup', onCropMouseUp)

}

// 鼠标在右下角缩放手柄按下：开始缩放

function onCropResizeStart(dir: string, e: MouseEvent) {

  e.preventDefault()

  e.stopPropagation()

  cropResize.value = {

    active: true,

    dir,

    startX: e.clientX,

    startY: e.clientY,

    startCrop: { ...vp.crop },

  }

  window.addEventListener('mousemove', onCropMouseMove)

  window.addEventListener('mouseup', onCropMouseUp)

}

// 拖拽/缩放过程中更新裁剪区域

function onCropMouseMove(e: MouseEvent) {

  const d = getVideoDisplayRect()

  if (!d) return

  if (cropDrag.value?.active) {

    const dx = (e.clientX - cropDrag.value.startX) / d.scale

    const dy = (e.clientY - cropDrag.value.startY) / d.scale

    vp.crop = clampCropToSource({

      x: cropDrag.value.startCrop.x + dx,

      y: cropDrag.value.startCrop.y + dy,

      w: cropDrag.value.startCrop.w,

      h: cropDrag.value.startCrop.h,

    })

  } else if (cropResize.value?.active) {

    const dx = (e.clientX - cropResize.value.startX) / d.scale

    const dy = (e.clientY - cropResize.value.startY) / d.scale

    const sc = cropResize.value.startCrop

    vp.crop = clampCropToSource({

      x: sc.x,

      y: sc.y,

      w: Math.max(1, sc.w + dx),

      h: Math.max(1, sc.h + dy),

    })

  }

}

// 拖拽/缩放结束

function onCropMouseUp() {

  cropDrag.value = null

  cropResize.value = null

  window.removeEventListener('mousemove', onCropMouseMove)

  window.removeEventListener('mouseup', onCropMouseUp)

}

// 视频裁剪框的显示样式（根据 vp.crop 与视频实际显示区域实时计算）

const vpCropBoxStyle = computed(() => {

  const d = cropToDisplay(vp.crop)

  return {

    left: d.x + 'px',

    top: d.y + 'px',

    width: d.w + 'px',

    height: d.h + 'px',

  }

})

// 处理视频：根据当前 tab 执行抠图/裁剪/音频提取/转 GIF

async function processVideo() {

  if (!vp.url || !vp.file) return // 未上传视频则返回

  vp.processing = true

  vp.progress = 0

  vp.outputUrl = ''

  vp.outputBlob = null

  try {

    if (vp.tab === 'audio') {

      // 音频提取：直接解码文件并导出 WAV

      const blob = await extractVideoAudio(vp.file)

      vp.outputBlob = blob

      vp.outputUrl = URL.createObjectURL(blob)

      vp.outputName = 'audio_extract.wav'

      vp.progress = 100

      showToast(t('processDone'), 'success')

    } else {

      // 帧处理：先按时间范围与帧率提取帧

      const crop: VideoCropRect | undefined = vp.tab === 'crop' ? vp.crop : undefined

      const frames = await extractVpFrames(vp.url, {

        start: vp.rangeStart,

        end: vp.rangeEnd,

        fps: vp.fps,

        crop,

        maxFrames: 120,

      })

      vp.progress = 50

      let processedFrames = frames

      // 抠图模式：对每一帧应用抠图参数

      if (vp.tab === 'matting') {

        const params: MattingParams = {

          mode: vp.matting.mode,

          key: vp.matting.key,

          tolerance: vp.matting.tolerance,

          feather: vp.matting.feather,

          edge: vp.matting.edge,

          clusters: vp.matting.clusters,

          brightness: 0,

          contrast: 0,

          saturation: 0,

        }

        processedFrames = []

        for (let i = 0; i < frames.length; i++) {

          const url = await mattingFrame(frames[i].url, params)

          processedFrames.push({ url, width: frames[i].width, height: frames[i].height })

          vp.progress = 50 + Math.round(((i + 1) / frames.length) * 40)

        }

      }

      // 根据输出格式或当前标签合成 GIF / WebM

      const wantGif = vp.tab === 'gif' || vp.outputFormat === 'gif'

      if (wantGif) {

        const delay = vp.tab === 'gif' ? vp.gif.delay : 100

        const { url, size } = await renderFramesToGif(processedFrames, delay)

        vp.outputUrl = url

        vp.outputName = 'video_process.gif'

        showToast(t('processDone') + ' ' + formatBytes(size), 'success')

      } else {

        const url = await renderFramesToVideo(processedFrames, 1000 / vp.fps)

        vp.outputUrl = url

        vp.outputName = 'video_process.webm'

        showToast(t('processDone'), 'success')

      }

      vp.progress = 100

    }

  } catch (e: any) {

    showToast((e?.message as string) || t('processFailed'), 'error')

  } finally {

    vp.processing = false

  }

}

// 下载视频处理结果

function downloadVpResult() {

  if (!vp.outputUrl) return

  const name = vp.outputName || 'video_process'

  downloadUrl(vp.outputUrl, name)

}



// ==================== PIXEL DRAW ====================

interface PixelLayer { name: string; visible: boolean; data: Uint8ClampedArray }

const pd = reactive({ tool: 'pencil', brush: 1, zoom: 16, color: '#00d4aa', bg: 'black' as 'black' | 'white' | 'transparent', w: 32, h: 32, layer: 0, layers: [] as PixelLayer[], recent: ['#00d4aa','#7b61ff','#ffaa00','#ff4d4d'], panX: 0, panY: 0 })

const pixelCanvas = ref<HTMLCanvasElement | null>(null)

const pixelImportInput = ref<HTMLInputElement | null>(null)

const pixelTools = [

  { key: 'pencil', label: '铅笔', icon: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>' },

  { key: 'eraser', label: '橡皮', icon: '<path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"/><path d="M17 17L7 7"/>' },

  { key: 'fill', label: '填充', icon: '<path d="M19 11l-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11z"/><path d="M5 19h14"/>' },

  { key: 'picker', label: '取色器', icon: '<path d="M20.2 7.6l-3.8-3.8a2 2 0 0 0-2.8 0L3 14.2V19h4.8l10.6-10.6a2 2 0 0 0 0-2.8z"/><path d="M14 6l4 4"/>' },

]

const pixelPalette = ['#000000','#1a1a24','#5f6370','#f0f0f5','#ff4d4d','#ffaa00','#00d4aa','#7b61ff','#c9a86c','#8b7355','#3d3226','#ffffff','#e02e2e','#d98a00','#0d9e7f','#5b4cdb']



// 历史记录：存储图层数据快照

const pdHistory: PixelLayer[][] = []

const pdHistoryIndex = ref(-1)

let pdDrawing = false

let pdLastX = 0

let pdLastY = 0

let pdStartX = 0

let pdStartY = 0

let pdPanStartX = 0

let pdPanStartY = 0

let pdPanning = false

let pdPreviewActive = false

let pdPreviewEndX = 0

let pdPreviewEndY = 0



function isShapeTool(t: string) { return ['line','rect','triangle','circle','ellipse','star'].includes(t) }

function hexToRgba(hex: string): [number, number, number, number] {

  const clean = hex.replace('#', '')

  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean

  return [parseInt(full.slice(0,2),16) || 0, parseInt(full.slice(2,4),16) || 0, parseInt(full.slice(4,6),16) || 0, 255]

}

function pdBgRgba(): [number, number, number, number] {

  if (pd.bg === 'transparent') return [0,0,0,0]

  return pd.bg === 'black' ? [14,14,20,255] : [255,255,255,255]

}

function pdClearLayer(data: Uint8ClampedArray) {

  const bg = pdBgRgba()

  for (let i = 0; i < data.length; i += 4) { data[i]=bg[0]; data[i+1]=bg[1]; data[i+2]=bg[2]; data[i+3]=bg[3] }

}

function pdInitLayers() {

  pd.layers = [{ name: '图层 1', visible: true, data: new Uint8ClampedArray(pd.w * pd.h * 4) }]

  pdClearLayer(pd.layers[0].data)

  pdSaveState()

}

function pdSnapshot(): PixelLayer[] {

  return pd.layers.map(l => ({ name: l.name, visible: l.visible, data: new Uint8ClampedArray(l.data) }))

}

function pdRestore(snapshot: PixelLayer[]) {

  pd.layers = snapshot.map(l => ({ name: l.name, visible: l.visible, data: new Uint8ClampedArray(l.data) }))

  pdRender()

}

function pdSaveState() {

  if (pdHistoryIndex.value < pdHistory.length - 1) pdHistory.splice(pdHistoryIndex.value + 1)

  pdHistory.push(pdSnapshot())

  pdHistoryIndex.value = pdHistory.length - 1

  if (pdHistory.length > 50) { pdHistory.shift(); pdHistoryIndex.value-- }

}

function pdUndo() {

  if (pdHistoryIndex.value > 0) { pdHistoryIndex.value--; pdRestore(pdHistory[pdHistoryIndex.value]) }

}

function pdRedo() {

  if (pdHistoryIndex.value < pdHistory.length - 1) { pdHistoryIndex.value++; pdRestore(pdHistory[pdHistoryIndex.value]) }

}

function pdResetCanvas() {

  if (!confirm(t('resetCanvasConfirm'))) return

  pdInitLayers()

  statusText.value = t('ready')

}



function getPixelCoords(e: MouseEvent): { x: number; y: number } {

  const c = pixelCanvas.value; if (!c) return { x: 0, y: 0 }

  const rect = c.getBoundingClientRect()

  return { x: Math.floor((e.clientX - rect.left) / pd.zoom), y: Math.floor((e.clientY - rect.top) / pd.zoom) }

}

function getPixel(data: Uint8ClampedArray, x: number, y: number): Uint8ClampedArray {

  const i = (y * pd.w + x) * 4

  return data.subarray(i, i + 4)

}

function setPixel(data: Uint8ClampedArray, x: number, y: number, rgba: [number,number,number,number]) {

  if (x < 0 || y < 0 || x >= pd.w || y >= pd.h) return

  const i = (y * pd.w + x) * 4

  data[i] = rgba[0]; data[i+1] = rgba[1]; data[i+2] = rgba[2]; data[i+3] = rgba[3]

}

function colorsEqual(a: Uint8ClampedArray, b: [number,number,number,number]) {

  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]

}



// 将图层数据渲染到缩放后的画布

function pdRender() {

  nextTick(() => {

    const c = pixelCanvas.value; if (!c) return

    const ctx = c.getContext('2d')!

    // 透明背景使用棋盘格

    if (pd.bg === 'transparent') {

      const check = 8 * pd.zoom

      for (let x = 0; x < c.width; x += check) {

        for (let y = 0; y < c.height; y += check) {

          ctx.fillStyle = ((x/check + y/check) % 2 === 0) ? '#ffffff' : '#cccccc'

          ctx.fillRect(x, y, check, check)

        }

      }

    } else {

      ctx.fillStyle = pd.bg === 'black' ? '#0e0e14' : '#ffffff'

      ctx.fillRect(0,0,c.width,c.height)

    }

    // 绘制可见图层

    const temp = document.createElement('canvas'); temp.width = pd.w; temp.height = pd.h

    const tctx = temp.getContext('2d')!

    for (const l of pd.layers) {

      if (!l.visible) continue

      tctx.putImageData(new ImageData(new Uint8ClampedArray(l.data), pd.w, pd.h), 0, 0)

      ctx.imageSmoothingEnabled = false

      ctx.drawImage(temp, 0, 0, c.width, c.height)

    }

    // 绘制网格

    ctx.strokeStyle = pd.bg === 'black' || pd.bg === 'transparent' ? '#1e1e2e' : '#d9dce3'

    ctx.lineWidth = 1

    for (let x = 0; x <= c.width; x += pd.zoom) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,c.height); ctx.stroke() }

    for (let y = 0; y <= c.height; y += pd.zoom) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(c.width,y); ctx.stroke() }

    // 绘制形状预览（使用独立临时画布，避免覆盖已绘制的图层）

    if (pdPreviewActive && isShapeTool(pd.tool)) {

      const shapeData = rasterizeShape(pd.tool, pdStartX, pdStartY, pdPreviewEndX, pdPreviewEndY)

      if (shapeData) {

        const shapeTemp = document.createElement('canvas')

        shapeTemp.width = pd.w; shapeTemp.height = pd.h

        const sctx = shapeTemp.getContext('2d')!

        sctx.putImageData(shapeData, 0, 0)

        ctx.globalAlpha = 0.6

        ctx.imageSmoothingEnabled = false

        ctx.drawImage(shapeTemp, 0, 0, c.width, c.height)

        ctx.globalAlpha = 1

      }

    }

  })

}



function rasterizeShape(tool: string, x1: number, y1: number, x2: number, y2: number): ImageData | null {

  const c = document.createElement('canvas'); c.width = pd.w; c.height = pd.h

  const ctx = c.getContext('2d')!; ctx.fillStyle = pd.color; ctx.strokeStyle = pd.color; ctx.lineWidth = 1

  let ex = x2, ey = y2

  // Shift 锁定为正方形/正圆

  if (tool === 'rect' || tool === 'circle') {

    const dx = ex - x1, dy = ey - y1

    const size = Math.max(Math.abs(dx), Math.abs(dy))

    ex = x1 + Math.sign(dx || 1) * size

    ey = y1 + Math.sign(dy || 1) * size

  }

  if (tool === 'line') {

    ctx.beginPath(); ctx.moveTo(x1 + 0.5, y1 + 0.5); ctx.lineTo(ex + 0.5, ey + 0.5); ctx.stroke()

  } else if (tool === 'rect') {

    const x = Math.min(x1, ex), y = Math.min(y1, ey), w = Math.abs(ex - x1) + 1, h = Math.abs(ey - y1) + 1

    ctx.fillRect(x, y, w, h)

  } else if (tool === 'triangle') {

    ctx.beginPath(); ctx.moveTo((x1 + ex) / 2 + 0.5, y1 + 0.5); ctx.lineTo(x1 + 0.5, ey + 0.5); ctx.lineTo(ex + 0.5, ey + 0.5); ctx.closePath(); ctx.fill()

  } else if (tool === 'circle') {

    const cx = (x1 + ex) / 2, cy = (y1 + ey) / 2, r = Math.max(Math.abs(ex - x1), Math.abs(ey - y1)) / 2

    ctx.beginPath(); ctx.arc(cx + 0.5, cy + 0.5, Math.max(0, r), 0, Math.PI * 2); ctx.fill()

  } else if (tool === 'ellipse') {

    const cx = (x1 + ex) / 2, cy = (y1 + ey) / 2, rx = Math.abs(ex - x1) / 2, ry = Math.abs(ey - y1) / 2

    ctx.beginPath(); ctx.ellipse(cx + 0.5, cy + 0.5, Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2); ctx.fill()

  } else if (tool === 'star') {

    drawStar(ctx, (x1 + ex) / 2 + 0.5, (y1 + ey) / 2 + 0.5, Math.max(Math.abs(ex - x1), Math.abs(ey - y1)) / 2, 5)

  }

  return ctx.getImageData(0, 0, pd.w, pd.h)

}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, points: number) {

  ctx.beginPath()

  for (let i = 0; i < points * 2; i++) {

    const r = i % 2 === 0 ? outerR : outerR / 2

    const a = (i * Math.PI / points) - Math.PI / 2

    const x = cx + Math.cos(a) * r

    const y = cy + Math.sin(a) * r

    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)

  }

  ctx.closePath(); ctx.fill()

}

function commitShape(x1: number, y1: number, x2: number, y2: number) {

  const shapeData = rasterizeShape(pd.tool, x1, y1, x2, y2)

  if (!shapeData) return

  const layer = pd.layers[pd.layer].data

  const color = hexToRgba(pd.color)

  for (let i = 0; i < shapeData.data.length; i += 4) {

    if (shapeData.data[i+3] > 0) {

      layer[i] = color[0]; layer[i+1] = color[1]; layer[i+2] = color[2]; layer[i+3] = color[3]

    }

  }

  pdSaveState()

}



function drawLineOnLayer(x1: number, y1: number, x2: number, y2: number, color: [number,number,number,number]) {

  const data = pd.layers[pd.layer].data

  const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1)

  const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1

  let err = dx - dy, x = x1, y = y1

  while (true) {

    for (let by = 0; by < pd.brush; by++) {

      for (let bx = 0; bx < pd.brush; bx++) { setPixel(data, x + bx, y + by, color) }

    }

    if (x === x2 && y === y2) break

    const e2 = 2 * err

    if (e2 > -dy) { err -= dy; x += sx }

    if (e2 < dx) { err += dx; y += sy }

  }

}



function floodFillLayer(x: number, y: number) {

  const data = pd.layers[pd.layer].data

  const w = pd.w, h = pd.h

  if (x < 0 || y < 0 || x >= w || y >= h) return

  const target = [getPixel(data,x,y)[0], getPixel(data,x,y)[1], getPixel(data,x,y)[2], getPixel(data,x,y)[3]] as [number,number,number,number]

  const fill = hexToRgba(pd.color)

  if (colorsEqual(getPixel(data,x,y), fill)) return

  pdSaveState()

  const stack = [[x, y]]; const visited = new Set<number>()

  while (stack.length) {

    const [px, py] = stack.pop()!

    const key = py * w + px

    if (visited.has(key) || px < 0 || py < 0 || px >= w || py >= h) continue

    if (!colorsEqual(getPixel(data, px, py), target)) continue

    visited.add(key)

    setPixel(data, px, py, fill)

    stack.push([px+1, py], [px-1, py], [px, py+1], [px, py-1])

  }

  pdRender()

}



function pickPixelColor(x: number, y: number) {

  if (x < 0 || y < 0 || x >= pd.w || y >= pd.h) return

  const d = getPixel(pd.layers[pd.layer].data, x, y)

  const hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('')

  pd.color = hex

  if (!pd.recent.includes(hex)) { pd.recent.unshift(hex); pd.recent.splice(4) }

}



function pdMouseDown(e: MouseEvent) {

  if (e.button === 2) { pdPanning = true; pdPanStartX = e.clientX; pdPanStartY = e.clientY; return }

  const { x, y } = getPixelCoords(e)

  if (pd.tool === 'picker') { pickPixelColor(x, y); return }

  if (pd.tool === 'fill') { floodFillLayer(x, y); return }

  pdDrawing = true

  pdStartX = x; pdStartY = y

  pdLastX = x; pdLastY = y

  pdPreviewActive = false

  if (pd.tool === 'pencil' || pd.tool === 'eraser') pdSaveState()

  if (pd.tool === 'pencil' || pd.tool === 'eraser') {

    const color = pd.tool === 'eraser' ? pdBgRgba() : hexToRgba(pd.color)

    setPixel(pd.layers[pd.layer].data, x, y, color)

    pdRender()

  }

}



// 按住 Shift 时，将直线终点吸附到水平、垂直或 45° 对角线

function snapLineEnd(x1: number, y1: number, x2: number, y2: number): [number, number] {

  const dx = x2 - x1, dy = y2 - y1

  const adx = Math.abs(dx), ady = Math.abs(dy)

  if (adx > ady * 2) return [x2, y1]

  if (ady > adx * 2) return [x1, y2]

  const d = Math.max(adx, ady)

  return [x1 + Math.sign(dx || 1) * d, y1 + Math.sign(dy || 1) * d]

}



function pdMouseMove(e: MouseEvent) {

  if (pdPanning) {

    pd.panX = pd.panX + e.clientX - pdPanStartX

    pd.panY = pd.panY + e.clientY - pdPanStartY

    pdPanStartX = e.clientX

    pdPanStartY = e.clientY

    return

  }

  if (!pdDrawing) return

  const { x, y } = getPixelCoords(e)

  if (pd.tool === 'pencil' || pd.tool === 'eraser') {

    const color = pd.tool === 'eraser' ? pdBgRgba() : hexToRgba(pd.color)

    drawLineOnLayer(pdLastX, pdLastY, x, y, color)

    pdLastX = x; pdLastY = y

    pdRender()

  } else if (isShapeTool(pd.tool)) {

    let ex = x, ey = y

    if (pd.tool === 'line' && e.shiftKey) { [ex, ey] = snapLineEnd(pdStartX, pdStartY, x, y) }

    pdPreviewEndX = ex; pdPreviewEndY = ey

    pdPreviewActive = true

    pdRender()

  }

}



function pdMouseUp(e: MouseEvent) {

  if (pdPanning) {

    pdPanning = false

    return

  }

  if (!pdDrawing) return

  pdDrawing = false

  if (isShapeTool(pd.tool)) {

    let { x, y } = getPixelCoords(e)

    if (pd.tool === 'line' && e.shiftKey) { [x, y] = snapLineEnd(pdStartX, pdStartY, x, y) }

    commitShape(pdStartX, pdStartY, x, y)

    pdPreviewActive = false

    pdRender()

  }

}



function pdMouseWheel(e: WheelEvent) {

  pd.zoom = Math.max(1, Math.min(32, pd.zoom + (e.deltaY > 0 ? -1 : 1)))

}



function togglePixelBg() {

  const list: Array<'black'|'white'|'transparent'> = ['black','white','transparent']

  const idx = list.indexOf(pd.bg)

  pd.bg = list[(idx + 1) % list.length]

}



function triggerPixelImport() { pixelImportInput.value?.click() }

async function handlePixelImport(e: Event) {

  const target = e.target as HTMLInputElement; if (!target.files?.[0]) return

  const url = await fileToDataUrl(target.files[0]); target.value = ''

  const img = await loadImage(url)

  // 将图像缩放到画布尺寸并写入当前图层

  const tmp = document.createElement('canvas'); tmp.width = pd.w; tmp.height = pd.h

  const tctx = tmp.getContext('2d')!; tctx.imageSmoothingEnabled = false; tctx.drawImage(img, 0, 0, pd.w, pd.h)

  pd.layers[pd.layer].data = new Uint8ClampedArray(tctx.getImageData(0, 0, pd.w, pd.h).data)

  pdSaveState(); pdRender()

}

function importPixelFromLibrary() {

  openAssetPicker('image', (asset) => {

    const img = new Image()

    img.onload = () => {

      const tmp = document.createElement('canvas'); tmp.width = pd.w; tmp.height = pd.h

      const tctx = tmp.getContext('2d')!; tctx.imageSmoothingEnabled = false; tctx.drawImage(img, 0, 0, pd.w, pd.h)

      pd.layers[pd.layer].data = new Uint8ClampedArray(tctx.getImageData(0, 0, pd.w, pd.h).data)

      pdSaveState(); pdRender()

      statusText.value = t('savedToLibrary')

    }

    img.src = asset.dataUrl

  })

}

function exportPixelPng() { if (pixelCanvas.value) downloadUrl(pixelCanvas.value.toDataURL(), 'pixel_draw.png') }

function savePixelToLibrary() { if (pixelCanvas.value) saveToLibrary(pixelCanvas.value.toDataURL(), 'output') }



function handleKeyDown(e: KeyboardEvent) {

  if (!(e.ctrlKey || e.metaKey)) return

  // Ctrl+Z 撤销，Ctrl+Shift+Z 重做

  if (e.key === 'z' || e.key === 'Z') {

    e.preventDefault()

    if (e.shiftKey) pdRedo()

    else pdUndo()

  }

  // Ctrl+Y 重置画布（二次确认）

  if (e.key === 'y' || e.key === 'Y') {

    e.preventDefault()

    pdResetCanvas()

  }

}



watch(() => [pd.zoom, pd.bg], pdRender, { immediate: true })



// ==================== PIXEL PROCESS ====================

const pp = reactive({ sourceUrl: '', resultUrl: '', width: '64', customWidth: 64, scaleMode: 'nearest', outline: 'none', colors: 16, dither: 'none' })

async function loadPixelProcess(file: File) { const dataUrl = await fileToDataUrl(file); pp.sourceUrl = dataUrl; await saveFileToLibrary(file, dataUrl) }

async function applyPixelProcess() {

  if (!pp.sourceUrl) return

  const img = await loadImage(pp.sourceUrl)

  const w = pp.width === 'custom' ? pp.customWidth : parseInt(pp.width)

  const h = Math.round(w * (img.naturalHeight / img.naturalWidth))

  const c = document.createElement('canvas'); c.width = w; c.height = h

  const ctx = c.getContext('2d')!; ctx.imageSmoothingEnabled = pp.scaleMode === 'pixel'; ctx.drawImage(img, 0, 0, w, h)

  if (pp.outline !== 'none') { ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(0,0,w,h) }

  pp.resultUrl = c.toDataURL(); statusText.value = t('pixelProcessDone')

}



// ==================== PIXEL CHAR ====================

const pc = reactive({ sourceUrl: '', style: 'v1', action: 'walk', width: 32, colors: 16, resultCanvas: false })

const pcResultCanvas = ref<HTMLCanvasElement | null>(null)

const pcStyles = [{ key: 'v1', label: 'V1' }, { key: 'v2', label: 'V2' }, { key: 'v3', label: 'V3' }]

const pcStyleDesc = computed(() => ({ v1: '标准 4 帧行走动画', v2: '8 帧流畅动作', v3: '2 帧复古抖动' }[pc.style]))

async function loadPixelChar(file: File) { const dataUrl = await fileToDataUrl(file); pc.sourceUrl = dataUrl; await saveFileToLibrary(file, dataUrl) }

async function generatePixelChar() {

  pc.resultCanvas = true

  nextTick(async () => {

    const c = pcResultCanvas.value; if (!c) return

    const frames = pc.style === 'v1' ? 4 : pc.style === 'v2' ? 8 : 2

    c.width = pc.width * frames; c.height = pc.width

    const ctx = c.getContext('2d')!; ctx.fillStyle = '#0e0e14'; ctx.fillRect(0,0,c.width,c.height)

    if (pc.sourceUrl) {

      try {

        const img = await loadImage(pc.sourceUrl)

        const srcCanvas = document.createElement('canvas'); srcCanvas.width = pc.width; srcCanvas.height = pc.width

        const sctx = srcCanvas.getContext('2d')!; sctx.imageSmoothingEnabled = false

        sctx.drawImage(img, 0, 0, pc.width, pc.width)

        for (let i = 0; i < frames; i++) {

          const offX = Math.sin((i / frames) * Math.PI * 2) * (pc.width / 6)

          const offY = Math.abs(Math.sin((i / frames) * Math.PI * 2)) * (pc.width / 4)

          ctx.drawImage(srcCanvas, i * pc.width + offX, offY, pc.width, pc.width)

        }

      } catch {

        for (let i = 0; i < frames; i++) {

          ctx.fillStyle = '#00d4aa'

          ctx.fillRect(i * pc.width + pc.width/4, pc.width/4, pc.width/2, pc.width/2)

        }

      }

    } else {

      for (let i = 0; i < frames; i++) {

        const x = i * pc.width + pc.width/2, y = pc.width/2 + Math.sin((i / frames) * Math.PI * 2) * (pc.width/4)

        ctx.fillStyle = '#00d4aa'; ctx.beginPath(); ctx.arc(x, y, pc.width/6, 0, Math.PI*2); ctx.fill()

      }

    }

    statusText.value = t('pixelActionDone')

  })

}

function downloadPixelCharSprite() { if (pcResultCanvas.value) downloadUrl(pcResultCanvas.value.toDataURL(), 'pixel_action.png') }

function savePixelCharToLibrary() { if (pcResultCanvas.value) saveToLibrary(pcResultCanvas.value.toDataURL(), 'sprite') }



// ==================== SEQUENCE VIDEO ====================

const videoStepLabels = computed(() => [t('videoStep1'), t('videoStep2'), t('videoStep3')])

const gifStepLabels = computed(() => [t('gifStep1'), t('gifStep2'), t('gifStep3')])

const videoEstFrames = computed(() => estimateFrameCount(video.rangeStart, video.rangeEnd, video.fps))

const gifEstFrames = computed(() => estimateFrameCount(gif.rangeStart, gif.rangeEnd, gif.fps))

const video = reactive({

  step: 1, file: null as File | null, url: '', duration: 0, width: 0, height: 0, nativeFps: 30, fps: 12, outW: 512, outH: 512,

  frames: [] as { url: string; selected: boolean; similarGroup: number; originalUrl?: string }[],

  previewFps: 12, playing: false, progress: 0, showCrop: true,

  crop: { x: 0, y: 0, w: 100, h: 100 },

  rangeStart: 0, rangeEnd: 0, lockAspect: true,

  export: { format: 'video', cols: 4, preset: 'custom', w: 512, h: 512, lockAspect: true, compression: 'none', delay: 100, name: 'artforge_export', preview: '', sizeEstimate: '' }

})

const sourceVideo = ref<HTMLVideoElement | null>(null)

const videoFileInput = ref<HTMLInputElement | null>(null) // 隐藏的视频文件输入框引用

const videoCropContainer = ref<HTMLDivElement | null>(null)

const cropPreviewCanvas = ref<HTMLCanvasElement | null>(null)

const videoPreviewCanvas = ref<HTMLCanvasElement | null>(null) // 裁剪后视频实时预览画布引用

const videoCropPreviewPlaying = ref(false) // 裁剪视频实时预览是否正在播放

let videoPreviewRaf: number | null = null // 视频预览动画帧请求 ID

const videoAnimCanvas = ref<HTMLCanvasElement | null>(null)

const exportPreviewVideo = ref<HTMLVideoElement | null>(null) // 导出结果视频预览元素引用

let cropResizing = false

let videoAnimRaf: number | null = null

let videoAnimFrame = 0



// 裁剪框在页面上显示时的缩放与偏移（因为视频可能被缩放显示）

const cropMetrics = reactive({ scale: 1, offsetX: 0, offsetY: 0 })



const videoCropStyle = computed(() => ({

  left: cropMetrics.offsetX + video.crop.x * cropMetrics.scale + 'px',

  top: cropMetrics.offsetY + video.crop.y * cropMetrics.scale + 'px',

  width: video.crop.w * cropMetrics.scale + 'px',

  height: video.crop.h * cropMetrics.scale + 'px'

}))



const similarColors = ['#ff4d4d','#ffd000','#28c76f','#1f8bff','#ff7a00','#a04bff','#ff3d9a','#00c2a8','#ffe14d','#7c5cff']



// 相似帧配色样式（加强版）：实色边框 + 外发光 + 顶部色条，区分更明显

function similarFrameStyle(group: number): Record<string, string> {

  if (group === -1 || group === undefined) return {}

  const color = similarColors[group % similarColors.length]

  return {

    borderColor: color,

    borderWidth: '2px',

    borderStyle: 'solid',

    boxShadow: '0 0 0 2px ' + color,

  }

}



// 根据视频元素的实际显示尺寸更新裁剪框的显示缩放与偏移

function updateCropMetrics() {

  const container = videoCropContainer.value

  const v = sourceVideo.value

  if (!container || !v) return

  const metrics = computeCropDisplayMetrics(

    container.getBoundingClientRect(),

    v.getBoundingClientRect(),

    video.width || v.videoWidth,

    video.height || v.videoHeight

  )

  cropMetrics.scale = metrics.scale

  cropMetrics.offsetX = metrics.offsetX

  cropMetrics.offsetY = metrics.offsetY

}



function onVideoMeta() {

  const v = sourceVideo.value; if (!v) return

  video.duration = v.duration; video.width = v.videoWidth; video.height = v.videoHeight

  let detectedFps = 30

  const videoTracks = (v as HTMLVideoElement & { videoTracks?: { frameRate?: number }[] }).videoTracks

  if (videoTracks) {

    for (let i = 0; i < videoTracks.length; i++) {

      if (videoTracks[i]?.frameRate) { detectedFps = videoTracks[i].frameRate || 30; break }

    }

  }

  video.nativeFps = detectedFps

  video.crop = { x: 0, y: 0, w: v.videoWidth, h: v.videoHeight }

  video.outW = v.videoWidth

  video.outH = v.videoHeight

  video.rangeEnd = v.duration

  video.showCrop = true

  nextTick(() => { updateCropMetrics(); updateCropPreview(); drawVideoCropFrame() })

}



function startCropResize(_e: MouseEvent, dir: string) {

  cropResizing = true

  const onMove = (ev: MouseEvent) => {

    if (!cropResizing) return

    const container = videoCropContainer.value; if (!container) return

    const rect = container.getBoundingClientRect()

    const mx = (ev.clientX - rect.left - cropMetrics.offsetX) / cropMetrics.scale

    const my = (ev.clientY - rect.top - cropMetrics.offsetY) / cropMetrics.scale

    const vw = video.width || 640, vh = video.height || 360

    if (dir.includes('e')) { video.crop.w = Math.max(10, Math.min(mx, vw) - video.crop.x) }

    if (dir.includes('w')) {

      const newX = Math.max(0, Math.min(mx, video.crop.x + video.crop.w - 10))

      video.crop.w = video.crop.x + video.crop.w - newX

      video.crop.x = newX

    }

    if (dir.includes('s')) { video.crop.h = Math.max(10, Math.min(my, vh) - video.crop.y) }

    if (dir.includes('n')) {

      const newY = Math.max(0, Math.min(my, video.crop.y + video.crop.h - 10))

      video.crop.h = video.crop.y + video.crop.h - newY

      video.crop.y = newY

    }

    video.crop = clampCrop(video.crop, vw, vh)

  }

  const onUp = () => { cropResizing = false; updateCropPreview(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }

  window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)

}



function updateCropFromInputs() {

  video.showCrop = true

  video.crop = clampCrop(video.crop, video.width, video.height)

  updateCropPreview()

}



function updateCropPreview() {

  const v = sourceVideo.value; if (!v) return

  const c = cropPreviewCanvas.value; if (!c) return

  const ctx = c.getContext('2d')!

  c.width = video.outW || video.crop.w

  c.height = video.outH || video.crop.h

  ctx.fillStyle = '#14141c'

  ctx.fillRect(0, 0, c.width, c.height)

  try {

    const fit = fitCropToOutput(video.crop.w, video.crop.h, c.width, c.height)

    ctx.drawImage(v, video.crop.x, video.crop.y, video.crop.w, video.crop.h, fit.x, fit.y, fit.w, fit.h)

  } catch { /* canvas tainted or video not ready */ }

}



// 重新上传视频：点击时不立刻清空状态，仅弹出文件选择框

function reuploadVideo() {

  // 不立刻清空页面状态，仅弹出文件选择框；用户真正选择新文件后再在 loadVideo 中重置

  nextTick(() => videoFileInput.value?.click())

}



// 切换裁剪视频实时预览的播放/暂停状态

function toggleCropVideoPreview() {

  if (videoCropPreviewPlaying.value) stopCropVideoPreview() // 正在播放则停止

  else startCropVideoPreview() // 未播放则开始

}



// 开始裁剪视频实时预览

function startCropVideoPreview() {

  const v = sourceVideo.value // 获取源视频元素

  if (!v) return // 未加载视频则返回

  if (v.currentTime < video.rangeStart || v.currentTime > video.rangeEnd) {

    v.currentTime = video.rangeStart // 若当前时间不在范围内则跳回起始时间

  }

  v.play().catch(() => {}) // 尝试播放视频

  videoCropPreviewPlaying.value = true // 标记为播放状态

  renderCropVideoPreview() // 启动渲染循环

}



// 停止裁剪视频实时预览

function stopCropVideoPreview() {

  videoCropPreviewPlaying.value = false // 标记为暂停状态

  if (videoPreviewRaf) { cancelAnimationFrame(videoPreviewRaf); videoPreviewRaf = null } // 取消动画帧

  const v = sourceVideo.value // 获取源视频元素

  if (v && !v.paused) v.pause() // 若视频正在播放则暂停

}



// 绘制单帧裁剪视频实时预览（无论播放/暂停都可用）

function drawVideoCropFrame() {

  const v = sourceVideo.value // 获取源视频元素

  const c = videoPreviewCanvas.value // 获取预览画布

  if (!v || !c) return // 任一元素不存在则返回

  const ctx = c.getContext('2d') // 获取 2D 上下文

  if (!ctx) return // 获取失败则返回

  c.width = video.outW || video.crop.w || c.clientWidth || 320 // 设置画布宽度

  c.height = video.outH || video.crop.h || c.clientHeight || 180 // 设置画布高度

  ctx.fillStyle = '#14141c' // 设置背景色

  ctx.fillRect(0, 0, c.width, c.height) // 填充背景

  try {

    const fit = fitCropToOutput(video.crop.w, video.crop.h, c.width, c.height) // 计算适配输出尺寸

    ctx.drawImage(v, video.crop.x, video.crop.y, video.crop.w, video.crop.h, fit.x, fit.y, fit.w, fit.h) // 绘制裁剪后的视频帧

  } catch { /* 跨域或视频未就绪时忽略 */ }

}



// 当时间范围变化后刷新裁剪视频实时预览（输入框失焦或滑块释放时触发）

function refreshVideoCropPreview() {

  const v = sourceVideo.value

  if (!v) return

  // 先把输入值规范化为数字，防止空字符串导致后续比较报错

  let start = num(video.rangeStart), end = num(video.rangeEnd)

  // 确保时间范围合法

  if (start < 0) start = 0

  if (end > video.duration) end = video.duration

  if (start > end) start = end

  video.rangeStart = start

  video.rangeEnd = end

  // 如果当前播放时间不在新范围内，则跳回起始时间

  if (v.currentTime < video.rangeStart || v.currentTime > video.rangeEnd) {

    v.currentTime = video.rangeStart

  }

  // 正在播放时渲染循环会自动使用新范围；暂停时绘制单帧

  if (videoCropPreviewPlaying.value) {

    if (v.paused) v.play().catch(() => {})

  } else {

    drawVideoCropFrame()

  }

}



// 渲染裁剪视频实时预览帧（RAF 循环）

function renderCropVideoPreview() {

  if (!videoCropPreviewPlaying.value) return // 未在播放状态则停止渲染

  const v = sourceVideo.value

  if (!v) return

  if (v.currentTime >= video.rangeEnd) {

    v.currentTime = video.rangeStart // 到达结束时间则跳回起始时间实现循环

    v.play().catch(() => {}) // 重新播放

  }

  drawVideoCropFrame()

  videoPreviewRaf = requestAnimationFrame(renderCropVideoPreview) // 请求下一帧继续渲染

}



async function loadVideo(file: File) {

  stopCropVideoPreview() // 加载新视频前停止旧预览

  if (video.url) URL.revokeObjectURL(video.url) // 释放旧视频 URL 占用的内存

  video.file = null; video.url = ''; video.frames = []; video.duration = 0

  video.width = 0; video.height = 0; video.rangeStart = 0; video.rangeEnd = 0

  video.step = 1; video.progress = 0; video.nativeFps = 30

  video.crop = { x: 0, y: 0, w: 100, h: 100 }

  video.outW = 0; video.outH = 0; video.showCrop = false

  await nextTick()

  video.file = file; video.url = URL.createObjectURL(file)

  await nextTick()

  const v = sourceVideo.value; if (!v) return

  v.onloadedmetadata = () => { stopCropVideoPreview(); onVideoMeta() }

  // 视频加载成功后自动保存第一帧缩略图到资源库
  saveFileToLibrary(file, video.url)

}



// 处理重新上传的视频文件

function handleVideoFileChange(e: Event) {

  const input = e.target as HTMLInputElement

  const file = input.files?.[0]

  if (file) loadVideo(file)

  input.value = '' // 允许重复选择同一文件

}



async function extractVideoFrames() {

  video.progress = 0; statusText.value = t('extractingFrames')

  const total = estimateFrameCount(video.rangeStart, video.rangeEnd, video.fps)

  const v = sourceVideo.value!; video.frames = []

  // 输出尺寸直接等于裁剪区域的像素尺寸，避免按固定输出尺寸居中留黑边导致导出后画面“变样”

  const outW = Math.max(1, Math.round(video.crop.w))

  const outH = Math.max(1, Math.round(video.crop.h))

  video.outW = outW; video.outH = outH

  for (let i = 0; i < total; i++) {

    v.currentTime = video.rangeStart + i / video.fps

    await new Promise(r => v.addEventListener('seeked', r, { once: true }))

    const c = document.createElement('canvas'); c.width = outW; c.height = outH

    const ctx = c.getContext('2d')!

    // 将裁剪区域 1:1 铺满输出画布（无黑边、无拉伸）

    ctx.drawImage(v, video.crop.x, video.crop.y, video.crop.w, video.crop.h, 0, 0, outW, outH)

    video.frames.push({ url: c.toDataURL('image/png'), selected: true, similarGroup: -1, originalUrl: c.toDataURL('image/png') })

    video.progress = Math.round(((i + 1) / total) * 100)

  }

  // 同步导出尺寸到裁剪区域尺寸，导出时不会因尺寸不一致而拉伸或变形

  video.export.w = outW; video.export.h = outH

  video.step = 2; video.progress = 0; statusText.value = t('extractDone')

}



async function detectSimilarFrames() {

  loadingOpen.value = true; loadingText.value = t('loading')

  const compareSize = 16

  const frameData: Uint8Array[] = []

  // Load all frames into canvas for pixel comparison

  for (const f of video.frames) {

    const img = await loadImage(f.url)

    const c = document.createElement('canvas'); c.width = compareSize; c.height = compareSize

    const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0, compareSize, compareSize)

    frameData.push(new Uint8Array(ctx.getImageData(0, 0, compareSize, compareSize).data))

  }

  let groupId = 0

  const assigned = new Set<number>()

  for (let i = 0; i < video.frames.length; i++) {

    if (assigned.has(i)) continue

    const group: number[] = [i]

    for (let j = i + 1; j < video.frames.length; j++) {

      if (assigned.has(j)) continue

      let same = 0, total = compareSize * compareSize * 4

      for (let k = 0; k < total; k += 4) {

        if (Math.abs(frameData[i][k] - frameData[j][k]) < 5 &&

            Math.abs(frameData[i][k+1] - frameData[j][k+1]) < 5 &&

            Math.abs(frameData[i][k+2] - frameData[j][k+2]) < 5) same++

      }

      if (same / (total / 4) >= 0.95) group.push(j)

    }

    group.forEach(idx => { video.frames[idx].similarGroup = groupId; assigned.add(idx) })

    if (group.length > 1) groupId++

    else video.frames[i].similarGroup = -1

  }

  loadingOpen.value = false

  statusText.value = t('detectDone')

}



function selectAllFrames() { video.frames.forEach(f => f.selected = true) }

function deselectAllFrames() { video.frames.forEach(f => f.selected = false) }



function toggleVideoPreview() {

  if (video.playing) { stopVideoPreview(); return }

  const selected = video.frames.filter(f => f.selected)

  const frames = selected.length ? selected : video.frames

  if (!frames.length) return

  video.playing = true; statusText.value = t('playing')

  videoAnimFrame = 0

  const canvas = videoAnimCanvas.value

  if (!canvas) { video.playing = false; return }

  const ctx = canvas.getContext('2d')!

  const img = new Image()

  // 使用 requestAnimationFrame 驱动，每帧等待图片加载完成后再排下一帧

  const render = () => {

    if (!video.playing) return

    const frame = frames[videoAnimFrame % frames.length]

    videoAnimFrame++

    img.onload = () => {

      if (!video.playing) return

      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight

      ctx.drawImage(img, 0, 0)

      videoAnimRaf = setTimeout(render, 1000 / video.previewFps) as any

    }

    img.onerror = () => {

      if (!video.playing) return

      videoAnimRaf = setTimeout(render, 1000 / video.previewFps) as any

    }

    img.src = frame.url

  }

  render()

}



function stopVideoPreview() {

  video.playing = false; statusText.value = t('paused')

  if (videoAnimRaf) { clearTimeout(videoAnimRaf); videoAnimRaf = null }

}



// 生成视频导出预览：使用 export.ts 中的通用预览生成

// 确认导出：从帧处理界面进入导出结果页并自动生成/播放导出预览

async function confirmVideoExport() {

  video.step = 3 // 切换到导出步骤

  await nextTick() // 等待导出界面渲染完成

  await generateVideoExportPreview() // 生成导出预览

  // 若导出格式为视频，则自动循环播放预览视频

  if (video.export.format === 'video') {

    const el = exportPreviewVideo.value

    if (el) { el.loop = true; el.play().catch(() => {}) }

  }

}



async function generateVideoExportPreview() {

  const selected = video.frames.filter(f => f.selected)

  const frames = selected.length ? selected : video.frames

  if (!frames.length) return

  loadingOpen.value = true; loadingText.value = t('loading')

  try {

    const result = await generateExportPreview(

      video.export.format as any,

      frames,

      { w: video.export.w, h: video.export.h, cols: video.export.cols, compression: video.export.compression as any, delay: video.export.delay }

    )

    video.export.preview = result.url

    video.export.sizeEstimate = result.info || ''

    statusText.value = t('exportPreviewDone')

  } catch (e) {

    statusText.value = '预览生成失败'

  } finally {

    loadingOpen.value = false

  }

}



// 下载视频导出结果：根据所选格式调用 downloadExport

async function downloadVideoExport() {

  const selected = video.frames.filter(f => f.selected)

  const frames = selected.length ? selected : video.frames

  if (!frames.length) return

  loadingOpen.value = true; loadingText.value = t('downloading')

  try {

    await downloadExport(

      video.export.format as any,

      frames,

      { w: video.export.w, h: video.export.h, cols: video.export.cols, compression: video.export.compression as any, delay: video.export.delay },

      video.export.name

    )

  } catch (e) {

    statusText.value = '下载失败'

  } finally {

    loadingOpen.value = false

  }

}

// 下载精灵图子选项：PNG / ZIP(PNG+JSON) / JSON 元数据

async function downloadVideoSprite(fmt: 'sprite' | 'sprite-zip' | 'sprite-json') {

  const selected = video.frames.filter(f => f.selected)

  const frames = selected.length ? selected : video.frames

  if (!frames.length) return

  loadingOpen.value = true; loadingText.value = t('downloading')

  try {

    await downloadExport(

      fmt,

      frames,

      { w: video.export.w, h: video.export.h, cols: video.export.cols, compression: video.export.compression as any, delay: video.export.delay },

      video.export.name

    )

  } catch (e) {

    statusText.value = '下载失败'

  } finally {

    loadingOpen.value = false

  }

}



function applyExportPreset() {

  const presets: Record<string, [number, number]> = { '64x64': [64,64], '128x128': [128,128], '256x455': [256,455], '512x512': [512,512], '512x910': [512,910] }

  const p = presets[video.export.preset]

  if (p) { video.export.w = p[0]; video.export.h = p[1] }

}



// 切换导出格式后自动重新生成预览

watch(() => video.export.format, () => {

  if (video.frames.length && video.step === 3) { generateVideoExportPreview() }

})

// 切换压缩等级后立即刷新导出预览

watch(() => video.export.compression, () => {

  if (video.frames.length && video.step === 3) { generateVideoExportPreview() }

})

// 修改导出尺寸、预设后也立即刷新预览

watch(() => [video.export.preset, video.export.w, video.export.h], () => {

  if (video.frames.length && video.step === 3) { generateVideoExportPreview() }

})

// 修改精灵图/序列帧 ZIP 列数后立即刷新导出预览

watch(() => video.export.cols, () => {

  if (video.frames.length && video.step === 3 && (video.export.format === 'sprite' || video.export.format === 'zip')) { generateVideoExportPreview() }

})



function wheelNumber(e: WheelEvent, path: string, min: number, max: number) {

  e.preventDefault()

  const val = num(path === 'video.fps' ? video.fps : path === 'video.rangeStart' ? video.rangeStart : video.rangeEnd)

  const newVal = Math.max(min, Math.min(max, val + (e.deltaY > 0 ? -0.1 : 0.1)))

  if (path === 'video.fps') video.fps = Math.max(1, Math.round(newVal))

  else if (path === 'video.rangeStart') video.rangeStart = newVal

  else video.rangeEnd = newVal

}



// 当锁定宽高比时，同步视频提取输出尺寸的另一边

function syncVideoOutSize(changed: 'width' | 'height') {

  if (!video.lockAspect || !video.crop.w || !video.crop.h) return

  const ratio = video.crop.w / video.crop.h

  if (changed === 'width') {

    video.outH = Math.round(video.outW / ratio)

  } else {

    video.outW = Math.round(video.outH * ratio)

  }

}



// ==================== FRAME EDITOR ====================

const frameEditorOpen = ref(false)

const frameEditorIndex = ref(0)

const frameEditorImage = ref('')

const frameEditorDirty = ref(false) // 是否有未保存的修改

const frameEditorSource = ref<'video' | 'gif'>('video') // 当前帧编辑器编辑的是视频帧还是 GIF 帧

const frameEditorFrames = computed(() => frameEditorSource.value === 'gif' ? gif.frames : video.frames)

const lastFrameClickIndex = ref(-1)

const frameEditorZoom = ref(1)

const frameEditorCanvas = ref<HTMLCanvasElement | null>(null)

const frameEditorOriginal = ref<ImageData | null>(null)

const frameEditorOriginalUrl = ref('')

const frameEditorParams = reactive<MattingParams>({

  mode: 'flood', key: '#00ff00', tolerance: 30, feather: 2, edge: 0, clusters: 4,

  brightness: 0, contrast: 0, saturation: 0,

})

const frameEditorSize = computed(() => {

  const orig = frameEditorOriginal.value

  if (!orig) return '-'

  return orig.width + 'x' + orig.height

})

const frameEditorMax = computed(() => frameEditorFrames.value.length)

// 手动框选工具状态

const frameEditorTool = ref<'none' | 'manual'>('none')

const frameEditorSelecting = ref(false)

const frameEditorSelStart = reactive({ x: 0, y: 0 })

const frameEditorSelEnd = reactive({ x: 0, y: 0 })

const frameEditorErasedRegions = ref<{ x: number; y: number; w: number; h: number }[]>([]) // 当前帧已擦除区域列表（用于应用到所有帧）



function handleFrameClick(i: number, source: 'video' | 'gif', e: MouseEvent) {

  const frames = source === 'gif' ? gif.frames : video.frames

  // Shift + 点击缩略图：连续选中或取消选中一段帧

  if (e.shiftKey && lastFrameClickIndex.value >= 0) {

    const start = Math.min(lastFrameClickIndex.value, i)

    const end = Math.max(lastFrameClickIndex.value, i)

    const targetState = !frames[i].selected

    for (let idx = start; idx <= end; idx++) frames[idx].selected = targetState

    lastFrameClickIndex.value = i

    return

  }

  lastFrameClickIndex.value = i

  openFrameEditor(i, source)

}



function handleFrameCheckbox(i: number, source: 'video' | 'gif', e: MouseEvent) {

  e.stopPropagation()

  const frames = source === 'gif' ? gif.frames : video.frames

  // Shift + 点击复选框：连续选中或取消选中一段帧

  if (e.shiftKey && lastFrameClickIndex.value >= 0) {

    const start = Math.min(lastFrameClickIndex.value, i)

    const end = Math.max(lastFrameClickIndex.value, i)

    const targetState = !frames[i].selected

    for (let idx = start; idx <= end; idx++) frames[idx].selected = targetState

  }

  lastFrameClickIndex.value = i

}



function openFrameEditor(i: number, source: 'video' | 'gif' = 'video') {

  frameEditorSource.value = source

  frameEditorIndex.value = i

  const frames = frameEditorFrames.value

  // 记录原始帧 URL，用于「还原」功能

  frameEditorOriginalUrl.value = frames[i]?.originalUrl || frames[i]?.url || ''

  // 加载当前已处理的结果，让用户可以基于上次编辑继续处理

  frameEditorImage.value = frames[i]?.url || frameEditorOriginalUrl.value

  frameEditorOpen.value = true

  // 水印模式下必须保持手动框选工具，其他模式用取色器

  frameEditorTool.value = frameEditorParams.mode === 'watermark' ? 'manual' : 'none'

  frameEditorZoom.value = 1

  frameEditorErasedRegions.value = [] // 清空已擦除区域列表

  frameEditorDirty.value = false // 新打开帧，无未保存修改

  nextTick(() => loadFrameEditorImage(frameEditorImage.value))

}



async function loadFrameEditorImage(url: string) {

  if (!url) return

  const img = await loadImage(url)

  const c = frameEditorCanvas.value

  if (!c) return

  c.width = img.naturalWidth

  c.height = img.naturalHeight

  const ctx = c.getContext('2d')!

  ctx.drawImage(img, 0, 0)

  frameEditorOriginal.value = ctx.getImageData(0, 0, c.width, c.height)

  updateFrameEditorPreview()

}



function updateFrameEditorPreview() {

  const c = frameEditorCanvas.value

  const orig = frameEditorOriginal.value

  if (!c || !orig) return

  const ctx = c.getContext('2d')!

  // 水印模式只显示当前原始数据（手动框选已直接修改 alpha），不应用任何抠图算法

  const out = frameEditorParams.mode === 'watermark' ? orig : applyMattingParams(orig, frameEditorParams)

  ctx.putImageData(out, 0, 0)

  frameEditorImage.value = c.toDataURL('image/png')

}



function saveFrameEditor() {

  const c = frameEditorCanvas.value

  if (!c || frameEditorIndex.value < 0) return

  const url = c.toDataURL('image/png')

  const frames = frameEditorFrames.value

  frames[frameEditorIndex.value].url = url

  // 编辑后保存时，把当前结果也作为后续还原的基准，避免切换模式后回到旧原始图

  if (!frames[frameEditorIndex.value].originalUrl) frames[frameEditorIndex.value].originalUrl = frameEditorOriginalUrl.value

  // 同步更新内部原始数据，使后续抠图/模式切换基于当前已保存结果

  frameEditorOriginal.value = c.getContext('2d')!.getImageData(0, 0, c.width, c.height)

  frameEditorImage.value = url

  // 标记已保存，关闭弹窗提醒

  frameEditorDirty.value = false

  // 显示保存成功提示（弹出 toast 样式）

  showToast(t('frameSaved'))

}



async function applyFrameEditorToAll() {

  loadingOpen.value = true; loadingText.value = t('processing')

  const frames = frameEditorFrames.value

  // 水印模式：将当前帧的所有擦除区域应用到所有其他帧

  if (frameEditorParams.mode === 'watermark') {

    saveFrameEditor() // 先保存当前帧

    const regions = [...frameEditorErasedRegions.value] // 复制擦除区域列表

    if (!regions.length) { // 没有擦除区域则直接返回

      loadingOpen.value = false

      showToast(t('watermarkNoApplyAll'))

      return

    }

    for (let i = 0; i < frames.length; i++) {

      if (i === frameEditorIndex.value) continue // 跳过当前帧（已保存）

      const img = await loadImage(frames[i].url) // 加载目标帧

      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight

      const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0)

      const imgData = ctx.getImageData(0, 0, c.width, c.height) // 获取像素数据

      const data = imgData.data

      // 对每个擦除区域，将区域内像素 alpha 设为 0

      for (const r of regions) {

        for (let py = r.y; py < Math.min(r.y + r.h, c.height); py++) {

          for (let px = r.x; px < Math.min(r.x + r.w, c.width); px++) {

            const idx = (py * c.width + px) * 4

            data[idx + 3] = 0

          }

        }

      }

      ctx.putImageData(imgData, 0, 0) // 写回修改后的像素数据

      frames[i].url = c.toDataURL('image/png') // 保存结果

    }

    loadingOpen.value = false

    showToast(t('watermarkAppliedAll'))

    return

  }

  for (let i = 0; i < frames.length; i++) {

    const img = await loadImage(frames[i].url)

    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight

    const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0)

    const orig = ctx.getImageData(0, 0, c.width, c.height)

    const out = applyMattingParams(orig, frameEditorParams)

    ctx.putImageData(out, 0, 0)

    frames[i].url = c.toDataURL('image/png')

    if (!frames[i].originalUrl) frames[i].originalUrl = frames[i].url

  }

  // 应用完后刷新当前帧编辑画布和内部数据，确保后续模式切换不丢失结果

  saveFrameEditor()

  loadingOpen.value = false

  showToast(t('allFramesApplied'))

}



// 关闭帧编辑器，若有未保存修改则显示网站同风格确认弹框

async function closeFrameEditor() {

  if (frameEditorDirty.value) {

    const ok = await showConfirmDialog(t('unsavedChanges'), t('notice'), t('ok'), t('cancel'))

    if (!ok) return

  }

  frameEditorOpen.value = false

}



// 还原当前帧：恢复到本次打开帧编辑器时记录的原始 URL，不再应用抠图参数

async function restoreFrameEditor() {

  if (!frameEditorOriginalUrl.value || frameEditorIndex.value < 0) return

  const frames = frameEditorFrames.value

  frames[frameEditorIndex.value].url = frameEditorOriginalUrl.value

  frameEditorImage.value = frameEditorOriginalUrl.value

  // 直接加载原始图片到画布，不经过 loadFrameEditorImage（会重新应用抠图参数）

  const img = await loadImage(frameEditorOriginalUrl.value)

  const c = frameEditorCanvas.value

  if (!c) return

  c.width = img.naturalWidth

  c.height = img.naturalHeight

  const ctx = c.getContext('2d')!

  ctx.drawImage(img, 0, 0)

  // 同步更新内部原始数据，使后续操作基于还原后的纯净图片

  frameEditorOriginal.value = ctx.getImageData(0, 0, c.width, c.height)

  statusText.value = t('frameRestored')

}



// 一键还原：将所有帧恢复到其原始 URL，并刷新编辑器显示

async function restoreAllFrames() {

  loadingOpen.value = true; loadingText.value = t('processing')

  const frames = frameEditorFrames.value

  for (const f of frames) {

    if (f.originalUrl) f.url = f.originalUrl

  }

  loadingOpen.value = false

  statusText.value = t('allFramesRestored')

  // 如果帧编辑器当前开着，重新加载当前帧的纯净原始图片

  if (frameEditorOpen.value) await restoreFrameEditor()

}



// 帧编辑区鼠标滚轮缩放，或在参数滑块上滚动调整数值

function onFrameEditorWheel(e: WheelEvent, key?: 'tolerance' | 'feather' | 'edge') {

  if (key) {

    const delta = e.deltaY > 0 ? -1 : 1 // 向下滚动减小，向上滚动增大

    if (key === 'tolerance') {

      frameEditorParams.tolerance = Math.max(0, Math.min(120, frameEditorParams.tolerance + delta))

    } else if (key === 'feather') {

      frameEditorParams.feather = Math.max(0, Math.min(20, frameEditorParams.feather + delta))

    } else if (key === 'edge') {

      frameEditorParams.edge = Math.max(-10, Math.min(10, frameEditorParams.edge + delta))

    }

    return

  }

  const delta = e.deltaY > 0 ? -0.5 : 0.5 // 向下滚缩小，向上滚放大

  frameEditorZoom.value = Math.max(1, Math.min(10, frameEditorZoom.value + delta)) // 限制缩放范围 1x~10x

}



function frameEditorEyedropper(e: MouseEvent) {

  const c = frameEditorCanvas.value

  if (!c || !frameEditorOriginal.value) return

  const r = c.getBoundingClientRect()

  const x = Math.floor((e.clientX - r.left) * (c.width / r.width))

  const y = Math.floor((e.clientY - r.top) * (c.height / r.height))

  const i = (y * c.width + x) * 4

  const d = frameEditorOriginal.value.data

  const hex = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('')

  frameEditorParams.key = hex

}



function frameEditorPrev() {

  if (frameEditorIndex.value > 0) { saveFrameEditor(); openFrameEditor(frameEditorIndex.value - 1, frameEditorSource.value) }

}

function frameEditorNext() {

  if (frameEditorIndex.value < frameEditorMax.value - 1) { saveFrameEditor(); openFrameEditor(frameEditorIndex.value + 1, frameEditorSource.value) }

}

function copyFrameDataUrl() {

  if (frameEditorImage.value) {

    navigator.clipboard.writeText(frameEditorImage.value).catch(() => {})

    statusText.value = 'Data URL copied'

  }

}



// 帧编辑模式切换：水印模式使用预设参数

function onFrameEditorModeChange() {

  frameEditorDirty.value = true // 模式切换视为修改

  if (frameEditorParams.mode === 'watermark') {

    // 水印去除模式：预设白色高容差参数并自动进入框选模式

    frameEditorParams.key = '#ffffff'; frameEditorParams.tolerance = 80

    frameEditorParams.feather = 4; frameEditorParams.edge = 5

    frameEditorTool.value = 'manual'

    updateFrameEditorPreview()

  } else {

    // 切换到非水印模式时退出框选，恢复取色器

    frameEditorTool.value = 'none'

    updateFrameEditorPreview()

  }

}

// 将鼠标坐标从页面坐标系转换为画布像素坐标（考虑缩放与 CSS 尺寸差异）

function frameEditorCanvasPos(e: MouseEvent) {

  const c = frameEditorCanvas.value; if (!c) return { x: 0, y: 0 }

  const rect = c.getBoundingClientRect()

  // rect 已包含 CSS transform:scale() 效果，直接用内部尺寸 / 显示尺寸计算映射比即可

  const scaleX = c.width / rect.width

  const scaleY = c.height / rect.height

  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }

}

// 画布 mousedown：手动模式开始选框，其他模式取色

function frameEditorCanvasMouseDown(e: MouseEvent) {

  if (frameEditorTool.value !== 'manual') { frameEditorEyedropper(e); return }

  const pos = frameEditorCanvasPos(e)

  frameEditorSelStart.x = pos.x; frameEditorSelStart.y = pos.y

  frameEditorSelEnd.x = pos.x; frameEditorSelEnd.y = pos.y

  frameEditorSelecting.value = true

}

// 画布 mousemove：更新选框并在画布上实时绘制虚线选区

function frameEditorCanvasMouseMove(e: MouseEvent) {

  if (!frameEditorSelecting.value) return

  const pos = frameEditorCanvasPos(e)

  frameEditorSelEnd.x = pos.x; frameEditorSelEnd.y = pos.y

  drawFrameEditorSelection()

}

// 在当前画布上绘制虚线选框（基于当前工作底图，避免 CSS 缩放导致覆盖层错位）

function drawFrameEditorSelection() {

  const c = frameEditorCanvas.value

  const orig = frameEditorOriginal.value

  if (!c || !orig) return

  const ctx = c.getContext('2d')!

  // 重绘当前工作底图

  ctx.putImageData(orig, 0, 0)

  const x = Math.min(frameEditorSelStart.x, frameEditorSelEnd.x)

  const y = Math.min(frameEditorSelStart.y, frameEditorSelEnd.y)

  const w = Math.abs(frameEditorSelEnd.x - frameEditorSelStart.x)

  const h = Math.abs(frameEditorSelEnd.y - frameEditorSelStart.y)

  if (w < 1 || h < 1) return

  ctx.save()

  ctx.strokeStyle = '#00d4aa'

  ctx.fillStyle = 'rgba(0, 212, 170, 0.15)'

  ctx.lineWidth = 1

  ctx.setLineDash([4, 4])

  ctx.strokeRect(x, y, w, h)

  ctx.fillRect(x, y, w, h)

  ctx.restore()

}

// 画布 mouseup：结束选框并应用手动去除

function frameEditorCanvasMouseUp() {

  if (!frameEditorSelecting.value) return

  frameEditorSelecting.value = false

  applyManualSelection()

}

// 将手动选框内像素设为透明

function applyManualSelection() {

  const orig = frameEditorOriginal.value

  if (!orig) return

  const x = Math.floor(Math.min(frameEditorSelStart.x, frameEditorSelEnd.x))

  const y = Math.floor(Math.min(frameEditorSelStart.y, frameEditorSelEnd.y))

  const w = Math.floor(Math.abs(frameEditorSelEnd.x - frameEditorSelStart.x))

  const h = Math.floor(Math.abs(frameEditorSelEnd.y - frameEditorSelStart.y))

  if (w < 2 || h < 2) return

  // 记录擦除区域，用于「应用到所有帧」

  frameEditorErasedRegions.value.push({ x, y, w, h })

  const data = orig.data

  for (let py = y; py < Math.min(y + h, orig.height); py++) {

    for (let px = x; px < Math.min(x + w, orig.width); px++) {

      const i = (py * orig.width + px) * 4

      data[i + 3] = 0 // 设置 alpha 为 0

    }

  }

  const c = frameEditorCanvas.value

  if (c) { const ctx = c.getContext('2d')!; ctx.putImageData(orig, 0, 0); frameEditorImage.value = c.toDataURL('image/png') }

  frameEditorDirty.value = true // 标记有未保存修改

}



watch(frameEditorParams, updateFrameEditorPreview, { deep: true })



// ==================== SEQUENCE GIF ====================

const gif = reactive({

  step: 1, file: null as File | null, frames: [] as { url: string; selected: boolean; similarGroup: number; originalUrl?: string }[],

  fps: 12, outW: 512, outH: 512, previewFps: 10, playing: false,

  duration: 0, nativeFps: 12, rangeStart: 0, rangeEnd: 0,

  sourceFrames: [] as { rgba: Uint8ClampedArray; width: number; height: number; delay: number }[],

  export: { format: 'gif', cols: 4, w: 512, h: 512, compression: 'none', delay: 100, name: 'artforge_export', preview: '', sizeEstimate: '' },

  crop: { x: 0, y: 0, w: 0, h: 0 }, showCrop: true

})

const gifCropCanvas = ref<HTMLCanvasElement | null>(null)

const gifCropPreviewCanvas = ref<HTMLCanvasElement | null>(null) // GIF 裁剪后实时预览画布

const gifAnimCanvas = ref<HTMLCanvasElement | null>(null)

const gifExportPreviewVideo = ref<HTMLVideoElement | null>(null) // GIF 导出视频预览元素引用

let gifAnimRaf: number | null = null

let gifAnimFrame = 0

const gifCropContainer = ref<HTMLDivElement | null>(null)

const gifFileInput = ref<HTMLInputElement | null>(null)

const gifRangePreviewCanvas = ref<HTMLCanvasElement | null>(null)

const gifRangePreviewTimer = ref<number | null>(null)

let gifRangePreviewStart = 0

const gifRangePreviewPlaying = ref(false) // GIF 范围预览是否正在播放
const gifRangeCurrentTime = ref(0) // GIF 范围预览当前时间（秒）

let gifCropResizing = false



// GIF 裁剪框度量和显示缩放

const gifCropMetrics = reactive({ scale: 1, offsetX: 0, offsetY: 0 })



// 根据画布在容器中的实际显示位置计算裁剪框的缩放与偏移

function updateGifCropMetrics() {

  const container = gifCropContainer.value

  const c = gifCropCanvas.value

  if (!container || !c || !gif.crop.w) return

  const contRect = container.getBoundingClientRect()

  const canvasRect = c.getBoundingClientRect()

  // 画布可能被 object-contain 缩放居中显示

  const scaleX = c.width > 0 ? canvasRect.width / c.width : 1

  const scaleY = c.height > 0 ? canvasRect.height / c.height : 1

  gifCropMetrics.scale = Math.min(scaleX, scaleY)

  gifCropMetrics.offsetX = canvasRect.left - contRect.left + (canvasRect.width - c.width * gifCropMetrics.scale) / 2

  gifCropMetrics.offsetY = canvasRect.top - contRect.top + (canvasRect.height - c.height * gifCropMetrics.scale) / 2

}



// GIF 裁剪框显示样式：使用度量系统计算绝对定位

const gifCropStyle = computed(() => {

  const c = gifCropCanvas.value

  if (!c || !gif.crop.w) return { display: 'none' }

  updateGifCropMetrics()

  return {

    left: gifCropMetrics.offsetX + gif.crop.x * gifCropMetrics.scale + 'px',

    top: gifCropMetrics.offsetY + gif.crop.y * gifCropMetrics.scale + 'px',

    width: gif.crop.w * gifCropMetrics.scale + 'px',

    height: gif.crop.h * gifCropMetrics.scale + 'px',

  }

})



// 绘制 GIF 第一帧到裁剪预览画布，初始化裁剪区域为整图

function drawGifCropPreview() {

  const c = gifCropCanvas.value

  if (!c || !gif.sourceFrames.length) return

  const sf = gif.sourceFrames[0]

  c.width = sf.width

  c.height = sf.height

  const ctx = c.getContext('2d')!

  const imgData = new ImageData(new Uint8ClampedArray(sf.rgba), sf.width, sf.height)

  ctx.putImageData(imgData, 0, 0)

  // 首次初始化裁剪为整图

  if (!gif.crop.w) { gif.crop.x = 0; gif.crop.y = 0; gif.crop.w = sf.width; gif.crop.h = sf.height }

  // 更新右侧裁剪预览

  nextTick(() => { updateGifCropMetrics(); drawGifCropPreviewCanvas() })

}



// 绘制 GIF 裁剪后的预览图到右侧预览画布，并保持裁剪区域宽高比适配容器

function drawGifCropPreviewCanvas() {
  const srcCanvas = gifCropCanvas.value
  const dstCanvas = gifCropPreviewCanvas.value
  if (!srcCanvas || !dstCanvas || !gif.crop.w) return
  // 使用 canvas 自身 CSS 尺寸或父容器尺寸，避免 0 尺寸导致空白
  const contW = dstCanvas.clientWidth || dstCanvas.parentElement?.clientWidth || 320
  // 完整显示裁剪区域，宽度填满容器，高度按裁剪宽高比自适应
  const ratio = gif.crop.h / gif.crop.w
  const drawW = contW
  const drawH = contW * ratio
  dstCanvas.width = drawW
  dstCanvas.height = drawH
  const ctx = dstCanvas.getContext('2d')!
  ctx.fillStyle = '#0e0e14'
  ctx.fillRect(0, 0, drawW, drawH)
  ctx.drawImage(srcCanvas, gif.crop.x, gif.crop.y, gif.crop.w, gif.crop.h, 0, 0, drawW, drawH)
}



// 启动 GIF 时间范围预览循环

function startGifRangePreview() {

  stopGifRangePreview()

  if (!gif.sourceFrames.length) return

  gifRangePreviewPlaying.value = true // 标记为播放状态

  gifRangePreviewStart = performance.now()

  renderGifRangePreviewLoop()

}



// 停止 GIF 时间范围预览循环

function stopGifRangePreview() {

  gifRangePreviewPlaying.value = false // 标记为暂停状态

  if (gifRangePreviewTimer.value) {

    clearTimeout(gifRangePreviewTimer.value)

    gifRangePreviewTimer.value = null

  }

}



// 切换 GIF 范围预览的播放/暂停状态

function toggleGifRangePreview() {

  if (gifRangePreviewPlaying.value) stopGifRangePreview() // 正在播放则停止

  else startGifRangePreview() // 未播放则开始

}



// 循环渲染 GIF 范围预览帧

function renderGifRangePreviewLoop() {

  if (!gifRangePreviewPlaying.value) return // 未在播放状态则停止渲染

  renderGifRangePreview()

  gifRangePreviewTimer.value = window.setTimeout(renderGifRangePreviewLoop, 1000 / gif.previewFps)

}



// 渲染当前时间范围内的 GIF 帧到预览画布

function renderGifRangePreview() {

  const c = gifRangePreviewCanvas.value

  if (!c || !gif.sourceFrames.length) return

  const src = gif.sourceFrames

  const rangeDur = Math.max(0.001, gif.rangeEnd - gif.rangeStart)

  const elapsed = (performance.now() - gifRangePreviewStart) / 1000

  const t = gif.rangeStart + (elapsed % rangeDur)

  const cum: number[] = [0]

  for (let i = 1; i < src.length; i++) cum.push(cum[i - 1] + src[i - 1].delay / 1000)

  let idx = 0

  for (let k = 0; k < cum.length; k++) { if (cum[k] <= t) idx = k; else break }

  const sf = src[idx]

  gifRangeCurrentTime.value = t // 记录当前预览时间用于界面显示

  const rc = document.createElement('canvas')

  rc.width = sf.width

  rc.height = sf.height

  const rctx = rc.getContext('2d')!

  rctx.putImageData(new ImageData(new Uint8ClampedArray(sf.rgba), sf.width, sf.height), 0, 0)



  // 使用与视频预览相同的容器适配逻辑

  const contW = c.clientWidth || c.parentElement?.clientWidth || 320

  const contH = c.clientHeight || c.parentElement?.clientHeight || 240

  const ctx = c.getContext('2d')!
  if (gif.crop.w && gif.crop.h) {
    // 完整显示裁剪区域，宽度填满容器，高度按裁剪宽高比自适应
    const ratio = gif.crop.h / gif.crop.w
    const drawW = contW
    const drawH = contW * ratio
    c.width = drawW
    c.height = drawH
    ctx.fillStyle = '#14141c'
    ctx.fillRect(0, 0, drawW, drawH)
    ctx.drawImage(rc, gif.crop.x, gif.crop.y, gif.crop.w, gif.crop.h, 0, 0, drawW, drawH)
  } else {
    c.width = contW; c.height = contH
    ctx.fillStyle = '#14141c'
    ctx.fillRect(0, 0, contW, contH)
  }

}



// GIF 裁剪框拖拽调整大小：与视频裁剪框拖拽逻辑对齐

function startGifCropResize(_e: MouseEvent, dir: string) {

  gifCropResizing = true

  const c = gifCropCanvas.value

  if (!c) return

  const origW = c.width, origH = c.height

  const onMove = (ev: MouseEvent) => {

    if (!gifCropResizing) return

    const container = gifCropContainer.value; if (!container) return

    const contRect = container.getBoundingClientRect()

    // const canvasRect = c.getBoundingClientRect() // 未使用，已注释

    const scale = gifCropMetrics.scale

    const mx = (ev.clientX - contRect.left - gifCropMetrics.offsetX) / scale

    const my = (ev.clientY - contRect.top - gifCropMetrics.offsetY) / scale

    if (dir.includes('e')) { gif.crop.w = Math.max(10, Math.min(mx, origW) - gif.crop.x) }

    if (dir.includes('w')) {

      const newX = Math.max(0, Math.min(mx, gif.crop.x + gif.crop.w - 10))

      gif.crop.w = gif.crop.x + gif.crop.w - newX

      gif.crop.x = newX

    }

    if (dir.includes('s')) { gif.crop.h = Math.max(10, Math.min(my, origH) - gif.crop.y) }

    if (dir.includes('n')) {

      const newY = Math.max(0, Math.min(my, gif.crop.y + gif.crop.h - 10))

      gif.crop.h = gif.crop.y + gif.crop.h - newY

      gif.crop.y = newY

    }

  }

  const onUp = () => {

    gifCropResizing = false

    drawGifCropPreviewCanvas()

    window.removeEventListener('mousemove', onMove)

    window.removeEventListener('mouseup', onUp)

  }

  window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)

}



// 加载 GIF 文件：上传后立即解码全部帧，用于时间选择和提取（与视频 Seek 逻辑对等）

async function loadGif(file: File) {

  gif.file = file; gif.sourceFrames = []; gif.frames = []; gif.duration = 0

  loadingOpen.value = true; loadingText.value = t('gifExtracting') || '正在解码 GIF…'

  try {

    const buf = await file.arrayBuffer()

    const all = decodeGif(buf)

    gif.sourceFrames = all

    let totalMs = 0

    for (const f of all) totalMs += f.delay

    gif.duration = totalMs / 1000

    gif.nativeFps = gif.duration > 0 ? all.length / gif.duration : 12

    gif.rangeStart = 0

    gif.rangeEnd = gif.duration

    gif.fps = Math.min(12, Math.max(1, Math.round(gif.nativeFps)))

    gif.step = 1

    statusText.value = t('gifLoaded')

    // GIF 解码成功后自动保存到资源库（使用第一帧作为缩略图）
    const firstFrameCanvas = document.createElement('canvas')
    firstFrameCanvas.width = gif.sourceFrames[0].width
    firstFrameCanvas.height = gif.sourceFrames[0].height
    const firstFrameCtx = firstFrameCanvas.getContext('2d')!
    firstFrameCtx.putImageData(new ImageData(new Uint8ClampedArray(gif.sourceFrames[0].rgba), gif.sourceFrames[0].width, gif.sourceFrames[0].height), 0, 0)
    saveFileToLibrary(file, firstFrameCanvas.toDataURL('image/png'))

    nextTick(() => { drawGifCropPreview(); startGifRangePreview() }) // 上传后立即显示第一帧裁剪预览并启动范围预览

  } catch (e) {

    statusText.value = 'GIF 解码失败：' + (e as Error).message

    gif.file = null

  } finally {

    loadingOpen.value = false

  }

}



// 触发 GIF 重新上传：点击时不立刻清空状态，仅弹出文件选择框

function triggerGifReupload() {

  // 不立刻清空页面状态，仅弹出文件选择框；用户真正选择新文件后再在 handleGifFileChange 中重置

  nextTick(() => gifFileInput.value?.click())

}



// 处理重新上传的 GIF 文件

function handleGifFileChange(e: Event) {

  const input = e.target as HTMLInputElement

  const file = input.files?.[0]

  if (!file) return

  // 用户真正选择了新文件后再清空旧状态

  gif.file = null; gif.sourceFrames = []; gif.frames = []; gif.duration = 0

  gif.step = 1; gif.crop = { x: 0, y: 0, w: 0, h: 0 }

  gif.rangeStart = 0; gif.rangeEnd = 0

  loadGif(file)

  input.value = '' // 允许重复选择同一文件

}



// GIF 帧提取：按时间范围 + FPS 从已解码的 sourceFrames 中采样（与视频 Seek 对等）

async function extractGifFrames() {

  if (!gif.sourceFrames.length) { statusText.value = t('pleaseSelectGif') || '请先选择 GIF 文件'; return }

  loadingOpen.value = true; loadingText.value = t('gifExtracting') || '正在解码 GIF…'

  try {

    const src = gif.sourceFrames

    // 构建每帧累计时间（秒）

    const cum: number[] = [0]

    for (let i = 1; i < src.length; i++) cum.push(cum[i - 1] + src[i - 1].delay / 1000)

    const total = estimateFrameCount(gif.rangeStart, gif.rangeEnd, gif.fps)

    const outW = Math.max(1, Math.round(gif.outW))

    const outH = Math.max(1, Math.round(gif.outH))

    gif.frames = []

    for (let i = 0; i < total; i++) {

      const t = gif.rangeStart + i / gif.fps

      let idx = 0

      for (let k = 0; k < cum.length; k++) { if (cum[k] <= t) idx = k; else break }

      const sf = src[idx]

  const rc = document.createElement('canvas'); rc.width = sf.width; rc.height = sf.height

      const rctx = rc.getContext('2d')!

      rctx.putImageData(new ImageData(new Uint8ClampedArray(sf.rgba), sf.width, sf.height), 0, 0)

      const c = document.createElement('canvas'); c.width = outW; c.height = outH

      const ctx = c.getContext('2d')!

      // GIF 帧可能有透明背景 — 先填充白底再贴帧，使缩略图/预览始终可见内容（解决"色块"错觉）

      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, outW, outH)

      // 应用裁剪区域（若有）

      if (gif.crop.w && gif.crop.h) {

        ctx.drawImage(rc, gif.crop.x, gif.crop.y, gif.crop.w, gif.crop.h, 0, 0, outW, outH)

      } else {

        ctx.drawImage(rc, 0, 0, outW, outH)

      }

      const url = c.toDataURL('image/png')

      gif.frames.push({ url, selected: true, similarGroup: -1, originalUrl: url })

    }

    gif.export.w = outW; gif.export.h = outH

    gif.step = 2

    statusText.value = (t('gifExtractDone') || '已提取 {n} 帧').replace('{n}', String(total))

  } catch (e) {

    statusText.value = 'GIF 提取失败：' + (e as Error).message

  } finally {

    loadingOpen.value = false

  }

}

// GIF 相似帧检测：按像素相似度分组（与视频模块一致）

async function detectSimilarGifFrames() {

  loadingOpen.value = true; loadingText.value = t('loading')

  const compareSize = 16

  const frameData: Uint8Array[] = []

  for (const f of gif.frames) {

    const img = await loadImage(f.url)

    const c = document.createElement('canvas'); c.width = compareSize; c.height = compareSize

    const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0, compareSize, compareSize)

    frameData.push(new Uint8Array(ctx.getImageData(0, 0, compareSize, compareSize).data))

  }

  let groupId = 0

  const assigned = new Set<number>()

  for (let i = 0; i < gif.frames.length; i++) {

    if (assigned.has(i)) continue

    const group: number[] = [i]

    for (let j = i + 1; j < gif.frames.length; j++) {

      if (assigned.has(j)) continue

      let same = 0, total = compareSize * compareSize * 4

      for (let k = 0; k < total; k += 4) {

        if (Math.abs(frameData[i][k] - frameData[j][k]) < 5 &&

            Math.abs(frameData[i][k + 1] - frameData[j][k + 1]) < 5 &&

            Math.abs(frameData[i][k + 2] - frameData[j][k + 2]) < 5) same++

      }

      if (same / (total / 4) >= 0.95) group.push(j)

    }

    group.forEach(idx => { gif.frames[idx].similarGroup = groupId; assigned.add(idx) })

    if (group.length > 1) groupId++

    else gif.frames[i].similarGroup = -1

  }

  loadingOpen.value = false

  statusText.value = t('detectDone')

}

function selectAllGifFrames() { gif.frames.forEach(f => f.selected = true) }

function deselectAllGifFrames() { gif.frames.forEach(f => f.selected = false) }

function confirmGifExport() {

  gif.step = 3

  nextTick().then(() => generateGifExportPreview().then(() => {

    // 若导出格式为视频，则自动循环播放预览视频

    if (gif.export.format === 'video') {

      const el = gifExportPreviewVideo.value

      if (el) { el.loop = true; el.play().catch(() => {}) }

    }

  }))

}



function toggleGifPreview() {

  if (gif.playing) { gif.playing = false; statusText.value = t('paused'); if (gifAnimRaf) { clearTimeout(gifAnimRaf); gifAnimRaf = null }; return }

  const selected = gif.frames.filter(f => f.selected)

  const frames = selected.length ? selected : gif.frames

  if (!frames.length) return

  gif.playing = true; statusText.value = t('gifPlaying')

  gifAnimFrame = 0

  const canvas = gifAnimCanvas.value

  if (!canvas) { gif.playing = false; return }

  const ctx = canvas.getContext('2d')!

  const img = new Image()

  const render = () => {

    if (!gif.playing) return

    const frame = frames[gifAnimFrame % frames.length]

    gifAnimFrame++

    img.onload = () => {

      if (!gif.playing) return

      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight

      ctx.drawImage(img, 0, 0)

      gifAnimRaf = setTimeout(render, 1000 / gif.previewFps) as any

    }

    img.onerror = () => {

      if (!gif.playing) return

      gifAnimRaf = setTimeout(render, 1000 / gif.previewFps) as any

    }

    img.src = frame.url

  }

  render()

}



// 生成 GIF 导出预览：使用 export.ts 中的通用预览生成

async function generateGifExportPreview() {

  const selected = gif.frames.filter(f => f.selected)

  const frames = selected.length ? selected : gif.frames

  if (!frames.length) return

  loadingOpen.value = true; loadingText.value = t('loading')

  try {

    const result = await generateExportPreview(

      gif.export.format as any,

      frames,

      { w: gif.export.w, h: gif.export.h, cols: gif.export.cols, compression: gif.export.compression as any, delay: gif.export.delay }

    )

    gif.export.preview = result.url

    gif.export.sizeEstimate = result.info || ''

    statusText.value = t('exportPreviewDone')

  } catch (e) {

    statusText.value = '预览生成失败'

  } finally {

    loadingOpen.value = false

  }

}



// 下载 GIF 导出结果：根据所选格式调用 downloadExport

async function downloadGifExport() {

  const selected = gif.frames.filter(f => f.selected)

  const frames = selected.length ? selected : gif.frames

  if (!frames.length) return

  loadingOpen.value = true; loadingText.value = t('downloading')

  try {

    await downloadExport(

      gif.export.format as any,

      frames,

      { w: gif.export.w, h: gif.export.h, cols: gif.export.cols, compression: gif.export.compression as any, delay: gif.export.delay },

      gif.export.name

    )

  } catch (e) {

    statusText.value = '下载失败'

  } finally {

    loadingOpen.value = false

  }

}

// 下载 GIF 精灵图子选项：PNG / ZIP(PNG+JSON) / JSON 元数据

async function downloadGifSprite(fmt: 'sprite' | 'sprite-zip' | 'sprite-json') {

  const selected = gif.frames.filter(f => f.selected)

  const frames = selected.length ? selected : gif.frames

  if (!frames.length) return

  loadingOpen.value = true; loadingText.value = t('downloading')

  try {

    await downloadExport(

      fmt,

      frames,

      { w: gif.export.w, h: gif.export.h, cols: gif.export.cols, compression: gif.export.compression as any, delay: gif.export.delay },

      gif.export.name

    )

  } catch (e) {

    statusText.value = '下载失败'

  } finally {

    loadingOpen.value = false

  }

}



// 切换 GIF 导出格式后自动重新生成预览

watch(() => gif.export.format, () => {

  if (gif.frames.length && gif.step === 3) { generateGifExportPreview() }

})

// 切换压缩等级后立即刷新导出预览

watch(() => gif.export.compression, () => {

  if (gif.frames.length && gif.step === 3) { generateGifExportPreview() }

})

// 修改导出尺寸后也立即刷新预览

watch(() => [gif.export.w, gif.export.h], () => {

  if (gif.frames.length && gif.step === 3) { generateGifExportPreview() }

})

// 修改精灵图/序列帧 ZIP 列数后立即刷新导出预览

watch(() => gif.export.cols, () => {

  if (gif.frames.length && gif.step === 3 && (gif.export.format === 'sprite' || gif.export.format === 'zip')) { generateGifExportPreview() }

})

// 从处理页返回 GIF 上传/裁剪页时，重新绘制裁剪与时间预览

watch(() => gif.step, () => {

  if (gif.step === 1 && gif.sourceFrames.length) {

    nextTick(() => {

      updateGifCropMetrics()

      drawGifCropPreview()

      drawGifCropPreviewCanvas()

      startGifRangePreview()

    })

  }

})

// 切换回 GIF 标签页时重绘裁剪与时间预览，避免 DOM 隐藏导致画布空白

watch(() => seqTab.value, (val) => {

  if (val === 'gif' && gif.file) {

    nextTick(() => {

      updateGifCropMetrics()

      drawGifCropPreview()

      drawGifCropPreviewCanvas()

      startGifRangePreview()

    })

  } else {

    stopGifRangePreview()

  }

})



// ==================== SPRITE SHEET / 图片转序列帧 ====================

// 图片转序列帧状态：源图列表、布局参数、预览动画参数

const sprite = reactive({

  images: [] as { url: string; file: File }[],

  cols: 4, padding: 2, bg: 'transparent',

  previewFps: 10, playing: false, animFrame: 0,

  compression: 'none' as 'none' | 'low' | 'medium' | 'high'

})



// 右侧预览模块的画布引用

const spritePreviewCanvas = ref<HTMLCanvasElement | null>(null)



// 压缩大小估算：实时显示所有帧在选定压缩等级下的总预估体积与平均每帧体积

const spriteCompressionSize = ref('')

async function updateSpriteCompressionSize() {

  if (!sprite.images.length) { spriteCompressionSize.value = ''; return }

  try {

    if (sprite.compression === 'none') {

      // 无压缩模式：直接用原始文件大小累加

      let total = 0

      for (const im of sprite.images) total += im.file?.size || 0

      const perFrame = Math.round(total / Math.max(1, sprite.images.length))

      spriteCompressionSize.value = `${formatBytes(total)} (${t('perFrame')}${formatBytes(perFrame)})`

    } else {

      // 压缩模式：按压缩等级降低分辨率后导出 PNG，测量压缩后体积

      let total = 0

      const q = compressionQuality(sprite.compression)

      for (const im of sprite.images) {

        const img = await loadImage(im.url)

        const outW = Math.max(1, Math.round(img.naturalWidth * q.scale))

        const outH = Math.max(1, Math.round(img.naturalHeight * q.scale))

        const c = document.createElement('canvas')

        c.width = outW; c.height = outH

        c.getContext('2d')!.drawImage(img, 0, 0, outW, outH)

        const dataUrl = c.toDataURL('image/png')

        total += dataUrlToBlob(dataUrl).size

      }

      const perFrame = Math.round(total / Math.max(1, sprite.images.length))

      spriteCompressionSize.value = `${formatBytes(total)} (${t('perFrame')}${formatBytes(perFrame)})`

    }

  } catch {

    spriteCompressionSize.value = ''

  }

}

// 监听压缩等级、图片列表变化，实时重新计算

watch(() => [sprite.compression, sprite.images.length], () => updateSpriteCompressionSize(), { immediate: true })



// 根据总帧数和列数自动计算行数

const spriteRows = computed(() => Math.ceil(sprite.images.length / sprite.cols))



// 动画循环的定时器引用

let spriteAnimTimer: ReturnType<typeof setTimeout> | null = null



// 压缩预览图片缓存：key = 原图 URL + 压缩等级

const spriteImageCache = new Map<string, string>()



// 获取用于预览的图片 URL（若启用压缩则先生成压缩版本）

async function getSpritePreviewImage(url: string): Promise<string> {

  if (sprite.compression === 'none') return url

  const key = url + '|' + sprite.compression

  if (spriteImageCache.has(key)) return spriteImageCache.get(key)!

  const img = await loadImage(url)

  const q = compressionQuality(sprite.compression)

  const outW = Math.max(1, Math.round(img.naturalWidth * q.scale))

  const outH = Math.max(1, Math.round(img.naturalHeight * q.scale))

  const c = document.createElement('canvas')

  c.width = outW; c.height = outH

  const ctx = c.getContext('2d')!

  ctx.drawImage(img, 0, 0, outW, outH)

  const compressed = c.toDataURL('image/png')

  spriteImageCache.set(key, compressed)

  return compressed

}



// 加载用户上传的多张本地图片，追加到序列帧列表

async function loadSpriteImages(files: FileList | null) {

  if (!files) return

  for (const f of Array.from(files)) {

    sprite.images.push({ url: await fileToDataUrl(f), file: f })

  }

  nextTick(drawSpritePreview)

  updateSpriteCompressionSize()

}



// 根据预览容器尺寸设置高清画布（DPR 缩放，保证高分屏清晰）

function setupSpriteCanvasSize(c: HTMLCanvasElement) {

  const rect = c.getBoundingClientRect()

  const dpr = window.devicePixelRatio || 1

  c.width = Math.max(1, Math.floor(rect.width * dpr))

  c.height = Math.max(1, Math.floor(rect.height * dpr))

  const ctx = c.getContext('2d')!

  ctx.scale(dpr, dpr)

  return { ctx, rect }

}



// 绘制完整 Sprite Sheet 预览：按右侧模块尺寸缩放，小图也会放大铺满

// 若启用压缩，则预览中显示压缩后的图像效果

function drawSpritePreview() {

  const c = spritePreviewCanvas.value

  if (!c || !sprite.images.length) return

  const { ctx, rect } = setupSpriteCanvasSize(c)

  // 先填充背景色

  if (sprite.bg !== 'transparent') {

    ctx.fillStyle = sprite.bg

    ctx.fillRect(0, 0, rect.width, rect.height)

  } else {

    ctx.fillStyle = '#0e0e14'

    ctx.fillRect(0, 0, rect.width, rect.height)

  }

  // 异步获取第一张图的预览版（压缩或原图），并以其尺寸计算布局

  getSpritePreviewImage(sprite.images[0].url).then((src0) => {

    const img0 = new Image()

    img0.onload = () => {

      const cellW = img0.width, cellH = img0.height

      const fullW = sprite.cols * cellW + (sprite.cols + 1) * sprite.padding

      const fullH = spriteRows.value * cellH + (spriteRows.value + 1) * sprite.padding

      // 计算缩放比例，允许大于 1，避免小图预览过小

      const scale = Math.min(rect.width / fullW, rect.height / fullH)

      const offsetX = (rect.width - fullW * scale) / 2

      const offsetY = (rect.height - fullH * scale) / 2

      // 逐帧绘制到预览画布，整体居中

      sprite.images.forEach((im, i) => {

        getSpritePreviewImage(im.url).then((src) => {

          const img2 = new Image()

          img2.onload = () => {

            const sx = (i % sprite.cols) * cellW + ((i % sprite.cols) + 1) * sprite.padding

            const sy = Math.floor(i / sprite.cols) * cellH + (Math.floor(i / sprite.cols) + 1) * sprite.padding

            ctx.drawImage(img2, offsetX + sx * scale, offsetY + sy * scale, img2.width * scale, img2.height * scale)

          }

          img2.src = src

        })

      })

    }

    img0.src = src0

  })

}



// 绘制当前播放的某一帧：按容器尺寸缩放并居中，允许放大

// 若启用压缩，预览中显示压缩后的图像效果

function drawSpriteFrame(idx: number) {

  const c = spritePreviewCanvas.value

  if (!c || !sprite.images.length) return

  const { ctx, rect } = setupSpriteCanvasSize(c)

  ctx.fillStyle = sprite.bg === 'transparent' ? '#0e0e14' : sprite.bg

  ctx.fillRect(0, 0, rect.width, rect.height)

  getSpritePreviewImage(sprite.images[idx].url).then((src) => {

    const img = new Image()

    img.onload = () => {

      const scale = Math.min(rect.width / img.width, rect.height / img.height)

      const w = img.width * scale, h = img.height * scale

      ctx.drawImage(img, (rect.width - w) / 2, (rect.height - h) / 2, w, h)

    }

    img.src = src

  })

}



// 动画循环：按预览 FPS 逐帧播放

function playSpriteLoop() {

  if (!sprite.playing || !sprite.images.length) return

  drawSpriteFrame(sprite.animFrame)

  sprite.animFrame = (sprite.animFrame + 1) % sprite.images.length

  spriteAnimTimer = setTimeout(playSpriteLoop, 1000 / sprite.previewFps)

}



// 切换播放/暂停状态，停止时回到完整 Sprite Sheet 预览

function toggleSpritePreview() {

  if (sprite.playing) {

    sprite.playing = false

    if (spriteAnimTimer) { clearTimeout(spriteAnimTimer); spriteAnimTimer = null }

    drawSpritePreview()

  } else {

    sprite.playing = true

    sprite.animFrame = 0

    playSpriteLoop()

  }

}



// 当布局参数或图片数量变化时自动重绘（播放中不重绘，避免打断动画）

watch(() => [sprite.cols, sprite.padding, sprite.bg, sprite.images.length], () => {

  if (!sprite.playing) drawSpritePreview()

})

// 压缩等级变化时清空缓存并重新绘制预览，以实时展示压缩效果

watch(() => sprite.compression, () => {

  spriteImageCache.clear()

  if (!sprite.playing) drawSpritePreview()

})



// 导出用：在独立画布上绘制原始分辨率的 Sprite Sheet

function exportSpriteSheet(): Promise<string> {

  return new Promise((resolve) => {

    const c = document.createElement('canvas')

    const ctx = c.getContext('2d')!

    const img = new Image()

    img.onload = () => {

      const cellW = img.width, cellH = img.height

      const fullW = sprite.cols * cellW + (sprite.cols + 1) * sprite.padding

      const fullH = spriteRows.value * cellH + (spriteRows.value + 1) * sprite.padding

      c.width = fullW

      c.height = fullH

      // 始终导出 PNG 格式；透明背景保持透明，非透明背景按用户选择填充

      if (sprite.bg !== 'transparent') {

        ctx.fillStyle = sprite.bg

        ctx.fillRect(0, 0, c.width, c.height)

      }

      // 并发加载所有源图，全部就绪后一次性绘制

      Promise.all(sprite.images.map(im => new Promise<HTMLImageElement>((res) => {

        const img2 = new Image()

        img2.onload = () => res(img2)

        img2.src = im.url

      }))).then((loadedImages) => {

        loadedImages.forEach((img2, i) => {

          const x = (i % sprite.cols) * cellW + ((i % sprite.cols) + 1) * sprite.padding

          const y = Math.floor(i / sprite.cols) * cellH + (Math.floor(i / sprite.cols) + 1) * sprite.padding

          ctx.drawImage(img2, x, y)

        })

        // 导出格式固定为 PNG

        resolve(c.toDataURL('image/png'))

      })

    }

    img.src = sprite.images[0].url

  })

}



// 下载原始分辨率 Sprite Sheet PNG

async function downloadSpriteSheet() {

  const dataUrl = await exportSpriteSheet()

  downloadUrl(dataUrl, 'sprite_sheet.png')

}



// 下载 Sprite Sheet JSON 元数据（列、行、间距、帧数）

function downloadSpriteJson() {

  const data = { cols: sprite.cols, rows: spriteRows.value, padding: sprite.padding, frames: sprite.images.length }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })

  downloadUrl(URL.createObjectURL(blob), 'sprite_sheet.json')

}



// 保存原始分辨率 Sprite Sheet 到资源库

async function saveSpriteToLibrary() {

  const dataUrl = await exportSpriteSheet()

  saveToLibrary(dataUrl, 'sprite')

}



// ==================== TILEMAP ====================

const tm = reactive({

  tilesetUrl: '', tilesetImg: null as HTMLImageElement | null,

  tool: 'brush', showGrid: true, detail: false, w: 32, h: 32,

  selectedTile: -1, hoverTile: -1,

  tiles: [] as { x: number; y: number; w: number; h: number }[],

  map: [] as number[][]

})

const tilemapCanvas = ref<HTMLCanvasElement | null>(null)

const tmTools = [

  { key: 'brush', label: '画笔', icon: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>' },

  { key: 'eraser', label: '橡皮', icon: '<path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"/><path d="M17 17L7 7"/>' },

]

const tileSize = 32

let tmDrawing = false



async function loadTileset(file: File) {

  const url = await fileToDataUrl(file)

  tm.tilesetUrl = url

  const img = await loadImage(url)

  tm.tilesetImg = img

  sliceTileset(img)

  resetTilemap()

  drawTilemap()

}



/** 将 tileset 图片按固定 tileSize 切成图块列表 */

function sliceTileset(img: HTMLImageElement) {

  const cols = Math.floor(img.naturalWidth / tileSize)

  const rows = Math.floor(img.naturalHeight / tileSize)

  tm.tiles = []

  for (let y = 0; y < rows; y++) {

    for (let x = 0; x < cols; x++) {

      tm.tiles.push({ x: x * tileSize, y: y * tileSize, w: tileSize, h: tileSize })

    }

  }

  tm.selectedTile = tm.tiles.length ? 0 : -1

}



/** 重置地图数据为全空（-1 表示无图块） */

function resetTilemap() {

  tm.map = Array.from({ length: tm.h }, () => Array.from({ length: tm.w }, () => -1))

}



function getTileCoords(e: MouseEvent): { tx: number; ty: number } {

  const c = tilemapCanvas.value; if (!c) return { tx: 0, ty: 0 }

  const rect = c.getBoundingClientRect()

  const scaleX = c.width / rect.width, scaleY = c.height / rect.height

  return {

    tx: Math.floor((e.clientX - rect.left) * scaleX / tileSize),

    ty: Math.floor((e.clientY - rect.top) * scaleY / tileSize),

  }

}



function tmMouseDown(e: MouseEvent) {

  tmDrawing = true

  const { tx, ty } = getTileCoords(e)

  applyTileTool(tx, ty)

}



function tmMouseMove(e: MouseEvent) {

  if (!tmDrawing) return

  const { tx, ty } = getTileCoords(e)

  applyTileTool(tx, ty)

}



function tmMouseUp() { tmDrawing = false }



function applyTileTool(tx: number, ty: number) {

  if (tx < 0 || ty < 0 || tx >= tm.w || ty >= tm.h) return

  if (!tm.map.length) resetTilemap()

  if (tm.tool === 'brush') {

    tm.map[ty][tx] = tm.selectedTile >= 0 ? tm.selectedTile : -1

  } else if (tm.tool === 'eraser') {

    tm.map[ty][tx] = -1

  }

  drawTilemap()

}



/** 根据 tm.map 中的图块索引重绘整张地图 */

function drawTilemap() {

  nextTick(() => {

    const c = tilemapCanvas.value; if (!c) return

    const ctx = c.getContext('2d')!

    ctx.fillStyle = '#0e0e14'; ctx.fillRect(0, 0, c.width, c.height)

    if (!tm.map.length) resetTilemap()

    for (let y = 0; y < tm.h; y++) {

      for (let x = 0; x < tm.w; x++) {

        const tileIdx = tm.map[y]?.[x] ?? -1

        if (tileIdx >= 0 && tm.tilesetImg && tm.tiles[tileIdx]) {

          const t = tm.tiles[tileIdx]

          ctx.drawImage(tm.tilesetImg, t.x, t.y, t.w, t.h, x * tileSize, y * tileSize, tileSize, tileSize)

        }

      }

    }

    if (tm.showGrid) {

      ctx.strokeStyle = '#1e1e2e'; ctx.lineWidth = 1

      for (let x = 0; x <= c.width; x += tileSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke() }

      for (let y = 0; y <= c.height; y += tileSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke() }

    }

  })

}



watch(() => [tm.showGrid, tm.detail, tm.tilesetUrl, tm.w, tm.h], drawTilemap, { immediate: true })



/** 返回单个图块缩略图的 CSS background 样式 */

function tileThumbStyle(tile: { x: number; y: number; w: number; h: number }) {

  if (!tm.tilesetImg) return {}

  const scale = 100 / tile.w

  return {

    backgroundImage: `url(${tm.tilesetUrl})`,

    backgroundSize: `${tm.tilesetImg.naturalWidth * scale}px ${tm.tilesetImg.naturalHeight * scale}px`,

    backgroundPosition: `-${tile.x * scale}px -${tile.y * scale}px`,

  }

}



/** 从资源库选择图片作为 tilasync eset 并切片 */

async function importTilesetFromLibrary() {

  openAssetPicker('image', async (asset) => {

    tm.tilesetUrl = asset.dataUrl

    const img = await loadImage(asset.dataUrl)

    tm.tilesetImg = img

    sliceTileset(img)

    resetTilemap()

    drawTilemap()

    statusText.value = t('savedToLibrary')

  })

}



function exportTilemapJson() {

  const data = { width: tm.w, height: tm.h, tileSize, map: tm.map, tileset: tm.tilesetUrl }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })

  downloadUrl(URL.createObjectURL(blob), 'tilemap.json')

  statusText.value = t('jsonExported')

}

function exportTilemapPng() { if (tilemapCanvas.value) downloadUrl(tilemapCanvas.value.toDataURL(), 'tilemap.png') }

function saveTilemapToLibrary() { if (tilemapCanvas.value) saveToLibrary(tilemapCanvas.value.toDataURL(), 'map') }



// ==================== TOPDOWN PREVIEW / 序列帧预览 ====================

// 序列帧预览画布与隐藏文件输入引用

const topdownCanvas = ref<HTMLCanvasElement | null>(null)

const topdownMapInput = ref<HTMLInputElement | null>(null)

const topdownCharInput = ref<HTMLInputElement | null>(null)

const topdownVideoInput = ref<HTMLInputElement | null>(null)

// 当前加载的地图背景图

const tdMapImg = ref<HTMLImageElement | null>(null)

// 角色序列帧与当前播放索引

const tdCharFrames = ref<HTMLImageElement[]>([])

const tdCharFrameIdx = ref(0)

// 角色显示尺寸（已放大为 96×96，原始 32×32）

const tdCharSize = ref(96)

// 角色在画布上的坐标

const tdCharX = ref(400)

const tdCharY = ref(230)

// 当前按下的移动按键集合

const tdKeys = new Set<string>()

// 动画循环帧 ID 与上次换帧时间

let topdownRaf: number | null = null

let topdownLastFrameTime = 0



// 绘制序列帧预览场景：背景地图 + 居中角色

function drawTopdown() {

  const c = topdownCanvas.value; if (!c) return

  const ctx = c.getContext('2d')!; ctx.fillStyle = '#0e0e14'; ctx.fillRect(0,0,c.width,c.height)

  if (tdMapImg.value) {

    ctx.drawImage(tdMapImg.value, 0, 0, c.width, c.height)

  } else {

    ctx.fillStyle = '#1e1e2e'

    for (let x=0; x<c.width; x+=64) for (let y=0; y<c.height; y+=64) if ((x+y)%128===0) ctx.fillRect(x,y,64,64)

  }

  const frameImg = tdCharFrames.value[tdCharFrameIdx.value]

  if (frameImg) {

    const s = tdCharSize.value

    ctx.drawImage(frameImg, tdCharX.value - s/2, tdCharY.value - s/2, s, s)

  } else {

    ctx.fillStyle = '#00d4aa'; ctx.beginPath(); ctx.arc(tdCharX.value, tdCharY.value, tdCharSize.value/2, 0, Math.PI*2); ctx.fill()

  }

}



// 从 GIF ArrayBuffer 提取帧并转为 Image 对象

async function gifBufToImages(buf: ArrayBuffer): Promise<HTMLImageElement[]> {

  const frames = decodeGif(buf)

  const urls = frames.map(f => {

    const c = document.createElement('canvas')

    c.width = f.width; c.height = f.height

    const ctx = c.getContext('2d')!

    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height)

    ctx.putImageData(new ImageData(new Uint8ClampedArray(f.rgba), f.width, f.height), 0, 0)

    return c.toDataURL()

  })

  return Promise.all(urls.map(u => loadImage(u)))

}



// 从视频文件提取若干帧（用于序列帧预览）

async function extractTopdownVideoFrames(file: File, maxFrames = 10): Promise<HTMLImageElement[]> {

  const url = URL.createObjectURL(file)

  const v = document.createElement('video')

  v.src = url; v.muted = true; v.playsInline = true; v.preload = 'auto'

  await new Promise<void>((resolve, reject) => {

    v.addEventListener('loadedmetadata', () => resolve(), { once: true })

    v.addEventListener('error', reject, { once: true })

  })

  const duration = v.duration || 1

  const count = Math.min(maxFrames, Math.max(2, Math.floor(duration * 8)))

  const urls: string[] = []

  for (let i = 0; i < count; i++) {

    v.currentTime = duration * i / count

    await new Promise<void>(r => v.addEventListener('seeked', () => r(), { once: true }))

    const c = document.createElement('canvas')

    c.width = v.videoWidth; c.height = v.videoHeight

    const ctx = c.getContext('2d')!

    ctx.drawImage(v, 0, 0)

    urls.push(c.toDataURL())

  }

  URL.revokeObjectURL(url)

  return Promise.all(urls.map(u => loadImage(u)))

}



// 使用 requestAnimationFrame 循环更新角色位置，避免按键延迟；同时驱动序列帧动画

function startTopdownLoop() {

  stopTopdownLoop()

  topdownLastFrameTime = performance.now()

  const loop = () => {

    const c = topdownCanvas.value

    const speed = 4

    let moved = false

    if (tdKeys.has('w') || tdKeys.has('arrowup')) { tdCharY.value -= speed; moved = true }

    if (tdKeys.has('s') || tdKeys.has('arrowdown')) { tdCharY.value += speed; moved = true }

    if (tdKeys.has('a') || tdKeys.has('arrowleft')) { tdCharX.value -= speed; moved = true }

    if (tdKeys.has('d') || tdKeys.has('arrowright')) { tdCharX.value += speed; moved = true }

    if (moved && c) {

      const s = tdCharSize.value

      const minX = s/2, minY = s/2

      const maxX = c.width - s/2, maxY = c.height - s/2

      tdCharX.value = Math.max(minX, Math.min(maxX, tdCharX.value))

      tdCharY.value = Math.max(minY, Math.min(maxY, tdCharY.value))

      drawTopdown()

    }

    // 序列帧切换：每 100ms 切一帧

    const now = performance.now()

    if (tdCharFrames.value.length > 1 && now - topdownLastFrameTime >= 100) {

      tdCharFrameIdx.value = (tdCharFrameIdx.value + 1) % tdCharFrames.value.length

      topdownLastFrameTime = now

      drawTopdown()

    }

    topdownRaf = requestAnimationFrame(loop)

  }

  topdownRaf = requestAnimationFrame(loop)

}

function stopTopdownLoop() { if (topdownRaf) { cancelAnimationFrame(topdownRaf); topdownRaf = null } }



/** 记录俯视角移动按键按下状态 */

function topdownKeyDown(e: KeyboardEvent) {

  const k = e.key.toLowerCase()

  if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) {

    e.preventDefault()

    tdKeys.add(k)

  }

}



/** 记录俯视角移动按键松开状态 */

function topdownKeyUp(e: KeyboardEvent) { tdKeys.delete(e.key.toLowerCase()) }



// 触发本地地图上传

function triggerTopdownMap() { topdownMapInput.value?.click() }

// 触发本地角色/GIF 上传

function triggerTopdownChar() { topdownCharInput.value?.click() }

// 触发本地视频角色上传

function triggerTopdownVideo() { topdownVideoInput.value?.click() }

// 从资源库选择地图或角色

function importTopdownFromLibrary() {

  openAssetPicker('image', async (asset) => {

    try {

      if (asset.type === 'gif') {

        const res = await fetch(asset.dataUrl)

        tdCharFrames.value = await gifBufToImages(await res.arrayBuffer())

      } else if (asset.type === 'video') {

        // 资源库视频保存为 dataUrl 的概率低，若存在则无法直接按 URL 提取，保持单张占位

        tdCharFrames.value = [await loadImage(asset.thumb)]

      } else {

        tdCharFrames.value = [await loadImage(asset.dataUrl)]

      }

      tdCharFrameIdx.value = 0

      statusText.value = t('charLoaded')

      drawTopdown()

    } catch (err) {

      statusText.value = '角色加载失败：' + (err as Error).message

    }

  })

}



// 加载本地地图图片

async function loadTopdownMap(e: Event) {

  const target = e.target as HTMLInputElement; if (!target.files?.[0]) return

  const url = await fileToDataUrl(target.files[0]); target.value = ''

  const img = new Image(); img.onload = () => { tdMapImg.value = img; drawTopdown() }; img.src = url

  statusText.value = t('mapLoaded')

}

// 加载本地角色/GIF 序列帧

async function loadTopdownChar(e: Event) {

  const target = e.target as HTMLInputElement; if (!target.files?.[0]) return

  const file = target.files[0]; target.value = ''

  try {

    if (file.type === 'image/gif') {

      tdCharFrames.value = await gifBufToImages(await file.arrayBuffer())

    } else {

      tdCharFrames.value = [await loadImage(await fileToDataUrl(file))]

    }

    tdCharFrameIdx.value = 0

    statusText.value = t('charLoaded')

    drawTopdown()

  } catch (err) {

    statusText.value = '角色加载失败：' + (err as Error).message

  }

}

// 加载本地视频作为角色序列帧

async function loadTopdownVideo(e: Event) {

  const target = e.target as HTMLInputElement; if (!target.files?.[0]) return

  const file = target.files[0]; target.value = ''

  try {

    tdCharFrames.value = await extractTopdownVideoFrames(file)

    tdCharFrameIdx.value = 0

    statusText.value = t('charLoaded')

    drawTopdown()

  } catch (err) {

    statusText.value = '视频角色加载失败：' + (err as Error).message

  }

}

// 保存当前序列帧预览为截图

function topdownScreenshot() { if (topdownCanvas.value) downloadUrl(topdownCanvas.value.toDataURL(), 'topdown_screenshot.png') }

// 切换到序列帧预览标签时自动重绘

watch(() => mapTab.value, v => { if (v === 'preview') nextTick(drawTopdown) }, { immediate: true })



// ==================== ASSET LIBRARY ====================

const assetImportInput = ref<HTMLInputElement | null>(null)

const assetFilter = ref('all')

const assetSearch = ref('')

const assetDragOver = ref(false)

// 内存中资源列表，挂载时从 IndexedDB 加载

const assets = ref<{ id: number; type: string; name: string; thumb: string; dataUrl: string; created: number; selected: boolean }[]>([])

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

// Add asset filter labels

const assetFilterLabels: Record<string, Record<string, string>> = {

  allAssets: { zh: '全部', en: 'All', ja: 'すべて', ko: '전체' },

  allImages: { zh: '图像', en: 'Images', ja: '画像', ko: '이미지' },

  allGifs: { zh: 'GIF', en: 'GIF', ja: 'GIF', ko: 'GIF' },

  allFrames: { zh: '序列帧', en: 'Frames', ja: 'フレーム', ko: '프레임' },

  allSprites: { zh: '精灵图', en: 'Sprites', ja: 'スプライト', ko: '스프라이트' },

  allMaps: { zh: '地图', en: 'Maps', ja: 'マップ', ko: '맵' },

  allOutputs: { zh: '产出图', en: 'Outputs', ja: '出力', ko: '출력' },

  allVideos: { zh: '视频', en: 'Videos', ja: '動画', ko: '비디오' },

}

// Extend langDict with asset filter labels

Object.assign(langDict, assetFilterLabels)



const filteredAssets = computed(() => assets.value.filter(a => (assetFilter.value === 'all' || a.type === assetFilter.value) && a.name.toLowerCase().includes(assetSearch.value.toLowerCase())))

function triggerAssetImport() { assetImportInput.value?.click() }

// 从文件导入资源并持久化到 IndexedDB

async function handleAssetImport(e: Event) {

  const target = e.target as HTMLInputElement; if (!target.files) return

  for (const f of Array.from(target.files)) {

    const type = f.type.startsWith('video/') ? 'video' : f.type === 'image/gif' ? 'gif' : 'image'

    const dataUrl = await fileToDataUrl(f)

    const id = await addAsset(f.name, type, dataUrl)

    assets.value.push({ id, type, name: f.name, thumb: dataUrl, dataUrl, created: Date.now(), selected: false })

  }

  target.value = ''

}

// 拖拽导入资源并持久化到 IndexedDB

async function handleAssetDrop(e: DragEvent) {

  assetDragOver.value = false

  if (!e.dataTransfer?.files) return

  for (const f of Array.from(e.dataTransfer.files)) {

    const type = f.type.startsWith('video/') ? 'video' : f.type === 'image/gif' ? 'gif' : 'image'

    const dataUrl = await fileToDataUrl(f)

    const id = await addAsset(f.name, type, dataUrl)

    assets.value.push({ id, type, name: f.name, thumb: dataUrl, dataUrl, created: Date.now(), selected: false })

  }

}

function selectAllAssets() { filteredAssets.value.forEach(a => a.selected = true) }

// 删除选中资源：先删 IndexedDB，再删内存列表

async function deleteSelectedAssets() {

  const selected = assets.value.filter(a => a.selected)

  for (const a of selected) { await deleteAsset(a.id) }

  assets.value = assets.value.filter(a => !a.selected)

}

// 导出全部资源为 ZIP

async function exportAssets() {

  if (!assets.value.length) return

  loadingOpen.value = true; loadingText.value = t('loading')

  try {

    const blob = await exportAssetsZip(assets.value)

    saveAs(blob, 'artforge_assets.zip')

    statusText.value = t('assetsExported')

  } finally { loadingOpen.value = false }

}

// 保存 dataUrl 到资源库并持久化

async function saveToLibrary(url: string, type: string, name?: string) {

  const n = name || `asset_${Date.now()}.png`

  const id = await addAsset(n, type, url)

  assets.value.push({ id, type, name: n, thumb: url, dataUrl: url, created: Date.now(), selected: false })

  statusText.value = t('savedToLibrary')

}

// 自动保存上传的文件到资源库：视频取第一帧缩略图，图片/gif 保存原图
async function saveFileToLibrary(file: File, dataUrl: string) {
  try {
    let thumb = dataUrl
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
    }
    const id = await addAssetFromFile(file, thumb)
    const type = file.type.startsWith('video/') ? 'video' : (file.type === 'image/gif' ? 'gif' : 'image')
    assets.value.push({ id, type, name: file.name, thumb, dataUrl: thumb, created: Date.now(), selected: false })
    statusText.value = t('savedToLibrary')
  } catch (e) {
    console.warn('保存到资源库失败', e)
  }
}

// 挂载时从 IndexedDB 加载资源列表

async function loadAssets() {

  const records = await getAssets()

  assets.value = records.map(a => ({ id: a.id!, type: a.type, name: a.name, thumb: a.thumb, dataUrl: a.dataUrl, created: a.created, selected: false }))

}



// ==================== ASSET PICKER ====================

const assetPickerOpen = ref(false)

const assetPickerFilter = ref('all')

const assetPickerItems = computed(() => assets.value.filter(a => assetPickerFilter.value === 'all' || a.type === assetPickerFilter.value))

let assetPickerCallback: ((asset: { id: number; name: string; type: string; dataUrl: string; thumb: string }) => void) | null = null

// 打开资源选择器，按类型过滤，选择后执行回调

function openAssetPicker(filterType: string, cb: (asset: { id: number; name: string; type: string; dataUrl: string; thumb: string }) => void) {

  assetPickerFilter.value = filterType

  assetPickerCallback = cb

  assetPickerOpen.value = true

}

function closeAssetPicker() { assetPickerOpen.value = false; assetPickerCallback = null }

function selectAssetFromPicker(a: { id: number; name: string; type: string; dataUrl: string; thumb: string }) {

  assetPickerCallback?.(a)

  closeAssetPicker()

}



// ==================== LIFECYCLE ====================

onMounted(() => {

  // 从 localStorage 加载已保存的 API 配置方案

  try {

    const raw = localStorage.getItem('af_api_profiles')

    if (raw) apiProfiles.value = JSON.parse(raw)

  } catch { /* 忽略解析错误 */ }

  themeStore.init(); loadAssets(); loadT2iHistoryFromStorage(); pdInitLayers(); pdRender(); drawTilemap(); drawTopdown(); startTopdownLoop()

  const onHelp = (e: Event) => { helpText.value = (e as CustomEvent).detail; helpOpen.value = true }

  window.addEventListener('af-open-help', onHelp)

  window.addEventListener('keydown', handleKeyDown)

  window.addEventListener('keydown', topdownKeyDown)

  window.addEventListener('keyup', topdownKeyUp)

  window.addEventListener('resize', updateCropMetrics)

})



onUnmounted(() => {

  window.removeEventListener('keydown', handleKeyDown)

  window.removeEventListener('keydown', topdownKeyDown)

  window.removeEventListener('keyup', topdownKeyUp)

  window.removeEventListener('resize', updateCropMetrics)

  if (videoAnimRaf) clearTimeout(videoAnimRaf)

  if (gifAnimRaf) clearTimeout(gifAnimRaf)

  stopGifRangePreview()

  stopTopdownLoop()

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