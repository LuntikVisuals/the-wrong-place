"""Headless browser tests for dist/the-wrong-place.html:
 - no console errors/warnings/page errors in menu, setup, gameplay (both sides, all killers, all maps)
 - hundreds of bot-vs-bot matches per killer via WP.sim (same build), with invariant checks
 - screenshots into screens/"""
import asyncio, json, sys, time
from playwright.async_api import async_playwright
URL='file:///workspace/wrongplace/dist/the-wrong-place.html'
N=int(sys.argv[1]) if len(sys.argv)>1 else 100
SHOTS='/workspace/wrongplace/screens/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
    errs=[]
    ctx=await b.new_context(viewport={'width':844,'height':390},device_scale_factor=2,has_touch=True,is_mobile=True)
    pg=await ctx.new_page()
    pg.on('console',lambda m: errs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
    pg.on('pageerror',lambda e: errs.append('pageerror: '+str(e)))
    res={}
    await pg.goto(URL);await pg.wait_for_function('WP.ready');await pg.wait_for_timeout(300)
    await pg.wait_for_timeout(500);await pg.screenshot(path=SHOTS+'01-lobby-survivor.png')
    # every lobby button + back, coins/shop purchase, character cycling, card -> setup
    for bid in ['bChars','bShop','bTasks','bLore','bSet','bCard']:
      await pg.click('#'+bid);await pg.wait_for_timeout(120)
      if bid=='bShop':
        c0=await pg.evaluate('PROF.coins');await pg.click('[data-buy]');c1=await pg.evaluate('PROF.coins');assert c1<c0,'shop purchase'
        await pg.screenshot(path=SHOTS+'01c-lobby-shop.png')
      if bid=='bSet':await pg.click('#bSnd');await pg.click('#bSnd');await pg.click('#bHow');await pg.click('#bk');await pg.click('#bSet');await pg.click('#bReset')
      await pg.click('#bk');await pg.wait_for_timeout(120);assert await pg.evaluate("!!document.getElementById('lbcv')"),'back to lobby '+bid
    n0=await pg.evaluate('SET.surv');await pg.click('#bNext');await pg.click('#bNext');await pg.click('#bPrev');assert await pg.evaluate('SET.surv')!=n0
    await pg.evaluate("()=>{SET.side='k';SET.killer='bride';showMenu()}");await pg.wait_for_timeout(500);await pg.screenshot(path=SHOTS+'01b-lobby-killer.png')
    for (w,h) in [(568,320),(740,360),(915,412),(1280,720)]:
      await pg.set_viewport_size({'width':w,'height':h});await pg.wait_for_timeout(250)
      ov=await pg.evaluate("""()=>{const ids=['bChars','bShop','bTasks','bLore','bSet','bPlay','bCard','bPrev','bNext','lbCoins'];const r=ids.map(i=>[i,document.getElementById(i).getBoundingClientRect()]);const bad=[];
        for(const[i,a]of r){if(a.left<0||a.top<0||a.right>innerWidth+1||a.bottom>innerHeight+1)bad.push(i+' offscreen');for(const[j,b]of r)if(i<j&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom)bad.push(i+'/'+j)}return bad}""")
      res.setdefault('lobbyLayout',{})['%dx%d'%(w,h)]=ov
      if (w,h)==(568,320):await pg.screenshot(path=SHOTS+'01d-lobby-small-568x320.png')
    await pg.set_viewport_size({'width':844,'height':390})
    # --- lobby backgrounds: buy, equip, persist across reload, screenshot each
    await pg.evaluate("()=>{PROF.coins=400;PROF.owned=[];PROF.bg='parlor';saveProf();showMenu()}")
    await pg.click('#bShop');await pg.wait_for_timeout(400);await pg.screenshot(path=SHOTS+'01e-shop-backgrounds.png',full_page=True)
    bgs=await pg.evaluate("Object.keys(LBG).filter(k=>k!=='parlor')")
    for bg in bgs:
      c0=await pg.evaluate('PROF.coins');pr=await pg.evaluate("LBG['%s'].price"%bg);await pg.click('[data-buybg="%s"]'%bg);await pg.wait_for_timeout(100)
      assert await pg.evaluate('PROF.coins')==c0-pr,'bg price '+bg
      assert await pg.evaluate("PROF.bg")==bg and await pg.evaluate("JSON.parse(localStorage.getItem('twp_prof')||'{}').bg")==bg,'bg equip saved '+bg
    await pg.click('[data-equip="cabin"]');await pg.wait_for_timeout(100);assert await pg.evaluate('PROF.bg')=='cabin'
    c=await pg.evaluate('PROF.coins');await pg.click('[data-equip="graveyard"]');assert await pg.evaluate('PROF.coins')==c,'re-equip free'
    await pg.reload();await pg.wait_for_function('WP.ready');await pg.wait_for_timeout(300)
    assert await pg.evaluate('PROF.bg')=='graveyard' and await pg.evaluate("PROF.owned.filter(x=>x.startsWith('bg_')).length")==len(bgs),'bg persist after reload'
    for bg in ['parlor']+bgs:
      await pg.evaluate("()=>{PROF.bg='%s';saveProf();showMenu()}"%bg);await pg.wait_for_timeout(600);await pg.screenshot(path=SHOTS+'01f-lobby-bg-%s.png'%bg)
    await pg.evaluate("()=>{PROF.bg='parlor';PROF.coins=120;saveProf();showMenu()}")
    res['lobbyBackgrounds']={'bought':bgs,'persist':True}
    # Android back/pause hooks
    await pg.click('#bShop');assert await pg.evaluate('WP.onBack()');assert await pg.evaluate("!!document.getElementById('lbcv')"),'back from shop'
    assert await pg.evaluate('WP.onBack()')==False,'back in lobby exits'
    await pg.evaluate("()=>WP.start({side:'s',surv:'nora',map:'mansion',diff:1,seed:3})");await pg.evaluate('WP.onPause()');assert await pg.evaluate('IN.paused'),'onPause pauses'
    assert await pg.evaluate('WP.onBack()') and not await pg.evaluate('IN.paused'),'back resumes'
    await pg.evaluate("()=>{WP.G=null;showMenu()}");res['androidHooks']=True
    await pg.evaluate("()=>{SET.side='s';SET.surv='nora';showMenu()}");await pg.click('#bPlay');await pg.wait_for_timeout(300);assert await pg.evaluate('!!WP.G&&WP.G.player.def.id==="nora"')
    await pg.evaluate("()=>{WP.G=null;showMenu()}");await pg.wait_for_timeout(200)
    await pg.click('#bChars');await pg.wait_for_timeout(200);await pg.screenshot(path=SHOTS+'02-setup-survivor.png')
    await pg.click('#sK');await pg.wait_for_timeout(200);await pg.screenshot(path=SHOTS+'03-setup-killer.png')
    await pg.click('#bk')
    # --- live gameplay smoke: each killer as player, each survivor as player, every map; bots drive the rest for a while
    live=[]
    for side,ch in [('k','stitches'),('k','bride'),('k','rotjaw'),('s','nora'),('s','tyler'),('s','ruth'),('s','sam'),('s','victor')]:
      for mp in ['mansion','village','ship']:
        r=await pg.evaluate("""([side,ch,mp])=>{const o={side,map:mp,diff:1,seed:77};if(side==='k')o.killer=ch;else o.surv=ch;const G=WP.start(o);
          // let a bot brain drive the player too, to exercise player-only paths (render, HUD, aim)
          const P=G.player;P.bot=mkBot(P,G);return {ok:true}}""",[side,ch,mp])
        await pg.wait_for_timeout(1200)
        st=await pg.evaluate("()=>{const G=WP.G;return {t:G.t,f:G.view.f,over:G.over,nan:WP.dbg.nan,clip:WP.dbg.wallClip,xf:WP.dbg.crossFloor}}")
        live.append([side,ch,mp,st])
    res['live']=live
    # --- screenshots of specific situations (mansion)
    await pg.evaluate("()=>{const G=WP.start({side:'s',surv:'victor',map:'mansion',diff:1,seed:5,killer:'stitches'});const P=G.player;P.f=0;P.x=cc(20);P.y=cc(14);placeNear(G,P,P.x,P.y,0);}")
    await pg.wait_for_timeout(900);await pg.screenshot(path=SHOTS+'04-mansion-yard-survivor.png')
    # floor 2 gameplay with killer nearby (heartbeat icon) + generator repair
    await pg.evaluate("""()=>{const G=WP.G,P=G.player,K=G.killer,g=G.M.gens.find(g=>g.f===2);P.f=2;P.x=g.x-36;P.y=g.y;P.face=0;g.p=0.45;P.in.act=true;
      const o=G.surv.find(s=>s!==P);o.f=2;o.x=g.x+36;o.y=g.y;o.bot=null;o.in.act=true;o.hp=40;K.f=2;K.x=g.x+120;K.y=g.y+60;K.bot=null;}""")
    await pg.keyboard.down('KeyE');await pg.wait_for_timeout(900);await pg.screenshot(path=SHOTS+'05-mansion-floor2-generator-heartbeat.png');await pg.keyboard.up('KeyE')
    # floor 4 attic: survivor knocks wardrobe on killer
    await pg.evaluate("""()=>{const G=WP.G,P=G.player,K=G.killer;const fu=G.M.furn.find(u=>u.f===4&&u.state==='up')||G.M.furn.find(u=>u.state==='up');
      const vert=fuVert(G,fu),cx=cc(fu.fx),cy=cc(fu.fy),dx=vert?Math.sign(fu.x-cx):0,dy=vert?0:Math.sign(fu.y-cy);
      P.f=fu.f;placeNear(G,P,fu.x+(vert?0:20),fu.y+(vert?20:0),fu.f);K.f=fu.f;K.bot=null;K.x=cx-dx*8;K.y=cy-dy*8;for(const s of G.surv)if(s!==P)s.f=0;R.cam.x=cx;R.cam.y=cy;knockOver(G,P,fu);}""")
    await pg.wait_for_timeout(500);await pg.screenshot(path=SHOTS+'06-mansion-attic-knockover-stun.png')
    # hook scene (yard) as killer view
    await pg.evaluate("""()=>{const G=WP.start({side:'k',killer:'stitches',map:'mansion',diff:1,seed:9});const K=G.player;const h=G.M.hooks[0];const s=G.surv[0];
      s.st='hooked';s.hookN=1;s.hookT=40;h.victim=s;s.f=h.f;s.x=h.x;s.y=h.y;K.f=h.f;K.x=h.x+50;K.y=h.y+40;K.face=Math.PI;
      const s2=G.surv[1];s2.f=h.f;s2.x=h.x-60;s2.y=h.y+70;s2.hp=30;s2.bot=null;for(let i=0;i<8;i++)bleed(G,s2,4,i%3==0);for(const q of G.surv.slice(2))q.f=3;}""")
    await pg.wait_for_timeout(700);await pg.screenshot(path=SHOTS+'07-hook-killer-view.png')
    # ability aiming through the real input path: hold ability key, aim with the mouse
    async def aimShot(setup,key,name):
      xy=await pg.evaluate(setup)
      await pg.wait_for_timeout(250);await pg.mouse.move(xy[0],xy[1]);await pg.keyboard.down(key);await pg.wait_for_timeout(250)
      aim=await pg.evaluate("()=>!!(WP.G.player.aim)");await pg.screenshot(path=SHOTS+name);await pg.keyboard.up(key);await pg.wait_for_timeout(700)
      return aim
    scr="const X=(t.x-R.cam.x)*R.S+R.W/2,Y=(t.y-R.cam.y)*R.S+R.H/2;return [X,Y];"
    res['aim']=[]
    res['aim'].append(await aimShot("()=>{const G=WP.G,K=G.player,t=G.surv[1];placeNear(G,K,t.x+150,t.y,t.f);R.cam.x=K.x;R.cam.y=K.y;"+scr+"}",'KeyQ','08-aim-rope-stitches.png'))
    res['ropePulledInLive']=await pg.evaluate("()=>WP.G.ev.pulls")
    res['aim'].append(await aimShot("()=>{const G=WP.start({side:'k',killer:'rotjaw',map:'mansion',diff:1,seed:12});const K=G.player;for(const o of G.surv)o.bot=null;const t=G.surv[0];K.f=t.f;placeNear(G,K,t.x+150,t.y+20,t.f);R.cam.x=K.x;R.cam.y=K.y;"+scr+"}",'KeyR','09-aim-pounce-rotjaw.png'))
    res['aim'].append(await aimShot("()=>{const G=WP.start({side:'s',surv:'victor',killer:'bride',map:'mansion',diff:1,seed:3});const P=G.player,t=G.killer;t.bot=null;t.f=P.f;placeNear(G,t,P.x+100,P.y+10,P.f);R.cam.x=P.x;R.cam.y=P.y;"+scr+"}",'KeyQ','10-aim-lamp-victor-vs-bride-frost.png'))
    res['aim'].append(await aimShot("()=>{const G=WP.start({side:'k',killer:'bride',map:'mansion',diff:1,seed:8});const K=G.player;for(const o of G.surv)o.bot=null;const t=G.surv[0];K.f=t.f;placeNear(G,K,t.x-160,t.y,t.f);R.cam.x=K.x;R.cam.y=K.y;"+scr+"}",'KeyR','10b-aim-veil-bride.png'))
    # touch controls: drag joystick + tap action
    await pg.evaluate("()=>{WP.start({side:'s',surv:'nora',map:'mansion',diff:0,seed:4});}")
    cdp=await ctx.new_cdp_session(pg)
    async def touch(t,pts):await cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':pts})
    x0=await pg.evaluate("WP.G.player.x")
    await touch('touchStart',[{'x':120,'y':300,'id':1}])
    for i in range(10):await touch('touchMove',[{'x':120+i*6,'y':300,'id':1}]);await pg.wait_for_timeout(30)
    await pg.wait_for_timeout(500);x1=await pg.evaluate("WP.G.player.x");await touch('touchEnd',[])
    res['touchMoved']=round(x1-x0,1)
    await pg.screenshot(path=SHOTS+'11-touch-controls.png')
    # village / ship
    for mp,shots in [('village',[('12a-village-outdoor',0,20,15),('12b-village-house-interior',0,6,5),('12c-village-church',0,19,5),('12d-village-barn',0,31,22),('12e-village-loft',1,6,5)]),('ship',[('13a-ship-upper-deck',0,17,13),('13b-ship-cabins-deck',1,17,14),('13c-ship-hold-engine',2,10,13)])]:
      await pg.evaluate("()=>{WP.start({side:'s',surv:'sam',map:'%s',diff:1,seed:6});}"%mp);await pg.wait_for_timeout(300)
      for nm,f,x,y in shots:
        ok=await pg.evaluate("""()=>{const G=WP.G,P=G.player,F=G.M.floors[%d];let best=null;for(let r=0;r<8&&!best;r++)for(let dy=-r;dy<=r&&!best;dy++)for(let dx=-r;dx<=r;dx++){const X=%d+dx,Y=%d+dy;if(passK(F,X,Y,'s')&&F.g[idx(X,Y)]!==TI.STAIR){best=[X,Y];break}}if(!best)return false;P.f=%d;P.x=cc(best[0]);P.y=cc(best[1]);P.climb=null;return true}"""%(f,x,y,f))
        assert ok,nm
        await pg.wait_for_timeout(400);await pg.screenshot(path=SHOTS+nm+'.png')
    await pg.evaluate("()=>{WP.G=null;}")
    res['scenarios']=await pg.evaluate(open('/workspace/wrongplace/tests/scenarios.js').read())
    # --- mass bot-vs-bot simulation
    t0=time.time();sims=[]
    for k in ['stitches','bride','rotjaw']:
      for d in [0,1,2]:
        batch=await pg.evaluate("""([k,n,d])=>{const out=[];for(let i=0;i<n;i++){const r=WP.sim({killer:k,seed:5000+i*7+d*100000,diff:d,map:'mansion'});out.push({k,d,over:r.over,time:r.time,res:r.result,gens:r.gens,gates:r.gatesOpened,stuck:r.stuck,nan:r.nan,clip:r.wallClip,xf:r.crossFloor,ev:r.ev,dither:r.dither,kf:r.killerFloors,sf:r.survFloors,cb:r.collapseBy,log:r.mapLog})}return out}""",[k,N//3 if d!=1 else N,d])
        sims+=batch
    for mp in ['village','ship']:
      for k in ['stitches','bride','rotjaw']:
        sims+=await pg.evaluate("""([k,mp])=>{const out=[];for(let i=0;i<50;i++){const r=WP.sim({killer:k,seed:9000+i,map:mp});out.push({k,d:1,map:mp,over:r.over,time:r.time,res:r.result,gens:r.gens,gates:r.gatesOpened,stuck:r.stuck,nan:r.nan,clip:r.wallClip,xf:r.crossFloor,ev:r.ev,dither:r.dither,kf:r.killerFloors,sf:r.survFloors,cb:r.collapseBy,log:r.mapLog})}return out}""",[k,mp])
    res['simSeconds']=round(time.time()-t0,1)
    res['errors']=errs
    json.dump({'res':res,'sims':sims},open('/workspace/wrongplace/tests/last_results.json','w'))
    # summary
    def summ(rows):
      n=len(rows);kw=sum(r['res']['winner']=='killer' for r in rows if r['res']);sw=sum(r['res']['winner']=='survivors' for r in rows if r['res'])
      return dict(n=n,notFinished=sum(not r['over'] for r in rows),killerWin=kw,survWin=sw,draw=n-kw-sw,avgKills=round(sum(r['res']['kills'] for r in rows if r['res'])/max(1,n),2),
        avgTime=round(sum(r['time'] for r in rows)/max(1,n)),stuck=sum(len(r['stuck']) for r in rows),dither=sum(len(r.get('dither',[])) for r in rows),nan=sum(r['nan'] for r in rows),wallClip=sum(r['clip'] for r in rows),crossFloor=sum(r['xf'] for r in rows),
        timerEnd=sum(r['cb']=='timer' for r in rows),gatesOpenedMatches=sum(r['gates']>0 for r in rows),hooks=sum(r['ev']['hooks'] for r in rows),unhooks=sum(r['ev']['unhooks'] for r in rows),
        gens=sum(r['gens'] for r in rows),stairs=sum(r['ev']['stairs'] for r in rows),knocks=sum(r['ev']['knocks'] for r in rows),stuns=sum(r['ev']['stuns'] for r in rows),vaults=sum(r['ev']['vaults'] for r in rows),
        breaks=sum(r['ev']['breaks'] for r in rows),abil=sum(r['ev']['abil'] for r in rows),pulls=sum(r['ev']['pulls'] for r in rows),veils=sum(r['ev']['veils'] for r in rows),whispers=sum(r['ev']['whispers'] for r in rows),pounces=sum(r['ev']['pounces'] for r in rows),blinds=sum(r['ev']['blinds'] for r in rows),
        revives=sum(r['ev']['revives'] for r in rows),wiggle=sum(r['ev']['wiggleOut'] for r in rows),killerVisitedAllFloors=sum(len(r['kf'])>={'village':2,'ship':3}.get(r.get('map'),5) for r in rows),mapLog=sorted(set(x for r in rows for x in r['log'])))
    out={'lobbyLayout':res['lobbyLayout'],'errors':errs,'live':live,'touchMoved':res['touchMoved'],'aim':res['aim'],'ropePulledInLive':res['ropePulledInLive'],'simSeconds':res['simSeconds'],'scenarios':{k:v['ok'] for k,v in res['scenarios'].items()}}
    for k in ['stitches','bride','rotjaw']:
      for d in [0,1,2]:out['mansion-%s-d%d'%(k,d)]=summ([r for r in sims if r['k']==k and r['d']==d and 'map' not in r])
    for mp in ['village','ship']:out[mp]=summ([r for r in sims if r.get('map')==mp])
    out['stuckSamples']=[s for r in sims for s in r['stuck']][:10]
    print(json.dumps(out,ensure_ascii=False,indent=1))
    await b.close()
asyncio.run(main())
