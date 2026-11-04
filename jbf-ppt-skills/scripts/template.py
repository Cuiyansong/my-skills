"""JBF 样式常量与模板加载。

本技能采用「提取样式参数 + 按页面类型重建」策略：
- 模板存在：从 assets/template.pptx 提取画布尺寸等参数；
- 模板缺失/损坏：回退到内置默认样式（与 references/STYLE_GUIDE.md 一致）。

所有颜色/字体/布局常量在此集中定义，供 builder.py 使用。
"""
from __future__ import annotations

import os

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.util import Emu, Pt

# ---------------------------------------------------------------------------
# 内置默认样式（模板缺失时回退）。与 references/STYLE_GUIDE.md 保持一致。
# ---------------------------------------------------------------------------
DEFAULT_STYLE = {
    # 画布（英寸）
    "slide_width_in": 13.333,
    "slide_height_in": 7.5,
    # 颜色
    "primary": "0A308F",          # 主色深蓝：标题竖条/强调
    "primary_dark": "04309A",     # 主色变体
    "light_blue": "EBF2FF",       # 浅蓝底：目录条目/卡片标题
    "lighter_blue": "F8FBFF",     # 更浅蓝底：流程卡片
    "light_gray": "F2F5FA",       # 浅灰底：对比块
    "body_gray": "595959",        # 正文灰
    "white": "FFFFFF",
    "deco_gray_blue": "B1BCDC",   # 结束页分隔线
    "deco_light_blue": "D4E0FC",  # 保留（历史章节页方块底，重建中未使用）
    "dot_blue": "3660DE",         # 章节页圆点
    "purple": "982AC4",           # 封面渐变条首段
    "gradient": ["8FAADC", "5471B8", "2A4FA0", "1C3A80"],  # 封面渐变条
    # 封面文字专用色（深色背景）
    "cover_period": "AFE6FF",      # 封面「规划周期」浅蓝
    "cover_subtitle": "9FB0C6",    # 封面「一句话主旨」浅灰蓝
    "cover_meta": "9FC0E8",        # 封面「汇报人/部门/日期」浅蓝
    # 字体
    "font_name": "微软雅黑",       # 中文默认字体（新模板未显式指定，脚本默认用微软雅黑保证跨平台一致）
    "title_size": 24.0,           # pt
    "subtitle_size": 11.0,
    "footer_size": 8.0,
    "cover_title_size": 40.0,
    # 页脚
    "company": "京北方信息技术股份有限公司",
    "company_en": "NORTHKING",
    "stock_code": "002987",
    # 图片资产（assets/images/ 下的文件名）
    "cover_logo": "ad72833a.png",       # 封面 logo（白色，用于深色封面背景）
    "logo": "221891b6.png",             # 内页 logo（深蓝，用于白底内页）
    "cover_bg": "c323929e.png",         # 封面全页背景
    "toc_bg": "fbce0fac.png",           # 目录左侧背景
    "section_bar": "b84c24e5.png",      # 章节页左侧竖条
    "section_icon": "3e852b8b.png",     # 章节页大图标
    "section_footer": "ab85ec4e.png",   # 章节页底部装饰
}


def _hex(value: str) -> str:
    return value.lstrip("#").upper()


def rgb(hexstr: str) -> RGBColor:
    h = _hex(hexstr)
    return RGBColor(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def inches(value: float) -> Emu:
    from pptx.util import Inches
    return Inches(value)


def pt(value: float) -> Pt:
    return Pt(value)


def resolve_style(template_path: str | None) -> dict:
    """加载模板并提取样式参数；模板缺失/损坏时回退默认。

    返回 DEFAULT_STYLE 的拷贝（可被模板实测值覆盖）。
    """
    style = dict(DEFAULT_STYLE)
    if not template_path or not os.path.exists(template_path):
        return style

    try:
        prs = Presentation(template_path)
    except Exception:
        return style

    # 提取画布尺寸（EMU → 英寸）
    try:
        style["slide_width_in"] = round(prs.slide_width / 914400, 3)
        style["slide_height_in"] = round(prs.slide_height / 914400, 3)
    except Exception:
        pass
    return style


def image_path(assets_dir: str, style: dict, key: str) -> str | None:
    """返回图片资产绝对路径；不存在则返回 None（builder 跳过）。"""
    fname = style.get(key)
    if not fname:
        return None
    p = os.path.join(assets_dir, fname)
    return p if os.path.exists(p) else None


def script_dir() -> str:
    return os.path.dirname(os.path.abspath(__file__))


def skill_root() -> str:
    """技能根目录（jbf-ppt-skills/）。"""
    return os.path.dirname(script_dir())


def default_template_path() -> str:
    return os.path.join(skill_root(), "assets", "template.pptx")


def default_assets_dir() -> str:
    return os.path.join(skill_root(), "assets", "images")
