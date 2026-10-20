/* ===== n_boot: canvas, main loop, public API (incl. headless bot-vs-bot simulation for tests) ===== */
function resize(){const cv=R.cv;R.dpr=Math.min(2,window.devicePixelRatio||1);R.W=window.innerWidth;R.H=window.innerHeight;cv.width=Math.round(R.W*R.dpr);cv.height=Math.round(R.H*R.dpr);R.c.imageSmoothingEnabled=false}
let lastTS=0,acc=0;
function frame(ts){requestAnimationFrame(frame);const dt=Math.min(0.1,(ts-lastTS)/1000||0);lastTS=ts;const G=WP.G;if(!G||G.sim)return;
 if(!IN.paused&&!G.over){acc+=dt;let n=0;while(acc>=1/60&&n<6){applyInput(G);step(G,1/60);acc-=1/60;n++}if(n>=6)acc=0}
 else if(G.over&&!G.endShown){G.endT=(G.endT||0)+dt;if(G.endT>1.5){G.endShown=true;showEnd(G)}}
 if(!IN.paused)updFxOnly(G,dt);render(G,IN.paused?0:dt);drawHUD(G)}
function updFxOnly(G,dt){if(G.over)updFx(G,dt)}
/* bot-vs-bot match without rendering; returns stats + invariant violations */
WP.sim=function(o){o=o||{};const ids=Object.keys(SURVS);srand(o.seed||1);const surv=o.surv||shuffle(ids.slice()).slice(0,4);
 const dbg0={...WP.dbg};WP.dbg.crossFloor=0;WP.dbg.nan=0;WP.dbg.wallClip=0;
 const G=newMatch({map:o.map||'mansion',killer:o.killer||'stitches',surv,playerSide:null,diff:o.diff==null?1:o.diff,seed:o.seed||1,sim:true});
 const dt=1/30,maxT=o.maxT||1000;const still=new Map(),win=new Map();const stuck=[],dither=[];const floorsK=new Set();let stairCross=0;
 while(!G.over&&G.t<maxT){step(G,dt);floorsK.add(G.killer.f);
  for(const e of G.ents){const b=e.bot;if(!b)continue;const busy=e.act||e.climb||e.stun>0||e.vanish>0||e.pounce||e.pull||(e.side==='s'&&e.st!=='ok'&&e.st!=='down');
   const p=still.get(e)||{x:e.x,y:e.y,t:0};if(b.moveIntent&&!busy&&Math.hypot(e.x-p.x,e.y-p.y)<0.3)p.t+=dt;else p.t=0;p.x=e.x;p.y=e.y;still.set(e,p);
   if(p.t>8){stuck.push({who:e.def.id,f:e.f,x:Math.round(e.x),y:Math.round(e.y),state:b.state,t:Math.round(G.t)});p.t=0}
   // windowed stall: wanted to move for a whole 20 s window but net displacement < 1 tile
   const w=win.get(e)||{x:e.x,y:e.y,f:e.f,fc:false,t0:G.t,mv:0,tr:0,px:e.x,py:e.y};if(e.f===w.f)w.tr+=Math.hypot(e.x-w.px,e.y-w.py);w.px=e.x;w.py=e.y;if(e.f!==w.f){w.fc=true;w.f=e.f}if(b.moveIntent&&!busy)w.mv+=dt;if(G.t-w.t0>=20){if(w.mv>18&&!w.fc&&Math.hypot(e.x-w.x,e.y-w.y)<T&&!(e.side==='s'&&e.st==='down'))(w.tr<6*T?stuck:dither).push({who:e.def.id,f:e.f,x:Math.round(e.x),y:Math.round(e.y),state:b.state,t:Math.round(G.t),stall:true});w.x=e.x;w.y=e.y;w.t0=G.t;w.mv=0;w.fc=false;w.tr=0}win.set(e,w)}
 }
 const r={seed:o.seed,killer:G.killer.def.id,map:G.M.kind,over:G.over,time:Math.round(G.t),result:G.result,gens:G.gensDone,powered:G.powered,collapseBy:G.collapseBy,
  ev:G.ev,stuck,dither,nan:WP.dbg.nan,crossFloor:WP.dbg.crossFloor,wallClip:WP.dbg.wallClip,killerFloors:[...floorsK],survFloors:G.surv.map(s=>[...s.stats.floors]),
  gatesOpened:G.M.gates.filter(g=>g.open).length,hookedNow:G.M.hooks.filter(h=>h.victim).length,mapLog:WP.dbg.log.slice()};
 WP.G=null;return r};
WP.start=(o)=>{Object.assign(SET,o||{});return startGame(o)};
WP.ready=false;
window.addEventListener('load',()=>{R.cv=document.getElementById('cv');R.c=R.cv.getContext('2d');resize();window.addEventListener('resize',resize);
 R.cv.addEventListener('pointerdown',onDown,{passive:false});window.addEventListener('pointermove',onMove);window.addEventListener('pointerup',onUp);window.addEventListener('pointercancel',onUp);
 window.addEventListener('keydown',e=>onKey(e,true));window.addEventListener('keyup',e=>onKey(e,false));R.cv.addEventListener('contextmenu',e=>e.preventDefault());
 showMenu();requestAnimationFrame(frame);WP.ready=true});
// Android wrapper hooks: system Back = pause/resume in a match, "Назад" in sub-pages, menu after a match; false = let the app close
WP.onBack=()=>{if(WP.G&&!WP.G.over){IN.paused?resumeGame():pauseGame();return true}const bk=document.getElementById('bk');if(bk){bk.click();return true}if(WP.G){WP.G=null;showMenu();return true}return false};
WP.onPause=()=>{if(WP.G&&!WP.G.over&&!IN.paused)pauseGame()};
