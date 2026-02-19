// Dashboard-specific JavaScript
// Separate from lock screen logic

const CONFIG = {
    DB_NAME: 'nest_db',
    DB_VERSION: 2
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
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadChecklist();
        await this.loadTimeLogs();
        this.loadProgress();
        this.loadSchedule();
        this.loadCalendar();
        this.loadRandomFact();
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

        // Fact rotator
        document.getElementById('new-fact-btn').addEventListener('click', () => this.loadRandomFact());

        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
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

        const totals = { quals: 0, dissertation: 0, reports: 0, class: 0 };

        logs.forEach(log => {
            if (totals[log.category] !== undefined) {
                totals[log.category] += log.minutes;
            }
        });

        document.getElementById('quals-time').textContent = this.formatTime(totals.quals);
        document.getElementById('dissertation-time').textContent = this.formatTime(totals.dissertation);
        document.getElementById('reports-time').textContent = this.formatTime(totals.reports);
        document.getElementById('class-time').textContent = this.formatTime(totals.class);

        const total = totals.quals + totals.dissertation + totals.reports + totals.class;
        document.getElementById('total-time').textContent = this.formatTime(total);
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    async loadProgress() {
        const qualsProgress = await this.db.getProgress('quals') || { value: 0 };
        const dissProgress = await this.db.getProgress('dissertation') || { value: 0 };
        const reportProgress = await this.db.getProgress('reports') || { value: 0 };

        document.getElementById('quals-progress').style.width = Math.min((qualsProgress.value / 300) * 100, 100) + '%';
        document.getElementById('quals-progress-text').textContent = `${Math.round((qualsProgress.value / 300) * 100)}%`;

        document.getElementById('diss-progress').style.width = Math.min((dissProgress.value / 20) * 100, 100) + '%';
        document.getElementById('diss-progress-text').textContent = `${dissProgress.value}/20`;

        document.getElementById('report-progress').style.width = Math.min((reportProgress.value / 21) * 100, 100) + '%';
        document.getElementById('report-progress-text').textContent = `${reportProgress.value}/21`;
    }

    loadSchedule() {
        const schedule = [
            { time: '6:30am', task: 'Wake up, breakfast' },
            { time: '6:45am', task: '15 min Mindfulness' },
            { time: '9:00am', task: 'Dissertation Meeting' },
            { time: '10:00am', task: 'Class begins' },
            { time: '8:30pm', task: 'Report Writing (2 hrs)' },
            { time: '11:00pm', task: 'Sleep' }
        ];

        const container = document.getElementById('today-schedule');
        container.innerHTML = schedule.map(item => `
            <div class="schedule-item">
                <span class="time">${item.time}</span>
                <span>${item.task}</span>
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

    logout() {
        window.location.href = 'index.html';
    }
}

// Initialize dashboard
const db = new NestDatabase();
db.init().then(() => {
    new Dashboard(db);
});
