#!/usr/bin/env python3
"""
Разбор списка слов HSK 2.0 из docs/hsk-words-visualized.pdf в
content/hsk_levels.json.

PDF — один лист-карта: 5000 ячеек 30x30, в каждой слово, уровень закодирован
цветом заливки. Текст лежит CID-шрифтом и читается через таблицу ToUnicode.

Уровень определяется не цветом напрямую, а прямоугольной областью, которую
этот цвет занимает: области не пересекаются и покрывают лист целиком, поэтому
192 ячейки с белой заливкой (автор чем-то их выделил) попадают в свой уровень,
а не теряются.

Сверка разбора: 150 / 150 / 300 / 600 / 1300 / 2500 слов и 2663 уникальных
иероглифа — канонические числа HSK 2.0.
"""
import re, zlib, json, collections
import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCR=os.path.join(ROOT,'content')+os.sep
data=open(os.path.join(ROOT,'docs','hsk-words-visualized.pdf'),'rb').read()
streams=[]
for m in re.finditer(rb'stream\r?\n', data):
    s=m.end(); e=data.find(b'endstream',s)
    try: streams.append(zlib.decompress(data[s:e]))
    except Exception: pass
cm=[s for s in streams if b'beginbfchar' in s][0].decode('latin-1')
def pick(dst):
    cps=[int(h,16) for h in dst.split()]
    cjk=[c for c in cps if 0x4E00<=c<=0x9FFF]
    return chr(cjk[0]) if cjk else ''.join(chr(c) for c in cps)
uni={}
for blk in re.findall(r'beginbfchar(.*?)endbfchar', cm, re.S):
    for a,b in re.findall(r'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f ]+)>', blk):
        uni[int(a,16)]=pick(b)
for blk in re.findall(r'beginbfrange(.*?)endbfrange', cm, re.S):
    for a,b,c in re.findall(r'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f ]+)>', blk):
        lo,hi=int(a,16),int(b,16); dst=int(c.split()[0],16)
        for k in range(lo,hi+1): uni[k]=chr(dst+k-lo)
content=max(streams,key=len).decode('latin-1')
N=r'(-?[\d.]+)'
tok=re.compile(rf'{N}\s+{N}\s+{N}\s+sc'
  rf'|{N}\s+{N}\s+m\s+{N}\s+{N}\s+l\s+{N}\s+{N}\s+l\s+{N}\s+{N}\s+l\s+h\s+f'
  rf'|1\s+0\s+0\s+1\s+{N}\s+{N}\s+cm\s+BT[^<]*<([0-9A-Fa-f]+)>\s*Tj', re.S)
color=None; cells={}; per=collections.defaultdict(str)
for t in tok.finditer(content):
    g=t.groups()
    if g[0] is not None: color=tuple(round(float(v),4) for v in g[0:3])
    elif g[3] is not None:
        xs=[float(g[i]) for i in (3,5,7,9)]; ys=[float(g[i]) for i in (4,6,8,10)]
        if round(max(xs)-min(xs))==30: cells[(round(min(xs)),round(min(ys)))]=color
    else:
        x,y,h=float(g[11]),float(g[12]),g[13]
        s=''.join(uni.get(int(h[i:i+4],16),'�') for i in range(0,len(h),4))
        per[(round((x-82)/30)*30+72, round((y-1555)/30)*30+1544)]+=s
REGIONS=[('HSK1',72,822,1394,1574),('HSK2',72,822,1214,1394),('HSK3',72,822,854,1214),
         ('HSK4',822,1572,854,1574),('HSK5',72,1572,74,854),('HSK6',1572,3072,74,1574)]
def level(x,y):
    for n,x0,x1,y0,y1 in REGIONS:
        if x0<=x<x1 and y0<=y<y1: return n
    return 'OUT'
out=collections.defaultdict(list)
bad=0
for (x,y),w in per.items():
    if '�' in w: bad+=1
    out[level(x,y)].append((y,x,w))
res={}
for lv in ['HSK1','HSK2','HSK3','HSK4','HSK5','HSK6','OUT']:
    ws=[w for _,_,w in sorted(out[lv], key=lambda t:(-t[0],t[1]))]
    if ws: res[lv]=ws
print('words total', sum(len(v) for v in res.values()), 'undecoded cells', bad)
for lv,ws in res.items():
    print(lv, len(ws), ''.join(ws[:12]))
json.dump(res, open(SCR+'hsk_levels.json','w'), ensure_ascii=False, indent=0)
chars=set(c for ws in res.values() for w in ws for c in w)
print('unique characters', len(chars))
