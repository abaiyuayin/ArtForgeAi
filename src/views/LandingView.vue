<template>
  <div class="min-h-screen bg-af-bg text-af-ink font-sans overflow-x-hidden">
    <nav
      :class="[
        'fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 lg:px-10 py-5 transition-all duration-300',
        scrolled && 'bg-af-bg/85 backdrop-blur-md border-b border-af-rule'
      ]"
    >
      <RouterLink to="/" class="flex items-center gap-2 font-bold text-lg text-af-ink no-underline">
        <span class="w-2 h-2 bg-af-accent rounded-sm rotate-45" />
        ArtForgeAI
      </RouterLink>
      <div class="hidden md:flex items-center gap-8">
        <a href="#workflow" class="text-sm text-af-muted hover:text-af-ink transition-colors no-underline">工作流</a>
        <a href="#features" class="text-sm text-af-muted hover:text-af-ink transition-colors no-underline">功能</a>
        <a href="#modules" class="text-sm text-af-muted hover:text-af-ink transition-colors no-underline">模块</a>
        <RouterLink
          to="/workspace"
          class="text-sm font-semibold bg-af-accent text-af-bg px-4 py-2 rounded-md hover:opacity-90 transition-opacity no-underline"
        >
          开始制作
        </RouterLink>
      </div>
    </nav>

    <section id="hero" class="relative min-h-svh flex items-end overflow-hidden">
      <img
        src="/artforgeai-hero.jpg"
        alt=""
        class="absolute inset-0 w-full h-full object-cover opacity-55 scale-105 transition-transform duration-[8000ms] ease-out"
        :class="heroLoaded && 'scale-100'"
        @load="heroLoaded = true"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-af-bg/20 via-af-bg/55 to-af-bg" />
      <div class="relative z-10 max-w-3xl px-6 lg:px-10 pb-24 lg:pb-32">
        <div class="inline-block text-af-accent border border-af-accent/35 px-4 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase mb-6 animate-fade-up" style="animation-delay:0.2s">
          开源 · 免费 · AI 驱动
        </div>
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-5 animate-fade-up" style="animation-delay:0.4s">
          从概念到<br>
          <em class="not-italic bg-gradient-to-br from-af-accent to-af-accent2 bg-clip-text text-transparent">引擎可用资源</em><br>
          一站式完成
        </h1>
        <p class="text-base md:text-lg text-af-muted max-w-xl mb-8 animate-fade-up" style="animation-delay:0.6s">
          ArtForgeAI 是为独立游戏开发者打造的本地 AI 美术工作台。AI 生成、像素编辑、序列帧处理、地图编辑、引擎导出 —— 全部在一个工具内完成。
        </p>
        <div class="flex flex-wrap gap-4 animate-fade-up" style="animation-delay:0.8s">
          <RouterLink
            to="/workspace"
            class="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold bg-af-accent text-af-bg hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,212,170,0.25)] transition-all no-underline"
          >
            开始制作
          </RouterLink>
          <a href="https://github.com" target="_blank" class="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-af-ink border border-af-rule hover:border-af-accent hover:text-af-accent transition-all no-underline">
            GitHub
          </a>
        </div>
      </div>
    </section>

    <section id="workflow" class="py-24 lg:py-28 bg-af-surface border-y border-af-rule">
      <div ref="workflowRef" class="max-w-6xl mx-auto px-6 lg:px-10 reveal" :class="workflowVisible && 'visible'">
        <div class="text-af-accent text-xs font-mono tracking-widest uppercase mb-3">01 / 全链路工作流</div>
        <h2 class="text-2xl md:text-4xl font-bold mb-3">不再在五个软件之间切换</h2>
        <p class="text-af-muted text-base md:text-lg max-w-xl">将概念设计、像素编辑、序列帧处理、地图编辑和引擎导出整合为一条完整管线，让美术资源从想法到游戏可用只需一次点击。</p>

        <div class="flex flex-col md:flex-row items-center justify-between gap-4 mt-12">
          <div v-for="(step, i) in pipeline" :key="step.title" class="flex-1 min-w-[140px] text-center p-6 rounded-xl hover:bg-white/[0.03] hover:-translate-y-1 transition-all group">
            <div class="w-11 h-11 mx-auto mb-4 rounded-xl bg-gradient-to-br from-af-accent2 to-af-accent flex items-center justify-center text-lg text-white" v-html="step.icon" />
            <h4 class="text-sm font-semibold mb-1">{{ step.title }}</h4>
            <p class="text-xs text-af-muted">{{ step.desc }}</p>
          </div>
          <div v-for="n in pipeline.length - 1" :key="n" class="text-af-accent text-xl opacity-60 md:rotate-0 rotate-90">→</div>
        </div>
      </div>
    </section>

    <section id="features" class="py-24 lg:py-28">
      <div ref="featuresRef" class="max-w-6xl mx-auto px-6 lg:px-10 reveal" :class="featuresVisible && 'visible'">
        <div class="text-af-accent text-xs font-mono tracking-widest uppercase mb-3">02 / 核心能力</div>
        <h2 class="text-2xl md:text-4xl font-bold mb-3">覆盖独立游戏美术的每一个环节</h2>
        <p class="text-af-muted text-base md:text-lg max-w-xl">不是通用工具的简单堆砌，而是为游戏开发者量身打造的专用管线。每一个功能都直接对应游戏开发中的真实需求。</p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-12 border-t border-l border-af-rule">
          <div v-for="feat in features" :key="feat.title" class="p-7 border-r border-b border-af-rule relative group hover:bg-white/[0.02] transition-colors">
            <div class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-af-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 class="text-base font-semibold mb-2 flex items-center gap-2">
              <span class="text-af-accent text-lg">{{ feat.icon }}</span>
              {{ feat.title }}
            </h3>
            <p class="text-sm text-af-muted leading-relaxed">{{ feat.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section id="modules" class="py-24 lg:py-28 bg-af-surface border-y border-af-rule">
      <div ref="modulesRef" class="max-w-6xl mx-auto px-6 lg:px-10 reveal" :class="modulesVisible && 'visible'">
        <div class="text-af-accent text-xs font-mono tracking-widest uppercase mb-3">03 / 对比与差异化</div>
        <h2 class="text-2xl md:text-4xl font-bold mb-3">为什么不是 Midjourney + Photoshop + Spine</h2>
        <p class="text-af-muted text-base md:text-lg max-w-xl">通用工具不懂游戏工作流，专业工具没有 AI 能力。ArtForgeAI 填补了中间地带。</p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div class="bg-af-bg border border-af-rule rounded-xl p-7 hover:-translate-y-0.5 transition-transform">
            <h4 class="font-semibold mb-3">通用 AI 绘图</h4>
            <ul class="text-sm text-af-muted space-y-2">
              <li v-for="item in compare[0]" :key="item" class="pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:rounded-full before:bg-af-accent2">{{ item }}</li>
            </ul>
          </div>
          <div class="bg-af-bg border border-af-rule rounded-xl p-7 hover:-translate-y-0.5 transition-transform">
            <h4 class="font-semibold mb-3">专业游戏工具</h4>
            <ul class="text-sm text-af-muted space-y-2">
              <li v-for="item in compare[1]" :key="item" class="pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:rounded-full before:bg-af-accent2">{{ item }}</li>
            </ul>
          </div>
          <div class="bg-af-bg border border-af-accent/25 rounded-xl p-7 hover:-translate-y-0.5 transition-transform">
            <h4 class="font-semibold mb-3 text-af-accent">ArtForgeAI</h4>
            <ul class="text-sm text-af-muted space-y-2">
              <li v-for="item in compare[2]" :key="item" class="pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:rounded-full before:bg-af-accent">{{ item }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section id="download" class="relative py-28 lg:py-32 text-center overflow-hidden">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-af-accent/15 rounded-full blur-3xl pointer-events-none" />
      <div ref="ctaRef" class="relative z-10 max-w-3xl mx-auto px-6 reveal" :class="ctaVisible && 'visible'">
        <h2 class="text-3xl md:text-5xl font-bold mb-4">让每一款独立游戏<br>都有机会被看见</h2>
        <p class="text-af-muted text-base md:text-lg max-w-lg mx-auto mb-8">完全开源免费。支持 Windows、macOS 与 Linux。所有核心功能本地运行，你的素材永远属于你。</p>
        <div class="flex flex-wrap justify-center gap-4">
          <RouterLink
            to="/workspace"
            class="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold bg-af-accent text-af-bg hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,212,170,0.25)] transition-all no-underline"
          >
            开始制作
          </RouterLink>
          <a href="#" class="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold text-af-ink border border-af-rule hover:border-af-accent hover:text-af-accent transition-all no-underline">阅读文档</a>
        </div>
        <p class="mt-8 text-xs font-mono tracking-widest text-af-muted uppercase">当前版本 v0.2 · MIT License</p>
      </div>
    </section>

    <footer class="border-t border-af-rule py-10 text-center text-af-muted text-sm">
      <p class="font-medium">ArtForgeAI — 独立游戏美术一站式工作台</p>
      <p class="mt-2 opacity-70">开源 · 免费 · AI 驱动</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const heroLoaded = ref(false)
const scrolled = ref(false)

const workflowRef = ref<HTMLElement | null>(null)
const featuresRef = ref<HTMLElement | null>(null)
const modulesRef = ref<HTMLElement | null>(null)
const ctaRef = ref<HTMLElement | null>(null)

const workflowVisible = ref(false)
const featuresVisible = ref(false)
const modulesVisible = ref(false)
const ctaVisible = ref(false)

function observe(el: HTMLElement | null, setter: (v: boolean) => void) {
  if (!el) return
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setter(true)
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12 }
  )
  observer.observe(el)
}

function onScroll() {
  scrolled.value = window.scrollY > 40
}

onMounted(() => {
  observe(workflowRef.value, (v) => (workflowVisible.value = v))
  observe(featuresRef.value, (v) => (featuresVisible.value = v))
  observe(modulesRef.value, (v) => (modulesVisible.value = v))
  observe(ctaRef.value, (v) => (ctaVisible.value = v))
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})

const pipeline = [
  { icon: '✍', title: 'AI 概念工坊', desc: '文生图 / 图生图 / 画风迁移' },
  { icon: '🎨', title: '像素画室', desc: '像素绘画 / 精细处理 / 抠图' },
  { icon: '🎬', title: '序列帧工场', desc: '视频抽帧 / GIF / Sprite Sheet' },
  { icon: '🗺', title: '地图编辑器', desc: '瓦片双网格 / 多层 / 导出' },
  { icon: '🚀', title: '引擎直通车', desc: 'Spine / RPG Maker / Godot' },
]

const features = [
  { icon: '✨', title: 'AI 概念工坊', desc: '文生图、图生图、画风迁移、角色简化三档、多姿势参考生成。内置像素、二次元、Low Poly 等游戏风格模板。' },
  { icon: '✂', title: '三重抠图引擎', desc: 'AI 语义分割抠图、色度键（绿幕/蓝幕）、连通域抠图。覆盖 AI 生成素材、实拍素材、纯色背景全场景。' },
  { icon: '🎞', title: '序列帧工场', desc: '视频抽帧、GIF 与序列帧互转、Sprite Sheet 合成与调整、动画预览、按偏移重排导出。' },
  { icon: '✏', title: '像素画室', desc: '内置像素编辑器，支持画笔、橡皮、滚轮缩放、右键平移、撤销。精细处理包含硬缩放、内描边、像素化、超级橡皮。' },
  { icon: '🦴', title: 'Spine 动画中心', desc: '自动切割角色部件、实时预览骨骼动画、待机动画生成、五动作单帧序列（走/跑/跳/攻击/Dash）。' },
  { icon: '🗺', title: '瓦片地图编辑器', desc: '双网格系统（terrain + detail），多图层管理，自动图块，支持导出 TMX / JSON / PNG 格式。' },
  { icon: '🚀', title: '引擎直通车', desc: 'RPG Maker 行走图/战斗图一键处理（含 V1/V2 多规格）、Godot 场景 UI 直接导出（.tscn）。' },
  { icon: '🎮', title: '预览场景', desc: 'Top-down 俯视角与街机横版两套测试场景，加载角色与动画实时验证在游戏中的实际表现。' },
  { icon: '📁', title: '本地资源云库', desc: '项目级资产管理，自动分类图库/序列帧/地图，支持标签、搜索与跨项目复用。完全本地，不上传云端。' },
]

const compare = [
  ['不懂 Sprite Sheet 规格', '不懂 RPG Maker 行走图格式', '不懂 Spine 骨骼切片', '输出后仍需大量手动处理'],
  ['没有 AI 生成能力', '订阅费用高昂', '学习曲线陡峭', '各工具之间无法打通'],
  ['AI 生成直接对接游戏格式', '开源免费，零订阅成本', '全链路闭环，无需切换', '本地运行，数据隐私有保障'],
]
</script>

<style scoped>
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
@keyframes fade-up {
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-up {
  opacity: 0;
  transform: translateY(16px);
  animation: fade-up 0.9s forwards;
}
</style>
