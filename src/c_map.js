/* ===== c_map: per-floor tile grids, map builders, pathfinding (BFS + stair edges), line of sight ===== */
const TI={FLOOR:0,WALL:1,GAP:2,STAIR:3,GRASS:4,FENCE:5,TREE:6,HOUSE:7,GATE:8,DECK:9,WATER:10,FIELD:11,VOID:12,ROAD:13};
const SOLID=new Uint8Array(16);[1,5,6,7,8,10,12].forEach(t=>SOLID[t]=1);
const OPAQUE=new Uint8Array(16);[1,2,6,7,12].forEach(t=>OPAQUE[t]=1);
const idx=(x,y)=>y*FW+x;

function mkFloor(name,fill,pal,outdoor){return{name,g:new Uint8Array(FW*FH).fill(fill),blk:new Uint8Array(FW*FH),pal,outdoor:!!outdoor,deco:[],rugs:[]}}
function border(F,t){for(let x=0;x<FW;x++){F.g[idx(x,0)]=t;F.g[idx(x,FH-1)]=t}for(let y=0;y<FH;y++){F.g[idx(0,y)]=t;F.g[idx(FW-1,y)]=t}}

/* House-like floor: 4x3 room grid, doors (1 wide), survivor-only gaps, optional open halls */
function roomFloor(F,seedF,openP,wallT){
 wallT=wallT||TI.WALL;
 const xs=[0,10,20,30,FW-1], ys=[0,10,20,FH-1];
 for(const x of xs)for(let y=0;y<FH;y++)F.g[idx(x,y)]=wallT;
 for(const y of ys)for(let x=0;x<FW;x++)F.g[idx(x,y)]=wallT;
 F.doors=[];F.rooms=[];
 for(let r=0;r<3;r++)for(let c=0;c<4;c++)F.rooms.push({x0:xs[c]+1,x1:xs[c+1]-1,y0:ys[r]+1,y1:ys[r+1]-1});
 let opened=0;
 const seg=(cells)=>{ // cells: list of [x,y] of an internal wall segment (excluding posts)
  if(opened<2&&rnd()<openP){opened++;for(const[x,y]of cells)F.g[idx(x,y)]=F.floorT;return}
  const di=ri(1,cells.length-2),[dx,dy]=cells[di];F.g[idx(dx,dy)]=F.floorT;F.doors.push({x:dx,y:dy,vert:cells[0][0]===cells[1][0]});
  if(rnd()<0.5){let gi=ri(1,cells.length-2),n=0;while(Math.abs(gi-di)<2&&n++<20)gi=ri(1,cells.length-2);if(Math.abs(gi-di)>=2){const[gx,gy]=cells[gi];F.g[idx(gx,gy)]=TI.GAP}}
 };
 for(const x of [10,20,30])for(let r=0;r<3;r++){const c=[];for(let y=ys[r]+1;y<ys[r+1];y++)c.push([x,y]);seg(c)}
 for(const y of [10,20])for(let k=0;k<4;k++){const c=[];for(let x=xs[k]+1;x<xs[k+1];x++)c.push([x,y]);seg(c)}
}
function passK(F,x,y,kind){if(x<0||y<0||x>=FW||y>=FH)return false;const i=idx(x,y),t=F.g[i];if(SOLID[t])return false;if(t===TI.GAP&&kind!=='s')return false;if(F.blk[i]===1)return false;return true}
function floodCount(F,kind,sx,sy){const seen=new Uint8Array(FW*FH),q=[idx(sx,sy)];seen[q[0]]=1;let n=0;while(q.length){const i=q.pop();n++;const x=i%FW,y=(i/FW)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(passK(F,nx,ny,kind)){const j=idx(nx,ny);if(!seen[j]){seen[j]=1;q.push(j)}}}}return n}
function countPass(F,kind){let n=0;for(let y=0;y<FH;y++)for(let x=0;x<FW;x++)if(passK(F,x,y,kind))n++;return n}
function firstPass(F){for(let y=1;y<FH;y++)for(let x=1;x<FW;x++)if(passK(F,x,y,'k'))return[x,y]}
function stillConnected(F){const p=firstPass(F);return floodCount(F,'k',p[0],p[1])===countPass(F,'k')&&floodCount(F,'s',p[0],p[1])===countPass(F,'s')}

function buildMap(kind){
 srand(kind==='mansion'?1337:kind==='village'?4242:9090);
 const M={kind,floors:[],stairs:[],gens:[],hooks:[],furn:[],items:[],gates:[],reserved:new Set(),spawnK:null,spawnS:[]};
 const res=(f,x,y)=>M.reserved.add(f*10000+idx(x,y)), isRes=(f,x,y)=>M.reserved.has(f*10000+idx(x,y));
 const link=(fa,xa,ya,ady,fb,xb,yb,bdy,la,lb)=>{
  const A={f:fa,x:xa,y:ya,ax:xa,ay:ya+ady,label:la},B={f:fb,x:xb,y:yb,ax:xb,ay:yb+bdy,label:lb};A.to=B;B.to=A;
  M.stairs.push(A,B);for(const s of[A,B]){const F=M.floors[s.f];F.g[idx(s.x,s.y)]=TI.STAIR;const at=F.g[idx(s.ax,s.ay)];if(SOLID[at]||at===TI.GAP||at===TI.STAIR)F.g[idx(s.ax,s.ay)]=F.outdoor&&F.pal!=='deck'?TI.GRASS:(F.floorT||TI.FLOOR);res(s.f,s.x,s.y);res(s.f,s.ax,s.ay)}
 };
 const yard=(F)=>{border(F,TI.FENCE)};
 if(kind==='mansion'){
  M.name='Особняк';
  const Y=mkFloor('Двор',TI.GRASS,'yard',true);yard(Y);M.floors.push(Y);
  for(let y=1;y<=11;y++)for(let x=11;x<=28;x++)Y.g[idx(x,y)]=TI.HOUSE;
  const names=['1 этаж · Холл','2 этаж · Спальни','3 этаж · Библиотека','Чердак'],pals=['hall','bed','lib','attic'];
  for(let f=1;f<=4;f++){const F=mkFloor(names[f-1],TI.FLOOR,pals[f-1]);F.floorT=TI.FLOOR;roomFloor(F,f,0.22);M.floors.push(F)}
  // entrances (yard <-> 1st floor) and two staircases between each pair of floors
  link(0,15,12,1,1,15,28,-1,'В дом','Во двор');
  link(0,24,12,1,1,25,28,-1,'В дом','Во двор');
  for(let f=1;f<=3;f++){
   link(f,1+2*(f-1),1,1,f+1,2+2*(f-1),1,1,'Вверх','Вниз');
   link(f,38-2*(f-1),28,-1,f+1,37-2*(f-1),28,-1,'Вверх','Вниз');
  }
  M.gates.push({f:0,tiles:[[0,14],[0,15]],x:cc(1),y:15*T,side:-1,prog:0,open:false,name:'Западные ворота'});
  M.gates.push({f:0,tiles:[[FW-1,14],[FW-1,15]],x:cc(FW-2),y:15*T,side:1,prog:0,open:false,name:'Восточные ворота'});
  for(const g of M.gates)for(const[x,y]of g.tiles){Y.g[idx(x,y)]=TI.GATE;res(0,x+(g.side<0?1:-1),y);res(0,x+(g.side<0?2:-2),y)}
  M.genSpots=[[0,8,21],[1,5,15],[2,25,5],[3,15,24],[4,34,15]];
  M.hookSpots=[[0,5,6],[0,34,6],[0,7,26],[0,32,26],[0,20,22],[1,34,5],[2,6,24],[3,24,14],[4,15,5]];
  M.spawnK={f:0,x:20,y:16};
  M.spawnS=[[0,3,27],[0,36,27],[2,15,15],[3,35,24],[4,5,24],[1,15,5]];
  // yard trees & hedges
  for(let n=0;n<60;n++){const x=ri(2,FW-3),y=ri(14,FH-3);if(Math.abs(x-20)<3&&y<20)continue;if(Y.g[idx(x,y)]===TI.GRASS&&!isRes(0,x,y))Y.g[idx(x,y)]=TI.TREE}
  for(let n=0;n<14;n++){const x=ri(2,10)+(rnd()<0.5?0:27),y=ri(2,12);if(Y.g[idx(x,y)]===TI.GRASS&&!isRes(0,x,y))Y.g[idx(x,y)]=TI.TREE}
 } else { buildAscii(M,kind,res,isRes,link) }
 for(const[f,x,y]of[...M.genSpots,...M.hookSpots,...M.spawnS,[M.spawnK.f,M.spawnK.x,M.spawnK.y]]){const F=M.floors[f];if(SOLID[F.g[idx(x,y)]]||F.g[idx(x,y)]===TI.GAP)F.g[idx(x,y)]=F.outdoor?TI.GRASS:F.floorT;res(f,x,y);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(passK(F,x+dx,y+dy,'k'))res(f,x+dx,y+dy)}
 // generators & hooks occupy their tile
 M.gens=M.genSpots.map(([f,x,y],i)=>({id:i,f,x:cc(x),y:cc(y),tx:x,ty:y,p:0,done:false,regress:false,boost:0,users:0,noise:0}));
 M.hooks=M.hookSpots.map(([f,x,y],i)=>({id:i,f,x:cc(x),y:cc(y),tx:x,ty:y,victim:null}));
 for(const o of[...M.gens,...M.hooks])M.floors[o.f].blk[idx(o.tx,o.ty)]=1;
 placeAsciiFurn(M,res,isRes);
 // furniture next to doors, falls into the doorway
 M.floors.forEach((F,f)=>{if(!F.doors)return;for(const d of F.doors){if(rnd()>0.6)continue;
   const cands=d.vert?[[d.x-1,d.y-1],[d.x-1,d.y+1],[d.x+1,d.y-1],[d.x+1,d.y+1]]:[[d.x-1,d.y-1],[d.x+1,d.y-1],[d.x-1,d.y+1],[d.x+1,d.y+1]];
   shuffle(cands);for(const[cx,cy]of cands){const wx=d.vert?d.x:cx,wy=d.vert?cy:d.y;
    if(!passK(F,cx,cy,'k')||isRes(f,cx,cy)||isRes(f,d.x,d.y)||F.g[idx(wx,wy)]!==TI.WALL)continue;
    F.blk[idx(cx,cy)]=1;if(!stillConnected(F)){F.blk[idx(cx,cy)]=0;continue}
    M.furn.push({id:M.furn.length,f,tx:cx,ty:cy,fx:d.x,fy:d.y,x:cc(cx),y:cc(cy),kind:rnd()<0.5?'stand':'ward',state:'up',anim:0,breakP:0});res(f,cx,cy);break}}});
 // decorations (blocking) in rooms
 M.floors.forEach((F,f)=>{if(!F.rooms)return;for(const R of F.rooms){const n=ri(1,3);for(let k=0;k<n;k++){const x=ri(R.x0+1,R.x1-1),y=ri(R.y0+1,R.y1-1);if(!passK(F,x,y,'k')||isRes(f,x,y)||F.g[idx(x,y)]===TI.STAIR)continue;
   let near=false;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const t=F.g[idx(x+dx,y+dy)];if(t===TI.STAIR||t===TI.GAP||F.blk[idx(x+dx,y+dy)])near=true}if(near)continue;
   F.blk[idx(x,y)]=1;if(!stillConnected(F)){F.blk[idx(x,y)]=0;continue}F.deco.push({x,y,k:pick(F.pal==='attic'?['crate','crate','dummy']:F.pal==='lib'?['shelf','table','globe']:F.pal==='bed'?['bed','table','crib']:F.pal==='deck'?['crate','barrel']:['table','clock','sofa','barrel'])});res(f,x,y)}
   if(rnd()<0.6)F.rugs.push({x:ri(R.x0+1,R.x1-4),y:ri(R.y0+1,R.y1-3),w:3,h:2,c:pick(['#5a1e22','#2a3a5a','#4a3a1a'])})}});
 // items
 if(!M.itemsFixed){const itemKinds=['medkit','medkit','toolbox','medkit','toolbox','medkit','medkit','toolbox'];
 for(let n=0,tries=0;n<itemKinds.length&&tries<500;tries++){const f=ri(0,M.floors.length-1),F=M.floors[f],x=ri(1,FW-2),y=ri(1,FH-2);if(!passK(F,x,y,'k')||isRes(f,x,y)||F.g[idx(x,y)]===TI.STAIR)continue;M.items.push({f,x:cc(x),y:cc(y),kind:itemKinds[n],taken:false});n++;res(f,x,y)}}
 // sanity: every floor fully connected
 if(kind==='mansion')M.floors.forEach((F,f)=>{if(!stillConnected(F))WP.dbg.log.push('map '+kind+' floor '+f+' disconnected')});
 for(const st of M.stairs){if(!passK(M.floors[st.f],st.ax,st.ay,'k'))WP.dbg.log.push('stair arrival blocked '+kind+' f'+st.f+' '+st.ax+','+st.ay)}
 M.stairAt=M.floors.map(()=>new Map());for(const s of M.stairs)M.stairAt[s.f].set(idx(s.x,s.y),s);
 M.N=M.floors.length*FW*FH;M.prev=new Int32Array(M.N);M.stamp=new Uint32Array(M.N);M.depth=new Uint16Array(M.N);M.st=1;M.q=new Int32Array(M.N);
 globalCheck(M);
M.prev=new Int32Array(M.N);M.stamp=new Uint32Array(M.N);M.depth=new Uint16Array(M.N);M.st=1;M.q=new Int32Array(M.N);
 return M;
}
/* ---- world queries (current map in G.M) ---- */
function tileAt(M,f,x,y){const tx=tc(x),ty=tc(y);if(tx<0||ty<0||tx>=FW||ty>=FH)return TI.WALL;return M.floors[f].g[idx(tx,ty)]}
function solidAt(M,f,tx,ty,kind){if(tx<0||ty<0||tx>=FW||ty>=FH)return true;const F=M.floors[f],i=idx(tx,ty),t=F.g[i];if(SOLID[t])return true;if(t===TI.GAP&&kind!=='s')return true;return F.blk[i]>0}
function circleFree(M,f,x,y,r,kind){const x0=tc(x-r),x1=tc(x+r),y0=tc(y-r),y1=tc(y+r);for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){if(!solidAt(M,f,tx,ty,kind))continue;const nx=clamp(x,tx*T,tx*T+T),ny=clamp(y,ty*T,ty*T+T);if((x-nx)*(x-nx)+(y-ny)*(y-ny)<r*r-0.01)return false}return true}
function los(M,f,ax,ay,bx,by){const d=Math.hypot(bx-ax,by-ay),n=Math.ceil(d/8),F=M.floors[f];for(let i=1;i<n;i++){const x=ax+(bx-ax)*i/n,y=ay+(by-ay)*i/n,t=F.g[idx(tc(x),tc(y))];if(OPAQUE[t])return false}return true}
/* BFS over (floor,tile) nodes with stair edges. kind 's' survivor (gaps ok) / 'k' killer. fallen furniture is passable (vault/break). */
function bfs(M,kind,f,tx,ty,goal,maxD,block){
 M.st++;if(M.st>4e9){M.stamp.fill(0);M.st=1}
 const st=M.st,FF=FW*FH;let qh=0,qt=0;const s=f*FF+idx(tx,ty);M.q[qt++]=s;M.stamp[s]=st;M.prev[s]=-1;M.depth[s]=0;
 while(qh<qt){const n=M.q[qh++],nf=(n/FF)|0,r=n%FF,x=r%FW,y=(r/FW)|0;
  if(goal&&goal(nf,x,y,n))return n;
  if(maxD&&M.depth[n]>=maxD)continue;
  const F=M.floors[nf];
  for(let k=0;k<4;k++){const nx=x+(k===0?1:k===1?-1:0),ny=y+(k===2?1:k===3?-1:0);if(nx<0||ny<0||nx>=FW||ny>=FH)continue;const i=idx(nx,ny),t=F.g[i];
   if(SOLID[t]||F.blk[i]===1||(t===TI.GAP&&kind!=='s'))continue;if(block&&block(nf,nx,ny))continue;const m=nf*FF+i;if(M.stamp[m]===st)continue;M.stamp[m]=st;M.prev[m]=n;M.depth[m]=M.depth[n]+1;M.q[qt++]=m}
  if(F.g[r]===TI.STAIR){const sd=M.stairAt[nf].get(r);if(sd){const m=sd.to.f*FF+idx(sd.to.ax,sd.to.ay);if(M.stamp[m]!==st){M.stamp[m]=st;M.prev[m]=n;M.depth[m]=M.depth[n]+1;M.q[qt++]=m}}}
 }
 M.qt=qt;return -1;
}
function pathTo(M,n){const p=[];while(n>=0){p.push(n);n=M.prev[n]}return p.reverse()}
function nodeF(n){return(n/(FW*FH))|0}
function nodeXY(n){const r=n%(FW*FH);return[r%FW,(r/FW)|0]}

const ACH={'=':TI.ROAD,'#':TI.WALL,'.':TI.FLOOR,',':TI.GRASS,':':TI.FIELD,'~':TI.WATER,'f':TI.FENCE,'T':TI.TREE,'_':TI.VOID,'g':TI.GAP,'G':TI.GATE};
const ADECO={b:'bed',t:'table',c:'crate',x:'barrel',h:'hay',p:'pew',a:'altar',w:'well',m:'mast',l:'lifeboat',r:'engine',o:'shelf'};
function buildAscii(M,kind,res,isRes,link){
 const defs=ASCII_MAPS[kind];M.name=kind==='village'?'Деревня':'Корабль';M.genMul=kind==='village'?1.5:1.6;M.genSpots=[];M.hookSpots=[];M.spawnS=[];M.itemsFixed=true;const stairs={},furn=[],gates=[];
 defs.forEach((d,f)=>{const F=mkFloor(d.name,TI.FLOOR,d.pal,d.outdoor);F.floorT=d.pal==='deck'?TI.DECK:TI.FLOOR;M.floors.push(F);
  for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){const ch=d.rows[y][x];if(ACH[ch]!=null){F.g[idx(x,y)]=ACH[ch];continue}
   // object on a walkable base: indoor floor if any neighbour is '.', else grass/deck
   const nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>(d.rows[y+dy]||'')[x+dx]);F.g[idx(x,y)]=d.pal==='deck'?TI.DECK:(d.outdoor&&!nb.includes('.')?TI.GRASS:TI.FLOOR);
   if(F.g[idx(x,y)]===TI.FLOOR&&d.pal==='deck')F.g[idx(x,y)]=TI.DECK;
   if(ch==='E')M.genSpots.push([f,x,y]);else if(ch==='K')M.hookSpots.push([f,x,y]);else if(ch==='s')M.spawnS.push([f,x,y]);else if(ch==='k')M.spawnK={f,x,y};
   else if(ch==='+'||ch==='*'){M.items.push({f,x:cc(x),y:cc(y),kind:ch==='+'?'medkit':'toolbox',taken:false});res(f,x,y)}
   else if(ch==='n'||ch==='W')furn.push({f,x,y,kind:ch==='W'?'ward':'stand'});
   else if(ADECO[ch]){F.deco.push({x,y,k:ADECO[ch]});F.blk[idx(x,y)]=1;res(f,x,y)}
   else if(ch>='1'&&ch<='9')(stairs[ch]=stairs[ch]||[]).push([f,x,y]);
  }
  if(F.floorT===TI.DECK)for(let i=0;i<FW*FH;i++)if(F.g[i]===TI.FLOOR)F.g[i]=TI.DECK;
 });
 const adj=(f,x,y)=>{const F=M.floors[f];for(const[dx,dy]of[[0,1],[0,-1],[1,0],[-1,0]]){const t=F.g[idx(x+dx,y+dy)];if(!SOLID[t]&&t!==TI.GAP&&t!==TI.STAIR&&!F.blk[idx(x+dx,y+dy)])return[x+dx,y+dy]}return null};
 for(const k in stairs){const L=stairs[k];if(L.length!==2){WP.dbg.log.push('stair '+k+' count '+L.length);continue}const[a,b]=L;
  M.floors[a[0]].g[idx(a[1],a[2])]=TI.STAIR;M.floors[b[0]].g[idx(b[1],b[2])]=TI.STAIR;const aa=adj(...a),bb=adj(...b);
  const up=b[0]>a[0];link(a[0],a[1],a[2],0,b[0],b[1],b[2],0,up?'Вверх':'Вниз',up?'Вниз':'Вверх');const A=M.stairs[M.stairs.length-2],B=M.stairs[M.stairs.length-1];M.floors[a[0]].g[idx(a[1],a[2])]=TI.STAIR;M.floors[b[0]].g[idx(b[1],b[2])]=TI.STAIR;A.ax=aa[0];A.ay=aa[1];B.ax=bb[0];B.ay=bb[1];res(a[0],aa[0],aa[1]);res(b[0],bb[0],bb[1])}
 // gates: contiguous G tiles; lever/inner tile is the adjacent walkable tile
 M.floors.forEach((F,f)=>{const seen=new Set();for(let i=0;i<FW*FH;i++){if(F.g[i]!==TI.GATE||seen.has(i))continue;const tiles=[];const q=[i];seen.add(i);while(q.length){const j=q.pop();tiles.push([j%FW,(j/FW)|0]);const jx=j%FW;for(const n of[jx<FW-1?j+1:-1,jx>0?j-1:-1,j+FW,j-FW])if(n>=0&&F.g[n]===TI.GATE&&!seen.has(n)){seen.add(n);q.push(n)}}
  let inner=null;for(const[x,y]of tiles){inner=adj(f,x,y);if(inner)break}M.gates.push({f,tiles,x:cc(inner[0]),y:cc(inner[1]),ix:inner[0],iy:inner[1],side:0,prog:0,open:false,name:kind==='ship'?'Трап':(tiles[0][0]===0?'Западная дорога':'Восточная дорога')});
  for(const[x,y]of tiles)res(f,x,y);res(f,inner[0],inner[1])}});
 M.pendingFurn=furn;
}
function placeAsciiFurn(M,res,isRes){for(const p of M.pendingFurn||[]){const F=M.floors[p.f];let best=null,bs=-1;
  for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,i=idx(x,y),t=F.g[i];if(SOLID[t]||t===TI.GAP||t===TI.STAIR||F.blk[i]||isRes(p.f,x,y))continue;
   const sv=SOLID[F.g[idx(x,y-1)]]&&SOLID[F.g[idx(x,y+1)]],sh=SOLID[F.g[idx(x-1,y)]]&&SOLID[F.g[idx(x+1,y)]];const sc=(sv||sh)?2:1;if(sc>bs){bs=sc;best={x,y,vert:sv?true:sh?false:dy!==0}}}
  if(!best){WP.dbg.log.push('furniture without fall tile '+p.f+','+p.x+','+p.y);continue}
  F.blk[idx(p.x,p.y)]=1;M.furn.push({id:M.furn.length,f:p.f,tx:p.x,ty:p.y,fx:best.x,fy:best.y,vert:best.vert,x:cc(p.x),y:cc(p.y),kind:p.kind,state:'up',anim:0,breakP:0});res(p.f,p.x,p.y)}}
/* whole-map connectivity through stairs, for killer and survivors */
function globalCheck(M){for(const kind of['k','s']){let tot=0;for(let f=0;f<M.floors.length;f++)for(let y=0;y<FH;y++)for(let x=0;x<FW;x++)if(passK(M.floors[f],x,y,kind))tot++;
 const s=M.spawnK;bfs(M,kind,s.f,s.x,s.y,null,0);if(M.qt!==tot){const st=M.st;let ex=[];for(let f=0;f<M.floors.length;f++)for(let y=0;y<FH;y++)for(let x=0;x<FW;x++)if(passK(M.floors[f],x,y,kind)&&M.stamp[f*FW*FH+idx(x,y)]!==st&&ex.length<6)ex.push(f+':'+x+','+y);WP.dbg.log.push(M.kind+': '+(tot-M.qt)+' tiles unreachable for '+kind+' e.g. '+ex.join(' '))}
 for(const o of[...M.gens,...M.hooks])if(bfs(M,'k',s.f,s.x,s.y,(f,x,y)=>f===o.f&&Math.abs(x-o.tx)+Math.abs(y-o.ty)===1)<0)WP.dbg.log.push(M.kind+': object unreachable '+o.f+','+o.tx+','+o.ty)}}
