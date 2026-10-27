/** 修仙圆内幸存者 · 数值（R3：渡劫峰调平 + 观感迭代不改节奏） */

export const ARENA_RADIUS = 320;
export const GAME_DURATION_SEC = 180;

/** 固定秒数召唤渡劫兽；同屏仅一只（由逻辑层保证） */
export const TRIBULATION_SPAWN_AT_SEC = [150, 175];

export const PLAYER_BASE = {
  radius: 14,
  speed: 155,
  maxHp: 100,
  pickupRadius: 52,
  invulnAfterHitMs: 600,
};

/** 每秒经验曲线：L1≈17，前期快升 */
export function xpToNextLevel(level) {
  return Math.floor(10 + level * 7 + level * level * 0.5);
}

/** 波次：t 为已进行秒数 */
export function spawnBudgetAt(t) {
  if (t < 30) return 0.42 + t * 0.014;
  if (t < 90) return 0.75 + (t - 30) * 0.016;
  if (t < 150) return 1.65 + (t - 90) * 0.022;
  return 2.75 + (t - 150) * 0.032;
}

export const ENEMY_KINDS = {
  qi_slime: {
    id: 'qi_slime',
    name: '浊气小妖',
    hp: 18,
    speed: 52,
    damage: 8,
    radius: 11,
    xp: 4,
    color: '#6b8f71',
    weight: (t) => (t < 45 ? 1 : 0.4),
  },
  wolf_demon: {
    id: 'wolf_demon',
    name: '狼妖',
    hp: 38,
    speed: 78,
    damage: 14,
    radius: 15,
    xp: 8,
    color: '#8b4513',
    weight: (t) => (t < 22 ? 0 : t < 120 ? 0.55 : 0.35),
  },
  shadow_fiend: {
    id: 'shadow_fiend',
    name: '影魔',
    hp: 95,
    speed: 62,
    damage: 22,
    radius: 18,
    xp: 18,
    color: '#4a3a6b',
    weight: (t) => (t < 60 ? 0 : t < 150 ? 0.35 : 0.42),
  },
  tribulation_beast: {
    id: 'tribulation_beast',
    name: '渡劫兽',
    hp: 330,
    speed: 44,
    damage: 35,
    radius: 28,
    xp: 80,
    color: '#c9a227',
    weight: () => 0,
    boss: true,
  },
};

export function pickEnemyKind(t, rng = Math.random) {
  const entries = Object.values(ENEMY_KINDS);
  let total = 0;
  const w = entries.map((k) => {
    const wt = k.weight(t);
    total += wt;
    return wt;
  });
  if (total <= 0) return ENEMY_KINDS.qi_slime;
  let r = rng() * total;
  for (let i = 0; i < entries.length; i++) {
    r -= w[i];
    if (r <= 0) return entries[i];
  }
  return ENEMY_KINDS.qi_slime;
}

export const WEAPONS = {
  flying_sword: {
    id: 'flying_sword',
    name: '御剑诀',
    cooldownMs: 850,
    damage: 14,
    projectileSpeed: 420,
    pierce: 2,
  },
  thunder_palm: {
    id: 'thunder_palm',
    name: '雷掌',
    cooldownMs: 1550,
    damage: 28,
    aoeRadius: 56,
  },
  talisman_burst: {
    id: 'talisman_burst',
    name: '符箓连爆',
    cooldownMs: 2200,
    damage: 11,
    count: 5,
    spreadDeg: 360,
  },
};

export function weaponStats(weaponId, level) {
  const base = WEAPONS[weaponId] || WEAPONS.flying_sword;
  const mul = 1 + (level - 1) * 0.18;
  return {
    ...base,
    damage: Math.round(base.damage * mul),
    cooldownMs: Math.max(280, Math.round(base.cooldownMs * (1 - (level - 1) * 0.06))),
  };
}
