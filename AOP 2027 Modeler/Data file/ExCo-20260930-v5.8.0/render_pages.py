from pathlib import Path
import json
from pypdf import PdfReader
from pdf2image import convert_from_path
from PIL import Image,ImageOps,ImageDraw
D=Path(__file__).parent/'audit';report=[]
for p in D.glob('AOP2027-*.pdf'):
 doc=PdfReader(p);folder=D/p.stem;folder.mkdir(exist_ok=True);images=[];texts=[]
 poppler=next(Path(r'C:\Users\320126040\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler').rglob('pdftoppm.exe')).parent
 pages=convert_from_path(str(p),dpi=110,poppler_path=str(poppler))
 for i,page in enumerate(doc.pages):
  dest=folder/f'page-{i+1}.png';pages[i].save(dest);images.append(dest);texts.append(page.extract_text())
 for start in range(0,len(images),4):
  sheet=Image.new('RGB',(1850,2500),'#dddddd')
  for off,src in enumerate(images[start:start+4]):
   im=Image.open(src);im.thumbnail((900,1200));x=(off%2)*925;y=(off//2)*1250+25;sheet.paste(im,(x,y));ImageDraw.Draw(sheet).text((x+10,y-20),f'Page {start+off+1}',fill='black')
  sheet.save(folder/f'contact-{start//4+1}.png')
 (folder/'text.txt').write_text('\n'.join(texts),encoding='utf8')
 report.append({'file':p.name,'pages':len(doc.pages),'pagesWithLittleText':[i+1 for i,t in enumerate(texts) if len(t.strip())<100],'unwantedTerminology':bool(__import__('re').search(r'\b[Pp]rogrammes?\b',' '.join(texts)))})
(D/'document-render-qa.json').write_text(json.dumps(report,indent=2));print(report)
