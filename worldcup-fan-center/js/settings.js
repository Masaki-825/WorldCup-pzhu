/**
 * settings.js - 设置与控制中心
 * World Cup Fan Center
 *
 * 功能：
 * 1. 日/夜模式切换 + 跟随系统
 * 2. 字体大小调节（小/中/大 三档）
 * 3. 主队选择
 */

(function () {
  'use strict';

  /* ================================================================
     常量定义
     ================================================================ */
  const STORAGE_KEY_THEME_AUTO = 'theme-auto';
  const STORAGE_KEY_FONT_SIZE = 'font-size';
  const STORAGE_KEY_FAVORITE = 'favorite-team';

  const FONT_OPTIONS = ['small', 'medium', 'large'];
  const FONT_LABELS = { small: '小', medium: '中', large: '大' };
  const DEFAULT_FONT_SIZE = 'medium';

  const DEEP_DIVE_LINKS = [
    {
      category: '国内综合资讯社区',
      links: [
        { name: '懂球帝', url: 'https://www.dongqiudi.com' },
        { name: '直播吧', url: 'https://www.zhibo8.com' },
        { name: '虎扑足球', url: 'https://football.hupu.com' }
      ]
    },
    {
      category: '国际综合资讯',
      links: [
        { name: 'ESPN 足球', url: 'https://www.espn.com/football' },
        { name: 'Sky Sports 足球', url: 'https://www.skysports.com/football' }
      ]
    },
    {
      category: '专业足球数据',
      links: [
        { name: 'WhoScored', url: 'https://www.whoscored.com' },
        { name: 'SofaScore', url: 'https://www.sofascore.com' },
        { name: '转会市场 Transfermarkt', url: 'https://www.transfermarkt.com' },
        { name: 'FBref', url: 'https://fbref.com' },
        { name: 'Understat', url: 'https://understat.com' }
      ]
    },
    {
      category: '实时比分赛程',
      links: [
        { name: 'Flashscore', url: 'https://www.flashscore.com' },
        { name: 'LiveScore', url: 'https://www.livescore.com' },
        { name: 'FotMob', url: 'https://www.fotmob.com' }
      ]
    },
    {
      category: '国内合法直播',
      links: [
        { name: '咪咕视频体育', url: 'https://www.miguvideo.com' },
        { name: '爱奇艺体育', url: 'https://sports.iqiyi.com' },
        { name: '央视体育', url: 'https://sports.cntv.cn' }
      ]
    },
    {
      category: '球迷海外社区',
      links: [
        { name: 'Reddit 足球板块', url: 'https://reddit.com/r/soccer' }
      ]
    },
    {
      category: '官方权威站点',
      links: [
        { name: '欧足联 UEFA 官网', url: 'https://www.uefa.com' },
        { name: '国际足联 FIFA 官网', url: 'https://www.fifa.com' }
      ]
    }
  ];

  /* ================================================================
     工具函数
     ================================================================ */

  /**
   * 安全读取 localStorage
   * @param {string} key
   * @returns {string|null}
   */
  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  /**
   * 安全写入 localStorage
   * @param {string} key
   * @param {string} value
   */
  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // localStorage 不可用时静默忽略
    }
  }

  /**
   * 安全删除 localStorage
   * @param {string} key
   */
  function storageRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // localStorage 不可用时静默忽略
    }
  }

  /* ================================================================
     功能1：日/夜模式切换 + 跟随系统
     ================================================================ */

  /** @type {HTMLButtonElement|null} */
  var themeToggleBtn = null;
  /** @type {HTMLInputElement|null} */
  var themeAutoCheckbox = null;
  /** @type {HTMLElement|null} */
  var themeToggleText = null;

  /**
   * 更新主题切换按钮上的文字
   */
  function updateThemeToggleUI() {
    if (!themeToggleBtn || !themeToggleText) return;

    var isNight = document.body.classList.contains('night-mode');
    if (isNight) {
      themeToggleText.textContent = '切换为日间模式';
    } else {
      themeToggleText.textContent = '切换为夜间模式';
    }
  }

  /**
   * 应用"跟随系统"模式：
   * - 清空 theme-preference（让 theme.js 回退到系统偏好）
   * - 立即读取系统偏好并应用
   */
  function enableAutoTheme() {
    // 删除手动偏好，让 theme.js 跟随系统
    storageRemove('theme-preference');

    // 立即应用系统偏好
    if (window.WorldCupTheme) {
      var sysPref = window.WorldCupTheme.getSystemPreference();
      window.WorldCupTheme.applyTheme(sysPref);
    } else {
      // 回退：自行判断
      var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.body.classList.add('night-mode');
      } else {
        document.body.classList.remove('night-mode');
      }
    }

    updateThemeToggleUI();
  }

  /**
   * 取消"跟随系统"，使用当前主题作为手动偏好
   */
  function disableAutoTheme() {
    var isNight = document.body.classList.contains('night-mode');
    storageSet('theme-preference', isNight ? 'dark' : 'light');
  }

  /**
   * 初始化主题设置相关 DOM 与事件绑定
   */
  function initThemeSettings() {
    themeToggleBtn = document.getElementById('theme-toggle-btn');
    themeAutoCheckbox = document.getElementById('theme-auto-checkbox');
    themeToggleText = document.getElementById('theme-toggle-text');

    if (!themeToggleBtn || !themeAutoCheckbox) {
      console.warn('设置面板中缺少主题控制元素，跳过主题设置初始化。');
      return;
    }

    // ---- 按钮点击：切换主题 ----
    themeToggleBtn.addEventListener('click', function () {
      // 如果"跟随系统"被勾选，切换主题前先取消自动模式
      if (themeAutoCheckbox.checked) {
        themeAutoCheckbox.checked = false;
        storageRemove(STORAGE_KEY_THEME_AUTO);
        disableAutoTheme();
      }

      // 调用 theme.js 的切换函数
      if (window.WorldCupTheme && window.WorldCupTheme.toggleTheme) {
        window.WorldCupTheme.toggleTheme();
      } else {
        // 回退：直接操作 class
        document.body.classList.toggle('night-mode');
        var isNight = document.body.classList.contains('night-mode');
        storageSet('theme-preference', isNight ? 'dark' : 'light');
      }

      updateThemeToggleUI();
    });

    // ---- 复选框：跟随系统 ----
    themeAutoCheckbox.addEventListener('change', function () {
      if (this.checked) {
        storageSet(STORAGE_KEY_THEME_AUTO, 'true');
        enableAutoTheme();
      } else {
        storageRemove(STORAGE_KEY_THEME_AUTO);
        disableAutoTheme();
      }
    });

    // ---- 页面加载时恢复"跟随系统"状态 ----
    var storedAuto = storageGet(STORAGE_KEY_THEME_AUTO);
    if (storedAuto === 'true') {
      themeAutoCheckbox.checked = true;
      enableAutoTheme();
    } else {
      themeAutoCheckbox.checked = false;
    }

    // 无论哪种模式，按钮文字都需要同步
    updateThemeToggleUI();

    // 监听主题变化（其他模块可能修改了主题），及时更新按钮 UI
    var observer = new MutationObserver(function () {
      updateThemeToggleUI();
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  /* ================================================================
     功能2：字体大小调节
     ================================================================ */

  /** @type {HTMLButtonElement|null} */
  var fontDecreaseBtn = null;
  /** @type {HTMLButtonElement|null} */
  var fontIncreaseBtn = null;
  /** @type {HTMLElement|null} */
  var fontSizeLabel = null;

  /** 当前字体档位索引 */
  var currentFontIndex = FONT_OPTIONS.indexOf(DEFAULT_FONT_SIZE);

  /**
   * 应用字体大小
   * @param {string} size - 'small' | 'medium' | 'large'
   */
   function applyFontSize(size) {
     document.body.setAttribute('data-font-size', size);
     document.body.style.fontSize = '';
     storageSet(STORAGE_KEY_FONT_SIZE, size);

    // 更新标签文字
    if (fontSizeLabel) {
      fontSizeLabel.textContent = FONT_LABELS[size] || size;
    }

    // 同步索引
    var idx = FONT_OPTIONS.indexOf(size);
    if (idx !== -1) {
      currentFontIndex = idx;
    }
  }

  /**
   * 初始化字体调节
   */
  function initFontSizeSettings() {
    fontDecreaseBtn = document.getElementById('font-decrease');
    fontIncreaseBtn = document.getElementById('font-increase');
    fontSizeLabel = document.getElementById('font-size-label');

    if (!fontDecreaseBtn || !fontIncreaseBtn || !fontSizeLabel) {
      console.warn('设置面板中缺少字体控制元素，跳过字体设置初始化。');
      return;
    }

    // 从 localStorage 恢复
    var storedSize = storageGet(STORAGE_KEY_FONT_SIZE);
    if (storedSize && FONT_OPTIONS.indexOf(storedSize) !== -1) {
      applyFontSize(storedSize);
    } else {
      applyFontSize(DEFAULT_FONT_SIZE);
    }

    // 减小
    fontDecreaseBtn.addEventListener('click', function () {
      currentFontIndex = Math.max(0, currentFontIndex - 1);
      applyFontSize(FONT_OPTIONS[currentFontIndex]);
    });

    // 增大
    fontIncreaseBtn.addEventListener('click', function () {
      currentFontIndex = Math.min(FONT_OPTIONS.length - 1, currentFontIndex + 1);
      applyFontSize(FONT_OPTIONS[currentFontIndex]);
    });
  }

  /* ================================================================
     功能3：主队选择
     ================================================================ */

  /** @type {HTMLSelectElement|null} */
  var favoriteSelect = null;

  /**
   * 由外部调用，传入球队数组后填充下拉框
   * @param {Array<{id:string, name:string, flag?:string}>} teams - 球队列表
   */
  function initFavoriteTeam(teams) {
    favoriteSelect = document.getElementById('favorite-team-select');

    if (!favoriteSelect) {
      console.warn('设置面板中缺少主队选择下拉框。');
      return;
    }

    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      console.warn('主队列表为空，跳过填充。');
      return;
    }

    // 清空已有选项（保留"请选择主队"占位）
    // 移除除第一个 option 外的所有
    while (favoriteSelect.options.length > 1) {
      favoriteSelect.remove(1);
    }

    // 按球队名称排序
    var sorted = teams.slice().sort(function (a, b) {
      var nameA = (a.name || '').toLowerCase();
      var nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // 填充选项
    sorted.forEach(function (team) {
      var option = document.createElement('option');
      option.value = team.id || team.name || '';
      option.textContent = (team.flag ? team.flag + ' ' : '') + (team.name || team.id || '未知球队');
      favoriteSelect.appendChild(option);
    });

    // 监听选择变化，存入 localStorage
    favoriteSelect.addEventListener('change', function () {
      var selectedValue = this.value;
      if (selectedValue) {
        storageSet(STORAGE_KEY_FAVORITE, selectedValue);
      } else {
        storageRemove(STORAGE_KEY_FAVORITE);
      }
    });

    // 页面加载时恢复选中
    var storedFavorite = storageGet(STORAGE_KEY_FAVORITE);
    if (storedFavorite) {
      // 尝试匹配 value
      for (var i = 0; i < favoriteSelect.options.length; i++) {
        if (favoriteSelect.options[i].value === storedFavorite) {
          favoriteSelect.selectedIndex = i;
          break;
        }
      }
    }
  }

  /**
   * 获取当前选中的主队
   * @returns {string|null}
   */
  function getFavoriteTeam() {
    return storageGet(STORAGE_KEY_FAVORITE);
  }

  /* ================================================================
     功能4：深度探索角
     ================================================================ */

  /**
   * 注入深度探索角的 CSS 样式
   */
  function injectDeepDiveStyles() {
    if (document.getElementById('deep-dive-corner-styles')) return;

      var styleEl = document.createElement('style');
      styleEl.id = 'deep-dive-corner-styles';
      styleEl.textContent = [
        '.settings-deep-dive {',
        '  margin-top: 2em;',
        '  padding-top: 1.5em;',
        '  border-top: 1px solid var(--border-light);',
        '}',
        '.settings-deep-dive__title {',
        '  font-size: 0.8em;',
        '  color: var(--text-secondary);',
        '  margin: 0 0 1em 0;',
        '  font-weight: 400;',
        '  letter-spacing: 0.05em;',
        '}',
        '.settings-deep-dive__category {',
        '  font-size: 0.8em;',
        '  color: var(--text-secondary);',
        '  margin: 0.9em 0 0.35em 0;',
        '  padding: 0;',
        '}',
        '.settings-deep-dive__category strong {',
        '  font-weight: 600;',
        '}',
        '.settings-deep-dive__links {',
        '  font-size: 0.8em;',
        '  color: var(--text-secondary);',
        '  line-height: 1.75;',
        '  display: flex;',
        '  flex-wrap: wrap;',
        '  gap: 0 0.4em;',
        '}',
        '.settings-deep-dive__links a {',
        '  color: var(--text-secondary);',
        '  text-decoration: none;',
        '  white-space: nowrap;',
        '}',
        '.settings-deep-dive__links a:hover {',
        '  text-decoration: underline;',
        '  color: var(--accent);',
        '}',
        '.settings-deep-dive__sep {',
        '  color: var(--border-light);',
        '  user-select: none;',
        '}',
        '.settings-deep-dive__links a:last-of-type ~ .settings-deep-dive__sep {',
        '  display: none;',
        '}'
      ].join('\n');
      document.head.appendChild(styleEl);
   }

  /**
   * 初始化深度探索角：在设置面板底部添加外链列表
   */
  function initDeepDiveCorner() {
    var settingsSection = document.getElementById('settings');
    if (!settingsSection) {
      console.warn('找不到设置面板容器 #settings，跳过深度探索角初始化。');
      return;
    }

    // 避免重复注入
    if (document.getElementById('deep-dive-corner')) return;

    // 注入样式
    injectDeepDiveStyles();

    // 构建 HTML
    var wrapper = document.createElement('div');
    wrapper.className = 'settings-deep-dive';
    wrapper.id = 'deep-dive-corner';

    var title = document.createElement('p');
    title.className = 'settings-deep-dive__title';
    title.textContent = '深度探索角';
    wrapper.appendChild(title);

    DEEP_DIVE_LINKS.forEach(function (group) {
      var catP = document.createElement('p');
      catP.className = 'settings-deep-dive__category';

      var strong = document.createElement('strong');
      strong.textContent = group.category;
      catP.appendChild(strong);

      wrapper.appendChild(catP);

      var linksWrapper = document.createElement('div');
      linksWrapper.className = 'settings-deep-dive__links';

      group.links.forEach(function (link, idx) {
        var a = document.createElement('a');
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = link.name;
        linksWrapper.appendChild(a);

        // 分隔符（最后一个不加，CSS 已处理隐藏最后一个后面的 sep）
        if (idx < group.links.length - 1) {
          var sep = document.createElement('span');
          sep.className = 'settings-deep-dive__sep';
          sep.textContent = '|';
          linksWrapper.appendChild(sep);
        }
      });

      wrapper.appendChild(linksWrapper);
    });

    settingsSection.appendChild(wrapper);
  }

  /* ================================================================
     初始化入口
     ================================================================ */

  function init() {
    initThemeSettings();
    initFontSizeSettings();
    initDeepDiveCorner();
    console.log('设置模块已就绪。');
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 暴露全局 API
  window.WorldCupSettings = {
    initFavoriteTeam: initFavoriteTeam,
    getFavoriteTeam: getFavoriteTeam,
    /** 手动刷新主题按钮 UI */
    updateThemeToggleUI: updateThemeToggleUI,
    /** 刷新深度探索角 */
    refreshDeepDiveCorner: initDeepDiveCorner
  };

})();