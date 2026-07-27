// --- HEREDITARY HEMATOLOGIC MALIGNANCY (HHM) DATA ---
// Panel-selection matrix from the HHM Genetic Testing one-page summary.
// Rows = personal history (diagnosis); columns = family-history level.

const hhmDiagnoses = [
    { key: "bmf",      label: "Bone Marrow Failure", fn: 1 },
    { key: "aml",      label: "Acute Myeloid malignancy (AML, MDS)", fn: 2 },
    { key: "mpn",      label: "Myeloproliferative Neoplasm", fn: 4 },
    { key: "lymphoma", label: "Lymphoma (Hodgkin / Non-Hodgkin)" },
    { key: "lymphoid", label: "Other Lymphoid malignancy (ALL, CLL, myeloma)" },
    { key: "multi",    label: "Any hematologic malignancy + 2 other cancers" },
    { key: "unaffected", label: "Unaffected individual (no personal hematologic diagnosis)" }
];

// Myeloid malignancy with one of these relevant pathogenic variants in the bone
// marrow → IBMF Panel (196 genes).
const hhmMyeloidBMVariantGenes = ["ANKRD26", "CEBPA", "DDX41", "ETV6", "GATA2", "RUNX1", "TERC", "TERT"];

// Specimen-type recommendation scenarios (shown for all cases).
const hhmSpecimenScenarios = [
    { key: "skin_allo",      label: "Patient had an allogeneic (donor) stem cell transplant", specimen: "skin" },
    { key: "skin_ooc",       label: "Active leukemia (AML/MDS, ALL), MPN, or bone marrow failure (BMF) — testing performed out of country (OOC)", specimen: "skin" },
    { key: "skin_lymph4",    label: "Active lymphoid malignancy, stage IV with bone marrow involvement", specimen: "skin" },
    { key: "buccal_lymph",   label: "Active lymphoma (stage I, II, III) — testing performed out of country (OOC)", specimen: "buccal" },
    { key: "blood_remission", label: "Hematologic malignancy now in remission", specimen: "blood" },
    { key: "blood_chronic",  label: "Chronic leukemia, myeloma, or other hematologic disorder (e.g. MGUS, lymphocytosis) — testing performed in Ontario (ON)", specimen: "blood" },
    { key: "blood_auto",     label: "Patient had an autologous stem cell transplant", specimen: "blood" }
];

const hhmSpecimenOutput = {
    skin:   { name: "Skin biopsy (cultured fibroblasts)", counsel: false },
    buccal: { name: "Buccal swab", counsel: true },
    blood:  { name: "Peripheral blood", counsel: true }
};

const HHM_SPECIMEN_COUNSEL = "Counsel the patient that testing may need to be repeated on a skin biopsy.";

const hhmFamily = [
    { key: "A", label: "No family history, diagnosed <40y (or <50y with syndrome features)", fn: 3 },
    { key: "B", label: "One FDR with a shared clinical presentation / hematologic diagnosis" },
    { key: "C", label: "Two relatives with a hematologic diagnosis (any myeloid, lymphoid, or bone marrow failure)" }
];

const hhmFootnotes = {
    1: "Bone marrow failure includes aplastic anemia or prolonged unexplained pancytopenia.",
    2: "AML excluding de-novo AML with core binding factors t(8;21) or inv(16)/APL.",
    3: "Syndrome features: cytogenetic aberrations in chromosome 7, chronic low blood cell counts, immunodeficiency, cutaneous or mucocutaneous findings, congenital anomalies.",
    4: "MPN includes ET, PRV, PMF, CMML."
};

// Targeted personal/family-history features shown for every case. Checking one
// appends its associated genes/syndromes to the recommendation.
const hhmFeatures = [
    { key: "bleeding",   label: "Easy bleeding or bruising (e.g. frequent nosebleeds, gum bleeding, heavy menses)", genes: ["RUNX1", "ETV6", "ANKRD26"] },
    { key: "infection",  label: "Recurrent or persistent infections / immunodeficiency (e.g. infections difficult to treat or not responsive to treatment)", genes: ["GATA2", "IKZF1", "WAS", "SH2D1A", "Bloom syndrome", "A-T"] },
    { key: "hearing",    label: "Hearing loss (e.g. sensorineural hearing loss)", genes: ["GATA2", "MECOM"] },
    { key: "skin",       label: "Skin or hair findings (e.g. lighter/darker skin patches, eczema, early greying, dysplastic fingernails)", genes: ["Telomere biology disorders", "Fanconi anemia", "CMMRD"] },
    { key: "congenital", label: "Congenital anomalies (e.g. characteristic facial features, heart/kidney/bone differences, developmental delay)", genes: ["Fanconi anemia", "Diamond Blackfan anemia", "Shwachman-Diamond syndrome", "RASopathies"] }
];

const HHM_IBMF = "IBMF Panel (196 genes)";
const HHM_COMP = "Comprehensive Cancer Panel (76 genes)";
const HHM_MPN_NOTE = "Custom panel: include MPN genes plus the Comprehensive Cancer Panel (76 genes).";
const HHM_LYMPHOMA_C_NOTE = "If the other two hematologic diagnoses in the family are also lymphoma, order a custom panel (lymphoma genes plus the Comprehensive Cancer Panel).";
const HHM_MULTI_NOTE = "More expanded / out-of-country (OOC) panels may be considered depending on the patient's diagnosis.";

// Each cell: { panel, note } for a recommendation, or { na: true } when not applicable.
const hhmMatrix = {
    bmf:      { A: { panel: HHM_IBMF }, B: { panel: HHM_IBMF }, C: { panel: HHM_IBMF } },
    aml:      { A: { panel: HHM_IBMF }, B: { panel: HHM_IBMF }, C: { panel: HHM_IBMF } },
    mpn:      { A: { na: true },
                B: { panel: "Custom Panel", note: HHM_MPN_NOTE },
                C: { panel: "Custom Panel", note: HHM_MPN_NOTE } },
    lymphoma: { A: { na: true },
                B: { panel: HHM_COMP },
                C: { panel: HHM_COMP, note: HHM_LYMPHOMA_C_NOTE } },
    lymphoid: { A: { na: true }, B: { panel: HHM_COMP }, C: { panel: HHM_COMP } },
    multi:    { A: { panel: HHM_COMP, note: HHM_MULTI_NOTE },
                B: { panel: HHM_COMP, note: HHM_MULTI_NOTE },
                C: { panel: HHM_COMP, note: HHM_MULTI_NOTE } }
};

// --- HHM LOGIC (pure, no DOM) ---
function computeHHM(dxKey, famKey) {
    if (!dxKey || !famKey) return null;
    const row = hhmMatrix[dxKey];
    if (!row) return null;
    return row[famKey] || null;
}

// Derive the family-history column (A/B/C) from targeted history answers.
// Returns 'A' | 'B' | 'C' when determinable, 'NONE' when the scenario meets
// no criteria, or null when more answers are still needed.
//   state = { ageBand:'under40'|'40to49'|'50plus', syndrome:true|false|null,
//             relatives:'0'|'1'|'2plus', shared:true|false|null }
function computeHHMColumn(state) {
    const { ageBand, syndrome, relatives, shared } = state;
    if (!relatives) return null;
    if (relatives === '2plus') return 'C';
    if (relatives === '1') {
        if (shared === null || shared === undefined) return null;
        if (shared === true) return 'B';
        // shared === false → no relevant family history; fall through to personal-history logic
    }
    // No relevant family history (0 relatives, or 1 that does not share) → column A depends on personal history
    if (!ageBand) return null;
    if (ageBand === 'under40') return 'A';
    if (ageBand === '40to49') {
        if (syndrome === null || syndrome === undefined) return null;
        return syndrome ? 'A' : 'NONE';
    }
    return 'NONE'; // ≥50 with no qualifying family history
}
