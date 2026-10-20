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
T_('ropePull',()=>{const G=mk('stitches'),K=G.killer,s=G.surv[0];away(G,G.surv.slice(1));put(G,K,0,10,24);put(G,s,0,16,24);const ang=Math.atan2(s.y-K.y,s.x-K.x);const sh=abShape(G,K,0,ang);
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
return out})()
