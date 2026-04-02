# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OctaneWeb is a clinical decision support web application (v2.1) for hereditary cancer / HCT (Hematopoietic Cell Transplantation) workflows. It is a static site with no build step — plain HTML, CSS, and JavaScript split across multiple files.

## Running the App

No build step or install required. Open directly in a browser:

```bash
open index.html
# or serve locally if CORS matters:
python3 -m http.server 8000
```

## Architecture

```
index.html          — HTML structure and layout only
js/eligibility.js   — Eligibility tab: clinical data + all eligibility logic
js/germline.js      — Germline tab: clinical data + all germline logic
js/app.js           — Shared tab navigation (switchTab)
resources/          — Source PDFs for clinical criteria reference
```

The three JS files are loaded at the bottom of `index.html` in order: `eligibility.js` → `germline.js` → `app.js`. All functions are global scope (no modules/bundler).

### Tab 1 — Eligibility Criteria (`js/eligibility.js`)

Maps a patient diagnosis → syndrome category → CCO eligibility checklist. Any single checked criterion confirms eligibility (OR logic).

Key data objects:
- `dxMapping` — 8 diagnoses mapped to 5 syndrome categories (HBOC, Lynch, Gastric, Renal, Prostate)
- `dxCategories` — criteria list per category

Key functions:
- `selectDx()` — loads the criteria checklist for the selected diagnosis
- `calcElig()` — evaluates checkbox state → CONFIRMED / NOT MET / pending
- `resetEligibility()` — clears the questionnaire

### Tab 2 — Germline Confirmation (`js/germline.js`)

Takes a gene + cDNA variant notation, applies local decision logic, and returns RECOMMENDED / REVIEW CONTEXT / NOT RECOMMENDED.

Key data objects:
- `highRiskGenes` — 40+ genes that are unconditionally recommended
- `geneContexts` — per-gene lists of clinical contexts that gate the recommendation
- `allGenes` — full autocomplete list (81+ genes)

Key functions:
- `handleGermlineChange()` — updates context checkboxes when gene changes
- `runGermlineLogic()` — core decision tree for the recommendation

### External Dependencies (CDN only)

- Tailwind CSS — `cdn.tailwindcss.com`
- Font Awesome 6.0.0 — `cdnjs.cloudflare.com`

## Important Constraints

- **No patient data persistence:** The app is intentionally stateless — no localStorage, no backend, no cookies.
- **Clinical accuracy matters:** Changes to eligibility criteria logic or germline recommendation rules must be treated carefully. The data objects (`dxCategories`, `geneContexts`, etc.) reflect clinical guidelines — don't modify them without explicit instruction.
