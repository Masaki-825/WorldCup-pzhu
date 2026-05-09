/**
 * history-module.js - 历史博物馆全部逻辑
 * World Cup Fan Center
 *
 * 功能：
 * 1. 冠军墙：横向滚动22张卡片，fetch 加载数据
 * 2. 经典比赛回顾：硬编码5-8场经典对决
 * 3. 冷知识盒子：随机展示 + 换一条按钮 + 淡入动画
 */
(function () {
  'use strict';

  /* ================================================================
     常量定义
     ================================================================ */

  var HISTORY_DATA_URL = 'data/history.json';

  /* ================================================================
     经典比赛（硬编码）
     ================================================================ */

  var classicMatches = [
    {
      year: 1950,
      stage: '决赛',
      teams: '乌拉圭 vs 巴西',
      score: '2-1',
      desc: '马拉卡纳惨案——巴西在主场马拉卡纳体育场近20万观众面前，先进一球后被乌拉圭连扳两球逆转，痛失冠军。这场比赛改变了巴西足球的历史轨迹，白色球衣自此被弃用。'
    },
    {
      year: 1970,
      stage: '决赛',
      teams: '巴西 vs 意大利',
      score: '4-1',
      desc: '贝利时代的巅峰之战，巴西4-1大胜意大利永久保留雷米特杯。卡洛斯-阿尔贝托的凌空抽射破门被誉为世界杯历史上最伟大的团队进球。'
    },
    {
      year: 1986,
      stage: '1/4决赛',
      teams: '阿根廷 vs 英格兰',
      score: '2-1',
      desc: '马拉多纳的"上帝之手"和"世纪进球"同场诞生。先用手球破门引发争议，随后连过五人打入历史最佳进球，一己之力淘汰英格兰。'
    },
    {
      year: 1998,
      stage: '决赛',
      teams: '法国 vs 巴西',
      score: '3-0',
      desc: '齐达内两记头球破门，法国本土首夺世界杯。赛前罗纳尔多突发晕厥事件至今仍是未解之谜，巴西全队失常成就了法国足球的黄金时刻。'
    },
    {
      year: 2006,
      stage: '决赛',
      teams: '意大利 vs 法国',
      score: '1-1 (点球5-3)',
      desc: '齐达内职业生涯最后一场比赛，用一记勺子点球首开纪录，却在加时赛头顶马特拉齐被红牌罚下。与大力神杯擦肩而过的背影成为世界杯最经典的影像。'
    },
    {
      year: 2014,
      stage: '半决赛',
      teams: '德国 vs 巴西',
      score: '7-1',
      desc: '米内罗惨案——东道主巴西在贝洛奥里藏特遭遇队史最惨痛失利。德国在29分钟内连入五球，克洛泽超越罗纳尔多成为世界杯历史射手王。'
    },
    {
      year: 2022,
      stage: '决赛',
      teams: '阿根廷 vs 法国',
      score: '3-3 (点球4-2)',
      desc: '世界杯历史上最伟大的决赛之一。梅西梅开二度，姆巴佩帽子戏法，双方120分钟内战成3-3。阿根廷点球大战获胜，梅西终获世界杯冠军。'
    },
    {
      year: 2018,
      stage: '1/8决赛',
      teams: '法国 vs 阿根廷',
      score: '4-3',
      desc: '姆巴佩横空出世之战——19岁的他用速度摧毁了阿根廷防线，独造三球（两球+造点）。一场七球盛宴标志法国新生代全面接管世界足坛。'
    }
  ];

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

    // 添加横向滚动惯性效果（鼠标拖拽滚轮）
    scrollContainer.addEventListener('wheel', function (e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        this.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  function loadChampionsWall() {
    fetch(HISTORY_DATA_URL)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        if (data.champions && data.champions.length) {
          renderChampionsWall(data.champions);
        } else {
          showChampionsFallback();
        }
      })
      .catch(function (err) {
        console.warn('冠军墙数据加载失败：' + err.message);
        showChampionsFallback();
      });
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

  function renderClassicMatches() {
    var container = safeGetById('classic-matches-list');
    if (!container) return;

    var html = '<div class="classic-matches__inner">';

    for (var i = 0; i < classicMatches.length; i++) {
      var m = classicMatches[i];

      html += '<div class="classic-match-card">';
      html += '<div class="classic-match-card__header">';
      html += '<span class="classic-match-card__year">' + m.year + '</span>';
      html += '<span class="classic-match-card__stage">' + m.stage + '</span>';
      html += '</div>';
      html += '<p class="classic-match-card__teams">' + m.teams + '</p>';
      html += '<p class="classic-match-card__score">' + m.score + '</p>';
      html += '<p class="classic-match-card__desc">' + m.desc + '</p>';
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  /* ================================================================
     冷知识盒子
     ================================================================ */

  var triviaData = [];
  var currentTriviaIndex = -1;

  function loadTrivia() {
    fetch(HISTORY_DATA_URL)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        if (data.trivia && data.trivia.length) {
          triviaData = data.trivia;
          showRandomTrivia();
        } else {
          showTriviaFallback();
        }
      })
      .catch(function (err) {
        console.warn('冷知识数据加载失败：' + err.message);
        showTriviaFallback();
      });
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