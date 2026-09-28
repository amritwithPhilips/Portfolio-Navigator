"""Patch create_prd_v45.py to create v4.5b with updated sections."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('C:/Users/320126040/Documents/Codex/AOP2027/PRD/create_prd_v45.py', 'r', encoding='utf-8') as f:
    src = f.read()

ok = 0
def patch(old, new, label):
    global src, ok
    if old in src:
        src = src.replace(old, new, 1)
        ok += 1; print(f"  [OK] {label}")
    else:
        print(f"  [FAIL] {label}")

# 1. Version
patch('print("Creating PRD v4.5...")', 'print("Creating PRD v4.5b...")', "Version print")
patch("'Version 4.5 | 22 September 2026 | Conference Optimization'",
      "'Version 4.5b | 22 September 2026 | Eligible-Bucket Classification + Textual Benefit Scoring'", "Version line")

# 2. Output path
patch("OUT = 'C:/Users/320126040/Documents/Codex/AOP2027/PRD/AOP2027-OnePortfolio-PRD-v4.5.docx'",
      "OUT = 'C:/Users/320126040/Documents/Codex/AOP2027/PRD/AOP2027-OnePortfolio-PRD-v4.5b.docx'", "Output path")
patch('print(f"PRD v4.5 saved to {OUT}")', 'print(f"PRD v4.5b saved to {OUT}")', "Output print")

# 3. Update OC register items to BUILT status
for old, new, label in [
    ("'OC-02', 'Four-priority funding structure', '4.2 Sec 2, 5.1', 'To be built', 'None'",
     "'OC-02', 'Four-priority with eligible-only buckets', '4.2, 5.1, App A', 'BUILT v4.5', 'None'", "OC-02"),
    ("'OC-11', 'LFR evidence gate (name + year + evidence)', '5.2', 'To be built', 'None'",
     "'OC-11', 'LFR evidence gate: ineligible LFRs to P4', '5.2, App A', 'BUILT v4.5', 'None'", "OC-11"),
    ("'OC-12', 'LFR sub-bucket view (P1/P2/CCB breakdown)', '4.1 Sec 4', 'To be built', 'OC-11'",
     "'OC-12', 'LFR sub-bucket view (Immediate/Scheduled/CCB)', '4.2', 'BUILT v4.5', 'OC-11'", "OC-12"),
    ("'OC-13', 'True Carryover validation (Baselined check + cap)', '5.3', 'To be built', 'None'",
     "'OC-13', 'True Carryover: baselined + Must Do to P2, rest to P4', '5.3, App A', 'BUILT v4.5', 'None'", "OC-13"),
    ("'OC-14', 'True Carryover baseline view in Demand Overview', '4.1 Sec 5', 'To be built', 'OC-13'",
     "'OC-14', 'Carryover baseline view in Program AOP Scenarios', '4.2', 'BUILT v4.5', 'OC-13'", "OC-14"),
    ("'OC-15', 'Merit-based Sustain (not auto-100%)', '5.4', 'To be built', 'OC-02'",
     "'OC-15', 'Sustain first then Hygiene by merit in P3', '5.4', 'BUILT v4.5', 'OC-02'", "OC-15"),
]:
    patch(old, new, label)

# 4. Add OC-18/19 after OC-17
patch(
    "['OC-17', 'Option A vs B comparison mode', '5.5, 4.6', 'Conference decision', 'Q4'],\n    ])",
    "['OC-17', 'Option A vs B comparison mode', '5.5, 4.6', 'Conference decision', 'Q4'],\n        ['OC-18', 'Quantified Benefit textual scoring', 'App B, 5.7', 'To be built', 'Byronie'],\n        ['OC-19', 'Textual score validation on data refresh', 'App B', 'To be built', 'OC-18'],\n    ])",
    "Add OC-18/19"
)

# 5. Insert Appendix sections before doc.save
SAVE_LINE = "doc.save(OUT)"
APPENDICES = r"""
# === APPENDIX A ===
h1(doc, 'Appendix A: Demand Classification Logic')
p(doc, 'Every programme is classified to exactly one of four priorities. The classification is deterministic and data-driven.')

h2(doc, 'A.1 Classification Rules')
tbl(doc,
    ['Priority', 'Gate', 'Source Fields', 'Condition'],
    [
        ['P1', 'CCB Exception', 'Item No.', 'ID is EW-11, EW-65 or EW-71'],
        ['P1', 'LFR Evidence', 'Overall AOP Decision + LFR Name + LFR Year', 'Decision = must-do P1/P2 AND Name non-empty AND Year non-empty'],
        ['P2', 'True Carryover', 'New/Carry-over + Category + Baselined + Priority', 'Carry Over AND not Decomm AND Baselined > 0 AND Must Do/Must Have'],
        ['P3', 'Sustain', 'New/Carry-over', 'Change & Sustain'],
        ['P3', 'Hygiene', 'Category', 'Continuous Improvement OR Upgrades & Enhancements'],
        ['P4', 'Default', '(catch-all)', 'Everything not matching above'],
    ])

h2(doc, 'A.2 What Goes to P4')
b(doc, 'LFRs with P1/P2 decision but missing compliance name or year')
b(doc, 'Carry-overs without Carry Over Baselined amount')
b(doc, 'Carry-overs with baseline but not Must Do or Must Have')
b(doc, 'New features, AI enablement, decommissioning, and all unrecognised categories')

h2(doc, 'A.3 Dynamic Bucket Summary')
p(doc, 'Bucket counts and demands are computed from source data on every refresh. They are never hardcoded. The four buckets always sum to total programme demand.')

# === APPENDIX B ===
h1(doc, 'Appendix B: Quantified Benefit Textual Scoring \u2014 Recommendation')
p(doc, 'The current Submitted Benefit component (50 pts) uses only the numeric benefit/cost ratio. Programmes with strong qualitative cases but no K\u20ac figure score 0/50.')

h2(doc, 'B.1 Proposal: Textual Benefit Score (0\u201310 points)')
tbl(doc,
    ['Score', 'Criteria', 'Example'],
    [
        ['10', 'Specific measurable impact with timeline', 'Reduces patient wait time 30% by Q2 2027'],
        ['7', 'Clear impact with named beneficiary', 'Improves compliance posture for EU AI Act'],
        ['4', 'General benefit with context', 'Supports digital transformation strategy'],
        ['2', 'Vague or generic statement', 'Good for the business'],
        ['0', 'No text or repeats programme name', 'N/A or blank'],
    ])

h2(doc, 'B.2 Scoring Evaluation Criteria')
b(doc, 'Specificity: names a concrete outcome (metric, process, capability)')
b(doc, 'Measurability: includes quantities, percentages, timeframes, KPIs')
b(doc, 'Beneficiary: identifies who benefits (customer, patient, BU, function)')
b(doc, 'Strategic alignment: references recognised theme (AI, compliance, sustainability)')
b(doc, 'Uniqueness: substantively different from programme name and problem statement')

h2(doc, 'B.3 Integration Options')
p(doc, 'Option 1: Extend Submitted Benefit to 60 points (50 numeric + 10 textual). New weights: 60/20/12/8.', True)
p(doc, 'Option 2: Add a 5th component "Qualitative Benefit" worth 10 points. New weights: 45/22/13/10/10.', True)

placeholder_box(doc, 'Textual Benefit Scoring \u2014 Discussion with Byronie',
    'Pending items:\n'
    '1. Extend Submitted Benefit (Option 1) or new component (Option 2)?\n'
    '2. Minimum text quality threshold to avoid gaming?\n'
    '3. Apply to all programmes or only those with zero numeric benefit?\n'
    '4. Who validates textual scores \u2014 PMO, programme owners, or automated?\n'
    '5. Interaction with existing Captured Consequence component?\n'
    '6. Should the rubric be visible in the dashboard?\n\n'
    'Final model to be confirmed after discussion with Byronie.')

h2(doc, 'B.4 Validation')
b(doc, 'Re-score on every data refresh from current text')
b(doc, 'Deterministic: same text = same score')
b(doc, 'Flag changes > 3 points on refresh')
b(doc, 'Display alongside numeric score in merit breakdown')

"""

if SAVE_LINE in src:
    src = src.replace(SAVE_LINE, APPENDICES + "\n" + SAVE_LINE)
    ok += 1; print("  [OK] Appendices A + B added")
else:
    print("  [FAIL] doc.save not found")

# 6. Add TOC after intro
INTRO_END = "p(doc, 'The One Portfolio Dashboard brings together"
idx = src.find(INTRO_END)
if idx >= 0:
    line_end = src.find("\n", src.find("spend.')", idx))
    TOC = """
h1(doc, 'Document Navigation')
p(doc, 'Sections in this document:')
tbl(doc,
    ['#', 'Section', 'Key Content'],
    [
        ['1', 'Product Outcome', 'Measurable outcomes and evidence'],
        ['2', 'Users and Decisions', 'Stakeholders and their decisions'],
        ['3', 'Navigation and Workflow', 'Six-tab workflow, cross-tab data flow'],
        ['4', 'Per-Tab Specification', 'Detailed spec for all 6 tabs'],
        ['5', 'Prioritisation Engine', 'Four-priority classification, levers, funding order'],
        ['6', 'Operations Data Model', 'Bill of IT, TCO allocation'],
        ['7', 'Design Specification', 'Colors, fonts, layout'],
        ['8', 'Finance Calculation Model', 'Charge-out types, reconciliation'],
        ['9', 'Open Questions', 'Conference decisions needed'],
        ['10', 'Release Acceptance', 'QA criteria'],
        ['11', 'Outstanding Changes', 'OC register with status'],
        ['A', 'Appendix A', 'Demand Classification Logic (rules + catch-all)'],
        ['B', 'Appendix B', 'Quantified Benefit Textual Scoring recommendation'],
    ])
p(doc, '')
"""
    src = src[:line_end+1] + TOC + src[line_end+1:]
    ok += 1; print("  [OK] Table of Contents added")
else:
    print("  [FAIL] Intro not found for TOC")

# Write
with open('C:/Users/320126040/Documents/Codex/AOP2027/PRD/create_prd_v45b.py', 'w', encoding='utf-8') as f:
    f.write(src)
print(f"\nPatches: {ok}")
print(f"Script: {len(src)} chars")
