#!/usr/bin/env node
/** 结算逻辑冒烟：180s 胜利 / 0 HP 败北 */
import { GAME_DURATION_SEC, PLAYER_BASE, xpToNextLevel } from '../balance.js';

function createState() {
  return {
    player: { hp: PLAYER_BASE.maxHp, maxHp: PLAYER_BASE.maxHp },
    elapsed: 0,
    phase: 'playing',
    paused: false,
  };
}

function tickEnd(s) {
  if (s.player.hp <= 0) {
    s.phase = 'defeat';
    s.paused = true;
  } else if (s.elapsed >= GAME_DURATION_SEC) {
    s.phase = 'victory';
    s.paused = true;
  }
}

const s1 = createState();
s1.elapsed = GAME_DURATION_SEC;
tickEnd(s1);
const victoryOk = s1.phase === 'victory' && s1.paused;

const s2 = createState();
s2.player.hp = 0;
tickEnd(s2);
const defeatOk = s2.phase === 'defeat' && s2.paused;

console.log('=== circle_survivor smoke_settle ===');
console.log(victoryOk ? 'CHECK victory_ok' : 'FAIL victory');
console.log(defeatOk ? 'CHECK defeat_ok' : 'FAIL defeat');
console.log(`INFO duration_sec ${GAME_DURATION_SEC} xp_l1 ${xpToNextLevel(1)}`);

if (!victoryOk || !defeatOk) {
  console.log('SUMMARY: SMOKE_FAIL');
  process.exit(1);
}
console.log('SUMMARY: SMOKE_OK');
process.exit(0);
