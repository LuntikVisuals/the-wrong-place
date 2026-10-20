// node balance check: killer win% per map/killer at Normal, same seeds as browser test (5000+i*7+100000)
const fs=require('fs');global.window={addEventListener(){}};global.document={getElementById(){return null}};
eval(fs.readdirSync(__dirname+'/../src').filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(__dirname+'/../src/'+f,'utf8')).join('\n')+';global.WP=WP;');
const N=+process.argv[2]||40,maps=(process.argv[3]||'mansion,village,ship').split(',');
for(const mp of maps)for(const k of ['stitches','bride','rotjaw']){let kw=0,kills=0,st=0;for(let i=0;i<N;i++){const r=WP.sim({killer:k,seed:5000+i*7+100000,diff:1,map:mp});if(r.result.winner==='killer')kw++;kills+=r.result.kills;st+=r.stuck.length}
 console.log(mp,k,'killerWin',(100*kw/N).toFixed(0)+'%','avgKills',(kills/N).toFixed(2),'stuck',st)}
