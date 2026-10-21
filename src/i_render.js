/* ===== i_render: camera, y-sorted pseudo-3D world, lighting, aim previews ===== */
const R={cv:null,c:null,W:0,H:0,dpr:1,S:1,cam:{x:0,y:0},floorCv:{},lastF:-1,fade:0,light:null,lc:null,beatT:0};
function poseOf(G,e){
 if(e.side==='s'){if(e.st==='down')return'down';if(e.st==='hooked')return'hooked';if(e.act&&e.act.type==='vault')return'vault';if(e.act)return'repair';if(e.prone)return'prone';if(e.hitT>0)return'hit';return e.moving?(e.sprint||e.buff.sprint>0||e.burst>0?'run':'walk'):'idle'}
 if(e.stun>0)return'stun';if(e.lunge>0||e.wipe>0.9)return'attack';if(e.act)return'repair';return e.pounce||(e.moving&&e.sprint)?'run':e.moving?'walk':'idle';
}
function render(G,dt){
 const c=R.c,W=R.W,H=R.H,dpr=R.dpr,t=G.t;
 let v=G.view;if(G.player&&G.player.side==='s'&&(G.player.st==='dead'||G.player.st==='out')){const al=G.surv.find(s=>aliveS(s));G.view=v=al||G.killer}
 if(v.st==='carried'&&v.carrier){}
 const f=v.f;if(f!==R.lastF){R.fade=R.lastF<0?0:0.45;R.lastF=f}R.fade=Math.max(0,R.fade-dt);
 const S=R.S=Math.max(1,Math.round(H*dpr/330))/dpr;
 let tx=v.x,ty=v.y;if(v.climb){const k=v.climb.t/v.climb.dur;tx=lerp(v.climb.fx,cc(v.climb.s.x),k);ty=lerp(v.climb.fy,cc(v.climb.s.y),k)}
 R.cam.x+=(tx-R.cam.x)*Math.min(1,dt*8);R.cam.y+=(ty-R.cam.y)*Math.min(1,dt*8);if(Math.abs(R.cam.x-tx)>400||Math.abs(R.cam.y-ty)>400||R.fade>0.4){R.cam.x=tx;R.cam.y=ty}
 const sh=G.shake>0?G.shake:0,sx=fr(-sh,sh),sy=fr(-sh,sh);
 const ox=Math.round((W/2-R.cam.x*S+sx)*dpr),oy=Math.round((H/2-R.cam.y*S+sy)*dpr);
 c.setTransform(1,0,0,1,0,0);c.fillStyle='#050307';c.fillRect(0,0,R.cv.width,R.cv.height);
 c.setTransform(dpr*S,0,0,dpr*S,ox,oy);c.imageSmoothingEnabled=false;
 const key=G.M.kind+f+'_'+G.seed;if(!R.floorCv[key]){R.floorCv={};R.floorCv[key]=drawFloorLayer(G.M,f)}
 c.drawImage(R.floorCv[key],0,0);
 const vx0=R.cam.x-W/2/S-T,vx1=R.cam.x+W/2/S+T,vy0=R.cam.y-H/2/S-T,vy1=R.cam.y+H/2/S+T*3;
 // blood
 const viewer=G.view,life=(viewer.side==='k'&&viewer.def.id==='rotjaw')?28:14;
 for(const b of G.blood){if(b.f!==f||b.x<vx0||b.x>vx1||b.y<vy0||b.y>vy1)continue;const age=t-b.t;if(age>life&&!b.big)continue;const a=b.big?Math.max(0.25,1-age/60):1-age/life;c.globalAlpha=a;c.fillStyle='#7a0a12';const s=b.big?6:3;c.fillRect(b.x-s/2|0,b.y-s/2|0,s,s);if(b.big){c.fillRect(b.x-7|0,b.y+1|0,4,2);c.fillRect(b.x+3|0,b.y-3|0,3,3)}}
 c.globalAlpha=1;
 drawTracks(G,c,f,t);drawWorld2(G,c,f,t);
 // stair labels
 for(const s of G.M.stairs)if(s.f===f){c.fillStyle='rgba(255,210,120,0.8)';c.font='bold 8px monospace';c.textAlign='center';c.fillText(s.label,cc(s.x),s.y*T-2)}
 // drawables
 const D=[];const M=G.M,F=M.floors[f];
 const tx0=Math.max(0,tc(vx0)),tx1=Math.min(FW-1,tc(vx1)),ty0=Math.max(0,tc(vy0)),ty1=Math.min(FH-1,tc(vy1)+2);
 for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++){const tt=F.g[idx(x,y)];if(tt===TI.WALL||tt===TI.GAP||tt===TI.TREE||tt===TI.FENCE||tt===TI.HOUSE)D.push({k:(y+1)*T-0.5,fn:()=>drawWallTile(c,M,f,x,y,tt)})}
 for(const d of F.deco)D.push({k:cc(d.y)+12,fn:()=>drawDeco(c,d,F.pal)});
 for(const g of M.gens)if(g.f===f)D.push({k:g.y+10,fn:()=>drawGen(c,g,t)});
 for(const h of M.hooks)if(h.f===f)D.push({k:h.y+8,fn:()=>{drawHook(c,h,t);if(h.victim){const v2=h.victim;drawChar(c,v2,h.x+10,h.y-6,'hooked',t,{noShadow:true});if(v2.hookT<15){c.fillStyle='rgba(0,0,0,0.6)';c.fillRect(h.x-8,h.y-72,36,4);c.fillStyle='#e03030';c.fillRect(h.x-8,h.y-72,36*v2.hookT/(v2.hookN===1?60:35),4)}}}});
 for(const fu of M.furn)if(fu.f===f)D.push({k:fu.state==='up'?fu.y+12:cc(fu.fy)+10,fn:()=>drawFurn(c,fu,t)});
 for(const it of M.items)if(!it.taken&&it.f===f)D.push({k:it.y+6,fn:()=>drawItem(c,it,t)});
 for(const L of M.lockers||[])if(L.f===f)D.push({k:L.y+12,fn:()=>drawLocker(c,L,t,L.occ&&L.occ===G.player)});
 for(const g of M.gates)if(g.f===f)D.push({k:g.y+T,fn:()=>drawGate(c,g,t)});
 for(const e of G.ents){if(e.f!==f)continue;if(e.side==='s'&&(e.st==='dead'||e.st==='out'||e.st==='carried'||e.st==='hooked'||e.st==='hidden'))continue;D.push({k:e.y,fn:()=>drawEnt(G,c,e,t)})}
 D.sort((a,b)=>a.k-b.k);for(const d of D)d.fn();
 // projectiles
 for(const p of G.proj){if(p.f!==f)continue;const o=p.owner,ca=Math.cos(p.tr.ang),sa=Math.sin(p.tr.ang),px=p.tr.x0+ca*p.d,py=p.tr.y0+sa*p.d;
  if(p.kind==='whistle'){vbox(c,px-3,py-16-Math.sin(p.d/p.tr.len*Math.PI)*18,6,3,'#c8d0d8')}
  else if(p.kind==='rope'){c.strokeStyle='#c8a870';c.lineWidth=2;c.beginPath();c.moveTo(o.x,o.y-20);c.lineTo(px,py-14);c.stroke();vbox(c,px-3,py-18,6,6,'#aab')}
  else{c.save();c.translate(px,py-14);c.rotate(t*12);c.fillStyle='rgba(240,240,255,0.9)';c.fillRect(-10,-6,20,12);c.fillStyle='rgba(200,210,230,0.9)';c.fillRect(-12,-2,24,4);c.restore()}}
 drawSouls(G,c,f,t);
 // particles
 for(const p of G.fx){if(p.f!==f)continue;c.globalAlpha=Math.min(1,p.t*2);c.fillStyle=p.col;c.fillRect(p.x|0,p.y|0,p.sz,p.sz)}c.globalAlpha=1;
 // hearts above survivors when the killer is near (same floor only)
 const K=G.killer;for(const s of G.surv)if(s.f===f&&K.f===f&&(s.st==='ok'||s.st==='down'||s.st==='hidden')&&!(s.buff.hide>0)&&K.vanish<=0){const d=dist(s,K);if(d<TERROR){const k=1-d/TERROR,ph=(t*(1.2+k*2.5))%1,sc=0.8+k*0.5+(ph<0.15?0.35:0);drawHeart(c,s.x,s.y-50,sc,0.55+k*0.45)}}
 // aim preview (player)
 const P=G.player;if(P&&P.aim&&P.f===f)drawAim(G,c,P,P.aim.i,P.aim.ang);
 if(P&&P.side==='k'&&P.lunge>0){const a=attackShape(P);c.strokeStyle='rgba(255,255,255,0.7)';c.lineWidth=3;c.beginPath();c.arc(P.x,P.y-14,30,P.face-1,P.face+1);c.stroke()}
 drawGateLights(G,c,f,t);
 // lighting
 if(!(G.flashT>0))drawLight(G,c,v,S,ox,oy,dpr);
 c.setTransform(dpr,0,0,dpr,0,0);
 // sense markers (Rotjaw): all hearts map-wide
 if(P&&P.side==='k'&&P.buff.sense>0)for(const s of G.surv)if(aliveS(s)){const X=(s.x-R.cam.x)*S+W/2,Y=(s.y-R.cam.y)*S+H/2;const cx=clamp(X,30,W-30),cy=clamp(Y,60,H-30);drawHeart(c,cx,cy,1.4,0.9);if(s.f!==f){c.fillStyle='#ffb0b0';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText((s.f>f?'▲ ':'▼ ')+M.floors[s.f].name.split(' ·')[0],cx,cy+20)}}
 // frost (Pale Bride passive) / blind flash / floor fade / killer red tint
 if(v.side==='s'&&K.def.id==='bride'&&K.f===v.f&&dist(K,v)<170&&K.vanish<=0){const k=1-dist(K,v)/170;const g=c.createRadialGradient(W/2,H/2,Math.min(W,H)*0.25,W/2,H/2,Math.max(W,H)*0.65);g.addColorStop(0,'rgba(200,230,255,0)');g.addColorStop(1,'rgba(200,230,255,'+(0.55*k)+')');c.fillStyle=g;c.fillRect(0,0,W,H);c.fillStyle='rgba(235,245,255,'+(0.5*k)+')';for(let i=0;i<40;i++){const a=hash2(i,7),b=hash2(7,i);const x=a<0.5?a*W*0.3:W-(a-0.5)*W*0.3,y=b*H;c.fillRect(x|0,y|0,3,3);c.fillRect((x+4)|0,(y+3)|0,2,2)}}
 if(v.side==='k'&&v.blind>0){c.fillStyle='rgba(255,255,240,'+Math.min(0.95,v.blind/1.2)+')';c.fillRect(0,0,W,H)}
 if(v.side==='k'){c.fillStyle='rgba(120,0,0,0.08)';c.fillRect(0,0,W,H)}
 drawCurseView(G,c,v,S,W,H,f,t);drawWeather(G,c,W,H,t);drawChaseEdges(c,W,H,G.chaseLv||0,t);
 if(G.player&&G.player.st==='hidden'){c.fillStyle='rgba(0,0,0,0.78)';c.fillRect(0,0,W,H*0.42);c.fillRect(0,H*0.58,W,H*0.42);c.fillStyle='rgba(0,0,0,0.5)';for(let i=0;i<4;i++)c.fillRect(0,H*0.42+i*H*0.045,W,H*0.012)}
 if(R.fade>0){c.fillStyle='rgba(0,0,0,'+Math.min(1,R.fade/0.3)+')';c.fillRect(0,0,W,H)}
 // heartbeat audio
 heartAudio(G,v,dt);chaseAudio(G,dt);
}
function drawEnt(G,c,e,t){
 let pose=poseOf(G,e),o={};
 if(e.hitT>0&&Math.sin(t*60)>0)o.white=true;
 if(e.climb){const k=e.climb.t/e.climb.dur,up=e.climb.s.to.f>e.f;o.alpha=1-k;drawChar(c,e,e.x,e.y-(up?k*14:-k*10),'walk',t,o);return}
 if(e.act&&e.act.type==='vault')o.k=e.act.t/e.act.dur;
 if(e.side==='k'){
  if(e.vanish>0){if(G.view!==e){if(Math.random()<0.3){c.fillStyle='rgba(220,230,255,0.4)';c.fillRect(e.x+fr(-12,12),e.y-fr(0,40),3,3)}return}o.alpha=0.3}
  if(e.lunge>0)o.k=1-e.lunge/0.3;
  drawChar(c,e,e.x,e.y,pose,t,o);
  if(e.carry)drawChar(c,e.carry,e.x,e.y-38,'carried',t,{noShadow:true,face:e.face});
  if(e.stun>0){for(let i=0;i<3;i++){const a=t*6+i*2.1;c.fillStyle='#ffe060';c.fillRect(e.x+Math.cos(a)*14-2,e.y-56+Math.sin(a)*4,4,4)}}
  if(e.buff.rip>0){c.strokeStyle='rgba(255,60,40,'+(0.4+0.3*Math.sin(t*20))+')';c.lineWidth=2;c.beginPath();c.arc(e.x,e.y-16,24,0,6.283);c.stroke()}
  if(e.blind>0){c.fillStyle='#fff';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText('✶',e.x,e.y-60)}
  return}
 drawChar(c,e,e.x,e.y,pose,t,o);
 if(e.slow>0){c.fillStyle='rgba(235,240,255,0.8)';c.fillRect(e.x-10,e.y-24,20,3);c.fillRect(e.x-8,e.y-16,16,3)}
 if(e.buff.lamp>0){const a=e.lampAng;c.fillStyle='rgba(255,250,200,0.35)';c.beginPath();c.moveTo(e.x,e.y-14);c.arc(e.x,e.y-14,150,a-0.42,a+0.42);c.fill()}
 if(e.st==='down'){c.fillStyle='rgba(0,0,0,0.6)';c.fillRect(e.x-14,e.y-30,28,3);c.fillStyle='#e04040';c.fillRect(e.x-14,e.y-30,28*(1-e.downT/120),3)}
 if(G.view&&G.view.side==='s'&&e!==G.view){c.fillStyle='rgba(240,230,210,0.85)';c.font='7px sans-serif';c.textAlign='center';c.fillText(e.def.name.split(' ')[0],e.x,e.y-44)}
}
function drawAim(G,c,e,i,ang){
 const sh=abShape(G,e,i,ang);if(!sh)return;const ready=canCast(G,e,i);c.save();c.lineWidth=2;const col=ready?'rgba(255,220,120,':'rgba(160,160,160,';
 const tri=(tr,w)=>{c.strokeStyle=col+'0.9)';c.setLineDash([6,4]);c.beginPath();c.moveTo(tr.x0,tr.y0-10);c.lineTo(tr.x1,tr.y1-10);c.stroke();c.setLineDash([]);if(w){c.fillStyle=col+'0.15)';c.save();c.translate(tr.x0,tr.y0-10);c.rotate(tr.ang);c.fillRect(0,-w,tr.len,w*2);c.restore()}c.fillStyle=sh.hit?'rgba(255,60,60,0.9)':col+'0.9)';c.beginPath();c.arc(tr.x1,tr.y1-10,5,0,6.283);c.fill()};
 switch(sh.type){
  case'ray':tri(sh.tr,8);break;case'proj':tri(sh.tr,14);break;case'dash':tri(sh.tr,e.r);break;case'arrow':tri(sh.tr,0);break;
  case'ring':c.strokeStyle=col+'0.8)';c.beginPath();c.arc(sh.x,sh.y-6,sh.r,0,6.283);c.stroke();if(sh.global){c.fillStyle=col+'0.9)';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('вся карта',sh.x,sh.y-sh.r-10)}break;
  case'target':case'circle':c.strokeStyle=col+'0.6)';c.setLineDash([5,5]);c.beginPath();c.arc(sh.x,sh.y,sh.r,0,6.283);c.stroke();c.setLineDash([]);c.fillStyle=col+'0.08)';c.fill();if(sh.target){c.strokeStyle='rgba(255,80,80,0.9)';c.beginPath();c.arc(sh.target.x,sh.target.y-12,16,0,6.283);c.stroke();c.beginPath();c.moveTo(sh.x,sh.y-12);c.lineTo(sh.target.x,sh.target.y-12);c.stroke()}break;
  case'place':case'tp':drawAim3(G,c,e,sh,col);break;
  case'cone':c.fillStyle=sh.hit?'rgba(255,120,80,0.3)':col+'0.22)';c.beginPath();c.moveTo(sh.x,sh.y-14);c.arc(sh.x,sh.y-14,sh.r,sh.ang-sh.half,sh.ang+sh.half);c.closePath();c.fill();c.strokeStyle=col+'0.8)';c.stroke();break;
 }c.restore();
}
function drawLight(G,c,v,S,ox,oy,dpr){
 const W=R.W,H=R.H,lw=Math.ceil(W/3),lh=Math.ceil(H/3);if(!R.light||R.light.width!==lw||R.light.height!==lh){R.light=document.createElement('canvas');R.light.width=lw;R.light.height=lh;R.lc=R.light.getContext('2d')}
 const l=R.lc,F=G.M.floors[v.f];l.globalCompositeOperation='source-over';l.clearRect(0,0,lw,lh);l.fillStyle=G.blackout&&G.blackout.on?'rgba(2,2,6,0.95)':F.outdoor?'rgba(6,8,22,0.62)':'rgba(4,2,6,0.86)';l.fillRect(0,0,lw,lh);
 l.globalCompositeOperation='destination-out';
 const hole=(x,y,r,a)=>{const X=(x*S*dpr+ox)/dpr/3,Y=(y*S*dpr+oy)/dpr/3,rr2=r*S/3;if(X<-rr2||Y<-rr2||X>lw+rr2||Y>lh+rr2)return;const g=l.createRadialGradient(X,Y,rr2*0.2,X,Y,rr2);g.addColorStop(0,'rgba(0,0,0,'+a+')');g.addColorStop(1,'rgba(0,0,0,0)');l.fillStyle=g;l.beginPath();l.arc(X,Y,rr2,0,6.283);l.fill()};
 const vm=visMul(G);hole(v.x,v.y-10,(v.side==='k'?250:230)*vm,1);
 for(const g of G.M.gens)if(g.f===v.f)hole(g.x,g.y,g.done?120:50,g.done?0.9:0.5);
 for(const s of G.M.stairs)if(s.f===v.f)hole(cc(s.x),cc(s.y),50,0.5);
 for(const g of G.M.gates)if(g.f===v.f&&G.powered)hole(g.x,g.y,90,0.8);
 for(const e of G.surv)if(e.f===v.f&&e.buff.lamp>0)hole(e.x+Math.cos(e.lampAng)*70,e.y+Math.sin(e.lampAng)*70,110,1);
 c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=true;c.drawImage(R.light,0,0,lw*3*dpr,lh*3*dpr);c.imageSmoothingEnabled=false;
}
function heartAudio(G,v,dt){
 if(!AU.ctx||G.over)return;const K=G.killer;let d=1e9;
 if(v.side==='s'){if(K.f===v.f&&K.vanish<=0)d=dist(K,v)}else{for(const s of G.surv)if(s.f===v.f&&(s.st==='ok'||s.st==='down'||s.st==='hidden')&&!(s.buff.hide>0))d=Math.min(d,dist(s,v))}
 if(d>=TERROR)return;const k=1-d/TERROR;R.beatT-=dt;if(R.beatT<=0){R.beatT=lerp(1.1,0.38,k);AU.beat(0.25+0.6*k)}
}
