// Settings JavaScript

class SettingsManager {
    constructor() {
        this.currentPin = '0315'; // Default PIN
        this.resetCode = null;
        this.resetEmail = null;
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

        // Export data
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());

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

        // In a real app, this would send an email
        // For demo purposes, we'll show the code in the message
        // In production, you'd integrate with an email service
        console.log('Verification code:', this.resetCode); // Remove in production
        
        // Simulate email sent
        this.showPinMessage(`Verification code sent to ${email}`, 'success');
        
        // Show step 2 after 2 seconds
        setTimeout(() => {
            document.getElementById('pin-reset-step1').style.display = 'none';
            document.getElementById('pin-reset-step2').style.display = 'block';
            this.showPinMessage('Enter the 6-digit code and your new PIN', 'info');
        }, 2000);

        // NOTE: In a real implementation, you would:
        // 1. Send actual email via SMTP/API
        // 2. Store code server-side or in localStorage with expiration
        // 3. Rate limit attempts
    }

    verifyAndChangePin() {
        const enteredCode = document.getElementById('verification-code').value.trim();
        const newPin = document.getElementById('new-pin').value.trim();
        const confirmPin = document.getElementById('confirm-new-pin').value.trim();

        // Validate code
        if (enteredCode !== this.resetCode) {
            this.showPinMessage('Invalid verification code', 'error');
            return;
        }

        // Validate PIN
        if (!newPin || newPin.length !== 4 || !/^={4}$/.test(newPin)) {
            this.showPinMessage('PIN must be exactly 4 digits', 'error');
            return;
        }

        if (newPin !== confirmPin) {
            this.showPinMessage('PINs do not match', 'error');
            return;
        }

        // Change PIN
        this.currentPin = newPin;
        localStorage.setItem('nest_pin', newPin);
        
        this.showPinMessage('PIN changed successfully!', 'success');
        
        // Update app.js with new PIN
        this.updateAppPin(newPin);

        // Close modal after 2 seconds
        setTimeout(() => {
            this.closePinModal();
        }, 2000);
    }

    updateAppPin(newPin) {
        // Update the PIN in app.js by modifying localStorage
        // The app.js will check localStorage first, then fall back to default
        localStorage.setItem('nest_pin', newPin);
    }

    showPinMessage(message, type) {
        const msgEl = document.getElementById('pin-reset-message');
        msgEl.textContent = message;
        msgEl.style.color = type === 'error' ? 'var(--error)' : 
                           type === 'success' ? 'var(--neon-green)' : 
                           'var(--neon-blue)';
    }

    // Data Export
    exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            events: JSON.parse(localStorage.getItem('nest_events') || '[]'),
            checklists: JSON.parse(localStorage.getItem('nest_checklists') || '{}'),
            timelogs: JSON.parse(localStorage.getItem('nest_timelogs') || '[]'),
            progress: JSON.parse(localStorage.getItem('nest_progress') || '{}'),
            notes: JSON.parse(localStorage.getItem('nest_notes') || '[]'),
            settings: {
                theme: localStorage.getItem('nest_theme') || 'dark',
                pin: '***HIDDEN***'
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nest-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('Data exported successfully!');
    }

    // Data Status
    loadDataStatus() {
        const events = JSON.parse(localStorage.getItem('nest_events') || '[]');
        const checklists = Object.keys(JSON.parse(localStorage.getItem('nest_checklists') || '{}')).length;
        const timelogs = JSON.parse(localStorage.getItem('nest_timelogs') || '[]');
        const notes = JSON.parse(localStorage.getItem('nest_notes') || '[]');

        const summary = [
            `${events.length} events`,
            `${checklists} checklist days`,
            `${timelogs.length} time logs`,
            `${notes.length} notes`
        ].join(' • ');

        document.getElementById('data-summary').textContent = summary || 'No data stored yet';
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

    confirmClearData() {
        const confirmInput = document.getElementById('delete-confirm-input').value;
        
        if (confirmInput !== 'DELETE') {
            alert('You must type "DELETE" to confirm');
            return;
        }

        // Clear all data
        const keysToRemove = [
            'nest_events',
            'nest_checklists',
            'nest_timelogs',
            'nest_progress',
            'nest_notes',
            'nest_theme',
            'nest_pin'
        ];

        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Clear IndexedDB
        this.clearIndexedDB();

        alert('All data has been cleared. The page will now reload.');
        window.location.reload();
    }

    clearIndexedDB() {
        const databases = ['nest_db'];
        databases.forEach(dbName => {
            const request = indexedDB.deleteDatabase(dbName);
            request.onsuccess = () => console.log(`Deleted ${dbName}`);
            request.onerror = () => console.log(`Error deleting ${dbName}`);
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
