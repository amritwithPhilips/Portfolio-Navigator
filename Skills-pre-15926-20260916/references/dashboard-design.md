# Dashboard design and interaction

## Preserve Philips styling

Use the provided AOP 2027 IT Portfolio Tradeoff Dashboard as the visual source of truth. Retain its header, tab structure, cards, organisation groups, bubble chart, compact tables, typography and spacing. The existing local font stack is Neue Frutiger World / Frutiger, Calibri, Segoe UI and Arial. Reuse the palette: blue #0B5ED7, dark blue #00126E, light blue #BDF0FF, background #FAFBFC, white cards, borders #D5DAE0 and supporting green/amber/red merit colours. Do not fetch a replacement logo or add a new visual theme.

Retain BU Led, EW Led, Total Portfolio and AOP2027 Scenario Modelling navigation. Use full business terms in explanations and executive text. Numeric monetary values are M€ with consistent three-decimal display and full internal precision. Raw evidence can retain its original text and units under a clearly labelled source description.

## Scenario Modelling

1. Show the three named presets, their business purpose and the recommended baseline.
2. Show envelope, protected percentage, Change and Sustain percentage, regional percentage, hygiene percentage, carry-over threshold and minimum merit. Pair sliders with numeric inputs. Include completed-waste and explicit unused-hygiene-release choices.
3. Keep scoring weights/tiers in a collapsed configuration area with clear scales and validation. Applying them recalculates all views.
4. Show business-led and enterprise-wide allocation as outputs of the common envelope. Do not reintroduce separate hard ceilings or strategic business-unit earmarks.
5. Show regional allowance, earlier regional funding, remaining capacity and final regional usage. Show hygiene reservation and total qualifying coverage including earlier protected work.
6. Update executive summary for all control and program decisions: allocation, selected count, unallocated amount, unspent reservation, freely available amount, demand unfunded, reporting split, usable submitted benefit and evidence conditions.
7. Show funding-stage amounts as a stacked bar and a labelled legend. Never stack an overlapping reporting classification as an additional allocation.
8. Offer scenario comparison, save/open, portable session export/import, a clear manual-decision list and source refresh.

## Portfolio views

Keep the score/requested-investment bubble chart and grouped organisation/program table. Bubble size reflects request; colour can show merit band or funding status. The dashed merit line is explicitly the eligibility threshold. Users can search and filter by organisation, platform, demand type, funding status and evidence flags. Unnamed/no-request records remain visible with no automatic funding.

Opening a program shows source reference, original evidence, component scores, validity, risk, all nine waste ratings, problem, scope, dependency, hygiene evidence and reason for its outcome. Selected/unselected outcomes must remain distinguishable from merit bands. A high score alone never implies protection.

Checkboxes and prioritized-amount edits open a review form. Require a reason and applicable review acknowledgements. Apply changes through the shared engine. A protected request can have a percentage funding edit while retaining its obligation gap. Show pending manual inclusions if reservations or budget prevent allocation.

Provide CSV decision exports and an explicit demand-refresh template. Label actual CSV files as CSV/downloads, not Excel workbooks. Sessions should include demand version, source evidence, settings, scoring and manual decisions. Keep older saved scenarios from silently applying to a different source version.

## Interaction quality

Use labelled controls, keyboard-operable tabs and program details, visible focus, native dialog close/Escape and status messages. Tables scroll within their containers. Stack controls on small screens; no page-level horizontal overflow. Escape source text before inserting HTML. Offline use must not require network libraries or transmit demand data.

## Acceptance checks

- Match all three approved reference scenarios row by row before interface testing.
- Test at least five settings including an envelope constraint and a reservation/coverage change.
- Test includes, excludes, protected percentage edits, above-five-times acknowledgement and changed source evidence.
- Reconcile every financial view and verify all records remain represented.
- Verify saving/reloading, session export/import and unchanged demand-refresh round trips.
- Check the three preset comparisons, all tabs, grouped totals, exports, desktop and mobile layouts and browser errors.
- Preserve the initial framework's evidence limits: no “globally optimized” claim, no invented benefit and no implied final compliance approval.
