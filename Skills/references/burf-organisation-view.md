# BURF organisation view | v5.2

## What a BURF is

BURF stands for Business Unit, Region or Function — the organisational entity that submits and owns a demand request. Every programme row has an `Organization setting demand [BU, Region, CoE]` field that maps it to a BURF. The BURF is the primary grouping unit across all programme tables.

Examples: Precision Diagnosis, Image Guided Therapy, Connected Care, Personal Health, Innovation & Design, North America Region, International Region, Greater China Region.

## How tables are organised by BURF

## ExCo accountability hierarchy (v5.2)

Above the BURF level, every organisation maps to one of 16 ExCo members. The Demand Split table on Tab 1 and the Trade-off Cockpit on Tabs 3/4 use collapsible ExCo groups:

```
▶ Julia Strandberg (CC)  (28/55)    Requested 22.1   Prioritised 12.4   Gap 9.7   82% Funded   Hard 15.2   Soft 3.1
  ├── HPM              (12/25)    8.2              4.8               3.4
  ├── AM&D             (9/18)     7.1              4.2               2.9
  └── SRC              (7/12)     6.8              3.4               3.4
```

Each ExCo row shows: programme count, requested M EUR, prioritised M EUR, gap M EUR, % funded, hard benefits, soft benefits, and operations cost (Tab 1 only).

16 ExCo members mapped to all 35 organisation values:
- **BU Leaders (10)**: Deeptha Khanna (PH), Shez Partovi (EI/I&D), Julia Strandberg (Connected Care: HPM, AM&D, SRC), Jie Xue (PD: CT, DXR, MR, PDU), Bert van Meurs (IGT-S, IGT-D, STO), Wim Appelo (ISC, STET-ISC), Ozlem Fidanci (IR, H&S), Jeff DiLullo (NAM), Ling Liu (GCR), Charlotte Hanneman (Finance, Security).
- **Enterprise Function Leaders (6)**: Laura Matz (IT), Heidy Schein (People), Steve C de Baca (PS&Q), Carla Silva Peron (Medical), Filip Koek (Audit), Marnix van Ginneken (Legal, Comms, IP&S).

All programme tables (EW, BU, Overview, Prioritized, Unfunded) use a **collapsible BURF group** layout:

```
▶ Precision Diagnosis  (12/25)     Healthy   62.3   Requested 15.2   Prioritised 8.4   ...
  ├── EW-42 Programme Alpha        Healthy   71.0   2.1              2.1
  ├── EW-43 Programme Beta         Contain   58.2   1.8              0.0
  └── ...
▶ Image Guided Therapy (8/18)      Mixed     55.1   ...
```

Tables open **collapsed by default** — you see only the BURF summary rows. Click the triangle to expand and see individual programmes.

## Reading the BURF summary row

Each collapsed BURF row aggregates its child programmes:

| Column | What it shows | Example |
|--------|--------------|---------|
| **Identity** | BURF name + `(funded/total)` count | `Precision Diagnosis (12/25)` |
| **Decision Band** | Representative band across children | `Healthy`, `Contain`, or `Mixed` with breakdown |
| **Score** | Average merit score of children | `62.3` with "Average merit" label |
| **Requested (M€)** | Sum of all children's requested amounts | `15.2` with "Avg 0.6" |
| **Prioritised (M€)** | Sum of funded amounts | `8.4` with "Avg 0.3" |
| **Unfunded (M€)** | Sum of unfunded gaps | `6.8` with "Avg 0.3" |
| **Hard Benefits (M€)** | Sum of hard benefit claims | `85.2` with "Avg 3.4" |
| **Soft Benefits (M€)** | Sum of soft benefit claims | `35.3` with "Avg 1.4" |
| **Evidence** | Count with numeric benefit claims | `18 of 25 numeric claims` |
| **Funding status** | Funded/unfunded split + holds | `12 funded · 13 unfunded; 2 partial scope` |

## Filter context in BURF totals (v4.6)

When filters are active, the **total row** (table footer) switches from averages to "X of Y" format:

| State | Identity | Requested | Prioritised |
|-------|----------|-----------|-------------|
| No filter | `(69/180)` | `111.7 Avg 0.7` | `48.9 Avg 0.3` |
| Filtered | `(1/3 of 180)` | `0.8 of 111.7` | `0.2 of 48.9` |

This gives immediate context: what fraction of the full portfolio you are viewing. The denominator is always the unfiltered baseline.

## BURF sorting

BURF groups are sorted by **descending average merit score**, then alphabetically. This puts the highest-quality demand at the top. Within each BURF, programmes follow the engine's funding-order ranking.

## Using BURFs for analysis

### Which BURFs are well-funded?
Compare funded/total counts across BURFs. A BURF showing `(2/25)` has most of its demand unfunded — investigate whether this is evidence quality, low merit, or envelope constraints.

### Which BURFs have evidence gaps?
The evidence column shows `X of Y numeric claims`. If X is much lower than Y, that BURF has many programmes without quantified benefits, which depresses merit scores and blocks automatic funding.

### Which BURFs have holds?
The funding status cell shows partial scope and evidence/eligibility holds. BURFs with many holds need evidence review before their programmes can be automatically funded.

### Cross-tab BURF comparison
The same BURF appears in EW tab, BU tab, and Overview. Use Overview for the combined picture. Use the organisation filter to isolate one BURF across all its programmes.

## BURF in Operations

The Operations tab uses a similar hierarchy but with a different structure:

```
▶ Precision Diagnosis  (5 sub-orgs)    Total: 85.2 M€    Own: 52.1    Regions: 18.3    Functions: 14.8
  ├── CT/AMI                            12.3 M€
  ├── DXR                               8.7 M€
  └── ...
    └── Service: CT Reconstruction       0.4 M€
```

Operations BURFs are **BU clusters**, not individual programme submitters. Each cluster breaks down into sub-organisations, and each sub-org into services from the service catalog.

## BURF in Demand Overview

The `ExCo Demand Split` table on Tab 1 (v5.2) replaces the flat organisation list with collapsible ExCo groups. Each ExCo row shows:
- Programme count, requested M€, prioritised M€, gap M€
- % funded (colour-coded)
- Hard benefits and soft benefits (separately)
- Operations cost (from TCO, at cluster level)
Click to expand constituent organisations.

This is the quickest way to see which organisations have the largest combined IT footprint.
