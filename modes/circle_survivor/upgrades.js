/** 升级选项池 · 修仙向 */

export const UPGRADE_POOL = [
  {
    id: 'hp_restore',
    name: '回春丹',
    desc: '恢复 35% 气血并上限 +8',
    apply: (s) => {
      s.player.maxHp += 8;
      s.player.hp = Math.min(s.player.maxHp, s.player.hp + s.player.maxHp * 0.35);
    },
  },
  {
    id: 'speed_qi',
    name: '轻身术',
    desc: '移动速度 +12%',
    apply: (s) => {
      s.player.speed *= 1.12;
    },
  },
  {
    id: 'pickup_ling',
    name: '聚灵诀',
    desc: '拾取范围 +25%',
    apply: (s) => {
      s.player.pickupRadius *= 1.25;
    },
  },
  {
    id: 'sword_lv',
    name: '剑意精进',
    desc: '御剑诀等级 +1',
    weapon: 'flying_sword',
    apply: (s) => {
      s.weaponLevels.flying_sword = (s.weaponLevels.flying_sword || 1) + 1;
    },
  },
  {
    id: 'thunder_lv',
    name: '雷法小成',
    desc: '雷掌等级 +1',
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
    weapon: 'talisman_burst',
    apply: (s) => {
      s.weaponLevels.talisman_burst = (s.weaponLevels.talisman_burst || 0) + 1;
    },
  },
  {
    id: 'armor_meridian',
    name: '护体罡气',
    desc: '受伤后无敌 +0.15 秒',
    apply: (s) => {
      s.player.invulnAfterHitMs += 150;
    },
  },
  {
    id: 'regen_qi',
    name: '吐纳',
    desc: '每秒回复 0.8 气血',
    apply: (s) => {
      s.player.regenPerSec = (s.player.regenPerSec || 0) + 0.8;
    },
  },
];

export function rollUpgradeChoices(state, count = 3, rng = Math.random) {
  const pool = [...UPGRADE_POOL];
  const choices = [];
  while (choices.length < count && pool.length) {
    const i = Math.floor(rng() * pool.length);
    choices.push(pool.splice(i, 1)[0]);
  }
  return choices;
}
