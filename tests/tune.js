// node tests/tune.js '<TUNE json>' map killer N  -> prints killer win fraction (same seeds as balance.js)
const fs=require('fs');global.window={addEventListener(){}};global.document={getElementById(){return null}};
eval(fs.readdirSync(__dirname+'/../src').filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(__dirname+'/../src/'+f,'utf8')).join('\n')+';global.WP=WP;global.TUNE=TUNE;global.ONI=ONI;');
if(process.env.ONIOFF)for(const x of process.env.ONIOFF.split(',')){ONI.off[x]=1;if(x==='slow')ONI.slowMul=1;if(x==='noinfo')ONI.off.curse=1}const t=JSON.parse(process.argv[2]);for(const m in t)Object.assign(TUNE[m],t[m]);const[mp,k,N]=[process.argv[3],process.argv[4],+process.argv[5]];
let kw=0,st=0;for(let i=0;i<N;i++){const r=WP.sim({killer:k,seed:5000+i*7+100000,diff:1,map:mp});if(r.result.winner==='killer')kw++;st+=r.stuck.length}
console.log(JSON.stringify({mp,k,kw:kw/N,st}));
