#!/usr/bin/env python3
"""Concatenate src modules (alphabetical) into dist/the-wrong-place.html. Touches only files inside /workspace/wrongplace."""
import os
ROOT=os.path.dirname(os.path.abspath(__file__))
SRC=os.path.join(ROOT,'src');OUT=os.path.join(ROOT,'dist','the-wrong-place.html')
head=open(os.path.join(SRC,'a_head.html'),encoding='utf-8').read()
mods=sorted(f for f in os.listdir(SRC) if f.endswith('.js'))
js='\n'.join('/* --- %s --- */\n'%m+open(os.path.join(SRC,m),encoding='utf-8').read() for m in mods)
os.makedirs(os.path.dirname(OUT),exist_ok=True)
open(OUT,'w',encoding='utf-8').write(head+js+'\n</script>\n</body>\n</html>\n')
print('built',OUT,os.path.getsize(OUT),'bytes from',mods)
