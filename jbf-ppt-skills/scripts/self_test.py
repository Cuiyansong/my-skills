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

    # 断言 6：占位符残留能被抓出（error 级别）
    from validate import find_placeholders
    from pptx import Presentation
    ph_deck = parse("---\ntitle: 占位符测试\nsubtitle: 此处补充一句话主旨\n---\n\n"
                    "# 01 章节\n\n## 1.1 页\n\n- TODO 补充内容\n")
    ph_file = os.path.join(tempfile.gettempdir(), "jbf_self_test_ph.pptx")
    build(ph_deck, style, ph_file)
    ph_hits = find_placeholders(Presentation(ph_file))
    check("占位符残留被检测", len(ph_hits) >= 2, f"命中 {len(ph_hits)} 处")

    # 断言 7：subtitle/period 为空时不再输出占位文字
    bare = parse("---\ntitle: 无副标题\n---\n\n# 01 章节\n\n## 1.1 页\n\n- 条目\n")
    bare_file = os.path.join(tempfile.gettempdir(), "jbf_self_test_bare.pptx")
    build(bare, style, bare_file)
    bare_hits = find_placeholders(Presentation(bare_file))
    check("空 subtitle 不产生占位文字", len(bare_hits) == 0, "; ".join(bare_hits))

    # 断言 8：图片加载失败不静默（记入 warnings）
    import builder as _builder
    from pptx.util import Inches
    _bprs = Presentation()
    _bprs.slide_width = Inches(13.333)
    _bprs.slide_height = Inches(7.5)
    _bslide = _bprs.slides.add_slide(_bprs.slide_layouts[6])
    _builder._WARNINGS.clear()
    _builder._add_picture(_bslide, "/nope/missing.png", 0, 0, 1, 1)
    check("图片失败可见化", len(_builder._WARNINGS) == 1,
          _builder._WARNINGS[0] if _builder._WARNINGS else "无警告")

    # 断言 9：内容超出容量时告警不静默
    # 构造：20 条列表（几乎占满版心）+ 段落 + 又 20 条列表 → 后两块被丢弃
    over_lines = [f"- 列表项{i}" + "描述" * 10 for i in range(20)]
    over_lines += ["这是中间的段落文字"]
    over_lines += [f"- 尾列表{i}" + "描述" * 10 for i in range(20)]
    over_md = ("---\ntitle: 超容量\n---\n\n# 01 章节\n\n## 1.1 多块\n\n"
               + "\n".join(over_lines))
    over_deck = parse(over_md)
    over_file = os.path.join(tempfile.gettempdir(), "jbf_self_test_over.pptx")
    over_warns = build(over_deck, style, over_file)
    check("内容超出容量有告警",
          any("未渲染" in w for w in over_warns), "; ".join(over_warns) or "无警告")

    # 断言 10：视觉 QA（缺 LibreOffice 则跳过）
    import qa as _qa
    if _qa._soffice_bin() is None:
        check("视觉 QA（跳过：无 LibreOffice）", True, "skipped")
    else:
        qa_dir = os.path.join(tempfile.gettempdir(), "jbf_self_test_qa")
        _qa_report = _qa.run_qa(tmp, qa_dir, cols=4, dpi=80)
        check("视觉 QA 渲染出网格图", len(_qa_report.grids) >= 1,
              f"{len(_qa_report.grids)} 张")
        check("视觉 QA 页面图数量正确", len(_qa_report.pages) == len(deck.pages),
              f"{len(_qa_report.pages)} 页")
        check("正常 deck 无视觉问题", _qa_report.ok,
              "; ".join(i.detail for i in _qa_report.issues))

        # 断言 11：视觉检查能抓出文字越界（validate.py 抓不到的那类）
        big_deck = parse("---\ntitle: 越界\n---\n\n# 01 章节\n\n## 1.1 三十条\n\n"
                         + "\n".join(f"- 第{i}条" + "很长的描述文字" * 8
                                     for i in range(1, 31)))
        big_file = os.path.join(tempfile.gettempdir(), "jbf_self_test_big.pptx")
        build(big_deck, style, big_file)
        big_v_errors, _ = validate(big_file)      # 结构层：不报
        big_report = _qa.run_qa(big_file, qa_dir + "_big", cols=4, dpi=80)
        check("越界：结构校验不报但视觉 QA 抓到",
              len(big_v_errors) == 0 and not big_report.ok,
              f"结构错误={len(big_v_errors)}，视觉问题={len(big_report.issues)}")

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
