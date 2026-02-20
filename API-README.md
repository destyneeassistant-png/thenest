# Sonya API Integration

This document explains how Sonya (Destynee's AI assistant) can push updates to The Nest app.

## How It Works

Since The Nest is a client-side PWA using IndexedDB, Sonya uses a localStorage bridge to queue updates that the app will process on next load or periodic sync.

## API Methods

### 1. Queue Time Log

When Destynee tells Sonya she studied for X hours:

```javascript
// In browser console or via script
NestAPI.queueUpdate({
    type: 'timeLog',
    category: 'quals',      // 'quals', 'dissertation', or 'reports'
    minutes: 150            // 2.5 hours = 150 minutes
});
```

### 2. Update Progress

When Destynee tells Sonya her current page/progress:

```javascript
NestAPI.queueUpdate({
    type: 'progress',
    category: 'quals',
    value: 450              // Current page number or progress value
});
```

### 3. Update Checklist

```javascript
NestAPI.queueUpdate({
    type: 'checklist',
    date: '2026-02-20',
    items: [
        {task: 'mindfulness', completed: true},
        {task: 'quals', completed: true},
        {task: 'dissertation', completed: false}
    ]
});
```

## Python Script Usage

From the workspace directory:

```bash
# Log 2.5 hours of quals study
python3 nest/sonya_api.py log quals 150

# Update quals progress to page 450
python3 nest/sonya_api.py progress quals 450
```

## Workflow

1. Destynee texts Sonya: "I studied 2.5 hours today, I'm on page 450"
2. Sonya runs the API command to queue the update
3. The Nest app checks for pending updates on load and every 60 seconds
4. Updates are automatically applied and UI refreshes

## Security Note

The API uses localStorage as a message bridge. This is secure for this use case because:
- The app is PIN-protected
- Device whitelist restricts access
- Updates are tagged with source='sonya' for audit
- No sensitive data is transmitted over network

## Future Enhancement

For real-time sync without localStorage, we could:
1. Use GitHub as a data backend (JSON file updates via API)
2. Set up a simple serverless function (Cloudflare Workers, etc.)
3. Use a real-time database (Firebase, Supabase)

For now, the localStorage bridge is sufficient for Destynee's workflow.
