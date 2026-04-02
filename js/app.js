// --- TAB NAVIGATION ---
function switchTab(t) {
    ['eligibility', 'germline'].forEach(id => {
        const tab = document.getElementById(`tab-${id}`);
        const sec = document.getElementById(`sec-${id}`);
        if (tab) tab.className = id === t
            ? 'whitespace-nowrap px-8 py-5 font-bold tab-active transition-all outline-none'
            : 'whitespace-nowrap px-8 py-5 font-bold text-slate-400 hover:text-blue-600 transition-all outline-none';
        if (sec) sec.classList.toggle('step-inactive', id !== t);
    });
}
