# 项目排期甘特图

静态 Demo，支持多项目任务排期、甘特图展示与拖拽调整。

## 文件结构

```
├── index.html   # 页面结构
├── styles.css   # 样式
├── app.js       # 交互逻辑
└── README.md
```

## 本地打开

**方式一：直接双击**

1. 确保 `index.html`、`styles.css`、`app.js` 在同一文件夹内
2. 双击 `index.html`，用 Chrome / Edge / Firefox / Safari 打开即可

**方式二：本地静态服务（推荐）**

若浏览器对本地文件有限制，可在项目目录执行：

```bash
npx serve .
```

终端会显示访问地址（通常是 `http://localhost:3000`），浏览器打开即可。

也可以用 Python 内置服务：

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 功能说明

- 新建项目、添加任务（名称 / 日期 / 状态）
- 单项目视图：按项目分组的全量甘特图，支持拖拽调整排期
- 多项目并排：各项目独立卡片横向对比
- 点击「加载示例」快速预览演示数据
- 点击「智能解析」粘贴排期文字或截图，自动生成甘特图

## 重要提示

四个文件必须放在**同一文件夹**内再打开 `index.html`，否则样式和交互会失效：

```
index.html
styles.css
app.js
README.md
```

## 环境要求

- 现代浏览器（Chrome 90+、Firefox 88+、Safari 14+、Edge 90+）
- 无需 Node.js 或任何构建工具（直接打开时）
- 使用 `npx serve` 时需安装 Node.js
