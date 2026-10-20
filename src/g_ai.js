/* ===== g_ai: bot state machines. Bots only use what they see/hear on their own floor (plus explicit abilities). ===== */
function mkBot(e,G){return{state:'start',path:null,pi:0,goalKey:'',repath:0,think:0,stair:null,lastSeen:null,sus:null,react:0,stuckT:0,lx:e.x,ly:e.y,jig:0,jx:0,jy:0,gen:null,patrol:null,searchT:0,noInfo:0,chaseT:0,fleeT:0,lostT:99,role:null,moveIntent:false}}
const nodeOf=e=>e.f*FW*FH+idx(tc(e.x),tc(e.y));
function thickClear(M,f,ax,ay,bx,by,r,kind){const d=Math.hypot(bx-ax,by-ay),n=Math.ceil(d/6);for(let i=1;i<=n;i++){if(!circleFree(M,f,ax+(bx-ax)*i/n,ay+(by-ay)*i/n,r+1,kind))return false}return true}
function steer(e,x,y){const dx=x-e.x,dy=y-e.y,d=Math.hypot(dx,dy);if(d<0.5){e.in.mx=e.in.my=0;return}e.in.mx=dx/d;e.in.my=dy/d}
/* compute a path with goal predicate; key identifies the goal for caching */
function planTo(G,e,b,key,goal,block){
 if(b.path&&b.goalKey===key&&b.repath>0)return b.path.length>0;
 const M=G.M,n=bfs(M,e.side,e.f,tc(e.x),tc(e.y),goal,0,block);b.goalKey=key;b.repath=1.0+rnd()*0.3;
 if(n<0){b.path=[];b.pi=0;return false}b.path=pathTo(M,n);b.pi=0;return true;
}
function planNode(G,e,b,key,f,tx,ty){return planTo(G,e,b,key,(nf,x,y)=>nf===f&&x===tx&&y===ty)}
function planAdj(G,e,b,key,o){return planTo(G,e,b,key,(nf,x,y)=>nf===o.f&&Math.abs(x-o.tx)+Math.abs(y-o.ty)===1)}
/* follow current path. returns true when arrived */
function follow(G,e,b){
 const M=G.M,p=b.path;e.in.want=null;e.in.act=false;b.moveIntent=false;
 if(!p||!p.length)return true;
 const cur=nodeOf(e);for(let j=Math.min(p.length-1,b.pi+4);j>=b.pi;j--)if(p[j]===cur){b.pi=j+1;break}
 if(b.pi>=p.length){const[x,y]=nodeXY(p[p.length-1]);if(Math.hypot(e.x-cc(x),e.y-cc(y))>6){steer(e,cc(x),cc(y));b.moveIntent=true;return false}e.in.mx=e.in.my=0;return true}
 b.moveIntent=true;
 const nx=p[b.pi],nf=nodeF(nx);
 if(nf!==e.f){const ti=idx(tc(e.x),tc(e.y)),s=M.stairAt[e.f].get(ti);if(s){b.stair=s;steer(e,cc(s.x),cc(s.y))}else{const pv=p[b.pi-1];if(pv!=null&&nodeF(pv)===e.f){const[x,y]=nodeXY(pv);b.stair=M.stairAt[e.f].get(idx(x,y));steer(e,cc(x),cc(y))}else b.path=null}return false}
 const[x,y]=nodeXY(nx),F=M.floors[e.f];
 if(F.blk[idx(x,y)]===2){const fu=M.furn.find(u=>u.f===e.f&&u.fx===x&&u.fy===y&&u.state==='down');
  if(fu&&Math.hypot(e.x-cc(x),e.y-cc(y))<T/2+e.r+8){e.in.want=e.side==='s'?'vault':'break';e.in.wantT=fu;e.in.act=true;e.in.mx=e.in.my=0;return false}}
 let tx=cc(x),ty=cc(y);
 for(let j=Math.min(p.length-1,b.pi+3);j>b.pi;j--){const q=p[j];if(nodeF(q)!==e.f)continue;const[qx,qy]=nodeXY(q);if(F.blk[idx(qx,qy)]===2||F.g[idx(qx,qy)]===TI.STAIR)continue;
  let ok=true;for(let k=b.pi;k<j;k++){const[kx,ky]=nodeXY(p[k]);if(nodeF(p[k])!==e.f||F.blk[idx(kx,ky)]===2||F.g[idx(kx,ky)]===TI.STAIR){ok=false;break}}
  if(ok&&thickClear(M,e.f,e.x,e.y,cc(qx),cc(qy),e.r,e.side)){tx=cc(qx);ty=cc(qy);break}}
 steer(e,tx,ty);return false;
}
function unstick(G,e,b,dt){
 if(b.jig>0){b.jig-=dt;e.in.mx=b.jx;e.in.my=b.jy;return true}
 const busy=e.act||e.climb||e.stun>0||e.vanish>0||e.pounce||e.pull||(e.side==='s'&&e.st!=='ok'&&e.st!=='down');
 if(!b.moveIntent||busy){b.stuckT=0;b.lx=e.x;b.ly=e.y;return false}
 if(Math.hypot(e.x-b.lx,e.y-b.ly)>3){b.stuckT=0;b.lx=e.x;b.ly=e.y;return false}
 b.stuckT+=dt;if(b.stuckT>1.2){b.stuckT=0;b.path=null;b.jig=0.35;const a=rnd()*6.283;b.jx=Math.cos(a);b.jy=Math.sin(a);G.ev.unstick=(G.ev.unstick||0)+1;return true}
 return false;
}
function botThink(G,e,dt){const b=e.bot;b.repath-=dt;b.think-=dt;
 if(e.side==='k')killerBot(G,e,b,dt);else survBot(G,e,b,dt);
 if(unstick(G,e,b,dt)){e.in.act=false}
}
/* ---------- killer ---------- */
function kSees(G,K,s){if(s.f!==K.f||K.blind>0||K.vanish>0||K.climb||s.climb)return false;if(!(s.st==='ok'||s.st==='down'))return false;
 const r=SIGHT*G.diff.kSight*(s.prone?0.45:1)*(s.inGap?0.7:1)*(M_outdoorDark(G,K)?0.85:1);const d=dist(K,s);if(d>r)return false;return los(G.M,K.f,K.x,K.y,s.x,s.y)}
function M_outdoorDark(G,K){return G.M.floors[K.f].outdoor}
function noteInfo(G,K,s){if(s.f!==K.f&&!(K.buff.sense>0))WP.dbg.crossFloor++}
function killerBot(G,K,b,dt){
 const M=G.M,D=G.diff;K.in.atk=false;
 if(K.stun>0||K.climb||K.vanish>0||K.pounce)return;
 // --- senses ---
 if(b.think<=0){b.think=0.12;
  let vis=null,vd=1e9;for(const s of G.surv)if(kSees(G,K,s)&&!(b.giveUp&&b.giveUp[s.id]>G.t&&s.st==='ok')){noteInfo(G,K,s);const d=dist(K,s)+(s.st==='down'?-60:0);if(d<vd){vd=d;vis=s}}
  if(vis){if(!b.lastSeen||b.lastSeen.s!==vis)b.react=D.kReact;b.lastSeen={s:vis,x:vis.x,y:vis.y,f:vis.f,t:G.t,vx:vis.x-(b.lastSeen&&b.lastSeen.s===vis?b.lastSeen.x:vis.x),vy:vis.y-(b.lastSeen&&b.lastSeen.s===vis?b.lastSeen.y:vis.y)};b.noInfo=0}
  b.vis=vis;
  if(!vis){b.noInfo+=0.12;
   let heard=null;for(const s of G.surv)if(s.f===K.f&&s.st==='ok'&&!(s.buff.hide>0)&&dist(K,s)<TERROR){noteInfo(G,K,s);heard=s}
   for(const s of G.surv)if(s.f===K.f&&s.lastHit&&G.t-s.lastHit<1&&dist(K,s)<600)heard=s;
   if(heard&&(!b.sus||G.t-b.sus.t>2.5)){const er=70*(1-D.kSight*0.5);b.sus={f:heard.f,x:heard.x+rr(-er,er),y:heard.y+rr(-er,er),t:G.t,why:'heart'};b.noInfo=0}
   if(K.buff.sense>0){let best=null,bd=1e9;for(const s of G.surv)if(s.st==='ok'||s.st==='down'){const d=dist(K,s)+(s.f!==K.f?500:0);if(d<bd){bd=d;best=s}}if(best)b.sus={f:best.f,x:best.x,y:best.y,t:G.t,why:'sense'}}
   if(!b.sus||G.t-b.sus.t>6){for(const g of M.gens)if(g.f===K.f&&g.noise>0&&dist(K,g)<420){b.sus={f:g.f,x:g.x,y:g.y+T,t:G.t,why:'gen'};break}}
   if(!b.sus||G.t-b.sus.t>4){const life=K.def.id==='rotjaw'?28:14;let nb=null;for(let i=G.blood.length-1;i>=0&&i>G.blood.length-120;i--){const d=G.blood[i];if(G.t-d.t>life)break;if(d.f===K.f&&Math.hypot(d.x-K.x,d.y-K.y)<260&&los(M,K.f,K.x,K.y,d.x,d.y)){nb=d;break}}if(nb)b.sus={f:nb.f,x:nb.x,y:nb.y,t:G.t,why:'blood'}}
  }
 }
 if(b.react>0)b.react-=dt;
 const vis=b.vis;
 // --- carrying: go hook ---
 if(K.carry){b.state='carry';
  const free=M.hooks.filter(h=>!h.victim);
  if(free.length){const near=interactOptions(G,K).find(o=>o.type==='hook');if(near){K.in.want='hook';K.in.wantT=null;K.in.act=true;K.in.mx=K.in.my=0;return}
   planTo(G,K,b,'hook',(f,x,y)=>free.some(h=>h.f===f&&Math.abs(x-h.tx)+Math.abs(y-h.ty)===1));follow(G,K,b)}
  if(K.def.id==='stitches'&&K.cd[1]<=0&&b.path&&b.path.length-b.pi>25&&rnd()<0.02)K.in.cast={i:1,ang:K.face};
  return}
 // --- downed survivor known: pick up ---
 const downed=G.surv.filter(s=>s.st==='down'&&s.f===K.f&&(kSees(G,K,s)||dist(K,s)<60));
 if(downed.length){const s=downed.sort((a,c)=>dist(K,a)-dist(K,c))[0];b.state='pickup';
  if(dist(K,s)<40){K.in.want='pickup';K.in.wantT=s;K.in.act=true;K.in.mx=K.in.my=0;return}
  planNode(G,K,b,'dn'+s.id+tc(s.x)+','+tc(s.y),s.f,tc(s.x),tc(s.y));follow(G,K,b);return}
 K.in.act=false;K.in.want=null;
 // --- chase ---
 if(vis&&vis.st==='ok'){b.state='chase';b.chaseT+=dt;b.sus=null;const d=dist(K,vis);const a=Math.atan2(vis.y-K.y,vis.x-K.x);
  if(d<200&&thickClear(M,K.f,K.x,K.y,vis.x,vis.y,K.r,'k')){steer(K,vis.x,vis.y);b.moveIntent=true}else{const gx=tc(vis.x),gy=tc(vis.y);planTo(G,K,b,'ch'+gx+','+gy,(f,x,y)=>f===vis.f&&Math.abs(x-gx)<=1&&Math.abs(y-gy)<=1);
   if(!b.path.length){b.giveUp=b.giveUp||{};b.giveUp[vis.id]=G.t+4;b.vis=null}else follow(G,K,b)}
  if(b.react<=0){
   const aim=a+rr(-D.kAim,D.kAim);
   if(d<44){K.face=aim;K.in.atk=true}
   else if(rnd()<D.kAb*0.25){
    const id0=K.def.ab[0].id,id1=K.def.ab[1].id;
    for(let i=0;i<2;i++){if(K.cd[i]>0)continue;const id=K.def.ab[i].id;
     if((id==='rope'||id==='veil'||id==='pounce')&&d>70&&d<K.def.ab[i].range-10){const sh=abShape(G,K,i,aim);if(sh.hit===vis){K.in.cast={i,ang:aim};break}}
     if(id==='rip'&&(b.chaseT>6||d>140)){K.in.cast={i,ang:a};break}
     if(id==='whisper'&&d>180&&b.chaseT>4){K.in.cast={i,ang:a};break}
    }}
  }
  return}
 b.chaseT=0;
 if(K.def.id==='rotjaw'&&K.cd[0]<=0&&b.noInfo>10&&rnd()<D.kAb*0.05)K.in.cast={i:0,ang:K.face};
 if(K.def.id==='bride'&&K.cd[0]<=0&&b.sus&&b.sus.why==='heart'&&rnd()<D.kAb*0.05)K.in.cast={i:0,ang:K.face};
 // --- go to last seen / suspicion ---
 const ls=b.lastSeen;if(ls&&G.t-ls.t<5&&!ls.done){b.state='lost';const tx=ls.x+clamp(ls.vx,-1,1)*8*T/4,ty=ls.y+clamp(ls.vy,-1,1)*8*T/4;
  let gx=tc(ls.x),gy=tc(ls.y);if(!solidAt(M,ls.f,tc(tx),tc(ty),'k')&&M.floors[ls.f].blk[idx(tc(tx),tc(ty))]===0){gx=tc(tx);gy=tc(ty)}
  planNode(G,K,b,'ls'+gx+','+gy+','+ls.f,ls.f,gx,gy);if(follow(G,K,b)||!b.path||!b.path.length)ls.done=true;return}
 if(b.sus&&G.t-b.sus.t<12){b.state='sus';const s=b.sus;let gx=tc(s.x),gy=tc(s.y);
  if(solidAt(M,s.f,gx,gy,'k')){const n=bfs(M,'k',s.f,clamp(gx,1,FW-2),clamp(gy,1,FH-2),null,1);gx=clamp(gx,1,FW-2);gy=clamp(gy,1,FH-2)}
  planTo(G,K,b,'sus'+gx+','+gy+','+s.f,(f,x,y)=>f===s.f&&Math.abs(x-gx)<=1&&Math.abs(y-gy)<=1);if(follow(G,K,b)||!b.path.length)b.sus=null;return}
 // --- patrol: gens weighted by progress, sometimes kick ---
 b.state='patrol';
 const kick=interactOptions(G,K).find(o=>o.type==='kick');if(kick&&kick.target.p>0.2&&rnd()<0.5*D.kAb+0.2){K.in.want='kick';K.in.wantT=kick.target;K.in.act=true;K.in.mx=K.in.my=0;b.patrol=null;return}
 if(!b.patrol||G.t-b.patrol.t>45){const gs=M.gens.filter(g=>!g.done);let tg=null;
  if(gs.length&&rnd()<0.7){let tot=0;for(const g of gs)tot+=0.3+g.p+(g.f===K.f?0.4:0);let r=rnd()*tot;for(const g of gs){r-=0.3+g.p+(g.f===K.f?0.4:0);if(r<=0){tg=g;break}}tg=tg||gs[0];b.patrol={o:tg,t:G.t}}
  else{let f=ri(0,M.floors.length-1),x,y,n=0;do{x=ri(1,FW-2);y=ri(1,FH-2)}while(solidAt(M,f,x,y,'k')&&n++<50);b.patrol={o:{f,tx:x,ty:y,pt:true},t:G.t}}}
 const o=b.patrol.o;let arrived;
 if(o.pt){planNode(G,K,b,'pt'+o.f+','+o.tx+','+o.ty,o.f,o.tx,o.ty);arrived=follow(G,K,b)}else{planAdj(G,K,b,'pg'+o.id,o);arrived=follow(G,K,b)}
 if(arrived||!b.path||!b.path.length)b.patrol=null;
}
/* ---------- survivor ---------- */
function sSeesK(G,s,K){if(K.f!==s.f||K.vanish>0||K.climb||s.climb)return false;const d=dist(s,K);if(d>SIGHT*1.1)return false;return los(G.M,s.f,s.x,s.y,K.x,K.y)}
function survBot(G,s,b,dt){
 const M=G.M,K=G.killer,D=G.diff;s.in.cast=null;
 if(s.st==='carried'||s.st==='hooked'){s.in.mx=s.in.my=0;s.in.act=false;return}
 if(s.climb||s.stun>0||s.pull)return;
 if(s.act&&s.act.type==='vault')return;
 const seen=sSeesK(G,s,K);if(seen){b.lastK={x:K.x,y:K.y,f:K.f,t:G.t}}
 const kd=K.f===s.f?dist(s,K):1e9,heart=kd<TERROR&&K.vanish<=0;
 if(s.st==='down'){b.state='crawl';let tg=null,bd=1e9;for(const o of G.surv)if(o!==s&&o.st==='ok'&&o.f===s.f){const d=dist(s,o);if(d<bd){bd=d;tg=o}}
  if(tg&&bd>30){planNode(G,s,b,'cr'+tc(tg.x)+','+tc(tg.y),tg.f,tc(tg.x),tc(tg.y));follow(G,s,b)}else{s.in.mx=s.in.my=0;b.moveIntent=false}s.in.act=false;return}
 s.in.run=true;
 const recentK=b.lastK&&b.lastK.f===s.f&&G.t-b.lastK.t<2.5;
 const danger=(b.fleeUntil>G.t&&K.f===s.f)||(seen&&kd<D.sFlee&&!(K.carry&&kd>130))||(heart&&kd<95)||(s.lastHit&&G.t-s.lastHit<3&&K.f===s.f)||(recentK&&b.state==='flee'&&kd<D.sFlee+40);
 // abilities
 const ab=s.def.ab.id,aR=rnd()<D.sAb*0.3;
 if(s.cd[0]<=0&&aR){
  if(ab==='sprint'&&danger&&kd<150)s.in.cast={i:0,ang:s.face};
  else if(ab==='lamp'&&seen&&kd<160){const a=Math.atan2(K.y-s.y,K.x-s.x)+rr(-0.15,0.15)*(1-D.sSkill);if(abShape(G,s,0,a).hit)s.in.cast={i:0,ang:a}}
  else if(ab==='hide'&&heart)s.in.cast={i:0,ang:s.face};
  else if(ab==='shot'){const sh=abShape(G,s,0,0);if(sh.target&&sh.target.hp<sh.target.maxhp*0.65)s.in.cast={i:0,ang:0}}
  else if(ab==='overload'&&s.act&&s.act.type==='repair'&&s.act.target.p<0.7)s.in.cast={i:0,ang:0};
 }
 // lamp a killer who carries a friend
 if(ab==='lamp'&&s.cd[0]<=0&&seen&&K.carry&&kd<160){const a=Math.atan2(K.y-s.y,K.x-s.x);if(abShape(G,s,0,a).hit)s.in.cast={i:0,ang:a}}
 if(danger){if(!(b.fleeUntil>G.t))b.fleeUntil=G.t+2.5+rnd()*2;b.state='flee';if(s.act&&HOLD[s.act.type])s.act=null;if(s.act)return;s.prone=false;
  // knock furniture onto the killer
  for(const fu of M.furn)if(fu.state==='up'&&fu.f===s.f&&dist(s,fu)<44&&kd<150){const fz={x:cc(fu.fx),y:cc(fu.fy)};const kz=dist(K,fz),vert=fuVert(G,fu),sideS=vert?Math.sign(s.x-fz.x):Math.sign(s.y-fz.y),sideK=vert?Math.sign(K.x-fz.x):Math.sign(K.y-fz.y);
    const inZone=Math.abs(s.x-fz.x)<T/2+s.r&&Math.abs(s.y-fz.y)<T/2+s.r;
    if(!inZone&&(kz<44||(sideS!==sideK&&kd<130&&rnd()<0.6*D.sSkill))){s.in.want='knock';s.in.wantT=fu;s.in.act=true;s.in.mx=s.in.my=0;return}}
  if(!b.flee||b.repath<=0||G.t-b.fleeT>1.0||b.goalKey!=='flee'){b.fleeT=G.t;
   if(!b.fuNear){b.fuNear=new Set();for(const fu of M.furn)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])b.fuNear.add(fu.f*FW*FH+idx(fu.tx+dx,fu.ty+dy))}
   const kx=K.x,ky=K.y,kf=K.f;bfs(M,'s',s.f,tc(s.x),tc(s.y),null,16,(f,x,y)=>f===kf&&Math.abs(cc(x)-kx)<T*0.9&&Math.abs(cc(y)-ky)<T*0.9);
   let best=-1,bs=-1e9;for(let i=0;i<M.qt;i+=1){const n=M.q[i],f=nodeF(n),[x,y]=nodeXY(n);let sc=f!==kf?600:Math.hypot(cc(x)-kx,cc(y)-ky);const t=M.floors[f].g[idx(x,y)];if(t===TI.GAP)sc+=60;if(b.fuNear&&b.fuNear.has(n))sc+=110;sc-=M.depth[n]*4;sc+=rnd()*30;if(sc>bs){bs=sc;best=n}}
   if(best>=0){b.path=pathTo(M,best);b.pi=0;b.goalKey='flee';b.repath=1}}
  follow(G,s,b);if(!b.path||b.path.length<2){const a=Math.atan2(s.y-K.y,s.x-K.x)+rr(-0.6,0.6);s.in.mx=Math.cos(a);s.in.my=Math.sin(a);b.moveIntent=true}b.flee=true;return}
 b.flee=false;if(b.goalKey==='flee')b.path=null;
 // stealth: hear heart but not seen -> lie low
 if(heart&&!seen&&rnd()<0.3*D.sSkill&&!s.act){s.prone=true}else if(!heart)s.prone=false;
 const safe=!b.lastK||G.t-b.lastK.t>5||b.lastK.f!==s.f;
 // gates
 if(G.powered){b.state='gate';const open=M.gates.find(g=>g.open);
  if(open){const[gx,gy]=open.tiles[0];planNode(G,s,b,'out'+gx,open.f,gx,gy);follow(G,s,b);return}
  const g=M.gates.reduce((a,c)=>(Math.hypot(s.x-c.x,s.y-c.y)+(s.f!==c.f?900:0))<(Math.hypot(s.x-a.x,s.y-a.y)+(s.f!==a.f?900:0))?c:a);
  if(s.f===g.f&&Math.hypot(s.x-g.x,s.y-g.y)<50){s.in.want='gate';s.in.wantT=g;s.in.act=true;s.in.mx=s.in.my=0;return}
  planTo(G,s,b,'gate'+g.name,(f,x,y)=>f===g.f&&Math.abs(cc(x)-g.x)<T*1.2&&Math.abs(cc(y)-g.y)<T*1.0&&!(g.tiles.some(([a,c])=>a===x&&c===y)));follow(G,s,b);return}
 // rescue hooked ally (hooked survivors are announced to everyone)
 const hooked=M.hooks.filter(h=>h.victim);
 for(const h of hooked){if(!h.rescuer||h.rescuer.st!=='ok'||(h.rescuerT&&G.t-h.rescuerT>70)){const free=G.surv.filter(o=>o.st==='ok'&&!hooked.some(q=>q!==h&&q.rescuer===o));const pickS=(free.length?free:G.surv.filter(o=>o.st==='ok')).sort((a,c)=>(dist(a,h)+(a.f!==h.f?800:0))-(dist(c,h)+(c.f!==h.f?800:0)))[0];h.rescuer=pickS||null;h.rescuerT=G.t}}
 const myH=hooked.find(h=>h.rescuer===s);
 if(myH&&safe){const h=myH;
  if(!(K.f===h.f&&dist(K,h)<120&&seen)){b.state='rescue';if(s.f===h.f&&dist(s,h)<46){s.in.want='unhook';s.in.wantT=h;s.in.act=true;s.in.mx=s.in.my=0;return}
   planAdj(G,s,b,'hk'+h.id,h);follow(G,s,b);return}}
 // revive downed ally on same floor
 const dn=G.surv.find(o=>o!==s&&o.st==='down'&&o.f===s.f&&dist(s,o)<350);
 if(dn&&safe&&!(K.f===s.f&&dist(K,dn)<160)){b.state='revive';if(dist(s,dn)<38){s.in.want='revive';s.in.wantT=dn;s.in.act=true;s.in.mx=s.in.my=0;return}
  planNode(G,s,b,'rv'+dn.id+tc(dn.x)+','+tc(dn.y),dn.f,tc(dn.x),tc(dn.y));follow(G,s,b);return}
 // medkit
 if(s.item==='medkit'&&s.hp<s.maxhp*0.8&&safe){b.state='medkit';s.in.want='medkit';s.in.wantT=s;s.in.act=true;s.in.mx=s.in.my=0;return}
 // heal an injured ally standing right next to me
 const inj=G.surv.find(o=>o!==s&&o.st==='ok'&&o.hp<o.maxhp*0.6&&o.f===s.f&&dist(s,o)<36);
 if(inj&&safe&&rnd()<0.5){s.in.want='heal';s.in.wantT=inj;s.in.act=true;s.in.mx=s.in.my=0;return}
 // loot visible item
 if(!s.item||s.item==='toolbox'&&s.hp<s.maxhp){const it=M.items.find(i=>!i.taken&&i.f===s.f&&dist(s,i)<220&&(s.item!==i.kind)&&los(M,s.f,s.x,s.y,i.x,i.y));
  if(it){b.state='loot';if(dist(s,it)<26){s.in.want='pick';s.in.wantT=it;s.in.act=true;s.in.mx=s.in.my=0;return}planNode(G,s,b,'it'+tc(it.x)+','+tc(it.y)+','+it.f,it.f,tc(it.x),tc(it.y));follow(G,s,b);return}}
 // generators
 if(!b.gen||b.gen.done||rnd()<0.002){const gs=M.gens.filter(g=>!g.done);let bg=null,bsc=1e9;for(const g of gs){const sc=dist(s,g)+(g.f!==s.f?700+Math.abs(g.f-s.f)*250:0)+g.users*250-g.p*200+(b.lastK&&b.lastK.f===g.f&&G.t-b.lastK.t<15&&dist(b.lastK,g)<300?600:0);if(sc<bsc){bsc=sc;bg=g}}b.gen=bg}
 const g=b.gen;if(!g){s.in.mx=s.in.my=0;b.moveIntent=false;return}
 b.state='gen';
 if(s.f===g.f&&dist(s,g)<44){s.in.want='repair';s.in.wantT=g;s.in.act=true;s.in.mx=s.in.my=0;b.moveIntent=false;return}
 planAdj(G,s,b,'gen'+g.id,g);follow(G,s,b);
}
