// --- ELIGIBILITY DATA ---
const dxCategories = {
    "HBOC": ["Breast cancer ≤ 45y", "Triple neg breast ≤ 60y", "Male breast cancer (any age)", "Invasive epithelial ovarian cancer", "Metastatic prostate cancer", "Pancreatic adenocarcinoma"],
    "Lynch": ["CRC or Endometrial < 50y", "MMR deficiency (IHC loss) without BRAF mutation", "2+ Lynch-associated cancers", "Risk score ≥ 5%"],
    "Gastric": ["Diffuse gastric cancer < 50y", "Gastric and Lobular breast cancer (self/family)"],
    "Renal": ["RCC ≤ 45y", "Bilateral/Multifocal renal tumors", "Chromophobe/Oncocytic histology"],
    "Prostate": ["Metastatic prostate cancer", "Gleason score ≥ 8", "Intraductal/Cribriform histology"]
};

const dxMapping = {
    "Breast Adenocarcinoma": "HBOC",
    "Lobular Breast Cancer": "Gastric",
    "Colon Adenocarcinoma": "Lynch",
    "Endometrial Cancer": "Lynch",
    "Clear Cell Renal Cell Carcinoma": "Renal",
    "Ovarian Serous Carcinoma": "HBOC",
    "Prostate Cancer": "Prostate",
    "Pancreatic Duct Adenocarcinoma": "HBOC"
};

// --- ELIGIBILITY LOGIC ---
const sInput = document.getElementById('cancerSearch');
const sRes = document.getElementById('searchResults');

sInput.addEventListener('input', () => {
    const val = sInput.value.toLowerCase();
    sRes.innerHTML = '';
    if (!val) { sRes.classList.add('hidden'); return; }
    const matches = Object.keys(dxMapping).filter(d => d.toLowerCase().includes(val));
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
    const cat = dxMapping[dx];
    const qs = dxCategories[cat];
    document.getElementById('eligibilityQuestionnaire').classList.remove('hidden');
    document.getElementById('eligTitle').textContent = dx;
    sRes.classList.add('hidden'); sInput.value = '';

    const container = document.getElementById('eligQuestions');
    container.innerHTML = '';
    qs.forEach((q) => {
        container.innerHTML += `<label class="flex items-center gap-3 p-4 border rounded-xl hover:bg-slate-50 cursor-pointer"><input type="checkbox" class="elig-check w-5 h-5" onchange="calcElig()"> <span class="text-sm font-semibold">${q}</span></label>`;
    });
    container.innerHTML += `<label class="flex items-center gap-3 p-4 border-2 border-dashed border-red-200 bg-red-50 rounded-xl cursor-pointer md:col-span-2"><input type="checkbox" id="eNone" class="w-5 h-5" onchange="handleNone(this)"> <span class="text-sm font-black text-red-800 uppercase">None of the above apply</span></label>`;
    calcElig();
}

function handleNone(cb) {
    if (cb.checked) document.querySelectorAll('.elig-check').forEach(c => c.checked = false);
    calcElig();
}

function calcElig() {
    const result = document.getElementById('eligFinalResult');
    const isElig = Array.from(document.querySelectorAll('.elig-check')).some(c => c.checked);
    const isNone = document.getElementById('eNone')?.checked;
    if (!result) return;
    result.classList.remove('hidden');
    if (isElig) {
        result.className = 'mt-8 p-6 rounded-2xl bg-green-50 border-green-500 text-green-900 animate-fade-in';
        result.innerHTML = `<h3 class="font-black text-xl">ELIGIBILITY CONFIRMED</h3><p>Patient meets Provincial HCT criteria.</p>`;
    } else if (isNone) {
        result.className = 'mt-8 p-6 rounded-2xl bg-red-50 border-red-500 text-red-900 animate-fade-in';
        result.innerHTML = `<h3 class="font-black text-xl">ELIGIBILITY NOT MET</h3><p>Does not meet CCO criteria.</p>`;
    } else {
        result.className = 'mt-8 p-6 rounded-2xl bg-slate-100 text-slate-400 text-center uppercase text-xs font-black tracking-widest';
        result.innerHTML = "Select criteria to assess";
    }
}

function resetEligibility() {
    document.getElementById('eligibilityQuestionnaire').classList.add('hidden');
}
