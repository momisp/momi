# 项目排期甘特图（完整四文件包）

本目录为**可直接运行**的静态站，含「智能解析」功能。四个文件必须在同一目录。

## 文件清单

```
gantt-chart/
├── index.html   ← 入口（含 openParseBtn 智能解析按钮）
├── styles.css
├── app.js
└── README.md
```

## 本地运行

```bash
cd gantt-chart
npx serve .
```

浏览器打开终端显示的地址（通常 `http://localhost:3000`），**Ctrl+F5** 强刷。

或直接双击 `index.html`。

## 成功标志

- 工具栏有两个蓝色按钮：「添加任务」「智能解析」
- 状态栏：「就绪 · 点「智能解析」粘贴排期自动生成甘特图…」
- 查看源代码能搜到 `openParseBtn`

## 功能

- 新建项目、添加任务、拖拽排期
- 单项目视图 / 多项目并排
- **智能解析**：粘贴排期文字或 Ctrl+V 截图（OCR 需联网）
