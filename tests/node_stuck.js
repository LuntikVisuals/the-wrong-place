const fs=require('fs'),path=require('path');const src=path.join(__dirname,'..','src');
global.window={addEventListener(){}};global.document={getElementById(){return null}};
eval(fs.readdirSync(src).filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(path.join(src,f),'utf8')).join('\n')+';global.WP=WP;');
const N=+process.argv[2]||20,mp=process.argv[3]||'mansion';let tot=0,st=0,dith=0;
for(const k of ['stitches','bride','rotjaw'])for(const d of [0,1,2])for(let i=0;i<N;i++){const seed=5000+i*7+d*100000;const r=WP.sim({killer:k,seed,diff:d,map:mp});tot++;
 if(r.dither.length)dith+=r.dither.length;if(r.stuck.length||r.wallClip||r.nan||r.crossFloor||!r.over){st++;console.log(k,seed,d,JSON.stringify(r.stuck.slice(0,3)),r.wallClip,r.nan,r.crossFloor,r.over)}}
console.log('total',tot,'withIssues',st,'dither',dith);
