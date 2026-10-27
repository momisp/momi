# 听感分层 · R4（对标幸存者 + 修仙）

| 层 | 事件 | manifest key | 时长感 | 冷却 |
|----|------|--------------|--------|------|
| UI | 选卡/按钮 | ui_click | 50–80ms | — |
| 战斗 | 御剑/符命中 | hit | 80–120ms | 55ms |
| 战斗 | 五雷 | thunder | 200–400ms | 220ms |
| 状态 | 纳灵 | pickup | 40–60ms | 65ms |
| 状态 | 斩妖 | kill | 100–150ms | 90ms |
| 状态 | 破境 | level_up | 300–600ms | — |
| 状态 | 受伤 | hurt | 150–300ms | — |
| 状态 | 渡劫兽 | tribulation | 0.5–1s | 3000ms |
| 状态 | 道消/渡劫成功 | game_over / victory | 0.5–1.2s | — |
| BGM | 试炼循环 | bgm | 60s+ loop | 单实例 |

**总线**：BGM 0.32 · SFX 0.5 · `event_gain` 压低 hit/pickup，抬高 tribulation。

**商用差距（Backlog）**：BGM 紧张段 second loop；破境/渡劫时 BGM duck −6dB（未实现）。
