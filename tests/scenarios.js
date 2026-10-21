// Functional scenario tests run inside the built page. Returns {name: {ok, info}}.
(()=>{const out={};const T_=(name,fn)=>{try{const r=fn();out[name]={ok:!!r.ok,info:r}}catch(e){out[name]={ok:false,info:String(e&&e.stack||e)}}};
const mk=(killer,o)=>{const G=newMatch(Object.assign({map:'mansion',killer,surv:['nora','tyler','ruth','sam'],playerSide:null,diff:1,seed:42,sim:true},o||{}));for(const e of G.ents){e.bot=null}return G};
const run=(G,sec,fn)=>{for(let t=0;t<sec;t+=1/30){fn&&fn(G);step(G,1/30);if(G.over)break}};
const put=(G,e,f,tx,ty)=>{e.f=f;e.x=cc(tx);e.y=cc(ty);if(!circleFree(G.M,f,e.x,e.y,e.r,e.side))placeNear(G,e,e.x,e.y,f)};
const away=(G,list)=>{for(const s of list)put(G,s,0,3+s.id*2,27)};
// 1 furniture stun: halved for Stitches
for(const k of ['stitches','bride']){T_('knockStun_'+k,()=>{const G=mk(k),K=G.killer,s=G.surv[0];away(G,G.surv.slice(1));const fu=G.M.furn.find(u=>u.state==='up');put(G,s,fu.f,fu.tx,fu.ty+0);placeNear(G,s,fu.x,fu.y,fu.f);put(G,K,fu.f,fu.fx,fu.fy);
 s.in.act=true;s.in.want='knock';s.in.wantT=fu;run(G,0.5);const blk=G.M.floors[fu.f].blk[idx(fu.fx,fu.fy)];const exp=k==='stitches'?1:2;
 return{ok:fu.state==='down'&&K.stun>exp-0.35&&K.stun<=exp&&blk===2&&circleFree(G.M,K.f,K.x,K.y,K.r-2,'k'),stun:K.stun,exp,blk}})}
// 2 vault over fallen furniture & killer must break it
T_('vaultAndBreak',()=>{const G=mk('bride'),K=G.killer,s=G.surv[0];away(G,G.surv.slice(1));put(G,K,0,20,26);const fu=G.M.furn.find(u=>u.state==='up');knockOver(G,s,fu);
 const vert=fuVert(G,fu);const side=vert?[fu.fx-1,fu.fy]:[fu.fx,fu.fy-1];put(G,s,fu.f,side[0],side[1]);s.in.act=true;s.in.want='vault';s.in.wantT=fu;run(G,0.8);
 const crossed=vert?s.x>cc(fu.fx):s.y>cc(fu.fy);put(G,K,fu.f,side[0],side[1]);K.in.act=true;K.in.want='break';K.in.wantT=fu;run(G,2.6);
 return{ok:crossed&&fu.state==='broken'&&G.M.floors[fu.f].blk[idx(fu.fx,fu.fy)]===0,crossed,state:fu.state}});
// 3 hit -> injured -> hit -> down -> pickup -> hook -> unhook ; blood trail
T_('hitDownHookUnhook',()=>{const G=mk('stitches'),K=G.killer,s=G.surv[1],r=G.surv[0];away(G,G.surv.slice(2));put(G,K,0,20,20);put(G,s,0,21,20);put(G,r,0,25,24);
 const aim=()=>{K.face=Math.atan2(s.y-K.y,s.x-K.x)};aim();K.in.atk=true;run(G,1.8);const hp1=s.hp;run(G,1);const blood=G.blood.length;put(G,s,0,21,20);aim();K.in.atk=true;run(G,0.5);
 if(s.st==='ok'){run(G,1.6);put(G,s,0,21,20);aim();K.in.atk=true;run(G,0.5)}const downed=s.st==='down';
 K.in.act=true;K.in.want='pickup';run(G,1.2);const carried=s.st==='carried';const h=G.M.hooks.find(q=>q.f===0);put(G,K,0,h.tx,h.ty+1);K.in.want='hook';run(G,1.3);const hooked=s.st==='hooked';K.in.act=false;put(G,K,3,5,5);
 put(G,r,0,h.tx,h.ty+1);r.in.act=true;r.in.want='unhook';run(G,1.5);return{ok:hp1<s.maxhp&&blood>0&&downed&&carried&&hooked&&s.st==='ok'&&s.hookN===1,hp1,blood,downed,carried,hooked,st:s.st}});
// 4 third hook kills, hook timer kills
T_('hookDeath',()=>{const G=mk('rotjaw'),K=G.killer,s=G.surv[0];away(G,G.surv.slice(1));s.hookN=2;s.st='carried';s.carrier=K;K.carry=s;const h=G.M.hooks[0];put(G,K,h.f,h.tx,h.ty+1);K.in.act=true;K.in.want='hook';run(G,1.3);
 const s2=G.surv[1];s2.st='carried';s2.carrier=K;K.carry=s2;run(G,1.3);const h2=G.M.hooks.find(q=>q.victim===s2);K.in.act=false;
 return{ok:s.st==='dead'&&(!h2||s2.st==='hooked'),s:s.st,s2:s2.st}});
// 5 revive downed ally
T_('revive',()=>{const G=mk('stitches'),K=G.killer,s=G.surv[0],r=G.surv[1];away(G,G.surv.slice(2));put(G,K,3,5,5);put(G,s,0,20,24);put(G,r,0,21,24);s.hp=0;s.st='down';r.in.act=true;r.in.want='revive';run(G,5.3);return{ok:s.st==='ok'&&s.hp>0,st:s.st}});
// 6 bot revive / rescue / gens / gates / escape (bots on)
T_('botsReviveAndEscape',()=>{const G=mk('stitches');for(const e of G.surv)e.bot=mkBot(e,G);const K=G.killer;put(G,K,4,15,15);K.stun=1e9;// frozen killer on attic
 const s=G.surv[0];s.hp=0;s.st='down';s.f=G.surv[1].f;s.x=G.surv[1].x+40;s.y=G.surv[1].y;placeNear(G,s,s.x,s.y,s.f);run(G,600);
 return{ok:G.ev.revives>=1&&G.gensDone>=4&&G.ev.gates>=1&&G.ev.escapes===4,revives:G.ev.revives,gens:G.gensDone,gates:G.ev.gates,esc:G.ev.escapes,t:G.t}});
// 7 floors: killer directly below survivor on another floor: no sight, no heartbeat, no hit
T_('floorIsolation',()=>{const G=mk('stitches');const K=G.killer;K.bot=mkBot(K,G);const s=G.surv[0];away(G,G.surv.slice(1));put(G,s,2,15,15);put(G,K,1,15,15);K.x=s.x;K.y=s.y;
 const sees=kSees(G,K,s);run(G,1,()=>{K.in.atk=true});const hp=s.hp;const sus=K.bot.sus;const hearts=(K.f===s.f&&dist(K,s)<TERROR);
 return{ok:!sees&&hp===s.maxhp&&(!sus||sus.f===K.f)&&!hearts&&WP.dbg.crossFloor===0,sees,hp,sus}});
// 8 stairs: player-like walk onto stair -> climb 0.42s -> other floor at arrival tile; carried survivor follows killer
T_('stairsClimb',()=>{const G=mk('bride'),K=G.killer;away(G,G.surv);const st=G.M.stairs.find(q=>q.f===1&&q.to.f===2);K.isPlayer=true;put(G,K,1,st.ax,st.ay);const s=G.surv[0];s.st='carried';s.carrier=K;K.carry=s;
 K.in.mx=(st.x-st.ax);K.in.my=(st.y-st.ay);let climbT=0,saw=false;for(let i=0;i<60;i++){step(G,1/30);if(K.climb){saw=true;climbT+=1/30}if(K.f===2)break}K.in.mx=K.in.my=0;
 return{ok:saw&&K.f===2&&s.f===2&&climbT>0.3&&climbT<0.55&&tc(K.x)===st.to.ax&&tc(K.y)===st.to.ay,f:K.f,climbT}});
// 9 abilities: shared trajectory decides hits
T_('ropePull',()=>{const G=mk('stitches'),K=G.killer,s=G.surv[0];away(G,G.surv.slice(1));put(G,K,0,10,26);put(G,s,0,16,26);const ang=Math.atan2(s.y-K.y,s.x-K.x);const sh=abShape(G,K,0,ang);
 K.in.cast={i:0,ang};run(G,1.2);return{ok:sh.hit===s&&G.ev.pulls===1&&dist(K,s)<50,d:dist(K,s)}});
T_('ropeBlockedByWall',()=>{const G=mk('stitches'),K=G.killer,s=G.surv[0];away(G,G.surv.slice(1));put(G,K,1,5,5);put(G,s,1,15,5);// wall column at x=10
 const F=G.M.floors[1];const wall=F.g[idx(10,5)]===TI.WALL;const ang=0;const sh=abShape(G,K,0,ang);K.in.cast={i:0,ang};run(G,1.2);return{ok:!wall||(sh.hit===null&&G.ev.pulls===0),wall,hit:!!sh.hit}});
T_('veilSlow',()=>{const G=mk('bride'),K=G.killer,s=G.surv[0];away(G,G.surv.slice(1));put(G,K,0,10,24);put(G,s,0,15,24);const ang=Math.atan2(s.y-K.y,s.x-K.x);K.in.cast={i:1,ang};run(G,0.6);return{ok:s.slow>2&&G.ev.veils===1,slow:s.slow}});
T_('whisperBehind',()=>{const G=mk('bride'),K=G.killer,s=G.surv[0];for(const q of G.surv.slice(1))put(G,q,3,5+q.id*3,5);put(G,K,0,5,24);put(G,s,0,20,24);s.face=0;K.in.cast={i:0,ang:0};run(G,1.2);return{ok:G.ev.whispers===1&&dist(K,s)<60&&K.f===s.f,d:dist(K,s)}});
T_('whisperNoCrossFloor',()=>{const G=mk('bride'),K=G.killer;away(G,G.surv);for(const s of G.surv)s.f=3;put(G,K,1,5,5);K.in.cast={i:0,ang:0};run(G,1.2);return{ok:G.ev.whispers===0&&K.f===1&&K.cd[0]===0}});
T_('pounceDown',()=>{const G=mk('rotjaw'),K=G.killer,s=G.surv[0];away(G,G.surv.slice(1));put(G,K,0,10,24);put(G,s,0,15,24);const ang=Math.atan2(s.y-K.y,s.x-K.x);K.in.cast={i:1,ang};run(G,0.8);return{ok:s.st==='down'&&G.ev.pounces===1,st:s.st}});
T_('senseMapWide',()=>{const G=mk('rotjaw'),K=G.killer;K.bot=mkBot(K,G);away(G,G.surv);put(G,K,4,5,5);K.in.cast={i:0,ang:0};run(G,0.5);return{ok:K.buff.sense>5&&K.bot.sus&&K.bot.sus.why==='sense'&&WP.dbg.crossFloor===0,sus:K.bot.sus}});
T_('lampBlindDrops',()=>{const G=mk('bride',{surv:['victor','nora','ruth','sam']}),K=G.killer,v=G.surv[0],c=G.surv[1];away(G,G.surv.slice(2));put(G,K,0,15,24);put(G,v,0,11,24);c.st='carried';c.carrier=K;K.carry=c;const ang=Math.atan2(K.y-v.y,K.x-v.x);v.in.cast={i:0,ang};run(G,0.2);return{ok:K.blind>1.5&&!K.carry&&c.st==='ok',blind:K.blind}});
T_('noraShot',()=>{const G=mk('stitches'),n=G.surv[0],t=G.surv[1];away(G,G.surv.slice(2));put(G,G.killer,4,5,5);put(G,n,0,15,24);put(G,t,0,16,24);t.hp=20;n.in.cast={i:0,ang:0};run(G,0.1);return{ok:t.hp===50,hp:t.hp}});
T_('ruthOverload',()=>{const G=mk('stitches'),r=G.surv[2];put(G,G.killer,4,5,5);const g=G.M.gens[0];put(G,r,g.f,g.tx,g.ty+1);r.in.cast={i:0,ang:0};r.in.act=true;r.in.want='repair';run(G,5);const p=g.p;return{ok:g.boost>0&&p>4/60*2*0.9,p}});
T_('tylerSprint',()=>{const G=mk('stitches'),t=G.surv[1];put(G,G.killer,4,5,5);put(G,t,1,1,17);const x0=t.x;t.in.cast={i:0,ang:0};t.in.mx=1;t.in.run=true;run(G,1);return{ok:t.x-x0>140,dx:t.x-x0}});
T_('samHideNoHeart',()=>{const G=mk('stitches'),s=G.surv[3],K=G.killer;K.bot=mkBot(K,G);away(G,G.surv.slice(0,3));put(G,s,1,15,15);put(G,K,1,15,19);K.blind=99;s.in.cast={i:0,ang:0};run(G,0.1);K.bot.sus=null;run(G,1,()=>{K.blind=99});return{ok:s.buff.hide>0&&!K.bot.sus,sus:K.bot.sus}});
T_('bleedOut',()=>{const G=mk('stitches'),s=G.surv[0];put(G,G.killer,4,5,5);s.hp=0;s.st='down';run(G,121);return{ok:s.st==='dead'}});
T_('medkit',()=>{const G=mk('stitches'),s=G.surv[0];put(G,G.killer,4,5,5);const it=G.M.items.find(i=>i.kind==='medkit');put(G,s,it.f,tc(it.x),tc(it.y));s.in.act=true;s.in.want='pick';run(G,0.2);s.hp=30;s.in.want='medkit';run(G,5);return{ok:s.hp>=70,hp:s.hp,item:s.item}});
T_('wiggleFree',()=>{const G=mk('stitches'),K=G.killer,s=G.surv[0];put(G,K,1,15,15);s.st='carried';s.carrier=K;K.carry=s;run(G,18);return{ok:s.st==='ok'&&K.stun>0||G.ev.wiggleOut===1,st:s.st}});
T_('gapKillerBlocked',()=>{const G=mk('stitches');let gap=null;for(let f=1;f<G.M.floors.length&&!gap;f++)for(let i=0;i<FW*FH;i++)if(G.M.floors[f].g[i]===TI.GAP){gap={f,x:i%FW,y:(i/FW)|0};break}
 return{ok:gap&&solidAt(G.M,gap.f,gap.x,gap.y,'k')&&!solidAt(G.M,gap.f,gap.x,gap.y,'s'),gap}});
T_('collapseEndsMatch',()=>{const G=mk('stitches');put(G,G.killer,4,5,5);G.killer.stun=1e9;for(const g of G.M.gens.slice(0,4)){g.p=0.999}G.surv.forEach(s=>{s.in.act=false});run(G,0.2,()=>{for(const g of G.M.gens.slice(0,4))if(!g.done){g.users=1;g.p=1.01;g.done=true;G.gensDone++}});
 // force via step: powered flag set when gensDone>=needGens
 G.powered=true;G.collapse=2;run(G,3);return{ok:G.over&&G.result.kills===4,res:G.result}});
// ---- sprint & stamina
T_('sprintSpeedDrain',()=>{const G=mk('stitches'),s=G.surv[0];away(G,G.surv.slice(1));put(G,G.killer,4,5,5);put(G,s,0,12,13);s.in.mx=1;s.in.run=false;run(G,0.5);const w=entSpeed(G,s);s.in.run=true;run(G,0.3);const r=entSpeed(G,s);run(G,4.2);
 return{ok:Math.abs(r/w-1.5)<0.01&&s.stam===0&&s.exh&&!s.sprint,w,r,stam:s.stam}});
T_('staminaRegenDelay',()=>{const G=mk('stitches'),s=G.surv[0];away(G,G.surv.slice(1));put(G,G.killer,4,5,5);put(G,s,0,4,26);s.stam=0.5;s.stamCd=0;s.in.mx=s.in.my=0;s.in.run=false;run(G,0.1);s.stamCd=1;const a=s.stam;run(G,0.8);const b=s.stam;run(G,3.5);
 return{ok:Math.abs(a-b)<1e-9&&s.stam>0.9,a,b,end:s.stam}});
T_('staminaFullRefill6s',()=>{const G=mk('stitches'),s=G.surv[0];s.stam=0;s.stamCd=0;s.exh=false;s.in.mx=s.in.my=0;s.in.run=false;run(G,5.8);const a=s.stam;run(G,0.4);return{ok:a<1&&s.stam===1,a}});
T_('killerSprint2_5s',()=>{const G=mk('rotjaw'),K=G.killer;put(G,K,0,4,26);K.in.mx=1;K.in.run=true;run(G,2.3);const a=K.stam>0;run(G,0.4);return{ok:a&&K.stam===0&&K.exh,stam:K.stam}});
T_('hurtRunsSlower',()=>{const G=mk('stitches'),s=G.surv[0];s.in.mx=1;s.in.run=true;s.stam=1;run(G,0.1);const v1=entSpeed(G,s);s.hp=s.maxhp-20;const v2=entSpeed(G,s);return{ok:v2<v1&&v2>v1*0.8,v1,v2}});
T_('noSprintProneGapRepairDown',()=>{const G=mk('stitches'),s=G.surv[0];s.stam=1;s.in.run=true;const r=[];s.prone=true;r.push(canSprint(s,true));s.prone=false;s.inGap=true;r.push(canSprint(s,true));s.inGap=false;s.act={type:'repair'};r.push(canSprint(s,true));s.act=null;s.st='down';r.push(canSprint(s,true));s.st='ok';r.push(canSprint(s,true));
 return{ok:r.join()==='false,false,false,false,true',r}});
T_('botsSprint',()=>{let ss=0,ks=0;for(let i=0;i<3;i++){const G=newMatch({map:'mansion',killer:'stitches',surv:['nora','tyler','ruth','sam'],playerSide:null,diff:1,seed:300+i,sim:true});for(let t=0;t<90&&!G.over;t+=1/30){step(G,1/30);if(G.killer.sprint)ks++;for(const s of G.surv)if(s.sprint)ss++}}return{ok:ss>30&&ks>30,ss,ks}});
// ---- lockers
T_('lockerHideAndExit',()=>{const G=mk('stitches'),s=G.surv[0],L=G.M.lockers[0];away(G,G.surv.slice(1));put(G,G.killer,4,5,5);put(G,s,L.f,L.tx,L.ty+1);s.in.act=true;s.in.want='hide';s.in.wantT=L;run(G,0.8);const hid=s.st==='hidden'&&L.occ===s;s.in.act=true;s.in.want=null;run(G,0.8);return{ok:hid&&s.st==='ok'&&!L.occ&&!kSees(G,G.killer,s)||hid&&s.st==='ok',hid,st:s.st}});
T_('lockerHiddenInvisibleButHeard',()=>{const G=mk('stitches'),s=G.surv[0],K=G.killer,L=G.M.lockers[0];enterLocker(G,s,L);put(G,K,L.f,L.tx+2,L.ty+2);return{ok:!kSees(G,K,s)&&aliveS(s)&&dist(K,s)<TERROR}});
T_('lockerKillerGrabsCarry',()=>{const G=mk('bride'),s=G.surv[0],K=G.killer,L=G.M.lockers[0];away(G,G.surv.slice(1));enterLocker(G,s,L);put(G,K,L.f,L.tx,L.ty+1);K.in.act=true;K.in.want='search';K.in.wantT=L;run(G,1.5);return{ok:K.carry===s&&s.st==='carried'&&!L.occ,st:s.st}});
T_('lockerEmptySearch',()=>{const G=mk('bride'),K=G.killer,L=G.M.lockers[1];put(G,K,L.f,L.tx,L.ty+1);K.in.act=true;K.in.want='search';K.in.wantT=L;run(G,1.0);return{ok:!K.carry&&L.searched>0}});
T_('botsUseLockers',()=>{let h=0,se=0;for(let i=0;i<18;i++){const r=WP.sim({killer:'stitches',seed:700+i,map:['mansion','village','ship'][i%3]});h+=r.ev.hides||0;se+=r.ev.searches||0}return{ok:h>0&&se>0,h,se}});
// ---- tracks (killer only), chase, last chance, weather
T_('sprintTracksFade',()=>{const G=mk('stitches');G.sim=false;const s=G.surv[0];away(G,G.surv.slice(1));put(G,G.killer,4,5,5);put(G,s,0,12,13);s.in.mx=1;s.in.run=true;run(G,1);const n=G.tracks.length;s.in.run=false;s.in.mx=0;run(G,5.3);return{ok:n>3&&G.tracks.length===0,n}});
T_('chaseDetect',()=>{const G=mk('stitches'),K=G.killer,s=G.surv[0];G.player=s;away(G,G.surv.slice(1));put(G,K,0,6,26);put(G,s,0,10,26);K.moving=true;const a=chaseLevel(G);put(G,s,4,5,5);const b=chaseLevel(G);return{ok:a>0.5&&b===0,a,b}});
T_('lastChance',()=>{const G=mk('stitches'),K=G.killer,s=G.surv[0];away(G,G.surv.slice(1));put(G,K,4,5,5);const v0=entSpeed(G,K);const gs=G.M.gens.slice(0,G.needGens);gs.slice(0,-1).forEach(g=>{g.done=true;g.p=1});G.gensDone=G.needGens-1;const g=gs[gs.length-1];g.p=0.995;put(G,s,g.f,g.tx,g.ty+1);run(G,3,()=>{s.in.act=true;s.in.want='repair';s.in.wantT=g});const v1=entSpeed(G,K);return{ok:G.powered&&G.lastChance!=null&&Math.abs(v1/v0-1.1)<0.001,v0,v1}});
T_('weatherFair',()=>{const r={};for(const w of['clear','fog','storm']){WP.forceWeather=w;WP.forceBlackout=-1;const G=mk('stitches');r[w]=visMul(G)}WP.forceWeather=null;WP.forceBlackout=5;const G=mk('stitches');run(G,6);const bo=G.blackout.on&&visMul(G)<0.7;run(G,10);const back=!G.blackout.on;WP.forceBlackout=null;
 return{ok:r.fog<r.clear&&r.storm<=r.clear&&bo&&back,r,bo,back}});
T_('weatherRandom',()=>{const seen=new Set();for(let i=0;i<30;i++){const G=newMatch({map:'mansion',killer:'stitches',surv:['nora','tyler','ruth','sam'],playerSide:null,diff:1,seed:900+i,sim:true});seen.add(G.weather)}return{ok:seen.size===3,seen:[...seen]}});
// ---- new characters
T_('shepherdBellNoSprint',()=>{const G=mk('shepherd'),K=G.killer,s=G.surv[0],f=G.surv[1];put(G,K,0,10,26);put(G,s,0,12,26);put(G,f,4,5,5);s.stam=1;s.in.run=true;s.in.mx=1;const ok0=castAbility(G,K,0,0);run(G,0.2);const a=s.sprint;run(G,3.2);return{ok:ok0&&s.buff.deaf<=0&&!a&&f.buff.deaf===undefined,a,deaf:s.buff.deaf}});
T_('shepherdSheepReveal',()=>{const G=mk('shepherd'),K=G.killer,s=G.surv[0];away(G,G.surv.slice(1));put(G,K,0,10,26);castAbility(G,K,1,0);const q=G.sheep[0];put(G,s,0,tc(q.x),tc(q.y)+1);run(G,1.3);return{ok:!!G.reveal&&G.reveal.s===s&&G.ev.bleats===1,q:[q.x,q.y]}});
T_('shepherdHerd',()=>{const G=mk('shepherd'),K=G.killer;put(G,K,0,10,26);G.surv.forEach((s,i)=>put(G,s,4,3+i*2,5));const v0=entSpeed(G,K);put(G,G.surv[0],0,12,26);put(G,G.surv[1],0,12,24);const v1=entSpeed(G,K);return{ok:Math.abs(v1/v0-1.08)<1e-6,v0,v1}});
T_('ethanPrayHeals',()=>{const G=mk('stitches',{surv:['ethan','nora','tyler','sam']}),e=G.surv[0],a=G.surv[1];put(G,G.killer,4,5,5);put(G,e,0,10,26);put(G,a,0,11,26);e.hp=40;a.hp=50;const ok=castAbility(G,e,0,0);run(G,6.5);return{ok:ok&&e.hp>=60&&a.hp>=70&&e.hp<=e.maxhp,e:e.hp,a:a.hp}});
T_('lilyWhistleLures',()=>{const G=mk('stitches',{surv:['lily','nora','tyler','sam']}),l=G.surv[0],K=G.killer;away(G,G.surv.slice(1));put(G,l,0,8,26);put(G,K,0,20,26);K.bot=mkBot(K,G);const sh=abShape(G,l,0,Math.PI);castAbility(G,l,0,Math.PI);run(G,1.0);return{ok:sh.type==='proj'&&G.lures&&G.lures.length===1&&G.ev.lured===1,lures:(G.lures||[]).length}});
T_('lilySmallFast',()=>{const G=mk('stitches',{surv:['lily','nora','tyler','sam']});return{ok:entSpeed(G,G.surv[0])>entSpeed(G,G.surv[1])&&G.surv[0].maxhp===70}});
// ---- Oni abilities (v0.1.1) ----
const oniG=()=>{const G=mk('oni'),K=G.killer;for(const o of G.surv.slice(1))put(G,o,3,4+o.id*3,15);put(G,K,0,10,26);return G};
const ang=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
T_('oniAimShapes',()=>{const G=oniG(),K=G.killer;const t=['totem','slash','souls','tp'].map((id,i)=>abShape(G,K,i,0));return{ok:t[0].type==='place'&&t[0].r===60&&t[1].type==='dash'&&t[2].type==='place'&&t[2].r>200&&t[3].type==='tp'&&!t[3].target&&!canCast(G,K,3),types:t.map(x=>x.type)}});
T_('oniTotemCurseSlow',()=>{const G=oniG(),K=G.killer,s=G.surv[0];put(G,s,0,14,26);const v0=entSpeed(G,s);const ok1=castAbility(G,K,0,ang(K,s));run(G,0.4);const v1=entSpeed(G,s);
 return{ok:ok1&&G.totems.length===1&&s.curse>19&&s.tslow>0&&v1<v0*0.9&&G.ev.curses>=1,curse:s.curse,v0,v1}});
T_('oniTotemMax4',()=>{const G=oniG(),K=G.killer;const ids=[];for(let i=0;i<5;i++){K.cd[0]=0;castAbility(G,K,0,i*1.2);ids.push(G.totems[G.totems.length-1].id)}return{ok:G.totems.length===4&&!G.totems.some(q=>q.id===ids[0])&&G.totems[3].id===ids[4],n:G.totems.length}});
T_('oniCurseRefreshExpire',()=>{const G=oniG(),K=G.killer,s=G.surv[0];put(G,s,0,14,26);castAbility(G,K,0,ang(K,s));run(G,0.2);put(G,s,0,30,26);run(G,5);const c1=s.curse;put(G,s,0,14,26);run(G,0.2);const c2=s.curse;put(G,s,0,30,26);run(G,21);
 return{ok:c1<16&&c2>19.5&&s.curse===0&&!(s.tslow>0),c1,c2,c3:s.curse}});
T_('oniCurseSeenByBot',()=>{const G=oniG(),K=G.killer,s=G.surv[0];K.bot=mkBot(K,G);put(G,s,0,24,26);s.curse=20;run(G,0.2);return{ok:!!K.bot.curseSeen&&K.bot.curseSeen.f===0,sus:K.bot.curseSeen}});
T_('oniTeleport',()=>{const G=oniG(),K=G.killer;put(G,K,0,8,26);castAbility(G,K,0,0);const q=G.totems[0];put(G,K,0,30,20);const x0=K.x;const ok=castAbility(G,K,3,0);run(G,0.5);const mid=Math.abs(K.x-x0)<1&&!!K.tp;run(G,0.8);
 return{ok:ok&&mid&&!K.tp&&Math.hypot(K.x-q.x,K.y-q.y)<60&&K.cd[3]>30,d:Math.hypot(K.x-q.x,K.y-q.y),mid}});
T_('oniTeleportCrossFloorSelected',()=>{const G=oniG(),K=G.killer;G.totems=[{f:0,x:cc(12),y:cc(26),t:1,id:1},{f:2,x:cc(15),y:cc(15),t:1,id:2}];const sh=abShape(G,K,3,0);K.tpPick=G.totems[1];castAbility(G,K,3,0);run(G,1.3);return{ok:sh.target.id===1&&K.f===2&&Math.hypot(K.x-cc(15),K.y-cc(15))<60,f:K.f}});
T_('oniTeleportStunCancels',()=>{const G=oniG(),K=G.killer;G.totems=[{f:2,x:cc(15),y:cc(15),t:1,id:1}];castAbility(G,K,3,0);run(G,0.3);K.stun=1;run(G,1.2);return{ok:K.f===0&&!K.tp,f:K.f}});
T_('oniSlashHitsFirst',()=>{const G=oniG(),K=G.killer,s=G.surv[0],s2=G.surv[1];put(G,s,0,13,26);put(G,s2,0,15,26);const h=s.hp,h2=s2.hp,x0=K.x;castAbility(G,K,1,0);run(G,0.6);
 return{ok:s.hp===h-HIT_DMG&&s2.hp===h2&&s.st==='ok'&&K.x>x0+40&&G.ev.slashes===1,hp:s.hp}});
T_('oniSouls',()=>{const G=oniG(),K=G.killer,s=G.surv[0];put(G,s,0,16,22);const ok=castAbility(G,K,2,ang(K,s));const n=G.souls.length;run(G,12);const hp=s.hp,hits=G.ev.soulHits||0;run(G,50);
 return{ok:ok&&n===5&&hits>0&&hp<s.maxhp&&s.st==='ok'&&s.hp>=Math.ceil(s.maxhp*0.25)&&G.souls.length===0&&K.cd[2]>15,n,hits,hp:s.hp}});
T_('oniSoulsNeverDown',()=>{const G=oniG(),K=G.killer,s=G.surv[0];put(G,s,0,14,24);s.hp=30;castAbility(G,K,2,ang(K,s));run(G,40);return{ok:s.st==='ok'&&s.hp>=25,hp:s.hp}});
T_('oniBotsUseAbilities',()=>{const ev={totems:0,slashes:0,souls:0,tps:0,curses:0,soulHits:0};let over=0;for(let i=0;i<8;i++){const x=WP.sim({killer:'oni',seed:300+i,map:['mansion','village','ship'][i%3],keepG:true});if(x.over)over++;const E=x.ev||(x.G&&x.G.ev)||{};for(const k in ev)ev[k]+=E[k]||0}
 return{ok:over===8&&ev.totems>0&&ev.slashes>0&&ev.souls>0&&ev.tps>0&&ev.curses>0,ev}});
T_('newKillerBotsFinish',()=>{const r=[];for(const k of['shepherd','oni'])for(const m of['mansion','village','ship']){const x=WP.sim({killer:k,seed:31,map:m});r.push(x.over&&x.stuck.length===0&&!x.nan)}return{ok:r.every(Boolean),r}});
return out})()