# 音效接入 · R5（与 HUD pill 联动）

## 拷贝（流水线 / 本地）

系统 Kenney 拷贝或：

```bash
node modes/circle_survivor/tools/copy_kenney_sfx.mjs --root /path/to/Kenney
node modes/circle_survivor/tools/sync_playable_assets.mjs
```

## 必须 11 × ogg

`hit` `kill` `thunder` `tribulation` `level_up` `hurt` `ui_click` `game_over` `victory` `pickup` `bgm_loop`

pygame 别名：`levelup.ogg` ← `level_up.ogg`（copy 脚本自动）

## R5 验收

- 顶栏 **音效 11/11** pill 变绿（与素材 4/4 并列）
- 浏览器 60s：破境 confirmation、纳灵 click_003、BGM loop 可辨
- 结算 `stopBgm` 后 victory/game_over 不被 BGM 盖没
- 5 局「再入试炼」无叠 BGM

## 无 ogg 时

Web 仍 procedural —— **不算商用听感验收**
