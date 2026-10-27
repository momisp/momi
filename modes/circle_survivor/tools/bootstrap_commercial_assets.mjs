#!/usr/bin/env node
/**
 * R6 · 商用资源一键引导：playable 同步 → 可选 Kenney 拷贝 → 磁盘验收
 *
 *   node modes/circle_survivor/tools/bootstrap_commercial_assets.mjs
 *   node modes/circle_survivor/tools/bootstrap_commercial_assets.mjs --kenney-root /path/to/Kenney
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { assetsReadyOnDisk, MODE_ROOT } from './assets_fs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOLS = __dirname;

function runNode(script, extraArgs = []) {
  const r = spawnSync(process.execPath, [script, ...extraArgs], {
    cwd: MODE_ROOT,
    stdio: 'inherit',
    encoding: 'utf8',
  });
  return r.status ?? 1;
}

function main() {
  const args = process.argv.slice(2);
  let kenneyRoot = process.env.KENNEY_SFX_ROOT || '';
  let fromPlayable = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--kenney-root' && args[i + 1]) kenneyRoot = args[++i];
    if (args[i] === '--from' && args[i + 1]) fromPlayable = args[++i];
  }

  console.log('=== bootstrap_commercial_assets (R6) ===\n');

  const syncArgs = fromPlayable ? ['--from', fromPlayable] : [];
  runNode(path.join(TOOLS, 'sync_playable_assets.mjs'), syncArgs);

  if (kenneyRoot) {
    console.log('\n--- Kenney SFX ---');
    runNode(path.join(TOOLS, 'copy_kenney_sfx.mjs'), ['--root', kenneyRoot]);
  } else {
    console.log('\nSKIP Kenney（未设 --kenney-root / KENNEY_SFX_ROOT）');
    console.log('  例：node tools/copy_kenney_sfx.mjs --root ~/Downloads/Kenney');
  }

  console.log('\n--- 验收 ---');
  const st = assetsReadyOnDisk(MODE_ROOT);
  console.log(`素材 ${st.ai}/${st.aiExpected} · 音效 ${st.sfxLoaded}/${st.sfxExpected}`);
  if (st.ready) {
    console.log('CHECK assets_ready → 刷新 /play/circle-survivor，顶栏 pill 应变绿');
    process.exit(0);
  }
  console.log('仍缺资源：art 跑 gen_sprite.py --all；audio 拷 Kenney 后重跑本脚本');
  process.exit(2);
}

main();
