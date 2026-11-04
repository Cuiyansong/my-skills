"""生成后校验：检查 pptx 是否有效、页数、空页、占位符残留、边界溢出。

返回 (errors, warnings)。errors 为空表示通过。
"""
from __future__ import annotations

import re

from pptx import Presentation

# 占位符残留模式：未填写的模板占位文字 / 常见占位符
# 命中即 error —— 交付物里出现这类文字属于用户可见缺陷
PLACEHOLDER_PATTERNS = [
    re.compile(r"此处补充"),
    re.compile(r"\bX{3,}\b"),           # XXXXXX
    re.compile(r"XXXX+"),
    re.compile(r"\blorem\b", re.I),
    re.compile(r"\bipsum\b", re.I),
    re.compile(r"\bTODO\b"),
    re.compile(r"\[insert", re.I),
    re.compile(r"待补充"),
]


def find_placeholders(prs) -> list[str]:
    """扫描所有页的文字，返回占位符残留描述列表。"""
    hits: list[str] = []
    for i, slide in enumerate(prs.slides, start=1):
        for shape in slide.shapes:
            if not shape.has_text_frame:
                continue
            for line in shape.text_frame.text.split("\n"):
                line = line.strip()
                if not line:
                    continue
                for pat in PLACEHOLDER_PATTERNS:
                    if pat.search(line):
                        hits.append(f'第 {i} 页存在占位符残留：「{line[:40]}」')
                        break
    return hits


def validate(path: str, expected_pages: int | None = None) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    try:
        prs = Presentation(path)
    except Exception as e:
        errors.append(f"无法打开文件：{e}")
        return errors, warnings

    n = len(prs.slides)
    if n == 0:
        errors.append("文件没有任何幻灯片")

    if expected_pages is not None and n != expected_pages:
        warnings.append(f"页数 {n} 与预期 {expected_pages} 不一致")

    # 占位符残留（error：阻止交付）
    errors.extend(find_placeholders(prs))

    W = prs.slide_width
    H = prs.slide_height

    for i, slide in enumerate(prs.slides, start=1):
        has_text = False
        for shape in slide.shapes:
            if shape.has_text_frame and shape.text_frame.text.strip():
                has_text = True
                break
            # 图片也算内容
            if shape.shape_type == 13:  # PICTURE
                has_text = True
                break
        if not has_text:
            errors.append(f"第 {i} 页为空页")

        # 溢出检查（右/下边界超出画布，容差 0.1 英寸）
        for shape in slide.shapes:
            try:
                right = shape.left + shape.width
                bottom = shape.top + shape.height
            except TypeError:
                continue
            if right > W + 91440 or bottom > H + 91440:  # 0.1 inch = 91440 EMU
                warnings.append(f"第 {i} 页有元素超出画布边界")

    return errors, warnings
