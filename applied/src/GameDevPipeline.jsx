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
  const [rounds, setRounds] = useState(1);
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
        <h2>本轮开发改动（R1 · 开发）</h2>
        <ul>
          <li>
            <code>modes/circle_survivor/</code> 完整 React Canvas 试炼：御剑/雷掌/符箓、破境升级层、渡劫结算
          </li>
          <li>
            <code>balance.js</code> 前 30 秒低刷怪 + 快升级，180 秒胜利线与渡劫兽波次
          </li>
          <li>
            <code>render.js</code> / <code>audio.js</code> 矢量修仙风 + 五音 ambient BGM（可关）
          </li>
          <li>
            结算「再入试炼」「返回道台」与升级面板 <code>z-index</code> 修复，避免被 canvas 挡住
          </li>
        </ul>
      </section>
    </div>
  );
}
