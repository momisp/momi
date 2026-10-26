# 圆内幸存者 · 修仙试炼

独立模块，由 `CircleSurvivorHost.jsx` 挂载。

## 本地试玩

```bash
npm install
npm run dev
```

- 首页：`http://localhost:5173/`
- 试炼：`http://localhost:5173/play/circle-survivor`
- 流水线：`http://localhost:5173/game-pipeline`（需 `npm run server`）

## 目录

- `modes/circle_survivor/` — 游戏逻辑与资源槽位
- `applied/src/` — 流水线 UI
- `server/game-dev-pipeline.mjs` — 多角色 SSE 流水线
- `docs/` — PRD
