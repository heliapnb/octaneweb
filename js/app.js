// --- TAB NAVIGATION ---
function switchTab(t) {
    ['eligibility', 'germline'].forEach(id => {
        const tab = document.getElementById(`tab-${id}`);
        const sec = document.getElementById(`sec-${id}`);
        if (tab) tab.classList.toggle('on', id === t);
        if (sec) sec.classList.toggle('is-hidden', id !== t);
    });
}
