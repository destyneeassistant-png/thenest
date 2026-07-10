(() => {
  const DASHBOARD_KEY = 'nest-dashboard-v2';
  const CALENDAR_KEY = 'nest_calendar_events_v1';
  const DISSERTATION_KEY = 'nest-dissertation-v1';

  const parseJson = (value, fallback) => {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  };
  const state = parseJson(localStorage.getItem(DASHBOARD_KEY), { priorities: [] });
  if (!Array.isArray(state.priorities)) state.priorities = [];
  const parseDate = value => {
    const [year, month, day] = String(value || '').split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const minutes = time => {
    const match = /^(\d{2}):(\d{2})$/.exec(String(time || ''));
    return match ? Number(match[1]) * 60 + Number(match[2]) : Number.NaN;
  };
  const occurrence = (event, key) => {
    if (!event?.date) return false;
    if (event.date === key) return true;
    if (!event.repeat || event.repeat === 'none' || event.date > key) return false;
    if (event.repeat === 'daily') return true;
    const eventDate = parseDate(event.date);
    const targetDate = parseDate(key);
    if (event.repeat === 'weekly') return eventDate.getDay() === targetDate.getDay();
    if (event.repeat === 'monthly') return eventDate.getDate() === targetDate.getDate();
    return false;
  };

  function escapeHtml(value) {
    const element = document.createElement('div');
    element.textContent = value || '';
    return element.innerHTML;
  }

  function renderTemporal() {
    const now = new Date();
    const todayKey = dateKey(now);
    document.getElementById('today-label').textContent = now.toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric'
    });
    const events = parseJson(localStorage.getItem(CALENDAR_KEY), []).filter(event => event && typeof event === 'object');
    const todays = events
      .filter(event => occurrence(event, todayKey) && Number.isFinite(minutes(event.start)))
      .sort((left, right) => left.start.localeCompare(right.start));
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const current = todays.find(event => minutes(event.start) <= nowMinutes && minutes(event.end) > nowMinutes);
    const next = todays.find(event => minutes(event.start) > nowMinutes);
    const nowNext = document.getElementById('now-next');
    if (current || next) {
      nowNext.innerHTML = [
        current && `<div><span class="badge">Now</span><strong>${escapeHtml(current.title)}</strong><p class="muted">${current.start}–${current.end}</p></div>`,
        next && `<div><span class="badge">Next</span><strong>${escapeHtml(next.title)}</strong><p class="muted">${next.start}–${next.end}</p></div>`
      ].filter(Boolean).join('');
    } else {
      nowNext.innerHTML = '<p class="empty">No current or upcoming event today. Add today’s plans in Calendar.</p>';
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueEnd = new Date(todayStart);
    dueEnd.setDate(dueEnd.getDate() + 7);
    const due = events.filter(event => {
      const date = parseDate(event.date);
      return !Number.isNaN(date.getTime()) && date >= todayStart && date <= dueEnd;
    }).sort((left, right) => `${left.date}${left.start || ''}`.localeCompare(`${right.date}${right.start || ''}`)).slice(0, 5);
    const dueList = document.getElementById('due-soon-list');
    dueList.innerHTML = due.length ? due.map(event => {
      const date = parseDate(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      return `<div><strong>${escapeHtml(event.title)}</strong><p class="muted">${date}${event.start ? ` · ${event.start}` : ''}</p></div>`;
    }).join('') : '<p class="empty">No dated items in the next seven days.</p>';
  }

  function renderPriorities() {
    document.getElementById('priorities-list').innerHTML = state.priorities.length
      ? state.priorities.slice(0, 3).map(priority => `<li>${escapeHtml(priority)}</li>`).join('')
      : '<li class="empty">No priorities saved.</li>';
  }

  renderTemporal();
  renderPriorities();
  window.setInterval(renderTemporal, 60_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderTemporal(); });
  window.addEventListener('storage', event => { if (event.key === CALENDAR_KEY) renderTemporal(); });

  document.getElementById('edit-priorities').onclick = () => {
    state.priorities.forEach((priority, index) => { document.getElementById(`priority-${index + 1}`).value = priority; });
    document.getElementById('priority-form').hidden = false;
  };
  document.getElementById('priority-form').onsubmit = event => {
    event.preventDefault();
    state.priorities = [1, 2, 3]
      .map(index => document.getElementById(`priority-${index}`).value.trim())
      .filter(Boolean)
      .slice(0, 3);
    localStorage.setItem(DASHBOARD_KEY, JSON.stringify(state));
    event.target.hidden = true;
    renderPriorities();
  };

  const dissertation = parseJson(localStorage.getItem(DISSERTATION_KEY), {});
  if (dissertation.nextAction) document.getElementById('dissertation-action').textContent = dissertation.nextAction;

  document.getElementById('quick-capture-form').onsubmit = async event => {
    event.preventDefault();
    const input = document.getElementById('quick-capture');
    const status = document.getElementById('capture-status');
    const text = input.value.trim();
    if (!text) return;
    status.textContent = 'Saving to Notes…';
    try {
      await NestStorage.addNote(text, { category: 'Inbox', tags: ['quick-capture'] });
      input.value = '';
      status.textContent = 'Saved in Notes · Inbox.';
    } catch (error) {
      status.textContent = `Could not save: ${error.message}`;
    }
  };
})();
