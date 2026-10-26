# 音效接入 · R2

## 拷贝（系统/本地）

```bash
node modes/circle_survivor/tools/copy_kenney_sfx.mjs --root /path/to/Kenney
# 或
KENNEY_SFX_ROOT=/path/to/star_rail_duel/assets/sfx node modes/circle_survivor/tools/copy_kenney_sfx.mjs --root "$KENNEY_SFX_ROOT"
```

## 本轮必须落盘（11 个 ogg）

hit, kill, thunder, tribulation, level_up, hurt, ui_click, game_over, victory, pickup, bgm_loop

## 代码映射

| 事件 | 函数 | R2 触发 |
|------|------|---------|
| 破境 | sfxLevelUp | 升级 |
| 受伤 | sfxPlayerHurt | 撞妖 |
| 纳灵韵 | sfxPickup | 拾取 XP |
| 渡劫兽 | sfxTribulation | 120/150/175s |
| BGM | startBgm / setBgmEnabled | 顶栏 BGM开/关 |
