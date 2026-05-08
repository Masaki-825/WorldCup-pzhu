/**
 * dashboard.js - 仪表盘模块
 * World Cup Fan Center
 *
 * 功能：
 * 1. 2026 美加墨世界杯场馆地图（Tableau Public 嵌入）
 * 2. 球迷时区表（4 时区实时时间 + 昼夜指示）
 * 3. 主队信息卡（读取设置中的主队，展示下一场比赛）
 */
(function () {
  'use strict';

  /* ================================================================
     数据缓存层（顶层缓存对象，只 fetch 一次）
     ================================================================ */
  const DashboardDataStore = {
    teams: null,
    venues: null,
    schedule: null,
    loaded: false
  };

  /** 一次性加载所有数据 */
  async function loadAllData() {
    if (DashboardDataStore.loaded) return;
    try {
      const [teamsRes, venuesRes, scheduleRes] = await Promise.all([
        fetch('data/teams.json'),
        fetch('data/venues.json'),
        fetch('data/schedule.json')
      ]);
      DashboardDataStore.teams = await teamsRes.json();
      DashboardDataStore.venues = await venuesRes.json();
      DashboardDataStore.schedule = await scheduleRes.json();
      DashboardDataStore.loaded = true;
      console.log('仪表盘数据已加载（' + DashboardDataStore.teams.length + ' 支球队, ' +
        DashboardDataStore.venues.length + ' 个场馆, ' +
        DashboardDataStore.schedule.length + ' 场比赛）。');
    } catch (err) {
      console.error('仪表盘数据加载失败：', err);
    }
  }

  /* ================================================================
     1. 球迷时区表
     ================================================================ */

  /** 4 个时区的配置 */
  const TIMEZONE_CONFIGS = [
    { label: '北京时间', city: '北京', timezone: 'Asia/Shanghai', offsetBeijing: 0 },
    { label: '美国东部', city: '纽约', timezone: 'America/New_York', offsetBeijing: -12 },
    { label: '美国西部', city: '洛杉矶', timezone: 'America/Los_Angeles', offsetBeijing: -15 },
    { label: '墨西哥中部', city: '墨西哥城', timezone: 'America/Mexico_City', offsetBeijing: -14 }
  ];

  /**
   * 判断某个时间的昼夜（6:00-18:00 为日间）
   * @param {Date} date
   * @returns {'day'|'night'}
   */
  function getDayNight(date) {
    var hours = date.getHours();
    return (hours >= 6 && hours < 18) ? 'day' : 'night';
  }

  /** 渲染时区表 */
  function renderTimezoneStrip() {
    var container = document.getElementById('timezone-list');
    if (!container) return;

    container.innerHTML = '';

    TIMEZONE_CONFIGS.forEach(function (cfg) {
      var now = new Date();

      // 使用 Intl.DateTimeFormat 获取各时区时间
      var options = { timeZone: cfg.timezone, hour: '2-digit', minute: '2-digit', hour12: false };
      var parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
      var hourStr = '00', minuteStr = '00';
      parts.forEach(function (p) {
        if (p.type === 'hour') hourStr = p.value;
        if (p.type === 'minute') minuteStr = p.value;
      });

      // 构造该时区的 Date 对象用于判断昼夜
      var tzDate = new Date(now.toLocaleString('en-US', { timeZone: cfg.timezone }));
      var dn = getDayNight(tzDate);

      var item = document.createElement('div');
      item.className = 'timezone-item timezone-item--' + dn;

      var citySpan = document.createElement('span');
      citySpan.className = 'timezone-item__city';
      citySpan.textContent = cfg.city;

      var timeSpan = document.createElement('span');
      timeSpan.className = 'timezone-item__time';
      timeSpan.textContent = hourStr + ':' + minuteStr;

      var iconSpan = document.createElement('span');
      iconSpan.className = 'timezone-item__icon';
      iconSpan.textContent = dn === 'day' ? '\u2600\uFE0F' : '\uD83C\uDF19';

      item.appendChild(citySpan);
      item.appendChild(timeSpan);
      item.appendChild(iconSpan);

      // 时差偏移文字（红色，括号内）—— 北京时区不显示
      var offsetVal = cfg.offsetBeijing;
      if (offsetVal !== 0) {
        var offsetSpan = document.createElement('span');
        offsetSpan.className = 'timezone-item__offset';
        if (offsetVal > 0) {
          offsetSpan.textContent = '(早北京时间 ' + offsetVal + ' 小时)';
        } else {
          offsetSpan.textContent = '(晚北京时间 ' + Math.abs(offsetVal) + ' 小时)';
        }
        item.appendChild(offsetSpan);
      }
      container.appendChild(item);
    });
  }

  /** 时区表定时刷新 */
  var timezoneTimer = null;
  function startTimezoneTimer() {
    stopTimezoneTimer();
    renderTimezoneStrip();
    timezoneTimer = setInterval(renderTimezoneStrip, 10000); // 每 10 秒刷新
  }
  function stopTimezoneTimer() {
    if (timezoneTimer) {
      clearInterval(timezoneTimer);
      timezoneTimer = null;
    }
  }

  /* ================================================================
     2. 主队信息卡
     ================================================================ */

  /**
   * 从 schedule.json 中找到某支球队的下一场比赛
   * 适配 schedule.json 实际格式：{ teams: [home, away], venue: "venue-01", ... }
   * @param {string} teamId - 球队 id（如 'ARG'）
   * @returns {object|null} 返回增强后的比赛对象（含 home/away/venueName 等字段）
   */
  function findNextMatch(teamId) {
    var schedule = DashboardDataStore.schedule;
    if (!schedule || !schedule.length) return null;

    // 筛选出该球队参与且尚未开始的比赛，按日期排序取第一条
    var upcoming = schedule
      .filter(function (m) {
        if (m.status === 'finished') return false;
        // m.teams = [home, away]
        if (!m.teams || m.teams.length < 2) return false;
        return m.teams[0] === teamId || m.teams[1] === teamId;
      })
      .sort(function (a, b) {
        var da = (a.date || '') + (a.time || '');
        var db = (b.date || '') + (b.time || '');
        return da.localeCompare(db);
      });
    var match = upcoming[0] || null;

    if (match) {
      // 增强：添加 home/away 字段和 venueName
      match._home = match.teams[0];
      match._away = match.teams[1];
      match._venueName = resolveVenueName(match.venue);
    }
    return match;
  }

  /**
   * 根据 venue ID 查找场馆名称
   * @param {string} venueId - e.g. 'venue-01'
   * @returns {string}
   */
  function resolveVenueName(venueId) {
    var venues = DashboardDataStore.venues;
    if (!venues) return venueId;
    for (var i = 0; i < venues.length; i++) {
      if (venues[i].id === venueId) return venues[i].name;
    }
    return venueId;
  }

  /**
   * 根据 teamId 查找球队名称
   * @param {string} teamId
   * @returns {string}
   */
  function getTeamName(teamId) {
    var teams = DashboardDataStore.teams;
    if (!teams) return teamId;
    for (var i = 0; i < teams.length; i++) {
      if (teams[i].id === teamId) return teams[i].name;
    }
    return teamId;
  }

  /** 内置映射 - teamId -> 国旗 emoji */
  var FLAG_MAP = {
    MEX: '🇲🇽', URU: '🇺🇾', NGA: '🇳🇬', FRA: '🇫🇷', SEN: '🇸🇳', PER: '🇵🇪',
    ARG: '🇦🇷', GER: '🇩🇪', ALG: '🇩🇿', USA: '🇺🇸', CRO: '🇭🇷', QAT: '🇶🇦',
    ESP: '🇪🇸', JPN: '🇯🇵', EGY: '🇪🇬', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', MAR: '🇲🇦', PAN: '🇵🇦',
    BRA: '🇧🇷', DEN: '🇩🇰', CIV: '🇨🇮', NED: '🇳🇱', AUS: '🇦🇺', CHN: '🇨🇳',
    POR: '🇵🇹', POL: '🇵🇱', ECU: '🇪🇨', ITA: '🇮🇹', CMR: '🇨🇲', BEL: '🇧🇪',
    KOR: '🇰🇷', SER: '🇷🇸', UAE: '🇦🇪', COL: '🇨🇴', SUI: '🇨🇭', CAN: '🇨🇦',
    UZB: '🇺🇿', JAM: '🇯🇲', GRE: '🇬🇷', CRC: '🇨🇷', TUR: '🇹🇷', VEN: '🇻🇪',
    KSA: '🇸🇦', UKR: '🇺🇦', GHA: '🇬🇭', IRN: '🇮🇷', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', TUN: '🇹🇳'
  };

  /** 查找球队的国旗 emoji */
  function getTeamFlag(teamId) {
    if (FLAG_MAP[teamId]) return FLAG_MAP[teamId];
    var teams = DashboardDataStore.teams;
    if (!teams) return null;
    for (var i = 0; i < teams.length; i++) {
      if (teams[i].id === teamId) return FLAG_MAP[teamId] || null;
    }
    return null;
  }

  /** 从 teams.json 读取 team.group 字段 */
  function getTeamGroup(teamId) {
    var teams = DashboardDataStore.teams;
    if (!teams) return null;
    for (var i = 0; i < teams.length; i++) {
      if (teams[i].id === teamId) return teams[i].group || null;
    }
    return null;
  }

  /** 渲染主队信息卡 */
  function renderTeamCard() {
    var body = document.getElementById('team-card-body');
    if (!body) return;

    var favorite = null;
    // 从 localStorage 或 WorldCupSettings API 获取主队
    if (window.WorldCupSettings && window.WorldCupSettings.getFavoriteTeam) {
      favorite = window.WorldCupSettings.getFavoriteTeam();
    }
    if (!favorite) {
      try { favorite = localStorage.getItem('favorite-team'); } catch (e) { /* ignore */ }
    }

    if (!favorite) {
      body.innerHTML = '<p class="team-card__placeholder">您看好哪支球队,可点击选择主队——<a href="#settings" class="team-card__link" data-section="settings">设置</a></p>';
      // 绑定点击跳转
      var link = body.querySelector('.team-card__link');
      if (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          var navLinks = document.querySelectorAll('.nav-link');
          navLinks.forEach(function (nl) { nl.classList.remove('active'); });
          var settingsLink = document.querySelector('.nav-link[data-section="settings"]');
          if (settingsLink) settingsLink.classList.add('active');
          var allSections = document.querySelectorAll('main section');
          allSections.forEach(function (s) { s.style.display = 'none'; });
          var settingsSection = document.getElementById('settings');
          if (settingsSection) settingsSection.style.display = '';
          if (history.pushState) history.pushState(null, null, '#settings');
        });
      }
      return;
    }

    // 确保数据已加载
    if (!DashboardDataStore.loaded) {
      body.innerHTML = '<p class="team-card__placeholder">正在加载数据...</p>';
      return;
    }

    var teamName = getTeamName(favorite);
    var nextMatch = findNextMatch(favorite);

    // 查找球队的 flag emoji 和 group 信息
    var flagEmoji = getTeamFlag(favorite);
    var groupInfo = getTeamGroup(favorite);

    var html = '';
    html += '<div class="team-card__team-name">';
    if (flagEmoji) html += '<span class="team-card__flag">' + flagEmoji + '</span>';
    html += teamName + '</div>';
    if (groupInfo) {
      html += '<div class="team-card__group">小组 ' + groupInfo + '</div>';
    }

    if (nextMatch) {
      var homeName = getTeamName(nextMatch._home);
      var awayName = getTeamName(nextMatch._away);
      var venueDisplay = nextMatch._venueName || nextMatch.venue || '';
      html += '<div class="team-card__next-match">';
      html += '<span class="team-card__match-label">下一场</span>';
      html += '<div class="team-card__match-teams">' + homeName + ' vs ' + awayName + '</div>';
      html += '<div class="team-card__match-info">';
      if (nextMatch.date) html += '\uD83D\uDCC5 ' + nextMatch.date + ' ' + (nextMatch.time || '');
      if (venueDisplay) html += ' &nbsp;|&nbsp; \uD83C\uDFDF\uFE0F ' + venueDisplay;
      html += '</div>';
      html += '</div>';
    } else {
      html += '<p class="team-card__no-match">暂无后续比赛</p>';
    }

    body.innerHTML = html;
  }

  /* ================================================================
     仪表盘总初始化
     ================================================================ */

  async function initDashboard() {
    // 首次加载数据
    await loadAllData();

    // 渲染各模块
    renderTeamCard();
    startTimezoneTimer();
  }

  /** 离开仪表盘时停止定时器 */
  function leaveDashboard() {
    stopTimezoneTimer();
  }

  /* ================================================================
     注册导航钩子 + 暴露全局 API
     ================================================================ */

  function registerHooks() {
    if (!window.WorldCupNav || !window.WorldCupNav.registerSwitchHook) {
      console.warn('WorldCupNav 未就绪，仪表盘钩子注册推迟。');
      // 重试
      setTimeout(registerHooks, 200);
      return;
    }

    WorldCupNav.registerSwitchHook('after', 'dashboard', initDashboard);
    WorldCupNav.registerSwitchHook('before', 'dashboard', leaveDashboard);

    console.log('仪表盘钩子已注册。');
  }

  // 页面加载后注册
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      registerHooks();
      // 如果首次加载时已经在仪表盘，直接初始化
      var current = window.WorldCupNav ? window.WorldCupNav.getCurrentSection() : 'dashboard';
      // 等一小段时间确保 main.js 已初始化
      setTimeout(function () {
        if ((window.WorldCupNav ? window.WorldCupNav.getCurrentSection() : null) === 'dashboard' ||
            (!window.location.hash.replace('#', '') || window.location.hash === '#dashboard')) {
          initDashboard();
        }
      }, 100);
    });
  } else {
    registerHooks();
    setTimeout(function () {
      if ((window.WorldCupNav ? window.WorldCupNav.getCurrentSection() : null) === 'dashboard' ||
          (!window.location.hash.replace('#', '') || window.location.hash === '#dashboard')) {
        initDashboard();
      }
    }, 100);
  }

  // 暴露 API
  window.WorldCupDashboard = {
    init: initDashboard,
    renderTeamCard: renderTeamCard,
    renderTimezoneStrip: renderTimezoneStrip,
    loadAllData: loadAllData
  };
})();