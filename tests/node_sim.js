// quick headless (node) harness: loads src modules with a tiny DOM stub, runs bot-vs-bot sims
const fs=require('fs'),path=require('path');const src=path.join(__dirname,'..','src');
global.window={addEventListener(){},devicePixelRatio:1};global.document={getElementById(){return null}};
const code=fs.readdirSync(src).filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(path.join(src,f),'utf8')).join('\n');
eval(code+';global.WP=WP;');
const N=+process.argv[2]||5,map=process.argv[3]||'mansion';const out=[];
for(const k of ['stitches','bride','rotjaw'])for(let i=0;i<N;i++){const t0=Date.now();const r=WP.sim({killer:k,seed:1000+i,map});r.ms=Date.now()-t0;out.push(r);
 const e=r.ev;console.log(k,i,'t',r.time,'K',r.result&&r.result.kills,'gens',r.gens,'stuck',r.stuck.length,'nan',r.nan,'clip',r.wallClip,'xf',r.crossFloor,'hk',e.hooks,'st',e.stairs,'kn',e.knocks,'stun',e.stuns,'vlt',e.vaults,'brk',e.breaks,'unh',e.unhooks,'rev',e.revives,'ab',e.abil,'bo',e.bleedouts||0,'wig',e.wiggleOut,r.collapseBy);
 if(r.stuck.length)console.log('  ',JSON.stringify(r.stuck.slice(0,4)))}
const agg={};for(const r of out){const a=agg[r.killer]=agg[r.killer]||{n:0,kills:0,kw:0,sw:0,dr:0,stuck:0,timer:0,knocks:0,stuns:0,vaults:0};a.n++;a.kills+=r.result.kills;a[r.result.winner==='killer'?'kw':r.result.winner==='survivors'?'sw':'dr']++;a.stuck+=r.stuck.length;a.timer+=r.collapseBy==='timer'?1:0;a.knocks+=r.ev.knocks;a.stuns+=r.ev.stuns;a.vaults+=r.ev.vaults}
console.log(JSON.stringify(agg));