/**
 * community.js - 社区与周刊全部逻辑
 * World Cup Fan Center
 *
 * 功能：
 * 1. 周刊文章：硬编码深度解读文章
 * 2. 社区墙：3x3 模拟投稿卡片网格
 * 3. 音乐盒：历届官方歌曲列表
 */
(function () {
  'use strict';

  /* ================================================================
     周刊文章（硬编码）
     ================================================================ */

  var weeklyArticle = {
    title: '2026世界杯新赛制深度解读：48队如何走向冠军',
    date: '2026年5月',
    sections: [
      {
        heading: '一、48队扩军——世界杯的新版图',
        content: '2026年美加墨世界杯是历史上首次扩军至48支球队。与此前32支球队的赛制相比，新赛制将小组赛从8组改为16组，每组3支球队。小组内进行单循环对决，每个小组的前两名晋级32强淘汰赛。这意味着淘汰赛新增了1/16决赛阶段，总比赛场次从64场增加到80场。对于传统强队来说，容错空间进一步收窄——小组赛只有两场比赛，任何一场失利都可能直接导致出局。而对于亚非拉球队，名额大幅增加带来前所未有的世界杯体验。'
      },
      {
        heading: '二、小组赛新格局——死亡之组更难预测',
        content: '三人小组制颠覆了传统的四人小组格局。在四人小组中，球队可以对一场失利进行补救，但三队小组中每场比赛都至关重要。种子队的优势进一步放大，但爆冷的概率也随之增加。A组到P组的分布也并非完全随机——国际足联采用了地理分区和实力分档相结合的方式，确保每个小组至少有来自两个不同大洲的球队。这种设计既保留了地域对抗的看点，又避免了过于集中的洲际内耗。'
      },
      {
        heading: '三、淘汰赛新路径——从32强到冠军的八步登顶',
        content: '淘汰赛从1/16决赛起步，共经过1/16决赛、1/8决赛、1/4决赛、半决赛和决赛五轮。与以往的16强开打相比，新赛制为更多球队提供了淘汰赛体验，也增加了黑马深入赛程的可能性。2022年摩洛哥闯入四强的故事或将在48队赛制下更加频繁地上演。淘汰赛对阵预先设定，小组排名直接决定淘汰赛分区，这让各队在小组赛阶段就必须规划最佳晋级路径。'
      },
      {
        heading: '四、中国球迷观赛指南——时区与新节奏',
        content: '2026年世界杯由美国、加拿大、墨西哥三国联合主办，比赛地跨多个时区，从太平洋时间（UTC-8）到东部时间（UTC-5）。对于中国球迷，这意味着比赛时间分布在清晨到正午之间——这是继2002年韩日世界杯之后，对中国观众最为友好的世界杯时区。48队赛制下比赛密度更高，小组赛阶段预计每天安排3-4场比赛，淘汰赛阶段则延续单败淘汰的紧张节奏。'
      }
    ]
  };

  /* ================================================================
     社区墙模拟投稿（9张卡片）
     ================================================================ */

  var communityPosts = [
    {
      username: '足球老张',
      initials: '张',
      sentiment: '从98年开始看世界杯，终于等到48队了！希望亚洲球队能走得更远。'
    },
    {
      username: '绿茵守望者',
      initials: '绿',
      sentiment: '三人小组没有平局容错，每场都要全力争胜，这届世界杯会格外精彩。'
    },
    {
      username: '梅西的小迷弟',
      initials: '迷',
      sentiment: '虽然没有梅西了，但新一代球员会创造属于他们的传奇时刻。'
    },
    {
      username: '北漂球迷',
      initials: '北',
      sentiment: '准备请假看球了！美加墨时区太友好了，终于不用熬夜了。'
    },
    {
      username: '数据分析师阿杰',
      initials: '杰',
      sentiment: '48队赛制的数学建模很有意思，我预测会有至少一支非种子队进八强。'
    },
    {
      username: '南美足球魂',
      initials: '南',
      sentiment: '乌拉圭揭幕战加油！南美球队在北美有半个主场优势。'
    },
    {
      username: '上海足球少女',
      initials: '上',
      sentiment: '世界杯氛围已经拉满了，约了朋友一起看揭幕战直播。'
    },
    {
      username: '追风少年1999',
      initials: '追',
      sentiment: '这次扩军对中国足球也是激励，希望有朝一日能在家门口看中国队踢世界杯。'
    },
    {
      username: '咖啡与足球',
      initials: '咖',
      sentiment: '早上喝咖啡看世界杯，简直是完美的生活方式。期待开幕那天！'
    }
  ];

  /* ================================================================
     历届官方歌曲
     ================================================================ */

  var officialSongs = [
    { year: 1994, title: 'Gloryland', artist: 'Daryl Hall & Sounds of Blackness' },
    { year: 1998, title: 'La Copa de la Vida (The Cup of Life)', artist: 'Ricky Martin' },
    { year: 2002, title: 'Anthem (Boom)', artist: 'Anastacia' },
    { year: 2006, title: 'The Time of Our Lives', artist: 'Il Divo ft. Toni Braxton' },
    { year: 2010, title: 'Waka Waka (This Time for Africa)', artist: 'Shakira ft. Freshlyground' },
    { year: 2014, title: 'We Are One (Ole Ola)', artist: 'Pitbull ft. Jennifer Lopez & Claudia Leitte' },
    { year: 2018, title: 'Live It Up', artist: 'Nicky Jam ft. Will Smith & Era Istrefi' },
    { year: 2022, title: 'Hayya Hayya (Better Together)', artist: 'Trinidad Cardona, Davido & Aisha' }
  ];

  /* ================================================================
     工具函数
     ================================================================ */

  function safeGetById(id) {
    return document.getElementById(id);
  }

  /* ================================================================
     周刊文章渲染
     ================================================================ */

  function renderWeeklyArticle() {
    var container = safeGetById('weekly-article-body');
    if (!container) return;

    var html = '<h3 class="weekly-article__title">' + weeklyArticle.title + '</h3>';

    for (var i = 0; i < weeklyArticle.sections.length; i++) {
      var sec = weeklyArticle.sections[i];
      html += '<div class="weekly-article__section">';
      html += '<h4 class="weekly-article__section-heading">' + sec.heading + '</h4>';
      html += '<p class="weekly-article__section-content">' + sec.content + '</p>';
      html += '</div>';
    }

    html += '<p class="weekly-article__date">' + weeklyArticle.date + '</p>';
    container.innerHTML = html;
  }

  /* ================================================================
     社区墙渲染
     ================================================================ */

  function renderCommunityWall() {
    var container = safeGetById('fan-wall-grid');
    if (!container) return;

    var html = '';

    for (var i = 0; i < communityPosts.length; i++) {
      var post = communityPosts[i];

      html += '<div class="fan-card">';
      html += '<div class="fan-card__avatar">' + post.initials + '</div>';
      html += '<p class="fan-card__username">' + post.username + '</p>';
      html += '<p class="fan-card__quote">' + post.sentiment + '</p>';
      html += '</div>';
    }

    container.innerHTML = html;
  }

  /* ================================================================
     音乐盒渲染
     ================================================================ */

  function renderMusicBox() {
    var container = safeGetById('music-box-list');
    if (!container) return;

    var html = '<ul class="music-box__list">';

    for (var i = 0; i < officialSongs.length; i++) {
      var song = officialSongs[i];
      html += '<li class="music-box__item">';
      html += '<span class="music-box__year">' + song.year + '</span>';
      html += '<span class="music-box__divider">/</span>';
      html += '<span class="music-box__title">' + song.title + '</span>';
      html += '<span class="music-box__artist">' + song.artist + '</span>';
      html += '</li>';
    }

    html += '</ul>';
    container.innerHTML = html;
  }

  /* ================================================================
     初始化入口
     ================================================================ */

  function initCommunity() {
    renderWeeklyArticle();
    renderCommunityWall();
    renderMusicBox();
  }

  /* ================================================================
     注册导航钩子
     ================================================================ */

  if (window.WorldCupNav && typeof window.WorldCupNav.registerSwitchHook === 'function') {
    window.WorldCupNav.registerSwitchHook('after', 'community', initCommunity);
  }

  // 页面首次加载时如果社区模块可见（hash 直达），也初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (window.location.hash === '#community') {
        initCommunity();
      }
    });
  } else {
    if (window.location.hash === '#community') {
      initCommunity();
    }
  }
})();