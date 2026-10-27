# 音效接入 · R3

## 一键拷贝（Kenney CC0）

```bash
node modes/circle_survivor/tools/copy_kenney_sfx.mjs --root /path/to/Kenney
```

`--root` 可为 Kenney 解压根目录，或已扁平化/按包名子目录存放的 `star_rail_duel/assets/sfx`（只读复用，勿改模式四源码）。

## 必须落盘（11 × ogg）

与 `manifest.json` → `events` 一致：

`hit.ogg` `kill.ogg` `thunder.ogg` `tribulation.ogg` `level_up.ogg` `hurt.ogg` `ui_click.ogg` `game_over.ogg` `victory.ogg` `pickup.ogg` `bgm_loop.ogg`

## R3 听感目标（配合画面灵动）

- **纳灵韵** `pickup`：短、亮、不盖斩妖/破境（gain 0.55，cd 65ms）
- **渡劫兽** `tribulation`：150/175s 单波重音（gain 0.85，cd 3s），与 `level_up` 破境 confirmation 可辨
- **命中** `hit`：高密度御剑时略压总线（gain 0.72，cd 55ms）
- **BGM** `bgm_loop`：0.35 总线；顶栏 BGM关 / 🔇 全静音

## 代码入口

`modes/circle_survivor/audio.js` · 触发见 `CircleSurvivorGame.jsx`
