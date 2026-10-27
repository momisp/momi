/** 无 PNG 时的高品质程序精灵（俯视修仙，对标幸存者可读性） */

export function drawProceduralPlayer(ctx, r) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(2, r * 0.55, r * 0.95, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  const robe = ctx.createLinearGradient(-r, -r, r, r);
  robe.addColorStop(0, '#5eb8e8');
  robe.addColorStop(0.5, '#2d6a8a');
  robe.addColorStop(1, '#1e4460');
  ctx.fillStyle = robe;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.15, r * 0.85, r * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.1);
  ctx.lineTo(r * 0.5, -r * 0.1);
  ctx.stroke();

  ctx.fillStyle = '#f5e6d3';
  ctx.beginPath();
  ctx.arc(0, -r * 0.45, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(0, -r * 0.52, r * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(r * 0.35, -r * 0.05);
  ctx.lineTo(r * 1.1, -r * 0.35);
  ctx.stroke();
  ctx.restore();
}

export function drawProceduralEnemy(ctx, kind, r) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(1, r * 0.5, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  if (kind.id === 'qi_slime') {
    const g = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
    g.addColorStop(0, '#d9f99d');
    g.addColorStop(0.6, '#a3e635');
    g.addColorStop(1, '#4d7c0f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 2, r, r * 0.88, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#365314';
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.15, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.25, -r * 0.15, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind.id === 'wolf_demon') {
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.05);
    ctx.lineTo(r * 0.85, r * 0.35);
    ctx.lineTo(0, r * 0.75);
    ctx.lineTo(-r * 0.85, r * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, -r * 0.5);
    ctx.lineTo(-r * 0.15, -r * 0.95);
    ctx.lineTo(r * 0.05, -r * 0.55);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -r * 0.35, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind.id === 'shadow_fiend') {
    const g = ctx.createRadialGradient(0, -r * 0.2, 0, 0, 0, r * 1.1);
    g.addColorStop(0, '#a78bfa');
    g.addColorStop(0.5, '#6b5b95');
    g.addColorStop(1, '#312e81');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.05, r * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e9d5ff';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.15, 3, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.15, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}
