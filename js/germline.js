// --- GERMLINE DATA ---
// Follows the OCTANE solid-tumour flowchart: P/LP tumour variant → main gene list
// or known founder variant → age-dependent genes (≤30y, Box A) → other clinical
// suspicion. These objects encode clinical recommendations — see CLAUDE.md.

// Reference links; `org` is the short name used in rationale sentences
const REFS = {
    esmo:  { org: "ESMO",  text: "ESMO 2022 (Kuzbari et al.)",               url: "https://doi.org/10.1016/j.annonc.2022.12.003" },
    cco:   { org: "CCO",   text: "CCO 2026 (HCT Eligibility Criteria v4.0)", url: "https://www.cancercareontario.ca/en/guidelines-advice/types-of-cancer/70161" },
    asco:  { org: "ASCO",  text: "ASCO 2024 (Ricker et al.)",                url: "https://doi.org/10.1200/OP.24.00278" },
    ukcgg: { org: "UKCGG", text: "UKCGG 2026 (McVeigh et al.)",              url: "https://doi.org/10.1136/jmg-2026-111648" }
};

// Guidelines covering most main-list genes: ESMO Box 1, CCO v4.0 Table 3, ASCO 2024
// Fig 3 and the UKCGG/CanVIG 2026 framework (which recommends routine follow-up only
// for its Category 1 genes — see ukcggCaveat below).
const ALL_SOURCES = [REFS.esmo, REFS.cco, REFS.asco, REFS.ukcgg];

// Step 3 — main gene list. A P/LP tumour variant in one of these genes is recommended
// for germline confirmation. A gene with a `question` is only on the list when that
// question is answered `passWhen`; otherwise the variant continues down the flowchart,
// or — if the gene has `judgementText` — ends in a clinical-judgement result.
// `refs` overrides ALL_SOURCES where fewer guidelines include the gene; `subject` and
// `context` shape the rationale sentence (see endorsement), `passText` replaces it
// outright; `note` is an informational footnote shown in the rationale.
const mainGenes = {
    ATM: {}, BARD1: {}, BRCA1: {}, BRCA2: {}, BRIP1: {}, CHEK2: {},
    DICER1: {}, FH: {}, FLCN: {}, MLH1: {}, MSH2: {}, MSH6: {}, PALB2: {}, PMS2: {},
    POLD1: {}, PTCH1: {}, RAD51C: {}, RAD51D: {}, RET: {}, SDHA: {}, SDHAF2: {},
    SDHB: {}, SDHC: {}, SDHD: {}, SMARCB1: {}, SUFU: {}, TMEM127: {}, TSC2: {},
    BAP1: { refs: [REFS.esmo, REFS.asco, REFS.ukcgg] },  // not in CCO Table 3
    CDH1: {
        refs: [REFS.esmo],
        question: { key: 'breast', title: 'Tumour type — CDH1', prompt: 'Is this a breast cancer?' },
        passWhen: 'no',
        context: ' in all tumour contexts excluding breast cancer',
        failText: 'ESMO does not recommend germline confirmation of CDH1 tumour variants in breast cancer.'
    },
    MEN1: {
        refs: [REFS.esmo],
        question: { key: 'nsclc', title: 'Tumour type — MEN1', prompt: 'Is this a non-small cell lung carcinoma?' },
        passWhen: 'yes',
        passText: 'ESMO’s data supports germline confirmation of MEN1 tumour variants in non-small cell lung carcinoma only, at any age.',
        failText: 'MEN1 germline confirmation is supported in non-small cell lung carcinoma only.'
    },
    MUTYH: {
        question: { key: 'biallelic', title: 'Zygosity — MUTYH', prompt: 'Is the MUTYH variant biallelic (homozygous, or with a second MUTYH variant)?' },
        passWhen: 'yes',
        subject: 'biallelic MUTYH', context: '',
        failText: 'MUTYH germline confirmation is recommended for biallelic variants only.'
    },
    NF1: {
        question: {
            key: 'nfContext', title: 'Clinical context',
            criteria: [
                'Clinical manifestations of neurofibromatosis type 1',
                'Associated tumour type (breast cancer, CNS cancer, GIST, glioma, nerve sheath tumour, peripheral nervous system tumour, PHEO-PGL)',
                'Strong clinical suspicion of germline origin'
            ],
            prompt: 'Does this case meet one or more of the above?'
        },
        passWhen: 'yes',
        passLead: 'NF manifestations, an associated tumour type or strong clinical suspicion is present.',
        judgementText: 'ESMO and CCO recommend germline confirmation for NF1 tumour variants in any tumour context. However, germline testing may reasonably be omitted in the absence of clinical NF manifestations, an associated tumour type or strong clinical suspicion: ASCO 2024 allows NF1 testing to be limited to associated tumour types or patients with NF manifestations for a conservative approach, and the UKCGG 2026 framework does not routinely recommend follow-up germline testing for NF1. Refer to clinical judgement.'
    },
    POLE: {
        note: 'CCO excludes endometrial cancer >50 years in their recommendation for germline confirmation of POLE tumour variants. However, this exclusion is not supported by ESMO’s dataset.'
    },
    SMAD3: {
        refs: [REFS.esmo, REFS.asco],  // not in CCO Table 3 or UKCGG
        note: 'CCO does not include SMAD3 variants in their recommendations. Although not cancer-related, SMAD3 has a pan-tumour GCR of 13% and is highly actionable for Loeys-Dietz syndrome 3 and non-syndromic thoracic aortic aneurysms.'
    },
    VHL: {
        question: { key: 'renal', title: 'Tumour type — VHL', prompt: 'Is this a renal (kidney) cancer?' },
        passWhen: 'no',
        context: ' in all tumour contexts excluding renal cancers',
        failText: 'VHL germline confirmation is not recommended for renal cancers.'
    }
};

// Step 4 — recommended if diagnosed ≤30y, or a Box A criterion / clinical suspicion is met.
// TP53 in a brain tumour skips the age criterion (brain tumours excluded, per ESMO).
// Values are the guidelines supporting the age criterion: ASCO 2024 limits CDKN2A and
// SMARCA4 to associated tumour types even under 30, so it is not cited for those two.
const ageGeneRefs = {
    APC: ALL_SOURCES, CDKN2A: [REFS.esmo, REFS.cco, REFS.ukcgg], PTEN: ALL_SOURCES,
    RB1: ALL_SOURCES, SMARCA4: [REFS.esmo, REFS.cco, REFS.ukcgg], TP53: ALL_SOURCES
};
const ageGenes = Object.keys(ageGeneRefs);

// TP53 brain-tumour exclusion: "may be excluded" in ESMO and ASCO; UKCGG notes low GCR
const BRAIN_REFS = [REFS.esmo, REFS.asco, REFS.ukcgg];

// UKCGG/CanVIG 2026 recommends routine germline follow-up only for its Category 1
// genes (BRCA1, BRCA2, PALB2, MLH1, MSH2, MSH6, RAD51C, RAD51D, BRIP1). Where the tool
// cites UKCGG for a Category 2 or 3 gene, its more conservative position is shown as a note.
const ukcggCategory2 = [
    "PMS2", "TSC2", "SDHA", "SDHB", "SDHC", "SDHAF2", "SDHD", "TMEM127", "MUTYH", "RET",
    "CDKN2A", "ATM", "CHEK2", "BARD1", "NF1", "FLCN", "FH", "VHL", "POLE", "POLD1",
    "SMARCA4", "SMARCB1", "DICER1", "PTCH1", "SUFU", "BAP1"
];
const ukcggCategory3 = ["TP53", "APC", "PTEN", "RB1"];

function ukcggCaveat(gene) {
    if (ukcggCategory2.includes(gene)) return `UKCGG 2026: ${gene} is grouped with genes of high germline conversion rate and context-dependent clinical utility; follow-up germline testing is not routinely recommended, but may be appropriate in some circumstances.`;
    if (ukcggCategory3.includes(gene)) return `UKCGG 2026: ${gene} has a low germline conversion rate but high cancer risk; follow-up germline testing is unlikely to be indicated, but may be appropriate in some circumstances, and should be reserved for strong clinical suspicion (considering VAF, tumour fraction and phenotype).`;
    return '';
}

// ASCO 2024 Fig 3 wording differs by gene: most are "should be offered", but these are
// only "may be offered" in any tumour (limited to associated tumours for a conservative
// approach), or tested only "if a less conservative testing approach is preferred".
const ascoMayOffer = ["ATM", "BAP1", "BARD1", "CHEK2", "DICER1", "FH", "FLCN", "NF1", "PTCH1", "POLD1", "POLE", "SDHA"];
const ascoLessConservative = ["SMAD3", "SMARCB1", "SUFU"];

const listJoin = names => names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

// Rationale naming the guidelines that recommend germline confirmation, e.g. "ESMO, CCO
// and ASCO recommend germline confirmation for ATM tumour variants in any tumour context."
// ASCO's softer wording gets its own sentence; UKCGG Category 2/3 genes are left out of
// the recommenders (their position is added as a note by ukcggCaveat).
function endorsement(gene, refs, subject = gene, context = ' in any tumour context') {
    const softAsco = ascoMayOffer.includes(gene) || ascoLessConservative.includes(gene);
    const recommenders = refs.filter(r => !(r === REFS.asco && softAsco) && !(r === REFS.ukcgg && ukcggCaveat(gene)));
    const parts = [];
    if (recommenders.length) parts.push(`${listJoin(recommenders.map(r => r.org))} ${recommenders.length === 1 ? 'recommends' : 'recommend'} germline confirmation for ${subject} tumour variants${context}.`);
    if (refs.includes(REFS.asco) && ascoMayOffer.includes(gene)) parts.push('ASCO 2024 states germline testing may be offered in any tumour, or limited to associated tumour types if a conservative approach is desired.');
    if (refs.includes(REFS.asco) && ascoLessConservative.includes(gene)) parts.push('ASCO 2024 suggests germline testing if a less conservative testing approach is preferred.');
    return parts.join(' ');
}

const CCO_JUDGEMENT = 'CCO supports germline testing based on clinical judgement in such cases.';

// Box A — additional contexts supporting germline confirmation at any age
const boxA = {
    APC:    { refs: [REFS.esmo], criteria: ["Non-small cell lung carcinoma, at any age (ESMO)"] },
    CDKN2A: { refs: [REFS.esmo, REFS.asco], criteria: ["Melanoma, at any age (ESMO)", "Breast cancer, at any age (ESMO)", "Pancreatic adenocarcinoma (ASCO 2024)"] },
    TP53:   { refs: [REFS.esmo], criteria: ["Soft tissue tumour, at any age (ESMO)", "Embryonal tumour, at any age (ESMO)"] }
};

// Genes outside both lists, kept for autocomplete and gene-name italics only —
// they follow the flowchart's "other clinical suspicion" path like any other gene.
const otherGenes = [
    "AIP", "AXIN2", "CDK4", "CTNNA1", "EGFR", "EGLN1", "EXT1", "EXT2", "GALNT12",
    "GREM1", "HOXB13", "KIT", "LZTR1", "MAX", "MET", "MITF", "MLH3", "NBN", "NTHL1",
    "PDGFRA", "POT1", "PRKAR1", "RECQL", "RNF43", "RPS20", "SMAD4", "SMARCE1", "TERT", "WT1"
];

const allGenes = [...new Set([...Object.keys(mainGenes), ...ageGenes, ...otherGenes])].sort();

// Flowchart questions shared across genes
const Q_FOUNDER   = { key: 'founder', title: 'Founder variant', prompt: 'Is this a known founder variant?' };
const Q_AGE       = { key: 'age30', title: 'Age at diagnosis', prompt: 'Was the patient 30 years old or younger at the time of this diagnosis?' };
const Q_BRAIN     = { key: 'brain', title: 'Tumour type — TP53', prompt: 'Is this a brain tumour?', note: 'ESMO: brain tumours may be excluded from germline confirmation of TP53 tumour variants (also ASCO 2024; UKCGG 2026 notes a low germline conversion rate for TP53 in brain tumours).' };
const Q_SUSPICION = { key: 'suspicion', title: 'Clinical suspicion', prompt: 'Are there any other clinical suspicions for a germline origin for the variant?' };

function boxAQuestion(gene) {
    const criteria = boxA[gene]?.criteria;
    if (!criteria) return { key: 'boxA', title: `Additional criteria — ${gene}`, prompt: 'Are there any clinical suspicions for a germline origin for the variant?' };
    return {
        key: 'boxA', title: `Additional criteria — ${gene}`,
        criteria: [...criteria, 'Clinical suspicion of a germline origin for the variant'],
        prompt: 'Does this case meet one or more of the above?'
    };
}

// Shared mutable state — read/written by the UI layer
window.variantStates = [];

// --- GERMLINE LOGIC (pure, no DOM) ---

// NCBI E-utilities rate limit is 3 requests/sec without an API key.
// Throttle every call so consecutive requests are at least 400ms apart
// — this prevents the rate limiter from silently returning empty results
// for the second variant onward in a multi-variant lookup.
let _lastNcbiRequest = 0;
const NCBI_MIN_INTERVAL = 400;
async function ncbiFetch(url) {
    const now = Date.now();
    const wait = Math.max(0, _lastNcbiRequest + NCBI_MIN_INTERVAL - now);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    _lastNcbiRequest = Date.now();
    return fetch(url);
}

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
        answers: {},          // flowchart question key → 'yes' | 'no'
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
        const searchResp = await ncbiFetch(searchUrl);
        if (!searchResp.ok) throw new Error(`ClinVar search HTTP ${searchResp.status}`);
        const searchData = await searchResp.json();
        const ids = searchData.esearchresult?.idlist || [];
        if (!ids.length) { state.clinvarDone = true; state.clinvarSignificance = 'none'; return; }

        const summaryResp = await ncbiFetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=clinvar&id=${ids.join(',')}&retmode=json`
        );
        if (!summaryResp.ok) throw new Error(`ClinVar summary HTTP ${summaryResp.status}`);
        const summaryData = await summaryResp.json();

        // ClinVar's search matches by gene + position text, not exact notation, so the
        // same query can return several distinct substitutions at that position. Scan
        // every candidate for one whose title actually matches what was typed, rather
        // than assuming the first hit is correct.
        const normalizedCoding = coding.toLowerCase().replace(/\s/g, '');
        const matchId = ids.find(id => {
            const v = summaryData.result?.[id];
            const t = (v?.title || v?.variation_name || '').toLowerCase().replace(/\s/g, '');
            return t.includes(normalizedCoding);
        });
        if (!matchId) { state.clinvarDone = true; state.clinvarSignificance = 'none'; return; }

        const variant = summaryData.result[matchId];

        const overallClass = variant.germline_classification?.description || '';
        if (!overallClass) { state.clinvarDone = true; state.clinvarSignificance = 'none'; return; }

        const scvs = variant.supporting_submissions?.scv || [];
        const counts = {};
        scvs.forEach(s => { const c = s.germline_classification; if (c) counts[c] = (counts[c] || 0) + 1; });

        state.clinvarDone = true;
        state.clinvarClass = overallClass;
        state.clinvarSignificance = classifySignificance(overallClass);
        state.clinvarId = matchId;
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

// Walk the flowchart for one variant. Returns the questions that apply so far, in
// order, and the result: null until P/LP status is known, { pending: true } while an
// applicable question is unanswered.
function evaluateVariant(state) {
    const { gene, plpConfirmed, answers } = state;
    const questions = [];
    const ask = q => { questions.push(q); return answers[q.key]; };
    const pending = () => ({ questions, result: { pending: true } });
    const done = result => ({ questions, result: { pending: false, ...result } });
    const recommended = (sub, rationale, refs, note) => {
        const caveat = refs.includes(REFS.ukcgg) ? ukcggCaveat(gene) : '';
        return done({ rec: 'RECOMMENDED', color: 'green', icon: 'fa-check-circle', sub, rationale, refs, note: [note, caveat].filter(Boolean).join(' ') });
    };
    const notRequired = (sub, rationale, refs = []) => done({ rec: 'NOT REQUIRED', color: 'red', icon: 'fa-ban', sub, rationale, refs });
    const judgement = (sub, rationale, refs) => done({ rec: 'CLINICAL JUDGEMENT', color: 'amber', icon: 'fa-user-md', sub, rationale, refs });

    if (plpConfirmed === null) return { questions, result: null };
    if (plpConfirmed === false) return done({
        rec: 'NOT REQUIRED', color: 'slate', icon: 'fa-ban', sub: 'Variant not classified as P/LP.',
        rationale: 'Germline follow-up is not required for tumour variants that are not pathogenic or likely pathogenic.', refs: []
    });

    // Step 3 — main gene list, or a known founder variant
    const rule = mainGenes[gene];
    let failText = `${gene} is not on the main germline confirmation gene list.`;
    let failRefs = [];
    if (rule) {
        const refs = rule.refs || ALL_SOURCES;
        const rationale = rule.passText ||
            [rule.passLead, endorsement(gene, refs, rule.subject, rule.context)].filter(Boolean).join(' ');
        if (!rule.question) return recommended('Gene on the main germline confirmation list.', rationale, refs, rule.note);
        const ans = ask(rule.question);
        if (!ans) return pending();
        if (ans === rule.passWhen) return recommended('Gene on the main germline confirmation list.', rationale, refs, rule.note);
        if (rule.judgementText) return judgement('Refer to clinical judgement.', rule.judgementText, refs);
        failText = rule.failText;
        failRefs = refs;
    }

    const founder = ask(Q_FOUNDER);
    if (!founder) return pending();
    if (founder === 'yes') return recommended('Known founder variant.',
        'The variant is a known founder variant. CCO recognises known founder variants as tumour-detected variants that may be clearly pathogenic and warrant germline testing.', [REFS.cco]);

    // Step 4 — age-dependent genes
    if (ageGenes.includes(gene)) {
        let ageApplies = true;
        if (gene === 'TP53') {
            const brain = ask(Q_BRAIN);
            if (!brain) return pending();
            ageApplies = brain === 'no';
        }
        if (ageApplies) {
            const age = ask(Q_AGE);
            if (!age) return pending();
            if (age === 'yes') return recommended('Tumour diagnosed at ≤30 years.',
                endorsement(gene, ageGeneRefs[gene], gene, ' in tumours diagnosed at or below 30 years'), ageGeneRefs[gene]);
        }
        const extra = ask(boxAQuestion(gene));
        if (!extra) return pending();
        if (extra === 'yes') {
            const boxRefs = boxA[gene]?.refs || [];
            const rationale = boxRefs.length
                ? `The ${gene} variant meets an additional criterion supported by ${listJoin(boxRefs.map(r => r.org))}, or there is a clinical suspicion of germline origin; ${CCO_JUDGEMENT}`
                : `There is a clinical suspicion of a germline origin for the ${gene} variant; ${CCO_JUDGEMENT}`;
            return recommended('Additional criterion or clinical suspicion met.', rationale, [...boxRefs, REFS.cco]);
        }
        const ageText = ageApplies ? 'the tumour was diagnosed after age 30' : 'brain tumours are excluded from the age criterion';
        return notRequired('No qualifying criteria met.',
            `${gene}: ${ageText}, the variant is not a known founder variant, and no additional criterion or clinical suspicion of germline origin was identified.`,
            ageApplies ? ageGeneRefs[gene] : BRAIN_REFS);
    }

    // Any other gene (or a main-list gene whose condition was not met)
    const suspicion = ask(Q_SUSPICION);
    if (!suspicion) return pending();
    if (suspicion === 'yes') return recommended('Clinical suspicion of germline origin.',
        `There is a clinical suspicion of a germline origin for the variant; ${CCO_JUDGEMENT}`, [REFS.cco]);
    return notRequired('No qualifying criteria met.',
        `${failText} The variant is not a known founder variant, and there is no other clinical suspicion of germline origin.`, failRefs);
}
