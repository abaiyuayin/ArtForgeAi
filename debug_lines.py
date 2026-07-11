from pathlib import Path
p = Path('src/views/WorkspaceView.vue')
t = p.read_text(encoding='utf-8')
# Print lines 110-130 with index, showing empty lines
lines = t.split('\n')
for i, line in enumerate(lines[110:135], start=111):
    print(f"{i}: {repr(line)}")
