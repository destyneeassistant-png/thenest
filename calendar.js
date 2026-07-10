// The Nest Calendar - Google Calendar-style local calendar
// Stores events in localStorage so it works on GitHub Pages/static hosting.

const CALENDAR_KEY = 'nest_calendar_events_v1';
const LEGACY_KEY = 'nest_events';
const CALENDAR_MIGRATION_KEY = 'nest_calendar_removed_old_semester_schedule_v2';

const CALENDARS = {
    class: { label: 'Class', color: '#ff006e' },
    dissertation: { label: 'Dissertation', color: '#39ff14' },
    study: { label: 'Study', color: '#8338ec' },
    meeting: { label: 'Meeting', color: '#00f5ff' },
    clinical: { label: 'Clinical / Practicum', color: '#2ec4b6' },
    wellness: { label: 'Wellness', color: '#fb5607' },
    personal: { label: 'Personal', color: '#ffbe0b' },
    other: { label: 'Other', color: '#a0a0b0' }
};

const pad = n => String(n).padStart(2, '0');
const ymd = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseLocalDate = value => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
};
const sameDay = (a, b) => ymd(a) === ymd(b);
const addDays = (date, days) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
};
const startOfWeek = date => addDays(date, -date.getDay());
const minutesOf = time => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};
const fmtTime = time => {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const display = h % 12 || 12;
    return `${display}:${pad(m)} ${suffix}`;
};
const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

class NestCalendar {
    constructor() {
        this.today = new Date();
        this.cursor = new Date();
        this.selected = new Date();
        this.view = 'month';
        this.search = '';
        this.events = this.loadEvents();
        this.editingId = null;
        this.sync = window.NestSupabaseCalendarSync ? new window.NestSupabaseCalendarSync() : null;
    }

    init() {
        document.getElementById('calendar-today-label').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric'
        });
        this.bindEvents();
        this.render();
        this.updateSyncStatus();
        this.syncFromSupabase();
    }

    bindEvents() {
        document.getElementById('create-event-btn').addEventListener('click', () => this.openModal());
        document.getElementById('prev-btn').addEventListener('click', () => this.navigate(-1));
        document.getElementById('next-btn').addEventListener('click', () => this.navigate(1));
        document.getElementById('today-btn').addEventListener('click', () => {
            this.cursor = new Date();
            this.selected = new Date();
            this.render();
        });
        document.querySelectorAll('.cal-view-btn').forEach(btn => btn.addEventListener('click', () => {
            this.view = btn.dataset.view;
            document.querySelectorAll('.cal-view-btn').forEach(b => {
                b.classList.toggle('active', b === btn);
                b.setAttribute('aria-selected', String(b === btn));
                b.tabIndex = b === btn ? 0 : -1;
            });
            this.render();
        }));
        document.querySelector('[role="tablist"]').addEventListener('keydown', event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            const tabs = [...document.querySelectorAll('.cal-view-btn')];
            const current = tabs.indexOf(document.activeElement);
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
            event.preventDefault();
            tabs[next].focus();
            tabs[next].click();
        });
        document.getElementById('calendar-search').addEventListener('input', e => {
            this.search = e.target.value.trim().toLowerCase();
            this.render();
        });
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-event-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('event-modal').addEventListener('click', e => {
            if (e.target.id === 'event-modal') this.closeModal();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && document.getElementById('event-modal').classList.contains('active')) this.closeModal();
        });
        document.getElementById('event-form').addEventListener('submit', e => this.saveEvent(e));
        document.getElementById('delete-event-btn').addEventListener('click', () => this.deleteEvent());
        document.getElementById('export-events-btn').addEventListener('click', () => this.exportEvents());
        document.getElementById('import-events-input').addEventListener('change', e => this.importEvents(e));

        const startInput = document.getElementById('event-start');
        const endInput = document.getElementById('event-end');
        const durationSelect = document.getElementById('event-duration');
        durationSelect.addEventListener('change', () => this.applyDurationPreset());
        startInput.addEventListener('input', () => {
            if (durationSelect.value !== 'custom') this.applyDurationPreset();
            this.updateDurationSummary();
        });
        endInput.addEventListener('input', () => {
            durationSelect.value = 'custom';
            this.updateDurationSummary();
        });
    }

    loadEvents() {
        const existing = JSON.parse(localStorage.getItem(CALENDAR_KEY) || 'null');
        if (existing) return this.cleanupOldSemesterScheduleSeeds(existing);

        const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]').map(item => ({
            id: `legacy-${item.id || crypto.randomUUID()}`,
            title: item.title,
            date: ymd(new Date(item.date)),
            start: item.time || '09:00',
            end: this.deriveEnd(item.time || '09:00', item.duration || '1 hour'),
            calendar: CALENDARS[item.category] ? item.category : 'other',
            repeat: 'none',
            reminder: 'none',
            location: '',
            notes: item.duration || ''
        }));

        const events = legacy;
        localStorage.setItem(CALENDAR_KEY, JSON.stringify(events));
        return events;
    }

    cleanupOldSemesterScheduleSeeds(events) {
        if (localStorage.getItem(CALENDAR_MIGRATION_KEY)) return events;
        const cleaned = events.filter(event => !(
            event.id === 'seed-2-10-00-cognitive-development-class' ||
            event.id === 'seed-2-09-00-dissertation-meeting' ||
            (event.title === 'Cognitive Development Class' && event.repeat === 'weekly' && event.start === '10:00' && event.end === '18:30') ||
            (event.title === 'Dissertation Meeting' && event.repeat === 'weekly' && event.start === '09:00' && event.end === '09:45')
        ));
        localStorage.setItem(CALENDAR_MIGRATION_KEY, 'true');
        if (cleaned.length !== events.length) localStorage.setItem(CALENDAR_KEY, JSON.stringify(cleaned));
        return cleaned;
    }

    deriveEnd(start, duration) {
        const mins = /45/.test(duration) ? 45 : /30/.test(duration) ? 30 : /2/.test(duration) ? 120 : 60;
        const total = minutesOf(start) + mins;
        return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
    }

    endFromMinutes(start, durationMinutes) {
        const total = minutesOf(start) + Number(durationMinutes);
        return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
    }

    durationBetween(start, end) {
        let minutes = minutesOf(end) - minutesOf(start);
        if (minutes < 0) minutes += 24 * 60;
        return minutes;
    }

    durationLabel(minutes) {
        if (!Number.isFinite(minutes) || minutes <= 0) return '—';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (!hours) return `${mins} minutes`;
        if (!mins) return `${hours} hour${hours === 1 ? '' : 's'}`;
        return `${hours} hour${hours === 1 ? '' : 's'} ${mins} minutes`;
    }

    inferDurationPreset(start, end) {
        const minutes = this.durationBetween(start, end);
        return ['15', '30', '45', '60', '90', '120', '180', '240'].includes(String(minutes)) ? String(minutes) : 'custom';
    }

    applyDurationPreset() {
        const duration = document.getElementById('event-duration').value;
        const start = document.getElementById('event-start').value;
        if (duration === 'custom' || !start) {
            this.updateDurationSummary();
            return;
        }
        document.getElementById('event-end').value = this.endFromMinutes(start, duration);
        this.updateDurationSummary();
    }

    updateDurationSummary() {
        const start = document.getElementById('event-start')?.value;
        const end = document.getElementById('event-end')?.value;
        const summary = document.getElementById('event-duration-summary');
        if (!summary) return;
        if (!start || !end) {
            summary.textContent = 'Duration: —';
            return;
        }
        const minutes = this.durationBetween(start, end);
        summary.textContent = `Duration: ${this.durationLabel(minutes)} (${fmtTime(start)}–${fmtTime(end)})`;
    }

    nextWeekday(weekday) {
        const date = new Date();
        const diff = (weekday - date.getDay() + 7) % 7;
        return addDays(date, diff);
    }

    saveAll() {
        const stamped = this.events.map(event => ({
            ...event,
            updatedAt: event.updatedAt || new Date().toISOString()
        }));
        this.events = stamped;
        localStorage.setItem(CALENDAR_KEY, JSON.stringify(this.events));
    }

    updateSyncStatus(message, state = 'local') {
        const el = document.getElementById('supabase-sync-status');
        if (!el) return;
        el.classList.toggle('ready', state === 'ready');
        el.classList.toggle('error', state === 'error');
        if (message) {
            el.innerHTML = message;
            return;
        }
        if (this.sync?.enabled) {
            el.classList.add('ready');
            el.innerHTML = '<strong>Supabase sync on</strong>Local saves stay in this browser and sync to Supabase for Sonya when network/config allow it.';
        } else {
            el.innerHTML = '<strong>Browser-local calendar</strong>Events stay in this browser unless you export them. Cloud sync is not configured.';
        }
    }

    async syncFromSupabase() {
        if (!this.sync?.enabled) return;
        try {
            this.updateSyncStatus('<strong>Syncing...</strong>Pulling calendar events from Supabase.', 'ready');
            const result = await this.sync.pullEvents();
            if (!result.ok) return;
            const merged = this.sync.mergeEvents(this.events, result.events);
            this.events = merged;
            this.saveAll();
            await this.sync.replaceEvents(this.events);
            this.render();
            this.updateSyncStatus(`<strong>Supabase sync on</strong>${this.events.length} calendar event${this.events.length === 1 ? '' : 's'} available locally and in Supabase.`, 'ready');
        } catch (err) {
            console.error('Supabase calendar sync failed:', err);
            this.updateSyncStatus(`<strong>Sync error</strong>Still saving locally. ${escapeHtml(err.message || err)}`, 'error');
        }
    }

    async syncSavedEvent(event) {
        if (!this.sync?.enabled) return;
        try {
            await this.sync.upsertEvent(event);
            this.updateSyncStatus(`<strong>Synced</strong>${escapeHtml(event.title)} saved to this browser and Supabase.`, 'ready');
        } catch (err) {
            console.error('Supabase event save failed:', err);
            this.updateSyncStatus(`<strong>Sync error</strong>Event saved locally only. ${escapeHtml(err.message || err)}`, 'error');
        }
    }

    async syncDeletedEvent(id) {
        if (!this.sync?.enabled) return;
        try {
            await this.sync.deleteEvent(id);
            this.updateSyncStatus('<strong>Synced</strong>Event deleted locally and marked deleted in Supabase.', 'ready');
        } catch (err) {
            console.error('Supabase event delete failed:', err);
            this.updateSyncStatus(`<strong>Sync error</strong>Event deleted locally only. ${escapeHtml(err.message || err)}`, 'error');
        }
    }

    navigate(direction) {
        if (this.view === 'month') this.cursor.setMonth(this.cursor.getMonth() + direction);
        if (this.view === 'week') this.cursor = addDays(this.cursor, 7 * direction);
        if (this.view === 'day') this.cursor = addDays(this.cursor, direction);
        if (this.view === 'agenda') this.cursor = addDays(this.cursor, 14 * direction);
        this.render();
    }

    occurrencesBetween(startDate, endDate) {
        const results = [];
        for (const event of this.events) {
            const base = parseLocalDate(event.date);
            for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
                if (this.eventOccursOn(event, base, d)) {
                    const occurrence = { ...event, occurrenceDate: ymd(d), occurrenceId: `${event.id}::${ymd(d)}` };
                    if (this.matchesSearch(occurrence)) results.push(occurrence);
                }
            }
        }
        return results.sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate) || a.start.localeCompare(b.start));
    }

    eventOccursOn(event, base, date) {
        if (event.repeat === 'daily') return date >= base;
        if (event.repeat === 'weekly') return date >= base && date.getDay() === base.getDay();
        if (event.repeat === 'monthly') return date >= base && date.getDate() === base.getDate();
        return sameDay(base, date);
    }

    matchesSearch(event) {
        if (!this.search) return true;
        return [event.title, event.location, event.notes, CALENDARS[event.calendar]?.label].join(' ').toLowerCase().includes(this.search);
    }

    eventsForDate(date) {
        return this.occurrencesBetween(date, date);
    }

    render() {
        this.renderMiniMonth();
        this.renderUpcoming();
        if (this.view === 'month') this.renderMonth();
        if (this.view === 'week') this.renderWeek();
        if (this.view === 'day') this.renderDay();
        if (this.view === 'agenda') this.renderAgenda();
    }

    setTitle(text) { document.getElementById('cal-title').textContent = text; }

    renderMiniMonth() {
        const year = this.cursor.getFullYear();
        const month = this.cursor.getMonth();
        const first = new Date(year, month, 1);
        const start = addDays(first, -first.getDay());
        const headers = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<div class="mini-cell header">${d}</div>`).join('');
        let html = headers;
        for (let i = 0; i < 42; i++) {
            const date = addDays(start, i);
            const classes = ['mini-cell'];
            if (date.getMonth() !== month) classes.push('other');
            if (sameDay(date, this.today)) classes.push('today');
            if (sameDay(date, this.selected)) classes.push('selected');
            html += `<button class="${classes.join(' ')}" data-date="${ymd(date)}">${date.getDate()}</button>`;
        }
        const root = document.getElementById('mini-month');
        root.innerHTML = html;
        root.querySelectorAll('button[data-date]').forEach(btn => btn.addEventListener('click', () => {
            this.selected = parseLocalDate(btn.dataset.date);
            this.cursor = new Date(this.selected);
            this.view = 'day';
            document.querySelectorAll('.cal-view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === 'day'));
            this.render();
        }));
    }

    renderUpcoming() {
        const events = this.occurrencesBetween(new Date(), addDays(new Date(), 21)).slice(0, 8);
        document.getElementById('upcoming-list').innerHTML = events.length ? events.map(e => this.listItem(e)).join('') : '<p class="cal-muted">No upcoming events.</p>';
        document.querySelectorAll('[data-open-event]').forEach(el => el.addEventListener('click', () => this.openModal(el.dataset.openEvent.split('::')[0])));
    }

    renderMonth() {
        const year = this.cursor.getFullYear();
        const month = this.cursor.getMonth();
        this.setTitle(new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        const first = new Date(year, month, 1);
        const start = addDays(first, -first.getDay());
        const headers = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="month-head">${d}</div>`).join('');
        let html = `<div class="month-grid">${headers}`;
        for (let i = 0; i < 42; i++) {
            const date = addDays(start, i);
            const events = this.eventsForDate(date);
            const classes = ['month-cell'];
            if (date.getMonth() !== month) classes.push('other');
            if (sameDay(date, this.today)) classes.push('today');
            html += `<div class="${classes.join(' ')}" data-date="${ymd(date)}">
                <div class="month-date"><strong>${date.getDate()}</strong>${events.length ? `<span>${events.length}</span>` : ''}</div>
                ${events.slice(0, 4).map(e => this.eventChip(e)).join('')}
                ${events.length > 4 ? `<button class="event-chip" style="color: var(--text-muted);">+${events.length - 4} more</button>` : ''}
            </div>`;
        }
        html += '</div>';
        this.stage(html);
    }

    renderWeek() {
        const start = startOfWeek(this.cursor);
        const end = addDays(start, 6);
        this.setTitle(`${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
        let html = '<div class="week-grid"><div class="week-corner"></div>';
        for (let i = 0; i < 7; i++) {
            const date = addDays(start, i);
            html += `<div class="week-day-head ${sameDay(date, this.today) ? 'today' : ''}">${date.toLocaleDateString('en-US', { weekday: 'short' })}<br>${date.getDate()}</div>`;
        }
        for (let hour = 6; hour <= 22; hour++) {
            const time = `${pad(hour)}:00`;
            html += `<div class="time-label">${fmtTime(time)}</div>`;
            for (let day = 0; day < 7; day++) {
                const date = addDays(start, day);
                const events = this.eventsForDate(date).filter(e => Math.floor(minutesOf(e.start) / 60) === hour);
                html += `<div class="time-slot" data-date="${ymd(date)}" data-time="${time}">${events.map(e => this.weekEvent(e)).join('')}</div>`;
            }
        }
        html += '</div>';
        this.stage(html);
    }

    renderDay() {
        const date = new Date(this.cursor);
        this.selected = date;
        this.setTitle(date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
        let html = '<div class="day-layout">';
        for (let hour = 6; hour <= 22; hour++) {
            const time = `${pad(hour)}:00`;
            const events = this.eventsForDate(date).filter(e => Math.floor(minutesOf(e.start) / 60) === hour);
            html += `<div class="day-hour">${fmtTime(time)}</div><div class="day-slot" data-date="${ymd(date)}" data-time="${time}">${events.map(e => this.dayEvent(e)).join('')}</div>`;
        }
        html += '</div>';
        this.stage(html);
    }

    renderAgenda() {
        const start = new Date(this.cursor);
        const end = addDays(start, 30);
        this.setTitle(`${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
        const events = this.occurrencesBetween(start, end);
        let current = '';
        let html = '';
        for (const event of events) {
            if (event.occurrenceDate !== current) {
                current = event.occurrenceDate;
                html += `<div class="agenda-group"><div class="agenda-date">${parseLocalDate(current).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>`;
            }
            html += this.listItem(event);
        }
        this.stage(html || '<p class="cal-muted">No events in this range.</p>');
    }

    stage(html) {
        const stage = document.getElementById('calendar-stage');
        stage.innerHTML = html;
        stage.querySelectorAll('[data-date]').forEach(cell => cell.addEventListener('click', e => {
            if (e.target.closest('[data-open-event]')) return;
            const date = parseLocalDate(cell.dataset.date);
            const time = cell.dataset.time || '09:00';
            if (this.view === 'month') {
                this.cursor = date;
                this.selected = date;
                this.view = 'day';
                document.querySelectorAll('.cal-view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === 'day'));
                this.render();
            } else {
                this.openModal(null, date, time);
            }
        }));
        stage.querySelectorAll('[data-open-event]').forEach(btn => btn.addEventListener('click', e => {
            e.stopPropagation();
            this.openModal(btn.dataset.openEvent.split('::')[0]);
        }));
    }

    eventChip(event) {
        const c = CALENDARS[event.calendar] || CALENDARS.other;
        return `<button class="event-chip" data-open-event="${event.occurrenceId}" style="color:${c.color}; background:${c.color}22;" title="${escapeHtml(event.title)}">${event.repeat !== 'none' ? '↻ ' : ''}${fmtTime(event.start)} ${escapeHtml(event.title)}</button>`;
    }

    weekEvent(event) {
        const c = CALENDARS[event.calendar] || CALENDARS.other;
        return `<button class="week-event" data-open-event="${event.occurrenceId}" style="background:${c.color};">${event.repeat !== 'none' ? '↻ ' : ''}${escapeHtml(event.title)}</button>`;
    }

    dayEvent(event) {
        const c = CALENDARS[event.calendar] || CALENDARS.other;
        return `<div class="day-event" data-open-event="${event.occurrenceId}" style="color:${c.color}; background:${c.color}18;">
            <strong>${escapeHtml(event.title)}</strong><br>
            <span class="cal-muted">${fmtTime(event.start)}–${fmtTime(event.end)} • ${c.label}${event.repeat !== 'none' ? ' • repeats ' + event.repeat : ''}</span>
            ${event.location ? `<br><span>${escapeHtml(event.location)}</span>` : ''}
        </div>`;
    }

    listItem(event) {
        const c = CALENDARS[event.calendar] || CALENDARS.other;
        return `<div class="cal-list-item" data-open-event="${event.occurrenceId}" style="border-left-color:${c.color};">
            <div class="cal-list-time">${parseLocalDate(event.occurrenceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${fmtTime(event.start)}–${fmtTime(event.end)}${event.repeat !== 'none' ? ' • ↻ ' + event.repeat : ''}</div>
            <div class="cal-list-title">${escapeHtml(event.title)}</div>
            ${event.location ? `<div class="cal-muted">${escapeHtml(event.location)}</div>` : ''}
        </div>`;
    }

    openModal(id = null, date = this.selected, time = '09:00') {
        this.previousFocus = document.activeElement;
        this.editingId = id;
        const modal = document.getElementById('event-modal');
        const form = document.getElementById('event-form');
        form.reset();
        document.getElementById('delete-event-btn').style.display = id ? 'inline-block' : 'none';
        document.getElementById('modal-title').textContent = id ? 'Edit Event' : 'Create Event';

        const event = id ? this.events.find(e => e.id === id) : null;
        document.getElementById('event-id').value = event?.id || '';
        document.getElementById('event-title').value = event?.title || '';
        document.getElementById('event-date').value = event?.date || ymd(date);
        document.getElementById('event-start').value = event?.start || time;
        document.getElementById('event-end').value = event?.end || this.deriveEnd(time, '1 hour');
        document.getElementById('event-duration').value = this.inferDurationPreset(
            document.getElementById('event-start').value,
            document.getElementById('event-end').value
        );
        document.getElementById('event-calendar').value = event?.calendar || 'other';
        document.getElementById('event-repeat').value = event?.repeat || 'none';
        document.getElementById('event-reminder').value = event?.reminder || 'none';
        document.getElementById('event-location').value = event?.location || '';
        document.getElementById('event-notes').value = event?.notes || '';
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        this.updateDurationSummary();
        setTimeout(() => document.getElementById('event-title').focus(), 50);
    }

    closeModal() {
        document.getElementById('event-modal').classList.remove('active');
        document.getElementById('event-modal').setAttribute('aria-hidden', 'true');
        this.editingId = null;
        if (this.previousFocus?.isConnected) this.previousFocus.focus();
        this.previousFocus = null;
    }

    async saveEvent(e) {
        e.preventDefault();
        const event = {
            id: this.editingId || crypto.randomUUID(),
            title: document.getElementById('event-title').value.trim(),
            date: document.getElementById('event-date').value,
            start: document.getElementById('event-start').value,
            end: document.getElementById('event-end').value,
            calendar: document.getElementById('event-calendar').value,
            repeat: document.getElementById('event-repeat').value,
            reminder: document.getElementById('event-reminder').value,
            location: document.getElementById('event-location').value.trim(),
            notes: document.getElementById('event-notes').value.trim(),
            updatedAt: new Date().toISOString()
        };
        if (minutesOf(event.end) <= minutesOf(event.start)) {
            alert('End time needs to be after start time.');
            return;
        }
        if (this.editingId) {
            this.events = this.events.map(item => item.id === this.editingId ? event : item);
        } else {
            this.events.push(event);
        }
        this.saveAll();
        await this.syncSavedEvent(event);
        this.closeModal();
        this.render();
    }

    async deleteEvent() {
        if (!this.editingId) return;
        if (!confirm('Delete this event?')) return;
        const deletedId = this.editingId;
        this.events = this.events.filter(event => event.id !== deletedId);
        this.saveAll();
        await this.syncDeletedEvent(deletedId);
        this.closeModal();
        this.render();
    }

    exportEvents() {
        const blob = new Blob([JSON.stringify(this.events, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `the-nest-calendar-${ymd(new Date())}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    async importEvents(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const imported = JSON.parse(await file.text());
            if (!Array.isArray(imported)) throw new Error('Expected an array of events.');
            const cleaned = imported.filter(item => item.title && item.date && item.start && item.end).map(item => ({
                id: item.id || crypto.randomUUID(),
                title: item.title,
                date: item.date,
                start: item.start,
                end: item.end,
                calendar: CALENDARS[item.calendar] ? item.calendar : 'other',
                repeat: item.repeat || 'none',
                reminder: item.reminder || 'none',
                location: item.location || '',
                notes: item.notes || '',
                updatedAt: item.updatedAt || item.updated_at || new Date().toISOString()
            }));
            this.events = cleaned;
            this.saveAll();
            if (this.sync?.enabled) await this.sync.replaceEvents(this.events);
            this.render();
            alert(`Imported ${cleaned.length} events.`);
        } catch (err) {
            alert(`Could not import calendar: ${err.message}`);
        } finally {
            e.target.value = '';
        }
    }
}

window.nestCalendar = new NestCalendar();
window.nestCalendar.init();
