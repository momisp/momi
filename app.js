(function () {
  var STORAGE_KEY = "countdownTimerHistory_v1";

  var titleInput = document.getElementById("titleInput");
  var minutesInput = document.getElementById("minutesInput");
  var timeDisplay = document.getElementById("timeDisplay");
  var stateBadge = document.getElementById("stateBadge");
  var statusText = document.getElementById("statusText");
  var btnStart = document.getElementById("btnStart");
  var btnPause = document.getElementById("btnPause");
  var btnResume = document.getElementById("btnResume");
  var btnReset = document.getElementById("btnReset");
  var btnCloseSession = document.getElementById("btnCloseSession");
  var btnClearHistory = document.getElementById("btnClearHistory");
  var historyList = document.getElementById("historyList");

  var state = "idle";
  var totalMs = 0;
  var remainingMs = 0;
  var lastTick = 0;
  var rafId = null;
  var plannedMinutes = 0;

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatTime(ms) {
    if (ms < 0) ms = 0;
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return pad(m) + ":" + pad(s);
  }

  function setStatus(msg) {
    statusText.textContent = msg;
  }

  function updateStateBadge() {
    var labels = { idle: "待命", running: "进行中", paused: "已暂停", ended: "已结束" };
    stateBadge.textContent = "状态：" + (labels[state] || state);
    stateBadge.classList.remove("badge--idle", "badge--running", "badge--paused", "badge--ended");
    stateBadge.classList.add("badge--" + (state === "idle" || state === "ended" ? state : state));
  }

  function applyDisplayClass() {
    timeDisplay.classList.remove("idle", "running", "paused");
    if (state === "running") timeDisplay.classList.add("running");
    else if (state === "paused") timeDisplay.classList.add("paused");
    else timeDisplay.classList.add("idle");
  }

  function refreshUI() {
    timeDisplay.textContent = formatTime(remainingMs);
    updateStateBadge();
    applyDisplayClass();

    var idle = state === "idle";
    var running = state === "running";
    var paused = state === "paused";
    var ended = state === "ended";

    btnStart.disabled = !(idle || ended);
    btnPause.disabled = !running;
    btnResume.disabled = !paused;
    minutesInput.disabled = running || paused;
    titleInput.disabled = running || paused;

    btnCloseSession.disabled = idle || ended;
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function loop(now) {
    if (state !== "running") return;
    if (!lastTick) lastTick = now;
    var delta = now - lastTick;
    lastTick = now;
    remainingMs -= delta;
    if (remainingMs <= 0) {
      remainingMs = 0;
      state = "ended";
      stopLoop();
      setStatus("时间到——已自动记录到历史。");
      addHistoryEntry({
        title: titleInput.value.trim() || "（无标题）",
        plannedMinutes: plannedMinutes,
        outcome: "正常结束",
        elapsedMs: totalMs,
        at: new Date().toISOString()
      });
      refreshUI();
      return;
    }
    timeDisplay.textContent = formatTime(remainingMs);
    rafId = requestAnimationFrame(loop);
  }

  function startInternal() {
    stopLoop();
    lastTick = 0;
    state = "running";
    rafId = requestAnimationFrame(loop);
    refreshUI();
  }

  function loadHistory() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(arr) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function fmtLocal(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleString("zh-CN", { hour12: false });
    } catch (e) {
      return iso;
    }
  }

  function renderHistory() {
    var items = loadHistory();
    if (!items.length) {
      historyList.innerHTML =
        '<div class="empty">暂无记录。计时自然结束或点击「关闭本次计时并记录」后会出现条目。</div>';
      return;
    }
    historyList.innerHTML = items
      .map(function (it) {
        return (
          '<div class="history-item">' +
          '<div class="t">' +
          escapeHtml(it.title) +
          " · " +
          escapeHtml(it.outcome) +
          "</div>" +
          '<div class="m">' +
          "预设 " +
          it.plannedMinutes +
          " 分钟 · " +
          (it.outcome === "正常结束"
            ? "全程 " + Math.round(it.elapsedMs / 1000) + " 秒"
            : "已进行 " + Math.round(it.elapsedMs / 1000) + " 秒") +
          " · " +
          fmtLocal(it.at) +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function addHistoryEntry(entry) {
    var arr = loadHistory();
    arr.unshift(entry);
    if (arr.length > 50) arr.length = 50;
    saveHistory(arr);
    renderHistory();
  }

  btnStart.addEventListener("click", function () {
    var m = parseInt(minutesInput.value, 10);
    if (isNaN(m) || m < 1) {
      setStatus("请输入至少 1 分钟的正整数。");
      return;
    }
    if (m > 999) m = 999;
    plannedMinutes = m;
    totalMs = m * 60 * 1000;
    remainingMs = totalMs;
    state = "running";
    setStatus("已开始：「" + (titleInput.value.trim() || "无标题") + "」，共 " + m + " 分钟。");
    startInternal();
  });

  btnPause.addEventListener("click", function () {
    if (state !== "running") return;
    stopLoop();
    state = "paused";
    lastTick = 0;
    setStatus("已暂停，剩余 " + formatTime(remainingMs) + "。可继续或重置。");
    refreshUI();
  });

  btnResume.addEventListener("click", function () {
    if (state !== "paused") return;
    setStatus("已继续倒计时。");
    startInternal();
  });

  btnReset.addEventListener("click", function () {
    stopLoop();
    state = "idle";
    remainingMs = 0;
    totalMs = 0;
    lastTick = 0;
    timeDisplay.textContent = "00:00";
    setStatus("已重置。已恢复可编辑，可重新设置后开始。");
    refreshUI();
  });

  btnCloseSession.addEventListener("click", function () {
    if (state !== "running" && state !== "paused") return;
    var elapsed = totalMs - remainingMs;
    stopLoop();
    state = "ended";
    setStatus("已关闭本次计时并写入历史（未完成全程）。");
    addHistoryEntry({
      title: titleInput.value.trim() || "（无标题）",
      plannedMinutes: plannedMinutes,
      outcome: "提前关闭",
      elapsedMs: elapsed,
      at: new Date().toISOString()
    });
    refreshUI();
  });

  btnClearHistory.addEventListener("click", function () {
    if (!confirm("确定清空全部历史记录？此操作不可恢复。")) return;
    saveHistory([]);
    renderHistory();
    setStatus("历史记录已清空。");
  });

  renderHistory();
  refreshUI();
})();
