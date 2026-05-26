// Settings JavaScript

class SettingsManager {
    constructor() {
        this.currentPin = '0315'; // Default PIN
        this.resetCode = null;
        this.resetEmail = null;
        this.dbName = 'nest_db';
        this.knownLocalStorageKeys = [
            'nest_pin',
            'nest_theme',
            'nest_events',
            'nest_calendar_events_v1',
            'nest_pending_updates',
            'nest_last_sync',
            'nest_checklists',
            'nest_timelogs',
            'nest_progress',
            'nest_notes',
            'iddCommProgress',
            'dsm5OverviewProgress'
        ];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDataStatus();
        this.loadTheme();
    }

    setupEventListeners() {
        // Theme toggle
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeTheme(e.target.dataset.theme));
        });

        // PIN reset
        document.getElementById('change-pin-btn').addEventListener('click', () => this.openPinModal());

        // Backup center
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        document.getElementById('import-file').addEventListener('change', (event) => this.importData(event));

        // Clear data
        document.getElementById('clear-data-btn').addEventListener('click', () => this.openClearDataModal());

        // Delete confirmation input
        document.getElementById('delete-confirm-input').addEventListener('input', (e) => {
            const confirmBtn = document.getElementById('confirm-clear-btn');
            confirmBtn.disabled = e.target.value !== 'DELETE';
        });

        // Close modals on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (modal.id === 'pin-reset-modal') this.closePinModal();
                    if (modal.id === 'clear-data-modal') this.closeClearDataModal();
                }
            });
        });
    }

    // Theme Management
    loadTheme() {
        const savedTheme = localStorage.getItem('nest_theme') || 'dark';
        this.applyTheme(savedTheme);

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === savedTheme);
        });
    }

    changeTheme(theme) {
        this.applyTheme(theme);
        localStorage.setItem('nest_theme', theme);

        // Update button states
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.style.setProperty('--bg-primary', '#f5f5f5');
            document.documentElement.style.setProperty('--bg-secondary', '#ffffff');
            document.documentElement.style.setProperty('--bg-tertiary', '#e8e8e8');
            document.documentElement.style.setProperty('--text-primary', '#1a1a2e');
            document.documentElement.style.setProperty('--text-secondary', '#4a4a5a');
            document.documentElement.style.setProperty('--text-muted', '#7a7a8a');
            document.documentElement.style.setProperty('--border-color', '#d0d0e0');
        } else {
            // Reset to dark theme
            document.documentElement.style.setProperty('--bg-primary', '#0a0a0f');
            document.documentElement.style.setProperty('--bg-secondary', '#12121a');
            document.documentElement.style.setProperty('--bg-tertiary', '#1a1a2e');
            document.documentElement.style.setProperty('--text-primary', '#ffffff');
            document.documentElement.style.setProperty('--text-secondary', '#a0a0b0');
            document.documentElement.style.setProperty('--text-muted', '#606070');
            document.documentElement.style.setProperty('--border-color', '#2a2a3e');
        }
    }

    // PIN Reset with Email Verification
    openPinModal() {
        document.getElementById('pin-reset-modal').classList.add('active');
        document.getElementById('pin-reset-step1').style.display = 'block';
        document.getElementById('pin-reset-step2').style.display = 'none';
        document.getElementById('pin-reset-message').textContent = '';
        document.getElementById('reset-email').value = '';
        document.getElementById('verification-code').value = '';
        document.getElementById('new-pin').value = '';
        document.getElementById('confirm-new-pin').value = '';
    }

    closePinModal() {
        document.getElementById('pin-reset-modal').classList.remove('active');
    }

    sendPinResetCode() {
        const email = document.getElementById('reset-email').value.trim();

        if (!email || !email.includes('@')) {
            this.showPinMessage('Please enter a valid email address', 'error');
            return;
        }

        // Generate 6-digit verification code
        this.resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        this.resetEmail = email;

        // In a real app, this would send an email.
        console.log('Verification code:', this.resetCode); // Remove when real auth exists.

        this.showPinMessage(`Verification code sent to ${email}`, 'success');

        setTimeout(() => {
            document.getElementById('pin-reset-step1').style.display = 'none';
            document.getElementById('pin-reset-step2').style.display = 'block';
            this.showPinMessage('Enter the 6-digit code and your new PIN', 'info');
        }, 2000);
    }

    verifyAndChangePin() {
        const enteredCode = document.getElementById('verification-code').value.trim();
        const newPin = document.getElementById('new-pin').value.trim();
        const confirmPin = document.getElementById('confirm-new-pin').value.trim();

        if (enteredCode !== this.resetCode) {
            this.showPinMessage('Invalid verification code', 'error');
            return;
        }

        if (!/^\d{4}$/.test(newPin)) {
            this.showPinMessage('PIN must be exactly 4 digits', 'error');
            return;
        }

        if (newPin !== confirmPin) {
            this.showPinMessage('PINs do not match', 'error');
            return;
        }

        this.currentPin = newPin;
        localStorage.setItem('nest_pin', newPin);

        this.showPinMessage('PIN changed successfully!', 'success');

        setTimeout(() => {
            this.closePinModal();
        }, 2000);
    }

    showPinMessage(message, type) {
        const msgEl = document.getElementById('pin-reset-message');
        msgEl.textContent = message;
        msgEl.style.color = type === 'error' ? 'var(--error)' :
                           type === 'success' ? 'var(--neon-green)' :
                           'var(--neon-blue)';
    }

    // Backup Center
    async exportData() {
        try {
            const data = await this.createBackupPayload();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nest-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showBackupMessage('Backup exported successfully.', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showBackupMessage(`Backup export failed: ${error.message}`, 'error');
        }
    }

    async createBackupPayload() {
        const localStorageData = {};
        this.knownLocalStorageKeys.forEach(key => {
            if (localStorage.getItem(key) !== null) {
                localStorageData[key] = localStorage.getItem(key);
            }
        });

        // Preserve any future Nest keys that use the same prefix.
        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if ((key && key.startsWith('nest_')) && !(key in localStorageData)) {
                localStorageData[key] = localStorage.getItem(key);
            }
        }

        const indexedDBData = await this.exportIndexedDB();

        return {
            app: 'The Nest',
            schemaVersion: 1,
            exportDate: new Date().toISOString(),
            warning: 'This backup may contain private academic, schedule, notes, and progress data. Keep it somewhere safe.',
            localStorage: localStorageData,
            indexedDB: indexedDBData
        };
    }

    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const stores = [
                    ['checklists', { keyPath: 'date' }],
                    ['timelogs', { keyPath: 'id', autoIncrement: true }],
                    ['progress', { keyPath: 'category' }],
                    ['settings', { keyPath: 'key' }],
                    ['quiz_scores', { keyPath: 'id', autoIncrement: true }],
                    ['pdf_files', { keyPath: 'id', autoIncrement: true }],
                    ['notes', { keyPath: 'id', autoIncrement: true }],
                    ['weeklyPlans', { keyPath: 'weekKey' }]
                ];
                stores.forEach(([storeName, options]) => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, options);
                        if (storeName === 'notes') {
                            store.createIndex('date', 'date', { unique: false });
                        }
                    }
                });
            };
        });
    }

    async exportIndexedDB() {
        if (!('indexedDB' in window)) return {};

        const db = await this.openDatabase();
        const exportData = {};
        const storeNames = Array.from(db.objectStoreNames);

        try {
            await Promise.all(storeNames.map(storeName => new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => {
                    exportData[storeName] = request.result || [];
                };
                request.onerror = () => reject(request.error);
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            })));
        } finally {
            db.close();
        }

        return exportData;
    }

    async importData(event) {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;

        try {
            const text = await file.text();
            const backup = JSON.parse(text);
            this.validateBackup(backup);

            const confirmed = window.confirm(
                'Importing this backup will replace current Nest localStorage and IndexedDB data on this browser.\n\n' +
                'Export a backup first if you are not sure. Continue?'
            );
            if (!confirmed) {
                this.showBackupMessage('Import canceled. No data was changed.', 'error');
                return;
            }

            await this.restoreBackup(backup);
            this.showBackupMessage('Backup imported successfully. Reloading now...', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Import failed:', error);
            this.showBackupMessage(`Backup import failed: ${error.message}`, 'error');
        }
    }

    validateBackup(backup) {
        if (!backup || typeof backup !== 'object') {
            throw new Error('Backup file is not valid JSON data.');
        }
        if (backup.app !== 'The Nest') {
            throw new Error('This does not look like a The Nest backup file.');
        }
        if (!backup.localStorage && !backup.indexedDB) {
            throw new Error('Backup is missing localStorage and IndexedDB sections.');
        }
    }

    async restoreBackup(backup) {
        this.clearLocalStorageKeys();

        Object.entries(backup.localStorage || {}).forEach(([key, value]) => {
            if (typeof value === 'string') {
                localStorage.setItem(key, value);
            } else {
                localStorage.setItem(key, JSON.stringify(value));
            }
        });

        await this.restoreIndexedDB(backup.indexedDB || {});
    }

    async restoreIndexedDB(indexedDBData) {
        await this.deleteDatabase(this.dbName);
        const db = await this.openDatabase();
        const storeNames = Array.from(db.objectStoreNames);

        try {
            await Promise.all(storeNames.map(storeName => new Promise((resolve, reject) => {
                const records = Array.isArray(indexedDBData[storeName]) ? indexedDBData[storeName] : [];
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const clearRequest = store.clear();

                clearRequest.onerror = () => reject(clearRequest.error);
                clearRequest.onsuccess = () => {
                    records.forEach(record => store.put(record));
                };
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            })));
        } finally {
            db.close();
        }
    }

    showBackupMessage(message, type = 'success') {
        const msgEl = document.getElementById('backup-message');
        if (!msgEl) return;
        msgEl.textContent = message;
        msgEl.className = `backup-message ${type}`;
    }

    // Data Status
    async loadDataStatus() {
        try {
            const localEvents = this.safeParse(localStorage.getItem('nest_events'), []);
            const calendarEvents = this.safeParse(localStorage.getItem('nest_calendar_events_v1'), []);
            const pendingUpdates = this.safeParse(localStorage.getItem('nest_pending_updates'), []);
            const indexedDBData = await this.exportIndexedDB();

            const summary = [
                `${calendarEvents.length || localEvents.length} calendar events`,
                `${(indexedDBData.checklists || []).length} checklist days`,
                `${(indexedDBData.timelogs || []).length} time logs`,
                `${(indexedDBData.notes || []).length} notes`,
                `${(indexedDBData.quiz_scores || []).length} quiz scores`,
                `${(indexedDBData.pdf_files || []).length} PDF records`,
                `${pendingUpdates.length} pending Sonya updates`
            ].join(' • ');

            document.getElementById('data-summary').textContent = summary;
        } catch (error) {
            console.error('Failed to load data status:', error);
            document.getElementById('data-summary').textContent = 'Unable to read data status.';
        }
    }

    safeParse(value, fallback) {
        if (!value) return fallback;
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    // Clear Data with Warning
    openClearDataModal() {
        document.getElementById('clear-data-modal').classList.add('active');
        document.getElementById('delete-confirm-input').value = '';
        document.getElementById('confirm-clear-btn').disabled = true;
    }

    closeClearDataModal() {
        document.getElementById('clear-data-modal').classList.remove('active');
    }

    async confirmClearData() {
        const confirmInput = document.getElementById('delete-confirm-input').value;

        if (confirmInput !== 'DELETE') {
            alert('You must type "DELETE" to confirm');
            return;
        }

        this.clearLocalStorageKeys();
        await this.deleteDatabase(this.dbName);

        alert('All data has been cleared. The page will now reload.');
        window.location.reload();
    }

    clearLocalStorageKeys() {
        const keysToRemove = new Set(this.knownLocalStorageKeys);
        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (key && key.startsWith('nest_')) {
                keysToRemove.add(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    deleteDatabase(dbName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(dbName);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
            request.onblocked = () => {
                console.warn(`Delete blocked for ${dbName}; close other tabs if import/clear does not finish.`);
                resolve();
            };
        });
    }
}

// Global functions for inline handlers
function closePinModal() {
    settingsManager.closePinModal();
}

function closeClearDataModal() {
    settingsManager.closeClearDataModal();
}

function sendPinResetCode() {
    settingsManager.sendPinResetCode();
}

function verifyAndChangePin() {
    settingsManager.verifyAndChangePin();
}

function confirmClearData() {
    settingsManager.confirmClearData();
}

// Initialize
const settingsManager = new SettingsManager();
