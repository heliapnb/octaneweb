// --- PROTOTYPE DISCLAIMER ---
// The overlay is present in the HTML so it shows before scripts run, and its
// button removes it inline. This only adds keyboard dismissal and focus.
(function () {
    const overlay = document.getElementById('disclaimerOverlay');
    if (!overlay) return;

    const btn = document.getElementById('disclaimerBtn');
    if (btn) btn.focus();

    document.addEventListener('keydown', function onKey(e) {
        if (!document.getElementById('disclaimerOverlay')) {
            document.removeEventListener('keydown', onKey);
            return;
        }
        if (e.key === 'Escape' || e.key === 'Enter') {
            overlay.remove();
            document.removeEventListener('keydown', onKey);
        }
    });
})();

// --- TAB NAVIGATION ---
function switchTab(t) {
    ['eligibility', 'germline', 'hhm'].forEach(id => {
        const tab = document.getElementById(`tab-${id}`);
        const sec = document.getElementById(`sec-${id}`);
        if (tab) tab.classList.toggle('on', id === t);
        if (sec) sec.classList.toggle('is-hidden', id !== t);
    });
}
