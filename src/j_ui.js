/* ===== j_ui: touch controls (joystick + buttons with drag-to-aim), keyboard, HUD, Russian menus ===== */
const IN={joy:null,keys:new Set(),mouse:{x:0,y:0},ptr:new Map(),touch:false,paused:false};
function btnLayout(G){const W=R.W,H=R.H,r=Math.max(26,Math.min(W,H)*0.085),P=G.player,B=[];if(!P)return B;
 if(P.side==='k'){B.push({id:'atk',x:W-r*1.5,y:H-r*1.5,r:r*1.15,label:'Атака',col:'#8a1a1a'});B.push({id:'act',x:W-r*3.9,y:H-r*1.0,r:r*0.85,label:'Действие',col:'#4a3a2a'});
  B.push({id:'ab0',x:W-r*1.3,y:H-r*4.0,r:r*0.85,label:P.def.ab[0].name,ab:0,col:'#3a2a5a'});B.push({id:'ab1',x:W-r*3.6,y:H-r*3.2,r:r*0.85,label:P.def.ab[1].name,ab:1,col:'#3a2a5a'})}
 else{B.push({id:'act',x:W-r*1.5,y:H-r*1.5,r:r*1.15,label:'Действие',col:'#2a4a3a'});B.push({id:'ab0',x:W-r*3.9,y:H-r*1.0,r:r*0.85,label:P.def.ab.name,ab:0,col:'#3a2a5a'});B.push({id:'prone',x:W-r*1.3,y:H-r*4.0,r:r*0.75,label:P.prone?'Встать':'Лечь',col:'#3a3a3a'})}
 B.push({id:'pause',x:W-22,y:22,r:16,label:'II',col:'#2a1a1a',small:true});return B}
function hitBtn(G,x,y){for(const b of btnLayout(G))if(Math.hypot(x-b.x,y-b.y)<b.r+6)return b;return null}
function onDown(ev){const G=WP.G;AU.init();if(!G||IN.paused||G.over)return;ev.preventDefault();const x=ev.clientX,y=ev.clientY;if(ev.pointerType==='touch')IN.touch=true;const P=G.player;
 const b=hitBtn(G,x,y);if(b){IN.ptr.set(ev.pointerId,{b,x0:x,y0:y});
  if(b.id==='pause'){pauseGame();return}if(!P||P.st==='dead'||P.st==='out')return;
  if(b.id==='atk')P.in.atk=true;if(b.id==='prone'){if(P.st==='ok'&&!P.act)P.prone=!P.prone}
  if(b.ab!=null)P.aim={i:b.ab,ang:P.face,drag:false};return}
 if(x<R.W*0.55&&!IN.joy){IN.joy={id:ev.pointerId,ox:x,oy:y,x,y};return}
 if(ev.pointerType==='mouse'&&P&&P.side==='k'){P.face=Math.atan2(y-(R.H/2),x-(R.W/2));P.in.atk=true}}
function onMove(ev){const G=WP.G;IN.mouse.x=ev.clientX;IN.mouse.y=ev.clientY;if(!G)return;const P=G.player;
 if(IN.joy&&IN.joy.id===ev.pointerId){IN.joy.x=ev.clientX;IN.joy.y=ev.clientY}
 const p=IN.ptr.get(ev.pointerId);if(p&&p.b.ab!=null&&P&&P.aim){const dx=ev.clientX-p.b.x,dy=ev.clientY-p.b.y;if(Math.hypot(dx,dy)>14){P.aim.ang=Math.atan2(dy,dx);P.aim.drag=true}}
 if(P&&P.aim&&IN.aimKey){P.aim.ang=Math.atan2(IN.mouse.y-(P.y-R.cam.y)*R.S-R.H/2,IN.mouse.x-(P.x-R.cam.x)*R.S-R.W/2)}}
function onUp(ev){const G=WP.G;if(IN.joy&&IN.joy.id===ev.pointerId)IN.joy=null;const p=IN.ptr.get(ev.pointerId);IN.ptr.delete(ev.pointerId);if(!G||!p)return;const P=G.player;
 if(p.b.ab!=null&&P&&P.aim){P.in.cast={i:P.aim.i,ang:P.aim.ang};P.aim=null}}
function onKey(ev,down){const G=WP.G,k=ev.code;if(down)IN.keys.add(k);else IN.keys.delete(k);if(!G||G.over)return;const P=G.player;if(down)AU.init();
 if(down&&k==='Escape'){IN.paused?resumeGame():pauseGame();return}if(!P||IN.paused)return;
 if(down&&!ev.repeat){if(k==='KeyC'&&P.side==='s'&&P.st==='ok'&&!P.act)P.prone=!P.prone;if((k==='KeyJ'||(k==='Space'&&P.side==='k')))P.in.atk=true;
  if(k==='KeyQ'||k==='KeyR'||k==='KeyF'){const i=k==='KeyQ'||P.side==='s'?0:1;P.aim={i,ang:P.face};IN.aimKey=k;onMove({clientX:IN.mouse.x,clientY:IN.mouse.y,pointerId:-9})}}
 if(!down&&IN.aimKey===k&&P.aim){P.in.cast={i:P.aim.i,ang:P.aim.ang};P.aim=null;IN.aimKey=null}
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k))ev.preventDefault()}
function applyInput(G){const P=G.player;if(!P)return;let mx=0,my=0;const K=IN.keys;
 if(K.has('KeyW')||K.has('ArrowUp'))my-=1;if(K.has('KeyS')||K.has('ArrowDown'))my+=1;if(K.has('KeyA')||K.has('ArrowLeft'))mx-=1;if(K.has('KeyD')||K.has('ArrowRight'))mx+=1;
 let run=!(K.has('ShiftLeft')||K.has('ShiftRight'));
 if(IN.joy){const dx=IN.joy.x-IN.joy.ox,dy=IN.joy.y-IN.joy.oy,R0=50,d=Math.hypot(dx,dy);if(d>6){mx=dx/Math.max(d,R0);my=dy/Math.max(d,R0);run=d>R0*0.6}}
 P.in.mx=mx;P.in.my=my;P.in.run=run;
 let act=K.has('KeyE')||(P.side==='s'&&K.has('Space'));for(const p of IN.ptr.values())if(p.b.id==='act')act=true;P.in.act=act;
 if(P.aim&&!IN.aimKey&&!IN.ptr.size)P.aim=null;
}
/* ---- HUD ---- */
function hudBox(c,x,y,w,h,a){c.fillStyle='rgba(10,4,6,'+(a||0.7)+')';c.fillRect(x,y,w,h);c.strokeStyle='#5a2a2a';c.lineWidth=2;c.strokeRect(x+1,y+1,w-2,h-2)}
function drawHUD(G){
 const c=R.c,W=R.W,H=R.H,P=G.player,v=G.view,M=G.M;c.setTransform(R.dpr,0,0,R.dpr,0,0);c.textBaseline='middle';
 // survivors
 G.surv.forEach((s,i)=>{const x=8,y=8+i*30;hudBox(c,x,y,128,26,0.6);c.save();c.translate(x+14,y+23);c.scale(0.62,0.62);drawChar(c,s,0,0,'idle',0,{noShadow:true,face:Math.PI/2});c.restore();
  c.fillStyle=s===P?'#ffd890':'#e8dcc8';c.font='bold 11px sans-serif';c.textAlign='left';c.fillText(s.def.name,x+28,y+9);
  const st={ok:s.hp<s.maxhp?'ранен':'цел',down:'на земле',carried:'несут',hooked:'на крюке',dead:'мёртв',out:'сбежал'}[s.st];
  c.fillStyle=s.st==='dead'?'#ff5050':s.st==='out'?'#80ff80':s.st==='hooked'?'#ff9060':'#bba';c.font='9px sans-serif';c.fillText(st+(s.hookN?' · крюк '+s.hookN+'/3':''),x+28,y+20);
  c.fillStyle='#300';c.fillRect(x+92,y+16,32,5);c.fillStyle='#c02030';c.fillRect(x+92,y+16,32*Math.max(0,s.hp)/s.maxhp,5)});
 // generators
 const gx=W/2-M.gens.length*15;hudBox(c,gx-8,6,M.gens.length*30+16,36,0.6);M.gens.forEach((g,i)=>{const x=gx+i*30;c.fillStyle=g.done?'#80ff80':'#555';c.fillRect(x+3,12,22,14);c.fillStyle='#111';c.fillRect(x+5,14,18,10);c.fillStyle=g.done?'#80ff80':'#f0c040';c.fillRect(x+5,24-10*g.p,18,10*g.p);c.fillStyle='#ccc';c.font='8px sans-serif';c.textAlign='center';c.fillText(M.floors[g.f].name.split(' ')[0].slice(0,6),x+14,34)});
 c.fillStyle='#ffe0a0';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText(G.powered?(G.collapseBy==='timer'?'Хозяин теряет терпение: ':'Ворота под током! Коллапс: ')+Math.max(0,Math.ceil(G.collapse))+' с':'Генераторы: '+G.gensDone+' / '+G.needGens,W/2,52);
 if(!G.powered&&G.collapse>=0){}
 // floor label
 c.textAlign='left';hudBox(c,8,128,150,20,0.6);c.fillStyle='#ffd070';c.font='bold 11px sans-serif';c.fillText('⌂ '+M.floors[v.f].name,14,138);
 if(v!==P){c.fillStyle='#fff';c.textAlign='center';c.font='bold 14px sans-serif';c.fillText('Наблюдение: '+(v.def.name),W/2,H-20)}
 // messages
 G.msgs.forEach((m,i)=>{c.globalAlpha=Math.min(1,m.t);c.fillStyle=m.col;c.font='bold 13px sans-serif';c.textAlign='center';c.fillText(m.txt,W/2,74+i*17)});c.globalAlpha=1;
 if(!P||P.st==='dead'||P.st==='out')return;
 // interaction prompt
 const opts=interactOptions(G,P);let lbl=null,pr=null;
 if(P.act){lbl=({repair:'Починка…',unhook:'Снимаю…',revive:'Поднимаю…',heal:'Лечу…',gate:'Открываю…',medkit:'Аптечка…',pickup:'Поднимаю…',hook:'Вешаю…',break:'Ломаю…',kick:'Пинаю…',vault:'',knock:''})[P.act.type];pr=P.act.type==='repair'?P.act.target.p:P.act.type==='heal'?P.act.target.hp/P.act.target.maxhp:P.act.type==='medkit'?P.hp/P.maxhp:P.act.dur?P.act.t/P.act.dur:null}
 else if(opts.length)lbl=opts[0].label+(IN.touch?'':' [E]');
 if(P.st==='carried'){lbl='Вырывайтесь! (держите Действие)';pr=P.wig}else if(P.st==='hooked'){lbl='Вы на крюке… ждите помощи';pr=P.hookT/(P.hookN===1?60:35)}else if(P.st==='down'){lbl='Вы ранены и ползёте';pr=1-P.downT/120}
 if(lbl){c.font='bold 14px sans-serif';const w=Math.max(160,c.measureText(lbl).width+30);hudBox(c,W/2-w/2,H-76,w,pr!=null?40:26,0.75);c.fillStyle='#f3e3c0';c.textAlign='center';c.fillText(lbl,W/2,H-63);if(pr!=null){c.fillStyle='#300';c.fillRect(W/2-w/2+10,H-50,w-20,6);c.fillStyle='#e0b040';c.fillRect(W/2-w/2+10,H-50,(w-20)*clamp(pr,0,1),6)}}
 if(P.item){hudBox(c,8,152,150,20,0.6);c.fillStyle='#ddd';c.font='11px sans-serif';c.textAlign='left';c.fillText((P.item==='medkit'?'✚ Аптечка ':'⚒ Инструменты ')+Math.ceil(P.itemCharge),14,162)}
 if(P.side==='k'&&P.buff.sense>0){c.fillStyle='#ff8080';c.font='bold 13px sans-serif';c.textAlign='center';c.fillText('Чутьё: '+P.buff.sense.toFixed(1)+' с',W/2,H-90)}
 // joystick
 if(IN.joy){c.strokeStyle='rgba(255,230,200,0.35)';c.lineWidth=3;c.beginPath();c.arc(IN.joy.ox,IN.joy.oy,50,0,6.283);c.stroke();const dx=IN.joy.x-IN.joy.ox,dy=IN.joy.y-IN.joy.oy,d=Math.hypot(dx,dy),k=d>50?50/d:1;c.fillStyle='rgba(255,230,200,0.45)';c.beginPath();c.arc(IN.joy.ox+dx*k,IN.joy.oy+dy*k,22,0,6.283);c.fill()}
 else if(IN.touch){c.strokeStyle='rgba(255,230,200,0.15)';c.lineWidth=2;c.beginPath();c.arc(90,H-90,50,0,6.283);c.stroke();c.fillStyle='rgba(255,230,200,0.3)';c.font='11px sans-serif';c.textAlign='center';c.fillText('движение',90,H-90)}
 // buttons
 for(const b of btnLayout(G)){const cd=b.ab!=null?P.cd[b.ab]:0,max=b.ab!=null?(P.side==='k'?P.def.ab[b.ab].cd:P.def.ab.cd):1;
  c.fillStyle=OUT;c.beginPath();c.arc(b.x,b.y,b.r+2,0,6.283);c.fill();c.fillStyle=b.col;c.beginPath();c.arc(b.x,b.y,b.r,0,6.283);c.fill();c.fillStyle='rgba(255,255,255,0.12)';c.beginPath();c.arc(b.x,b.y-b.r*0.2,b.r*0.8,Math.PI,0);c.fill();
  if(cd>0){c.fillStyle='rgba(0,0,0,0.6)';c.beginPath();c.moveTo(b.x,b.y);c.arc(b.x,b.y,b.r,-Math.PI/2,-Math.PI/2+6.283*cd/max);c.fill();c.fillStyle='#fff';c.font='bold 13px sans-serif';c.textAlign='center';c.fillText(Math.ceil(cd),b.x,b.y+b.r*0.45)}
  c.fillStyle='#f5e8d0';c.font='bold '+(b.small?12:Math.round(b.r*0.32))+'px sans-serif';c.textAlign='center';c.fillText(b.label,b.x,b.y-(cd>0?4:0));
  if(!IN.touch&&!b.small){c.fillStyle='rgba(255,255,255,0.5)';c.font='9px sans-serif';c.fillText({atk:'ЛКМ/J',act:'E',ab0:'Q',ab1:'R',prone:'C'}[b.id]||'',b.x,b.y+b.r+9)}
  if(P.aim&&b.ab===P.aim.i){c.strokeStyle='#ffd070';c.lineWidth=3;c.beginPath();c.arc(b.x,b.y,b.r+4,0,6.283);c.stroke();c.fillStyle='#ffd070';c.beginPath();c.arc(b.x+Math.cos(P.aim.ang)*b.r*0.7,b.y+Math.sin(P.aim.ang)*b.r*0.7,6,0,6.283);c.fill()}}
}
/* ---- DOM menus (Russian) ---- */
const SET={side:'s',killer:'stitches',surv:'nora',map:'mansion',diff:1};
const UI=()=>document.getElementById('ui');
function charCanvas(side,id,sz){const cv=document.createElement('canvas');cv.width=sz;cv.height=sz;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;const def=side==='k'?KILLERS[id]:SURVS[id];const e={side,def,face:Math.PI*0.4,walk:0,item:null};c.scale(sz/48,sz/48);drawChar(c,e,24,side==='k'?44:42,'idle',0);return cv}
function showLore(){UI().innerHTML=`<div class="panel"><h2>История</h2><div class="lore">Каждый год в Америке бесследно исчезают тысячи людей. Полиция пишет «ушёл из дома», семьи клеят листовки. Но некоторые из пропавших просыпаются в <b>Стране Чудес</b> — мире, как две капли воды похожем на наш. Те же дома, те же дороги… только места здесь свои: особняк, где лестницы ведут не туда, деревня без жителей, корабль, который никуда не плывёт.<br><br>Этим миром правит <b>Хозяин</b>. Его никто не видел, но его слуги — Мистер Стежок, Бледная Невеста и Гнилая Челюсть — охотятся на новеньких и вешают их на крюки. Хозяин забирает тех, кто провисел слишком долго.<br><br>Говорят, если запустить старые генераторы, ворота наружу оживут. Говорят, кто-то даже вернулся.</div><button id="bk">Назад</button></div>`;document.getElementById('bk').onclick=showMenu}
function showHow(){UI().innerHTML=`<div class="panel"><h2>Как играть</h2><div class="lore"><b>Выжившие:</b> почините 4 генератора из 5, откройте ворота во дворе и сбегите. Опрокидывайте тумбы и шкафы в дверные проёмы — если убийца под ними, он оглушён. Пролезайте в щели в стенах (убийца не пролезет). Ложитесь, чтобы вас было хуже видно. Снимайте друзей с крюков.<br><b>Убийца:</b> бейте выживших, поднимайте упавших и вешайте на крюки. Третий крюк — смерть.<br><b>Сердце</b> над выжившим значит, что убийца рядом (на этом же этаже).<br><br><b>Телефон:</b> левая половина экрана — джойстик, справа кнопки. Способность: зажмите кнопку и тяните палец — видно траекторию, отпустите — применить.<br><b>Клавиатура:</b> WASD — ходьба, Shift — шагом, E — действие, Пробел — атака/действие, ЛКМ или J — атака, Q/R — способности (зажать и целиться мышью), C — лечь, Esc — пауза.</div><button id="bk">Назад</button></div>`;document.getElementById('bk').onclick=showMenu}
function showSetup(){const u=UI();const sel=(a,b)=>a===b?' sel':'';
 u.innerHTML=`<div class="panel"><h2>Новая охота</h2><div class="row"><button id="sS" class="${SET.side==='s'?'sel':''}">Играть за выжившего</button><button id="sK" class="${SET.side==='k'?'sel':''}">Играть за убийцу</button></div>
 <div id="cards" class="row"></div>
 <div class="row"><button data-m="mansion" class="${sel('mansion',SET.map)}">Особняк (4 этажа + двор)</button><button data-m="village" class="${sel('village',SET.map)}">Деревня (упрощ.)</button><button data-m="ship" class="${sel('ship',SET.map)}">Корабль (упрощ.)</button></div>
 <div class="row">${DIFF.map((d,i)=>`<button data-d="${i}" class="${SET.diff===i?'sel':''}">${d.name}</button>`).join('')}</div>
 <div class="row"><button id="go" style="font-size:22px;padding:12px 40px;background:#7a1a1a">В игру</button><button id="bk">Назад</button></div></div>`;
 const cards=document.getElementById('cards');
 const list=SET.side==='k'?Object.values(KILLERS):Object.values(SURVS);
 for(const d of list){const el=document.createElement('div');const cur=SET.side==='k'?SET.killer:SET.surv;el.className='card'+(cur===d.id?' sel':'');el.appendChild(charCanvas(SET.side,d.id,72));
  const ab=SET.side==='k'?d.ab.map(a=>`<i>${a.name}</i>: ${a.desc}`).join('<br>')+`<br><i>${d.passive.name}</i> (пассив): ${d.passive.desc}`:`ОЗ: ${d.hp}<br><i>${d.ab.name}</i>: ${d.ab.desc} (${d.ab.cd} с)`;
  el.insertAdjacentHTML('beforeend',`<b>${d.name}</b><br>${d.desc}<br>${ab}`);el.onclick=()=>{if(SET.side==='k')SET.killer=d.id;else SET.surv=d.id;showSetup()};cards.appendChild(el)}
 document.getElementById('sS').onclick=()=>{SET.side='s';showSetup()};document.getElementById('sK').onclick=()=>{SET.side='k';showSetup()};
 u.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{SET.map=b.dataset.m;showSetup()});u.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{SET.diff=+b.dataset.d;showSetup()});
 document.getElementById('bk').onclick=showMenu;document.getElementById('go').onclick=()=>{AU.init();startGame()}}
function startGame(o){o=o||{};const ids=Object.keys(SURVS);let surv;
 if(SET.side==='s'){surv=[SET.surv,...shuffleM(ids.filter(i=>i!==SET.surv)).slice(0,3)]}else surv=shuffleM(ids.slice()).slice(0,4);
 const G=newMatch({map:SET.map,killer:SET.side==='k'?SET.killer:(o.killer||Object.keys(KILLERS)[(Math.random()*3)|0]),surv,playerSide:SET.side,playerChar:SET.surv,diff:SET.diff,seed:o.seed});
 R.lastF=-1;R.cam.x=G.view.x;R.cam.y=G.view.y;UI().className='hide';IN.paused=false;G.endShown=false;say(G,SET.side==='k'?'Охота началась. Найди их.':'Почини генераторы и выберись!','#ffd890');return G}
function shuffleM(a){for(let i=a.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]]}return a}
function pauseGame(){if(!WP.G||WP.G.over)return;IN.paused=true;const u=UI();u.className='';u.innerHTML=`<div class="panel"><h2>Пауза</h2><button id="rs">Продолжить</button><button id="mm">Выйти в меню</button></div>`;document.getElementById('rs').onclick=resumeGame;document.getElementById('mm').onclick=()=>{WP.G=null;showMenu()}}
function resumeGame(){IN.paused=false;UI().className='hide'}
function showEnd(G){const r=G.result,P=G.player;let title;const rew=grantReward(G);
 if(P&&P.side==='k')title=r.kills>=3?'Хозяин доволен':r.kills===2?'Ничья. Хозяин молчит':'Они ушли…';else if(P)title=P.st==='out'?'Вы выбрались!':'Хозяин забрал вас';else title='Матч окончен';
 const rows=G.surv.map(s=>`<tr><td>${s.def.name}</td><td>${s.st==='out'?'сбежал(а)':'погиб(ла)'}</td><td>${s.stats.gens} ген.</td><td>${s.stats.unhooks} спас.</td></tr>`).join('');
 const u=UI();u.className='';u.innerHTML=`<div class="panel"><h1 style="font-size:32px">${title}</h1><div class="sub">${G.killer.def.name} · убито ${r.kills} · сбежало ${r.escapes} · награда ◉ ${rew} · ${Math.floor(r.time/60)}:${String(Math.floor(r.time%60)).padStart(2,'0')}</div><table style="margin:auto;font-size:14px">${rows}</table><div class="row"><button id="again">Ещё раз</button><button id="mm">Меню</button></div></div>`;
 document.getElementById('again').onclick=()=>startGame();document.getElementById('mm').onclick=()=>{WP.G=null;showMenu()}}
