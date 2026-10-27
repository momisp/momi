import { ARENA_RADIUS } from './balance.js';
import { drawAmbientParticles } from './scene_ambient.js';
import { drawProceduralEnemy, drawProceduralPlayer } from './procedural_art.js';
import { drawFloats, drawScreenVignette, getShakeOffset } from './visual_polish.js';

const FX = [];

export function pushFx(fx) {
  FX.push({ ...fx, t0: performance.now() });
}

export function drawFrame(ctx, w, h, state, sprites, now, ambientParticles, polish) {
  ctx.save();
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#030712');
  bg.addColorStop(0.45, '#060a12');
  bg.addColorStop(1, '#020617');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  ctx.translate(cx, cy);

  const shake = polish ? getShakeOffset(polish) : { x: 0, y: 0 };
  ctx.translate(shake.x, shake.y);

  drawArena(ctx, now);
  if (ambientParticles) drawAmbientParticles(ctx, ambientParticles, now);
  drawOrbs(ctx, state.orbs, now);
  drawEnemies(ctx, state.enemies, sprites, now);
  drawProjectiles(ctx, state.projectiles, now);
  drawPlayer(ctx, state.player, sprites, now);
  drawFxLayer(ctx, now);
  if (polish) drawFloats(ctx, polish, now);

  ctx.restore();
  drawScreenVignette(ctx, w, h);
}

function drawArena(ctx, now) {
  const breathe = 0.035 * Math.sin(now * 0.0012);
  const R = ARENA_RADIUS * (1 + breathe);

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, R + 40, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();
  ctx.restore();

  const g = ctx.createRadialGradient(0, 0, 20, 0, 0, R + 24);
  g.addColorStop(0, '#234e63');
  g.addColorStop(0.35, '#152a38');
  g.addColorStop(0.75, '#0c1520');
  g.addColorStop(1, '#05080c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, R + 22, 0, Math.PI * 2);
  ctx.fill();

  const rot = now * 0.00012;
  ctx.save();
  ctx.rotate(rot);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(R * 0.94, 0);
    ctx.stroke();
    ctx.rotate(Math.PI / 6);
  }
  ctx.restore();

  const sweep = now * 0.0008;
  ctx.save();
  ctx.rotate(sweep);
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, R - 4, -0.35, 0.35);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = `rgba(120, 220, 255, ${0.42 + Math.sin(now * 0.002) * 0.1})`;
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
  ctx.shadowBlur = 12;
  ctx.setLineDash([8 + Math.sin(now * 0.003) * 3, 12]);
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
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

  const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, p.radius * 3 * pulse);
  aura.addColorStop(0, 'rgba(120, 240, 255, 0.45)');
  aura.addColorStop(0.45, 'rgba(40, 140, 220, 0.12)');
  aura.addColorStop(1, 'rgba(40, 120, 200, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius * 3 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius * 1.55, now * 0.002, now * 0.002 + Math.PI * 1.35);
  ctx.stroke();

  if (img) {
    ctx.drawImage(img, -p.radius * 1.4, -p.radius * 1.4, p.radius * 2.8, p.radius * 2.8);
  } else {
    drawProceduralPlayer(ctx, p.radius);
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
      ctx.shadowBlur = 26;
      ctx.strokeStyle = `rgba(255, 200, 80, ${0.45 + Math.sin(now * 0.004) * 0.2})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 8 + Math.sin(now * 0.005) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (img) {
      const s = e.radius * 2.2;
      ctx.drawImage(img, -s / 2, -s / 2, s, s);
    } else {
      drawProceduralEnemy(ctx, e.kind, e.radius);
    }
    const hpPct = e.hp / e.maxHp;
    if (hpPct < 1 && !e.kind.boss) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(-e.radius, -e.radius - 11, e.radius * 2, 5);
      ctx.fillStyle = hpPct > 0.5 ? '#4ade80' : '#f87171';
      ctx.fillRect(-e.radius, -e.radius - 11, e.radius * 2 * hpPct, 5);
    }
    ctx.restore();
  }
}

function drawOrbs(ctx, orbs, now) {
  for (const o of orbs) {
    const pulse = 4 + Math.sin(now * 0.008 + o.x) * 1.5;
    ctx.save();
    ctx.translate(o.x, o.y);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, pulse * 2.2);
    g.addColorStop(0, 'rgba(255, 255, 240, 1)');
    g.addColorStop(0.35, 'rgba(110, 231, 183, 0.9)');
    g.addColorStop(1, 'rgba(52, 211, 153, 0)');
    ctx.fillStyle = g;
    ctx.shadowColor = '#6ee7b7';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, pulse * 0.55, 0, Math.PI * 2);
    ctx.stroke();
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
      const tail = 26 + Math.sin(now * 0.02) * 5;
      const grad = ctx.createLinearGradient(-tail, 0, 14, 0);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0)');
      grad.addColorStop(0.45, 'rgba(165, 243, 252, 0.95)');
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 18;
      ctx.fillRect(-tail, -4.5, tail + 16, 9);
      ctx.fillStyle = '#f0f9ff';
      ctx.fillRect(10, -2.5, 12, 5);
    } else if (pr.kind === 'talisman') {
      ctx.rotate(Math.sin(now * 0.012) * 0.18);
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.fillRect(-7, -9, 14, 18);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-7, -9, 14, 18);
      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 9px serif';
      ctx.fillText('符', -5, 3);
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
      ctx.shadowBlur = 20;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, f.radius * (0.3 + t * 0.9), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(0, 0, f.radius * 0.25 * (1 - t), 0, Math.PI * 2);
      ctx.fill();
    } else if (f.type === 'hit') {
      ctx.globalAlpha = (1 - t) * 0.85;
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.arc(0, 0, 5 + t * 16, 0, Math.PI * 2);
      ctx.fill();
    } else if (f.type === 'death') {
      ctx.globalAlpha = 1 - t;
      const n = 6;
      for (let k = 0; k < n; k++) {
        const a = (Math.PI * 2 * k) / n + t * 2;
        const dist = 8 + t * 22;
        ctx.fillStyle = f.color || '#6ee7b7';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * dist, Math.sin(a) * dist, 2.5 * (1 - t), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (f.type === 'level') {
      ctx.globalAlpha = (1 - t) * 0.9;
      ctx.strokeStyle = '#c4b5fd';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 20 + t * 95, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, 10 + t * 55, 0, Math.PI * 2);
      ctx.stroke();
    } else if (f.type === 'tribulation_warn') {
      ctx.globalAlpha = (1 - t) * 0.75;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 16;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, ARENA_RADIUS * 0.86, 0, Math.PI * 2);
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
