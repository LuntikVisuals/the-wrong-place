// shared structural checks: decoration clutter + building entrances + openings in a row
function decoClusters(F){const m=new Map();F.deco.forEach((d,i)=>m.set(d.x+','+d.y,i));const seen=new Set(),C=[];
 F.deco.forEach((d,i)=>{if(seen.has(i))return;const q=[i],cl=[];seen.add(i);while(q.length){const j=q.pop(),e=F.deco[j];cl.push(e);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=m.get((e.x+dx)+','+(e.y+dy));if(n!=null&&!seen.has(n)&&F.deco[n].k===d.k){seen.add(n);q.push(n)}}}C.push({k:d.k,t:cl})});return C}
const SAME={well:12,altar:12,engine:8,lifeboat:6,mast:6,cart:8,clock:6,globe:6,crib:4,sofa:4,hay:4,dummy:4,pew:2},MAXN={well:1,altar:2,engine:4,lifeboat:4,pew:2,crate:2,hay:2,table:2,shelf:2,barrel:1};
function cdist(a,b){let m=99;for(const p of a.t)for(const q of b.t)m=Math.min(m,Math.max(Math.abs(p.x-q.x),Math.abs(p.y-q.y)));return m}
function clutterIssues(F,f){const C=decoClusters(F),out=[];for(const c of C)if(c.t.length>(MAXN[c.k]||1))out.push('deco cluster too big '+c.k+'x'+c.t.length+'@'+[f,c.t[0].x,c.t[0].y]);
 for(let i=0;i<C.length;i++)for(let j=i+1;j<C.length;j++){const a=C[i],b=C[j],d=cdist(a,b);if(a.k===b.k&&d<(SAME[a.k]||3))out.push('same deco near '+a.k+'@'+[f,a.t[0].x,a.t[0].y]+' '+b.k+'@'+[b.t[0].x,b.t[0].y]+' d='+d);else if(a.k!==b.k&&d<2)out.push('deco touching '+a.k+'@'+[f,a.t[0].x,a.t[0].y]+' '+b.k+'@'+[b.t[0].x,b.t[0].y])}
 for(let y=1;y<FH-1;y++)for(let x=1;x<FW-1;x++)if(F.g[idx(x,y)]===TI.TREE){let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&F.g[idx(x+dx,y+dy)]===TI.TREE)n++;if(n>=3)out.push('tree clump @'+[f,x,y])}
 return out}
function isW(t){return t===TI.WALL||t===TI.HOUSE}
function openings(F){const o=new Set(),pass=(x,y)=>{const t=F.g[idx(x,y)];return!isW(t)&&t!==TI.STAIR&&(!SOLID[t]||t===TI.GAP)};
 for(const hz of[true,false]){const A=hz?FH:FW,B=hz?FW:FH;for(let a=1;a<A-1;a++){let b=1;while(b<B-1){const at=(b2)=>hz?[b2,a]:[a,b2];if(!pass(...at(b))){b++;continue}let e=b;while(e<B-1&&pass(...at(e)))e++;
  const len=e-b;if(len<=3&&b>=2&&e<=B-2&&isW(F.g[idx(...at(b-1))])&&isW(F.g[idx(...at(b-2))])&&isW(F.g[idx(...at(e))])&&isW(F.g[idx(...at(e+1))])){let ok=true;for(let k=b;k<e;k++){const[x,y]=at(k);const n1=hz?[x,y-1]:[x-1,y],n2=hz?[x,y+1]:[x+1,y];if(isW(F.g[idx(...n1)])||isW(F.g[idx(...n2)]))ok=false}if(ok)for(let k=b;k<e;k++)o.add(idx(...at(k)))}b=e}}}
 return o}
function buildingIssues(M,f,F){const out=[],op=openings(F),walk=i=>{const t=F.g[i];return!isW(t)&&(!SOLID[t]||t===TI.GAP)};
 // exterior region on outdoor floors: flood from gates/border-adjacent walkable tiles without crossing openings
 const lab=new Int32Array(FW*FH).fill(-1);let n=0;const comps=[];
 for(let i=0;i<FW*FH;i++){if(lab[i]>=0||!walk(i)||op.has(i))continue;const q=[i];lab[i]=n;let sz=0;const tiles=[];while(q.length){const j=q.pop();sz++;tiles.push(j);const x=j%FW,y=(j/FW)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=FW||Y>=FH)continue;const k=idx(X,Y);if(lab[k]<0&&walk(k)&&!op.has(k)){lab[k]=n;q.push(k)}}}comps.push({sz,tiles});n++}
 if(F.outdoor&&comps.length){const ext=comps.reduce((b,c,i)=>c.sz>comps[b].sz?i:b,0);
  // group rooms into buildings via openings not touching exterior
  const par=[...comps.keys()],fd=a=>par[a]===a?a:(par[a]=fd(par[a]));const ents=new Map();
  const opl=[...op];const nb=i=>{const x=i%FW,y=(i/FW)|0;return[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>idx(x+dx,y+dy))};
  for(const o of opl){const L=new Set(nb(o).map(k=>lab[k]).filter(v=>v>=0));if(!L.has(ext)){const a=[...L];for(const b of a)par[fd(b)]=fd(a[0])}}
  // opening groups touching exterior
  const seen=new Set();for(const o of opl){if(seen.has(o))continue;const grp=[o];seen.add(o);for(let k=0;k<grp.length;k++)for(const m of nb(grp[k]))if(op.has(m)&&!seen.has(m)){seen.add(m);grp.push(m)}
   const L=new Set(grp.flatMap(g=>nb(g).map(k=>lab[k])).filter(v=>v>=0));if(!L.has(ext))continue;for(const r of L)if(r!==ext){const b=fd(r);ents.set(b,(ents.get(b)||[]).concat([grp[0]]))}}
  for(const[b,list]of ents){let area=0;comps.forEach((c,i)=>{if(i!==ext&&fd(i)===b)area+=c.sz});const cap=area>=140?3:2;const t=comps[b].tiles[0];
   if(list.length>cap)out.push('building has '+list.length+' entrances (max '+cap+') @'+[f,t%FW,(t/FW)|0]+' area '+area);(M._ents=M._ents||[]).push([f,t%FW,(t/FW)|0,list.length,area])}}
 // openings in a row along the same wall: two openings separated by <=2 wall tiles
 for(const o of op){const x=o%FW,y=(o/FW)|0,hz=isW(F.g[idx(x-1,y)]);for(const s of[1]){for(let k=2;k<=3;k++){const X=hz?x+k:x,Y=hz?y:y+k;if(X>=FW||Y>=FH)break;const j=idx(X,Y);let allW=true;for(let m=1;m<k;m++)if(!isW(F.g[hz?idx(x+m,y):idx(x,y+m)]))allW=false;if(allW&&op.has(j)){out.push('openings in a row @'+[f,x,y]+'-'+[X,Y]);break}}}}
 // per room-pair wall: at most 2 openings on indoor floors
 if(!F.outdoor){const cnt=new Map();for(const o of op){const L=[...new Set([[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>lab[o+dx+dy*FW]).filter(v=>v>=0))].sort((a,b)=>a-b);if(L.length===2){const x=o%FW,y=(o/FW)|0,hz=isW(F.g[o-1]);const k=L.join('-')+(hz?'h'+y+':'+Math.floor(x/10):'v'+x+':'+Math.floor(y/10));cnt.set(k,(cnt.get(k)||0)+1)}}
  for(const[k,c]of cnt)if(c>2)out.push('rooms '+k+' joined by '+c+' openings in one wall @floor '+f)}
 return out}
module.exports={clutterIssues,buildingIssues};
