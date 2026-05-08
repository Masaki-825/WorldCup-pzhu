/**
 * dashboard.js - 仪表盘模块
 * World Cup Fan Center
 *
 * 功能：
 * 1. 2026 美加墨世界杯场馆地图（三国轮廓 + 16 城市点）
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
     常量：16 城市坐标（手工计算，已修正）
     经度范围 -130° ~ -60° → x: 0% ~ 100%
     纬度范围 55° ~ 15° → y: 0% ~ 100%
     ================================================================ */
  const CITY_COORDS = {
    '墨西哥城':     { x: 43.8, y: 88.5 },
    '纽约/新泽西':  { x: 79.7, y: 35.5 },
    '达拉斯':       { x: 47.1, y: 55.0 },
    '堪萨斯城':     { x: 50.3, y: 39.5 },
    '休斯顿':       { x: 49.2, y: 63.0 },
    '亚特兰大':     { x: 65.0, y: 53.0 },
    '洛杉矶':       { x: 16.3, y: 52.5 },
    '波士顿':       { x: 84.0, y: 31.0 },
    '西雅图':       { x: 10.7, y: 17.5 },
    '旧金山湾区':   { x: 10.5, y: 42.8 },
    '费城':         { x: 78.0, y: 37.0 },
    '迈阿密':       { x: 71.0, y: 73.0 },
    '温哥华':       { x: 9.5,  y: 13.8 },
    '蒙特雷':       { x: 42.1, y: 73.0 },
    '瓜达拉哈拉':   { x: 37.5, y: 85.5 },
    '多伦多':       { x: 72.0, y: 28.0 }
  };

  /* ================================================================
     1. 场馆地图
     ================================================================ */

  /** 渲染地图：内联 SVG 三国轮廓 + HTML 城市点 */
  function renderVenueMap() {
    const canvas = document.getElementById('map-canvas');
    if (!canvas) return;

    // 清空
    canvas.innerHTML = '';

    // ---- 内联 SVG 三国轮廓（精细路径，viewBox 0 0 700 400）----
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 700 400');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.classList.add('map-svg');

    // 美国本土 + 阿拉斯加轮廓
    var usa = document.createElementNS(svgNS, 'path');
    usa.setAttribute('d',
      'M 70 72 L 35 140 L 56 200 L 126 232 L 154 180 L 196 208 L 245 232 L ' +
      '280 272 L 350 272 L 385 248 L 364 200 L 406 200 L 420 168 L 476 140 L ' +
      '504 120 L 546 152 L 574 140 L 588 168 L 574 220 L 560 248 L 518 288 L ' +
      '476 312 L 364 288 L 308 272 L 280 220 L 245 180 L 210 180 L 175 192 L ' +
      '154 160 L 105 140 L 70 72 Z');
    usa.classList.add('map-country-svg');
    usa.classList.add('map-country--usa');
    usa.setAttribute('stroke', '#1a6b3c');
    usa.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(usa);

    // 墨西哥轮廓
    var mexico = document.createElementNS(svgNS, 'path');
    mexico.setAttribute('d',
      'M 266 288 L 315 280 L 336 304 L 322 352 L 294 380 L 252 368 L 210 344 L 224 312 L 245 296 Z');
    mexico.classList.add('map-country-svg');
    mexico.classList.add('map-country--mex');
    mexico.setAttribute('stroke', '#1a6b3c');
    mexico.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(mexico);

    // 加拿大轮廓
    var canada = document.createElementNS(svgNS, 'path');
    canada.setAttribute('d',
      'M 35 32 L 126 16 L 210 32 L 315 20 L 420 32 L 518 20 L 595 48 L ' +
      '560 100 L 532 96 L 504 112 L 476 120 L 420 112 L 385 96 L 336 104 L ' +
      '280 88 L 224 100 L 175 88 L 126 100 L 84 80 L 56 56 Z');
    canada.classList.add('map-country-svg');
    canada.classList.add('map-country--can');
    canada.setAttribute('stroke', '#1a6b3c');
    canada.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(canada);

    // 阿拉斯加轮廓（左上）
    var alaska = document.createElementNS(svgNS, 'path');
    alaska.setAttribute('d',
      'M 28 60 L 14 80 L 10 108 L 28 112 L 42 96 L 56 80 L 42 64 Z');
    alaska.classList.add('map-country-svg');
    alaska.classList.add('map-country--can');
    alaska.setAttribute('stroke', '#1a6b3c');
    alaska.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(alaska);

    // 格陵兰示意（右上）
    var greenland = document.createElementNS(svgNS, 'path');
    greenland.setAttribute('d',
      'M 560 52 L 602 44 L 630 68 L 616 112 L 588 96 L 574 76 Z');
    greenland.classList.add('map-country-svg');
    greenland.classList.add('map-country--greenland');
    greenland.setAttribute('stroke', '#1a6b3c');
    greenland.setAttribute('stroke-linejoin', 'round');
    greenland.setAttribute('fill', '#d5d5c0');
    greenland.setAttribute('opacity', '0.5');
    svg.appendChild(greenland);

    canvas.appendChild(svg);

    // ---- 城市点 ----
    const venues = DashboardDataStore.venues || [];
    venues.forEach(function (venue) {
      const coords = CITY_COORDS[venue.city];
      if (!coords) return;

      var dot = document.createElement('span');
      dot.className = 'map-city-dot';
      dot.style.left = coords.x + '%';
      dot.style.top = coords.y + '%';
      dot.title = venue.city + ' — ' + venue.name;

      // tooltip
      var tooltip = document.createElement('span');
      tooltip.className = 'map-city-tooltip';
      tooltip.textContent = venue.city + '\n' + venue.name;
      dot.appendChild(tooltip);

      canvas.appendChild(dot);
    });
  }

  /* ================================================================
     2. 球迷时区表
     ================================================================ */

  /** 4 个时区的配置 */
  const TIMEZONE_CONFIGS = [
    { label: '北京时间', city: '北京', timezone: 'Asia/Shanghai' },
    { label: '美国东部', city: '纽约', timezone: 'America/New_York' },
    { label: '美国西部', city: '洛杉矶', timezone: 'America/Los_Angeles' },
    { label: '墨西哥中部', city: '墨西哥城', timezone: 'America/Mexico_City' }
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

  /**
   * 格式化时间（HH:mm）
   * @param {Date} date
   * @returns {string}
   */
  function formatTime(date) {
    return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
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
     3. 主队信息卡
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
      body.innerHTML = '<p class="team-card__placeholder">请前往 <a href="#settings" class="team-card__link" data-section="settings">设置</a> 选择你的主队</p>';
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

    var html = '';
    html += '<div class="team-card__team-name">' + teamName + '</div>';

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
    renderVenueMap();
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
    renderVenueMap: renderVenueMap,
    renderTeamCard: renderTeamCard,
    renderTimezoneStrip: renderTimezoneStrip,
    loadAllData: loadAllData,
    CITY_COORDS: CITY_COORDS
  };
})();