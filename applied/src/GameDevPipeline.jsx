import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './GameDevPipeline.css';

const ROLES = [
  { id: 'dev', label: '开发', emoji: '🛠' },
  { id: 'art-ui', label: '美术UI', emoji: '🎨' },
  { id: 'audio', label: '音效', emoji: '🔊' },
  { id: 'balance', label: '数值', emoji: '⚖' },
  { id: 'qa', label: 'QA', emoji: '🧪' },
  { id: 'product', label: '策划', emoji: '📜' },
];

const LS_KEY = 'game-dev-pipeline-v1';

export default function GameDevPipeline() {
  const [requirement, setRequirement] = useState('');
  const [rounds, setRounds] = useState(3);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [log, setLog] = useState('');
  const esRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      if (saved.requirement) setRequirement(saved.requirement);
      if (saved.rounds) setRounds(saved.rounds);
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ requirement, rounds }));
  }, [requirement, rounds]);

  const stopStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setRunning(false);
  }, []);

  const startPipeline = async () => {
    stopStream();
    setLog('');
    setStepIndex(-1);
    setRunning(true);
    try {
      const res = await fetch('/agile-sim/api/game-pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement, rounds: Number(rounds) }),
      });
      const { sessionId } = await res.json();
      const es = new EventSource(`/agile-sim/api/game-pipeline/stream?sessionId=${sessionId}`);
      esRef.current = es;
      es.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'step') {
          setStepIndex(msg.index);
          setLog((prev) => `${prev}\n\n--- ${msg.role} ---\n${msg.text}`);
        }
        if (msg.type === 'done') {
          stopStream();
        }
      };
      es.onerror = () => stopStream();
    } catch (e) {
      setLog(`启动失败：${e.message}\n请先 npm run server`);
      setRunning(false);
    }
  };

  return (
    <div className="gdp-root">
      <header className="gdp-header">
        <Link to="/">← 首页</Link>
        <h1>游戏多角色流水线</h1>
        <Link to="/play/circle-survivor" className="gdp-play-link">
          试玩圆内幸存者
        </Link>
      </header>

      <section className="gdp-form">
        <label>
          本轮需求
          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            rows={4}
            placeholder="例：强化修仙风特效，调前30秒节奏…"
          />
        </label>
        <label className="gdp-rounds">
          轮次
          <input
            type="number"
            min={1}
            max={3}
            value={rounds}
            onChange={(e) => setRounds(e.target.value)}
          />
        </label>
        <div className="gdp-actions">
          <button type="button" disabled={running} onClick={startPipeline}>
            {running ? '运行中…' : '启动流水线'}
          </button>
          <button type="button" disabled={!running} onClick={stopStream}>
            停止
          </button>
        </div>
      </section>

      <section className="gdp-roles" aria-label="角色进度">
        {ROLES.map((r, i) => (
          <div key={r.id} className={`gdp-role ${stepIndex >= i ? 'active' : ''}`}>
            <span className="gdp-role-emoji">{r.emoji}</span>
            <span>{r.label}</span>
          </div>
        ))}
      </section>

      <pre className="gdp-log">{log || '输出将写入 generated/…/game-pipeline/'}</pre>

      <section className="gdp-changelog">
        <h2>R3 · 开发改动清单（观感灵动 + 渡劫调平）</h2>
        <ul>
          <li>
            <code>scene_ambient.js</code>（新）：结界内飘动灵气粒子，无贴图依赖
          </li>
          <li>
            <code>render.js</code>：呼吸结界、旋转阵纹、灵韵/剑气/符箓/渡劫环 FX；<code>drawFrame</code> 接粒子层
          </li>
          <li>
            <code>balance.js</code>：渡劫波 <strong>150/175s</strong>、兽 HP 330、移速 44；后段 spawn 2.75+0.032、影魔权重 0.42
          </li>
          <li>
            <code>CircleSurvivorGame.jsx</code>：同屏仅 1 渡劫兽、<code>tribulation_warn</code>、右侧神通 HUD、「天道赐法 · 三选一」
          </li>
          <li>
            <code>circle_survivor.css</code>：神通栏光晕、赐法面板脉动、XP 条微光
          </li>
        </ul>
        <h3>R2 回顾</h3>
        <ul>
          <li>
            <code>upgrades.js</code>：神通卡 ×1.4、回春/吐纳上限 2；Esc、1/2/3 破境、manifest v2 音效映射
          </li>
        </ul>
        <p className="gdp-changelog-note">
          P0 待流水线：<code>assets/ai/*.png</code> 四槽 + <code>copy_kenney_sfx.mjs</code> 落盘 11 ogg（含 tribulation）。
        </p>
      </section>
    </div>
  );
}
