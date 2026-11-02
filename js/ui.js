// ─── ELIGIBILITY UI ──────────────────────────────────────────────────────────

const sInput = document.getElementById('cancerSearch');
const sRes = document.getElementById('searchResults');

// Show the diagnosis list on focus/click (full list) and filter it as the user types.
function renderDxSuggestions() {
    const val = sInput.value.trim();
    const matches = val ? searchDiagnoses(val) : Object.keys(dxMapping);
    sRes.innerHTML = '';
    matches.forEach(m => {
        const d = document.createElement('div');
        d.className = 'o-search-item';
        d.textContent = m;
        // mousedown fires before the input's blur, so the click always registers
        d.onmousedown = (e) => { e.preventDefault(); selectDx(m); };
        sRes.appendChild(d);
    });
    sRes.classList.toggle('hidden', !matches.length);
}

sInput.addEventListener('input', renderDxSuggestions);
sInput.addEventListener('focus', renderDxSuggestions);
sInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') sRes.classList.add('hidden');
});

// Close the list when clicking outside the search box
document.addEventListener('mousedown', (e) => {
    if (!sRes.contains(e.target) && e.target !== sInput) sRes.classList.add('hidden');
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


// ─── HEMATOLOGIC MALIGNANCY (HHM) UI ─────────────────────────────────────────

let hhmState = { dx: '', ageBand: '', syndrome: null, relatives: '', shared: null, features: {}, bmVariant: null, unaffRel: null, specimen: {} };

function initHHM() {
    const dxSel = document.getElementById('hhmDx');
    if (!dxSel) return;
    dxSel.innerHTML = '<option value="">Select diagnosis…</option>' +
        hhmDiagnoses.map(d => `<option value="${d.key}">${d.label}${d.fn ? ` [${d.fn}]` : ''}</option>`).join('');
    dxSel.value = hhmState.dx;
    const notes = document.getElementById('hhmNotes');
    if (notes) {
        notes.innerHTML = '<div class="o-crit-label">Definitions</div>' +
            Object.entries(hhmFootnotes).map(([n, t]) => `<p class="o-hhm-note"><sup>${n}</sup>${t}</p>`).join('');
    }
    renderHHM();
}

// state setters (clear dependent answers when a parent answer changes)
function setHHMDx(v)        { hhmState.dx = v; renderHHM(); }
function setHHMAge(v)       { hhmState.ageBand = v; if (v !== '40to49') hhmState.syndrome = null; renderHHM(); }
function setHHMSyndrome(v)  { hhmState.syndrome = v; renderHHM(); }
function setHHMRelatives(v) { hhmState.relatives = v; if (v !== '1') hhmState.shared = null; renderHHM(); }
function setHHMShared(v)    { hhmState.shared = v; renderHHM(); }
function toggleHHMFeature(key, checked) { hhmState.features[key] = checked; renderHHMResult(); }
function setHHMBMVariant(v) { hhmState.bmVariant = v; renderHHMResult(); }
function setHHMUnaffRel(v)  { hhmState.unaffRel = v; renderHHM(); }
function toggleHHMSpecimen(key, checked) { hhmState.specimen[key] = checked; renderHHMResult(); }

function hhmSelect(label, setter, opts, cur) {
    const options = '<option value="">Select…</option>' +
        opts.map(([v, t]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${t}</option>`).join('');
    return `<div class="o-hhm-q"><div class="o-hhm-qlabel">${label}</div>
        <div class="o-input-row"><select class="o-input" onchange="${setter}(this.value)">${options}</select></div></div>`;
}

function hhmYesNo(label, setter, cur) {
    return `<div class="o-hhm-q"><div class="o-hhm-qlabel">${label}</div>
        <div class="o-yn">
          <button class="o-yn-btn${cur === true ? ' is-yes-on' : ''}" onclick="${setter}(true)">Yes</button>
          <button class="o-yn-btn${cur === false ? ' is-no-on' : ''}" onclick="${setter}(false)">No</button>
        </div></div>`;
}

function hhmFeatureBlock() {
    return '<div class="o-hhm-qblock"><div class="o-crit-label">Targeted personal or family history</div>'
        + '<p class="o-hint" style="margin-bottom:8px;">Check any feature present in the patient or a blood relative — each adds genes to the recommendation.</p>'
        + hhmFeatures.map(f =>
            `<label class="o-hhm-check"><input type="checkbox" ${hhmState.features[f.key] ? 'checked' : ''} onchange="toggleHHMFeature('${f.key}', this.checked)"><span>${f.label}</span></label>`
          ).join('')
        + '</div>';
}

function hhmSpecimenBlock() {
    return '<div class="o-hhm-qblock"><div class="o-crit-label">Specimen type</div>'
        + '<p class="o-hint" style="margin-bottom:8px;">Check all that apply. If a skin-biopsy or buccal scenario is present alongside a blood scenario, the skin biopsy or buccal swab is preferred.</p>'
        + hhmSpecimenScenarios.map(sc =>
            `<label class="o-hhm-check"><input type="checkbox" ${hhmState.specimen[sc.key] ? 'checked' : ''} onchange="toggleHHMSpecimen('${sc.key}', this.checked)"><span>${sc.label}</span></label>`
          ).join('')
        + '</div>';
}

function renderHHM() {
    const q = document.getElementById('hhmQuestions');
    if (!q) return;
    const s = hhmState;

    if (!s.dx) { q.innerHTML = ''; document.getElementById('hhmResult').innerHTML = ''; return; }

    let html = '';

    if (s.dx === 'unaffected') {
        html += '<div class="o-hhm-qblock"><div class="o-crit-label">Unaffected individual</div>';
        html += hhmYesNo('Does a close relative have a bone-marrow variant that is suspicious of being germline?', 'setHHMUnaffRel', s.unaffRel);
        html += '</div>';
        html += hhmSpecimenBlock();
        q.innerHTML = html;
        renderHHMResult();
        return;
    }

    if (s.dx === 'multi') {
        html += `<div class="o-hhm-qblock"><p class="o-hhm-qlabel" style="margin:0;">Any hematologic malignancy with ≥ 2 other primary cancers meets criteria on its own — personal and family history are not required.</p></div>`;
    } else {
        html += '<div class="o-hhm-qblock"><div class="o-crit-label">Personal history</div>';
        html += hhmSelect('Age at diagnosis', 'setHHMAge',
            [['under40', '< 40 years'], ['40to49', '40–49 years'], ['50plus', '≥ 50 years']], s.ageBand);
        if (s.ageBand === '40to49') {
            html += hhmYesNo('Are syndrome features present? (chromosome 7 aberrations, chronic low blood counts, immunodeficiency, cutaneous/mucocutaneous findings, or congenital anomalies)', 'setHHMSyndrome', s.syndrome);
        }
        html += '</div>';

        html += '<div class="o-hhm-qblock"><div class="o-crit-label">Family history</div>';
        html += hhmSelect('First/second-degree relatives with a hematologic diagnosis', 'setHHMRelatives',
            [['0', 'None'], ['1', 'One relative'], ['2plus', 'Two or more relatives']], s.relatives);
        if (s.relatives === '1') {
            html += hhmYesNo('Does that relative share the clinical presentation / hematologic diagnosis?', 'setHHMShared', s.shared);
        }
        html += '</div>';

        if (s.dx === 'aml' || s.dx === 'mpn') {
            html += '<div class="o-hhm-qblock"><div class="o-crit-label">Bone marrow molecular findings</div>';
            html += `<label class="o-hhm-check"><input type="checkbox" ${s.bmVariant ? 'checked' : ''} onchange="setHHMBMVariant(this.checked)"><span>A relevant pathogenic variant was detected in the bone marrow (e.g. ${hhmMyeloidBMVariantGenes.join(', ')})</span></label>`;
            html += '</div>';
        }
    }

    html += hhmFeatureBlock();
    html += hhmSpecimenBlock();

    q.innerHTML = html;
    renderHHMResult();
}

// Plain-text restatement of the entered case, shown only in the printed PDF
// (the dropdowns and checkboxes themselves are hidden by the print stylesheet).
function renderHHMPrintSummary() {
    const el = document.getElementById('hhmPrintSummary');
    if (!el) return;
    const s = hhmState;
    if (!s.dx) { el.innerHTML = ''; return; }

    const rows = [];
    const add = (label, value) => { if (value) rows.push({ label, value }); };
    const yn = v => v === true ? 'Yes' : (v === false ? 'No' : '');

    const dx = hhmDiagnoses.find(d => d.key === s.dx);
    add('Diagnosis', dx ? dx.label : s.dx);

    if (s.dx === 'unaffected') {
        add('Relative with bone-marrow variant suspicious of germline', yn(s.unaffRel));
    } else if (s.dx !== 'multi') {
        add('Age at diagnosis', { under40: '< 40 years', '40to49': '40–49 years', '50plus': '≥ 50 years' }[s.ageBand]);
        add('Syndrome features present', yn(s.syndrome));
        add('Relatives with a hematologic diagnosis',
            { '0': 'None', '1': 'One relative', '2plus': 'Two or more relatives' }[s.relatives]);
        add('Relative shares the presentation', yn(s.shared));
        if (s.dx === 'aml' || s.dx === 'mpn') {
            add('Relevant pathogenic variant in bone marrow', s.bmVariant ? 'Yes' : '');
        }
    }

    const feats = hhmFeatures.filter(f => s.features[f.key]).map(f => f.label);
    if (feats.length) add('Targeted history', feats.join('; '));

    const specs = hhmSpecimenScenarios.filter(sc => s.specimen[sc.key]).map(sc => sc.label);
    if (specs.length) add('Specimen scenario(s)', specs.join('; '));

    el.innerHTML = '<div class="o-crit-label">Case summary</div>' +
        rows.map(r => `<div class="o-psum-row"><div class="o-psum-label">${r.label}</div><div class="o-psum-value">${r.value}</div></div>`).join('');
}

function hhmSelectedGenes() {
    const genes = [];
    hhmFeatures.forEach(f => {
        if (hhmState.features[f.key]) f.genes.forEach(g => { if (!genes.includes(g)) genes.push(g); });
    });
    return genes;
}

function renderHHMResult() {
    const res = document.getElementById('hhmResult');
    if (!res) return;
    const s = hhmState;

    let baseHtml = '';
    let notOffered = false; // when true, a specimen recommendation is irrelevant
    if (s.dx === 'unaffected') {
        if (s.unaffRel === true) {
            baseHtml = `<div class="o-verdict is-success fade-in">
                <span class="o-verdict-badge">Targeted testing</span>
                <span class="o-verdict-text">Panel testing is not routinely offered to unaffected individuals, but targeted testing for the relative's bone-marrow variant may be offered.</span></div>`;
        } else {
            notOffered = true;
            baseHtml = `<div class="o-verdict is-danger fade-in">
                <span class="o-verdict-badge">Not offered</span>
                <span class="o-verdict-text">Panel testing is not typically offered for unaffected individuals.</span></div>`;
        }
    } else if ((s.dx === 'aml' || s.dx === 'mpn') && s.bmVariant === true) {
        // Myeloid malignancy with a relevant bone-marrow variant → IBMF (independent trigger)
        baseHtml = `<div class="o-verdict is-success fade-in">
            <span class="o-verdict-badge">Recommended Panel</span>
            <span class="o-verdict-text">${HHM_IBMF}</span></div>
            <p class="o-hhm-result-note">Relevant pathogenic variant detected in the bone marrow of a myeloid malignancy.</p>`;
    } else if (s.dx) {
        const col = s.dx === 'multi' ? 'A' : computeHHMColumn(s);
        if (col === 'NONE') {
            notOffered = true;
            baseHtml = `<div class="o-verdict is-danger fade-in">
                <span class="o-verdict-badge">Criteria not met</span>
                <span class="o-verdict-text">This personal/family-history scenario does not meet criteria for hereditary hematologic testing.</span></div>`;
        } else if (col !== null) {
            const cell = computeHHM(s.dx, col);
            if (!cell || cell.na) {
                notOffered = true;
                baseHtml = `<div class="o-verdict is-danger fade-in">
                    <span class="o-verdict-badge">N/A</span>
                    <span class="o-verdict-text">No hereditary panel is indicated for this diagnosis at this history level.</span></div>`;
            } else {
                const note = cell.note ? `<p class="o-hhm-result-note">${cell.note}</p>` : '';
                baseHtml = `<div class="o-verdict is-success fade-in">
                    <span class="o-verdict-badge">Recommended Panel</span>
                    <span class="o-verdict-text">${cell.panel}</span></div>${note}`;
            }
        }
    }

    // Feature-driven gene additions (not for unaffected individuals)
    let extraHtml = '';
    if (s.dx && s.dx !== 'unaffected') {
        const extra = hhmSelectedGenes();
        if (extra.length) {
            extraHtml = `<div class="o-hhm-extra fade-in"><span class="o-hhm-extra-label">If performing germline testing, it is recommended to include the following genes based on targeted history:</span> ${extra.join(', ')}</div>`;
        }
    }

    // Specimen recommendation, highest-priority scenario wins. Omitted when
    // testing is not offered, since the specimen is irrelevant in that case.
    let specimenHtml = '';
    const spec = notOffered ? null : computeHHMSpecimen(s.specimen);
    if (spec) {
        const counsel = spec.counsel ? `<p class="o-hhm-result-note">${HHM_SPECIMEN_COUNSEL}</p>` : '';
        const pref = spec.overridden
            ? `<p class="o-hhm-result-note">Preferred over the other selected specimen scenario(s).</p>`
            : '';
        specimenHtml = `<div class="o-hhm-extra fade-in"><span class="o-hhm-extra-label">Recommended specimen:</span> ${spec.name}</div>${counsel}${pref}`;
    }

    res.innerHTML = baseHtml + extraHtml + specimenHtml;
    renderHHMPrintSummary();
}

function resetHHM() {
    hhmState = { dx: '', ageBand: '', syndrome: null, relatives: '', shared: null, features: {}, bmVariant: null, unaffRel: null, specimen: {} };
    const dxSel = document.getElementById('hhmDx');
    if (dxSel) dxSel.value = '';
    renderHHM();
}

initHHM();


// ─── POLYPOSIS TABLE (v4.0 Table 1) ──────────────────────────────────────────

const POLYPOSIS_TABLE = [
    {
        histology: "Adenomatous polyps / colorectal adenomas",
        note: "Includes tubular (TA), tubulovillous (TVA), and villous (VA) adenomas",
        rows: [
            { count: "≥ 20", factors: ["None"] },
            { count: "10–19", factors: ["Diagnosed ≤ 60 years of age"] },
            { count: "5–9", factors: [
                "Diagnosed ≤ 40y with an extracolonic manifestation commonly associated with familial adenomatous polyposis (FAP) or MUTYH-associated polyposis (MAP)",
                "Diagnosed ≤ 50y plus ≥ 1 of: endometrial cancer ≤ 60y; glioblastoma or astrocytoma; or ≥ 10 additional polyps (e.g. serrated adenoma, hyperplastic, or unbiopsied polyps that could represent additional adenomas)",
                "Diagnosed at any age with ≥ 1 FDR with CRC ≤ 50, EC ≤ 60, or high-grade glioma; or > 2 FDR/SDR with CRC or EC at any age"
            ] }
        ]
    },
    {
        histology: "Fundic gland polyps (FGP)",
        rows: [
            { count: "100+", factors: ["Carpeting / clustering observed in the absence of proton pump inhibitor (PPI) use, sparing the antrum and lesser curvature of the stomach"] },
            { count: "> 30", factors: ["Observed in the absence of PPI use, sparing the antrum and curvature of the stomach, plus ≥ 1 FDR with pathology-confirmed gastric cancer under age 50 or pathology-confirmed fundic gland polyposis"] }
        ]
    },
    {
        histology: "Peutz-Jeghers hamartoma",
        rows: [
            { count: "≥ 2", factors: ["None"] },
            { count: "1", factors: ["Personal history of mucocutaneous pigmentation, OR ≥ 1 FDR/SDR with Peutz-Jeghers syndrome (PJS)"] }
        ]
    },
    {
        histology: "Juvenile polyps hamartoma",
        rows: [
            { count: "≥ 5", factors: ["Located in the colorectum, or multiple polyps located in ≥ 2 organs of the gastrointestinal tract"] },
            { count: "1", factors: ["With a family history of juvenile polyposis syndrome (JPS)"] }
        ]
    },
    {
        histology: "Other hamartomas",
        rows: [
            { count: "—", factors: ["Hamartoma and ganglioneuroma are minor criteria in PTEN hamartoma tumour syndrome (see Appendix D)"] }
        ]
    },
    {
        histology: "Serrated (sessile) adenomas / polyps",
        note: "Serrated polyps include hyperplastic polyps (HPs), sessile serrated polyps (SSPs/SSAs), and traditional serrated adenomas (TSAs)",
        rows: [
            { count: "> 20", factors: ["Located in the colon/rectum, with ≥ 5 proximal to the rectum"] },
            { count: "≥ 5", factors: ["Located proximal to the rectum, with all polyps ≥ 5 mm and ≥ 2 polyps measuring ≥ 10 mm"] }
        ]
    }
];

function polyposisEscHandler(e) { if (e.key === 'Escape') closePolyposisTable(); }

function closePolyposisTable() {
    const o = document.getElementById('polyposisModalOverlay');
    if (o) o.remove();
    document.removeEventListener('keydown', polyposisEscHandler);
}

function showPolyposisTable() {
    if (document.getElementById('polyposisModalOverlay')) return;

    const thStyle = "font-family:var(--font-display);font-size:11px;font-weight:600;color:var(--mute);letter-spacing:0.1em;text-transform:uppercase;padding:10px 16px;text-align:left;background:var(--bg-soft);border-bottom:1px solid var(--border-soft);";
    const tdStyle = "padding:12px 16px;vertical-align:top;border-bottom:1px solid var(--border-fade);font-size:13px;color:var(--ink-soft);line-height:1.5;";

    const bodyRows = POLYPOSIS_TABLE.map(group => {
        const span = group.rows.length;
        return group.rows.map((r, i) => {
            const factors = r.factors.length > 1
                ? "<ul style='margin:0;padding-left:18px;'>" + r.factors.map(f => `<li style='margin-bottom:5px;'>${f}</li>`).join('') + "</ul>"
                : r.factors[0];
            const noteHtml = group.note
                ? `<div style='margin-top:6px;font-size:11px;font-style:italic;color:var(--mute-light);font-weight:400;'>${group.note}</div>`
                : '';
            const histCell = i === 0
                ? `<td rowspan='${span}' style='${tdStyle}width:26%;font-weight:600;color:var(--ink);background:var(--bg-softer);'>${group.histology}${noteHtml}</td>`
                : '';
            return `<tr>${histCell}<td style='${tdStyle}width:14%;font-weight:600;white-space:nowrap;'>${r.count}</td><td style='${tdStyle}'>${factors}</td></tr>`;
        }).join('');
    }).join('');

    const overlay = document.createElement('div');
    overlay.id = 'polyposisModalOverlay';
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(17,24,39,0.45);display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto;z-index:1000;";
    overlay.onclick = (e) => { if (e.target === overlay) closePolyposisTable(); };
    overlay.innerHTML = `
      <div style="background:var(--bg-card);max-width:880px;width:100%;border:1px solid var(--border);border-radius:4px;box-shadow:0 20px 60px rgba(0,0,0,0.25);overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid var(--border-soft);background:var(--bg-soft);">
          <div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--ink);">Table 1 — Polyposis Criteria</div>
          <button onclick="closePolyposisTable()" aria-label="Close" style="background:none;border:none;font-size:26px;line-height:1;color:var(--mute);cursor:pointer;padding:0 4px;">×</button>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;min-width:640px;">
            <thead>
              <tr>
                <th style="${thStyle}">Polyp histology</th>
                <th style="${thStyle}">No. of polyps</th>
                <th style="${thStyle}">Additional risk factors required</th>
              </tr>
            </thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>
        <div style="padding:14px 22px;border-top:1px solid var(--border-soft);font-size:11px;color:var(--mute-light);line-height:1.5;">
          Polyp histology must be confirmed by pathology. Source: Hereditary Cancer Testing Eligibility Criteria v4.0 (Ontario Health – Cancer Care Ontario, June 2026), Table 1.
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.addEventListener('keydown', polyposisEscHandler);
}


// ─── GERMLINE UI ─────────────────────────────────────────────────────────────

// ── Variant input rows ──

function buildVariantRowHtml() {
    return `
        <div class="o-vrow" data-vrow>
            <div class="o-gene-wrap">
                <input type="text" class="o-vrow-input gene-field" placeholder="GENE" data-gene autocomplete="off"
                       onfocus="showGeneSuggest(this)" oninput="showGeneSuggest(this)" onkeydown="geneSuggestKey(event, this)">
                <div class="o-gene-suggest hidden" data-gene-suggest></div>
            </div>
            <input type="text" class="o-vrow-input cdna-field" placeholder="c.xxxxx" data-coding oninput="normalizeCDNAInput(this)" autocomplete="off">
            <button class="o-vrow-remove" onclick="removeVariantRow(this)" title="Remove variant" aria-label="Remove variant">×</button>
        </div>`;
}

// ── Gene autocomplete ──
// Opens on click/focus with the full gene list, filters as the user types.

function showGeneSuggest(input) {
    const box = input.parentElement.querySelector('[data-gene-suggest]');
    if (!box) return;
    const val = input.value.trim().toUpperCase();
    const matches = val
        ? allGenes.filter(g => g.toUpperCase().startsWith(val)).concat(
            allGenes.filter(g => !g.toUpperCase().startsWith(val) && g.toUpperCase().includes(val)))
        : allGenes.slice();
    if (!matches.length) { hideGeneSuggest(box); return; }
    box.innerHTML = matches.map(g =>
        `<div class="o-gene-suggest-item" onmousedown="pickGene(event, this)">${g}</div>`).join('');
    box.classList.remove('hidden');
}

function hideGeneSuggest(box) {
    if (!box) return;
    box.classList.add('hidden');
    box.innerHTML = '';
}

function pickGene(e, item) {
    e.preventDefault(); // keep focus off the list so blur doesn't race the click
    const wrap = item.closest('.o-gene-wrap');
    const input = wrap.querySelector('[data-gene]');
    input.value = item.textContent;
    hideGeneSuggest(wrap.querySelector('[data-gene-suggest]'));
    const cdna = wrap.closest('[data-vrow]').querySelector('[data-coding]');
    if (cdna) cdna.focus();
}

function geneSuggestKey(e, input) {
    const box = input.parentElement.querySelector('[data-gene-suggest]');
    if (!box || box.classList.contains('hidden')) return;
    const items = [...box.querySelectorAll('.o-gene-suggest-item')];
    if (!items.length) return;
    let idx = items.findIndex(i => i.classList.contains('is-active'));

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        idx = e.key === 'ArrowDown'
            ? (idx + 1) % items.length
            : (idx <= 0 ? items.length - 1 : idx - 1);
        items.forEach(i => i.classList.remove('is-active'));
        items[idx].classList.add('is-active');
        items[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
        e.preventDefault();
        const pick = idx >= 0 ? items[idx] : items[0];
        input.value = pick.textContent;
        hideGeneSuggest(box);
        const cdna = input.closest('[data-vrow]').querySelector('[data-coding]');
        if (cdna) cdna.focus();
    } else if (e.key === 'Escape') {
        hideGeneSuggest(box);
    }
}

// Close any open gene list when clicking elsewhere
document.addEventListener('mousedown', (e) => {
    document.querySelectorAll('[data-gene-suggest]').forEach(box => {
        if (!box.classList.contains('hidden') && !box.parentElement.contains(e.target)) hideGeneSuggest(box);
    });
});

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

function setVariantAnswer(idx, key, val) {
    window.variantStates[idx].answers[key] = val;
    renderVariantCards();
    updateResultsPanel();
}

// ─── CARD RENDERING ──────────────────────────────────────────────────────────

function renderVariantCards() {
    const container = document.getElementById('gVariantCards');
    if (!container) return;
    container.innerHTML = window.variantStates.map((s, i) => variantNeedsCard(s) ? renderVariantCard(s, i) : '').join('');
}

// A card only appears while a variant needs input — lookup in progress or failed,
// manual P/LP review, or flowchart questions. Otherwise the summary table covers it.
function variantNeedsCard(state) {
    if (!state.clinvarDone && state.plpConfirmed === null) return true;
    if (['error', 'none', 'conflicting', 'unknown'].includes(state.clinvarSignificance)) return true;
    return evaluateVariant(state).questions.length > 0;
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
    }

    // ── P/LP decision (only if conflicting / unknown / not found) ──
    let plpButtons = '';
    if (clinvarDone && (clinvarSignificance === 'none' || clinvarSignificance === 'conflicting' || clinvarSignificance === 'unknown')) {
        const yesActive = plpConfirmed === true;
        const noActive  = plpConfirmed === false;
        const reason = clinvarSignificance === 'none'
            ? 'The automatic ClinVar search could not find an exact match for this variant. It may be listed under different notation (e.g. another transcript), or may not be on ClinVar.'
            : clinvarSignificance === 'conflicting'
                ? 'ClinVar submitters have reported conflicting classifications for this variant, so it cannot be classified automatically.'
                : `ClinVar’s classification for this variant (${clinvarClass}) could not be interpreted automatically.`;
        const clinvarSearchUrl = `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(`${gene}[gene] ${coding}`)}`;
        plpButtons = `
            <div class="o-vcard-section">
                <p class="o-cv-note">${reason}</p>
                <p class="o-cv-note">Please confirm variant pathogenicity by searching <a href="${clinvarSearchUrl}" target="_blank" rel="noopener">ClinVar</a> manually, searching Varsome, or using other resources as you see fit, and indicate the classification below.</p>
                <div class="o-extbtns">
                    <a href="https://varsome.com/" target="_blank" rel="noopener" class="o-extbtn">Varsome  ↗</a>
                </div>
                <div class="o-yn">
                    <button onclick="setVariantPLP(${idx}, true)" class="o-yn-btn${yesActive ? ' is-yes-on' : ''}">P / LP</button>
                    <button onclick="setVariantPLP(${idx}, false)" class="o-yn-btn${noActive ? ' is-no-on' : ''}">Not P / LP</button>
                </div>
            </div>`;
    }

    // ── Flowchart questions (only if P/LP confirmed) ──
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

// The flowchart (evaluateVariant) decides which questions apply; render them in order.
// Footnotes on the recommendation appear in the summary table's rationale instead.
function renderVariantContextSection(state, idx) {
    return evaluateVariant(state).questions.map(q => renderQuestion(idx, q, state.answers[q.key])).join('');
}

function renderQuestion(idx, q, answer) {
    const bullets = q.criteria ? `<ul class="o-qcrit">${q.criteria.map(c => `<li>${c}</li>`).join('')}</ul>` : '';
    const note = q.note ? `<p class="o-cv-note">${italicizeGenes(q.note)}</p>` : '';
    return `
        <div class="o-vcard-section">
            <div class="o-qtitle">${q.title}</div>
            ${bullets}
            <p class="o-q-prompt" style="margin-bottom:10px;">${italicizeGenes(q.prompt)}</p>
            ${note}
            <div class="o-yn">
                <button onclick="setVariantAnswer(${idx}, '${q.key}', 'yes')" class="o-yn-btn${answer === 'yes' ? ' is-yes-on' : ''}">Yes</button>
                <button onclick="setVariantAnswer(${idx}, '${q.key}', 'no')" class="o-yn-btn${answer === 'no' ? ' is-no-on' : ''}">No</button>
            </div>
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

    const pairs = states.map(s => ({ state: s, result: evaluateVariant(s).result }));
    const anyComputed = pairs.some(p => p.result && !p.result.pending);
    if (!anyComputed) return;

    if (empty) empty.classList.add('hidden');
    content.classList.remove('hidden');

    // ── Summary table rows ──
    const rows = pairs.map(({ state, result }) => {
        const { gene, coding, clinvarClass, clinvarId } = state;

        // The pill links to the ClinVar record (the variant card is often hidden)
        const pill = clinvarClass
            ? `<span class="o-cv-pill ${getClassColor(clinvarClass)}" title="${clinvarClass}">${abbreviateClinvar(clinvarClass)}</span>`
            : '';
        const cvCell = !clinvarClass
            ? `<span style="color:var(--mute-light); font-style:italic;">—</span>`
            : clinvarId
                ? `<a href="https://www.ncbi.nlm.nih.gov/clinvar/variation/${clinvarId}/" target="_blank" rel="noopener" title="Open ClinVar record">${pill}</a>`
                : pill;

        let recCell;
        if (!result) {
            recCell = `<span class="o-td-badge is-pending">Loading</span>`;
        } else if (result.pending) {
            recCell = `<span class="o-td-badge is-mute">Pending</span>`;
        } else {
            const badge = `<span class="o-td-badge ${recBadgeClass(result.color)}">${result.rec}</span>`;
            const rationale = result.rationale ? `<div class="rationale">${italicizeGenes(result.rationale)}</div>` : '';
            const note = result.note ? `<div class="rationale"><strong>Note:</strong> ${italicizeGenes(result.note)}</div>` : '';
            const refs = result.refs?.length
                ? `<div class="refs">${result.refs.map(refHtml).join('')}</div>`
                : '';
            recCell = badge + rationale + note + refs;
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
    const judgement = resolved.filter(p => p.result.rec === 'REFER TO CLINICAL JUDGEMENT');
    const notRequired = resolved.filter(p => p.result.rec === 'NOT REQUIRED');
    const genes = list => list.map(p => p.state.gene).join(', ');
    const summary = () => [
        recommended.length && `Recommended: ${genes(recommended)}`,
        judgement.length && `Refer to clinical judgement: ${genes(judgement)}`,
        notRequired.length && `Not required: ${genes(notRequired)}`
    ].filter(Boolean).join(' · ');

    let bannerClass, bannerLabel, bannerTitle, bannerBody;
    if (!allResolved) {
        bannerClass = 'is-pending'; bannerLabel = 'Pending';
        bannerTitle = 'Awaiting Input';
        bannerBody = 'Answer the questions for each variant to see the final recommendation.';
    } else if (recommended.length) {
        bannerClass = 'is-success'; bannerLabel = 'Recommended';
        bannerTitle = 'Germline Confirmation Recommended';
        bannerBody = summary();
    } else if (judgement.length) {
        bannerClass = 'is-warn'; bannerLabel = 'Refer to Clinical Judgement';
        bannerTitle = 'Refer to Clinical Judgement';
        bannerBody = summary();
    } else {
        bannerClass = 'is-danger'; bannerLabel = 'Not Required';
        bannerTitle = 'Germline Follow-up Not Required';
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
    const refLinks = allRefs.map(refHtml).join('');
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

// A citation chip — linked when the source has a public URL, plain text otherwise
function refHtml(r) {
    return r.url
        ? `<a href="${r.url}" target="_blank" rel="noopener" class="o-ref">${r.text}</a>`
        : `<span class="o-ref">${r.text}</span>`;
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
