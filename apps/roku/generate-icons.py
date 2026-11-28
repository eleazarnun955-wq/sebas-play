from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

out = Path('images')
out.mkdir(exist_ok=True)

# Roku channel tiles: focused (336x210) and side (214x144).
for filename, size in [('icon_focus_hd.png', (336, 210)), ('icon_side_hd.png', (214, 144))]:
    w, h = size
    im = Image.new('RGB', size, (8, 8, 8))
    d = ImageDraw.Draw(im)
    # Subtle dark-red cinematic glow and a crisp red frame.
    d.rounded_rectangle((3, 3, w - 4, h - 4), radius=max(10, h // 12), outline=(229, 9, 20), width=max(3, h // 45))
    cx, cy = int(w * 0.23), h // 2
    r = int(h * 0.30)
    d.ellipse((cx-r, cy-r, cx+r, cy+r), fill=(229, 9, 20))
    d.polygon([(cx-int(r*.25), cy-int(r*.52)), (cx-int(r*.25), cy+int(r*.52)), (cx+int(r*.58), cy)], fill=(255, 255, 255))
    font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    title_font = ImageFont.truetype(font_path, int(h * 0.19))
    subtitle_font = ImageFont.truetype(font_path, max(10, int(h * 0.095)))
    tx = int(w * 0.43)
    d.text((tx, int(h * 0.29)), 'SEBAS', font=title_font, fill=(255, 255, 255))
    d.text((tx, int(h * 0.51)), 'PLAY', font=title_font, fill=(229, 9, 20))
    d.text((tx, int(h * 0.79)), '16.0', font=subtitle_font, fill=(210, 210, 210))
    im.save(out / filename, optimize=True)
