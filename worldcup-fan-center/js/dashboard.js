/**
 * dashboard.js - 仪表盘模块
 * World Cup Fan Center
 *
 * 功能：
 * 1. 动态背景光点 (CSS only)
 * 2. 欢迎横幅（根据时间段动态文案）
 * 3. 倒计时 (countdown.js 渲染，本模块仅配合)
 * 4. 焦点新闻卡片
 * 5. 今日赛程摘要
 * 6. 快捷入口网格（点击导航跳转）
 * 7. 主队信息卡（含小组赛程 + 预测/设置引导）
 * 8. 球迷时区表（4 时区实时时间 + 昼夜指示）
 * 9. 场馆地图 + 浮层（16 座场馆列表）
 */
(function () {
  'use strict';

  /* ================================================================
     数据缓存层
     ================================================================ */
  const DashboardDataStore = {
    teams: null,
    venues: null,
    schedule: null,
    loaded: false
  };

  /** 一次性加载所有数据（优先内联数据，降级 fetch） */
  async function loadAllData() {
    if (DashboardDataStore.loaded) return;
    try {
      // 优先使用内联数据
      if (window.__TEAMS_DATA__ && window.__TEAMS_DATA__.length) {
        DashboardDataStore.teams = window.__TEAMS_DATA__;
      } else {
        const teamsRes = await fetch('data/teams.json');
        DashboardDataStore.teams = await teamsRes.json();
      }
      if (window.__VENUES_DATA__ && window.__VENUES_DATA__.length) {
        DashboardDataStore.venues = window.__VENUES_DATA__;
      } else {
        const venuesRes = await fetch('data/venues.json');
        DashboardDataStore.venues = await venuesRes.json();
      }
      if (window.__SCHEDULE_DATA__ && window.__SCHEDULE_DATA__.length) {
        DashboardDataStore.schedule = window.__SCHEDULE_DATA__;
      } else {
        const scheduleRes = await fetch('data/schedule.json');
        DashboardDataStore.schedule = await scheduleRes.json();
      }
      DashboardDataStore.loaded = true;
      console.log('仪表盘数据已加载（' + DashboardDataStore.teams.length + ' 支球队, ' +
        DashboardDataStore.venues.length + ' 个场馆, ' +
        DashboardDataStore.schedule.length + ' 场比赛）。');
    } catch (err) {
      console.error('仪表盘数据加载失败：', err);
    }
  }

  /* ================================================================
     辅助函数
     ================================================================ */
  function resolveVenueName(venueId) {
    var venues = DashboardDataStore.venues;
    if (!venues) return venueId;
    for (var i = 0; i < venues.length; i++) {
      if (venues[i].id === venueId) return venues[i].name;
    }
    return venueId;
  }

  function getTeamName(teamId) {
    var teams = DashboardDataStore.teams;
    if (!teams) return teamId;
    for (var i = 0; i < teams.length; i++) {
      if (teams[i].id === teamId) return teams[i].name;
    }
    return teamId;
  }

  function getTeamGroup(teamId) {
    var teams = DashboardDataStore.teams;
    if (!teams) return null;
    for (var i = 0; i < teams.length; i++) {
      if (teams[i].id === teamId) return teams[i].group || null;
    }
    return null;
  }

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

  function getTeamFlag(teamId) {
    return FLAG_MAP[teamId] || null;
  }

  function getFavoriteTeam() {
    if (window.WorldCupSettings && window.WorldCupSettings.getFavoriteTeam) {
      return window.WorldCupSettings.getFavoriteTeam();
    }
    try { return localStorage.getItem('favorite-team'); } catch (e) { return null; }
    return null;
  }

  function navigateToSection(sectionId) {
    var navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function (nl) { nl.classList.remove('active'); });
    var targetLink = document.querySelector('.nav-link[data-section="' + sectionId + '"]');
    if (targetLink) targetLink.classList.add('active');
    var allSections = document.querySelectorAll('main section');
    allSections.forEach(function (s) { s.style.display = 'none'; });
    var targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.style.display = '';
    if (history.pushState) history.pushState(null, null, '#' + sectionId);
  }

  /* ================================================================
     1. 欢迎横幅（根据时间段动态切换文案）
     ================================================================ */
  function updateWelcomeBanner() {
    var el = document.getElementById('welcome-text');
    if (!el) return;
    var hour = new Date().getHours();
    var text;
    if (hour >= 5 && hour < 9) {
      text = '早安，足球唤醒每一天';
    } else if (hour >= 9 && hour < 12) {
      text = '上午好，精彩比赛即将开始';
    } else if (hour >= 12 && hour < 14) {
      text = '午安，来一份足球午餐';
    } else if (hour >= 14 && hour < 18) {
      text = '下午好，足球激情正燃烧';
    } else if (hour >= 18 && hour < 22) {
      text = '晚安，世界杯之夜开始了';
    } else {
      text = '夜深了，回味今日精彩瞬间';
    }
    el.textContent = text;
    el.style.opacity = '0';
    // 淡入效果
    setTimeout(function () { el.style.opacity = '1'; }, 150);
  }

  /* ================================================================
     2. 焦点新闻卡片
     ================================================================ */
  function renderFocusNews() {
    var container = document.getElementById('focus-news-list');
    if (!container) return;

    // 基于赛程数据生成焦点新闻（模拟新闻推送）
    var schedule = DashboardDataStore.schedule;
    if (!schedule || !schedule.length) {
      container.innerHTML = '<p class="focus-news__loading">新闻加载中，请稍候...</p>';
      return;
    }

    // 取最近 4 场小组赛作为"焦点新闻"
    var groupMatches = schedule.filter(function (m) {
      return m.phase && m.phase.indexOf('小组赛') !== -1 && m.teams && m.teams.length === 2;
    });

    // 按日期排序，取最近的
    var today = new Date().toISOString().slice(0, 10);
    var upcoming = groupMatches.filter(function (m) { return m.date >= today; });
    var featured = upcoming.slice(0, 4);
    // 不够则补充已过去的
    if (featured.length < 4) {
      var past = groupMatches.filter(function (m) { return m.date < today; }).reverse();
      while (featured.length < 4 && past.length > 0) {
        featured.push(past.shift());
      }
    }

    var html = '';
    // 静默失败
    if (!featured || featured.length === 0) {
      container.innerHTML = '<p class="focus-news__loading">暂无焦点新闻</p>';
      return;
    }

    for (var i = 0; i < featured.length; i++) {
      var m = featured[i];
      var home = getTeamName(m.teams[0]);
      var away = getTeamName(m.teams[1]);
      var venue = resolveVenueName(m.venue);
      var titleText = home + ' vs ' + away + ' — ' + (m.phase || '');
      html += '<div class="focus-news-item">';
      html += '<h4 class="focus-news-item__title"><a href="#schedule">' + titleText + '</a></h4>';
      html += '<div class="focus-news-item__meta">[icon-calendar] ' + m.date + ' &nbsp;|&nbsp; [icon-location] ' + venue + '</div>';
      html += '</div>';
    }
    container.innerHTML = html;

    // 为标题链接绑定导航跳转
    var links = container.querySelectorAll('.focus-news-item__title a');
    links.forEach(function (l) {
      l.addEventListener('click', function (e) {
        e.preventDefault();
        navigateToSection('schedule');
      });
    });
  }

  /* ================================================================
     3. 今日赛程摘要
     ================================================================ */
  function renderTodaySchedule() {
    var container = document.getElementById('today-schedule-body');
    if (!container) return;

    var schedule = DashboardDataStore.schedule;
    if (!schedule || !schedule.length) {
      container.innerHTML = '<p class="today-schedule--empty">赛程数据加载中...</p>';
      return;
    }

    var today = new Date().toISOString().slice(0, 10);
    var todayMatches = schedule.filter(function (m) {
      return m.date === today && m.teams && m.teams.length === 2;
    });

    if (!todayMatches || todayMatches.length === 0) {
      // 找到最近的比赛日
      var upcoming = schedule.filter(function (m) {
        return m.date >= today && m.teams && m.teams.length === 2;
      }).sort(function (a, b) { return a.date.localeCompare(b.date); });
      if (upcoming.length > 0) {
        todayMatches = schedule.filter(function (m) {
          return m.date === upcoming[0].date && m.teams && m.teams.length === 2;
        });
      }
    }

    if (!todayMatches || todayMatches.length === 0) {
      container.innerHTML = '<p class="today-schedule--empty">暂无近期比赛数据</p>';
      return;
    }

    // 最多显示 4 场
    var displayMatches = todayMatches.slice(0, 4);
    var html = '';
    for (var i = 0; i < displayMatches.length; i++) {
      var m = displayMatches[i];
      var home = getTeamName(m.teams[0]);
      var away = getTeamName(m.teams[1]);
      html += '<div class="today-match-item">';
      html += '<span class="today-match__time">' + (m.time || '--:--') + '</span>';
      html += '<span class="today-match__teams">' + home + ' vs ' + away + '</span>';
      html += '<span class="today-match__venue">' + resolveVenueName(m.venue) + '</span>';
      html += '</div>';
    }
    container.innerHTML = html;

    // 更新标题日期
    var titleEl = document.querySelector('.today-schedule__title');
    if (titleEl && displayMatches.length > 0) {
      if (displayMatches[0].date === today) {
        titleEl.textContent = '今日焦点战';
      } else {
        titleEl.textContent = '最近焦点战 (' + displayMatches[0].date + ')';
      }
    }

    // 绑定"查看完整赛程"链接
    var footerLink = document.querySelector('.today-schedule__link');
    if (footerLink) {
      footerLink.addEventListener('click', function (e) {
        e.preventDefault();
        navigateToSection('schedule');
      });
    }
  }

  /* ================================================================
     4. 快捷入口网格（点击导航跳转）
     ================================================================ */
  function bindQuickEntryCards() {
    var cards = document.querySelectorAll('.quick-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var section = card.getAttribute('data-section');
        if (section) navigateToSection(section);
      });
      // 键盘可访问性
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var section = card.getAttribute('data-section');
          if (section) navigateToSection(section);
        }
      });
    });
  }

  /* ================================================================
     5. 主队信息卡 + 扩展区域
     ================================================================ */
  function findNextMatch(teamId) {
    var schedule = DashboardDataStore.schedule;
    if (!schedule || !schedule.length) return null;
    var upcoming = schedule
      .filter(function (m) {
        if (m.status === 'finished') return false;
        if (!m.teams || m.teams.length < 2) return false;
        return m.teams[0] === teamId || m.teams[1] === teamId;
      })
      .sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
    var match = upcoming[0] || null;
    if (match) {
      match._home = match.teams[0];
      match._away = match.teams[1];
      match._venueName = resolveVenueName(match.venue);
    }
    return match;
  }

  function findGroupMatches(teamId) {
    var schedule = DashboardDataStore.schedule;
    if (!schedule || !schedule.length) return [];
    var group = getTeamGroup(teamId);
    if (!group) return [];
    var groupPhase = '小组赛' + group + '组';
    return schedule
      .filter(function (m) { return m.phase === groupPhase && m.teams && m.teams.length === 2; })
      .sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
  }

  function renderTeamCard() {
    var body = document.getElementById('team-card-body');
    var extras = document.getElementById('team-card-extras');
    if (!body) return;

    var favorite = getFavoriteTeam();

    if (!favorite) {
      body.innerHTML = '<p class="team-card__placeholder">您看好哪支球队？前往 <a href="#settings" class="team-card__link" data-section="settings">设置</a> 选择主队</p>';
      if (extras) extras.innerHTML = '<div class="team-card-setup-hint"><p class="team-card-setup-hint__text">选择主队后，这里将显示小组赛程和预测信息</p><a href="#settings" class="team-card-setup-hint__link" data-section="settings">前往设置 →</a></div>';
      bindTeamCardLinks();
      return;
    }

    if (!DashboardDataStore.loaded) {
      body.innerHTML = '<p class="team-card__placeholder">正在加载数据...</p>';
      if (extras) extras.innerHTML = '';
      return;
    }

    var teamName = getTeamName(favorite);
    var nextMatch = findNextMatch(favorite);
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
      html += '<div class="team-card__next-match">';
      html += '<span class="team-card__match-label">下一场</span>';
      html += '<div class="team-card__match-teams">' + homeName + ' vs ' + awayName + '</div>';
      html += '<div class="team-card__match-info">';
      if (nextMatch.date) html += '[icon-calendar] ' + nextMatch.date + ' ' + (nextMatch.time || '');
      if (nextMatch._venueName) html += ' &nbsp;|&nbsp; [icon-location] ' + nextMatch._venueName;
      html += '</div></div>';
    } else {
      html += '<p class="team-card__no-match">暂无后续比赛</p>';
    }
    body.innerHTML = html;

    // 扩展区域：小组赛程 + 预测排名
    renderTeamCardExtras(favorite, groupInfo);
  }

  function renderTeamCardExtras(teamId, groupInfo) {
    var extras = document.getElementById('team-card-extras');
    if (!extras) return;

    if (!groupInfo) {
      extras.innerHTML = '<div class="team-card-extras__loading">暂无小组信息</div>';
      return;
    }

    var groupMatches = findGroupMatches(teamId);
    var html = '';

    // 小组赛程
    if (groupMatches.length > 0) {
      html += '<div class="team-card-group-schedule">';
      html += '<h4 class="team-card-group-schedule__title">小组 ' + groupInfo + ' 赛程</h4>';
      for (var i = 0; i < groupMatches.length; i++) {
        var m = groupMatches[i];
        var home = getTeamName(m.teams[0]);
        var away = getTeamName(m.teams[1]);
        html += '<div class="team-card-group-match">';
        html += '<span class="team-card-group-match__teams">' + home + ' vs ' + away + '</span>';
        html += '<span class="team-card-group-match__date">' + m.date + '</span>';
        if (m.status === 'finished') {
          html += '<span class="team-card-group-match__status">已结束</span>';
        } else if (m.status === 'live') {
          html += '<span class="team-card-group-match__status">进行中</span>';
        }
        html += '</div>';
      }
      html += '</div>';
    }

    // 预测排名（基于小组信息生成模拟数据）
    var team = DashboardDataStore.teams ? DashboardDataStore.teams.filter(function (t) { return t.id === teamId; })[0] : null;
    var fifaRank = team ? team.fifaRank : 0;
    html += '<div class="team-card-prediction">';
    html += '<h4 class="team-card-prediction__title">小组出线预测</h4>';
    html += '<p class="team-card-prediction__rank">FIFA 排名: #' + fifaRank + '</p>';
    html += '<p class="team-card-prediction__note">基于当前排名和近 5 场战绩的综合预测</p>';
    html += '</div>';

    extras.innerHTML = html;
  }

  function bindTeamCardLinks() {
    var links = document.querySelectorAll('.team-card__link, .team-card-setup-hint__link');
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        navigateToSection('settings');
      });
    });
  }

  /* ================================================================
     6. 球迷时区表
     ================================================================ */
  var TIMEZONE_CONFIGS = [
    { label: '北京时间', city: '北京', timezone: 'Asia/Shanghai', offsetBeijing: 0 },
    { label: '美国东部', city: '纽约', timezone: 'America/New_York', offsetBeijing: -12 },
    { label: '美国西部', city: '洛杉矶', timezone: 'America/Los_Angeles', offsetBeijing: -15 },
    { label: '墨西哥中部', city: '墨西哥城', timezone: 'America/Mexico_City', offsetBeijing: -14 }
  ];

  function getDayNight(date) {
    return (date.getHours() >= 6 && date.getHours() < 18) ? 'day' : 'night';
  }

  function renderTimezoneStrip() {
    var container = document.getElementById('timezone-list');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < TIMEZONE_CONFIGS.length; i++) {
      var cfg = TIMEZONE_CONFIGS[i];
      var now = new Date();
      var options = { timeZone: cfg.timezone, hour: '2-digit', minute: '2-digit', hour12: false };
      var parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
      var hourStr = '00', minuteStr = '00';
      parts.forEach(function (p) {
        if (p.type === 'hour') hourStr = p.value;
        if (p.type === 'minute') minuteStr = p.value;
      });
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
      iconSpan.textContent = dn === 'day' ? '☀️' : '🌙';

      item.appendChild(citySpan);
      item.appendChild(timeSpan);
      item.appendChild(iconSpan);

      if (cfg.offsetBeijing !== 0) {
        var offsetSpan = document.createElement('span');
        offsetSpan.className = 'timezone-item__offset';
        offsetSpan.textContent = cfg.offsetBeijing > 0
          ? '(早北京时间 ' + cfg.offsetBeijing + ' 小时)'
          : '(晚北京时间 ' + Math.abs(cfg.offsetBeijing) + ' 小时)';
        item.appendChild(offsetSpan);
      }
      container.appendChild(item);
    }
  }

  var timezoneTimer = null;
  function startTimezoneTimer() {
    stopTimezoneTimer();
    renderTimezoneStrip();
    timezoneTimer = setInterval(renderTimezoneStrip, 10000);
  }
  function stopTimezoneTimer() {
    if (timezoneTimer) { clearInterval(timezoneTimer); timezoneTimer = null; }
  }

  /* ================================================================
     7. 场馆浮层
     ================================================================ */
  function renderVenueOverlay() {
    var list = document.getElementById('venue-overlay-list');
    if (!list) return;
    var venues = DashboardDataStore.venues;
    if (!venues || !venues.length) {
      list.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">场馆数据加载中...</p>';
      return;
    }
    var html = '';
    for (var i = 0; i < venues.length; i++) {
      var v = venues[i];
      html += '<div class="venue-overlay-item">';
      html += '<h4 class="venue-overlay-item__name">' + v.name + '</h4>';
      html += '<p class="venue-overlay-item__city">' + v.city + ', ' + (v.country || '') + '</p>';
      html += '<div class="venue-overlay-item__meta">';
      html += '<span>[icon-stadium] ' + (v.capacity ? (v.capacity / 1000).toFixed(1) + 'k' : '--') + ' 座</span>';
      html += '<span>[icon-calendar] ' + (v.opened || '--') + ' 年建成</span>';
      html += '<span>[icon-soccer] ' + (v.matches || '--') + ' 场赛事</span>';
      html += '</div></div>';
    }
    list.innerHTML = html;
  }

  function bindVenueOverlay() {
    var overlay = document.getElementById('venue-overlay');
    var openBtn = document.getElementById('venue-explore-btn');
    var closeBtn = document.getElementById('venue-overlay-close');
    if (!overlay || !openBtn || !closeBtn) return;

    openBtn.addEventListener('click', function () {
      if (DashboardDataStore.loaded) renderVenueOverlay();
      else {
        var list = document.getElementById('venue-overlay-list');
        if (list) list.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">正在加载场馆数据...</p>';
        loadAllData().then(renderVenueOverlay);
      }
      overlay.style.display = '';
      document.body.style.overflow = 'hidden';
    });

    closeBtn.addEventListener('click', function () {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
      }
    });

    // ESC 关闭
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.style.display !== 'none') {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  /* ================================================================
     仪表盘总初始化
     ================================================================ */
  async function initDashboard() {
    await loadAllData();
    updateWelcomeBanner();
    renderTeamCard();
    renderFocusNews();
    renderTodaySchedule();
    bindQuickEntryCards();
    bindTeamCardLinks();
    startTimezoneTimer();
  }

  function leaveDashboard() {
    stopTimezoneTimer();
  }

  /* ================================================================
     注册导航钩子 + 暴露全局 API
     ================================================================ */
  function registerHooks() {
    if (!window.WorldCupNav || !window.WorldCupNav.registerSwitchHook) {
      setTimeout(registerHooks, 200);
      return;
    }
    WorldCupNav.registerSwitchHook('after', 'dashboard', initDashboard);
    WorldCupNav.registerSwitchHook('before', 'dashboard', leaveDashboard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      registerHooks();
      bindVenueOverlay();
      setTimeout(function () {
        var current = window.WorldCupNav ? window.WorldCupNav.getCurrentSection() : 'dashboard';
        if (current === 'dashboard' || !window.location.hash.replace('#', '') || window.location.hash === '#dashboard') {
          initDashboard();
        }
      }, 100);
    });
  } else {
    registerHooks();
    bindVenueOverlay();
    setTimeout(function () {
      var current = window.WorldCupNav ? window.WorldCupNav.getCurrentSection() : 'dashboard';
      if (current === 'dashboard' || !window.location.hash.replace('#', '') || window.location.hash === '#dashboard') {
        initDashboard();
      }
    }, 100);
  }

  window.WorldCupDashboard = {
    init: initDashboard,
    renderTeamCard: renderTeamCard,
    renderTimezoneStrip: renderTimezoneStrip,
    renderFocusNews: renderFocusNews,
    renderTodaySchedule: renderTodaySchedule,
    loadAllData: loadAllData
  };
})();