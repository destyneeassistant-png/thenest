// Schedule JavaScript - Enhanced Interactive Version

// Category colors
const categoryColors = {
    class: '#ff006e',
    meeting: '#00f5ff',
    quals: '#8338ec',
    dissertation: '#39ff14',
    reports: '#ffbe0b',
    wellness: '#fb5607',
    other: '#a0a0b0'
};

// Category labels
const categoryLabels = {
    class: 'Class',
    meeting: 'Meeting',
    quals: 'Quals',
    dissertation: 'Dissertation',
    reports: 'Reports',
    wellness: 'Wellness',
    other: 'Other'
};

class ScheduleManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.view = 'calendar';
        this.events = this.loadEvents();
        this.editingEventId = null;
        
        // Check URL parameters
        this.urlParams = new URLSearchParams(window.location.search);
        if (this.urlParams.has('date')) {
            this.selectedDate = new Date(this.urlParams.get('date'));
            this.currentDate = new Date(this.selectedDate);
        }
    }

    init() {
        this.setupEventListeners();
        this.renderCalendar();
        this.renderDayEvents();
        this.renderUpcomingList();
        
        // Open add modal if requested via URL
        if (this.urlParams.get('add') === 'true') {
            setTimeout(() => this.openAddModal(), 100);
        }
    }

    // LocalStorage persistence
    loadEvents() {
        const saved = localStorage.getItem('nest_events');
        if (saved) {
            const events = JSON.parse(saved);
            // Convert date strings back to Date objects
            return events.map(e => ({
                ...e,
                date: new Date(e.date)
            }));
        }
        // Default sample events if none saved
        return [
            { id: 1, title: 'Morning Mindfulness', time: '06:45', duration: '15 min', category: 'wellness', date: new Date() },
            { id: 2, title: 'Dissertation Meeting', time: '09:00', duration: '1 hour', category: 'meeting', date: new Date() },
            { id: 3, title: 'Cognitive Development Class', time: '10:00', duration: '3 hours', category: 'class', date: new Date() },
            { id: 4, title: 'Quals Study Session', time: '14:00', duration: '2 hours', category: 'quals', date: new Date() },
            { id: 5, title: 'Report Writing', time: '20:30', duration: '2 hours', category: 'reports', date: new Date() }
        ];
    }

    saveEvents() {
        localStorage.setItem('nest_events', JSON.stringify(this.events));
    }

    setupEventListeners() {
        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });

        // Month navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // Modal controls
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('event-form').addEventListener('submit', (e) => this.saveEvent(e));
        document.getElementById('delete-event').addEventListener('click', () => this.deleteEvent());

        // Close modal on background click
        document.getElementById('event-modal').addEventListener('click', (e) => {
            if (e.target.id === 'event-modal') this.closeModal();
        });
    }

    switchView(view) {
        this.view = view;

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        document.getElementById('calendar-view').classList.toggle('active', view === 'calendar');
        document.getElementById('list-view').classList.toggle('active', view === 'list');
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        document.getElementById('month-title').textContent = new Date(year, month)
            .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const today = new Date();
        const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

        let html = '';

        // Day headers
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            html += `<div class="calendar-header-cell">${day}</div>`;
        });

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            html += `<div class="calendar-day other-month" data-day="${day}" data-month="${month - 1}"><div class="day-number">${day}</div></div>`;
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = isCurrentMonth && day === today.getDate();
            const isSelected = this.selectedDate.getDate() === day && 
                              this.selectedDate.getMonth() === month &&
                              this.selectedDate.getFullYear() === year;

            // Get events for this day
            const dayEvents = this.getEventsForDay(day, month, year);
            const hasEvents = dayEvents.length > 0;

            let classes = ['calendar-day'];
            if (isToday) classes.push('today');
            if (isSelected) classes.push('selected');
            if (hasEvents) classes.push('has-events');

            let eventsHtml = '';
            if (dayEvents.length > 0) {
                eventsHtml = '<div class="day-events">';
                dayEvents.slice(0, 3).forEach(event => {
                    eventsHtml += `<div class="day-event" style="background: ${categoryColors[event.category]}20; color: ${categoryColors[event.category]}; border-left: 2px solid ${categoryColors[event.category]};" data-event-id="${event.id}">${event.title}</div>`;
                });
                if (dayEvents.length > 3) {
                    eventsHtml += `<div class="day-event" style="color: var(--text-muted);">+${dayEvents.length - 3} more</div>`;
                }
                eventsHtml += '</div>';
            }

            html += `<div class="${classes.join(' ')}" data-day="${day}" data-month="${month}" data-year="${year}" onclick="window.handleDayClick(this, event)">
                <div class="day-number">${day}</div>
                ${eventsHtml}
            </div>`;
        }

        // Next month days
        const totalCells = firstDay + daysInMonth;
        const remainingCells = 42 - totalCells;
        for (let day = 1; day <= remainingCells; day++) {
            html += `<div class="calendar-day other-month" data-day="${day}" data-month="${month + 1}" data-year="${year}"><div class="day-number">${day}</div></div>`;
        }

        document.getElementById('calendar-grid').innerHTML = html;
    }

    getEventsForDay(day, month, year) {
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === day &&
                   eventDate.getMonth() === month &&
                   eventDate.getFullYear() === year;
        }).sort((a, b) => a.time.localeCompare(b.time));
    }

    renderDayEvents() {
        const dayEvents = this.getEventsForDay(
            this.selectedDate.getDate(),
            this.selectedDate.getMonth(),
            this.selectedDate.getFullYear()
        );

        document.getElementById('selected-date').textContent = this.selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });

        const container = document.getElementById('day-events');

        if (dayEvents.length === 0) {
            container.innerHTML = `
                <div class="empty-events">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">[Empty]</div>
                    <p>No events for this day</p>
                    <button class="action-btn" style="margin-top: 1rem;" onclick="scheduleManager.openAddModal()">[+] Add Event</button>
                </div>
            `;
            return;
        }

        container.innerHTML = dayEvents.map(event => `
            <div class="event-card" data-event-id="${event.id}" style="border-left: 4px solid ${categoryColors[event.category]}">
                <div class="event-time">${this.formatTime(event.time)}</div>
                <div class="event-details">
                    <div class="event-title">${event.title}</div>
                    <div class="event-desc">${event.duration} • ${categoryLabels[event.category]}</div>
                </div>
                <button class="event-edit-btn" onclick="scheduleManager.openEditModal(${event.id}); event.stopPropagation();">[Edit]</button>
            </div>
        `).join('');

        // Add click handlers to event cards
        container.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('click', () => {
                const eventId = parseInt(card.dataset.eventId);
                this.openEditModal(eventId);
            });
        });
    }

    renderUpcomingList() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get events from today onwards, sorted by date
        const upcoming = this.events
            .filter(event => new Date(event.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date) || a.time.localeCompare(b.time))
            .slice(0, 20); // Limit to 20 events

        const container = document.getElementById('upcoming-list');

        if (upcoming.length === 0) {
            container.innerHTML = `
                <div class="empty-events">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">[Empty]</div>
                    <p>No upcoming events</p>
                </div>
            `;
            return;
        }

        // Group by date
        let currentDate = null;
        let html = '';

        upcoming.forEach(event => {
            const eventDate = new Date(event.date);
            const dateStr = eventDate.toDateString();

            if (dateStr !== currentDate) {
                if (currentDate !== null) html += '</div>';
                const isToday = eventDate.toDateString() === new Date().toDateString();
                html += `
                    <div class="date-group">
                        <div class="date-header">${isToday ? 'Today' : eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                `;
                currentDate = dateStr;
            }

            html += `
                <div class="event-card" data-event-id="${event.id}" style="border-left: 4px solid ${categoryColors[event.category]}">
                    <div class="event-time">${this.formatTime(event.time)}</div>
                    <div class="event-details">
                        <div class="event-title">${event.title}</div>
                        <div class="event-desc">${event.duration} • ${categoryLabels[event.category]}</div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Add click handlers
        container.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('click', () => {
                const eventId = parseInt(card.dataset.eventId);
                this.openEditModal(eventId);
            });
        });
    }

    formatTime(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    // Modal functions
    openAddModal() {
        console.log('openAddModal called');
        this.editingEventId = null;
        
        const modal = document.getElementById('event-modal');
        if (!modal) {
            console.error('Modal not found!');
            return;
        }
        
        document.getElementById('modal-title').textContent = '[Add] Event';
        document.getElementById('delete-event').style.display = 'none';
        
        // Set default date to selected date
        const dateStr = this.selectedDate.toISOString().split('T')[0];
        document.getElementById('event-date').value = dateStr;
        document.getElementById('event-time').value = '09:00';
        document.getElementById('event-title').value = '';
        document.getElementById('event-duration').value = '1 hour';
        document.getElementById('event-category').value = 'other';
        
        modal.classList.add('active');
        console.log('Modal opened');
    }

    openEditModal(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        this.editingEventId = eventId;
        document.getElementById('modal-title').textContent = '[Edit] Event';
        document.getElementById('delete-event').style.display = 'block';

        document.getElementById('event-id').value = eventId;
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-date').value = new Date(event.date).toISOString().split('T')[0];
        document.getElementById('event-time').value = event.time;
        document.getElementById('event-duration').value = event.duration;
        document.getElementById('event-category').value = event.category;

        document.getElementById('event-modal').classList.add('active');
    }

    closeModal() {
        document.getElementById('event-modal').classList.remove('active');
        this.editingEventId = null;
    }

    saveEvent(e) {
        e.preventDefault();

        const title = document.getElementById('event-title').value;
        const dateStr = document.getElementById('event-date').value;
        const time = document.getElementById('event-time').value;
        const duration = document.getElementById('event-duration').value;
        const category = document.getElementById('event-category').value;

        const eventData = {
            title,
            date: new Date(dateStr),
            time,
            duration,
            category
        };

        if (this.editingEventId) {
            // Update existing
            const index = this.events.findIndex(e => e.id === this.editingEventId);
            if (index !== -1) {
                this.events[index] = { ...this.events[index], ...eventData };
            }
        } else {
            // Create new
            const newId = Math.max(...this.events.map(e => e.id), 0) + 1;
            this.events.push({ id: newId, ...eventData });
        }

        this.saveEvents();
        this.closeModal();
        this.renderCalendar();
        this.renderDayEvents();
        this.renderUpcomingList();
    }

    deleteEvent() {
        if (!this.editingEventId) return;

        if (confirm('Delete this event?')) {
            this.events = this.events.filter(e => e.id !== this.editingEventId);
            this.saveEvents();
            this.closeModal();
            this.renderCalendar();
            this.renderDayEvents();
            this.renderUpcomingList();
        }
    }
}

// Global click handler for inline onclick
window.handleDayClick = function(dayEl, e) {
    const day = parseInt(dayEl.dataset.day);
    const month = parseInt(dayEl.dataset.month);
    const year = parseInt(dayEl.dataset.year);
    
    scheduleManager.selectedDate = new Date(year, month, day);
    scheduleManager.renderCalendar();
    scheduleManager.renderDayEvents();

    const eventEl = e.target.closest('.day-event[data-event-id]');
    if (eventEl) {
        const eventId = parseInt(eventEl.dataset.eventId);
        scheduleManager.openEditModal(eventId);
    } else if (!dayEl.classList.contains('other-month')) {
        scheduleManager.openAddModal();
    }
};

// Initialize
const scheduleManager = new ScheduleManager();
scheduleManager.init();
