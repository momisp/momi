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
  const [rounds, setRounds] = useState(6);
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
            max={6}
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
        <h2>R5 · 资源闭环 · 试玩可见</h2>
        <ul>
          <li>
            <code>sync_playable_assets.mjs</code>：playable/assets → 模式根 assets
          </li>
          <li>
            HUD <strong>素材 4/4 · 音效 11/11</strong> pill；Kenney/PNG 落盘即变绿
          </li>
          <li>
            <code>smoke_settle.mjs</code>：180s 胜利 / 0 气血败北；结算 R/Enter 重开
          </li>
        </ul>
        <h2>R6 · 入阵门 + 商用资源引导</h2>
        <ul>
          <li>
            <code>CircleSurvivorGame.jsx</code>：点击「入阵试炼」解锁 BGM/SFX；物理 WASD（<code>e.code</code>）
          </li>
          <li>
            <code>bootstrap_commercial_assets.mjs</code> / <code>check_assets_ready.mjs</code>：双 pill 4/4·11/11 磁盘验收
          </li>
          <li>
            <code>smoke_playable.mjs</code>：资源齐时输出 <code>CHECK assets_ready</code>
          </li>
        </ul>
        <h3>R4–R6 polish（程序层）</h3>
        <ul>
          <li>
            <code>visual_polish.js</code> / <code>procedural_art.js</code> / <code>render.js</code>：震屏、飘字、结界 FX
          </li>
          <li>P0：Kenney 11 ogg + 四槽 PNG 落盘后刷新试玩</li>
        </ul>
        <h3>R3–R5 回顾</h3>
        <ul>
          <li>R3 粒子/渡劫 150·175；playable 四槽 PNG + SFX 5/5（R4/R5）</li>
          <li>P0：Web 路由同步 <code>assets/ai</code> + Kenney 11 ogg</li>
        </ul>
      </section>
    </div>
  );
}
