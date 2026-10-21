/* ===== h3_oni: Oni abilities — Тотем хранителя, Телепорт к тотему, Рывок, Друзья из прошлого (no passive yet) =====
   Oni is original pixel art (вдохновлено Kenji (Brawl Stars)); totems = own demonic stone idols with green fire. */
KILLERS.oni.soon=false;
KILLERS.oni.desc='Огромный красный демон в самурайских доспехах с двумя зелёными катанами. Ставит тотемы-идолы и зовёт души павших самураев.';
KILLERS.oni.ab=[
 {id:'totem',name:'Тотем',cd:16,kind:'place',range:120,radius:60,desc:'Ставит каменный идол (до 4). Выживший рядом замедлен и проклят на 20 с — Они видит его сквозь стены'},
 {id:'slash',name:'Рывок',cd:15,kind:'dash',range:170,desc:'Рывок вперёд и удар катаной первого выжившего на пути'},
 {id:'souls',name:'Души',cd:90,kind:'place',range:60,radius:320,desc:'Вонзает катану в землю: 5 душ-самураев 60 с ищут и бьют выживших (слабый урон)'},
 {id:'tp',name:'К тотему',cd:40,kind:'target',desc:'Телепорт к выбранному (по направлению) или ближайшему тотему'}];
KILLERS.oni.passive={name:'—',desc:'Пассивной способности пока нет'};
const ONI={totemMax:4,curse:20,slowMul:0.88,soulN:5,soulLife:60,soulSpeed:78,soulDmg:4,soulCd:3,soulMinHp:0.25,tpDur:1.1,off:{},botSameFloor:true};
function pickTotem(G,e,ang){if(e.tpPick&&(G.totems||[]).includes(e.tpPick))return e.tpPick;let best=null,bs=1e9;for(const q of G.totems||[]){const d=Math.hypot(q.x-e.x,q.y-e.y),s=q.f===e.f?Math.abs(angDiff(ang,Math.atan2(q.y-e.y,q.x-e.x)))*260+d*0.25:5000+d+Math.abs(q.f-e.f)*500;if(s<bs){bs=s;best=q}}return best}
function abShape3(G,e,ab,ang){switch(ab.id){
 case'totem':{const tr=traceLine(G,e,ang,ab.range,10);return{type:'place',tr,r:ab.radius,ab,col:'#58e070'}}
 case'slash':{const tr=traceLine(G,e,ang,ab.range,e.r);return{type:'dash',tr,hit:traceHit(G,e,tr,e.r),ab}}
 case'souls':{const tr=traceLine(G,e,ang,ab.range,10);return{type:'place',tr,r:ab.radius,ab,col:'#78ffb0',souls:true}}
 case'tp':{const q=pickTotem(G,e,ang);return{type:'tp',x:e.x,y:e.y,target:q,ab}}}return null}
function cast3(G,e,sh){const ab=sh.ab;switch(ab.id){
 case'totem':{const T2=G.totems=G.totems||[];const q={f:e.f,x:sh.tr.x1,y:sh.tr.y1,t:0,id:(G.totemId=(G.totemId||0)+1)};if(!circleFree(G.M,e.f,q.x,q.y,6,'s')){const a=sh.tr.ang;q.x-=Math.cos(a)*14;q.y-=Math.sin(a)*14}
  T2.push(q);if(T2.length>ONI.totemMax){const old=T2.shift();fxBurst(G,old,'#58e070',10)}fxBurst(G,q,'#58e070',16);shakeAt(G,q,3);sfxAt(G,q,'totem',1200);G.ev.totems=(G.ev.totems||0)+1;return true}
 case'slash':e.pounce={tr:sh.tr,d:0,speed:560,hit:false,slash:true};G.ev.slashes=(G.ev.slashes||0)+1;sfxAt(G,e,'slash',900);return true;
 case'souls':{const x=sh.tr.x1,y=sh.tr.y1;G.souls=G.souls||[];G.soulFx={f:e.f,x,y,t:1.2};for(let i=0;i<ONI.soulN;i++){const a=i/ONI.soulN*6.283;G.souls.push({f:e.f,x:x+Math.cos(a)*14,y:y+Math.sin(a)*14,t:ONI.soulLife,cd:1+i*0.2,ph:rr(0,6),tg:null,home:{x,y},wa:a,hits:0})}
  e.wipe=0.8;shakeAt(G,e,7);fxBurst(G,{f:e.f,x,y},'#78ffb0',24);sfxAt(G,{f:e.f,x,y},'souls',1600);G.ev.souls=(G.ev.souls||0)+1;return true}
 case'tp':{if(!sh.target)return false;e.tp={t:0,to:sh.target,fx:e.x,fy:e.y,ff:e.f};e.tpPick=null;e.act=null;G.ev.tps=(G.ev.tps||0)+1;sfxAt(G,e,'tp',1400);return true}}return false}
function canCast3(G,e,i){const ab=e.def.ab[i];if(e.tp)return false;if(ab&&ab.id==='tp'&&!(G.totems||[]).length)return false;return true}
function updTp(G,e,dt){const p=e.tp;p.t+=dt;e.moving=false;if(!G.sim&&Math.random()<dt*40)G.fx.push({f:e.f,x:e.x+fr(-14,14),y:e.y+fr(-4,4),vx:0,vy:-60,t:0.6,col:Math.random()<0.5?'#58e070':'#b0ffb8',sz:2,g:0});
 if(e.stun>0){e.tp=null;return}
 if(p.t>=ONI.tpDur){const q=p.to;e.tp=null;if(!(G.totems||[]).includes(q))return;placeNear(G,e,q.x,q.y+16,q.f);e.stairCd=1;fxBurst(G,{f:q.f,x:q.x,y:q.y},'#58e070',20);sfxAt(G,e,'tp',1400);if(e.bot){e.bot.path=null;e.bot.sus=null}}}
function updOni(G,dt){const K=G.killer;
 if(G.soulFx){G.soulFx.t-=dt;if(G.soulFx.t<=0)G.soulFx=null}
 for(const s of G.surv){if(s.curse>0)s.curse=Math.max(0,s.curse-dt);if(s.tslow>0)s.tslow=Math.max(0,s.tslow-dt)}
 for(const q of G.totems||[]){q.t+=dt;for(const s of G.surv)if(s.f===q.f&&s.st==='ok'&&Math.hypot(s.x-q.x,s.y-q.y)<KILLERS.oni.ab[0].radius){if(!(s.curse>0)){G.ev.curses=(G.ev.curses||0)+1;if(s.isPlayer)say(G,'Тебя проклял тотем!','#78ff90');sfxAt(G,s,'totem',600)}s.curse=ONI.curse;s.tslow=0.4}}
 // cursed survivors are known to a bot Oni wherever they are
 if(!ONI.off.curse&&K.bot&&K.def.id==='oni'&&!K.bot.vis&&!K.carry){const b=K.bot;b.curseT=(b.curseT||0)-dt;if(b.curseT<=0){b.curseT=8;let best=null,bd=1e9;for(const s of G.surv)if(s.curse>0&&s.st==='ok'&&(s.f===K.f||!ONI.botSameFloor)){const d=dist(K,s)+(s.f!==K.f?900:0);if(d<bd){bd=d;best=s}}if(best){b.sus={f:best.f,x:best.x+rr(-110,110),y:best.y+rr(-110,110),t:G.t,why:'curse'};b.curseSeen={f:best.f,t:G.t};b.noInfo=0}}}
 if(G.souls)for(let i=G.souls.length-1;i>=0;i--){const o=G.souls[i];o.t-=dt;o.cd-=dt;o.ph+=dt*3;if(o.t<=0){fxBurst(G,o,'#78ffb0',6);G.souls.splice(i,1);continue}
  if(!o.tg||o.tg.st!=='ok'||o.tg.f!==o.f||Math.hypot(o.tg.x-o.x,o.tg.y-o.y)>420){o.tg=null;let bd=380;for(const s of G.surv)if(s.f===o.f&&s.st==='ok'){const d=Math.hypot(s.x-o.x,s.y-o.y);if(d<bd){bd=d;o.tg=s}}}
  let tx,ty;if(o.tg){o.wa+=dt*2;tx=o.tg.x+Math.cos(o.wa)*18;ty=o.tg.y-6+Math.sin(o.wa)*8}else{o.wa+=dt*0.6;tx=o.home.x+Math.cos(o.wa)*90;ty=o.home.y+Math.sin(o.wa)*90}
  const dx=tx-o.x,dy=ty-o.y,d=Math.hypot(dx,dy)||1,sp=ONI.soulSpeed*(o.tg?1:0.6);o.x+=dx/d*Math.min(d,sp*dt);o.y+=dy/d*Math.min(d,sp*dt);o.x=clamp(o.x,T,(FW-1)*T);o.y=clamp(o.y,T,(FH-1)*T);o.vx=dx/d;
  if(o.tg&&Math.hypot(o.tg.x-o.x,o.tg.y-o.y)<26&&o.cd<=0){const s=o.tg;o.cd=ONI.soulCd;const floor=Math.ceil(s.maxhp*ONI.soulMinHp);if(s.hp>floor){s.hp=Math.max(floor,s.hp-ONI.soulDmg);s.hitT=0.25;bleed(G,s,4,false);G.ev.soulHits=(G.ev.soulHits||0)+1;fxBurst(G,s,'#78ffb0',8);sfxAt(G,s,'soulhit',700);if(s.isPlayer)shakeAt(G,s,3)}
   if(K.bot&&!K.bot.vis&&rnd()<0.2){K.bot.sus={f:s.f,x:s.x,y:s.y,t:G.t,why:'soul'};K.bot.noInfo=0}}}}
/* bots */
function kBotAb3(G,K,b,vis,d,aim){if(K.def.id!=='oni')return false;const O=ONI.off;
 if(!O.slash&&K.cd[1]<=0&&d>70&&d<KILLERS.oni.ab[1].range-10){const sh=abShape(G,K,1,aim);if(sh.hit===vis){K.in.cast={i:1,ang:aim};return true}}
 if(!O.souls&&K.cd[2]<=0&&b.chaseT>3&&d>90){K.in.cast={i:2,ang:aim};return true}
 if(!O.totem&&K.cd[0]<=0&&d<120&&rnd()<0.3){K.in.cast={i:0,ang:aim+Math.PI};return true}
 return false}
function kBotIdle3(G,K,b){if(K.def.id!=='oni'||K.carry)return;const O=ONI.off;
 if(!O.totem&&K.cd[0]<=0&&rnd()<0.05){let best=null,bd=360;for(const g of G.M.gens)if(!g.done&&g.f===K.f&&!(G.totems||[]).some(q=>q.f===g.f&&Math.hypot(q.x-g.x,q.y-g.y)<160)){const d=dist(K,g);if(d<bd&&d>40){bd=d;best=g}}
  if(best){K.in.cast={i:0,ang:Math.atan2(best.y-K.y,best.x-K.x)};return}}
 if(!O.tp&&K.cd[3]<=0&&(G.totems||[]).length&&(b.noInfo||0)>6&&rnd()<0.04){// teleport to the totem with a cursed survivor or an active gen nearby
  let best=null,bs=0;for(const q of G.totems){let s=0;for(const v of G.surv)if(v.f===q.f&&v.st==='ok'&&(v.curse>0||Math.hypot(v.x-q.x,v.y-q.y)<260))s+=2;for(const g of G.M.gens)if(g.f===q.f&&!g.done&&g.p>0.05&&Math.hypot(g.x-q.x,g.y-q.y)<200)s++;if(q.f===K.f&&dist(K,q)<400)s=0;if(s>bs){bs=s;best=q}}
  if(best){K.in.cast={i:3,ang:best.f===K.f?Math.atan2(best.y-K.y,best.x-K.x):0};K.tpPick=best}}}
/* ---- drawing ---- */
function drawTotem(c,q,t){const x=Math.round(q.x),y=Math.round(q.y),fl=Math.sin(t*9+q.id)*1.5,rise=Math.min(1,q.t*3),h=Math.round(26*rise);shadow(c,x,y+2,11,4,0.5);
 c.fillStyle='rgba(88,224,112,0.10)';c.beginPath();c.arc(x,y,KILLERS.oni.ab[0].radius,0,6.283);c.fill();c.strokeStyle='rgba(88,224,112,0.25)';c.setLineDash([4,6]);c.lineWidth=1;c.stroke();c.setLineDash([]);
 // stone idol: stepped base, horned demon face, green eyes, fire bowl on top
 vbox(c,x-9,y-5,18,6,'#4a4a52');vbox(c,x-7,y-h+4,14,h-8,'#5c5a62');c.fillStyle='#45434a';c.fillRect(x-7,y-h+10,14,2);c.fillRect(x-7,y-h+17,14,1);
 if(h>16){c.fillStyle='#3a383e';c.fillRect(x-10,y-h+4,3,2);c.fillRect(x+7,y-h+4,3,2);c.fillRect(x-11,y-h+1,2,3);c.fillRect(x+9,y-h+1,2,3);
  c.fillStyle='#1a1a1e';c.fillRect(x-5,y-h+8,4,3);c.fillRect(x+1,y-h+8,4,3);c.fillStyle='#78ff90';c.fillRect(x-4,y-h+9,2,1);c.fillRect(x+2,y-h+9,2,1);
  c.fillStyle='#1a1a1e';c.fillRect(x-4,y-h+14,8,2);c.fillStyle='#e8e0d0';c.fillRect(x-4,y-h+14,1,2);c.fillRect(x+3,y-h+14,1,2);
  vbox(c,x-6,y-h,12,4,'#3a383e');c.fillStyle='rgba(88,255,120,0.85)';c.fillRect(x-4,y-h-4+fl,8,4);c.fillStyle='rgba(180,255,190,0.9)';c.fillRect(x-2,y-h-7+fl,4,4);c.fillStyle='rgba(88,255,120,0.6)';c.fillRect(x-1,y-h-10+fl*1.5,2,3)}}
function drawSoul(c,o,t){const x=Math.round(o.x),y=Math.round(o.y-12+Math.sin(o.ph)*3),a=Math.min(1,o.t/2)*(0.65+0.2*Math.sin(t*7+o.ph));c.globalAlpha=a;
 c.fillStyle='rgba(120,255,170,0.18)';c.beginPath();c.arc(x,y,12,0,6.283);c.fill();
 c.fillStyle='#8effc0';c.fillRect(x-5,y-6,10,10);c.fillRect(x-4,y+4,8,3);c.fillRect(x-3,y+7,2,3);c.fillRect(x+1,y+7,2,4);// wispy body
 c.fillStyle='#5ad890';c.fillRect(x-6,y-8,12,3);c.fillRect(x-7,y-10,2,3);c.fillRect(x+5,y-10,2,3);// kabuto helmet + horns
 c.fillStyle='#d8fff0';c.fillRect(x-3,y-4,2,2);c.fillRect(x+1,y-4,2,2);c.fillStyle='#bfffe0';c.fillRect(x+(o.vx>0?5:-8),y-2,3,1);c.fillRect(x+(o.vx>0?7:-10),y-6,1,8);c.globalAlpha=1}
function drawSouls(G,c,f,t){for(const o of G.souls||[])if(o.f===f)drawSoul(c,o,t)}
function drawWorld3(G,c,f,t){for(const q of G.totems||[])if(q.f===f)drawTotem(c,q,t);
 if(G.soulFx&&G.soulFx.f===f){const s=G.soulFx,k=1-s.t/1.2;c.strokeStyle='rgba(120,255,170,'+(1-k)+')';c.lineWidth=3;c.beginPath();c.arc(s.x,s.y,10+k*90,0,6.283);c.stroke();c.fillStyle='#d8e8f0';c.fillRect(s.x-1,s.y-22,2,22);c.fillStyle='#58e070';c.fillRect(s.x-2,s.y-26,4,5)}
 const K=G.killer;if(K.f===f&&K.tp){const k=K.tp.t/ONI.tpDur;c.strokeStyle='rgba(88,255,120,'+(0.4+0.5*k)+')';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(K.x,K.y-4-i*14*k,18-i*3,6-i,0,0,6.283);c.stroke()}}
 if(K.f===f&&K.pounce&&K.pounce.slash){const p=K.pounce;c.strokeStyle='rgba(120,255,140,0.7)';c.lineWidth=4;c.beginPath();c.moveTo(p.tr.x0,p.tr.y0-14);c.lineTo(K.x,K.y-14);c.stroke()}}
function drawAim3(G,c,e,sh,col){if(sh.type==='place'){const tr=sh.tr;c.strokeStyle=col+'0.9)';c.setLineDash([6,4]);c.beginPath();c.moveTo(tr.x0,tr.y0-10);c.lineTo(tr.x1,tr.y1-10);c.stroke();c.setLineDash([]);
  c.fillStyle=sh.souls?'rgba(120,255,170,0.10)':'rgba(88,224,112,0.14)';c.strokeStyle=sh.souls?'rgba(120,255,170,0.8)':'rgba(88,224,112,0.9)';c.beginPath();c.arc(tr.x1,tr.y1,sh.r,0,6.283);c.fill();c.stroke();c.fillStyle=c.strokeStyle;c.beginPath();c.arc(tr.x1,tr.y1-10,5,0,6.283);c.fill();
  if(sh.souls){c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('5 душ · 60 с',tr.x1,tr.y1-sh.r-6)}}
 if(sh.type==='tp'){const q=sh.target;c.font='bold 10px sans-serif';c.textAlign='center';if(!q){c.fillStyle=col+'0.9)';c.fillText('нет тотемов',e.x,e.y-50);return}
  for(const o of G.totems)if(o.f===e.f&&o!==q){c.strokeStyle='rgba(88,224,112,0.35)';c.beginPath();c.arc(o.x,o.y-10,12,0,6.283);c.stroke()}
  c.strokeStyle='rgba(88,255,120,0.9)';c.lineWidth=2;if(q.f===e.f){c.setLineDash([6,4]);c.beginPath();c.moveTo(e.x,e.y-10);c.lineTo(q.x,q.y-10);c.stroke();c.setLineDash([]);c.beginPath();c.arc(q.x,q.y-10,16,0,6.283);c.stroke()}
  else{c.fillStyle='rgba(88,255,120,0.95)';c.fillText((q.f>e.f?'▲ ':'▼ ')+G.M.floors[q.f].name.split(' ·')[0]+': тотем',e.x,e.y-52)}}}
/* killer view: cursed survivors are outlined through walls (screen space, above lighting) */
function drawCurseView(G,c,v,S,W,H,f,t){if(v.side!=='k'||v.def.id!=='oni')return;for(const s of G.surv){if(!(s.curse>0)||s.st!=='ok')continue;const X=(s.x-R.cam.x)*S+W/2,Y=(s.y-R.cam.y)*S+H/2,a=0.55+0.35*Math.sin(t*6);
 if(s.f===f&&X>-20&&Y>-20&&X<W+20&&Y<H+20){c.strokeStyle='rgba(88,255,120,'+a+')';c.lineWidth=2;const w=11*S,h=40*S;c.strokeRect(X-w,Y-h,w*2,h+3*S);c.fillStyle='rgba(88,255,120,'+(a*0.25)+')';c.fillRect(X-w,Y-h,w*2,h+3*S);c.fillStyle='rgba(160,255,170,0.95)';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('☠ '+Math.ceil(s.curse),X,Y-h-4)}
 else{const cx=clamp(X,30,W-30),cy=clamp(Y,60,H-30);c.fillStyle='rgba(88,255,120,'+a+')';c.beginPath();c.arc(cx,cy,9,0,6.283);c.fill();c.fillStyle='#0a2a10';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText('☠',cx,cy+4);if(s.f!==f){c.fillStyle='#a0ffb0';c.fillText((s.f>f?'▲ ':'▼ ')+G.M.floors[s.f].name.split(' ·')[0],cx,cy+22)}}}}
