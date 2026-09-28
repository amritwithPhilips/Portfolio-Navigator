"""Dependency-free checks matching the applicable quick_validate constraints.
Used because the supplied quick_validate.py needs unavailable PyYAML.
The authored front matter has only two single-line plain string fields.
"""
from pathlib import Path
import re, json, hashlib
root=Path(__file__).resolve().parents[2]
skill=root/'Skills/aop-prioritization-v3'
text=(skill/'SKILL.md').read_text(encoding='utf-8')
m=re.match(r'^---\n(.*?)\n---',text,re.S);assert m
fm={}
for line in m[1].splitlines():
    k,v=line.split(':',1);assert k in {'name','description','license','allowed-tools','metadata'}
    assert k not in fm;fm[k]=v.strip()
assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',fm['name']) and len(fm['name'])<=64
assert fm['description'] and len(fm['description'])<=1024 and not any(c in fm['description'] for c in '<>')
assert '[TODO:' not in text
for link in re.findall(r'\]\(([^)]+)\)',text):assert (skill/link).is_file(),link
yaml=(skill/'agents/openai.yaml').read_text(encoding='utf-8')
assert yaml.startswith('interface:\n') and '$aop-prioritization' in yaml
description=re.search(r'short_description: "([^"]+)"',yaml)[1];assert 25<=len(description)<=64
assert (skill/'assets/engine.js').read_bytes()==(root/'Modeller/v3/engine.js').read_bytes()
result={'status':'PASS','method':'Dependency-free equivalent checks; supplied validator could not import PyYAML','frontmatter':'PASS','reference_links':'PASS','agent_metadata':'PASS','engine_parity':'PASS'}
(root/'output/modeler-v3/Skill-Test-Results.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))
