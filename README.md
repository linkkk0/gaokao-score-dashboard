# 高三成绩趋势 · Personal Academic Dashboard

一个简洁、现代、无需前端框架的个人高三成绩可视化项目。

它将每一次考试的 **日期、考试名称、总成绩与语文 / 数学 / 英语 / 物理 / 化学 / 生物六科成绩** 统一存储在 JSON 中，并通过 SVG 动态绘制成绩趋势折线图。同时提供一个独立的 JSON 成绩编辑器，用于日常添加、修改、删除和导出考试数据。

<p align="center">
  <strong>纯 HTML + CSS + JavaScript + JSON</strong><br>
  无需构建工具，无需数据库，适合个人成绩长期记录与展示。
</p>

---

## ✨ 特性

| 功能 | 说明 |
| --- | --- |
| 📈 多维成绩趋势 | 支持总成绩、语文、数学、英语、物理、化学、生物 7 个视图 |
| 🎯 动态纵轴 | 根据当前考试数据自动计算纵轴范围与刻度 |
| 💬 节点悬浮卡片 | 鼠标移动到成绩节点即可查看本次考试详细成绩 |
| 📅 日期趋势 | 横轴自动使用考试日期，并根据数据量优化日期标签 |
| 🔗 数据绑定 | 同一场考试的总分与六科成绩始终属于同一条 JSON 记录 |
| ♾️ 持续追加 | 不限制考试条数，继续向 `exams` 数组添加记录即可 |
| 📝 JSON 编辑器 | 支持导入、导出、添加、编辑、删除考试记录 |
| 🔄 自动计算总分 | 编辑器支持根据六科成绩自动计算总分 |
| 📱 响应式布局 | 适配桌面端与移动端屏幕 |
| 🌓 深浅色模式 | 默认跟随系统配色，也支持手动切换并记住选择 |
| 🎨 无框架依赖 | 不依赖 Vue、React、ECharts、Chart.js 等第三方图表库 |

---

## 🖥️ 页面组成

### 1. 成绩趋势页面

入口：`index.html`

主要用于查看成绩变化趋势：

- 总成绩趋势
- 六科单科趋势
- 动态纵轴
- 考试节点
- 悬浮成绩详情
- 最近总分与考试次数统计

### 2. 成绩 JSON 编辑器

入口：`editor.html`

用于维护 `data.json`：

- 导入现有 JSON
- 新增考试
- 修改考试
- 删除考试
- 搜索考试名称
- 六科成绩编辑
- 自动计算总分
- 导出最新 JSON

编辑完成后，导出的文件可以直接替换原来的 `data.json`。

---

## 📁 项目结构

```text
高三成绩趋势/
├── index.html                 # 成绩趋势页面
├── style.css                  # 成绩趋势页面样式
├── script.js                  # 折线图、动态纵轴、悬浮卡片等逻辑
├── data.json                  # 成绩数据
│
├── editor.html                # JSON 成绩编辑器
├── editor.css                 # 编辑器样式
├── editor.js                  # 编辑器逻辑
├── theme.js                   # 深浅色主题与系统配色同步
│
└── README.md                  # 项目说明
```

---

## 🚀 快速开始

### 方法一：VS Code + Live Server

推荐使用 VS Code 打开项目文件夹，然后使用 **Live Server** 启动。

启动后访问：

```text
index.html
```

成绩编辑器：

```text
editor.html
```

> 不建议直接双击 `index.html` 使用 `file://` 打开。页面需要通过 `fetch()` 读取 `data.json`，部分浏览器会限制本地文件访问。

### 方法二：任意静态 Web 服务器

这个项目不需要 Node.js、Python 后端或数据库，只需要一个静态文件服务器即可。

例如使用 Python：

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000/
```

---

## 📊 JSON 数据格式

成绩数据统一存放在 `data.json` 中。

推荐使用以下结构：

```json
{
  "exams": [
    {
      "date": "2026-03-08",
      "exam": "高三第一次模拟考试",
      "scores": {
        "chinese": 118,
        "math": 126,
        "english": 121,
        "physics": 84,
        "chemistry": 88,
        "biology": 86
      },
      "total": 623
    }
  ]
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `date` | String | 考试日期，建议使用 `YYYY-MM-DD` |
| `exam` | String | 考试名称 |
| `scores.chinese` | Number | 语文成绩 |
| `scores.math` | Number | 数学成绩 |
| `scores.english` | Number | 英语成绩 |
| `scores.physics` | Number | 物理成绩 |
| `scores.chemistry` | Number | 化学成绩 |
| `scores.biology` | Number | 生物成绩 |
| `total` | Number | 总成绩 |

### 继续添加考试

无需修改 HTML、CSS 或 JavaScript，只需要继续向 `exams` 数组末尾添加记录：

```json
{
  "exams": [
    {
      "date": "2026-03-08",
      "exam": "高三第一次模拟考试",
      "scores": {
        "chinese": 118,
        "math": 126,
        "english": 121,
        "physics": 84,
        "chemistry": 88,
        "biology": 86
      },
      "total": 623
    },
    {
      "date": "2026-03-25",
      "exam": "高三第二次模拟考试",
      "scores": {
        "chinese": 122,
        "math": 131,
        "english": 125,
        "physics": 87,
        "chemistry": 90,
        "biology": 89
      },
      "total": 644
    }
  ]
}
```

项目不会在代码中写死考试数量，理论上可以持续追加。实际可显示数量主要受浏览器和设备性能影响。

---

## 🌓 深浅色模式

项目同时支持浅色与深色模式。首次打开时会读取系统的 `prefers-color-scheme` 配置：

- 系统为浅色 → 默认使用浅色模式
- 系统为深色 → 默认使用深色模式
- 点击右上角切换按钮后，会记住手动选择
- 未手动选择时，系统配色变化也会自动同步

主题状态由 `theme.js` 统一管理，成绩趋势页和 JSON 编辑器共享同一套主题设置。

## 📝 使用成绩编辑器

打开：

```text
editor.html
```

### 新增成绩

点击 **「＋ 添加考试」**，填写：

1. 考试日期
2. 考试名称
3. 六科成绩
4. 总成绩

点击 **「自动计算」** 可以根据六科成绩重新计算总分。

### 修改成绩

在左侧考试记录列表中选择某一次考试，即可进入编辑状态。

修改完成后点击 **「保存记录」**。

### 删除成绩

选择需要删除的考试，然后点击右上角 **「删除记录」**。

### 导入 / 导出 JSON

点击 **「导入 JSON」** 可以读取已有数据。

点击 **「导出 JSON」** 会生成新的：

```text
 data-YYYY-MM-DD.json
```

导出的文件保持：

```json
{
  "exams": []
}
```

结构，可以直接继续用于成绩趋势页面。

---

## 🔧 兼容旧数据格式

成绩趋势页面和编辑器同时兼容以下两种 JSON：

### 推荐格式

```json
{
  "exams": [
    {}
  ]
}
```

### 旧版数组格式

```json
[
  {}
]
```

导出时会统一保存为推荐的 `exams` 对象结构。

---

## 📈 图表实现

本项目没有使用第三方图表框架，折线图由原生 **SVG** 动态绘制。

主要逻辑包括：

- 根据成绩数据计算坐标
- 自动计算合理的纵轴上下限
- 自动生成网格线与刻度
- 自动生成日期标签
- SVG 折线与面积填充
- 每个数据点绑定独立悬浮事件
- 根据节点实际屏幕坐标定位悬浮卡片
- 窗口尺寸变化时自动重新绘制

这种实现方式依赖较少，也方便后续按照个人需求继续修改。

---

## 🎨 设计思路

项目整体采用简洁的个人数据仪表盘风格：

- 大标题 + 简短介绍
- 顶部数据概览
- 标签式科目切换
- 大面积趋势图
- 轻量化信息卡片
- 低干扰的背景与边框
- 响应式布局

重点不是复杂的可视化组件，而是让长期成绩记录能够快速阅读和比较。

---

## 🌐 部署到 GitHub Pages

这是一个纯静态项目，可以直接部署到 GitHub Pages。

### 1. 创建 GitHub 仓库

在 GitHub 新建一个仓库，例如：

```text
senior-three-score-dashboard
```

### 2. 上传项目文件

上传：

```text
index.html
style.css
script.js
data.json
editor.html
editor.css
editor.js
README.md
```

### 3. 开启 GitHub Pages

进入：

```text
Settings → Pages
```

在 **Build and deployment** 中选择：

```text
Deploy from a branch
```

然后选择：

```text
Branch: main
Folder: / (root)
```

保存后等待 GitHub Pages 完成部署即可。

---

## ⚠️ 隐私提醒

这个项目默认将成绩数据直接放在 `data.json` 中。

如果部署到公开的 GitHub 仓库或 GitHub Pages，`data.json` 中的真实成绩也会公开可访问。

如果不希望公开个人成绩，建议：

- 将仓库设置为 Private
- 或只在本地使用，不部署到公开站点

---

## 🛠️ 后续可以扩展的方向

这个项目的 JSON 数据结构已经为继续扩展留出了空间，例如：

- 年级 / 学期筛选
- 单科最高分、最低分统计
- 平均分与进步幅度
- 与目标分数对比
- 同一考试不同版本成绩对比
- 成绩排名记录
- 导出成绩报告
- 深色模式
- 更多图表类型
- 数据备份与恢复

这些功能都可以在不改变核心 `exams` 数据结构的前提下继续添加。


<p align="center">
  Made with HTML · CSS · JavaScript · SVG
</p>
