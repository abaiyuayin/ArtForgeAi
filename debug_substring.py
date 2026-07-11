from pathlib import Path
p = Path('src/views/WorkspaceView.vue')
t = p.read_text(encoding='utf-8')
print('CRLF count:', t.count('\r\n'))
print('LF count:', t.count('\n'))
print('BOM present:', t.startswith('\ufeff'))

olds = [
    "                  <select v-model=\"apiProfileId\" class=\"form-select\" @change=\"selectApiProfile(apiProfileId)\">",
    "                <!-- txt2img -->",
    "// ==================== AI TXT2IMG ====================",
    "  apiSettings: { zh: 'API 设置'",
    "  txt2imgDone: { zh: '创建素材完成'",
    "                    <div class=\"bg-af-bg border border-af-rule rounded-lg p-3.5 mt-3\">",
]
for o in olds:
    idx = t.find(o)
    print('---')
    print('found:', idx >= 0)
    if idx >= 0:
        print('context:', repr(t[idx:idx+120]))
