"""Iterative balance tuner: adjusts TUNE (per-map gen speed, per map x killer speed) toward ~42% killer wins."""
import json,subprocess,sys,concurrent.futures as cf
T={'mansion':{'gen':0.9,'stitches':1,'bride':1,'rotjaw':1},'village':{'gen':2.4,'stitches':1,'bride':1,'rotjaw':1},'ship':{'gen':1.8,'stitches':1,'bride':1,'rotjaw':1}}
if len(sys.argv)>2 and sys.argv[2]:T=json.loads(sys.argv[2])
KL=(sys.argv[4].split(',') if len(sys.argv)>4 else ['stitches','bride','rotjaw','shepherd','oni'])
N=int(sys.argv[1]) if len(sys.argv)>1 else 60;ROUNDS=int(sys.argv[3]) if len(sys.argv)>3 else 4
def run(mk):
  m,k=mk;o=subprocess.run(['node','/workspace/wrongplace/tests/tune.js',json.dumps(T),m,k,str(N)],capture_output=True,text=True).stdout;return json.loads(o)
for r in range(ROUNDS):
  with cf.ThreadPoolExecutor(8) as ex:R=list(ex.map(run,[(m,k) for m in T for k in KL]))
  print('round',r,json.dumps(T),[(x['mp'][:3],x['k'][:3],round(x['kw']*100),x['st']) for x in R],flush=True)
  if r==ROUNDS-1:break
  for m in T:
    rows=[x for x in R if x['mp']==m];avg=sum(x['kw'] for x in rows)/len(rows)
    for x in rows:T[m][x['k']]=round(T[m][x['k']]*(1-0.3*(x['kw']-0.42)),3)
