# 墨秘 momi — 辅助写小说（静态 Demo）

本地浏览器即可运行，无需安装 Node。数据保存在本机 `localStorage`。

## 最快打开

1. 进入本目录 `app/`
2. 双击 `index.html`（macOS / Windows）

若样式或按钮无反应，请用下面「本地小服务器」方式打开。

## 本地小服务器（推荐）

已安装 Node.js 时，在 `app` 目录执行：

```bash
npx --yes serve .
```

终端会显示地址，例如 `http://localhost:3000`，用浏览器打开即可。

也可用 Python：

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 文件说明

| 文件 | 作用 |
|------|------|
| `index.html` | 页面结构 |
| `styles.css` | 样式与主题变量 |
| `app.js` | 交互逻辑（章节、AI Mock、导出等） |

## 设置

点击右上角 ⚙：可配置 OpenAI 兼容 API；留空则使用 Mock 续写/润色/扩写。主题默认「清透极简」。

## 快捷键

- `Ctrl/Cmd + S`：保存当前章节
- 专注模式中 `Esc`：退出专注
