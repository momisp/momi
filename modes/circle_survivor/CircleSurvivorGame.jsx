import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ARENA_RADIUS,
  ENEMY_KINDS,
  GAME_DURATION_SEC,
  PLAYER_BASE,
  pickEnemyKind,
  spawnBudgetAt,
  TRIBULATION_SPAWN_AT_SEC,
  weaponStats,
  xpToNextLevel,
} from './balance.js';
import { recordUpgradePick, rollUpgradeChoices } from './upgrades.js';
import { initSprites } from './sprites.js';
import { clampInArena, drawFrame, pushFx } from './render.js';
import { createAmbientParticles, tickAmbientParticles } from './scene_ambient.js';
import * as audio from './audio.js';
import './circle_survivor.css';

const WEAPON_HUD = [
  { key: 'flying_sword', label: '御剑诀' },
  { key: 'thunder_palm', label: '雷掌' },
  { key: 'talisman_burst', label: '符箓' },
];

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
    muted: false,
    bgmOn: true,
    bossMarks: {},
    upgradePickCounts: {},
  };
}

export default function CircleSurvivorGame({ onExit }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(createInitialState());
  const keysRef = useRef({});
  const spritesRef = useRef({});
  const ambientRef = useRef(createAmbientParticles());
  const rafRef = useRef(0);
  const lastTRef = useRef(0);
  const pickUpgradeRef = useRef(() => {});

  const [hud, setHud] = useState({
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpNext: 12,
    elapsed: 0,
    kills: 0,
    phase: 'playing',
    upgradeChoices: null,
    muted: false,
    bgmOn: true,
    weaponLevels: { flying_sword: 1, thunder_palm: 0, talisman_burst: 0 },
  });

  const syncHud = useCallback((s) => {
    setHud({
      hp: Math.ceil(s.player.hp),
      maxHp: s.player.maxHp,
      level: s.level,
      xp: s.xp,
      xpNext: s.xpNext,
      elapsed: s.elapsed,
      kills: s.kills,
      phase: s.phase,
      upgradeChoices: s.upgradeChoices,
      muted: s.muted,
      bgmOn: s.bgmOn,
      weaponLevels: { ...s.weaponLevels },
    });
  }, []);

  const spawnEnemy = (s, kind) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = ARENA_RADIUS - kind.radius - 8;
    s.enemies.push({
      id: `${Date.now()}-${Math.random()}`,
      kind,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      hp: kind.hp,
      maxHp: kind.hp,
      radius: kind.radius,
    });
  };

  const fireWeapons = (s, now) => {
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
        kind: 'sword',
        x: px,
        y: py,
        vx: (dx / len) * st.projectileSpeed,
        vy: (dy / len) * st.projectileSpeed,
        damage: st.damage,
        pierce: st.pierce,
        life: 1.2,
      });
    }

    const lvThunder = s.weaponLevels.thunder_palm || 0;
    if (lvThunder > 0 && now >= s.weaponCooldowns.thunder_palm) {
      const st = weaponStats('thunder_palm', lvThunder);
      s.weaponCooldowns.thunder_palm = now + st.cooldownMs;
      for (const e of s.enemies) {
        if (Math.hypot(e.x - target.x, e.y - target.y) < st.aoeRadius) {
          e.hp -= st.damage;
          pushFx({ type: 'hit', x: e.x, y: e.y, duration: 280 });
        }
      }
      pushFx({ type: 'thunder', x: target.x, y: target.y, radius: st.aoeRadius, duration: 350 });
      audio.sfxThunder();
    }

    const lvTal = s.weaponLevels.talisman_burst || 0;
    if (lvTal > 0 && now >= s.weaponCooldowns.talisman_burst) {
      const st = weaponStats('talisman_burst', lvTal);
      s.weaponCooldowns.talisman_burst = now + st.cooldownMs;
      const n = st.count + Math.floor(lvTal / 2);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n;
        s.projectiles.push({
          kind: 'talisman',
          x: px,
          y: py,
          vx: Math.cos(a) * 280,
          vy: Math.sin(a) * 280,
          damage: st.damage,
          pierce: 1,
          life: 1.5,
        });
      }
    }
  };

  const tryLevelUp = (s) => {
    while (s.xp >= s.xpNext) {
      s.xp -= s.xpNext;
      s.level += 1;
      s.xpNext = xpToNextLevel(s.level);
      s.pendingLevels += 1;
      pushFx({ type: 'level', x: s.player.x, y: s.player.y, duration: 600 });
      audio.sfxLevelUp();
    }
    if (s.pendingLevels > 0 && !s.upgradeChoices && s.phase === 'playing') {
      s.paused = true;
      s.upgradeChoices = rollUpgradeChoices(s, 3);
    }
  };

  const tick = useCallback(
    (now) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const s = stateRef.current;
      const dt = Math.min(0.05, (now - lastTRef.current) / 1000 || 0);
      lastTRef.current = now;

      const w = canvas.width;
      const h = canvas.height;

      if (s.phase === 'playing' && !s.paused) {
        s.elapsed += dt;
        if (s.player.regenPerSec) {
          s.player.hp = Math.min(s.player.maxHp, s.player.hp + s.player.regenPerSec * dt);
        }

        const k = keysRef.current;
        let mx = 0;
        let my = 0;
        if (k.w || k.ArrowUp) my -= 1;
        if (k.s || k.ArrowDown) my += 1;
        if (k.a || k.ArrowLeft) mx -= 1;
        if (k.d || k.ArrowRight) mx += 1;
        if (mx || my) {
          const len = Math.hypot(mx, my) || 1;
          const spd = s.player.speed * dt;
          const pos = clampInArena(
            s.player.x + (mx / len) * spd,
            s.player.y + (my / len) * spd,
            s.player.radius,
          );
          s.player.x = pos.x;
          s.player.y = pos.y;
        }

        s.spawnAcc += spawnBudgetAt(s.elapsed) * dt;
        while (s.spawnAcc >= 1) {
          s.spawnAcc -= 1;
          spawnEnemy(s, pickEnemyKind(s.elapsed));
        }

        tickAmbientParticles(ambientRef.current, dt);

        const sec = Math.floor(s.elapsed);
        for (const at of TRIBULATION_SPAWN_AT_SEC) {
          if (sec >= at && !s.bossMarks[at]) {
            s.bossMarks[at] = true;
            if (!s.enemies.some((e) => e.kind?.boss)) {
              spawnEnemy(s, ENEMY_KINDS.tribulation_beast);
              audio.sfxTribulation();
              pushFx({ type: 'tribulation_warn', x: 0, y: 0, duration: 1200 });
            }
          }
        }

        fireWeapons(s, now);

        for (const e of s.enemies) {
          const dx = s.player.x - e.x;
          const dy = s.player.y - e.y;
          const d = Math.hypot(dx, dy) || 1;
          e.x += (dx / d) * e.kind.speed * dt;
          e.y += (dy / d) * e.kind.speed * dt;
        }

        for (let i = s.projectiles.length - 1; i >= 0; i--) {
          const pr = s.projectiles[i];
          pr.x += pr.vx * dt;
          pr.y += pr.vy * dt;
          pr.life -= dt;
          if (pr.life <= 0 || Math.hypot(pr.x, pr.y) > ARENA_RADIUS) {
            s.projectiles.splice(i, 1);
            continue;
          }
          for (const e of s.enemies) {
            if (Math.hypot(e.x - pr.x, e.y - pr.y) < e.radius + 6) {
              e.hp -= pr.damage;
              pr.pierce -= 1;
              pushFx({ type: 'hit', x: pr.x, y: pr.y, duration: 200 });
              audio.sfxHit();
              if (pr.pierce <= 0) {
                s.projectiles.splice(i, 1);
                break;
              }
            }
          }
        }

        for (let i = s.enemies.length - 1; i >= 0; i--) {
          const e = s.enemies[i];
          if (e.hp <= 0) {
            s.orbs.push({ x: e.x, y: e.y, value: e.kind.xp });
            s.kills += 1;
            audio.sfxKill();
            s.enemies.splice(i, 1);
            continue;
          }
          const hitDist = e.radius + s.player.radius;
          if (
            Math.hypot(e.x - s.player.x, e.y - s.player.y) < hitDist &&
            now > s.player.invulnUntil
          ) {
            s.player.hp -= e.kind.damage;
            s.player.invulnUntil = now + s.player.invulnAfterHitMs;
            audio.sfxPlayerHurt();
            pushFx({ type: 'hit', x: s.player.x, y: s.player.y, duration: 300 });
          }
        }

        for (let i = s.orbs.length - 1; i >= 0; i--) {
          const o = s.orbs[i];
          const d = Math.hypot(o.x - s.player.x, o.y - s.player.y);
          if (d < s.player.pickupRadius) {
            const pull = Math.min(d, 280 * dt);
            if (d > 0.1) {
              o.x += ((s.player.x - o.x) / d) * pull;
              o.y += ((s.player.y - o.y) / d) * pull;
            }
            if (d < s.player.radius + 10) {
              s.xp += o.value;
              s.orbs.splice(i, 1);
              audio.sfxPickup();
            }
          }
        }

        tryLevelUp(s);

        if (s.player.hp <= 0) {
          s.phase = 'defeat';
          s.paused = true;
          audio.stopBgm();
          audio.sfxGameOver();
        } else if (s.elapsed >= GAME_DURATION_SEC) {
          s.phase = 'victory';
          s.paused = true;
          audio.stopBgm();
          audio.sfxVictory();
        }
      }

      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      drawFrame(ctx, w, h, s, spritesRef.current, now, ambientRef.current);

      if (Math.floor(now / 200) !== Math.floor((now - dt * 1000) / 200)) syncHud(s);
      rafRef.current = requestAnimationFrame(tick);
    },
    [syncHud],
  );

  const exitGame = useCallback(() => {
    audio.stopBgm();
    if (typeof onExit === 'function') onExit();
    else window.location.href = '/';
  }, [onExit]);

  useEffect(() => {
    const onKey = (e, down) => {
      keysRef.current[e.key] = down;
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    };
    const kd = (e) => {
      audio.unlockFromUserGesture();
      onKey(e, true);
      const s = stateRef.current;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (s.phase === 'playing' && !s.upgradeChoices) exitGame();
        return;
      }
      if (s.upgradeChoices?.length && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const idx = Number(e.key) - 1;
        const choice = s.upgradeChoices[idx];
        if (choice) pickUpgradeRef.current(choice.id);
      }
    };
    const ku = (e) => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [exitGame]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await audio.initAudio();
      spritesRef.current = await initSprites();
      if (cancelled) return;
      audio.startBgm();
      lastTRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      audio.stopBgm();
    };
  }, [tick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    });
    ro.observe(canvas.parentElement);
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    return () => ro.disconnect();
  }, []);

  const pickUpgrade = (id) => {
    const s = stateRef.current;
    const choice = s.upgradeChoices?.find((c) => c.id === id);
    if (!choice) return;
    audio.sfxUiClick();
    choice.apply(s);
    recordUpgradePick(s, choice.id);
    s.pendingLevels -= 1;
    s.upgradeChoices = null;
    if (s.pendingLevels > 0) {
      s.upgradeChoices = rollUpgradeChoices(s, 3);
    } else {
      s.paused = false;
    }
    syncHud(s);
  };

  pickUpgradeRef.current = pickUpgrade;

  const restart = () => {
    audio.sfxUiClick();
    audio.stopBgm();
    stateRef.current = createInitialState();
    ambientRef.current = createAmbientParticles();
    stateRef.current.bgmOn = hud.bgmOn;
    stateRef.current.muted = hud.muted;
    audio.setMuted(hud.muted);
    if (hud.bgmOn) audio.startBgm();
    lastTRef.current = performance.now();
    syncHud(stateRef.current);
  };

  const toggleMute = () => {
    audio.unlockFromUserGesture();
    const s = stateRef.current;
    s.muted = !s.muted;
    audio.setMuted(s.muted);
    syncHud(s);
  };

  const toggleBgm = () => {
    const s = stateRef.current;
    s.bgmOn = !s.bgmOn;
    audio.setBgmEnabled(s.bgmOn);
    syncHud(s);
  };

  const fmtTime = (sec) => {
    const m = Math.floor(sec / 60);
    const ss = Math.floor(sec % 60);
    return `${m}:${ss.toString().padStart(2, '0')}`;
  };

  const showUpgrade = hud.phase === 'playing' && hud.upgradeChoices?.length;

  return (
    <div className="cs-root">
      <header className="cs-hud">
        <div className="cs-hud-block">
          <span className="cs-label">气血</span>
          <div className="cs-bar">
            <div className="cs-bar-fill hp" style={{ width: `${(hud.hp / hud.maxHp) * 100}%` }} />
          </div>
          <span className="cs-val">
            {hud.hp}/{hud.maxHp}
          </span>
        </div>
        <div className="cs-hud-block">
          <span className="cs-label">修为 L{hud.level}</span>
          <div className="cs-bar">
            <div className="cs-bar-fill xp" style={{ width: `${(hud.xp / hud.xpNext) * 100}%` }} />
          </div>
        </div>
        <div className="cs-hud-meta">
          <span>{fmtTime(hud.elapsed)} / {fmtTime(GAME_DURATION_SEC)}</span>
          <span>斩妖 {hud.kills}</span>
          <button type="button" className="cs-btn-ghost" onClick={toggleMute}>
            {hud.muted ? '🔇' : '🔊'}
          </button>
          <button type="button" className="cs-btn-ghost" onClick={toggleBgm}>
            {hud.bgmOn ? 'BGM开' : 'BGM关'}
          </button>
        </div>
      </header>

      <div className="cs-canvas-wrap">
        <aside className="cs-weapon-rail" aria-label="已习神通">
          <span className="cs-weapon-rail-title">神通</span>
          <ul className="cs-weapon-list">
            {WEAPON_HUD.map(({ key, label }) => {
              const lv = hud.weaponLevels[key] || 0;
              if (lv <= 0) return null;
              return (
                <li key={key} className="cs-weapon-chip" data-lv={Math.min(lv, 5)}>
                  <span className="cs-weapon-name">{label}</span>
                  <span className="cs-weapon-lv">Lv{lv}</span>
                </li>
              );
            })}
          </ul>
        </aside>
        <canvas ref={canvasRef} className="cs-canvas" />
        <p className="cs-hint">
          WASD 移动 · Esc 返回道台（赐法面板打开时 Esc 不退出）· 1/2/3 择法 · 撑满 {GAME_DURATION_SEC / 60} 分钟渡劫成功
        </p>
      </div>

      {showUpgrade && (
        <div className="cs-overlay cs-upgrade" role="dialog" aria-modal="true" aria-label="择法升级">
          <div className="cs-panel cs-upgrade-panel">
            <h2>天道赐法 · 三选一</h2>
            <p className="cs-sub">择一项神通继续试炼（点击或按 1 / 2 / 3）</p>
            <div className="cs-upgrade-grid">
              {hud.upgradeChoices.map((c, i) => (
                <button key={c.id} type="button" className="cs-upgrade-card" onClick={() => pickUpgrade(c.id)}>
                  <strong>
                    [{i + 1}] {c.name}
                  </strong>
                  <span>{c.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {(hud.phase === 'victory' || hud.phase === 'defeat') && (
        <div className="cs-overlay cs-settle" role="dialog" aria-modal="true">
          <div className="cs-panel cs-settle-panel">
            <h2>{hud.phase === 'victory' ? '渡劫成功' : '道消身殒'}</h2>
            <p>
              试炼时长 {fmtTime(hud.elapsed)} · 斩妖 {hud.kills} · 修为 L{hud.level}
            </p>
            <div className="cs-settle-actions">
              <button type="button" className="cs-btn primary" onClick={restart}>
                再入试炼
              </button>
              <button
                type="button"
                className="cs-btn secondary"
                onClick={() => {
                  audio.sfxUiClick();
                  if (typeof onExit === 'function') onExit();
                  else window.location.href = '/';
                }}
              >
                返回道台
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
