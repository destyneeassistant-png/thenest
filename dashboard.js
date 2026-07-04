// Dashboard-specific JavaScript
// Separate from lock screen logic

const CONFIG = {
    DB_NAME: 'nest_db',
    DB_VERSION: 2
};

const WEEK_OVERRIDE = {
    startDate: '2026-04-06',
    endDate: '2026-04-11',
    dissertation: {
        currentPage: 27,
        targetPage: 40,
        weeklyHourGoal: 10
    },
    weekPlan: [
        {
            date: '2026-04-06',
            dayName: 'Monday',
            agenda: [
                { time: '6:30-7:15am', task: 'Moto + meditation' },
                { time: '7:15-9:15am', task: 'Dissertation Chapter 1 (2h)' },
                { time: '9:15-10:15am', task: 'Buffer / get ready / admin' },
                { time: '10:30-11:00am', task: 'Meeting' },
                { time: '11:00am-5:30pm', task: 'Practicum' },
                { time: 'Evening', task: 'Homework after getting home' }
            ],
            summary: 'Heavy day. Protect the morning dissertation block and do homework at night.'
        },
        {
            date: '2026-04-07',
            dayName: 'Tuesday',
            agenda: [
                { time: '6:30-7:15am', task: 'Moto + meditation' },
                { time: '7:15-8:45am', task: 'Dissertation (1.5h minimum)' },
                { time: '8:45-11:30am', task: 'Homework / prep before class' },
                { time: '12:30-6:30pm', task: 'Class' },
                { time: 'Evening', task: 'Homework' },
                { time: 'Optional', task: 'Light yoga if energy allows' }
            ],
            summary: 'Class day. Keep expectations realistic but still get the dissertation block done.'
        },
        {
            date: '2026-04-08',
            dayName: 'Wednesday',
            agenda: [
                { time: '6:30-7:15am', task: 'Moto + meditation' },
                { time: '7:15-8:45am', task: 'Dissertation (1.5h)' },
                { time: '9:30-10:30am', task: 'Supervision' },
                { time: '10:30am-5:00pm', task: 'Practicum' },
                { time: 'Evening', task: 'Homework' },
                { time: 'Optional', task: 'Short yoga session' }
            ],
            summary: 'Another full day. Morning writing matters because the rest gets swallowed.'
        },
        {
            date: '2026-04-09',
            dayName: 'Thursday',
            agenda: [
                { time: '6:30-7:15am', task: 'Moto + meditation' },
                { time: '7:15-9:30am', task: 'Dissertation block' },
                { time: '10:00-11:00am', task: 'Therapy' },
                { time: '11:30am-12:30pm', task: 'Practicum' },
                { time: 'Afternoon', task: 'Coffee shop homework / dissertation session' },
                { time: 'Goal', task: 'Reach 3-4 dissertation hours total' },
                { time: 'Movement', task: 'Gym or yoga' }
            ],
            summary: 'This is the big push day. Don\'t waste it.'
        },
        {
            date: '2026-04-10',
            dayName: 'Friday',
            agenda: [
                { time: '12:00-8:00am', task: 'Work shift (from home)' },
                { time: 'After shift', task: 'Recovery sleep block' },
                { time: 'Later', task: 'Practicum tasks or dissertation completion/review' },
                { time: 'Movement', task: 'Gentle yoga only if energy is okay' }
            ],
            summary: 'Recovery-adjusted day. Because you work from home, schoolwork may be possible during slow periods.'
        },
        {
            date: '2026-04-11',
            dayName: 'Saturday',
            agenda: [
                { time: '6:30-7:15am', task: 'Moto + meditation' },
                { time: 'Main priority', task: 'Report writing' },
                { time: 'Secondary', task: 'Catch-up from dissertation / practicum if needed' },
                { time: 'Movement', task: 'Gym or yoga if weekly goal still needs a third session' }
            ],
            summary: 'Report-writing day with cleanup space.'
        }
    ]
};

// Database class (shared with main app)
class NestDatabase {
    constructor() {
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('checklists')) {
                    db.createObjectStore('checklists', { keyPath: 'date' });
                }
                if (!db.objectStoreNames.contains('timelogs')) {
                    db.createObjectStore('timelogs', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('progress')) {
                    db.createObjectStore('progress', { keyPath: 'category' });
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('quiz_scores')) {
                    db.createObjectStore('quiz_scores', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('pdf_files')) {
                    db.createObjectStore('pdf_files', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('notes')) {
                    const notesStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
                    notesStore.createIndex('date', 'date', { unique: false });
                }
                if (!db.objectStoreNames.contains('weeklyPlans')) {
                    db.createObjectStore('weeklyPlans', { keyPath: 'weekKey' });
                }
            };
        });
    }

    async saveChecklist(date, items) {
        return this.put('checklists', { date, items, updated: new Date().toISOString() });
    }

    async getChecklist(date) {
        return this.get('checklists', date);
    }

    async addTimeLog(category, minutes) {
        const log = {
            category,
            minutes,
            date: new Date().toDateString(),
            timestamp: new Date().toISOString()
        };
        return this.put('timelogs', log);
    }

    async getTimeLogs(date) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['timelogs'], 'readonly');
            const store = transaction.objectStore('timelogs');
            const request = store.getAll();

            request.onsuccess = () => {
                const logs = request.result.filter(log => log.date === date);
                resolve(logs);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveProgress(category, value) {
        return this.put('progress', { category, value, updated: new Date().toISOString() });
    }

    async getProgress(category) {
        return this.get('progress', category);
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

// Dashboard class
class Dashboard {
    constructor(db) {
        this.db = db;
        this.currentDate = new Date();
        this.psychFacts = [
            { text: "Emerging adulthood (ages 18-25) is a distinct developmental period characterized by identity exploration, instability, self-focus, feeling in-between, and possibilities.", source: "Arnett, 2000" },
            { text: "The prefrontal cortex continues developing until age 25, explaining why emerging adults may struggle with impulse control and long-term planning.", source: "Neuroscience Research" },
            { text: "Recidivism rates for juvenile offenders can reach 85% within 5 years without intervention.", source: "Mowen et al." },
            { text: "Cognitive Behavioral Therapy (CBT) reduces recidivism by addressing maladaptive thought patterns.", source: "Meta-analysis, 2010" },
            { text: "The Risk-Need-Responsivity (RNR) model is the dominant treatment paradigm in North American corrections.", source: "Andrews & Bonta" },
            { text: "Trauma-informed care is essential for justice-involved emerging adults who average 3 ACEs prior to first arrest.", source: "ACE Study" },
            { text: "Desistance from crime is promoted by cognitive/identity shifts, social bonds, employment, and treatment engagement.", source: "Life-Course Criminology" },
            { text: "Schema therapy addresses maladaptive schemas like mistrust/abuse and entitlement common in offender populations.", source: "Young, 2003" }
        ];
        this.forensicsFacts = [
            { text: "Risk-Need-Responsivity links effective correctional intervention to three questions: how much service, what needs to target, and how to deliver it responsively.", source: "Andrews & Bonta" },
            { text: "Dynamic risk factors are changeable needs, such as antisocial cognition, antisocial peers, substance use, employment instability, and family conflict.", source: "Psychology of Criminal Conduct" },
            { text: "Desistance is not usually a single event; it is a process of building a non-criminal identity, social bonds, adult roles, and realistic opportunities.", source: "Maruna / Life-Course Criminology" },
            { text: "Correctional staff are part of the rehabilitation environment because everyday interactions can reinforce either prosocial behavior or institutional survival patterns.", source: "Schaefer, 2017" },
            { text: "Trauma-informed correctional practice does not remove accountability; it changes how safety, predictability, choice, and skill-building are communicated.", source: "Vaswani & Paul, 2019" },
            { text: "CBT-based correctional programs focus on the link between thoughts, emotions, decisions, behavior, and consequences.", source: "Lipsey et al., 2007" },
            { text: "Emerging adults in correctional settings may need more repetition, coaching, modeling, and concrete practice because self-regulation and future planning are still developing.", source: "Arnett, 2000" },
            { text: "Assessment alone does not reduce risk; risk information has to be translated into case planning, skill practice, and consistent follow-through.", source: "Viljoen et al., 2018" }
        ];
        this.init();
    }

    async init() {
        console.log('Dashboard init started');
        this.setupEventListeners();
        console.log('Event listeners setup');

        // Initialize and start date updater
        this.updateDateDisplay();
        this.startDateUpdater();
        console.log('Date updater started');

        // Load schedule and calendar first (don't depend on DB)
        this.loadSchedule();
        this.loadWeeklyPlan();
        console.log('Schedule loaded');
        this.loadCalendar();
        console.log('Calendar loaded');
        this.loadRandomFact();
        this.loadRandomForensicsFact();
        console.log('Facts loaded');
        
        // Then load DB-dependent items
        try {
            await this.loadChecklist();
            console.log('Checklist loaded');
        } catch(e) { console.error('Checklist error:', e); }
        
        try {
            await this.loadTimeLogs();
            console.log('Time logs loaded');
        } catch(e) { console.error('Time logs error:', e); }
        
        try {
            this.loadProgress();
            console.log('Progress loaded');
        } catch(e) { console.error('Progress error:', e); }

        // Initialize pie chart after DB is ready
        try {
            this.initPieChart();
            await this.updatePieChart();
            console.log('Pie chart loaded');
        } catch(e) { console.error('Pie chart error:', e); }
        
        console.log('Dashboard init complete');
    }

    setupEventListeners() {
        // Checklist
        document.querySelectorAll('.check-item input').forEach(cb => {
            cb.addEventListener('change', () => this.saveChecklist());
        });

        // Time logging
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.addTime(e.target.dataset.cat));
        });

        // Fact rotators
        document.getElementById('new-fact-btn').addEventListener('click', () => this.loadRandomFact());
        document.getElementById('new-forensics-fact-btn').addEventListener('click', () => this.loadRandomForensicsFact());

        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));
    }

    updateDateDisplay() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = now.toLocaleDateString('en-US', options);

        const dateElement = document.getElementById('header-date');
        if (dateElement) {
            dateElement.textContent = dateString;
        }
    }

    startDateUpdater() {
        // Update immediately and then check every minute for date changes
        this.updateDateDisplay();

        // Update at midnight to handle date changes
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow - now;

        // Set timeout for midnight, then interval every 24 hours
        setTimeout(() => {
            this.updateDateDisplay();
            setInterval(() => this.updateDateDisplay(), 24 * 60 * 60 * 1000);
        }, msUntilMidnight);

        // Also update every minute to catch any display issues
        setInterval(() => this.updateDateDisplay(), 60000);
    }

    async loadChecklist() {
        const today = new Date().toDateString();
        const saved = await this.db.getChecklist(today);

        if (saved && saved.items) {
            saved.items.forEach(item => {
                const cb = document.querySelector(`input[data-task="${item.task}"]`);
                if (cb) cb.checked = item.checked;
            });
        }

        this.updateChecklistProgress();
    }

    async saveChecklist() {
        const today = new Date().toDateString();
        const items = Array.from(document.querySelectorAll('.check-item input')).map(cb => ({
            task: cb.dataset.task,
            checked: cb.checked
        }));

        await this.db.saveChecklist(today, items);
        this.updateChecklistProgress();
    }

    updateChecklistProgress() {
        const checkboxes = document.querySelectorAll('.check-item input');
        const checked = document.querySelectorAll('.check-item input:checked');
        const percent = Math.round((checked.length / checkboxes.length) * 100);

        document.getElementById('checklist-progress-bar').querySelector('.progress-fill').style.width = percent + '%';
        document.getElementById('checklist-progress-text').textContent = `${checked.length}/${checkboxes.length}`;
    }

    async addTime(category) {
        await this.db.addTimeLog(category, 15);
        await this.loadTimeLogs();
    }

    async loadTimeLogs() {
        const today = new Date().toDateString();
        const logs = await this.db.getTimeLogs(today);

        const totals = { dissertation: 0, homework: 0, reports: 0, class: 0 };

        logs.forEach(log => {
            if (totals[log.category] !== undefined) {
                totals[log.category] += log.minutes;
            }
        });

        document.getElementById('dissertation-time').textContent = this.formatTime(totals.dissertation);
        document.getElementById('homework-time').textContent = this.formatTime(totals.homework);
        document.getElementById('reports-time').textContent = this.formatTime(totals.reports);
        document.getElementById('class-time').textContent = this.formatTime(totals.class);

        const total = totals.dissertation + totals.homework + totals.reports + totals.class;
        document.getElementById('total-time').textContent = this.formatTime(total);
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    async loadProgress() {
        const dissProgress = await this.db.getProgress('dissertation') || { value: WEEK_OVERRIDE.dissertation.currentPage };
        const dissertationHours = await this.db.getProgress('dissertationHours') || { value: 0 };
        const movementProgress = await this.db.getProgress('movement') || { value: 0 };

        document.getElementById('diss-progress').style.width = Math.min((dissProgress.value / WEEK_OVERRIDE.dissertation.targetPage) * 100, 100) + '%';
        document.getElementById('diss-progress-text').textContent = `${dissProgress.value}/${WEEK_OVERRIDE.dissertation.targetPage}`;

        document.getElementById('dissertation-hours-progress').style.width = Math.min((dissertationHours.value / WEEK_OVERRIDE.dissertation.weeklyHourGoal) * 100, 100) + '%';
        document.getElementById('dissertation-hours-text').textContent = `${dissertationHours.value}/${WEEK_OVERRIDE.dissertation.weeklyHourGoal}h`;

        document.getElementById('movement-progress').style.width = Math.min((movementProgress.value / 3) * 100, 100) + '%';
        document.getElementById('movement-progress-text').textContent = `${movementProgress.value}/3`;

        // Update pie chart with latest progress data
        this.updatePieChart();
    }

    initPieChart() {
        const ctx = document.getElementById('progress-piechart');
        if (!ctx) return;

        // Cyberpunk theme colors
        const colors = {
            quals: '#00f5ff',      // neon blue
            dissertation: '#ff006e', // neon pink
            reports: '#39ff14',    // neon green
            remaining: '#2a2a3e'   // border color (dark)
        };

        this.pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Dissertation Pages', 'Dissertation Hours', 'Movement', 'Remaining'],
                datasets: [{
                    data: [0, 0, 0, 100],
                    backgroundColor: [colors.dissertation, colors.quals, colors.reports, colors.remaining],
                    borderColor: '#0a0a0f',
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: false // Custom legend below
                    },
                    tooltip: {
                        backgroundColor: '#12121a',
                        titleColor: '#ffffff',
                        bodyColor: '#a0a0b0',
                        borderColor: '#2a2a3e',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                if (label === 'Dissertation Pages') return ` ${label}: ${value.toFixed(1)}% (of ${WEEK_OVERRIDE.dissertation.targetPage} pages)`;
                                if (label === 'Dissertation Hours') return ` ${label}: ${value.toFixed(1)}% (of ${WEEK_OVERRIDE.dissertation.weeklyHourGoal}h)`;
                                if (label === 'Movement') return ` ${label}: ${value.toFixed(1)}% (of 3 sessions)`;
                                return ` ${label}: ${value.toFixed(1)}%`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 800
                }
            }
        });
    }

    async updatePieChart() {
        if (!this.pieChart) return;

        // Get progress data from database
        const dissProgress = await this.db.getProgress('dissertation') || { value: WEEK_OVERRIDE.dissertation.currentPage };
        const dissertationHours = await this.db.getProgress('dissertationHours') || { value: 0 };
        const movementProgress = await this.db.getProgress('movement') || { value: 0 };

        // Calculate percentages based on goals
        const dissPercent = Math.min((dissProgress.value / WEEK_OVERRIDE.dissertation.targetPage) * 100, 100);
        const hoursPercent = Math.min((dissertationHours.value / WEEK_OVERRIDE.dissertation.weeklyHourGoal) * 100, 100);
        const movementPercent = Math.min((movementProgress.value / 3) * 100, 100);

        // Calculate remaining (to make chart look complete)
        const totalPercent = dissPercent + hoursPercent + movementPercent;
        const remainingPercent = Math.max(0, 100 - (totalPercent / 3));

        // Update chart data
        this.pieChart.data.datasets[0].data = [dissPercent, hoursPercent, movementPercent, remainingPercent];
        this.pieChart.update();

        // Update custom legend
        const legendContainer = document.getElementById('piechart-legend');
        if (legendContainer) {
            const colors = {
                hours: '#00f5ff',
                dissertation: '#ff006e',
                movement: '#39ff14'
            };

            legendContainer.innerHTML = `
                <div class="piechart-legend-item">
                    <span class="piechart-legend-color" style="background: ${colors.dissertation}"></span>
                    <span class="piechart-legend-label">Dissertation pages:</span>
                    <span class="piechart-legend-value">${dissProgress.value}/${WEEK_OVERRIDE.dissertation.targetPage}</span>
                </div>
                <div class="piechart-legend-item">
                    <span class="piechart-legend-color" style="background: ${colors.hours}"></span>
                    <span class="piechart-legend-label">Dissertation hours:</span>
                    <span class="piechart-legend-value">${dissertationHours.value}/${WEEK_OVERRIDE.dissertation.weeklyHourGoal}h</span>
                </div>
                <div class="piechart-legend-item">
                    <span class="piechart-legend-color" style="background: ${colors.movement}"></span>
                    <span class="piechart-legend-label">Movement:</span>
                    <span class="piechart-legend-value">${movementProgress.value}/3</span>
                </div>
            `;
        }
    }

    loadSchedule() {
        const today = new Date().toISOString().slice(0, 10);
        const todayPlan = WEEK_OVERRIDE.weekPlan.find(day => day.date === today);
        const container = document.getElementById('today-schedule');

        if (todayPlan) {
            container.innerHTML = `
                <div class="schedule-summary">${todayPlan.summary}</div>
                ${todayPlan.agenda.map(item => `
                    <div class="schedule-item">
                        <span class="time">${item.time}</span>
                        <span>${item.task}</span>
                    </div>
                `).join('')}
            `;
        } else {
            container.innerHTML = '<p class="no-events">No custom agenda loaded for today yet.</p>';
        }
    }

    loadWeeklyPlan() {
        const container = document.getElementById('weekly-plan');
        if (!container) return;

        container.innerHTML = WEEK_OVERRIDE.weekPlan.map(day => `
            <div class="weekly-day-card">
                <div class="weekly-day-header">
                    <strong>${day.dayName}</strong>
                    <span>${day.date}</span>
                </div>
                <div class="weekly-day-summary">${day.summary}</div>
                <ul class="weekly-day-list">
                    ${day.agenda.map(item => `<li><span class="weekly-time">${item.time}</span> ${item.task}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    }

    loadCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        document.getElementById('calendar-month').textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date().getDate();
        const currentMonth = new Date().getMonth();

        let html = '';

        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            html += `<div style="color: var(--text-muted); font-size: 0.8rem;">${day}</div>`;
        });

        for (let i = 0; i < firstDay; i++) {
            html += '<div></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === today && month === currentMonth;
            const hasEvent = [19, 20, 26].includes(day);
            const classes = ['calendar-day'];
            if (isToday) classes.push('today');
            if (hasEvent) classes.push('has-event');

            // Create date string for URL
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            html += `<div class="${classes.join(' ')}" onclick="window.location.href='schedule.html?date=${dateStr}&add=true'" title="Click to add event">${day}</div>`;
        }

        document.getElementById('calendar-grid').innerHTML = html;
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.loadCalendar();
    }

    loadRandomFact() {
        const fact = this.psychFacts[Math.floor(Math.random() * this.psychFacts.length)];
        document.querySelector('#psych-fact .fact-text').textContent = `"${fact.text}"`;
        document.querySelector('#psych-fact .fact-source').textContent = `— ${fact.source}`;
    }

    loadRandomForensicsFact() {
        const fact = this.forensicsFacts[Math.floor(Math.random() * this.forensicsFacts.length)];
        document.querySelector('#forensics-fact .fact-text').textContent = `"${fact.text}"`;
        document.querySelector('#forensics-fact .fact-source').textContent = `— ${fact.source}`;
    }

    logout() {
        window.location.href = 'index.html';
    }
}

// Initialize dashboard after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const db = new NestDatabase();
    db.init().then(() => {
        const dashboard = new Dashboard(db);
        window.dashboard = dashboard; // Make accessible for API updates
        
        // Initialize Sonya API integration
        if (window.NestAPI) {
            const api = new NestAPI(db);
            api.init();
        }
    });
});
