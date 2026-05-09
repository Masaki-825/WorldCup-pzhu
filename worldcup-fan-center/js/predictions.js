/**
 * 预测擂台模块
 * 依赖：WorldCupNav, WorldCupSettings, window.__SCHEDULE_DATA__, window.__TEAMS_DATA__
 */

(function () {
  "use strict";

  const LS_PREFIX = "prediction-";
  const LS_KEY_DAILY = LS_PREFIX + "daily_opener";
  const LS_KEY_GROUPS = LS_PREFIX + "groups";
  const LS_KEY_KNOCKOUT = LS_PREFIX + "knockout";

  /* ========== 工具函数 ========== */
  function getTeamById(id) {
    var teams = window.__TEAMS_DATA__ || [];
    for (var i = 0; i < teams.length; i++) {
      if (teams[i].id === id) return teams[i];
    }
    return null;
  }

  function getOpenerMatch() {
    var schedule = window.__SCHEDULE_DATA__ || [];
    for (var i = 0; i < schedule.length; i++) {
      if (schedule[i].id === "m01") return schedule[i];
    }
    return schedule[0] || null;
  }

  /* ========== 每日一猜 ========== */
  function renderDailyGuess() {
    var match = getOpenerMatch();
    var matchEl = document.getElementById("daily-guess-match");
    var inputsEl = document.getElementById("daily-guess-inputs");
    var actionsEl = document.getElementById("daily-guess-actions");
    var submittedEl = document.getElementById("daily-guess-submitted");

    if (!match || !matchEl || !inputsEl || !actionsEl) return;

    var homeTeam = getTeamById(match.teams[0]);
    var awayTeam = getTeamById(match.teams[1]);
    var homeName = homeTeam ? homeTeam.name : (match.teams[0] || "TBD");
    var awayName = awayTeam ? awayTeam.name : (match.teams[1] || "TBD");

    matchEl.innerHTML =
      '<span class="daily-guess__team daily-guess__team--home">' +
      homeName +
      '</span>' +
      '<span class="daily-guess__vs">vs</span>' +
      '<span class="daily-guess__team daily-guess__team--away">' +
      awayName +
      "</span>";

    // 检查是否已提交
    var saved = loadJSON(LS_KEY_DAILY);
    if (saved) {
      matchEl.style.display = "none";
      inputsEl.style.display = "none";
      actionsEl.style.display = "none";
      if (submittedEl) {
        submittedEl.style.display = "block";
        submittedEl.innerHTML =
          '<p class="daily-guess__submitted-text">你已预测：<span>' +
          saved.home +
          " - " +
          saved.away +
          '</span></p>' +
          '<button id="daily-modify-btn" class="btn btn--primary" type="button">修改预测</button>';
        document.getElementById("daily-modify-btn").addEventListener("click", function () {
          removeJSON(LS_KEY_DAILY);
          matchEl.style.display = "";
          inputsEl.style.display = "";
          actionsEl.style.display = "";
          submittedEl.style.display = "none";
          renderDailyGuessInputs(match);
        });
      }
      return;
    }

    renderDailyGuessInputs(match);
  }

  function renderDailyGuessInputs(match) {
    var inputsEl = document.getElementById("daily-guess-inputs");
    var actionsEl = document.getElementById("daily-guess-actions");
    if (!inputsEl || !actionsEl) return;

    var homeTeam = getTeamById(match.teams[0]);
    var awayTeam = getTeamById(match.teams[1]);
    var homeLabel = homeTeam ? homeTeam.name + " 进球" : "主队进球";
    var awayLabel = awayTeam ? awayTeam.name + " 进球" : "客队进球";

    inputsEl.innerHTML =
      '<label class="daily-guess__score-label">' +
      homeLabel +
      '<input type="number" id="daily-score-home" class="daily-guess__score-input" min="0" max="20" value="0"></label>' +
      '<span class="daily-guess__vs" style="font-weight:700;font-size:1.1rem;">:</span>' +
      '<label class="daily-guess__score-label">' +
      awayLabel +
      '<input type="number" id="daily-score-away" class="daily-guess__score-input" min="0" max="20" value="0"></label>';

    actionsEl.innerHTML =
      '<button id="daily-submit-btn" class="btn btn--primary" type="button">提交预测</button>';

    document.getElementById("daily-submit-btn").addEventListener("click", function () {
      var homeVal = parseInt(document.getElementById("daily-score-home").value, 10);
      var awayVal = parseInt(document.getElementById("daily-score-away").value, 10);
      if (isNaN(homeVal) || isNaN(awayVal) || homeVal < 0 || awayVal < 0) {
        alert("请输入有效的比分（非负整数）");
        return;
      }
      saveJSON(LS_KEY_DAILY, { home: homeVal, away: awayVal, matchId: match.id });
      renderDailyGuess();
    });
  }

  /* ========== 完整预测表单 ========== */

  // 小组出线预测
  function renderGroupPredictions() {
    var container = document.getElementById("prediction-groups");
    if (!container) return;

    var teams = window.__TEAMS_DATA__ || [];
    var groups = {};
    for (var i = 0; i < teams.length; i++) {
      var g = teams[i].group;
      if (!groups[g]) groups[g] = [];
      groups[g].push(teams[i]);
    }

    // 按FIFA排名升序
    var groupKeys = Object.keys(groups).sort();
    var savedGroups = loadJSON(LS_KEY_GROUPS) || {};

    var html =
      '<h4 class="full-prediction__section-title">小组出线预测（每组选择2支晋级球队）</h4>' +
      '<div class="full-prediction__groups">';

    for (var gi = 0; gi < groupKeys.length; gi++) {
      var gk = groupKeys[gi];
      var groupTeams = groups[gk].slice().sort(function (a, b) {
        return (a.fifaRank || 999) - (b.fifaRank || 999);
      });
      var saved = savedGroups[gk] || [];

      html +=
        '<div class="full-prediction__group-card" data-group="' +
        gk +
        '">' +
        '<p class="full-prediction__group-label">' +
        gk +
        " 组</p>";

      for (var ti = 0; ti < groupTeams.length; ti++) {
        var t = groupTeams[ti];
        var checked = saved.indexOf(t.id) !== -1 ? " checked" : "";
        html +=
          '<label class="full-prediction__team-option">' +
          '<input type="checkbox" class="group-pick" data-team="' +
          t.id +
          '" data-group="' +
          gk +
          '"' +
          checked +
          ">" +
          t.name +
          "</label>";
      }
      html += "</div>";
    }
    html += "</div>";
    container.innerHTML = html;

    // 限制每组最多选2个
    var checkboxes = container.querySelectorAll(".group-pick");
    for (var ci = 0; ci < checkboxes.length; ci++) {
      checkboxes[ci].addEventListener("change", function () {
        var group = this.getAttribute("data-group");
        var groupBoxes = container.querySelectorAll(
          '.group-pick[data-group="' + group + '"]'
        );
        var checkedCount = 0;
        for (var gi2 = 0; gi2 < groupBoxes.length; gi2++) {
          if (groupBoxes[gi2].checked) checkedCount++;
        }
        if (checkedCount > 2) {
          this.checked = false;
          alert("每组最多选择2支晋级球队");
        }
      });
    }
  }

  // 淘汰赛预测
  function renderKnockoutPredictions() {
    var container = document.getElementById("prediction-knockout");
    if (!container) return;

    var schedule = window.__SCHEDULE_DATA__ || [];
    var knockoutMatches = [];
    var phaseOrder = [
      "1/16决赛",
      "1/8决赛",
      "1/4决赛",
      "半决赛",
      "季军赛",
      "决赛",
    ];

    for (var pi = 0; pi < phaseOrder.length; pi++) {
      var phase = phaseOrder[pi];
      for (var si = 0; si < schedule.length; si++) {
        if (schedule[si].phase === phase) {
          knockoutMatches.push(schedule[si]);
        }
      }
    }

    var savedKnockout = loadJSON(LS_KEY_KNOCKOUT) || {};

    var html =
      '<h4 class="full-prediction__section-title">淘汰赛晋级预测</h4>' +
      '<div class="full-prediction__match-list">';

    for (var mi = 0; mi < knockoutMatches.length; mi++) {
      var m = knockoutMatches[mi];
      var teamsText = "待定 vs 待定";
      var optionA = "";
      var optionB = "";

      if (m.teams && m.teams.length >= 2) {
        var tA = getTeamById(m.teams[0]);
        var tB = getTeamById(m.teams[1]);
        var nameA = tA ? tA.name : m.teams[0];
        var nameB = tB ? tB.name : m.teams[1];
        teamsText = nameA + " vs " + nameB;
        optionA = nameA;
        optionB = nameB;
      }

      var selected = savedKnockout[m.id] || "";

      html +=
        '<div class="full-prediction__match-item">' +
        '<span class="full-prediction__match-teams">' +
        m.phase +
        "：" +
        teamsText +
        "</span>" +
        '<select class="full-prediction__match-select" data-match="' +
        m.id +
        '">' +
        '<option value="">-- 选择胜者 --</option>';

      if (optionA) {
        html +=
          '<option value="' +
          optionA +
          '"' +
          (selected === optionA ? " selected" : "") +
          ">" +
          optionA +
          "</option>";
      }
      if (optionB) {
        html +=
          '<option value="' +
          optionB +
          '"' +
          (selected === optionB ? " selected" : "") +
          ">" +
          optionB +
          "</option>";
      } else {
        html +=
          '<option value="待定"' +
          (selected === "待定" ? " selected" : "") +
          ">待定</option>";
      }

      html += "</select></div>";
    }
    html += "</div>";
    container.innerHTML = html;
  }

  function saveFullPredictions() {
    // 收集小组预测
    var groupsData = {};
    var groupBoxes = document.querySelectorAll(".group-pick:checked");
    for (var i = 0; i < groupBoxes.length; i++) {
      var g = groupBoxes[i].getAttribute("data-group");
      var t = groupBoxes[i].getAttribute("data-team");
      if (!groupsData[g]) groupsData[g] = [];
      groupsData[g].push(t);
    }
    saveJSON(LS_KEY_GROUPS, groupsData);

    // 收集淘汰赛预测
    var knockoutData = {};
    var selects = document.querySelectorAll(".full-prediction__match-select");
    for (var j = 0; j < selects.length; j++) {
      var mid = selects[j].getAttribute("data-match");
      knockoutData[mid] = selects[j].value;
    }
    saveJSON(LS_KEY_KNOCKOUT, knockoutData);

    alert("预测已保存！");
  }

  /* ========== localStorage 工具 ========== */
  function saveJSON(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // 静默处理
    }
  }

  function loadJSON(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function removeJSON(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // 静默处理
    }
  }

  /* ========== 初始化 ========== */
  function init() {
    renderDailyGuess();
    renderGroupPredictions();
    renderKnockoutPredictions();

    var saveBtn = document.getElementById("prediction-save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", saveFullPredictions);
    }
  }

  WorldCupNav.registerSwitchHook("after", "predictions", init);
})();