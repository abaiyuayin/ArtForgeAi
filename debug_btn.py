from pathlib import Path
p = Path('src/views/WorkspaceView.vue')
t = p.read_text(encoding='utf-8')
idx = t.find("<select v-model=\"apiProfileId\"")
print('idx', idx)
print(repr(t[idx-60:idx+600]))
