// Map audit: stairs arrivals sane, objects on walkable tiles, no big empty open zones (open tile farther than R tiles from any wall/object)
const fs=require('fs'),path=require('path');const src=path.join(__dirname,'..','src');
global.window={addEventListener(){}};global.document={getElementById(){return null}};
eval(fs.readdirSync(src).filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(path.join(src,f),'utf8')).join('\n')+';global.buildMap=buildMap;global.idx=idx;global.SOLID=SOLID;global.TI=TI;global.FW=FW;global.FH=FH;global.passK=passK;global.T=T;global.TI=TI;');
global.TI=TI;const SA=(()=>{const m={exports:{}};eval(fs.readFileSync(path.join(__dirname,'structaudit.js'),'utf8').replace('module.exports=','m.exports='));return m.exports})();
let bad=0;const R=+process.argv[2]||6;
for(const kind of['mansion','village','ship']){const M=buildMap(kind),issues=[];
 for(const s of M.stairs){const F=M.floors[s.f];if(F.g[idx(s.x,s.y)]!==TI.STAIR)issues.push('stair tile lost '+[s.f,s.x,s.y]);if(!passK(F,s.ax,s.ay,'s')||!passK(F,s.ax,s.ay,'k'))issues.push('stair arrival blocked '+[s.f,s.ax,s.ay]);if(Math.abs(s.ax-s.x)+Math.abs(s.ay-s.y)!==1)issues.push('stair arrival not adjacent '+[s.f,s.x,s.y])}
 for(const o of[...M.gens,...M.hooks]){const t=M.floors[o.f].g[idx(o.tx,o.ty)];if(SOLID[t])issues.push('object on solid '+[o.f,o.tx,o.ty])}
 M.floors.forEach((F,f)=>{if(!F.outdoor)for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){if(!passK(F,x,y,'s'))continue;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=FW||Y>=FH||F.g[idx(X,Y)]===TI.VOID||F.g[idx(X,Y)]===TI.WATER)issues.push('hole in wall '+[f,x,y])}}
  for(const d of F.deco)if(SOLID[F.g[idx(d.x,d.y)]])issues.push('deco on solid '+[f,d.x,d.y]);
  const occ=new Uint8Array(FW*FH);for(let i=0;i<FW*FH;i++)if(SOLID[F.g[i]]||F.blk[i]||F.g[i]===TI.STAIR)occ[i]=1;for(const o of[...M.gens,...M.hooks,...M.furn.filter(u=>u.f===f).map(u=>({f,tx:u.tx,ty:u.ty}))])if(o.f===f)occ[idx(o.tx,o.ty)]=1;
  let worst=0,wx=0,wy=0;for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){if(occ[idx(x,y)]||!passK(F,x,y,'s'))continue;let d=99;for(let yy=Math.max(0,y-R);yy<=Math.min(FH-1,y+R);yy++)for(let xx=Math.max(0,x-R);xx<=Math.min(FW-1,x+R);xx++)if(occ[idx(xx,yy)])d=Math.min(d,Math.max(Math.abs(xx-x),Math.abs(yy-y)));if(d>worst){worst=d;wx=x;wy=y}}
  if(worst>R)issues.push('empty zone around '+[f,wx,wy]+' (no cover within '+R+' tiles)')});
 // ---- spacing rules (tiles) ----
 const ch=(a,b)=>Math.max(Math.abs(a.tx-b.tx),Math.abs(a.ty-b.ty)),eu=(a,b)=>Math.hypot(a.tx-b.tx,a.ty-b.ty),nm=(k,o)=>k+'@'+[o.f,o.tx,o.ty];
 const G=M.gens,H=M.hooks,FU=M.furn.flatMap(u=>[{f:u.f,tx:u.tx,ty:u.ty,k:'furn'},{f:u.f,tx:u.fx,ty:u.fy,k:'furnFall'}]),IT=M.items.map(i=>({f:i.f,tx:Math.floor(i.x/T),ty:Math.floor(i.y/T),k:'item'})),GA=M.gates.flatMap(g=>g.tiles.map(([x,y])=>({f:g.f,tx:x,ty:y,k:'gate'}))),ST=M.stairs.map(s=>({f:s.f,tx:s.x,ty:s.y,k:'stair'}));
 for(let i=0;i<G.length;i++)for(let j=i+1;j<G.length;j++){const a=G[i],b=G[j];if(a.f===b.f&&eu(a,b)<10)issues.push('gens too close '+nm('g',a)+' '+nm('g',b)+' d='+eu(a,b).toFixed(1));if(a.f!==b.f&&eu(a,b)<6)issues.push('gens stacked across floors '+nm('g',a)+' '+nm('g',b))}
 for(let i=0;i<H.length;i++)for(let j=i+1;j<H.length;j++){const a=H[i],b=H[j];if(a.f===b.f&&ch(a,b)<4)issues.push('hooks glued '+nm('h',a)+' '+nm('h',b))}
 for(const h of H){const F=M.floors[h.f];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const t=F.g[idx(h.tx+dx,h.ty+dy)];if(SOLID[t]||t===TI.STAIR||(dx||dy)&&F.blk[idx(h.tx+dx,h.ty+dy)])issues.push('hook touches wall/prop '+nm('h',h)+' at '+[dx,dy])}
  for(const g of G)if(g.f===h.f&&ch(g,h)<4)issues.push('hook near gen '+nm('h',h)+' '+nm('g',g))}
 const pts=[...G.map(o=>({...o,k:'gen'})),...H.map(o=>({...o,k:'hook'})),...FU,...IT,...GA,...ST,...(M.lockers||[]).map(o=>({f:o.f,tx:o.tx,ty:o.ty,k:'locker'}))];
 const need=(a,b)=>{const s=new Set([a.k,b.k]);if(s.has('gate'))return a.k===b.k?0:3;if(s.has('stair'))return a.k===b.k?0:2;if(s.has('furn')&&s.has('furnFall'))return 0;if(a.k==='furn'||a.k==='furnFall'){if(b.k==='furn'||b.k==='furnFall')return 2}return 2};
 const seen=new Set();for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const a=pts[i],b=pts[j];if(a.f!==b.f||(a.k==='hook'&&b.k==='hook')||(a.k==='gen'&&b.k==='gen'))continue;const n=need(a,b);if(n&&ch(a,b)<n){const key=nm(a.k,a)+' '+nm(b.k,b);if(!seen.has(key)){seen.add(key);issues.push('too close '+key)}}}
 M.floors.forEach((F,f)=>{issues.push(...SA.clutterIssues(F,f),...SA.buildingIssues(M,f,F))});
 if(!(M.lockers||[]).length)issues.push('no lockers');M.floors.forEach((F,f)=>{if(!M.lockers.some(L=>L.f===f))issues.push('floor without locker '+f)});
 bad+=issues.length;if(process.env.ENTS)console.log(kind,'entrances',JSON.stringify(M._ents));console.log(kind,issues.length?issues:'ok')}
process.exit(bad?1:0)
