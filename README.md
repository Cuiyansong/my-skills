# my-skills

京北方内部 Agent Skills 技能集合，遵循 [Agent Skills 开放规范](https://agentskills.io/)。

> **内部使用**：本仓库为公司内部技能库，请勿公开分发。技术内容与模板素材归京北方所有。

## 技能列表

| 目录 | 名称 | 说明 | 运行依赖 |
|---|---|---|---|
| `jbf-ppt-skills/` | JBF 大数据 PPT 设计专家 | 从 Markdown 大纲生成京北方内部风格的 PowerPoint | Python 3.8+、python-pptx；视觉 QA 需 LibreOffice |
| `react-skills/` | React 前端专家 | React 组件化、状态管理、性能优化 | 无（纯指令） |
| `backend-skills/` | 后端开发专家 | 架构设计、数据库、缓存、消息队列、微服务 | 无（纯指令） |
| `task-planner-skills/` | Task Planner 专家 | 任务管理、日程规划、时间追踪、团队协作 | 无（纯指令） |

## 环境要求

| 项目 | 版本 | 说明 |
|---|---|---|
| Git | 任意 | 获取仓库 |
| Python | 3.8+ | 仅 `jbf-ppt-skills` 需要 |
| python-pptx | 1.0+ | 仅 `jbf-ppt-skills` 需要 |

```bash
pip install python-pptx
```

## 安装

Agent Skills 本质是「文件夹 + SKILL.md」，安装即把技能目录放到客户端会扫描的位置。

### 方式一：克隆整个仓库（推荐）

先克隆到本地任意位置：

```bash
git clone https://github.com/Cuiyansong/my-skills.git
cd my-skills
```

然后把需要的技能目录复制到你的客户端技能目录（见下方「技能目录位置」）。例如安装全部 4 个技能：

```bash
# 目标目录按你的客户端调整
DEST="$HOME/.agents/skills"
mkdir -p "$DEST"
cp -R react-skills backend-skills task-planner-skills jbf-ppt-skills "$DEST/"
```

只装某一个技能：

```bash
cp -R jbf-ppt-skills "$HOME/.agents/skills/"
```

### 方式二：直接装到项目里（随项目共享）

在目标项目根目录执行：

```bash
mkdir -p .agents/skills
git clone https://github.com/Cuiyansong/my-skills.git /tmp/my-skills
cp -R /tmp/my-skills/jbf-ppt-skills .agents/skills/
rm -rf /tmp/my-skills
```

这样技能会随项目一起进入版本控制，团队成员克隆项目即自动获得。

### 方式三：作为子模块（需跟随上游更新）

```bash
git submodule add https://github.com/Cuiyansong/my-skills.git .agents/my-skills
```

更新到最新版：

```bash
git submodule update --remote .agents/my-skills
```

### 技能目录位置（按客户端）

不同客户端扫描的技能目录不同，请按你使用的产品选择：

| 客户端 | 项目级 | 用户级 |
|---|---|---|
| VS Code（GitHub Copilot） | `.agents/skills/` | — |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| 其他兼容客户端 | 见其文档 | 见其文档 |

> 若不确定，优先使用 `.agents/skills/`——这是规范中的通用约定。
> 安装后用客户端的技能列表命令（如 VS Code Copilot 的 `/skills`）确认技能已出现。

### 验证安装

安装后在技能目录下应能看到 `SKILL.md`：

```bash
ls "$HOME/.agents/skills/jbf-ppt-skills/SKILL.md"
```

## 使用

### jbf-ppt-skills（PPT 生成）

技能激活后，让 Agent 根据 Markdown 大纲生成 PPT。也可直接运行脚本：

```bash
cd "$HOME/.agents/skills/jbf-ppt-skills"

# 生成 PPT
python scripts/build_deck.py examples/agentskills-intro.md -o 输出.pptx

# 同时做视觉 QA（渲染图片 + 文字越界检查，需 LibreOffice）
python scripts/build_deck.py 大纲.md -o 输出.pptx --qa

# 单独跑视觉 QA
python scripts/qa.py 输出.pptx -o qa/ --cols 4

# 可选参数
python scripts/build_deck.py 大纲.md -o 输出.pptx \
  --title "主题" --subtitle "一句话主旨" --period "2026 Q4 — 2027" \
  --presenter "张三" --department "研发部" --date "2026-11-04"
```

大纲语法见 `jbf-ppt-skills/references/PAGE_TYPES.md`，样式规范见
`jbf-ppt-skills/references/STYLE_GUIDE.md`，示例见
`jbf-ppt-skills/examples/`。

**两层校验**：

| 层 | 命令 | 检查什么 | 依赖 |
|---|---|---|---|
| 结构层 | 默认执行 | 页数、空页、占位符残留、shape 越界、内容丢失 | 无 |
| 视觉层 | `--qa` 或 `qa.py` | 渲染成图 + 文字越界/压页脚 | LibreOffice、pymupdf、Pillow |

### 其他技能

`react-skills` / `backend-skills` / `task-planner-skills` 为纯指令型技能，
激活后按 `SKILL.md` 中的规范执行，配套代码示例位于各自的 `examples/` 目录。

## 校验技能规范

所有技能须通过 [skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref) 校验。

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

### 编写注意事项

- `SKILL.md` 的 `name` 字段必须为小写字母/数字/连字符，**且与目录名一致**。
- `description` 需说明「做什么」和「何时使用」，便于 Agent 判断是否激活。
- `SKILL.md` 正文建议控制在 500 行 / 5000 token 内，详细内容拆到 `references/`。
- 新增或修改技能后，运行 `./validate_skills.sh` 确认合规。

## 更新技能

```bash
cd my-skills
git pull origin main
# 重新复制到客户端技能目录
cp -R jbf-ppt-skills "$HOME/.agents/skills/"
```

## 问题反馈

内部问题请通过公司 Git 平台 Issue 或直接联系维护者。
