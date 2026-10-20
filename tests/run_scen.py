import asyncio,json
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=await b.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type in('error','warning') else None)
    await pg.goto('file:///workspace/wrongplace/dist/the-wrong-place.html');await pg.wait_for_function('WP.ready')
    r=await pg.evaluate(open('/workspace/wrongplace/tests/scenarios.js').read())
    for k,v in r.items():print('PASS' if v['ok'] else 'FAIL',k,'' if v['ok'] else json.dumps(v['info'])[:300])
    print('passed',sum(v['ok'] for v in r.values()),'/',len(r),'errors',errs)
    await b.close()
asyncio.run(main())
