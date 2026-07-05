#!/usr/bin/env python3
"""Pick and trim enemy art from Figma exports into scaled cells (3× Figma size)."""
import json
import sys
import urllib.request
from io import BytesIO

from PIL import Image

USER_AGENT = 'performingtypography-asset-sync/1.0'
SCALE = 3


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
    return img


def fit_cell(trimmed: Image.Image, frame_w: int, frame_h: int) -> Image.Image:
    scale = min(frame_w / trimmed.width, frame_h / trimmed.height)
    new_w = max(1, int(round(trimmed.width * scale)))
    new_h = max(1, int(round(trimmed.height * scale)))
    resized = trimmed.resize((new_w, new_h), Image.Resampling.LANCZOS)

    cell = Image.new('RGBA', (frame_w, frame_h), (0, 0, 0, 0))
    x = (frame_w - new_w) // 2
    y = frame_h - new_h
    cell.paste(resized, (x, y), resized)
    return cell


def process(urls: list[str], figma_w: int, figma_h: int) -> Image.Image | None:
    frame_w = figma_w * SCALE
    frame_h = figma_h * SCALE

    for url in reversed(urls):
        try:
            img = load_url(url)
            if img.width > 2000 or img.height > 2000:
                continue
            img = strip_background(img)
            bbox = img.getbbox()
            if not bbox:
                continue
            trimmed = img.crop(bbox)
            if trimmed.width < 8 or trimmed.height < 8:
                continue
            return fit_cell(trimmed, frame_w, frame_h)
        except Exception:
            continue
    return None


def main() -> None:
    payload = json.load(sys.stdin)
    urls = payload.get('urls', [])
    figma_w = int(payload.get('figmaW', 40))
    figma_h = int(payload.get('figmaH', 32))
    cell = process(urls, figma_w, figma_h)
    if cell is None:
        sys.exit(1)
    cell.save(sys.stdout.buffer, format='PNG')


if __name__ == '__main__':
    main()
