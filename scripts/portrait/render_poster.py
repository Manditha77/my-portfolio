"""Draws the hero's static portrait posters from the portrait data (see README.md).

Offline and one-off: reads src/components/three/portrait.json (made by make_portrait.py; the photo isn't
needed here) and the --accent and --surface tokens from src/app/globals.css, and writes a dark and a light
poster as AVIF and WebP to public/images/hero/. It draws exactly what the 3D portrait shows at rest (an
orthographic front view): the same block layout as src/components/three/build-portrait.ts and the same
shading as src/components/three/build-material.ts, so the canvas can take the poster's place without a
visible change. Keep the three in step.
"""

from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
DATA = ROOT / "src" / "components" / "three" / "portrait.json"
TOKENS = ROOT / "src" / "app" / "globals.css"
OUT = ROOT / "public" / "images" / "hero"

# Drawn this many times larger, then box-filtered down: the antialiasing.
SUPERSAMPLE = 3

# As build-portrait.ts.
DEPTH_STEP = 0.75
FILL = 0.9

# As build-material.ts.
LIGHT_DIR = np.array([0.3, 0.8, 0.5]) / np.linalg.norm([0.3, 0.8, 0.5])

THEMES = {"dark": r":root\s*\{", "light": r':root\[data-theme="light"\]\s*\{'}


def tokens(theme: str) -> dict[str, np.ndarray]:
    """--accent and --surface for `theme`, as linear RGB (three.js Color.setStyle does the same)."""
    css = TOKENS.read_text(encoding="utf-8")
    start = re.search(THEMES[theme], css)
    if not start:
        raise SystemExit(f"no {theme} token block in {TOKENS}")
    block = css[start.end() : css.index("}", start.end())]
    out = {}
    for name in ("accent", "surface"):
        value = re.search(rf"--{name}:\s*#([0-9a-fA-F]{{6}})", block).group(1)
        srgb = np.array([int(value[i : i + 2], 16) / 255 for i in (0, 2, 4)])
        out[name] = np.where(srgb <= 0.04045, srgb / 12.92, ((srgb + 0.055) / 1.055) ** 2.4)
    return out


def to_srgb(linear: np.ndarray) -> np.ndarray:
    linear = np.clip(linear, 0, 1)
    return np.where(linear <= 0.0031308, linear * 12.92, 1.055 * linear ** (1 / 2.4) - 0.055)


def hash01(c: int, r: int, k: int) -> float:
    """build-portrait.ts's hash: a repeatable 0..1 value per cell and channel."""
    x = math.sin(c * 127.1 + r * 311.7 + k * 74.7) * 43758.5453
    return x - math.floor(x)


def rotation(x: float, y: float) -> np.ndarray:
    """three.js Euler(x, y, 0, "XYZ") as a matrix: Rx @ Ry."""
    cx, sx, cy, sy = math.cos(x), math.sin(x), math.cos(y), math.sin(y)
    rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    return rx @ ry


def blocks(data: dict):
    """Every block as (centre, rotation, half-size, shade 0..1), in cells around the portrait's centre."""
    cols, rows, dissolve = data["cols"], data["rows"], data["dissolveFrom"]
    loose = {(c, r) for c, r in data["loose"]}
    for r, row in enumerate(data["depth"]):
        for c, char in enumerate(row):
            if char == " ":
                continue
            length = (int(char, 16) + 1) * DEPTH_STEP
            t = max(0.0, (r - dissolve) / max(1, rows - dissolve))
            drift = 1.6 if (c, r) in loose else t
            centre = np.array([
                c - cols / 2 + 0.5 + (hash01(c, r, 1) - 0.5) * 0.5 * drift,
                rows / 2 - r - 0.5 + (hash01(c, r, 2) - 0.5) * 0.4 * drift - 0.25 * drift,
                length / 2 + hash01(c, r, 3) * 2 * drift,
            ])
            turn = rotation((hash01(c, r, 4) - 0.5) * 0.7 * drift, (hash01(c, r, 5) - 0.5) * 0.7 * drift)
            half = np.array([FILL, FILL, length]) / 2
            shade = int(data["shade"][r][c], 16) / (data["shadeLevels"] - 1)
            yield centre, turn, half, shade


def faces(centre, turn, half):
    """The box's faces that face the viewer: (corner, edge u, edge v, world normal, tip 0/1), in cells."""
    for axis in range(3):
        for sign in (-1, 1):
            normal = np.zeros(3)
            normal[axis] = sign
            world = turn @ normal
            if world[2] <= 1e-6:
                continue
            a, b = [i for i in range(3) if i != axis]
            eu = np.zeros(3)
            ev = np.zeros(3)
            eu[a] = 2 * half[a]
            ev[b] = 2 * half[b]
            corner = centre + turn @ (normal * half[axis] - eu / 2 - ev / 2)
            yield corner, turn @ eu, turn @ ev, world, float(axis == 2)


def render(data: dict, theme: str, height: int, invert: float) -> Image.Image:
    colours = tokens(theme)
    accent, surface = colours["accent"], colours["surface"]
    frame_rows = data["rows"] + 2 * data["margin"]
    frame_cols = data["cols"] + 2 * data["margin"]
    width = round(height * frame_cols / frame_rows)
    cell = height / frame_rows  # final px per cell
    # As portraitEdge in build-portrait.ts: the poster is the 1.5x render.
    edge_strength = min(1.0, max(0.15, (cell - 4) / 8))

    scale = cell * SUPERSAMPLE
    big_w, big_h = width * SUPERSAMPLE, height * SUPERSAMPLE
    colour = np.zeros((big_h, big_w, 3))
    alpha = np.zeros((big_h, big_w))
    depth = np.full((big_h, big_w), -np.inf)

    for centre, turn, half, shade in blocks(data):
        tone = shade + (1 - 2 * shade) * invert
        for corner, eu, ev, normal, tip in faces(centre, turn, half):
            # Screen space (supersampled px, y down) of the corner and the two edges.
            p0 = np.array([big_w / 2 + corner[0] * scale, big_h / 2 - corner[1] * scale])
            m = np.array([[eu[0] * scale, ev[0] * scale], [-eu[1] * scale, -ev[1] * scale]])
            if abs(np.linalg.det(m)) < 1e-9:
                continue
            inverse = np.linalg.inv(m)
            corners = [p0, p0 + m[:, 0], p0 + m[:, 1], p0 + m[:, 0] + m[:, 1]]
            x0 = max(0, int(math.floor(min(p[0] for p in corners))))
            x1 = min(big_w, int(math.ceil(max(p[0] for p in corners))))
            y0 = max(0, int(math.floor(min(p[1] for p in corners))))
            y1 = min(big_h, int(math.ceil(max(p[1] for p in corners))))
            if x1 <= x0 or y1 <= y0:
                continue
            ys, xs = np.mgrid[y0:y1, x0:x1]
            dx = xs + 0.5 - p0[0]
            dy = ys + 0.5 - p0[1]
            u = inverse[0, 0] * dx + inverse[0, 1] * dy
            v = inverse[1, 0] * dx + inverse[1, 1] * dy
            inside = (u >= 0) & (u <= 1) & (v >= 0) & (v <= 1)
            z = corner[2] + u * eu[2] + v * ev[2]
            region = depth[y0:y1, x0:x1]
            draw = inside & (z > region)
            if not draw.any():
                continue

            # fwidth of the edge distance at final resolution, as the shader sees it.
            du = (abs(inverse[0, 0]) + abs(inverse[0, 1])) * SUPERSAMPLE
            dv = (abs(inverse[1, 0]) + abs(inverse[1, 1])) * SUPERSAMPLE
            du_edge = np.minimum(u, 1 - u)
            dv_edge = np.minimum(v, 1 - v)
            edge = np.minimum(du_edge, dv_edge)
            px = np.where(du_edge <= dv_edge, du, dv)
            s = np.clip((edge - px) / px, 0, 1)
            line = 1 - s * s * (3 - 2 * s)

            facing = float(normal @ LIGHT_DIR)
            ink = tone ** (1.6 + (0.75 - 1.6) * invert) * (0.25 + 0.75 * tip)
            share = 0.03 + (0.8 + (0.94 - 0.8) * invert) * ink
            face = (surface + (accent - surface) * share) * (0.62 + 0.38 * facing)
            strength = line * (0.2 + 0.7 * ink) * edge_strength
            pixel = face[None, None, :] + (accent - face)[None, None, :] * strength[..., None]

            region[draw] = z[draw]
            colour[y0:y1, x0:x1][draw] = pixel[draw]
            alpha[y0:y1, x0:x1][draw] = 1

    srgb = to_srgb(colour) * alpha[..., None]  # premultiplied, as the canvas
    rgba = np.dstack([srgb, alpha])
    big = Image.fromarray(np.round(rgba * 255).astype(np.uint8), "RGBa")
    return big.reduce(SUPERSAMPLE).convert("RGBA")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--avif-quality", type=int, default=60)
    parser.add_argument("--webp-quality", type=int, default=80)
    args = parser.parse_args()

    data = json.loads(DATA.read_text(encoding="ascii"))
    OUT.mkdir(parents=True, exist_ok=True)
    for theme, invert in (("dark", 0.0), ("light", 1.0)):
        image = render(data, theme, data["posterHeight"], invert)
        for ext, options in (
            ("avif", {"quality": args.avif_quality, "speed": 2}),
            ("webp", {"quality": args.webp_quality, "method": 6}),
        ):
            path = OUT / f"portrait-{theme}.{ext}"
            image.save(path, **options)  # no metadata: nothing is copied from a source file
            print(f"{path.relative_to(ROOT)}: {image.width}x{image.height}, {path.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
