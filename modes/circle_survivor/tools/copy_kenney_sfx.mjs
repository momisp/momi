#!/usr/bin/env node
/**
 * 从 Kenney CC0 解压目录拷贝 ogg → modes/circle_survivor/assets/sfx/
 *
 * 用法：
 *   node modes/circle_survivor/tools/copy_kenney_sfx.mjs --root /path/to/Kenney
 *   node modes/circle_survivor/tools/copy_kenney_sfx.mjs --root /path/to/star_rail_duel/assets/sfx
 *
 * --root 下可扁平存放 ogg，或按子目录 Impact Sounds/Interface Sounds/Music Loops 存放。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SFX_DIR = path.join(__dirname, '../assets/sfx');
const MANIFEST = path.join(SFX_DIR, 'manifest.json');

function findFile(root, pack, fileName) {
  const candidates = [
    path.join(root, fileName),
    path.join(root, pack, fileName),
    path.join(root, pack.replace(/ /g, ''), fileName),
    path.join(root, 'Audio', fileName),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const walk = (dir, depth = 0) => {
    if (depth > 4 || !fs.existsSync(dir)) return null;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isFile() && ent.name === fileName) return p;
      if (ent.isDirectory()) {
        const hit = walk(p, depth + 1);
        if (hit) return hit;
      }
    }
    return null;
  };
  return walk(root);
}

function main() {
  const args = process.argv.slice(2);
  let root = process.env.KENNEY_SFX_ROOT || '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--root' && args[i + 1]) root = args[++i];
  }
  if (!root || !fs.existsSync(root)) {
    console.error('请指定 --root 或 KENNEY_SFX_ROOT 指向 Kenney 解压目录');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const list = manifest.kenney_cc0 || [];
  fs.mkdirSync(SFX_DIR, { recursive: true });

  let ok = 0;
  let miss = 0;
  for (const item of list) {
    const src = findFile(root, item.kenney_pack, item.kenney_file);
    const dest = path.join(SFX_DIR, item.dest);
    if (!src) {
      console.warn(`MISS ${item.dest} ← ${item.kenney_file}`);
      miss += 1;
      continue;
    }
    fs.copyFileSync(src, dest);
    console.log(`OK   ${item.dest} ← ${src}`);
    ok += 1;
  }
  console.log(`\n完成：${ok} 拷贝，${miss} 缺失。缺失时 Web 端仍走 procedural fallback。`);
  process.exit(miss > 0 ? 2 : 0);
}

main();
