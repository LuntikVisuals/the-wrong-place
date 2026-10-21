"""Hand-designed Village & Ship layouts. Run to regenerate src/c_maps2.js (ASCII floors).
Legend: # wall  = dirt road  . floor  , grass  : field  ~ water  f fence  T tree  _ void  g gap(survivors only)
 G exit gate  E generator  K hook  n nightstand  W wardrobe (fall into adjacent doorway/open tile)
 b bed t table c crate x barrel h hay p pew a altar w well m mast l lifeboat r engine o shelf
 1-9 stairs/ladders (same digit on two floors are linked)  k killer spawn  s survivor spawn  + medkit  * toolbox"""
W,H=40,30
def grid(fill): return [[fill]*W for _ in range(H)]
def rect(g,x0,y0,x1,y1,ch):
  for y in range(y0,y1+1):
    for x in range(x0,x1+1): g[y][x]=ch
def box(g,x0,y0,x1,y1,wall='#',floor='.'):
  rect(g,x0,y0,x1,y1,wall); rect(g,x0+1,y0+1,x1-1,y1-1,floor)
def put(g,s):
  for x,y,ch in s: g[y][x]=ch
def hline(g,x0,x1,y,ch):
  for x in range(x0,x1+1): g[y][x]=ch
def vline(g,x,y0,y1,ch):
  for y in range(y0,y1+1): g[y][x]=ch
def dump(g): return [''.join(r) for r in g]

# ================= VILLAGE =================
v0=grid(',')
rect(v0,0,0,W-1,0,'f');rect(v0,0,H-1,W-1,H-1,'f');vline(v0,0,0,H-1,'f');vline(v0,W-1,0,H-1,'f')
hline(v0,1,38,14,'=');hline(v0,1,38,15,'=')          # main road
vline(v0,19,1,28,'=');vline(v0,20,1,28,'=')          # north-south lane
put(v0,[(0,14,'G'),(0,15,'G'),(39,14,'G'),(39,15,'G')])
# church (north centre)
box(v0,14,1,25,10); put(v0,[(19,10,'.'),(20,10,'.'),(25,5,'.'),(14,7,'g')])
for y in (3,5,7):
  for x in (16,17,22,23): v0[y][x]='p'
put(v0,[(19,2,'a'),(20,2,'a'),(16,9,'E'),(24,2,'1'),(15,2,'o'),(23,9,'n')])
# house 1 (NW, 2 storeys)
box(v0,2,2,10,9); put(v0,[(6,9,'.'),(10,5,'.'),(2,6,'g')]); vline(v0,6,3,5,'#'); put(v0,[(6,4,'.')])
put(v0,[(3,3,'2'),(8,3,'t'),(9,3,'t'),(3,8,'b'),(9,8,'x'),(7,8,'n'),(5,8,'W')])
# house 2 (NE, 2 storeys)
box(v0,29,2,37,9); put(v0,[(33,9,'.'),(29,5,'.'),(37,7,'g')]); hline(v0,30,36,6,'#'); put(v0,[(33,6,'.')])
put(v0,[(36,3,'3'),(30,3,'o'),(31,3,'o'),(30,8,'t'),(36,8,'b'),(34,7,'W'),(32,5,'n')])
# house 3 (SW, single, workshop)
box(v0,2,18,10,26); put(v0,[(4,18,'.'),(10,22,'.'),(2,24,'g')]); vline(v0,6,19,25,'#'); put(v0,[(6,21,'.'),(6,24,'.')])
put(v0,[(4,22,'E'),(9,19,'c'),(3,25,'b'),(9,25,'t'),(7,20,'W'),(5,19,'n')])
# barn (SE, hay loft)
box(v0,26,18,37,27); put(v0,[(31,18,'.'),(32,18,'.'),(26,23,'.'),(37,22,'g'),(29,27,'g')])
put(v0,[(28,20,'h'),(28,21,'h'),(35,20,'h'),(35,25,'h'),(34,25,'h'),(31,23,'E'),(36,26,'4'),(27,19,'x'),(30,19,'W'),(25,22,'n')])
# well, fields with fences, trees
put(v0,[(20,20,'w'),(21,20,'w')])
rect(v0,12,22,17,27,':'); hline(v0,11,18,21,'f'); vline(v0,11,21,28,'f'); put(v0,[(14,21,','),(11,25,',')])
rect(v0,21,23,24,27,':'); put(v0,[(14,24,'E')])
for x,y in [(12,3),(12,8),(27,11),(4,12),(8,12),(35,12),(13,17),(23,18),(17,18),(3,28),(26,16),(33,16),(9,16),(24,12)]: v0[y][x]='T'
hline(v0,21,25,17,'f');hline(v0,1,3,17,'f');v0[17][1]=',';hline(v0,33,38,17,'f');vline(v0,13,11,13,'f')
put(v0,[(23,16,'W'),(15,16,'n'),(5,16,'W'),(35,11,'W'),(12,12,'n'),(30,12,'n')])
# gallows: hooks clustered, one place per area (west green, east green, south by the fields)
put(v0,[(4,11,'K'),(6,11,'K'),(8,11,'K'),(29,13,'K'),(31,13,'K'),(33,13,'K'),(13,28,'K'),(15,28,'K'),(17,28,'K')])
put(v0,[(20,16,'k'),(3,13,'s'),(36,13,'s'),(8,23,'s'),(33,21,'s'),(18,5,'s'),(25,29,'f')])
put(v0,[(15,25,'+'),(9,4,'*'),(34,3,'+'),(28,26,'+')])
# upper floor: house lofts + bell tower + barn loft
v1=grid('_')
box(v1,2,2,10,9); put(v1,[(3,3,'2'),(8,8,'b'),(4,8,'o'),(9,3,'n'),(6,6,'E')]); vline(v1,6,3,5,'#'); put(v1,[(6,4,'g')])
box(v1,29,2,37,9); put(v1,[(36,3,'3'),(30,8,'b'),(31,4,'W'),(33,6,'K'),(36,8,'x')])
box(v1,22,1,26,5); put(v1,[(24,2,'1'),(23,4,'+')])
box(v1,26,18,37,24); put(v1,[(36,19,'4'),(28,20,'h'),(29,20,'h'),(32,22,'h'),(34,21,'*')])
village=[('Деревня','village',True,dump(v0)),('Чердаки и колокольня','loft',False,dump(v1))]

# ================= SHIP =================
def hull(g,inner):
  rect(g,0,0,W-1,H-1,'~')
  for y in range(4,26):
    x1=35 if 8<=y<=21 else 35-abs(y-14.5)+6.5
    x1=int(min(35,x1))
    hline(g,3,x1,y,'#'); 
    if y not in (4,25): hline(g,4,x1-1,y,inner)
  # bow
  for y in range(9,21): 
    for x in range(36,36+int(3-abs(y-14.5)/2.5)): g[y][x]='#'
s0=grid('~'); hull(s0,'.')
# bridge/cabin at stern
box(s0,4,9,10,20); put(s0,[(10,14,'.'),(10,15,'.'),(7,9,'g'),(5,10,'E'),(9,19,'t'),(5,19,'1'),(8,10,'o')])
put(s0,[(14,14,'m'),(24,14,'m'),(31,14,'m')])
for x0,y0 in [(13,6),(21,6),(13,22),(21,22)]: rect(s0,x0,y0,x0+3,y0,'l')
put(s0,[(17,10,'c'),(18,10,'c'),(28,18,'c'),(28,19,'c'),(27,10,'x'),(19,19,'x'),(33,12,'x')])
put(s0,[(17,5,'2'),(29,24,'3'),(22,11,'E')])
put(s0,[(12,12,'W'),(26,17,'n'),(30,9,'W'),(16,18,'n'),(11,10,'n')])
put(s0,[(23,20,'K'),(25,20,'K'),(27,20,'K')])
put(s0,[(15,12,'x'),(16,12,'x'),(21,17,'c'),(22,17,'c'),(31,11,'x'),(12,17,'c'),(25,12,'n'),(33,18,'x'),(18,8,'c')])  # cover on the open deck
put(s0,[(20,4,'G'),(21,4,'G'),(20,25,'G'),(21,25,'G')])
put(s0,[(20,15,'k'),(27,7,'+'),(15,20,'*')])
s1=grid('~'); hull(s1,'.')
hline(s1,4,34,13,'#');hline(s1,4,34,16,'#')   # corridor y14-15
for x in (9,15,21,27): vline(s1,x,5,12,'#');vline(s1,x,17,24,'#')
for x0,x1 in [(4,9),(9,15),(15,21),(21,27),(27,34)]:
  d=(x0+x1)//2; s1[13][d]='.'; s1[16][d+1 if d+1<x1 else d]='.'
put(s1,[(24,16,'g'),(9,8,'g'),(21,20,'g'),(27,9,'.'),(15,21,'.')])
# cabins dressing
for x0 in (5,10,16,22,28):
  put(s1,[(x0,5,'b'),(x0+2,11,'n') if x0+2<34 else (x0,6,'b')])
put(s1,[(6,22,'t'),(7,22,'t'),(11,18,'b'),(18,23,'t'),(19,23,'t'),(17,23,'t'),(30,22,'o'),(31,22,'o')])
put(s1,[(5,17,'1'),(17,6,'2'),(29,24,'3'),(30,6,'5'),(6,24,'6')])
put(s1,[(12,9,'E'),(24,20,'E'),(17,10,'K'),(19,10,'K'),(30,14,'+'),(13,22,'W'),(25,7,'W'),(10,18,'n')])
put(s1,[(14,14,'s'),(26,15,'s')])
s2=grid('~'); hull(s2,'.')
vline(s2,13,5,24,'#'); put(s2,[(13,9,'.'),(13,19,'.'),(13,14,'g')])        # engine room | cargo hold
for x in range(16,33,4):
  for y in (7,8,11,12,17,18,21,22): s2[y][x]='c'
for y in range(9,24,3): s2[y][31]='x'
put(s2,[(6,8,'r'),(7,8,'r'),(6,9,'r'),(7,9,'r'),(6,20,'r'),(7,20,'r'),(10,14,'r'),(10,15,'r')])
put(s2,[(5,24,'6'),(30,6,'5'),(9,12,'E'),(24,15,'E'),(20,6,'K'),(22,6,'K'),(24,6,'K')])
put(s2,[(12,8,'W'),(14,20,'n'),(18,14,'W'),(26,9,'n'),(30,19,'n'),(5,15,'*'),(28,14,'+'),(8,22,'s')])
ship=[('Верхняя палуба','deck',True,dump(s0)),('Каютная палуба','cabin',False,dump(s1)),('Трюм и машинное','hold',False,dump(s2))]

import json,os
for name,fl in [('village',village),('ship',ship)]:
  for n,p,o,rows in fl:
    assert len(rows)==H and all(len(r)==W for r in rows),(name,n)
    print('==',name,n);print('\n'.join(rows))
js='/* ===== c_maps2: hand-designed Village & Ship (generated by tools/mapdesign.py) ===== */\nconst ASCII_MAPS='+json.dumps({'village':[dict(name=n,pal=p,outdoor=o,rows=r) for n,p,o,r in village],'ship':[dict(name=n,pal=p,outdoor=o,rows=r) for n,p,o,r in ship]},ensure_ascii=False,indent=0)+';\n'
open(os.path.join(os.path.dirname(__file__),'..','src','c_maps2.js'),'w',encoding='utf-8').write(js)
