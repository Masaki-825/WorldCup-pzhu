/**
 * 历史博物馆模块
 * 依赖：WorldCupNav, window.__HISTORY_DATA__ 或 fetch('data/history.json')
 */

(function () {
  "use strict";

  var historyDataReady = false;

  function getHistoryData() {
    if (window.__HISTORY_DATA__) {
      return Promise.resolve(window.__HISTORY_DATA__);
    }
    return fetch("data/history.json")
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load history.json");
        return res.json();
      })
      .then(function (data) {
        window.__HISTORY_DATA__ = data;
        return data;
      })
      .catch(function (err) {
        console.error("History data load error:", err);
        return null;
      });
  }

  /* ========== 冠军墙 ========== */
  function renderChampions(data) {
    var container = document.getElementById("champions-scroll");
    if (!container || !data || !data.champions) return;

    var champions = data.champions;
    var html = "";

    for (var i = 0; i < champions.length; i++) {
      var c = champions[i];
      var is2022 = c.year === 2022;
      var cardClass = is2022
        ? "champion-card champion-card--golden"
        : "champion-card";

      html +=
        '<div class="' +
        cardClass +
        '">' +
        '<div class="champion-card__year">' +
        c.year +
        "</div>" +
        '<div class="champion-card__champion">' +
        c.champion +
        "</div>" +
        '<div class="champion-card__detail">举办国：' +
        c.host +
        "</div>" +
        '<div class="champion-card__detail">季军：' +
        c.third +
        "</div>" +
        "</div>";
    }

    container.innerHTML = html;
  }

  /* ========== 经典比赛回顾 ========== */
  function renderClassicMatches() {
    var container = document.getElementById("classic-matches-list");
    if (!container) return;

    var matches = [
      {
        year: 1950,
        phase: "决赛",
        teams: "乌拉圭 2-1 巴西",
        summary:
          "马拉卡纳惨案——近20万主场观众见证巴西在"决赛"中惨遭乌拉圭逆转，成为世界杯史上最大冷门之一。",
      },
      {
        year: 1966,
        phase: "小组赛",
        teams: "葡萄牙 5-3 朝鲜",
        summary:
          "朝鲜小组赛爆冷淘汰意大利后面对葡萄牙一度3-0领先，尤西比奥独中四元率队完成惊天逆转。",
      },
      {
        year: 1970,
        phase: "决赛",
        teams: "巴西 4-1 意大利",
        summary:
          "贝利、雅伊尔津霍等巨星领衔的巴西队打出了被广泛认为是最华丽的决赛表演，第三次捧起雷米特杯。",
      },
      {
        year: 1982,
        phase: "第二轮小组赛",
        teams: "意大利 3-2 巴西",
        summary:
          "保罗·罗西帽子戏法击沉济科-苏格拉底-法尔考的梦幻巴西，堪称世界杯史上最经典的小组赛对决。",
      },
      {
        year: 1986,
        phase: "四分之一决赛",
        teams: "阿根廷 2-1 英格兰",
        summary:
          "马拉多纳在同一场比赛上演"上帝之手"和"世纪最佳进球"，双重争议与神迹融为一体。",
      },
      {
        year: 1998,
        phase: "八分之一决赛",
        teams: "阿根廷 2-2(4-3点) 英格兰",
        summary:
          "欧文千里走单骑、贝克汉姆红牌、经典任意球配合——英阿恩怨史上最富戏剧性的120分钟。",
      },
      {
        year: 2014,
        phase: "半决赛",
        teams: "德国 7-1 巴西",
        summary:
          "米内罗惨案——东道主巴西在主场遭遇世界杯半决赛史上最惨痛失利，全场比赛成为德国火力全开的表演。",
      },
      {
        year: 2022,
        phase: "决赛",
        teams: "阿根廷 3-3(4-2点) 法国",
        summary:
          "梅西圆梦之战——姆巴佩帽子戏法与梅西梅开二度交相辉映，被广泛认为是世界杯历史上最精彩的决赛。",
      },
    ];

    var html = "";
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      html +=
        '<div class="classic-match-card">' +
        '<span class="classic-match-card__year">' +
        m.year +
        "</span>" +
        '<span class="classic-match-card__phase">' +
        m.phase +
        "</span>" +
        '<span class="classic-match-card__teams">' +
        m.teams +
        "</span>" +
        '<p class="classic-match-card__summary">' +
        m.summary +
        "</p>" +
        "</div>";
    }
    container.innerHTML = html;
  }

  /* ========== 冷知识盒子 ========== */
  function renderTrivia(data) {
    var contentEl = document.getElementById("trivia-content");
    var btn = document.getElementById("trivia-next-btn");
    if (!contentEl || !btn || !data || !data.trivia || data.trivia.length === 0)
      return;

    var currentIndex = 0;
    var triviaList = data.trivia;

    function showTrivia(index, animate) {
      var item = triviaList[index];
      var newContent =
        '<p class="trivia-box__title-text">' +
        item.title +
        "</p>" +
        '<p class="trivia-box__body-text">' +
        item.content +
        "</p>";

      if (animate) {
        contentEl.style.opacity = "0";
        contentEl.style.transition = "opacity 0.25s ease";
        setTimeout(function () {
          contentEl.innerHTML = newContent;
          contentEl.style.opacity = "1";
        }, 250);
      } else {
        contentEl.innerHTML = newContent;
        contentEl.style.opacity = "1";
      }
    }

    // 随机选择起始条目
    currentIndex = Math.floor(Math.random() * triviaList.length);
    showTrivia(currentIndex, false);

    btn.addEventListener("click", function () {
      var nextIndex;
      if (triviaList.length === 1) {
        nextIndex = 0;
      } else {
        do {
          nextIndex = Math.floor(Math.random() * triviaList.length);
        } while (nextIndex === currentIndex);
      }
      currentIndex = nextIndex;
      showTrivia(currentIndex, true);
    });
  }

  /* ========== 初始化 ========== */
  function init() {
    if (historyDataReady) return;
    historyDataReady = true;

    renderClassicMatches();

    getHistoryData().then(function (data) {
      if (!data) {
        var championsEl = document.getElementById("champions-scroll");
        if (championsEl) {
          championsEl.innerHTML =
            '<p class="placeholder-text">数据加载失败，请检查网络连接</p>';
        }
        return;
      }
      renderChampions(data);
      renderTrivia(data);
    });
  }

  WorldCupNav.registerSwitchHook("after", "history", init);
})();