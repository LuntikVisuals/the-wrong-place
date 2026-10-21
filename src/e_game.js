/* ===== e_game: match setup, entities, ability shapes (shared by drawing & logic), interactions, combat ===== */
function mkEnt(side,def,f,tx,ty){
 const e={id:0,side,def,f,x:cc(tx),y:cc(ty),r:side==='k'?11:9,face:Math.PI/2,vx:0,vy:0,
  in:{mx:0,my:0,run:true,act:false,atk:false,cast:null,want:null},aim:null,
  cd:side==='k'?[0,0,0,0]:[0],buff:{},st:'ok',hp:0,maxhp:0,hookN:0,hookT:0,downT:0,carry:null,carrier:null,act:null,
  stun:0,blind:0,slow:0,slowMul:1,burst:0,climb:null,stairCd:0,lunge:0,wipe:0,prone:false,inGap:false,item:null,itemCharge:0,
  walk:0,moving:false,hitT:0,wig:0,vanish:0,pounce:null,pull:null,isPlayer:false,bot:null,stats:{hits:0,downs:0,hooks:0,gens:0,unhooks:0,abil:0,stuns:0,stairs:0,floors:new Set()},bleedT:0,lastProj:0};
 if(side==='s'){e.hp=e.maxhp=def.hp}
 return e;
}
function newMatch(o){
 // o: {map, killer, surv:[ids], playerSide:'k'|'s'|null, playerChar, diff, seed}
 const M=buildMap(o.map||'mansion');
 srand(o.seed||((Math.random()*1e9)|0));
 const G={M,t:0,ents:[],surv:[],killer:null,proj:[],fx:[],blood:[],msgs:[],shake:0,diff:DIFF[o.diff==null?1:o.diff],diffI:o.diff==null?1:o.diff,
  gensDone:0,needGens:Math.min(4,M.gens.length),powered:false,collapse:-1,collapseBy:'',over:false,result:null,seed:o.seed,sim:!!o.sim,
  ev:{hooks:0,kills:0,escapes:0,downs:0,hits:0,stuns:0,knocks:0,vaults:0,unhooks:0,revives:0,stairs:0,gates:0,abil:0,blinds:0,pulls:0,pounces:0,veils:0,whispers:0,heals:0,wiggleOut:0,crossFloorHits:0,breaks:0}};
 G.tracks=[];initWeather(G);
 const K=mkEnt('k',KILLERS[o.killer],M.spawnK.f,M.spawnK.x,M.spawnK.y);K.id=0;G.killer=K;G.ents.push(K);
 const spots=shuffle(M.spawnS.slice());
 o.surv.forEach((sid,i)=>{const[f,x,y]=spots[i%spots.length];const s=mkEnt('s',SURVS[sid],f,x,y);s.id=i+1;G.surv.push(s);G.ents.push(s)});
 for(const e of G.ents){e.stats.floors.add(e.f);if(o.playerSide===e.side&&!G.player&&(e.side==='k'||e.def.id===o.playerChar)){e.isPlayer=true;G.player=e}else e.bot=mkBot(e,G)}
 G.view=G.player||G.killer;
 WP.G=G;return G;
}
function say(G,txt,col){G.msgs.push({txt,t:4,col:col||'#f0e0c0'});if(G.msgs.length>5)G.msgs.shift()}
function shakeAt(G,e,a){if(G.view&&G.view.f===e.f&&dist(G.view,e)<400)G.shake=Math.max(G.shake,a)}
function sfxAt(G,e,n,near){if(G.sim)return;const v=G.view;if(!v||v.f!==e.f||dist(v,e)>(near||600))return;AU.sfx(n)}
function aliveS(s){return s.st==='ok'||s.st==='hidden'||s.st==='down'||s.st==='carried'||s.st==='hooked'}

/* ---- shared trajectory: walk a line until wall/solid; used by aim preview AND projectiles/dashes ---- */
function traceLine(G,e,ang,range,rad){
 const M=G.M,dx=Math.cos(ang),dy=Math.sin(ang),step=4;let x=e.x,y=e.y,d=0;
 while(d<range){const nx=x+dx*step,ny=y+dy*step;
  if(rad?!circleFree(M,e.f,nx,ny,rad,'k'):solidAt(M,e.f,tc(nx),tc(ny),'k')||OPAQUE[M.floors[e.f].g[idx(tc(nx),tc(ny))]])break;
  x=nx;y=ny;d+=step}
 return{x0:e.x,y0:e.y,x1:x,y1:y,len:d,ang};
}
/* first survivor touched along a trace (same floor only) */
function traceHit(G,e,tr,w){
 let best=null,bd=1e9;for(const s of G.surv){if(s.f!==e.f||s.st!=='ok'||s.climb)continue;
  const dx=tr.x1-tr.x0,dy=tr.y1-tr.y0,L2=dx*dx+dy*dy||1,t=clamp(((s.x-tr.x0)*dx+(s.y-tr.y0)*dy)/L2,0,1),px=tr.x0+dx*t,py=tr.y0+dy*t;
  if(Math.hypot(s.x-px,s.y-py)<w+s.r&&t*Math.sqrt(L2)<bd){bd=t*Math.sqrt(L2);best=s}}
 return best;
}
/* Ability geometry: returns shape object used for drawing the aim AND executing. */
function abShape(G,e,i,ang){
 const ab=e.side==='k'?e.def.ab[i]:e.def.ab,M=G.M;if(!ab)return null;{const s2=abShape2(G,e,ab,ang);if(s2)return s2}
 switch(ab.id){
  case'rope':{const tr=traceLine(G,e,ang,ab.range,0);return{type:'ray',tr,hit:traceHit(G,e,tr,8),ab}}
  case'veil':{const tr=traceLine(G,e,ang,ab.range,0);return{type:'proj',tr,hit:traceHit(G,e,tr,14),ab}}
  case'pounce':{const tr=traceLine(G,e,ang,ab.range,e.r);return{type:'dash',tr,hit:traceHit(G,e,tr,e.r),ab}}
  case'rip':return{type:'ring',x:e.x,y:e.y,r:ab.radius,ab};
  case'sense':return{type:'ring',x:e.x,y:e.y,r:60,ab,global:true};
  case'whisper':{let tg=null,bd=ab.range;for(const s of G.surv)if(s.f===e.f&&s.st==='ok'&&!s.climb){const d=dist(e,s);if(d<bd){bd=d;tg=s}}return{type:'target',x:e.x,y:e.y,r:ab.range,target:tg,ab}}
  case'shot':{let tg=null,bd=ab.range;for(const s of G.surv)if(s!==e&&s.f===e.f&&s.st==='ok'&&s.hp<s.maxhp){const d=dist(e,s);if(d<bd){bd=d;tg=s}}if(!tg&&e.hp<e.maxhp)tg=e;return{type:'circle',x:e.x,y:e.y,r:ab.range,target:tg,ab}}
  case'overload':{let tg=null,bd=ab.range+20;for(const g of M.gens)if(g.f===e.f&&!g.done){const d=dist(e,g);if(d<bd){bd=d;tg=g}}return{type:'circle',x:e.x,y:e.y,r:ab.range,target:tg,ab}}
  case'sprint':{const tr=traceLine(G,e,ang,ab.range,0);return{type:'arrow',tr,ab}}
  case'hide':return{type:'ring',x:e.x,y:e.y,r:24,ab};
  case'lamp':{const K=G.killer;let hit=null;if(K.f===e.f&&K.vanish<=0&&!K.climb){const d=dist(e,K);if(d<ab.range+K.r&&Math.abs(angDiff(ang,Math.atan2(K.y-e.y,K.x-e.x)))<ab.half&&los(M,e.f,e.x,e.y,K.x,K.y))hit=K}return{type:'cone',x:e.x,y:e.y,ang,r:ab.range,half:ab.half,hit,ab}}
 }
}
function canCast(G,e,i){if(e.side==='k'&&!e.def.ab[i])return false;if(e.side==='k'&&!canCast3(G,e,i))return false;if(e.cd[i]>0||e.stun>0||e.climb||(e.act&&!HOLD[e.act.type])||e.vanish>0||e.pounce||e.tp)return false;if(e.side==='s'&&e.st!=='ok')return false;if(e.side==='k'&&e.carry&&i!==undefined&&e.def.ab[i].id!=='rip'&&e.def.ab[i].id!=='sense')return false;return true}
function castAbility(G,e,i,ang){
 if(!canCast(G,e,i))return false;
 const sh=abShape(G,e,i,ang),ab=sh.ab;let ok=true;
 switch(ab.id){
  case'rope':G.proj.push({kind:'rope',owner:e,f:e.f,tr:sh.tr,d:0,speed:900,w:8,back:false});break;
  case'veil':G.proj.push({kind:'veil',owner:e,f:e.f,tr:sh.tr,d:0,speed:520,w:14});break;
  case'pounce':e.pounce={tr:sh.tr,d:0,speed:470,hit:false};G.ev.pounces++;break;
  case'rip':e.buff.rip=4;break;
  case'sense':e.buff.sense=6;break;
  case'whisper':if(!sh.target){ok=false;break}e.vanish=1.0;e.vanishTarget=sh.target;G.ev.whispers++;break;
  case'shot':if(!sh.target){ok=false;break}sh.target.hp=Math.min(sh.target.maxhp,sh.target.hp+30);G.ev.heals++;fxBurst(G,sh.target,'#7fe07f',10);break;
  case'overload':if(!sh.target){ok=false;break}sh.target.boost=10;fxBurst(G,sh.target,'#ffe060',14);break;
  case'sprint':e.buff.sprint=2;e.face=ang;break;
  case'hide':e.buff.hide=6;break;
  case'bell':case'sheep':case'pray':case'whistle':case'totem':case'slash':case'souls':case'tp':ok=cast2(G,e,sh);break;
  case'lamp':e.buff.lamp=0.35;e.lampAng=ang;if(sh.hit){blindKiller(G,sh.hit,e)}break;
 }
 if(!ok)return false;
 e.cd[i]=ab.cd;e.stats.abil++;G.ev.abil++;sfxAt(G,e,'ab');e.face=(ab.id==='bell'||ab.id==='pray'||ab.id==='hide'||ab.id==='rip'||ab.id==='sense'||ab.id==='shot'||ab.id==='overload'||ab.id==='whisper')?e.face:ang;return true;
}
function blindKiller(G,K,by){K.blind=2;G.ev.blinds++;if(K.carry)dropCarried(G,K,true);if(K.isPlayer)G.flash=1;}
function fxBurst(G,o,col,n){if(G.sim)return;for(let i=0;i<n;i++)G.fx.push({f:o.f,x:o.x,y:o.y-10,vx:fr(-60,60),vy:fr(-90,10),t:fr(0.4,0.9),col,sz:fr(2,4),g:160})}
function bleed(G,s,n,big){G.blood.push({f:s.f,x:s.x+(big?0:rr(-4,4)),y:s.y+6+(big?0:rr(-3,3)),t:G.t,big:!!big});if(G.blood.length>700)G.blood.splice(0,100);
 if(!G.sim)for(let i=0;i<n;i++)G.fx.push({f:s.f,x:s.x,y:s.y-12,vx:fr(-90,90),vy:fr(-120,0),t:fr(0.4,0.8),col:i%2?'#a0101a':'#6a0810',sz:fr(2,5),g:260,blood:true})}

/* ---- combat ---- */
function attackShape(e){return{x:e.x+Math.cos(e.face)*22,y:e.y+Math.sin(e.face)*22,r:24}}
function damage(G,s,dmg,by){
 if(s.st!=='ok')return;s.hp-=dmg;s.hitT=0.35;G.ev.hits++;by&&by.stats.hits++;bleed(G,s,14,true);shakeAt(G,s,6);sfxAt(G,s,'hit');sfxAt(G,s,'scream',900);
 endAct(s);s.prone=false;s.lastHit=G.t;
 if(s.hp<=0){s.hp=0;s.st='down';s.downT=0;if(!circleFree(G.M,s.f,s.x,s.y,s.r-2,'s'))placeNear(G,s,s.x,s.y,s.f);G.ev.downs++;by&&by.stats.downs++;say(G,s.def.name+' повержен(а)!','#ff7060')}else s.burst=1.8;
}
function dropCarried(G,K,stunK){const s=K.carry;if(!s)return;K.carry=null;s.carrier=null;s.st='ok';s.hp=Math.max(1,Math.round(s.maxhp*0.3));s.burst=1.5;s.wig=0;
 placeNear(G,s,K.x,K.y,K.f);if(stunK){K.stun=Math.max(K.stun,2);G.ev.wiggleOut++}say(G,s.def.name+' вырвался(ась)!','#90e090')}
function placeNear(G,e,x,y,f){e.f=f;for(let rad=0;rad<80;rad+=6)for(let a=0;a<12;a++){const px=x+Math.cos(a*0.52)*rad,py=y+Math.sin(a*0.52)*rad;if(circleFree(G.M,f,px,py,e.r,e.side)){e.x=px;e.y=py;return}}e.x=x;e.y=y}
function stunKiller(G,K,base){const t=K.def.id==='stitches'?base/2:base;K.stun=Math.max(K.stun,t);K.lunge=0;K.pounce=null;G.ev.stuns++;shakeAt(G,K,8);sfxAt(G,K,'stun');if(K.carry)dropCarried(G,K,false);say(G,'Убийца оглушён!','#ffd060')}

/* ---- furniture ---- */
function knockOver(G,s,fu){
 const M=G.M,F=M.floors[fu.f];fu.state='down';fu.anim=0;F.blk[idx(fu.tx,fu.ty)]=0;F.blk[idx(fu.fx,fu.fy)]=2;G.ev.knocks++;sfxAt(G,fu,'fall');
 fu.x=cc(fu.fx);fu.y=cc(fu.fy);
 const K=G.killer,cx=cc(fu.fx),cy=cc(fu.fy);
 for(const e of [K,...G.ents.filter(x=>x!==K)]){if(e.f!==fu.f||e.st==='carried'||e.st==='hooked')continue;
  if(Math.abs(e.x-cx)<T/2+e.r&&Math.abs(e.y-cy)<T/2+e.r){ // inside the fall zone
   if(e===K){K.stats.stuns++;stunKiller(G,K,2)}
   pushOut(G,e,fu,e===K?K:s)}}
}
/* move entity out of a blocked doorway tile to the side of reference ent */
function pushOut(G,e,fu,ref){const vert=fuVert(G,fu),cx=cc(fu.fx),cy=cc(fu.fy);let sx=vert?Math.sign(ref.x-cx)||1:0,sy=vert?0:Math.sign(ref.y-cy)||1;
 if(e!==ref){sx=vert?Math.sign(e.x-cx)||1:0;sy=vert?0:Math.sign(e.y-cy)||1}
 placeNear(G,e,cx+sx*T,cy+sy*T,fu.f)}
function fuVert(G,fu){if(fu.vert!=null)return fu.vert;const F=G.M.floors[fu.f];return F.g[idx(fu.fx,fu.fy-1)]===TI.WALL||SOLID[F.g[idx(fu.fx,fu.fy-1)]]} // doorway in vertical wall: walls above/below
function vaultTarget(G,e,fu){const vert=fuVert(G,fu),cx=cc(fu.fx),cy=cc(fu.fy);let tx=fu.fx,ty=fu.fy;if(vert)tx+=e.x<cx?1:-1;else ty+=e.y<cy?1:-1;
 if(solidAt(G.M,fu.f,tx,ty,'s'))return null;return{x:cc(tx),y:cc(ty)}}
function breakFurn(G,fu){const F=G.M.floors[fu.f];fu.state='broken';F.blk[idx(fu.fx,fu.fy)]=0;G.ev.breaks++;sfxAt(G,fu,'fall');fxBurst(G,fu,'#7a5030',18)}

/* ---- interactions: list the best available interaction for an entity ---- */
function interactOptions(G,e){
 const M=G.M,o=[];if(e.climb||e.stun>0||e.vanish>0||e.pounce||e.tp)return o;
 if(e.side==='s'){
  if(e.st!=='ok')return o;
  for(const it of M.items)if(!it.taken&&it.f===e.f&&dist(e,it)<30)o.push({type:'pick',target:it,label:it.kind==='medkit'?'Взять аптечку':'Взять ящик инструментов'});
  for(const h of M.hooks)if(h.victim&&h.f===e.f&&dist(e,h)<48)o.push({type:'unhook',target:h,label:'Снять с крюка',dur:1.2});
  for(const s of G.surv)if(s!==e&&s.st==='down'&&s.f===e.f&&dist(e,s)<40)o.push({type:'revive',target:s,label:'Поднять',dur:5});
  for(const s of G.surv)if(s!==e&&s.st==='ok'&&s.hp<s.maxhp&&s.f===e.f&&dist(e,s)<38)o.push({type:'heal',target:s,label:'Лечить'});
  if(G.powered)for(const g of M.gates)if(!g.open&&g.f===e.f&&Math.hypot(e.x-g.x,e.y-g.y)<56)o.push({type:'gate',target:g,label:'Открыть ворота',dur:4});
  for(const g of M.gens)if(!g.done&&g.f===e.f&&dist(e,g)<46)o.push({type:'repair',target:g,label:'Чинить генератор'});
  for(const fu of M.furn)if(fu.state==='up'&&fu.f===e.f&&dist(e,fu)<44)o.push({type:'knock',target:fu,label:fu.kind==='ward'?'Опрокинуть шкаф':'Опрокинуть тумбу',dur:0.3});
  for(const fu of M.furn)if(fu.state==='down'&&fu.f===e.f&&Math.hypot(e.x-cc(fu.fx),e.y-cc(fu.fy))<T/2+e.r+8&&vaultTarget(G,e,fu))o.push({type:'vault',target:fu,label:'Перелезть',dur:0.55});
  for(const L of M.lockers||[])if(!L.occ&&L.f===e.f&&dist(e,L)<44)o.push({type:'hide',target:L,label:'Спрятаться в шкаф',dur:0.5});
  if(e.item==='medkit'&&e.hp<e.maxhp)o.push({type:'medkit',target:e,label:'Аптечка'});
 } else {
  if(e.carry){for(const h of M.hooks)if(!h.victim&&h.f===e.f&&dist(e,h)<50)o.push({type:'hook',target:h,label:'Повесить на крюк',dur:1});return o}
  for(const s of G.surv)if(s.st==='down'&&s.f===e.f&&dist(e,s)<42)o.push({type:'pickup',target:s,label:'Поднять на плечо',dur:0.9});
  for(const fu of M.furn)if(fu.state==='down'&&fu.f===e.f&&Math.hypot(e.x-cc(fu.fx),e.y-cc(fu.fy))<T/2+e.r+10)o.push({type:'break',target:fu,label:'Сломать',dur:e.buff.rip>0?0.15:2.2});
  for(const L of M.lockers||[])if(L.f===e.f&&dist(e,L)<44&&L.openT<=0)o.push({type:'search',target:L,label:'Открыть шкаф',dur:0.8});
  for(const g of M.gens)if(!g.done&&g.p>0.05&&!g.regress&&g.f===e.f&&dist(e,g)<48)o.push({type:'kick',target:g,label:'Пнуть генератор',dur:1.4});
 }
 if(e.in.want){return o.filter(x=>x.type===e.in.want&&(!e.in.wantT||x.target===e.in.wantT))}
 return o;
}
const HOLD={repair:1,unhook:1,revive:1,heal:1,gate:1,medkit:1};
function finishAction(G,e,a){
 const M=G.M,tg=a.target;
 switch(a.type){
  case'pick':tg.taken=true;if(e.item){M.items.push({f:e.f,x:e.x,y:e.y+4,kind:e.item,taken:false})}e.item=tg.kind;e.itemCharge=tg.kind==='medkit'?50:30;break;
  case'unhook':if(tg.victim){const v=tg.victim;tg.victim=null;tg.rescuer=null;v.st='ok';v.hp=Math.round(v.maxhp*0.35);v.burst=2;placeNear(G,v,tg.x,tg.y+20,tg.f);G.ev.unhooks++;e.stats.unhooks++;say(G,e.def.name+' снял(а) '+v.def.name+' с крюка','#90e0ff')}break;
  case'revive':if(tg.st==='down'){tg.st='ok';tg.hp=Math.round(tg.maxhp*0.3);G.ev.revives++}break;
  case'gate':if(!tg.open){tg.open=true;for(const[x,y]of tg.tiles)M.floors[tg.f].g[idx(x,y)]=TI.GRASS;G.ev.gates++;say(G,'Ворота открыты: '+tg.name,'#a0ffa0');sfxAt(G,e,'gate',2000)}break;
  case'knock':if(tg.state==='up')knockOver(G,e,tg);break;
  case'vault':break;
  case'hide':if(!tg.occ&&e.st==='ok')enterLocker(G,e,tg);break;
  case'search':if(!e.carry)searchLocker(G,e,tg);break;
  case'pickup':if(tg.st==='down'){tg.st='carried';tg.carrier=e;e.carry=tg;tg.wig=0;tg.f=e.f}break;
  case'hook':if(e.carry&&!tg.victim){const v=e.carry;e.carry=null;v.carrier=null;v.hookN++;e.stats.hooks++;G.ev.hooks++;sfxAt(G,e,'hook',900);shakeAt(G,e,5);bleed(G,tg,10,true);
    if(v.hookN>=3){v.st='dead';v.f=tg.f;v.x=tg.x;v.y=tg.y;G.ev.kills++;say(G,'Хозяин забрал '+v.def.name,'#ff5050');tg.ghost=1.5}
    else{tg.victim=v;v.st='hooked';v.hookT=v.hookN===1?60:35;v.f=tg.f;v.x=tg.x;v.y=tg.y;say(G,v.def.name+' на крюке!','#ff8060')}}break;
  case'break':breakFurn(G,tg);break;
  case'kick':tg.p=Math.max(0,tg.p-0.08);tg.regress=true;sfxAt(G,e,'stun');break;
 }
}
