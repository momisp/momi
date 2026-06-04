# 项目排期甘特图

静态 Demo：多项目任务排期、甘特图展示、拖拽调整、**智能解析**粘贴排期自动生成。

## 文件结构（四个文件必须在同一文件夹）

```
app/
├── index.html   # 页面（含「智能解析」按钮）
├── styles.css   # 样式（缺一不可，否则页面无样式）
├── app.js       # 交互逻辑
└── README.md
```

## 本地打开

1. 进入 `app` 文件夹
2. 双击 `index.html`，或用浏览器打开

若样式丢失：确认 `styles.css` 与 `index.html` **同目录**，且文件名完全一致。

## 本地服务（推荐）

```bash
cd app
npx serve .
```

浏览器打开终端显示的地址（如 `http://localhost:3000`），按 **Ctrl+F5** 强刷。

也可用 Python：

```bash
cd app
python3 -m http.server 8080
```

访问 `http://localhost:8080`

## 功能

- 新建项目、添加任务、拖拽甘特条调整日期
- 单项目视图 / 多项目并排
- **智能解析**：粘贴排期文字，或 Ctrl+V 贴截图（OCR 需联网）

## 自检（确认是最新版）

| 检查 | 通过标准 |
|------|----------|
| 查看源代码 | 能搜到 `id="openParseBtn"` |
| 工具栏 | 有蓝色「智能解析」按钮（在「添加任务」旁） |
| 状态栏 | 含「点「智能解析」粘贴排期…」 |
| Network | `styles.css`、`app.js` 状态码 200 |

## 环境

Chrome / Edge / Firefox / Safari 近期版本即可，无需安装框架。
