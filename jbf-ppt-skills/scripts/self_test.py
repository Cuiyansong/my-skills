"""自测脚本：跑示例大纲，断言生成结果符合验收标准。

用法：
    python scripts/self_test.py

退出码 0 表示全部断言通过。
"""
from __future__ import annotations

import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from outline import parse, COVER, SECTION, CONTENT
from template import resolve_style, default_template_path, default_assets_dir
from builder import build
from validate import validate

SAMPLE = """---
title: 报表平台项目规划
subtitle: 一句话主旨（建议 20–30 字）
period: 2026 Q4 — 2027
presenter: 张三
department: 研发部
date: 2026-11-04
---

# 01 产品规划

- 架构升级
- 能力增强
- 智能辅助

## 目录

- 01 产品规划
- 02 沟通协作计划

## 1.1 项目背景

本项目旨在升级报表平台能力。

- 目标一：架构升级
- 目标二：能力增强
- 目标三：智能辅助

## 1.2 里程碑

1. 2026 Q4 启动
2. 2027 Q1 交付
3. 2027 Q2 上线
4. 2027 Q3 优化
5. 2027 Q4 收尾

## 1.3 指标说明

| 指标 | 说明 |
| --- | --- |
| 大屏编辑器 | 提升编辑效率 |
| 3D 图表 | 丰富可视化 |

# 02 沟通协作计划

## 2.1 沟通机制

- 每周例会
- 双周复盘

## 谢谢
"""


def main() -> int:
    results: list[tuple[str, bool, str]] = []

    def check(name: str, ok: bool, detail: str = ""):
        results.append((name, ok, detail))

    deck = parse(SAMPLE)

    # 断言 1：解析出封面 + 至少 1 章节 + 至少 1 内容页 + 特殊页
    types = [p.page_type for p in deck.pages]
    check("解析出封面", COVER in types, f"types={types}")
    check("解析出章节页", SECTION in types)
    check("解析出内容页", CONTENT in types)
    check("解析出目录页", "toc" in types)
    check("解析出结束页", "thanks" in types)

    # 断言 2：解析警告处理（不规范大纲被修复而非崩溃）
    messy = parse("# 01 章节\n\n## 1.1 标题\n\n孤立内容没有标题\n")
    check("不规范大纲不崩溃", len(messy.pages) >= 1)

    # 断言 3：模板缺失回退默认样式
    missing_style = resolve_style("/nonexistent/template.pptx")
    check("模板缺失回退默认样式", missing_style["primary"] == "0A308F")

    # 断言 4：真实模板可解析
    tpl = default_template_path()
    check("模板文件存在", os.path.exists(tpl), tpl)
    style = resolve_style(tpl)
    style["_assets"] = default_assets_dir()
    style["_template"] = tpl

    # 断言 5：构建 + 校验
    tmp = os.path.join(tempfile.gettempdir(), "jbf_self_test.pptx")
    build(deck, style, tmp)
    check("构建产物存在", os.path.exists(tmp))

    errors, warnings = validate(tmp, expected_pages=len(deck.pages))
    check("校验无错误", len(errors) == 0, "; ".join(errors))
    check("校验无空页", "空页" not in "; ".join(errors))

    # 输出结果
    passed = 0
    for name, ok, detail in results:
        mark = "✓" if ok else "✗"
        print(f"{mark} {name}" + (f"  [{detail}]" if detail else ""))
        if ok:
            passed += 1

    print(f"\n{passed}/{len(results)} 项通过")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
