/**
 * theme.js - 日/夜模式切换逻辑
 * World Cup Fan Center
 */
(function () {
  'use strict';

  /**
   * 切换到夜间模式
   */
  function enableNightMode() {
    document.body.classList.add('night-mode');
    // TODO: 持久化主题偏好到 localStorage
  }

  /**
   * 切换到日间模式
   */
  function enableDayMode() {
    document.body.classList.remove('night-mode');
    // TODO: 持久化主题偏好到 localStorage
  }

  /**
   * 切换主题
   */
  function toggleTheme() {
    if (document.body.classList.contains('night-mode')) {
      enableDayMode();
    } else {
      enableNightMode();
    }
  }

  /**
   * 从 localStorage 恢复用户主题偏好
   */
  function loadThemePreference() {
    // TODO: 读取 localStorage 中的主题设置并应用
  }

  /**
   * 初始化主题模块
   */
  function initTheme() {
    loadThemePreference();
    console.log('主题模块已就绪（待实现）。');
  }

  // 挂载到全局，方便其他模块调用
  window.WorldCupTheme = {
    enableNightMode: enableNightMode,
    enableDayMode: enableDayMode,
    toggleTheme: toggleTheme,
    init: initTheme
  };

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();