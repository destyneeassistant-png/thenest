(() => {
    const pdfs = Array.isArray(window.PDF_LIBRARY) ? window.PDF_LIBRARY : (typeof PDF_LIBRARY !== 'undefined' ? PDF_LIBRARY : []);
    const listEl = document.getElementById('pdf-list');
    const countEl = document.getElementById('pdf-count');
    const searchEl = document.getElementById('pdf-search');

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) return '';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unit = 0;
        while (size >= 1024 && unit < units.length - 1) {
            size /= 1024;
            unit += 1;
        }
        return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
    }

    function matches(pdf, term) {
        if (!term) return true;
        const haystack = `${pdf.title} ${pdf.filename}`.toLowerCase();
        return haystack.includes(term.toLowerCase());
    }

    function render() {
        const term = searchEl.value.trim();
        const filtered = pdfs.filter(pdf => matches(pdf, term));
        countEl.textContent = `${filtered.length} of ${pdfs.length} PDFs`;

        if (!filtered.length) {
            listEl.innerHTML = '<p class="empty-state">No PDFs match that search.</p>';
            return;
        }

        listEl.innerHTML = filtered.map(pdf => {
            const size = formatBytes(pdf.size);
            return `
                <article class="pdf-card">
                    <div class="pdf-card-icon" aria-hidden="true">📄</div>
                    <div class="pdf-card-body">
                        <h3>${escapeHtml(pdf.title)}</h3>
                        <p class="pdf-filename">${escapeHtml(pdf.filename)}${size ? ` · ${size}` : ''}</p>
                    </div>
                    <div class="pdf-card-actions">
                        <a class="action-btn pdf-open-btn" href="${encodeURI(pdf.href)}" target="_blank" rel="noopener">Open</a>
                        <a class="btn-secondary pdf-download-btn" href="${encodeURI(pdf.href)}" download>Download</a>
                    </div>
                </article>
            `;
        }).join('');
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    searchEl.addEventListener('input', render);
    render();
})();
