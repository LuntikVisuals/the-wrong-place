"""Map close-ups for before/after comparisons: python3 tests/mapshots.py <html> <prefix>"""
import asyncio,sys
from playwright.async_api import async_playwright
SPOTS=[('village',0,20,20,'village-well'),('village',0,6,6,'village-nw-house'),('village',0,31,22,'village-se-house'),('village',0,19,5,'village-church'),('village',1,6,6,'village-loft'),
 ('ship',0,20,9,'ship-deck'),('ship',2,28,12,'ship-hold'),('ship',2,7,12,'ship-engine'),('mansion',1,14,10,'mansion-f1-doors'),('mansion',3,24,10,'mansion-f3-doors'),('mansion',0,20,22,'mansion-yard-trees')]
async def main(html,pre):
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=await (await b.new_context(viewport={'width':1280,'height':720})).new_page()
    await pg.goto('file://'+html);await pg.wait_for_function('WP.ready')
    for mp,f,x,y,nm in SPOTS:
      await pg.evaluate("()=>{WP.forceWeather='clear';WP.forceBlackout=-1;const G=WP.start({side:'s',surv:'nora',killer:'stitches',map:'%s',diff:1,seed:3});G.killer.bot=null;G.killer.f=(%d+1)%%G.M.floors.length;for(const o of G.surv)o.bot=null;const P=G.player;P.f=%d;placeNear(G,P,cc(%d),cc(%d),%d)}"%(mp,f,f,x,y,f))
      await pg.wait_for_timeout(700);await pg.screenshot(path='/workspace/wrongplace/screens/%s-%s.png'%(pre,nm))
    await b.close()
asyncio.run(main(sys.argv[1],sys.argv[2]))
