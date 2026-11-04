#!/usr/bin/env bash
# 校验仓库中所有 Agent Skills 是否符合 skills-ref 规范。
#
# 依赖：skills-ref（https://github.com/agentskills/agentskills/tree/main/skills-ref）
# 安装：
#   pip install "git+https://github.com/agentskills/agentskills.git#subdirectory=skills-ref"
# 注意：PyPI 上的 skills-ref 0.1.1 命令名是 agentskills，非 skills-ref。
#
# 用法：
#   ./validate_skills.sh            # 校验所有技能
#   ./validate_skills.sh react-skills  # 校验指定技能
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v skills-ref >/dev/null 2>&1; then
  echo "错误：未找到 skills-ref 命令。" >&2
  echo "请先安装：" >&2
  echo "  pip install \"git+https://github.com/agentskills/agentskills.git#subdirectory=skills-ref\"" >&2
  exit 2
fi

# 要校验的技能目录（若传入参数则只校验指定项）
if [ "$#" -gt 0 ]; then
  SKILLS=("$@")
else
  # 自动发现：所有含 SKILL.md 的一级子目录
  SKILLS=()
  for d in */; do
    d="${d%/}"
    if [ -f "$d/SKILL.md" ]; then
      SKILLS+=("$d")
    fi
  done
fi

failed=0
for skill in "${SKILLS[@]}"; do
  if skills-ref validate "$skill"; then
    :  # 通过
  else
    failed=1
  fi
done

if [ "$failed" -eq 0 ]; then
  echo "✓ 全部技能校验通过（共 ${#SKILLS[@]} 个）"
else
  echo "✗ 存在校验失败的技能"
  exit 1
fi
