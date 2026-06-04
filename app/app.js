(function () {
  const DAY_W = 32;
  const MINI_W = 22;
  const PCOLORS = ['#2563eb', '#7c3aed', '#db2777', '#d97706', '#059669', '#dc2626'];
  const STORAGE_KEY = 'gantt-schedule-v1';
  let projects = [];
  let tasks = [];
  let view = 'single';
  let drag = null;

  const $ = (id) => document.getElementById(id);
  const statusBar = $('statusBar');

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, tasks }));
    } catch (e) {
      /* 隐私模式或配额满时忽略 */
    }
  }

  function loadStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (Array.isArray(data.projects)) projects = data.projects;
      if (Array.isArray(data.tasks)) tasks = data.tasks;
      return projects.length > 0 || tasks.length > 0;
    } catch (e) {
      return false;
    }
  }

  function today() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function parseDate(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function fmtDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }

  function diffDays(a, b) {
    return Math.round((b - a) / 86400000);
  }

  function isWeekend(d) {
    const w = d.getDay();
    return w === 0 || w === 6;
  }

  function showError(msg) {
    $('errorMsg').textContent = msg;
    $('errorMsg').classList.add('show');
    statusBar.textContent = msg;
    statusBar.classList.add('is-error');
  }

  function setStatus(msg) {
    $('errorMsg').classList.remove('show');
    statusBar.classList.remove('is-error');
    statusBar.textContent = msg;
  }

  function projColor(i) {
    return PCOLORS[i % PCOLORS.length];
  }

  function getProjectTasks(pid) {
    return tasks.filter((t) => t.projectId === pid);
  }

  function barColor(bc) {
    return { overdue: '#dc2626', done: '#059669', doing: '#2563eb', todo: '#94a3b8' }[bc] || '#94a3b8';
  }

  function getGlobalRange(taskList) {
    if (!taskList.length) {
      const t = today();
      return { start: addDays(t, -3), end: addDays(t, 14) };
    }
    let min = parseDate(taskList[0].start);
    let max = parseDate(taskList[0].end);
    taskList.forEach((tk) => {
      const s = parseDate(tk.start);
      const e = parseDate(tk.end);
      if (s < min) min = s;
      if (e > max) max = e;
    });
    return { start: addDays(min, -2), end: addDays(max, 4) };
  }

  function barClass(tk) {
    if (tk.status !== 'done' && parseDate(tk.end) < today()) return 'overdue';
    return tk.status;
  }

  function updateStats() {
    const td = today();
    $('statProjects').textContent = projects.length;
    $('statTotal').textContent = tasks.length;
    $('statDoing').textContent = tasks.filter((t) => t.status === 'doing').length;
    $('statOverdue').textContent = tasks.filter((t) => t.status !== 'done' && parseDate(t.end) < td).length;
  }

  function refreshProjectSelect() {
    const sel = $('taskProject');
    const empty = !projects.length;
    sel.innerHTML = empty
      ? '<option value="">请先建项目</option>'
      : projects.map((p) => '<option value="' + p.id + '">' + p.name + '</option>').join('');
    $('addTaskBtn').disabled = empty;
  }

  function renderSingle() {
    const el = $('singleContent');
    if (!projects.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">📅</div><p>暂无项目</p><small>点击「新建项目」开始</small></div>';
      return;
    }
    const range = getGlobalRange(tasks);
    const days = diffDays(range.start, range.end) + 1;
    const tdIdx = diffDays(range.start, today());

    let hdr = '<th>任务</th>';
    for (let i = 0; i < days; i++) {
      const d = addDays(range.start, i);
      const cls = [isWeekend(d) && 'weekend', i === tdIdx && 'today'].filter(Boolean).join(' ');
      hdr += '<th class="' + cls + '">' + (d.getMonth() + 1) + '/' + d.getDate() + '</th>';
    }

    let rows = '';
    projects.forEach((proj, pi) => {
      const pt = getProjectTasks(proj.id);
      const c = projColor(pi);
      rows += '<tr class="project-group"><td colspan="' + (days + 1) + '"><span class="project-tag" style="background:' + c + '"></span>' + proj.name + '<span style="color:var(--text-muted);font-weight:400;margin-left:6px">' + pt.length + ' 项</span><button class="btn btn-danger" style="float:right" onclick="delProject(\'' + proj.id + '\')">删项目</button></td></tr>';
      if (!pt.length) {
        rows += '<tr><td style="color:var(--text-muted);font-weight:400">暂无任务</td>';
        for (let i = 0; i < days; i++) rows += '<td class="cell"></td>';
        rows += '</tr>';
        return;
      }
      pt.forEach((tk) => {
        const ts = parseDate(tk.start);
        const te = parseDate(tk.end);
        const si = diffDays(range.start, ts);
        const span = diffDays(ts, te) + 1;
        const bc = barClass(tk);
        const sl = { todo: '未开始', doing: '进行中', done: '已完成' }[tk.status];
        let cells = '';
        for (let i = 0; i < days; i++) {
          const d = addDays(range.start, i);
          const cls = ['cell', isWeekend(d) && 'weekend', i === tdIdx && 'today'].filter(Boolean).join(' ');
          let inner = '';
          if (i === si) inner = '<div class="bar ' + bc + '" data-id="' + tk.id + '" style="width:' + (span * DAY_W - 4) + 'px">' + tk.name + '</div>';
          if (i === tdIdx) inner += '<div class="today-line"></div>';
          cells += '<td class="' + cls + '">' + inner + '</td>';
        }
        const gIdx = tasks.indexOf(tk);
        rows += '<tr><td><div>' + tk.name + '</div><div class="task-meta">' + tk.start + ' ~ ' + tk.end + ' · ' + sl + '</div><div class="task-actions"><button class="btn btn-ghost btn-sm" onclick="cycleStatus(' + gIdx + ')">切换</button><button class="btn btn-danger" onclick="removeTask(' + gIdx + ')">删除</button></div></td>' + cells + '</tr>';
      });
    });

    el.innerHTML = '<table class="gantt-table"><thead><tr>' + hdr + '</tr></thead><tbody>' + rows + '</tbody></table>';
    el.querySelectorAll('.bar').forEach((b) => b.addEventListener('mousedown', onDragStart));
  }

  function renderMulti() {
    const el = $('viewMulti');
    if (!projects.length) {
      el.innerHTML = '<div class="proj-card" style="grid-column:1/-1"><div class="proj-empty">暂无项目 · 请先新建或加载示例</div></div>';
      return;
    }
    el.innerHTML = projects.map((proj, pi) => {
      const pt = getProjectTasks(proj.id);
      const c = projColor(pi);
      if (!pt.length) {
        return '<div class="proj-card"><div class="proj-card-head"><h2><span class="project-tag" style="background:' + c + '"></span>' + proj.name + '</h2><span class="badge">0 任务</span></div><div class="proj-empty">暂无任务</div></div>';
      }
      const range = getGlobalRange(tasks);
      const days = diffDays(range.start, range.end) + 1;
      const tdIdx = diffDays(range.start, today());
      const showDays = Math.min(days, 14);
      let hdr = '<th></th>';
      for (let i = 0; i < showDays; i++) {
        const d = addDays(range.start, i);
        hdr += '<th>' + (d.getMonth() + 1) + '/' + d.getDate() + '</th>';
      }
      let body = '';
      pt.forEach((tk) => {
        const ts = parseDate(tk.start);
        const te = parseDate(tk.end);
        const si = diffDays(range.start, ts);
        const span = diffDays(ts, te) + 1;
        const bc = barClass(tk);
        const bg = barColor(bc);
        body += '<tr><td title="' + tk.name + '">' + tk.name + '</td>';
        for (let i = 0; i < showDays; i++) {
          let inner = '';
          if (i >= si && i < si + span) {
            const isStart = i === si;
            const w = isStart ? Math.min(span, showDays - i) * MINI_W - 2 : 0;
            if (isStart) inner = '<div class="mini-bar" style="width:' + w + 'px;background:' + bg + '"></div>';
            else inner = '<div class="mini-bar" style="left:0;width:100%;background:' + bg + '"></div>';
          }
          body += '<td class="mini-cell' + (i === tdIdx ? ' today' : '') + '">' + inner + '</td>';
        }
        body += '</tr>';
      });
      const doing = pt.filter((t) => t.status === 'doing').length;
      const done = pt.filter((t) => t.status === 'done').length;
      return '<div class="proj-card"><div class="proj-card-head"><h2><span class="project-tag" style="background:' + c + '"></span>' + proj.name + '</h2><span class="badge">' + pt.length + ' 任务 · ' + doing + ' 进行 · ' + done + ' 完成</span></div><div class="proj-card-body"><table class="mini-table"><thead><tr>' + hdr + '</tr></thead><tbody>' + body + '</tbody></table></div></div>';
    }).join('');
  }

  function render() {
    updateStats();
    refreshProjectSelect();
    renderSingle();
    renderMulti();
    persist();
  }

  function switchView(v) {
    view = v;
    $('tabSingle').classList.toggle('active', v === 'single');
    $('tabMulti').classList.toggle('active', v === 'multi');
    $('viewSingle').classList.toggle('hide', v !== 'single');
    $('viewMulti').classList.toggle('hide', v !== 'multi');
    setStatus(v === 'single' ? '单项目视图 · 按项目分组展示全部任务' : '多项目并排 · 共 ' + projects.length + ' 个项目横向对比');
  }

  function onDragStart(e) {
    e.preventDefault();
    const id = e.currentTarget.dataset.id;
    const tk = tasks.find((t) => t.id === id);
    if (!tk) return;
    drag = { id, startX: e.clientX, origStart: tk.start, origEnd: tk.end };
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    setStatus('拖拽中 · 「' + tk.name + '」');
  }

  function onDragMove(e) {
    if (!drag) return;
    const delta = Math.round((e.clientX - drag.startX) / DAY_W);
    if (!delta) return;
    const tk = tasks.find((t) => t.id === drag.id);
    const os = parseDate(drag.origStart);
    const oe = parseDate(drag.origEnd);
    const span = diffDays(os, oe);
    const ns = addDays(os, delta);
    tk.start = fmtDate(ns);
    tk.end = fmtDate(addDays(ns, span));
    render();
  }

  function onDragEnd() {
    if (drag) {
      const tk = tasks.find((t) => t.id === drag.id);
      setStatus('已更新 · 「' + tk.name + '」' + tk.start + ' ~ ' + tk.end);
      drag = null;
    }
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
  }

  window.cycleStatus = function (idx) {
    const order = ['todo', 'doing', 'done'];
    tasks[idx].status = order[(order.indexOf(tasks[idx].status) + 1) % 3];
    setStatus('「' + tasks[idx].name + '」→ ' + { todo: '未开始', doing: '进行中', done: '已完成' }[tasks[idx].status]);
    render();
  };

  window.removeTask = function (idx) {
    const n = tasks[idx].name;
    tasks.splice(idx, 1);
    setStatus('已删除「' + n + '」');
    render();
  };

  window.delProject = function (id) {
    const p = projects.find((x) => x.id === id);
    tasks = tasks.filter((t) => t.projectId !== id);
    projects = projects.filter((x) => x.id !== id);
    setStatus('已删除项目「' + p.name + '」及其任务');
    render();
  };

  $('addProjBtn').onclick = function () {
    const name = $('projName').value.trim();
    if (!name) {
      showError('请输入项目名称');
      return;
    }
    projects.push({ id: 'p' + Date.now(), name });
    $('projName').value = '';
    setStatus('已创建项目「' + name + '」，当前 ' + projects.length + ' 个');
    render();
  };

  $('addTaskBtn').onclick = function () {
    const pid = $('taskProject').value;
    const name = $('taskName').value.trim();
    const start = $('startDate').value;
    const end = $('endDate').value;
    if (!pid) {
      showError('请先创建项目');
      return;
    }
    if (!name) {
      showError('请输入任务名称');
      return;
    }
    if (!start || !end) {
      showError('请选择日期');
      return;
    }
    if (parseDate(end) < parseDate(start)) {
      showError('结束不能早于开始');
      return;
    }
    tasks.push({ id: 't' + Date.now(), projectId: pid, name, start, end, status: $('taskStatus').value });
    $('taskName').value = '';
    const pn = projects.find((p) => p.id === pid).name;
    setStatus('已在「' + pn + '」添加「' + name + '」');
    render();
  };

  function inferStatus(start, end) {
    const t = today();
    const s = parseDate(start);
    const e = parseDate(end);
    if (e < t) return 'done';
    if (s <= t && t <= e) return 'doing';
    return 'todo';
  }

  const SAMPLE_SCHEDULE = `源之蜂巢 1.2.6 + 零散需求排期
项目周期
开发：7 天｜06.03 - 06.10
测试：2 天｜06.11 - 06.12
验收：1天｜06.15
需求明细
一、OA 功能
1.渠道激活：指定周期内，将登录、流水未达标渠道划入激活池
2.开服表：列表排序调整为创建时间倒序
3.角色查询：优化接口查询效率
4.自动发放礼包：新增关键词搜索输入功能
5.OA 移动端：下线账号密码登录，仅保留手机验证码登录
二、管理后台
1.调整联运游戏分发规则
三、会长端
1.扶持申请：删除页面指定文案
2.游戏盒子申请：安卓、iOS 打包合并
四、龙翔盒子后台
1.新增礼包排序配置功能
2.新增唯一码查看入口
五、会长游戏落地页
1.新增链接格式校验，非法链接禁止跳转访问
原分包系统需求 顺延至7.2验收完毕`;

  function mdToIso(m, d, year) {
    return fmtDate(new Date(year, m - 1, d));
  }

  function parseScheduleText(text) {
    const year = today().getFullYear();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let projectName = '';
    let devRange = null;
    const milestoneTasks = [];
    const sectionMap = {};
    let currentSection = '';
    const extraProjects = [];

    lines.forEach((line) => {
      if (/^项目周期$|^需求明细$/.test(line)) return;

      const deferMatch = line.match(/^(.+?)\s*顺延至\s*(\d{1,2})\.(\d{1,2})/);
      if (deferMatch) {
        const name = deferMatch[1].trim();
        const end = mdToIso(+deferMatch[2], +deferMatch[3], year);
        const start = devRange ? devRange.start : fmtDate(today());
        extraProjects.push({
          name: name.length > 20 ? name.slice(0, 20) : name,
          tasks: [{ name: '顺延验收', start, end, status: inferStatus(start, end) }],
        });
        return;
      }

      const phaseMatch = line.match(/^([^：:]+)[：:]\s*(?:\d+\s*天\s*)?[｜|]\s*(\d{1,2})\.(\d{1,2})(?:\s*[-–~至到]\s*(\d{1,2})\.(\d{1,2}))?/);
      if (phaseMatch && /开发|测试|验收|联调|上线|设计|评审/.test(phaseMatch[1])) {
        const name = phaseMatch[1].trim();
        const m1 = +phaseMatch[2];
        const d1 = +phaseMatch[3];
        const m2 = phaseMatch[4] ? +phaseMatch[4] : m1;
        const d2 = phaseMatch[5] ? +phaseMatch[5] : d1;
        const start = mdToIso(m1, d1, year);
        const end = mdToIso(m2, d2, year);
        milestoneTasks.push({ name, start, end, status: inferStatus(start, end) });
        if (/开发/.test(name)) devRange = { start, end };
        return;
      }

      const secMatch = line.match(/^[一二三四五六七八九十百]+、(.+)$/);
      if (secMatch) {
        currentSection = secMatch[1].trim();
        if (!sectionMap[currentSection]) sectionMap[currentSection] = [];
        return;
      }

      const reqMatch = line.match(/^\d+[.、]\s*(.+?)(?:[:：]|$)/);
      if (reqMatch && currentSection) {
        const taskName = reqMatch[1].trim();
        const range = devRange || { start: fmtDate(today()), end: fmtDate(addDays(today(), 7)) };
        sectionMap[currentSection].push({
          name: taskName.length > 28 ? taskName.slice(0, 28) + '…' : taskName,
          start: range.start,
          end: range.end,
          status: inferStatus(range.start, range.end),
        });
        return;
      }

      if (!projectName && !/^[\d一二三四五六七八九十]/.test(line) && line.length <= 60) {
        projectName = line.replace(/\s*排期\s*$/, '').trim();
      }
    });

    if (!projectName) projectName = '导入项目';

    const result = [];
    if (milestoneTasks.length) {
      result.push({ name: projectName, tasks: milestoneTasks });
    }
    Object.keys(sectionMap).forEach((sec) => {
      if (sectionMap[sec].length) {
        result.push({ name: sec, tasks: sectionMap[sec] });
      }
    });
    extraProjects.forEach((p) => result.push(p));

    if (!result.length) {
      throw new Error('未能识别排期内容，请检查格式（需含阶段日期或需求条目）');
    }
    return result;
  }

  function applyParsedProjects(parsed) {
    projects = [];
    tasks = [];
    parsed.forEach((p) => {
      const pid = 'p' + Date.now() + Math.random().toString(36).slice(2, 6);
      projects.push({ id: pid, name: p.name });
      p.tasks.forEach((tk) => {
        tasks.push({
          id: 't' + Date.now() + Math.random().toString(36).slice(2, 6),
          projectId: pid,
          name: tk.name,
          start: tk.start,
          end: tk.end,
          status: tk.status,
        });
      });
    });
    render();
    switchView('single');
  }

  let pendingImage = null;

  function openModal() {
    $('parseModal').classList.remove('hide');
    $('parseInput').focus();
  }

  function closeModal() {
    $('parseModal').classList.add('hide');
    pendingImage = null;
    $('imgPreview').classList.add('hide');
    $('imgPreview').innerHTML = '';
  }

  function setParseLog(msg, type) {
    const el = $('parseLog');
    el.textContent = msg;
    el.className = 'parse-log' + (type ? ' is-' + type : '');
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function ocrImage(file) {
    setParseLog('正在识别图片文字…');
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
    const result = await Tesseract.recognize(file, 'chi_sim+eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setParseLog('识别中 ' + Math.round(m.progress * 100) + '%');
        }
      },
    });
    return result.data.text;
  }

  function handleImageFile(file) {
    pendingImage = file;
    const url = URL.createObjectURL(file);
    $('imgPreview').innerHTML = '<img src="' + url + '" alt="粘贴的图片"><p>已贴入图片，点击「解析并生成」进行 OCR 识别</p>';
    $('imgPreview').classList.remove('hide');
    setParseLog('已贴入图片，点击「解析并生成」识别');
  }

  $('openParseBtn').onclick = openModal;
  $('closeModal').onclick = closeModal;
  $('modalBackdrop').onclick = closeModal;

  $('parseSampleBtn').onclick = function () {
    $('parseInput').value = SAMPLE_SCHEDULE;
    setParseLog('已填入示例排期');
  };

  $('pasteZone').addEventListener('paste', function (e) {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        handleImageFile(items[i].getAsFile());
        return;
      }
    }
  });

  $('parseBtn').onclick = async function () {
    let text = $('parseInput').value.trim();
    try {
      if (pendingImage) {
        text = (await ocrImage(pendingImage)).trim();
        $('parseInput').value = text;
        pendingImage = null;
        $('imgPreview').classList.add('hide');
        $('imgPreview').innerHTML = '';
      }
      if (!text) {
        setParseLog('请先粘贴文字或图片', 'error');
        return;
      }
      const parsed = parseScheduleText(text);
      const totalTasks = parsed.reduce((n, p) => n + p.tasks.length, 0);
      applyParsedProjects(parsed);
      closeModal();
      setStatus('已解析 · ' + parsed.length + ' 个项目、' + totalTasks + ' 条任务');
    } catch (err) {
      setParseLog(err.message || '解析失败', 'error');
    }
  };

  $('demoBtn').onclick = function () {
    const t = today();
    projects = [
      { id: 'p1', name: '移动端 2.0' },
      { id: 'p2', name: '后台重构' },
      { id: 'p3', name: '数据大屏' },
    ];
    tasks = [
      { id: 't1', projectId: 'p1', name: 'UI 设计', start: fmtDate(addDays(t, -3)), end: fmtDate(addDays(t, 2)), status: 'doing' },
      { id: 't2', projectId: 'p1', name: '前端开发', start: fmtDate(addDays(t, 1)), end: fmtDate(addDays(t, 10)), status: 'todo' },
      { id: 't3', projectId: 'p1', name: '提测', start: fmtDate(addDays(t, 9)), end: fmtDate(addDays(t, 12)), status: 'todo' },
      { id: 't4', projectId: 'p2', name: '架构评审', start: fmtDate(addDays(t, -5)), end: fmtDate(addDays(t, -2)), status: 'done' },
      { id: 't5', projectId: 'p2', name: 'API 改造', start: fmtDate(addDays(t, -1)), end: fmtDate(addDays(t, 8)), status: 'doing' },
      { id: 't6', projectId: 'p2', name: '迁移验证', start: fmtDate(addDays(t, 7)), end: fmtDate(addDays(t, 14)), status: 'todo' },
      { id: 't7', projectId: 'p3', name: '需求确认', start: fmtDate(addDays(t, -2)), end: fmtDate(t), status: 'done' },
      { id: 't8', projectId: 'p3', name: '图表组件', start: fmtDate(addDays(t, 1)), end: fmtDate(addDays(t, 9)), status: 'doing' },
      { id: 't9', projectId: 'p3', name: '联调上线', start: fmtDate(addDays(t, 8)), end: fmtDate(addDays(t, 15)), status: 'todo' },
    ];
    setStatus('已加载 3 个项目 · 9 条任务 · 可切换「多项目并排」查看');
    render();
  };

  $('tabSingle').onclick = () => switchView('single');
  $('tabMulti').onclick = () => switchView('multi');

  const t = today();
  $('startDate').value = fmtDate(t);
  $('endDate').value = fmtDate(addDays(t, 4));
  const restored = loadStorage();
  render();
  if (restored) {
    setStatus('已从浏览器恢复 · ' + projects.length + ' 个项目、' + tasks.length + ' 条任务（关服务不影响，数据在本地）');
  }
})();
