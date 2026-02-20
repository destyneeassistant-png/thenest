// The Nest - External API for Sonya Integration
// Allows Sonya to push study hour updates to the app

const API_CONFIG = {
    // API endpoint for receiving updates
    // In production, this would be a server endpoint
    // For GitHub Pages, we use a data file approach
    DATA_URL: 'https://raw.githubusercontent.com/destyneeassistant-png/thenest-data/main/updates.json',
    SYNC_INTERVAL: 60000 // Check for updates every minute
};

class NestAPI {
    constructor(db) {
        this.db = db;
        this.lastSync = localStorage.getItem('nest_last_sync') || '0';
    }

    // Initialize API sync
    init() {
        // Check for external updates on load
        this.checkForUpdates();
        
        // Set up periodic sync
        setInterval(() => this.checkForUpdates(), API_CONFIG.SYNC_INTERVAL);
        
        console.log('🦉 NestAPI initialized - checking for Sonya updates...');
    }

    // Check for updates from Sonya
    async checkForUpdates() {
        try {
            // For now, use localStorage as a bridge
            // Sonya will update this via a separate mechanism
            const pendingUpdates = localStorage.getItem('nest_pending_updates');
            
            if (pendingUpdates) {
                const updates = JSON.parse(pendingUpdates);
                
                for (const update of updates) {
                    if (update.timestamp > this.lastSync) {
                        await this.processUpdate(update);
                    }
                }
                
                // Clear processed updates
                localStorage.setItem('nest_pending_updates', '[]');
                this.lastSync = Date.now();
                localStorage.setItem('nest_last_sync', this.lastSync);
            }
        } catch (error) {
            console.error('API sync error:', error);
        }
    }

    // Process a single update
    async processUpdate(update) {
        console.log('Processing update:', update);
        
        switch(update.type) {
            case 'timeLog':
                await this.db.addTimeLog(update.category, update.minutes);
                break;
            case 'progress':
                await this.db.updateProgress(update.category, update.value);
                break;
            case 'checklist':
                await this.db.saveChecklist(update.date, update.items);
                break;
        }
        
        // Refresh UI if dashboard is visible
        if (window.dashboard && typeof window.dashboard.loadData === 'function') {
            window.dashboard.loadData();
        }
    }

    // Method for Sonya to queue an update
    // This will be called from the console or via a bookmarklet
    static queueUpdate(update) {
        const existing = JSON.parse(localStorage.getItem('nest_pending_updates') || '[]');
        existing.push({
            ...update,
            timestamp: Date.now(),
            source: 'sonya'
        });
        localStorage.setItem('nest_pending_updates', JSON.stringify(existing));
        console.log('✅ Update queued for The Nest:', update);
    }
}

// Make available globally
window.NestAPI = NestAPI;

// Example usage for Sonya:
// NestAPI.queueUpdate({type: 'timeLog', category: 'quals', minutes: 150});
// NestAPI.queueUpdate({type: 'progress', category: 'quals', value: 450});
