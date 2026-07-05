#!/usr/bin/env python3
"""Pick and trim character art from Figma exports into 96×128 cells (2× Figma 48×64)."""
import json
import sys
import urllib.request
from io import BytesIO

from PIL import Image

USER_AGENT = 'performingtypography-asset-sync/1.0'
FRAME_W = 96
FRAME_H = 128


def load_url(url: str) -> Image.Image:
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req) as res:
        return Image.open(BytesIO(res.read())).convert('RGBA')


def strip_background(img: Image.Image) -> Image.Image:
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 20:
                px[x, y] = (0, 0, 0, 0)
                continue
            if r > 235 and g > 235 and b > 235:
                px[x, y] = (0, 0, 0, 0)
            elif r > 180 and g > 200 and b > 200 and abs(r - g) < 30:
                px[x, y] = (0, 0, 0, 0)
    return img


def sole_row(img: Image.Image) -> int:
    px = img.load()
    w, h = img.size
    x0 = int(w * 0.3)
    x1 = int(w * 0.7)
    for y in range(h - 1, -1, -1):
        for x in range(x0, x1):
            if px[x, y][3] > 200:
                return y
    return h - 1


def fit_cell(trimmed: Image.Image) -> Image.Image:
    scale = min(FRAME_W / trimmed.width, FRAME_H / trimmed.height)
    new_w = max(1, int(round(trimmed.width * scale)))
    new_h = max(1, int(round(trimmed.height * scale)))
    resized = trimmed.resize((new_w, new_h), Image.Resampling.LANCZOS)

    cell = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    row = sole_row(resized)
    x = (FRAME_W - new_w) // 2
    y = FRAME_H - 1 - row
    cell.paste(resized, (x, y), resized)
    return cell


def process_image(img: Image.Image) -> Image.Image | None:
    w, h = img.size
    if w > 2000 or h > 2000:
        return None

    img = strip_background(img)
    bbox = img.getbbox()
    if not bbox:
        return None

    trimmed = img.crop(bbox)
    if trimmed.width < 12 or trimmed.height < 16:
        return None

    return fit_cell(trimmed)


def score_image(img: Image.Image) -> tuple[int, Image.Image | None]:
    cell = process_image(img)
    if cell is None:
        return -1, None

    alpha = cell.split()[-1]
    solid = alpha.getbbox()
    if not solid:
        return -1, None

    tw, th = solid[2] - solid[0], solid[3] - solid[1]
    size_penalty = abs(tw - FRAME_W) + abs(th - FRAME_H)
    return tw * th + size_penalty * 4, cell


def main() -> None:
    payload = json.load(sys.stdin)
    urls = list(reversed(payload.get('urls', [])))

    best: Image.Image | None = None
    best_score = -1

    for url in urls:
        try:
            img = load_url(url)
            score, cell = score_image(img)
            if score < 0:
                continue
            if best is None or score < best_score:
                best = cell
                best_score = score
        except Exception:
            continue

    if best is None:
        sys.exit(1)

    best.save(sys.stdout.buffer, format='PNG')


if __name__ == '__main__':
    main()
