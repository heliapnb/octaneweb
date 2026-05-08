// --- GERMLINE DATA ---

// Step 3: Unconditionally RECOMMENDED (ESMO 2022 gene list, no context conditions)
const step3Genes = [
    "ATM", "BAP1", "BARD1", "BRCA1", "BRCA2", "BRIP1", "CHEK2", "FH", "FLCN",
    "MLH1", "MSH2", "MSH6", "PALB2", "PMS2", "POLD1", "POLE", "RAD51C", "RAD51D",
    "RET", "SDHA", "SDHAF2", "SDHB", "SDHC", "SDHD", "SUFU", "TMEM127", "TSC2"
];

// Step 3 (notes 1-4) + Step 7 (notes 10-16): RECOMMENDED only when clinical context is met
const contextGenes = {
    "CDH1":    ["Invasive ductal carcinoma", "Esophagogastric cancer", "Colorectal cancer", "NSCLC", "Melanoma", "Soft Tissue Sarcoma"],
    "DICER1":  ["Sex Cord Stromal tumor", "Soft Tissue Sarcoma", "Colorectal cancer", "Thyroid cancer", "Breast cancer", "Germ cell tumor", "Prostate cancer"],
    "PTCH1":   ["Non-melanoma skin cancer", "Embryonal tumor", "Colorectal cancer", "Glioma", "Soft Tissue Sarcoma", "Breast cancer", "Prostate cancer"],
    "SMAD3":   ["Colorectal cancer", "NSCLC", "Breast cancer", "Glioma", "Renal cell carcinoma", "Soft Tissue Sarcoma"],
    "CDKN2A":  ["Melanoma", "Soft Tissue Sarcoma", "Breast cancer", "Endometrial cancer", "Colorectal cancer", "Thymic tumor", "Bone cancer", "CNS cancer"],
    "NF1":     ["Nerve Sheath tumor", "PNS tumor", "Soft Tissue Sarcoma", "GIST", "Pancreatic cancer", "Esophagogastric cancer", "Hepatobiliary cancer", "Mesothelioma", "Sex Cord Stromal tumor", "Thymic tumor", "Cancer of Unknown Primary"],
    "PTEN":    ["Symptoms of Cowden Syndrome"],
    "RB1":     ["Retinoblastoma", "Bone cancer", "CNS cancer", "Endometrial cancer", "Esophagogastric cancer", "Non-melanoma skin cancer", "Renal cell carcinoma"],
    "SMAD4":   ["Cancer of Unknown Primary", "Mesothelioma"],
    "SMARCA4": ["Ovarian cancer", "Pancreatic cancer", "Head and Neck cancer", "Glioma", "Prostate cancer"],
    "SMARCB1": ["Soft Tissue Rhabdoid tumor", "Renal Cell Carcinoma", "Thyroid cancer", "Embryonal tumor"]
};

// Per-gene rationale when context IS met (for contextGenes)
const contextRationale = {
    "CDH1":    "CDH1 germline conversion rate is highly context-dependent: 36.8% in esophagogastric cancer vs. 1.5% in breast cancer. Selected context supports germline confirmation.",
    "DICER1":  "DICER1 germline conversion rate is context-dependent. Selected clinical context supports germline confirmation per ESMO 2022 analysis of 49,264 paired tumor-normal samples.",
    "PTCH1":   "PTCH1 germline conversion rate is context-dependent. Selected clinical context supports germline confirmation per ESMO 2022 recommendations.",
    "SMAD3":   "SMAD3 germline conversion rate is context-dependent. Selected clinical context supports germline confirmation per ESMO 2022 recommendations.",
    "CDKN2A":  "CDKN2A is a Standard-Actionability cancer susceptibility gene (SA-CSG) per ESMO 2022. Germline follow-up is recommended in specific cancer contexts regardless of age.",
    "NF1":     "NF1 is a Standard-Actionability cancer susceptibility gene per ESMO 2022. Germline follow-up is recommended in specific tumor contexts.",
    "PTEN":    "PTEN has a 0.6% overall germline conversion rate, but symptomatic Cowden syndrome presentations significantly increase germline probability.",
    "RB1":     "RB1 has a 3% overall germline conversion rate, rising to 37% at very young age. Selected cancer context supports germline confirmation.",
    "SMAD4":   "SMAD4 germline conversion rate is context-dependent. Selected clinical context supports germline confirmation per ESMO 2022 recommendations.",
    "SMARCA4": "SMARCA4 is a Standard-Actionability cancer susceptibility gene per ESMO 2022. Germline follow-up is recommended in specific cancer contexts.",
    "SMARCB1": "SMARCB1 germline conversion rate is context-dependent. Selected clinical context supports germline confirmation per ESMO 2022 recommendations."
};

// Step 8: age ≤30 at diagnosis → REVIEW/MDT, else NOT OFFERED
const step8Genes = [
    "AIP", "AXIN2", "CDK4", "CTNNA1", "EGFR", "EGLN1", "EXT1", "EXT2",
    "GALNT12", "GREM1", "HOXB13", "KIT", "LZTR1", "MAX", "MEN1", "MET",
    "MITF", "MLH3", "NBN", "NTHL1", "PDGFRA", "POT1", "PRKAR1", "RECQL",
    "RNF43", "RPS20", "SMARCE1", "TERT", "WT1"
];

// Reference links
const REFS = {
    kuzbari: { text: "Kuzbari et al., ESMO 2022", url: "https://doi.org/10.1016/j.annonc.2022.12.003" },
    ricker:  { text: "Ricker et al., ASCO 2024",  url: "https://doi.org/10.1200/OP.24.00278" },
    clark:   { text: "Clark et al., JCO 2019",    url: "https://doi.org/10.1200/PO.19.00076" },
    klek:    { text: "Klek et al., JNCI 2020",    url: "https://doi.org/10.1093/jncics/pkaa018" },
    amp:     { text: "AMP/ASCO/CAP 2017",         url: "http://dx.doi.org/10.1016/j.jmoldx.2016.10.002" }
};

const allGenes = [...new Set([
    ...step3Genes,
    ...Object.keys(contextGenes),
    "VHL", "MUTYH", "APC", "TP53",
    ...step8Genes
])].sort();

// Shared mutable state — read/written by the UI layer
window.variantStates = [];

// --- GERMLINE LOGIC (pure, no DOM) ---

function createVariantState(gene, coding) {
    return {
        gene: (gene || '').toUpperCase(),
        coding: (coding || '').trim(),
        clinvarDone: false,
        clinvarClass: null,
        clinvarSignificance: null,
        clinvarId: null,
        clinvarTotal: 0,
        clinvarSummary: '',
        plpConfirmed: null,   // true | false | null
        contextAnswer: null,  // 'yes' | 'no' | null
        ageInput: '',
        multiVariant: false,
    };
}

function parseVariants(input) {
    if (!input || !input.trim()) return [];
    return input.split(',').map(v => {
        v = v.trim();
        const match = v.match(/^([A-Za-z0-9]+)(?:\s+(c\..+))?$/i);
        if (!match) return null;
        return createVariantState(match[1], match[2]);
    }).filter(Boolean);
}

async function lookupSingleVariant(state) {
    const { gene, coding } = state;
    try {
        const searchTerm = encodeURIComponent(`${gene}[gene] ${coding}`);
        const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar&term=${searchTerm}&retmode=json&retmax=5`;
        const searchResp = await fetch(searchUrl);
        if (!searchResp.ok) throw new Error(`ClinVar search HTTP ${searchResp.status}`);
        const searchData = await searchResp.json();
        const ids = searchData.esearchresult?.idlist || [];
        if (!ids.length) { state.clinvarDone = true; state.clinvarSignificance = 'none'; return; }

        const summaryResp = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=clinvar&id=${ids[0]}&retmode=json`
        );
        if (!summaryResp.ok) throw new Error(`ClinVar summary HTTP ${summaryResp.status}`);
        const summaryData = await summaryResp.json();
        const variant = summaryData.result?.[ids[0]];
        if (!variant) { state.clinvarDone = true; state.clinvarSignificance = 'none'; return; }

        const variantTitle = (variant.title || variant.variation_name || '').toLowerCase();
        if (!variantTitle.includes(coding.toLowerCase().replace(/\s/g, ''))) {
            state.clinvarDone = true; state.clinvarSignificance = 'none'; return;
        }

        const overallClass = variant.germline_classification?.description || '';
        if (!overallClass) { state.clinvarDone = true; state.clinvarSignificance = 'none'; return; }

        const scvs = variant.supporting_submissions?.scv || [];
        const counts = {};
        scvs.forEach(s => { const c = s.germline_classification; if (c) counts[c] = (counts[c] || 0) + 1; });

        state.clinvarDone = true;
        state.clinvarClass = overallClass;
        state.clinvarSignificance = classifySignificance(overallClass);
        state.clinvarId = ids[0];
        state.clinvarTotal = scvs.length;
        state.clinvarSummary = Object.entries(counts).map(([c, n]) => `${n}× ${c}`).join(', ');

        if (state.clinvarSignificance === 'plp') state.plpConfirmed = true;
        else if (state.clinvarSignificance === 'vus' || state.clinvarSignificance === 'benign') state.plpConfirmed = false;
    } catch (e) {
        state.clinvarDone = true; state.clinvarSignificance = 'error';
    }
}

function classifySignificance(overallClass) {
    const cls = overallClass.toLowerCase();
    if (cls.includes('conflicting')) return 'conflicting';
    if (cls.includes('uncertain') || cls.includes('vus')) return 'vus';
    if (cls.includes('benign')) return 'benign';
    if (cls.includes('pathogenic')) return 'plp';
    return 'unknown';
}

function computeRecommendationForVariant(state) {
    const { gene, coding, plpConfirmed, contextAnswer, ageInput, multiVariant } = state;

    if (plpConfirmed === null) return null;

    if (plpConfirmed === false) return {
        rec: 'NOT OFFERED', color: 'slate', icon: 'fa-ban',
        sub: 'Variant not classified as P/LP.',
        rationale: 'Germline confirmation is not recommended for variants not classified as pathogenic or likely pathogenic.',
        refs: [], pending: false
    };

    const ageUnder30 = ageInput !== '' && parseInt(ageInput) <= 30;
    const ctxYes = contextAnswer === 'yes';
    const ctxNo  = contextAnswer === 'no';

    if (step3Genes.includes(gene)) return {
        rec: 'RECOMMENDED', color: 'green', icon: 'fa-check-circle',
        sub: 'Identified in ESMO 2022 high-risk gene list.',
        rationale: `${gene} meets the ≥5% germline conversion rate threshold across tumour types, identified as a Most or High-Actionability cancer susceptibility gene in analysis of 49,264 paired tumour-normal samples.`,
        refs: [REFS.kuzbari], pending: false
    };

    if (gene === 'VHL') {
        if (ctxYes) return { rec: 'NOT OFFERED', color: 'red', icon: 'fa-ban', sub: 'VHL confirmation not recommended for Renal Cell Carcinoma.', rationale: 'VHL has only 1.5% germline conversion rate in RCC due to very high somatic VHL mutation frequency.', refs: [REFS.kuzbari], pending: false };
        if (ctxNo)  return { rec: 'RECOMMENDED', color: 'green', icon: 'fa-check-circle', sub: 'Recommended in non-RCC clinical contexts.', rationale: 'VHL has 59.4% germline conversion rate in non-RCC tumours.', refs: [REFS.kuzbari], pending: false };
        return { pending: true };
    }

    if (contextGenes[gene]) {
        if (ctxYes) return { rec: 'RECOMMENDED', color: 'green', icon: 'fa-user-check', sub: 'Clinical context met for germline confirmation.', rationale: contextRationale[gene] || `${gene} germline conversion rate is context-dependent. Selected clinical context supports germline confirmation.`, refs: [REFS.kuzbari, REFS.ricker], pending: false };
        if (ctxNo)  return { rec: 'NOT OFFERED', color: 'red', icon: 'fa-ban', sub: 'No applicable clinical context identified.', rationale: `${gene} germline conversion rate is context-dependent. Without a matching clinical context, germline confirmation is not recommended.`, refs: [REFS.kuzbari], pending: false };
        return { pending: true };
    }

    if (gene === 'MUTYH') {
        if (coding.includes('c.452A>G') || coding.includes('c.1103G>A')) return { rec: 'RECOMMENDED', color: 'green', icon: 'fa-fingerprint', sub: 'Known MUTYH founder variant identified.', rationale: 'MUTYH has a 98.5% germline conversion rate. The detected variant is a known founder mutation.', refs: [REFS.klek, REFS.kuzbari], pending: false };
        return { rec: 'NOT OFFERED', color: 'red', icon: 'fa-ban', sub: 'Not a known MUTYH founder variant.', rationale: 'Confirmation is reserved for the established founder variants c.452A>G and c.1103G>A.', refs: [REFS.klek, REFS.kuzbari], pending: false };
    }

    if (gene === 'APC') {
        if (coding.includes('c.3920T>A')) return { rec: 'RECOMMENDED', color: 'green', icon: 'fa-fingerprint', sub: 'Known APC founder variant (c.3920T>A).', rationale: 'APC c.3920T>A is a known germline founder mutation.', refs: [REFS.klek, REFS.kuzbari], pending: false };
        if (multiVariant) return { rec: 'RECOMMENDED', color: 'green', icon: 'fa-check-circle', sub: '2 or more P/LP variants in APC.', rationale: 'Biallelic P/LP findings substantially increase germline probability over the 1.1% baseline GCR.', refs: [REFS.amp, REFS.kuzbari], pending: false };
        if (ageUnder30) return { rec: 'RECOMMENDED', color: 'green', icon: 'fa-check-circle', sub: 'Tumour diagnosed at ≤30 years.', rationale: 'ESMO 2022 recommends germline confirmation for APC variants in patients diagnosed at or below 30 years.', refs: [REFS.kuzbari], pending: false };
        if (ageInput !== '' && !ageUnder30) return { rec: 'NOT OFFERED', color: 'red', icon: 'fa-ban', sub: 'APC variant does not meet criteria.', rationale: 'APC has only 1.1% overall GCR. Confirmation is reserved for c.3920T>A, biallelic findings, or diagnosis ≤30y.', refs: [REFS.kuzbari, REFS.klek], pending: false };
        return { pending: true };
    }

    if (gene === 'TP53') {
        if (coding.includes('c.1010G>A')) return { rec: 'RECOMMENDED', color: 'green', icon: 'fa-fingerprint', sub: 'Known TP53 founder variant (c.1010G>A).', rationale: 'TP53 c.1010G>A is a known germline founder mutation.', refs: [REFS.klek, REFS.kuzbari], pending: false };
        if (multiVariant) return { rec: 'RECOMMENDED', color: 'green', icon: 'fa-check-circle', sub: '2 or more P/LP variants in TP53.', rationale: 'Multiple P/LP findings in TP53 are indicative of germline origin.', refs: [REFS.amp, REFS.kuzbari], pending: false };
        return { rec: 'NOT OFFERED', color: 'red', icon: 'fa-ban', sub: 'TP53 variant does not meet criteria.', rationale: 'TP53 has only 0.9% overall GCR. Confirmation is reserved for c.1010G>A or biallelic findings.', refs: [REFS.kuzbari, REFS.klek], pending: false };
    }

    if (gene === 'HOXB13' && coding.includes('c.251G>A')) return { rec: 'RECOMMENDED', color: 'green', icon: 'fa-fingerprint', sub: 'Known HOXB13 founder variant (c.251G>A).', rationale: 'HOXB13 c.251G>A is a known founder germline variant associated with hereditary prostate cancer.', refs: [REFS.klek, REFS.clark], pending: false };

    if (gene === 'TERT' && coding.includes('c.-57T>G')) return { rec: 'RECOMMENDED', color: 'green', icon: 'fa-fingerprint', sub: 'Known TERT founder variant (c.-57T>G).', rationale: 'TERT c.-57T>G is a known founder germline variant associated with increased cancer susceptibility.', refs: [REFS.klek, REFS.clark], pending: false };

    if (gene === 'EGFR' && coding.includes('c.2369C>T')) {
        if (ctxYes) return { rec: 'RECOMMENDED', color: 'green', icon: 'fa-user-check', sub: 'EGFR c.2369C>T in TKI treatment-naïve patient.', rationale: 'EGFR c.2369C>T (p.T790M) in a TKI-naïve patient suggests germline origin rather than acquired resistance.', refs: [REFS.ricker], pending: false };
        if (ctxNo)  { /* fall through to step8 */ }
        else        return { pending: true };
    }

    if (step8Genes.includes(gene)) {
        if (ageInput === '') return { pending: true };
        if (ageUnder30) return { rec: 'REVIEW / MDT', color: 'amber', icon: 'fa-users', sub: `${gene} — MDT review recommended (age ≤30).`, rationale: `${gene} has low overall GCR but elevated germline probability in patients ≤30 years at diagnosis. MDT discussion recommended.`, refs: [REFS.kuzbari, REFS.ricker], pending: false };
        return { rec: 'NOT OFFERED', color: 'red', icon: 'fa-ban', sub: `${gene} — age >30 does not meet criteria.`, rationale: `${gene} germline follow-up is only considered for patients diagnosed at ≤30 years.`, refs: [REFS.kuzbari], pending: false };
    }

    return { rec: 'NOT OFFERED', color: 'red', icon: 'fa-ban', sub: 'Gene not in CCO germline workflow.', rationale: `${gene} is not included in the current CCO germline confirmation workflow.`, refs: [], pending: false };
}
