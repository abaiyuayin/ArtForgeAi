from pathlib import Path

file = Path('src/views/WorkspaceView.vue')
content = file.read_text(encoding='utf-8')
changes = []

# Fix focus select handlers: use helper function
old = '<input v-model="video.export.name" class="form-input" @focus="$event.target.select()">'
new = '<input v-model="video.export.name" class="form-input" @focus="selectOnFocus($event)">'
if old in content:
    content = content.replace(old, new)
    changes.append('video export filename focus helper')
else:
    changes.append('WARNING: video filename focus not found')

old = '<input v-model="gif.export.name" class="form-input" @focus="$event.target.select()">'
new = '<input v-model="gif.export.name" class="form-input" @focus="selectOnFocus($event)">'
if old in content:
    content = content.replace(old, new)
    changes.append('gif export filename focus helper')
else:
    changes.append('WARNING: gif filename focus not found')

# Add helper function after fmtFixed
old = '''// 安全格式化数字为固定小数位字符串
function fmtFixed(v: any, digits = 2): string { return num(v).toFixed(digits) }

const themeStore = useThemeStore()'''
new = '''// 安全格式化数字为固定小数位字符串
function fmtFixed(v: any, digits = 2): string { return num(v).toFixed(digits) }
// 输入框聚焦时全选内容
function selectOnFocus(e: FocusEvent) {
  const t = e.target as HTMLInputElement
  t.select()
}

const themeStore = useThemeStore()'''
if old in content:
    content = content.replace(old, new)
    changes.append('added selectOnFocus helper')
else:
    changes.append('WARNING: fmtFixed section not found')

# Remove unused mtGridStyleOverlay computed
old = '''// mtGridStyleOverlay: 网格模式下高亮选中格子（用于 SHIFT 多选高亮）
const mtGridSelections = reactive<{ col: number; row: number }[]>([])
const mtGridStyleOverlay = computed(() => {
  if (mt.mode !== 'crop' || mt.cropSubMode !== 'grid' || !mt.sourceUrl) return { display: 'none' }
  if (!mtGridSelections.length) return { display: 'none' }
  const c = mtSourceCanvas.value; if (!c) return { display: 'none' }
  const cw = c.width / mt.gridSize; const ch = c.height / mt.gridSize
  // 显示最后一个选中的格子
  const s = mtGridSelections[mtGridSelections.length - 1]
  return {
    display: 'block',
    left: mtCropMetrics.offsetX + s.col * cw * mtCropMetrics.scale + 'px',
    top: mtCropMetrics.offsetY + s.row * ch * mtCropMetrics.scale + 'px',
    width: cw * mtCropMetrics.scale + 'px',
    height: ch * mtCropMetrics.scale + 'px',
  }
})
'''
new = '''// mtGridSelections: 保留兼容旧代码（已不再使用，由 canvas 绘制替代）
const mtGridSelections = reactive<{ col: number; row: number }[]>([])
'''
if old in content:
    content = content.replace(old, new)
    changes.append('removed unused mtGridStyleOverlay')
else:
    changes.append('WARNING: mtGridStyleOverlay not found')

# Fix drawMtOverlay unused w/h parameters
old = '''// 绘制选区高亮覆盖层
function drawMtOverlay(ctx: CanvasRenderingContext2D) {
  const c = mtSourceCanvas.value // 获取画布
  if (!c) return // 未获取则返回
  const w = c.width // 画布宽度
  const h = c.height // 画布高度
  if (mt.mode === 'crop' && mt.cropSubMode === 'manual' && mt.cropW > 0 && mt.cropH > 0) { // 手动模式高亮矩形选区'''
new = '''// 绘制选区高亮覆盖层
function drawMtOverlay(ctx: CanvasRenderingContext2D) {
  const c = mtSourceCanvas.value // 获取画布
  if (!c) return // 未获取则返回
  if (mt.mode === 'crop' && mt.cropSubMode === 'manual' && mt.cropW > 0 && mt.cropH > 0) { // 手动模式高亮矩形选区'''
if old in content:
    content = content.replace(old, new)
    changes.append('removed unused drawMtOverlay w/h')
else:
    changes.append('WARNING: drawMtOverlay w/h not found')

file.write_text(content, encoding='utf-8')
for c in changes:
    print(c)
