---
name: jbf-ppt-skills
description: 京北方（JBF）大数据 PPT 设计专家。根据 Markdown 大纲生成符合京北方内部视觉规范（深蓝主色 #0A308F、微软雅黑、16:9 宽屏）的 PowerPoint 演示文稿，支持封面、目录、章节页、内容页、结束页等页面类型。当用户要求制作、生成、设计 PPT、演示文稿、幻灯片，或提到京北方/JBF 风格的汇报材料时使用。
compatibility: Requires Python 3.8+ and python-pptx. 离线可用，无需联网。
metadata:
  author: JBF
  version: "1.0"
  language: zh-CN
---

# JBF 大数据 PPT 设计专家

从 Markdown 大纲生成符合京北方内部视觉规范的 `.pptx` 演示文稿。复用内置模板
`assets/template.pptx` 的配色、字体与版式几何；模板缺失时自动回退到内置默认样式。

## 使用场景

- 项目汇报 / 复盘
- 方案 / 提案
- 培训 / 分享
- 周报 / 月报
- 任意需要快速产出规范 PPT 的场合（中小型 5–30 页）

## 快速开始

1. 编写 Markdown 大纲（格式见 `references/PAGE_TYPES.md`）。
2. 运行生成脚本：

```bash
python scripts/build_deck.py 大纲.md -o 输出.pptx
```

3. 脚本自动校验产物并打印结果。可选的 CLI 参数：

```bash
python scripts/build_deck.py 大纲.md -o 输出.pptx \
  --title "主题" --subtitle "一句话主旨" --period "2026 Q4 — 2027" \
  --presenter "张三" --department "研发部" --date "2026-11-04" \
  --template path/to/template.pptx
```

## 工作流程（重要）

按以下步骤执行，不要跳过：

1. **读取输入**：获取 Markdown 大纲内容。
2. **解析**：由 `scripts/outline.py` 解析为结构化 Deck（含校验与自动修复）。
3. **加载样式**：`scripts/template.py` 从模板提取样式参数；模板缺失回退默认。
4. **构建**：`scripts/builder.py` 按页面类型重建幻灯片（封面/目录/章节/内容/结束）。
5. **校验**：`scripts/validate.py` 检查文件可打开、页数、空页、溢出。
6. **反馈**：向用户报告生成结果与警告；若失败，说明原因。

## 大纲格式

详细语法与页面类型定义见 [`references/PAGE_TYPES.md`](references/PAGE_TYPES.md)，要点：

- 可选 YAML frontmatter（`---` 包裹）提供封面元数据：`title` / `subtitle` / `period` / `presenter` / `department` / `date`。
- `#` 一级标题 = 章节页；其下紧跟的列表项 = 章节标签。
- `##` 二级标题 = 内容页；标题为「目录」→ 目录页；「谢谢/致谢」→ 结束页。
- 内容页正文支持：无序列表（项目符号）、有序列表（步骤条/编号列表）、表格（卡片/表格）、普通段落。
- 封面自动生成（由 frontmatter 的 `title` 触发）。

示例大纲见 [`examples/sample.md`](examples/sample.md)，生成结果见
[`examples/sample.pptx`](examples/sample.pptx)。

## 样式规范

颜色、字体、版式几何的权威定义见 [`references/STYLE_GUIDE.md`](references/STYLE_GUIDE.md)：

- 主色深蓝 `#0A308F`，字体微软雅黑，16:9 宽屏（13.333 × 7.5 英寸）。
- 页眉统一右上角 logo + 「股票代码：002987」；页脚公司名 + 页码。

## 常见边界情况

- **模板缺失/损坏**：回退内置默认样式，仍产出可用 deck（脚本会打印警告）。
- **内容溢出**：自动缩小字号（最低 9pt）；列表超过 8 条或步骤超过 5 条自动切换布局。
- **大纲不规范**：空项跳过、层级缺失自动补编号，并输出警告清单。
- **表格/长文本**：自动换行不截断；表格首行加粗作为表头。

## 自测

```bash
python scripts/self_test.py
```

全部断言通过即技能可用。校验规范遵循 agentskills.io（`skills-ref validate`）。
