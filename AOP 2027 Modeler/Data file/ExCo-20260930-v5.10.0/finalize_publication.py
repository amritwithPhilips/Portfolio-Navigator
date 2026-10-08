from pathlib import Path
import json,hashlib,shutil
D=Path(__file__).parent;receipt=json.loads((D/'Publication-receipt.json').read_text(encoding='utf8'));R=Path(receipt['release']);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert json.loads((D/'audit/published-smoke.json').read_text())['passed']
for item in receipt['protected']+receipt['files']:assert sha(Path(item['file']))==item['sha256'],item['file']
for rel in ['audit/published-smoke.json','audit/published-report.png','finalize_publication.py']:
 dst=R/rel;shutil.copy2(D/rel,dst);receipt['files'].append({'file':str(dst),'sha256':sha(dst)})
for item in receipt['protected']+receipt['files']:assert sha(Path(item['file']))==item['sha256'],item['file']
receipt['finalVerification']={'publishedFilesVerified':len(receipt['files']),'protectedFilesUnchanged':len(receipt['protected']),'publishedBrowserSmoke':True}
for p in [D/'Publication-receipt.json',R/'Publication-receipt.json']:p.write_text(json.dumps(receipt,indent=2),encoding='utf8')
print(json.dumps(receipt['finalVerification']))
