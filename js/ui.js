// ─── ELIGIBILITY UI ──────────────────────────────────────────────────────────

const sInput = document.getElementById('cancerSearch');
const sRes = document.getElementById('searchResults');

sInput.addEventListener('input', () => {
    const val = sInput.value;
    sRes.innerHTML = '';
    if (!val) { sRes.classList.add('hidden'); return; }
    const matches = searchDiagnoses(val);
    matches.forEach(m => {
        const d = document.createElement('div');
        d.className = 'o-search-item';
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
    sRes.classList.add('hidden');
    sInput.value = '';

    const items = qs.map(q => `<li>${q}</li>`).join('');

    const container = document.getElementById('eligQuestions');
    container.className = 'fade-in';
    container.innerHTML = `
        <div class="o-crit-label">CCO eligibility criteria for this diagnosis</div>
        <ul class="o-crit">${items}</ul>
        <div class="o-q">
            <p class="o-q-prompt">Does this case meet one or more of the above criteria?</p>
            <div class="o-yn">
                <button id="eligYesBtn" onclick="setEligAnswer('yes')" class="o-yn-btn">Yes</button>
                <button id="eligNoBtn" onclick="setEligAnswer('no')" class="o-yn-btn">No</button>
            </div>
        </div>`;

    const result = document.getElementById('eligFinalResult');
    if (result) { result.classList.add('hidden'); result.innerHTML = ''; result.className = 'hidden'; }
}

function setEligAnswer(val) {
    const yesBtn = document.getElementById('eligYesBtn');
    const noBtn  = document.getElementById('eligNoBtn');
    if (yesBtn && noBtn) {
        yesBtn.className = 'o-yn-btn' + (val === 'yes' ? ' is-yes-on' : '');
        noBtn.className  = 'o-yn-btn' + (val === 'no'  ? ' is-no-on'  : '');
    }
    calcElig(val);
}

function calcElig(val) {
    const result = document.getElementById('eligFinalResult');
    if (!result) return;
    result.classList.remove('hidden');
    if (val === 'yes') {
        result.className = 'o-verdict is-success fade-in';
        result.innerHTML = `
            <span class="o-verdict-badge">Confirmed</span>
            <span class="o-verdict-text">Patient meets Provincial HCT criteria.</span>`;
    } else if (val === 'no') {
        result.className = 'o-verdict is-danger fade-in';
        result.innerHTML = `
            <span class="o-verdict-badge">Not Met</span>
            <span class="o-verdict-text">Does not meet CCO criteria for this diagnosis.</span>`;
    }
}

function resetEligibility() {
    document.getElementById('eligibilityQuestionnaire').classList.add('hidden');
}


// ─── GERMLINE UI ─────────────────────────────────────────────────────────────

// ── Variant input rows ──

function buildVariantRowHtml() {
    return `
        <div class="o-vrow" data-vrow>
            <input type="text" class="o-vrow-input gene-field" placeholder="GENE" data-gene autocomplete="off">
            <input type="text" class="o-vrow-input cdna-field" placeholder="c.xxxxx" data-coding oninput="normalizeCDNAInput(this)" autocomplete="off">
            <button class="o-vrow-remove" onclick="removeVariantRow(this)" title="Remove variant" aria-label="Remove variant">×</button>
        </div>`;
}

// Normalize cDNA notation to ClinVar's expected case:
// - lowercase everywhere by default (so "c." prefix and operators
//   like "dup", "del", "ins" stay lowercase)
// - uppercase the A/C/G/T nucleotides that flank ">" or follow an operator
function normalizeCDNA(s) {
    if (!s) return s;
    let result = s.toLowerCase();
    result = result.replace(/([acgt]+)>([acgt]+)/g, (_, a, b) => a.toUpperCase() + '>' + b.toUpperCase());
    result = result.replace(/(delins|dup|del|ins|inv)([acgt]+)/g, (_, op, nt) => op + nt.toUpperCase());
    return result;
}

function normalizeCDNAInput(input) {
    const pos = input.selectionStart;
    const oldVal = input.value;
    const newVal = normalizeCDNA(oldVal);
    if (newVal !== oldVal) {
        input.value = newVal;
        input.setSelectionRange(pos, pos);
    }
}

function addVariantRow() {
    const c = document.getElementById('gVariantRows');
    if (!c) return;
    c.insertAdjacentHTML('beforeend', buildVariantRowHtml());
    updateRowRemoveButtons();
    const lastRow = c.lastElementChild;
    if (lastRow) lastRow.querySelector('[data-gene]').focus();
}

function removeVariantRow(btn) {
    const c = document.getElementById('gVariantRows');
    if (!c) return;
    const rows = c.querySelectorAll('[data-vrow]');
    if (rows.length <= 1) return;
    btn.closest('[data-vrow]').remove();
    updateRowRemoveButtons();
}

function updateRowRemoveButtons() {
    const c = document.getElementById('gVariantRows');
    if (!c) return;
    const rows = c.querySelectorAll('[data-vrow]');
    rows.forEach(row => {
        const btn = row.querySelector('.o-vrow-remove');
        if (btn) btn.disabled = rows.length <= 1;
    });
}

function readVariantInputs() {
    const c = document.getElementById('gVariantRows');
    if (!c) return [];
    const rows = c.querySelectorAll('[data-vrow]');
    return Array.from(rows).map(row => ({
        gene:   row.querySelector('[data-gene]').value.trim().toUpperCase(),
        coding: normalizeCDNA(row.querySelector('[data-coding]').value.trim())
    })).filter(r => r.gene || r.coding);
}

function initVariantInput() {
    const c = document.getElementById('gVariantRows');
    if (!c) return;
    if (!c.querySelector('[data-vrow]')) {
        c.innerHTML = buildVariantRowHtml();
    }
    updateRowRemoveButtons();
}

// ── Lookup orchestration ──

async function lookupAllVariants() {
    const inputs = readVariantInputs();
    if (!inputs.length || !inputs.some(i => i.gene)) {
        alert('Please enter at least one variant.');
        return;
    }
    const states = inputs.filter(i => i.gene).map(i => createVariantState(i.gene, i.coding));
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
        await lookupSingleVariant(states[i]);
        renderVariantCards();
        updateResultsPanel();
    }
}

function bypassAllVariants() {
    const inputs = readVariantInputs();
    if (!inputs.length || !inputs.some(i => i.gene)) {
        alert('Please enter at least one variant.');
        return;
    }
    const states = inputs.filter(i => i.gene).map(i => {
        const s = createVariantState(i.gene, i.coding);
        s.clinvarDone = false;
        s.plpConfirmed = true;
        return s;
    });
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

    // ── ClinVar section ──
    let clinvarHtml = '';
    if (!clinvarDone && plpConfirmed === null) {
        clinvarHtml = `<div class="o-skel"></div><div class="o-skel"></div>`;
    } else if (clinvarSignificance === 'error') {
        clinvarHtml = `<p class="o-cv-error">ClinVar lookup failed. Check your connection.</p>`;
    } else if (clinvarDone && clinvarClass) {
        clinvarHtml = `
            <div class="o-cv-line">
                <span class="o-cv-label">ClinVar Germline</span>
                <span class="o-cv-pill ${getClassColor(clinvarClass)}">${clinvarClass}</span>
            </div>
            ${clinvarTotal > 0 ? `<div class="o-cv-summary">${clinvarSummary}</div>` : ''}
            <a href="https://www.ncbi.nlm.nih.gov/clinvar/variation/${clinvarId}/" target="_blank" rel="noopener" class="o-extlink">ClinVar record  ↗</a>`;
    } else if (clinvarDone && clinvarSignificance === 'none') {
        clinvarHtml = `<p class="o-cv-none">Not found on ClinVar.</p>`;
    }

    // ── P/LP decision (only if conflicting / unknown / not found) ──
    let plpButtons = '';
    if (clinvarDone && (clinvarSignificance === 'none' || clinvarSignificance === 'conflicting' || clinvarSignificance === 'unknown')) {
        const yesActive = plpConfirmed === true;
        const noActive  = plpConfirmed === false;
        plpButtons = `
            <div class="o-vcard-section">
                <p class="o-mini-prompt">Check Franklin and Varsome, then indicate classification:</p>
                <div class="o-extbtns">
                    <a href="https://franklin.genoox.com/clinical-db/home" target="_blank" rel="noopener" class="o-extbtn">Franklin  ↗</a>
                    <a href="https://varsome.com/" target="_blank" rel="noopener" class="o-extbtn">Varsome  ↗</a>
                </div>
                <div class="o-yn">
                    <button onclick="setVariantPLP(${idx}, true)" class="o-yn-btn${yesActive ? ' is-yes-on' : ''}">P / LP</button>
                    <button onclick="setVariantPLP(${idx}, false)" class="o-yn-btn${noActive ? ' is-no-on' : ''}">Not P / LP</button>
                </div>
            </div>`;
    }

    // ── Context / age section (only if P/LP confirmed) ──
    const contextHtml = plpConfirmed === true ? renderVariantContextSection(state, idx) : '';

    return `
        <div class="o-vcard fade-in">
            <div class="o-vcard-head">
                <div class="o-vcard-title">
                    <span class="gene">${gene}</span>
                    <span class="coding">${coding}</span>
                </div>
            </div>
            <div class="o-vcard-body">
                ${clinvarHtml ? `<div class="o-vcard-section">${clinvarHtml}</div>` : ''}
                ${plpButtons}
                ${contextHtml}
            </div>
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
            <div class="o-vcard-section">
                <label class="o-cb-row">
                    <input type="checkbox" ${multiVariant ? 'checked' : ''} onchange="setVariantMultiVariant(${idx}, this.checked)">
                    <span>2 or more reported P/LP variants in APC</span>
                </label>
                <div style="margin-top:10px;">
                    <div class="o-qtitle">Age at diagnosis</div>
                    <input type="number" value="${ageInput}" placeholder="e.g. 28" min="1" max="120"
                        oninput="setVariantAge(${idx}, this.value)" class="o-age-input">
                </div>
            </div>`;
    }
    if (gene === 'TP53' && !coding.includes(founderTP53)) {
        return `
            <div class="o-vcard-section">
                <label class="o-cb-row">
                    <input type="checkbox" ${multiVariant ? 'checked' : ''} onchange="setVariantMultiVariant(${idx}, this.checked)">
                    <span>2 or more reported P/LP variants in TP53</span>
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
        <div class="o-vcard-section">
            <div class="o-qtitle">${title}</div>
            <ul class="o-qcrit">${bullets}</ul>
            <p class="o-q-prompt" style="margin-bottom:10px;">Does this case meet one or more of the above criteria?</p>
            <div class="o-yn">
                <button onclick="setVariantContextAnswer(${idx}, 'yes')" class="o-yn-btn${yesActive ? ' is-yes-on' : ''}">Yes</button>
                <button onclick="setVariantContextAnswer(${idx}, 'no')" class="o-yn-btn${noActive ? ' is-no-on' : ''}">No</button>
            </div>
        </div>`;
}

function renderAgeInput(idx, ageInput) {
    return `
        <div class="o-vcard-section">
            <div class="o-qtitle">Age at diagnosis</div>
            <input type="number" value="${ageInput}" placeholder="e.g. 28" min="1" max="120"
                oninput="setVariantAge(${idx}, this.value)" class="o-age-input">
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

    // ── Summary table rows ──
    const rows = pairs.map(({ state, result }) => {
        const { gene, coding, clinvarClass } = state;

        const cvCell = clinvarClass
            ? `<span class="o-cv-pill ${getClassColor(clinvarClass)}" title="${clinvarClass}">${abbreviateClinvar(clinvarClass)}</span>`
            : `<span style="color:var(--mute-light); font-style:italic;">—</span>`;

        let recCell;
        if (!result) {
            recCell = `<span class="o-td-badge is-pending">Loading</span>`;
        } else if (result.pending) {
            recCell = `<span class="o-td-badge is-mute">Pending</span>`;
        } else {
            const badge = `<span class="o-td-badge ${recBadgeClass(result.color)}">${result.rec}</span>`;
            const rationale = result.rationale ? `<div class="rationale">${italicizeGenes(result.rationale)}</div>` : '';
            const refs = result.refs?.length
                ? `<div class="refs">${result.refs.map(r => `<a href="${r.url}" target="_blank" rel="noopener" class="o-ref">${r.text}</a>`).join('')}</div>`
                : '';
            recCell = badge + rationale + refs;
        }

        return `<tr>
            <td><span class="gene">${gene}</span></td>
            <td><span class="coding">${coding}</span></td>
            <td>${cvCell}</td>
            <td>${recCell}</td>
        </tr>`;
    }).join('');

    // ── Overall verdict ──
    const resolved = pairs.filter(p => p.result && !p.result.pending);
    const allResolved = resolved.length === pairs.length;
    const recommended = resolved.filter(p => p.result.rec === 'RECOMMENDED');
    const mdt = resolved.filter(p => p.result.rec === 'REVIEW / MDT');
    const notOffered = resolved.filter(p => p.result.rec === 'NOT OFFERED');

    let bannerClass, bannerLabel, bannerTitle, bannerBody;
    if (!allResolved) {
        bannerClass = 'is-pending'; bannerLabel = 'Pending';
        bannerTitle = 'Awaiting Input';
        bannerBody = 'Complete context questions for all variants to see the final recommendation.';
    } else if (recommended.length || mdt.length) {
        bannerClass = 'is-success'; bannerLabel = 'Recommended';
        bannerTitle = 'Germline Confirmation Recommended';
        const parts = [];
        if (recommended.length) parts.push(`Recommended: ${recommended.map(p => p.state.gene).join(', ')}`);
        if (mdt.length) parts.push(`MDT review: ${mdt.map(p => p.state.gene).join(', ')}`);
        if (notOffered.length) parts.push(`Not offered: ${notOffered.map(p => p.state.gene).join(', ')}`);
        bannerBody = parts.join(' · ');
    } else {
        bannerClass = 'is-danger'; bannerLabel = 'Not Offered';
        bannerTitle = 'Germline Confirmation Not Offered';
        bannerBody = 'None of the identified variants meet criteria for germline confirmation.';
    }

    // ── Per-gene rationale list ──
    const rationaleLines = resolved
        .filter(p => p.result.rationale)
        .map(p => `<li><span class="gene">${p.state.gene}:</span> ${italicizeGenes(p.result.rationale)}</li>`)
        .join('');
    const overallRationale = rationaleLines
        ? `<ul class="o-banner-rationale">${rationaleLines}</ul>` : '';

    // ── Deduplicated references ──
    const seenRefs = new Set();
    const allRefs = [];
    resolved.forEach(p => (p.result.refs || []).forEach(r => {
        if (!seenRefs.has(r.text)) { seenRefs.add(r.text); allRefs.push(r); }
    }));
    const refLinks = allRefs.map(r => `<a href="${r.url}" target="_blank" rel="noopener" class="o-ref">${r.text}</a>`).join('');
    const refBlock = refLinks ? `<div class="o-banner-refs">${refLinks}</div>` : '';

    content.innerHTML = `
        <div class="o-result-stack fade-in">
            <div class="o-table-wrap">
                <div class="o-table-title">Variant Summary</div>
                <table class="o-table">
                    <thead>
                        <tr>
                            <th>Gene</th>
                            <th>cDNA</th>
                            <th>ClinVar</th>
                            <th>Recommendation &amp; Rationale</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <div class="o-banner ${bannerClass}">
                <div class="o-banner-head">
                    <span class="o-banner-badge">${bannerLabel}</span>
                    <span class="o-banner-title">${bannerTitle}</span>
                </div>
                <div class="o-banner-body">${bannerBody}</div>
                ${overallRationale}
                ${refBlock}
            </div>
        </div>`;
}

// ─── UI HELPERS ──────────────────────────────────────────────────────────────

// Wrap any gene name (from the canonical allGenes list) in <i> tags,
// matched as whole words so partial substrings like "T790M" aren't touched.
const _genePattern = new RegExp(
    '\\b(' + allGenes.slice().sort((a, b) => b.length - a.length).join('|') + ')\\b',
    'g'
);
function italicizeGenes(text) {
    if (!text) return text;
    return text.replace(_genePattern, '<i>$1</i>');
}

function recBadgeClass(color) {
    const map = {
        green: 'is-success',
        red:   'is-danger',
        amber: 'is-warn',
        slate: 'is-mute'
    };
    return map[color] || 'is-mute';
}

function getClassColor(classification) {
    const cls = (classification || '').toLowerCase();
    if (cls.includes('pathogenic') && !cls.includes('likely') && !cls.includes('conflicting')) return 'cv-plp';
    if (cls.includes('likely pathogenic')) return 'cv-lp';
    if (cls.includes('uncertain') || cls.includes('vus')) return 'cv-vus';
    if (cls.includes('likely benign')) return 'cv-lb';
    if (cls.includes('benign') && !cls.includes('likely')) return 'cv-benign';
    if (cls.includes('conflicting')) return 'cv-conflicting';
    return 'cv-unknown';
}

// Map a ClinVar classification to a compact clinical abbreviation
// (P, LP, P/LP, VUS, LB, B, B/LB, Conflicting). Used in the summary
// table cell where space is tight; the full text stays in the variant
// card and appears on hover via the title attribute.
function abbreviateClinvar(cls) {
    if (!cls) return '';
    const c = cls.toLowerCase().trim();
    if (c.includes('pathogenic') && c.includes('likely pathogenic')) return 'P/LP';
    if (c.includes('benign') && c.includes('likely benign')) return 'B/LB';
    if (c === 'pathogenic') return 'P';
    if (c === 'likely pathogenic') return 'LP';
    if (c === 'likely benign') return 'LB';
    if (c === 'benign') return 'B';
    if (c.includes('uncertain') || c.includes('vus')) return 'VUS';
    if (c.includes('conflicting')) return 'Conflicting';
    return cls;
}

// ─── INIT ────────────────────────────────────────────────────────────────────

initVariantInput();

// Populate today's date for the print-only date line
(function setPrintDate() {
    const el = document.getElementById('printDate');
    if (!el) return;
    const now = new Date();
    const formatted = now.toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    el.textContent = `Generated ${formatted}`;
})();
