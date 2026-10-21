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
    LOBBY="!!document.getElementById('lbcv')"
    async def toLobby(tag):
      await pg.click('#bX');await pg.wait_for_timeout(120);assert await pg.evaluate(LOBBY),'X back to lobby '+tag
    # every lobby button opens a scrollable page with a round X (top-left) that returns to the lobby
    for bid in ['bProf','bTro','bSeason','bMenu','bShop','bChars','bLore','bNews','bFriends','bClub','bDaily','bPass','bQuests','bCard','lbCoins']:
      await pg.click('#'+bid);await pg.wait_for_timeout(150)
      x=await pg.evaluate("()=>{const b=document.getElementById('bX');if(!b)return null;const r=b.getBoundingClientRect();return [r.left,r.top,getComputedStyle(b).borderRadius,document.getElementById('ui').className]}")
      assert x and x[0]<30 and x[1]<30 and x[3]=='page','X close top-left '+bid+' '+str(x)
      res.setdefault('xClose',[]).append(bid)
      await toLobby(bid)
    # bk also returns
    await pg.click('#bNews');await pg.click('#bk');assert await pg.evaluate(LOBBY)
    # social stubs show the "скоро" panel
    for bid in ['bFriends','bClub']:
      await pg.click('#'+bid);assert await pg.evaluate("!!document.querySelector('.soon')"),'soon '+bid
      if bid=='bFriends':await pg.screenshot(path=SHOTS+'01k-soon-friends.png')
      await toLobby(bid)
    # profile: stats + name save persisted
    await pg.click('#bProf');await pg.wait_for_timeout(200);await pg.screenshot(path=SHOTS+'01g-profile.png')
    await pg.fill('#pfName','Максим');await pg.click('#pfSave');await pg.wait_for_timeout(100)
    assert await pg.evaluate("JSON.parse(localStorage.getItem('twp_prof')).name")=='Максим','profile name saved'
    await pg.evaluate('showMenu()')
    # trophies / season / daily screens
    await pg.click('#bTro');await pg.wait_for_timeout(150);await pg.screenshot(path=SHOTS+'01h-trophies.png');await toLobby('tro')
    await pg.evaluate("()=>{PROF.pxp=250;saveProf();showMenu()}");await pg.click('#bSeason');await pg.wait_for_timeout(150);await pg.screenshot(path=SHOTS+'01i-season.png')
    s0=await pg.evaluate('PROF.coins+PROF.souls');n=await pg.evaluate("document.querySelectorAll('[data-tier]').length")
    if n:await pg.click('[data-tier]');assert await pg.evaluate('PROF.coins+PROF.souls')>s0,'season claim'
    res['seasonClaim']=bool(n);await toLobby('season')
    await pg.evaluate("()=>{PROF.daily={day:0,last:0};saveProf();showMenu()}");await pg.click('#bDaily');await pg.wait_for_timeout(150);await pg.screenshot(path=SHOTS+'01j-daily.png')
    await pg.click('#dClaim');assert await pg.evaluate("JSON.parse(localStorage.getItem('twp_prof')).daily.day")==1,'daily claim saved'
    res['dailyClaim']=True;await pg.evaluate('showMenu()')
    # menu -> settings / how / profile
    await pg.click('#bMenu');await pg.click('#mSet');await pg.click('#bSnd');await pg.click('#bSnd');await pg.click('#bArr');await pg.click('#bArr');await pg.click('#bk')
    assert await pg.evaluate(LOBBY)
    # shop tabs + purchases
    await pg.evaluate("()=>{PROF.coins=1000;PROF.souls=50;saveProf();showMenu()}")
    for tab in ['deals','bg','chars','res']:
      await pg.evaluate("showShop('%s')"%tab);await pg.wait_for_timeout(300);await pg.screenshot(path=SHOTS+'01e-shop-tab-%s.png'%tab)
      assert await pg.evaluate("document.querySelector('[data-tab=\"%s\"]').classList.contains('sel')"%tab)
    await pg.click('[data-tab="chars"]');c0=await pg.evaluate('PROF.coins+PROF.souls');await pg.click('[data-buy]');assert await pg.evaluate('PROF.coins+PROF.souls')<c0,'shop purchase'
    await pg.click('[data-tab="res"]');s0=await pg.evaluate('PROF.souls');await pg.click('[data-ex="5"]');assert await pg.evaluate('PROF.souls')==s0+5,'exchange'
    res['shopTabs']=True;await toLobby('shop')
    n0=await pg.evaluate('SET.surv');await pg.click('#bNext');await pg.click('#bNext');await pg.click('#bPrev');assert await pg.evaluate('SET.surv')!=n0
    await pg.evaluate("()=>{SET.side='k';SET.killer='bride';showMenu()}");await pg.wait_for_timeout(500);await pg.screenshot(path=SHOTS+'01b-lobby-killer.png')
    IDS="['bProf','bTro','bSeason','lbCoins','lbSouls','bMenu','bShop','bChars','bLore','bNews','bFriends','bClub','bDaily','bPrev','bNext','bPass','bQuests','bCard','bPlay']"
    for (w,h) in [(568,320),(640,360),(740,360),(844,390),(915,412),(1280,720)]:
      await pg.set_viewport_size({'width':w,'height':h});await pg.evaluate('showMenu()');await pg.wait_for_timeout(250)
      ov=await pg.evaluate("""()=>{const ids=%s;const r=ids.map(i=>[i,document.getElementById(i).getBoundingClientRect()]);const bad=[];
        for(const[i,a]of r){if(a.left<0||a.top<0||a.right>innerWidth+1||a.bottom>innerHeight+1)bad.push(i+' offscreen');for(const[j,b]of r)if(i<j&&a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1)bad.push(i+'/'+j)}return bad}"""%IDS)
      res.setdefault('lobbyLayout',{})['%dx%d'%(w,h)]=ov
      if (w,h)==(568,320):await pg.screenshot(path=SHOTS+'01d-lobby-small-568x320.png')
      # select screen must scroll to its start button on small screens; X visible
      await pg.evaluate('showSetup()');await pg.wait_for_timeout(150)
      sc=await pg.evaluate("""()=>{const u=document.getElementById('ui'),g=document.getElementById('go');g.scrollIntoView();const r=g.getBoundingClientRect(),x=document.getElementById('bX').getBoundingClientRect();return {scrollable:u.scrollHeight>u.clientHeight,goVisible:r.bottom<=innerHeight+1&&r.top>=0,x:x.top>=0&&x.left>=0}}""")
      assert sc['goVisible'] and sc['x'],'setup scroll %dx%d %s'%(w,h,sc)
      res.setdefault('setupScroll',{})['%dx%d'%(w,h)]=sc
      if (w,h)==(568,320):
        await pg.evaluate("document.getElementById('ui').scrollTop=0");await pg.screenshot(path=SHOTS+'02b-select-small-568x320.png')
      await toLobby('setup')
    await pg.set_viewport_size({'width':844,'height':390})
    await pg.evaluate("()=>{SET.side='s';showMenu()}");await pg.wait_for_timeout(300);await pg.screenshot(path=SHOTS+'01-lobby-survivor.png')
    # --- lobby backgrounds: buy, equip, persist across reload, screenshot each
    await pg.evaluate("()=>{PROF.coins=400;PROF.owned=[];PROF.bg='parlor';saveProf();showMenu();showShop('bg')}")
    await pg.wait_for_timeout(400);await pg.screenshot(path=SHOTS+'01e-shop-backgrounds.png',full_page=True)
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
    # ranked mode: trophies change by result and persist
    tr=await pg.evaluate("""()=>{const out=[];for(const [side,win] of [['s',true],['s',false],['k',true],['k',false]]){PROF.tro=100;SET.mode='ranked';const G=WP.start({side,surv:'nora',killer:'stitches',map:'mansion',diff:1,seed:11,mode:'ranked'});
      const P=G.player;if(side==='s'){P.st=win?'out':'dead';G.result={winner:win?'survivors':'killer',kills:win?0:4,esc:win?1:0}}else{G.surv.forEach((s,i)=>s.st=win||i<1?'dead':'out');G.result={winner:win?'killer':'survivors',kills:win?4:1,esc:win?0:3}}
      G.over=true;const t0=PROF.tro;showEnd(G);out.push([side,win,PROF.tro-t0,JSON.parse(localStorage.getItem('twp_prof')).tro])}SET.mode='normal';WP.G=null;return out}""")
    res['ranked']=tr
    for side,win,d,saved in tr:assert (d>0)==win and saved==100+d,'ranked trophies '+str(tr)
    nt=await pg.evaluate("()=>{PROF.tro=100;const G=WP.start({side:'s',surv:'nora',map:'mansion',diff:1,seed:11,mode:'normal'});G.player.st='out';G.result={winner:'survivors',kills:0,esc:4};G.over=true;showEnd(G);WP.G=null;return PROF.tro}")
    assert nt==100,'normal mode keeps trophies';await pg.evaluate("()=>{PROF.tro=0;saveProf();showMenu()}")
    # nav arrows exist for both sides
    na=await pg.evaluate("""()=>{const r={};for(const side of['s','k'])for(const mp of['mansion','village','ship']){const G=WP.start({side,surv:'nora',killer:'stitches',map:mp,diff:1,seed:21});const T=navTargets(G,G.player);r[side+'-'+mp]=T.map(t=>t.kind+(t.via?'@'+t.via.name:''))}WP.G=null;return r}""")
    res['navTargets']=na
    for k,v in na.items():assert v and (('gen' in ''.join(v)) if k[0]=='s' else ('hook' in ''.join(v))),'nav '+k
    # Android back/pause hooks
    await pg.evaluate('showMenu()');await pg.click('#bShop');assert await pg.evaluate('WP.onBack()');assert await pg.evaluate(LOBBY),'back from shop'
    await pg.evaluate('showSetup()');assert await pg.evaluate('WP.onBack()');assert await pg.evaluate(LOBBY),'back from setup'
    assert await pg.evaluate('WP.onBack()')==False,'back in lobby exits'
    await pg.evaluate("()=>WP.start({side:'s',surv:'nora',map:'mansion',diff:1,seed:3})");await pg.evaluate('WP.onPause()');assert await pg.evaluate('IN.paused'),'onPause pauses'
    assert await pg.evaluate('WP.onBack()') and not await pg.evaluate('IN.paused'),'back resumes'
    await pg.evaluate("()=>{WP.G=null;showMenu()}");res['androidHooks']=True
    await pg.evaluate("()=>{SET.side='s';SET.surv='nora';showMenu()}");await pg.click('#bPlay');await pg.wait_for_timeout(300);assert await pg.evaluate('!!WP.G&&WP.G.player.def.id==="nora"')
    await pg.evaluate("()=>{WP.G=null;showMenu()}");await pg.wait_for_timeout(200)
    await pg.evaluate('showSetup()');await pg.wait_for_timeout(200);await pg.screenshot(path=SHOTS+'02-setup-survivor.png')
    await pg.click('#sK');await pg.wait_for_timeout(200);await pg.screenshot(path=SHOTS+'03-setup-killer.png')
    await pg.click('#bX')
    # --- live gameplay smoke: each killer as player, each survivor as player, every map; bots drive the rest for a while
    live=[]
    for side,ch in [('k','stitches'),('k','bride'),('k','rotjaw'),('k','shepherd'),('k','oni'),('s','nora'),('s','tyler'),('s','ruth'),('s','sam'),('s','victor'),('s','ethan'),('s','lily')]:
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
    # in-match navigation arrows (survivor: gens + teammates, with stair hint; killer: nearest hook)
    await pg.evaluate("()=>{const G=WP.start({side:'s',surv:'nora',killer:'stitches',map:'mansion',diff:1,seed:5});G.killer.bot=null;G.killer.f=4;const P=G.player;P.f=0;placeNear(G,P,cc(8),cc(20),0);for(const g of G.M.gens)if(g.f===0)g.done=true;}")
    await pg.wait_for_timeout(900);await pg.screenshot(path=SHOTS+'14a-arrows-survivor-stairs.png')
    await pg.evaluate("()=>{const G=WP.start({side:'s',surv:'tyler',killer:'bride',map:'ship',diff:1,seed:8});G.killer.bot=null;G.killer.f=2;}")
    await pg.wait_for_timeout(900);await pg.screenshot(path=SHOTS+'14b-arrows-survivor-ship.png')
    await pg.evaluate("()=>{const G=WP.start({side:'k',killer:'rotjaw',map:'village',diff:1,seed:8});const K=G.player,s=G.surv[0];for(const o of G.surv)o.bot=null;s.st='down';s.hp=0;K.f=s.f;placeNear(G,K,s.x+20,s.y,s.f);K.carry=s;s.carrier=K;s.wig=0;s.st='carried';}")
    await pg.wait_for_timeout(900);await pg.screenshot(path=SHOTS+'14c-arrows-killer-hook.png')
    # hooks layout: gallows cluster in game
    for mp in ['mansion','village','ship']:
      await pg.evaluate("()=>{const G=WP.start({side:'k',killer:'stitches',map:'%s',diff:1,seed:4});const K=G.player,h=G.M.hooks.find(h=>h.right)||G.M.hooks[0];for(const o of G.surv){o.bot=null;o.f=(h.f+1)%%G.M.floors.length}K.f=h.f;placeNear(G,K,h.x+20,h.y+60,h.f);K.face=-Math.PI/2;}"%mp)
      await pg.wait_for_timeout(700);await pg.screenshot(path=SHOTS+'15-hooks-%s.png'%mp)
      await pg.evaluate("()=>{const G=WP.start({side:'s',surv:'nora',killer:'stitches',map:'%s',diff:1,seed:4});G.killer.bot=null;G.killer.f=(G.M.gens[1].f+1)%%G.M.floors.length;const P=G.player,g=G.M.gens[1];for(const o of G.surv)if(o!==P)o.bot=null;placeNear(G,P,g.x,g.y+50,g.f);}"%mp)
      await pg.wait_for_timeout(700);await pg.screenshot(path=SHOTS+'16-gens-%s.png'%mp)
    # ---- v0.1.1 features: stamina, lockers, tracks, chase, last chance, weather
    async def shot(js,name,wait=700):
      await pg.evaluate(js);await pg.wait_for_timeout(wait);await pg.screenshot(path=SHOTS+name)
    W0="WP.forceWeather='clear';WP.forceBlackout=-1;"
    await shot("()=>{"+W0+"const G=WP.start({side:'s',surv:'tyler',killer:'stitches',map:'village',diff:1,seed:6});G.killer.bot=null;G.killer.f=1;const P=G.player;P.bot=null;P.stam=0.42;P.stamCd=0;P.in.run=true;IN.keys.add('ShiftLeft');IN.keys.add('KeyD');}",'17a-stamina-bar-sprint.png',900)
    await pg.evaluate("()=>{IN.keys.clear()}")
    await shot("()=>{"+W0+"const G=WP.start({side:'s',surv:'nora',killer:'bride',map:'mansion',diff:1,seed:6});G.killer.bot=null;const P=G.player,L=G.M.lockers.find(l=>l.f===P.f)||G.M.lockers[0];P.f=L.f;placeNear(G,P,L.x,L.y+T,L.f);G.killer.f=L.f;placeNear(G,G.killer,L.x+90,L.y+60,L.f);}",'18a-locker-near.png')
    await shot("()=>{const G=WP.G,P=G.player,L=G.M.lockers.find(l=>l.f===P.f&&dist(l,P)<60);enterLocker(G,P,L);P.actLatch=true;}",'18b-locker-hidden-view.png')
    await shot("()=>{"+W0+"const G=WP.start({side:'k',killer:'stitches',map:'mansion',diff:1,seed:7});const K=G.player,L=G.M.lockers[1],s=G.surv[0];for(const o of G.surv)o.bot=null;enterLocker(G,s,L);K.f=L.f;placeNear(G,K,L.x,L.y+T,L.f);K.face=-Math.PI/2;searchLocker(G,K,L);}",'18c-locker-killer-pulls-out.png',300)
    await shot("()=>{"+W0+"const G=WP.start({side:'k',killer:'rotjaw',map:'village',diff:1,seed:9});const K=G.player,s=G.surv[0];for(const o of G.surv){o.bot=null}s.f=K.f;placeNear(G,s,K.x+40,K.y,K.f);s.hp=60;s.in.run=true;s.in.mx=1;s.stam=1;K.blind=99;}",'19a-tracks-killer-only.png',1400)
    await pg.evaluate("()=>{WP.G.player.blind=0}")
    await shot("()=>{"+W0+"const G=WP.start({side:'s',surv:'sam',killer:'oni',map:'mansion',diff:1,seed:5});const P=G.player,K=G.killer;K.bot=null;K.f=P.f;placeNear(G,K,P.x-70,P.y,P.f);K.in.mx=1;K.in.run=true;P.bot=mkBot(P,G);}",'20a-chase-red-edges.png',1500)
    await shot("()=>{"+W0+"const G=WP.start({side:'s',surv:'lily',killer:'stitches',map:'mansion',diff:1,seed:5});G.killer.bot=null;G.killer.f=4;const gs=G.M.gens.slice(0,G.needGens);for(const g of gs){g.done=true;g.p=1}G.gensDone=G.needGens;G.powered=true;G.collapse=150;G.collapseBy='gates';startLastChance(G);const P=G.player,g=G.M.gates[0];P.f=g.f;placeNear(G,P,g.x,g.y+70,g.f);}",'21-last-chance-gates.png',900)
    for w,name in [('fog','22a-weather-fog.png'),('storm','22b-weather-storm.png')]:
      await shot("()=>{WP.forceWeather='%s';WP.forceBlackout=-1;const G=WP.start({side:'s',surv:'ethan',killer:'shepherd',map:'village',diff:1,seed:8});G.killer.bot=null;G.killer.f=1;}"%w,name,900)
    await shot("()=>{WP.G.flashT=0.2}",'22c-weather-lightning-flash.png',30)
    await shot("()=>{WP.forceWeather='clear';WP.forceBlackout=0;const G=WP.start({side:'s',surv:'ruth',killer:'bride',map:'mansion',diff:1,seed:8});G.killer.bot=null;G.killer.f=4;const P=G.player;P.f=1;placeNear(G,P,cc(20),cc(14),1);}",'22d-event-blackout.png',900)
    await pg.evaluate("()=>{WP.forceWeather=null;WP.forceBlackout=null;WP.G=null}")
    # ---- new characters: lobby + in match
    for side,ch in [('k','shepherd'),('k','oni'),('s','ethan'),('s','lily')]:
      await pg.evaluate("()=>{SET.side='%s';SET.%s='%s';showMenu()}"%(side,'killer' if side=='k' else 'surv',ch));await pg.wait_for_timeout(500);await pg.screenshot(path=SHOTS+'23-lobby-%s.png'%ch)
      await shot("()=>{WP.forceWeather='clear';WP.forceBlackout=-1;const o={side:'%s',map:'mansion',diff:1,seed:12};if(o.side==='k'){o.killer='%s'}else{o.surv='%s';o.killer='oni'}const G=WP.start(o);const P=G.player;if(P.side==='k'){const s=G.surv[0];for(const q of G.surv)q.bot=null;s.f=P.f;placeNear(G,s,P.x+70,P.y+30,P.f)}else{const K=G.killer;K.bot=null;K.f=P.f;placeNear(G,K,P.x+80,P.y,P.f)}}"%(side,ch,ch),'24-match-%s.png'%ch,800)
    await shot("()=>{const G=WP.G,P=G.player;P.aim={i:0,ang:0};}",'24-match-lily-whistle-aim.png',200)
    # ---- Oni abilities
    ON="()=>{WP.forceWeather='clear';WP.forceBlackout=-1;const G=WP.start({side:'k',killer:'oni',map:'village',diff:1,seed:21});const K=G.player;for(const q of G.surv)q.bot=null;K.f=0;placeNear(G,K,cc(20),cc(12),0);const s=G.surv[0];s.f=0;placeNear(G,s,cc(25),cc(12),0);"
    await shot(ON+"K.aim={i:0,ang:0};}",'25a-oni-totem-aim.png',500)
    await shot("()=>{const G=WP.G,K=G.player,s=G.surv[0];K.aim=null;castAbility(G,K,0,0);s.x=G.totems[0].x+20;s.y=G.totems[0].y+10;}",'25b-oni-totem-curse.png',900)
    await shot("()=>{const G=WP.G,K=G.player,s=G.surv[0];placeNear(G,s,cc(5),cc(6),0);placeNear(G,K,cc(13),cc(7),0);}",'25c-oni-curse-through-walls.png',600)
    await shot("()=>{const G=WP.G,K=G.player;K.cd[0]=0;castAbility(G,K,0,Math.PI);K.cd[0]=0;K.aim={i:3,ang:-2.4};}",'25d-oni-teleport-aim.png',400)
    await shot("()=>{const G=WP.G,K=G.player;K.aim=null;K.tpPick=G.totems[0];castAbility(G,K,3,0);}",'25e-oni-teleport-anim.png',700)
    await pg.wait_for_timeout(800)
    await shot(ON+"s.x=K.x+120;s.y=K.y;K.aim={i:1,ang:0};}",'25f-oni-slash-aim.png',500)
    await shot("()=>{const G=WP.G,K=G.player;K.aim=null;castAbility(G,K,1,0);}",'25g-oni-slash-hit.png',180)
    await shot(ON+"for(const q of G.surv){q.f=0;placeNear(G,q,cc(14+q.id*3),cc(16),0)}K.aim={i:2,ang:0.3};}",'25h-oni-souls-aim.png',500)
    await shot("()=>{const G=WP.G,K=G.player;K.aim=null;castAbility(G,K,2,0.3);}",'25i-oni-souls-summon.png',600)
    await shot("()=>{}",'25j-oni-souls-hunt.png',2600)
    await shot("()=>{WP.forceWeather='clear';WP.forceBlackout=-1;const G=WP.start({side:'s',surv:'nora',killer:'oni',map:'village',diff:1,seed:21});const K=G.killer;K.bot=null;const P=G.player;K.f=P.f;placeNear(G,K,P.x+90,P.y,P.f);K.cd[0]=0;castAbility(G,K,0,Math.atan2(P.y-K.y,P.x-K.x));}",'25k-oni-totem-survivor-view.png',900)
    await pg.evaluate("()=>{SET.side='k';SET.killer='oni';showMenu()}");await pg.wait_for_timeout(500);await pg.screenshot(path=SHOTS+'25l-lobby-oni-abilities.png')
    await pg.evaluate("()=>{WP.G.player.aim=null}")
    await shot("()=>{WP.forceWeather='clear';WP.forceBlackout=-1;const G=WP.start({side:'k',killer:'shepherd',map:'mansion',diff:1,seed:12});const P=G.player;for(const q of G.surv)q.bot=null;const s=G.surv[0];s.f=P.f;placeNear(G,s,P.x+70,P.y,P.f);P.aim={i:0,ang:0};castAbility(G,P,1,Math.PI/2);}",'24-match-shepherd-bell-aim-sheep.png',300)
    await pg.evaluate("()=>{WP.forceWeather=null;WP.forceBlackout=null;WP.G=null;SET.side='s';SET.surv='nora';SET.killer='stitches'}")
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
    for mp in ['mansion','village','ship']:
      for k in ['shepherd','oni']:
        sims+=await pg.evaluate("""([k,mp])=>{const out=[];for(let i=0;i<50;i++){const r=WP.sim({killer:k,seed:9000+i,map:mp});out.push({k,d:1,map:mp,nk:1,over:r.over,time:r.time,res:r.result,gens:r.gens,gates:r.gatesOpened,stuck:r.stuck,nan:r.nan,clip:r.wallClip,xf:r.crossFloor,ev:r.ev,dither:r.dither,kf:r.killerFloors,sf:r.survFloors,cb:r.collapseBy,log:r.mapLog})}return out}""",[k,mp])
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
    out={'lobbyLayout':res['lobbyLayout'],'setupScroll':res['setupScroll'],'xClose':len(res['xClose']),'ranked':res['ranked'],'navTargets':res['navTargets'],'shopTabs':res['shopTabs'],'daily':res['dailyClaim'],'season':res['seasonClaim'],'errors':errs,'live':live,'touchMoved':res['touchMoved'],'aim':res['aim'],'ropePulledInLive':res['ropePulledInLive'],'simSeconds':res['simSeconds'],'scenarios':{k:v['ok'] for k,v in res['scenarios'].items()}}
    for k in ['stitches','bride','rotjaw']:
      for d in [0,1,2]:out['mansion-%s-d%d'%(k,d)]=summ([r for r in sims if r['k']==k and r['d']==d and 'map' not in r])
    for mp in ['village','ship']:out[mp]=summ([r for r in sims if r.get('map')==mp and not r.get('nk')])
    for k in ['shepherd','oni']:
      for mp in ['mansion','village','ship']:out['new-%s-%s'%(k,mp)]=summ([r for r in sims if r.get('nk') and r['k']==k and r['map']==mp])
    out['stuckSamples']=[s for r in sims for s in r['stuck']][:10]
    print(json.dumps(out,ensure_ascii=False,indent=1))
    await b.close()
asyncio.run(main())
