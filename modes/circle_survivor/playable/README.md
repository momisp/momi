# playable 可带走目录

将本地已验的 **四槽 PNG** 与 **Kenney ogg** 放入：

- `playable/assets/ai/*.png`
- `playable/assets/sfx/*.ogg`

同步到 Web 模式根：

```bash
node modes/circle_survivor/tools/sync_playable_assets.mjs
```

Kenney 直拷：

```bash
node modes/circle_survivor/tools/copy_kenney_sfx.mjs --root /path/to/Kenney
node modes/circle_survivor/tools/sync_playable_assets.mjs --from modes/circle_survivor
```
