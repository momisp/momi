/** 幸存者式反馈：震屏、飘字、暗角（修仙配色） */

export function createPolishState() {
  return { shake: 0, floats: [] };
}

export function addShake(state, amount) {
  state.shake = Math.min(14, state.shake + amount);
}

export function pushFloat(state, x, y, text, color = '#6ee7b7') {
  state.floats.push({
    x,
    y,
    text,
    color,
    life: 0.9,
    maxLife: 0.9,
    vx: (Math.random() - 0.5) * 24,
  });
}

export function tickPolish(state, dt) {
  state.shake *= Math.pow(0.82, dt * 60);
  if (state.shake < 0.08) state.shake = 0;
  for (let i = state.floats.length - 1; i >= 0; i--) {
    const f = state.floats[i];
    f.life -= dt;
    f.y -= 36 * dt;
    f.x += f.vx * dt;
    if (f.life <= 0) state.floats.splice(i, 1);
  }
}

export function getShakeOffset(state) {
  if (state.shake <= 0) return { x: 0, y: 0 };
  const s = state.shake;
  return { x: (Math.random() - 0.5) * 2 * s, y: (Math.random() - 0.5) * 2 * s };
}

export function drawFloats(ctx, state, now) {
  for (const f of state.floats) {
    const t = f.life / f.maxLife;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.globalAlpha = Math.min(1, t * 1.2);
    ctx.font = '600 13px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = f.color;
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 8;
    ctx.fillText(f.text, 0, 0);
    ctx.restore();
  }
}

/** 全屏暗角（在 restore 前、世界坐标系外调用时用 w,h） */
export function drawScreenVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.22, w / 2, h / 2, h * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.15)');
  g.addColorStop(1, 'rgba(2,8,18,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
