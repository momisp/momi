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

## R1 交付（已完成）

- [x] Canvas 修仙试炼闭环、升级/结算 UI
- [x] manifest + Kenney 拷贝脚本（资源待落盘）

## R2 交付（开发）

- [x] 数值：L1 XP≈17、浊气 xp4、pickup52、spawn/武器/渡劫兽按数值评审
- [x] 渡劫兽定时波 120/150/175s
- [x] 升级武器加权、回春/吐纳上限 2
- [x] Esc 返回、破境 1/2/3、灵韵 pickup 音
- [ ] 四槽 PNG + 10 ogg（流水线 art/audio 执行，非代码阻塞）

## 后续

- R2 QA：180s 通关、60+ 怪帧率、5 局 BGM 回归
- 美术：enemy_boss 贴图、符箓序列帧
