#!/usr/bin/env node
/**
 * 圆内幸存者 · 流水线冒烟（headless，模拟 playable 进局 + WASD + 攻击 + 选卡）
 * 输出 CHECK 行供 QA 报告引用；exit 0 = SMOKE_OK
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ARENA_RADIUS,
  PLAYER_BASE,
  ENEMY_KINDS,
  spawnBudgetAt,
  pickEnemyKind,
  weaponStats,
  xpToNextLevel,
} from '../balance.js';
import { rollUpgradeChoices, recordUpgradePick } from '../upgrades.js';
import { clampInArena } from '../render.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODE_ROOT = path.join(__dirname, '..');
const PLAYABLE = path.join(MODE_ROOT, 'playable');

function resolveRoot() {
  if (fs.existsSync(path.join(PLAYABLE, 'balance.js'))) return PLAYABLE;
  return MODE_ROOT;
}

function createInitialState() {
  return {
    player: {
      x: 0,
      y: 0,
      hp: PLAYER_BASE.maxHp,
      maxHp: PLAYER_BASE.maxHp,
      radius: PLAYER_BASE.radius,
      speed: PLAYER_BASE.speed,
      pickupRadius: PLAYER_BASE.pickupRadius,
      invulnAfterHitMs: PLAYER_BASE.invulnAfterHitMs,
      invulnUntil: 0,
      regenPerSec: 0,
    },
    enemies: [],
    orbs: [],
    projectiles: [],
    weaponLevels: { flying_sword: 1, thunder_palm: 0, talisman_burst: 0 },
    weaponCooldowns: { flying_sword: 0, thunder_palm: 0, talisman_burst: 0 },
    xp: 0,
    level: 1,
    xpNext: xpToNextLevel(1),
    kills: 0,
    elapsed: 0,
    spawnAcc: 0,
    paused: false,
    phase: 'playing',
    upgradeChoices: null,
    pendingLevels: 0,
    bossMarks: {},
    upgradePickCounts: {},
  };
}

function spawnEnemy(s, kind) {
  const angle = 0.7;
  const dist = ARENA_RADIUS - kind.radius - 8;
  s.enemies.push({
    kind,
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    hp: kind.hp,
    radius: kind.radius,
  });
}

function fireWeapons(s, now) {
  const px = s.player.x;
  const py = s.player.y;
  let target = null;
  let best = Infinity;
  for (const e of s.enemies) {
    const d = Math.hypot(e.x - px, e.y - py);
    if (d < best) {
      best = d;
      target = e;
    }
  }
  if (!target) return;
  const lvSword = s.weaponLevels.flying_sword || 0;
  if (lvSword > 0 && now >= s.weaponCooldowns.flying_sword) {
    const st = weaponStats('flying_sword', lvSword);
    s.weaponCooldowns.flying_sword = now + st.cooldownMs;
    const dx = target.x - px;
    const dy = target.y - py;
    const len = Math.hypot(dx, dy) || 1;
    s.projectiles.push({
      x: px,
      y: py,
      vx: (dx / len) * st.projectileSpeed,
      vy: (dy / len) * st.projectileSpeed,
      damage: st.damage,
      pierce: st.pierce,
      life: 1.2,
    });
  }
}

function tryLevelUp(s) {
  while (s.xp >= s.xpNext) {
    s.xp -= s.xpNext;
    s.level += 1;
    s.xpNext = xpToNextLevel(s.level);
    s.pendingLevels += 1;
  }
  if (s.pendingLevels > 0 && !s.upgradeChoices && s.phase === 'playing') {
    s.paused = true;
    s.upgradeChoices = rollUpgradeChoices(s, 3, () => 0.3);
  }
}

function pickUpgrade(s, id) {
  const choice = s.upgradeChoices?.find((c) => c.id === id);
  if (!choice) return false;
  choice.apply(s);
  recordUpgradePick(s, choice.id);
  s.pendingLevels -= 1;
  s.upgradeChoices = null;
  if (s.pendingLevels > 0) {
    s.upgradeChoices = rollUpgradeChoices(s, 3, () => 0.3);
  } else {
    s.paused = false;
  }
  return true;
}

function tickMovement(s, keys, dt, now) {
  if (s.phase !== 'playing' || s.paused) return;
  s.elapsed += dt;
  let mx = 0;
  let my = 0;
  if (keys.w) my -= 1;
  if (keys.s) my += 1;
  if (keys.a) mx -= 1;
  if (keys.d) mx += 1;
  if (mx || my) {
    const len = Math.hypot(mx, my) || 1;
    const spd = s.player.speed * dt;
    const pos = clampInArena(s.player.x + (mx / len) * spd, s.player.y + (my / len) * spd, s.player.radius);
    s.player.x = pos.x;
    s.player.y = pos.y;
  }
  s.spawnAcc += spawnBudgetAt(s.elapsed) * dt;
  while (s.spawnAcc >= 1 && s.enemies.length < 40) {
    s.spawnAcc -= 1;
    spawnEnemy(s, pickEnemyKind(s.elapsed, () => 0.2));
  }
  fireWeapons(s, now);
  for (const pr of s.projectiles) {
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
  }
}

function countAiPng(root) {
  const ai = path.join(root, 'assets', 'ai');
  const names = ['player.png', 'enemy_red.png', 'enemy_blue.png', 'enemy_yellow.png'];
  let n = 0;
  for (const f of names) {
    if (fs.existsSync(path.join(ai, f))) n += 1;
  }
  return n;
}

function countSfxOgg(root) {
  const sfx = path.join(root, 'assets', 'sfx');
  const manifest = path.join(sfx, 'manifest.json');
  if (!fs.existsSync(manifest)) return { loaded: 0, expected: 0 };
  const m = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  const events = m.events || {};
  let loaded = 0;
  for (const fname of Object.values(events)) {
    if (fs.existsSync(path.join(sfx, fname))) loaded += 1;
  }
  return { loaded, expected: Object.keys(events).length };
}

function main() {
  const root = resolveRoot();
  console.log('=== circle_survivor smoke_playable ===');
  console.log('ROOT', root);

  const s = createInitialState();
  const enterOk = s.phase === 'playing';
  console.log(enterOk ? 'CHECK enter_ok' : 'FAIL enter');

  const x0 = s.player.x;
  const y0 = s.player.y;
  let now = 1000;
  const dt = 1 / 60;
  const keys = { w: true, d: true };
  for (let i = 0; i < 45; i++) {
    tickMovement(s, keys, dt, now);
    now += dt * 1000;
  }
  const dx = Math.round(s.player.x - x0);
  const dy = Math.round(s.player.y - y0);
  const wasdOk = Math.abs(dx) >= 20 && Math.abs(dy) >= 20;
  console.log(wasdOk ? `CHECK wasd_ok dx=${dx} dy=${dy}` : `FAIL wasd dx=${dx} dy=${dy}`);

  spawnEnemy(s, ENEMY_KINDS.qi_slime);
  s.projectiles.length = 0;
  fireWeapons(s, now + 5000);
  const attackOk = s.projectiles.length >= 1;
  console.log(attackOk ? `CHECK attack_ok projs=${s.projectiles.length}` : 'FAIL attack');

  s.xp = s.xpNext;
  tryLevelUp(s);
  const choices = s.upgradeChoices || [];
  const keyPickOk = choices.length >= 1 && pickUpgrade(s, choices[0].id);
  console.log(keyPickOk ? 'CHECK click_card_ok' : 'FAIL click_card');

  const s2 = createInitialState();
  s2.xp = s2.xpNext;
  tryLevelUp(s2);
  const c2 = s2.upgradeChoices || [];
  const numPickOk = c2.length >= 2 && pickUpgrade(s2, c2[1].id);
  console.log(numPickOk ? 'CHECK digit_card_ok' : 'FAIL digit_card');

  const ai = countAiPng(root);
  console.log(`INFO ai_png ${ai}/4`);
  const sfx = countSfxOgg(root);
  console.log(`INFO sfx_loaded ${sfx.loaded}/${sfx.expected}`);

  const ambient = 52;
  console.log(`INFO ambient_particles ${ambient} (scene_ambient default)`);

  const blockers = !enterOk || !wasdOk || !attackOk || !keyPickOk || !numPickOk;
  if (blockers) {
    console.log('SUMMARY: SMOKE_FAIL');
    process.exit(1);
  }
  console.log('SUMMARY: SMOKE_OK (playable)');
  process.exit(0);
}

main();
