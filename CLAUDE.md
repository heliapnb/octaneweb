# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OctaneWeb is a clinical decision support web application (v2.1) for hereditary cancer / HCT (Hematopoietic Cell Transplantation) workflows. It is a static site with no build step — plain HTML, CSS, and JavaScript split across multiple files.

## Running the App

No build step or install required. Serve locally — the ClinVar lookup makes
cross-origin requests that fail when opening the file directly:

```bash
python3 -m http.server 8000
```

## Deployment / Publishing

The repo is **public**. The live app is served by GitHub Pages from the `live`
branch at **https://heliapnb.github.io/octaneweb/**.

- **All work happens on `main`.** Commit there as normal; pushing `main` does
  *not* change the live site.
- **Publish only when the user explicitly asks.** To publish, merge `main` into
  `live`, push `live`, then switch back to `main`:

```bash
git checkout live && git merge main && git push origin live && git checkout main
```

`resources/` is gitignored, so the source PDFs, reference papers, and the HHM
Word document are not in the public repo — keep it that way (several are
copyrighted publisher PDFs).

## Architecture

```
index.html          — HTML structure, all CSS, and the prototype disclaimer
js/eligibility.js   — Eligibility tab: criteria data, synonyms, search logic
js/germline.js      — Germline tab: gene data, ClinVar lookup, decision logic
js/hematologic.js   — Hematologic tab: HHM panel matrix, features, specimen rules
js/workflow.js      — Local Workflow tab: editable flowchart model, evaluation, validation, saving
js/ui.js            — DOM rendering for the eligibility, germline and hematologic tabs (no clinical logic)
js/workflow-ui.js   — Local Workflow tab DOM: decision tree, editor, save/load
js/app.js           — Prototype disclaimer + tab navigation (switchTab)
resources/          — Source PDFs/criteria documents (gitignored, local only)
```

Scripts load at the bottom of `index.html` in order: `eligibility.js` →
`germline.js` → `hematologic.js` → `workflow.js` → `ui.js` → `workflow-ui.js` →
`app.js`. All functions are global scope (no modules/bundler). Data and pure logic
live in the domain files; `ui.js` and `workflow-ui.js` own everything that touches
the DOM.

### Tab 1 — CCO Eligibility Criteria (`js/eligibility.js`)

Maps a patient diagnosis → category → CCO eligibility criteria list. Criteria are
shown as bullets with a single Yes/No question (OR logic — any one criterion
confirms eligibility). Based on **Hereditary Cancer Testing Eligibility Criteria
v4.0 (June 2026)**.

Key data objects:
- `dxMapping` — 46 diagnoses mapped to 14 categories
- `dxCategories` — criteria list per category (breast/ovarian/prostate/biliary/
  pancreatic share one merged list, mirroring v4.0)
- `dxSynonyms` — everyday terms and abbreviations for search

Key functions:
- `searchDiagnoses()` — ranks matches: name → synonym → criteria text
- `selectDx()` / `calcElig()` (in `ui.js`) — render criteria and the verdict

### Tab 2 — Solid Tumour Variants, Germline Confirmation (`js/germline.js`)

Takes gene + cDNA variants, looks each up in ClinVar, and returns RECOMMENDED /
REFER TO CLINICAL JUDGEMENT (NF1 only) / NOT REQUIRED by walking the **OCTANE solid-tumour flowchart** (source:
`OCTANE criteria/OCTANE flowchart.pptx`, outside this repo): P/LP tumour variant →
main gene list or known founder variant → age-dependent genes (≤30y, then Box A
or clinical suspicion) → any other clinical suspicion. CCO eligibility is not
asked here — that lives in Tab 1.

Key data objects:
- `mainGenes` — main list; entries with a `question` (CDH1 not breast, MEN1
  NSCLC only, MUTYH biallelic, VHL not renal, NF1 manifestations/associated
  tumour/suspicion) only qualify on that answer; NF1's "no" ends in CLINICAL
  JUDGEMENT (`judgementText`); `note` holds footnotes (POLE, SMAD3)
- `endorsement()` — builds rationale naming who recommends ("ESMO and CCO
  recommend…"); ASCO's softer tiers (`ascoMayOffer`, `ascoLessConservative`) get
  their own sentence, and UKCGG Category 2/3 genes are not counted as recommenders
- `ageGenes` — APC, CDKN2A, PTEN, RB1, SMARCA4, TP53 (TP53 brain tumours skip
  the age criterion); `boxA` — their any-age contexts
- `otherGenes` — autocomplete/italics only; no special rules
- `Q_*` — shared flowchart questions
- `REFS` — sources (ESMO 2022, CCO v4.0, ASCO 2024, UKCGG/CanVIG 2026). Each
  recommendation cites only the guidelines that cover it: `ALL_SOURCES` by
  default, per-gene `refs` overrides, `ageGeneRefs`, `BRAIN_REFS`, and
  `boxA[gene].refs`. Founder-variant and clinical-suspicion recommendations cite
  CCO (tumour-detected variant section; General Criterion 6, clinical judgement).
- `ukcggCategory2/3` + `ukcggCaveat()` — UKCGG 2026 routinely recommends follow-up
  only for its Category 1 genes; when UKCGG is cited for a Category 2/3 gene, its
  "not routinely recommended" / "unlikely to be indicated" position is added as a note.
  `refHtml()` renders a source without a `url` as an unlinked chip.

Key functions:
- `lookupSingleVariant()` — ClinVar esearch + esummary (germline classification
  only; exact cDNA title match required)
- `evaluateVariant()` — walks the flowchart; returns the questions that apply
  (rendered as Yes/No in the variant card) and the result
- `variantNeedsCard()` (in `ui.js`) — a variant card only shows while input is
  needed (loading, manual P/LP review, flowchart questions); otherwise the
  summary table (whose ClinVar pill links to the record) covers it

### Tab 3 — Solid Tumour Variants, Local Workflow (`js/workflow.js`, `js/workflow-ui.js`)

An editable copy of the Tab 2 flowchart. Tab 2 is never changed by it. The tree's
shape is fixed (P/LP → main list or founder → age-dependent list → age cutoff →
Box A / clinical suspicion); users edit what is inside: genes in each list, per-gene
conditions (`CONDITION_TYPES`: tumour only / excluding / age ≤ N / custom yes-no
question; AND logic; on fail continue or clinical judgement), the age cutoff, the
age-criterion exception and Box A, and local notes.

- `originalWorkflow()` — the built-in flowchart as a workflow (from `mainGenes`,
  `ageGenes`, `boxA` + `originalConditions`). Unedited, `evaluateWorkflowVariant()`
  must give exactly the same questions and results as `evaluateVariant()` for every
  gene and answer path — re-check this after changing either.
- Guideline rationale/citations are used only for genes whose rule matches the
  built-in one (`mainRuleIsOriginal`, `ageExclusionIsOriginal`, `boxAIsOriginal`,
  compared against germline.js, never taken from the file). Anything edited or added
  cites "Local workflow: <name>" instead. `workflowDifferences()` lists every change
  and is shown in the tree and above the results (so the PDF records it).
- `validateWorkflow()` checks every uploaded file, browser-stored workflow and Apply.
  All workflow text is user-supplied: escape it (`escHtml`) before it reaches HTML.
- Saving: "Download file" / "Load file" (JSON, `format: octane-solid-tumour-workflow`,
  `schema: 1`), plus saved workflows and a default in `localStorage`
  (`octane.localWorkflows.v1`). No accounts.
- The Run variants view reuses the germline UI in `ui.js` through `germlineViews`
  (`std` = Tab 2, `local` = this tab); each view has its own ids, states, evaluator.

### Tab 4 — Hematologic Malignancies (`js/hematologic.js`)

Panel selection for hereditary hematologic malignancy (HHM).

Key data objects:
- `hhmMatrix` — diagnosis × family-history level → recommended panel
- `hhmFeatures` — targeted history features that add genes
- `hhmSpecimenScenarios` — specimen selection (priority skin > buccal > blood)

Key functions:
- `computeHHMColumn()` — derives the family-history column from answers
- `computeHHM()` / `computeHHMSpecimen()` — panel and specimen recommendations

### External Dependencies

- Font Awesome 6.0.0 (`cdnjs.cloudflare.com`) — icons in the germline tab only
- NCBI E-utilities (ClinVar) — called directly from the browser, no API key.
  Throttled to ≥400 ms between requests (`ncbiFetch`).

All fonts and styling are local CSS in `index.html`; there is no Tailwind.

## Important Constraints

- **No patient data persistence:** No backend, no cookies, and nothing about patients
  is ever stored. The one exception to "no localStorage" is the Local Workflow tab,
  which stores workflows (rules only, never patient data) — keep it that way.
- **Clinical accuracy matters:** Changes to eligibility criteria logic or germline recommendation rules must be treated carefully. The data objects (`dxCategories`, `contextGenes`, `hhmMatrix`, etc.) reflect clinical guidelines — don't modify them without explicit instruction.
- **Prototype disclaimer:** A "not for clinical use" modal shows on every load. It lives in `index.html` and its dismiss button removes the node inline, so it works even if scripts fail — keep that property.
