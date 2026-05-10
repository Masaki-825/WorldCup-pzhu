"""将 data/chart-map.json 内联注入 index.html，并删除 prediction-knockout 区域"""
import json

CHART_MAP_PATH = "data/chart-map.json"
INDEX_PATH = "worldcup-fan-center/index.html"

# 读取 chart-map.json
with open(CHART_MAP_PATH, "r", encoding="utf-8") as f:
    chart_map = json.load(f)

chart_map_json = json.dumps(chart_map, ensure_ascii=False)

# 读取 index.html
with open(INDEX_PATH, "r", encoding="utf-8") as f:
    html = f.read()

# 1. 删除 prediction-knockout 区域
import re
html = re.sub(
    r'<div class="full-prediction__section" id="prediction-knockout">\s*<!-- 由 predictions\.js 动态渲染：淘汰赛预测 -->\s*</div>\s*',
    '',
    html
)

# 2. 在 window.__HISTORY_DATA__ 之后、<script src="js/main.js"> 之前插入 window.__CHART_MAP__
insert_line = 'window.__CHART_MAP__ = ' + chart_map_json + ';\n'
# 寻找 </script> 后紧跟 <script src="js/main.js">
old = '</script>\n  <script src="js/main.js"></script>'
new = '</script>\n  <script>\n  /* ---------- 内联数据：chart-map.json (Base64 PNG) ---------- */\n  ' + insert_line + '</script>\n  <script src="js/main.js"></script>'

# 只替换第一次出现（在 __HISTORY_DATA__ 之后那个）
# 使用 partition 从后往前找 __HISTORY_DATA__
marker = 'window.__HISTORY_DATA__'
pos = html.find(marker)
if pos != -1:
    # 从这个 marker 之后找第一个 </script> 然后找 <script src="js/main.js"
    tail = html[pos:]
    old_in_tail = '</script>\n  <script src="js/main.js"></script>'
    new_in_tail = '</script>\n  <script>\n  /* ---------- 内联数据：chart-map.json (Base64 PNG) ---------- */\n  ' + insert_line + '</script>\n  <script src="js/main.js"></script>'
    if old_in_tail in tail:
        tail = tail.replace(old_in_tail, new_in_tail, 1)
        html = html[:pos] + tail
        print("OK: window.__CHART_MAP__ 已插入")
    else:
        print("WARNING: 未找到插入点 </script>\\n  <script src=\"js/main.js\"> 在 __HISTORY_DATA__ 之后")
else:
    print("WARNING: 未找到 __HISTORY_DATA__")

# 写回
with open(INDEX_PATH, "w", encoding="utf-8") as f:
    f.write(html)

print("Done! index.html 已更新。")