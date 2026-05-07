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

// --- GERMLINE LOGIC ---

function initGermline() {
    window.variantStates = [];
}


// ─── MULTI-VARIANT STATE ────────────────────────────────────────────────────

window.variantStates = [];

function parseVariants(input) {
    if (!input || !input.trim()) return [];
    return input.split(',').map(v => {
        v = v.trim();
        const match = v.match(/^([A-Za-z0-9]+)\s+(c\..+)$/i);
        if (!match) return null;
        return {
            gene: match[1].toUpperCase(),
            coding: match[2].trim(),
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
    }).filter(Boolean);
}

// ─── LOOKUP ─────────────────────────────────────────────────────────────────

async function lookupAllVariants() {
    const input = document.getElementById('gVariantInput')?.value || '';
    const states = parseVariants(input);
    if (!states.length) {
        alert('Please enter at least one variant in the format: GENE c.xxxxx');
        return;
    }
    window.variantStates = states;
    document.getElementById('gVariantCards').classList.remove('hidden');
    resetRightPanel();
    renderVariantCards();
    for (let i = 0; i < states.length; i++) {
        await lookupSingleVariant(i);
        renderVariantCards();
        updateResultsPanel();
    }
}

async function lookupSingleVariant(idx) {
    const state = window.variantStates[idx];
    const { gene, coding } = state;
    try {
        const searchTerm = encodeURIComponent(`${gene}[gene] ${coding}`);
        const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar&term=${searchTerm}&retmode=json&retmax=5`;
        const searchData = await (await fetch(searchUrl)).json();
        const ids = searchData.esearchresult?.idlist || [];
        if (!ids.length) { state.clinvarDone = true; state.clinvarSignificance = 'none'; return; }

        const summaryData = await (await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=clinvar&id=${ids[0]}&retmode=json`
        )).json();
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

function bypassAllVariants() {
    const input = document.getElementById('gVariantInput')?.value || '';
    const states = parseVariants(input);
    if (!states.length) {
        alert('Please enter at least one variant in the format: GENE c.xxxxx');
        return;
    }
    states.forEach(s => { s.clinvarDone = false; s.plpConfirmed = true; });
    window.variantStates = states;
    document.getElementById('gVariantCards').classList.remove('hidden');
    renderVariantCards();
    updateResultsPanel();
}

// ─── STATE SETTERS ───────────────────────────────────────────────────────────

function setVariantPLP(idx, confirmed) {
    window.variantStates[idx].plpConfirmed = confirmed;
    renderVariantCards();
    updateResultsPanel();
}

function setVariantContextAnswer(idx, val) {
    window.variantStates[idx].contextAnswer = val;
    renderVariantCards();
    updateResultsPanel();
}

function setVariantAge(idx, age) {
    window.variantStates[idx].ageInput = age;
    updateResultsPanel();
}

function setVariantMultiVariant(idx, checked) {
    window.variantStates[idx].multiVariant = checked;
    updateResultsPanel();
}

// ─── CARD RENDERING ──────────────────────────────────────────────────────────

function renderVariantCards() {
    const container = document.getElementById('gVariantCards');
    if (!container) return;
    container.innerHTML = window.variantStates.map((s, i) => renderVariantCard(s, i)).join('');
}

function renderVariantCard(state, idx) {
    const { gene, coding, clinvarDone, clinvarClass, clinvarSignificance, clinvarId, clinvarTotal, clinvarSummary, plpConfirmed } = state;

    // ClinVar section
    let clinvarHtml = '';
    if (!clinvarDone && plpConfirmed === null) {
        clinvarHtml = `<div class="h-5 bg-slate-100 rounded animate-pulse"></div><div class="h-5 bg-slate-100 rounded animate-pulse w-3/4 mt-1"></div>`;
    } else if (clinvarSignificance === 'error') {
        clinvarHtml = `<p class="text-xs text-red-500 font-bold">ClinVar lookup failed. Check your connection.</p>`;
    } else if (clinvarDone && (clinvarSignificance === 'plp' || clinvarSignificance === 'vus' || clinvarSignificance === 'benign' || clinvarSignificance === 'conflicting' || clinvarSignificance === 'unknown')) {
        const colorClass = getClassColor(clinvarClass);
        clinvarHtml = `
            <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">ClinVar Germline</span>
                <span class="px-2 py-1 rounded-full text-xs font-black ${colorClass}">${clinvarClass}</span>
            </div>
            ${clinvarTotal > 0 ? `<p class="text-xs text-slate-500">${clinvarSummary}</p>` : ''}
            <a href="https://www.ncbi.nlm.nih.gov/clinvar/variation/${clinvarId}/" target="_blank" class="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"><i class="fas fa-external-link-alt mr-1"></i>ClinVar record</a>`;
    } else if (clinvarDone && clinvarSignificance === 'none') {
        clinvarHtml = `<p class="text-xs font-bold text-slate-600">Not found on ClinVar.</p>`;
    }

    // P/LP decision buttons (for conflicting, unknown, or not found)
    let plpButtons = '';
    if (clinvarDone && (clinvarSignificance === 'none' || clinvarSignificance === 'conflicting' || clinvarSignificance === 'unknown')) {
        const yesActive = plpConfirmed === true;
        const noActive  = plpConfirmed === false;
        plpButtons = `
            <div class="space-y-2 pt-2 border-t border-slate-100">
                <p class="text-xs text-slate-500 font-semibold">Check Franklin and Varsome, then indicate classification:</p>
                <div class="flex gap-2">
                    <a href="https://franklin.genoox.com/clinical-db/home" target="_blank"
                        class="flex-1 inline-flex items-center justify-center gap-1 px-2 py-2 bg-slate-800 text-white text-xs font-black rounded-lg hover:bg-slate-700 uppercase tracking-widest">
                        <i class="fas fa-external-link-alt"></i> Franklin
                    </a>
                    <a href="https://varsome.com/" target="_blank"
                        class="flex-1 inline-flex items-center justify-center gap-1 px-2 py-2 bg-slate-800 text-white text-xs font-black rounded-lg hover:bg-slate-700 uppercase tracking-widest">
                        <i class="fas fa-external-link-alt"></i> Varsome
                    </a>
                </div>
                <div class="flex gap-2">
                    <button onclick="setVariantPLP(${idx}, true)"
                        class="flex-1 py-2 text-xs font-black rounded-lg uppercase tracking-widest ${yesActive ? 'bg-green-600 text-white ring-2 ring-green-400' : 'bg-white border-2 border-slate-300 text-slate-500 hover:border-green-400 hover:text-green-700 transition-all'}">
                        <i class="fas fa-check mr-1"></i> P / LP
                    </button>
                    <button onclick="setVariantPLP(${idx}, false)"
                        class="flex-1 py-2 text-xs font-black rounded-lg uppercase tracking-widest ${noActive ? 'bg-red-500 text-white ring-2 ring-red-300' : 'bg-white border-2 border-slate-300 text-slate-500 hover:border-red-400 hover:text-red-600 transition-all'}">
                        <i class="fas fa-times mr-1"></i> Not P / LP
                    </button>
                </div>
            </div>`;
    }

    // Context / age section (only if P/LP confirmed)
    const contextHtml = plpConfirmed === true ? renderVariantContextSection(state, idx) : '';

    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3 animate-fade-in">
            <div class="flex items-center gap-2 flex-wrap">
                <span class="px-3 py-1 bg-slate-800 text-white rounded-lg font-mono font-black text-sm">${gene}</span>
                <span class="font-mono text-sm text-slate-600 font-bold">${coding}</span>
            </div>
            ${clinvarHtml ? `<div class="space-y-1">${clinvarHtml}</div>` : ''}
            ${plpButtons}
            ${contextHtml}
        </div>`;
}

function renderVariantContextSection(state, idx) {
    const { gene, coding, contextAnswer, ageInput, multiVariant } = state;
    const founderAPC = 'c.3920T>A', founderTP53 = 'c.1010G>A';

    if (gene === 'VHL') {
        return renderInlineYesNo(idx, 'Is the tumour Renal Cell Carcinoma?', ['Renal Cell Carcinoma'], contextAnswer);
    }
    if (contextGenes[gene]) {
        return renderInlineYesNo(idx, `Criteria supporting germline confirmation — ${gene}`, contextGenes[gene], contextAnswer);
    }
    if (gene === 'APC' && !coding.includes(founderAPC)) {
        return `
            <div class="pt-2 border-t border-slate-100 space-y-3">
                <label class="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                    <input type="checkbox" ${multiVariant ? 'checked' : ''} onchange="setVariantMultiVariant(${idx}, this.checked)" class="w-4 h-4">
                    2 or more reported P/LP variants in APC
                </label>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age at diagnosis</label>
                    <input type="number" value="${ageInput}" placeholder="e.g. 28" min="1" max="120"
                        oninput="setVariantAge(${idx}, this.value)"
                        class="w-full mt-1 p-3 border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm">
                </div>
            </div>`;
    }
    if (gene === 'TP53' && !coding.includes(founderTP53)) {
        return `
            <div class="pt-2 border-t border-slate-100">
                <label class="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                    <input type="checkbox" ${multiVariant ? 'checked' : ''} onchange="setVariantMultiVariant(${idx}, this.checked)" class="w-4 h-4">
                    2 or more reported P/LP variants in TP53
                </label>
            </div>`;
    }
    if (gene === 'EGFR' && coding.includes('c.2369C>T')) {
        return renderInlineYesNo(idx, 'Clinical Context — EGFR c.2369C>T', ['Patient is TKI Treatment-Naïve'], contextAnswer) +
            renderAgeInput(idx, ageInput);
    }
    if (step8Genes.includes(gene)) {
        return renderAgeInput(idx, ageInput);
    }
    return '';
}

function renderInlineYesNo(idx, title, criteria, currentAnswer) {
    const bullets = criteria.map(c => `<li>${c}</li>`).join('');
    const yesActive = currentAnswer === 'yes';
    const noActive  = currentAnswer === 'no';
    return `
        <div class="pt-2 border-t border-slate-100 space-y-2">
            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">${title}</p>
            <ul class="text-xs text-slate-600 font-semibold space-y-1 list-disc list-inside">${bullets}</ul>
            <p class="text-xs text-slate-500">Does this case meet one or more of the above criteria?</p>
            <div class="flex gap-2">
                <button onclick="setVariantContextAnswer(${idx}, 'yes')"
                    class="flex-1 py-2 text-xs font-black rounded-lg uppercase tracking-widest ${yesActive ? 'bg-green-600 text-white ring-2 ring-green-400' : 'bg-white border-2 border-slate-300 text-slate-500 hover:border-green-400 hover:text-green-700 transition-all'}">
                    <i class="fas fa-check mr-1"></i> Yes
                </button>
                <button onclick="setVariantContextAnswer(${idx}, 'no')"
                    class="flex-1 py-2 text-xs font-black rounded-lg uppercase tracking-widest ${noActive ? 'bg-red-500 text-white ring-2 ring-red-300' : 'bg-white border-2 border-slate-300 text-slate-500 hover:border-red-400 hover:text-red-600 transition-all'}">
                    <i class="fas fa-times mr-1"></i> No
                </button>
            </div>
        </div>`;
}

function renderAgeInput(idx, ageInput) {
    return `
        <div class="pt-2 border-t border-slate-100">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age at diagnosis</label>
            <input type="number" value="${ageInput}" placeholder="e.g. 28" min="1" max="120"
                oninput="setVariantAge(${idx}, this.value)"
                class="w-full mt-1 p-3 border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm">
        </div>`;
}

// ─── PURE RECOMMENDATION LOGIC ───────────────────────────────────────────────

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

// ─── RESULTS PANEL ───────────────────────────────────────────────────────────

function resetRightPanel() {
    const empty = document.getElementById('gEmptyState');
    const content = document.getElementById('gResultContent');
    if (empty) empty.classList.remove('hidden');
    if (content) { content.classList.add('hidden'); content.innerHTML = ''; }
}

function updateResultsPanel() {
    const empty = document.getElementById('gEmptyState');
    const content = document.getElementById('gResultContent');
    if (!content) return;

    const states = window.variantStates;
    if (!states || !states.length) return;

    const pairs = states.map(s => ({ state: s, result: computeRecommendationForVariant(s) }));
    const anyComputed = pairs.some(p => p.result && !p.result.pending);
    if (!anyComputed) return;

    if (empty) empty.classList.add('hidden');
    content.classList.remove('hidden');

    // Table rows — recommendation cell includes badge + rationale + refs stacked
    const rows = pairs.map(({ state, result }) => {
        const { gene, coding, clinvarClass } = state;

        const cvCell = clinvarClass
            ? `<span class="px-2 py-1 rounded-full text-xs font-black ${getClassColor(clinvarClass)}">${clinvarClass}</span>`
            : `<span class="text-xs text-slate-400">—</span>`;

        let recCell;
        if (!result) {
            recCell = `<span class="px-2 py-1 bg-slate-100 text-slate-400 rounded text-xs font-black">Loading</span>`;
        } else if (result.pending) {
            recCell = `<span class="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs font-black">Pending</span>`;
        } else {
            const badge = `<span class="px-2 py-1 rounded text-xs font-black ${recBadgeClass(result.color)}">${result.rec}</span>`;
            const rationale = result.rationale
                ? `<p class="text-xs text-slate-500 mt-2 leading-relaxed">${result.rationale}</p>` : '';
            const refs = result.refs?.length
                ? `<div class="flex flex-wrap gap-1 mt-2">${result.refs.map(r => `<a href="${r.url}" target="_blank" class="inline-block px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-blue-600 hover:underline">${r.text}</a>`).join('')}</div>` : '';
            recCell = badge + rationale + refs;
        }

        return `<tr class="border-b border-slate-100 hover:bg-slate-50 align-top">
            <td class="px-4 py-4 font-mono font-black text-sm text-slate-800 whitespace-nowrap">${gene}</td>
            <td class="px-4 py-4 font-mono text-sm text-slate-600 whitespace-nowrap">${coding}</td>
            <td class="px-4 py-4">${cvCell}</td>
            <td class="px-4 py-4">${recCell}</td>
        </tr>`;
    }).join('');

    // Overall recommendation
    const resolved = pairs.filter(p => p.result && !p.result.pending);
    const allResolved = resolved.length === pairs.length;
    const recommended = resolved.filter(p => p.result.rec === 'RECOMMENDED');
    const mdt = resolved.filter(p => p.result.rec === 'REVIEW / MDT');
    const notOffered = resolved.filter(p => p.result.rec === 'NOT OFFERED');

    let overallColor, overallIcon, overallTitle, overallBody;
    if (!allResolved) {
        overallColor = 'slate'; overallIcon = 'fa-clock';
        overallTitle = 'PENDING';
        overallBody = 'Complete context questions for all variants to see the final recommendation.';
    } else if (recommended.length || mdt.length) {
        overallColor = 'green'; overallIcon = 'fa-check-circle';
        overallTitle = 'GERMLINE CONFIRMATION RECOMMENDED';
        const parts = [];
        if (recommended.length) parts.push(`Recommended: ${recommended.map(p => p.state.gene).join(', ')}`);
        if (mdt.length) parts.push(`MDT review: ${mdt.map(p => p.state.gene).join(', ')}`);
        if (notOffered.length) parts.push(`Not offered: ${notOffered.map(p => p.state.gene).join(', ')}`);
        overallBody = parts.join(' · ');
    } else {
        overallColor = 'red'; overallIcon = 'fa-ban';
        overallTitle = 'NOT OFFERED';
        overallBody = 'None of the identified variants meet criteria for germline confirmation.';
    }

    // Per-gene rationale sentences for the overall recommendation
    const rationaleLines = resolved
        .filter(p => p.result.rationale)
        .map(p => `<li><span class="font-black">${p.state.gene}:</span> ${p.result.rationale}</li>`)
        .join('');
    const overallRationale = rationaleLines
        ? `<ul class="mt-4 text-left space-y-2 text-sm text-${overallColor}-800 opacity-90 list-none">${rationaleLines}</ul>` : '';

    // Deduplicated references
    const seenRefs = new Set();
    const allRefs = [];
    resolved.forEach(p => (p.result.refs || []).forEach(r => { if (!seenRefs.has(r.text)) { seenRefs.add(r.text); allRefs.push(r); } }));
    const refButtons = allRefs.map(r => `<a href="${r.url}" target="_blank" rel="noopener noreferrer" class="inline-block px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-blue-600 hover:underline">${r.text}</a>`).join(' ');

    content.innerHTML = `
        <div class="space-y-6">
            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div class="px-6 py-4 border-b border-slate-100">
                    <h3 class="font-black text-slate-800 uppercase tracking-tight text-sm">Variant Summary</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50">
                            <tr>
                                <th class="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gene</th>
                                <th class="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">cDNA</th>
                                <th class="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">ClinVar</th>
                                <th class="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommendation &amp; Rationale</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
            <div class="bg-${overallColor}-50 border-4 border-${overallColor}-500 rounded-3xl p-8 animate-fade-in">
                <div class="text-center">
                    <i class="fas ${overallIcon} fa-3x text-${overallColor}-600 mb-4"></i>
                    <h3 class="text-2xl font-black text-${overallColor}-900 uppercase">${overallTitle}</h3>
                    <p class="text-${overallColor}-700 mt-2 font-semibold text-sm">${overallBody}</p>
                </div>
                ${overallRationale}
                ${refButtons ? `<div class="mt-4 flex flex-wrap gap-2 justify-center">${refButtons}</div>` : ''}
            </div>
        </div>`;
}

function recBadgeClass(color) {
    const map = { green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800', amber: 'bg-amber-100 text-amber-800', slate: 'bg-slate-100 text-slate-600' };
    return map[color] || 'bg-slate-100 text-slate-600';
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────

function classifySignificance(overallClass) {
    const cls = overallClass.toLowerCase();
    if (cls.includes('conflicting')) return 'conflicting';
    if (cls.includes('uncertain') || cls.includes('vus')) return 'vus';
    if (cls.includes('benign')) return 'benign';
    if (cls.includes('pathogenic')) return 'plp';
    return 'unknown';
}

function getClassColor(classification) {
    const cls = (classification || '').toLowerCase();
    if (cls.includes('pathogenic') && !cls.includes('likely') && !cls.includes('conflicting')) return 'bg-red-100 text-red-800';
    if (cls.includes('likely pathogenic')) return 'bg-orange-100 text-orange-800';
    if (cls.includes('uncertain') || cls.includes('vus')) return 'bg-yellow-100 text-yellow-800';
    if (cls.includes('likely benign')) return 'bg-blue-100 text-blue-800';
    if (cls.includes('benign') && !cls.includes('likely')) return 'bg-green-100 text-green-800';
    if (cls.includes('conflicting')) return 'bg-purple-100 text-purple-800';
    return 'bg-slate-100 text-slate-700';
}
