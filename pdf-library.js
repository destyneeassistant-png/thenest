(() => {
  const docs = Array.isArray(window.PDF_LIBRARY) ? window.PDF_LIBRARY : [];
  const FAVORITES_KEY = 'nest-library-favorites';
  const RECENT_KEY = 'nest-library-recent';
  const $ = id => document.getElementById(id);
  const parse = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  let favorites = new Set(parse(localStorage.getItem(FAVORITES_KEY), []));

  const categories = [...new Set(docs.map(document => document.category).filter(Boolean))].sort();
  $('category-filter').innerHTML += categories.map(category => `<option>${escapeHtml(category)}</option>`).join('');

  function render() {
    const query = $('pdf-search').value.trim().toLowerCase();
    const category = $('category-filter').value;
    const status = $('status-filter').value;
    const favoritesOnly = $('favorites-only').checked;
    const shown = docs.filter(document =>
      (!category || document.category === category) &&
      (!status || document.status === status) &&
      (!favoritesOnly || favorites.has(document.href)) &&
      (!query || [document.title, document.filename, document.category, document.type, document.status].join(' ').toLowerCase().includes(query))
    );
    $('pdf-count').textContent = `${shown.length} of ${docs.length}`;
    $('pdf-list').innerHTML = shown.length ? shown.map(document => `
      <article class="pdf-card">
        <div>
          <div><span class="badge">${escapeHtml(document.category)}</span><span class="badge">${escapeHtml(document.status)}</span><span class="badge">${escapeHtml(document.privacy)}</span></div>
          <h3>${escapeHtml(document.title)}</h3>
          <p class="pdf-filename">${escapeHtml(document.type || 'PDF')} · ${escapeHtml(document.filename)}</p>
        </div>
        <div class="pdf-card-actions">
          <button class="favorite-btn" data-favorite="${escapeHtml(document.href)}" aria-label="${favorites.has(document.href) ? 'Remove from' : 'Add to'} favorites">${favorites.has(document.href) ? '★' : '☆'}</button>
          <a class="action-btn" data-open="${escapeHtml(document.href)}" href="${encodeURI(document.href)}" target="_blank" rel="noopener">Open</a>
          <a class="btn-secondary" href="${encodeURI(document.href)}" download>Download</a>
        </div>
      </article>`).join('') : '<p class="empty">No documents match these filters.</p>';

    document.querySelectorAll('[data-favorite]').forEach(button => {
      button.onclick = () => {
        favorites.has(button.dataset.favorite) ? favorites.delete(button.dataset.favorite) : favorites.add(button.dataset.favorite);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
        render();
      };
    });
    document.querySelectorAll('[data-open]').forEach(link => {
      link.onclick = () => {
        const recent = parse(localStorage.getItem(RECENT_KEY), []).filter(item => item.href !== link.dataset.open);
        recent.unshift({ href: link.dataset.open, openedAt: new Date().toISOString() });
        localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 20)));
      };
    });
  }

  ['pdf-search', 'category-filter', 'status-filter', 'favorites-only'].forEach(id => $(id).addEventListener('input', render));
  render();
})();
