# AI 精灵槽 · R2

落盘目录：`modes/circle_survivor/assets/ai/`

| 槽位 | 文件 | 游戏内绑定 |
|------|------|------------|
| player | player.png | 修士 |
| enemy_yellow | enemy_yellow.png | 浊气小妖 qi_slime |
| enemy_red | enemy_red.png | 狼妖 wolf_demon |
| enemy_blue | enemy_blue.png | 影魔 shadow_fiend |
| enemy_boss | enemy_boss.png | 渡劫兽（R2 可缺，矢量回退） |

出图：`tools/gen_sprite_batch_r2.json` → `gen_sprite.py` 按 slot 调用。

本轮 **必须重出**：player、enemy_red、enemy_blue、enemy_yellow。
