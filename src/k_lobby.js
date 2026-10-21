/* ===== k_lobby: main menu as an animated lobby (room drawn in code, character on pedestal), profile, ranks, season, shop ===== */
const PROF_DEF={name:'Странник',lvl:1,xp:0,coins:120,souls:5,owned:[],bg:'parlor',tro:0,best:0,pxp:0,
 st:{games:0,wins:0,kGames:0,sGames:0,kills:0,hooks:0,escapes:0,gens:0,unhooks:0,revives:0,ranked:0},daily:{day:0,last:''},claimed:[]};
const PROF=JSON.parse(JSON.stringify(PROF_DEF));
try{const sv=JSON.parse(localStorage.getItem('twp_prof')||'{}');Object.assign(PROF,sv);PROF.st=Object.assign({},PROF_DEF.st,sv.st||{});PROF.daily=Object.assign({},PROF_DEF.daily,sv.daily||{})}catch(e){}
function saveProf(){try{localStorage.setItem('twp_prof',JSON.stringify(PROF))}catch(e){}}
/* ranks by trophies (кубки) */
const RANKS=[{n:'Пепел',t:0,c:'#9a8f86'},{n:'Кость',t:60,c:'#e8e0c8'},{n:'Ржавчина',t:150,c:'#c07040'},{n:'Кровь',t:300,c:'#e03030'},{n:'Тень',t:500,c:'#8060c0'},{n:'Хозяин',t:800,c:'#ffd060'}];
const rankOf=t=>{let r=0;for(let i=0;i<RANKS.length;i++)if(t>=RANKS[i].t)r=i;return r};
/* season pass: 10 tiers, 100 pass-XP each */
const SEASON={name:'Сезон I · Кровавая луна',end:Date.UTC(2026,11,31),tiers:[['coins',40],['souls',3],['coins',60],['bg','graveyard'],['coins',80],['souls',5],['coins',100],['bg','cabin'],['souls',8],['bg','chapel']]};
const passTier=()=>Math.min(10,Math.floor(PROF.pxp/100));
const DAILY=[['coins',20],['coins',30],['souls',2],['coins',40],['coins',50],['souls',4],['coins',100]];
const today=()=>new Date().toISOString().slice(0,10);
const dailyReady=()=>PROF.daily.last!==today();
function giveReward(k,v){if(k==='coins')PROF.coins+=v;else if(k==='souls')PROF.souls+=v;else if(k==='bg'&&!PROF.owned.includes('bg_'+v))PROF.owned.push('bg_'+v)}
const rewTxt=(k,v)=>k==='coins'?'◉ '+v:k==='souls'?'✦ '+v:'Фон «'+LBG[v].name+'»';
/* trophies for a ranked match: by result, scaled by difficulty */
function trophyDelta(G){const P=G.player,r=G.result;let d;if(P.side==='k')d=[-8,-4,2,8,12][Math.min(4,r.kills)];else d=P.st==='out'?10+Math.min(4,P.stats.gens):-6+Math.min(3,P.stats.gens+P.stats.unhooks);return Math.round(d*[0.5,1,1.5][G.diffIdx!=null?G.diffIdx:SET.diff])}
function grantReward(G){const P=G.player;if(!P)return 0;const r=P.side==='k'?10+G.result.kills*15:(P.st==='out'?40:10)+P.stats.gens*5;
 const win=P.side==='k'?G.result.kills>=3:P.st==='out',S=PROF.st;S.games++;if(win)S.wins++;if(P.side==='k'){S.kGames++;S.kills+=G.result.kills;S.hooks+=G.ev.hooks}else{S.sGames++;if(P.st==='out')S.escapes++;S.gens+=P.stats.gens;S.unhooks+=P.stats.unhooks}
 PROF.coins+=r;PROF.xp+=r;PROF.pxp+=Math.round(r*0.8);while(PROF.xp>=PROF.lvl*100){PROF.xp-=PROF.lvl*100;PROF.lvl++}
 G.troDelta=0;if(G.mode==='ranked'){S.ranked++;const d=trophyDelta(G);const before=PROF.tro;PROF.tro=Math.max(0,PROF.tro+d);G.troDelta=PROF.tro-before;PROF.best=Math.max(PROF.best,PROF.tro);if(win){PROF.souls+=1+rankOf(PROF.tro);G.soulsWon=1+rankOf(PROF.tro)}}
 saveProf();return r}
const SHOP=[{id:'skin_red',name:'Облик «Красный капюшон»',price:50,cur:'coins'},{id:'skin_ash',name:'Облик «Пепельная куртка»',price:80,cur:'coins'},{id:'skin_bone',name:'Облик «Костяная маска»',price:12,cur:'souls'},{id:'emote_wave',name:'Жест «Привет»',price:30,cur:'coins'},{id:'banner_moon',name:'Баннер «Луна»',price:60,cur:'coins'}];
const LB={raf:0,t:0,mx:0,my:0,dust:[]};
const lobbyChar=()=>SET.side==='k'?KILLERS[SET.killer]:SURVS[SET.surv];
/* ---- tiny pixel icons drawn in code (10x10 maps) ---- */
const ICONS={
 trophy:['..yyyyyy..','yyyyyyyyyy','y.yyyyyy.y','y.yyyyyy.y','.yyyyyyyy.','..yyyyyy..','...yyyy...','....yy....','..oooooo..','..oooooo..'],
 coin:['...yyyy...','..yYYYYy..','.yYyyyyYy.','.yYy..yYy.','.yYy..yYy.','.yYy..yYy.','.yYyyyyYy.','..yYYYYy..','...yyyy...','..........'],
 soul:['....bb....','...bBBb...','..bBwwBb..','..bwkwkb..','..bwwwwb..','..bBwwBb..','...bwwb...','..b.bb.b..','.b..b...b.','....b.....'],
 news:['.wwwwwww..','.wkkkkkw..','.wwwwwwwo.','.wkkkkwwo.','.wwwwwwwo.','.wkkkkkwo.','.wwwwwwwo.','.wkkkwwwo.','.wwwwwwwo.','..oooooo..'],
 friends:['..ss...ss.','.ssss.ssss','.sKKs.sKKs','.ssss.ssss','..ss...ss.','.rrrr.bbbb','rrrrrrbbbb','rrrrrrbbbb','rrrrrrbbbb','..........'],
 club:['.r......r.','.rrrrrrrr.','.rRRRRRRr.','.rRyyyyRr.','.rRyRRyRr.','.rRyyyyRr.','.rRRRRRRr.','.rrRRRRrr.','...rrrr...','....rr....'],
 cal:['.r.r..r.r.','rrrrrrrrrr','rrrrrrrrrr','wwwwwwwwww','wkwkwkwkww','wwwwwwwwww','wkwkwRRwww','wwwwwRRwww','wkwkwwwwww','wwwwwwwwww'],
 quest:['.oooooo...','owwwwwwo..','owgwkkwo..','owwwwwwo..','owgwkkwo..','owwwwwwo..','owrwkkwo..','owwwwwwo..','.oooooo...','..........'],
 shop:['...oooo...','..o....o..','.rrrrrrrr.','.rRRRRRRr.','.rRyyRRRr.','.rRyyRRRr.','.rRRRRRRr.','.rRRRRRRr.','.rrrrrrrr.','..........'],
 hood:['...RRRR...','..RRRRRR..','.RRssssR..','.RRsksk R.'.replace(' ','R'),'.RRssssR..','..RRRRRR..','.rrrrrrrr.','rrrrrrrrrr','rrrrrrrrrr','..........'],
 book:['.oooooooo.','oRRRRRRRwo','oRyyyyRRwo','oRRRRRRRwo','oRRyyRRRwo','oRRRRRRRwo','oRRRRRRRwo','oRRRRRRRwo','.oooooooo.','..........'],
 pass:['.pppppppp.','pPPPPPPPPp','pPyPPPPyPp','pPPyyyyPPp','pPPyRRyPPp','pPPyyyyPPp','pPyPPPPyPp','pPPPPPPPPp','.pppppppp.','..........'],
 skull:['..wwwwww..','.wwwwwwww.','wwwwwwwwww','wkkwwwwkkw','wkkwwwwkkw','wwwwkkwwww','.wwwwwwww.','..wkwkwk..','..wwwwww..','..........']};
const ICOL={y:'#e0a830',Y:'#ffe080',o:'#6a4020',b:'#3070b0',B:'#70b0f0',w:'#e8e0d0',k:'#1a1010',s:'#d8b090',K:'#402818',r:'#a02020',R:'#d04040',g:'#40a040',p:'#5a2060',P:'#8a3a90'};
const ICACHE={};
function icon(n){if(!ICACHE[n]){const m=ICONS[n],cv=document.createElement('canvas');cv.width=cv.height=10;const c=cv.getContext('2d');m.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ICOL[ch]){c.fillStyle=ICOL[ch];c.fillRect(x,y,1,1)}}));ICACHE[n]=cv.toDataURL()}return`<img class="ico" src="${ICACHE[n]}" alt="">`}
const fmtN=n=>n>=10000?(n/1000).toFixed(1)+'k':''+n;
/* ---- lobby ---- */
function showMenu(){IN.paused=false;const u=UI();u.className='lobby';
 const d=lobbyChar(),mapN={mansion:'Особняк',village:'Деревня',ship:'Корабль'}[SET.map],rk=rankOf(PROF.tro),nx=RANKS[rk+1],tier=passTier();
 const rkProg=nx?Math.round(100*(PROF.tro-RANKS[rk].t)/(nx.t-RANKS[rk].t)):100,days=Math.max(0,Math.ceil((SEASON.end-Date.now())/864e5));
 u.innerHTML=`<canvas id="lbcv"></canvas>
 <div class="lb-tl"><div class="chip lb-prof" id="bProf"><canvas class="av" id="lbAv" width="40" height="40"></canvas><div><div class="nm">${esc(PROF.name)}</div><div class="lv"><b>${PROF.lvl}</b><div class="bar"><em style="width:${Math.round(100*PROF.xp/(PROF.lvl*100))}%"></em></div></div></div></div>
  <div class="chip lb-tro" id="bTro">${icon('trophy')}<div><b>${PROF.tro}</b><span style="color:${RANKS[rk].c}">${RANKS[rk].n}</span></div></div>
  <div class="chip lb-sea" id="bSeason">${icon('pass')}<div><b>Сезон I</b><span>${days} дн.</span></div></div></div>
 <div class="lb-tr"><div class="chip lb-cur" id="lbCoins">${icon('coin')}${fmtN(PROF.coins)}</div><div class="chip lb-cur" id="lbSouls">${icon('soul')}${fmtN(PROF.souls)}</div><button id="bMenu" aria-label="Меню">☰</button></div>
 <div class="lb-col lb-l"><button id="bShop">${icon('shop')}Магазин<span class="tag">НОВОЕ</span></button><button id="bChars">${icon('hood')}Персонажи</button><button id="bLore">${icon('book')}Лор</button></div>
 <div class="lb-col lb-r"><button id="bNews">${icon('news')}Новости</button><button id="bFriends">${icon('friends')}Друзья</button><button id="bClub">${icon('club')}Клуб</button><button id="bDaily">${icon('cal')}${dailyReady()?'Награда!':'День '+(PROF.daily.day%7+1)}</button></div>
 <div class="lb-name"><button id="bPrev" class="lb-arr">‹</button><div><b>${d.name}</b><span>${SET.side==='k'?'Убийца':'Выживший · ОЗ '+d.hp}</span></div><button id="bNext" class="lb-arr">›</button></div>
 <div class="lb-bl"><div class="chip lb-pass" id="bPass"><div class="t"><b>Пропуск · ур. ${tier}</b><span>${PROF.pxp%100}/100</span></div><div class="bar"><em style="width:${tier>=10?100:PROF.pxp%100}%"></em></div></div><button id="bQuests">${icon('quest')}Квесты</button></div>
 <div class="lb-br"><div class="chip lb-mode" id="bCard"><span class="md${SET.mode==='ranked'?' rk':''}">${SET.mode==='ranked'?'РЕЙТИНГ':'ОБЫЧНЫЙ'}</span><b>${mapN}</b><span>${SET.side==='k'?'За убийцу':'За выжившего'} · ${DIFF[SET.diff].name}</span><small>сменить режим ›</small></div><button id="bPlay">ИГРАТЬ</button></div>`;
 const $=id=>document.getElementById(id),go=f=>()=>{stopLobby();f()};
 $('bPlay').onclick=()=>{AU.init();stopLobby();startGame()};$('bCard').onclick=go(showModes);$('bChars').onclick=go(showSetup);
 $('bLore').onclick=go(showLore);$('bShop').onclick=go(()=>showShop());$('bQuests').onclick=go(showTasks);$('bMenu').onclick=go(showGameMenu);
 $('bProf').onclick=go(showProfile);$('bTro').onclick=go(showTrophies);$('bSeason').onclick=go(showSeason);$('bPass').onclick=go(showSeason);
 $('lbCoins').onclick=go(()=>showShop('res'));$('lbSouls').onclick=go(()=>showShop('res'));
 $('bNews').onclick=go(showNews);$('bFriends').onclick=go(()=>showSoon('Друзья','friends','Играть с друзьями и звать их в лобби можно будет в одном из следующих обновлений. Пока Хозяин держит всех поодиночке.'));
 $('bClub').onclick=go(()=>showSoon('Клуб','club','Клубы — общие знамёна, чат и клубные задания. Скоро: сейчас мы строим для них комнату в Стране Чудес.'));$('bDaily').onclick=go(showDaily);
 const cyc=k=>{const L=Object.keys(SET.side==='k'?KILLERS:SURVS),key=SET.side==='k'?'killer':'surv';SET[key]=L[(L.indexOf(SET[key])+k+L.length)%L.length];showMenu()};$('bPrev').onclick=()=>cyc(-1);$('bNext').onclick=()=>cyc(1);
 drawAvatar($('lbAv'));
 const cv=$('lbcv');cv.onpointermove=e=>{LB.mx=e.clientX/innerWidth-0.5;LB.my=e.clientY/innerHeight-0.5};
 if(!LB.raf){let last=0;const loop=ts=>{const c=document.getElementById('lbcv');if(!c){LB.raf=0;return}LB.t+=Math.min(0.05,(ts-last)/1000||0);last=ts;drawLobby(c);LB.raf=requestAnimationFrame(loop)};LB.raf=requestAnimationFrame(loop)}
}
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function drawAvatar(cv,sz){const c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#2a1418';c.fillRect(0,0,cv.width,cv.height);const d=lobbyChar(),e={side:SET.side,def:d,face:Math.PI/2,walk:0,item:null};
 const k=Math.max(1,Math.floor(cv.width/40));c.save();c.scale(k,k);c.translate(20,SET.side==='k'?52:46);if(e.def.tall)c.scale(70/e.def.tall,70/e.def.tall);c.scale(1,1);drawChar(c,e,0,0,'idle',0,{noShadow:true});c.restore()}

function stopLobby(){if(LB.raf)cancelAnimationFrame(LB.raf);LB.raf=0}
function drawLobby(cv,o){o=o||{};
 const dpr=o.W?1:Math.min(2,devicePixelRatio||1),W=o.W||innerWidth,H=o.H||innerHeight;if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr)}
 const c=cv.getContext('2d'),t=LB.t,u=Math.max(1,Math.round(H/120)),bgSave=PROF.bg;if(o.bg)PROF.bg=o.bg;c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=false;
 const px=LB.mx*12+Math.sin(t*0.3)*4,fy=H*0.66;
 (LBG[PROF.bg]||LBG.parlor).draw(c,W,H,t,u,px,fy);
 // pedestal + character with idle animation
 const cx=W*0.5+px*0.3,py=fy+H*0.1;vbox(c,cx-u*22,py-u*6,u*44,u*8,'#4a4448');vbox(c,cx-u*18,py-u*12,u*36,u*7,'#5a5458');c.fillStyle='#a0302a';c.fillRect(cx-u*16,py-u*12,u*32,u);
 const d=lobbyChar(),e={side:SET.side,def:d,face:Math.PI/2+Math.sin(t*0.7)*0.5,walk:0,item:null};c.save();c.translate(Math.round(cx*dpr)/dpr,Math.round((py-u*12+Math.sin(t*2)*u*0.5)*dpr)/dpr);const sc=Math.max(1,Math.round(H*0.36/(d.tall||(SET.side==='k'?70:44))*dpr))/dpr;c.scale(sc,sc);drawChar(c,e,0,0,'idle',t,{});c.restore();
 // dust particles (foreground)
 PROF.bg=bgSave;if(!o.W&&LB.dust.length<50)LB.dust.push({x:Math.random()*W,y:Math.random()*H,v:fr(4,14),s:fr(1,2.5)});for(const p of LB.dust){p.y-=p.v*0.016;p.x+=Math.sin(t+p.y*0.02)*0.2;if(p.y<0)p.y=H;c.fillStyle='rgba(240,220,190,0.35)';c.fillRect(p.x-px*1.5,p.y,p.s*u/2,p.s*u/2)}
 const v=c.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,W*0.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,0.75)');c.fillStyle=v;c.fillRect(0,0,W,H);
}

/* ---- screens opened from the lobby (all scroll + round X back to lobby) ---- */
function subPage(title,html,after){page(`<h2>${title}</h2>${html}<div class="row"><button id="bk">Назад</button></div>`);document.getElementById('bk').onclick=showMenu;after&&after()}
function showSoon(title,ic,text){subPage(title,`<div class="soon">${icon(ic).replace('class="ico"','class="ico" style="width:64px;height:64px"')}<h3>Скоро</h3><div class="lore">${text}</div></div>`)}
function showProfile(){const S=PROF.st,rk=rankOf(PROF.tro),wr=S.games?Math.round(100*S.wins/S.games):0;
 subPage('Профиль',`<div class="soon" style="max-width:520px"><canvas id="pfAv" width="96" height="96" style="width:96px;height:96px;border-radius:16px"></canvas>
 <div class="row" style="align-items:center"><input id="pfName" maxlength="16" value="${esc(PROF.name)}" style="font:inherit;font-size:18px;border-radius:10px;border:3px solid #6a2228;background:#1a0d10;color:#f3d9a8;padding:6px 10px;width:180px;text-align:center"><button id="pfSave">Сохранить</button></div>
 <div class="sub">Уровень ${PROF.lvl} · ${icon('trophy')} ${PROF.tro} (рекорд ${PROF.best}) · ранг <b style="color:${RANKS[rk].c}">${RANKS[rk].n}</b></div>
 <table style="margin:auto;font-size:14px;text-align:left">
 <tr><td>Матчей</td><td>${S.games}</td><td>Побед</td><td>${S.wins} (${wr}%)</td></tr>
 <tr><td>За убийцу</td><td>${S.kGames}</td><td>За выжившего</td><td>${S.sGames}</td></tr>
 <tr><td>Убийств</td><td>${S.kills}</td><td>Повешено</td><td>${S.hooks}</td></tr>
 <tr><td>Побегов</td><td>${S.escapes}</td><td>Генераторов</td><td>${S.gens}</td></tr>
 <tr><td>Спасений</td><td>${S.unhooks}</td><td>Рейтинговых</td><td>${S.ranked}</td></tr></table></div>`,()=>{drawAvatar(document.getElementById('pfAv'));
 document.getElementById('pfSave').onclick=()=>{const v=document.getElementById('pfName').value.trim().slice(0,16);if(v){PROF.name=v;saveProf()}showProfile()}})}
function showTrophies(){const rk=rankOf(PROF.tro),nx=RANKS[rk+1];
 subPage('Кубки и ранги',`<div class="sub">${icon('trophy')} <b style="font-size:20px;color:#ffd060">${PROF.tro}</b> кубков · рекорд ${PROF.best}. Кубки дают и забирают только матчи в режиме «Рейтинг».</div>
 ${nx?`<div style="max-width:360px;margin:6px auto">До ранга «${nx.n}»: ${nx.t-PROF.tro}<div class="bar"><em style="width:${Math.round(100*(PROF.tro-RANKS[rk].t)/(nx.t-RANKS[rk].t))}%"></em></div></div>`:'<div class="sub">Высший ранг!</div>'}
 <div class="row">${RANKS.map((r,i)=>`<div class="card${i===rk?' sel':''}" style="width:120px"><b style="color:${r.c}">${r.n}</b><br>${icon('trophy')} ${r.t}+<br>${i<=rk?'✔ получен':'награда: ✦ '+(i*3)}</div>`).join('')}</div>`)}
function showSeason(){const tier=passTier();
 subPage(SEASON.name,`<div class="sub">Опыт пропуска даётся за каждый матч. Все награды бесплатные. Уровень ${tier}/10 · ${PROF.pxp%100}/100</div>
 <div class="row">${SEASON.tiers.map(([k,v],i)=>{const got=PROF.claimed.includes(i);return`<div class="card${i<tier?' sel':''}" style="width:110px"><b>Ур. ${i+1}</b><br>${rewTxt(k,v)}<br>${got?'✔ получено':i<tier?`<button data-tier="${i}">Забрать</button>`:'🔒'}</div>`}).join('')}</div>`,
 ()=>UI().querySelectorAll('[data-tier]').forEach(b=>b.onclick=()=>{const i=+b.dataset.tier;if(!PROF.claimed.includes(i)&&i<passTier()){giveReward(...SEASON.tiers[i]);PROF.claimed.push(i);saveProf()}showSeason()}))}
function showDaily(){const ready=dailyReady(),day=PROF.daily.day%7;
 subPage('Ежедневные награды',`<div class="sub">Заходи каждый день — награды растут. Пропустил день — серия продолжится с того же места.</div>
 <div class="row">${DAILY.map(([k,v],i)=>`<div class="card${i===day&&ready?' sel':''}" style="width:96px"><b>День ${i+1}</b><br>${rewTxt(k,v)}<br>${i<day||(i===day&&!ready)?'✔':''}</div>`).join('')}</div>
 <div class="row"><button id="dClaim" ${ready?'':'disabled'}>${ready?'Забрать награду':'Приходи завтра'}</button></div>`,()=>{document.getElementById('dClaim').onclick=()=>{if(!dailyReady())return;giveReward(...DAILY[PROF.daily.day%7]);PROF.daily.day++;PROF.daily.last=today();saveProf();showDaily()}})}
function showNews(){subPage('Новости',`<div class="lore" style="text-align:left">
 <h3>v0.1.1 — Новый лобби и рейтинг</h3>• Режим «Рейтинг»: кубки за победы, ранги от Пепла до Хозяина.<br>• Профиль со статистикой, сезонный пропуск и ежедневные награды.<br>• Стрелки в матче: к генераторам, союзникам и крюкам, с подсказкой лестниц.<br>• Крюки собраны в виселицы — по одной на зону.<br>• Магазин с разделами, скруглённый интерфейс, ровные пиксели.
 <h3>v0.1.0 — Первая охота</h3>• Особняк, Деревня и Корабль. 3 убийцы, 5 выживших.</div>`)}
function showGameMenu(){subPage('Меню',`<div class="row" style="flex-direction:column;align-items:center"><button id="mProf">Профиль</button><button id="mSet">Настройки</button><button id="mHow">Как играть</button><button id="mLore">Лор</button></div>`,()=>{
 const $=id=>document.getElementById(id);$('mProf').onclick=showProfile;$('mSet').onclick=showSettings;$('mHow').onclick=showHow;$('mLore').onclick=showLore})}
function showModes(){const sel=(a,b)=>a===b?' sel':'';
 subPage('Режим и карта',`<div class="row"><div class="card${sel(SET.mode,'normal')}" data-mode="normal" style="width:200px"><b>Обычный</b><br>Тренировка без риска. Кубки не меняются.</div>
 <div class="card${sel(SET.mode,'ranked')}" data-mode="ranked" style="width:200px"><b>Рейтинг ${icon('trophy')}</b><br>Победа даёт кубки, поражение забирает. Сложность влияет на число кубков.</div></div>
 <h3>Карта</h3><div class="row">${[['mansion','Особняк'],['village','Деревня'],['ship','Корабль']].map(([k,n])=>`<button data-m="${k}" class="${sel(SET.map,k)}">${n}</button>`).join('')}</div>
 <h3>Сторона</h3><div class="row"><button data-side="s" class="${sel(SET.side,'s')}">За выжившего</button><button data-side="k" class="${sel(SET.side,'k')}">За убийцу</button></div>
 <h3>Сложность ботов</h3><div class="row">${DIFF.map((d,i)=>`<button data-d="${i}" class="${SET.diff===i?'sel':''}">${d.name}</button>`).join('')}</div>`,()=>{const u=UI();
 u.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{SET.mode=b.dataset.mode;showModes()});u.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{SET.map=b.dataset.m;showModes()});
 u.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>{SET.side=b.dataset.side;showModes()});u.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{SET.diff=+b.dataset.d;showModes()})})}
const SHOP_TABS=[['deals','Акции'],['bg','Фоны'],['chars','Персонажи'],['res','Ресурсы']];
function showShop(tab){tab=tab||LB.shopTab||'deals';LB.shopTab=tab;const st=UI().className==='page'?UI().scrollTop:0;let pane='';
 const buyBtn=(attr,id,price,cur)=>`<button ${attr}="${id}">${cur==='souls'?'✦':'◉'} ${price}</button>`;
 const deal=dealOfDay();
 if(tab==='deals')pane=`<div class="deal"><b style="font-size:18px">Акция дня: фон «${LBG[deal.id].name}»</b><br><canvas class="bgprev" data-bg="${deal.id}" width="150" height="84"></canvas><br><s>◉ ${LBG[deal.id].price}</s> → <b style="color:#ffd060">◉ ${deal.price}</b><br>${PROF.owned.includes('bg_'+deal.id)?'<i>Уже есть</i>':buyBtn('data-deal',deal.id,deal.price,'coins')}</div>
  <div class="deal" style="border-color:#6a2228"><b>Набор новичка</b><br>Скоро: облик + фон + ✦ одним набором. Только за игровые монеты.</div>`;
 else if(tab==='bg')pane=`<div class="row">${Object.entries(LBG).map(([id,b])=>`<div class="card" id="bg_${id}"><canvas class="bgprev" data-bg="${id}" width="150" height="84"></canvas><b>${b.name}</b><br>${PROF.bg===id?'<i>Выбран</i>':(id==='parlor'||PROF.owned.includes('bg_'+id))?`<button data-equip="${id}">Выбрать</button>`:buyBtn('data-buybg',id,b.price,'coins')}</div>`).join('')}</div>`;
 else if(tab==='chars')pane=`<div class="row">${SHOP.map(i=>`<div class="card"><b>${i.name}</b><br>${PROF.owned.includes(i.id)?'Куплено':buyBtn('data-buy',i.id,i.price,i.cur)}</div>`).join('')}</div><div class="sub">Облики пока видны только в профиле (заглушка).</div>`;
 else pane=`<div class="row"><div class="card" style="width:170px">${icon('soul')}<b>5 душ</b><br>Обмен монет на души<br>${buyBtn('data-ex','5',100,'coins')}</div><div class="card" style="width:170px">${icon('soul')}<b>12 душ</b><br>Выгоднее<br>${buyBtn('data-ex','12',220,'coins')}</div><div class="card" style="width:170px">${icon('coin')}<b>Монеты</b><br>Даются за матчи, пропуск и ежедневные награды. Купить за деньги нельзя.</div></div>`;
 subPage('Магазин',`<div class="sub">${icon('coin')} ${PROF.coins} · ${icon('soul')} ${PROF.souls}. Только украшения и честные цены — без сундуков и реальных денег.</div>
 <div class="shop"><div class="tabs">${SHOP_TABS.map(([k,n])=>`<button data-tab="${k}" class="${tab===k?'sel':''}">${n}</button>`).join('')}</div><div class="tabpane">${pane}</div></div>`,()=>{const u=UI();u.scrollTop=st;shopPreviews();
 u.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showShop(b.dataset.tab));
 u.querySelectorAll('[data-buybg]').forEach(b=>b.onclick=()=>{const id=b.dataset.buybg,p=LBG[id].price;if(PROF.coins>=p){PROF.coins-=p;PROF.owned.push('bg_'+id);PROF.bg=id;saveProf()}showShop()});
 u.querySelectorAll('[data-deal]').forEach(b=>b.onclick=()=>{const id=b.dataset.deal;if(PROF.coins>=deal.price&&!PROF.owned.includes('bg_'+id)){PROF.coins-=deal.price;PROF.owned.push('bg_'+id);PROF.bg=id;saveProf()}showShop()});
 u.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{PROF.bg=b.dataset.equip;saveProf();showShop()});
 u.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const i=SHOP.find(x=>x.id===b.dataset.buy),k=i.cur;if(PROF[k]>=i.price){PROF[k]-=i.price;PROF.owned.push(i.id);saveProf()}showShop()});
 u.querySelectorAll('[data-ex]').forEach(b=>b.onclick=()=>{const n=+b.dataset.ex,p=n===5?100:220;if(PROF.coins>=p){PROF.coins-=p;PROF.souls+=n;saveProf()}showShop()})})}
function dealOfDay(){const ids=Object.keys(LBG).filter(k=>k!=='parlor'),d=Math.floor(Date.now()/864e5);const id=ids[d%ids.length];return{id,price:Math.round(LBG[id].price*0.7)}}
function shopPreviews(){const step=()=>{const L=document.querySelectorAll('.bgprev');if(!L.length)return;LB.t+=0.033;for(const cv of L)drawLobby(cv,{W:150,H:84,bg:cv.dataset.bg});setTimeout(step,66)};step()}
function showTasks(){subPage('Квесты',`<div class="lore" style="text-align:left">${[['Почини 3 генератора',PROF.st.gens,3,'◉ 20'],['Повесь 2 выживших на крюк',PROF.st.hooks,2,'◉ 20'],['Сбеги через ворота',PROF.st.escapes,1,'◉ 30'],['Сыграй рейтинговый матч',PROF.st.ranked,1,'✦ 2']].map(([n,v,m,r])=>`<div style="margin:8px 0">${n} — ${r}<div class="bar"><em style="width:${Math.min(100,Math.round(100*v/m))}%"></em></div><small>${Math.min(v,m)}/${m}</small></div>`).join('')}<i>Награды за квесты появятся в следующем обновлении (заглушка), прогресс уже считается.</i></div>`)}
function showSettings(){subPage('Настройки',`<div class="row"><button id="bSnd">Звук: ${AU.on?'вкл':'выкл'}</button><button id="bHow">Как играть</button><button id="bArr">Стрелки: ${SET.arrows===false?'выкл':'вкл'}</button><button id="bReset">Сбросить прогресс</button></div>`,()=>{
 document.getElementById('bSnd').onclick=()=>{AU.on=!AU.on;if(AU.master)AU.master.gain.value=AU.on?0.6:0;showSettings()};document.getElementById('bHow').onclick=showHow;
 document.getElementById('bArr').onclick=()=>{SET.arrows=SET.arrows===false;showSettings()};
 document.getElementById('bReset').onclick=()=>{Object.assign(PROF,JSON.parse(JSON.stringify(PROF_DEF)));saveProf();showSettings()}})}

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
