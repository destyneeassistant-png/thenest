// Schedule JavaScript - Enhanced with Recurring Weekly Schedule & Multi-View

// Category colors
const categoryColors = {
    class: '#ff006e',
    meeting: '#00f5ff',
    quals: '#8338ec',
    dissertation: '#39ff14',
    reports: '#ffbe0b',
    wellness: '#fb5607',
    supervision: '#ff9f1c',
    client: '#2ec4b6',
    study: '#e71d36',
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
    supervision: 'Supervision',
    client: 'Client Session',
    study: 'Study',
    other: 'Other'
};

// Destynee's Permanent Weekly Schedule
const weeklySchedule = {
    1: [ // Monday
        { title: 'Group Supervision', time: '12:00', duration: '1 hour', category: 'supervision', recurring: true },
        { title: 'Client Session', time: '13:00', duration: '1 hour', category: 'client', recurring: true },
        { title: 'Client Session', time: '14:00', duration: '1 hour', category: 'client', recurring: true }
    ],
    2: [ // Tuesday
        { title: 'Dissertation Meeting', time: '09:00', duration: '45 min', category: 'dissertation', recurring: true },
        { title: 'Cognitive Development Class', time: '10:00', duration: '8.5 hours', category: 'class', recurring: true }
    ],
    3: [ // Wednesday
        { title: 'Individual Supervision', time: '08:30', duration: '1 hour', category: 'supervision', recurring: true },
        { title: 'Client Session', time: '10:00', duration: '1 hour', category: 'client', recurring: true },
        { title: 'Client Session', time: '12:00', duration: '1 hour', category: 'client', recurring: true },
        { title: 'Client Session', time: '13:00', duration: '1 hour', category: 'client', recurring: true }
    ],
    4: [ // Thursday - OFF DAY
        { title: 'OFF DAY - Dissertation/Quals Focus', time: '09:00', duration: 'all day', category: 'study', recurring: true, allDay: true }
    ],
    5: [ // Friday - OFF DAY
        { title: 'OFF DAY - Dissertation/Quals Focus', time: '09:00', duration: 'all day', category: 'study', recurring: true, allDay: true }
    ],
    6: [ // Saturday - Weekend Study
        { title: 'Heavy Study Day', time: '08:00', duration: 'all day', category: 'study', recurring: true, allDay: true }
    ],
    0: [ // Sunday - Weekend Study
        { title: 'Heavy Study Day', time: '08:00', duration: 'all day', category: 'study', recurring: true, allDay: true }
    ]
};

class ScheduleManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.view = 'month'; // 'month', 'week', 'day', 'list'
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
        this.render();
        
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
                date: new Date(e.date),
                recurring: false // User-added events are one-off by default
            }));
        }
        return [];
    }

    saveEvents() {
        localStorage.setItem('nest_events', JSON.stringify(this.events));
    }

    // Get recurring events for a specific date
    getRecurringEventsForDate(date) {
        const dayOfWeek = date.getDay();
        const recurring = weeklySchedule[dayOfWeek] || [];
        
        return recurring.map((event, index) => ({
            id: `recurring-${dayOfWeek}-${index}`,
            ...event,
            date: new Date(date),
            isRecurring: true
        }));
    }

    // Get all events (recurring + one-off) for a date
    getAllEventsForDate(date) {
        const dateStr = date.toDateString();
        
        // Get one-off events for this date
        const oneOffEvents = this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === dateStr;
        });
        
        // Get recurring events for this date
        const recurringEvents = this.getRecurringEventsForDate(date);
        
        // Combine and sort by time
        return [...recurringEvents, ...oneOffEvents].sort((a, b) => {
            // All-day events go first
            if (a.allDay && !b.allDay) return -1;
            if (!a.allDay && b.allDay) return 1;
            return a.time.localeCompare(b.time);
        });
    }

    setupEventListeners() {
        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });

        // Navigation buttons
        document.getElementById('prev-period').addEventListener('click', () => this.navigatePrev());
        document.getElementById('next-period').addEventListener('click', () => this.navigateNext());
        document.getElementById('today-btn').addEventListener('click', () => this.goToToday());

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

        // Hide all views
        document.getElementById('month-view').classList.remove('active');
        document.getElementById('week-view').classList.remove('active');
        document.getElementById('day-view').classList.remove('active');
        document.getElementById('list-view').classList.remove('active');

        // Show selected view
        document.getElementById(`${view}-view`).classList.add('active');

        this.render();
    }

    navigatePrev() {
        switch(this.view) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() - 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                break;
            case 'list':
                this.currentDate.setDate(this.currentDate.getDate() - 7);
                break;
        }
        this.render();
    }

    navigateNext() {
        switch(this.view) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                break;
            case 'list':
                this.currentDate.setDate(this.currentDate.getDate() + 7);
                break;
        }
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.render();
    }

    render() {
        switch(this.view) {
            case 'month':
                this.renderMonthView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'day':
                this.renderDayView();
                break;
            case 'list':
                this.renderListView();
                break;
        }
    }

    updateTitle(title) {
        document.getElementById('calendar-title').textContent = title;
    }

    // ========== MONTH VIEW ==========
    renderMonthView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        this.updateTitle(new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));

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

            const dayDate = new Date(year, month, day);
            const dayEvents = this.getAllEventsForDate(dayDate);
            const hasEvents = dayEvents.length > 0;

            let classes = ['calendar-day'];
            if (isToday) classes.push('today');
            if (isSelected) classes.push('selected');
            if (hasEvents) classes.push('has-events');

            let eventsHtml = '';
            if (dayEvents.length > 0) {
                eventsHtml = '<div class="day-events">';
                dayEvents.slice(0, 3).forEach(event => {
                    const isRecurring = event.isRecurring || event.recurring;
                    const recurringClass = isRecurring ? 'recurring-event' : '';
                    const recurringIndicator = isRecurring ? '↻ ' : '';
                    eventsHtml += `<div class="day-event ${recurringClass}" style="background: ${categoryColors[event.category]}30; color: ${categoryColors[event.category]}; border-left: 2px solid ${categoryColors[event.category]};" data-event-id="${event.id}">${recurringIndicator}${event.title}</div>`;
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

        document.getElementById('month-grid').innerHTML = html;
    }

    // ========== WEEK VIEW ==========
    renderWeekView() {
        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const startStr = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        this.updateTitle(`${startStr} - ${endStr}`);

        let html = '';
        
        // Time column header
        html += '<div class="week-time-header"></div>';
        
        // Day headers
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            const isToday = dayDate.toDateString() === new Date().toDateString();
            const dayNum = dayDate.getDate();
            
            html += `<div class="week-day-header ${isToday ? 'today' : ''}">
                <div class="day-name">${dayNames[i]}</div>
                <div class="day-num">${dayNum}</div>
            </div>`;
        }

        // Time slots
        const timeSlots = [];
        for (let hour = 7; hour <= 21; hour++) {
            timeSlots.push(`${hour}:00`);
        }

        timeSlots.forEach(time => {
            // Time label
            html += `<div class="week-time-label">${this.formatTime(time)}</div>`;
            
            // Day columns
            for (let i = 0; i < 7; i++) {
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + i);
                const isToday = dayDate.toDateString() === new Date().toDateString();
                
                // Get events for this day
                const dayEvents = this.getAllEventsForDate(dayDate);
                const hourEvents = dayEvents.filter(e => {
                    if (e.allDay) return false;
                    const eventHour = parseInt(e.time.split(':')[0]);
                    const slotHour = parseInt(time.split(':')[0]);
                    return eventHour === slotHour;
                });

                let eventsHtml = '';
                hourEvents.forEach(event => {
                    const isRecurring = event.isRecurring || event.recurring;
                    const recurringClass = isRecurring ? 'recurring-week-event' : '';
                    const recurringIndicator = isRecurring ? '↻ ' : '';
                    eventsHtml += `<div class="week-event ${recurringClass}" style="background: ${categoryColors[event.category]};" onclick="event.stopPropagation(); scheduleManager.openEditModal('${event.id}')">${recurringIndicator}${event.title}</div>`;
                });

                html += `<div class="week-time-slot ${isToday ? 'today' : ''}" onclick="scheduleManager.selectDateAndOpenAdd('${dayDate.toISOString()}', '${time}')">${eventsHtml}</div>`;
            }
        });

        document.getElementById('week-grid').innerHTML = html;
    }

    // ========== DAY VIEW ==========
    renderDayView() {
        this.updateTitle(this.currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        }));

        const dayEvents = this.getAllEventsForDate(this.currentDate);
        const isToday = this.currentDate.toDateString() === new Date().toDateString();

        let html = '';

        // All-day events
        const allDayEvents = dayEvents.filter(e => e.allDay);
        if (allDayEvents.length > 0) {
            html += '<div class="day-all-day-section">';
            html += '<div class="day-all-day-label">All Day</div>';
            html += '<div class="day-all-day-events">';
            allDayEvents.forEach(event => {
                const isRecurring = event.isRecurring || event.recurring;
                const recurringClass = isRecurring ? 'recurring-day-event' : '';
                const recurringIndicator = isRecurring ? '<span class="recurring-badge">↻ Weekly</span>' : '';
                html += `<div class="day-all-day-event ${recurringClass}" style="background: ${categoryColors[event.category]}30; border-left: 4px solid ${categoryColors[event.category]};" onclick="scheduleManager.openEditModal('${event.id}')">
                    <span class="event-title">${event.title}</span>
                    ${recurringIndicator}
                </div>`;
            });
            html += '</div></div>';
        }

        // Time-based events
        html += '<div class="day-timeline">';
        
        const timeSlots = [];
        for (let hour = 6; hour <= 22; hour++) {
            timeSlots.push(hour);
        }

        timeSlots.forEach(hour => {
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
            const hourEvents = dayEvents.filter(e => {
                if (e.allDay) return false;
                const eventHour = parseInt(e.time.split(':')[0]);
                return eventHour === hour;
            });

            html += `<div class="day-time-row">`;
            html += `<div class="day-time-label">${this.formatTime(timeStr)}</div>`;
            html += `<div class="day-time-slot ${isToday ? 'today' : ''}" onclick="scheduleManager.selectTimeAndOpenAdd('${timeStr}')">`;
            
            hourEvents.forEach(event => {
                const isRecurring = event.isRecurring || event.recurring;
                const recurringClass = isRecurring ? 'recurring-day-event' : '';
                const recurringIndicator = isRecurring ? '<span class="recurring-badge">↻ Weekly</span>' : '';
                html += `<div class="day-timeline-event ${recurringClass}" style="background: ${categoryColors[event.category]}30; border-left: 4px solid ${categoryColors[event.category]};" onclick="event.stopPropagation(); scheduleManager.openEditModal('${event.id}')">
                    <div class="timeline-event-time">${this.formatTime(event.time)}</div>
                    <div class="timeline-event-title">${event.title}</div>
                    <div class="timeline-event-meta">${event.duration} • ${categoryLabels[event.category]} ${recurringIndicator}</div>
                </div>`;
            });
            
            html += `</div></div>`;
        });

        html += '</div>';

        // Add event button
        html += `<button class="action-btn day-add-btn" onclick="scheduleManager.openAddModal()">+ Add Event</button>`;

        document.getElementById('day-container').innerHTML = html;
    }

    // ========== LIST VIEW ==========
    renderListView() {
        const startDate = new Date(this.currentDate);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
        
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 13); // 2 weeks

        const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        this.updateTitle(`${startStr} - ${endStr}`);

        let html = '';
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dayEvents = this.getAllEventsForDate(currentDate);
            const isToday = currentDate.toDateString() === new Date().toDateString();

            if (dayEvents.length > 0 || isToday) {
                const dateStr = isToday ? 'Today' : currentDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                });

                html += `<div class="date-group">`;
                html += `<div class="date-header ${isToday ? 'today' : ''}">${dateStr}</div>`;

                if (dayEvents.length === 0) {
                    html += `<div class="empty-day-message">No events scheduled</div>`;
                } else {
                    dayEvents.forEach(event => {
                        const isRecurring = event.isRecurring || event.recurring;
                        const recurringClass = isRecurring ? 'recurring-list-event' : '';
                        const recurringIndicator = isRecurring ? '<span class="recurring-badge">↻ Weekly</span>' : '';
                        const timeDisplay = event.allDay ? 'All Day' : this.formatTime(event.time);
                        
                        html += `<div class="event-card ${recurringClass}" data-event-id="${event.id}" style="border-left: 4px solid ${categoryColors[event.category]}">
                            <div class="event-time">${timeDisplay}</div>
                            <div class="event-details">
                                <div class="event-title">${event.title} ${recurringIndicator}</div>
                                <div class="event-desc">${event.duration} • ${categoryLabels[event.category]}</div>
                            </div>
                            ${!isRecurring ? `<button class="event-edit-btn" onclick="scheduleManager.openEditModal('${event.id}'); event.stopPropagation();">Edit</button>` : ''}
                        </div>`;
                    });
                }

                html += `</div>`;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (html === '') {
            html = `
                <div class="empty-events">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">[Empty]</div>
                    <p>No upcoming events in this period</p>
                </div>
            `;
        }

        document.getElementById('list-container').innerHTML = html;

        // Add click handlers to event cards
        document.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('click', () => {
                const eventId = card.dataset.eventId;
                if (!eventId.startsWith('recurring-')) {
                    this.openEditModal(eventId);
                }
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

    selectDateAndOpenAdd(dateStr, time) {
        this.selectedDate = new Date(dateStr);
        this.currentDate = new Date(dateStr);
        document.getElementById('event-time').value = time;
        this.openAddModal();
    }

    selectTimeAndOpenAdd(time) {
        document.getElementById('event-time').value = time;
        this.openAddModal();
    }

    // Modal functions
    openAddModal() {
        this.editingEventId = null;
        
        const modal = document.getElementById('event-modal');
        if (!modal) return;
        
        document.getElementById('modal-title').textContent = 'Add Event';
        document.getElementById('delete-event').style.display = 'none';
        
        // Set default date to selected/current date
        const dateStr = this.currentDate.toISOString().split('T')[0];
        document.getElementById('event-date').value = dateStr;
        document.getElementById('event-time').value = document.getElementById('event-time').value || '09:00';
        document.getElementById('event-title').value = '';
        document.getElementById('event-duration').value = '1 hour';
        document.getElementById('event-category').value = 'other';
        
        modal.classList.add('active');
    }

    openEditModal(eventId) {
        // Can't edit recurring events (they're auto-generated)
        if (String(eventId).startsWith('recurring-')) {
            alert('This is a recurring weekly event. To modify your permanent schedule, please contact your administrator.');
            return;
        }

        const event = this.events.find(e => String(e.id) === String(eventId));
        if (!event) return;

        this.editingEventId = eventId;
        document.getElementById('modal-title').textContent = 'Edit Event';
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
            category,
            recurring: false
        };

        if (this.editingEventId) {
            // Update existing
            const index = this.events.findIndex(e => String(e.id) === String(this.editingEventId));
            if (index !== -1) {
                this.events[index] = { ...this.events[index], ...eventData };
            }
        } else {
            // Create new
            const newId = Date.now().toString();
            this.events.push({ id: newId, ...eventData });
        }

        this.saveEvents();
        this.closeModal();
        this.render();
    }

    deleteEvent() {
        if (!this.editingEventId) return;

        if (confirm('Delete this event?')) {
            this.events = this.events.filter(e => String(e.id) !== String(this.editingEventId));
            this.saveEvents();
            this.closeModal();
            this.render();
        }
    }
}

// Global click handler for month view
window.handleDayClick = function(dayEl, e) {
    const day = parseInt(dayEl.dataset.day);
    const month = parseInt(dayEl.dataset.month);
    const year = parseInt(dayEl.dataset.year);
    
    scheduleManager.selectedDate = new Date(year, month, day);
    scheduleManager.currentDate = new Date(year, month, day);
    scheduleManager.render();

    const eventEl = e.target.closest('.day-event[data-event-id]');
    if (eventEl) {
        const eventId = eventEl.dataset.eventId;
        scheduleManager.openEditModal(eventId);
    } else if (!dayEl.classList.contains('other-month')) {
        scheduleManager.switchView('day');
    }
};

// Initialize
const scheduleManager = new ScheduleManager();
scheduleManager.init();
