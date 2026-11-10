// ─── LOCAL WORKFLOW TAB ──────────────────────────────────────────────────────
// Decision-tree view and editor for a local copy of the solid-tumour flowchart
// (rules and evaluation live in workflow.js), saving it (file download/upload and
// this browser's storage), and the "Run variants" view, which reuses the germline
// UI in ui.js as the 'local' view.

const wfState = {
    active: originalWorkflow(),  // the rules the Run variants view follows
    savedId: null,               // saved copy the active workflow was opened from / saved as
    draft: null,                 // copy being edited; null when not editing
    view: 'tree',                // 'tree' | 'run'
    notice: null,                // { kind: 'info' | 'error', html }
    editErrors: [],              // shown in the edit bar after a failed Apply
    addErrors: {},               // per list: html shown under its "Add gene" box
    pendingAdd: {}               // per list: unrecognised gene awaiting "Add anyway"
};

germlineViews.local = {
    ids: { rows: 'lVariantRows', cards: 'lVariantCards', empty: 'lEmptyState', content: 'lResultContent' },
    states: [],
    evaluate: s => evaluateWorkflowVariant(wfState.active, s),
    genes: () => [...new Set([...allGenes, ...workflowGenes(wfState.active)])].sort(),
    resultHeader: () => workflowLabelHtml(wfState.active)
};

const REC_TEXT = 'Germline confirmation of the tumour variant is recommended.';
const NOT_REQ_TEXT = 'Germline follow-up is not required for the tumour variant detected.';
const LIST_NAMES = { main: 'main gene list', age: 'age-dependent gene list' };

const fmtDate = iso => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Short label for a gene chip (a custom title's "— GENE" suffix is dropped)
function shortCondition(c, gene) {
    switch (c.type) {
        case 'tumourOnly':    return `${c.tumour} only`;
        case 'tumourExclude': return `not ${c.tumour}`;
        case 'ageMax':        return `≤${c.age} y`;
        default:              return (c.title || 'custom question').replace(` — ${gene}`, '');
    }
}

// ── Labels ──

// Which workflow produced the results — shown above the summary table and in the PDF
function workflowLabelHtml(wf) {
    const diffs = workflowDifferences(wf);
    if (!diffs.length) {
        return `<div class="o-wf-label">Workflow: <strong>${ORIGINAL_WORKFLOW_NAME}</strong> — the built-in OCTANE solid-tumour flowchart, unchanged.</div>`;
    }
    const shown = diffs.slice(0, 8).map(d => `<li>${italicizeGenes(escHtml(d))}</li>`).join('');
    const more = diffs.length > 8 ? `<li>…and ${diffs.length - 8} more (see the decision tree).</li>` : '';
    return `<div class="o-wf-label is-custom">
        Workflow: <strong>${escHtml(wf.name)}</strong> — custom local workflow${wf.edited ? `, edited ${fmtDate(wf.edited)}` : ''}.
        ${plural(diffs.length, 'difference')} from the built-in OCTANE flowchart:
        <ul>${shown}${more}</ul>
    </div>`;
}

// ── Whole tab ──

function renderWorkflowTab() {
    renderWorkflowBar();
    renderWorkflowTree();
    document.getElementById('wfTreeView').classList.toggle('hidden', wfState.view !== 'tree');
    document.getElementById('wfRunView').classList.toggle('hidden', wfState.view !== 'run');
    document.getElementById('wfViewTree').classList.toggle('on', wfState.view === 'tree');
    document.getElementById('wfViewRun').classList.toggle('on', wfState.view === 'run');
}

function setWorkflowView(v) {
    wfState.view = v;
    renderWorkflowTab();
}

function refreshLocalResults() {
    renderVariantCards('local');
    if (germlineViews.local.states.length) updateResultsPanel('local');
}

function wfNotice(kind, html) { wfState.notice = { kind, html }; }

// ── Active-workflow bar: status, saving, loading, reset ──

function isActiveSaved(store = readWorkflowStore()) {
    const s = store.saved.find(x => x.id === wfState.savedId);
    return !!s && JSON.stringify(s.workflow) === JSON.stringify(wfState.active);
}

function renderWorkflowBar() {
    const el = document.getElementById('wfBar');
    if (!el) return;
    const wf = wfState.active;
    const store = readWorkflowStore();
    const original = isOriginalRules(wf);
    const saved = isActiveSaved(store);
    const isDefault = saved && store.defaultId === wfState.savedId;
    const editing = !!wfState.draft;
    const nDiffs = workflowDifferences(wf).length;

    const meta = [
        original ? 'Built-in flowchart, unchanged'
            : `Custom${wf.edited ? `, edited ${fmtDate(wf.edited)}` : ''} · ${plural(nDiffs, 'difference')} from the original`,
        original ? '' : (saved ? 'Saved on this computer' : 'Not saved on this computer'),
        isDefault ? 'Default on this computer' : '',
        editing ? 'Editing — changes not applied yet' : ''
    ].filter(Boolean).join(' · ');

    const btn = (label, onclick, disabled, title = '') =>
        `<button class="o-wf-btn" onclick="${onclick}"${disabled ? ' disabled' : ''}${title ? ` title="${title}"` : ''}>${label}</button>`;
    const actions = [
        btn('Save on this computer', 'saveActiveWorkflow()', editing || original || saved,
            'Keep this workflow in this browser so it can be opened again later'),
        isDefault
            ? btn('Stop using as default', 'clearDefaultWorkflow()', editing, 'Open the original workflow next time')
            : btn('Set as default', 'setDefaultWorkflow()', editing || original, 'Open this workflow automatically in this tab'),
        btn('Download file', 'downloadWorkflow()', editing, 'Save the workflow as a file you can keep or share'),
        btn('Load file…', 'chooseWorkflowFile()', false, 'Open a workflow file downloaded earlier'),
        btn('Reset to original', 'resetToOriginal()', original && !editing, 'Switch back to the built-in OCTANE flowchart')
    ].join('');

    const savedRows = store.saved.map(s => {
        const tags = [
            s.id === store.defaultId ? '<span class="o-wf-tag">Default</span>' : '',
            s.id === wfState.savedId ? '<span class="o-wf-tag is-open">Open</span>' : ''
        ].join('');
        return `<div class="o-wf-saved-row">
            <div class="o-wf-saved-name">${escHtml(s.workflow.name)}${tags}
                <span class="o-wf-saved-date">${s.workflow.edited ? `edited ${fmtDate(s.workflow.edited)}` : ''}</span></div>
            <div class="o-wf-saved-actions o-wf-noprint">
                ${btn('Open', `openSavedWorkflow('${s.id}')`, s.id === wfState.savedId && saved)}
                ${s.id === store.defaultId ? '' : btn('Make default', `makeSavedDefault('${s.id}')`, false)}
                ${btn('Delete', `deleteSavedWorkflow('${s.id}')`, false)}
            </div>
        </div>`;
    }).join('');

    const n = wfState.notice;
    el.innerHTML = `
        <div class="o-wf-bar">
            <div class="o-wf-bar-main">
                <div>
                    <div class="o-crit-label">Active workflow</div>
                    <div class="o-wf-name">${escHtml(wf.name)}</div>
                    <div class="o-wf-meta">${meta}</div>
                </div>
                <div class="o-wf-actions o-wf-noprint">${actions}</div>
            </div>
            ${n ? `<div class="o-wf-notice o-wf-noprint${n.kind === 'error' ? ' is-error' : ''}">${n.html}</div>` : ''}
            ${savedRows ? `<div class="o-wf-saved o-wf-noprint"><div class="o-crit-label">Saved on this computer</div>${savedRows}</div>` : ''}
        </div>`;
}

function confirmDiscardDraft() {
    return !wfState.draft || confirm('Discard your unapplied changes to the decision tree?');
}

function setActiveWorkflow(wf, savedId) {
    wfState.active = wf;
    wfState.savedId = savedId;
    wfState.draft = null;
    wfState.editErrors = [];
    wfState.addErrors = {};
    wfState.pendingAdd = {};
    renderWorkflowTab();
    refreshLocalResults();
}

const STORAGE_BLOCKED = 'This browser did not allow the workflow to be saved (storage may be turned off, for example in a private window). Use “Download file” instead.';

function saveActiveWorkflow() {
    const store = readWorkflowStore();
    const wf = cloneData(wfState.active);
    let id = store.saved.some(s => s.id === wfState.savedId) ? wfState.savedId : null;
    if (id) store.saved = store.saved.map(s => s.id === id ? { id, workflow: wf } : s);
    else {
        id = 'wf' + Date.now().toString(36);
        store.saved.push({ id, workflow: wf });
    }
    if (!writeWorkflowStore(store)) {
        wfNotice('error', STORAGE_BLOCKED);
        renderWorkflowBar();
        return false;
    }
    wfState.savedId = id;
    wfNotice('info', `Saved “${escHtml(wf.name)}” on this computer. It stays in this browser only — download the file to use it on another computer or share it.`);
    renderWorkflowBar();
    return true;
}

function setDefaultWorkflow() {
    if (!isActiveSaved() && !saveActiveWorkflow()) return;
    makeSavedDefault(wfState.savedId);
}

function makeSavedDefault(id) {
    const store = readWorkflowStore();
    const s = store.saved.find(x => x.id === id);
    if (!s) return;
    store.defaultId = id;
    if (!writeWorkflowStore(store)) wfNotice('error', STORAGE_BLOCKED);
    else wfNotice('info', `“${escHtml(s.workflow.name)}” will open automatically in this tab on this computer. The original Solid Tumour tab is not affected.`);
    renderWorkflowBar();
}

function clearDefaultWorkflow() {
    const store = readWorkflowStore();
    store.defaultId = null;
    if (!writeWorkflowStore(store)) wfNotice('error', STORAGE_BLOCKED);
    else wfNotice('info', 'No default is set — this tab will open with the original OCTANE workflow next time.');
    renderWorkflowBar();
}

function openSavedWorkflow(id) {
    const s = readWorkflowStore().saved.find(x => x.id === id);
    if (!s || !confirmDiscardDraft()) return;
    if (wfState.savedId !== id && !isOriginalRules(wfState.active) && !isActiveSaved()
        && !confirm('The current workflow is not saved. Open another one anyway?')) return;
    wfNotice('info', `Opened “${escHtml(s.workflow.name)}”.`);
    setActiveWorkflow(cloneData(s.workflow), id);
}

function deleteSavedWorkflow(id) {
    const store = readWorkflowStore();
    const s = store.saved.find(x => x.id === id);
    if (!s) return;
    if (!confirm(`Delete “${s.workflow.name}” from this computer? This cannot be undone. (A downloaded copy of the file, if you have one, is not affected.)`)) return;
    store.saved = store.saved.filter(x => x.id !== id);
    if (store.defaultId === id) store.defaultId = null;
    if (!writeWorkflowStore(store)) wfNotice('error', STORAGE_BLOCKED);
    else wfNotice('info', `Deleted “${escHtml(s.workflow.name)}” from this computer.`);
    if (wfState.savedId === id) wfState.savedId = null;
    renderWorkflowBar();
}

function downloadWorkflow() {
    const wf = wfState.active;
    const blob = new Blob([JSON.stringify(wf, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = workflowFileName(wf);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function chooseWorkflowFile() {
    if (!confirmDiscardDraft()) return;
    document.getElementById('wfFileInput').click();
}

async function loadWorkflowFile(input) {
    const file = input.files[0];
    input.value = '';
    if (!file) return;
    const fail = html => { wfNotice('error', html); renderWorkflowBar(); };
    if (file.size > 500000) return fail('That file is too large to be a workflow file.');
    let obj;
    try { obj = JSON.parse(await file.text()); } catch (e) { return fail('That file could not be read as a workflow file.'); }
    const check = validateWorkflow(obj);
    if (!check.ok) return fail(`That workflow file could not be loaded:<ul>${check.errors.map(e => `<li>${escHtml(e)}</li>`).join('')}</ul>`);
    wfNotice('info', `Loaded “${escHtml(check.workflow.name)}” from file. Save it on this computer if you want it available next time.`);
    setActiveWorkflow(check.workflow, null);
}

function resetToOriginal() {
    if (!confirmDiscardDraft()) return;
    if (!wfState.draft && !isActiveSaved() && !isOriginalRules(wfState.active)
        && !confirm('The current workflow is not saved. Switch to the original anyway? (Download or save it first to keep it.)')) return;
    const store = readWorkflowStore();
    wfNotice('info', store.defaultId
        ? 'Switched to the original OCTANE workflow. Your default workflow will still open next time — use “Stop using as default” on it to change that.'
        : 'Switched to the original OCTANE workflow.');
    setActiveWorkflow(originalWorkflow(), null);
}

// ── Editing ──

const draftList = kind => kind === 'main' ? wfState.draft.mainList : wfState.draft.ageList;
const originalEntry = (kind, gene) =>
    (kind === 'main' ? originalWorkflow().mainList : originalWorkflow().ageList).find(e => e.gene === gene);
const sortList = list => list.sort((a, b) => a.gene.localeCompare(b.gene));

function startWorkflowEdit() {
    wfState.draft = cloneData(wfState.active);
    if (wfState.draft.name === ORIGINAL_WORKFLOW_NAME) wfState.draft.name = '';
    wfState.editErrors = [];
    wfState.notice = null;
    renderWorkflowTab();
}

function cancelWorkflowEdit() {
    const d = { ...wfState.draft, name: wfState.active.name };
    if (JSON.stringify(d) !== JSON.stringify(wfState.active) && !confirm('Discard your unapplied changes to the decision tree?')) return;
    wfState.draft = null;
    wfState.addErrors = {};
    wfState.pendingAdd = {};
    renderWorkflowTab();
}

function applyWorkflowEdit() {
    const d = cloneData(wfState.draft);
    d.name = (d.name || '').trim();
    const original = isOriginalRules(d);
    if (original && !d.name) d.name = ORIGINAL_WORKFLOW_NAME;
    if (!original && (!d.name || d.name === ORIGINAL_WORKFLOW_NAME)) {
        wfState.editErrors = ['Give your local workflow a name, so results and PDFs show which rules were used.'];
        renderWorkflowTree();
        return;
    }
    d.edited = new Date().toISOString();
    const check = validateWorkflow(d);
    if (!check.ok) {
        wfState.editErrors = check.errors;
        renderWorkflowTree();
        return;
    }
    const savedId = wfState.savedId;
    if (original && d.name === ORIGINAL_WORKFLOW_NAME) {
        wfNotice('info', 'The decision tree matches the original OCTANE workflow.');
        setActiveWorkflow(originalWorkflow(), null);
        return;
    }
    wfNotice('info', 'Changes applied — the Run variants view now follows this workflow. Save it on this computer or download the file to keep it.');
    setActiveWorkflow(check.workflow, savedId);
}

function removeWorkflowGene(kind, gene) {
    const list = draftList(kind);
    list.splice(list.findIndex(e => e.gene === gene), 1);
    renderWorkflowTree();
}

function restoreWorkflowGene(kind, gene) {
    const other = kind === 'main' ? 'age' : 'main';
    if (draftList(other).some(e => e.gene === gene)) {
        wfState.addErrors[kind] = `<i>${gene}</i> is on the ${LIST_NAMES[other]} — remove it there first.`;
    } else {
        draftList(kind).push(originalEntry(kind, gene));
        sortList(draftList(kind));
        wfState.addErrors[kind] = '';
    }
    renderWorkflowTree();
}

function addWorkflowGene(kind, force) {
    const input = document.getElementById(`wfAdd-${kind}`);
    const gene = force ? wfState.pendingAdd[kind] : (input?.value || '').trim().toUpperCase();
    const other = kind === 'main' ? 'age' : 'main';
    const fail = html => { wfState.addErrors[kind] = html; wfState.pendingAdd[kind] = null; renderWorkflowTree(kind); };

    if (!gene) return fail('Type a gene name first.');
    if (!GENE_NAME_RE.test(gene)) return fail(`“${escHtml(gene)}” is not a valid gene name (letters, numbers and hyphens only).`);
    if (draftList(kind).some(e => e.gene === gene)) return fail(`<i>${gene}</i> is already on this list.`);
    if (draftList(other).some(e => e.gene === gene)) return fail(`<i>${gene}</i> is on the ${LIST_NAMES[other]} — a gene can only be on one list, so remove it there first.`);
    if (!force && !allGenes.includes(gene)) {
        wfState.pendingAdd[kind] = gene;
        wfState.addErrors[kind] = `<i>${gene}</i> is not in the tool’s gene list — please check the spelling.
            <button class="o-wf-btn" onclick="addWorkflowGene('${kind}', true)">Add ${gene} anyway</button>`;
        return renderWorkflowTree(kind);
    }

    draftList(kind).push(originalEntry(kind, gene) || (kind === 'main'
        ? { gene, conditions: [], onFail: 'continue', note: '' }
        : { gene, excludeTumour: '', boxA: [], note: '' }));
    sortList(draftList(kind));
    wfState.addErrors[kind] = '';
    wfState.pendingAdd[kind] = null;
    renderWorkflowTree(kind);
}

function setDraftMaxAge(val) {
    const n = Number(val);
    if (Number.isInteger(n) && n >= 1 && n <= 120) {
        wfState.draft.maxAge = n;
        wfState.editErrors = [];
    } else {
        wfState.editErrors = ['The age cutoff must be a whole number of years between 1 and 120.'];
    }
    renderWorkflowTree();
}

// ── Decision tree ──

function geneChip(wf, kind, e, editing) {
    const status = geneStatus(wf, kind, e);
    const cond = kind === 'main'
        ? e.conditions.map(c => shortCondition(c, e.gene)).join('; ')
        : (e.excludeTumour ? `age not applied in ${e.excludeTumour}` : '');
    const inner = `<i>${e.gene}</i>${cond ? `<span class="o-chip-cond">${escHtml(cond)}</span>` : ''}${status ? `<span class="o-chip-tag is-${status}">${status}</span>` : ''}`;
    const cls = `o-chip${status ? ` is-${status}` : ''}`;
    if (!editing) return `<span class="${cls}">${inner}</span>`;
    return `<span class="${cls} is-editable">
        <button class="o-chip-main" onclick="openGeneEditor('${kind}', '${e.gene}')" title="Edit the rule for ${e.gene}">${inner}</button>
        <button class="o-chip-x" onclick="removeWorkflowGene('${kind}', '${e.gene}')" title="Remove ${e.gene} from this list" aria-label="Remove ${e.gene}">×</button>
    </span>`;
}

function geneBoxBody(wf, kind, editing) {
    const list = kind === 'main' ? wf.mainList : wf.ageList;
    const chips = list.map(e => geneChip(wf, kind, e, editing)).join('') || '<span class="o-wf-empty">No genes on this list.</span>';
    const removed = removedGenes(wf, kind);
    const removedHtml = removed.length ? `<div class="o-wf-removed">Removed from the built-in list: ${removed.map(g => editing
        ? `<button class="o-wf-restore" onclick="restoreWorkflowGene('${kind}', '${g}')" title="Put ${g} back with its built-in rule"><i>${g}</i> ↺</button>`
        : `<i>${g}</i>`).join(' ')}</div>` : '';
    const add = editing ? `
        <div class="o-wf-add o-wf-noprint">
            <input id="wfAdd-${kind}" class="o-wf-input" list="wfGeneOptions" placeholder="Gene name, e.g. HOXB13" autocomplete="off"
                   onkeydown="if (event.key === 'Enter') addWorkflowGene('${kind}')">
            <button class="o-wf-btn" onclick="addWorkflowGene('${kind}')">Add gene</button>
        </div>
        ${wfState.addErrors[kind] ? `<div class="o-wf-err">${wfState.addErrors[kind]}</div>` : ''}` : '';
    return `<div class="o-chips">${chips}</div>${removedHtml}${add}`;
}

// Footnotes under a gene box: each gene's conditions, built-in notes and local notes
function geneRulesHtml(wf, kind) {
    const items = [];
    if (kind === 'main') wf.mainList.forEach(e => {
        const parts = [];
        e.conditions.forEach(c => {
            if (c.type === 'custom') {
                const crit = c.criteria?.length ? `<ul>${c.criteria.map(x => `<li>${escHtml(x)}</li>`).join('')}</ul>` : '';
                parts.push(`Asks: ${crit ? crit : ''}${escHtml(c.prompt)} Qualifies on Yes.`);
            } else parts.push(`${escHtml(describeCondition(c)).replace(/^./, ch => ch.toUpperCase())}.`);
        });
        if (e.conditions.length) parts.push(e.onFail === 'judgement'
            ? 'If not met: refer to clinical judgement.'
            : 'If not met: continue down the flowchart (founder variant, then clinical suspicion).');
        if (mainRuleIsOriginal(e) && mainGenes[e.gene].note) parts.push(`<span class="o-wf-builtin">${italicizeGenes(mainGenes[e.gene].note)}</span>`);
        if (e.note) parts.push(`<em>Local note: ${escHtml(e.note)}</em>`);
        if (parts.length) items.push(`<li><i>${e.gene}</i> — ${parts.join(' ')}</li>`);
    });
    else wf.ageList.forEach(e => {
        const parts = [];
        if (e.note) parts.push(`<em>Local note: ${escHtml(e.note)}</em>`);
        if (parts.length) items.push(`<li><i>${e.gene}</i> — ${parts.join(' ')}</li>`);
    });
    return items.length ? `<ul class="o-wf-rules">${items.join('')}</ul>` : '';
}

function renderWorkflowTree(focusKind) {
    const el = document.getElementById('wfTree');
    if (!el) return;
    const editing = !!wfState.draft;
    const wf = wfState.draft || wfState.active;

    const step = (n, head, body, side) => `
        <div class="o-tstep">
            <div class="o-tnode">
                <div class="o-tnode-q"><span class="o-tnum">${n}</span><span>${head}</span></div>
                ${body ? `<div class="o-tnode-body">${body}</div>` : ''}
            </div>
            <div class="o-tside">${side}</div>
        </div>`;
    const down = label => `<div class="o-tdown"><span class="o-tdown-arrow">↓</span>${label}</div>`;
    const out = (kind, label, text) => `<div class="o-tout-wrap"><span class="o-tarrow">${label} →</span><div class="o-tout is-${kind}">${text}</div></div>`;

    const ageHead = editing
        ? `Was the patient ≤ <input type="number" min="1" max="120" class="o-wf-age o-wf-noprint" value="${wf.maxAge}" onchange="setDraftMaxAge(this.value)" aria-label="Age cutoff in years"><span class="o-print-only">${wf.maxAge}</span> years old at the time of this diagnosis?`
        : `Was the patient ≤${wf.maxAge} years old at the time of this diagnosis?`;
    const exceptions = wf.ageList.filter(e => e.excludeTumour)
        .map(e => `<li><i>${e.gene}</i> in ${escHtml(e.excludeTumour)}: the age criterion is not applied (goes straight to step 5).</li>`).join('');

    const boxRows = wf.ageList.filter(e => e.boxA.length).map(e => `
        <tr><td><i>${e.gene}</i></td><td><ul>${e.boxA.map(c => `<li>${escHtml(c)}</li>`).join('')}</ul></td></tr>`).join('');

    const diffs = workflowDifferences(wf);
    const diffHtml = diffs.length
        ? `<ul>${diffs.map(d => `<li>${italicizeGenes(escHtml(d))}</li>`).join('')}</ul>`
        : '<p class="o-wf-none">None — this matches the built-in OCTANE flowchart.</p>';

    const editBar = editing ? `
        <div class="o-wf-editbar o-wf-noprint">
            <div class="o-wf-editbar-row">
                <label class="o-wf-namefield">
                    <span class="o-crit-label">Workflow name</span>
                    <input id="wfName" class="o-wf-input" maxlength="120" value="${escHtml(wf.name)}" placeholder="e.g. Hospital X local workflow" oninput="wfState.draft.name = this.value">
                </label>
                <div class="o-wf-editbar-btns">
                    <button class="o-btn" onclick="applyWorkflowEdit()">Apply changes</button>
                    <button class="o-btn o-btn-secondary" onclick="cancelWorkflowEdit()">Cancel</button>
                </div>
            </div>
            <p class="o-hint">Click a gene to change its conditions, notes or Box A criteria; × removes it. Changes reach the Run variants view only after <strong>Apply changes</strong>. The original Solid Tumour tab is never changed.</p>
            ${wfState.editErrors.length ? `<div class="o-wf-err"><ul>${wfState.editErrors.map(e => `<li>${escHtml(e)}</li>`).join('')}</ul></div>` : ''}
        </div>`
        : `<div class="o-wf-viewbar o-wf-noprint">
            <button class="o-btn" onclick="startWorkflowEdit()">Edit decision tree</button>
            <p class="o-hint">Add or remove genes, set or remove conditions for a gene, change the age cutoff or Box A. Your version becomes the rules used in Run variants.</p>
        </div>`;

    el.innerHTML = `
        ${editBar}
        <datalist id="wfGeneOptions">${allGenes.map(g => `<option value="${g}">`).join('')}</datalist>
        <div class="o-tree${editing ? ' is-editing' : ''}">
            ${step(1, 'Was a Pathogenic or Likely Pathogenic genetic variant identified in the tumour?', '',
                out('no', 'No', NOT_REQ_TEXT))}
            ${down('Yes')}
            ${step(2, 'Is the variant in one of the following genes, or a known founder variant?',
                geneBoxBody(wf, 'main', editing) + geneRulesHtml(wf, 'main') +
                '<p class="o-wf-foot">A gene with conditions is only on the list when they are met; each condition is asked as a yes/no question.</p>',
                out('yes', 'Yes', REC_TEXT))}
            ${down('No')}
            ${step(3, 'Is the variant in one of the following genes?',
                geneBoxBody(wf, 'age', editing) + geneRulesHtml(wf, 'age'),
                out('next', 'No', 'Go to step 5'))}
            ${down('Yes')}
            ${step(4, ageHead, exceptions ? `<ul class="o-wf-rules">${exceptions}</ul>` : '',
                out('yes', 'Yes', REC_TEXT))}
            ${down('No')}
            ${step(5, 'Does the variant meet a criterion listed in Box A, or are there clinical suspicions for a germline origin?',
                '<p class="o-wf-foot">Genes on neither list (and main-list genes whose condition was not met) are asked whether there is any other clinical suspicion of a germline origin.</p>',
                out('yes', 'Yes', REC_TEXT) + out('no', 'No', NOT_REQ_TEXT))}

            <div class="o-tnode o-wf-boxa">
                <div class="o-tnode-q"><span>Box A</span></div>
                <div class="o-tnode-body">
                    ${boxRows ? `<table>${boxRows}</table>` : '<p class="o-wf-none">No Box A criteria.</p>'}
                    ${editing ? '<p class="o-wf-foot o-wf-noprint">To edit Box A, click a gene in step 3.</p>' : ''}
                </div>
            </div>
        </div>
        <div class="o-wf-diffs">
            <div class="o-crit-label">Differences from the built-in OCTANE flowchart</div>
            ${diffHtml}
        </div>`;

    if (focusKind) document.getElementById(`wfAdd-${focusKind}`)?.focus();
}

// ── Gene editor (modal) ──

let geneEd = null;  // { kind, gene, entry, errors }

function openGeneEditor(kind, gene) {
    const entry = draftList(kind).find(e => e.gene === gene);
    if (!entry) return;
    geneEd = { kind, gene, entry: cloneData(entry), errors: [] };
    renderGeneEditor();
    document.addEventListener('keydown', geneEdKey);
}

function closeGeneEditor() {
    document.getElementById('wfGeneModal')?.remove();
    document.removeEventListener('keydown', geneEdKey);
    geneEd = null;
}

function geneEdKey(e) { if (e.key === 'Escape') closeGeneEditor(); }

function conditionFields(c, i) {
    const field = (prop, label, placeholder, value, extra = '') => `
        <label class="o-wf-field"><span>${label}</span>
            <input class="o-wf-input" value="${escHtml(value ?? '')}" placeholder="${placeholder}" oninput="geneEdField(${i}, '${prop}', this.value)" ${extra}></label>`;
    if (c.type === 'tumourOnly' || c.type === 'tumourExclude') {
        return field('tumour', 'Tumour type', 'e.g. breast cancer', c.tumour, 'maxlength="200"') +
            `<p class="o-wf-foot">Asked as “Is this a [tumour type]?” — the gene qualifies on ${c.type === 'tumourOnly' ? 'Yes' : 'No'}.</p>`;
    }
    if (c.type === 'ageMax') {
        return field('age', 'Age at diagnosis at or below (years)', 'e.g. 50', c.age, 'type="number" min="1" max="120"');
    }
    return field('title', 'Short title (optional)', 'e.g. Family history', c.title, 'maxlength="120"') +
        field('prompt', 'Question', 'Phrase it so that Yes means the gene qualifies', c.prompt, 'maxlength="500"') +
        `<label class="o-wf-field"><span>Criteria listed above the question (optional, one per line)</span>
            <textarea class="o-wf-input" rows="3" oninput="geneEdField(${i}, 'criteria', this.value)">${escHtml((c.criteria || []).join('\n'))}</textarea></label>`;
}

function renderGeneEditor() {
    if (!geneEd) return;
    const { kind, gene, entry } = geneEd;
    let overlay = document.getElementById('wfGeneModal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'wfGeneModal';
        overlay.className = 'o-modal-overlay';
        overlay.onclick = e => { if (e.target === overlay) closeGeneEditor(); };
        document.body.appendChild(overlay);
    }

    const orig = originalEntry(kind, gene);
    const changed = orig && JSON.stringify(orig) !== JSON.stringify(entry);
    let body;
    if (kind === 'main') {
        const conds = entry.conditions.map((c, i) => `
            <div class="o-wf-cond">
                <div class="o-wf-cond-head">
                    <select class="o-wf-input" onchange="geneEdSetType(${i}, this.value)" aria-label="Condition type">
                        ${Object.entries(CONDITION_TYPES).map(([k, label]) => `<option value="${k}"${k === c.type ? ' selected' : ''}>${label}</option>`).join('')}
                    </select>
                    <button class="o-chip-x" onclick="geneEdRemoveCondition(${i})" title="Remove this condition" aria-label="Remove this condition">×</button>
                </div>
                ${conditionFields(c, i)}
            </div>`).join('');
        body = `
            <div class="o-crit-label">Conditions</div>
            <p class="o-hint">With no conditions, a P/LP variant in ${gene} is recommended for germline confirmation in any tumour context. With conditions, every one must be met; each is asked as a yes/no question.</p>
            ${conds}
            <button class="o-add-btn" onclick="geneEdAddCondition()">+ Add condition</button>
            ${entry.conditions.length ? `
                <div class="o-crit-label" style="margin-top:18px;">If a condition is not met</div>
                <label class="o-wf-radio"><input type="radio" name="wfOnFail" ${entry.onFail !== 'judgement' ? 'checked' : ''} onchange="geneEd.entry.onFail = 'continue'">
                    Continue down the flowchart (founder variant, then clinical suspicion)</label>
                <label class="o-wf-radio"><input type="radio" name="wfOnFail" ${entry.onFail === 'judgement' ? 'checked' : ''} onchange="geneEd.entry.onFail = 'judgement'">
                    Refer to clinical judgement</label>` : ''}`;
    } else {
        body = `
            <div class="o-crit-label">Age-criterion exception (optional)</div>
            <p class="o-hint">A tumour type in which the age criterion is not applied — the variant goes straight to the Box A / clinical-suspicion question. Built-in example: <i>TP53</i> in brain tumours.</p>
            <input class="o-wf-input" maxlength="200" value="${escHtml(entry.excludeTumour)}" placeholder="e.g. brain tumour" oninput="geneEd.entry.excludeTumour = this.value">
            <div class="o-crit-label" style="margin-top:18px;">Box A criteria (optional, one per line)</div>
            <p class="o-hint">Additional contexts that support germline confirmation at any age. “Clinical suspicion of a germline origin” is always offered as well.</p>
            <textarea class="o-wf-input" rows="4" oninput="geneEd.entry.boxA = this.value.split('\\n').map(s => s.trim()).filter(Boolean)">${escHtml(entry.boxA.join('\n'))}</textarea>`;
    }

    overlay.innerHTML = `
        <div class="o-modal" role="dialog" aria-modal="true" aria-labelledby="wfGeneModalTitle">
            <div class="o-modal-head">
                <div class="o-modal-title" id="wfGeneModalTitle"><i>${gene}</i> — ${LIST_NAMES[kind]}</div>
                <button class="o-modal-close" onclick="closeGeneEditor()" aria-label="Close">×</button>
            </div>
            <div class="o-modal-body">
                ${orig ? '' : '<p class="o-wf-notice">This gene is not on this list in the built-in OCTANE flowchart.</p>'}
                ${body}
                <div class="o-crit-label" style="margin-top:18px;">Local note (optional)</div>
                <p class="o-hint">Shown with this gene’s recommendation.</p>
                <textarea class="o-wf-input" rows="2" maxlength="1000" oninput="geneEd.entry.note = this.value">${escHtml(entry.note)}</textarea>
                ${geneEd.errors.length ? `<div class="o-wf-err"><ul>${geneEd.errors.map(e => `<li>${escHtml(e)}</li>`).join('')}</ul></div>` : ''}
            </div>
            <div class="o-modal-foot">
                <div>
                    ${changed ? `<button class="o-wf-btn" onclick="geneEdRestore()">Restore built-in rule</button>` : ''}
                    <button class="o-wf-btn is-danger" onclick="geneEdRemoveGene()">Remove from list</button>
                </div>
                <div>
                    <button class="o-btn o-btn-secondary" onclick="closeGeneEditor()">Cancel</button>
                    <button class="o-btn" onclick="geneEdDone()">Done</button>
                </div>
            </div>
        </div>`;
}

function geneEdField(i, prop, val) {
    const c = geneEd.entry.conditions[i];
    if (prop === 'age') c.age = val === '' ? null : Number(val);
    else if (prop === 'criteria') c.criteria = val.split('\n').map(s => s.trim()).filter(Boolean);
    else c[prop] = val;
}

function geneEdSetType(i, type) {
    const blank = { tumourOnly: { tumour: '' }, tumourExclude: { tumour: '' }, ageMax: { age: null }, custom: { title: '', prompt: '', criteria: [] } };
    const c = geneEd.entry.conditions[i];
    // keep the tumour type when switching between "only in" and "excluding"
    geneEd.entry.conditions[i] = { type, ...blank[type], ...(c.tumour && blank[type].tumour !== undefined ? { tumour: c.tumour } : {}) };
    renderGeneEditor();
}

function geneEdAddCondition() {
    geneEd.entry.conditions.push({ type: 'tumourOnly', tumour: '' });
    renderGeneEditor();
}

function geneEdRemoveCondition(i) {
    geneEd.entry.conditions.splice(i, 1);
    renderGeneEditor();
}

function geneEdRestore() {
    geneEd.entry = originalEntry(geneEd.kind, geneEd.gene);
    geneEd.errors = [];
    renderGeneEditor();
}

function geneEdRemoveGene() {
    const { kind, gene } = geneEd;
    closeGeneEditor();
    removeWorkflowGene(kind, gene);
}

function geneEdDone() {
    const { kind, gene, entry } = geneEd;
    // Validate the edited entry the same way a loaded file is validated
    const check = validateWorkflow({
        format: WORKFLOW_FORMAT, schema: WORKFLOW_SCHEMA, name: 'check', maxAge: ORIGINAL_MAX_AGE,
        mainList: kind === 'main' ? [entry] : [], ageList: kind === 'age' ? [entry] : []
    });
    if (!check.ok) {
        geneEd.errors = check.errors;
        renderGeneEditor();
        return;
    }
    const list = draftList(kind);
    list[list.findIndex(e => e.gene === gene)] = (kind === 'main' ? check.workflow.mainList : check.workflow.ageList)[0];
    closeGeneEditor();
    renderWorkflowTree();
}

// ── Init ──

(function initWorkflowTab() {
    const store = readWorkflowStore();
    const def = store.saved.find(s => s.id === store.defaultId);
    if (def) {
        wfState.active = cloneData(def.workflow);
        wfState.savedId = def.id;
        wfNotice('info', `Opened your default workflow “${escHtml(def.workflow.name)}”.`);
    }
    initVariantInput('local');
    renderWorkflowTab();
})();
