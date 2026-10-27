/** 磁盘侧资源计数（与 game_assets.js / HUD pill 对齐） */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MODE_ROOT = path.join(__dirname, '..');

const AI_NAMES = ['player.png', 'enemy_red.png', 'enemy_blue.png', 'enemy_yellow.png'];

export function countAiPng(root = MODE_ROOT) {
  const ai = path.join(root, 'assets', 'ai');
  let n = 0;
  for (const f of AI_NAMES) {
    if (fs.existsSync(path.join(ai, f))) n += 1;
  }
  return n;
}

export function countSfxOgg(root = MODE_ROOT) {
  const sfx = path.join(root, 'assets', 'sfx');
  const manifest = path.join(sfx, 'manifest.json');
  if (!fs.existsSync(manifest)) return { loaded: 0, expected: 11 };
  const m = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  const events = m.events || {};
  let loaded = 0;
  for (const fname of Object.values(events)) {
    if (fs.existsSync(path.join(sfx, fname))) loaded += 1;
  }
  return { loaded, expected: Object.keys(events).length || 11 };
}

export function assetsReadyOnDisk(root = MODE_ROOT) {
  const ai = countAiPng(root);
  const sfx = countSfxOgg(root);
  return {
    ai,
    aiExpected: AI_NAMES.length,
    sfxLoaded: sfx.loaded,
    sfxExpected: sfx.expected,
    ready: ai >= AI_NAMES.length && sfx.loaded >= sfx.expected && sfx.expected >= 11,
  };
}
