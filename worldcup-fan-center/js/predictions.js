/**
 * predictions.js - 预测擂台全部逻辑
 * World Cup Fan Center
 *
 * 功能：
 * 1. 每日一猜：揭幕战比分预测，localStorage 持久化
 * 2. 小组出线预测：左右双栏（左55%勾选区 + 右45%图表区），16行对齐
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

    document.getElementById('daily-guess-match').innerHTML =
      '<div class="daily-guess__matchup">' +
        '<span class="daily-guess__team daily-guess__team--home">' + homeName + '</span>' +
        '<span class="daily-guess__vs">vs</span>' +
        '<span class="daily-guess__team daily-guess__team--away">' + awayName + '</span>' +
      '</div>' +
      '<p class="daily-guess__meta">' + phase + ' / ' + date + ' ' + time + ' (UTC+8)</p>';

    var saved = safeGetJSON(STORAGE_KEY_DAILY);

    if (saved && saved.matchId === match.id) {
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
     小组出线预测 - 左右双栏布局
     左 55%：16组勾选区（每行 3px 实线分隔，第8行后 6px）
     右 45%：图表卡片区（与左侧一一对齐）
     ================================================================ */

  var groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

  /**
   * 渲染单张图表卡片
   * @param {string} teamId 球队ID
   * @param {number} totalSelected 该组已选球队数（1 或 2）
   */
  function renderChartCard(teamId, totalSelected) {
    var teamName = getTeamName(teamId);
    var chartMap = window.__CHART_MAP__ || {};
    var base64 = chartMap[teamId];
    var cardClass = 'prediction-chart-card';
    if (totalSelected === 1) {
      cardClass += ' prediction-chart-card--single';
    } else {
      cardClass += ' prediction-chart-card--dual';
    }

    var html = '<div class="' + cardClass + '" data-team="' + teamId + '">';
    html += '<div class="prediction-chart-card__header">' + teamName + '</div>';
    html += '<div class="prediction-chart-card__body">';

    if (base64 && base64.indexOf('data:image/png;base64,') === 0) {
      html += '<img src="' + base64 + '" alt="' + teamName + ' 历史排名图表" class="prediction-chart-card__img" loading="lazy" onerror="this.parentElement.innerHTML=\'<p class=\\\'prediction-chart-card__error\\\'>暂无历史数据</p>\'">';
    } else if (base64) {
      html += '<img src="' + base64 + '" alt="' + teamName + ' 历史排名图表" class="prediction-chart-card__img" loading="lazy" onerror="this.parentElement.innerHTML=\'<p class=\\\'prediction-chart-card__error\\\'>暂无历史数据</p>\'">';
    } else {
      html += '<p class="prediction-chart-card__error">暂无历史数据</p>';
    }

    html += '</div></div>';
    return html;
  }

  /**
   * 更新指定组的右侧图表行
   */
  function updateChartRow(group) {
    var row = document.getElementById('chart-row-' + group);
    if (!row) return;

    var container = document.getElementById('prediction-groups');
    if (!container) return;

    var checkboxes = container.querySelectorAll('.prediction-group-input[data-group="' + group + '"]:checked');
    var selectedTeams = [];
    for (var c = 0; c < checkboxes.length; c++) {
      selectedTeams.push(checkboxes[c].getAttribute('data-team'));
    }

    var html = '';
    if (selectedTeams.length === 0) {
      html = '<div class="prediction-chart-empty" data-group="' + group + '"></div>';
    } else {
      for (var s = 0; s < selectedTeams.length; s++) {
        html += renderChartCard(selectedTeams[s], selectedTeams.length);
      }
    }
    row.innerHTML = html;
  }

  /**
   * 绑定复选框变更事件
   */
  function bindGroupCheckboxEvents(container) {
    var allCheckboxes = container.querySelectorAll('.prediction-group-input');
    for (var c = 0; c < allCheckboxes.length; c++) {
      allCheckboxes[c].addEventListener('change', function () {
        var group = this.getAttribute('data-group');
        var groupBoxes = container.querySelectorAll('.prediction-group-input[data-group="' + group + '"]');
        var checkedCount = 0;
        for (var b = 0; b < groupBoxes.length; b++) {
          if (groupBoxes[b].checked) checkedCount++;
        }
        // 每组最多选 2 支
        if (checkedCount > 2) {
          this.checked = false;
          checkedCount--;
        }
        // 更新计数显示
        var countEl = container.querySelector('.prediction-group-count[data-group="' + group + '"]');
        if (countEl) {
          countEl.textContent = '已选 ' + checkedCount + '/2';
        }
        // 同步更新右侧图表
        updateChartRow(group);
      });
    }
  }

  function renderGroupPredictions() {
    var container = document.getElementById('prediction-groups');
    var saved = safeGetJSON(STORAGE_KEY_FULL);
    var savedGroups = (saved && saved.groups) ? saved.groups : {};

    var html = '<div class="prediction-groups-cards">';

    for (var g = 0; g < groups.length; g++) {
      var group = groups[g];
      var teams = getGroupTeams(group);
      var checked = savedGroups[group] || [];
      var cardClass = 'prediction-group-card';
      if (g === 7) cardClass += ' prediction-group-card--major';

      // ---- 整张组卡片 ----
      html += '<div class="' + cardClass + '" data-group="' + group + '">';

      // 左侧 55%：勾选区
      html += '<div class="prediction-group-card__left">';
      html += '<span class="prediction-group-label">' + group + '组</span>';
      html += '<div class="prediction-group-teams">';
      for (var t = 0; t < teams.length; t++) {
        var team = teams[t];
        var isChecked = checked.indexOf(team.id) !== -1;
        html += '<label class="prediction-group-checkbox">' +
          '<input type="checkbox" class="prediction-group-input" data-group="' + group + '" data-team="' + team.id + '"' +
          (isChecked ? ' checked' : '') + '>' +
          '<span class="prediction-group-team-name">' + team.name + '</span>' +
        '</label>';
      }
      html += '<span class="prediction-group-count" data-group="' + group + '">已选 ' + checked.length + '/2</span>';
      html += '</div></div>';

      // 右侧 45%：图表区
      html += '<div class="prediction-group-card__right" data-group="' + group + '" id="chart-row-' + group + '">';
      if (checked.length === 0) {
        html += '<div class="prediction-chart-empty" data-group="' + group + '"></div>';
      } else {
        for (var rc = 0; rc < checked.length; rc++) {
          html += renderChartCard(checked[rc], checked.length);
        }
      }
      html += '</div>';

      html += '</div>'; // .prediction-group-card
    }

    html += '</div>'; // .prediction-groups-cards
    container.innerHTML = html;

    // 绑定复选框事件
    bindGroupCheckboxEvents(container);

    // 绑定保存按钮
    var saveBtn = document.getElementById('prediction-save-btn');
    if (saveBtn) {
      saveBtn.removeEventListener('click', saveFullPrediction);
      saveBtn.addEventListener('click', saveFullPrediction);
    }
  }

  /* ================================================================
     保存完整预测
     ================================================================ */

  function saveFullPrediction() {
    var savedGroups = {};
    var groupRows = document.querySelectorAll('.prediction-group-row');

    for (var g = 0; g < groupRows.length; g++) {
      var row = groupRows[g];
      var group = row.getAttribute('data-group');
      var checkboxes = row.querySelectorAll('.prediction-group-input:checked');
      var selected = [];
      for (var c = 0; c < checkboxes.length; c++) {
        selected.push(checkboxes[c].getAttribute('data-team'));
      }
      savedGroups[group] = selected;
    }

    var prediction = {
      groups: savedGroups,
      savedAt: new Date().toISOString()
    };

    safeSetJSON(STORAGE_KEY_FULL, prediction);

    // 按钮反馈
    var saveBtn = document.getElementById('prediction-save-btn');
    if (saveBtn) {
      var origText = saveBtn.textContent;
      saveBtn.textContent = '已保存';
      saveBtn.disabled = true;
      setTimeout(function () {
        saveBtn.textContent = origText;
        saveBtn.disabled = false;
      }, 1500);
    }
  }

  function renderFullPrediction() {
    renderGroupPredictions();
  }

  /* ================================================================
     准确率展示区
     ================================================================ */

  function renderAccuracyArea() {
    var container = document.getElementById('prediction-accuracy');
    if (!container) return;

    // 防止重复添加按钮
    if (document.getElementById('btn-generate-card')) return;

    var btn = document.createElement('button');
    btn.id = 'btn-generate-card';
    btn.className = 'btn btn--primary';
    btn.type = 'button';
    btn.textContent = '生成我的预测档案';
    btn.addEventListener('click', generatePredictionCard);
    container.appendChild(btn);
  }

  /* ================================================================
      生成我的预测档案 - 弹窗卡片
      ================================================================ */

  function generatePredictionCard() {
    // 收集数据
    var favoriteTeam = localStorage.getItem('favorite-team');
    var teamName = favoriteTeam ? getTeamName(favoriteTeam) : '未选择';

    var fullData = safeGetJSON(STORAGE_KEY_FULL);
    var groups = (fullData && fullData.groups) ? fullData.groups : {};

    var dateStr = new Date().toLocaleDateString('zh-CN');

    // 构建小组出线标签 HTML
    var groupTagsHtml = '';
    var groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    var hasAnyGroup = false;
    for (var g = 0; g < groupLetters.length; g++) {
      var gl = groupLetters[g];
      var selected = groups[gl];
      if (selected && selected.length > 0) {
        hasAnyGroup = true;
        var teamNames = [];
        for (var s = 0; s < selected.length; s++) {
          teamNames.push(getTeamName(selected[s]));
        }
        groupTagsHtml += '<span class="prediction-card__group-tag">' + gl + '组：' + teamNames.join('、') + '</span>';
      }
    }
    if (!hasAnyGroup) {
      groupTagsHtml = '<span class="prediction-card__group-tag">暂无预测</span>';
    }

    // 创建弹窗遮罩
    var overlay = document.createElement('div');
    overlay.className = 'prediction-card-overlay';

    // 创建卡片
    var card = document.createElement('div');
    card.className = 'prediction-card';
    card.innerHTML =
      '<button class="prediction-card__close" type="button" aria-label="关闭">&times;</button>' +
      '<div class="prediction-card__title">2026世界杯预测档案</div>' +
      '<div class="prediction-card__team">我的主队：' + teamName + '</div>' +
      '<div class="prediction-card__group-list">' + groupTagsHtml + '</div>' +
      '<div class="prediction-card__date">生成日期：' + dateStr + '</div>' +
      '<div class="prediction-card__footer">世界杯结束后回来验证</div>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // 关闭逻辑
    function closeModal() {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }

    // 点击遮罩层关闭（仅遮罩本身）
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // X 按钮关闭
    var closeBtn = card.querySelector('.prediction-card__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // ESC 键关闭
    function onKeydown(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', onKeydown);
      }
    }
    document.addEventListener('keydown', onKeydown);
  }

  /* ================================================================
     初始化入口
     ================================================================ */

  function initPredictions() {
    renderDailyGuess();
    renderFullPrediction();
    renderAccuracyArea();
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