"""幻灯片构建：按页面类型将 Deck 渲染为 pptx。

依赖 template.py 的样式常量与图片资产。采用「提取样式参数 + 按页面类型重建」
策略，从空白画布构建，复用模板提取出的颜色/字体/图片。

页面类型：
- cover    封面
- toc      目录
- section  章节页
- content  内容页（bullets / ordered / paragraphs / table）
- thanks   结束页
"""
from __future__ import annotations

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.util import Inches, Pt

from outline import (
    Block, Deck, Page,
    COVER, TOC, SECTION, CONTENT, THANKS,
)
from template import rgb, inches, pt, image_path


# ---------------------------------------------------------------------------
# 布局常量（英寸，相对画布左上角）
# ---------------------------------------------------------------------------
LAYOUT = {
    "logo": (11.25, 0.13, 1.4, 0.44),      # 内页深蓝 logo（右边缘 12.65）
    "cover_logo": (11.25, 0.48, 1.4, 0.44), # 封面白色 logo（位置略低）
    "stock": (10.10, 0.58, 2.55, 0.23),      # 右边缘 12.65，与 logo 对齐
    "cover_stock": (10.10, 0.98, 2.55, 0.22),  # 封面股票代码（右对齐）
    "cover_company": (8.65, 0.11, 4.4, 0.32),  # 封面顶部公司名
    "title_bar": (0.62, 1.02, 0.09, 0.5),
    "title_text": (0.91, 0.99, 9.9, 0.56),
    "subtitle": (0.91, 1.53, 11.3, 0.32),
    "body_area": (0.62, 2.06, 12.09, 4.3),
    "footer_line": (0.62, 6.96, 12.09, 0.0),
    "footer_text": (0.67, 7.02, 9.1, 0.23),
    "page_num": (11.96, 7.0, 0.7, 0.25),
}


def _add_textbox(slide, left, top, width, height, lines, *,
                 size=11.0, color="595959", bold=False, align=PP_ALIGN.LEFT,
                 font_name="微软雅黑", anchor=MSO_ANCHOR.TOP, line_spacing=None):
    """添加文本框。lines 为字符串列表（多段）。"""
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = 0
    tf.margin_right = 0
    tf.margin_top = 0
    tf.margin_bottom = 0

    for i, text in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        if line_spacing is not None:
            p.line_spacing = line_spacing
        run = p.add_run()
        run.text = text
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.name = font_name
        run.font.color.rgb = rgb(color)
    return box


def _add_rect(slide, left, top, width, height, fill_hex, line_hex=None):
    """添加矩形（可用作色块或细线）。"""
    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    shape.fill.solid()
    shape.fill.fore_color.rgb = rgb(fill_hex)
    if line_hex:
        shape.line.color.rgb = rgb(line_hex)
        shape.line.width = Pt(0.75)
    else:
        shape.line.fill.background()
    shape.shadow.inherit = False
    return shape


def _add_picture(slide, path, left, top, width, height):
    """添加图片；path 为 None 时跳过。"""
    if not path:
        return None
    try:
        return slide.shapes.add_picture(path, Inches(left), Inches(top),
                                        Inches(width), Inches(height))
    except Exception:
        return None


def _add_header(slide, style, page_num=None, company_suffix=None):
    """添加通用页眉：右上 logo + 股票代码；可选页脚 + 页码。"""
    assets = style["_assets"]
    _add_picture(slide, image_path(assets, style, "logo"), *LAYOUT["logo"])
    _add_textbox(slide, *LAYOUT["stock"], [f"股票代码：{style['stock_code']}"],
                 size=8.0, color="595959", align=PP_ALIGN.RIGHT)

    if company_suffix:
        _add_rect(slide, *LAYOUT["footer_line"], style["primary"])
        footer_text = f"{style['company']} · {company_suffix}"
        _add_textbox(slide, *LAYOUT["footer_text"], [footer_text],
                     size=style["footer_size"], color="595959")
    if page_num:
        _add_textbox(slide, *LAYOUT["page_num"], [f"{page_num:02d}"],
                     size=style["footer_size"], color="595959", align=PP_ALIGN.RIGHT)


# ---------------------------------------------------------------------------
# 页面构建函数
# ---------------------------------------------------------------------------

def build_cover(prs, slide, style, deck: Deck):
    assets = style["_assets"]
    W, H = style["slide_width_in"], style["slide_height_in"]
    # 全页背景
    bg = image_path(assets, style, "cover_bg")
    if bg:
        _add_picture(slide, bg, 0, 0, W, H)
    else:
        _add_rect(slide, 0, 0, W, H, style["white"])

    # 顶部公司名 + 白色 logo + 股票代码（封面位置略低）
    _add_textbox(slide, *LAYOUT["cover_company"], [style["company"]],
                 size=11.0, color="FFFFFF", align=PP_ALIGN.RIGHT)
    _add_picture(slide, image_path(assets, style, "cover_logo"), *LAYOUT["cover_logo"])
    _add_textbox(slide, *LAYOUT["cover_stock"], [f"股票代码：{style['stock_code']}"],
                 size=8.0, color="FFFFFF", align=PP_ALIGN.RIGHT)

    # 主标题（白色，模板封面文字为白）
    title = deck.title or "汇报主题"
    _add_textbox(slide, 0.85, 2.25, 11.4, 1.07, [title],
                 size=style["cover_title_size"], color="FFFFFF", bold=True)

    # 渐变条（紫 + 蓝序列）
    grad = [style["purple"]] + list(style["gradient"])
    x = 0.85
    for c in grad:
        _add_rect(slide, x, 3.52, 0.7, 0.05, c)
        x += 0.68

    # 周期（浅蓝，封面专用色）
    _add_textbox(slide, 0.9, 3.8, 10.9, 0.49, [deck.period or "规划周期"],
                 size=14.0, color=style["cover_period"])
    # 一句话主旨（浅灰蓝，封面专用色）
    _add_textbox(slide, 0.9, 4.41, 7.9, 0.34, [deck.subtitle or "（此处补充一句话主旨）"],
                 size=11.0, color=style["cover_subtitle"])

    # 底部三栏：汇报人 / 部门 / 日期（浅蓝 9FC0E8，模板色）
    for i, (label, value) in enumerate([
        ("汇报人", deck.presenter), ("部门", deck.department), ("日期", deck.date),
    ]):
        lx = 0.9 + i * 2.75
        _add_textbox(slide, lx, 6.09, 1.95, 0.28, [value or label],
                     size=11.0, color=style["cover_meta"])
        _add_rect(slide, lx - 0.05, 6.52, 2.05, 0.0, style["primary"])


def build_toc(slide, style, page: Page, page_num: int):
    assets = style["_assets"]
    # 左侧背景
    _add_picture(slide, image_path(assets, style, "toc_bg"), 0, 0, 4.35, 6.86)
    _add_textbox(slide, 0.75, 2.66, 3.2, 0.92, ["目  录"],
                 size=36.0, color="FFFFFF", bold=True)
    _add_textbox(slide, 0.75, 3.58, 3.2, 0.42, ["CONTENTS"],
                 size=14.0, color="FFFFFF")

    # 右侧目录条目
    entries = [b.lines[0] for b in page.body if b.kind == "bullets" and b.lines]
    # 若无条目，用章节标题兜底
    top = 1.42
    for i, entry in enumerate(entries):
        num, title = _split_entry(entry)
        y = top + i * 1.17
        _add_rect(slide, 5.15, y, 7.56, 0.72, style["light_blue"])
        _add_rect(slide, 5.15, y, 0.09, 0.72, style["primary"])
        _add_textbox(slide, 5.47, y + 0.14, 0.6, 0.43, [num or f"{i+1:02d}"],
                     size=16.0, color=style["primary"], bold=True)
        _add_textbox(slide, 6.15, y + 0.13, 5.5, 0.46, [title],
                     size=16.0, color=style["primary_dark"], bold=True)

    _add_header(slide, style, page_num=page_num)


def _split_entry(entry: str) -> tuple[str, str]:
    """'01 产品规划' 或 '产品规划' → (编号, 标题)。"""
    import re
    m = re.match(r"^(\d+)\s*[、.\s]?\s*(.*)$", entry.strip())
    if m and m.group(2):
        return m.group(1), m.group(2).strip()
    return "", entry.strip()


def build_section(slide, style, page: Page, page_num: int):
    assets = style["_assets"]
    # 白底
    _add_rect(slide, 0, 0, style["slide_width_in"], style["slide_height_in"], style["white"])
    _add_picture(slide, image_path(assets, style, "logo"), *LAYOUT["logo"])
    _add_textbox(slide, *LAYOUT["stock"], [f"股票代码：{style['stock_code']}"],
                 size=8.0, color="595959", align=PP_ALIGN.RIGHT)
    # 左侧竖条
    _add_picture(slide, image_path(assets, style, "section_bar"), 0, 0, 0.46, 7.5)
    # 大图标（不套框，直接放大居中展示）
    _add_picture(slide, image_path(assets, style, "section_icon"), 1.52, 1.6, 3.2, 3.2)
    # 圆点
    for dy in (0.0, 0.62, 1.24):
        _add_rect(slide, 0.92, 1.0 + dy, 0.14, 0.14, style["dot_blue"])

    # 章节编号 + 名称
    _add_textbox(slide, 5.6, 1.81, 1.7, 0.86, [page.number or "01"],
                 size=40.0, color=style["primary_dark"], bold=True)
    _add_textbox(slide, 5.6, 2.67, 7.0, 0.73, [page.title],
                 size=28.0, color=style["primary_dark"], bold=True)
    _add_rect(slide, 5.57, 3.48, 3.2, 0.05, style["deco_gray_blue"])

    # 标签胶囊
    for i, tag in enumerate(page.tags[:3]):
        x = 5.57 + i * 2.24
        _add_rect(slide, x, 4.3, 2.06, 0.46, style["light_blue"])
        _add_textbox(slide, x + 0.05, 4.38, 1.96, 0.29, [tag],
                     size=11.0, color=style["primary_dark"], align=PP_ALIGN.CENTER)

    # 底部装饰 + 页脚
    _add_picture(slide, image_path(assets, style, "section_footer"), 0, 5.92, 13.33, 0.98)
    footer = f"{style['company']} · {page.title}"
    _add_rect(slide, *LAYOUT["footer_line"], style["primary"])
    _add_textbox(slide, *LAYOUT["footer_text"], [footer],
                 size=style["footer_size"], color="595959")
    _add_textbox(slide, *LAYOUT["page_num"], [f"{page_num:02d}"],
                 size=style["footer_size"], color="595959", align=PP_ALIGN.RIGHT)


def build_content(slide, style, page: Page, page_num: int, deck_title: str):
    # 右上 logo + 股票代码
    assets = style["_assets"]
    _add_picture(slide, image_path(assets, style, "logo"), *LAYOUT["logo"])
    _add_textbox(slide, *LAYOUT["stock"], [f"股票代码：{style['stock_code']}"],
                 size=8.0, color="595959", align=PP_ALIGN.RIGHT)

    # 标题竖条 + 标题
    _add_rect(slide, *LAYOUT["title_bar"], style["primary"])
    title_text = f"{page.number}　{page.title}" if page.number else page.title
    _add_textbox(slide, *LAYOUT["title_text"], [title_text],
                 size=style["title_size"], color=style["primary_dark"], bold=True)
    # 副标题
    if page.subtitle:
        _add_textbox(slide, *LAYOUT["subtitle"], [page.subtitle],
                     size=style["subtitle_size"], color=style["body_gray"])

    # 正文
    _build_body(slide, style, page.body)

    # 页脚 + 页码
    _add_rect(slide, *LAYOUT["footer_line"], style["primary"])
    footer = f"{style['company']} · {deck_title}" if deck_title else style["company"]
    _add_textbox(slide, *LAYOUT["footer_text"], [footer],
                 size=style["footer_size"], color="595959")
    _add_textbox(slide, *LAYOUT["page_num"], [f"{page_num:02d}"],
                 size=style["footer_size"], color="595959", align=PP_ALIGN.RIGHT)


def _build_body(slide, style, body: list[Block]):
    """在正文区渲染各块。"""
    top = 2.06
    left = 0.62
    width = 12.09
    usable_h = 4.6  # 到页脚前

    for block in body:
        if not block.lines and not block.rows:
            continue
        if top > 6.5:
            break
        if block.kind == "bullets":
            h = _build_bullets(slide, style, block.lines, left, top, width)
            top += h + 0.15
        elif block.kind == "ordered":
            h = _build_ordered(slide, style, block.lines, left, top, width)
            top += h + 0.15
        elif block.kind == "paragraph":
            h = _build_paragraphs(slide, style, block.lines, left, top, width)
            top += h + 0.1
        elif block.kind == "table":
            h = _build_table(slide, style, block.rows, left, top, width)
            top += h + 0.2


def _estimate_lines(text: str, width_in: float, size: float) -> int:
    """粗略估算换行数（中文约 2*宽度/字号 每字符）。"""
    chars_per_line = max(10, int(width_in * 96 / (size * 1.6)))
    import math
    return max(1, math.ceil(len(text) / chars_per_line))


def _build_bullets(slide, style, lines, left, top, width):
    size = style["subtitle_size"] + 2  # 13pt
    n = len(lines)
    total_lines = sum(_estimate_lines(t, width - 0.4, size) for t in lines)
    line_h = size * 1.45 / 72  # 英寸
    # 若过高则缩小字号
    if total_lines * line_h > 4.0:
        size = max(9.0, size - 2)
        line_h = size * 1.45 / 72
        total_lines = sum(_estimate_lines(t, width - 0.4, size) for t in lines)

    texts = ["• " + t for t in lines]
    box = slide.shapes.add_textbox(Inches(left + 0.25), Inches(top),
                                   Inches(width - 0.4), Inches(4.4))
    tf = box.text_frame
    tf.word_wrap = True
    for i, t in enumerate(texts):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(6)
        run = p.add_run()
        run.text = t
        run.font.size = Pt(size)
        run.font.name = style["font_name"]
        run.font.color.rgb = rgb(style["body_gray"])
    return min(4.4, total_lines * line_h + n * 6 / 72)


def _build_ordered(slide, style, lines, left, top, width):
    size = style["subtitle_size"] + 2
    n = len(lines)
    # 步骤条：横排卡片
    if n <= 5:
        card_w = (width - 0.2 * (n - 1)) / n
        for i, t in enumerate(lines):
            x = left + i * (card_w + 0.2)
            _add_rect(slide, x, top, card_w, 0.92, style["lighter_blue"])
            _add_textbox(slide, x + 0.1, top + 0.1, card_w - 0.2, 0.3,
                         [f"{i + 1}"], size=11.0, color=style["primary"], bold=True)
            _add_textbox(slide, x + 0.1, top + 0.42, card_w - 0.2, 0.45,
                         [t], size=10.0, color=style["body_gray"])
            if i < n - 1:
                _add_textbox(slide, x + card_w, top + 0.25, 0.2, 0.3, ["→"],
                             size=12.0, color=style["primary"], align=PP_ALIGN.CENTER)
        return 1.0
    # 多于 5 条：竖排编号列表
    texts = [f"{i+1}. {t}" for i, t in enumerate(lines)]
    box = slide.shapes.add_textbox(Inches(left + 0.25), Inches(top),
                                   Inches(width - 0.4), Inches(4.4))
    tf = box.text_frame
    tf.word_wrap = True
    for i, t in enumerate(texts):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(6)
        run = p.add_run()
        run.text = t
        run.font.size = Pt(size)
        run.font.name = style["font_name"]
        run.font.color.rgb = rgb(style["body_gray"])
    return min(4.4, n * 0.4)


def _build_paragraphs(slide, style, lines, left, top, width):
    size = style["subtitle_size"]
    box = slide.shapes.add_textbox(Inches(left + 0.25), Inches(top),
                                   Inches(width - 0.4), Inches(0.6))
    tf = box.text_frame
    tf.word_wrap = True
    for i, t in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        run = p.add_run()
        run.text = t
        run.font.size = Pt(size)
        run.font.name = style["font_name"]
        run.font.color.rgb = rgb(style["body_gray"])
    return 0.5


def _build_table(slide, style, rows, left, top, width):
    if not rows:
        return 0.0
    n_cols = max(len(r) for r in rows)
    n_rows = len(rows)
    from pptx.util import Inches as _In
    tbl_shape = slide.shapes.add_table(n_rows, n_cols, _In(left + 0.25), _In(top),
                                       _In(width - 0.4), _In(0.4 * n_rows))
    table = tbl_shape.table
    col_w = (width - 0.4) / max(1, n_cols)
    for c in range(n_cols):
        table.columns[c].width = _In(col_w)
    for r_i, row in enumerate(rows):
        for c_i in range(n_cols):
            cell = table.cell(r_i, c_i)
            cell.text = row[c_i] if c_i < len(row) else ""
            # 垂直居中，消除表头/内容文字上下错位
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            cell.margin_top = 0
            cell.margin_bottom = 0
            for p in cell.text_frame.paragraphs:
                for run in p.runs:
                    run.font.size = Pt(10.0)
                    run.font.name = style["font_name"]
                    run.font.color.rgb = rgb(style["body_gray"])
                    if r_i == 0:
                        run.font.bold = True
                        run.font.color.rgb = rgb(style["primary_dark"])
    return 0.4 * n_rows


def build_thanks(slide, style, deck_title: str, page_num: int):
    assets = style["_assets"]
    _add_rect(slide, 0, 0, style["slide_width_in"], style["slide_height_in"], style["white"])
    _add_picture(slide, image_path(assets, style, "logo"), *LAYOUT["logo"])
    _add_textbox(slide, *LAYOUT["stock"], [f"股票代码：{style['stock_code']}"],
                 size=8.0, color="595959", align=PP_ALIGN.RIGHT)
    # THANKS 大字
    _add_textbox(slide, 0.05, 2.24, 13.23, 1.27, ["THANKS"],
                 size=54.0, color=style["primary_dark"], bold=True, align=PP_ALIGN.CENTER)
    _add_textbox(slide, 0.05, 3.72, 13.23, 0.61, ["谢谢观看"],
                 size=28.0, color=style["primary_dark"], bold=True, align=PP_ALIGN.CENTER)
    # 项目名 · 周期
    period_line = f"{deck_title} · {style['_period']}" if style.get('_period') else deck_title
    _add_textbox(slide, 0.05, 4.41, 13.23, 0.34, [period_line],
                 size=14.0, color=style["body_gray"], align=PP_ALIGN.CENTER)
    # 分隔线
    _add_rect(slide, 5.97, 4.96, 1.4, 0.04, style["deco_gray_blue"])
    # 公司名 · 英文名
    _add_textbox(slide, 0.05, 5.2, 13.23, 0.34,
                 [f"{style['company']} · {style['company_en']}"],
                 size=12.0, color=style["body_gray"], align=PP_ALIGN.CENTER)
    # 页脚
    footer = f"{style['company']} · {deck_title}" if deck_title else style["company"]
    _add_rect(slide, *LAYOUT["footer_line"], style["primary"])
    _add_textbox(slide, *LAYOUT["footer_text"], [footer],
                 size=style["footer_size"], color="595959")
    _add_textbox(slide, *LAYOUT["page_num"], [f"{page_num:02d}"],
                 size=style["footer_size"], color="595959", align=PP_ALIGN.RIGHT)


# ---------------------------------------------------------------------------
# 主入口
# ---------------------------------------------------------------------------

def build(deck: Deck, style: dict, out_path: str) -> list[str]:
    """将 Deck 渲染为 pptx 并保存。返回警告列表。"""
    prs = Presentation()
    prs.slide_width = Inches(style["slide_width_in"])
    prs.slide_height = Inches(style["slide_height_in"])

    # 使用空白版式
    blank_layout = prs.slide_layouts[6] if len(prs.slide_layouts) > 6 else prs.slide_layouts[0]

    warnings: list[str] = []
    page_num = 0
    deck_title = deck.title

    for page in deck.pages:
        slide = prs.slides.add_slide(blank_layout)
        page_num += 1

        if page.page_type == COVER:
            build_cover(prs, slide, style, deck)
        elif page.page_type == TOC:
            build_toc(slide, style, page, page_num)
        elif page.page_type == SECTION:
            build_section(slide, style, page, page_num)
        elif page.page_type == THANKS:
            style["_period"] = deck.period
            build_thanks(slide, style, deck_title, page_num)
        else:  # CONTENT
            build_content(slide, style, page, page_num, deck_title)

    prs.save(out_path)
    return warnings
