/**
 * teams.js - 球队档案馆模块
 * World Cup Fan Center
 * 
 * - 从 window.__TEAMS_DATA__ 读取数据
 * - 惰性渲染：首次初始化后缓存 DOM，后续只做过滤
 * - 搜索：支持中文队名 & FIFA 3字母代码
 * - 大洲筛选：7个按钮组合过滤
 * - 点击卡片：详情浮层（overlay + modal）
 */
(function () {
  'use strict';

  /* ================================================================
     ISO 2位国家代码映射（供 FlagCDN 国旗图片用）
     https://flagcdn.com/w80/{code}.png
     ================================================================ */
  var COUNTRY_FLAGS = {
    MEX: 'mx', URU: 'uy', NGA: 'ng', FRA: 'fr',
    SEN: 'sn', PER: 'pe', ARG: 'ar', GER: 'de',
    ALG: 'dz', USA: 'us', CRO: 'hr', QAT: 'qa',
    ESP: 'es', JPN: 'jp', EGY: 'eg', ENG: 'gb-eng',
    MAR: 'ma', PAN: 'pa', BRA: 'br', DEN: 'dk',
    CIV: 'ci', NED: 'nl', AUS: 'au', CHN: 'cn',
    POR: 'pt', POL: 'pl', ECU: 'ec', ITA: 'it',
    CMR: 'cm', BEL: 'be', KOR: 'kr', SER: 'rs',
    UAE: 'ae', COL: 'co', SUI: 'ch', CAN: 'ca',
    UZB: 'uz', JAM: 'jm', GRE: 'gr', CRC: 'cr',
    TUR: 'tr', VEN: 've', KSA: 'sa', UKR: 'ua',
    GHA: 'gh', IRN: 'ir', WAL: 'gb-wls', TUN: 'tn'
  };

  /* 获取国旗图片 URL（带默认值，异常时 fallback 到空白占位） */
  function getFlagUrl(teamId) {
    var code = COUNTRY_FLAGS[teamId] || 'xx';
    return 'https://flagcdn.com/w80/' + code + '.png';
  }

  /* ================================================================
     状态
     ================================================================ */
  var initialized = false;       // 是否已生成所有卡片DOM
  var teamsData = [];            // 球队数据副本
  var allCards = [];             // { element, team } 关联数组
  var currentFilter = { search: '', continent: '' };

  /* ================================================================
     DOM 引用缓存（在 initTeams 中填充）
     ================================================================ */
  var gridEl = null;
  var searchEl = null;
  var filterBtns = null;
  var overlayEl = null;
  var modalBodyEl = null;
  var modalCloseEl = null;

  /* ================================================================
     工具函数：节流
     ================================================================ */
  function throttle(fn, delay) {
    var timer = null;
    return function () {
      var context = this;
      var args = arguments;
      if (timer) return;
      timer = setTimeout(function () {
        timer = null;
        fn.apply(context, args);
      }, delay);
    };
  }

  /* ================================================================
     工具函数：分词匹配（支持全拼 / 首字母搜索）
     ================================================================ */
  function matchSearch(team, query) {
    if (!query) return true;
    var q = query.toLowerCase().trim();

    // 中文子串匹配
    if (/[\u4e00-\u9fff]/.test(q)) {
      return team.name.indexOf(query.trim()) !== -1;
    }

    // 英文：匹配 FIFA id
    return team.id.toLowerCase().indexOf(q) !== -1;
  }

  /* ================================================================
     渲染过滤结果
     ================================================================ */
  function applyFilters() {
    if (!initialized) return;

    var searchQuery = currentFilter.search;
    var continent = currentFilter.continent;

    var visibleCount = 0;
    allCards.forEach(function (item) {
      var team = item.team;
      var matchSearchResult = matchSearch(team, searchQuery);
      var matchContinent = !continent || team.continent === continent;

      if (matchSearchResult && matchContinent) {
        item.element.style.display = '';
        visibleCount++;
      } else {
        item.element.style.display = 'none';
      }
    });

    // 更新搜索结果计数
    gridEl.setAttribute('data-visible', visibleCount);
  }

  /* ================================================================
     搜索事件处理（节流 150ms）
     ================================================================ */
  var onSearch = throttle(function () {
    currentFilter.search = searchEl.value;
    applyFilters();
  }, 150);

  /* ================================================================
     大洲筛选
     ================================================================ */
  function onContinentClick(e) {
    var btn = e.currentTarget;
    var continent = btn.getAttribute('data-continent') || '';

    // 更新按钮激活态
    filterBtns.forEach(function (b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');

    currentFilter.continent = continent;
    applyFilters();
  }

  /* ================================================================
     详情浮层
     ================================================================ */
  function openModal(team) {
    if (!modalBodyEl || !overlayEl) return;

    var flag = COUNTRY_FLAGS[team.id] || '';
    var playerList = team.players.split(',');

    // 生成球员标签HTML
    var playerTagsHtml = playerList.map(function (p) {
      return '<span class="player-tag">' + p.trim() + '</span>';
    }).join('');

    modalBodyEl.innerHTML =
      '<div class="modal-team-header">' +
          '<img class="modal-team-flag" src="' + getFlagUrl(team.id) + '" alt="' + team.name + ' 国旗" ' +
          'onerror="this.style.display=\'none\'" />' +
        '<h3 class="modal-team-name">' + team.name + '</h3>' +
      '</div>' +
      '<div class="modal-team-meta">' +
        '<div class="modal-meta-item">' +
          '<span class="modal-meta-label">FIFA 排名</span>' +
          '<span class="modal-meta-value">#' + team.fifaRank + '</span>' +
        '</div>' +
        '<div class="modal-meta-item">' +
          '<span class="modal-meta-label">所属大洲</span>' +
          '<span class="modal-meta-value">' + team.continent + '</span>' +
        '</div>' +
        '<div class="modal-meta-item">' +
          '<span class="modal-meta-label">小组</span>' +
          '<span class="modal-meta-value">' + team.group + ' 组</span>' +
        '</div>' +
        '<div class="modal-meta-item">' +
          '<span class="modal-meta-label">FIFA 代码</span>' +
          '<span class="modal-meta-value">' + team.id + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="modal-team-intro">' +
        '<p>' + team.intro + '</p>' +
      '</div>' +
      '<div class="modal-team-players">' +
        '<h4 class="modal-section-title">球员名单 (' + playerList.length + ' 人)</h4>' +
        '<div class="player-tags">' + playerTagsHtml + '</div>' +
      '</div>';

    // 显示浮层
    overlayEl.style.display = 'flex';
    // 阻止 body 滚动
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (overlayEl) {
      overlayEl.style.display = 'none';
    }
    document.body.style.overflow = '';
  }

  /* ================================================================
     渲染所有卡片（仅在首次初始化时调用）
     ================================================================ */
  function renderAllCards() {
    if (!gridEl) return;

    // 深拷贝数据
    teamsData = JSON.parse(JSON.stringify(window.__TEAMS_DATA__));

    // 按 FIFA 排名升序排列（排名越前越好）
    teamsData.sort(function (a, b) {
      return a.fifaRank - b.fifaRank;
    });

    // 构建卡片
    var fragment = document.createDocumentFragment();
    allCards = [];

    teamsData.forEach(function (team) {
      var flagCode = COUNTRY_FLAGS[team.id] || 'xx';
      var flagUrl = 'https://flagcdn.com/w80/' + flagCode + '.png';
      var card = document.createElement('div');
      card.className = 'team-card';

      card.innerHTML =
        '<div class="team-card__header">' +
          '<img class="team-card__flag" src="' + flagUrl + '" alt="' + team.name + ' 国旗" loading="lazy" ' +
          'onerror="this.style.display=\'none\'" />' +
          '<div class="team-card__info">' +
            '<h3 class="team-card__name">' + team.name + '</h3>' +
            '<span class="team-card__code">' + team.id + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="team-card__meta">' +
          '<span class="team-card__rank">#' + team.fifaRank + '</span>' +
          '<span class="team-card__group-tag">' + team.group + ' 组</span>' +
        '</div>';

      // 绑定点击事件 → 打开详情浮层
      card.addEventListener('click', (function (t) {
        return function () { openModal(t); };
      })(team));

      fragment.appendChild(card);
      allCards.push({ element: card, team: team });
    });

    gridEl.innerHTML = '';
    gridEl.appendChild(fragment);
    gridEl.setAttribute('data-visible', teamsData.length);
  }

  /* ================================================================
     初始化入口（惰性渲染）
     ================================================================ */
  function initTeams(fromSection, toSection) {
    if (toSection !== 'teams') return;

    // 缓存 DOM 引用
    gridEl = document.getElementById('teams-grid');
    searchEl = document.getElementById('teams-search');
    overlayEl = document.getElementById('team-modal-overlay');
    modalBodyEl = document.getElementById('modal-body');
    modalCloseEl = document.getElementById('modal-close');

    if (!initialized) {
      // 首次渲染
      renderAllCards();

      // 绑定搜索事件
      if (searchEl) {
        searchEl.addEventListener('input', onSearch);
      }

      // 绑定大洲筛选
      var filterContainer = document.getElementById('continent-filters');
      if (filterContainer) {
        filterBtns = filterContainer.querySelectorAll('.continent-btn');
        filterBtns.forEach(function (btn) {
          btn.addEventListener('click', onContinentClick);
        });
      }

      // 绑定浮层关闭事件
      if (modalCloseEl) {
        modalCloseEl.addEventListener('click', closeModal);
      }
      if (overlayEl) {
        overlayEl.addEventListener('click', function (e) {
          if (e.target === overlayEl) {
            closeModal();
          }
        });
      }

      // Esc 关闭浮层
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlayEl && overlayEl.style.display === 'flex') {
          closeModal();
        }
      });

      initialized = true;
      console.log('球队档案馆模块已初始化。共 ' + teamsData.length + ' 支球队。');
    }
  }

  /* ================================================================
     注册导航切换钩子
     ================================================================ */
  if (window.WorldCupNav) {
    window.WorldCupNav.registerSwitchHook('after', 'teams', initTeams);
  } else {
    // 等待 main.js 加载完成
    document.addEventListener('DOMContentLoaded', function () {
      if (window.WorldCupNav) {
        window.WorldCupNav.registerSwitchHook('after', 'teams', initTeams);
      }
    });
  }
})();