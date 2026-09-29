---
name: aop-modeler
description: AOP 2027 IT Portfolio Scenario Modelling tool — v5.6 current build. Use when making changes to the modeler HTML, understanding the tab structure, IT Simplification lever, KPI layouts, popup specs, or build conventions.
---

# AOP 2027 Modeler — v5.6 Current Build

## Current File

`AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v5.6.html`

This is the current working version. All future builds MUST branch from this file (copy to a new version, e.g., v5.7.html). The v5.1.1 golden baseline is frozen at `AOP2027-IT-Portfolio-Scenario-Modelling-v5.1.html` — never modify it.

## Architecture

Single standalone offline HTML file (~20K lines). No server, no database. Three IIFEs:

1. **Engine IIFE** (~lines 18400–19200): `AOP.normalize()`, `AOP.solve()`, `enrich()`, `stage()`, `isITSimpProgram()`, `consequence()`, `classifyBenefit()`, merit scoring.
2. **UI IIFE** (~lines 19200–19560): `render()`, `stream()`, `controls()`, `filters()`, `demandInScenario()`, `excoTradeoffPanel()`, `details()`, `chart()`, event delegation.
3. **One Portfolio IIFE** (~lines 19560–20480): MutationObserver on `#main`, Tab 6 KPI replacement, Org IT Cost Allocation, TCO mapping.

## Six-Tab Structure

| Tab | Name | data-tab | Editable | Render function |
|-----|------|----------|----------|-----------------|
| 1 | Demand Overview | `demand` | No | `window.renderDemandOverview()` |
| 2 | Program AOP Scenarios | `scenario` | Levers | `scenario()` + `controls()` |
| 3 | Functions & Regions | `ew` | Yes | `stream('ew')` |
| 4 | BU Led | `bu` | Yes | `stream('bu')` |
| 5 | Operations | `operations` | No | `window.renderOperationsTab()` |
| 6 | One Portfolio | `overview` | No | `stream('overview')` + MutationObserver |

## KPI Layout Spec (v5.1.1)

### Tab 1 — Demand Overview
Single row of 5 cards (`grid-template-columns: repeat(5,1fr)`):

1. **Total IT AOP Demand** — `class="kpi dark"`, blue background, white text
2. **Program Demand** — `class="kpi"`, white card, blue number
3. **Operations Demand** — `class="kpi"`, white card, blue number
4. **Committed Benefits** — `class="kpi"`, white card, NO `<strong>` wrapper:
   - Line 1: `<div>` with Hard number (blue/--dk, 22px, font-weight:300) + "Hard" (black, 13px)
   - Line 2: `<div>` with Soft number (black, 22px, font-weight:300) + "Soft M€" (black, 13px)
5. **IT AOP 2026** — `class="kpi"`, white card, blue number (`color:var(--dk)`), black sub-text

**Removed from v5.2**: Second KPI row, 2026 Program AOP tile, 2026 Operations AOP tile.

### Tabs 3 & 4 — Stream KPIs
6 KPI cards via `stream()` function. The last card is Committed Benefits:
- Built as raw HTML (not via `kpi()` helper, which escapes HTML)
- Same blue Hard / black Soft format as Tab 1
- Sub-text: `rows.filter(r=>r.final>0).length + ' funded programs'`

### Tab 6 — One Portfolio
5 KPI cards set by MutationObserver (`repeat(5,1fr)`):
1. Total IT AOP (dark), 2. Operations AOP, 3. Prioritized Program AOP (green), 4. Split of Program AOP, 5. Committed Benefits (blue Hard / black Soft)

## Programme Detail Popup (v5.1.1)

Function: `details(id)` in UI IIFE. Opens `<dialog id="modal">`.

Layout (top to bottom):
1. **Name header** — `<h2>` with programme name, 17px
2. **ID line** — `<p>` with ID, stageName, status (bold)
3. **Demand / Prioritised** — side-by-side `<div>` with 20px numbers: Demand (--dk color) | Prioritised (--blue color)
4. **Details heading** — "Details" h3 with bottom border
5. **Details table** — 7 rows, 2 columns (label 40% width, value):
   - Priority
   - Benefit (Quantitative)
   - Benefit (Qualitative)
   - Payback Period
   - Problem Statement
   - Program Scope
   - Impact and Cost of Not Doing
6. **Merit Score heading** — "Merit Score — {score}" h3 with bottom border
7. **Score breakdown table** — 5 components + Total row (same as v5.2)
8. **Funding Rationale heading** — "Funding Rationale — {type}" h3 with bottom border
   - Type: "Default Logic" (no override) or "User Prioritised" (has override)
   - Reason text as `<p>`
9. **Source reference** — sheet + row + version, 10px, text3 color

Data source fields: `r.priority`, `r.benefit`, `r.benefitDetails`, `r.paybackYears`, `r.problem`, `r.scope`, `r.impact`, `r.override`, `r.reason`, `r.rawComponents[]`, `r.components[]`, `r.score`

## Filter Toolbar

Tab 6 (overview scope): NO Download Excel button. Filter row ends with Clear button only.
Tabs 3 & 4 (ew/bu scope): Download Excel button present (primary style).

## Key CSS Variables

```
--dk: #00126E (Philips dark blue)
--blue: #0B5CD5
--lt: #D6E4F7
--mist: #EBF0F5
--bg: #F4F7FA
--prot: #27934C (green — used for funded/positive indicators)
--disc: #FFBE2C (amber — used for partial/warning indicators)
--weak: #D43F44 (red — used for danger/over-budget)
```

## Build Conventions

1. Always update `CHANGELOG.md` when modifying the modeler
2. Version naming: `v{major}.{minor}.{patch}` (e.g., v5.6.0)
3. PRD and Requirements docs live in `PRD/` directory; Skill refs in `Skills/references/`
4. Dev server: `python -m http.server {port} --directory "AOP 2027 Modeler"`; launch.json entry "v5.6-modeler" on port 8783
5. The `kpi()` helper function escapes HTML via `esc()` — use raw HTML `<div class="kpi">` for cards that need inline styling (like Committed Benefits)
6. Tab switching uses `data-tab` attribute and delegated click handler on `document`
7. IndexedDB store: `Philips-AOP2027-v5.1` with `scenarios` object store (unchanged across v5.x)
8. IT Simplification lever: always validate engine changes against Node.js `--check` on the extracted main script before committing (encoding issues can cause silent regex parsing failures)

## IT Simplification Lever (v5.6 — toggle-activated)

The 5th lever "IT Simplification" activates when `session.settings.itsimpMode = true`.

**Toggle**: Checkbox "IT Simplification Lever" in the Tab 2 scenario toolbar (purple accent when ON).

**Identification**: `isITSimpProgram(r)` — `const c=(r.category||'').toLowerCase(); return c.indexOf('decomm')>=0||c.indexOf('replatform')>=0;`
- Live data: 29 programmes with category "Decomm/Replatforming"

**Defaults**: `itsimp:{basis:'bucket',pct:0}` — no budget reserved by default. User can switch to % of Total AOP or Allocation (M€).

**Budget mechanics**: `itsimpReserve()` subtracts IT Simplification target from `valueTarget()` — Stage 3 cannot consume the IT Simplification envelope.

**Gate**: Funding Prioritization Gate conditionally shows Gate 5 "IT Simplification" with demand/funded/coverage stats only when `itsimpMode` is true.

**STAGES** (v5.6): `['Legal and Compliance (Must Do)','Carry Over demand','Sustain Engineering and Hygiene','Value Based Portfolio','IT Simplification']` — 5 entries; Stage 4 demand is 0 when toggle OFF.

## Levers Filter (v5.6)

`stageName` filter with label "Lever" added to:
- `filters(scope,rows)` → Tabs 3/4/6
- `demandInScenario()` filter row → Tab 2
- `portfolioInclusionTable()` filter row → Tab 2

Values: the stage names (e.g., "Legal and Compliance (Must Do)", "Value Based Portfolio", "IT Simplification").

## New Scenario (100M€) Button (v5.6)

Button in the Tab 2 savebar. Creates `AOP.createSession(session.data)` with `budget=100` and runs `autoLfrPct`. Clears all overrides, reviews, and ExCo trade-offs. Navigates to scenario tab.

## ExCo Trade-off Revert (v5.6)

- "Revert" button per-ExCo row in cockpit table — reverts stage-3/4 overrides for that leader only
- "Reset all trade-offs" button now also reverts ALL stage-3/4 programme overrides (not just pending inputs)
- Handler: `data-revert-exco="ExCo Name"` attribute on button; handled before main click delegation

## Data Model

443 demand programmes (EW 169, BU 274). 287.054 M€ total programme demand. Source hash: b26dd808... (SharePoint live workbook).
Operations: 469.7 M€ (167 services, pre-aligned).
Enterprise-wide charging row excluded from demand; stored as `ewChargingKey`.

Key enriched fields per programme row:
- `id`, `name`, `org`, `exco`, `stream` (ew/bu)
- `cost` (requested M€), `final` (prioritised M€), `benefit` (M€)
- `benefitClass` (hard/soft/qualitative/none), `benefitClassLabel`
- `score` (0-100 merit), `rawComponents[5]`, `components[5]`
- `stage` (0-4, stage 4 only when itsimpMode=true), `stageName`, `status`, `reason`
- `priority`, `problem`, `scope`, `impact`, `benefitDetails`
- `paybackYears`, `decisionBand`, `overall`
- `sourceValues[]` (all columns from source sheet)
- `override` (manual decisions), `review` (evidence reviews)

## ExCo Hierarchy

16 ExCo members mapped to 35 organisations via `EXCO_HIERARCHY` and `ORG_TO_EXCO`.
