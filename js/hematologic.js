// --- HEREDITARY HEMATOLOGIC MALIGNANCY (HHM) DATA ---
// Panel-selection matrix from the HHM Genetic Testing one-page summary.
// Rows = personal history (diagnosis); columns = family-history level.

const hhmDiagnoses = [
    { key: "bmf",      label: "Bone Marrow Failure", fn: 1 },
    { key: "aml",      label: "Acute Myeloid malignancy (AML, MDS)", fn: 2 },
    { key: "mpn",      label: "Myeloproliferative Neoplasm", fn: 4 },
    { key: "lymphoma", label: "Lymphoma (Hodgkin / Non-Hodgkin)" },
    { key: "lymphoid", label: "Other Lymphoid malignancy (ALL, CLL, myeloma)" },
    { key: "multi",    label: "Any hematologic malignancy + 2 other cancers" }
];

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
