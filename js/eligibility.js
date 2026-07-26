// --- ELIGIBILITY DATA (Hereditary Cancer Testing Eligibility Criteria v4.0, June 2026) ---
const dxCategories = {
    // General Criteria for All Disease Sites — apply to any hereditary cancer
    // syndrome / test, not tied to a specific tumour type (v4.0, criteria 1–8).
    "General": [
        "Empirical evidence or an established risk model estimates a ≥ 5% likelihood of a P/LP variant",
        "A blood relative has a known P/LP variant in a cancer susceptibility gene on the approved gene list",
        "Testing would aid systemic therapy planning — the patient may benefit from a targeted therapy based on germline variant status and meets all other criteria for that therapy",
        "Previously uninformative testing was done with older methods (e.g. single-gene, no del/dup analysis) and updated testing has a reasonable likelihood of clinical benefit",
        "Carrier of reproductive age, or planning a pregnancy, for a gene linked to an autosomal recessive condition — consider actionability, consanguinity, founder variants, carrier frequency, and penetrance; full testing of the gene is offered to the other genetic contributor",
        "Clinical judgement supports testing in a family suspicious for hereditary risk, even when established criteria are not met",
        "A clinically significant IHC deficiency (e.g. mismatch repair loss) suggests a hereditary cancer syndrome",
        "A clinically significant variant identified on a tumour/somatic molecular report warrants confirmatory germline testing"
    ],
    // Hereditary Breast, Ovarian, Prostate, Biliary Tract, and Pancreatic Cancers —
    // v4.0 presents these as one merged criteria list, so every cancer in the bundle
    // shows the full set of criteria below.
    "BreastOvarianProstateBiliaryPancreatic": [
        "Personal history of breast cancer ≤ 50y",
        "Breast cancer at any age that is triple negative invasive, OR ≥ 2 primary (non-recurrent) breast cancers, OR breast cancer in a person assigned male at birth",
        "Invasive epithelial ovarian cancer (any grade), fallopian tube cancer, or primary peritoneal cancer (any age)",
        "Exocrine pancreatic cancer (any age)",
        "Biliary tract cancer, e.g. cholangiocarcinoma or gallbladder cancer (any age)",
        "Prostate cancer ≤ 50y",
        "High-risk prostate cancer (any age): metastatic; OR high-risk locally advanced with ≥ 1 of T3 or higher staging, Grade Group 4 or 5 (Gleason 8–10), lymph node involvement, or PSA ≥ 20",
        "Breast or prostate cancer (any age) with ≥ 1 FDR/SDR whose cancer meets any criterion above, OR ≥ 2 FDR/SDR with prostate and/or breast cancer (any age or stage)"
    ],
    "Lynch": [
        "Personal history of colorectal cancer ≤ 50y",
        "Personal history of endometrial cancer ≤ 50y",
        "Mismatch repair (MMR) deficient tumour (any age): MSH2, MSH6, or isolated PMS2 IHC-deficient Lynch tumour (excluding sebaceous neoplasm); OR MLH1 ± PMS2 IHC-deficient Lynch tumour with unmethylated MLH1 promoter (for colorectal tumours, also absence of BRAF V600E)",
        "MMR IHC-deficient sebaceous neoplasm plus ≥ 1 of: diagnosis ≤ 60y; ≥ 2 primary sebaceous neoplasms; or personal and/or family history (FDR/SDR) of a Lynch-associated cancer",
        "Amsterdam I/II family: ≥ 3 affected FDR/SDR with colorectal, endometrial, small bowel, ureter, or renal pelvis cancer over two successive generations, ≥ 1 diagnosed under 50y, and ≥ 1 an FDR of the other two",
        "Suspicious extracolonic tumour: cribriform-morular variant of papillary thyroid cancer; hepatoblastoma; desmoid ≤ 40y; or retinal pigment epithelium (RPE) hamartomas associated with FAP",
        "Colorectal adenomas: ≥ 20 (any age); OR 10–19 diagnosed ≤ 60y; OR 5–9 with FAP/MAP-associated features or another qualifying age/family-history risk factor",
        "Serrated (sessile) polyps: > 20 in the colon/rectum with ≥ 5 proximal to the rectum; OR ≥ 5 proximal to the rectum, all ≥ 5 mm with ≥ 2 measuring ≥ 10 mm",
        "Fundic gland polyps: 100+ (carpeting); OR > 30 in the absence of PPI use with a qualifying family history of gastric cancer or fundic gland polyposis",
        "Peutz-Jeghers-type hamartomas: ≥ 2; OR 1 with mucocutaneous pigmentation or a FDR/SDR with Peutz-Jeghers syndrome",
        "Juvenile polyps: ≥ 5 in the colorectum; OR 1 with a family history of juvenile polyposis syndrome"
    ],
    "Gastric": [
        "Diagnosis ≤ 50y of gastric adenocarcinoma, gastroesophageal junction adenocarcinoma, gastric in situ signet ring cells, or gastric pagetoid spread of signet ring cells",
        "Both diffuse gastric cancer (DGC) and lobular breast cancer, diagnosed ≤ 70y",
        "DGC (any age) with Māori ancestry, OR a personal or family history of cleft lip/palate",
        "Family history: ≥ 2 FDR/SDR with gastric cancer (any age), ≥ 1 confirmed DGC; OR ≥ 1 FDR/SDR with DGC (any age) plus ≥ 1 FDR/SDR with lobular breast cancer ≤ 70y in different family members on the same side; OR ≥ 2 FDR/SDR with lobular breast cancer ≤ 50y; OR ≥ 3 FDR/SDR with gastric cancer (any type)"
    ],
    "Renal": [
        "Renal tumour with ≥ 1 of: bilateral or multifocal disease; diagnosis ≤ 45y; ≥ 1 FDR/SDR with a renal tumour; non-clear cell pathology (papillary, chromophobe, oncocytic, hybrid); evidence of syndromic presentation (e.g. seizures, pneumothorax); or personal/family history of associated tumours (e.g. hemangioblastoma, leiomyomas, angiomyolipomas)"
    ],
    "GIST": [
        "≥ 2 primary GISTs",
        "GIST diagnosed ≤ 18y",
        "GIST with syndromic manifestations",
        "SDH-deficient GIST, or GIST with tumour-detected variants in NF1, SDHA, SDHAF2, SDHB, SDHC, or SDHD",
        "GIST (any age) with ≥ 1 FDR/SDR with a GIST, pheochromocytoma, or paraganglioma (any age)"
    ],
    "Melanoma": [
        "≥ 3 primary malignant cutaneous melanomas",
        "Uveal melanoma (any age)",
        "Malignant cutaneous melanoma ≤ 18y",
        "Malignant cutaneous melanoma ≤ 40y with ≥ 1 FDR/SDR with malignant melanoma (any age)",
        "Malignant melanoma (any age) with ≥ 1 of: ≥ 1 FDR with uveal melanoma; ≥ 1 FDR/SDR with malignant cutaneous melanoma ≤ 40y; ≥ 1 FDR/SDR with exocrine pancreatic cancer or a neural system tumour; or ≥ 2 FDR/SDR with any combination of malignant cutaneous melanoma, exocrine pancreatic cancer, or neural system tumour"
    ],
    "Pheo_Para": [
        "Personal history of a pheochromocytoma and/or paraganglioma at any age"
    ],
    "CNS": [
        "Brain tumour with ≥ 1 of: a personal history of ≥ 1 additional primary tumour and/or cancer (e.g. brain, soft tissue, Lynch-associated); ≥ 1 FDR/SDR with ≥ 2 primary tumours or cancers in one person; or ≥ 2 FDR/SDR with brain tumours and/or associated cancers (Lynch, Li-Fraumeni, soft tissue) on the same side of the family"
    ],
    "Lung": [
        "Lung adenocarcinoma (regardless of smoking history) diagnosed ≤ 45y with ≥ 1 of: a personal history of pre-menopausal breast cancer, glioma, adrenocortical carcinoma, acute leukemia, or choroid plexus tumour; OR ≥ 1 FDR/SDR with pre-menopausal breast cancer, glioma, sarcoma, adrenocortical carcinoma, acute leukemia, choroid plexus tumour, or lung adenocarcinoma diagnosed ≤ 55y",
        "Lung adenocarcinoma diagnosed ≤ 50y with a somatic EGFR-activating variant or deletion (e.g. p.L858R, p.G719A/C/S, exon 19 deletion)",
        "EGFR T790M variant in the associated lung tumour in a tyrosine kinase inhibitor treatment-naïve patient"
    ],
    "SoftTissue": [
        "Sarcoma ≤ 45y with ≥ 1 of: a family history of young-onset malignancy in a FDR/SDR; or congenital anomalies",
        "Osteosarcoma ≤ 18y",
        "Rhabdomyosarcoma with ≥ 1 of: diagnosis ≤ 4y; anaplastic histology; or gynecologic site"
    ],
    "Medulloblastoma": [
        "WNT-subgroup medulloblastoma with ≥ 1 of: no somatic CTNNB1 activating variant (if somatic sequencing done); beta-catenin IHC showing lack of nuclear staining (if somatic sequencing not done); or a family history suspicious of FAP",
        "SHH-subgroup medulloblastoma",
        "Group 3 or 4 medulloblastoma with a family history suspicious of hereditary breast and ovarian cancer"
    ],
    "Nephroblastoma": [
        "Personal history of a Wilms tumour (nephroblastoma) — all patients should also have concurrent testing for Beckwith-Wiedemann syndrome"
    ],
    "Neuroblastoma": [
        "Neuroblastic tumour (neuroblastoma, ganglioneuroblastoma, or ganglioneuroma) with ≥ 1 of: bilateral or multifocal disease; or a FDR/SDR with a neuroblastic tumour",
        "Neuroblastic tumour with features consistent with Noonan syndrome or other RASopathies, NF1, or Weaver syndrome",
        "Neuroblastic tumour with ≥ 1 of: Hirschsprung disease or unexplained significant constipation; or congenital central hypoventilation syndrome or sleep apnea requiring ventilation aids"
    ]
};

const dxMapping = {
    // General criteria that apply across all disease sites
    "General Criteria — All Disease Sites": "General",
    // Hereditary Breast, Ovarian, Prostate, Biliary Tract, and Pancreatic Cancers
    // (all share the one merged v4.0 criteria list)
    "Breast Adenocarcinoma": "BreastOvarianProstateBiliaryPancreatic",
    "Ovarian Serous Carcinoma": "BreastOvarianProstateBiliaryPancreatic",
    "Fallopian Tube Cancer": "BreastOvarianProstateBiliaryPancreatic",
    "Peritoneal Cancer": "BreastOvarianProstateBiliaryPancreatic",
    "Prostate Cancer": "BreastOvarianProstateBiliaryPancreatic",
    "Pancreatic Duct Adenocarcinoma": "BreastOvarianProstateBiliaryPancreatic",
    "Pancreatic Adenocarcinoma": "BreastOvarianProstateBiliaryPancreatic",
    "Cholangiocarcinoma": "BreastOvarianProstateBiliaryPancreatic",
    "Gallbladder Cancer": "BreastOvarianProstateBiliaryPancreatic",
    "Biliary Tract Cancer": "BreastOvarianProstateBiliaryPancreatic",
    // Gastric (incl. lobular breast / diffuse gastric)
    "Lobular Breast Cancer": "Gastric",
    "Diffuse Gastric Cancer": "Gastric",
    "Gastric Adenocarcinoma": "Gastric",
    "Gastroesophageal Junction Adenocarcinoma": "Gastric",
    // Lynch / colorectal / polyposis
    "Colon Adenocarcinoma": "Lynch",
    "Colorectal Cancer": "Lynch",
    "Endometrial Cancer": "Lynch",
    "Sebaceous Neoplasm": "Lynch",
    "Small Bowel Cancer": "Lynch",
    // Renal
    "Clear Cell Renal Cell Carcinoma": "Renal",
    "Papillary Renal Cell Carcinoma": "Renal",
    "Chromophobe Renal Cell Carcinoma": "Renal",
    "Renal Cell Carcinoma": "Renal",
    // GIST
    "Gastrointestinal Stromal Tumour": "GIST",
    // Melanoma
    "Malignant Melanoma": "Melanoma",
    "Cutaneous Melanoma": "Melanoma",
    "Uveal Melanoma": "Melanoma",
    // Pheochromocytoma / Paraganglioma
    "Pheochromocytoma": "Pheo_Para",
    "Paraganglioma": "Pheo_Para",
    // CNS
    "Glioblastoma": "CNS",
    "Glioma": "CNS",
    "Brain Tumour": "CNS",
    // Lung
    "Lung Adenocarcinoma": "Lung",
    // Soft tissue / bone sarcoma
    "Soft Tissue Sarcoma": "SoftTissue",
    "Leiomyosarcoma": "SoftTissue",
    "Rhabdomyosarcoma": "SoftTissue",
    "Liposarcoma": "SoftTissue",
    "Osteosarcoma": "SoftTissue",
    // Pediatric cancer syndromes
    "Medulloblastoma": "Medulloblastoma",
    "Wilms Tumour": "Nephroblastoma",
    "Nephroblastoma": "Nephroblastoma",
    "Neuroblastoma": "Neuroblastoma",
    "Ganglioneuroblastoma": "Neuroblastoma",
    "Ganglioneuroma": "Neuroblastoma"
};

// --- ELIGIBILITY HELPERS (pure, no DOM) ---

function searchDiagnoses(query) {
    if (!query) return [];
    const val = query.toLowerCase();
    return Object.keys(dxMapping).filter(d => d.toLowerCase().includes(val));
}

function getCriteriaForDx(dx) {
    const cat = dxMapping[dx];
    return dxCategories[cat] || [];
}
