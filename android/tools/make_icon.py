"""Original code-drawn launcher icon: hooded pixel figure with red eyes in a doorway, hanging hook, red sky."""
from PIL import Image,ImageDraw
import os,sys
G=32
def draw():
  im=Image.new('RGBA',(G,G));d=ImageDraw.Draw(im)
  for y in range(G):
    t=y/G;d.line([(0,y),(G,y)],fill=(int(90-60*t),int(10+4*t),int(16+6*t),255))
  d.rectangle([7,8,24,31],fill=(18,10,12,255));d.rectangle([9,10,22,31],fill=(40,14,18,255))  # doorway
  d.rectangle([6,6,25,8],fill=(60,34,26,255))
  d.rectangle([11,13,20,22],fill=(30,24,22,255));d.rectangle([12,15,19,21],fill=(10,6,8,255))  # hood
  d.rectangle([13,17,14,18],fill=(255,40,40,255));d.rectangle([17,17,18,18],fill=(255,40,40,255))  # eyes
  d.rectangle([10,22,21,31],fill=(46,31,24,255));d.rectangle([10,22,11,31],fill=(30,20,16,255))  # body
  d.line([(27,0),(27,10)],fill=(150,150,160,255));d.rectangle([25,10,28,11],fill=(170,170,180,255));d.point([(25,9),(25,8)],fill=(170,170,180,255))  # hook
  for x,y in [(3,26),(4,27),(28,22),(2,29),(29,28)]:d.point((x,y),fill=(160,10,20,255))  # blood drops
  d.rectangle([0,0,G-1,G-1],outline=(18,10,12,255))
  return im
if __name__=='__main__':
  res=sys.argv[1];base=draw()
  for name,px in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
    os.makedirs(f'{res}/mipmap-{name}',exist_ok=True);base.resize((px,px),Image.NEAREST).save(f'{res}/mipmap-{name}/ic_launcher.png')
  base.resize((512,512),Image.NEAREST).save(os.path.join(os.path.dirname(res),'icon-512.png'))
