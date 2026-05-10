import re, json

# === 读取 chart-map.json ===
with open('data/chart-map.json', 'r', encoding='utf-8') as f:
    chart_data = json.load(f)

chart_json_str = json.dumps(chart_data, ensure_ascii=False)

# === 读取 index.html ===
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# === 1) 删除 prediction-knockout section ===
html = re.sub(
    r'<section[^>]*id="prediction-knockout"[^>]*>.*?</section>\s*',
    '',
    html,
    flags=re.DOTALL
)

# === 2) 在 <script src="js/main.js"> 之前插入 window.__CHART_MAP__ ===
insert_line = '<script>window.__CHART_MAP__ = ' + chart_json_str + ';</script>\n'
html = re.sub(
    r'(<script\s+src="js/main\.js")',
    insert_line + r'\1',
    html
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('OK: index.html updated')