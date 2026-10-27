import { ARENA_RADIUS } from './balance.js';
import { drawAmbientParticles } from './scene_ambient.js';

const FX = [];

export function pushFx(fx) {
  FX.push({ ...fx, t0: performance.now() });
}

export function drawFrame(ctx, w, h, state, sprites, now, ambientParticles) {
  ctx.save();
  ctx.fillStyle = '#060a10';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  ctx.translate(cx, cy);
  drawArena(ctx, now);
  if (ambientParticles) drawAmbientParticles(ctx, ambientParticles, now);
  drawOrbs(ctx, state.orbs, now);
  drawEnemies(ctx, state.enemies, sprites, now);
  drawProjectiles(ctx, state.projectiles, now);
  drawPlayer(ctx, state.player, sprites, now);
  drawFxLayer(ctx, now);
  ctx.restore();
}

function drawArena(ctx, now) {
  const breathe = 0.04 * Math.sin(now * 0.0012);
  const R = ARENA_RADIUS * (1 + breathe);

  const g = ctx.createRadialGradient(0, 0, 30, 0, 0, R + 28);
  g.addColorStop(0, '#1e3a4f');
  g.addColorStop(0.5, '#12202c');
  g.addColorStop(0.92, '#0a1018');
  g.addColorStop(1, '#030508');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, R + 26, 0, Math.PI * 2);
  ctx.fill();

  const rot = now * 0.00015;
  ctx.save();
  ctx.rotate(rot);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(R * 0.92, 0);
    ctx.stroke();
    ctx.rotate(Math.PI / 4);
  }
  ctx.restore();

  ctx.strokeStyle = `rgba(120, 220, 255, ${0.38 + Math.sin(now * 0.002) * 0.08})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([10 + Math.sin(now * 0.003) * 4, 14]);
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = 'rgba(167, 243, 208, 0.06)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, (R * i) / 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPlayer(ctx, p, sprites, now) {
  const img = sprites.player;
  const pulse = 0.88 + Math.sin(now * 0.007) * 0.12;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = p.invulnUntil > now ? 0.45 + Math.sin(now * 0.025) * 0.35 : 1;

  const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, p.radius * 3.2 * pulse);
  aura.addColorStop(0, 'rgba(120, 240, 255, 0.5)');
  aura.addColorStop(0.5, 'rgba(40, 140, 220, 0.15)');
  aura.addColorStop(1, 'rgba(40, 120, 200, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius * 3.2 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius * 1.6, now * 0.002, now * 0.002 + Math.PI * 1.35);
  ctx.stroke();

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
    const bob = Math.sin(now * 0.005 + e.x * 0.01) * 2;
    ctx.save();
    ctx.translate(e.x, e.y + bob);
    if (e.kind.boss) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 22;
      ctx.strokeStyle = `rgba(255, 200, 80, ${0.4 + Math.sin(now * 0.004) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 6 + Math.sin(now * 0.005) * 3, 0, Math.PI * 2);
      ctx.stroke();
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
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-e.radius, -e.radius - 10, e.radius * 2, 4);
    ctx.fillStyle = hpPct > 0.5 ? '#4ade80' : '#f87171';
    ctx.fillRect(-e.radius, -e.radius - 10, e.radius * 2 * hpPct, 4);
    ctx.restore();
  }
}

function drawOrbs(ctx, orbs, now) {
  for (const o of orbs) {
    const pulse = 4 + Math.sin(now * 0.008 + o.x) * 1.5;
    ctx.save();
    ctx.translate(o.x, o.y);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, pulse * 2);
    g.addColorStop(0, 'rgba(200, 255, 230, 1)');
    g.addColorStop(0.4, 'rgba(110, 231, 183, 0.85)');
    g.addColorStop(1, 'rgba(52, 211, 153, 0)');
    ctx.fillStyle = g;
    ctx.shadowColor = '#6ee7b7';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawProjectiles(ctx, projectiles, now) {
  for (const pr of projectiles) {
    ctx.save();
    ctx.translate(pr.x, pr.y);
    const ang = Math.atan2(pr.vy, pr.vx);
    ctx.rotate(ang);
    if (pr.kind === 'sword') {
      const tail = 22 + Math.sin(now * 0.02) * 4;
      const grad = ctx.createLinearGradient(-tail, 0, 12, 0);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0)');
      grad.addColorStop(0.5, 'rgba(165, 243, 252, 0.95)');
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 14;
      ctx.fillRect(-tail, -4, tail + 14, 8);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(8, -2, 10, 4);
    } else if (pr.kind === 'talisman') {
      ctx.rotate(Math.sin(now * 0.01) * 0.15);
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.fillRect(-6, -8, 12, 16);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1;
      ctx.strokeRect(-6, -8, 12, 16);
      ctx.fillStyle = '#b45309';
      ctx.font = '8px sans-serif';
      ctx.fillText('符', -4, 2);
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
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, f.radius * (0.3 + t * 0.9), 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(0, 0, f.radius * 0.4 * (1 - t), 0, Math.PI * 2);
      ctx.stroke();
    } else if (f.type === 'hit') {
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.arc(0, 0, 6 + t * 18, 0, Math.PI * 2);
      ctx.fill();
    } else if (f.type === 'level') {
      ctx.globalAlpha = (1 - t) * 0.85;
      ctx.strokeStyle = '#c4b5fd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 24 + t * 90, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, 12 + t * 50, 0, Math.PI * 2);
      ctx.stroke();
    } else if (f.type === 'tribulation_warn') {
      ctx.globalAlpha = (1 - t) * 0.7;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, ARENA_RADIUS * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
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
