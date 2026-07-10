# The Nest 2.0

The Nest is a framework-free, static academic command center for planning, dissertation work, study, documents, and notes.

## What works

- **Today:** current browser calendar events, up to three priorities, due-soon items, dissertation next action, and quick capture.
- **Plan:** one canonical local calendar (`calendar.html`) with month, week, day, and agenda views plus JSON import/export.
- **Dissertation:** an editable browser-local workspace for focus, milestones, counts, feedback, blockers, and links.
- **Study:** psychology quizzes and score history stored in IndexedDB.
- **Library:** app-hosted public-link documents with search, categories, favorites, and recent items.
- **Notes:** searchable, categorized, tagged, pinnable notes with autosave.
- **Settings:** one light/dark preference and backup, validated restore, and clear controls.

## Privacy and storage boundaries

The app is static. Most working data is stored in this browser using `localStorage` and IndexedDB. Clearing site data can erase it, so export backups regularly. The PIN screen is a **local convenience lock, not authentication or security**. It does not encrypt data or protect hosted files.

Files shipped in `assets/` are public-link resources when the site is published. Do not add clinical records, identifying client information, credentials, or other private material. Supabase Auth, private Storage, email verification, and cross-device synchronization are **not configured**.

## Run locally

```sh
cd /home/des121/thenest
python3 -m http.server 8080
```

Open `http://localhost:8080`. Run checks with:

```sh
npm test
npm run check
```

No build step or framework is required.
