// --- GERMLINE DATA ---
const highRiskGenes = ["ATM", "BAP1", "BARD1", "BRCA1", "BRCA2", "BRIP1", "CDH11", "CHEK2", "DICER1", "EPCAM", "FH", "FLCN", "MLH1", "MSH2", "MSH6", "PALB2", "PMS2", "POLD1", "POLE", "PTCH1", "RAD51C", "RAD51D", "RB1", "RET", "SDHA", "SDHAF2", "SDHB", "SDHC", "SDHD", "SMAD3", "SMARCA4", "SMARCB1", "STK11", "SUFU", "TMEM127", "VHL", "TSC2"];

const geneContexts = {
    "CDH1": ["Invasive ductal carcinoma", "Esophagogastric cancer", "Colorectal cancer", "NSCLC", "Melanoma", "Soft Tissue Sarcoma"],
    "DICER1": ["Sex Cord Stromal tumor", "Soft Tissue Sarcoma", "Colorectal cancer", "Thyroid cancer", "Breast cancer", "Germ cell tumor", "Prostate cancer"],
    "PTCH1": ["Non-melanoma skin cancer", "Embryonal tumor", "Colorectal cancer", "Glioma", "Soft Tissue Sarcoma", "Breast cancer", "Prostate cancer"],
    "SMAD3": ["Colorectal cancer", "NSCLC", "Breast cancer", "Glioma", "Renal cell carcinoma", "Soft Tissue Sarcoma"],
    "MEN1": ["NSCLC", "Melanoma", "Hepatobilliary cancer"],
    "WT1": ["Symptoms of Wilms' Tumor Syndrome"],
    "CDKN2A": ["Melanoma", "Soft Tissue Sarcoma", "Breast cancer", "Endometrial cancer", "Colorectal cancer", "Thymic tumor", "Bone cancer", "CNS cancer"],
    "NF1": ["Nerve Sheath tumor", "PNS tumor", "Soft Tissue Sarcoma", "GIST", "Pancreatic cancer", "Esophagogastric cancer", "Hepatobilliary cancer", "Mesothelioma", "Sex Cord Stromal", "Thymic tumor", "Cancer of Unknown Primary"],
    "PTEN": ["Symptoms of Cowden Syndrome"],
    "RB1": ["Retinoblastoma", "Bone cancer", "CNS cancer", "Endometrial cancer", "Esophagogastric cancer", "Non-melanoma skin cancer", "Renal cell carcinoma"],
    "SMAD4": ["Cancer of Unknown Primary", "Mesothelioma"],
    "SMARCA4": ["Ovarian cancer", "Pancreatic cancer", "Head and Neck cancer", "Glioma", "Prostate cancer"],
    "SMARCB1": ["Soft Tissue Rhabdoid tumor", "Renal Cell Carcinoma", "Thyroid cancer", "Embryonal tumor"],
    "VHL": ["Renal Cell Carcinoma"],
    "APC": ["Patient age ≤ 30", "2+ variants in APC"],
    "TP53": ["Patient age ≤ 30", "2+ variants in TP53"],
    "MUTYH": ["Biallelic status (2+ variants)", "c.452A>G", "c.1103G>A"],
    "EGFR": ["TKI Treatment-Naïve"]
};

const allGenes = [...new Set([...highRiskGenes, ...Object.keys(geneContexts), "HOXB13", "TERT"])].sort();

// --- GERMLINE LOGIC ---
let lastGene = "";

function initGermline() {
    const dl = document.getElementById('geneDatalist');
    allGenes.forEach(g => { const o = document.createElement('option'); o.value = g; dl.appendChild(o); });
}

function handleGermlineChange() {
    const geneEl = document.getElementById('gGene');
    const details = document.getElementById('gDetails');
    const context = document.getElementById('gContext');

    if (!geneEl) return;
    const gene = geneEl.value.toUpperCase();

    if (!gene) {
        if (details) details.classList.add('hidden');
        return;
    }

    if (details) details.classList.remove('hidden');

    if (gene !== lastGene) {
        if (context) {
            context.innerHTML = '';
            if (geneContexts[gene]) {
                context.classList.remove('hidden');
                geneContexts[gene].forEach(c => {
                    context.innerHTML += `<label class="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" class="ctx-check" value="${c}" onchange="runGermlineLogic()"> ${c}</label>`;
                });
            } else {
                context.classList.add('hidden');
            }
        }
        lastGene = gene;
    }
    runGermlineLogic();
}

function runGermlineLogic() {
    const geneEl = document.getElementById('gGene');
    const codingEl = document.getElementById('gCoding');
    const empty = document.getElementById('gEmptyState');
    const content = document.getElementById('gResultContent');

    if (!geneEl || !codingEl || !empty || !content) return;

    const gene = geneEl.value.toUpperCase();
    const coding = codingEl.value.trim();
    const anyCtx = Array.from(document.querySelectorAll('.ctx-check')).some(c => c.checked);

    if (!gene) { empty.classList.remove('hidden'); content.classList.add('hidden'); return; }
    empty.classList.add('hidden'); content.classList.remove('hidden');

    let rec = "REVIEW"; let sub = "Check local protocol."; let color = "slate"; let icon = "fa-search";

    if (highRiskGenes.includes(gene) && gene !== "VHL") {
        rec = "RECOMMENDED"; color = "green"; icon = "fa-check-circle";
        sub = "Identified as High-Risk in Nov 2025 Workflow.";
    } else if (gene === "VHL") {
        if (anyCtx) { rec = "NOT RECOMMENDED"; color = "red"; icon = "fa-ban"; sub = "VHL confirmation not offered for isolated RCC."; }
        else { rec = "RECOMMENDED"; color = "green"; sub = "Recommended in non-RCC clinical contexts."; }
    } else if (gene === "HOXB13" && coding.includes("c.251G>A")) {
        rec = "RECOMMENDED"; color = "green"; icon = "fa-fingerprint"; sub = "Founder mutation identified.";
    } else if (geneContexts[gene]) {
        if (anyCtx) { rec = "RECOMMENDED"; color = "green"; icon = "fa-user-check"; sub = "Clinical context met for confirmation."; }
        else { rec = "REVIEW CONTEXT"; color = "slate"; sub = "Check applicable patient context buttons."; }
    } else {
        rec = "NOT RECOMMENDED"; color = "slate"; sub = "Variant does not meet current priority for confirmation.";
    }

    content.innerHTML = `
        <div class="bg-${color}-50 border-${color}-500 border-4 rounded-3xl p-10 h-full flex flex-col items-center justify-center text-center shadow-xl animate-fade-in">
            <i class="fas ${icon} fa-4xl text-${color}-600 mb-6"></i>
            <h3 class="text-3xl font-black text-${color}-900 uppercase">Germline Confirmation:<br>${rec}</h3>
            <p class="text-lg text-${color}-700 mt-4 font-semibold">${sub}</p>
            <div class="mt-8 px-6 py-3 bg-white border rounded-xl font-mono font-bold text-slate-800">${gene} ${coding}</div>
        </div>`;
}

initGermline();
