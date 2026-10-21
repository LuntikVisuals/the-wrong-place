/* ===== f_update: simulation step (same code for player and bots) ===== */
function entSpeed(G,e){
 if(e.side==='k'){let v=e.def.speed*STAM.k.walkMul*((TUNE[G.M.kind]||{})[e.def.id]||1)*herdMul(G,e)*(G.powered?1.1:1);if(e.sprint)v*=STAM.k.mul;if(e.carry)v*=0.88;if(e.buff.rip>0)v*=1.35;if(e.wipe>0)v*=0.35;if(e.blind>0)v*=0.7;if(e.lunge>0)v*=1.9;return v}
 if(e.st==='down')return 22;
 let v=STAM.s.walk*(e.def.small?1.05:1);if(e.sprint)v*=STAM.s.mul*(e.hp<e.maxhp?STAM.s.hurt:1);if(e.prone)v=32;if(e.burst>0)v*=1.45;if(e.buff.sprint>0)v*=1.6;if(e.slow>0)v*=0.35;if(e.tslow>0)v*=ONI.slowMul;if(e.inGap)v=Math.min(v,48);return v;
}
function moveEnt(G,e,dx,dy){
 const M=G.M,k=e.side,f=e.f;
 const tryAxis=(ax,d)=>{if(!d)return true;const nx=ax?e.x:e.x+d,ny=ax?e.y+d:e.y;if(circleFree(M,f,nx,ny,e.r,k)){e.x=nx;e.y=ny;return true}
  // corner assist: slide toward the centre of the current tile on the other axis
  if(ax===0){const cy=cc(tc(e.y)),n=clamp(cy-e.y,-1.5,1.5);if(n&&circleFree(M,f,e.x,e.y+n,e.r,k))e.y+=n}else{const cx=cc(tc(e.x)),n=clamp(cx-e.x,-1.5,1.5);if(n&&circleFree(M,f,e.x+n,e.y,e.r,k))e.x+=n}return false};
 const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/6));
 for(let i=0;i<steps;i++){tryAxis(0,dx/steps);tryAxis(1,dy/steps)}
}
function startClimb(G,e,s){e.climb={t:0,dur:0.42,s,fx:e.x,fy:e.y};e.act=null;e.lunge=0;sfxAt(G,e,'stair');}
function step(G,dt){
 if(G.over)return;G.t+=dt;const M=G.M,K=G.killer;
 for(const e of G.ents){
  for(let i=0;i<e.cd.length;i++)if(e.cd[i]>0)e.cd[i]=Math.max(0,e.cd[i]-dt);
  for(const b in e.buff)if(e.buff[b]>0)e.buff[b]-=dt;
  e.stun=Math.max(0,e.stun-dt);e.blind=Math.max(0,e.blind-dt);e.slow=Math.max(0,e.slow-dt);e.burst=Math.max(0,e.burst-dt);e.wipe=Math.max(0,e.wipe-dt);e.stairCd=Math.max(0,e.stairCd-dt);e.hitT=Math.max(0,e.hitT-dt);e.lunge=Math.max(0,e.lunge-dt);
 }
 for(const g of M.gens)g.boost=Math.max(0,g.boost-dt);
 for(const L of M.lockers||[])L.openT=Math.max(0,L.openT-dt);updWeather(G,dt);updTracks(G);updChars2(G,dt);
 for(const e of G.ents)if(e.bot&&!(e.side==='s'&&(e.st==='dead'||e.st==='out')))botThink(G,e,dt);
 for(const e of G.ents)updateEnt(G,e,dt);
 separate(G);
 updateProj(G,dt);
 // generators
 for(const g of M.gens){g.users=0;g.noise=Math.max(0,g.noise-dt)}
 for(const s of G.surv)if(s.act&&s.act.type==='repair'&&s.st==='ok'){const g=s.act.target;g.users++}
 for(const g of M.gens){if(g.done)continue;
  if(g.users){g.regress=false;let rate=[0,1,1.75,2.4,3][Math.min(4,g.users)]/60;if(g.boost>0)rate*=2;rate*=G.M.genMul||1;
   if(K.def.id==='bride'&&K.f===g.f&&dist(K,g)<170&&K.vanish<=0)rate*=0.7;
   for(const s of G.surv)if(s.act&&s.act.target===g&&s.item==='toolbox'&&s.itemCharge>0){rate*=1.25;s.itemCharge-=dt;if(s.itemCharge<=0){s.item=null}break}
   g.p+=rate*dt;g.noise=1;if(!G.sim&&Math.random()<dt*6){G.fx.push({f:g.f,x:g.x+fr(-10,10),y:g.y-22,vx:fr(-80,80),vy:fr(-120,-20),t:fr(0.2,0.5),col:Math.random()<0.5?'#ffe070':'#fff',sz:2,g:300,spark:true});if(Math.random()<0.3)sfxAt(G,g,'spark',200)}
   if(g.p>=1){g.p=1;g.done=true;G.gensDone++;for(const s of G.surv)if(s.act&&s.act.target===g){s.act=null;s.stats.gens++}
    say(G,'Генератор запущен ('+G.gensDone+'/'+G.needGens+')','#ffe080');if(!G.sim)AU.sfx('gen');
    if(G.gensDone>=G.needGens&&!G.powered){G.powered=true;startLastChance(G);G.collapse=150;G.collapseBy='gates';say(G,'Ворота под напряжением! Бегите!','#a0ffa0');if(!G.sim)AU.sfx('gate')}}
  } else if(g.regress){g.p=Math.max(0,g.p-dt/300);if(g.p<=0)g.regress=false}
 }
 // hooks
 for(const h of M.hooks){if(h.ghost>0)h.ghost-=dt;const v=h.victim;if(!v)continue;v.hookT-=dt;if(v.hookT<=0){h.victim=null;v.st='dead';G.ev.kills++;h.ghost=1.5;say(G,'Хозяин забрал '+v.def.name,'#ff5050')}}
 // collapse / safety timer (guarantees every match ends)
 if(G.collapse<0&&G.t>720){G.collapse=60;G.collapseBy='timer';say(G,'Хозяин теряет терпение…','#ff6060')}
 if(G.collapse>=0){G.collapse-=dt;if(G.collapse<=0){for(const s of G.surv)if(aliveS(s)){if(s.locker){s.locker.occ=null;s.locker=null}if(s.carrier){s.carrier.carry=null;s.carrier=null}for(const h of M.hooks)if(h.victim===s)h.victim=null;s.st='dead';G.ev.kills++;s.collapsed=true}G.collapse=0}}
 // escape
 for(const s of G.surv)if(s.st==='ok'&&!s.climb&&s.f===M.gates[0].f){for(const g of M.gates)if(g.open&&g.tiles.some(([x,y])=>tc(s.x)===x&&tc(s.y)===y)){s.st='out';G.ev.escapes++;say(G,s.def.name+' сбежал(а)!','#a0ffa0')}}
 // end
 if(G.surv.every(s=>s.st==='dead'||s.st==='out')){G.over=true;const k=G.surv.filter(s=>s.st==='dead').length;G.result={kills:k,escapes:G.surv.length-k,time:G.t,winner:k>=3?'killer':k<=1?'survivors':'draw'}}
 // invariants
 for(const e of G.ents){if(!isFinite(e.x)||!isFinite(e.y)){WP.dbg.nan++;e.x=cc(5);e.y=cc(5)}
  if((e.side==='k'||e.st==='ok'||e.st==='down')&&!e.climb&&!(e.act&&e.act.type==='vault')&&!e.pull&&!e.pounce&&!circleFree(M,e.f,e.x,e.y,e.r-2,e.side)){WP.dbg.wallClip++;if(WP.dbg.clipInfo)WP.dbg.clipInfo.push([G.M.kind,e.side,e.def.id,e.st,e.f,(e.x/T).toFixed(2),(e.y/T).toFixed(2),e.act&&e.act.type,e.stun,G.t.toFixed(1),G.M.floors[e.f].blk[idx(Math.floor(e.x/T),Math.floor(e.y/T))],e.downT&&e.downT.toFixed(2),G.M.furn.filter(u=>u.f===e.f&&Math.hypot(u.x-e.x,u.y-e.y)<50).map(u=>u.state+u.anim.toFixed(2)+u.kind)]);placeNear(G,e,e.x,e.y,e.f)}}
 if(!G.sim)updFx(G,dt);
}
function updateEnt(G,e,dt){
 const M=G.M;
 if(e.side==='s'){
  if(e.st==='dead'||e.st==='out')return;
  if(e.st==='hooked'){e.walk+=dt;return}
  if(e.st==='down'){e.downT+=dt;if(e.downT>=120){e.st='dead';G.ev.kills++;G.ev.bleedouts=(G.ev.bleedouts||0)+1;say(G,e.def.name+' истёк(ла) кровью','#ff5050');return}}
  if(e.st==='hidden'){updHidden(G,e,dt);return}
  if(e.st==='carried'){const c=e.carrier;e.x=c.x;e.y=c.y;e.f=c.f;if(!c.climb){e.wig+=dt/((e.isPlayer&&e.in.act)?11:17);if(e.wig>=1)dropCarried(G,c,true)}return}
 }
 if(e.climb){e.climb.t+=dt;if(e.climb.t>=e.climb.dur){const s=e.climb.s.to;e.f=s.f;e.x=cc(s.ax);e.y=cc(s.ay);e.stairCd=0.6;e.climb=null;e.stats.stairs++;G.ev.stairs++;e.stats.floors.add(e.f);if(e.carry)e.carry.f=e.f;if(e.bot)e.bot.path=null}return}
 if(e.side==='k'){
  if(e.vanish>0){e.vanish-=dt;if(e.vanish<=0){const tg=e.vanishTarget;if(tg&&tg.st==='ok'&&tg.f===e.f){placeNear(G,e,tg.x-Math.cos(tg.face)*34,tg.y-Math.sin(tg.face)*34,e.f);e.face=Math.atan2(tg.y-e.y,tg.x-e.x);if(!G.sim&&tg.isPlayer)AU.beat(1)}e.vanishTarget=null;if(e.bot)e.bot.path=null}return}
  if(e.tp){updTp(G,e,dt);return}
  if(e.pounce){const p=e.pounce,pd=p.d;p.d=Math.min(p.tr.len,p.d+p.speed*dt);const ca=Math.cos(p.tr.ang),sa=Math.sin(p.tr.ang);e.x=p.tr.x0+ca*p.d;e.y=p.tr.y0+sa*p.d;e.face=p.tr.ang;
   for(const s of G.surv)if(s.f===e.f&&s.st==='ok'&&!s.climb&&dist(e,s)<e.r+s.r+4){damage(G,s,p.slash?HIT_DMG:s.hp,e);p.hit=true;if(p.slash){fxBurst(G,s,'#78ff90',14);shakeAt(G,s,8)}break}
   if(p.hit||p.d>=p.tr.len){e.pounce=null;e.wipe=p.hit?1.2:0.7;if(!circleFree(M,e.f,e.x,e.y,e.r,'k'))placeNear(G,e,e.x,e.y,e.f)}return}
 } else if(e.pull){const p=e.pull;p.t+=dt;const k=Math.min(1,p.t/p.dur);e.x=lerp(p.sx,p.tx,k);e.y=lerp(p.sy,p.ty,k);if(k>=1){e.pull=null;if(!circleFree(M,e.f,e.x,e.y,e.r,'s'))placeNear(G,e,e.x,e.y,e.f)}return}
 if(e.stun>0){endAct(e);e.moving=false;return}
 if(e.in.cast){const c=e.in.cast;e.in.cast=null;castAbility(G,e,c.i,c.ang)}
 // ---- actions ----
 if(e.act){const a=e.act;
  if(a.type==='vault'){a.t+=dt;const k=Math.min(1,a.t/a.dur);e.x=lerp(a.sx,a.tx,k);e.y=lerp(a.sy,a.ty,k);if(k>=1){e.act=null;G.ev.vaults++}return}
  if(HOLD[a.type]){const still=e.in.act&&interactOptions(G,e).some(o=>o.type===a.type&&o.target===a.target);if(!still){e.act=null}else{
   a.t+=dt;e.moving=false;
   if(a.type==='heal'){a.target.hp=Math.min(a.target.maxhp,a.target.hp+dt*9);if(a.target.hp>=a.target.maxhp){e.act=null;G.ev.heals++}}
   else if(a.type==='medkit'){const h=Math.min(dt*12,e.itemCharge);e.hp=Math.min(e.maxhp,e.hp+h);e.itemCharge-=h;if(e.itemCharge<=0)e.item=null;if(e.hp>=e.maxhp||!e.item){e.act=null;G.ev.heals++}}
   else if(a.type==='repair'){}
   else if(a.t>=a.dur){e.act=null;finishAction(G,e,a)}
   if(a.type==='gate')a.target.prog=a.t/a.dur;return}}
  else{a.t+=dt;e.moving=false;if(a.t>=a.dur){e.act=null;finishAction(G,e,a)}return}
 }
 if(e.in.act&&!e.actLatch){const opts=interactOptions(G,e);if(opts.length){const o=opts[0];
   if(o.type==='vault'){const vt=vaultTarget(G,e,o.target);if(vt){e.act={type:'vault',t:0,dur:0.55,sx:e.x,sy:e.y,tx:vt.x,ty:vt.y,target:o.target};e.face=Math.atan2(vt.y-e.y,vt.x-e.x);e.prone=false}}
   else{e.act={type:o.type,target:o.target,t:0,dur:o.dur||0};if(o.target&&o.target.x!=null&&o.target!==e)e.face=Math.atan2(o.target.y-e.y,o.target.x-e.x)}
   if(!HOLD[o.type]&&e.isPlayer)e.actLatch=true;if(e.side==='s'&&o.type==='repair')e.prone=false;return}}
 if(!e.in.act)e.actLatch=false;
 // ---- combat & abilities ----
 if(e.side==='k'&&e.in.atk){e.in.atk=false;if(!e.lunge&&e.wipe<=0&&!e.carry&&e.blind<1.5){e.lunge=0.3;e.lungeHit=false;sfxAt(G,e,'swing')}}
 if(e.side==='k'&&e.lunge>0&&!e.lungeHit){const a=attackShape(e);for(const s of G.surv)if(s.f===e.f&&s.st==='ok'&&!s.climb&&Math.hypot(s.x-a.x,s.y-a.y)<a.r+s.r&&los(M,e.f,e.x,e.y,s.x,s.y)){damage(G,s,HIT_DMG,e);e.lungeHit=true;e.lunge=0;e.wipe=1.5;shakeAt(G,e,4);break}
  if(!e.lungeHit&&e.lunge<=dt)e.wipe=0.6}
 // ---- movement ----
 let mx=e.in.mx,my=e.in.my;const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml}
 if(e.side==='k'&&e.lunge>0){mx=Math.cos(e.face);my=Math.sin(e.face)}
 const t0=M.floors[e.f].g[idx(tc(e.x),tc(e.y))];e.inGap=t0===TI.GAP;
 updStamina(e,dt,!!(mx||my));
 const sp=entSpeed(G,e),ox=e.x,oy=e.y;
 if(mx||my){moveEnt(G,e,mx*sp*dt,my*sp*dt);if(!(e.side==='k'&&e.lunge>0)&&!e.aim)e.face=Math.atan2(my,mx)}
 if(e.aim)e.face=e.aim.ang;
 const moved=Math.hypot(e.x-ox,e.y-oy);e.moving=moved>0.05;e.walk+=moved*(e.sprint?0.11:0.09);
 if(e.side==='s'&&e.sprint&&e.moving&&!G.sim)addTrack(G,e,dt);
 if(e.sprint&&e.moving&&!G.sim){e.dustT=(e.dustT||0)-dt;if(e.dustT<=0){e.dustT=0.07;const bk=Math.atan2(oy-e.y,ox-e.x);for(let i=0;i<2;i++)G.fx.push({f:e.f,x:e.x+Math.cos(bk)*6+fr(-4,4),y:e.y-1+fr(-2,2),vx:Math.cos(bk)*fr(10,40)+fr(-15,15),vy:fr(-28,-6),t:fr(0.3,0.55),col:i?'#8a7a64':'#a8987e',sz:fr(2,4),g:30})}}
 // stairs
 const ti=idx(tc(e.x),tc(e.y));if(M.floors[e.f].g[ti]===TI.STAIR&&e.stairCd<=0){const s=M.stairAt[e.f].get(ti);if(s&&(e.isPlayer||(e.bot&&e.bot.stair===s)))startClimb(G,e,s)}
 // blood trail
 if(e.side==='s'&&((e.st==='ok'&&e.hp<e.maxhp*0.75)||e.st==='down')){e.bleedT-=dt;if(e.bleedT<=0){e.bleedT=e.moving?0.4:1.4;bleed(G,e,0,false)}}
}
function updateProj(G,dt){
 for(let i=G.proj.length-1;i>=0;i--){const p=G.proj[i],o=p.owner;
  if(p.back){p.d-=p.speed*dt;if(p.d<=0)G.proj.splice(i,1);continue}
  const pd=p.d;p.d=Math.min(p.tr.len,p.d+p.speed*dt);const ca=Math.cos(p.tr.ang),sa=Math.sin(p.tr.ang);
  const sub={x0:p.tr.x0+ca*pd,y0:p.tr.y0+sa*pd,x1:p.tr.x0+ca*p.d,y1:p.tr.y0+sa*p.d};
  let hit=o.f===p.f&&p.kind!=='whistle'?traceHit(G,{f:p.f},sub,p.w):null;
  if(hit){
   if(p.kind==='rope'){const tx=o.x+Math.cos(p.tr.ang)*(o.r+hit.r+6),ty=o.y+Math.sin(p.tr.ang)*(o.r+hit.r+6);hit.pull={sx:hit.x,sy:hit.y,tx,ty,t:0,dur:0.45};hit.stun=0.7;endAct(hit);G.ev.pulls++;bleed(G,hit,6,false);sfxAt(G,hit,'hit');p.back=true;p.d=Math.hypot(hit.x-p.tr.x0,hit.y-p.tr.y0)}
   else{hit.slow=3;endAct(hit);G.ev.veils++;fxBurst(G,hit,'#e8f0ff',12);G.proj.splice(i,1)}
   continue}
  if(p.d>=p.tr.len){if(p.kind==='rope')p.back=true;else{if(p.kind==='whistle')landWhistle(G,p);G.proj.splice(i,1)}}
 }
}
function updFx(G,dt){for(let i=G.fx.length-1;i>=0;i--){const p=G.fx[i];p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.g||0)*dt;if(p.t<=0){if(p.blood&&Math.random()<0.4)G.blood.push({f:p.f,x:p.x,y:p.y+12,t:G.t,big:false});G.fx.splice(i,1)}}
 G.shake=Math.max(0,G.shake-dt*20);if(G.flash>0)G.flash-=dt;for(const m of G.msgs)m.t-=dt;G.msgs=G.msgs.filter(m=>m.t>0);for(const fu of G.M.furn)if(fu.state!=='up')fu.anim=Math.min(1,fu.anim+dt*4)}

/* body collision between killer and standing survivors */
function separate(G){const K=G.killer;if(K.climb||K.vanish>0)return;for(const s of G.surv){if(s.st!=='ok'||s.f!==K.f||s.climb||s.pull||s.act&&s.act.type==='vault')continue;
 const dx=s.x-K.x,dy=s.y-K.y,d=Math.hypot(dx,dy),m=K.r+s.r-2;if(d>=m)continue;const nx=d>0.01?dx/d:1,ny=d>0.01?dy/d:0,push=(m-d)/2;
 if(circleFree(G.M,s.f,s.x+nx*push,s.y+ny*push,s.r,'s')){s.x+=nx*push;s.y+=ny*push}if(circleFree(G.M,K.f,K.x-nx*push,K.y-ny*push,K.r,'k')){K.x-=nx*push;K.y-=ny*push}}}
// interrupt any action; an interrupted vault lands on its far side so nobody ends up inside the obstacle
function endAct(e){const a=e.act;if(a&&a.type==='vault'){e.x=a.tx;e.y=a.ty}e.act=null}

function canSprint(e,moving){return !!(e.in.run&&!(e.buff.deaf>0)&&moving&&!e.prone&&!e.inGap&&!e.act&&!e.carry&&!e.climb&&!e.exh&&e.stam>0&&!(e.side==='s'&&e.st!=='ok')&&!(e.side==='k'&&(e.lunge>0||e.stun>0||e.wipe>0)))}
function updStamina(e,dt,moving){const C=STAM[e.side];if(e.stam==null){e.stam=1;e.stamCd=0;e.exh=false}
 if(canSprint(e,moving)){e.sprint=true;e.stam-=dt/C.dur;e.stamCd=C.delay;if(e.stam<=0){e.stam=0;e.exh=true;e.stamCd=C.exDelay;e.sprint=false}}
 else{e.sprint=false;if(e.stamCd>0)e.stamCd-=dt;else e.stam=Math.min(1,e.stam+dt/C.full);if(e.exh&&e.stam>=0.2)e.exh=false}}
