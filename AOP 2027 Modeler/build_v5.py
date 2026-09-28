"""
Build v5.0: Data Layer Separation.

Produces an HTML + companion JSON pair. The HTML fetches the JSON on load;
falls back to embedded data (with --embed) or file-picker if unavailable.

Usage:
  python build_v5.py
  python build_v5.py --embed
  python build_v5.py --source "path/to/demand.xlsx" --output "dist/"
"""
import argparse, json, subprocess, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from pathlib import Path

ROOT = Path(__file__).resolve().parent
IMPL = ROOT / 'Data file' / 'Implementation'
DATA = ROOT / 'Data file'

CSS_FILES = ['app.css', 'ui.css', 'sticky.css', 'interaction.css']
JS_FILES = ['engine.js', 'workbook.js', 'presentation.js', 'qa.js', 'app.js']

HTML_TEMPLATE = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AOP 2027 | Philips IT Portfolio Scenario Modelling</title>
<style>{css}</style>
</head>
<body>
<header class="hdr">
<h1>Philips · AOP 2027 IT Portfolio Scenario Modelling</h1>
<span class="tag">One Portfolio · Evidence-led · v5.0</span>
<span class="draft-badge" id="draft-badge">DRAFT / Work In Progress</span>
<span class="status-meta" id="status" aria-hidden="true"></span>
</header>
<nav class="tabs" id="tabs" aria-label="Portfolio tabs"></nav>
<div id="workflow"></div>
<main id="main"></main>
<dialog id="modal"><button id="close-modal" aria-label="Close program details">Close ×</button><div id="modal-body"></div></dialog>
<div id="toast" role="status" hidden></div>
<script type="application/json" id="source-data">{source_data}</script>
<script type="application/json" id="ops-data">{ops_data}</script>
<script type="application/json" id="svc-data">{svc_data}</script>
<script>{scripts}</script>
</body>
</html>'''


def main():
    parser = argparse.ArgumentParser(description='Build AOP 2027 v5.0 dashboard')
    parser.add_argument('--source', type=Path, help='Path to demand XLSX (runs prepare_data.py)')
    parser.add_argument('--output', type=Path, default=ROOT, help='Output directory')
    parser.add_argument('--embed', action='store_true', help='Also embed demand data in HTML for offline use')
    parser.add_argument('--skip-prepare', action='store_true', help='Skip running prepare_data.py (use existing JSON)')
    args = parser.parse_args()

    out = args.output
    out.mkdir(parents=True, exist_ok=True)

    json_path = DATA / 'AOP2027-Demand-Data.json'

    # Step 1: Run prepare_data.py if needed
    if not args.skip_prepare:
        print('Step 1: Preparing demand data...')
        cmd = [sys.executable, str(DATA / 'prepare_data.py')]
        if args.source:
            cmd += ['--source', str(args.source)]
        cmd += ['--output', str(json_path)]
        result = subprocess.run(cmd, capture_output=False)
        if result.returncode not in (0, 2):
            print('ERROR: prepare_data.py failed', file=sys.stderr)
            sys.exit(1)
        if result.returncode == 2:
            print('WARNING: QA reported failures — building anyway for review')
    else:
        print('Step 1: Skipping prepare_data.py (--skip-prepare)')

    if not json_path.exists():
        print(f'ERROR: {json_path} not found. Run prepare_data.py first.', file=sys.stderr)
        sys.exit(1)

    # Step 2: Read CSS
    print('Step 2: Reading CSS...')
    css_parts = []
    for name in CSS_FILES:
        path = IMPL / name
        if path.exists():
            css_parts.append(path.read_text(encoding='utf-8'))
            print(f'  {name}: {path.stat().st_size:,} bytes')
        else:
            print(f'  {name}: not found (skipped)')
    css = '\n'.join(css_parts)

    # Step 3: Read JS modules
    print('Step 3: Reading JS modules...')
    js_parts = []
    for name in JS_FILES:
        path = IMPL / name
        if path.exists():
            js_parts.append(path.read_text(encoding='utf-8'))
            print(f'  {name}: {path.stat().st_size:,} bytes')
        else:
            print(f'  WARNING: {name} not found!')
    scripts = '\n'.join(js_parts).replace('</script', '<\\/script')

    # Step 4: Embed source data (optional) + read ops/svc data
    source_data = ''
    if args.embed:
        print('Step 4: Embedding demand data for offline use...')
        raw = json_path.read_text(encoding='utf-8')
        source_data = raw.replace('<', '\\u003c')
        print(f'  Embedded: {len(raw):,} chars')
    else:
        print('Step 4: External JSON mode (no embedded data)')

    # Read ops-data and svc-data JSON for tabs 5/6
    ops_data_path = DATA / 'ops-data.json'
    svc_data_path = DATA / 'svc-data.json'
    ops_data = ops_data_path.read_text(encoding='utf-8').replace('<', '\\u003c') if ops_data_path.exists() else '{}'
    svc_data = svc_data_path.read_text(encoding='utf-8').replace('<', '\\u003c') if svc_data_path.exists() else '{}'
    print(f'  ops-data.json: {"found (" + str(ops_data_path.stat().st_size) + " bytes)" if ops_data_path.exists() else "not found (empty placeholder)"}')
    print(f'  svc-data.json: {"found (" + str(svc_data_path.stat().st_size) + " bytes)" if svc_data_path.exists() else "not found (empty placeholder)"}')

    # Step 5: Build HTML
    print('Step 5: Building HTML...')
    html = HTML_TEMPLATE.format(css=css, scripts=scripts, source_data=source_data, ops_data=ops_data, svc_data=svc_data)

    html_path = out / 'AOP2027-IT-Portfolio-Scenario-Modelling-v5.0.html'
    html_path.write_text(html, encoding='utf-8')
    print(f'  HTML: {html_path} ({html_path.stat().st_size / 1024:.0f} KB)')

    # Step 6: Copy companion JSON alongside HTML
    companion = out / 'AOP2027-Demand-Data.json'
    if companion != json_path:
        companion.write_bytes(json_path.read_bytes())
    print(f'  JSON: {companion} ({companion.stat().st_size / (1024*1024):.1f} MB)')

    print(f'\nBuild complete. Open the HTML file — it will fetch the companion JSON.')
    if args.embed:
        print('Embedded mode: HTML also works standalone without the JSON file.')
    print(f'\nTo refresh data later:')
    print(f'  python "{DATA / "prepare_data.py"}" --source "path/to/new.xlsx"')
    print(f'  Then click "Refresh Data" in the dashboard, or re-run this build.')


if __name__ == '__main__':
    main()
