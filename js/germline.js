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

// Step 8: age ≤30 at diagnosis → REVIEW/MDT, else NOT OFFERED
const step8Genes = [
    "AIP", "AXIN2", "CDK4", "CTNNA1", "EGFR", "EGLN1", "EXT1", "EXT2",
    "GALNT12", "GREM1", "HOXB13", "KIT", "LZTR1", "MAX", "MEN1", "MET",
    "MITF", "MLH3", "NBN", "NTHL1", "PDGFRA", "POT1", "PRKAR1", "RECQL",
    "RNF43", "RPS20", "SMARCE1", "TERT", "WT1"
];

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

    // All other Step 8 genes (including HOXB13/TERT before founder variant check): show age section
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
        return render("RECOMMENDED", "green", "fa-check-circle", "Identified in ESMO 2022 high-risk gene list.");
    }

    // VHL: RECOMMENDED unless RCC context (note 5)
    if (gene === "VHL") {
        if (anyCtx) return render("NOT OFFERED", "red", "fa-ban", "VHL confirmation not recommended for Renal Cell Carcinoma (note 5).");
        return render("RECOMMENDED", "green", "fa-check-circle", "Recommended in non-RCC clinical contexts.");
    }

    // Step 3 (notes 1–4) + Step 7 (notes 10–16): context-gated
    if (contextGenes[gene]) {
        if (anyCtx) return render("RECOMMENDED", "green", "fa-user-check", "Clinical context met for germline confirmation.");
        return render("REVIEW CONTEXT", "slate", "fa-search", "Select all applicable clinical contexts above.");
    }

    // MUTYH: founder variants only (Step 5)
    if (gene === "MUTYH") {
        if (coding.includes("c.452A>G") || coding.includes("c.1103G>A")) {
            return render("RECOMMENDED", "green", "fa-fingerprint", "Known MUTYH founder variant identified.");
        }
        return render("NOT OFFERED", "red", "fa-ban", "MUTYH variant is not a known founder mutation (c.452A>G or c.1103G>A).");
    }

    // APC: founder variant or 2+ P/LP variants (Step 5)
    if (gene === "APC") {
        if (coding.includes("c.3920T>A")) return render("RECOMMENDED", "green", "fa-fingerprint", "Known APC founder variant (c.3920T>A) identified.");
        if (multiVariantChecked) return render("RECOMMENDED", "green", "fa-check-circle", "2 or more P/LP variants reported in APC.");
        return render("NOT OFFERED", "red", "fa-ban", "APC variant does not meet criteria for germline confirmation.");
    }

    // TP53: founder variant or 2+ P/LP variants (Step 5)
    if (gene === "TP53") {
        if (coding.includes("c.1010G>A")) return render("RECOMMENDED", "green", "fa-fingerprint", "Known TP53 founder variant (c.1010G>A) identified.");
        if (multiVariantChecked) return render("RECOMMENDED", "green", "fa-check-circle", "2 or more P/LP variants reported in TP53.");
        return render("NOT OFFERED", "red", "fa-ban", "TP53 variant does not meet criteria for germline confirmation.");
    }

    // HOXB13: founder variant → RECOMMENDED (Step 6); else fall to Step 8
    if (gene === "HOXB13" && coding.includes("c.251G>A")) {
        return render("RECOMMENDED", "green", "fa-fingerprint", "Known HOXB13 founder variant (c.251G>A) identified.");
    }

    // TERT: founder variant → RECOMMENDED (Step 6); else fall to Step 8
    if (gene === "TERT" && coding.includes("c.-57T>G")) {
        return render("RECOMMENDED", "green", "fa-fingerprint", "Known TERT founder variant (c.-57T>G) identified.");
    }

    // EGFR: c.2369C>T + TKI treatment-naïve → RECOMMENDED (note 7); else fall to Step 8
    if (gene === "EGFR" && coding.includes("c.2369C>T") && anyCtx) {
        return render("RECOMMENDED", "green", "fa-user-check", "EGFR c.2369C>T in TKI treatment-naïve patient (note 7).");
    }

    // Step 8: age-gated
    if (step8Genes.includes(gene)) {
        if (ageInput === '') return render("REVIEW CONTEXT", "slate", "fa-search", "Enter patient age at diagnosis to continue.");
        if (ageUnder30) return render("REVIEW / MDT", "amber", "fa-users", "Discuss with multidisciplinary team to determine if germline testing should be offered.");
        return render("NOT OFFERED", "red", "fa-ban", "Patient age does not meet criteria for germline confirmation (age > 30).");
    }

    // Not in any list
    return render("NOT OFFERED", "red", "fa-ban", "Variant does not meet current criteria for germline confirmation.");
}

function render(rec, color, icon, sub) {
    const gene = document.getElementById('gGene').value.toUpperCase().trim();
    const coding = document.getElementById('gCoding').value.trim();
    document.getElementById('gResultContent').innerHTML = `
        <div class="bg-${color}-50 border-${color}-500 border-4 rounded-3xl p-10 h-full flex flex-col items-center justify-center text-center shadow-xl animate-fade-in">
            <i class="fas ${icon} fa-4xl text-${color}-600 mb-6"></i>
            <h3 class="text-3xl font-black text-${color}-900 uppercase">Germline Confirmation:<br>${rec}</h3>
            <p class="text-lg text-${color}-700 mt-4 font-semibold">${sub}</p>
            <div class="mt-8 px-6 py-3 bg-white border rounded-xl font-mono font-bold text-slate-800">${gene} ${coding}</div>
        </div>`;
}

initGermline();
