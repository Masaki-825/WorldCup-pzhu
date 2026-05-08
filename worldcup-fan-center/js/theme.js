/**
 * theme.js - 日/夜模式切换逻辑
 * World Cup Fan Center
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'theme-preference';

  /** 主题切换监听器列表 */
  var themeChangeListeners = [];

  /**
   * 注册主题切换回调
   * @param {Function} callback - 主题切换后调用，参数为 ('light'|'dark')
   */
  function onThemeChange(callback) {
    if (typeof callback === 'function') {
      themeChangeListeners.push(callback);
    }
  }

  /**
   * 应用指定主题
   * @param {'light'|'dark'} theme - 主题名称
   */
  function applyTheme(theme) {
    const oldTheme = document.body.classList.contains('night-mode') ? 'dark' : 'light';

    if (theme === 'dark') {
      document.body.classList.add('night-mode');
    } else {
      document.body.classList.remove('night-mode');
    }

    // 主题真正变化时才通知监听器
    const newTheme = theme === 'dark' ? 'dark' : 'light';
    if (oldTheme !== newTheme) {
      themeChangeListeners.forEach(function (cb) {
        try { cb(newTheme); } catch (e) { console.warn('主题回调执行失败：', e); }
      });
    }
  }

  /**
   * 切换到夜间模式，并持久化
   */
  function enableNightMode() {
    applyTheme('dark');
    try {
      localStorage.setItem(STORAGE_KEY, 'dark');
    } catch (e) {
      // localStorage 不可用时静默忽略
    }
  }

  /**
   * 切换到日间模式，并持久化
   */
  function enableDayMode() {
    applyTheme('light');
    try {
      localStorage.setItem(STORAGE_KEY, 'light');
    } catch (e) {
      // localStorage 不可用时静默忽略
    }
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
   * 检测系统颜色偏好
   * @returns {'dark'|'light'}
   */
  function getSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * 从 localStorage 读取用户偏好
   * @returns {string|null}
   */
  function getStoredPreference() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  /**
   * 加载并应用主题（优先级：localStorage > 系统偏好 > 日间默认）
   */
  function loadThemePreference() {
    const stored = getStoredPreference();

    if (stored === 'dark' || stored === 'light') {
      // 用户曾手动选择，以 localStorage 为准
      applyTheme(stored);
    } else {
      // 无存储记录时，跟随系统偏好
      const systemPref = getSystemPreference();
      applyTheme(systemPref);
    }
  }

  /**
   * 监听系统主题变化（当用户未手动设置时自动跟随）
   */
  function listenSystemThemeChange() {
    if (!window.matchMedia) return;

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkQuery.addEventListener) {
      darkQuery.addEventListener('change', function (e) {
        const stored = getStoredPreference();
        // 仅在用户无手动偏好时才跟随系统
        if (!stored) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  /**
   * 初始化主题模块
   */
  function initTheme() {
    loadThemePreference();
    listenSystemThemeChange();
    console.log('主题模块已就绪（当前：' +
      (document.body.classList.contains('night-mode') ? '夜间模式' : '日间模式') + '）。');
  }

  // 挂载到全局，方便其他模块调用
  window.WorldCupTheme = {
    enableNightMode: enableNightMode,
    enableDayMode: enableDayMode,
    toggleTheme: toggleTheme,
    applyTheme: applyTheme,
    onThemeChange: onThemeChange,
    getSystemPreference: getSystemPreference,
    getStoredPreference: getStoredPreference,
    init: initTheme
  };

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();