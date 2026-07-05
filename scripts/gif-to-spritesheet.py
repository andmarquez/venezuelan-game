#!/usr/bin/env python3
"""Convert Figma animated GIF export into a horizontal PNG spritesheet (144×192 per frame)."""
import json
import sys
import urllib.request
from io import BytesIO

from PIL import Image

USER_AGENT = 'performingtypography-asset-sync/1.0'
FIGMA_W = 48
FIGMA_H = 64
SCALE = 3
FRAME_W = FIGMA_W * SCALE
FRAME_H = FIGMA_H * SCALE


def load_url(url: str) -> Image.Image:
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req) as res:
        # Keep multi-frame GIF intact — do not .convert() here (flattens to frame 0).
        return Image.open(BytesIO(res.read()))


def extract_frames(img: Image.Image) -> list[Image.Image]:
    frames: list[Image.Image] = []
    try:
        while True:
            frames.append(img.copy().convert('RGBA'))
            img.seek(img.tell() + 1)
    except EOFError:
        pass
    return frames


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


def frame_to_cell(img: Image.Image) -> Image.Image:
    img = strip_background(img.copy().convert('RGBA'))
    bbox = img.getbbox()
    trimmed = img.crop(bbox) if bbox else img

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


def main() -> None:
    payload = json.load(sys.stdin)
    url = payload['url']
    img = load_url(url)
    frames = extract_frames(img)
    if not frames:
        sys.exit(1)

    cells = [frame_to_cell(frame) for frame in frames]
    sheet = Image.new('RGBA', (FRAME_W * len(cells), FRAME_H), (0, 0, 0, 0))
    for i, cell in enumerate(cells):
        sheet.paste(cell, (i * FRAME_W, 0))

    meta = {'frameCount': len(cells), 'frameWidth': FRAME_W, 'frameHeight': FRAME_H}
    sys.stderr.write(json.dumps(meta) + '\n')
    sheet.save(sys.stdout.buffer, format='PNG')


if __name__ == '__main__':
    main()
