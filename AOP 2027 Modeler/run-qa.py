"""
AOP 2027 One Portfolio Dashboard — Automated QA Runner
======================================================

Launches a local server, runs the QA harness in a headless browser,
and reports results. Designed for quick build validation.

Usage:
  python run-qa.py                          # test default file
  python run-qa.py AOP2027-OnePortfolio-v4.5.html  # test specific file

Requires: Python 3.8+, selenium (pip install selenium)
Falls back to manual instructions if selenium unavailable.
"""
import sys, io, os, json, time, subprocess, http.server, threading
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_FILE = 'AOP2027-OnePortfolio-v4.5.html'
HTML_FILE = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_FILE
HTML_PATH = os.path.join(DIR, HTML_FILE)
QA_JS = os.path.join(DIR, 'qa-harness.js')
PORT = 8799

if not os.path.exists(HTML_PATH):
    print(f"ERROR: {HTML_PATH} not found")
    sys.exit(1)

with open(QA_JS, 'r', encoding='utf-8') as f:
    qa_script = f.read()

# ============================================================
# START LOCAL SERVER
# ============================================================
print(f"\n{'='*60}")
print(f"  AOP 2027 QA Harness")
print(f"  File: {HTML_FILE}")
print(f"  Server: http://localhost:{PORT}")
print(f"{'='*60}\n")

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args): pass

server = http.server.HTTPServer(('', PORT), lambda *a: QuietHandler(*a, directory=DIR))
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
print(f"[OK] Server started on port {PORT}")
time.sleep(1)

# ============================================================
# TRY SELENIUM (headless Chrome)
# ============================================================
result = None
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    print("[OK] Selenium available — running headless browser test\n")

    opts = Options()
    opts.add_argument('--headless')
    opts.add_argument('--no-sandbox')
    opts.add_argument('--disable-gpu')
    opts.add_argument('--window-size=1400,900')

    driver = webdriver.Chrome(options=opts)
    driver.get(f'http://localhost:{PORT}/{HTML_FILE}')

    # Wait for the engine to load
    WebDriverWait(driver, 15).until(
        lambda d: d.execute_script("return typeof window.__aop !== 'undefined' && window.__aop.result !== undefined")
    )
    print("[OK] Dashboard loaded, engine ready\n")

    # Run QA harness
    result = driver.execute_script(f"return ({qa_script})")
    driver.quit()

except ImportError:
    print("[INFO] Selenium not installed. Install with: pip install selenium")
    print("[INFO] Falling back to manual mode.\n")
except Exception as e:
    print(f"[WARN] Selenium error: {e}")
    print("[INFO] Falling back to manual mode.\n")

# ============================================================
# FALLBACK: Manual instructions
# ============================================================
if result is None:
    print("=" * 60)
    print("  MANUAL QA MODE")
    print("=" * 60)
    print(f"\n  1. Open http://localhost:{PORT}/{HTML_FILE} in Chrome")
    print(f"  2. Open DevTools (F12) → Console")
    print(f"  3. Paste the contents of qa-harness.js")
    print(f"  4. Press Enter — the test report will appear\n")
    print("  Or in Claude Code Browser pane, use:")
    print(f"  preview_eval with the qa-harness.js content\n")

    # Keep server alive
    try:
        print("  Server running. Press Ctrl+C to stop.\n")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    server.shutdown()
    sys.exit(0)

# ============================================================
# REPORT RESULTS
# ============================================================
if 'error' in result:
    print(f"ERROR: {result['error']}")
    server.shutdown()
    sys.exit(1)

summary = result['summary']
data = result['data']
tests = result['tests']

print("=" * 60)
print(f"  QA REPORT — {summary['verdict']}")
print(f"  Engine: v{summary['version']}  |  {summary['timestamp']}")
print(f"  Passed: {summary['passed']}  |  Failed: {summary['failed']}  |  Total: {summary['total']}")
print("=" * 60)

print(f"\n  Programmes: {data['programmes']}")
print(f"  Allocated:  {data['allocated']} M€ of {data['budget']} M€")
print(f"  Scenario:   {data['scenarioType']} ({data['preset']})")
print(f"\n  P1 Legal:   {data['buckets']['P1']['count']} progs, {data['buckets']['P1']['demand']} M€ demand, {data['buckets']['P1']['funded']} M€ funded")
print(f"  P2 Carry:   {data['buckets']['P2']['count']} progs, {data['buckets']['P2']['demand']} M€ demand, {data['buckets']['P2']['funded']} M€ funded")
print(f"  P3 Sustain: {data['buckets']['P3']['count']} progs, {data['buckets']['P3']['demand']} M€ demand, {data['buckets']['P3']['funded']} M€ funded")
print(f"  P4 Value:   {data['buckets']['P4']['count']} progs, {data['buckets']['P4']['demand']} M€ demand, {data['buckets']['P4']['funded']} M€ funded")

# Detailed test results
print(f"\n{'─'*60}")
for t in tests:
    icon = '✓' if t['status'] == 'PASS' else '✗'
    print(f"  {icon} {t['name']}")
    if t['status'] == 'FAIL':
        print(f"    └─ {t['detail']}")

# Preset comparison
print(f"\n{'─'*60}")
print("  Preset Comparison:")
for name, pr in result.get('presets', {}).items():
    if 'error' in pr:
        print(f"    {name}: ERROR — {pr['error']}")
    else:
        print(f"    {name}: {pr['allocation']} M€ allocated, {pr['funded']} funded, stages {pr['stages']}")

print(f"\n{'='*60}")
if summary['failed'] == 0:
    print("  ✓ ALL TESTS PASSED — EXCO READY")
else:
    print(f"  ✗ {summary['failed']} TESTS FAILED — REVIEW REQUIRED")
print(f"{'='*60}\n")

# Save report
report_path = os.path.join(DIR, 'Data file', 'Verification', 'qa-report-v4.5.json')
os.makedirs(os.path.dirname(report_path), exist_ok=True)
with open(report_path, 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2, ensure_ascii=False)
print(f"  Report saved: {report_path}")

server.shutdown()
sys.exit(0 if summary['failed'] == 0 else 1)
