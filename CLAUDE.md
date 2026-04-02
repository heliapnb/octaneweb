# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OctaneWeb is a single-file clinical decision support web application (v2.1) for hereditary cancer / HCT (Hematopoietic Cell Transplantation) workflows. The entire application lives in **`index.html`** — HTML, CSS, and JavaScript are all embedded in that one file.

## Running the App

No build step or install required. Open directly in a browser:

```bash
open index.html
# or serve locally if CORS matters:
python3 -m http.server 8000
```

## Architecture

The app has two tabs, each a self-contained clinical workflow:

1. **Eligibility Criteria** — Patient lookup for HCT eligibility based on hereditary cancer diagnosis. Driven by `dxCategories` and `dxMapping` data objects that map ~30 diagnosis types to 5 syndrome categories (HBOC, Lynch, Gastric, Renal, Prostate), each with their own eligibility criteria checklist.

2. **Germline Confirmation** — Variant classification decision support. Takes a gene + cDNA variant notation, applies local logic from `highRiskGenes` / `geneContexts` data objects, then optionally calls the **Google Gemini 2.5 Flash API** to look up ClinVar/Franklin classifications. Returns RECOMMENDED / REVIEW / NOT RECOMMENDED.

### Key JavaScript Functions

| Function | Tab | Purpose |
|---|---|---|
| `selectDx()` | 1 | Loads diagnosis-specific questionnaire |
| `calcElig()` | 1 | Evaluates checked criteria → eligibility result |
| `handleGermlineChange()` | 2 | Updates UI when gene is selected |
| `runGermlineLogic()` | 2 | Core recommendation decision tree |
| `lookupClassification()` | 2 | Calls Gemini API for variant lookup |
| `switchTab()` | Both | Tab navigation |

### External Dependencies (CDN only)

- Tailwind CSS — `cdn.tailwindcss.com`
- Font Awesome 6.0.0 — `cdnjs.cloudflare.com`
- Google Gemini API — called from `lookupClassification()` using `const apiKey = ""` (must be set before use)

### Data

All clinical data is hardcoded in JavaScript objects at the top of the `<script>` block:
- `dxCategories` / `dxMapping` — diagnosis → syndrome category mapping
- `highRiskGenes` — 40+ genes with high-risk flags
- `geneContexts` — per-gene context-specific recommendation rules
- `allGenes` — autocomplete list of 81+ genes

## Important Constraints

- **Single-file rule:** All code stays in `index.html`. Do not introduce external JS/CSS files or a build system unless explicitly requested.
- **No patient data persistence:** The app is intentionally stateless — no localStorage, no backend, no cookies.
- **Clinical accuracy matters:** Changes to eligibility criteria logic or germline recommendation rules must be treated carefully. The data objects (`dxCategories`, `geneContexts`, etc.) reflect clinical guidelines — don't modify them without explicit instruction.
