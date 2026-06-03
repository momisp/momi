(function () {
  const DAY_W = 32;
  const MINI_W = 22;
  const PCOLORS = ['#2563eb', '#7c3aed', '#db2777', '#d97706', '#059669', '#dc2626'];
  let projects = [];
  let tasks = [];
  let view = 'single';
  let drag = null;

  const $ = (id) => document.getElementById(id);
  const statusBar = $('statusBar');

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
  render();
})();
