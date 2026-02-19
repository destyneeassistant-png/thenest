# The Nest 🦉

Destynee's personal productivity PWA for managing quals, dissertation, reports, and daily life.

## Features

✅ **PIN Lock** — Secure access with PIN 0315
✅ **Dashboard Widgets** — Schedule, checklist, time logging, progress bars
✅ **Daily Checklist** — Track mindfulness, study, dissertation, gym, protein, caffeine
✅ **Time Logger** — Log hours for quals, dissertation, reports, classes
✅ **Progress Tracking** — Visual progress toward 300h quals, 20pg dissertation, 21h reports
✅ **Psychology Facts** — Rotating facts for study inspiration
✅ **Calendar** — Visual schedule with testing days highlighted
✅ **Offline-First** — All data stored locally via IndexedDB
✅ **Cyberpunk Theme** — Black/neon aesthetic

## Installation

### Option 1: Local Server (Recommended)

1. Navigate to the nest folder:
   ```
   cd /home/des121/.openclaw/workspace/nest
   ```

2. Start a local server:
   ```
   python3 -m http.server 8080
   ```

3. Open browser:
   ```
   http://localhost:8080
   ```

4. Enter PIN: **0315**

### Option 2: Open File Directly

1. Open `index.html` in a browser
2. Enter PIN: **0315**

Note: Some features (like service worker) require a server.

### Option 3: Install as PWA

1. Open in browser via local server
2. Click "Install" or "Add to Home Screen" in browser menu
3. The Nest will appear as a standalone app

## File Structure

```
nest/
├── index.html          # Main app structure (213 lines)
├── styles.css          # Cyberpunk theme (560 lines)
├── app.js              # App logic & IndexedDB (475 lines)
├── manifest.json       # PWA manifest
└── README.md           # This file
```

## How to Use

### First Time Setup
1. Open the app
2. Enter PIN: 0315
3. Start tracking!

### Daily Workflow
1. **Check Schedule** — See what's planned for today
2. **Complete Checklist** — Check off daily tasks
3. **Log Time** — Click +15m buttons when working
4. **Track Progress** — Watch bars fill toward goals

### Data Storage
- All data saved locally in browser (IndexedDB)
- No internet required after first load
- Data persists between sessions
- Clear browser data = lose everything (backup plan coming)

## Customization

### Change PIN
Edit `app.js`, line 4:
```javascript
const CONFIG = {
    PIN: 'YOUR_NEW_PIN',
    ...
};
```

### Add/Modify Checklist Items
Edit `index.html`, find the checklist section and add/remove items.

### Change Psychology Facts
Edit `app.js`, find `this.psychFacts` array and modify.

### Change Colors
Edit `styles.css`, modify CSS variables in `:root`:
```css
:root {
    --neon-pink: #ff006e;
    --neon-blue: #00f5ff;
    ...
}
```

## Tech Stack

- **HTML5** — Structure
- **CSS3** — Styling with CSS variables
- **Vanilla JavaScript** — No frameworks
- **IndexedDB** — Local data storage
- **Service Worker Ready** — PWA capabilities

## Roadmap

- [ ] PDF upload → text extraction → quiz generation
- [ ] Quiz interface with scoring
- [ ] Data export/backup
- [ ] Device whitelist
- [ ] Push notifications
- [ ] Calendar sync

## Created By

Sonya 🦉 — For Destynee
Created: February 17, 2026
