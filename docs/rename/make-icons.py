#!/usr/bin/env python3
"""Redraw the monogram letter on the PWA icons (public/icons/*.png).
Keeps the existing dark background + lime rounded square; replaces the glyph.
Idempotent: re-running with the same letter produces the same pixels.
usage: make-icons.py <repo_dir> <LETTER>"""
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
repo, letter = sys.argv[1], sys.argv[2]
ACC = (200, 241, 53); INK = (10, 10, 10)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
for path in sorted(glob.glob(os.path.join(repo, "public/icons/*.png"))):
    im = Image.open(path).convert("RGB"); w, h = im.size; px = im.load()
    acc = [(x, y) for y in range(h) for x in range(w) if sum(abs(a-b) for a, b in zip(px[x, y], ACC)) < 60]
    if not acc: print("skip (no accent square):", path); continue
    ax0 = min(p[0] for p in acc); ax1 = max(p[0] for p in acc); ay0 = min(p[1] for p in acc); ay1 = max(p[1] for p in acc)
    side = ax1 - ax0
    # wipe the inner area of the square (keeps the rounded corners intact)
    m = int(side * 0.18)
    d = ImageDraw.Draw(im); d.rectangle([ax0+m, ay0+m, ax1-m, ay1-m], fill=ACC)
    # draw the new letter at ~45% of the square's height, optically centered
    target = side * 0.45; size = int(target * 1.4)
    font = ImageFont.truetype(FONT, size)
    while True:
        l, t, r, b = d.textbbox((0, 0), letter, font=font)
        if b - t <= target or size < 8: break
        size -= 1; font = ImageFont.truetype(FONT, size)
    cx = (ax0 + ax1) / 2; cy = (ay0 + ay1) / 2
    d.text((cx - (l + r) / 2, cy - (t + b) / 2), letter, font=font, fill=INK)
    im.save(path, optimize=True); print("icon:", os.path.relpath(path, repo), w, "x", h)
