// --- LOCAL SOLID-TUMOUR WORKFLOW (pure, no DOM) ---
// A local workflow is an editable copy of the OCTANE solid-tumour flowchart, used by
// the Local Workflow tab. Its shape is fixed — P/LP tumour variant → main gene list or
// known founder variant → age-dependent genes (age cutoff, then Box A or clinical
// suspicion) → any other clinical suspicion — and users edit what is inside the boxes:
// the genes, per-gene conditions, the age cutoff and the Box A criteria.
//
// The original Solid Tumour tab never reads a workflow; it keeps using evaluateVariant
// in germline.js. Guideline rationale and citations are only shown here for a gene whose
// rule is unchanged from the built-in flowchart — that is checked against germline.js,
// never read from the workflow file, so an edited or uploaded workflow cannot borrow
// citations for rules the guidelines don't make.

const WORKFLOW_FORMAT = 'octane-solid-tumour-workflow';
const WORKFLOW_SCHEMA = 1;
const ORIGINAL_WORKFLOW_NAME = 'Original OCTANE workflow';
const ORIGINAL_MAX_AGE = 30;

const CONDITION_TYPES = {
    tumourOnly:    'Only in a tumour type',
    tumourExclude: 'Excluding a tumour type',
    ageMax:        'Age at diagnosis at or below',
    custom:        'Custom yes/no question'
};

// The built-in mainGenes questions, expressed as workflow conditions. The generated
// prompts ("Is this a breast cancer?") reproduce the ones in germline.js exactly.
const originalConditions = {
    CDH1:  [{ type: 'tumourExclude', tumour: 'breast cancer' }],
    MEN1:  [{ type: 'tumourOnly', tumour: 'non-small cell lung carcinoma' }],
    VHL:   [{ type: 'tumourExclude', tumour: 'renal (kidney) cancer' }],
    MUTYH: [{ type: 'custom', title: mainGenes.MUTYH.question.title, prompt: mainGenes.MUTYH.question.prompt, criteria: [] }],
    NF1:   [{ type: 'custom', title: mainGenes.NF1.question.title, prompt: mainGenes.NF1.question.prompt, criteria: mainGenes.NF1.question.criteria.slice() }]
};
const originalOnFail = gene => mainGenes[gene]?.judgementText ? 'judgement' : 'continue';

// Tumour types in which the age criterion is skipped (TP53 brain tumours, per ESMO)
const originalAgeExclusions = { TP53: 'brain tumour' };

function originalWorkflow() {
    return {
        format: WORKFLOW_FORMAT,
        schema: WORKFLOW_SCHEMA,
        name: ORIGINAL_WORKFLOW_NAME,
        edited: null,
        maxAge: ORIGINAL_MAX_AGE,
        mainList: Object.keys(mainGenes).sort().map(gene => ({
            gene,
            conditions: cloneData(originalConditions[gene] || []),
            onFail: originalOnFail(gene),
            note: ''
        })),
        ageList: ageGenes.slice().sort().map(gene => ({
            gene,
            excludeTumour: originalAgeExclusions[gene] || '',
            boxA: (boxA[gene]?.criteria || []).slice(),
            note: ''
        }))
    };
}

// --- helpers ---

const cloneData = x => JSON.parse(JSON.stringify(x));

// Workflow text comes from users and uploaded files, so escape it before it is
// placed into HTML.
function escHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const conditionKey = c => JSON.stringify([c.type, c.tumour || '', c.age || 0, c.title || '', c.prompt || '', c.criteria || []]);
const sameConditions = (a, b) => a.length === b.length && a.every((c, i) => conditionKey(c) === conditionKey(b[i]));
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// Short stable id for a question, so a stale answer never carries over to a
// different question after the workflow changes
function shortHash(s) {
    let h = 0;
    for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return (h >>> 0).toString(36);
}

// Plain-language description of a condition (unescaped)
function describeCondition(c) {
    switch (c.type) {
        case 'tumourOnly':    return `only in ${c.tumour}`;
        case 'tumourExclude': return `excluding ${c.tumour}`;
        case 'ageMax':        return `diagnosed at or below ${c.age} years`;
        default:              return `“${c.title || c.prompt}” answered yes`;
    }
}

const GENE_NAME_RE = /^[A-Z0-9][A-Z0-9-]{0,19}$/;

// --- comparison with the built-in flowchart ---

function mainRuleIsOriginal(entry) {
    if (!mainGenes[entry.gene]) return false;
    const orig = originalConditions[entry.gene] || [];
    if (!sameConditions(entry.conditions, orig)) return false;
    return !orig.length || entry.onFail === originalOnFail(entry.gene);
}
const ageExclusionIsOriginal = entry =>
    ageGenes.includes(entry.gene) && entry.excludeTumour === (originalAgeExclusions[entry.gene] || '');
const boxAIsOriginal = entry =>
    ageGenes.includes(entry.gene) && sameList(entry.boxA, boxA[entry.gene]?.criteria || []);

// 'added' | 'edited' | '' — for highlighting genes in the tree
function geneStatus(wf, kind, entry) {
    if (kind === 'main') {
        if (!mainGenes[entry.gene]) return 'added';
        return mainRuleIsOriginal(entry) && !entry.note ? '' : 'edited';
    }
    if (!ageGenes.includes(entry.gene)) return 'added';
    return ageExclusionIsOriginal(entry) && boxAIsOriginal(entry) && !entry.note ? '' : 'edited';
}

// Built-in genes missing from a list
function removedGenes(wf, kind) {
    const orig = kind === 'main' ? Object.keys(mainGenes) : ageGenes;
    const list = kind === 'main' ? wf.mainList : wf.ageList;
    return orig.filter(g => !list.some(e => e.gene === g)).sort();
}

// Every way the workflow differs from the built-in one, as plain sentences (unescaped)
function workflowDifferences(wf) {
    const diffs = [];
    if (wf.maxAge !== ORIGINAL_MAX_AGE) diffs.push(`Age cutoff changed from ${ORIGINAL_MAX_AGE} to ${wf.maxAge} years.`);

    wf.mainList.forEach(e => {
        const conds = e.conditions.map(describeCondition).join('; ');
        const fail = e.conditions.length && e.onFail === 'judgement' ? '; refer to clinical judgement if not met' : '';
        if (!mainGenes[e.gene]) diffs.push(`${e.gene} added to the main gene list${conds ? ` (${conds}${fail})` : ''}.`);
        else if (!mainRuleIsOriginal(e)) diffs.push(`${e.gene} (main list): rule changed to ${conds || 'any tumour context, no conditions'}${fail}.`);
        if (e.note) diffs.push(`${e.gene}: local note added.`);
    });
    removedGenes(wf, 'main').forEach(g => diffs.push(`${g} removed from the main gene list.`));

    wf.ageList.forEach(e => {
        if (!ageGenes.includes(e.gene)) {
            diffs.push(`${e.gene} added to the age-dependent gene list${e.excludeTumour ? ` (age criterion not applied in ${e.excludeTumour})` : ''}${e.boxA.length ? `, with ${e.boxA.length} Box A criteria` : ''}.`);
        } else {
            if (!ageExclusionIsOriginal(e)) diffs.push(e.excludeTumour
                ? `${e.gene}: age criterion not applied in ${e.excludeTumour}.`
                : `${e.gene}: age-criterion exception removed.`);
            if (!boxAIsOriginal(e)) diffs.push(`${e.gene}: Box A criteria changed.`);
        }
        if (e.note) diffs.push(`${e.gene}: local note added.`);
    });
    removedGenes(wf, 'age').forEach(g => diffs.push(`${g} removed from the age-dependent gene list.`));
    return diffs;
}

const isOriginalRules = wf => workflowDifferences(wf).length === 0;

// Every gene in the workflow, for autocomplete
const workflowGenes = wf => [...wf.mainList, ...wf.ageList].map(e => e.gene);

// --- validation (files, browser storage, and the editor's Apply) ---

// Returns { ok, errors, workflow } where workflow is a clean copy holding only known fields.
function validateWorkflow(obj) {
    const errors = [];
    const err = m => { if (errors.length < 12) errors.push(m); };
    const str = (v, max, label, required) => {
        if (v === undefined || v === null) v = '';
        if (typeof v !== 'string') { err(`${label} must be text.`); return ''; }
        v = v.trim();
        if (required && !v) err(`${label} is required.`);
        if (v.length > max) err(`${label} is too long (maximum ${max} characters).`);
        return v;
    };
    const age = (v, label) => {
        if (!Number.isInteger(v) || v < 1 || v > 120) { err(`${label} must be a whole number of years between 1 and 120.`); return ORIGINAL_MAX_AGE; }
        return v;
    };
    const strList = (v, maxItems, label) => {
        if (v === undefined) return [];
        if (!Array.isArray(v)) { err(`${label} must be a list.`); return []; }
        if (v.length > maxItems) err(`${label} has too many entries (maximum ${maxItems}).`);
        return v.slice(0, maxItems).map((s, i) => str(s, 500, `${label} ${i + 1}`, true)).filter(Boolean);
    };

    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, errors: ['This is not a workflow file.'] };
    if (obj.format !== WORKFLOW_FORMAT) return { ok: false, errors: ['This is not an OCTANE solid-tumour workflow file.'] };
    if (obj.schema !== WORKFLOW_SCHEMA) return { ok: false, errors: ['This workflow file was made by a different version of the tool.'] };

    const seen = new Set();
    const gene = (v, label) => {
        const g = typeof v === 'string' ? v.trim().toUpperCase() : '';
        if (!GENE_NAME_RE.test(g)) { err(`${label}: "${String(v).slice(0, 30)}" is not a valid gene name.`); return null; }
        if (seen.has(g)) { err(`${g} appears more than once — a gene can only be in one list.`); return null; }
        seen.add(g);
        return g;
    };

    const wf = {
        format: WORKFLOW_FORMAT,
        schema: WORKFLOW_SCHEMA,
        name: str(obj.name, 120, 'Workflow name', true),
        edited: typeof obj.edited === 'string' && !isNaN(Date.parse(obj.edited)) ? obj.edited : null,
        maxAge: age(obj.maxAge, 'Age cutoff'),
        mainList: [],
        ageList: []
    };

    if (!Array.isArray(obj.mainList)) err('The main gene list is missing.');
    else if (obj.mainList.length > 300) err('The main gene list has too many genes.');
    else obj.mainList.forEach((e, i) => {
        if (!e || typeof e !== 'object') { err(`Main gene list entry ${i + 1} is not valid.`); return; }
        const g = gene(e.gene, `Main gene list entry ${i + 1}`);
        if (!g) return;
        const conditions = [];
        if (e.conditions !== undefined && !Array.isArray(e.conditions)) err(`${g}: conditions must be a list.`);
        else (e.conditions || []).slice(0, 10).forEach((c, j) => {
            const label = `${g} condition ${j + 1}`;
            if (!c || !CONDITION_TYPES[c.type]) { err(`${label} has an unknown type.`); return; }
            if (c.type === 'tumourOnly' || c.type === 'tumourExclude') conditions.push({ type: c.type, tumour: str(c.tumour, 200, `${label} tumour type`, true) });
            else if (c.type === 'ageMax') conditions.push({ type: c.type, age: age(c.age, `${label} age`) });
            else conditions.push({
                type: 'custom',
                title: str(c.title, 120, `${label} title`, false),
                prompt: str(c.prompt, 500, `${label} question`, true),
                criteria: strList(c.criteria, 20, `${label} criterion`)
            });
        });
        const onFail = e.onFail === 'judgement' ? 'judgement' : 'continue';
        if (e.onFail !== undefined && e.onFail !== 'judgement' && e.onFail !== 'continue') err(`${g}: unknown outcome for an unmet condition.`);
        wf.mainList.push({ gene: g, conditions, onFail, note: str(e.note, 1000, `${g} note`, false) });
    });

    if (!Array.isArray(obj.ageList)) err('The age-dependent gene list is missing.');
    else if (obj.ageList.length > 300) err('The age-dependent gene list has too many genes.');
    else obj.ageList.forEach((e, i) => {
        if (!e || typeof e !== 'object') { err(`Age-dependent gene list entry ${i + 1} is not valid.`); return; }
        const g = gene(e.gene, `Age-dependent gene list entry ${i + 1}`);
        if (!g) return;
        wf.ageList.push({
            gene: g,
            excludeTumour: str(e.excludeTumour, 200, `${g} age-criterion exception`, false),
            boxA: strList(e.boxA, 20, `${g} Box A criterion`),
            note: str(e.note, 1000, `${g} note`, false)
        });
    });

    wf.mainList.sort((a, b) => a.gene.localeCompare(b.gene));
    wf.ageList.sort((a, b) => a.gene.localeCompare(b.gene));
    return errors.length ? { ok: false, errors } : { ok: true, errors: [], workflow: wf };
}

// --- evaluation ---

const localWorkflowRef = wf => ({ org: 'Local workflow', text: `Local workflow: ${escHtml(wf.name)}` });

function conditionQuestion(gene, c) {
    const key = 'c' + shortHash(gene + conditionKey(c));
    if (c.type === 'tumourOnly' || c.type === 'tumourExclude') {
        return { key, title: `Tumour type — ${gene}`, prompt: `Is this a ${escHtml(c.tumour)}?`, passWhen: c.type === 'tumourOnly' ? 'yes' : 'no' };
    }
    if (c.type === 'ageMax') {
        return { key, title: `Age at diagnosis — ${gene}`, prompt: `Was the patient ${c.age} years old or younger at the time of this diagnosis?`, passWhen: 'yes' };
    }
    const q = { key, title: escHtml(c.title || `Additional question — ${gene}`), prompt: escHtml(c.prompt), passWhen: 'yes' };
    if (c.criteria?.length) q.criteria = c.criteria.map(escHtml);
    return q;
}

const ageQuestion = maxAge => maxAge === ORIGINAL_MAX_AGE ? Q_AGE
    : { key: `age${maxAge}`, title: 'Age at diagnosis', prompt: `Was the patient ${maxAge} years old or younger at the time of this diagnosis?` };

// Same walk and result shape as evaluateVariant (germline.js), driven by the workflow.
function evaluateWorkflowVariant(wf, state) {
    const { gene, plpConfirmed, answers } = state;
    const local = localWorkflowRef(wf);
    const questions = [];
    const ask = q => { questions.push(q); return answers[q.key]; };
    const pending = () => ({ questions, result: { pending: true } });
    const done = result => ({ questions, result: { pending: false, ...result } });

    const entry = wf.mainList.find(e => e.gene === gene);
    const ageEntry = wf.ageList.find(e => e.gene === gene);
    const localNote = (entry || ageEntry)?.note ? `Local workflow note: ${escHtml((entry || ageEntry).note)}` : '';
    const withNote = (...notes) => [...notes, localNote].filter(Boolean).join(' ');

    const recommended = (sub, rationale, refs, note) => {
        const caveat = refs.includes(REFS.ukcgg) ? ukcggCaveat(gene) : '';
        return done({ rec: 'RECOMMENDED', color: 'green', icon: 'fa-check-circle', sub, rationale, refs, note: withNote(note, caveat) });
    };
    const notRequired = (sub, rationale, refs = []) => done({ rec: 'NOT REQUIRED', color: 'red', icon: 'fa-ban', sub, rationale, refs, note: withNote() });
    const judgement = (sub, rationale, refs) => done({ rec: 'REFER TO CLINICAL JUDGEMENT', color: 'amber', icon: 'fa-user-md', sub, rationale, refs, note: withNote() });

    if (plpConfirmed === null) return { questions, result: null };
    if (plpConfirmed === false) return done({
        rec: 'NOT REQUIRED', color: 'slate', icon: 'fa-ban', sub: 'Variant not classified as P/LP.',
        rationale: 'Germline follow-up is not required for tumour variants that are not pathogenic or likely pathogenic.', refs: []
    });

    // Step — main gene list, or a known founder variant
    let failText = `${gene} is not on the main germline confirmation gene list.`;
    let failRefs = [];
    if (entry) {
        const original = mainRuleIsOriginal(entry);
        const rule = mainGenes[gene];
        let rationale, refs, note = '';
        if (original) {
            refs = rule.refs || ALL_SOURCES;
            rationale = rule.passText || [rule.passLead, endorsement(gene, refs, rule.subject, rule.context)].filter(Boolean).join(' ');
            note = rule.note;
        } else {
            refs = [local];
            const conds = entry.conditions.map(c => escHtml(describeCondition(c)));
            rationale = `The local workflow recommends germline confirmation for ${gene} tumour variants${conds.length ? ` (${conds.join('; ')})` : ' in any tumour context'}. ` +
                (rule ? 'This rule differs from the built-in OCTANE workflow.' : 'This gene is not on the built-in OCTANE main gene list.');
        }

        let met = true;
        for (const c of entry.conditions) {
            const q = conditionQuestion(gene, c);
            const ans = ask(q);
            if (!ans) return pending();
            if (ans !== q.passWhen) { met = false; break; }
        }
        if (met) return recommended('Gene on the main germline confirmation list.', rationale, refs, note);
        if (entry.onFail === 'judgement') return original
            ? judgement('Refer to clinical judgement.', rule.judgementText, refs)
            : judgement('Refer to clinical judgement.', `The local workflow’s condition for ${gene} tumour variants was not met, and the local workflow refers such cases to clinical judgement.`, [local]);
        failText = original ? rule.failText : `The local workflow’s condition for ${gene} tumour variants was not met.`;
        failRefs = refs;
    } else if (mainGenes[gene]) {
        failText = `${gene} has been removed from the main gene list in the local workflow.`;
        failRefs = [local];
    } else if (ageGenes.includes(gene) && !ageEntry) {
        failText = `${gene} has been removed from the age-dependent gene list in the local workflow.`;
        failRefs = [local];
    }

    const founder = ask(Q_FOUNDER);
    if (!founder) return pending();
    if (founder === 'yes') return recommended('Known founder variant.',
        'The variant is a known founder variant. CCO recognises known founder variants as tumour-detected variants that may be clearly pathogenic and warrant germline testing.', [REFS.cco]);

    // Step — age-dependent genes
    if (ageEntry) {
        const maxAge = wf.maxAge;
        const exclOriginal = ageExclusionIsOriginal(ageEntry);
        const ageOriginal = exclOriginal && maxAge === ORIGINAL_MAX_AGE;
        const boxOriginal = boxAIsOriginal(ageEntry);

        let ageApplies = true;
        if (ageEntry.excludeTumour) {
            const q = exclOriginal && gene === 'TP53' ? Q_BRAIN : {
                key: 'x' + shortHash(gene + ageEntry.excludeTumour),
                title: `Tumour type — ${gene}`,
                prompt: `Is this a ${escHtml(ageEntry.excludeTumour)}?`
            };
            const ans = ask(q);
            if (!ans) return pending();
            ageApplies = ans === 'no';
        }
        if (ageApplies) {
            const age = ask(ageQuestion(maxAge));
            if (!age) return pending();
            if (age === 'yes') {
                if (ageOriginal) return recommended('Tumour diagnosed at ≤30 years.',
                    endorsement(gene, ageGeneRefs[gene], gene, ' in tumours diagnosed at or below 30 years'), ageGeneRefs[gene]);
                const why = !ageGenes.includes(gene) ? 'This gene is not on the built-in OCTANE age-dependent gene list.'
                    : maxAge !== ORIGINAL_MAX_AGE ? `The built-in OCTANE workflow uses an age cutoff of ${ORIGINAL_MAX_AGE} years.`
                    : `The age-criterion exception for ${gene} differs from the built-in OCTANE workflow.`;
                return recommended(`Tumour diagnosed at ≤${maxAge} years.`,
                    `The local workflow recommends germline confirmation for ${gene} tumour variants in tumours diagnosed at or below ${maxAge} years. ${why}`, [local]);
            }
        }

        const extra = ask(boxOriginal ? boxAQuestion(gene) : (ageEntry.boxA.length
            ? { key: 'boxA' + shortHash(gene + ageEntry.boxA.join('\n')), title: `Additional criteria — ${gene}`,
                criteria: [...ageEntry.boxA.map(escHtml), 'Clinical suspicion of a germline origin for the variant'],
                prompt: 'Does this case meet one or more of the above?' }
            : { key: 'boxA0', title: `Additional criteria — ${gene}`, prompt: 'Are there any clinical suspicions for a germline origin for the variant?' }));
        if (!extra) return pending();
        if (extra === 'yes') {
            if (boxOriginal) {
                const boxRefs = boxA[gene]?.refs || [];
                const rationale = boxRefs.length
                    ? `The ${gene} variant meets an additional criterion supported by ${listJoin(boxRefs.map(r => r.org))}, or there is a clinical suspicion of germline origin; ${CCO_JUDGEMENT}`
                    : `There is a clinical suspicion of a germline origin for the ${gene} variant; ${CCO_JUDGEMENT}`;
                return recommended('Additional criterion or clinical suspicion met.', rationale, [...boxRefs, REFS.cco]);
            }
            return ageEntry.boxA.length
                ? recommended('Additional criterion or clinical suspicion met.',
                    `The ${gene} variant meets an additional criterion in the local workflow, or there is a clinical suspicion of germline origin; ${CCO_JUDGEMENT}`, [local, REFS.cco])
                : recommended('Additional criterion or clinical suspicion met.',
                    `There is a clinical suspicion of a germline origin for the ${gene} variant; ${CCO_JUDGEMENT}`, [REFS.cco]);
        }
        const ageText = ageApplies ? `the tumour was diagnosed after age ${maxAge}`
            : exclOriginal ? 'brain tumours are excluded from the age criterion'
            : `the age criterion does not apply to ${escHtml(ageEntry.excludeTumour)}`;
        const refs = ageOriginal && boxOriginal ? (ageApplies ? ageGeneRefs[gene] : BRAIN_REFS) : [local];
        return notRequired('No qualifying criteria met.',
            `${gene}: ${ageText}, the variant is not a known founder variant, and no additional criterion or clinical suspicion of germline origin was identified.`, refs);
    }

    // Any other gene (or a main-list gene whose condition was not met)
    const suspicion = ask(Q_SUSPICION);
    if (!suspicion) return pending();
    if (suspicion === 'yes') return recommended('Clinical suspicion of germline origin.',
        `There is a clinical suspicion of a germline origin for the variant; ${CCO_JUDGEMENT}`, [REFS.cco]);
    return notRequired('No qualifying criteria met.',
        `${failText} The variant is not a known founder variant, and there is no other clinical suspicion of germline origin.`, failRefs);
}

// --- saving: a downloadable file, and workflows remembered in this browser ---
// Workflows hold rules only, never patient data, so they may be kept in localStorage
// (the app stores nothing else). Every read is validated like an uploaded file.

const WORKFLOW_STORE_KEY = 'octane.localWorkflows.v1';

function readWorkflowStore() {
    const empty = { saved: [], defaultId: null };
    try {
        const raw = localStorage.getItem(WORKFLOW_STORE_KEY);
        if (!raw) return empty;
        const data = JSON.parse(raw);
        const saved = (Array.isArray(data?.saved) ? data.saved : [])
            .map(s => ({ id: typeof s?.id === 'string' ? s.id : '', check: validateWorkflow(s?.workflow) }))
            .filter(s => s.id && s.check.ok)
            .map(s => ({ id: s.id, workflow: s.check.workflow }));
        const defaultId = saved.some(s => s.id === data.defaultId) ? data.defaultId : null;
        return { saved, defaultId };
    } catch (e) {
        return empty;
    }
}

function writeWorkflowStore(store) {
    try {
        localStorage.setItem(WORKFLOW_STORE_KEY, JSON.stringify(store));
        return true;
    } catch (e) {
        return false;
    }
}

const workflowFileName = wf =>
    (wf.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'workflow') + '.octane-workflow.json';
