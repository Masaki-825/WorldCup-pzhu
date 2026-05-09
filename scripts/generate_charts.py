#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
世界杯球队排名走势图生成器
读取 worldcup-fan-center/data/team-rankings.json，为每支球队生成 PNG 折线图，
并输出 data/chart-map.json 映射文件。
"""

import json
import os
import sys

import matplotlib
matplotlib.use("Agg")  # 非交互后端，适合脚本批量生成

import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
from matplotlib import font_manager


# =============================================================================
# 配置
# =============================================================================

# 路径（相对于脚本所在目录的上级 -- 项目根）
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)  # 项目根 d:/.../WorldCup

JSON_PATH = os.path.join(PROJECT_ROOT, "worldcup-fan-center", "data", "team-rankings.json")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "worldcup-fan-center", "assets", "ranking")
CHART_MAP_PATH = os.path.join(PROJECT_ROOT, "data", "chart-map.json")

# 图片尺寸 / 质量
FIG_WIDTH = 8.0          # inches → 800px @ 100dpi，实际导出按 dpi 控制
FIG_HEIGHT = 5.0         # inches → 500px @ 100dpi
FIG_DPI = 100            # 所以导出是 800×500，略大于 600×400 但风格一致且可缩放
EXPORT_WIDTH_PX = 600    # 最终宽度 px (我们保存时用 bbox_inches，但还是要 600x400 比例)
EXPORT_HEIGHT_PX = 400

# 配色
COLOR_LINE = "#2563eb"       # 折线蓝色
COLOR_DOT = "#2563eb"        # 普通圆点
COLOR_GOLD = "#fbbd04"       # 🏆 金色填充
COLOR_GOLD_EDGE = "#b45309"  # 金色边缘
COLOR_GRID = "#d4d4d8"       # 浅灰网格
COLOR_BG = "#ffffff"         # 白色背景

# 字体 — 优先使用系统中文字体
CANDIDATE_FONTS = [
    "Microsoft YaHei",
    "SimHei",
    "Noto Sans CJK SC",
    "PingFang SC",
    "WenQuanYi Micro Hei",
    "WenQuanYi Zen Hei",
]


def find_chinese_font():
    """遍历系统字体列表，返回第一个可用的中文字体名，否则返回 sans-serif。"""
    available = {f.name for f in font_manager.fontManager.ttflist}
    for name in CANDIDATE_FONTS:
        if name in available:
            return name
    return "sans-serif"


# =============================================================================
# 工具函数
# =============================================================================

def load_team_data(path: str) -> dict:
    """读取 JSON，返回球队字典。"""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def setup_matplotlib(font_name: str):
    """全局 matplotlib 配置。"""
    plt.rcParams.update({
        "font.family": "sans-serif",
        "font.sans-serif": [font_name, "DejaVu Sans", "Arial"],
        "axes.unicode_minus": False,   # 避免负号乱码
        "figure.facecolor": COLOR_BG,
        "axes.facecolor": COLOR_BG,
        "axes.edgecolor": "#e5e7eb",
        "axes.grid.axis": "y",
        "grid.color": COLOR_GRID,
        "grid.linewidth": 0.5,
        "grid.alpha": 0.6,
        "xtick.color": "#374151",
        "ytick.color": "#374151",
        "axes.labelcolor": "#374151",
        "axes.titlecolor": "#1f2937",
    })


def generate_chart(team_id: str, team_info: dict, output_path: str, font_name: str):
    """
    为单支球队生成排名走势折线图并保存为 PNG。

    参数
    ----
    team_id : str
        球队编码，如 "ARG"
    team_info : dict
        { "name": "阿根廷", "rankings": [{"year": 1930, "rank": 2}, ...] }
    output_path : str
        图片保存路径
    font_name : str
        中文字体名称
    """
    name = team_info.get("name", team_id)
    rankings = team_info.get("rankings", [])
    if not rankings:
        return  # 从未参赛，不生成

    # ----- 提取年份 & 排名 -----
    years = [r["year"] for r in rankings]
    ranks = [r["rank"] for r in rankings]

    # ----- 创建图形 -----
    fig, ax = plt.subplots(figsize=(FIG_WIDTH, FIG_HEIGHT))

    # ----- 网格 (仅 y 轴) -----
    ax.grid(True, axis="y", zorder=0)

    # ----- y 轴倒序：1 在顶部 -----
    ax.invert_yaxis()

    # ----- 设置 y 轴步长 -----
    max_rank = max(ranks)
    # y 轴从 1 到 max_rank+1，确保底线有空间
    ax.set_ylim(max_rank + 1, 0.5)

    # y 轴刻度为整数
    ax.yaxis.set_major_locator(ticker.MaxNLocator(integer=True, min_n_ticks=5))

    # ----- 绘制折线 -----
    ax.plot(years, ranks, color=COLOR_LINE, linewidth=2.0, alpha=0.85, zorder=2)

    # ----- 绘制圆点 -----
    for yr, rk in zip(years, ranks):
        if rk == 1:
            # 🏆 冠军金色
            ax.scatter(yr, rk, color=COLOR_GOLD, edgecolors=COLOR_GOLD_EDGE,
                       linewidths=1.5, s=140, zorder=5, marker="o")
        else:
            # 普通蓝点
            ax.scatter(yr, rk, color=COLOR_DOT, s=50, zorder=4, marker="o")

    # ----- x 轴标签倾斜避免重叠 -----
    if len(years) > 10:
        rotation = 45
    else:
        rotation = 0
    ax.set_xticks(years)
    ax.set_xticklabels([str(y) for y in years], rotation=rotation, ha="right", fontsize=9)

    # ----- 标签 -----
    ax.set_xlabel("参赛年份", fontsize=11)
    ax.set_ylabel("排名", fontsize=11)
    ax.set_title(name, fontsize=16, fontweight="bold", pad=12)

    # ----- 去外框 -----
    for spine in ax.spines.values():
        spine.set_visible(False)

    # ----- 保存 -----
    fig.tight_layout()
    fig.savefig(output_path, dpi=FIG_DPI, facecolor=COLOR_BG, edgecolor="none",
                bbox_inches="tight", pad_inches=0.3)
    plt.close(fig)


# =============================================================================
# 主流程
# =============================================================================

def main():
    # 1. 查找可用中文字体
    font_name = find_chinese_font()
    print(f"[INFO] 使用字体: {font_name}")

    # 2. 配置 matplotlib
    setup_matplotlib(font_name)

    # 3. 创建输出目录
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"[INFO] 输出目录: {OUTPUT_DIR}")

    # 4. 读取数据
    all_teams = load_team_data(JSON_PATH)
    print(f"[INFO] 载入 {len(all_teams)} 支球队数据")

    # 5. 遍历生成
    chart_map = {}
    generated = 0
    skipped = 0

    for team_id, team_info in all_teams.items():
        rankings = team_info.get("rankings", [])
        if not rankings:
            skipped += 1
            print(f"  [SKIP] {team_id} ({team_info.get('name', team_id)}) — 无参赛记录")
            continue

        output_file = os.path.join(OUTPUT_DIR, f"{team_id}.png")
        generate_chart(team_id, team_info, output_file, font_name)

        # 相对路径（相对于项目根）
        rel_path = os.path.relpath(output_file, PROJECT_ROOT).replace("\\", "/")
        chart_map[team_id] = rel_path
        generated += 1
        print(f"  [OK] {team_id} → {rel_path}")

    # 6. 确保 data/ 目录存在（chart-map.json 输出目录）
    os.makedirs(os.path.dirname(CHART_MAP_PATH), exist_ok=True)

    # 7. 写出 chart-map.json
    with open(CHART_MAP_PATH, "w", encoding="utf-8") as f:
        json.dump(chart_map, f, ensure_ascii=False, indent=2)
    print(f"\n[INFO] chart-map.json 已生成 → {CHART_MAP_PATH}")
    print(f"[INFO] 统计: 生成 {generated} 张图片, 跳过 {skipped} 支球队, chart-map 记录 {len(chart_map)} 个条目")

    return 0


if __name__ == "__main__":
    sys.exit(main())