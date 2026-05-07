/**
 * main.js - 导航切换与模块显隐逻辑
 * World Cup Fan Center
 */
(function () {
  'use strict';

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
      hideAllSections();
      removeAllActive();

      var targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.style.display = '';
      }

      var activeLink = document.querySelector('.nav-link[data-section="' + sectionId + '"]');
      if (activeLink) {
        activeLink.classList.add('active');
      }
    }

    // 绑定点击事件
    navLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var sectionId = this.getAttribute('data-section');
        if (sectionId) {
          showSection(sectionId);

          // 更新 URL hash（可选，便于书签）
          if (history.pushState) {
            history.pushState(null, null, '#' + sectionId);
          }
        }
      });
    });

    // 处理浏览器前进/后退
    window.addEventListener('popstate', function () {
      var hash = window.location.hash.replace('#', '');
      if (hash && document.getElementById(hash)) {
        showSection(hash);
      }
    });

    // 页面加载时根据 URL hash 初始化显示
    var initialHash = window.location.hash.replace('#', '');
    if (initialHash && document.getElementById(initialHash)) {
      showSection(initialHash);
    } else {
      // 默认显示仪表盘
      showSection('dashboard');
    }

    console.log('导航切换功能已就绪。');
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }
})();