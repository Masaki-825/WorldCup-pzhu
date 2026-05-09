/**
 * predictions.js - 预测擂台全部逻辑
 * World Cup Fan Center
 *
 * 功能：
 * 1. 每日一猜：揭幕战比分预测，localStorage 持久化
 * 2. 完整预测：16组小组出线 + 淘汰赛晋级路径
 * 3. 准确率展示区
 */
(function () {
  'use strict';

  /* ================================================================
     常量定义
     ================================================================ */
  const STORAGE_KEY_DAILY = 'prediction-daily';
  const STORAGE_KEY_FULL = 'prediction-full';

  /* ================================================================
     工具函数
     ================================================================ */

  function safeGetJSON(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function safeSetJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function getTeamName(teamId) {
    var teams = window.__TEAMS_DATA__;
    if (!teams) return teamId;
    for (var i = 0; i < teams.length; i++) {
      if (teams[i].id === teamId) {
        return teams[i].name;
      }
    }
    return teamId;
  }

  function getGroupTeams(group) {
    var teams = window.__TEAMS_DATA__ || [];
    return teams.filter(function (t) { return t.group === group; });
  }

  /* ================================================================
     每日一猜
     ================================================================ */

  function getOpenerMatch() {
    var schedule = window.__SCHEDULE_DATA__;
    if (!schedule || !schedule.length) return null;
    // 揭幕战：第一场有对阵队伍的比赛
    for (var i = 0; i < schedule.length; i++) {
      if (schedule[i].teams && schedule[i].teams.length >= 2) {
        return schedule[i];
      }
    }
    return schedule[0];
  }

  function renderDailyGuess() {
    var match = getOpenerMatch();
    if (!match) {
      document.getElementById('daily-guess-match').innerHTML = '<p>暂无揭幕战数据</p>';
      return;
    }

    var homeId = match.teams[0];
    var awayId = match.teams[1];
    var homeName = getTeamName(homeId);
    var awayName = getTeamName(awayId);
    var phase = match.phase || '揭幕战';
    var date = match.date || '';
    var time = match.time || '';

    // 对阵信息区
    document.getElementById('daily-guess-match').innerHTML =
      '<div class="daily-guess__matchup">' +
        '<span class="daily-guess__team daily-guess__team--home">' + homeName + '</span>' +
        '<span class="daily-guess__vs">vs</span>' +
        '<span class="daily-guess__team daily-guess__team--away">' + awayName + '</span>' +
      '</div>' +
      '<p class="daily-guess__meta">' + phase + ' / ' + date + ' ' + time + ' (UTC+8)</p>';

    // 检查是否已提交
    var saved = safeGetJSON(STORAGE_KEY_DAILY);

    if (saved && saved.matchId === match.id) {
      // 已提交状态
      document.getElementById('daily-guess-inputs').style.display = 'none';
      document.getElementById('daily-guess-actions').style.display = 'none';
      var submittedEl = document.getElementById('daily-guess-submitted');
      submittedEl.style.display = '';
      submittedEl.innerHTML =
        '<p class="daily-guess__result-text">你已预测：<strong>' + saved.homeScore + ' - ' + saved.awayScore + '</strong></p>' +
        '<button id="daily-guess-modify-btn" class="btn btn--secondary" type="button">修改预测</button>';

      document.getElementById('daily-guess-modify-btn').addEventListener('click', function () {
        safeSetJSON(STORAGE_KEY_DAILY, null);
        renderDailyGuess();
      });
    } else {
      // 未提交状态
      document.getElementById('daily-guess-inputs').style.display = '';
      document.getElementById('daily-guess-actions').style.display = '';
      document.getElementById('daily-guess-submitted').style.display = 'none';

      document.getElementById('daily-guess-inputs').innerHTML =
        '<label class="daily-guess__input-label">' +
          '<span class="daily-guess__input-team">' + homeName + '</span>' +
          '<input type="number" id="daily-home-score" class="daily-guess__score-input" min="0" max="20" value="0" aria-label="' + homeName + ' 比分">' +
        '</label>' +
        '<span class="daily-guess__input-divider">-</span>' +
        '<label class="daily-guess__input-label">' +
          '<span class="daily-guess__input-team">' + awayName + '</span>' +
          '<input type="number" id="daily-away-score" class="daily-guess__score-input" min="0" max="20" value="0" aria-label="' + awayName + ' 比分">' +
        '</label>';

      document.getElementById('daily-guess-actions').innerHTML =
        '<button id="daily-guess-submit-btn" class="btn btn--primary" type="button">提交预测</button>';

      document.getElementById('daily-guess-submit-btn').addEventListener('click', function () {
        var homeScore = parseInt(document.getElementById('daily-home-score').value, 10) || 0;
        var awayScore = parseInt(document.getElementById('daily-away-score').value, 10) || 0;

        if (homeScore < 0) homeScore = 0;
        if (awayScore < 0) awayScore = 0;
        if (homeScore > 20) homeScore = 20;
        if (awayScore > 20) awayScore = 20;

        var prediction = {
          matchId: match.id,
          homeScore: homeScore,
          awayScore: awayScore,
          submittedAt: new Date().toISOString()
        };

        safeSetJSON(STORAGE_KEY_DAILY, prediction);
        renderDailyGuess();
      });
    }
  }

  /* ================================================================
     完整预测表单
     ================================================================ */

  var groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

  var knockoutPhases = [
    { id: 'round32', name: '1/16决赛', matchCount: 16 },
    { id: 'round16', name: '1/8决赛', matchCount: 8 },
    { id: 'quarter', name: '1/4决赛', matchCount: 4 },
    { id: 'semi', name: '半决赛', matchCount: 2 },
    { id: 'final', name: '决赛', matchCount: 1 }
  ];

  function renderGroupPredictions() {
    var container = document.getElementById('prediction-groups');
    var saved = safeGetJSON(STORAGE_KEY_FULL);
    var savedGroups = (saved && saved.groups) ? saved.groups : {};

    var html = '<h4 class="full-prediction__section-title">小组出线预测</h4>';
    html += '<p class="full-prediction__section-hint">每组3支球队，选择2支晋级球队</p>';
    html += '<div class="prediction-groups-grid">';

    for (var g = 0; g < groups.length; g++) {
      var group = groups[g];
      var teams = getGroupTeams(group);
      var checked = savedGroups[group] || [];

      html += '<div class="prediction-group-card" data-group="' + group + '">';
      html += '<h5 class="prediction-group-card__title">' + group + '组</h5>';

      for (var t = 0; t < teams.length; t++) {
        var team = teams[t];
        var isChecked = checked.indexOf(team.id) !== -1;
        html += '<label class="prediction-group-checkbox">' +
          '<input type="checkbox" class="prediction-group-input" data-group="' + group + '" data-team="' + team.id + '"' +
          (isChecked ? ' checked' : '') + '>' +
          '<span class="prediction-group-team-name">' + team.name + '</span>' +
        '</label>';
      }

      html += '<p class="prediction-group-count" data-group="' + group + '">已选 ' + checked.length + '/2</p>';
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;

    // 绑定复选框限制逻辑
    var allCheckboxes = container.querySelectorAll('.prediction-group-input');
    for (var c = 0; c < allCheckboxes.length; c++) {
      allCheckboxes[c].addEventListener('change', function () {
        var group = this.getAttribute('data-group');
        var groupBoxes = container.querySelectorAll('.prediction-group-input[data-group="' + group + '"]');
        var checkedCount = 0;
        for (var b = 0; b < groupBoxes.length; b++) {
          if (groupBoxes[b].checked) checkedCount++;
        }
        if (checkedCount > 2) {
          this.checked = false;
          checkedCount--;
        }
        // 更新计数显示
        var countEl = container.querySelector('.prediction-group-count[data-group="' + group + '"]');
        if (countEl) {
          countEl.textContent = '已选 ' + checkedCount + '/2';
        }
      });
    }
  }

  function renderKnockoutPredictions() {
    var container = document.getElementById('prediction-knockout');
    var saved = safeGetJSON(STORAGE_KEY_FULL);
    var savedKnockout = (saved && saved.knockout) ? saved.knockout : {};
    var savedGroups = (saved && saved.groups) ? saved.groups : {};

    var html = '<h4 class="full-prediction__section-title">淘汰赛晋级预测</h4>';
    html += '<p class="full-prediction__section-hint">预测从1/16决赛到冠军的晋级路径</p>';

    // 构建小组出线后的对阵表（基于小组名次）
    var roundMatches = generateBracketMatches(savedGroups);

    for (var p = 0; p < knockoutPhases.length; p++) {
      var phase = knockoutPhases[p];
      var phaseKey = phase.id;
      var phaseSaved = savedKnockout[phaseKey] || [];

      html += '<div class="prediction-knockout-phase">';
      html += '<h5 class="prediction-knockout-phase__title">' + phase.name + '</h5>';
      html += '<div class="prediction-knockout-matches">';

      for (var m = 0; m < phase.matchCount; m++) {
        var matchKey = phaseKey + '-' + m;
        var teamA = roundMatches[phaseKey] ? (roundMatches[phaseKey][m] ? roundMatches[phaseKey][m][0] : null) : null;
        var teamB = roundMatches[phaseKey] ? (roundMatches[phaseKey][m] ? roundMatches[phaseKey][m][1] : null) : null;

        // 尝试从保存的结果中恢复
        if (phaseSaved[m]) {
          teamA = phaseSaved[m][0];
          teamB = phaseSaved[m][1];
        }

        var teamAName = teamA ? getTeamName(teamA) : '待定';
        var teamBName = teamB ? getTeamName(teamB) : '待定';
        var selectedWinner = '';

        // 检查是否已有选择
        var allSavedKnockout = safeGetJSON(STORAGE_KEY_FULL);
        if (allSavedKnockout && allSavedKnockout.knockout && allSavedKnockout.knockout.winners) {
          selectedWinner = allSavedKnockout.knockout.winners[matchKey] || '';
        }

        html += '<div class="prediction-knockout-match" data-match="' + matchKey + '">';
        html += '<span class="prediction-knockout-team' + (selectedWinner === 'A' ? ' prediction-knockout-team--winner' : '') + '" data-match="' + matchKey + '" data-side="A">' + teamAName + '</span>';
        html += '<span class="prediction-knockout-vs">vs</span>';
        html += '<span class="prediction-knockout-team' + (selectedWinner === 'B' ? ' prediction-knockout-team--winner' : '') + '" data-match="' + matchKey + '" data-side="B">' + teamBName + '</span>';
        html += '</div>';
      }

      html += '</div></div>';
    }

    container.innerHTML = html;

    // 绑定点击选择晋级
    var allTeams = container.querySelectorAll('.prediction-knockout-team');
    for (var t = 0; t < allTeams.length; t++) {
      allTeams[t].addEventListener('click', function () {
        var matchKey = this.getAttribute('data-match');
        var side = this.getAttribute('data-side');
        var matchEls = container.querySelectorAll('.prediction-knockout-team[data-match="' + matchKey + '"]');
        for (var e = 0; e < matchEls.length; e++) {
          matchEls[e].classList.remove('prediction-knockout-team--winner');
        }
        this.classList.add('prediction-knockout-team--winner');
      });
    }
  }

  function generateBracketMatches(groupsData) {
    var matches = {
      round32: [],
      round16: [],
      quarter: [],
      semi: [],
      final: []
    };

    // 生成1/16决赛对阵（16场比赛，32个位置）
    // 对阵模式：A1-B2, C1-D2, E1-F2, G1-H2, I1-J2, K1-L2, M1-N2, O1-P2
    //           B1-A2, D1-C2, F1-E2, H1-G2, J1-I2, L1-K2, N1-M2, P1-O2
    var pairings = [];

    // 上区
    var topPairs = [['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H']];
    var bottomPairs = [['I', 'J'], ['K', 'L'], ['M', 'N'], ['O', 'P']];

    function addMatch(g1, r1, g2, r2) {
      var t1 = (groupsData[g1] && groupsData[g1].length > (r1 - 1)) ? groupsData[g1][r1 - 1] : g1 + r1;
      var t2 = (groupsData[g2] && groupsData[g2].length > (r2 - 1)) ? groupsData[g2][r2 - 1] : g2 + r2;
      pairings.push([t1, t2]);
    }

    // 1/16决赛
    for (var i = 0; i < topPairs.length; i++) {
      var pair = topPairs[i];
      addMatch(pair[0], 1, pair[1], 2);
      addMatch(pair[1], 1, pair[0], 2);
    }
    for (var j = 0; j < bottomPairs.length; j++) {
      var bp = bottomPairs[j];
      addMatch(bp[0], 1, bp[1], 2);
      addMatch(bp[1], 1, bp[0], 2);
    }

    matches.round32 = pairings;

    // 1/8决赛（8场）
    matches.round16 = [];
    for (var k = 0; k < 8; k++) {
      matches.round16.push(['R32W' + (k * 2 + 1), 'R32W' + (k * 2 + 2)]);
    }
    // 1/4决赛（4场）
    matches.quarter = [
      ['R16W1', 'R16W2'],
      ['R16W3', 'R16W4'],
      ['R16W5', 'R16W6'],
      ['R16W7', 'R16W8']
    ];
    // 半决赛（2场）
    matches.semi = [
      ['QFW1', 'QFW2'],
      ['QFW3', 'QFW4']
    ];
    // 决赛（1场），季军赛不包含
    matches.final = [['SFW1', 'SFW2']];

    return matches;
  }

  function saveFullPrediction() {
    var savedGroups = {};
    var groupCards = document.querySelectorAll('.prediction-group-card');

    for (var g = 0; g < groupCards.length; g++) {
      var card = groupCards[g];
      var group = card.getAttribute('data-group');
      var checkboxes = card.querySelectorAll('.prediction-group-input:checked');
      var selected = [];
      for (var c = 0; c < checkboxes.length; c++) {
        selected.push(checkboxes[c].getAttribute('data-team'));
      }
      savedGroups[group] = selected;
    }

    // 收集淘汰赛选择
    var knockoutWinners = {};
    var winnerEls = document.querySelectorAll('.prediction-knockout-team--winner');
    for (var w = 0; w < winnerEls.length; w++) {
      var el = winnerEls[w];
      var matchKey = el.getAttribute('data-match');
      var side = el.getAttribute('data-side');
      knockoutWinners[matchKey] = side;
    }

    var prediction = {
      groups: savedGroups,
      knockout: {
        winners: knockoutWinners
      },
      savedAt: new Date().toISOString()
    };

    safeSetJSON(STORAGE_KEY_FULL, prediction);
    alert('预测已保存');
  }

  function renderFullPrediction() {
    renderGroupPredictions();
    renderKnockoutPredictions();
  }

  /* ================================================================
     准确率展示区
     ================================================================ */

  function renderAccuracyArea() {
    var container = document.getElementById('prediction-accuracy');
    if (container) {
      // 静态占位文本，比赛开始前不变
      // 已在 HTML 中预设
    }
  }

  /* ================================================================
     初始化入口
     ================================================================ */

  function initPredictions() {
    renderDailyGuess();
    renderFullPrediction();
    renderAccuracyArea();

    // 保存按钮事件
    var saveBtn = document.getElementById('prediction-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveFullPrediction);
    }
  }

  /* ================================================================
     注册导航钩子
     ================================================================ */

  if (window.WorldCupNav && typeof window.WorldCupNav.registerSwitchHook === 'function') {
    window.WorldCupNav.registerSwitchHook('after', 'predictions', initPredictions);
  }

  // 页面首次加载时如果预测模块可见（hash 直达），也初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (window.location.hash === '#predictions') {
        initPredictions();
      }
    });
  } else {
    if (window.location.hash === '#predictions') {
      initPredictions();
    }
  }
})();