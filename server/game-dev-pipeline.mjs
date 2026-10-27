import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = 3921;

const sessions = new Map();

const ROLE_STUBS = {
  dev: (req, round) =>
    `# R${round} 开发\n\n需求摘要：${req.slice(0, 200)}\n\n- modes/circle_survivor：scene_ambient 粒子、render 呼吸结界/FX\n- 渡劫 150/175s、同屏 1 劫、神通 HUD、天道赐法三选一\n- balance 后段 spawn 微调；资源 PNG/ogg 仍待 art/audio 落盘`,
  'art-ui': () => `# 美术UI\n\n- 矢量修仙主角/妖兽 fallback\n- 灵气圈、符箓、雷环特效\n- slots.json 接 PNG 贴图槽`,
  audio: () => `# 音效\n\n- WebAudio procedural：斩妖、雷掌、破境、败北/胜利\n- 可选 manifest.ogg；BGM 五音 ambient 开关`,
  balance: () => `# 数值\n\n- xpToNextLevel 前期 12+\n- spawnBudgetAt 分段增长\n- 150s+ 渡劫兽`,
  qa: () => `# QA 清单\n\n1. /play/circle-survivor 30s 内可升级\n2. 升级面板可点选\n3. 死亡/180s 结算按钮\n4. BGM/静音`,
  product: () => `# 策划\n\n对标模式五 PRD：圆内移动、自动功法、破境三选一、3分钟渡劫`,
};

function writeStep(sessionId, round, role, text) {
  const dir = path.join(ROOT, 'generated', sessionId, 'game-pipeline');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `R${round}-${role}.md`), text, 'utf8');
}

function runPipeline(sessionId, requirement, rounds) {
  const steps = [];
  for (let r = 1; r <= rounds; r++) {
    for (const role of Object.keys(ROLE_STUBS)) {
      steps.push({ round: r, role, text: ROLE_STUBS[role](requirement, r) });
    }
  }
  sessions.set(sessionId, { steps, cursor: 0, listeners: [] });
  let i = 0;
  const tick = () => {
    const s = sessions.get(sessionId);
    if (!s || i >= s.steps.length) {
      s?.listeners.forEach((res) => {
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      });
      return;
    }
    const step = s.steps[i];
    writeStep(sessionId, step.round, step.role, step.text);
    const payload = {
      type: 'step',
      index: i,
      role: step.role,
      text: step.text,
    };
    s.listeners.forEach((res) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    });
    i += 1;
    setTimeout(tick, 400);
  };
  tick();
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (url.pathname === '/agile-sim/api/game-pipeline/start' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const { requirement = '', rounds = 1 } = JSON.parse(body || '{}');
      const sessionId = `default-${Date.now()}`;
      runPipeline(sessionId, requirement, Math.min(3, Math.max(1, Number(rounds) || 1)));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ sessionId }));
    });
    return;
  }

  if (url.pathname === '/agile-sim/api/game-pipeline/stream') {
    const sessionId = url.searchParams.get('sessionId');
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    const s = sessions.get(sessionId);
    if (s) s.listeners.push(res);
    req.on('close', () => {
      if (s) s.listeners = s.listeners.filter((r) => r !== res);
    });
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, () => {
  console.log(`game-dev-pipeline on :${PORT}`);
});
