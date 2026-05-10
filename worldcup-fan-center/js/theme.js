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
   * 初始化主题切换按钮
   */
  function initThemeToggle() {
    var nav = document.getElementById('main-nav');
    if (!nav) return;

    // SVG 图标模板
    var moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    var sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

    var btn = document.createElement('button');
    btn.className = 'theme-toggle-btn';
    btn.setAttribute('aria-label', '切换主题');

    // 更新图标：日间显示月亮（切到夜间），夜间显示太阳（切到日间）
    function updateIcon() {
      var isNight = document.body.classList.contains('night-mode');
      btn.innerHTML = isNight ? sunIcon : moonIcon;
    }

    updateIcon();

    btn.addEventListener('click', function () {
      window.WorldCupTheme.toggleTheme();
    });

    // 监听主题变化，自动更新图标
    onThemeChange(function () {
      updateIcon();
    });

    nav.appendChild(btn);
  }

  /**
   * 初始化主题模块
   */
  function initTheme() {
    loadThemePreference();
    listenSystemThemeChange();
    initThemeToggle();
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