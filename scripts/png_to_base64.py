"""将 assets/ranking/ 下所有 PNG 转为 Base64，更新 chart-map.json"""
import json, base64, os, re

RANKING_DIR = r"worldcup-fan-center\assets\ranking"
CHART_MAP_PATH = r"data\chart-map.json"

# 读取现有 chart-map.json
with open(CHART_MAP_PATH, "r", encoding="utf-8") as f:
    chart_map = json.load(f)

# 遍历所有 key，替换值为 Base64
for key in chart_map:
    png_path = os.path.join(RANKING_DIR, key + ".png")
    if os.path.exists(png_path):
        with open(png_path, "rb") as img_f:
            b64 = base64.b64encode(img_f.read()).decode("utf-8")
        chart_map[key] = f"data:image/png;base64,{b64}"
        print(f"OK: {key}")
    else:
        print(f"MISSING: {png_path}")

# 写入
with open(CHART_MAP_PATH, "w", encoding="utf-8") as f:
    json.dump(chart_map, f, indent=2, ensure_ascii=False)

print("Done! chart-map.json updated.")