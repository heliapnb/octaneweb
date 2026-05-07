// --- ELIGIBILITY DATA ---
const dxCategories = {
    "HBOC": [
        "Breast cancer ≤ 45y",
        "Breast cancer ≤ 50y with limited family structure (e.g. adoption, few female relatives)",
        "Breast cancer ≤ 50y with a second primary breast cancer",
        "Triple negative invasive breast cancer ≤ 60y",
        "Male breast cancer (any age)",
        "Invasive epithelial ovarian, fallopian tube, or peritoneal cancer (any age)",
        "Breast or ovarian cancer (any age) + close relative with breast or ovarian cancer (if 2 breast cancers, one must be ≤ 50y)",
        "Breast or ovarian cancer (any age) + close relative with triple negative breast cancer ≤ 60y",
        "Breast or ovarian cancer (any age) + close relative with male breast cancer",
        "Breast or ovarian cancer (any age) + close relative with pancreatic adenocarcinoma",
        "Breast or ovarian cancer (any age) + close relative with high-risk prostate cancer (T3+, Gleason 8–10, node involvement, or PSA ≥ 20)",
        "Breast or ovarian cancer (any age) + ≥2 close relatives with breast or prostate cancer (any age)"
    ],
    "Prostate": [
        "Metastatic prostate cancer",
        "High-risk locally advanced: T3 or higher staging",
        "High-risk locally advanced: Gleason score ≥ 8 (Grade Group 4 or 5)",
        "High-risk locally advanced: lymph node involvement",
        "High-risk locally advanced: PSA ≥ 20",
        "Prostate cancer + ≥1 close relative with prostate cancer (at least one high-risk or metastatic)",
        "Prostate cancer + ≥2 close relatives with prostate, pancreatic, ovarian, or breast cancer (any age or stage)"
    ],
    "Lynch": [
        "IHC-deficient tumor (MMR loss) — not BRAF positive or MLH1 methylated (CRC)",
        "IHC-deficient tumor (MMR loss) — MSH2, MSH6, or PMS2 deficient",
        "IHC-deficient sebaceous neoplasm ≤ 60y",
        "IHC-deficient sebaceous neoplasm — multiple primary sebaceous neoplasms",
        "IHC-deficient sebaceous neoplasm + personal or family history of Lynch-associated cancer",
        "CRC or endometrial cancer ≤ 50y",
        "2+ primary Lynch-associated cancers (first diagnosed ≤ 60y)",
        "Lynch-associated cancer + ≥2 close relatives with Lynch-associated cancer",
        "≥ 20 colorectal adenomas (any age)",
        "10–19 colorectal adenomas ≤ 60y",
        "Serrated polyposis: > 20 serrated polyps in colon/rectum, ≥5 proximal to rectum",
        "Serrated polyposis: ≥5 serrated polyps proximal to rectum (all ≥5 mm, ≥2 measuring ≥10 mm)"
    ],
    "Gastric": [
        "Gastric or gastroesophageal junction (GEJ) adenocarcinoma ≤ 50y",
        "Diffuse gastric cancer (any age) — patient of Māori ethnicity",
        "Diffuse gastric cancer (any age) — personal or family history of cleft lip/palate",
        "Diffuse gastric cancer + lobular breast cancer (both diagnosed < 70y)",
        "Bilateral lobular breast cancer (both diagnosed < 70y)",
        "Gastric in situ signet ring cells or pagetoid spread of signet ring cells < 50y",
        "≥2 close relatives with gastric cancer (any age), at least one confirmed diffuse type",
        "≥1 close relative with diffuse gastric cancer (any age) + ≥1 close relative with lobular breast cancer < 70y (different family members)",
        "≥2 close relatives with lobular breast cancer < 50y",
        "≥3 close relatives with gastric cancer (any type)"
    ],
    "Renal": [
        "Renal tumour ≤ 45y",
        "Bilateral or multifocal renal tumours",
        "Close relative with a renal tumour",
        "Non-clear cell pathology (papillary, chromophobe, oncocytic, or hybrid tumour)",
        "Evidence of syndromic presentation (e.g. seizures, pneumothorax)",
        "Personal or family history of associated tumours (e.g. hemangioblastoma, angiomyolipomas)"
    ],
    "Pancreatic": [
        "Personal history of pancreatic adenocarcinoma (any age, any family history)"
    ],
    "GIST": [
        "Multiple primary GISTs",
        "GIST with syndromic manifestations",
        "SDH-deficient GIST, or GIST with NF1/SDH variants",
        "GIST (any age) + ≥1 close relative with GIST"
    ],
    "Melanoma": [
        "≥3 primary malignant melanomas",
        "Melanoma + ≥2 first/second degree relatives with melanoma and/or pancreatic cancer",
        "Melanoma < 40y + ≥1 first/second degree relative with melanoma or pancreatic cancer",
        "Uveal melanoma (any age)"
    ],
    "Pheo_Para": [
        "Personal history of pheochromocytoma or paraganglioma (any age)"
    ],
    "CNS": [
        "Brain tumour + multiple tumours or cancers in same person (e.g. brain + soft tissue + Lynch-associated cancer)",
        "Brain tumour + ≥2 close relatives with brain tumours or associated cancers (Lynch, Li-Fraumeni, soft tissue) on same side of family"
    ],
    "SoftTissue": [
        "Sarcoma < 45y + family history of young-onset malignancy in ≥1 close relative",
        "Sarcoma < 45y + evidence of syndromic presentation"
    ]
};

const dxMapping = {
    // HBOC
    "Breast Adenocarcinoma": "HBOC",
    "Ovarian Serous Carcinoma": "HBOC",
    "Fallopian Tube Cancer": "HBOC",
    "Peritoneal Cancer": "HBOC",
    // Gastric
    "Lobular Breast Cancer": "Gastric",
    "Diffuse Gastric Cancer": "Gastric",
    "Gastric Adenocarcinoma": "Gastric",
    "Gastroesophageal Junction Adenocarcinoma": "Gastric",
    // Lynch / GI
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
    // Prostate
    "Prostate Cancer": "Prostate",
    // Pancreatic
    "Pancreatic Duct Adenocarcinoma": "Pancreatic",
    "Pancreatic Adenocarcinoma": "Pancreatic",
    // GIST
    "Gastrointestinal Stromal Tumour": "GIST",
    // Melanoma
    "Malignant Melanoma": "Melanoma",
    "Uveal Melanoma": "Melanoma",
    // Pheochromocytoma / Paraganglioma
    "Pheochromocytoma": "Pheo_Para",
    "Paraganglioma": "Pheo_Para",
    // CNS
    "Glioblastoma": "CNS",
    "Glioma": "CNS",
    "Brain Tumour": "CNS",
    // Soft Tissue
    "Soft Tissue Sarcoma": "SoftTissue",
    "Leiomyosarcoma": "SoftTissue",
    "Rhabdomyosarcoma": "SoftTissue",
    "Liposarcoma": "SoftTissue"
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
