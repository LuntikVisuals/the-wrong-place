/* ===== h_features: hiding lockers, sprint tracks (killer-only), chase music + red edges, last chance, weather & events ===== */
/* ---------- lockers ---------- */
function floorReach(M,f){const F=M.floors[f],src=[];for(const s of M.stairs)if(s.f===f)src.push([s.ax,s.ay]);for(const g of M.gates)if(g.f===f)src.push([g.ix,g.iy]);for(const s of M.spawnS)if(s[0]===f)src.push([s[1],s[2]]);
 const out=[];for(const k of['k','s']){const seen=new Set(),q=src.filter(([x,y])=>passK(F,x,y,k)).map(([x,y])=>idx(x,y));q.forEach(i=>seen.add(i));while(q.length){const i=q.pop(),x=i%FW,y=(i/FW)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy,j=idx(X,Y);if(X>=0&&Y>=0&&X<FW&&Y<FH&&!seen.has(j)&&passK(F,X,Y,k)){seen.add(j);q.push(j)}}}out.push(seen)}return[out[0].size,out[1].size,out[0],out[1]]}
const LOCKERS_PER={mansion:[1,2,2,2,2],village:[4,1],ship:[2,2,2]};
function placeLockers(M){M.lockers=[];const ch=(a,b,x,y)=>Math.max(Math.abs(a-x),Math.abs(b-y));
 M.floors.forEach((F,f)=>{const want=(LOCKERS_PER[M.kind]||[])[f]||1,objs=[];
  for(const g of M.gens)if(g.f===f)objs.push([g.tx,g.ty,3]);for(const h of M.hooks)if(h.f===f)objs.push([h.tx,h.ty,3]);for(const s of M.stairs)if(s.f===f)objs.push([s.x,s.y,3]);
  for(const g of M.gates)if(g.f===f)for(const[x,y]of g.tiles)objs.push([x,y,4]);for(const u of M.furn)if(u.f===f){objs.push([u.tx,u.ty,2]);objs.push([u.fx,u.fy,2])}
  for(const i of M.items)if(i.f===f)objs.push([tc(i.x),tc(i.y),2]);for(const s of M.spawnS)if(s[0]===f)objs.push([s[1],s[2],2]);if(M.spawnK.f===f)objs.push([M.spawnK.x,M.spawnK.y,3]);
  const C=[];for(let y=2;y<FH-2;y++)for(let x=2;x<FW-2;x++){const i=idx(x,y),t=F.g[i];if(!passK(F,x,y,'k')||!passK(F,x,y,'s')||t===TI.STAIR||t===TI.GAP)continue;
   const up=F.g[idx(x,y-1)];if(up!==TI.WALL&&up!==TI.HOUSE)continue;let bad=false;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[1,1],[-1,1]]){const j=idx(x+dx,y+dy),tt=F.g[j];if(tt===TI.STAIR||tt===TI.GAP||F.blk[j]||(dy===1&&!dx&&SOLID[tt]))bad=true}
   if(bad||!objs.every(([a,b,d])=>ch(a,b,x,y)>=d))continue;C.push([x,y])}
  const b0=floorReach(M,f);
  for(let n=0;n<want&&C.length;n++){C.sort((p,q)=>score(q)-score(p));let ok=false;
   for(const[x,y]of C){if(M.lockers.some(L=>L.f===f&&ch(L.tx,L.ty,x,y)<6))continue;F.blk[idx(x,y)]=1;const r=floorReach(M,f);
    if(r[0]===b0[0]-(b0[2].has(idx(x,y))?1:0)&&r[1]===b0[1]-(b0[3].has(idx(x,y))?1:0)){M.lockers.push({id:M.lockers.length,f,tx:x,ty:y,x:cc(x),y:cc(y),occ:null,openT:0,searched:-99});ok=true;b0[0]=r[0];b0[1]=r[1];b0[2]=r[2];b0[3]=r[3];break}F.blk[idx(x,y)]=0}
   if(!ok)break}
  function score([x,y]){const L=M.lockers.filter(L=>L.f===f);const near=L.length?Math.min(...L.map(l=>Math.hypot(l.tx-x,l.ty-y))):0;return near*2-Math.hypot(x-FW/2,y-FH/2)*0.2+((x*7+y*13)%5)*0.01}});
}
function freeLockerNear(G,e,r){let best=null,bd=r;for(const L of G.M.lockers||[])if(!L.occ&&L.f===e.f){const d=dist(e,L);if(d<bd){bd=d;best=L}}return best}
function enterLocker(G,e,L){const K=G.killer,seen=K.bot&&kSees(G,K,e);L.occ=e;e.st='hidden';e.locker=L;e.hideT=0;e.prone=false;e.sprint=false;e.act=null;e.x=L.x;e.y=L.y;L.openT=0.35;G.ev.hides=(G.ev.hides||0)+1;
 if(seen)K.bot.hideSeen={L,t:G.t};sfxAt(G,e,'creak',400)}
function exitLocker(G,e){const L=e.locker;if(L){L.occ=null;L.openT=0.35;placeNear(G,e,L.x,L.y+T*0.9,L.f)}e.locker=null;e.st='ok';e.actLatch=true;sfxAt(G,e,'creak',400)}
function searchLocker(G,K,L){L.searched=G.t;L.openT=0.8;G.ev.searches=(G.ev.searches||0)+1;sfxAt(G,K,'creak',600);
 if(L.occ){const s=L.occ;L.occ=null;s.locker=null;s.st='carried';s.carrier=K;K.carry=s;s.wig=0;s.f=K.f;s.x=K.x;s.y=K.y;G.ev.lockerGrabs=(G.ev.lockerGrabs||0)+1;say(G,'Убийца вытащил '+s.def.name+' из шкафа!','#ff8060');sfxAt(G,K,'scream',900)}}
function updHidden(G,e,dt){const L=e.locker;e.x=L.x;e.y=L.y;e.f=L.f;e.hideT+=dt;e.moving=false;updStamina(e,dt,false);
 const want=e.isPlayer?((e.in.act&&!e.actLatch)||Math.hypot(e.in.mx,e.in.my)>0.5):e.in.act;if(!e.in.act)e.actLatch=false;
 if(want&&e.hideT>0.6)exitLocker(G,e)}
/* survivor bot: hide when chased and out of sight; leave when the killer is gone */
function botHide(G,s,b,danger,seen,kd){const K=G.killer;
 if(s.st==='hidden'){s.in.mx=s.in.my=0;s.in.act=(s.hideT>3.5&&(K.f!==s.f||kd>280))||s.hideT>22;return true}
 if(!danger||b.noHideUntil>G.t||s.item==='toolbox'&&rnd()<0.002)return false;
 const L=b.hideL&&!b.hideL.occ&&b.hideL.f===s.f?b.hideL:freeLockerNear(G,s,150);if(!L||seen||kd<200){b.hideL=null;return false}
 b.hideL=L;b.state='hide';if(dist(s,L)<40){s.in.want='hide';s.in.wantT=L;s.in.act=true;s.in.mx=s.in.my=0;b.noHideUntil=G.t+18;b.hideL=null;return true}
 planNode(G,s,b,'lk'+L.id,L.f,L.tx,L.ty+1);follow(G,s,b);s.in.run=true;return true}
/* killer bot: open a locker it saw someone enter, or one near a heartbeat it is hunting */
function botSearch(G,K,b){if(K.carry||b.vis)return false;let L=null;
 if(b.hideSeen&&G.t-b.hideSeen.t<14&&b.hideSeen.L.f===K.f&&G.t-b.hideSeen.L.searched>3)L=b.hideSeen.L;
 else if(b.lastSeen&&G.t-b.lastSeen.t<7&&!b.lastSeen.lk&&b.lastSeen.f===K.f&&dist(K,b.lastSeen)<140){b.lastSeen.lk=true;let bd=170;for(const l of G.M.lockers||[])if(l.f===K.f&&G.t-l.searched>8){const d=Math.hypot(l.x-b.lastSeen.x,l.y-b.lastSeen.y);if(d<bd&&rnd()<0.6){bd=d;L=l}}if(L)b.hideSeen={L,t:G.t}}
 else if(b.sus&&b.sus.why==='heart'&&G.t-b.sus.t<4){for(const l of G.M.lockers||[])if(l.f===K.f&&G.t-l.searched>15&&Math.hypot(l.x-b.sus.x,l.y-b.sus.y)<120){if(rnd()<0.3)L=l;else l.searched=G.t;break}}
 if(!L)return false;if(dist(K,L)<40){K.in.want='search';K.in.wantT=L;K.in.act=true;K.in.mx=K.in.my=0;if(b.hideSeen&&b.hideSeen.L===L)b.hideSeen=null;return true}
 planNode(G,K,b,'ls'+L.id,L.f,L.tx,L.ty+1);follow(G,K,b);return true}
function drawLocker(c,L,t,peek){const x=Math.round(L.x),y=Math.round(L.y),op=L.openT>0;
 shadow(c,x,y+12,14,4,0.45);vbox(c,x-13,y-34,26,46,'#3a3430');c.fillStyle='#2a2420';c.fillRect(x-11,y-31,22,41);
 if(op){c.fillStyle='#0a0606';c.fillRect(x-11,y-31,22,41);vbox(c,x-22,y-31,9,41,'#4a4038')}
 else{vbox(c,x-11,y-31,10,41,'#4a4038');vbox(c,x+1,y-31,10,41,'#463c34');c.fillStyle='#16100c';for(let i=0;i<4;i++){c.fillRect(x-9,y-27+i*3,6,1);c.fillRect(x+3,y-27+i*3,6,1)}c.fillStyle='#b09060';c.fillRect(x-2,y-12,1,4);c.fillRect(x+2,y-12,1,4);
  if(peek){c.fillStyle=Math.sin(t*3)>-0.6?'#f0e0c0':'#2a2420';c.fillRect(x-7,y-24,2,1);c.fillRect(x+5,y-24,2,1)}}
 c.fillStyle='#5a4e44';c.fillRect(x-13,y-35,26,2)}
/* ---------- sprint tracks (only the killer sees them) ---------- */
function addTrack(G,e,dt){e.trackT=(e.trackT||0)-dt;if(e.trackT>0)return;e.trackT=0.16;(G.tracks=G.tracks||[]).push({f:e.f,x:e.x+fr(-3,3),y:e.y+fr(-2,2),t:G.t,a:Math.atan2(Math.sin(e.face),Math.cos(e.face)),blood:e.hp<e.maxhp,s:(G.tracks.length%2)?1:-1})}
function updTracks(G){const T0=G.tracks;if(!T0)return;while(T0.length&&G.t-T0[0].t>5)T0.shift()}
function drawTracks(G,c,f,t){if(!G.tracks||!G.view||G.view.side!=='k')return;for(const k of G.tracks){if(k.f!==f)continue;const a=1-(t-k.t)/5;if(a<=0)continue;c.globalAlpha=a*0.9;c.save();c.translate(Math.round(k.x),Math.round(k.y));c.rotate(k.a+Math.PI/2);
  if(k.blood){c.fillStyle='#8a0a14';c.fillRect(-2+k.s*3,-2,3,3);c.fillRect(k.s*5,2,2,2)}
  c.fillStyle='#e05a28';for(let i=-1;i<=1;i++)c.fillRect(i*4+k.s*2,-5+Math.abs(i),1,7-Math.abs(i));c.restore()}c.globalAlpha=1}
/* ---------- chase detection (any killer, player or bot) ---------- */
function chaseLevel(G){const K=G.killer,P=G.player||G.view;if(!K||K.climb||K.vanish>0||G.over)return 0;let best=0;
 for(const s of G.surv){if(s.st!=='ok'||s.f!==K.f)continue;if(P.side==='s'&&s!==P)continue;const d=dist(K,s);if(d>300)continue;if(!los(G.M,K.f,K.x,K.y,s.x,s.y))continue;if(!K.moving&&!K.lunge)continue;best=Math.max(best,d<120?1:1-(d-120)/180*0.6)}return best}
/* procedural chase music: pulsing low ostinato, minor-second stabs, ticking hats; tempo + volume follow the level */
const CH={lv:0,t:0,step:0};
function chaseAudio(G,dt){const target=chaseLevel(G);CH.lv+=(target-CH.lv)*Math.min(1,dt*(target>CH.lv?4:1.2));G.chaseLv=CH.lv;if(!AU.ctx||CH.lv<0.04)return;
 CH.t-=dt;if(CH.t>0)return;const lv=CH.lv,bpm=150+lv*30;CH.t=60/bpm/2;const s=CH.step++%16,root=[55,55,58.27,55,51.91,55,58.27,61.74][(s>>1)%8];
 AU.tone(root,0.16,'sawtooth',0.07*lv,root*0.98);if(s%4===0){AU.noise(0.12,0.14*lv,180);AU.tone(46,0.2,'sine',0.25*lv,30)}
 if(s%2===1)AU.noise(0.03,0.04*lv,6000);if(s%8===4){AU.tone(root*4,0.35,'triangle',0.035*lv,root*4.1);AU.tone(root*4*1.0595,0.35,'triangle',0.03*lv)}}
function drawChaseEdges(c,W,H,lv,t){if(lv<0.03)return;const p=0.75+0.25*Math.sin(t*8),g=c.createRadialGradient(W/2,H/2,Math.min(W,H)*0.38,W/2,H/2,Math.max(W,H)*0.72);g.addColorStop(0,'rgba(160,0,0,0)');g.addColorStop(1,'rgba(190,0,10,'+(0.5*lv*p).toFixed(3)+')');c.fillStyle=g;c.fillRect(0,0,W,H)}
/* ---------- last chance (all needed gens done): siren, red gate lights, killer +10% speed ---------- */
function startLastChance(G){G.lastChance=G.t;say(G,'ПОСЛЕДНИЙ ШАНС! Убийца в ярости','#ff6050');if(!G.sim)AU.siren()}
function drawGateLights(G,c,f,t){if(!G.powered)return;for(const g of G.M.gates){if(g.f!==f)continue;const p=0.55+0.45*Math.abs(Math.sin(t*3.2)),gr=c.createRadialGradient(g.x,g.y,4,g.x,g.y,90);gr.addColorStop(0,'rgba(255,40,30,'+(0.55*p).toFixed(3)+')');gr.addColorStop(1,'rgba(255,0,0,0)');
  c.save();c.globalCompositeOperation='lighter';c.fillStyle=gr;c.fillRect(g.x-90,g.y-90,180,180);c.restore();c.fillStyle='rgba(255,60,40,'+p.toFixed(2)+')';c.fillRect(Math.round(g.x)-3,Math.round(g.y)-36,6,6);c.fillStyle='#200';c.fillRect(Math.round(g.x)-4,Math.round(g.y)-37,8,1)}}
/* ---------- weather & events (same rules for both sides) ---------- */
const WEATHER={clear:{name:'Ясно',vis:1},fog:{name:'Туман',vis:0.68},storm:{name:'Гроза',vis:0.92}};
function initWeather(G){const r=rnd();G.weather=WP.forceWeather||(r<0.4?'clear':r<0.7?'fog':'storm');const r2=rnd();G.blackout={at:WP.forceBlackout!=null?WP.forceBlackout:(r2<0.45?60+r2*180:-1),dur:10,on:false};G.flashT=0;G.nextFlash=4+rnd()*8;if(G.weather!=='clear')say(G,G.weather==='fog'?'Туман: видно хуже — и вам, и им':'Гроза: молнии освещают всё вокруг','#c0c8e0')}
function updWeather(G,dt){const B=G.blackout;if(!B)return;if(B.at>=0&&!B.on&&G.t>=B.at&&G.t<B.at+B.dur){B.on=true;say(G,'Свет погас!','#c0c0ff');if(!G.sim)AU.sfx('blackout')}
 if(B.on&&G.t>=B.at+B.dur){B.on=false;B.at=-1;say(G,'Свет вернулся','#f0e0a0')}
 if(G.weather==='storm'){G.flashT=Math.max(0,G.flashT-dt);G.nextFlash-=dt;if(G.nextFlash<=0){G.flashT=0.22;G.nextFlash=9+rnd()*14;if(!G.sim){G.thunderIn=0.4+Math.random()*1.2}}
  if(G.thunderIn>0){G.thunderIn-=dt;if(G.thunderIn<=0)AU.sfx('thunder')}}}
function visMul(G){return(WEATHER[G.weather]||WEATHER.clear).vis*(G.blackout&&G.blackout.on?0.6:1)*(G.flashT>0?1.6:1)}
function drawWeather(G,c,W,H,t){const w=G.weather;
 if(w==='fog'){for(let i=0;i<7;i++){const x=((i*173+t*(12+i*3))%(W+300))-150,y=(i*97)%H,g=c.createRadialGradient(x,y,10,x,y,170);g.addColorStop(0,'rgba(170,175,185,0.22)');g.addColorStop(1,'rgba(170,175,185,0)');c.fillStyle=g;c.fillRect(x-170,y-170,340,340)}c.fillStyle='rgba(140,145,155,0.14)';c.fillRect(0,0,W,H)}
 if(w==='storm'){c.strokeStyle='rgba(170,190,230,0.35)';c.lineWidth=1;c.beginPath();for(let i=0;i<70;i++){const x=(i*61.7+t*90)%W,y=(i*37.3+t*620)%H;c.moveTo(x,y);c.lineTo(x-3,y+11)}c.stroke();
  if(G.flashT>0){c.fillStyle='rgba(225,235,255,'+(0.55*G.flashT/0.22).toFixed(3)+')';c.fillRect(0,0,W,H)}}
 if(G.blackout&&G.blackout.on){c.fillStyle='rgba(0,0,8,0.45)';c.fillRect(0,0,W,H)}}
