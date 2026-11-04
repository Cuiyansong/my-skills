# 示例说明

本目录包含技能的最小可用示例：

- `sample.md` —— 示例 Markdown 大纲（含 frontmatter、章节、目录、内容页、表格、结束页）
- `sample.pptx` —— 由 `sample.md` 生成的演示文稿（运行自测/生成脚本后产生）

## 生成示例

在技能根目录执行：

```bash
python scripts/build_deck.py examples/sample.md -o examples/sample.pptx
```

或直接运行自测（会生成临时产物并断言）：

```bash
python scripts/self_test.py
```

## 大纲要点

| 元素 | 写法 | 生成的页面 |
|---|---|---|
| frontmatter | `---` 包裹的 `title` 等 | 封面 |
| `# 01 产品规划` | 一级标题 | 章节页 |
| `## 目录` | 二级标题（特殊名） | 目录页 |
| `## 1.1 项目背景` | 二级标题 | 内容页 |
| `- 目标一` | 无序列表 | 项目符号 |
| `1. 步骤` | 有序列表 | 步骤条/编号列表 |
| `\| 列 \| 列 \|` | 表格 | 表格 |
| `## 谢谢` | 二级标题（特殊名） | 结束页 |
