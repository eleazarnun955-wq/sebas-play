from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
out=Path('images'); out.mkdir(exist_ok=True)
for filename,size in [('icon_focus_hd.png',(336,210)),('icon_side_hd.png',(214,144))]:
 w,h=size; im=Image.new('RGB',size,(8,13,26)); p=im.load()
 for y in range(h):
  for x in range(w):
   t=x/max(1,w-1); p[x,y]=(int(8+12*t),int(13+8*t),int(26+28*t))
 d=ImageDraw.Draw(im); d.rounded_rectangle((7,7,w-8,h-8),radius=max(12,h//12),outline=(246,151,50),width=max(2,h//65)); r,cx,cy=int(h*.29),int(w*.24),h//2
 d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=(235,91,48),outline=(255,195,105),width=max(2,h//70)); d.polygon([(cx-int(r*.28),cy-int(r*.48)),(cx-int(r*.28),cy+int(r*.48)),(cx+int(r*.52),cy)],fill=(255,255,255))
 f1=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',int(h*.19)); f2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',int(h*.085)); tx=int(w*.43)
 d.text((tx,int(h*.34)),'SEBAS',font=f1,fill=(255,255,255)); d.text((tx,int(h*.57)),'PLAY',font=f1,fill=(255,184,91)); d.text((tx,int(h*.80)),'TU CINE EN CASA',font=f2,fill=(188,205,226)); im.save(out/filename,optimize=True)
