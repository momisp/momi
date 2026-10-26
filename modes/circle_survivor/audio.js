/** WebAudio：修仙风 procedural + 可选 manifest 采样 */

let ctx = null;
let bgmGain = null;
let sfxGain = null;
let bgmNodes = null;
let muted = false;
let bgmEnabled = true;

const manifestCache = {};

async function loadManifest() {
  if (manifestCache.done) return manifestCache.files || {};
  try {
    const res = await fetch(new URL('./assets/sfx/manifest.json', import.meta.url));
    if (res.ok) manifestCache.files = await res.json();
  } catch {
    manifestCache.files = {};
  }
  manifestCache.done = true;
  return manifestCache.files || {};
}

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    bgmGain = ctx.createGain();
    sfxGain = ctx.createGain();
    bgmGain.connect(ctx.destination);
    sfxGain.connect(ctx.destination);
    bgmGain.gain.value = 0.22;
    sfxGain.gain.value = 0.45;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
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

export async function initAudio() {
  await loadManifest();
  ensureCtx();
}

export function setMuted(m) {
  muted = m;
  if (bgmGain) bgmGain.gain.value = muted || !bgmEnabled ? 0 : 0.22;
  if (sfxGain) sfxGain.gain.value = muted ? 0 : 0.45;
}

export function setBgmEnabled(on) {
  bgmEnabled = on;
  if (!on) stopBgm();
  else startBgm();
  setMuted(muted);
}

export function stopBgm() {
  if (bgmNodes) {
    try {
      bgmNodes.forEach((n) => n.stop?.());
    } catch {
      /* */
    }
    bgmNodes = null;
  }
}

/** 简易五声音阶 ambient loop */
export function startBgm() {
  if (muted || !bgmEnabled || bgmNodes) return;
  const ac = ensureCtx();
  const pentatonic = [220, 247, 277, 330, 370];
  bgmNodes = [];
  pentatonic.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.value = 0.012;
    o.connect(g);
    g.connect(bgmGain);
    o.start(ac.currentTime + i * 0.15);
    bgmNodes.push(o);
    const lfo = ac.createOscillator();
    const lg = ac.createGain();
    lfo.frequency.value = 0.08 + i * 0.02;
    lg.gain.value = 0.004;
    lfo.connect(lg);
    lg.connect(g.gain);
    lfo.start();
    bgmNodes.push(lfo);
  });
}

export function sfxHit() {
  if (muted) return;
  tone(180, 0.08, 'triangle', 0.12, 90);
}

export function sfxKill() {
  if (muted) return;
  tone(520, 0.06, 'sine', 0.1);
  setTimeout(() => tone(780, 0.05, 'sine', 0.08), 40);
}

export function sfxLevelUp() {
  if (muted) return;
  tone(392, 0.12, 'sine', 0.14);
  setTimeout(() => tone(523, 0.12, 'sine', 0.12), 100);
  setTimeout(() => tone(659, 0.18, 'sine', 0.1), 200);
}

export function sfxThunder() {
  if (muted) return;
  tone(80, 0.25, 'sawtooth', 0.08, 40);
}

export function sfxPlayerHurt() {
  if (muted) return;
  tone(140, 0.15, 'square', 0.1, 70);
}

export function sfxGameOver() {
  if (muted) return;
  tone(330, 0.3, 'sine', 0.12, 110);
}

export function sfxVictory() {
  if (muted) return;
  [392, 494, 587, 784].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'sine', 0.1), i * 120));
}
