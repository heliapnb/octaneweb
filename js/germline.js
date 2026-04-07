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
    const dl = document.getElementById('geneDatalist');
    allGenes.forEach(g => { const o = document.createElement('option'); o.value = g; dl.appendChild(o); });
}

function handleGermlineChange() {
    const geneEl = document.getElementById('gGene');
    const details = document.getElementById('gDetails');
    if (!geneEl) return;
    const gene = geneEl.value.toUpperCase().trim();
    if (!gene) { if (details) details.classList.add('hidden'); return; }
    if (details) details.classList.remove('hidden');
    updateContextDisplay();
    runGermlineLogic();
}

function updateContextDisplay() {
    const geneEl = document.getElementById('gGene');
    const codingEl = document.getElementById('gCoding');
    const context = document.getElementById('gContext');
    const ageSection = document.getElementById('gAgeSection');
    const multiVariantSection = document.getElementById('gMultiVariantSection');

    if (!geneEl) return;
    const gene = geneEl.value.toUpperCase().trim();
    const coding = codingEl ? codingEl.value.trim() : '';

    // Reset all dynamic sections
    if (context) { context.innerHTML = ''; context.classList.add('hidden'); }
    if (ageSection) ageSection.classList.add('hidden');
    if (multiVariantSection) {
        multiVariantSection.classList.add('hidden');
        const cb = document.getElementById('gMultiVariant');
        if (cb) cb.checked = false;
    }

    if (!gene) return;

    // VHL: show RCC context checkbox (note 5)
    if (gene === "VHL") {
        context.classList.remove('hidden');
        context.innerHTML = `
            <p class="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Clinical Context</p>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                <input type="checkbox" class="ctx-check w-4 h-4" value="Renal Cell Carcinoma" onchange="runGermlineLogic()"> Renal Cell Carcinoma
            </label>`;
        return;
    }

    // Context-gated genes: show applicable context checkboxes
    if (contextGenes[gene]) {
        context.classList.remove('hidden');
        context.innerHTML = `<p class="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Select all applicable clinical contexts</p>`;
        contextGenes[gene].forEach(c => {
            context.innerHTML += `<label class="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" class="ctx-check w-4 h-4" value="${c}" onchange="runGermlineLogic()"> ${c}</label>`;
        });
        return;
    }

    // APC or TP53: show 2+ variants checkbox only when variant is not the known founder
    if (gene === "APC" || gene === "TP53") {
        const founderVariant = gene === "APC" ? "c.3920T>A" : "c.1010G>A";
        if (!coding.includes(founderVariant)) {
            multiVariantSection.classList.remove('hidden');
            const label = document.getElementById('gMultiVariantLabel');
            if (label) label.textContent = `2 or more reported P/LP variants identified in ${gene}`;
        }
        return;
    }

    // EGFR: show TKI context if specific variant entered; always show age section (note 7)
    if (gene === "EGFR") {
        if (coding.includes("c.2369C>T")) {
            context.classList.remove('hidden');
            context.innerHTML = `
                <p class="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Clinical Context</p>
                <label class="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                    <input type="checkbox" class="ctx-check w-4 h-4" value="TKI Treatment-Naïve" onchange="runGermlineLogic()"> TKI Treatment-Naïve
                </label>`;
        }
        ageSection.classList.remove('hidden');
        return;
    }

    // All other Step 8 genes: show age section
    if (step8Genes.includes(gene)) {
        ageSection.classList.remove('hidden');
    }
}

function runGermlineLogic() {
    const geneEl = document.getElementById('gGene');
    const codingEl = document.getElementById('gCoding');
    const ageEl = document.getElementById('gAge');
    const empty = document.getElementById('gEmptyState');
    const resultContent = document.getElementById('gResultContent');

    if (!geneEl || !codingEl || !empty || !resultContent) return;

    const gene = geneEl.value.toUpperCase().trim();
    const coding = codingEl.value.trim();
    const ageInput = ageEl ? ageEl.value.trim() : '';
    const ageUnder30 = ageInput !== '' && parseInt(ageInput) <= 30;
    const anyCtx = Array.from(document.querySelectorAll('.ctx-check')).some(c => c.checked);
    const multiVariantChecked = document.getElementById('gMultiVariant')?.checked || false;

    if (!gene) {
        empty.classList.remove('hidden');
        resultContent.classList.add('hidden');
        return;
    }
    empty.classList.add('hidden');
    resultContent.classList.remove('hidden');

    // Step 3: Unconditionally RECOMMENDED
    if (step3Genes.includes(gene)) {
        return render("RECOMMENDED", "green", "fa-check-circle",
            "Identified in ESMO 2022 high-risk gene list.",
            `${gene} meets the ≥5% germline conversion rate threshold across tumor types, identified as a Most Actionable or High-Actionability cancer susceptibility gene in analysis of 49,264 paired tumor-normal samples.`,
            [REFS.kuzbari]
        );
    }

    // VHL: RECOMMENDED unless RCC context (note 5)
    if (gene === "VHL") {
        if (anyCtx) return render("NOT OFFERED", "red", "fa-ban",
            "VHL confirmation not recommended for Renal Cell Carcinoma.",
            "VHL has only 1.5% germline conversion rate in renal cell carcinoma, due to the very high frequency of somatic VHL mutations in RCC. Germline confirmation is not recommended in this context.",
            [REFS.kuzbari]
        );
        return render("RECOMMENDED", "green", "fa-check-circle",
            "Recommended in non-RCC clinical contexts.",
            "VHL has 59.4% germline conversion rate in non-RCC tumors, supporting germline confirmation outside of renal cell carcinoma.",
            [REFS.kuzbari]
        );
    }

    // Step 3 (notes 1–4) + Step 7 (notes 10–16): context-gated
    if (contextGenes[gene]) {
        if (anyCtx) return render("RECOMMENDED", "green", "fa-user-check",
            "Clinical context met for germline confirmation.",
            contextRationale[gene] || `${gene} germline conversion rate is context-dependent. Selected clinical context supports germline confirmation.`,
            [REFS.kuzbari, REFS.ricker]
        );
        return render("REVIEW CONTEXT", "slate", "fa-search",
            "Select all applicable clinical contexts above.",
            null, null
        );
    }

    // MUTYH: founder variants only (Step 5)
    if (gene === "MUTYH") {
        if (coding.includes("c.452A>G") || coding.includes("c.1103G>A")) {
            return render("RECOMMENDED", "green", "fa-fingerprint",
                "Known MUTYH founder variant identified.",
                "MUTYH has a 98.5% germline conversion rate. The detected variant is a known founder mutation, confirming germline origin.",
                [REFS.klek, REFS.kuzbari]
            );
        }
        return render("NOT OFFERED", "red", "fa-ban",
            "MUTYH variant is not a known founder mutation (c.452A>G or c.1103G>A).",
            "While MUTYH has a 98.5% germline conversion rate, this workflow recommends confirmation only for the established founder variants c.452A>G and c.1103G>A.",
            [REFS.klek, REFS.kuzbari]
        );
    }

    // APC: founder variant or 2+ P/LP variants (Step 5)
    if (gene === "APC") {
        if (coding.includes("c.3920T>A")) return render("RECOMMENDED", "green", "fa-fingerprint",
            "Known APC founder variant (c.3920T>A) identified.",
            "APC c.3920T>A is a known germline founder mutation. APC has only 1.1% overall germline conversion rate due to high somatic mutation frequency, but this specific variant is a confirmed germline founder.",
            [REFS.klek, REFS.kuzbari]
        );
        if (multiVariantChecked) return render("RECOMMENDED", "green", "fa-check-circle",
            "2 or more P/LP variants reported in APC.",
            "The presence of 2 or more pathogenic/likely pathogenic variants in APC substantially increases germline probability over somatic. APC overall germline conversion rate is 1.1%, but biallelic findings are a strong indicator of germline predisposition.",
            [REFS.amp, REFS.kuzbari]
        );
        return render("NOT OFFERED", "red", "fa-ban",
            "APC variant does not meet criteria for germline confirmation.",
            "APC has only 1.1% overall germline conversion rate due to its very high somatic mutation frequency in colorectal tumors. Confirmation is reserved for the known founder variant (c.3920T>A) or biallelic P/LP findings.",
            [REFS.kuzbari, REFS.klek]
        );
    }

    // TP53: founder variant or 2+ P/LP variants (Step 5)
    if (gene === "TP53") {
        if (coding.includes("c.1010G>A")) return render("RECOMMENDED", "green", "fa-fingerprint",
            "Known TP53 founder variant (c.1010G>A) identified.",
            "TP53 c.1010G>A is a known germline founder mutation. TP53 overall germline conversion rate is 0.9% (rising to 15.8% in patients ≤30 years), but this specific variant is a confirmed germline founder.",
            [REFS.klek, REFS.kuzbari]
        );
        if (multiVariantChecked) return render("RECOMMENDED", "green", "fa-check-circle",
            "2 or more P/LP variants reported in TP53.",
            "Two or more P/LP variants in TP53 substantially increases germline probability. TP53 overall germline conversion rate is 0.9%, but biallelic or multiple findings are indicative of germline origin.",
            [REFS.amp, REFS.kuzbari]
        );
        return render("NOT OFFERED", "red", "fa-ban",
            "TP53 variant does not meet criteria for germline confirmation.",
            "TP53 has only 0.9% overall germline conversion rate due to its very high frequency as a somatic driver mutation. Confirmation is reserved for the known founder variant (c.1010G>A) or biallelic findings.",
            [REFS.kuzbari, REFS.klek]
        );
    }

    // HOXB13: founder variant → RECOMMENDED (Step 6); else fall to Step 8
    if (gene === "HOXB13" && coding.includes("c.251G>A")) {
        return render("RECOMMENDED", "green", "fa-fingerprint",
            "Known HOXB13 founder variant (c.251G>A) identified.",
            "HOXB13 c.251G>A is a known founder germline variant associated with hereditary prostate cancer risk.",
            [REFS.klek, REFS.clark]
        );
    }

    // TERT: founder variant → RECOMMENDED (Step 6); else fall to Step 8
    if (gene === "TERT" && coding.includes("c.-57T>G")) {
        return render("RECOMMENDED", "green", "fa-fingerprint",
            "Known TERT founder variant (c.-57T>G) identified.",
            "TERT c.-57T>G is a known founder germline variant associated with increased cancer susceptibility.",
            [REFS.klek, REFS.clark]
        );
    }

    // EGFR: c.2369C>T + TKI treatment-naïve → RECOMMENDED (note 7); else fall to Step 8
    if (gene === "EGFR" && coding.includes("c.2369C>T") && anyCtx) {
        return render("RECOMMENDED", "green", "fa-user-check",
            "EGFR c.2369C>T in TKI treatment-naïve patient.",
            "EGFR c.2369C>T (p.T790M) in a TKI treatment-naïve patient suggests germline origin rather than an acquired resistance mutation. Germline confirmation recommended per ASCO 2024 guidelines.",
            [REFS.ricker]
        );
    }

    // Step 8: age-gated
    if (step8Genes.includes(gene)) {
        if (ageInput === '') return render("REVIEW CONTEXT", "slate", "fa-search",
            "Enter patient age at diagnosis to continue.",
            null, null
        );
        if (ageUnder30) return render("REVIEW / MDT", "amber", "fa-users",
            "Discuss with multidisciplinary team.",
            `${gene} has low overall germline conversion rate but elevated germline probability in patients ≤30 years at diagnosis. MDT discussion is recommended to determine if germline testing should be offered.`,
            [REFS.kuzbari, REFS.ricker]
        );
        return render("NOT OFFERED", "red", "fa-ban",
            "Patient age does not meet criteria for germline confirmation.",
            `${gene} has low overall germline conversion rate. Germline follow-up for this gene is only considered when the patient was diagnosed at age ≤30. Current patient age does not meet this threshold.`,
            [REFS.kuzbari]
        );
    }

    // Not in any list
    return render("NOT OFFERED", "red", "fa-ban",
        "Variant does not meet current criteria for germline confirmation.",
        "This gene is not included in the current germline confirmation workflow.",
        null
    );
}

function render(rec, color, icon, sub, rationale, refs) {
    const gene = document.getElementById('gGene').value.toUpperCase().trim();
    const coding = document.getElementById('gCoding').value.trim();

    const refLinks = refs && refs.length > 0
        ? refs.map(r => `<a href="${r.url}" target="_blank" rel="noopener noreferrer" class="inline-block px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-blue-600 hover:underline">${r.text}</a>`).join(' ')
        : '';

    document.getElementById('gResultContent').innerHTML = `
        <div class="bg-${color}-50 border-${color}-500 border-4 rounded-3xl p-10 h-full flex flex-col items-center justify-center text-center shadow-xl animate-fade-in">
            <i class="fas ${icon} fa-4xl text-${color}-600 mb-6"></i>
            <h3 class="text-3xl font-black text-${color}-900 uppercase">Germline Confirmation:<br>${rec}</h3>
            <p class="text-lg text-${color}-700 mt-4 font-semibold">${sub}</p>
            ${rationale ? `<p class="text-sm text-${color}-800 mt-3 max-w-lg opacity-80">${rationale}</p>` : ''}
            <div class="mt-6 px-6 py-3 bg-white border rounded-xl font-mono font-bold text-slate-800">${gene} ${coding}</div>
            ${refLinks ? `<div class="mt-4 flex flex-wrap gap-2 justify-center">${refLinks}</div>` : ''}
        </div>`;
}

// --- CLINVAR / FRANKLIN LOOKUP ---

async function lookupVariant() {
    const gene = document.getElementById('gGene').value.toUpperCase().trim();
    const coding = document.getElementById('gCoding').value.trim();
    const dbResults = document.getElementById('dbResults');
    const dbContent = document.getElementById('dbContent');
    const dbStatus = document.getElementById('dbStatus');

    if (!gene || !coding) {
        dbResults.classList.remove('hidden');
        dbStatus.textContent = "Missing Input";
        dbStatus.className = "px-3 py-1 bg-red-100 rounded-full text-[10px] font-black text-red-600 uppercase tracking-widest";
        dbContent.innerHTML = `<p class="text-xs text-red-500 font-bold">Please enter both a gene name and cDNA variant before looking up.</p>`;
        return;
    }

    dbResults.classList.remove('hidden');
    dbStatus.textContent = "Searching ClinVar...";
    dbStatus.className = "px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest";
    dbContent.innerHTML = `<div class="h-8 rounded-xl bg-slate-100 animate-pulse"></div><div class="h-8 rounded-xl bg-slate-100 animate-pulse mt-2"></div>`;

    try {
        // Step 1: Search ClinVar by gene + cDNA notation
        const searchTerm = encodeURIComponent(`${gene}[gene] ${coding}`);
        const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar&term=${searchTerm}&retmode=json&retmax=5`;

        const searchResp = await fetch(searchUrl);
        if (!searchResp.ok) throw new Error('ClinVar search request failed');
        const searchData = await searchResp.json();
        const ids = searchData.esearchresult?.idlist || [];

        if (ids.length === 0) {
            showFranklinFallback(gene, coding, dbContent, dbStatus);
            return;
        }

        // Step 2: Get variant summary from ClinVar
        const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=clinvar&id=${ids[0]}&retmode=json`;
        const summaryResp = await fetch(summaryUrl);
        if (!summaryResp.ok) throw new Error('ClinVar summary request failed');
        const summaryData = await summaryResp.json();
        const variant = summaryData.result?.[ids[0]];

        if (!variant) {
            showFranklinFallback(gene, coding, dbContent, dbStatus);
            return;
        }

        // Extract overall germline classification
        const overallClass = variant.germline_classification?.description
            || variant.clinical_significance?.description
            || 'Not classified';

        // Count individual submissions by classification
        const scvs = variant.supporting_submissions?.scv || [];
        const counts = {};
        scvs.forEach(scv => {
            const cls = scv.germline_classification || scv.classification || 'Unknown';
            counts[cls] = (counts[cls] || 0) + 1;
        });

        const total = scvs.length;
        const submissionSummary = Object.entries(counts)
            .map(([cls, n]) => `<span class="font-black">${n}×</span> ${cls}`)
            .join(' &nbsp;·&nbsp; ');

        const clinvarUrl = `https://www.ncbi.nlm.nih.gov/clinvar/variation/${ids[0]}/`;
        const classColor = getClassColor(overallClass);

        dbStatus.textContent = "ClinVar";
        dbStatus.className = "px-3 py-1 bg-blue-100 rounded-full text-[10px] font-black text-blue-700 uppercase tracking-widest";
        dbContent.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Germline Classification</span>
                    <span class="px-3 py-1 rounded-full text-xs font-black ${classColor}">${overallClass}</span>
                </div>
                <div class="p-3 bg-slate-50 rounded-lg">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Submissions (${total} total)</p>
                    <p class="text-sm text-slate-700">${total > 0 ? submissionSummary : 'No individual submissions recorded'}</p>
                </div>
                <a href="${clinvarUrl}" target="_blank" rel="noopener noreferrer"
                   class="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">
                   <i class="fas fa-external-link-alt"></i> View full record on ClinVar
                </a>
            </div>`;

    } catch (err) {
        dbStatus.textContent = "Error";
        dbStatus.className = "px-3 py-1 bg-red-100 rounded-full text-[10px] font-black text-red-600 uppercase tracking-widest";
        dbContent.innerHTML = `<p class="text-xs text-red-500 font-bold">Could not reach ClinVar. Please check your connection or <a href="https://www.ncbi.nlm.nih.gov/clinvar/" target="_blank" class="underline">search manually</a>.</p>`;
    }
}

function showFranklinFallback(gene, coding, dbContent, dbStatus) {
    const franklinUrl = `https://franklin.genoox.com/clinical-db/home`;
    dbStatus.textContent = "No ClinVar Data";
    dbStatus.className = "px-3 py-1 bg-amber-100 rounded-full text-[10px] font-black text-amber-700 uppercase tracking-widest";
    dbContent.innerHTML = `
        <div class="space-y-3">
            <p class="text-sm font-bold text-slate-700">No ClinVar submissions found for <span class="font-mono">${gene} ${coding}</span>.</p>
            <p class="text-xs text-slate-500">Check Franklin (Genoox) for an alternative germline classification. Search for <span class="font-mono font-bold">${gene} ${coding}</span> on Franklin:</p>
            <a href="${franklinUrl}" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-black rounded-lg hover:bg-slate-700 transition-all uppercase tracking-widest">
               <i class="fas fa-external-link-alt"></i> Open Franklin
            </a>
        </div>`;
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

initGermline();
