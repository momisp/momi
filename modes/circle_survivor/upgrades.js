/** 升级选项池 · 修仙向（R2：武器加权、回春/吐纳上限） */

export const UPGRADE_POOL = [
  {
    id: 'hp_restore',
    name: '回春丹',
    desc: '恢复 35% 气血并上限 +8',
    category: 'passive',
    apply: (s) => {
      s.player.maxHp += 8;
      s.player.hp = Math.min(s.player.maxHp, s.player.hp + s.player.maxHp * 0.35);
    },
  },
  {
    id: 'speed_qi',
    name: '轻身术',
    desc: '移动速度 +12%',
    category: 'passive',
    apply: (s) => {
      s.player.speed *= 1.12;
    },
  },
  {
    id: 'pickup_ling',
    name: '聚灵诀',
    desc: '拾取范围 +25%',
    category: 'passive',
    apply: (s) => {
      s.player.pickupRadius *= 1.25;
    },
  },
  {
    id: 'sword_lv',
    name: '剑意精进',
    desc: '御剑诀等级 +1',
    category: 'weapon',
    weapon: 'flying_sword',
    apply: (s) => {
      s.weaponLevels.flying_sword = (s.weaponLevels.flying_sword || 1) + 1;
    },
  },
  {
    id: 'thunder_lv',
    name: '雷法小成',
    desc: '雷掌等级 +1',
    category: 'weapon',
    weapon: 'thunder_palm',
    apply: (s) => {
      s.weaponLevels.thunder_palm = (s.weaponLevels.thunder_palm || 0) + 1;
      if (s.weaponLevels.thunder_palm === 1) s.weaponLevels.thunder_palm = 2;
    },
  },
  {
    id: 'talisman_unlock',
    name: '符箓初解',
    desc: '解锁符箓连爆或升 1 级',
    category: 'weapon',
    weapon: 'talisman_burst',
    apply: (s) => {
      s.weaponLevels.talisman_burst = (s.weaponLevels.talisman_burst || 0) + 1;
    },
  },
  {
    id: 'armor_meridian',
    name: '护体罡气',
    desc: '受伤后无敌 +0.15 秒',
    category: 'passive',
    apply: (s) => {
      s.player.invulnAfterHitMs += 150;
    },
  },
  {
    id: 'regen_qi',
    name: '吐纳',
    desc: '每秒回复 0.8 气血',
    category: 'passive',
    apply: (s) => {
      s.player.regenPerSec = (s.player.regenPerSec || 0) + 0.8;
    },
  },
];

const PICK_CAP = { hp_restore: 2, regen_qi: 2 };
const WEAPON_WEIGHT = 1.4;

function pickWeight(entry, state) {
  const counts = state.upgradePickCounts || {};
  if (PICK_CAP[entry.id] != null && (counts[entry.id] || 0) >= PICK_CAP[entry.id]) return 0;
  return entry.category === 'weapon' ? WEAPON_WEIGHT : 1;
}

export function rollUpgradeChoices(state, count = 3, rng = Math.random) {
  if (!state.upgradePickCounts) state.upgradePickCounts = {};
  const pool = UPGRADE_POOL.filter((e) => pickWeight(e, state) > 0);
  const choices = [];
  while (choices.length < count && pool.length) {
    const weights = pool.map((e) => pickWeight(e, state));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      r -= weights[idx];
      if (r <= 0) break;
    }
    choices.push(pool.splice(idx, 1)[0]);
  }
  return choices;
}

export function recordUpgradePick(state, upgradeId) {
  if (!state.upgradePickCounts) state.upgradePickCounts = {};
  state.upgradePickCounts[upgradeId] = (state.upgradePickCounts[upgradeId] || 0) + 1;
}
