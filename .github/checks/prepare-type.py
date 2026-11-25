from pathlib import Path
from html.parser import HTMLParser
from urllib.request import urlopen
from urllib.parse import quote
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
import base64, io, re, sys
class Headings(HTMLParser):
    def __init__(self):
        super().__init__(); self.depth=0; self.words=[]
    def handle_starttag(self, tag, attrs):
        if tag in ('h1','h2'): self.depth+=1
    def handle_endtag(self, tag):
        if tag in ('h1','h2'): self.depth=max(0,self.depth-1)
    def handle_data(self,s):
        if self.depth: self.words.append(s)
pages=[Path('index.html'),Path('drive/index.html'),Path('network-notes.html'),*Path('labs').rglob('*.html')]
files=[*pages,*Path('labs').rglob('*.js')]
alltext=''.join(f.read_text(encoding='utf-8') for f in files)
head=Headings()
for f in pages: head.feed(f.read_text(encoding='utf-8'))
kind=sys.argv[1]
inputtext=alltext if kind=='Sans' else ''.join(head.words)
chars=set(ord(c) for c in inputtext if 0x2E80<=ord(c)<=0x9FFF or 0xFF00<=ord(c)<=0xFFEF or ord(c) in (0x2014,0x2026,0xB7))
family='Noto'+kind+'SC'
url='https://raw.githubusercontent.com/google/fonts/b46ed7e334ae7aaf3c6b9c446e087d57de39ff7d/ofl/'+family.lower()+'/'+quote(family+'[wght].ttf')
font=TTFont(io.BytesIO(urlopen(url,timeout=90).read()))
opt=subset.Options();opt.layout_features=['kern','locl'];opt.notdef_glyph=True
s=subset.Subsetter(options=opt);s.populate(unicodes=chars);s.subset(font)
font=instantiateVariableFont(font,{'wght':450 if kind=='Sans' else 650},inplace=True)
font.flavor='woff2';out=io.BytesIO();font.save(out)
blob=base64.b64encode(out.getvalue()).decode('ascii')
print('FONTCOUNT',kind,len(chars),len(out.getvalue()))
for i in range(0,len(blob),1900): print('LAKE_FONT',kind,blob[i:i+1900])
