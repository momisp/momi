#!/usr/bin/env node
/**
 * 产品放行：四槽 PNG + manifest 11 ogg 是否齐
 * exit 0 = ready · exit 2 = 未齐（仍允许试玩）
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { assetsReadyOnDisk, MODE_ROOT } from './assets_fs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function main() {
  const args = process.argv.slice(2);
  let root = MODE_ROOT;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--root' && args[i + 1]) root = path.resolve(args[++i]);
  }

  const st = assetsReadyOnDisk(root);
  console.log(`INFO ai_png ${st.ai}/${st.aiExpected}`);
  console.log(`INFO sfx_loaded ${st.sfxLoaded}/${st.sfxExpected}`);
  if (st.ready) {
    console.log('CHECK assets_ready');
    process.exit(0);
  }
  console.log('WARN assets_incomplete (run bootstrap_commercial_assets.mjs)');
  process.exit(2);
}

main();
