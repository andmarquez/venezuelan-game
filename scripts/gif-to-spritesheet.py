#!/usr/bin/env python3
"""Convert Figma animated GIF export into a horizontal PNG spritesheet."""
import json
import sys
import urllib.request
from io import BytesIO

from PIL import Image

USER_AGENT = 'performingtypography-asset-sync/1.0'
FRAME_W = 48
FRAME_H = 64


def load_url(url: str) -> Image.Image:
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req) as res:
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


def frame_to_cell(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    trimmed = img.crop(bbox) if bbox else img

    scale = min(FRAME_W / trimmed.width, FRAME_H / trimmed.height)
    new_w = max(1, int(round(trimmed.width * scale)))
    new_h = max(1, int(round(trimmed.height * scale)))
    resized = trimmed.resize((new_w, new_h), Image.Resampling.LANCZOS)

    cell = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    x = (FRAME_W - new_w) // 2
    y = FRAME_H - new_h
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
