import { ARENA_RADIUS } from './balance.js';

const FX = [];

export function pushFx(fx) {
  FX.push({ ...fx, t0: performance.now() });
}

export function drawFrame(ctx, w, h, state, sprites, now) {
  ctx.save();
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  drawArena(ctx, cx, cy);
  drawOrbs(ctx, state.orbs);
  drawEnemies(ctx, state.enemies, sprites, now);
  drawProjectiles(ctx, state.projectiles, now);
  drawPlayer(ctx, state.player, sprites, now);
  drawFxLayer(ctx, now);
  drawHudOverlay(ctx, w, state);

  ctx.restore();
}

function drawArena(ctx, cx, cy) {
  const g = ctx.createRadialGradient(cx, cy, 40, cx, cy, ARENA_RADIUS + 20);
  g.addColorStop(0, '#1a2838');
  g.addColorStop(0.85, '#0f1820');
  g.addColorStop(1, '#05080c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, ARENA_RADIUS + 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(120, 200, 255, 0.35)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.arc(cx, cy, ARENA_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = 'rgba(200, 230, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (ARENA_RADIUS * i) / 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPlayer(ctx, p, sprites, now) {
  const img = sprites.player;
  const pulse = 0.85 + Math.sin(now * 0.006) * 0.15;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = p.invulnUntil > now ? 0.5 + Math.sin(now * 0.02) * 0.3 : 1;

  const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, p.radius * 2.8 * pulse);
  aura.addColorStop(0, 'rgba(100, 220, 255, 0.45)');
  aura.addColorStop(1, 'rgba(40, 120, 200, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius * 2.8 * pulse, 0, Math.PI * 2);
  ctx.fill();

  if (img) {
    ctx.drawImage(img, -p.radius * 1.4, -p.radius * 1.4, p.radius * 2.8, p.radius * 2.8);
  } else {
    ctx.fillStyle = '#2c5282';
    ctx.beginPath();
    ctx.ellipse(0, 4, p.radius * 0.9, p.radius * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8dcc8';
    ctx.beginPath();
    ctx.arc(0, -p.radius * 0.35, p.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a365d';
    ctx.fillRect(-p.radius * 0.95, p.radius * 0.1, p.radius * 1.9, p.radius * 1.2);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -p.radius * 1.2);
    ctx.lineTo(0, -p.radius * 2.2);
    ctx.stroke();
  }
  ctx.restore();
}

function enemySpriteKey(kind) {
  if (kind.id === 'qi_slime') return 'enemy_yellow';
  if (kind.id === 'wolf_demon') return 'enemy_red';
  if (kind.id === 'shadow_fiend') return 'enemy_blue';
  return 'enemy_boss';
}

function drawEnemies(ctx, enemies, sprites, now) {
  for (const e of enemies) {
    const sk = enemySpriteKey(e.kind);
    const img = sprites[sk];
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.kind.boss) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 18;
    }
    if (img) {
      const s = e.radius * 2.2;
      ctx.drawImage(img, -s / 2, -s / 2, s, s);
    } else {
      ctx.fillStyle = e.kind.color;
      ctx.beginPath();
      if (e.kind.id === 'qi_slime') {
        ctx.ellipse(0, 2, e.radius, e.radius * 0.85, 0, 0, Math.PI * 2);
      } else if (e.kind.id === 'wolf_demon') {
        ctx.moveTo(e.radius, 0);
        ctx.lineTo(-e.radius * 0.8, e.radius * 0.6);
        ctx.lineTo(-e.radius * 0.5, -e.radius * 0.7);
        ctx.closePath();
      } else {
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.fillStyle = 'rgba(255,80,80,0.9)';
      ctx.beginPath();
      ctx.arc(e.radius * 0.35, -e.radius * 0.2, 3, 0, Math.PI * 2);
      ctx.arc(-e.radius * 0.35, -e.radius * 0.2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    const hpPct = e.hp / e.maxHp;
    ctx.fillStyle = '#222';
    ctx.fillRect(-e.radius, -e.radius - 8, e.radius * 2, 4);
    ctx.fillStyle = hpPct > 0.5 ? '#4ade80' : '#f87171';
    ctx.fillRect(-e.radius, -e.radius - 8, e.radius * 2 * hpPct, 4);
    ctx.restore();
  }
}

function drawOrbs(ctx, orbs) {
  for (const o of orbs) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.fillStyle = 'rgba(120, 255, 200, 0.85)';
    ctx.shadowColor = '#6ee7b7';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawProjectiles(ctx, projectiles, now) {
  for (const pr of projectiles) {
    ctx.save();
    ctx.translate(pr.x, pr.y);
    ctx.rotate(Math.atan2(pr.vy, pr.vx));
    if (pr.kind === 'sword') {
      ctx.fillStyle = '#a5f3fc';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 12;
      ctx.fillRect(-14, -3, 28, 6);
    } else if (pr.kind === 'talisman') {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-6, -8, 12, 16);
      ctx.strokeStyle = '#b45309';
      ctx.strokeRect(-6, -8, 12, 16);
    }
    ctx.restore();
  }
}

function drawFxLayer(ctx, now) {
  for (let i = FX.length - 1; i >= 0; i--) {
    const f = FX[i];
    const age = now - f.t0;
    if (age > f.duration) {
      FX.splice(i, 1);
      continue;
    }
    const t = age / f.duration;
    ctx.save();
    ctx.translate(f.x, f.y);
    if (f.type === 'thunder') {
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, f.radius * (0.3 + t * 0.9), 0, Math.PI * 2);
      ctx.stroke();
    } else if (f.type === 'hit') {
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.arc(0, 0, 8 + t * 20, 0, Math.PI * 2);
      ctx.fill();
    } else if (f.type === 'level') {
      ctx.globalAlpha = (1 - t) * 0.8;
      ctx.strokeStyle = '#c4b5fd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 30 + t * 80, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawHudOverlay(ctx, w, state) {
  /* 顶栏由 React HUD 绘制，此处仅 Debug 圈 */
}

export function screenToWorld(x, y, w, h) {
  return { x: x - w / 2, y: y - h / 2 };
}

export function clampInArena(x, y, pr) {
  const d = Math.hypot(x, y);
  const max = ARENA_RADIUS - pr;
  if (d > max) {
    const s = max / d;
    return { x: x * s, y: y * s };
  }
  return { x, y };
}
