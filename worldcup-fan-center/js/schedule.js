/**
 * schedule.js - 赛程日历模块（含迷你地图）
 * World Cup Fan Center
 *
 * 数据来源：window.__SCHEDULE_DATA__ / __VENUES_DATA__ / __TEAMS_DATA__（内联于 index.html）
 * 功能：
 * 1. 左侧赛程卡片列表（按日期分组）
 * 2. 右侧迷你地图（每日比赛密度 + 主队筛选）
 * 3. 三个筛选下拉框（日期/小组/城市）
 * 4. 双时区提示行
 */
(function () {
  'use strict';

  /* ================================================================
     数据缓存（从 window 内联数据读取）
     ================================================================ */
  var _scheduleData = null;
  var _venuesData = null;
  var _teamsData = null;

  /** 淘汰赛阶段缩写映射 */
  var KO_SHORT_MAP = {
    '1/16决赛': 'R32',
    '1/8决赛': 'R16',
    '1/4决赛': 'QF',
    '半决赛': 'SF',
    '季军赛': '3rd',
    '决赛': 'Final'
  };

  function getPhaseShort(phase) {
    return KO_SHORT_MAP[phase] || phase;
  }

  /** 国旗 emoji 映射 */
  var FLAG_MAP = {
    MEX: '\uD83C\uDDF2\uD83C\uDDFD', URU: '\uD83C\uDDFA\uD83C\uDDFE', NGA: '\uD83C\uDDF3\uD83C\uDDEC', FRA: '\uD83C\uDDEB\uD83C\uDDF7', SEN: '\uD83C\uDDF8\uD83C\uDDF3', PER: '\uD83C\uDDF5\uD83C\uDDEA',
    ARG: '\uD83C\uDDE6\uD83C\uDDF7', GER: '\uD83C\uDDE9\uD83C\uDDEA', ALG: '\uD83C\uDDE9\uD83C\uDDFF', USA: '\uD83C\uDDFA\uD83C\uDDF8', CRO: '\uD83C\uDDED\uD83C\uDDF7', QAT: '\uD83C\uDDF6\uD83C\uDDE6',
    ESP: '\uD83C\uDDEA\uD83C\uDDF8', JPN: '\uD83C\uDDEF\uD83C\uDDF5', EGY: '\uD83C\uDDEA\uD83C\uDDEC', ENG: '\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F', MAR: '\uD83C\uDDF2\uD83C\uDDE6', PAN: '\uD83C\uDDF5\uD83C\uDDE6',
    BRA: '\uD83C\uDDE7\uD83C\uDDF7', DEN: '\uD83C\uDDE9\uD83C\uDDF0', CIV: '\uD83C\uDDE8\uD83C\uDDEE', NED: '\uD83C\uDDF3\uD83C\uDDF1', AUS: '\uD83C\uDDE6\uD83C\uDDFA', CHN: '\uD83C\uDDE8\uD83C\uDDF3',
    POR: '\uD83C\uDDF5\uD83C\uDDF9', POL: '\uD83C\uDDF5\uD83C\uDDF1', ECU: '\uD83C\uDDEA\uD83C\uDDE8', ITA: '\uD83C\uDDEE\uD83C\uDDF9', CMR: '\uD83C\uDDE8\uD83C\uDDF2', BEL: '\uD83C\uDDE7\uD83C\uDDEA',
    KOR: '\uD83C\uDDF0\uD83C\uDDF7', SER: '\uD83C\uDDF7\uD83C\uDDF8', UAE: '\uD83C\uDDE6\uD83C\uDDEA', COL: '\uD83C\uDDE8\uD83C\uDDF4', SUI: '\uD83C\uDDE8\uD83C\uDDED', CAN: '\uD83C\uDDE8\uD83C\uDDE6',
    UZB: '\uD83C\uDDFA\uD83C\uDDFF', JAM: '\uD83C\uDDEF\uD83C\uDDF2', GRE: '\uD83C\uDDEC\uD83C\uDDF7', CRC: '\uD83C\uDDE8\uD83C\uDDF7', TUR: '\uD83C\uDDF9\uD83C\uDDF7', VEN: '\uD83C\uDDFB\uD83C\uDDEA',
    KSA: '\uD83C\uDDF8\uD83C\uDDE6', UKR: '\uD83C\uDDFA\uD83C\uDDE6', GHA: '\uD83C\uDDEC\uD83C\uDDED', IRN: '\uD83C\uDDEE\uD83C\uDDF7', WAL: '\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73\uDB40\uDC7F', TUN: '\uD83C\uDDF9\uD83C\uDDF3'
  };

  /** 场馆城市 -> UTC 偏移 */
  var CITY_OFFSET_MAP = {
    '墨西哥城': -6, '纽约/新泽西': -4, '达拉斯': -5, '堪萨斯城': -5, '休斯顿': -5,
    '亚特兰大': -4, '洛杉矶': -7, '波士顿': -4, '西雅图': -7, '旧金山湾区': -7,
    '费城': -4, '迈阿密': -4, '温哥华': -7, '蒙特雷': -6, '瓜达拉哈拉': -6, '多伦多': -4
  };

  /* ================================================================
     工具函数
     ================================================================ */
  function getVenueById(id) {
    if (!_venuesData) return null;
    for (var i = 0; i < _venuesData.length; i++) {
      if (_venuesData[i].id === id) return _venuesData[i];
    }
    return null;
  }

  function getTeamById(id) {
    if (!_teamsData) return null;
    for (var i = 0; i < _teamsData.length; i++) {
      if (_teamsData[i].id === id) return _teamsData[i];
    }
    return null;
  }

  function getVenueName(venueId) {
    var v = getVenueById(venueId);
    return v ? v.name : venueId;
  }

  function getVenueCity(venueId) {
    var v = getVenueById(venueId);
    return v ? v.city : '';
  }

  function getVenueOffset(venueId) {
    var city = getVenueCity(venueId);
    return CITY_OFFSET_MAP[city] !== undefined ? CITY_OFFSET_MAP[city] : null;
  }

  function getTeamName(teamId) {
    var t = getTeamById(teamId);
    return t ? t.name : teamId;
  }

  function getTeamFlag(teamId) {
    return FLAG_MAP[teamId] || '';
  }

  function extractGroup(phase) {
    var match = phase && phase.match(/小组赛([A-P])组/);
    return match ? match[1] : null;
  }

  function formatDateHeader(dateStr) {
    var parts = dateStr.split('-');
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);
    var d = new Date(parseInt(parts[0], 10), month - 1, day);
    var weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return month + '月' + day + '日 ' + weekdays[d.getDay()];
  }

  function calcLocalTime(beijingTime, offset) {
    if (offset === null || offset === undefined) return null;
    var parts = beijingTime.split(':');
    var hours = parseInt(parts[0], 10);
    var minutes = parseInt(parts[1], 10);
    var diff = offset - 8;
    var localHours = hours + diff;
    if (localHours < 0) localHours += 24;
    if (localHours >= 24) localHours -= 24;
    var hh = (localHours < 10 ? '0' : '') + localHours;
    var mm = (minutes < 10 ? '0' : '') + minutes;
    return hh + ':' + mm;
  }

  /* ================================================================
     渲染：左侧赛程卡片列表
     ================================================================ */
  function renderMatchCard(m) {
    var groupName = extractGroup(m.phase);
    var venueName = getVenueName(m.venue);
    var venueCity = getVenueCity(m.venue);
    var offset = getVenueOffset(m.venue);
    var localTime = calcLocalTime(m.time, offset);
    var teams = m.teams || [];
    var hasTeams = teams.length >= 2;

    var team1Display, team2Display;
    if (hasTeams) {
      team1Display = getTeamFlag(teams[0]) + ' ' + getTeamName(teams[0]);
      team2Display = getTeamFlag(teams[1]) + ' ' + getTeamName(teams[1]);
    } else {
      team1Display = '<span class="schedule-card__tbd">待定</span>';
      team2Display = '<span class="schedule-card__tbd">待定</span>';
    }

    var groupBadge = groupName
      ? '<span class="schedule-card__group-badge">' + groupName + '组</span>'
      : '<span class="schedule-card__group-badge schedule-card__group-badge--knockout">' + getPhaseShort(m.phase) + '</span>';

    var localTimeHtml = localTime
      ? '<span class="schedule-card__local-time">当地时间 ' + localTime + '</span>'
      : '';

    var venueHtml = venueName
      ? '<span class="schedule-card__venue">' + venueName + (venueCity ? '（' + venueCity + '）' : '') + '</span>'
      : '';

    return '<div class="schedule-card">'
      + '<div class="schedule-card__top">' + groupBadge + '</div>'
      + '<div class="schedule-card__teams">'
      + '<span class="schedule-card__team schedule-card__team--home">' + team1Display + '</span>'
      + '<span class="schedule-card__vs">vs</span>'
      + '<span class="schedule-card__team schedule-card__team--away">' + team2Display + '</span>'
      + '</div>'
      + '<div class="schedule-card__meta">'
      + '<span class="schedule-card__time">▢ 北京时间 ' + m.time + '</span>'
      + localTimeHtml
      + venueHtml
      + '</div>'
      + '</div>';
  }

  function renderList(scheduleData) {
    var container = document.getElementById('schedule-list');
    if (!container) return;

    if (!scheduleData || scheduleData.length === 0) {
      container.innerHTML = '<p class="schedule-loading">没有符合条件的比赛</p>';
      return;
    }

    var groups = {};
    scheduleData.forEach(function (m) {
      if (!groups[m.date]) groups[m.date] = [];
      groups[m.date].push(m);
    });

    var sortedDates = Object.keys(groups).sort();
    var html = '';

    sortedDates.forEach(function (date) {
      html += '<div class="schedule-date-group" data-date="' + date + '">';
      html += '<h3 class="schedule-date-header">' + formatDateHeader(date) + '</h3>';
      html += '<div class="schedule-cards">';
      groups[date].forEach(function (m) { html += renderMatchCard(m); });
      html += '</div>';
      html += '</div>';
    });

    container.innerHTML = html;
  }

  /* ================================================================
     滚动驱动高亮：完整可见卡片最多的日期分组高亮
     - 平局取第一个（> 严格大于保证）
     - 无完整可见卡片时全部取消
     ================================================================ */
  function setupDateObserver() {
    var wrapper = document.getElementById('schedule-list-wrapper');
    if (!wrapper) return;

    function updateActiveGroup() {
      var wrapperRect = wrapper.getBoundingClientRect();
      var groups = document.querySelectorAll('.schedule-date-group');
      var maxCount = 0;
      var bestGroup = null;

      groups.forEach(function (group) {
        var cards = group.querySelectorAll('.schedule-card');
        var visibleCount = 0;

        cards.forEach(function (card) {
          var cardRect = card.getBoundingClientRect();
          // 卡片完全处于 wrapper 视口内
          if (cardRect.top >= wrapperRect.top && cardRect.bottom <= wrapperRect.bottom) {
            visibleCount++;
          }
        });

        if (visibleCount > maxCount) {
          maxCount = visibleCount;
          bestGroup = group;
        }
      });

      // 全部取消高亮
      groups.forEach(function (g) { g.classList.remove('active-date-group'); });

      // 高亮最佳分组（0 可见卡片时 bestGroup 为 null）
      if (bestGroup) {
        bestGroup.classList.add('active-date-group');
      }
    }

    updateActiveGroup();
    wrapper.addEventListener('scroll', updateActiveGroup, { passive: true });
    window.addEventListener('resize', updateActiveGroup, { passive: true });
  }

  /* ================================================================
     渲染：右侧迷你地图时间线
     ================================================================ */
  function renderMinimap(scheduleData) {
    var container = document.getElementById('minimap-timeline');
    if (!container) return;

    // 按日期统计比赛数
    var dayCount = {};
    scheduleData.forEach(function (m) {
      dayCount[m.date] = (dayCount[m.date] || 0) + 1;
    });

    var sortedDates = Object.keys(dayCount).sort();
    if (sortedDates.length === 0) {
      container.innerHTML = '<p class="minimap__empty">无比赛数据</p>';
      return;
    }

    var html = '';

    sortedDates.forEach(function (date) {
      var count = dayCount[date];
      var sizeClass = count <= 2 ? 's' : (count <= 3 ? 'm' : 'l');

      var parts = date.split('-');
      var label = parseInt(parts[1], 10) + '/' + parseInt(parts[2], 10);

      html += '<div class="minimap__day" title="' + formatDateHeader(date) + ' - ' + count + '场比赛">'
        + '<span class="minimap__dot minimap__dot--' + sizeClass + '"></span>'
        + '<span class="minimap__label">' + label + '</span>'
        + '</div>';
    });

    container.innerHTML = html;
  }

  /* ================================================================
     筛选器
     ================================================================ */
  function getAvailableDates() {
    var set = {};
    _scheduleData.forEach(function (m) { set[m.date] = true; });
    return Object.keys(set).sort();
  }

  function getAvailableGroups() {
    var set = {};
    _scheduleData.forEach(function (m) {
      var g = extractGroup(m.phase);
      if (g) set[g] = true;
    });
    return Object.keys(set).sort();
  }

  function getAvailableCities() {
    var set = {};
    _scheduleData.forEach(function (m) {
      var city = getVenueCity(m.venue);
      if (city) set[city] = true;
    });
    return Object.keys(set).sort();
  }

  function populateSelect(id, options, labelFn) {
    var select = document.getElementById(id);
    if (!select) return;
    // 清除除第一个外的所有选项
    while (select.options.length > 1) select.remove(1);
    options.forEach(function (val) {
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = labelFn ? labelFn(val) : val;
      select.appendChild(opt);
    });
  }

  function populateFilters() {
    if (!_scheduleData) return;
    populateSelect('filter-date', getAvailableDates(), formatDateHeader);
    populateSelect('filter-group', getAvailableGroups(), function (g) { return g + '组'; });
    populateSelect('filter-city', getAvailableCities(), function (c) { return c; });
  }

  function getFilteredData() {
    if (!_scheduleData) return [];

    var dateVal = document.getElementById('filter-date') ? document.getElementById('filter-date').value : '';
    var groupVal = document.getElementById('filter-group') ? document.getElementById('filter-group').value : '';
    var cityVal = document.getElementById('filter-city') ? document.getElementById('filter-city').value : '';

    return _scheduleData.filter(function (m) {
      if (dateVal && m.date !== dateVal) return false;
      if (groupVal && extractGroup(m.phase) !== groupVal) return false;
      if (cityVal && getVenueCity(m.venue) !== cityVal) return false;
      return true;
    });
  }

  function applyFilters() {
    var filtered = getFilteredData();
    renderList(filtered);
    setupDateObserver();
    renderMinimap(filtered);
  }

  function bindFilters() {
    var dateSelect = document.getElementById('filter-date');
    var groupSelect = document.getElementById('filter-group');
    var citySelect = document.getElementById('filter-city');
    if (dateSelect) dateSelect.addEventListener('change', applyFilters);
    if (groupSelect) groupSelect.addEventListener('change', applyFilters);
    if (citySelect) citySelect.addEventListener('change', applyFilters);
  }

  /* ================================================================
     迷你地图"仅显示主队"切换
     ================================================================ */
  function bindMinimapToggle() {
    var checkbox = document.getElementById('minimap-fav-only');
    if (!checkbox) return;
    checkbox.addEventListener('change', function () {
      var filtered = getFilteredData();
      if (checkbox.checked) {
        // 获取用户主队 ID
        var favTeamId = null;
        try {
          var stored = localStorage.getItem('wc_favorite_team');
          if (stored) favTeamId = stored;
        } catch (e) { /* ignore */ }

        if (favTeamId) {
          filtered = filtered.filter(function (m) {
            return m.teams && m.teams.indexOf(favTeamId) >= 0;
          });
        }
      }
      renderMinimap(filtered);
    });
  }

  /* ================================================================
     模块初始化入口
     ================================================================ */
  function init() {
    // 从内联数据读取
    _scheduleData = window.__SCHEDULE_DATA__ || [];
    _venuesData = window.__VENUES_DATA__ || [];
    _teamsData = window.__TEAMS_DATA__ || [];

    if (!_scheduleData.length) {
      var listEl = document.getElementById('schedule-list');
      if (listEl) listEl.innerHTML = '<p class="schedule-loading schedule-loading--error">赛程数据不可用，请刷新页面重试。</p>';
      return;
    }

    populateFilters();
    var filtered = getFilteredData();
    renderList(filtered);
    setupDateObserver();
    renderMinimap(filtered);
    bindFilters();
    bindMinimapToggle();
  }

  /* ================================================================
     导航钩子注册
     ================================================================ */
  var _inited = false;

  function ensureInit() {
    if (!_inited) {
      _inited = true;
      init();
    }
  }

  function registerHooks() {
    if (!window.WorldCupNav || !window.WorldCupNav.registerSwitchHook) {
      setTimeout(registerHooks, 150);
      return;
    }
    window.WorldCupNav.registerSwitchHook('after', 'schedule', ensureInit);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      registerHooks();
      setTimeout(function () {
        var current = window.WorldCupNav ? window.WorldCupNav.getCurrentSection() : null;
        if (current === 'schedule' || window.location.hash === '#schedule') ensureInit();
      }, 100);
    });
  } else {
    registerHooks();
    setTimeout(function () {
      var current = window.WorldCupNav ? window.WorldCupNav.getCurrentSection() : null;
      if (current === 'schedule' || window.location.hash === '#schedule') ensureInit();
    }, 100);
  }

  window.WorldCupSchedule = { init: init };
})();