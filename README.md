# my-skills

Agent Skills 技能集合，遵循 [Agent Skills 开放规范](https://agentskills.io/)。

## 技能列表

| 目录 | 名称 | 说明 |
|---|---|---|
| `jbf-ppt-skills/` | JBF 大数据 PPT 设计专家 | 从 Markdown 大纲生成京北方内部风格的 PowerPoint |
| `react-skills/` | React 前端专家 | React 组件化、状态管理、性能优化 |
| `backend-skills/` | 后端开发专家 | 架构设计、数据库、缓存、消息队列、微服务 |
| `task-planner-skills/` | Task Planner 专家 | 任务管理、日程规划、时间追踪、团队协作 |

## 校验

所有技能须通过 [skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref) 规范校验。

### 安装 skills-ref

> 注意：PyPI 上的 `skills-ref` 0.1.1 已把命令改名为 `agentskills`；
> 需要 `skills-ref` 命令时，请从 GitHub 安装 0.1.0 版本：

```bash
pip install "git+https://github.com/agentskills/agentskills.git#subdirectory=skills-ref"
```

### 一键校验全部技能

```bash
./validate_skills.sh
```

### 校验单个技能

```bash
skills-ref validate ./jbf-ppt-skills
```

### 预期输出

```
Valid skill: jbf-ppt-skills
Valid skill: react-skills
Valid skill: backend-skills
Valid skill: task-planner-skills
✓ 全部技能校验通过（共 4 个）
```

## 技能结构

每个技能目录遵循规范：

```
my-skill/
├── SKILL.md      # 必需：frontmatter 元数据（name/description）+ 指令
├── scripts/      # 可选：可执行代码
├── references/   # 可选：参考文档
├── assets/       # 可选：模板、资源
└── examples/     # 可选：示例
```

注意：`SKILL.md` 的 `name` 字段必须为小写字母/数字/连字符，且与目录名一致。
