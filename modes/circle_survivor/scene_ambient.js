import { ARENA_RADIUS } from './balance.js';

/** 结界内飘动灵气粒子（纯程序，无贴图依赖） */

export function createAmbientParticles(count = 56) {
  return Array.from({ length: count }, () => ({
    angle: Math.random() * Math.PI * 2,
    distNorm: 0.15 + Math.random() * 0.82,
    drift: (Math.random() - 0.5) * 0.00035,
    bob: Math.random() * Math.PI * 2,
    size: 1 + Math.random() * 2.2,
    hue: 180 + Math.random() * 40,
  }));
}

export function tickAmbientParticles(particles, dt) {
  for (const p of particles) {
    p.angle += p.drift + dt * 0.08;
    p.bob += dt * 2.2;
  }
}

export function drawAmbientParticles(ctx, particles, now) {
  for (const p of particles) {
    const pulse = 0.85 + Math.sin(p.bob) * 0.15;
    const r = p.distNorm * ARENA_RADIUS * pulse;
    const x = Math.cos(p.angle + now * 0.00008) * r;
    const y = Math.sin(p.angle + now * 0.00006) * r;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 0.25 + Math.sin(p.bob) * 0.12;
    ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, 0.9)`;
    ctx.shadowColor = '#67e8f9';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
