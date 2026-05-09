/**
 * 社区与周刊模块
 * 依赖：WorldCupNav
 */

(function () {
  "use strict";

  var communityReady = false;

  /* ========== 主题周刊文章 ========== */
  function renderWeeklyArticle() {
    var container = document.getElementById("weekly-article-body");
    if (!container) return;

    var articleSections = [
      {
        title: "一、48 队从何而来：名额分配的全球版图",
        content:
          "2026 年世界杯将是历史上首次由三个国家联合主办，也是首次将参赛队伍从 32 支扩编至 48 支。国际足联为这次扩军制定了全新的名额分配方案：亚洲获得 8 个直接晋级名额，非洲 9 个，中北美及加勒比地区 6 个（含三个东道主），南美洲 6 个，大洋洲 1 个，欧洲 16 个，外加 2 个通过附加赛决出的名额。这一分配方案旨在让更多地区的球队有机会站上世界杯舞台，也意味着我们将看到一些此前从未亮相世界杯的国家队迎来历史性首秀。",
      },
      {
        title: "二、小组赛新规：三人小组与单循环的博弈",
        content:
          "48 支球队被分为 16 个小组（A-P），每组仅 3 支球队，进行单循环比赛，每队仅踢两场小组赛。每组前两名共 32 支球队晋级淘汰赛。这一赛制最大的变化是小组赛阶段没有平局收场——每场比赛都必须分出胜负，常规时间打平将直接进入点球大战。这意味着每场比赛的戏剧性和紧张感将被拉满，任何一场失利都可能提前终结世界杯之旅。对于传统强队而言，容错空间被大大压缩；对于弱队来说，爆冷晋级的概率反而有所提升。",
      },
      {
        title: "三、32 强淘汰赛：史上最残酷的晋级路径",
        content:
          "小组出线后，32 强将展开 1/16 决赛——这是世界杯历史上首次引入这一轮次。从 32 强到冠军，一支球队需要连赢 5 场淘汰赛（1/16 决赛、1/8 决赛、1/4 决赛、半决赛、决赛），比此前 32 队赛制多出一轮。这意味着体能储备、阵容深度和伤病管理将比以往任何时候都更加重要。巧合的是，由于小组赛每队只踢两场，总比赛场次从 7 场变为 7 场（2 场小组赛 + 5 场淘汰赛），冠军球队的总比赛数量没有变化，但淘汰赛占比显著提高。",
      },
      {
        title: "四、赛程地理学：跨越三个国家的 logistics 挑战",
        content:
          "本届世界杯的 16 座场馆分布在美国、加拿大和墨西哥三个国家的 16 座城市，横跨多个时区和气候带。从温哥华的凉爽夏季到迈阿密的湿热天气，从墨西哥城的高原反应到纽约的温带气候，各支球队不仅需要面对对手的挑战，还必须应对长途旅行、时差和气候变化的考验。国际足联在赛程编排上尽量减少了球队的旅行距离，将小组赛阶段限制在较小的地理区域内，但进入淘汰赛阶段后，横跨北美的航班将成为每支晋级球队的必修课。对于志在夺冠的球队而言，如何科学管理球员的身体状态，将是教练组面临的最大课题。",
      },
    ];

    var html = "";
    for (var i = 0; i < articleSections.length; i++) {
      var sec = articleSections[i];
      html +=
        '<div class="weekly-article__section">' +
        '<h4 class="weekly-article__section-title">' +
        sec.title +
        "</h4>" +
        '<p class="weekly-article__paragraph">' +
        sec.content +
        "</p>" +
        "</div>";
    }

    container.innerHTML = html;
  }

  /* ========== 球迷社区墙 ========== */
  function renderFanWall() {
    var container = document.getElementById("fan-wall-grid");
    if (!container) return;

    var fans = [
      { name: "足球小子", quote: "为了世界杯请了年假，这个夏天属于足球！" },
      { name: "禁区漫步者", quote: "看了二十年世界杯，2026年终于能在家门口看球了" },
      { name: "绿茵守望者", quote: "从小学三年级开始看球，如今孩子都上小学了，希望阿根廷卫冕成功" },
      { name: "小将萨内蒂", quote: "国米队魂的名字就是我的ID，期待阿根廷再次夺冠" },
      { name: "越位线专家", quote: "研究了所有小组对阵，这届A组和C组绝对是死亡之组" },
      { name: "任意球大师", quote: "希望能看到中国队出现在世界杯赛场上，等了太多年" },
      { name: "帽子戏法", quote: "从巴西夺冠看到德国夺冠，从梅西看到姆巴佩，足球永不眠" },
      { name: "足球诗人", quote: "球场上最动人的不是胜负，而是拼尽全力的每一个瞬间" },
      { name: "远射狂魔", quote: "买好了开幕战和决赛的门票，人生愿望清单打勾一项" },
    ];

    var html = "";
    for (var i = 0; i < fans.length; i++) {
      var f = fans[i];
      html +=
        '<div class="fan-card">' +
        '<div class="fan-card__avatar"></div>' +
        '<p class="fan-card__name">' +
        f.name +
        "</p>" +
        '<p class="fan-card__quote">' +
        f.quote +
        "</p>" +
        "</div>";
    }
    container.innerHTML = html;
  }

  /* ========== 足球音乐盒 ========== */
  function renderMusicBox() {
    var container = document.getElementById("music-box-list");
    if (!container) return;

    var songs = [
      { year: 1990, title: "Un'estate Italiana", artist: "Edoardo Bennato & Gianna Nannini" },
      { year: 1994, title: "Gloryland", artist: "Daryl Hall & Sounds of Blackness" },
      { year: 1998, title: "La Copa de la Vida", artist: "Ricky Martin" },
      { year: 2002, title: "Boom", artist: "Anastacia" },
      { year: 2010, title: "Waka Waka (This Time for Africa)", artist: "Shakira" },
      { year: 2014, title: "We Are One (Ole Ola)", artist: "Pitbull ft. Jennifer Lopez & Claudia Leitte" },
      { year: 2018, title: "Live It Up", artist: "Nicky Jam ft. Will Smith & Era Istrefi" },
      { year: 2022, title: "Hayya Hayya (Better Together)", artist: "Trinidad Cardona, Davido & Aisha" },
    ];

    var html = "";
    for (var i = 0; i < songs.length; i++) {
      var s = songs[i];
      html +=
        '<div class="music-item">' +
        '<span class="music-item__year">' +
        s.year +
        "</span>" +
        '<span class="music-item__song">' +
        s.title +
        "</span>" +
        '<span class="music-item__artist">' +
        s.artist +
        "</span>" +
        "</div>";
    }
    container.innerHTML = html;
  }

  /* ========== 初始化 ========== */
  function init() {
    if (communityReady) return;
    communityReady = true;

    renderWeeklyArticle();
    renderFanWall();
    renderMusicBox();
  }

  WorldCupNav.registerSwitchHook("after", "community", init);
})();