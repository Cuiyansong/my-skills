---
title: Agent Skills 介绍
subtitle: 为 AI Agent 赋予新能力与专业知识的开放格式
period: 技术分享 · 2026
presenter: 技术分享
department: 大数据事业部
date: 2026-11-04
---

# 01 认识 Agent Skills

- 开放格式
- 轻量便携
- 跨产品复用

## 目录

- 01 认识 Agent Skills
- 02 格式规范
- 03 工作原理
- 04 快速上手
- 05 最佳实践
- 06 生态与客户端

## 1.1 什么是 Agent Skills

Agent Skills 是一种轻量、开放的格式，用于扩展 AI Agent 的能力，为其注入专业知识和可复用工作流。

- 一个技能就是一个文件夹，核心是 SKILL.md 文件
- SKILL.md 包含元数据（name、description）和任务指令
- 技能还可打包脚本、参考资料、模板等资源
- 可移植、可版本控制，Agent 按需加载

## 1.2 为什么需要 Agent Skills

Agent 越来越强大，但往往缺少可靠完成实际工作所需的上下文。技能把程序性知识打包成可移植、可版本控制的文件夹来解决这一问题。

| 价值 | 说明 |
| --- | --- |
| 领域专长 | 把专业流程沉淀为可复用指令与资源 |
| 可复用工作流 | 把多步骤任务变成一致、可审计的流程 |
| 跨产品复用 | 构建一次，在任何兼容技能的 Agent 中使用 |

# 02 格式规范

- SKILL.md
- 目录结构
- 元数据字段

## 2.1 目录结构

一个技能是至少包含 SKILL.md 文件的目录，其余目录均为可选。

| 目录/文件 | 必需性 | 说明 |
| --- | --- | --- |
| SKILL.md | 必需 | 元数据 + 指令 |
| scripts/ | 可选 | 可执行代码 |
| references/ | 可选 | 参考文档 |
| assets/ | 可选 | 模板、资源 |

## 2.2 SKILL.md 元数据字段

| 字段 | 必需 | 说明 |
| --- | --- | --- |
| name | 是 | 最多 64 字符，小写字母数字连字符 |
| description | 是 | 最多 1024 字符，说明做什么与何时用 |
| license | 否 | 许可证 |
| compatibility | 否 | 环境要求 |
| metadata | 否 | 自定义键值 |
| allowed-tools | 否 | 预批准的工具（实验性） |

# 03 工作原理

- 渐进式披露
- 三阶段加载
- 节省上下文

## 3.1 渐进式披露

Agent 通过渐进式披露分三个阶段加载技能，只在需要时拉取更多细节。

1. 发现 Discovery
2. 激活 Activation
3. 执行 Execution

## 3.2 三阶段详解

| 阶段 | 行为 | 加载内容 |
| --- | --- | --- |
| 发现 | 启动时读取所有技能的 name 与 description | 约 100 token |
| 激活 | 任务匹配时读取完整 SKILL.md | 建议 < 5000 token |
| 执行 | 按需执行脚本或加载引用文件 | 仅需时 |

# 04 快速上手

- 最小示例
- 立即生效
- VS Code 演示

## 4.1 一个 20 行的技能

在 .agents/skills/roll-dice/ 下创建 SKILL.md，即可让 Agent 学会掷骰子。

| 组成 | 作用 |
| --- | --- |
| name | 技能标识，须与文件夹名一致 |
| description | 告诉 Agent 何时激活 |
| 正文 | 激活后执行的指令 |

## 4.2 立即验证

1. 打开项目，进入 Copilot Chat 的 Agent 模式
2. 输入 /skills 确认 roll-dice 出现在列表
3. 提问「Roll a d20」
4. Agent 激活技能并执行命令返回随机数

# 05 最佳实践

- 真实经验
- 精简上下文
- 校准控制

## 5.1 从真实经验出发

有效的技能源于真实专业经验，而非泛泛而谈。

- 步骤：记录实际成功的操作序列
- 修正：记录你纠正 Agent 的地方
- 格式：记录输入输出的样子
- 上下文：记录 Agent 原本不知道的项目约定

## 5.2 精简上下文

技能激活后全文进入上下文窗口，每个 token 都在争夺注意力。

- 只添加 Agent 不知道的内容
- 设计连贯的单元
- 追求适度细节
- 大技能用渐进式披露拆分

## 5.3 校准控制力度

| 场景 | 建议 |
| --- | --- |
| 多方案皆可 | 给 Agent 自由，解释为什么 |
| 操作脆弱 | 明确规定精确命令 |
| 多工具可选 | 给默认值而非菜单 |

# 06 生态与客户端

- 开放标准
- 广泛支持
- 由 Anthropic 发起

## 6.1 支持的客户端

Agent Skills 格式已被大量 Agent 产品采用，跨产品复用。

- Claude Code / Claude 桌面与网页
- VS Code（GitHub Copilot）/ Cursor / Trae
- OpenAI Codex / Mistral Vibe / Goose
- GitHub / Snowflake / Databricks / Spring AI

## 谢谢
