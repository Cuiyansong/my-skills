"""视觉 QA：把 pptx 渲染成图片，并基于渲染结果做视觉检查。

为什么需要：jbf 的 validate.py 只看 python-pptx 的对象层（页数、空页、shape 越界），
看不到「文字撑出文本框后压到页脚」这类只有渲染后才可见的缺陷。本模块补上这一层。

依赖：
- LibreOffice（soffice）转 PDF
- pymupdf 渲染 PNG 并提取文本 bbox
- Pillow 拼缩略图网格

用法：
    python scripts/qa.py deck.pptx              # 生成 qa/ 目录下的网格图与逐页图
    python scripts/qa.py deck.pptx -o out --cols 4 --dpi 110

退出码：0 无视觉问题；1 发现视觉问题；2 环境错误（缺 soffice / 依赖）
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

# 画布（英寸）——与 template.py 的 slide_width_in / slide_height_in 一致
DEFAULT_SLIDE_W_IN = 13.333
DEFAULT_SLIDE_H_IN = 7.5

# 页脚安全区：正文不得侵入此线以下（英寸），对应 STYLE_GUIDE 的 footer_line top=6.96
FOOTER_LINE_IN = 6.96
FOOTER_TOLERANCE_IN = 0.06   # 容差：允许文字贴线

EDGE_MARGIN_IN = 0.30        # 距画布边缘最小留白
EDGE_TOLERANCE_IN = 0.02


@dataclass
class PageIssue:
    page: int
    kind: str          # 类型：canvas / footer / overlap
    detail: str


@dataclass
class QAReport:
    pdf: Path | None = None
    pages: list[Path] = field(default_factory=list)
    grids: list[Path] = field(default_factory=list)
    issues: list[PageIssue] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.issues


# ---------------------------------------------------------------------------
# 渲染
# ---------------------------------------------------------------------------

def _soffice_bin() -> str | None:
    """定位 soffice 可执行文件。"""
    for name in ("soffice", "libreoffice"):
        found = shutil.which(name)
        if found:
            return found
    # macOS 常见安装位置
    for path in ("/Applications/LibreOffice.app/Contents/MacOS/soffice",):
        if os.path.exists(path):
            return path
    return None


def convert_to_pdf(pptx_path: str | Path, outdir: str | Path | None = None) -> Path:
    """用 LibreOffice 把 pptx 转成 PDF，返回 PDF 路径。

    使用独立的临时 UserInstallation profile，避免与正在运行的 LibreOffice
    实例冲突（否则 soffice 会静默失败或挂起）。
    """
    pptx_path = Path(pptx_path).resolve()
    if not pptx_path.is_file():
        raise FileNotFoundError(f"找不到文件：{pptx_path}")

    soffice = _soffice_bin()
    if soffice is None:
        raise RuntimeError(
            "未找到 LibreOffice（soffice）。视觉 QA 需要它来渲染。\n"
            "  macOS: brew install --cask libreoffice\n"
            "  Ubuntu: sudo apt install libreoffice-impress"
        )

    outdir = Path(outdir) if outdir else Path(tempfile.mkdtemp(prefix="jbf_qa_"))
    outdir.mkdir(parents=True, exist_ok=True)

    profile = Path(tempfile.mkdtemp(prefix="jbf_soffice_profile_"))
    cmd = [
        soffice,
        f"-env:UserInstallation=file://{profile}",
        "--headless",
        "--norestore",
        "--convert-to", "pdf",
        "--outdir", str(outdir),
        str(pptx_path),
    ]
    env = os.environ.copy()
    env["SAL_USE_VCLPLUGIN"] = "svp"   # 无显示环境下的稳定渲染后端
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=180, env=env)
    finally:
        shutil.rmtree(profile, ignore_errors=True)

    pdf_path = outdir / (pptx_path.stem + ".pdf")
    if proc.returncode != 0 or not pdf_path.is_file():
        raise RuntimeError(
            "LibreOffice 转换失败：\n"
            f"exit={proc.returncode}\nstdout={proc.stdout[-400:]}\nstderr={proc.stderr[-400:]}"
        )
    return pdf_path


def render_pages(pdf_path: str | Path, outdir: str | Path, dpi: int = 110) -> list[Path]:
    """把 PDF 每页渲染成 PNG，返回图片路径列表（按页序）。"""
    import pymupdf

    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    pngs: list[Path] = []
    with pymupdf.open(str(pdf_path)) as doc:
        for i, page in enumerate(doc, start=1):
            pix = page.get_pixmap(dpi=dpi)
            p = outdir / f"slide-{i:02d}.png"
            pix.save(str(p))
            pngs.append(p)
    return pngs


def _load_label_font(size: int):
    """尽量加载支持中文的字体；失败则用 Pillow 默认字体。"""
    from PIL import ImageFont

    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "C:/Windows/Fonts/msyh.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    try:
        return ImageFont.load_default(size)
    except Exception:
        return ImageFont.load_default()


def make_grids(
    pngs: list[Path],
    out_prefix: str | Path,
    cols: int = 4,
    thumb_w: int = 640,
    max_per_grid: int = 12,
) -> list[Path]:
    """把逐页 PNG 拼成带页码标签的网格图，超过 max_per_grid 页自动分片。"""
    from PIL import Image, ImageDraw

    if not pngs:
        return []

    cols = max(1, min(cols, 6))
    out_prefix = Path(out_prefix)
    label_h = 26
    pad = 8

    sample = Image.open(pngs[0])
    ratio = thumb_w / sample.width
    thumb_h = int(sample.height * ratio)
    sample.close()

    font = _load_label_font(16)
    outputs: list[Path] = []

    chunks = [pngs[i:i + max_per_grid] for i in range(0, len(pngs), max_per_grid)]
    for ci, chunk in enumerate(chunks, start=1):
        rows = (len(chunk) + cols - 1) // cols
        cell_w = thumb_w + pad * 2
        cell_h = thumb_h + label_h + pad * 2
        canvas = Image.new("RGB", (cell_w * cols, cell_h * rows), "white")
        draw = ImageDraw.Draw(canvas)

        for idx, png in enumerate(chunk):
            r, c = divmod(idx, cols)
            x = c * cell_w + pad
            y = r * cell_h + pad
            label = f"#{int(png.stem.split('-')[-1]):02d}"
            draw.text((x + 2, y + 4), label, fill=(30, 30, 30), font=font)
            with Image.open(png) as im:
                im = im.convert("RGB").resize((thumb_w, thumb_h), Image.LANCZOS)
                canvas.paste(im, (x, y + label_h))
            draw.rectangle(
                [x - 1, y + label_h - 1, x + thumb_w, y + label_h + thumb_h],
                outline=(200, 200, 200),
            )

        suffix = "" if len(chunks) == 1 else f"-{ci}"
        out_path = out_prefix.with_name(out_prefix.name + suffix).with_suffix(".jpg")
        canvas.save(out_path, quality=92)
        outputs.append(out_path)

    return outputs


# ---------------------------------------------------------------------------
# 视觉检查（基于渲染后的 PDF 文本 bbox）
# ---------------------------------------------------------------------------

def check_visual(
    pdf_path: str | Path,
    slide_w_in: float = DEFAULT_SLIDE_W_IN,
    slide_h_in: float = DEFAULT_SLIDE_H_IN,
) -> list[PageIssue]:
    """用渲染结果做视觉检查：文字超出画布 / 压到页脚区。

    这是 validate.py 抓不到的一层——文本框尺寸没变，但文字撑出了框。
    """
    import pymupdf

    issues: list[PageIssue] = []
    with pymupdf.open(str(pdf_path)) as doc:
        for pno, page in enumerate(doc, start=1):
            rect = page.rect
            # PDF 点 → 英寸的换算系数（页面尺寸由 pptx 设定，通常 960x540 pt）
            sx = slide_w_in / rect.width if rect.width else 1.0
            sy = slide_h_in / rect.height if rect.height else 1.0

            footer_limit = FOOTER_LINE_IN - FOOTER_TOLERANCE_IN

            for block in page.get_text("dict").get("blocks", []):
                if block.get("type") != 0:      # 0 = 文本块
                    continue
                for line in block.get("lines", []):
                    text = "".join(
                        s.get("text", "") for s in line.get("spans", [])
                    ).strip()
                    if not text:
                        continue
                    x0, y0, x1, y1 = line["bbox"]
                    left_in = x0 * sx
                    top_in = y0 * sy
                    right_in = x1 * sx
                    bottom_in = y1 * sy

                    # 1) 超出画布
                    if (right_in > slide_w_in + EDGE_TOLERANCE_IN
                            or bottom_in > slide_h_in + EDGE_TOLERANCE_IN):
                        issues.append(PageIssue(
                            pno, "canvas",
                            f'文字超出画布："{text[:24]}" '
                            f'(右={right_in:.2f}\" 下={bottom_in:.2f}\")'))
                        continue

                    # 2) 侵入页脚区（页脚自身文字位于 7.0\" 以下，此处只抓 6.90–7.0 区间的正文）
                    if top_in < footer_limit < bottom_in - FOOTER_TOLERANCE_IN:
                        issues.append(PageIssue(
                            pno, "footer",
                            f'文字压到页脚线："{text[:24]}" '
                            f'(顶={top_in:.2f}\" 底={bottom_in:.2f}\"，页脚线={FOOTER_LINE_IN}\")'))

    return issues


# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------

def run_qa(
    pptx_path: str | Path,
    outdir: str | Path = "qa",
    cols: int = 4,
    dpi: int = 110,
    slide_w_in: float = DEFAULT_SLIDE_W_IN,
    slide_h_in: float = DEFAULT_SLIDE_H_IN,
    keep_pages: bool = True,
) -> QAReport:
    """完整视觉 QA：转 PDF → 渲染逐页图 → 拼网格 → 视觉检查。"""
    pptx_path = Path(pptx_path).resolve()
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    report = QAReport()
    report.pdf = convert_to_pdf(pptx_path, outdir)
    report.pages = render_pages(report.pdf, outdir / "pages", dpi=dpi)
    report.grids = make_grids(report.pages, outdir / "grid", cols=cols)
    report.issues = check_visual(report.pdf, slide_w_in, slide_h_in)

    if not keep_pages:
        for p in report.pages:
            p.unlink(missing_ok=True)

    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="PPT 视觉 QA：渲染为图片并检查视觉缺陷")
    parser.add_argument("input", help="pptx 文件")
    parser.add_argument("-o", "--outdir", default="qa", help="输出目录（默认 qa/）")
    parser.add_argument("--cols", type=int, default=4, help="网格列数（默认 4，最大 6）")
    parser.add_argument("--dpi", type=int, default=110, help="渲染 DPI（默认 110）")
    parser.add_argument("--no-pages", action="store_true", help="不保留逐页 PNG")
    args = parser.parse_args(argv)

    try:
        report = run_qa(args.input, args.outdir, args.cols, args.dpi,
                        keep_pages=not args.no_pages)
    except (FileNotFoundError, RuntimeError) as e:
        print(f"错误：{e}", file=sys.stderr)
        return 2

    print(f"PDF：{report.pdf}")
    print(f"渲染 {len(report.pages)} 页，网格图 {len(report.grids)} 张：")
    for g in report.grids:
        print(f"  {g}")

    if report.issues:
        print(f"\n发现 {len(report.issues)} 处视觉问题：", file=sys.stderr)
        for it in report.issues:
            print(f"  ✗ 第 {it.page} 页 [{it.kind}] {it.detail}", file=sys.stderr)
        return 1

    print("\n✓ 未发现视觉问题（文字未越界、未压页脚）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
