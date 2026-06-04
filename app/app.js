(function () {
  'use strict';

  /* ========== Layer 0: 可替换配置（后续可改为远程 config.json） ========== */
  const DEFAULT_CONFIG = {
    appName: '墨秘',
    appSlug: 'momi',
    storageKey: 'momi.v1',
    settingsKey: 'momi.settings',
    wordTodayKey: 'momi.wordToday',
    autosaveMs: 1200,
    longChapterWarn: 8000,
    mockDelayMs: 900,
    layout: { sidebarWidth: '240px', assistWidth: '320px' },
    assistTabs: [
      { id: 'ai', label: 'AI 助手' },
      { id: 'chars', label: '角色' },
      { id: 'world', label: '世界观' },
      { id: 'outline', label: '大纲' },
      { id: 'ideas', label: '灵感' }
    ],
    chapterStatus: [
      { id: 'todo', label: '未写' },
      { id: 'wip', label: '进行中' },
      { id: 'done', label: '已完成' }
    ],
    aiActions: [
      { id: 'continue', label: '续写', primary: true },
      { id: 'polish', label: '润色', needSelection: true },
      { id: 'expand', label: '扩写' }
    ],
    worldFields: [
      { id: 'era', label: '时代' },
      { id: 'geo', label: '地理' },
      { id: 'factions', label: '势力' },
      { id: 'rules', label: '规则' }
    ]
  };

  /* ========== Layer 0: 可替换主题（token → CSS 变量） ========== */
  const THEMES = {
    crystalClear: {
      '--bg': '#f0f2f6', '--panel': '#ffffff', '--panel2': '#f6f8fb',
      '--border': 'rgba(15, 23, 42, 0.07)', '--text': '#1e293b', '--muted': '#64748b',
      '--accent': '#2563eb', '--accent-hover': '#1d4ed8', '--accent2': '#d97706',
      '--danger': '#dc2626', '--ok': '#16a34a', '--editor-bg': '#ffffff',
      '--shadow-sm': '0 1px 2px rgba(15, 23, 42, 0.05)',
      '--shadow-md': '0 6px 20px rgba(15, 23, 42, 0.06)',
      '--shadow-lg': '0 12px 40px rgba(15, 23, 42, 0.1)'
    },
    lightPaper: {
      '--bg': '#f7f4ef', '--panel': '#fffdf9', '--panel2': '#f3efe8',
      '--border': 'rgba(60, 50, 40, 0.1)', '--text': '#2a2620', '--muted': '#6b655c',
      '--accent': '#1a7a6e', '--accent-hover': '#14665c', '--accent2': '#b8860b',
      '--danger': '#b91c1c', '--ok': '#3d8c40', '--editor-bg': '#fffdf9',
      '--shadow-sm': '0 1px 2px rgba(42, 38, 32, 0.06)',
      '--shadow-md': '0 6px 18px rgba(42, 38, 32, 0.07)',
      '--shadow-lg': '0 12px 36px rgba(42, 38, 32, 0.1)'
    },
    darkInk: {
      '--bg': '#0f1115', '--panel': '#161a22', '--panel2': '#1c212b', '--border': '#2a3140',
      '--text': '#e8eaed', '--muted': '#8b93a7', '--accent': '#3dd6c6', '--accent-hover': '#2eb8a8',
      '--accent2': '#f0b429', '--danger': '#f07178', '--ok': '#7fd962', '--editor-bg': '#12151c',
      '--shadow-sm': '0 1px 2px rgba(0,0,0,.2)', '--shadow-md': '0 6px 20px rgba(0,0,0,.25)',
      '--shadow-lg': '0 12px 40px rgba(0,0,0,.35)'
    },
    darkForest: {
      '--bg': '#0d1210', '--panel': '#141c18', '--panel2': '#1a2420', '--border': '#2a3d34',
      '--text': '#e6ebe8', '--muted': '#8a9d92', '--accent': '#5ecf8a', '--accent-hover': '#4ab872',
      '--accent2': '#d4a853', '--danger': '#e87a7a', '--ok': '#7fd962', '--editor-bg': '#101614',
      '--shadow-sm': '0 1px 2px rgba(0,0,0,.2)', '--shadow-md': '0 6px 20px rgba(0,0,0,.25)',
      '--shadow-lg': '0 12px 40px rgba(0,0,0,.35)'
    }
  };

  function applyTheme(themeId) {
    const tokens = THEMES[themeId] || THEMES.crystalClear;
    const root = document.documentElement;
    Object.entries(tokens).forEach(([k, v]) => root.style.setProperty(k, v));
  }

  /* ========== Layer 1: 事件总线（模块解耦） ========== */
  const bus = {
    _h: {},
    on(ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); },
    off(ev, fn) { this._h[ev] = (this._h[ev] || []).filter(f => f !== fn); },
    emit(ev, payload) { (this._h[ev] || []).forEach(f => f(payload)); }
  };

  /* ========== Layer 2: 工具 ========== */
  const $ = (id) => document.getElementById(id);
  const uid = () => 'id_' + Math.random().toString(36).slice(2, 11);
  const countWords = (text) => (text || '').replace(/\s/g, '').length;

  function toast(msg, isErr) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.toggle('err', !!isErr);
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2800);
  }

  /* ========== Layer 3: 存储服务 ========== */
  const StorageService = {
    load() {
      try {
        const raw = localStorage.getItem(DEFAULT_CONFIG.storageKey);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    },
    save(data) {
      try {
        localStorage.setItem(DEFAULT_CONFIG.storageKey, JSON.stringify(data));
        return true;
      } catch (e) {
        bus.emit('save:error', e);
        return false;
      }
    },
    loadSettings() {
      try {
        const raw = localStorage.getItem(DEFAULT_CONFIG.settingsKey);
        return raw ? JSON.parse(raw) : { theme: 'crystalClear', apiBase: '', apiKey: '', apiModel: 'gpt-4o-mini' };
      } catch { return { theme: 'crystalClear', apiBase: '', apiKey: '', apiModel: 'gpt-4o-mini' }; }
    },
    saveSettings(s) {
      localStorage.setItem(DEFAULT_CONFIG.settingsKey, JSON.stringify(s));
    },
    getTodayWords() {
      const key = DEFAULT_CONFIG.wordTodayKey;
      const today = new Date().toDateString();
      try {
        const o = JSON.parse(localStorage.getItem(key) || '{}');
        if (o.date !== today) return { date: today, count: 0 };
        return o;
      } catch { return { date: today, count: 0 }; }
    },
    addTodayWords(n) {
      const key = DEFAULT_CONFIG.wordTodayKey;
      const o = this.getTodayWords();
      o.count += n;
      localStorage.setItem(key, JSON.stringify(o));
      return o.count;
    }
  };

  /* ========== Layer 4: 领域模型 — 示例种子数据 ========== */
  function createSampleWork() {
    const ch1 = uid();
    const ch2 = uid();
    return {
      id: uid(),
      title: '星辰大海',
      createdAt: Date.now(),
      outlineBook: '星际殖民时代，少年意外获得古老星图，踏上寻亲与拯救联邦之路。',
      world: {
        era: '公元 3127 年，人类联邦成立第 400 年。',
        geo: '太阳系外环 · 半人马座前哨站',
        factions: '联邦海军、自由商盟、遗迹教会',
        rules: '超光速航行需星门密钥；灵能者受《基因协定》约束。'
      },
      characters: [
        { id: uid(), name: '林远', role: '主角', traits: '冷静、执念', notes: '前哨站机械师，身世成谜' },
        { id: uid(), name: '苏棠', role: '女主', traits: '果敢、幽默', notes: '商盟情报员' }
      ],
      ideas: [
        { id: uid(), text: '星图碎片在废弃信标里发光', at: Date.now() }
      ],
      chapters: [
        {
          id: ch1,
          title: '第一章 信标微光',
          status: 'done',
          outline: '林远检修信标时发现异常信号。',
          body: '半人马座前哨站的夜，永远比昼更长。\n\n林远拧紧最后一枚螺栓时，头盔里的通讯器忽然嘶鸣——那不是风噪，而是某种有节奏的脉冲，像一颗遥远的心脏在敲门。'
        },
        {
          id: ch2,
          title: '第二章 商盟来客',
          status: 'wip',
          outline: '苏棠带来联邦通缉令，两人交易情报。',
          body: '气闸开启的瞬间，林远就认出了那身涂装：自由商盟从不白跑一趟。'
        }
      ],
      activeChapterId: ch2
    };
  }

  function createEmptyWork(title) {
    const chId = uid();
    return {
      id: uid(),
      title: title || '未命名作品',
      createdAt: Date.now(),
      outlineBook: '',
      world: { era: '', geo: '', factions: '', rules: '' },
      characters: [],
      ideas: [],
      chapters: [{
        id: chId,
        title: '第一章',
        status: 'todo',
        outline: '',
        body: ''
      }],
      activeChapterId: chId
    };
  }

  /* ========== Layer 5: 应用状态 ========== */
  const state = {
    works: [],
    currentWorkId: null,
    dirty: false,
    settings: StorageService.loadSettings(),
    pendingChapterId: null,
    preview: false,
    focus: false,
    lastSnapshot: ''
  };

  function getWork() {
    return state.works.find(w => w.id === state.currentWorkId) || null;
  }
  function getChapter(work, chId) {
    return (work && work.chapters) ? work.chapters.find(c => c.id === chId) : null;
  }
  function getActiveChapter(work) {
    if (!work) return null;
    return getChapter(work, work.activeChapterId) || work.chapters[0] || null;
  }

  /* ========== Layer 6: AI 服务（Mock / 可插拔 HTTP） ========== */
  const AIService = {
    async run(action, ctx) {
      const { settings } = state;
      const hasApi = settings.apiBase && settings.apiKey;
      if (hasApi) {
        try {
          return await this._callApi(action, ctx);
        } catch (e) {
          toast('AI 请求失败：' + (e.message || '网络错误'), true);
          throw e;
        }
      }
      await new Promise(r => setTimeout(r, DEFAULT_CONFIG.mockDelayMs));
      return this._mock(action, ctx);
    },
    _mock(action, ctx) {
      const names = (ctx.characters || []).map(c => c.name).join('、') || '角色';
      const tail = (ctx.body || '').slice(-80);
      const prompts = {
        continue: `【续写·Mock】\n（已注入：${names}；世界观摘要已读）\n\n${tail}\n\n——信标深处的光芒骤然增强，林远感到掌心的老茧在发麻。他想起苏棠说过的话：有些门，敲响了就不能装作没听见。他深吸一口气，把扳手别回腰间，朝黑暗里迈出第一步。`,
        polish: `【润色·Mock】\n${ctx.selection || ctx.body}\n\n→ 文笔已略作收紧，保留原意与节奏。`,
        expand: `【扩写·Mock】\n在原段落后展开环境声、气味与心理活动，拉长镜头但不改变剧情走向。前哨站的金属走廊回荡着远处液压臂的叹息……`
      };
      return prompts[action] || '【Mock】未知操作';
    },
    async _callApi(action, ctx) {
      const base = state.settings.apiBase.replace(/\/$/, '');
      const model = state.settings.apiModel || 'gpt-4o-mini';
      const sys = '你是小说写作助手，输出中文正文，不要解释。';
      let user = '';
      if (action === 'continue') {
        user = `角色：${JSON.stringify(ctx.characters)}\n世界观：${JSON.stringify(ctx.world)}\n前文：\n${ctx.body}\n\n指令：${ctx.prompt || '续写约200字'}`;
      } else if (action === 'polish') {
        user = `润色以下片段：\n${ctx.selection}\n\n指令：${ctx.prompt || '保持风格'}`;
      } else {
        user = `扩写：\n${ctx.body}\n\n指令：${ctx.prompt || '增加细节'}`;
      }
      const res = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + state.settings.apiKey
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
          temperature: 0.85
        })
      });
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }
  };

  /* ========== Layer 7: 导出服务 ========== */
  const ExportService = {
    bookTxt(work) {
      let out = `《${work.title}》\n\n`;
      if (work.outlineBook) out += `【全书摘要】\n${work.outlineBook}\n\n`;
      work.chapters.forEach((ch, i) => {
        out += `\n${'='.repeat(40)}\n${ch.title || '第' + (i + 1) + '章'}\n`;
        if (ch.outline) out += `【梗概】${ch.outline}\n\n`;
        out += (ch.body || '') + '\n';
      });
      return out;
    },
    download(filename, text) {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };

  /* ========== Layer 8: UI 渲染（按 region 分区，便于换皮） ========== */
  const UI = {
    setSaveStatus(kind, text) {
      const el = $('saveStatus');
      el.className = 'save-status ' + (kind || '');
      el.textContent = text;
    },
    renderWorkSelect() {
      const sel = $('workSelect');
      sel.innerHTML = '';
      state.works.forEach(w => {
        const o = document.createElement('option');
        o.value = w.id;
        o.textContent = w.title;
        sel.appendChild(o);
      });
      sel.value = state.currentWorkId || '';
      sel.disabled = state.works.length === 0;
    },
    renderChapterList() {
      const work = getWork();
      const list = $('chapterList');
      list.innerHTML = '';
      if (!work) return;
      work.chapters.forEach(ch => {
        const div = document.createElement('div');
        div.className = 'chapter-item' + (ch.id === work.activeChapterId ? ' active' : '');
        div.dataset.id = ch.id;
        const dot = document.createElement('span');
        dot.className = 'status-dot ' + (ch.status === 'done' ? 'done' : ch.status === 'wip' ? 'wip' : '');
        const title = document.createElement('span');
        title.className = 'title';
        title.textContent = ch.title || '未命名章节';
        div.appendChild(dot);
        div.appendChild(title);
        div.addEventListener('click', () => ChapterModule.switchTo(ch.id));
        list.appendChild(div);
      });
      const done = work.chapters.filter(c => c.status === 'done').length;
      const pct = work.chapters.length ? Math.round((done / work.chapters.length) * 100) : 0;
      $('progressFill').style.width = pct + '%';
      $('progressLabel').textContent = `全书进度 ${pct}%（${done}/${work.chapters.length} 章已完成）`;
    },
    renderEditorVisibility() {
      const work = getWork();
      const hasWork = !!work;
      const hasCh = hasWork && work.chapters.length > 0;
      $('emptyWorks').style.display = hasWork ? 'none' : 'flex';
      $('emptyChapters').style.display = hasWork && !hasCh ? 'flex' : 'none';
      $('editorMain').style.display = hasCh ? 'flex' : 'none';
    },
    renderEditor() {
      const work = getWork();
      const ch = getActiveChapter(work);
      UI.renderEditorVisibility();
      if (!ch) return;
      $('chapterTitle').value = ch.title || '';
      $('chapterSummaryLine').textContent = '本章梗概：' + (ch.outline || '（在大纲 Tab 编辑）');
      $('editorBody').textContent = ch.body || '';
      const wc = countWords(ch.body);
      $('wordCount').textContent = wc;
      if (wc >= DEFAULT_CONFIG.longChapterWarn) {
        toast('本章已超过 ' + DEFAULT_CONFIG.longChapterWarn + ' 字，建议拆分', false);
      }
      const today = StorageService.getTodayWords();
      $('wordToday').textContent = today.count;
      state.lastSnapshot = EditorModule.snapshot();
      state.dirty = false;
      UI.setSaveStatus('ok', '已保存');
    },
    buildAssistPanel() {
      const tabsEl = $('assistTabs');
      const panesEl = $('tabPanes');
      tabsEl.innerHTML = '';
      panesEl.innerHTML = '';
      DEFAULT_CONFIG.assistTabs.forEach((tab, i) => {
        const t = document.createElement('div');
        t.className = 'tab' + (i === 0 ? ' active' : '');
        t.dataset.tab = tab.id;
        t.textContent = tab.label;
        t.addEventListener('click', () => UI.activateTab(tab.id));
        tabsEl.appendChild(t);
        const pane = document.createElement('div');
        pane.className = 'tab-pane' + (i === 0 ? ' active' : '');
        pane.id = 'pane-' + tab.id;
        panesEl.appendChild(pane);
      });
      UI.renderPaneAI($('pane-ai'));
      UI.renderPaneChars($('pane-chars'));
      UI.renderPaneWorld($('pane-world'));
      UI.renderPaneOutline($('pane-outline'));
      UI.renderPaneIdeas($('pane-ideas'));
    },
    activateTab(id) {
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === 'pane-' + id));
    },
    renderPaneAI(pane) {
      pane.innerHTML = `
        <div class="hint-bar">未配置 API 时使用 Mock；润色需先在正文选中文字</div>
        <div class="ai-toolbar" id="aiToolbar"></div>
        <textarea class="ai-prompt" id="aiPrompt" placeholder="创作指令（可选）：风格、视角、禁忌…"></textarea>
        <div class="ai-output" id="aiOutput">AI 结果将显示在这里</div>
        <div class="ai-actions">
          <button type="button" id="btnInsert">插入光标处</button>
          <button type="button" id="btnReplace">替换全文</button>
          <button type="button" id="btnClearAi" class="ghost">清空</button>
        </div>`;
      const toolbar = pane.querySelector('#aiToolbar');
      DEFAULT_CONFIG.aiActions.forEach(a => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = a.label;
        if (a.primary) b.className = 'primary';
        b.dataset.action = a.id;
        b.addEventListener('click', () => AIModule.run(a.id));
        toolbar.appendChild(b);
      });
      pane.querySelector('#btnInsert').addEventListener('click', () => AIModule.insertResult(false));
      pane.querySelector('#btnReplace').addEventListener('click', () => AIModule.insertResult(true));
      pane.querySelector('#btnClearAi').addEventListener('click', () => {
        const o = $('aiOutput');
        o.textContent = 'AI 结果将显示在这里';
        o.classList.remove('has-text', 'loading');
      });
    },
    renderPaneChars(pane) {
      pane.innerHTML = `
        <div class="card-list" id="charList"></div>
        <div class="form-pane" id="charForm" style="display:none"></div>
        <button type="button" id="btnAddChar" class="pane-footer-btn">+ 添加角色</button>`;
      pane.querySelector('#btnAddChar').addEventListener('click', () => CharsModule.add());
      UI.refreshChars();
    },
    renderPaneWorld(pane) {
      let html = '<div class="form-pane">';
      DEFAULT_CONFIG.worldFields.forEach(f => {
        html += `<label>${f.label}</label><textarea id="world_${f.id}" data-field="${f.id}"></textarea>`;
      });
      html += '</div>';
      pane.innerHTML = html;
      pane.querySelectorAll('textarea').forEach(ta => {
        ta.addEventListener('input', () => {
          const work = getWork();
          if (!work) return;
          work.world[ta.dataset.field] = ta.value;
          EditorModule.markDirty();
          WorksModule.persist();
        });
      });
    },
    renderPaneOutline(pane) {
      pane.innerHTML = `
        <div class="form-pane">
          <label>全书摘要</label>
          <textarea id="outlineBook"></textarea>
          <label>本章梗概</label>
          <textarea id="outlineChapter"></textarea>
        </div>`;
      $('outlineBook').addEventListener('input', e => {
        const w = getWork(); if (!w) return;
        w.outlineBook = e.target.value;
        EditorModule.markDirty();
        WorksModule.persist();
      });
      $('outlineChapter').addEventListener('input', e => {
        const w = getWork(); const ch = getActiveChapter(w);
        if (!ch) return;
        ch.outline = e.target.value;
        $('chapterSummaryLine').textContent = '本章梗概：' + (ch.outline || '（在大纲 Tab 编辑）');
        EditorModule.markDirty();
        WorksModule.persist();
      });
    },
    renderPaneIdeas(pane) {
      pane.innerHTML = `
        <div class="card-list" id="ideaList"></div>
        <button type="button" id="btnAddIdea" class="pane-footer-btn">+ 记录灵感</button>`;
      pane.querySelector('#btnAddIdea').addEventListener('click', () => IdeasModule.add());
      UI.refreshIdeas();
    },
    refreshChars() {
      const work = getWork();
      const list = $('charList');
      if (!list) return;
      list.innerHTML = '';
      if (!work || !work.characters.length) {
        list.innerHTML = '<p class="empty-hint">还没有角色。添加主角与配角，续写时会注入姓名。</p>';
        return;
      }
      work.characters.forEach(c => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h3>${c.name || '未命名'}</h3><p>${c.role || ''} · ${c.traits || ''}</p><p>${c.notes || ''}</p>
          <div class="card-actions"><button type="button" data-edit>编辑</button><button type="button" data-del>删除</button></div>`;
        card.querySelector('[data-edit]').addEventListener('click', (e) => { e.stopPropagation(); CharsModule.edit(c.id); });
        card.querySelector('[data-del]').addEventListener('click', (e) => { e.stopPropagation(); CharsModule.remove(c.id); });
        list.appendChild(card);
      });
    },
    refreshCharForm(char) {
      const form = $('charForm');
      if (!form) return;
      form.style.display = 'block';
      form.innerHTML = `
        <label>姓名</label><input id="cf_name" value="${char.name || ''}" />
        <label>定位</label><input id="cf_role" value="${char.role || ''}" />
        <label>性格标签</label><input id="cf_traits" value="${char.traits || ''}" />
        <label>备注</label><textarea id="cf_notes">${char.notes || ''}</textarea>
        <div style="display:flex;gap:8px"><button type="button" class="primary" id="cf_save">保存角色</button><button type="button" id="cf_cancel">取消</button></div>`;
      form.querySelector('#cf_save').addEventListener('click', () => CharsModule.saveForm(char.id));
      form.querySelector('#cf_cancel').addEventListener('click', () => { form.style.display = 'none'; });
    },
    refreshIdeas() {
      const work = getWork();
      const list = $('ideaList');
      if (!list) return;
      list.innerHTML = '';
      if (!work || !work.ideas.length) {
        list.innerHTML = '<p class="empty-hint">捕捉闪念：一句场景、一句对白即可。</p>';
        return;
      }
      work.ideas.slice().reverse().forEach(idea => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<p>${idea.text}</p><div class="card-actions"><button type="button" data-del>删除</button></div>`;
        card.querySelector('[data-del]').addEventListener('click', () => IdeasModule.remove(idea.id));
        list.appendChild(card);
      });
    },
    syncWorldOutlineFields() {
      const work = getWork();
      if (!work) return;
      DEFAULT_CONFIG.worldFields.forEach(f => {
        const el = $('world_' + f.id);
        if (el) el.value = work.world[f.id] || '';
      });
      const ob = $('outlineBook');
      const oc = $('outlineChapter');
      const ch = getActiveChapter(work);
      if (ob) ob.value = work.outlineBook || '';
      if (oc) oc.value = (ch && ch.outline) || '';
    }
  };

  /* ========== Layer 9: 功能模块 ========== */
  const WorksModule = {
    init(data) {
      if (data && data.works && data.works.length) {
        state.works = data.works;
        state.currentWorkId = data.currentWorkId || data.works[0].id;
      } else {
        const sample = createSampleWork();
        state.works = [sample];
        state.currentWorkId = sample.id;
        this.persist();
      }
    },
    persist() {
      const ok = StorageService.save({
        works: state.works,
        currentWorkId: state.currentWorkId
      });
      if (!ok) UI.setSaveStatus('err', '保存失败');
      return ok;
    },
    switchWork(id) {
      if (state.dirty) {
        state.pendingChapterId = '__work__' + id;
        $('modalUnsaved').classList.add('show');
        return;
      }
      state.currentWorkId = id;
      this.persist();
      UI.renderWorkSelect();
      UI.renderChapterList();
      UI.renderEditor();
      UI.syncWorldOutlineFields();
      UI.refreshChars();
      UI.refreshIdeas();
      bus.emit('work:change', id);
    },
    add(title) {
      const w = createEmptyWork(title);
      state.works.push(w);
      state.currentWorkId = w.id;
      state.dirty = false;
      this.persist();
      UI.renderWorkSelect();
      UI.renderChapterList();
      UI.renderEditor();
      UI.syncWorldOutlineFields();
      toast('已创建《' + w.title + '》');
    }
  };

  const ChapterModule = {
    add() {
      const work = getWork();
      if (!work) return;
      const n = work.chapters.length + 1;
      const ch = { id: uid(), title: '第' + n + '章', status: 'todo', outline: '', body: '' };
      work.chapters.push(ch);
      this.switchTo(ch.id, true);
      WorksModule.persist();
    },
    switchTo(chId, force) {
      if (!force && state.dirty) {
        state.pendingChapterId = chId;
        $('modalUnsaved').classList.add('show');
        return;
      }
      const work = getWork();
      if (!work) return;
      if (!force) EditorModule.flushToChapter();
      work.activeChapterId = chId;
      WorksModule.persist();
      UI.renderChapterList();
      UI.renderEditor();
      UI.syncWorldOutlineFields();
      bus.emit('chapter:change', chId);
    },
    cycleStatus() {
      const work = getWork();
      const ch = getActiveChapter(work);
      if (!ch) return;
      const order = ['todo', 'wip', 'done'];
      const i = order.indexOf(ch.status);
      ch.status = order[(i + 1) % order.length];
      UI.renderChapterList();
      WorksModule.persist();
    }
  };

  const EditorModule = {
    snapshot() {
      const work = getWork();
      const ch = getActiveChapter(work);
      if (!ch) return '';
      return JSON.stringify({
        title: $('chapterTitle').value,
        body: $('editorBody').innerText,
        chId: ch.id
      });
    },
    flushToChapter() {
      const work = getWork();
      const ch = getActiveChapter(work);
      if (!ch) return;
      ch.title = $('chapterTitle').value.trim() || ch.title;
      ch.body = $('editorBody').innerText;
      const prev = countWords(state._lastBody || '');
      const now = countWords(ch.body);
      if (now > prev) StorageService.addTodayWords(now - prev);
      state._lastBody = ch.body;
      if (ch.body.length > 0 && ch.status === 'todo') ch.status = 'wip';
      $('wordCount').textContent = countWords(ch.body);
      const today = StorageService.getTodayWords();
      $('wordToday').textContent = today.count;
    },
    markDirty() {
      state.dirty = true;
      UI.setSaveStatus('pending', '编辑中…');
    },
    save() {
      EditorModule.flushToChapter();
      const ok = WorksModule.persist();
      if (ok) {
        state.dirty = false;
        state.lastSnapshot = EditorModule.snapshot();
        UI.setSaveStatus('ok', '已保存');
        toast('已保存');
      } else {
        UI.setSaveStatus('err', '保存失败，请重试');
        toast('保存失败，请检查浏览器存储', true);
      }
    },
    bind() {
      const title = $('chapterTitle');
      const body = $('editorBody');
      let autosaveTimer;
      const schedule = () => {
        EditorModule.markDirty();
        clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(() => EditorModule.save(), DEFAULT_CONFIG.autosaveMs);
      };
      title.addEventListener('input', schedule);
      body.addEventListener('input', schedule);
      body.addEventListener('dblclick', () => ChapterModule.cycleStatus());
    }
  };

  const AIModule = {
    async run(action) {
      const work = getWork();
      const ch = getActiveChapter(work);
      if (!ch) { toast('请先选择章节', true); return; }
      const cfg = DEFAULT_CONFIG.aiActions.find(a => a.id === action);
      const sel = window.getSelection();
      const selected = sel && !sel.isCollapsed ? sel.toString() : '';
      if (cfg && cfg.needSelection && !selected) {
        toast('润色请先在正文拖选一段文字', true);
        return;
      }
      const out = $('aiOutput');
      out.classList.add('loading');
      out.textContent = '生成中…';
      out.classList.remove('has-text');
      try {
        const text = await AIService.run(action, {
          body: ch.body,
          selection: selected,
          prompt: $('aiPrompt').value,
          characters: work.characters,
          world: work.world,
          outline: work.outlineBook
        });
        out.textContent = text;
        out.classList.remove('loading');
        out.classList.add('has-text');
      } catch {
        out.classList.remove('loading');
        out.textContent = '生成失败，请检查设置或稍后重试';
      }
    },
    insertResult(replaceAll) {
      const text = $('aiOutput').textContent;
      if (!text || text.startsWith('AI 结果') || text.startsWith('生成')) return;
      const body = $('editorBody');
      if (replaceAll) {
        body.innerText = text;
      } else {
        body.focus();
        document.execCommand('insertText', false, '\n\n' + text);
      }
      EditorModule.markDirty();
      EditorModule.save();
      toast(replaceAll ? '已替换全文' : '已插入');
    }
  };

  const CharsModule = {
    _editId: null,
    add() {
      const work = getWork();
      if (!work) return;
      const c = { id: uid(), name: '', role: '', traits: '', notes: '' };
      work.characters.push(c);
      this._editId = c.id;
      UI.refreshChars();
      UI.refreshCharForm(c);
    },
    edit(id) {
      const work = getWork();
      const c = work.characters.find(x => x.id === id);
      if (c) { this._editId = id; UI.refreshCharForm(c); }
    },
    saveForm(id) {
      const work = getWork();
      const c = work.characters.find(x => x.id === id);
      if (!c) return;
      c.name = $('cf_name').value.trim();
      c.role = $('cf_role').value;
      c.traits = $('cf_traits').value;
      c.notes = $('cf_notes').value;
      $('charForm').style.display = 'none';
      UI.refreshChars();
      WorksModule.persist();
      toast('角色已保存');
    },
    remove(id) {
      const work = getWork();
      work.characters = work.characters.filter(c => c.id !== id);
      UI.refreshChars();
      WorksModule.persist();
    }
  };

  const IdeasModule = {
    add() {
      const work = getWork();
      if (!work) return;
      const text = prompt('记下这一闪念：');
      if (!text || !text.trim()) return;
      work.ideas.push({ id: uid(), text: text.trim(), at: Date.now() });
      UI.refreshIdeas();
      WorksModule.persist();
      toast('已记录灵感');
    },
    remove(id) {
      const work = getWork();
      work.ideas = work.ideas.filter(i => i.id !== id);
      UI.refreshIdeas();
      WorksModule.persist();
    }
  };

  /* ========== Layer 10: 壳层启动 ========== */
  function applyLayoutConfig() {
    document.documentElement.style.setProperty('--sidebar-w', DEFAULT_CONFIG.layout.sidebarWidth);
    document.documentElement.style.setProperty('--assist-w', DEFAULT_CONFIG.layout.assistWidth);
  }

  function bindGlobal() {
    $('workSelect').addEventListener('change', e => WorksModule.switchWork(e.target.value));
    $('btnNewWork').addEventListener('click', () => {
      $('newWorkTitle').value = '';
      $('modalNewWork').classList.add('show');
      $('newWorkTitle').focus();
    });
    $('btnEmptyNewWork').addEventListener('click', () => $('btnNewWork').click());
    $('newWorkCancel').addEventListener('click', () => $('modalNewWork').classList.remove('show'));
    $('newWorkConfirm').addEventListener('click', () => {
      const t = $('newWorkTitle').value.trim() || '未命名作品';
      $('modalNewWork').classList.remove('show');
      WorksModule.add(t);
    });
    $('btnNewChapter').addEventListener('click', () => ChapterModule.add());
    $('btnEmptyNewChapter').addEventListener('click', () => ChapterModule.add());
    $('btnSave').addEventListener('click', () => EditorModule.save());
    $('btnExport').addEventListener('click', () => {
      const work = getWork();
      if (!work) { toast('没有可导出的作品', true); return; }
      try {
        EditorModule.flushToChapter();
        ExportService.download(work.title + '.txt', ExportService.bookTxt(work));
        toast('导出成功');
      } catch {
        toast('导出失败', true);
      }
    });
    $('btnSettings').addEventListener('click', () => {
      const s = state.settings;
      $('themeSelect').value = s.theme || 'crystalClear';
      $('apiBase').value = s.apiBase || '';
      $('apiKey').value = s.apiKey || '';
      $('apiModel').value = s.apiModel || 'gpt-4o-mini';
      $('modalSettings').classList.add('show');
    });
    $('settingsClose').addEventListener('click', () => $('modalSettings').classList.remove('show'));
    $('settingsSave').addEventListener('click', () => {
      state.settings = {
        theme: $('themeSelect').value,
        apiBase: $('apiBase').value.trim(),
        apiKey: $('apiKey').value.trim(),
        apiModel: $('apiModel').value.trim() || 'gpt-4o-mini'
      };
      StorageService.saveSettings(state.settings);
      applyTheme(state.settings.theme);
      $('modalSettings').classList.remove('show');
      toast(state.settings.apiKey ? '设置已保存（将使用真实 API）' : '设置已保存（Mock 模式）');
    });
    $('unsavedCancel').addEventListener('click', () => {
      state.pendingChapterId = null;
      $('modalUnsaved').classList.remove('show');
    });
    $('unsavedDiscard').addEventListener('click', () => {
      state.dirty = false;
      $('modalUnsaved').classList.remove('show');
      const p = state.pendingChapterId;
      state.pendingChapterId = null;
      if (p && p.startsWith('__work__')) WorksModule.switchWork(p.slice(8));
      else if (p) ChapterModule.switchTo(p, true);
    });
    $('unsavedSave').addEventListener('click', () => {
      EditorModule.save();
      $('modalUnsaved').classList.remove('show');
      const p = state.pendingChapterId;
      state.pendingChapterId = null;
      if (p && p.startsWith('__work__')) WorksModule.switchWork(p.slice(8));
      else if (p) ChapterModule.switchTo(p, true);
    });
    $('btnToggleSidebar').addEventListener('click', () => $('sidebar').classList.toggle('open'));
    $('btnToggleAssist').addEventListener('click', () => $('assist').classList.toggle('open'));
    $('btnPreview').addEventListener('click', () => {
      state.preview = !state.preview;
      $('editorBody').classList.toggle('preview', state.preview);
      $('btnPreview').textContent = state.preview ? '继续编辑' : '预览';
    });
    $('btnFocus').addEventListener('click', () => {
      state.focus = !state.focus;
      document.body.classList.toggle('focus-mode', state.focus);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && state.focus) {
        state.focus = false;
        document.body.classList.remove('focus-mode');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        EditorModule.save();
      }
    });
    bus.on('save:error', () => {
      UI.setSaveStatus('err', '保存失败');
      toast('本地存储不可用或已满', true);
    });
  }

  function boot() {
    applyLayoutConfig();
    state.settings = StorageService.loadSettings();
    applyTheme(state.settings.theme);
    UI.buildAssistPanel();
    WorksModule.init(StorageService.load());
    UI.renderWorkSelect();
    UI.renderChapterList();
    UI.renderEditor();
    UI.syncWorldOutlineFields();
    EditorModule.bind();
    bindGlobal();
    const ch = getActiveChapter(getWork());
    if (ch) state._lastBody = ch.body;
  }

  boot();

  /* 对外暴露：后续拆 SPA / 接后端时可复用 */
  window.MOMI = {
    version: '0.1.0',
    config: DEFAULT_CONFIG,
    themes: THEMES,
    bus,
    modules: {
      storage: StorageService,
      works: WorksModule,
      chapters: ChapterModule,
      editor: EditorModule,
      ai: AIService,
      export: ExportService
    },
    getState: () => ({ ...state, works: state.works })
  };
})();
