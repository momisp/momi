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
- [x] 渡劫兽定时波 120/150/175s（R3 已改为 150/175 + 同屏 1 劫）
- [x] 升级武器加权、回春/吐纳上限 2
- [x] Esc 返回、破境 1/2/3、灵韵 pickup 音
- [ ] 四槽 PNG + 11 ogg（流水线 art/audio 执行，非代码阻塞）

## R3 交付（开发 · 观感灵动）

- [x] `scene_ambient.js`：结界内灵气粒子层
- [x] `render.js`：呼吸结界、阵纹旋转、灵韵脉冲、剑/符/雷 FX、渡劫 `tribulation_warn` 环
- [x] `balance.js`：渡劫 **[150, 175]s**、HP **330**、移速 **44**；150s 后 spawn/影魔权重微调
- [x] `CircleSurvivorGame.jsx`：粒子 tick、同屏仅 1 渡劫兽、右侧 **神通 HUD**、「天道赐法 · 三选一」
- [x] `circle_survivor.css`：神通栏光晕、赐法面板脉动
- [ ] 四槽 PNG + ogg 落盘（仍阻塞「完善」视听验收）

## R4–R6 交付（开发 · 对标商用 polish）

- [x] playable/pygame：四槽 PNG、粒子、SFX 接线（R4/R5 自测包）
- [x] **Web 试玩 R6**：`visual_polish.js` 震屏/飘字/暗角；`procedural_art.js` 无贴图高质 fallback
- [x] `render.js` 结界扫光、击杀粒子、渐变背景；商用风 HUD（气血段、顶栏计时）
- [x] 赐法卡神通/心法分色；舞台边框与金线 UI
- [ ] Web 端同步 `assets/ai/*.png` + 11 ogg（与 playable 对齐）

## 后续

- QA：180s 通关、60+ 怪帧率、5 局 BGM、耳听 Kenney
- 美术：enemy_boss、红狼精修（可选）
