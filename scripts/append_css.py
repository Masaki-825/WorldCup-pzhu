"""Append prediction group styles to style.css"""
import os

BASE = r'worldcup-fan-center\css'

STYLES = """
/* ================================================================
   小组出线预测 - 左右双栏布局
   ================================================================ */

/* --- 双栏容器 --- */
.prediction-groups-dual {
  display: flex; gap: 0; width: 100%;
}

/* --- 左栏 55%：勾选区 --- */
.prediction-groups-left {
  flex: 0 0 55%; width: 55%;
}
.prediction-group-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px;
  border-bottom: 3px solid var(--border-light);
  min-height: 48px;
}
body.night-mode .prediction-group-row {
  border-bottom-color: var(--border-light);
}
.prediction-group-row--major {
  border-bottom-width: 6px;
  border-bottom-style: solid;
}
.prediction-group-label {
  font-size: 1.1rem; font-weight: 700; color: var(--accent);
  min-width: 36px; text-align: center; flex-shrink: 0;
}
.prediction-group-teams {
  display: flex; flex-wrap: wrap; gap: 6px 16px; flex: 1; align-items: center;
}
.prediction-group-checkbox {
  display: inline-flex; align-items: center; gap: 4px;
  cursor: pointer; font-size: 1.1rem; color: var(--text-primary);
  user-select: none;
}
.prediction-group-checkbox input[type="checkbox"] {
  width: 16px; height: 16px; cursor: pointer; accent-color: var(--accent);
}
.prediction-group-team-name {
  line-height: 1.3;
}
.prediction-group-count {
  font-size: 0.85rem; color: var(--text-secondary);
  min-width: 60px; text-align: right; flex-shrink: 0;
}

/* --- 右栏 45%：图表卡片区 --- */
.prediction-groups-right {
  flex: 0 0 45%; width: 45%;
}
.prediction-chart-row {
  display: flex; align-items: stretch; gap: 6px;
  padding: 4px 4px;
  border-bottom: 3px solid var(--border-light);
  min-height: 48px;
}
body.night-mode .prediction-chart-row {
  border-bottom-color: var(--border-light);
}
.prediction-chart-row--major {
  border-bottom-width: 6px;
  border-bottom-style: solid;
}
.prediction-chart-empty {
  width: 100%; min-height: 40px;
}

/* --- 图表卡片 --- */
.prediction-chart-card {
  display: flex; flex-direction: column;
  border: 1px solid var(--border-light);
  border-radius: 8px; overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background: var(--bg-primary);
}
body.night-mode .prediction-chart-card {
  background: var(--nav-bg);
  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
}
.prediction-chart-card:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
body.night-mode .prediction-chart-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.40);
}
.prediction-chart-card--single {
  width: 100%;
}
.prediction-chart-card--dual {
  width: calc(50% - 3px);
}
.prediction-chart-card__header {
  font-size: 0.95rem; font-weight: 700; color: var(--text-primary);
  text-align: center; padding: 6px 8px 2px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
}
body.night-mode .prediction-chart-card__header {
  background: var(--countdown-bg);
}
.prediction-chart-card__body {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 4px;
}
.prediction-chart-card__img {
  max-width: 100%; max-height: 100%; object-fit: contain;
  display: block;
}
.prediction-chart-card__error {
  font-size: 0.85rem; color: var(--text-secondary);
  text-align: center; margin: 0; padding: 8px;
}

/* --- 响应式：窄屏堆叠 --- */
@media (max-width: 760px) {
  .prediction-groups-dual {
    flex-direction: column;
  }
  .prediction-groups-left,
  .prediction-groups-right {
    flex: 1 0 auto; width: 100%;
  }
  .prediction-chart-card--dual {
    width: calc(50% - 3px);
  }
}
"""

css_path = os.path.join(BASE, 'style.css')
with open(css_path, 'a', encoding='utf-8') as f:
    f.write(STYLES)
print('CSS appended successfully to', css_path)