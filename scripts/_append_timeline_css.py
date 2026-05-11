import os

css_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'worldcup-fan-center', 'css', 'style.css')

additional_css = r"""
/* ========================================
   世界杯时间轴
   ======================================== */

#worldcup-timeline {
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  padding: 20px 0;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
}

#worldcup-timeline::-webkit-scrollbar {
  height: 6px;
}

#worldcup-timeline::-webkit-scrollbar-track {
  background: transparent;
}

#worldcup-timeline::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}

.timeline__track {
  display: flex;
  align-items: flex-end;
  gap: 0;
  padding: 0 40px;
  min-width: -webkit-max-content;
  min-width: max-content;
}

.timeline__year {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 48px;
  flex-shrink: 0;
}

.timeline__year:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 24px;
  bottom: 22px;
  width: 48px;
  height: 2px;
  background: var(--border-light);
  z-index: 1;
}

.timeline__dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  position: relative;
  z-index: 2;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;
}

.timeline__dot--past:hover {
  transform: scale(1.6);
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent) 25%, transparent);
}

.timeline__dot--future {
  width: 14px;
  height: 14px;
  animation: breathe 2s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.55;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

.timeline__year-label {
  margin-top: 8px;
  font-size: 0.72rem;
  color: var(--text-secondary);
  text-align: center;
  width: 100%;
}

/* Tooltip */
.timeline__tooltip {
  position: fixed;
  z-index: 9999;
  background: #fff;
  color: #2a221d;
  border-radius: 8px;
  padding: 10px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  font-size: 0.85rem;
  line-height: 1.5;
  pointer-events: none;
  white-space: nowrap;
  display: none;
}

body.night-mode .timeline__tooltip {
  background: var(--card-bg);
  color: var(--text-primary);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.55);
}

.timeline__tooltip strong {
  font-weight: 700;
}

/* 冷知识显示区 */
.timeline__trivia-reveal {
  min-height: 60px;
  padding: 12px 16px;
  margin-top: 16px;
  opacity: 0;
  transition: opacity 0.3s ease;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.timeline__trivia-reveal--visible {
  opacity: 1;
}

.timeline__trivia-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--accent);
  margin: 0 0 4px;
}

.timeline__trivia-content {
  margin: 0;
  line-height: 1.5;
}
"""

with open(css_path, 'a', encoding='utf-8') as f:
    f.write(additional_css)
print('CSS appended to', css_path)