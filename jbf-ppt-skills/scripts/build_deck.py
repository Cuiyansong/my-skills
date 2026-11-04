"""CLI 入口：Markdown 大纲 → 符合 JBF 内部风格的 .pptx。

用法：
    python scripts/build_deck.py input.md -o output.pptx
    python scripts/build_deck.py input.md -o output.pptx --template path/to/template.pptx
    python scripts/build_deck.py input.md -o output.pptx --title "主题" --period "2026 Q4"
    python scripts/build_deck.py input.md -o output.pptx --qa      # 额外跑视觉 QA

默认模板：assets/template.pptx；缺失时回退内置默认样式。
视觉 QA（--qa）需要 LibreOffice，缺则自动跳过并提示。
"""
from __future__ import annotations

import argparse
import os
import sys

# 允许直接运行脚本（确保能 import 同目录模块）
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from outline import parse, COVER
from template import resolve_style, default_template_path, default_assets_dir
from builder import build
from validate import validate


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="生成 JBF 风格 PPT")
    parser.add_argument("input", help="Markdown 大纲文件")
    parser.add_argument("-o", "--output", default="output.pptx", help="输出 pptx 路径")
    parser.add_argument("--template", default=None, help="模板 pptx 路径（默认 assets/template.pptx）")
    parser.add_argument("--title", default=None, help="覆盖封面主标题")
    parser.add_argument("--subtitle", default=None, help="封面一句话主旨")
    parser.add_argument("--period", default=None, help="规划周期")
    parser.add_argument("--presenter", default=None, help="汇报人")
    parser.add_argument("--department", default=None, help="部门")
    parser.add_argument("--date", default=None, help="日期")
    parser.add_argument("--qa", action="store_true",
                        help="生成后额外跑视觉 QA（渲染图片 + 文字越界检查，需 LibreOffice）")
    parser.add_argument("--qa-dir", default=None, help="视觉 QA 输出目录（默认 <输出名>_qa/）")
    args = parser.parse_args(argv)

    if not os.path.exists(args.input):
        print(f"错误：找不到输入文件 {args.input}", file=sys.stderr)
        return 1

    with open(args.input, encoding="utf-8") as f:
        md = f.read()

    deck = parse(md)

    # CLI 覆盖 frontmatter
    if args.title:
        deck.title = args.title
    if args.subtitle:
        deck.subtitle = args.subtitle
    if args.period:
        deck.period = args.period
    if args.presenter:
        deck.presenter = args.presenter
    if args.department:
        deck.department = args.department
    if args.date:
        deck.date = args.date

    # 封面已在 parse 阶段根据 frontmatter 自动补入（无需重复处理）

    template_path = args.template or default_template_path()
    style = resolve_style(template_path)
    style["_assets"] = default_assets_dir()
    style["_template"] = template_path

    # 模板状态提示
    if not os.path.exists(template_path):
        print("⚠ 未找到模板，使用内置默认样式。", file=sys.stderr)

    # 输出解析警告
    for w in deck.warnings:
        print(f"⚠ 大纲警告：{w}", file=sys.stderr)

    warnings = build(deck, style, args.output)
    for w in warnings:
        print(f"⚠ 构建警告：{w}", file=sys.stderr)

    # 内容被丢弃属于严重问题（用户内容少了），阻断交付
    content_lost = [w for w in warnings if "未渲染" in w]
    if content_lost:
        print(f"\n✗ 生成失败：页面内容超出容量，部分内容未渲染。"
              f"请精简内容或拆分为多页后重试：{args.output}", file=sys.stderr)
        return 1

    # 校验
    errors, vwarnings = validate(args.output, expected_pages=len(deck.pages))
    for e in errors:
        print(f"✗ 校验错误：{e}", file=sys.stderr)
    for w in vwarnings:
        print(f"⚠ 校验警告：{w}", file=sys.stderr)

    if errors:
        print(f"生成失败（存在校验错误）：{args.output}", file=sys.stderr)
        return 1

    print(f"✓ 已生成 {args.output}（{len(deck.pages)} 页）")

    # 可选：视觉 QA（渲染后才可见的缺陷）
    if args.qa:
        out_dir = args.qa_dir or (os.path.splitext(args.output)[0] + "_qa")
        try:
            from qa import run_qa
            report = run_qa(args.output, out_dir, slide_w_in=style["slide_width_in"],
                            slide_h_in=style["slide_height_in"])
        except (RuntimeError, FileNotFoundError) as e:
            print(f"⚠ 视觉 QA 已跳过：{e}", file=sys.stderr)
            return 0

        print(f"视觉 QA：网格图 {len(report.grids)} 张 →")
        for g in report.grids:
            print(f"  {g}")
        if report.issues:
            print(f"\n⚠ 发现 {len(report.issues)} 处视觉问题：", file=sys.stderr)
            for it in report.issues:
                print(f"  ✗ 第 {it.page} 页 [{it.kind}] {it.detail}", file=sys.stderr)
            return 1
        print("✓ 视觉 QA 通过")

    return 0


if __name__ == "__main__":
    sys.exit(main())
