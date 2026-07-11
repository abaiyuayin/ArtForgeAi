<template>
  <!-- 宣传首页根容器：深色主题背景 -->
  <div class="min-h-screen bg-[#08080c] text-white font-sans overflow-x-hidden">
    <!-- 顶部导航栏 -->
    <nav
      :class="[
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 h-16 transition-all duration-300',
        scrolled && 'bg-[#08080c]/90 backdrop-blur-md border-b border-white/5'
      ]"
    >
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-2.5 font-semibold text-lg no-underline text-white">
        <span class="w-2.5 h-2.5 bg-[#00d4aa] rotate-45" />
        ArtForgeAI
      </RouterLink>

      <!-- 桌面端导航 -->
      <div class="hidden md:flex items-center gap-8">
        <a href="#workflow" class="text-sm text-white/60 hover:text-white transition-colors no-underline">工作流</a>
        <a href="#features" class="text-sm text-white/60 hover:text-white transition-colors no-underline">功能</a>
        <a href="#modules" class="text-sm text-white/60 hover:text-white transition-colors no-underline">模块</a>
        <RouterLink
          to="/workspace"
          class="text-sm font-medium bg-[#00d4aa] text-[#08080c] px-5 py-2 rounded-md hover:opacity-90 transition-opacity no-underline"
        >
          开始制作
        </RouterLink>
      </div>
    </nav>

    <!-- 英雄区：左侧大标题布局 -->
    <section id="hero" class="relative min-h-screen flex items-center">
      <div class="relative z-10 max-w-5xl px-6 lg:px-12 pt-16">
        <!-- 标签 pill -->
        <div class="inline-flex items-center gap-2 border border-[#00d4aa]/30 bg-[#00d4aa]/5 text-[#00d4aa] px-4 py-1.5 rounded-full text-xs font-medium mb-8 animate-fade-up" style="animation-delay:0.2s">
          <span class="w-1.5 h-1.5 rounded-full bg-[#00d4aa]" />
          开源 · 免费 · 本地运行
        </div>

        <!-- 主标题 -->
        <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight mb-6 animate-fade-up" style="animation-delay:0.4s">
          本地离线 · 独立游戏<br>
          <span class="bg-gradient-to-r from-[#00d4aa] to-[#3b82f6] bg-clip-text text-transparent">美术资产管线</span>
        </h1>

        <!-- 副标题 -->
        <p class="text-base md:text-lg text-white/50 max-w-xl mb-10 leading-relaxed animate-fade-up" style="animation-delay:0.6s">
          ArtForgeAI 是为独立游戏开发者打造的本地美术工作台。图片处理、序列帧处理、资源库 —— 全部在浏览器本地运行，素材不上传云端。
        </p>

        <!-- 操作按钮 -->
        <div class="flex flex-wrap items-center gap-4 animate-fade-up" style="animation-delay:0.8s">
          <RouterLink
            to="/workspace"
            class="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-medium bg-[#00d4aa] text-[#08080c] hover:opacity-90 transition-opacity no-underline"
          >
            开始制作
          </RouterLink>
          <a
            href="https://github.com/abaiyuayin/ArtForgeAi"
            target="_blank"
            class="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-medium text-white border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all no-underline"
          >
            GitHub
          </a>
        </div>
      </div>

      <!-- 背景装饰：右侧渐变光晕 -->
      <div class="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-[#00d4aa]/10 rounded-full blur-[120px] pointer-events-none" />
    </section>

    <!-- 工作流区块 -->
    <section id="workflow" class="py-24 lg:py-32 border-t border-white/5">
      <div ref="workflowRef" class="max-w-6xl mx-auto px-6 lg:px-12 reveal" :class="workflowVisible && 'visible'">
        <div class="text-[#00d4aa] text-xs font-mono tracking-widest uppercase mb-3">01 / 全链路工作流</div>
        <h2 class="text-3xl md:text-4xl font-bold mb-4">不再在多个软件之间切换</h2>
        <p class="text-white/50 text-base md:text-lg max-w-2xl">将图像处理、序列帧处理和资产管理整合为一条完整管线，让美术资源从想法到游戏可用只需一次点击。</p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <div v-for="step in pipeline" :key="step.title" class="bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:border-[#00d4aa]/30 hover:-translate-y-1 transition-all">
            <div class="w-10 h-10 rounded-lg bg-[#00d4aa]/10 text-[#00d4aa] flex items-center justify-center text-lg mb-4">{{ step.icon }}</div>
            <h4 class="text-sm font-semibold mb-1">{{ step.title }}</h4>
            <p class="text-xs text-white/40">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 核心能力区块 -->
    <section id="features" class="py-24 lg:py-32 bg-white/[0.01]">
      <div ref="featuresRef" class="max-w-6xl mx-auto px-6 lg:px-12 reveal" :class="featuresVisible && 'visible'">
        <div class="text-[#00d4aa] text-xs font-mono tracking-widest uppercase mb-3">02 / 核心能力</div>
        <h2 class="text-3xl md:text-4xl font-bold mb-4">覆盖独立游戏美术的每一个环节</h2>
        <p class="text-white/50 text-base md:text-lg max-w-2xl">为游戏开发者量身打造的专用管线，每一个功能都直接对应游戏开发中的真实需求。</p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          <div v-for="feat in features" :key="feat.title" class="bg-[#08080c] border border-white/5 rounded-xl p-6 hover:border-[#00d4aa]/30 transition-colors group">
            <div class="w-10 h-10 rounded-lg bg-[#00d4aa]/10 text-[#00d4aa] flex items-center justify-center text-lg mb-4 group-hover:scale-110 transition-transform">{{ feat.icon }}</div>
            <h3 class="text-base font-semibold mb-2">{{ feat.title }}</h3>
            <p class="text-sm text-white/40 leading-relaxed">{{ feat.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 行动号召区块 -->
    <section id="download" class="py-24 lg:py-32 text-center border-t border-white/5">
      <div ref="ctaRef" class="relative z-10 max-w-3xl mx-auto px-6 reveal" :class="ctaVisible && 'visible'">
        <h2 class="text-3xl md:text-5xl font-bold mb-4">让每一款独立游戏都有机会被看见</h2>
        <p class="text-white/50 text-base md:text-lg max-w-xl mx-auto mb-8">完全开源免费。所有核心功能本地运行，你的素材永远属于你。</p>
        <div class="flex flex-wrap justify-center gap-4">
          <RouterLink
            to="/workspace"
            class="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-medium bg-[#00d4aa] text-[#08080c] hover:opacity-90 transition-opacity no-underline"
          >
            开始制作
          </RouterLink>
          <a
            href="https://github.com/abaiyuayin/ArtForgeAi"
            target="_blank"
            class="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-medium text-white border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all no-underline"
          >
            GitHub
          </a>
        </div>
        <p class="mt-8 text-xs font-mono tracking-widest text-white/30 uppercase">当前版本 v0.4 · MIT License</p>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="border-t border-white/5 py-8 text-center text-white/30 text-sm">
      <p class="font-medium">ArtForgeAI — 独立游戏美术一站式工作台</p>
      <p class="mt-1">开源 · 免费 · 本地运行</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// 导入 Vue 响应式 API 与生命周期钩子
import { ref, onMounted, onUnmounted } from 'vue'

// 导航栏滚动状态
const scrolled = ref(false)

// 各区块 DOM 引用，用于 IntersectionObserver
const workflowRef = ref<HTMLElement | null>(null)
const featuresRef = ref<HTMLElement | null>(null)
const ctaRef = ref<HTMLElement | null>(null)

// 各区块可见性状态
const workflowVisible = ref(false)
const featuresVisible = ref(false)
const ctaVisible = ref(false)

// 使用 IntersectionObserver 监听元素进入视口
function observe(el: HTMLElement | null, setter: (v: boolean) => void) {
  if (!el) return
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setter(true)
          // 触发后取消观察，避免重复动画
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12 }
  )
  observer.observe(el)
}

// 滚动事件处理：更新导航栏背景状态
function onScroll() {
  scrolled.value = window.scrollY > 40
}

onMounted(() => {
  // 监听各功能区块，触发动画
  observe(workflowRef.value, (v) => (workflowVisible.value = v))
  observe(featuresRef.value, (v) => (featuresVisible.value = v))
  observe(ctaRef.value, (v) => (ctaVisible.value = v))
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})

// 工作流步骤数据
const pipeline = [
  { icon: '✂', title: '图像处理', desc: '裁剪 / 抠图 / 网格切分' },
  { icon: '🎬', title: '序列帧工场', desc: '视频抽帧 / GIF 拆解 / 精灵图' },
  { icon: '📁', title: '资源库', desc: '本地存储 / 搜索 / 复用' },
]

// 核心能力列表数据
const features = [
  { icon: '✂', title: '图像处理', desc: '裁剪、抠图、网格切分，为素材进入项目做好准备。' },
  { icon: '🎞', title: '序列帧工场', desc: '视频转序列帧、GIF 拆解、Sprite Sheet 合成，一站式处理动画资源。' },
  { icon: '📁', title: '本地资源库', desc: '项目级资产管理，自动分类图片与序列帧，支持标签与搜索，完全本地不上传云端。' },
]
</script>

<style scoped>
/* 滚动 reveal 动画初始状态 */
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
/* 元素进入视口后的可见状态 */
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
/* 从下方淡入的 keyframes */
@keyframes fade-up {
  to { opacity: 1; transform: translateY(0); }
}
/* 应用 fade-up 动画的类 */
.animate-fade-up {
  opacity: 0;
  transform: translateY(16px);
  animation: fade-up 0.9s forwards;
}
</style>
