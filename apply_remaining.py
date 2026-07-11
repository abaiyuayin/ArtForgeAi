#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""补充应用剩余的多行替换（适配文件中的空行间隔）"""
import re
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\30684\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a395283fab124df8d97b1d2\artforgeai-web")
WORKSPACE = ROOT / "src" / "views" / "WorkspaceView.vue"


def blk(lines):
    """用空行连接代码行，保持文件现有风格"""
    return '\n\n'.join(lines)


def sub_one(text: str, pattern: str, repl, label: str) -> str:
    if not re.search(pattern, text, flags=re.DOTALL):
        print(f"[SKIP] 未匹配: {label}", file=sys.stderr)
        return text
    new_text, count = re.subn(pattern, repl, text, count=1, flags=re.DOTALL)
    if count != 1:
        print(f"[WARN] 替换次数 {count}: {label}", file=sys.stderr)
    return new_text


def main() -> int:
    if not WORKSPACE.exists():
        print(f"[ERR] 文件不存在: {WORKSPACE}", file=sys.stderr)
        return 1
    ws = WORKSPACE.read_text(encoding="utf-8")

    # ---------------- Change 3: AI concept API button ----------------
    new_btn = blk([
        r'                  <button type="button" class="btn-secondary inline-flex items-center gap-1.5" @click="apiOpen = true">',
        r'                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
        r'                    <span>{{ t(\'apiConfig\') }}</span>',
        r'                  </button>',
    ])
    ws = sub_one(
        ws,
        r'(<div class="flex items-center gap-2">\n\n\s*<select v-model="apiProfileId" class="form-select[^"]*" @change="selectApiProfile\(apiProfileId\)">\n\n\s*<option value="">\{\{ t\(\'noProfile\'\) \}\}</option>\n\n\s*<option v-for="p in apiProfiles" :key="p\.id" :value="p\.id">\{\{ p\.name \}\}</option>\n\n\s*</select>\n\n\s*)<button class="btn-secondary" @click="apiOpen = true">\{\{ t\(\'apiSettings\'\) \}\}</button>',
        lambda m: m.group(1) + new_btn,
        "AI concept API button",
    )

    # ---------------- Change 4: txt2img layout ----------------
    new_txt2img = blk([
        r'                <div v-if="aiTab === \'txt2img\'" class="flex gap-3">',
        r'                  <div class="flex-1 min-w-0 space-y-3">',
        r'                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5">',
        r'                      <div class="panel-title"><span>{{ t(\'prompt\') }}</span><HelpBtn :text="t(\'txt2imgHelp\')" /></div>',
        r'                      <textarea v-model="t2i.prompt" rows="3" :placeholder="t(\'promptPlaceholder\')" class="form-textarea mb-3"></textarea>',
        r'                      <div class="form-group"><label class="form-label">{{ t(\'negativePrompt\') }}</label><textarea v-model="t2i.negative" rows="2" class="form-textarea"></textarea></div>',
        r'                      <div class="form-group mt-3">',
        r'                        <label class="form-label">{{ t(\'refImage\') }}<HelpBtn :text="t(\'refImageHelp\')" /></label>',
        r'                        <UploadZone accept="image/*" multiple :prompt="t(\'refImagePrompt\')" @files="t2i.refs = $event; previewT2iRefs()" />',
        r'                        <div v-if="t2i.refPreviews.length" class="flex flex-wrap gap-1.5 mt-2"><img v-for="(u,i) in t2i.refPreviews" :key="i" :src="u" class="w-16 h-16 object-cover rounded border border-af-rule" /></div>',
        r'                      </div>',
        r'                      <div class="flex gap-2 mt-3"><button class="btn-primary" :disabled="t2i.generating" @click="generateTxt2Img">{{ t2i.generating ? t(\'generating\') : t(\'generateImage\') }}</button></div>',
        r'                      <div v-if="t2i.progress > 0" class="h-1 bg-af-bg rounded overflow-hidden mt-3"><div class="h-full rounded bg-gradient-to-r from-af-accent to-af-accent2 transition-all" :style="{ width: t2i.progress + \'%\' }"></div></div>',
        r'                    </div>',
        r'                    <div class="text-[13px] font-semibold mb-2">{{ t(\'results\') }}</div>',
        r'                    <div class="bg-af-surface border border-af-rule rounded-lg aspect-square w-full max-w-[300px] overflow-hidden relative group cursor-pointer" @click="openPreview(t2i.resultUrl || placeholderUrl())">',
        r'                      <img v-if="t2i.resultUrl" :src="t2i.resultUrl" class="w-full h-full object-cover" />',
        r'                      <div v-else class="w-full h-full flex items-center justify-center text-xs text-af-muted">{{ t(\'waiting\') }}</div>',
        r'                      <div v-if="t2i.resultUrl" class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"><button class="w-7 h-7 rounded-md bg-white/15 text-white flex items-center justify-center" @click.stop="saveToLibrary(t2i.resultUrl, \'output\')"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></button></div>',
        r'                    </div>',
        r'                  </div>',
        r'                  <!-- 右侧历史记录 -->',
        r'                  <div class="w-[260px] shrink-0 bg-af-bg border border-af-rule rounded-lg p-3.5 flex flex-col h-fit max-h-[calc(100vh-180px)]">',
        r'                    <div class="panel-title mb-2">{{ t(\'t2iHistory\') }}</div>',
        r'                    <div v-if="!t2iHistory.length" class="text-xs text-af-muted py-4 text-center">{{ t(\'t2iHistoryEmpty\') }}</div>',
        r'                    <div v-else class="flex flex-col gap-2 overflow-y-auto pr-1">',
        r'                      <div v-for="(h, i) in t2iHistory" :key="i" class="bg-af-surface border border-af-rule rounded-lg p-2 cursor-pointer hover:border-af-accent transition-colors" @click="loadT2iHistory(h)">',
        r'                        <img :src="h.resultUrl" class="w-full aspect-square object-cover rounded-md bg-[#0e0e14] mb-2" />',
        r'                        <div class="text-[11px] text-af-muted line-clamp-2">{{ h.prompt }}</div>',
        r'                        <div v-if="h.refPreviews.length" class="flex gap-1 mt-1"><img v-for="(u, ri) in h.refPreviews.slice(0,3)" :key="ri" :src="u" class="w-5 h-5 object-cover rounded border border-af-rule" /></div>',
        r'                      </div>',
        r'                    </div>',
        r'                  </div>',
        r'                </div>',
    ])
    ws = sub_one(
        ws,
        r'(                <!-- txt2img -->\n\n)(.*?)(?=\n\n                <!-- 画风迁移 -->)',
        lambda m: m.group(1) + new_txt2img,
        "txt2img layout",
    )

    # ---------------- Change 5: AI TXT2IMG section ----------------
    new_t2i_section = blk([
        r'// ==================== AI TXT2IMG ====================',
        r"const t2i = reactive({ prompt: '', negative: '', refs: [] as File[], refPreviews: [] as string[], resultUrl: '', generating: false, progress: 0 })",
        r'// T2I 成功生成历史记录',
        r'const t2iHistory = ref<{ prompt: string; negative: string; refs: File[]; refPreviews: string[]; resultUrl: string; created: number }[]>([])',
        r'async function previewT2iRefs() { t2i.refPreviews = await Promise.all(t2i.refs.map(fileToDataUrl)) }',
        r'async function generateTxt2Img() {',
        r'  // 验证：必须先选择 API 配置方案',
        r"  if (!apiProfileId.value) { showDialog(t('needApiProfile')); return }",
        r'  // 验证：至少需要提示词或参考图',
        r"  if (!t2i.prompt.trim() && !t2i.refs.length) { showDialog(t('txt2imgNeedConfig')); return }",
        r'  const profile = apiProfiles.value.find(p => p.id === apiProfileId.value)',
        r"  if (!profile) { showDialog(t('needApiProfile')); return }",
        r'',
        r'  t2i.generating = true; t2i.progress = 10',
        r'  try {',
        r"    let resultUrl = ''",
        r'    if (t2i.refs.length) {',
        r'      // 参考图优先使用 img2img / gemini 等支持参考图的接口',
        r'      resultUrl = await callImg2ImgApi(profile)',
        r'    } else {',
        r'      resultUrl = await callTxt2ImgApi(profile)',
        r'    }',
        r"    if (!resultUrl) throw new Error('Empty response')",
        r'    t2i.resultUrl = resultUrl',
        r'    t2i.progress = 100',
        r'    addT2iHistory()',
        r"    statusText.value = t('txt2imgDone')",
        r'  } catch (e) {',
        r"    showDialog(t('txt2imgFailed') + ': ' + (e as Error).message)",
        r'    t2i.progress = 0',
        r'  } finally {',
        r'    t2i.generating = false',
        r'  }',
        r'}',
        r'',
        r'// 调用文生图 API',
        r'async function callTxt2ImgApi(profile: ApiConfigProfile): Promise<string> {',
        r'  const extra = parseApiExtra(profile.extra)',
        r"  const size = extra.size || '1024x1024'",
        r"  const [width, height] = size.split('x').map(Number)",
        r'',
        r"  if (profile.provider === 'openai' || profile.provider === 'custom' || isOpenAiCompatible(profile.provider)) {",
        r'    const body: any = { model: profile.model, prompt: t2i.prompt, n: 1, size }',
        r"    if (profile.provider === 'openai') body.quality = extra.quality || 'standard'",
        r'    const res = await fetch(profile.endpoint, {',
        r"      method: 'POST',",
        r"      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + profile.key },",
        r'      body: JSON.stringify(body)',
        r'    })',
        r"    if (!res.ok) throw new Error('API ' + res.status + ' ' + await res.text())",
        r'    const data = await res.json()',
        r"    return data.data?.[0]?.url || data.url || data.output?.[0] || ''",
        r'  }',
        r'',
        r"  if (profile.provider === 'sd') {",
        r'    // Stable Diffusion WebUI txt2img',
        r'    const body = { prompt: t2i.prompt, negative_prompt: t2i.negative, width, height, steps: extra.steps || 20, cfg_scale: extra.cfg_scale || 7, seed: extra.seed || -1 }',
        r"    const res = await fetch(profile.endpoint.replace(/\/?$/, '') + '/sdapi/v1/txt2img', {",
        r"      method: 'POST',",
        r"      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + profile.key },",
        r'      body: JSON.stringify(body)',
        r'    })',
        r"    if (!res.ok) throw new Error('API ' + res.status)",
        r'    const data = await res.json()',
        r"    return 'data:image/png;base64,' + (data.images?.[0] || data.image || '')",
        r'  }',
        r'',
        r"  if (profile.provider === 'gemini') {",
        r'    // Gemini image generation (simplified)',
        r'    const res = await fetch(profile.endpoint, {',
        r"      method: 'POST',",
        r"      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': profile.key },",
        r'      body: JSON.stringify({ contents: [{ parts: [{ text: t2i.prompt }] }], generationConfig: { responseModalities: [\'TEXT\', \'IMAGE\'] } })',
        r'    })',
        r"    if (!res.ok) throw new Error('API ' + res.status)",
        r'    const data = await res.json()',
        r'    const parts = data.candidates?.[0]?.content?.parts || []',
        r'    const imgPart = parts.find((p: any) => p.inlineData)',
        r"    if (imgPart) return 'data:' + imgPart.inlineData.mimeType + ';base64,' + imgPart.inlineData.data",
        r"    throw new Error('No image in Gemini response')",
        r'  }',
        r'',
        r'  // 默认 fallback：OpenAI-compatible',
        r'  const res = await fetch(profile.endpoint, {',
        r"    method: 'POST',",
        r"    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + profile.key },",
        r'    body: JSON.stringify({ model: profile.model, prompt: t2i.prompt, n: 1, size })',
        r'  })',
        r"  if (!res.ok) throw new Error('API ' + res.status + ' ' + await res.text())",
        r'  const data = await res.json()',
        r"  return data.data?.[0]?.url || data.url || ''",
        r'}',
        r'',
        r'// 调用图生图 API（当前仅 SD 原生支持，其余回落到 txt2img）',
        r'async function callImg2ImgApi(profile: ApiConfigProfile): Promise<string> {',
        r'  const extra = parseApiExtra(profile.extra)',
        r"  const size = extra.size || '1024x1024'",
        r"  const [width, height] = size.split('x').map(Number)",
        r'  const refDataUrl = t2i.refPreviews[0]',
        r'',
        r"  if (profile.provider === 'sd') {",
        r"    const base64 = refDataUrl.split(',')[1]",
        r'    const body = { init_images: [base64], prompt: t2i.prompt, negative_prompt: t2i.negative, width, height, steps: extra.steps || 20, cfg_scale: extra.cfg_scale || 7, denoising_strength: extra.denoising_strength || 0.75 }',
        r"    const res = await fetch(profile.endpoint.replace(/\/?$/, '') + '/sdapi/v1/img2img', {",
        r"      method: 'POST',",
        r"      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + profile.key },",
        r'      body: JSON.stringify(body)',
        r'    })',
        r"    if (!res.ok) throw new Error('API ' + res.status)",
        r'    const data = await res.json()',
        r"    return 'data:image/png;base64,' + (data.images?.[0] || '')",
        r'  }',
        r'',
        r'  // 对于 OpenAI-compatible 或其他可能不支持 img2img 的接口，回落到 txt2img',
        r'  return callTxt2ImgApi(profile)',
        r'}',
        r'',
        r'// 解析 API 额外参数 JSON',
        r'function parseApiExtra(extra: string): Record<string, any> {',
        r'  if (!extra) return {}',
        r'  try { return JSON.parse(extra) } catch { return {} }',
        r'}',
        r'',
        r'// 判断是否为 OpenAI 兼容类服务商',
        r'function isOpenAiCompatible(provider: string) {',
        r"  return ['tongyi', 'wenxin', 'doubao', 'zhipu', 'kling'].includes(provider)",
        r'}',
        r'',
        r'// 添加一条成功生成的 T2I 记录到历史记录并持久化',
        r'function addT2iHistory() {',
        r'  if (!t2i.resultUrl) return',
        r'  t2iHistory.value.unshift({',
        r'    prompt: t2i.prompt,',
        r'    negative: t2i.negative,',
        r'    refs: [...t2i.refs],',
        r'    refPreviews: [...t2i.refPreviews],',
        r'    resultUrl: t2i.resultUrl,',
        r'    created: Date.now()',
        r'  })',
        r'  // Files 无法被序列化，持久化时仅保存除 refs 外的字段',
        r"  localStorage.setItem('af_t2i_history', JSON.stringify(t2iHistory.value.map(h => ({ ...h, refs: [] }))))",
        r'}',
        r'',
        r'// 从历史记录恢复到当前编辑区',
        r'function loadT2iHistory(h: { prompt: string; negative: string; refPreviews: string[]; resultUrl: string }) {',
        r'  t2i.prompt = h.prompt',
        r'  t2i.negative = h.negative',
        r'  t2i.refs = []',
        r'  t2i.refPreviews = [...h.refPreviews]',
        r'  t2i.resultUrl = h.resultUrl',
        r'}',
        r'',
        r'// 从 localStorage 加载历史记录',
        r'function loadT2iHistoryFromStorage() {',
        r"  const raw = localStorage.getItem('af_t2i_history')",
        r'  if (raw) {',
        r'    try { t2iHistory.value = JSON.parse(raw) } catch { t2iHistory.value = [] }',
        r'  }',
        r'}',
    ])
    ws = sub_one(
        ws,
        r'(// ==================== AI TXT2IMG ====================\n\n)(.*?)(?=\n\n// ==================== STYLE TRANSFER ====================)',
        lambda m: m.group(1) + new_t2i_section,
        "AI TXT2IMG section",
    )

    # ---------------- Translations ----------------
    ws = sub_one(
        ws,
        r"(  apiSettings: \{ zh: 'API 设置', en: 'API Settings', ja: 'API設定', ko: 'API 설정' \},\n\n)(?=  resourceLibrary:)",
        lambda m: m.group(1) + r"  apiConfig: { zh: 'API 配置', en: 'API Config', ja: 'API設定', ko: 'API 설정' }," + '\n\n',
        "langDict apiConfig",
    )
    ws = sub_one(
        ws,
        r"(  txt2imgDone: \{ zh: '创建素材完成', en: 'Create material done', ja: '素材作成完了', ko: '소재 생성 완료' \},\n\n)(?=  txt2imgNeedConfig:)",
        lambda m: m.group(1) + blk([
            r"  txt2imgFailed: { zh: '图像生成失败', en: 'Image generation failed', ja: '画像生成失敗', ko: '이미지 생성 실패' },",
            r"  t2iHistory: { zh: '历史记录', en: 'History', ja: '履歴', ko: '히스토리' },",
            r"  t2iHistoryEmpty: { zh: '暂无成功生成的记录', en: 'No successful generation history', ja: '成功履歴なし', ko: '성공적인 생성 기록 없음' },",
        ]) + '\n\n',
        "langDict t2iHistory",
    )

    # ---------------- Change 1: GIF preview panel ----------------
    new_gif_panel = blk([
        r'                    <div class="bg-af-bg border border-af-rule rounded-lg p-3.5 mt-3">',
        r'                      <div class="panel-title"><span>{{ t(\'cropVideoPreview\') }}</span><HelpBtn :text="t(\'cropVideoPreviewHelp\')" /></div>',
        r'                      <div class="flex gap-3 flex-wrap min-h-[280px]">',
        r'                        <div class="flex-1 min-w-[260px]">',
        r'                          <div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden flex items-center justify-center h-[280px] relative">',
        r'                            <canvas ref="gifRangePreviewCanvas" class="max-w-full max-h-full object-contain"></canvas>',
        r'                            <div v-if="!gifRangePreviewPlaying" class="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">',
        r'                              <span class="text-white text-sm">{{ t(\'clickPlayPreview\') }}</span>',
        r'                            </div>',
        r'                          </div>',
        r'                        </div>',
        r'                        <div class="flex-1 min-w-[260px] flex flex-col justify-center gap-3">',
        r'                          <button type="button" class="btn-primary w-fit" @click="toggleGifRangePreview">{{ gifRangePreviewPlaying ? t(\'pausePreview\') : t(\'playPreview\') }}</button>',
        r'                          <div class="text-xs text-af-muted space-y-1">',
        r'                            <div>{{ t(\'previewRange\') }}: {{ fmtFixed(gif.rangeStart) }}s ~ {{ fmtFixed(gif.rangeEnd) }}s</div>',
        r'                            <div>{{ t(\'currentTime\') }}: {{ fmtFixed(gifRangeCurrentTime) }}s</div>',
        r'                          </div>',
        r'                        </div>',
        r'                      </div>',
        r'                    </div>',
    ])
    ws = sub_one(
        ws,
        r'<div class="bg-af-bg border border-af-rule rounded-lg p-3\.5 mt-3">\n\n\s*<div class="panel-title">\{\{ t\(\'cropVideoPreview\'\) \}\}</div>\n\n\s*<div class="bg-af-surface border border-af-rule rounded-lg overflow-hidden flex items-center justify-center min-h-\[280px\]">\n\n\s*<canvas ref="gifRangePreviewCanvas" class="max-w-full max-h-\[360px\]"></canvas>\n\n\s*</div>\n\n\s*<div class="flex gap-2 mt-2">\n\n\s*<button type="button" class="btn-secondary btn-sm" @click="toggleGifRangePreview">\{\{ gifRangePreviewPlaying \? t\(\'pause\'\) : t\(\'play\'\) \}\}</button>\n\n\s*</div>\n\n\s*</div>',
        lambda m: new_gif_panel,
        "GIF preview panel",
    )

    # ---------------- Change 1: GIF preview functions ----------------
    new_gif_funcs = blk([
        r'// 启动 GIF 时间范围预览循环',
        r'function startGifRangePreview() {',
        r'  stopGifRangePreview()',
        r'  if (!gif.sourceFrames.length) return',
        r'  gifRangePreviewPlaying.value = true // 标记为播放状态',
        r'  gifRangePreviewStart = performance.now()',
        r'  renderGifRangePreviewLoop()',
        r'}',
        r'',
        r'// 停止 GIF 时间范围预览循环',
        r'function stopGifRangePreview() {',
        r'  gifRangePreviewPlaying.value = false // 标记为暂停状态',
        r'  if (gifRangePreviewTimer.value) {',
        r'    clearTimeout(gifRangePreviewTimer.value)',
        r'    gifRangePreviewTimer.value = null',
        r'  }',
        r'}',
        r'',
        r'// 切换 GIF 范围预览的播放/暂停状态',
        r'function toggleGifRangePreview() {',
        r'  if (gifRangePreviewPlaying.value) stopGifRangePreview() // 正在播放则停止',
        r'  else startGifRangePreview() // 未播放则开始',
        r'}',
        r'',
        r'// 循环渲染 GIF 范围预览帧',
        r'function renderGifRangePreviewLoop() {',
        r'  if (!gifRangePreviewPlaying.value) return // 未在播放状态则停止渲染',
        r'  renderGifRangePreview()',
        r'  gifRangePreviewTimer.value = window.setTimeout(renderGifRangePreviewLoop, 1000 / gif.previewFps)',
        r'}',
        r'',
        r'// 渲染当前时间范围内的 GIF 帧到预览画布',
        r'function renderGifRangePreview() {',
        r'  const c = gifRangePreviewCanvas.value',
        r'  if (!c || !gif.sourceFrames.length) return',
        r'  const src = gif.sourceFrames',
        r'  const rangeDur = Math.max(0.001, gif.rangeEnd - gif.rangeStart)',
        r'  const elapsed = (performance.now() - gifRangePreviewStart) / 1000',
        r'  const t = gif.rangeStart + (elapsed % rangeDur)',
        r'  gifRangeCurrentTime.value = t // 更新当前时间',
        r'  const cum: number[] = [0]',
        r'  for (let i = 1; i < src.length; i++) cum.push(cum[i - 1] + src[i - 1].delay / 1000)',
        r'  let idx = 0',
        r'  for (let k = 0; k < cum.length; k++) { if (cum[k] <= t) idx = k; else break }',
        r'  const sf = src[idx]',
        r"  const rc = document.createElement('canvas')",
        r'  rc.width = sf.width',
        r'  rc.height = sf.height',
        r"  const rctx = rc.getContext('2d')!",
        r'  rctx.putImageData(new ImageData(new Uint8ClampedArray(sf.rgba), sf.width, sf.height), 0, 0)',
        r'',
        r'  // 使用输出尺寸或裁剪尺寸作为画布大小，与视频裁剪预览逻辑对齐',
        r'  c.width = gif.outW || gif.crop.w || c.clientWidth || 320',
        r'  c.height = gif.outH || gif.crop.h || c.clientHeight || 180',
        r"  const ctx = c.getContext('2d')!",
        r"  ctx.fillStyle = '#14141c'",
        r'  ctx.fillRect(0, 0, c.width, c.height)',
        r'  if (gif.crop.w && gif.crop.h) {',
        r'    const fit = fitCropToOutput(gif.crop.w, gif.crop.h, c.width, c.height)',
        r'    ctx.drawImage(rc, gif.crop.x, gif.crop.y, gif.crop.w, gif.crop.h, fit.x, fit.y, fit.w, fit.h)',
        r'  }',
        r'}',
    ])
    ws = sub_one(
        ws,
        r'(// 启动 GIF 时间范围预览循环\n\n)(.*?)(?=\n\n// GIF 裁剪框拖拽调整大小)',
        lambda m: m.group(1) + new_gif_funcs,
        "GIF preview functions",
    )

    # ---------------- Change 2: saveFileToLibrary helper ----------------
    new_save_file = blk([
        r'// 将上传的文件直接保存到资源库（复用 addAssetFromFile，避免重复生成缩略图）',
        r'async function saveFileToLibrary(file: File, thumbUrl: string) {',
        r'  const id = await addAssetFromFile(file, thumbUrl)',
        r"  assets.value.push({ id, type: file.type.startsWith('video/') ? 'video' : (file.type === 'image/gif' ? 'gif' : 'image'), name: file.name, thumb: thumbUrl, dataUrl: thumbUrl, created: Date.now(), selected: false })",
        r"  statusText.value = t('savedToLibrary')",
        r'}',
    ])
    ws = sub_one(
        ws,
        r'(async function saveToLibrary\(url: string, type: string, name\?: string\) \{\n\n.*?\n\n\}\n\n)(?=// 挂载时从 IndexedDB 加载资源列表)',
        lambda m: m.group(1) + new_save_file + '\n\n',
        "saveFileToLibrary helper",
    )

    # ---------------- Change 2: video thumbnail save ----------------
    new_on_video_meta = blk([
        r'function onVideoMeta() {',
        r'  const v = sourceVideo.value; if (!v) return',
        r'  video.duration = v.duration; video.width = v.videoWidth; video.height = v.videoHeight',
        r'  let detectedFps = 30',
        r'  const videoTracks = (v as HTMLVideoElement & { videoTracks?: { frameRate?: number }[] }).videoTracks',
        r'  if (videoTracks) {',
        r'    for (let i = 0; i < videoTracks.length; i++) {',
        r'      if (videoTracks[i]?.frameRate) { detectedFps = videoTracks[i].frameRate || 30; break }',
        r'    }',
        r'  }',
        r'  video.nativeFps = detectedFps',
        r'  video.crop = { x: 0, y: 0, w: v.videoWidth, h: v.videoHeight }',
        r'  video.outW = v.videoWidth',
        r'  video.outH = v.videoHeight',
        r'  video.rangeEnd = v.duration',
        r'  video.showCrop = true',
        r'  nextTick(() => { updateCropMetrics(); updateCropPreview(); drawVideoCropFrame(); saveVideoThumbnailToLibrary() })',
        r'}',
        r'',
        r'// 保存视频首帧缩略图到资源库',
        r'async function saveVideoThumbnailToLibrary() {',
        r'  const v = sourceVideo.value; const f = video.file',
        r'  if (!v || !f) return',
        r"  const c = document.createElement('canvas')",
        r'  c.width = v.videoWidth; c.height = v.videoHeight',
        r"  const ctx = c.getContext('2d')!",
        r'  ctx.drawImage(v, 0, 0)',
        r"  const thumb = c.toDataURL('image/png')",
        r'  await saveFileToLibrary(f, thumb)',
        r'}',
    ])
    ws = sub_one(
        ws,
        r'(function onVideoMeta\(\) \{\n\n.*?\n\n\}\n\n)(?=function startCropResize)',
        lambda m: new_on_video_meta + '\n\n',
        "onVideoMeta + saveVideoThumbnailToLibrary",
    )

    # ---------------- Change 2: GIF thumbnail save ----------------
    new_gif_thumb = blk([
        r'    if (gif.sourceFrames.length) {',
        r'      const sf = gif.sourceFrames[0]',
        r"      const c = document.createElement('canvas'); c.width = sf.width; c.height = sf.height",
        r"      const ctx = c.getContext('2d')!",
        r'      ctx.putImageData(new ImageData(new Uint8ClampedArray(sf.rgba), sf.width, sf.height), 0, 0)',
        r"      await saveFileToLibrary(file, c.toDataURL('image/png'))",
        r'    }',
    ])
    ws = sub_one(
        ws,
        r'(    gif\.step = 1\n\n)(    statusText\.value = t\(\'gifLoaded\'\)\n\n    nextTick\(\(\) => \{ drawGifCropPreview\(\); startGifRangePreview\(\) \}\) // 上传后立即显示第一帧裁剪预览并启动范围预览)',
        lambda m: m.group(1) + new_gif_thumb + '\n\n' + m.group(2),
        "GIF thumbnail save",
    )

    # ---------------- Change 2: sprite images save ----------------
    new_sprite_loop = blk([
        r'  for (const f of Array.from(files)) {',
        r'    const url = await fileToDataUrl(f)',
        r'    sprite.images.push({ url, file: f })',
        r'    await saveFileToLibrary(f, url)',
        r'  }',
    ])
    ws = sub_one(
        ws,
        r'(  for \(const f of Array\.from\(files\)\) \{\n\n    sprite\.images\.push\(\{ url: await fileToDataUrl\(f\), file: f \}\)\n\n  \})(\n\n  nextTick\(drawSpritePreview\))',
        lambda m: new_sprite_loop + m.group(2),
        "sprite images save",
    )

    # ---------------- Change 2: matting image save ----------------
    new_mt = blk([
        r'async function loadMtImage(file: File) {',
        r'  if (!file) return // 没有文件则直接返回',
        r'  const dataUrl = await fileToDataUrl(file) // 转为 Data URL',
        r'  mt.sourceUrl = dataUrl',
        r'  await saveFileToLibrary(file, dataUrl) // 保存到资源库',
        r'  mt.selectedCells = [] // 新图片清空网格选中状态',
        r"  mt.resultUrl = '' // 清空旧结果",
        r'  await nextTick() // 等待 DOM 更新',
        r'  initMtSource() // 初始化源图画布',
        r'}',
    ])
    ws = sub_one(
        ws,
        r'(async function loadMtImage\(file: File\) \{\n\n.*?\n\n\})',
        lambda m: new_mt,
        "matting image save",
    )

    # ---------------- Change 2: tileset save ----------------
    new_tileset = blk([
        r'async function loadTileset(file: File) {',
        r'  const url = await fileToDataUrl(file)',
        r'  await saveFileToLibrary(file, url)',
        r'  tm.tilesetUrl = url',
        r'  const img = await loadImage(url)',
        r'  tm.tilesetImg = img',
        r'  sliceTileset(img)',
        r'  resetTilemap()',
        r'  drawTilemap()',
        r'}',
    ])
    ws = sub_one(
        ws,
        r'(async function loadTileset\(file: File\) \{\n\n.*?\n\n\})',
        lambda m: new_tileset,
        "tileset save",
    )

    WORKSPACE.write_text(ws, encoding="utf-8")
    print("[OK] 补充修改已写入")
    return 0


if __name__ == "__main__":
    sys.exit(main())
