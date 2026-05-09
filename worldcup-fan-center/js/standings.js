/* ================================================================
   standings.js — 积分对阵模块
   功能：小组积分表、淘汰赛对阵图、路径推演工具
   ================================================================ */

(function () {
  'use strict';

  /* ================================================================
     常量
     ================================================================ */

  const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

  // 32强对阵公式：按实际淘汰赛编排，每相邻两组交叉
  // 对阵形式：[第N组第X名, 第M组第Y名]
  const R32_MATCHUPS = [
    { id: 'r32-1',  label: 'A1 vs B2' },
    { id: 'r32-2',  label: 'B1 vs A2' },
    { id: 'r32-3',  label: 'C1 vs D2' },
    { id: 'r32-4',  label: 'D1 vs C2' },
    { id: 'r32-5',  label: 'E1 vs F2' },
    { id: 'r32-6',  label: 'F1 vs E2' },
    { id: 'r32-7',  label: 'G1 vs H2' },
    { id: 'r32-8',  label: 'H1 vs G2' },
    { id: 'r32-9',  label: 'I1 vs J2' },
    { id: 'r32-10', label: 'J1 vs I2' },
    { id: 'r32-11', label: 'K1 vs L2' },
    { id: 'r32-12', label: 'L1 vs K2' },
    { id: 'r32-13', label: 'M1 vs N2' },
    { id: 'r32-14', label: 'N1 vs M2' },
    { id: 'r32-15', label: 'O1 vs P2' },
    { id: 'r32-16', label: 'P1 vs O2' }
  ];

  // R16 对阵（从32强相邻对碰）
  const R16_MATCHUPS = [
    { id: 'r16-1',  label: 'W1 vs W2',   src: [0, 1] },
    { id: 'r16-2',  label: 'W3 vs W4',   src: [2, 3] },
    { id: 'r16-3',  label: 'W5 vs W6',   src: [4, 5] },
    { id: 'r16-4',  label: 'W7 vs W8',   src: [6, 7] },
    { id: 'r16-5',  label: 'W9 vs W10',  src: [8, 9] },
    { id: 'r16-6',  label: 'W11 vs W12', src: [10, 11] },
    { id: 'r16-7',  label: 'W13 vs W14', src: [12, 13] },
    { id: 'r16-8',  label: 'W15 vs W16', src: [14, 15] }
  ];

  // QF
  const QF_MATCHUPS = [
    { id: 'qf-1', label: 'QF1', src: [0, 1] },
    { id: 'qf-2', label: 'QF2', src: [2, 3] },
    { id: 'qf-3', label: 'QF3', src: [4, 5] },
    { id: 'qf-4', label: 'QF4', src: [6, 7] }
  ];

  // SF
  const SF_MATCHUPS = [
    { id: 'sf-1', label: 'SF1', src: [0, 1] },
    { id: 'sf-2', label: 'SF2', src: [2, 3] }
  ];

  /* ================================================================
     状态
     ================================================================ */
  let currentGroup = 'A';
  let teamsData = [];
  let pathHighlightSeeds = []; // [{group, rank}] 高亮的种子位置

  /* ================================================================
     工具函数
     ================================================================ */

  /** 获取球队所在小组 */
  function getTeamGroup(teamId) {
    var team = teamsData.find(function (t) { return t.id === teamId; });
    return team ? team.group : null;
  }

  /** 判断某条32强对阵是否涉及指定的小组和排名 */
  function isSlotInR32(label, group, rank) {
    var pattern = group + rank;
    return label.indexOf(pattern) !== -1;
  }

  /** 判断某条对阵标签是否可能包含高亮的球队（用于高亮后续节点） */
  function doesLabelMatchHighlight(label) {
    if (pathHighlightSeeds.length === 0) return false;
    for (var i = 0; i < pathHighlightSeeds.length; i++) {
      var seed = pathHighlightSeeds[i];
      if (isSlotInR32(label, seed.group, seed.rank)) return true;
    }
    return false;
  }

  /* ================================================================
     渲染：小组选项卡
     ================================================================ */
  function renderTabs() {
    var tabsEl = document.getElementById('standings-tabs');
    if (!tabsEl) return;

    var html = '';
    GROUPS.forEach(function (g) {
      var activeClass = g === currentGroup ? ' standings-tab--active' : '';
      html += '<button class="standings-tab' + activeClass + '" data-group="' + g + '" type="button">' + g + '</button>';
    });
    tabsEl.innerHTML = html;
  }

  /* ================================================================
     渲染：积分表
     ================================================================ */
  function renderTable() {
    var tbody = document.getElementById('standings-tbody');
    if (!tbody) return;

    // 获取当前小组的球队，按 FIFA 排名升序
    var groupTeams = teamsData
      .filter(function (t) { return t.group === currentGroup; })
      .sort(function (a, b) { return (a.fifaRank || 999) - (b.fifaRank || 999); });

    var rows = '';
    groupTeams.forEach(function (team, idx) {
      rows += '<tr>';
      rows += '<td>' + (idx + 1) + '</td>';
      rows += '<td><span class="standings-team-name">' + team.name + '</span></td>';
      rows += '<td>--</td>';
      rows += '<td>--</td>';
      rows += '<td>--</td>';
      rows += '<td>--</td>';
      rows += '<td>--/--</td>';
      rows += '<td>--</td>';
      rows += '<td>--</td>';
      rows += '</tr>';
    });

    tbody.innerHTML = rows;
  }

  /* ================================================================
     渲染：淘汰赛对阵图
     ================================================================ */
  function renderBracket() {
    var treeEl = document.getElementById('bracket-tree');
    if (!treeEl) return;

    var html = '';

    // --- 32强列 ---
    html += '<div class="bracket-col bracket-col--r32">';
    html += '<div class="bracket-col__title">32强</div>';
    R32_MATCHUPS.forEach(function (m) {
      var extraClass = doesLabelMatchHighlight(m.label) ? ' bracket-node--highlight' : '';
      html += '<div class="bracket-node' + extraClass + '" data-bracket-id="' + m.id + '">' + m.label + '</div>';
    });
    html += '</div>';

    // --- 16强列 ---
    html += '<div class="bracket-col bracket-col--r16">';
    html += '<div class="bracket-col__title">16强</div>';
    R16_MATCHUPS.forEach(function (m) {
      html += '<div class="bracket-node bracket-node--pending" data-bracket-id="' + m.id + '">待定</div>';
    });
    html += '</div>';

    // --- 8强列 ---
    html += '<div class="bracket-col bracket-col--qf">';
    html += '<div class="bracket-col__title">8强</div>';
    QF_MATCHUPS.forEach(function (m) {
      html += '<div class="bracket-node bracket-node--pending" data-bracket-id="' + m.id + '">待定</div>';
    });
    html += '</div>';

    // --- 半决赛列 ---
    html += '<div class="bracket-col bracket-col--sf">';
    html += '<div class="bracket-col__title">半决赛</div>';
    SF_MATCHUPS.forEach(function (m) {
      html += '<div class="bracket-node bracket-node--pending" data-bracket-id="' + m.id + '">待定</div>';
    });
    html += '</div>';

    // --- 决赛列 ---
    html += '<div class="bracket-col bracket-col--final">';
    html += '<div class="bracket-col__title">决赛</div>';
    html += '<div class="bracket-node bracket-node--pending bracket-node--third" data-bracket-id="third">待定</div>';
    html += '<div class="bracket-node bracket-node--champion" data-bracket-id="final"><strong>待定</strong></div>';
    html += '</div>';

    treeEl.innerHTML = html;
  }

  /* ================================================================
     渲染：路径推演工具 - 球队下拉
     ================================================================ */
  function renderTeamSelect() {
    var selectEl = document.getElementById('path-team-select');
    if (!selectEl) return;

    // 按字母排序
    var sorted = teamsData.slice().sort(function (a, b) {
      return a.name.localeCompare(b.name, 'zh-CN');
    });

    var html = '<option value="">-- 选择球队 --</option>';
    sorted.forEach(function (t) {
      var sel = '';
      html += '<option value="' + t.id + '"' + sel + '>' + t.name + '</option>';
    });
    selectEl.innerHTML = html;

    // 默认选中主队
    try {
      var fav = null;
      if (window.WorldCupSettings && window.WorldCupSettings.getFavoriteTeam) {
        fav = window.WorldCupSettings.getFavoriteTeam();
      }
      if (fav && teamsData.some(function (t) { return t.id === fav; })) {
        selectEl.value = fav;
      }
    } catch (e) {
      // 静默
    }
  }

  /* ================================================================
     路径推演逻辑
     ================================================================ */
  function doPathFind() {
    var teamId = document.getElementById('path-team-select').value;
    var rank = document.getElementById('path-rank-select').value;
    var resultEl = document.getElementById('path-result');

    if (!teamId || !rank) {
      resultEl.innerHTML = '<p class="path-result__hint">请选择球队和小组排名后查看</p>';
      resetHighlight();
      return;
    }

    var team = teamsData.find(function (t) { return t.id === teamId; });
    if (!team) {
      resultEl.innerHTML = '<p class="path-result__hint">未找到该球队</p>';
      resetHighlight();
      return;
    }

    var group = team.group;
    var posSeed = group + rank; // e.g. "A1"

    // 确定该种子所在的32强对阵索引
    var r32Index = -1;
    for (var i = 0; i < R32_MATCHUPS.length; i++) {
      if (isSlotInR32(R32_MATCHUPS[i].label, group, rank)) {
        r32Index = i;
        break;
      }
    }

    if (r32Index === -1) {
      resultEl.innerHTML = '<p class="path-result__hint">未找到对应的淘汰赛位置</p>';
      resetHighlight();
      return;
    }

    // 设置高亮种子
    pathHighlightSeeds = [{ group: group, rank: rank }];

    // 重新渲染对阵图以应用高亮
    renderBracket();

    // 生成文字路径
    var lines = [];
    lines.push('<p class="path-result__team-name">' + team.name + ' (' + posSeed + ') 淘汰赛路径：</p>');

    // 32强
    var r32Label = R32_MATCHUPS[r32Index].label;
    lines.push('<p class="path-result__round"><span class="path-round-label">32强</span> ' + r32Label + '</p>');

    // 找到对应的R16
    var r16Index = Math.floor(r32Index / 2);
    var r16Label = R16_MATCHUPS[r16Index].label;
    lines.push('<p class="path-result__round"><span class="path-round-label">16强</span> vs ' + r16Label + ' 胜者</p>');

    // 找到对应的QF
    var qfIndex = Math.floor(r16Index / 2);
    var qfLabel = QF_MATCHUPS[qfIndex].label;
    lines.push('<p class="path-result__round"><span class="path-round-label">8强</span> vs ' + qfLabel + ' 胜者</p>');

    // SF
    var sfIndex = Math.floor(qfIndex / 2);
    var sfLabel = SF_MATCHUPS[sfIndex].label;
    lines.push('<p class="path-result__round"><span class="path-round-label">半决赛</span> vs ' + sfLabel + ' 胜者</p>');

    lines.push('<p class="path-result__round"><span class="path-round-label">决赛</span> 争夺冠军</p>');

    resultEl.innerHTML = lines.join('');
  }

  function resetHighlight() {
    pathHighlightSeeds = [];
    renderBracket();
    var resultEl = document.getElementById('path-result');
    if (resultEl) {
      resultEl.innerHTML = '<p class="path-result__hint">选择球队和排名后查看潜在淘汰赛路径</p>';
    }
  }

  /* ================================================================
     事件绑定
     ================================================================ */
  function bindEvents() {
    // 小组选项卡点击
    var tabsEl = document.getElementById('standings-tabs');
    if (tabsEl) {
      tabsEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.standings-tab');
        if (!btn) return;
        var group = btn.getAttribute('data-group');
        if (group && group !== currentGroup) {
          currentGroup = group;
          renderTabs();
          renderTable();
          resetHighlight();
        }
      });
    }

    // 路径查看按钮
    var viewBtn = document.getElementById('path-view-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', doPathFind);
    }

    // 重置按钮
    var resetBtn = document.getElementById('path-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var teamSelect = document.getElementById('path-team-select');
        var rankSelect = document.getElementById('path-rank-select');
        if (teamSelect) {
          try {
            var fav = null;
            if (window.WorldCupSettings && window.WorldCupSettings.getFavoriteTeam) {
              fav = window.WorldCupSettings.getFavoriteTeam();
            }
            if (fav && teamsData.some(function (t) { return t.id === fav; })) {
              teamSelect.value = fav;
            } else {
              teamSelect.value = '';
            }
          } catch (e) {
            teamSelect.value = '';
          }
        }
        if (rankSelect) rankSelect.value = '1';
        resetHighlight();
      });
    }
  }

  /* ================================================================
     初始化
     ================================================================ */
  function initStandings() {
    // 读取全局数据
    if (window.__TEAMS_DATA__ && window.__TEAMS_DATA__.length > 0) {
      teamsData = window.__TEAMS_DATA__;
    } else {
      console.warn('standings.js: __TEAMS_DATA__ 不可用');
      return;
    }

    renderTabs();
    renderTable();
    renderBracket();
    renderTeamSelect();
    bindEvents();

    // 初始状态
    resetHighlight();
  }

  /* ================================================================
     注册到导航钩子
     ================================================================ */
  if (window.WorldCupNav && window.WorldCupNav.registerSwitchHook) {
    window.WorldCupNav.registerSwitchHook('after', 'standings', function () {
      // 切换到 standings 时刷新（确保数据最新）
      if (window.__TEAMS_DATA__ && window.__TEAMS_DATA__.length > 0) {
        teamsData = window.__TEAMS_DATA__;
      }
      renderTabs();
      renderTable();
      renderBracket();
      renderTeamSelect();
      resetHighlight();
    });
  } else {
    // 降级：直接初始化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initStandings);
    } else {
      initStandings();
    }
  }
})();