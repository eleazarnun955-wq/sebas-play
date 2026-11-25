from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path("images")
OUT.mkdir(exist_ok=True)
BG = (8, 13, 26)
GOLD = (246, 151, 50)
WHITE = (255, 255, 255)
ORANGE = (235, 91, 48)

def font(size, bold=False):
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    candidates = [
        Path("/usr/share/fonts/truetype/dejavu") / name,
        Path("/usr/share/fonts/dejavu") / name,
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()

def draw_brand(size, splash=False):
    w, h = size
    im = Image.new("RGB", size, BG)
    draw = ImageDraw.Draw(im)
    # Subtle diagonal blue gradient.
    px = im.load()
    for y in range(h):
        for x in range(w):
            t = (x / max(1, w - 1)) * 0.55 + (y / max(1, h - 1)) * 0.15
            px[x, y] = (8, int(13 + 12*t), int(26 + 34*t))
    draw = ImageDraw.Draw(im)
    if splash:
        margin = int(min(w, h) * 0.055)
        draw.rounded_rectangle((margin, margin, w-margin, h-margin),
                               radius=int(h*0.055), outline=GOLD,
                               width=max(3, int(h*0.008)))
        center_y = int(h * 0.43)
        radius = int(h * 0.16)
        cx = int(w * 0.28)
        draw.ellipse((cx-radius, center_y-radius, cx+radius, center_y+radius),
                     fill=ORANGE, outline=(255,195,105), width=max(3, int(h*0.01)))
        draw.polygon([(cx-int(radius*.25), center_y-int(radius*.5)),
                      (cx-int(radius*.25), center_y+int(radius*.5)),
                      (cx+int(radius*.55), center_y)], fill=WHITE)
        draw.text((int(w*.43), int(h*.32)), "SEBAS", font=font(int(h*.13), True), fill=WHITE)
        draw.text((int(w*.43), int(h*.48)), "PLAY", font=font(int(h*.13), True), fill=(255,184,91))
        draw.text((int(w*.435), int(h*.66)), "TU CINE EN CASA",
                  font=font(int(h*.045)), fill=(188,205,226))
    else:
        margin = max(5, int(h * .04))
        draw.rounded_rectangle((margin, margin, w-margin, h-margin),
                               radius=max(8, int(h*.12)), outline=GOLD,
                               width=max(2, int(h*.018)))
        r, cx, cy = int(h*.27), int(w*.24), h//2
        draw.ellipse((cx-r, cy-r, cx+r, cy+r), fill=ORANGE,
                     outline=(255,195,105), width=max(2, int(h*.02)))
        draw.polygon([(cx-int(r*.28),cy-int(r*.48)),
                      (cx-int(r*.28),cy+int(r*.48)),
                      (cx+int(r*.52),cy)], fill=WHITE)
        tx = int(w*.43)
        draw.text((tx, int(h*.28)), "SEBAS", font=font(max(12,int(h*.19)),True), fill=WHITE)
        draw.text((tx, int(h*.52)), "PLAY", font=font(max(12,int(h*.19)),True), fill=(255,184,91))
    return im

for filename, size in [
    ("icon_focus_fhd.png", (540, 405)),
    ("icon_focus_hd.png", (290, 218)),
    ("icon_side_hd.png", (214, 144)),
    ("splash_fhd.png", (1920, 1080)),
    ("splash_hd.png", (1280, 720)),
    ("splash_sd.png", (720, 480)),
]:
    draw_brand(size, splash=filename.startswith("splash_")).save(OUT / filename, optimize=True)
