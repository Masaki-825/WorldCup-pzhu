/**
 * countdown.js - 世界杯倒计时逻辑
 * 目标：2026 年美加墨世界杯揭幕战
 * 时间：2026年6月11日 20:00（北京时间 UTC+8）
 * World Cup Fan Center
 */
(function () {
  'use strict';

  /** 目标时间：2026年6月11日 20:00 UTC+8 */
  const TARGET_DATE = new Date('2026-06-11T20:00:00+08:00');

  /** setInterval 的标识符，用于清理 */
  let timerId = null;

  /** 是否已结束 */
  let hasEnded = false;

  /**
   * 计算距离目标日期的剩余时间
   * @returns {{ days: number, hours: number, minutes: number, seconds: number, total: number }}
   */
  function getTimeRemaining() {
    const now = new Date();
    const total = TARGET_DATE.getTime() - now.getTime();

    if (total <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(total / (1000 * 60 * 60 * 24)),
      hours: Math.floor((total / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((total / (1000 * 60)) % 60),
      seconds: Math.floor((total / 1000) % 60),
      total: total
    };
  }

  /**
   * 补零格式化
   * @param {number} num
   * @returns {string}
   */
  function pad(num) {
    return num < 10 ? '0' + num : String(num);
  }

  /**
   * 更新页面上的倒计时显示
   * @param {{ days: number, hours: number, minutes: number, seconds: number, total: number }} time
   */
  function updateCountdownDisplay(time) {
    const container = document.getElementById('countdown');
    if (!container) return;

    if (time.total <= 0) {
      // 赛事已开始或已结束
      hasEnded = true;
container.innerHTML = '<div class="countdown-ended">赛事进行中</div>';
      return;
    }

    container.innerHTML =
      '<div class="countdown-item">' +
        '<span class="number">' + pad(time.days) + '</span>' +
        '<span class="label">天</span>' +
      '</div>' +
      '<div class="countdown-item">' +
        '<span class="number">' + pad(time.hours) + '</span>' +
        '<span class="label">时</span>' +
      '</div>' +
      '<div class="countdown-item">' +
        '<span class="number">' + pad(time.minutes) + '</span>' +
        '<span class="label">分</span>' +
      '</div>' +
      '<div class="countdown-item">' +
        '<span class="number">' + pad(time.seconds) + '</span>' +
        '<span class="label">秒</span>' +
      '</div>';
  }

  /**
   * 执行一次倒计时更新
   */
  function tick() {
    const time = getTimeRemaining();
    updateCountdownDisplay(time);

    // 若已结束，停止定时器
    if (time.total <= 0 && timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  /**
   * 启动倒计时定时器
   */
  function startCountdown() {
    // 先清理可能存在的旧定时器
    stopCountdown();

    // 立即执行一次显示
    tick();

    // 如果还未结束，启动每秒更新
    if (!hasEnded) {
      timerId = setInterval(tick, 1000);
    }
  }

  /**
   * 停止倒计时定时器
   */
  function stopCountdown() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  /**
   * 初始化倒计时模块
   */
  function initCountdown() {
    // 检查仪表盘中的倒计时容器是否存在
    const container = document.getElementById('countdown');
    if (!container) {
      console.warn('倒计时容器 #countdown 未找到，跳过初始化。');
      return;
    }

    // 启动倒计时
    startCountdown();
    console.log('倒计时模块已就绪（目标：2026-06-11 20:00 UTC+8）。');
  }

  // 挂载到全局
  window.WorldCupCountdown = {
    getTimeRemaining: getTimeRemaining,
    startCountdown: startCountdown,
    stopCountdown: stopCountdown,
    init: initCountdown,
    isEnded: function () { return hasEnded; }
  };

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCountdown);
  } else {
    initCountdown();
  }
})();