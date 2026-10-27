# 音效接入 · R4（对标商用听感）

## 一键拷贝

```bash
node modes/circle_survivor/tools/copy_kenney_sfx.mjs --root /path/to/Kenney
```

## 必须落盘 11 × ogg

`hit` `kill` `thunder` `tribulation` `level_up` `hurt` `ui_click` `game_over` `victory` `pickup` `bgm_loop`

## R4 与 playable 对齐

- pygame `main.py` 使用 `levelup.ogg` → 拷贝后执行：`cp level_up.ogg levelup.ogg`
- playable 现有 5 个文件需扩到 11 个，并同步 Web `assets/sfx/`

## 听感目标（配合 R6 画面 polish）

- **BGM** 0.32 总线，不盖 SFX；顶栏 BGM关 / 🔇 全静音
- **破境** confirmation、**渡劫** heavy metal、**纳灵** click_003 可闻但不刺
- 无 ogg 时 Web 仍 procedural —— **不能**当作商用验收
