import json,hashlib,shutil
from pathlib import Path
D=Path(__file__).parent
receipt=json.loads((D/'Publication-receipt.json').read_text())
R=Path(receipt['release'])
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for item in receipt['protected']+receipt['files']:
    assert sha(Path(item['file']))==item['sha256'],item['file']
assert json.loads((D/'audit/final-ui-smoke.json').read_text())['passed']
assert json.loads((D/'audit/published-smoke.json').read_text())['passed']
updated=['feature_final.js','published_smoke.js','finalize_publication.py','audit/final-review-preview.png','audit/final-opportunity-preview.png','audit/final-report.png','audit/final-ui-smoke.json','audit/published-smoke.json']
for rel in updated:
    dst=R/rel
    shutil.copy2(D/rel,dst)
    record=next((x for x in receipt['files'] if x['file']==str(dst)),None)
    if record is None:
        record={'file':str(dst)}
        receipt['files'].append(record)
    record['sha256']=sha(dst)
for item in receipt['protected']+receipt['files']:
    assert sha(Path(item['file']))==item['sha256'],item['file']
receipt['finalVerification']={'publishedSmokePassed':True,'publishedFilesVerified':len(receipt['files']),'protectedFilesUnchanged':4}
for p in [D/'Publication-receipt.json',R/'Publication-receipt.json']:
    p.write_text(json.dumps(receipt,indent=2),encoding='utf-8')
print(json.dumps(receipt['finalVerification']))
