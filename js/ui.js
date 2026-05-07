// ─── ELIGIBILITY UI ──────────────────────────────────────────────────────────

const sInput = document.getElementById('cancerSearch');
const sRes = document.getElementById('searchResults');

sInput.addEventListener('input', () => {
    const val = sInput.value.toLowerCase();
    sRes.innerHTML = '';
    if (!val) { sRes.classList.add('hidden'); return; }
    const matches = searchDiagnoses(sInput.value);
    matches.forEach(m => {
        const d = document.createElement('div');
        d.className = 'p-3 hover:bg-blue-50 cursor-pointer border-b text-sm font-bold text-slate-600';
        d.textContent = m;
        d.onclick = () => selectDx(m);
        sRes.appendChild(d);
    });
    sRes.classList.toggle('hidden', !matches.length);
});

function selectDx(dx) {
    const qs = getCriteriaForDx(dx);
    document.getElementById('eligibilityQuestionnaire').classList.remove('hidden');
    document.getElementById('eligTitle').textContent = dx;
    sRes.classList.add('hidden'); sInput.value = '';

    const bullets = qs.map(q => `<li class="text-sm font-semibold text-slate-700">${q}</li>`).join('');

    const container = document.getElementById('eligQuestions');
    container.className = '';
    container.innerHTML = `
        <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">CCO eligibility criteria for this diagnosis</p>
        <ul class="list-disc list-inside space-y-2 mb-6">${bullets}</ul>
        <p class="text-sm font-bold text-slate-600 mb-3">Does this case meet one or more of the above criteria?</p>
        <div class="flex gap-3">
            <button id="eligYesBtn" onclick="setEligAnswer('yes')"
                class="flex-1 py-4 bg-white border-2 border-slate-300 text-slate-500 font-black rounded-xl uppercase tracking-widest hover:border-green-400 hover:text-green-700 transition-all">
                <i class="fas fa-check mr-2"></i> Yes
            </button>
            <button id="eligNoBtn" onclick="setEligAnswer('no')"
                class="flex-1 py-4 bg-white border-2 border-slate-300 text-slate-500 font-black rounded-xl uppercase tracking-widest hover:border-red-400 hover:text-red-600 transition-all">
                <i class="fas fa-times mr-2"></i> No
            </button>
        </div>`;

    const result = document.getElementById('eligFinalResult');
    if (result) { result.classList.add('hidden'); result.innerHTML = ''; }
}

function setEligAnswer(val) {
    const yesBtn = document.getElementById('eligYesBtn');
    const noBtn  = document.getElementById('eligNoBtn');
    if (yesBtn && noBtn) {
        yesBtn.className = val === 'yes'
            ? 'flex-1 py-4 bg-green-600 text-white font-black rounded-xl uppercase tracking-widest ring-2 ring-green-400'
            : 'flex-1 py-4 bg-white border-2 border-slate-300 text-slate-500 font-black rounded-xl uppercase tracking-widest hover:border-green-400 hover:text-green-700 transition-all';
        noBtn.className = val === 'no'
            ? 'flex-1 py-4 bg-red-500 text-white font-black rounded-xl uppercase tracking-widest ring-2 ring-red-300'
            : 'flex-1 py-4 bg-white border-2 border-slate-300 text-slate-500 font-black rounded-xl uppercase tracking-widest hover:border-red-400 hover:text-red-600 transition-all';
    }
    calcElig(val);
}

function calcElig(val) {
    const result = document.getElementById('eligFinalResult');
    if (!result) return;
    result.classList.remove('hidden');
    if (val === 'yes') {
        result.className = 'mt-8 p-6 rounded-2xl bg-green-50 border-2 border-green-500 text-green-900 animate-fade-in';
        result.innerHTML = `<h3 class="font-black text-xl">ELIGIBILITY CONFIRMED</h3><p class="mt-1">Patient meets Provincial HCT criteria.</p>`;
    } else if (val === 'no') {
        result.className = 'mt-8 p-6 rounded-2xl bg-red-50 border-2 border-red-500 text-red-900 animate-fade-in';
        result.innerHTML = `<h3 class="font-black text-xl">ELIGIBILITY NOT MET</h3><p class="mt-1">Does not meet CCO criteria for this diagnosis.</p>`;
    }
}

function resetEligibility() {
    document.getElementById('eligibilityQuestionnaire').classList.add('hidden');
}


// ─── GERMLINE UI ─────────────────────────────────────────────────────────────

async function lookupAllVariants() {
    const input = document.getElementById('gVariantInput')?.value || '';
    const states = parseVariants(input);
    if (!states.length) {
        alert('Please enter at least one variant in the format: GENE c.xxxxx');
        return;
    }
    const missingCoding = states.filter(s => !s.coding).map(s => s.gene);
    if (missingCoding.length) {
        alert(`ClinVar lookup requires a cDNA change for each variant.\nMissing cDNA for: ${missingCoding.join(', ')}\n\nUse "Skip" to check gene recommendations without a specific variant.`);
        return;
    }
    window.variantStates = states;
    document.getElementById('gVariantCards').classList.remove('hidden');
    resetRightPanel();
    renderVariantCards();
    for (let i = 0; i < states.length; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 700)); // stay within NCBI rate limit (3 req/sec)
        await lookupSingleVariant(states[i]);
        renderVariantCards();
        updateResultsPanel();
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

// ─── UI HELPERS ──────────────────────────────────────────────────────────────

function recBadgeClass(color) {
    const map = { green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800', amber: 'bg-amber-100 text-amber-800', slate: 'bg-slate-100 text-slate-600' };
    return map[color] || 'bg-slate-100 text-slate-600';
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
