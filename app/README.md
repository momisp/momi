# 项目排期甘特图

静态 Demo：多项目任务排期、甘特图展示、拖拽调整、**智能解析**粘贴排期自动生成。

## 数据会不会丢？

- **关 `npx serve` 不影响**：排期存在浏览器 **localStorage**（键名 `gantt-schedule-v1`），不是存在服务器里。
- **下次再打开**（同一浏览器、同一地址）：会自动恢复项目和任务甘特图。
- **会丢的情况**：清空浏览器网站数据、无痕模式关闭窗口、换浏览器或换电脑、手动点「加载示例」覆盖前请先确认是否需要保留当前数据。

## 文件结构（四个文件必须在同一文件夹）

```
app/
├── index.html
├── styles.css
├── app.js
└── README.md
```

## 本地打开

1. 进入 `app` 文件夹
2. 双击 `index.html`

## 本地服务（推荐）

```bash
cd app
npx serve .
```

浏览器打开终端地址（如 `http://localhost:3000`），**Ctrl+F5** 强刷。

也可用 Python：

```bash
cd app
python3 -m http.server 8080
```

## 功能

- 新建项目、添加任务、拖拽甘特条调整日期
- 单项目视图 / 多项目并排
- **智能解析**：粘贴排期文字或 Ctrl+V 截图（OCR 需联网）
- **自动保存**：每次增删改、拖拽、解析后写入 localStorage

## 自检

- 源代码能搜到 `openParseBtn`、`STORAGE_KEY`
- 工具栏有蓝色「智能解析」
- F12 → Network：`styles.css`、`app.js` 均为 200

## 环境

Chrome / Edge / Firefox / Safari 近期版本即可。
