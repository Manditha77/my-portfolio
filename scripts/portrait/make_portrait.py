"""Turns the source photo into voxel relief data for a pin-art portrait (see README.md).

Offline and one-off: reads docs/portrait-source.jpeg (git-ignored), removes the background with rembg, crops
to the head and upper shoulders (the face filling most of the frame), downsamples to a grid of blocks, gives
each block a depth (mostly from the silhouette's shape, plus a little facial detail) and a shade (its
lightness, with the face's darks strengthened), and thins the shoulders out into scattered cubes towards the
bottom edge. Writes only grids of characters (src/components/three/portrait.json): no pixels and no photo metadata.
Debug images, if asked for, go outside the repo. render_poster.py then draws the static posters from that file.
"""

from __future__ import annotations

import argparse
import gzip
import json
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
# The site's portrait data: committed, and bundled only into the lazy 3D chunk.
DATA = ROOT / "src" / "components" / "three" / "portrait.json"
# Keep the ~170 MB model inside the git-ignored scripts/portrait/.models, not the user's home folder.
os.environ.setdefault("U2NET_HOME", str(HERE / ".models"))

from rembg import new_session, remove  # noqa: E402  (needs U2NET_HOME set first)

DEPTH_LEVELS = 8
SHADE_LEVELS = 16

# A cell is a block when at least this share of it is the subject.
COVERAGE = 0.5

# Crop: the face (hairline to chin) is this share of the frame's height; a little headroom above the hair;
# the frame is this wide for its height, centred on the head.
FACE_SHARE = 0.52
HEADROOM = 0.03
ASPECT = 0.9
# The hairline is the first row that is at least this share skin; the chin sits this far below the neck
# (as a share of hair top to neck), since the beard hides it from a colour test.
SKIN_ROW = 0.25
CHIN_BELOW_NECK = 0.15

# Depth: share from the silhouette's shape versus facial detail (lightness high-pass).
SHAPE_SHARE = 0.88
# Dome radii as shares of the grid width: the body's gentle curve, and the head's rounder one.
BODY_RADIUS = 0.2
HEAD_RADIUS = 0.2
# Blur for the detail high-pass, as a share of the grid width.
DETAIL_SIGMA = 0.05

# Features: a cell's lightness mixes its mean with its local minimum, so thin darks (brows, lash lines, the
# mouth, beard edges) survive downsampling; then an unsharp mask (sigma in cells), and a gamma that deepens
# the darks.
MIN_SHARE = 0.4
SHARPEN = 0.8
SHARPEN_SIGMA = 1.2
DARK_GAMMA = 1.3

# The poster (render_poster.py) frames the grid with this many empty cells on every side, and is this many
# px tall (450 CSS px at 1.5x). The 3D portrait (src/components/three/build-portrait.ts) uses the same frame.
MARGIN = 1
POSTER_HEIGHT = 675

# Dissolve: from just below the chin, blocks thin out towards the bottom edge (the outline first); at the
# bottom row this share is left. A few dropped blocks drift loose, 1–3 cells down and outwards.
DISSOLVE_BELOW_CHIN = 0.03
KEEP_AT_BOTTOM = 0.1
LOOSE_SHARE = 0.1
SEED = 7


def load(path: Path) -> Image.Image:
    """The photo upright, as plain RGB with every bit of metadata dropped."""
    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
    image.info = {}
    return image


def subject_mask(image: Image.Image) -> np.ndarray:
    """True where the person is: rembg's human segmentation, cleaned up to one solid shape."""
    matte = remove(image, session=new_session("u2net_human_seg"), only_mask=True)
    alpha = np.asarray(matte, dtype=np.float32) / 255.0
    mask = ndimage.gaussian_filter(alpha, 1.5) > 0.5
    mask = ndimage.binary_fill_holes(mask)
    labels, count = ndimage.label(mask)
    if count > 1:
        sizes = ndimage.sum(mask, labels, range(1, count + 1))
        mask = labels == (1 + int(np.argmax(sizes)))
    return mask


def landmarks(mask: np.ndarray, rgb: np.ndarray) -> dict[str, float]:
    """Hair top, hairline, neck and chin rows, and the head's centre column, in photo pixels."""
    rows = np.flatnonzero(mask.any(axis=1))
    top, bottom = int(rows[0]), int(rows[-1])
    widths = mask.sum(axis=1)
    # The neck: the narrowest row between the lower face and the shoulders.
    search = slice(top + int(0.12 * (bottom - top)), top + int(0.45 * (bottom - top)))
    neck = search.start + int(np.argmin(widths[search]))
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    skin = mask & (r > g) & (g > b) & (r - b > 0.12) & (r > 0.35)
    share = skin.sum(axis=1) / np.maximum(widths, 1)
    hairline = top + int(np.argmax(share[top:neck] > SKIN_ROW))
    chin = neck + int(CHIN_BELOW_NECK * (neck - top))
    head = np.flatnonzero(mask[top:neck].any(axis=0))
    return {"top": top, "hairline": hairline, "neck": neck, "chin": chin, "centre": (head[0] + head[-1]) / 2}


def crop_box(shape: tuple[int, int], marks: dict[str, float]) -> tuple[int, int, int, int]:
    """Head and upper shoulders, sized so the face is FACE_SHARE of the height."""
    height = (marks["chin"] - marks["hairline"]) / FACE_SHARE
    y0 = max(0, int(marks["top"] - HEADROOM * height))
    y1 = min(shape[0], int(y0 + height))
    width = min(shape[1], int(ASPECT * (y1 - y0)))
    x0 = int(np.clip(marks["centre"] - width / 2, 0, shape[1] - width))
    return x0, y0, x0 + width, y1


def srgb_to_linear(rgb: np.ndarray) -> np.ndarray:
    return np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)


def lightness_of(linear: np.ndarray) -> np.ndarray:
    """CIE L* (0..1) per pixel."""
    y = linear @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    return np.where(y > 0.008856, 1.16 * np.cbrt(y) - 0.16, 9.033 * y)


def box_resize(channel: np.ndarray, cols: int, rows: int) -> np.ndarray:
    """Area-average a float image down to cols × rows."""
    return np.asarray(Image.fromarray(channel.astype(np.float32), "F").resize((cols, rows), Image.BOX))


def rows_for(mask: np.ndarray, cols: int) -> int:
    return max(1, round(cols * mask.shape[0] / mask.shape[1]))


def coverage_of(mask: np.ndarray, cols: int) -> np.ndarray:
    return box_resize(mask.astype(np.float32), cols, rows_for(mask, cols))


def dissolve(blocks: np.ndarray, start: int, seed: int) -> tuple[np.ndarray, np.ndarray, dict]:
    """Thins the blocks below row `start` towards the bottom edge (the outline first) and lets a few of the
    dropped ones drift loose. Returns the kept blocks, the loose ones, and where each loose one came from."""
    rng = np.random.default_rng(seed)
    rows, cols = blocks.shape
    depth_in = np.clip(ndimage.distance_transform_edt(blocks) / 3, 0, 1)
    t = np.clip((np.arange(rows)[:, None] - start) / max(rows - 1 - start, 1), 0, 1)
    keep = 1 - (1 - KEEP_AT_BOTTOM) * t**1.8
    keep = np.where(t > 0, keep * (0.6 + 0.4 * depth_in), 1)
    kept = blocks & (rng.random(blocks.shape) < keep)

    loose = np.zeros_like(blocks)
    source: dict[tuple[int, int], tuple[int, int]] = {}
    middle = cols / 2
    for r, c in np.argwhere(blocks & ~kept):
        if rng.random() >= LOOSE_SHARE:
            continue
        nr = r + int(rng.integers(1, 4))
        nc = c + int(np.sign(c - middle)) * int(rng.integers(0, 3))
        if nr < rows and 0 <= nc < cols and not kept[nr, nc] and not loose[nr, nc]:
            loose[nr, nc] = True
            source[(nr, nc)] = (int(r), int(c))
    return kept, loose, source


def build(linear: np.ndarray, lightness: np.ndarray, mask: np.ndarray, cols: int, chin_share: float):
    """The block grid for `cols` columns: blocks before the dissolve, kept and loose ones, and the start row."""
    coverage = coverage_of(mask, cols)
    blocks = coverage >= COVERAGE
    start = round((chin_share + DISSOLVE_BELOW_CHIN) * blocks.shape[0])
    kept, loose, source = dissolve(blocks, start, SEED + cols)
    return coverage, blocks, kept, loose, source, start


def fit_columns(linear, lightness, mask, chin_share: float, target: int) -> int:
    """The grid width whose final block count (after the dissolve) is nearest `target`."""
    count = lambda c: int(sum(m.sum() for m in build(linear, lightness, mask, c, chin_share)[2:4]))  # noqa: E731
    low, high = 8, 400
    while high - low > 1:
        middle = (low + high) // 2
        if count(middle) < target:
            low = middle
        else:
            high = middle
    return min(range(max(8, low - 2), high + 3), key=lambda c: abs(count(c) - target))


def cell_lightness(lightness: np.ndarray, mask: np.ndarray, coverage: np.ndarray, cols: int) -> np.ndarray:
    """Per-cell lightness from the subject's pixels only: the mean mixed with the local minimum."""
    rows = coverage.shape[0]
    cell = mask.shape[1] / cols
    subject = np.where(mask, lightness, 1.0)  # the background never darkens an edge cell
    local_min = ndimage.minimum_filter(subject, size=max(1, int(cell * 0.6)))
    mean = box_resize(lightness * mask, cols, rows) / np.maximum(coverage, 1e-6)
    low = box_resize(local_min * mask, cols, rows) / np.maximum(coverage, 1e-6)
    return (1 - MIN_SHARE) * mean + MIN_SHARE * low


def levels(values: np.ndarray, where: np.ndarray, count: int, low=2.0, high=98.0, gamma=1.0) -> np.ndarray:
    """Percentile-stretch `values` inside `where`, apply `gamma`, and quantise to 0..count-1."""
    lo, hi = np.percentile(values[where], [low, high])
    stretched = np.clip((values - lo) / max(hi - lo, 1e-6), 0, 1) ** gamma
    return np.minimum(count - 1, np.floor(stretched * count)).astype(int)


def relief(light: np.ndarray, blocks: np.ndarray, chin_row: int, hairline_row: int):
    """Depth and shade levels per cell (over the blocks before the dissolve, so it doesn't dent the shape)."""
    cols = blocks.shape[1]
    body = np.sqrt(np.clip(ndimage.distance_transform_edt(blocks) / (BODY_RADIUS * cols), 0, 1))
    head_cells = blocks.copy()
    head_cells[chin_row:] = False
    head = np.sqrt(np.clip(ndimage.distance_transform_edt(head_cells) / (HEAD_RADIUS * cols), 0, 1))
    shape = np.maximum(0.62 * body, 0.38 + 0.62 * head * head_cells)

    filled = np.where(blocks, light, light[blocks].mean())
    detail = filled - ndimage.gaussian_filter(filled, DETAIL_SIGMA * cols)
    spread = detail[blocks].std() or 1.0
    detail = 0.5 + 0.25 * np.clip(detail / spread, -2, 2)
    depth = levels(SHAPE_SHARE * shape + (1 - SHAPE_SHARE) * detail, blocks, DEPTH_LEVELS, 1, 99.5)

    # Shade: sharpen, then stretch over the face (hairline to chin) so its tones get the most levels and
    # the darks deepen; the white shirt clips to the lightest level and the hair to the darkest.
    sharp = filled + SHARPEN * (filled - ndimage.gaussian_filter(filled, SHARPEN_SIGMA))
    face = blocks.copy()
    face[:hairline_row] = False
    face[chin_row:] = False
    shade = levels(sharp, face, SHADE_LEVELS, 1, 99, DARK_GAMMA)
    return depth, shade


def encode(values: np.ndarray, present: np.ndarray) -> list[str]:
    """One string per row: a hex digit per block, a space per empty cell."""
    return ["".join(f"{v:x}" if p else " " for v, p in zip(row_values, row_present)).rstrip()
            for row_values, row_present in zip(values, present)]


def save_debug(folder: Path, name: str, array: np.ndarray, scale: int = 1) -> None:
    image = Image.fromarray(np.clip(array * 255, 0, 255).astype(np.uint8))
    if scale > 1:
        image = image.resize((image.width * scale, image.height * scale), Image.NEAREST)
    image.save(folder / name)  # PNG with no metadata chunks


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--src", type=Path, default=ROOT / "docs" / "portrait-source.jpeg")
    parser.add_argument("--targets", type=int, nargs="+", default=[3000])
    parser.add_argument("--out", type=Path, help="write portrait-<blocks>.json here (e.g. scripts/portrait/out) "
                        "instead of the site's data file; for trying other targets")
    parser.add_argument("--debug-dir", type=Path, help="mask, crop and grid previews (keep outside the repo)")
    args = parser.parse_args()

    image = load(args.src)
    rgb_full = np.asarray(image, dtype=np.float32) / 255.0
    mask_full = subject_mask(image)
    marks = landmarks(mask_full, rgb_full)
    x0, y0, x1, y1 = crop_box(mask_full.shape, marks)
    rgb = rgb_full[y0:y1, x0:x1]
    mask = mask_full[y0:y1, x0:x1]
    linear = srgb_to_linear(rgb)
    lightness = lightness_of(linear)
    height = y1 - y0
    chin_share = (marks["chin"] - y0) / height
    hairline_share = (marks["hairline"] - y0) / height
    print(
        f"crop x {x0}..{x1}, y {y0}..{y1}; face (hairline to chin) {(marks['chin'] - marks['hairline']) / height:.0%}"
        f" of the height; hairline at {hairline_share:.2f}, chin at {chin_share:.2f}"
    )
    if args.debug_dir:
        args.debug_dir.mkdir(parents=True, exist_ok=True)
        save_debug(args.debug_dir, "crop-mask.png", rgb * (0.35 + 0.65 * mask[..., None]))

    if args.out is None and len(args.targets) != 1:
        parser.error("the site's data file takes one target; use --out for several")
    if args.out:
        args.out.mkdir(parents=True, exist_ok=True)
    for target in args.targets:
        cols = fit_columns(linear, lightness, mask, chin_share, target)
        coverage, blocks, kept, loose, source, start = build(linear, lightness, mask, cols, chin_share)
        rows = blocks.shape[0]
        light = cell_lightness(lightness, mask, coverage, cols)
        depth, shade = relief(light, blocks, round(chin_share * rows), round(hairline_share * rows))
        # Loose blocks keep the depth and shade of the cell they drifted from.
        for (r, c), (sr, sc) in source.items():
            depth[r, c], shade[r, c] = depth[sr, sc], shade[sr, sc]
        present = kept | loose
        data = {
            "cols": cols,
            "rows": rows,
            "depthLevels": DEPTH_LEVELS,
            "shadeLevels": SHADE_LEVELS,
            "blocks": int(present.sum()),
            "dissolveFrom": int(start),
            "depth": encode(depth, present),
            "shade": encode(shade, present),
            "loose": [[int(c), int(r)] for r, c in sorted(source)],
            "margin": MARGIN,
            "posterHeight": POSTER_HEIGHT,
        }
        text = json.dumps(data, separators=(",", ":"))
        path = args.out / f"portrait-{target}.json" if args.out else DATA
        path.write_text(text, encoding="ascii")
        packed = len(gzip.compress(text.encode("ascii"), 9))
        print(f"{path.name}: {data['blocks']} blocks ({len(source)} loose), {cols}x{rows} grid, "
              f"{len(text)} B raw, {packed} B gzip")
        if args.debug_dir:
            save_debug(args.debug_dir, f"grid-{target}-shade.png", np.where(present, shade / (SHADE_LEVELS - 1), 0.25), 8)


if __name__ == "__main__":
    main()
