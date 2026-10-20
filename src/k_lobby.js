/* ===== k_lobby: main menu as an animated lobby (room drawn in code, character on pedestal) ===== */
const PROF={lvl:1,xp:0,coins:120,owned:[],bg:'parlor'};
try{Object.assign(PROF,JSON.parse(localStorage.getItem('twp_prof')||'{}'))}catch(e){}
function saveProf(){try{localStorage.setItem('twp_prof',JSON.stringify(PROF))}catch(e){}}
function grantReward(G){const P=G.player;if(!P)return 0;const r=P.side==='k'?10+G.result.kills*15:(P.st==='out'?40:10)+P.stats.gens*5;PROF.coins+=r;PROF.xp+=r;while(PROF.xp>=PROF.lvl*100){PROF.xp-=PROF.lvl*100;PROF.lvl++}saveProf();return r}
const SHOP=[{id:'skin_red',name:'Красный капюшон',price:50},{id:'skin_ash',name:'Пепельная куртка',price:80},{id:'emote_wave',name:'Жест «Привет»',price:30},{id:'banner_moon',name:'Баннер «Луна»',price:60}];
const LB={raf:0,t:0,mx:0,my:0,dust:[]};
const lobbyChar=()=>SET.side==='k'?KILLERS[SET.killer]:SURVS[SET.surv];
function showMenu(){IN.paused=false;const u=UI();u.className='lobby';
 const d=lobbyChar(),mapN={mansion:'Особняк',village:'Деревня',ship:'Корабль'}[SET.map];
 u.innerHTML=`<canvas id="lbcv"></canvas>
 <div class="lb-top"><div class="lb-lvl"><b>${PROF.lvl}</b><div><span>Уровень</span><i><em style="width:${Math.round(100*PROF.xp/(PROF.lvl*100))}%"></em></i></div></div>
  <div class="lb-title">THE WRONG PLACE</div><div class="lb-coins" id="lbCoins">◉ ${PROF.coins}</div></div>
 <div class="lb-side"><button id="bChars">Персонажи</button><button id="bShop">Магазин</button><button id="bTasks">Задания</button><button id="bLore">Лор</button><button id="bSet">Настройки</button></div>
 <div class="lb-name"><button id="bPrev" class="lb-arr">‹</button><div><b>${d.name}</b><span>${SET.side==='k'?'Убийца':'Выживший · ОЗ '+d.hp}</span></div><button id="bNext" class="lb-arr">›</button></div>
 <div class="lb-play"><div class="lb-card" id="bCard"><b>${mapN}</b><span>${SET.side==='k'?'За убийцу':'За выжившего'} · ${DIFF[SET.diff].name}</span><small>изменить</small></div><button id="bPlay">ИГРАТЬ</button></div>`;
 const $=id=>document.getElementById(id);
 $('bPlay').onclick=()=>{AU.init();stopLobby();startGame()};$('bCard').onclick=()=>{stopLobby();showSetup()};$('bChars').onclick=()=>{stopLobby();showSetup()};
 $('bLore').onclick=()=>{stopLobby();showLore()};$('bShop').onclick=()=>{stopLobby();showShop()};$('bTasks').onclick=()=>{stopLobby();showTasks()};$('bSet').onclick=()=>{stopLobby();showSettings()};
 const cyc=k=>{const L=Object.keys(SET.side==='k'?KILLERS:SURVS),key=SET.side==='k'?'killer':'surv';SET[key]=L[(L.indexOf(SET[key])+k+L.length)%L.length];showMenu()};$('bPrev').onclick=()=>cyc(-1);$('bNext').onclick=()=>cyc(1);
 const cv=$('lbcv');cv.onpointermove=e=>{LB.mx=e.clientX/innerWidth-0.5;LB.my=e.clientY/innerHeight-0.5};
 if(!LB.raf){let last=0;const loop=ts=>{const c=document.getElementById('lbcv');if(!c){LB.raf=0;return}LB.t+=Math.min(0.05,(ts-last)/1000||0);last=ts;drawLobby(c);LB.raf=requestAnimationFrame(loop)};LB.raf=requestAnimationFrame(loop)}
}
function stopLobby(){if(LB.raf)cancelAnimationFrame(LB.raf);LB.raf=0}
function drawLobby(cv,o){o=o||{};
 const dpr=o.W?1:Math.min(2,devicePixelRatio||1),W=o.W||innerWidth,H=o.H||innerHeight;if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr)}
 const c=cv.getContext('2d'),t=LB.t,u=Math.max(1,Math.round(H/120)),bgSave=PROF.bg;if(o.bg)PROF.bg=o.bg;c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=false;
 const px=LB.mx*12+Math.sin(t*0.3)*4,fy=H*0.66;
 (LBG[PROF.bg]||LBG.parlor).draw(c,W,H,t,u,px,fy);
 // pedestal + character with idle animation
 const cx=W*0.5+px*0.3,py=fy+H*0.1;vbox(c,cx-u*22,py-u*6,u*44,u*8,'#4a4448');vbox(c,cx-u*18,py-u*12,u*36,u*7,'#5a5458');c.fillStyle='#a0302a';c.fillRect(cx-u*16,py-u*12,u*32,u);
 const d=lobbyChar(),e={side:SET.side,def:d,face:Math.PI/2+Math.sin(t*0.7)*0.5,walk:0,item:null};c.save();c.translate(cx,py-u*12+Math.sin(t*2)*u*0.5);const sc=H*0.36/(SET.side==='k'?62:44);c.scale(sc,sc);drawChar(c,e,0,0,'idle',t,{});c.restore();
 // dust particles (foreground)
 PROF.bg=bgSave;if(!o.W&&LB.dust.length<50)LB.dust.push({x:Math.random()*W,y:Math.random()*H,v:fr(4,14),s:fr(1,2.5)});for(const p of LB.dust){p.y-=p.v*0.016;p.x+=Math.sin(t+p.y*0.02)*0.2;if(p.y<0)p.y=H;c.fillStyle='rgba(240,220,190,0.35)';c.fillRect(p.x-px*1.5,p.y,p.s*u/2,p.s*u/2)}
 const v=c.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,W*0.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,0.75)');c.fillStyle=v;c.fillRect(0,0,W,H);
}
function subPage(title,html,after){stopLobby();const u=UI();u.className='';u.innerHTML=`<div class="panel"><h2>${title}</h2>${html}<div class="row"><button id="bk">Назад</button></div></div>`;document.getElementById('bk').onclick=showMenu;after&&after()}
function showShop(){subPage('Магазин',`<div class="sub">Монеты: ◉ ${PROF.coins}. Только украшения, честные цены, никаких сундуков.</div><h3>Фоны лобби</h3><div class="row">${Object.entries(LBG).map(([id,b])=>`<div class="card" id="bg_${id}"><canvas class="bgprev" data-bg="${id}" width="150" height="84"></canvas><b>${b.name}</b><br>${PROF.bg===id?'<i>Выбран</i>':(id==='parlor'||PROF.owned.includes('bg_'+id))?`<button data-equip="${id}">Выбрать</button>`:`<button data-buybg="${id}">◉ ${b.price}</button>`}</div>`).join('')}</div><h3>Украшения</h3><div class="row">${SHOP.map(i=>`<div class="card"><b>${i.name}</b><br>${PROF.owned.includes(i.id)?'Куплено':`<button data-buy="${i.id}">◉ ${i.price}</button>`}</div>`).join('')}</div><div class="sub">(заглушка: предметы пока не отображаются в игре)</div>`,
 ()=>{shopPreviews();UI().querySelectorAll('[data-buybg]').forEach(b=>b.onclick=()=>{const id=b.dataset.buybg,p=LBG[id].price;if(PROF.coins>=p){PROF.coins-=p;PROF.owned.push('bg_'+id);PROF.bg=id;saveProf()}showShop()});UI().querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{PROF.bg=b.dataset.equip;saveProf();showShop()});UI().querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const i=SHOP.find(x=>x.id===b.dataset.buy);if(PROF.coins>=i.price){PROF.coins-=i.price;PROF.owned.push(i.id);saveProf()}showShop()})})}
function shopPreviews(){const step=()=>{const L=document.querySelectorAll('.bgprev');if(!L.length)return;LB.t+=0.033;for(const cv of L)drawLobby(cv,{W:150,H:84,bg:cv.dataset.bg});setTimeout(step,66)};step()}
function showTasks(){subPage('Задания',`<div class="lore">• Почини 3 генератора — ◉ 20<br>• Повесь 2 выживших на крюк — ◉ 20<br>• Сбеги через ворота — ◉ 30<br><br><i>Скоро: задания пока не отслеживаются (заглушка).</i></div>`)}
function showSettings(){subPage('Настройки',`<div class="row"><button id="bSnd">Звук: ${AU.on?'вкл':'выкл'}</button><button id="bHow">Как играть</button><button id="bReset">Сбросить прогресс</button></div>`,()=>{
 document.getElementById('bSnd').onclick=()=>{AU.on=!AU.on;if(AU.master)AU.master.gain.value=AU.on?0.6:0;showSettings()};document.getElementById('bHow').onclick=showHow;
 document.getElementById('bReset').onclick=()=>{Object.assign(PROF,{lvl:1,xp:0,coins:120,owned:[],bg:'parlor'});saveProf();showSettings()}})}

/* ---- lobby backgrounds (all drawn in code, animated) ---- */
function glow(c,x,y,r,col){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
const LBG={
 parlor:{name:'Гостиная Хозяина',price:0,draw(c,W,H,t,u,px,fy){
 // back wall + wallpaper (far layer)
 c.fillStyle='#1c0a0e';c.fillRect(0,0,W,H);for(let x=-u*8;x<W+u*8;x+=u*8){c.fillStyle='#260e13';c.fillRect(x-px*0.3,0,u*3,fy)}
 c.fillStyle='#120508';c.fillRect(0,fy-u*6,W,u*6);c.fillStyle='#3a1a14';c.fillRect(0,fy-u*7,W,u);
 // window with red sky, moon and drifting fog
 const wx=W*0.62-px*0.5,wy=H*0.12,ww=W*0.2,wh=H*0.36;c.fillStyle=OUT;c.fillRect(wx-u*2,wy-u*2,ww+u*4,wh+u*4);
 const g=c.createLinearGradient(0,wy,0,wy+wh);g.addColorStop(0,'#5a0a10');g.addColorStop(1,'#c0301c');c.fillStyle=g;c.fillRect(wx,wy,ww,wh);
 c.fillStyle='#f0d0a0';c.fillRect(wx+ww*0.6,wy+wh*0.15,u*5,u*5);c.fillStyle='#1a0608';for(let i=0;i<5;i++)c.fillRect(wx+i*ww/5,wy+wh*0.75-((i*37)%5)*u,ww/5+1,wh);
 for(let i=0;i<4;i++){c.fillStyle='rgba(230,200,200,0.12)';c.fillRect(wx+((t*12*(i+1)+i*90)%(ww+80))-60,wy+wh*(0.3+i*0.15),70,u*3)}
 c.fillStyle='#3a2418';c.fillRect(wx+ww/2-u/2,wy,u,wh);c.fillRect(wx,wy+wh/2-u/2,ww,u);
 // swaying hook chains
 for(const[k,x0]of[[0,0.18],[1,0.86],[2,0.44]]){const x=W*x0-px*0.8,a=Math.sin(t*1.3+k)*0.12,L=H*(0.22+k*0.05);c.save();c.translate(x,0);c.rotate(a);for(let y=0;y<L;y+=u*3){c.fillStyle=y%(u*6)?'#555':'#777';c.fillRect(-u,y,u*2,u*2)}c.strokeStyle='#999';c.lineWidth=u;c.beginPath();c.arc(-u*2,L+u*2,u*3,0,Math.PI);c.stroke();c.restore()}
 // floor
 for(let r=0;r<6;r++){c.fillStyle=r%2?'#2e1a12':'#352016';c.fillRect(0,fy+r*(H-fy)/6,W,(H-fy)/6+1)}
 // candles with flicker + glow
 for(const x0 of [0.3,0.72]){const x=W*x0-px,y=fy-u*2,fl=0.8+Math.random()*0.3;vbox(c,x-u*4,y-u*10,u*8,u*10,'#4a3020');vbox(c,x-u,y-u*16,u*2,u*6,'#e8e0c8');c.fillStyle='#ffb040';c.fillRect(x-u/2,y-u*18*fl,u,u*2);
  const gl=c.createRadialGradient(x,y-u*17,0,x,y-u*17,H*0.3*fl);gl.addColorStop(0,'rgba(255,170,80,0.25)');gl.addColorStop(1,'rgba(255,170,80,0)');c.fillStyle=gl;c.fillRect(x-H*0.3,y-u*17-H*0.3,H*0.6,H*0.6)}
}},
 graveyard:{name:'Кладбище в тумане',price:40,draw(c,W,H,t,u,px,fy){
  const g=c.createLinearGradient(0,0,0,fy);g.addColorStop(0,'#05070f');g.addColorStop(1,'#1a2030');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.fillStyle='#e8e8d0';c.fillRect(W*0.75-px*0.2,H*0.1,u*10,u*10);glow(c,W*0.75-px*0.2+u*5,H*0.1+u*5,H*0.25,'rgba(200,210,255,0.25)');
  for(let i=0;i<40;i++){c.fillStyle='rgba(255,255,255,'+(0.3+0.3*Math.sin(t*2+i))+')';c.fillRect((i*137)%W,(i*71)%(fy*0.6),u/2+1,u/2+1)}
  c.fillStyle='#0c0e14';for(let x=0;x<W;x+=u*6){const h=(Math.sin(x*0.05)+1)*u*6+u*10;c.fillRect(x-px*0.4,fy-h,u*6+1,h)}
  c.fillStyle='#1a1c18';c.fillRect(0,fy,W,H-fy);
  for(const[x0,k]of[[0.12,1],[0.25,0.8],[0.78,1.1],[0.9,0.9],[0.38,0.7]]){const x=W*x0-px*0.8,h=u*14*k;vbox(c,x-u*4,fy-h+u*4,u*8,h,'#5a5a60');c.fillStyle='#2a2a30';c.fillRect(x-u,fy-h+u*7,u*2,u*5);c.fillRect(x-u*2.5,fy-h+u*8,u*5,u*1.5)}
  vbox(c,W*0.62-px*0.6,fy-u*30,u*3,u*30,'#2a1a10');vbox(c,W*0.62-px*0.6-u*8,fy-u*28,u*18,u*2,'#2a1a10');// gallows-tree
  for(let i=0;i<6;i++){c.fillStyle='rgba(200,210,230,0.10)';c.fillRect(((t*15*(1+i%3)+i*170)%(W+300))-200,fy-u*(4+i*3),300,u*6)}}},
 cabin:{name:'Затопленная каюта',price:60,draw(c,W,H,t,u,px,fy){
  c.fillStyle='#14100c';c.fillRect(0,0,W,H);for(let x=0;x<W;x+=u*10){c.fillStyle='#1c1610';c.fillRect(x-px*0.3,0,u*9,fy);c.fillStyle='#0c0806';c.fillRect(x-px*0.3+u*9,0,u,fy)}
  for(const x0 of [0.2,0.8]){const x=W*x0-px*0.5,y=H*0.25;c.fillStyle='#3a3020';c.beginPath();c.arc(x,y,u*9,0,6.3);c.fill();c.fillStyle='#0a2030';c.beginPath();c.arc(x,y,u*7,0,6.3);c.fill();c.fillStyle='rgba(120,180,220,0.3)';c.fillRect(x-u*5,y+Math.sin(t*1.5+x0*9)*u*3,u*10,u*2)}
  const a=Math.sin(t*1.4)*0.5,lx=W*0.5-px*0.7,L=H*0.22;c.strokeStyle='#555';c.lineWidth=u;c.beginPath();c.moveTo(lx,0);c.lineTo(lx+Math.sin(a)*L,Math.cos(a)*L);c.stroke();
  const ex=lx+Math.sin(a)*L,ey=Math.cos(a)*L;glow(c,ex,ey+u*4,H*0.45,'rgba(255,190,90,0.35)');vbox(c,ex-u*3,ey,u*6,u*8,'#6a5a30');c.fillStyle='#ffd070';c.fillRect(ex-u*1.5,ey+u*2,u*3,u*4);
  const wy=fy+u*2+Math.sin(t*1.2)*u;c.fillStyle='#1a1410';c.fillRect(0,fy,W,H-fy);c.fillStyle='rgba(30,70,90,0.75)';c.fillRect(0,wy,W,H-wy);
  for(let i=0;i<12;i++){c.fillStyle='rgba(160,210,230,0.35)';c.fillRect(((i*97+t*20)%W),wy+((i*31)%(H-wy)),u*6,u/2+1)}
  vbox(c,W*0.15-px,fy-u*6,u*14,u*8,'#4a3a22');vbox(c,W*0.84-px,fy-u*4,u*8,u*6,'#3a2a1a')}},
 barn:{name:'Горящий амбар',price:80,draw(c,W,H,t,u,px,fy){
  const g=c.createLinearGradient(0,0,0,fy);g.addColorStop(0,'#1a0604');g.addColorStop(1,'#6a1a08');c.fillStyle=g;c.fillRect(0,0,W,H);
  for(let x=0;x<W;x+=u*7){c.fillStyle=(x/u/7)%2?'#3a1408':'#2e1006';c.fillRect(x-px*0.3,H*0.08,u*7,fy-H*0.08)}c.fillStyle='#1a0804';c.fillRect(0,H*0.06,W,u*3);
  for(let i=0;i<5;i++){c.fillStyle='#2a1006';c.fillRect(W*(0.1+i*0.2)-px*0.5,H*0.06,u*3,fy-H*0.06)}
  for(let i=0;i<14;i++){const x=W*(i/14)-px*0.6,fh=u*(10+8*Math.abs(Math.sin(t*6+i*1.7)));c.fillStyle='#ff6010';c.fillRect(x,fy-fh,u*5,fh);c.fillStyle='#ffc040';c.fillRect(x+u,fy-fh*0.6,u*3,fh*0.6);glow(c,x+u*2,fy-fh/2,H*0.18,'rgba(255,120,30,0.18)')}
  c.fillStyle='#2a1a0c';c.fillRect(0,fy,W,H-fy);vbox(c,W*0.2-px,fy-u*10,u*16,u*10,'#c8a040');vbox(c,W*0.78-px,fy-u*8,u*14,u*8,'#b89030');
  for(let i=0;i<30;i++){const y=(H-((t*40*(1+i%4)+i*53)%H));c.fillStyle='rgba(255,'+(120+i*4)+',40,0.8)';c.fillRect((i*83+Math.sin(t+i)*20)%W,y,u/2+1,u/2+1)}
  c.fillStyle='rgba(20,10,8,0.35)';c.fillRect(0,0,W,H*0.2)}},
 chapel:{name:'Ледяная часовня',price:100,draw(c,W,H,t,u,px,fy){
  c.fillStyle='#0c1420';c.fillRect(0,0,W,H);for(let x=0;x<W;x+=u*12){c.fillStyle='#142030';c.fillRect(x-px*0.3,0,u*10,fy)}
  const wx=W*0.5-px*0.5;c.fillStyle=OUT;c.fillRect(wx-u*12,H*0.06,u*24,H*0.4);const cols=['#4060a0','#a03040','#40a080','#c0a040'];for(let i=0;i<12;i++){c.fillStyle=cols[i%4];c.fillRect(wx-u*11+(i%4)*u*5.5,H*0.07+Math.floor(i/4)*H*0.13,u*5,H*0.12)}
  glow(c,wx,H*0.25,H*0.4,'rgba(150,200,255,0.18)');
  for(const x0 of [0.15,0.85]){const x=W*x0-px*0.7;vbox(c,x-u*4,u*4,u*8,fy-u*4,'#2a3a50');for(let i=0;i<5;i++){c.fillStyle='#c8e8ff';c.fillRect(x-u*4+i*u*2,fy*0.5,u,u*(3+((i*7)%5))*(0.9+0.1*Math.sin(t+i)))}}
  c.fillStyle='#a8c0d8';c.fillRect(0,fy,W,H-fy);c.fillStyle='#d8e8f8';for(let i=0;i<20;i++)c.fillRect((i*131)%W,fy+((i*29)%(H-fy)),u*4,u);
  for(let i=0;i<50;i++){const y=(t*20*(1+i%3)+i*37)%H;c.fillStyle='rgba(240,248,255,0.7)';c.fillRect((i*71+Math.sin(t+i)*30)%W,y,u/2+1,u/2+1)}}}
};
