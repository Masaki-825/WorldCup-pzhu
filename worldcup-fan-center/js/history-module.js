/**
 * history-module.js - 历史博物馆全部逻辑
 * World Cup Fan Center
 *
 * 功能：
 * 1. 冠军墙：横向滚动22张卡片，fetch 加载数据
 * 2. 经典比赛回顾：从 window.__CLASSIC_MATCHES_DATA__ 动态读取
 * 3. 冷知识盒子：随机展示 + 换一条按钮 + 淡入动画
 */
(function () {
  'use strict';

  /* ================================================================
     常量定义
     ================================================================ */

   /* ================================================================
      经典比赛（从 window.__CLASSIC_MATCHES_DATA__ 动态读取）
     ================================================================

   * 数据源为外部注入的 window.__CLASSIC_MATCHES_DATA__ 数组。
   * 字段：比赛年份、赛事阶段、对阵双方、全场比分、加时/点球、
   *        关键球星、经典事件、举办地
   * 通过 getClassicMatchesData() 完成中文键名 -> 内部字段的映射。

   */

  /**
   * 从 window.__CLASSIC_MATCHES_DATA__ 读取并映射字段
   * @returns {Array|null} 映射后的比赛数组，失败或为空时返回 null
   */
  function getClassicMatchesData() {
    try {
      var raw = window.__CLASSIC_MATCHES_DATA__;
      if (!raw || !Array.isArray(raw) || raw.length === 0) {
        return null;
      }
       return raw.map(function (item) {
         return {
           year: item['比赛年份'],
           stage: item['赛事阶段'],
           teams: item['对阵双方'],
           score: item['全场比分'],
           overtime: item['加时/点球'] || '',
           star: item['关键球星'] || '',
           venue: item['举办地'],
           desc: item['经典事件']
         };
       });
    } catch (e) {
      return null;
    }
  }

  /* ================================================================
     工具函数
     ================================================================ */

  function safeGetById(id) {
    return document.getElementById(id);
  }

  /* ================================================================
     冠军墙
     ================================================================ */

  function renderChampionsWall(champions) {
    var scrollContainer = safeGetById('champions-scroll');
    if (!scrollContainer) return;

    var html = '<div class="champions-wall__inner">';

    for (var i = 0; i < champions.length; i++) {
      var c = champions[i];
      var is2022 = c.year === 2022;
      var cardClass = 'champions-card';
      if (is2022) {
        cardClass += ' champions-card--latest';
      }

      html += '<div class="' + cardClass + '">';
      html += '<p class="champions-card__year">' + c.year + '</p>';
      html += '<p class="champions-card__champion">' + c.champion + '</p>';
      html += '<p class="champions-card__host">举办国：' + c.host + '</p>';
      html += '<p class="champions-card__third">季军：' + (c.third || '--') + '</p>';
      html += '</div>';
    }

    html += '</div>';
    scrollContainer.innerHTML = html;

    // 横向滚动惯性效果（鼠标滚轮）
    scrollContainer.addEventListener('wheel', function (e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        this.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    // 自动滚动定位到2022年卡片
    var latestCard = scrollContainer.querySelector('.champions-card--latest');
    if (latestCard) {
      var scrollLeft = latestCard.offsetLeft - scrollContainer.clientWidth / 2 + latestCard.offsetWidth / 2;
      scrollContainer.scrollLeft = Math.max(0, scrollLeft);
    }
  }

  function loadChampionsWall() {
    try {
      var data = window.__HISTORY_DATA__;
      if (data && data.champions && data.champions.length) {
        renderChampionsWall(data.champions);
      } else { showChampionsFallback(); }
    } catch (e) { showChampionsFallback(); }
  }

  function showChampionsFallback() {
    var container = safeGetById('champions-scroll');
    if (container) {
      container.innerHTML = '<p class="champions-wall__error">冠军墙数据暂不可用，请稍后重试。</p>';
    }
  }

  /* ================================================================
     经典比赛回顾
     ================================================================ */

  /**
   * 年代区间定义
   */
  var eraRanges = [
    { label: '全部',  start: 0,    end: 9999 },
    { label: '1930s', start: 1930, end: 1939 },
    { label: '1950s', start: 1950, end: 1959 },
    { label: '1970s', start: 1970, end: 1979 },
    { label: '1990s', start: 1990, end: 1999 },
    { label: '2010s', start: 2010, end: 9999 }
  ];

  var currentEraFilter = '全部';

  function renderEraButtons() {
    var btnContainer = safeGetById('classic-matches-filters');
    if (!btnContainer) return;

    var btnsHtml = '';
    for (var i = 0; i < eraRanges.length; i++) {
      var era = eraRanges[i];
      var activeClass = (era.label === currentEraFilter) ? ' classic-matches__filter-btn--active' : '';
      btnsHtml += '<button class="classic-matches__filter-btn' + activeClass + '" data-era="' + era.label + '">' + era.label + '</button>';
    }
    btnContainer.innerHTML = btnsHtml;

    // 绑定点击
    var buttons = btnContainer.querySelectorAll('.classic-matches__filter-btn');
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].addEventListener('click', function () {
        currentEraFilter = this.getAttribute('data-era');
        renderEraButtons();
        renderClassicMatches();
      });
    }
  }

  function getFilteredMatches() {
    var allData = getClassicMatchesData();
    if (!allData) return [];

    var era = null;
    for (var i = 0; i < eraRanges.length; i++) {
      if (eraRanges[i].label === currentEraFilter) {
        era = eraRanges[i];
        break;
      }
    }

    return allData.filter(function (m) {
      return m.year >= era.start && m.year <= era.end;
    });
  }

  function renderClassicMatches() {
    var container = safeGetById('classic-matches-list');
    if (!container) return;

    var allData = getClassicMatchesData();
    if (!allData) {
      container.innerHTML = '<p class="classic-matches__empty">经典比赛数据暂不可用</p>';
      return;
    }

    var filtered = getFilteredMatches();

    if (!filtered.length) {
      container.innerHTML = '<p class="classic-matches__empty">经典比赛数据暂不可用</p>';
      return;
    }

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var m = filtered[i];
      var is2022Final = (m.year === 2022 && m.stage === '决赛');
      var cardClass = 'classic-match-card';
      if (is2022Final) {
        cardClass += ' classic-match-card--featured';
      }

      html += '<div class="' + cardClass + '">';
      // 顶部行：年份 + 阶段标签
      html += '<div class="classic-match-card__top">';
      html += '<span class="classic-match-card__year">' + m.year + '</span>';
      html += '<span class="classic-match-card__stage">' + m.stage + '</span>';
      html += '</div>';
       // 中部：对阵 + 比分
       html += '<p class="classic-match-card__matchup">' + m.teams + '</p>';
       html += '<p class="classic-match-card__score">' + m.score + '</p>';
       if (m.overtime) {
         html += '<p class="classic-match-card__overtime">' + m.overtime + '</p>';
       }
       if (m.star) {
         html += '<p class="classic-match-card__star">关键球星：' + m.star + '</p>';
       }
       // 底部：事件描述 + 举办地
       html += '<p class="classic-match-card__event">' + m.desc + '</p>';
       html += '<p class="classic-match-card__venue">' + m.venue + '</p>';
      html += '</div>';
    }

    container.innerHTML = html;
  }

  /* ================================================================
     冷知识盒子
     ================================================================ */

  var triviaData = [];
  var currentTriviaIndex = -1;

  function loadTrivia() {
    try {
      var data = window.__HISTORY_DATA__;
      if (data && data.trivia && data.trivia.length) {
        triviaData = data.trivia; showRandomTrivia();
      } else { showTriviaFallback(); }
    } catch (e) { showTriviaFallback(); }
  }

  function showRandomTrivia() {
    var contentEl = safeGetById('trivia-content');
    if (!contentEl || !triviaData.length) return;

    // 避免重复同一条
    var newIndex;
    if (triviaData.length === 1) {
      newIndex = 0;
    } else {
      do {
        newIndex = Math.floor(Math.random() * triviaData.length);
      } while (newIndex === currentTriviaIndex);
    }
    currentTriviaIndex = newIndex;

    var item = triviaData[newIndex];

    // 淡入动画
    contentEl.style.opacity = '0';
    contentEl.style.transition = 'opacity 0.3s ease';

    setTimeout(function () {
      contentEl.innerHTML =
        '<h4 class="trivia-box__item-title">' + (item.title || '') + '</h4>' +
        '<p class="trivia-box__item-content">' + (item.content || '') + '</p>';
      contentEl.style.opacity = '1';
    }, 150);
  }

  function showTriviaFallback() {
    var contentEl = safeGetById('trivia-content');
    if (contentEl) {
      contentEl.innerHTML = '<p class="trivia-box__placeholder">冷知识暂不可用，请稍后重试。</p>';
    }
  }

  function bindTriviaButton() {
    var btn = safeGetById('trivia-next-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        if (triviaData.length) {
          showRandomTrivia();
        } else {
          loadTrivia();
        }
      });
    }
  }

  /* ================================================================
     初始化入口
     ================================================================ */

  function initHistory() {
    loadChampionsWall();
    renderEraButtons();
    renderClassicMatches();
    loadTrivia();
    bindTriviaButton();
  }

  /* ================================================================
     注册导航钩子
     ================================================================ */

  if (window.WorldCupNav && typeof window.WorldCupNav.registerSwitchHook === 'function') {
    window.WorldCupNav.registerSwitchHook('after', 'history', initHistory);
  }

  // 页面首次加载时如果历史模块可见（hash 直达），也初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (window.location.hash === '#history') {
        initHistory();
      }
    });
  } else {
    if (window.location.hash === '#history') {
      initHistory();
    }
  }
})();