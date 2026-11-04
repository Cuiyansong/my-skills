"""Markdown 大纲解析、校验与规范化。

将 Markdown 大纲解析为结构化的 Deck 模型：
- 一级标题 `#`  → 章节（section）
- 二级标题 `##` → 内容页（content）；标题为「目录/大纲/CONTENTS」→ toc；
                  标题为「谢谢/致谢/THANKS/结束」→ thanks
- 列表/段落/表格 → 正文内容

同时负责：跳过空项、修正层级、输出警告清单。
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any


# 页面类型
COVER = "cover"
TOC = "toc"
SECTION = "section"
CONTENT = "content"
THANKS = "thanks"

_TOC_TITLES = {"目录", "大纲", "contents", "目录页"}
_THANKS_TITLES = {"谢谢", "致谢", "thanks", "结束", "谢谢观看", "end"}

_H1_RE = re.compile(r"^#\s+(.+)$")
_H2_RE = re.compile(r"^##\s+(.+)$")
_H3_RE = re.compile(r"^###\s+(.+)$")
_BULLET_RE = re.compile(r"^\s*[-*+]\s+(.+)$")
_ORDERED_RE = re.compile(r"^\s*\d+[.)、]\s*(.+)$")
_NUM_PREFIX_RE = re.compile(r"^(\d+(?:\.\d+)*)\s*[、.\s]?\s*(.*)$")


@dataclass
class Block:
    """正文块：paragraph | bullets | ordered | table"""
    kind: str
    lines: list[str] = field(default_factory=list)
    rows: list[list[str]] = field(default_factory=list)  # for table


@dataclass
class Page:
    page_type: str = CONTENT
    number: str = ""          # 如 "1.1"、"01"
    title: str = ""
    subtitle: str = ""        # 标题下一行说明
    body: list[Block] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)  # 章节标签
    line_no: int = 0


@dataclass
class Deck:
    title: str = ""
    subtitle: str = ""
    period: str = ""
    presenter: str = ""
    department: str = ""
    date: str = ""
    pages: list[Page] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def _parse_frontmatter(text: str) -> tuple[dict, str]:
    """解析可选 YAML frontmatter（--- 包裹的 key: value）。返回 (meta, 剩余文本)。"""
    meta: dict[str, str] = {}
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return meta, text
    end = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end = i
            break
    if end is None:
        return meta, text
    for line in lines[1:end]:
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip().strip('"').strip("'")
    return meta, "\n".join(lines[end + 1:])


def _normalize_title(line: str, kind: str) -> tuple[str, str]:
    """从标题中分离编号。如 '1.1 架构图' → ('1.1', '架构图')。"""
    m = _NUM_PREFIX_RE.match(line.strip())
    if m and m.group(2):
        return m.group(1), m.group(2).strip()
    return "", line.strip()


def _detect_page_type(title: str) -> str:
    t = title.strip().lower()
    if t in _TOC_TITLES:
        return TOC
    if t in _THANKS_TITLES:
        return THANKS
    return CONTENT


def parse(markdown: str) -> Deck:
    """解析 Markdown 大纲为 Deck。"""
    meta, body_text = _parse_frontmatter(markdown)
    deck = Deck(
        title=meta.get("title", ""),
        subtitle=meta.get("subtitle", ""),
        period=meta.get("period", ""),
        presenter=meta.get("presenter", ""),
        department=meta.get("department", ""),
        date=meta.get("date", ""),
    )

    lines = body_text.splitlines()
    current_page: Page | None = None
    current_section_num = 0
    section_counter = 0
    # 表格收集缓冲
    table_buffer: list[str] = []

    def flush_table():
        nonlocal table_buffer
        if table_buffer and current_page is not None:
            rows = _parse_table(table_buffer)
            if rows:
                current_page.body.append(Block(kind="table", rows=rows))
        table_buffer = []

    for idx, raw in enumerate(lines, start=1):
        line = raw.rstrip()
        stripped = line.strip()

        # 空行：结束表格缓冲
        if not stripped:
            flush_table()
            continue

        # 表格行（以 | 开头且含 |）
        if stripped.startswith("|") and stripped.endswith("|"):
            table_buffer.append(stripped)
            continue
        elif table_buffer:
            flush_table()

        # 一级标题 → 章节
        m = _H1_RE.match(stripped)
        if m:
            flush_table()
            section_counter += 1
            num, title = _normalize_title(m.group(1), "h1")
            if not num:
                num = f"{section_counter:02d}"
            current_section_num = section_counter
            current_page = Page(page_type=SECTION, number=num, title=title, line_no=idx)
            deck.pages.append(current_page)
            continue

        # 二级标题 → 内容页 / 特殊页
        m = _H2_RE.match(stripped)
        if m:
            flush_table()
            num, title = _normalize_title(m.group(1), "h2")
            ptype = _detect_page_type(title)
            if ptype == TOC:
                current_page = Page(page_type=TOC, title=title, line_no=idx)
            elif ptype == THANKS:
                current_page = Page(page_type=THANKS, title=title, line_no=idx)
            else:
                current_page = Page(page_type=CONTENT, number=num, title=title, line_no=idx)
            deck.pages.append(current_page)
            continue

        # 三级标题：并入当前页正文（作为段落）
        m = _H3_RE.match(stripped)
        if m:
            if current_page is not None:
                current_page.body.append(Block(kind="paragraph", lines=[m.group(1)]))
            continue

        # 无当前页：跳过并警告
        if current_page is None:
            deck.warnings.append(f"第 {idx} 行：内容「{stripped[:20]}」没有所属页面，已跳过")
            continue

        # 章节页下的列表 → 标签
        if current_page.page_type == SECTION:
            bm = _BULLET_RE.match(stripped)
            if bm:
                current_page.tags.append(bm.group(1).strip())
                continue

        # 目录页下的列表 → 目录条目（作为 bullets）
        if current_page.page_type == TOC:
            bm = _BULLET_RE.match(stripped)
            if bm:
                current_page.body.append(Block(kind="bullets", lines=[bm.group(1).strip()]))
                continue

        # 无序列表
        bm = _BULLET_RE.match(stripped)
        if bm:
            current_page.body.append(Block(kind="bullets", lines=[bm.group(1).strip()]))
            continue

        # 有序列表
        om = _ORDERED_RE.match(stripped)
        if om:
            current_page.body.append(Block(kind="ordered", lines=[om.group(1).strip()]))
            continue

        # 普通段落：若当前页无副标题且为空正文，作为副标题；否则作为段落
        if current_page.subtitle == "" and not current_page.body:
            current_page.subtitle = stripped
        else:
            current_page.body.append(Block(kind="paragraph", lines=[stripped]))

    flush_table()

    # 若 frontmatter 提供了标题，自动在最前补封面页
    if deck.title and not any(p.page_type == COVER for p in deck.pages):
        deck.pages.insert(0, Page(page_type=COVER, title=deck.title, line_no=0))

    # 规范化：清理空页、空块
    _normalize_deck(deck)
    return deck


def _parse_table(lines: list[str]) -> list[list[str]]:
    """解析简单 Markdown 表格（含分隔行）。返回数据行（不含表头分隔行）。"""
    rows: list[list[str]] = []
    for line in lines:
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        # 跳过分隔行（如 --- | ---）
        if all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c):
            continue
        rows.append(cells)
    # 第一行作为表头保留（builder 决定如何使用）
    return rows


def _normalize_deck(deck: Deck) -> None:
    """清理：删除无标题且无正文的空页；删除空块；修正标题编号。"""
    kept: list[Page] = []
    for p in deck.pages:
        if p.page_type == COVER:
            kept.append(p)
            continue
        # 空页（无标题无正文无标签）跳过
        has_content = bool(p.title or p.subtitle or p.body or p.tags)
        if not has_content:
            deck.warnings.append(f"页面「{p.title or p.number or '未命名'}」无内容，已跳过")
            continue
        # 删除空块
        p.body = [b for b in p.body if b.lines or b.rows]
        kept.append(p)
    deck.pages = kept

    # 修正内容页编号：若为空，按章节内顺序补
    sec_num = 0
    sec_idx = 0
    for p in deck.pages:
        if p.page_type == SECTION:
            sec_num += 1
            sec_idx = 0
            continue
        if p.page_type == CONTENT and not p.number:
            sec_idx += 1
            p.number = f"{sec_num}.{sec_idx}" if sec_num else str(sec_idx)
