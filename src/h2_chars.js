/* ===== h2_chars: new characters — Hollow Shepherd (killer), Oni (killer, model only), Ethan Cole & Lily Marsh (survivors) ===== */
KILLERS.shepherd={id:'shepherd',name:'Пустой Пастух',speed:114,body:'#2e2a2c',hood:'#1e1a1b',skin:'#e2d6bc',acc:'#ffb040',draw:'shepherd',tall:96,
 desc:'Высокий пастух в рваном плаще. Вместо головы — череп барана со свечой внутри.',
 ab:[{id:'bell',name:'Колокол',cd:22,kind:'self',radius:130,desc:'Звон: выжившие в радиусе 3 с не могут бежать'},
     {id:'sheep',name:'Овцы',cd:16,kind:'place',range:110,desc:'Ставит чучело овцы — оно блеет, если рядом прошёл выживший'}],
 passive:{name:'Стадо',desc:'Быстрее на 8%, когда рядом 2 и больше выживших'}};
/* Oni: original red samurai demon — вдохновлено Kenji (Brawl Stars); own pixel art, no copied assets. Abilities come later. */
KILLERS.oni={id:'oni',name:'Они',speed:115,body:'#b0242a',hood:'#2a1414',skin:'#c8302e',acc:'#58d860',draw:'oni',soon:true,tall:100,
 desc:'Огромный красный демон в самурайских доспехах с двумя зелёными катанами. Способности появятся позже.',ab:[],
 passive:{name:'Скоро',desc:'Способности появятся в следующем обновлении — пока только удар двумя катанами'}};
SURVS.ethan={id:'ethan',name:'Итан Коул',hp:85,body:'#26262e',hood:'#1a1a20',skin:'#d8b090',hair:'#6a5a48',collar:true,
 desc:'Бывший сельский священник. Ищет пропавшую дочь.',ab:{id:'pray',name:'Молитва',cd:35,kind:'circle',range:90,desc:'6 с медленно лечит себя и союзников рядом'}};
SURVS.lily={id:'lily',name:'Лили Марш',hp:70,body:'#6c7c3c',hood:'#4c5a2a',skin:'#f0c8a0',hair:'#c8642c',small:true,
 desc:'Девочка-скаут. Маленькая и юркая.',ab:{id:'whistle',name:'Свисток',cd:28,kind:'proj',range:230,desc:'Брошенный свисток свистит и уводит убийцу'}};
for(const m in TUNE){TUNE[m].shepherd=TUNE[m].shepherd||1;TUNE[m].oni=TUNE[m].oni||1}

/* ---- ability logic ---- */
function abShape2(G,e,ab,ang){{const s3=abShape3(G,e,ab,ang);if(s3)return s3}switch(ab.id){
 case'bell':return{type:'ring',x:e.x,y:e.y,r:ab.radius,ab,bell:true};
 case'sheep':{const tr=traceLine(G,e,ang,ab.range,10);return{type:'arrow',tr,ab,place:true}}
 case'pray':{let n=0;for(const s of G.surv)if(s.f===e.f&&s.st==='ok'&&s.hp<s.maxhp&&dist(s,e)<ab.range)n++;return{type:'circle',x:e.x,y:e.y,r:ab.range,target:null,n,ab}}
 case'whistle':{const tr=traceLine(G,e,ang,ab.range,0);return{type:'proj',tr,hit:null,ab,land:true}}}return null}
function cast2(G,e,sh){const ab=sh.ab;if(['totem','slash','souls','tp'].includes(ab.id))return cast3(G,e,sh);switch(ab.id){
 case'bell':{let n=0;for(const s of G.surv)if(s.f===e.f&&s.st==='ok'&&dist(s,e)<ab.radius){s.buff.deaf=3;s.sprint=false;n++;fxBurst(G,s,'#ffd070',6)}G.ev.bells=(G.ev.bells||0)+1;G.bellFx={f:e.f,x:e.x,y:e.y,t:0.6,r:ab.radius};sfxAt(G,e,'bell',900);return true}
 case'sheep':{(G.sheep=G.sheep||[]).push({f:e.f,x:sh.tr.x1,y:sh.tr.y1,cd:1,t:120,bleat:0});if(G.sheep.length>3)G.sheep.shift();G.ev.sheep=(G.ev.sheep||0)+1;return true}
 case'pray':e.buff.pray=6;G.ev.prays=(G.ev.prays||0)+1;return true;
 case'whistle':G.proj.push({kind:'whistle',owner:e,f:e.f,tr:sh.tr,d:0,speed:420,w:4});G.ev.whistles=(G.ev.whistles||0)+1;return true}return false}
function updChars2(G,dt){const K=G.killer;updOni(G,dt);
 for(const e of G.surv)if(e.buff.pray>0&&e.st==='ok'){for(const s of G.surv)if(s.f===e.f&&s.st==='ok'&&dist(s,e)<90&&s.hp<s.maxhp)s.hp=Math.min(s.maxhp,s.hp+4.5*dt);if(!G.sim&&Math.random()<dt*5)G.fx.push({f:e.f,x:e.x+fr(-30,30),y:e.y-10+fr(-10,10),vx:0,vy:-30,t:0.7,col:'#fff0a0',sz:2,g:0})}
 if(G.bellFx){G.bellFx.t-=dt;if(G.bellFx.t<=0)G.bellFx=null}
 if(G.sheep)for(let i=G.sheep.length-1;i>=0;i--){const q=G.sheep[i];q.t-=dt;q.cd-=dt;q.bleat=Math.max(0,q.bleat-dt);if(q.t<=0){G.sheep.splice(i,1);continue}
  if(q.cd<=0)for(const s of G.surv)if(s.f===q.f&&s.st==='ok'&&!s.prone&&Math.hypot(s.x-q.x,s.y-q.y)<70){q.cd=8;q.bleat=1.2;G.reveal={s,t:4};G.ev.bleats=(G.ev.bleats||0)+1;
   if(K.bot){K.bot.sus={f:s.f,x:s.x,y:s.y,t:G.t,why:'sheep'};K.bot.noInfo=0}else if(K.isPlayer)say(G,'Овца заблеяла!','#ffd070');sfxAt(G,q,'bleat',2000);break}}
 if(G.reveal){G.reveal.t-=dt;if(G.reveal.t<=0)G.reveal=null}
 if(G.lures)for(let i=G.lures.length-1;i>=0;i--){const l=G.lures[i];l.t-=dt;if(!G.sim&&(l.t*4|0)!==((l.t+dt)*4|0))sfxAt(G,l,'whistle',2000);
  if(!l.used&&K.bot&&!K.bot.vis&&!K.carry&&K.f===l.f&&dist(K,l)<650){K.bot.sus={f:l.f,x:l.x,y:l.y,t:G.t,why:'lure'};K.bot.noInfo=0;K.bot.lastSeen=null;l.used=true;G.ev.lured=(G.ev.lured||0)+1}
  if(l.t<=0)G.lures.splice(i,1)}}
function herdMul(G,e){if(e.def.id!=='shepherd')return 1;let n=0;for(const s of G.surv)if(s.f===e.f&&s.st==='ok'&&dist(s,e)<220)n++;return n>=2?1.08:1}
function landWhistle(G,p){(G.lures=G.lures||[]).push({f:p.f,x:p.tr.x1,y:p.tr.y1,t:6});sfxAt(G,{f:p.f,x:p.tr.x1,y:p.tr.y1},'whistle',2000)}
/* bots */
function kBotAb2(G,K,b,vis,d,a){const D=G.diff;if(K.def.id==='oni')return kBotAb3(G,K,b,vis,d,a);if(K.def.id!=='shepherd')return false;
 if(vis&&K.cd[0]<=0&&d<115&&(vis.sprint||rnd()<0.3)){K.in.cast={i:0,ang:a};return true}return false}
function kBotIdle2(G,K,b){kBotIdle3(G,K,b);if(K.def.id!=='shepherd'||K.cd[1]>0||rnd()>0.03)return;let best=null,bd=320;for(const g of G.M.gens)if(!g.done&&g.f===K.f&&!(G.sheep||[]).some(q=>Math.hypot(q.x-g.x,q.y-g.y)<90)){const d=dist(K,g);if(d<bd&&d>50){bd=d;best=g}}
 if(best)K.in.cast={i:1,ang:Math.atan2(best.y-K.y,best.x-K.x)}}
function sBotAb2(G,s,ab,danger,seen,kd){const K=G.killer;
 if(ab==='pray'&&!danger){const sh=abShape(G,s,0,0);if(sh.n>=1&&(s.hp<s.maxhp*0.8||sh.n>=2))s.in.cast={i:0,ang:0}}
 if(ab==='whistle'&&danger&&kd<260&&kd>60){const away=Math.atan2(s.y-K.y,s.x-K.x),side=away+(rnd()<0.5?1:-1)*rr(1.3,1.9);s.in.cast={i:0,ang:side}}}
/* ---- drawing ---- */
function drawSheep(c,q,t){const x=Math.round(q.x),y=Math.round(q.y),b=q.bleat>0?Math.round(Math.sin(t*30)):0;shadow(c,x,y+2,10,3,0.4);
 c.fillStyle='#3a2a1a';c.fillRect(x-1,y-6,2,8);vbox(c,x-9,y-16+b,16,9,'#d8d2c4');c.fillStyle='#bfb8a8';for(let i=0;i<4;i++)c.fillRect(x-8+i*4,y-16+b,2,2);vbox(c,x+5,y-19+b,6,6,'#2a2420');c.fillStyle='#e8c040';c.fillRect(x+8,y-17+b,1,1);
 c.fillStyle='#3a3028';c.fillRect(x-7,y-7,2,5);c.fillRect(x+3,y-7,2,5);if(q.bleat>0){c.fillStyle='#ffd070';c.font='bold 9px sans-serif';c.textAlign='center';c.fillText('МЭЭ!',x,y-26)}}
function drawWorld2(G,c,f,t){drawWorld3(G,c,f,t);if(G.sheep&&(G.view.side==='k'||true))for(const q of G.sheep)if(q.f===f)drawSheep(c,q,t);
 if(G.lures)for(const l of G.lures)if(l.f===f){c.strokeStyle='rgba(255,240,160,'+(0.3+0.3*Math.sin(t*20))+')';c.lineWidth=1.5;for(let r=8;r<40;r+=10){c.beginPath();c.arc(l.x,l.y-4,r+(t*30%10),-2.4,-0.7);c.stroke()}vbox(c,l.x-3,l.y-5,6,3,'#c0c8d0')}
 if(G.bellFx&&G.bellFx.f===f){const k=1-G.bellFx.t/0.6;c.strokeStyle='rgba(255,200,90,'+(1-k)+')';c.lineWidth=3;c.beginPath();c.arc(G.bellFx.x,G.bellFx.y-6,G.bellFx.r*k,0,6.283);c.stroke()}
 if(G.reveal&&G.view.side==='k'&&G.reveal.s.f===f){const s=G.reveal.s;c.strokeStyle='rgba(255,200,80,0.9)';c.lineWidth=2;c.strokeRect(Math.round(s.x)-12,Math.round(s.y)-40,24,42)}}
/* Hollow Shepherd: tall, ragged cloak, ram skull with a candle burning inside */
function drawShepherd(c,e,d,pose,t,o,dir,sw,bob,by,C){const u=3,run=pose==='run',idle=pose==='idle',br=idle?Math.round(Math.sin(t*2)):0;by=Math.round(by)-br;
 const lg=7*u,lift=v=>Math.round(v*u*1.6);
 vbox(c,-3*u,-lg+(sw>0?-lift(sw):0),2*u,lg-(sw>0?-lift(sw):0),C('#1a1618'));vbox(c,1*u,-lg+(sw<0?lift(sw):0),2*u,lg-(sw<0?lift(sw):0),C('#161214'));
 const top=-lg-12*u+by,hem=-lg+2*u+by;c.fillStyle=OUT;c.fillRect(-6*u-1,top-1,12*u+2,hem-top+2);c.fillStyle=C(d.body);c.fillRect(-6*u,top,12*u,hem-top);
 c.fillStyle=C('#3e383a');c.fillRect(-6*u,top,12*u,u);c.fillStyle=C('#1c1819');c.fillRect(3*u,top+u,3*u,hem-top-u);c.fillRect(-u,top+3*u,u,hem-top-3*u);
 for(let i=0;i<6;i++){const fl=Math.round(Math.sin(t*(run?14:6)+i*1.7)*1.2);c.fillStyle=C(i%2?d.body:'#262123');c.fillRect(-6*u+i*2*u,hem,2*u,u+((i*5)%3)+fl);}
 c.fillStyle=C('#4a3a2a');c.fillRect(-6*u,top+8*u,12*u,u);// rope belt
 const aS=pose==='attack'?-(o.k||0)*8*u+4*u:(pose==='walk'||run)?Math.round(sw*u*2):0,ay=top+2*u;
 if(dir==='side'){vbox(c,-u+Math.round(aS*0.4),ay,2*u,9*u,C('#262022'));vbox(c,-2*u+Math.round(aS*0.4),ay+9*u,4*u,4*u,C('#b08830'));c.fillStyle=C('#5a4010');c.fillRect(-u+Math.round(aS*0.4),ay+13*u,2*u,u)}
 else{vbox(c,-8*u,ay+Math.round(aS*0.4),2*u,10*u,C('#262022'));vbox(c,6*u,ay-Math.round(aS*0.4),2*u,10*u,C('#221c1e'));vbox(c,5*u,ay+10*u-Math.round(aS*0.4),4*u,4*u,C('#b08830'));c.fillStyle=C('#5a4010');c.fillRect(6*u,ay+14*u-Math.round(aS*0.4),2*u,u);
  c.fillStyle=C('#5a5048');c.fillRect(-7*u,ay-2*u+Math.round(aS*0.4),u,16*u);c.fillRect(-8*u,ay-3*u+Math.round(aS*0.4),2*u,u)}// crook staff
 // ram skull
 const hy=top-7*u+Math.round(bob*0.5),hx=dir==='side'?-2*u:-3.5*u,hw=dir==='side'?6*u:7*u;
 const horn=(sx,m)=>{c.fillStyle=OUT;c.fillRect(sx-1,hy-1,3*u+2,4*u+2);c.fillStyle=C('#a89070');c.fillRect(sx,hy,3*u,4*u);c.fillStyle=C('#7a6448');c.fillRect(sx+(m>0?2*u:0),hy+u,u,2*u);c.fillRect(sx+u,hy+3*u,u,u);c.fillStyle=C('#c8b090');c.fillRect(sx+(m>0?0:2*u),hy,u,u)};
 if(dir!=='side'){horn(-6.5*u,-1);horn(3.5*u,1)}else horn(-4*u,-1);
 vbox(c,hx,hy,hw,6*u,C(d.skin));c.fillStyle=C('#c4b698');c.fillRect(hx,hy+4*u,hw,2*u);
 if(dir!=='up'){const fl=Math.sin(t*9)>0,ec=C(fl?'#ffc040':'#ff8a20');c.fillStyle='#0c0806';
  if(dir==='side'){c.fillRect(hx+3*u,hy+2*u,2*u,u);c.fillRect(hx+4*u,hy+5*u,2*u,2*u);c.fillStyle=ec;c.fillRect(hx+3*u,hy+2*u,u,u)}
  else{c.fillRect(hx+u,hy+2*u,2*u,u+1);c.fillRect(hx+4*u,hy+2*u,2*u,u+1);c.fillRect(hx+2.5*u,hy+5*u,2*u,u);c.fillStyle=ec;c.fillRect(hx+1.5*u,hy+2*u,u,u);c.fillRect(hx+4.5*u,hy+2*u,u,u)}}
 // candle on top + flame
 const cx=hx+hw/2-u/2;vbox(c,cx,hy-3*u,u,3*u,C('#eee4c8'));const fh=Math.round(Math.sin(t*12)*1.5);c.fillStyle='#ffd060';c.fillRect(cx-1,hy-5*u+fh,u+2,2*u-fh);c.fillStyle='#fff6c0';c.fillRect(cx,hy-4*u,u,u)}
/* Oni: huge red demon samurai with two green katanas — вдохновлено Kenji (Brawl Stars), original red design */
function drawOni(c,e,d,pose,t,o,dir,sw,bob,by,C){const u=3,run=pose==='run',idle=pose==='idle',att=pose==='attack',k=o.k||0,br=idle?Math.round(Math.sin(t*2.2)*1.5):0;by=Math.round(by);
 const lg=6*u,lean=run?u:0,lift=v=>Math.round(v*u*1.4);
 // legs: armoured greaves
 const leg=(x,dy,col)=>{vbox(c,x,-lg+dy,3*u,lg-dy,C(col));c.fillStyle=C('#c8a040');c.fillRect(x,-lg+dy+2*u,3*u,1);c.fillStyle=C('#140a0a');c.fillRect(x,-3,3*u,3)};
 leg(-4*u,sw>0?-lift(sw):0,'#3a1616');leg(u,sw<0?lift(sw):0,'#321212');
 // skirt plates (kusazuri)
 const wy=-lg-2*u+by;for(let i=0;i<4;i++){const fl=run?Math.round(Math.sin(t*16+i)*1):0;vbox(c,-5*u+i*2.5*u,wy+fl,2*u,3*u,C(i%2?'#2a1414':'#341818'));c.fillStyle=C('#c8a040');c.fillRect(-5*u+i*2.5*u,wy+3*u-1+fl,2*u,1)}
 // torso: red skin chest + lacquered breastplate, breathing
 const tt=-lg-12*u+by-br+lean;vbox(c,-6*u,tt,12*u,10*u+br,C(d.skin));c.fillStyle=C('#9a1c20');c.fillRect(-6*u,tt+6*u,12*u,u);
 vbox(c,-5*u,tt+3*u,10*u,6*u,C('#2a1414'));c.fillStyle=C('#c8a040');c.fillRect(-5*u,tt+3*u,10*u,1);c.fillRect(-5*u,tt+5*u,10*u,1);c.fillRect(-5*u,tt+7*u,10*u,1);
 // rope belt with knot
 c.fillStyle=C('#d8c090');c.fillRect(-6*u,tt+9*u,12*u,u);c.fillStyle=C('#a89060');for(let i=0;i<12;i+=2)c.fillRect(-6*u+i*u,tt+9*u,u,1);vbox(c,-u,tt+9*u,2*u,2*u,C('#d8c090'));c.fillStyle=C('#d8c090');c.fillRect(-u,tt+11*u,1,2*u);c.fillRect(u-1,tt+11*u,1,3*u);
 // arms + katanas (one per hand)
 const swing=att?(-1.6+k*3.0):run?0.9:(pose==='walk'?0.55+sw*0.15:0.5+Math.sin(t*2.2)*0.05);
 const arm=(sx,sy,ang,mir,col)=>{c.save();c.translate(sx,sy);c.rotate(ang*mir);vbox(c,-1.5*u,0,3*u,6*u,C(col));vbox(c,-1.5*u,5*u,3*u,2*u,C('#2a1414'));// gauntlet
  c.fillStyle=C('#1a1010');c.fillRect(-u/2,7*u,u,2*u);c.fillStyle=C('#c8a040');c.fillRect(-1.5*u,9*u,3*u,1);// tsuba
  c.fillStyle=OUT;c.fillRect(-u/2-1,9*u,u+2,14*u+1);c.fillStyle=C('#3ec850');c.fillRect(-u/2,9*u,u,14*u);c.fillStyle=C('#a8ffb0');c.fillRect(-u/2,9*u,1,14*u);c.fillStyle=C('#58d860');c.fillRect(-u/2,23*u-2,u,2);
  if(att&&k>0.3&&k<0.8){c.fillStyle='rgba(160,255,170,0.35)';c.fillRect(-3*u,9*u,6*u,14*u)}c.restore()};
 const sy=tt+u;if(dir==='side'){arm(Math.round(lean*0.5),sy,swing,1,d.skin)}else{arm(-7*u,sy,swing,1,'#b42a2c');arm(7*u,sy,swing,-1,'#a82428')}
 // shoulder guards (sode), layered
 const sode=x=>{for(let i=0;i<3;i++){vbox(c,x,tt-u+i*2*u,4*u,2*u,C(i%2?'#2a1414':'#3a1a1a'));c.fillStyle=C('#c8a040');c.fillRect(x,tt-u+i*2*u+2*u-1,4*u,1)}};
 if(dir==='side')sode(-2*u);else{sode(-9*u);sode(5*u)}
 // mane of hair behind the head
 const hy=tt-8*u+Math.round(bob*0.4)-br;c.fillStyle=C('#1a1214');for(let i=0;i<7;i++){const h=3*u+((i*7)%3)*u+Math.round(Math.sin(t*(run?12:3)+i)*1);c.fillRect(-7*u+i*2*u,hy-2*u,2*u,h+6*u)}
 // demon mask head
 const hw=dir==='side'?7*u:9*u,hx=dir==='side'?-3*u:-4.5*u;vbox(c,hx,hy,hw,8*u,C('#c8302e'));c.fillStyle=C('#e8484a');c.fillRect(hx,hy,hw,u);
 // horns
 const horn=(x,m)=>{vbox(c,x,hy-3*u,2*u,3*u,C('#ece2c8'));vbox(c,x+m*u,hy-5*u,u,2*u,C('#d8ccb0'))};if(dir==='side')horn(hx+3*u,1);else{horn(hx,-1);horn(hx+hw-2*u,1)}
 if(dir!=='up'){const eye=(x)=>{c.fillStyle='#120606';c.fillRect(x-1,hy+2*u-1,2*u+2,u+2);c.fillStyle=Math.sin(t*3)>0.95?'#120606':'#ffe040';c.fillRect(x,hy+2*u,2*u,u)};
  c.fillStyle=C('#4a0a0c');if(dir==='side'){c.fillRect(hx+3*u,hy+u,4*u,u);eye(hx+4*u);c.fillStyle='#120606';c.fillRect(hx+2*u,hy+5*u,5*u,2*u);c.fillStyle='#f4f0e0';c.fillRect(hx+3*u,hy+5*u,u,2*u);c.fillRect(hx+5*u,hy+5*u,u,u)}
  else{c.fillRect(hx+u,hy+u,3*u,u);c.fillRect(hx+5*u,hy+u,3*u,u);eye(hx+1.5*u);eye(hx+5.5*u);c.fillStyle='#120606';c.fillRect(hx+1.5*u,hy+5*u,6*u,2*u);c.fillStyle='#f4f0e0';c.fillRect(hx+1.5*u,hy+5*u,u,2*u);c.fillRect(hx+6.5*u,hy+5*u,u,2*u);c.fillRect(hx+3.5*u,hy+5*u,2*u,u)}}
 else{c.fillStyle=C('#1a1214');c.fillRect(hx,hy+u,hw,7*u)}}
