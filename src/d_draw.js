/* ===== d_draw: chunky pixel-art primitives drawn in code (blocky characters, tiles, props) ===== */
const OUT='#120a0c';
function shade(hex,k){const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;if(k>0){r+=(255-r)*k;g+=(255-g)*k;b+=(255-b)*k}else{r*=1+k;g*=1+k;b*=1+k}return'rgb('+(r|0)+','+(g|0)+','+(b|0)+')'}
/* box with outline + lit top / shaded right side (pseudo-3D face shading) */
function vbox(c,x,y,w,h,col,o){x=Math.round(x);y=Math.round(y);c.fillStyle=OUT;c.fillRect(x-1,y-1,w+2,h+2);c.fillStyle=col;c.fillRect(x,y,w,h);
 if(o!==0){c.fillStyle=shade(col,0.22);c.fillRect(x,y,w,Math.max(1,Math.round(h*0.22)));c.fillStyle=shade(col,-0.3);c.fillRect(x+w-Math.max(1,Math.round(w*0.25)),y,Math.max(1,Math.round(w*0.25)),h)}}
function shadow(c,x,y,rx,ry,a){c.fillStyle='rgba(0,0,0,'+(a||0.4)+')';c.beginPath();c.ellipse(x,y,rx,ry,0,0,6.283);c.fill()}
const CHARCACHE={};
/* Character renderer. pose: idle|walk|run|crouch|prone|down|carried|hooked|repair|vault|hit|attack|stun|climb */
function drawChar(c,e,x,y,pose,t,o){
 o=o||{};const d=e.def,K=e.side==='k',P=K?2.6:2;const face=o.face!=null?o.face:e.face;
 const fx=Math.cos(face),fy=Math.sin(face);const dir=Math.abs(fy)>Math.abs(fx)*1.1?(fy>0?'down':'up'):'side',flip=fx<0;
 const white=o.white;const C=col=>white?'#ffffff':col;
 c.save();c.translate(Math.round(x),Math.round(y));
 const lying=pose==='down'||pose==='prone'||pose==='carried';
 if(!o.noShadow&&pose!=='carried'&&pose!=='hooked')shadow(c,0,0,(K?14:10)*(lying?1.4:1),K?5:4,0.45);
 if(o.alpha!=null)c.globalAlpha=o.alpha;
 if(lying){c.rotate((flip?-1:1)*Math.PI/2*(pose==='carried'?1:0.94));c.translate(pose==='carried'?-4:6*(flip?1:-1)*0,pose==='carried'?0:-2)}
 if(pose==='hooked'){c.translate(0,-16+Math.sin(t*2)*1);c.rotate(Math.sin(t*1.7)*0.08)}
 if(flip&&dir==='side')c.scale(-1,1);
 const wk=e.walk||0,mv=pose==='walk'||pose==='run'||pose==='prone'||pose==='down';
 const sw=mv?Math.sin(wk*(pose==='run'?1:0.8)):0,bob=mv?Math.abs(Math.cos(wk*(pose==='run'?1:0.8)))*P*0.8:0;
 const crouch=pose==='crouch'?P*3:0;
 let by=-bob+crouch;
 if(pose==='vault'){by-=Math.sin(Math.PI*(o.k||0))*14}
 // legs
 const legH=6*P,legW=3*P;
 if(pose!=='hooked'){vbox(c,-4*P,-legH+(sw>0?-sw*P*1.5:0)+crouch*0.6,legW,legH-(sw>0?-sw*P*1.5:0)-crouch*0.6,C(shade(d.body,-0.45)));vbox(c,1*P,-legH+(sw<0?sw*P*1.5:0)+crouch*0.6,legW,legH-(sw<0?sw*P*1.5:0)-crouch*0.6,C(shade(d.body,-0.5)))}
 else{const dl=Math.sin(t*3)*P;vbox(c,-4*P,-legH+dl,legW,legH,C(shade(d.body,-0.45)));vbox(c,1*P,-legH-dl,legW,legH,C(shade(d.body,-0.5)))}
 // body
 const bw=(K?10:9)*P,bh=(K?9:7)*P,bx=-bw/2,byy=-legH-bh+by;
 if(K&&d.id==='bride'){c.fillStyle=OUT;c.beginPath();c.moveTo(-bw/2-3,-1);c.lineTo(bw/2+3,-1);c.lineTo(bw/2-1,byy-1);c.lineTo(-bw/2+1,byy-1);c.fill();c.fillStyle=C('#e9e4dc');c.beginPath();c.moveTo(-bw/2-2,-2);c.lineTo(bw/2+2,-2);c.lineTo(bw/2-2,byy);c.lineTo(-bw/2+2,byy);c.fill();c.fillStyle=C('#c8c0b4');c.fillRect(bw/4,byy,bw/4-2,-byy-2)}
 else vbox(c,bx,byy,bw,bh,C(d.body));
 if(!K){c.fillStyle=C(shade(d.body,-0.25));c.fillRect(bx+P,byy+bh-2*P,bw-2*P,P)}// belt
 if(K&&d.id==='stitches'){c.fillStyle=C('#2a1810');c.fillRect(bx+P,byy+2*P,bw-2*P,P);c.fillStyle=C(d.acc);c.fillRect(bx+2*P,byy+4*P,P,3*P)}
 if(K&&d.id==='rotjaw'){c.fillStyle=C(shade(d.body,-0.3));for(let i=0;i<3;i++)c.fillRect(bx+P+i*3*P,byy+P,P,bh-2*P)}
 // arms
 let aS=mv?sw*P*2:0,aL=0;
 if(pose==='repair'){aS=Math.sin(t*14)*P*1.5;aL=P*2}
 if(pose==='attack'){aS=-P*4}
 const aw=(K?3:2.5)*P,ah=(K?7:6)*P,ay=byy+P;
 if(dir==='side'){vbox(c,-aw/2+aS*0.5+aL,ay,aw,ah,C(shade(d.body,-0.15)))}
 else{vbox(c,bx-aw+1,ay+aS*0.5,aw,ah,C(shade(d.body,-0.1)));vbox(c,bx+bw-1,ay-aS*0.5,aw,ah,C(shade(d.body,-0.2)))}
 // weapon / item
 if(K){c.save();const wx=dir==='side'?aS*0.5+aL+aw/2:bx+bw+aw/2,wy=ay+ah;c.translate(wx,wy);c.rotate(pose==='attack'?-1.2+(o.k||0)*2.4:0.5);
  if(d.id==='stitches'){vbox(c,-1,-2,3,10,C('#5a3a20'));vbox(c,-4,-14,9,12,C('#9aa0a8'))}
  else if(d.id==='bride'){vbox(c,-1,-2,2,14,C('#c8c0b0'));c.fillStyle=C('#a01020');c.fillRect(-2,-6,4,4)}
  else{vbox(c,-2,-2,4,6,C(d.skin));c.fillStyle=C('#e8e0b0');c.fillRect(-3,4,2,4);c.fillRect(1,4,2,4)}
  c.restore()}
 else if(e.item==='medkit'&&dir!=='up'){c.fillStyle=C('#eee');c.fillRect(bx-aw,ay+ah-2,6,5);c.fillStyle='#c00';c.fillRect(bx-aw+2,ay+ah-2,2,5)}
 // head + hood
 const hw=(K?9:8)*P,hh=(K?8:7)*P,hx=-hw/2,hy=byy-hh+P*(K&&d.id==='rotjaw'?3:1);
 vbox(c,hx,hy,hw,hh,C(d.hood));
 if(dir!=='up'){const fw=dir==='side'?hw*0.55:hw*0.66,fh=hh*0.55,fxp=dir==='side'?hx+hw-fw-P*0.5:hx+(hw-fw)/2,fyp=hy+hh*0.35;
  c.fillStyle=C(d.skin);c.fillRect(fxp,fyp,fw,fh);c.fillStyle=C(shade(d.skin,-0.25));c.fillRect(fxp,fyp,fw,P);
  if(!K&&d.hair){c.fillStyle=C(d.hair);c.fillRect(fxp,fyp,fw,P*0.8)}
  const ey=fyp+fh*0.45;c.fillStyle=K?(d.id==='bride'?'#000':'#ff2a20'):'#1a1010';
  if(dir==='side'){c.fillRect(fxp+fw-P*2,ey,P,P)}else{c.fillRect(fxp+P,ey,P,P);c.fillRect(fxp+fw-P*2,ey,P,P)}
  if(K&&d.id==='stitches'){c.fillStyle=C('#5a0a0a');c.fillRect(fxp,fyp+fh*0.75,fw,1);for(let i=0;i<fw;i+=3)c.fillRect(fxp+i,fyp+fh*0.65,1,4);c.fillRect(fxp+fw*0.5,fyp,1,fh)}
  if(K&&d.id==='rotjaw'){c.fillStyle=C('#3a0a0a');c.fillRect(fxp-P,fyp+fh*0.7,fw+P*2,P*3);c.fillStyle=C('#e8e0b0');for(let i=0;i<fw+P*2;i+=P*1.5){c.fillRect(fxp-P+i,fyp+fh*0.7,P*0.7,P);c.fillRect(fxp-P+i+P*0.6,fyp+fh*0.7+P*2,P*0.7,P)}}
  if(K&&d.id==='bride'){c.fillStyle='rgba(240,240,250,0.55)';c.fillRect(hx-P,hy,hw+2*P,hh*1.8)}
  if(pose==='down'||pose==='hooked'||pose==='hit'){c.fillStyle='#a0101a';c.fillRect(fxp+P,fyp+fh-P,P,P)}
 } else if(K&&d.id==='bride'){c.fillStyle='rgba(240,240,250,0.65)';c.fillRect(hx-P,hy,hw+2*P,hh*2.4)}
 c.fillStyle=C(shade(d.hood,0.25));c.fillRect(hx,hy,hw,P);// hood rim highlight
 if(K&&d.id==='rotjaw'){c.fillStyle=C(shade(d.hood,-0.2));c.fillRect(hx+P,hy-P*2,P*2,P*2);c.fillRect(hx+hw-P*3,hy-P*2,P*2,P*2)}
 c.restore();
}
function drawHeart(c,x,y,s,a){c.save();c.translate(x,y);c.scale(s,s);c.globalAlpha=a;c.fillStyle=OUT;c.fillRect(-6,-5,5,3);c.fillRect(1,-5,5,3);c.fillRect(-7,-3,14,4);c.fillRect(-5,1,10,2);c.fillRect(-3,3,6,2);c.fillRect(-1,5,2,1);
 c.fillStyle='#d01020';c.fillRect(-5,-4,3,2);c.fillRect(2,-4,3,2);c.fillRect(-6,-2,12,3);c.fillRect(-4,1,8,1);c.fillRect(-2,2,4,2);c.fillStyle='#ff8080';c.fillRect(-4,-3,2,1);c.restore()}
/* ---- tiles ---- */
const PAL={hall:{f1:'#5a3e2a',f2:'#4e3624',wt:'#2a1a14',wf:'#5a2a2a',ws:'#4a2020',base:'#20100c'},
 bed:{f1:'#6a4a32',f2:'#5e4028',wt:'#22182a',wf:'#3a3060',ws:'#2e2650',base:'#140c18'},
 lib:{f1:'#2e3a2a',f2:'#283224',wt:'#1a1e14',wf:'#2a4a32',ws:'#203a28',base:'#0c120c'},
 attic:{f1:'#4a3a2a',f2:'#403222',wt:'#1e160e',wf:'#5a4a36',ws:'#4a3a28',base:'#120c08'},
 yard:{g1:'#26401e',g2:'#2c4a22',wt:'#30402a'},village:{g1:'#3a4020',g2:'#343a1c',f1:'#4a3a2a',f2:'#3e3022',wt:'#2a1e14',wf:'#6a5a44',ws:'#5a4a36',base:'#1a120a'},
 church:{f1:'#3a3434',f2:'#322c2c',wt:'#1a1616',wf:'#4a4448',ws:'#3a3438',base:'#100c0c'},
 deck:{f1:'#6a5236',f2:'#5e482e',wt:'#2a2018',wf:'#4a3626',ws:'#3a2a1e',base:'#100a06'},
 loft:{f1:'#5a4630',f2:'#4e3c28',wt:'#1e160e',wf:'#5a4a36',ws:'#4a3a28',base:'#120c08'},
 hold:{f1:'#3a3430',f2:'#322c28',wt:'#141210',wf:'#3a3e44',ws:'#2e3238',base:'#0a0a0a'},
 cabin:{f1:'#4a3626',f2:'#3e2e20',wt:'#1a140e',wf:'#3a4a52',ws:'#2e3c44',base:'#0c0a08'}};
function hash2(x,y){let h=x*374761393+y*668265263;h=(h^(h>>>13))*1274126177;return((h^(h>>>16))>>>0)/4294967296}
function drawFloorLayer(M,f){
 const F=M.floors[f],cv=document.createElement('canvas');cv.width=FW*T;cv.height=FH*T;const c=cv.getContext('2d');const p=PAL[F.pal]||PAL.hall;
 for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){const t=F.g[idx(x,y)],X=x*T,Y=y*T,h=hash2(x,y);
  if(t===TI.GRASS||((t===TI.TREE||t===TI.FENCE||t===TI.HOUSE||t===TI.GATE)&&F.outdoor&&F.pal!=='deck')){c.fillStyle=h<0.5?p.g1||'#26401e':p.g2||'#2c4a22';c.fillRect(X,Y,T,T);for(let i=0;i<6;i++){const a=hash2(x*7+i,y*13+i);c.fillStyle=a<0.5?'#3a5a2a':'#1c3016';c.fillRect(X+((a*997)%1)*T|0,Y+((a*571)%1)*T|0,2,a<0.2?4:2)}if(h>0.93){c.fillStyle='#6a6a7a';c.fillRect(X+10,Y+12,4,3)}if(h<0.04){c.fillStyle='#c8b040';c.fillRect(X+8,Y+8,2,2);c.fillRect(X+20,Y+18,2,2)}}
  else if(t===TI.VOID){c.fillStyle='#050307';c.fillRect(X,Y,T,T)}
  else if(t===TI.ROAD){c.fillStyle=h<0.5?'#4a3a26':'#44341f';c.fillRect(X,Y,T,T);c.fillStyle='rgba(0,0,0,0.2)';c.fillRect(X+(h*24|0),Y+(h*97%24|0),6,3);c.fillStyle='#5a4a30';c.fillRect(X+((h*53)%28|0),Y+((h*31)%28|0),3,2)}
  else if(t===TI.FIELD){c.fillStyle='#3a2a18';c.fillRect(X,Y,T,T);for(let r=0;r<4;r++){c.fillStyle='#2a1c10';c.fillRect(X,Y+r*8+6,T,2);for(let i=0;i<4;i++){c.fillStyle=(i+r)%2?'#6a7a2a':'#8a8a30';c.fillRect(X+i*8+2,Y+r*8,3,6)}}}
  else if(t===TI.WATER){c.fillStyle='#0e2236';c.fillRect(X,Y,T,T);c.fillStyle='#1a3a56';c.fillRect(X+(h*20|0),Y+(h*28|0),8,2)}
  else{const deck=F.pal==='deck';const pl=p.f1||'#5a3e2a',p2=p.f2||'#4e3624';
   if(F.pal==='hall'){c.fillStyle=(x+y)%2?'#3e3a36':'#2a2624';c.fillRect(X,Y,T,T);c.fillStyle='rgba(255,255,255,0.04)';c.fillRect(X,Y,T,2)}
   else{for(let r=0;r<4;r++){c.fillStyle=(r+(x%2))%2?pl:p2;c.fillRect(X,Y+r*8,T,8);c.fillStyle='rgba(0,0,0,0.25)';c.fillRect(X,Y+r*8+7,T,1);c.fillRect(X+((x*3+r*11)%4)*8,Y+r*8,1,8)}}
   if(h>0.9&&!deck){c.fillStyle='rgba(0,0,0,0.25)';c.fillRect(X+6,Y+10,10,6)}
  }
  if(t===TI.STAIR){const s=M.stairAt[f].get(idx(x,y));const up=s&&(s.to.f>f);c.fillStyle='#20140e';c.fillRect(X,Y,T,T);for(let i=0;i<5;i++){c.fillStyle=shade('#7a5a3a',up?(i*0.08-0.2):(-i*0.1));c.fillRect(X+2,Y+2+i*6,T-4,5)}c.fillStyle='#ffd070';c.font='bold 14px monospace';c.textAlign='center';c.fillText(up?'▲':'▼',X+T/2,Y+T/2+5)}
 }
 for(const r of F.rugs){c.fillStyle=OUT;c.fillRect(r.x*T+6,r.y*T+6,r.w*T-12,r.h*T-12);c.fillStyle=r.c;c.fillRect(r.x*T+8,r.y*T+8,r.w*T-16,r.h*T-16);c.strokeStyle='#c8a050';c.lineWidth=2;c.strokeRect(r.x*T+13,r.y*T+13,r.w*T-26,r.h*T-26)}
 return cv;
}
const WH=26; // wall height in px (front face)
function drawWallTile(c,M,f,x,y,t){
 const F=M.floors[f],p=PAL[F.pal]||PAL.hall,X=x*T,Y=y*T,below=y+1<FH?F.g[idx(x,y+1)]:TI.WALL,h=hash2(x,y);
 if(t===TI.WALL){const fb=below!==TI.WALL;
  c.fillStyle=p.wt;c.fillRect(X,Y-WH,T,T);c.fillStyle=shade(p.wt,0.22);c.fillRect(X,Y-WH,T,2);c.fillStyle=shade(p.wt,-0.35);c.fillRect(X+T-3,Y-WH,3,T);
  if(fb){c.fillStyle=p.wf;c.fillRect(X,Y+T-WH,T,WH);c.fillStyle=p.ws;for(let i=2;i<T;i+=8)c.fillRect(X+i,Y+T-WH,3,WH-5);c.fillStyle=p.base;c.fillRect(X,Y+T-5,T,5);c.fillStyle=OUT;c.fillRect(X,Y+T-WH-1,T,1);
   if(h>0.85&&F.pal!=='deck'){c.fillStyle='#3a2410';c.fillRect(X+9,Y+T-WH+5,14,11);c.fillStyle=shade(p.wf,-0.5);c.fillRect(X+11,Y+T-WH+7,10,7)}}
  return}
 if(t===TI.GAP){// broken wall with a squeeze crack
  c.fillStyle=p.wt||'#2a1a14';c.fillRect(X,Y-WH,10,T);c.fillRect(X+T-10,Y-WH,10,T);c.fillStyle=p.wf||'#5a2a2a';c.fillRect(X,Y+T-WH,10,WH);c.fillRect(X+T-10,Y+T-WH,10,WH);
  c.fillStyle='#1a0e08';c.fillRect(X+10,Y+T-6,T-20,6);c.fillStyle='#6a5a4a';c.fillRect(X+8,Y+T-4,4,3);c.fillRect(X+T-12,Y+T-3,5,2);c.fillStyle=OUT;c.fillRect(X+9,Y-WH,1,T+WH-6);c.fillRect(X+T-10,Y-WH,1,T+WH-6);return}
 if(t===TI.TREE){c.fillStyle='#2a1a10';c.fillRect(X+12,Y+4,8,T-6);shadow(c,X+16,Y+T-2,14,5,0.4);
  const g=['#1e3a1a','#2a4a22','#36582a'];for(let i=0;i<3;i++){const s=26-i*6;vbox(c,X+16-s/2+(h-0.5)*4,Y-18-i*10,s,s*0.75,g[i])}return}
 if(t===TI.FENCE||t===TI.GATE){if(F.pal==='deck'){vbox(c,X,Y-8,T,T*0.5+8,'#5a4030');return}c.fillStyle='#3a2a1e';c.fillRect(X,Y+6,T,4);c.fillRect(X,Y+16,T,4);for(let i=2;i<T;i+=10){vbox(c,X+i,Y-6,5,28,t===TI.GATE?'#6a6a72':'#4a3424')}return}
 if(t===TI.HOUSE){const fb=below!==TI.HOUSE;c.fillStyle='#2a1c1c';c.fillRect(X,Y-40,T,T);c.fillStyle='#3a2222';c.fillRect(X,Y-40,T,2);
  if(fb){c.fillStyle='#5a3a30';c.fillRect(X,Y+T-48,T,48);c.fillStyle='#4a2e26';for(let r=0;r<6;r++)c.fillRect(X+(r%2)*8,Y+T-48+r*8,T,1);if(x%3===1){c.fillStyle=OUT;c.fillRect(X+7,Y+T-40,18,22);c.fillStyle=(h>0.5)?'#e8b040':'#3a4a5a';c.fillRect(X+9,Y+T-38,14,18);c.fillStyle=OUT;c.fillRect(X+15,Y+T-38,2,18)}}return}
 if(t===TI.WATER)return;
}
function drawGen(c,g,t){const X=g.x,Y=g.y+10;shadow(c,X,Y,16,5);vbox(c,X-14,Y-24,28,22,g.done?'#4a5a3a':'#4a4a52');vbox(c,X-10,Y-32,8,10,'#5a5a62');vbox(c,X+2,Y-30,8,8,'#5a5a62');
 const on=g.done||(g.users>0&&Math.sin(t*30)>0);c.fillStyle=g.done?'#80ff80':g.users?'#ffd040':'#a02020';c.fillRect(X+6,Y-20,4,4);if(on&&g.done){c.fillStyle='rgba(255,240,150,0.15)';c.beginPath();c.arc(X,Y-14,30,0,6.283);c.fill()}
 c.fillStyle='#2a2a30';c.fillRect(X-10,Y-14,12,8);for(let i=0;i<3;i++){c.fillStyle='#777';c.fillRect(X-9+i*4,Y-13,2,6)}
 if(!g.done&&g.p>0){c.fillStyle=OUT;c.fillRect(X-15,Y-40,30,5);c.fillStyle=g.regress?'#e04030':'#f0c040';c.fillRect(X-14,Y-39,28*g.p,3)}}
function drawHook(c,h,t){const X=h.x,Y=h.y+8;shadow(c,X,Y,10,4);vbox(c,X-3,Y-58,6,58,'#3a2a20');vbox(c,X-3,Y-58,18,5,'#3a2a20');c.strokeStyle='#999';c.lineWidth=2;c.beginPath();c.moveTo(X+12,Y-53);c.lineTo(X+12,Y-42);c.arc(X+8,Y-42,4,0,Math.PI);c.stroke();
 c.fillStyle='#5a0a0a';c.fillRect(X-2,Y-6,8,3);if(h.ghost>0){c.fillStyle='rgba(0,0,0,'+Math.min(1,h.ghost)+')';for(let i=0;i<6;i++){const a=t*3+i;c.fillRect(X+Math.sin(a)*10-2,Y-60+i*10-((1.5-h.ghost)*30),4,14)}}}
function drawFurn(c,fu,t){const up=fu.state==='up';
 if(fu.state==='broken'){const X=cc(fu.fx),Y=cc(fu.fy);c.fillStyle='#4a2e1a';for(let i=0;i<6;i++)c.fillRect(X-12+hash2(fu.id,i)*24,Y-4+hash2(i,fu.id)*12,6,2);return}
 if(up){const X=fu.x,Y=fu.y+12;shadow(c,X,Y,14,4);if(fu.kind==='ward'){vbox(c,X-13,Y-50,26,50,'#5a3a22');c.fillStyle=OUT;c.fillRect(X,Y-46,1,42);c.fillStyle='#c8a050';c.fillRect(X-4,Y-28,2,4);c.fillRect(X+3,Y-28,2,4)}else{vbox(c,X-11,Y-22,22,22,'#6a4a2a');c.fillStyle=OUT;c.fillRect(X-9,Y-12,18,1);c.fillStyle='#c8a050';c.fillRect(X-2,Y-17,4,2);c.fillStyle='#e8d090';c.fillRect(X-4,Y-30,8,8);c.fillStyle='#ffe0a0';c.fillRect(X-2,Y-34,4,4)}return}
 // fallen: tween from original tile into the doorway
 const k=Math.min(1,fu.anim),ox=cc(fu.tx),oy=cc(fu.ty),X=lerp(ox,cc(fu.fx),k),Y=lerp(oy,cc(fu.fy),k)+10;c.save();c.translate(X,Y);c.rotate((1-k)*-0.9);shadow(c,0,2,18,6);
 if(fu.kind==='ward'){vbox(c,-16,-14,32,16,'#5a3a22');c.fillStyle=OUT;c.fillRect(-14,-7,28,1)}else{vbox(c,-13,-12,26,13,'#6a4a2a')}c.restore()}
function drawDeco(c,d,pal){const X=cc(d.x),Y=cc(d.y)+12;shadow(c,X,Y,14,4);switch(d.k){
 case'table':vbox(c,X-14,Y-18,28,12,'#6a4428');c.fillStyle=OUT;c.fillRect(X-12,Y-6,3,6);c.fillRect(X+9,Y-6,3,6);c.fillStyle='#e8e0c0';c.fillRect(X-4,Y-24,3,6);c.fillStyle='#ffd060';c.fillRect(X-4,Y-27,3,3);break;
 case'bed':vbox(c,X-14,Y-24,28,24,'#5a3a2a');vbox(c,X-12,Y-20,24,10,'#d8d0c0');c.fillStyle='#6a1a1a';c.fillRect(X-12,Y-12,24,8);break;
 case'crib':vbox(c,X-12,Y-20,24,20,'#7a6a5a');c.fillStyle=OUT;for(let i=-10;i<12;i+=4)c.fillRect(X+i,Y-18,1,14);break;
 case'shelf':vbox(c,X-14,Y-44,28,44,'#3a2414');for(let r=0;r<4;r++)for(let i=0;i<6;i++){c.fillStyle=['#7a2020','#204a7a','#4a6a20','#8a7a30'][(i+r+d.x)%4];c.fillRect(X-12+i*4,Y-42+r*10,3,8)}break;
 case'globe':vbox(c,X-3,Y-10,6,10,'#4a3020');c.fillStyle=OUT;c.beginPath();c.arc(X,Y-18,9,0,6.3);c.fill();c.fillStyle='#3a6a8a';c.beginPath();c.arc(X,Y-18,8,0,6.3);c.fill();c.fillStyle='#5a8a3a';c.fillRect(X-4,Y-22,5,4);break;
 case'clock':vbox(c,X-7,Y-46,14,46,'#4a2a18');c.fillStyle='#e8d8b0';c.beginPath();c.arc(X,Y-36,5,0,6.3);c.fill();c.fillStyle=OUT;c.fillRect(X,Y-40,1,4);break;
 case'sofa':vbox(c,X-15,Y-18,30,18,'#5a1a2a');vbox(c,X-15,Y-26,30,8,'#4a1222');break;
 case'barrel':vbox(c,X-10,Y-24,20,24,'#6a4424');c.fillStyle='#333';c.fillRect(X-10,Y-19,20,2);c.fillRect(X-10,Y-7,20,2);break;
 case'dummy':vbox(c,X-2,Y-8,4,8,'#4a3a2a');vbox(c,X-8,Y-30,16,22,'#c8b090');vbox(c,X-5,Y-40,10,10,'#c8b090');break;
 case'hay':vbox(c,X-15,Y-20,30,20,'#c8a040');c.fillStyle='#a88030';for(let i=0;i<5;i++)c.fillRect(X-13+i*6,Y-18,2,16);break;
 case'pew':vbox(c,X-15,Y-14,30,10,'#5a3a22');vbox(c,X-15,Y-24,30,8,'#4a2e1a');break;
 case'altar':vbox(c,X-15,Y-22,30,22,'#d8d0c0');c.fillStyle='#8a1010';c.fillRect(X-15,Y-22,30,4);c.fillStyle='#ffd060';c.fillRect(X-2,Y-34,4,12);c.fillRect(X-6,Y-30,12,3);break;
 case'well':vbox(c,X-14,Y-16,28,16,'#6a6a72');c.fillStyle='#0a0a14';c.fillRect(X-10,Y-14,20,6);vbox(c,X-14,Y-40,3,24,'#4a3020');vbox(c,X+11,Y-40,3,24,'#4a3020');vbox(c,X-16,Y-44,32,5,'#5a2a1a');break;
 case'mast':vbox(c,X-6,Y-90,12,90,'#5a3a22');vbox(c,X-30,Y-74,60,4,'#4a2e1a');c.fillStyle='rgba(220,210,190,0.85)';c.fillRect(X-26,Y-70,52,30);c.fillStyle='rgba(120,20,20,0.6)';c.fillRect(X-4,Y-64,8,18);break;
 case'lifeboat':vbox(c,X-16,Y-14,32,14,'#8a6a40');c.fillStyle='#5a3a20';c.fillRect(X-14,Y-12,28,6);break;
 case'engine':vbox(c,X-15,Y-34,30,34,'#4a4e56');c.fillStyle='#d04020';c.fillRect(X-4,Y-26,8,8);c.fillStyle='#2a2e34';c.fillRect(X-12,Y-14,24,3);vbox(c,X+6,Y-50,6,18,'#3a3e44');break;
 default:vbox(c,X-13,Y-24,26,24,'#5a4630');c.fillStyle=OUT;c.fillRect(X-13,Y-13,26,1);c.fillRect(X,Y-24,1,24);}}
function drawItem(c,it,t){const X=it.x,Y=it.y+6+Math.sin(t*3+it.x)*2;shadow(c,it.x,it.y+8,7,3,0.3);if(it.kind==='medkit'){vbox(c,X-7,Y-12,14,10,'#e8e8e0');c.fillStyle='#d01010';c.fillRect(X-1,Y-11,3,8);c.fillRect(X-4,Y-8,9,2)}else{vbox(c,X-8,Y-10,16,9,'#b02a1a');c.fillStyle='#999';c.fillRect(X-3,Y-13,6,3)}}
function drawGate(c,g,t){for(const[x,y]of g.tiles){const X=x*T,Y=y*T;c.fillStyle=g.open?'#1a3a1a':'#3a1a1a';c.fillRect(X,Y,T,T);
  if(!g.open){for(let i=0;i<4;i++)vbox(c,X+3+i*7,Y-20,4,T+18,'#7a7a82')}else{c.fillStyle='rgba(160,255,160,0.25)';c.fillRect(X,Y,T,T)}}
 const lx=g.x,ly=g.y-34;vbox(c,lx-6,ly,12,18,'#4a4a52');c.fillStyle=WP.G&&WP.G.powered?(g.open?'#40ff40':'#ffd040'):'#802020';c.fillRect(lx-2,ly+3,4,4);
 if(g.prog>0&&!g.open){c.fillStyle=OUT;c.fillRect(lx-14,ly-8,28,5);c.fillStyle='#80ff80';c.fillRect(lx-13,ly-7,26*g.prog,3)}}
