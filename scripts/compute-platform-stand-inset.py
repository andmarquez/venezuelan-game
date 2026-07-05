#!/usr/bin/env python3
"""Compute visual walk-surface inset from top of platform PNG (yellow→blue transition)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PLATFORMS = ROOT / 'public/assets/world/platforms'


def walk_row(path: Path) -> int:
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    px = im.load()
    for y in range(h):
        yel = blu = 0
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 50:
                continue
            if r > 200 and g > 200 and b < 180:
                yel += 1
            if b > r + 40 and b > 150:
                blu += 1
        if y > 0 and yel < 20 and blu > 80:
            return y
    for y in range(h - 1, -1, -1):
        if max(px[x, y][3] for x in range(w)) > 100:
            return y
    return 0


def display_height(art: dict, native_w: int, native_h: int) -> float:
    scale_w = art['width'] / native_w
    disp_h = native_h * scale_w
    if disp_h > art['height']:
        return art['height']
    return disp_h


def main() -> None:
    layout_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'public/assets/world/level-1/layout-mobile.json'
    layout = json.loads(layout_path.read_text())
    art_list = layout.get('platformArt', [])
    out: dict[str, int] = {}
    for art in art_list:
        path = PLATFORMS / f"{art['name']}.png"
        if not path.exists():
            continue
        im = Image.open(path)
        row = walk_row(path)
        disp_h = display_height(art, im.width, im.height)
        inset = round(row * (disp_h / im.height))
        out[art['name']] = inset
        print(f"{art['name']:22} row={row:3}/{im.height} standInset={inset}px")
    print(json.dumps(out, indent=2))


if __name__ == '__main__':
    main()
