/** WebAudio：Kenney OGG（manifest）优先，缺失则修仙风 procedural fallback */

let ctx = null;
let bgmGain = null;
let sfxGain = null;
let bgmSource = null;
let muted = false;
let bgmEnabled = true;

const buffers = {};
const lastPlay = {};
let manifest = { volumes: { bgm: 0.32, sfx: 0.5 }, cooldown_ms: {}, events: {} };

async function loadManifest() {
  try {
    const res = await fetch(new URL('./assets/sfx/manifest.json', import.meta.url));
    if (res.ok) manifest = await res.json();
  } catch {
    manifest = { volumes: { bgm: 0.32, sfx: 0.5 }, events: {} };
  }
  return manifest;
}

async function loadSample(eventKey) {
  const file = manifest.events?.[eventKey];
  if (!file || buffers[eventKey]) return;
  try {
    const url = new URL(`./assets/sfx/${file}`, import.meta.url).href;
    const res = await fetch(url);
    if (!res.ok) return;
    const ab = await res.arrayBuffer();
    const ac = ensureCtx();
    buffers[eventKey] = await ac.decodeAudioData(ab);
  } catch {
    /* fallback */
  }
}

async function preloadSamples() {
  const keys = Object.keys(manifest.events || {});
  await Promise.all(keys.map((k) => loadSample(k)));
}

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    bgmGain = ctx.createGain();
    sfxGain = ctx.createGain();
    bgmGain.connect(ctx.destination);
    sfxGain.connect(ctx.destination);
    applyVolumeGains();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function applyVolumeGains() {
  const bgmV = manifest.volumes?.bgm ?? 0.32;
  const sfxV = manifest.volumes?.sfx ?? 0.5;
  if (bgmGain) bgmGain.gain.value = muted || !bgmEnabled ? 0 : bgmV;
  if (sfxGain) sfxGain.gain.value = muted ? 0 : sfxV;
}

function canPlayCooldown(key) {
  const cd = manifest.cooldown_ms?.[key] ?? 0;
  if (!cd) return true;
  const now = performance.now();
  if (lastPlay[key] && now - lastPlay[key] < cd) return false;
  lastPlay[key] = now;
  return true;
}

function eventVolume(eventKey) {
  const gain = manifest.event_gain?.[eventKey];
  return gain != null ? gain : 1;
}

function playBuffer(eventKey, { volume, cooldownKey = eventKey } = {}) {
  if (muted) return false;
  if (!canPlayCooldown(cooldownKey)) return false;
  const buf = buffers[eventKey];
  if (!buf) return false;
  const ac = ensureCtx();
  const src = ac.createBufferSource();
  const g = ac.createGain();
  src.buffer = buf;
  g.gain.value = volume ?? eventVolume(eventKey);
  src.connect(g);
  g.connect(sfxGain);
  src.start(0);
  return true;
}

function tone(freq, dur, type = 'sine', vol = 0.15, slideTo = null) {
  const ac = ensureCtx();
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ac.currentTime);
  if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, ac.currentTime + dur);
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  o.connect(g);
  g.connect(sfxGain);
  o.start();
  o.stop(ac.currentTime + dur + 0.02);
}

function playOrFallback(eventKey, fallbackFn, cooldownKey) {
  if (playBuffer(eventKey, { cooldownKey: cooldownKey || eventKey })) return;
  fallbackFn();
}

export async function initAudio() {
  await loadManifest();
  ensureCtx();
  await preloadSamples();
}

/** 首次交互后恢复 AudioContext（避免浏览器 autoplay 限制） */
export function unlockFromUserGesture() {
  ensureCtx();
}

export function setMuted(m) {
  muted = m;
  applyVolumeGains();
}

export function setBgmEnabled(on) {
  bgmEnabled = on;
  if (!on) stopBgm();
  else startBgm();
  applyVolumeGains();
}

export function stopBgm() {
  if (bgmSource) {
    try {
      bgmSource.stop();
    } catch {
      /* */
    }
    bgmSource = null;
  }
}

export function startBgm() {
  if (muted || !bgmEnabled || bgmSource) return;
  const ac = ensureCtx();
  const buf = buffers.bgm;
  if (buf) {
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(bgmGain);
    src.start(0);
    bgmSource = src;
    return;
  }
  startBgmProcedural();
}

function startBgmProcedural() {
  const ac = ensureCtx();
  const pentatonic = [220, 247, 277, 330, 370];
  const nodes = [];
  pentatonic.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.value = 0.012;
    o.connect(g);
    g.connect(bgmGain);
    o.start(ac.currentTime + i * 0.15);
    nodes.push(o);
  });
  bgmSource = { stop: () => nodes.forEach((n) => { try { n.stop(); } catch { /* */ } }) };
}

export function sfxHit() {
  playOrFallback('hit', () => tone(180, 0.08, 'triangle', 0.12, 90), 'hit');
}

export function sfxKill() {
  playOrFallback('kill', () => {
    tone(520, 0.06, 'sine', 0.1);
    setTimeout(() => tone(780, 0.05, 'sine', 0.08), 40);
  }, 'kill');
}

export function sfxLevelUp() {
  playOrFallback('level_up', () => {
    tone(392, 0.12, 'sine', 0.14);
    setTimeout(() => tone(523, 0.12, 'sine', 0.12), 100);
    setTimeout(() => tone(659, 0.18, 'sine', 0.1), 200);
  });
}

export function sfxThunder() {
  playOrFallback('thunder', () => tone(80, 0.25, 'sawtooth', 0.08, 40), 'thunder');
}

export function sfxPlayerHurt() {
  playOrFallback('hurt', () => tone(140, 0.15, 'square', 0.1, 70));
}

export function sfxUiClick() {
  playOrFallback('ui_click', () => tone(660, 0.06, 'sine', 0.08));
}

export function sfxGameOver() {
  playOrFallback('game_over', () => tone(330, 0.3, 'sine', 0.12, 110));
}

export function sfxVictory() {
  playOrFallback('victory', () => {
    [392, 494, 587, 784].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'sine', 0.1), i * 120));
  });
}

export function sfxPickup() {
  playOrFallback('pickup', () => tone(880, 0.04, 'sine', 0.05), 'pickup');
}

export function sfxTribulation() {
  playOrFallback(
    'tribulation',
    () => {
      tone(60, 0.35, 'sawtooth', 0.1, 30);
      setTimeout(() => tone(120, 0.2, 'triangle', 0.08), 80);
    },
    'tribulation',
  );
}

/** 已解码 Kenney 轨数（供 HUD / 冒烟对齐） */
export function getSfxLoadStats() {
  const events = manifest.events || {};
  const expected = Object.keys(events).length;
  let loaded = 0;
  for (const key of Object.keys(events)) {
    if (buffers[key]) loaded += 1;
  }
  return { loaded, expected, usingFallback: loaded < expected };
}
