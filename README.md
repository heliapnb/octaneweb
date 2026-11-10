# OctaneWeb — HCT Clinical Support Tool v2.1

A clinical decision support web app for hereditary cancer / Hematopoietic Cell Transplantation (HCT) workflows, built for Ontario Health – Cancer Care Ontario (CCO).

## What it does

**Tab 1 — Eligibility Criteria**
Search a patient's diagnosis and check which CCO criteria apply. Any single criterion confirms eligibility for hereditary cancer testing.

**Tab 2 — Germline Confirmation**
Enter a gene and variant (cDNA notation) to get a recommendation on germline confirmation of the tumour variant — RECOMMENDED or NOT REQUIRED — based on the OCTANE solid-tumour flowchart (informed by ESMO 2022, ASCO 2024 and CCO).

**Tab 3 — Local Workflow**
See the solid-tumour decision tree and edit it to match local criteria: add or remove genes, set or remove conditions for a gene, change the age cutoff or Box A. Run variants against your version; results and the PDF show which workflow was used and how it differs from the original. Save workflows on your computer (in the browser, with one as the default) or download them as a file to keep or share, and reset to the original at any time. No account needed, and nothing is sent anywhere.

**Tab 4 — Hematologic Malignancies**
Select a hematologic diagnosis and family history to see the recommended germline testing panel.

## How to run

No installation needed. Open `index.html` in a browser, or serve locally:

```bash
python3 -m http.server 8000
```

## File structure

```
index.html              — UI layout
js/eligibility.js       — Eligibility criteria data and logic
js/germline.js          — Germline confirmation data and logic
js/hematologic.js       — Hematologic malignancy panel logic
js/workflow.js          — Local workflow: editable flowchart, evaluation, saving
js/ui.js                — Page rendering for the eligibility, germline and hematologic tabs
js/workflow-ui.js       — Local workflow tab: decision tree and editor
js/app.js               — Tab navigation
resources/              — Source PDFs (CCO eligibility criteria, germline workflow)
```

## Clinical references

Eligibility criteria based on **Hereditary Cancer Testing Eligibility Criteria v3.0** (Ontario Health – Cancer Care Ontario, October 2022).

## Data sources

Variant classifications are retrieved from **NCBI ClinVar** (https://www.ncbi.nlm.nih.gov/clinvar/). Primary data are obtained from the National Center for Biotechnology Information, U.S. National Library of Medicine. ClinVar is a public-domain resource; this tool is not affiliated with or endorsed by NCBI.

## Disclaimer

> **Prototype — Not for Clinical Use**
> This tool is an unvalidated prototype made available for evaluation and feedback only. It has not been approved or endorsed by Ontario Health – Cancer Care Ontario. It must **not** be used to guide patient care, testing decisions, or clinical management. Some recommendations reflect local interpretation and may differ from published guidance. Always refer to the current published eligibility criteria and consult your clinical genetics service.
