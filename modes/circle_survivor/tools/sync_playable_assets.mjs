#!/usr/bin/env node
/**
 * 将 playable 或外部目录的 assets/ai、assets/sfx 同步到 modes/circle_survivor/assets/
 *
 *   node modes/circle_survivor/tools/sync_playable_assets.mjs
 *   node modes/circle_survivor/tools/sync_playable_assets.mjs --from /path/to/playable
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODE_ROOT = path.join(__dirname, '..');
const DEST_ASSETS = path.join(MODE_ROOT, 'assets');
const DEFAULT_FROM = path.join(MODE_ROOT, 'playable');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let n = 0;
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) n += copyDir(s, d);
    else if (ent.isFile()) {
      fs.copyFileSync(s, d);
      n += 1;
    }
  }
  return n;
}

function main() {
  const args = process.argv.slice(2);
  let from = process.env.PLAYABLE_ROOT || DEFAULT_FROM;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from' && args[i + 1]) from = path.resolve(args[++i]);
  }

  const srcRoot = fs.existsSync(path.join(from, 'assets')) ? path.join(from, 'assets') : from;
  let total = 0;
  for (const sub of ['ai', 'sfx']) {
    total += copyDir(path.join(srcRoot, sub), path.join(DEST_ASSETS, sub));
  }

  const levelUp = path.join(DEST_ASSETS, 'sfx', 'level_up.ogg');
  const levelUpPy = path.join(DEST_ASSETS, 'sfx', 'levelup.ogg');
  if (fs.existsSync(levelUp) && !fs.existsSync(levelUpPy)) {
    fs.copyFileSync(levelUp, levelUpPy);
    console.log('OK   levelup.ogg ← level_up.ogg');
    total += 1;
  }

  console.log(`\n同步完成：${total} 个文件 → ${DEST_ASSETS}`);
  console.log('from:', srcRoot);
  process.exit(0);
}

main();
