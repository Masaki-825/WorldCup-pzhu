/**
 * main.js - 导航切换与模块显隐逻辑
 * World Cup Fan Center
 */
(function () {
  'use strict';

  /** 当前激活的 section ID */
  let currentSection = 'dashboard';

  /** 切换钩子回调列表：{ sectionId: [callback, ...] } */
  const switchHooks = {
    before: {},   // 切换到新模块前调用
    after: {}     // 切换到新模块后调用
  };

  /**
   * 注册模块切换钩子
   * @param {'before'|'after'} timing - 触发时机
   * @param {string} sectionId - 目标 section
   * @param {Function} callback - 回调函数，接收 (fromSection, toSection)
   */
  function registerSwitchHook(timing, sectionId, callback) {
    if (!switchHooks[timing]) return;
    if (!switchHooks[timing][sectionId]) {
      switchHooks[timing][sectionId] = [];
    }
    switchHooks[timing][sectionId].push(callback);
  }

  /**
   * 触发切换钩子
   * @param {'before'|'after'} timing
   * @param {string} fromSection - 离开的 section
   * @param {string} toSection - 进入的 section
   */
  function triggerHooks(timing, fromSection, toSection) {
    const hooks = switchHooks[timing];
    if (!hooks) return;

    // 触发离开模块的钩子
    if (fromSection && hooks[fromSection]) {
      hooks[fromSection].forEach(function (cb) { cb(fromSection, toSection); });
    }
    // 触发进入模块的钩子
    if (toSection && hooks[toSection]) {
      hooks[toSection].forEach(function (cb) { cb(fromSection, toSection); });
    }

    // 触发全局钩子（'*' 匹配所有）
    if (hooks['*']) {
      hooks['*'].forEach(function (cb) { cb(fromSection, toSection); });
    }
  }

  /**
   * 初始化导航切换功能
   */
  function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section');

    if (!navLinks.length || !sections.length) {
      console.warn('导航或模块区域未找到，跳过初始化。');
      return;
    }

    /**
     * 隐藏所有 section
     */
    function hideAllSections() {
      sections.forEach(function (section) {
        section.style.display = 'none';
      });
    }

    /**
     * 移除所有导航链接的 active 类
     */
    function removeAllActive() {
      navLinks.forEach(function (link) {
        link.classList.remove('active');
      });
    }

    /**
     * 根据 section ID 显示对应模块
     * @param {string} sectionId
     */
    function showSection(sectionId) {
      // 防重复点击：如果已经是当前激活的模块，不做任何操作
      if (sectionId === currentSection) {
        return;
      }

      const previousSection = currentSection;

      // 切换前触发钩子（可用于清理、暂停等）
      triggerHooks('before', previousSection, sectionId);

      hideAllSections();
      removeAllActive();

      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.style.display = '';
      }

      const activeLink = document.querySelector('.nav-link[data-section="' + sectionId + '"]');
      if (activeLink) {
        activeLink.classList.add('active');
      }

      // 更新当前模块记录
      currentSection = sectionId;

      // 切换后触发钩子（可用于初始化、恢复等）
      triggerHooks('after', previousSection, sectionId);
    }

    // 绑定点击事件
    navLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const sectionId = this.getAttribute('data-section');
        if (sectionId) {
          showSection(sectionId);

          // 更新 URL hash
          if (history.pushState) {
            history.pushState(null, null, '#' + sectionId);
          }
        }
      });
    });

    // 处理浏览器前进/后退
    window.addEventListener('popstate', function () {
      const hash = window.location.hash.replace('#', '');
      if (hash && document.getElementById(hash)) {
        showSection(hash);
      }
    });

    // 页面加载时根据 URL hash 初始化显示
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && document.getElementById(initialHash)) {
      showSection(initialHash);
    } else {
      // 默认显示仪表盘（首次加载 currentSection 为 'dashboard'，showSection 会判断跳过，
      // 但我们需要确保仪表盘导航项高亮且 section 可见）
      // 由于 HTML 中仪表盘默认可见且导航项已有 active 类，这里仅需更新 currentSection
      // 若 URL 无 hash 且未匹配，则无需额外操作
    }

    console.log('导航切换功能已就绪。');
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }

  // 暴露全局 API
  window.WorldCupNav = {
    getCurrentSection: function () { return currentSection; },
    registerSwitchHook: registerSwitchHook
  };
})();