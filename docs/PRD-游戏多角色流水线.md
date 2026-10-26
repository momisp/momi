# PRD · 游戏多角色流水线（精简）

## 目标

用固定六角色（开发、美术UI、音效、数值、QA、策划）按轮次产出可落盘 artifacts，驱动 **圆内幸存者 · 模式五** 迭代。

## 路径约定

| 区域 | 路径 |
|------|------|
| 试玩模式 | `modes/circle_survivor/**` |
| 流水线 UI | `applied/src/GameDevPipeline.jsx`（禁止热改运行中页） |
| API | `server/game-dev-pipeline.mjs` → `:3921` |
| 产出 | `generated/<session>/game-pipeline/R{n}-{role}.md` |

## 本轮（R1 · 开发）交付

- [x] Canvas 修仙试炼：御剑、雷掌、符箓连爆
- [x] 前 30 秒低压刷怪 + 快速首次破境
- [x] 180 秒渡劫胜利 / 气血归零失败
- [x] 升级 `fixed`  overlay、结算双按钮
- [x] WebAudio 音效 + 可选 BGM

## 后续轮次

- R1 美术：补 `assets/ai/*.png`、符箓/剑气序列帧
- R1 音效：替换 manifest 中 ogg
- R1 数值：据 QA 遥测微调 `spawnBudgetAt`
