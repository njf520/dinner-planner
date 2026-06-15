"""Generates icon-512.png and icon-192.png for the Belly Up PWA.

A cream circular badge on a dark-green field (matching manifest.json's
background_color), with an upright fork and martini glass side by side in
accent orange — representing food + drinks. Run once; output files are
checked into the repo.
"""
from PIL import Image, ImageDraw

SIZE = 512
BG = (22, 35, 24, 255)        # #162318
BADGE = (250, 249, 246, 255)  # #faf9f6
ACCENT = (200, 75, 47, 255)   # #c84b2f

def draw_fork(d, cx, top, handle_len, tine_len, width):
    """Draws an upright fork centered horizontally at cx, starting at `top`."""
    tine_w = width // 2
    gap = int(width * 1.1)
    # tines
    for i in (-1, 0, 1):
        x = cx + i * gap
        d.rounded_rectangle([x - tine_w // 2, top, x + tine_w // 2, top + tine_len], radius=tine_w // 2, fill=ACCENT)
    # connecting bar
    d.rounded_rectangle([cx - gap - tine_w // 2, top + tine_len - width // 2, cx + gap + tine_w // 2, top + tine_len + width // 2], radius=width // 4, fill=ACCENT)
    # handle
    handle_top = top + tine_len
    d.rounded_rectangle([cx - width // 2, handle_top, cx + width // 2, handle_top + handle_len], radius=width // 2, fill=ACCENT)
    return handle_top + handle_len  # bottom y

def draw_glass(d, cx, top, bowl_w, bowl_h, stem_h, base_w, line_w):
    """Draws an upright martini glass centered horizontally at cx, starting at `top`."""
    # bowl (triangle, point down)
    d.polygon([(cx - bowl_w // 2, top), (cx + bowl_w // 2, top), (cx, top + bowl_h)], fill=ACCENT)
    # olive garnish
    r = 20
    oy = top + bowl_h * 0.32
    d.ellipse([cx - r, oy - r, cx + r, oy + r], fill=BADGE)
    # stem
    stem_top = top + bowl_h
    d.rectangle([cx - line_w // 2, stem_top, cx + line_w // 2, stem_top + stem_h], fill=ACCENT)
    # base
    base_top = stem_top + stem_h
    d.rounded_rectangle([cx - base_w // 2, base_top, cx + base_w // 2, base_top + line_w], radius=line_w // 2, fill=ACCENT)
    return base_top + line_w  # bottom y

def main():
    img = Image.new('RGBA', (SIZE, SIZE), BG)
    d = ImageDraw.Draw(img)

    # cream badge circle
    pad = 40
    d.ellipse([pad, pad, SIZE - pad, SIZE - pad], fill=BADGE)

    # Fork on the left
    fork_bottom = draw_fork(d, cx=185, top=126, handle_len=190, tine_len=110, width=30)

    # Glass on the right
    glass_bottom = draw_glass(d, cx=330, top=146, bowl_w=190, bowl_h=140, stem_h=70, base_w=120, line_w=22)

    img.convert('RGB').save('icon-512.png')
    img.resize((192, 192), Image.LANCZOS).convert('RGB').save('icon-192.png')
    print('done', fork_bottom, glass_bottom)

if __name__ == '__main__':
    main()
