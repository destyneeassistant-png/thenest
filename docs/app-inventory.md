# The Nest App Inventory

This document lists the current pages in The Nest static app, what each page is for, and where its data comes from. The app is mostly a browser-only/static site: pages are plain HTML/CSS/JavaScript, and personal data is stored in the browser with `localStorage` and `IndexedDB`.

## Quick data map

- Static files: most content is hard-coded directly in `.html` or `.js` files.
- Shared styling/assets: `styles.css`, `manifest.json`, and `assets/owl-icon.svg`.
- Main browser database: `IndexedDB` database named `nest_db`, version `2`.
- Main browser key-value storage: mostly `localStorage` keys beginning with `nest_`, plus a few standalone quiz progress keys.
- There is no full backend for the static app. `sonya_api.py` and `API-README.md` describe an API idea, but the front-end app currently relies on browser storage.

## Pages

### `index.html` — Login / PIN screen

- Purpose: First screen for The Nest. Destynee enters a 4-digit PIN to open the dashboard.
- Main script: `app.js`.
- Data source:
  - Reads `localStorage.nest_pin`.
  - Falls back to default PIN `0315` if no saved PIN exists.
- Data saved: none directly on this page.

### `dashboard.html` — Main dashboard

- Purpose: The main home page after login. It shows the current date, daily checklist, time tracker, weekly goals, a progress doughnut chart, today's agenda, a small clickable month calendar, quick links, and a rotating psychology/forensic fact.
- Main scripts:
  - `dashboard.js`
  - `api.js`
  - Chart.js from CDN for the progress doughnut chart.
- Data source:
  - Hard-coded weekly override plan inside `dashboard.js` for April 6-11, 2026.
  - Hard-coded psychology facts inside `dashboard.js`.
  - Hard-coded small calendar event dots for days `19`, `20`, and `26` in `dashboard.js`.
  - `IndexedDB.nest_db` is initialized by the dashboard setup with stores for checklist, time log, progress, quiz scores, PDFs, notes, settings, and weekly plans.
  - The dashboard page actively uses checklist, time log, and progress stores; other pages primarily use quiz score, PDF, and note stores.
  - `api.js` reads queued local updates from `localStorage.nest_pending_updates` and can apply some update types to the dashboard database; progress updates have a known bridge bug noted below.
- Data saved:
  - `IndexedDB` object store `checklists`: daily checklist state by date.
  - `IndexedDB` object store `timelogs`: 15-minute time log entries by category.
  - `IndexedDB` object store `progress`: progress values such as dissertation pages, dissertation hours, and movement sessions.
  - `localStorage.nest_last_sync` and `localStorage.nest_pending_updates` are used by `api.js` for the local Sonya update bridge.

### `calendar.html` — Google-style calendar

- Purpose: A fuller calendar with month, week, day, and agenda views. It supports creating, editing, deleting, searching, importing, and exporting calendar events.
- Main script: `calendar.js`.
- Data source:
  - Hard-coded calendar categories and colors in `calendar.js`.
  - Hard-coded recurring weekly seed schedule in `calendar.js`.
  - Reads legacy schedule events from `localStorage.nest_events` the first time it builds the new calendar data.
- Data saved:
  - `localStorage.nest_calendar_events_v1`: the main calendar event list.
  - It may import old `localStorage.nest_events` into the newer calendar format.
- Notes:
  - Calendar and Schedule use different storage formats. Calendar's current storage key is `nest_calendar_events_v1`; Schedule uses `nest_events`.

### `schedule.html` — Full schedule page

- Purpose: Older/enhanced schedule page with month, week, day, and list views. It shows Destynee's permanent weekly schedule plus user-added one-off events.
- Main script: `schedule.js`.
- Data source:
  - Hard-coded permanent weekly schedule in `schedule.js`.
  - User-added events from `localStorage.nest_events`.
  - URL parameters can open a specific date and open the add-event modal, for example from the dashboard mini calendar.
- Data saved:
  - `localStorage.nest_events`: one-off events created on the schedule page.

### `quiz.html` — Main quiz hub / built-in quiz player

- Purpose: Quiz landing page and quiz player for built-in psychology topics. It also links out to separate topic-specific quiz pages.
- Main script: `quiz.js`.
- Data source:
  - Hard-coded quiz question sets inside `quiz.js` for topics such as cognitive development, lifespan/emerging adulthood, learning, and social psychology.
  - Recent score history from `IndexedDB.nest_db`.
- Data saved:
  - `IndexedDB` object store `quiz_scores`: topic, score, total, percentage, and date.

### `quiz-clinical-psychology.html` — Clinical Psychology quiz

- Purpose: Standalone clinical psychology quiz page.
- Main script/data: Inline JavaScript inside the HTML file.
- Data source: Hard-coded questions, answer choices, correct answers, and explanations in the page itself.
- Data saved: none found. Scores are shown in the page session only unless the inline script does something in memory.

### `quiz-learning-theory.html` — Learning Theory quiz

- Purpose: Standalone learning theory quiz page.
- Main script/data: Inline JavaScript inside the HTML file.
- Data source: Hard-coded questions grouped by difficulty in the page itself.
- Data saved: none found.

### `quiz-memory-forgetting.html` — Memory & Forgetting quiz

- Purpose: Standalone memory and forgetting quiz page.
- Main script/data: Inline JavaScript inside the HTML file.
- Data source: Hard-coded questions grouped by difficulty in the page itself.
- Data saved: none found.

### `quiz-ethics.html` — Professional Ethics quiz

- Purpose: Standalone professional ethics quiz page.
- Main script/data: Inline JavaScript inside the HTML file.
- Data source: Hard-coded questions, answers, and explanations in the page itself.
- Data saved: none found.

### `quiz-intellectual-disability.html` — Intellectual Disability & Communication Disorders quiz

- Purpose: Standalone EPPP-style quiz for intellectual disability and communication disorders.
- Main script/data: Inline JavaScript inside the HTML file.
- Data source: Hard-coded `quizData` array in the page itself.
- Data saved:
  - `localStorage.iddCommProgress`: current question, selected answers, and score for this standalone quiz.

### `quiz-dsm5-overview.html` — DSM-5 Overview & Classification quiz

- Purpose: Standalone EPPP-style quiz for DSM-5 overview and classification.
- Main script/data: Inline JavaScript inside the HTML file.
- Data source: Hard-coded `quizData` array in the page itself.
- Data saved:
  - `localStorage.dsm5OverviewProgress`: current question, selected answers, and score for this standalone quiz.

### `notes.html` — Notes

- Purpose: Local note-taking page with a notes list, editor, autosave, word count, and delete option.
- Main script: `notes.js`.
- Data source:
  - Reads notes from `IndexedDB.nest_db`.
- Data saved:
  - `IndexedDB` object store `notes`: note id, title, content, date, and updated timestamp.
- Notes:
  - The settings page still looks for `localStorage.nest_notes` when exporting/status-checking, but the current notes page uses IndexedDB instead.

### `upload.html` — Upload PDF tools

- Purpose: Drag-and-drop or select PDF files, show upload progress, list uploaded PDFs, and delete entries.
- Main script: `upload.js`.
- Data source:
  - Reads PDF metadata from `IndexedDB.nest_db`.
- Data saved:
  - `IndexedDB` object store `pdf_files`: file name, size, type, upload date, and status.
- Important note:
  - The current code stores PDF metadata only. It does not store the full PDF file contents.

### `forensic-topics.html` — Forensic Topics / Questions

- Purpose: Study page that keeps forensic psychology questions separate from explanations so Destynee can test herself first.
- Main script: none. Content is static HTML.
- Data source:
  - Hard-coded question set in `forensic-topics.html`.
  - Current set: Psychology of Criminal Conduct — Nightly Set 1, added after live chat responses on April 5, 2026.
- Data saved: none.

### `forensic-topics-explanations.html` — Forensic Topics / Explanations

- Purpose: Companion page for the forensic questions. It stores Destynee's answers and feedback/evaluations separately from the questions.
- Main script: none. Content is static HTML.
- Data source:
  - Hard-coded answers and evaluations in `forensic-topics-explanations.html`.
  - Current set: Psychology of Criminal Conduct — Nightly Set 1 Explanations.
- Data saved: none.

### `settings.html` — Settings

- Purpose: Change the visual theme, change the app PIN, export app data, view simple data counts, and clear stored data.
- Main script: `settings.js`.
- Data source:
  - Reads settings and simple counts from `localStorage`.
  - Can delete the `IndexedDB` database named `nest_db` when clearing data.
- Data saved:
  - `localStorage.nest_theme`: `dark` or `light`.
  - `localStorage.nest_pin`: custom PIN.
- Notes and issues found:
  - The PIN validation currently checks `^={4}$`, which means four equals signs, not four digits. It looks like it was meant to be `^\d{4}$`.
  - Export/status reads older localStorage keys like `nest_checklists`, `nest_timelogs`, `nest_progress`, and `nest_notes`, but the main dashboard/notes/upload/quiz code now uses IndexedDB for those areas. Exports may miss IndexedDB data unless this is updated later.
  - Clear data removes some old localStorage keys and deletes `nest_db`, but it does not remove newer calendar/API keys such as `nest_calendar_events_v1`, `nest_pending_updates`, or `nest_last_sync`.

### `EPPP_3_Week_Study_Plan.html` — Static EPPP study plan

- Purpose: Static HTML version of the EPPP 3-week crash study plan.
- Main script: none.
- Data source: Hard-coded HTML content.
- Data saved: none.
- Related file: `EPPP_3_Week_Study_Plan.pdf` is the PDF version of the plan.

### `brain-coloring-page.html` — Brain coloring page

- Purpose: Static brain coloring/reference page.
- Main script: none.
- Data source: Hard-coded HTML/CSS content.
- Data saved: none.

## LocalStorage inventory

These are the current `localStorage` keys used or referenced in the app:

- `nest_pin`
  - Used by: `app.js`, `settings.js`.
  - Stores: custom login PIN.
  - Default if missing: `0315`.

- `nest_theme`
  - Used by: `settings.js`.
  - Stores: theme choice, usually `dark` or `light`.

- `nest_events`
  - Used by: `schedule.js`, `calendar.js`, `settings.js`.
  - Stores: schedule page one-off events.
  - Also used as a legacy source when the newer calendar first creates `nest_calendar_events_v1`.

- `nest_calendar_events_v1`
  - Used by: `calendar.js`.
  - Stores: newer full calendar events, including seeded weekly recurring events and imported legacy schedule events.

- `nest_pending_updates`
  - Used by: `api.js`.
  - Stores: queued local updates meant to be processed by the Sonya/Nest API bridge.

- `nest_last_sync`
  - Used by: `api.js`.
  - Stores: last sync timestamp for queued updates.

- `nest_checklists`
  - Used by: `settings.js` only.
  - Stores/references: older checklist export/status format.
  - Current dashboard checklist storage is IndexedDB, not this key.

- `nest_timelogs`
  - Used by: `settings.js` only.
  - Stores/references: older time log export/status format.
  - Current dashboard time log storage is IndexedDB, not this key.

- `nest_progress`
  - Used by: `settings.js` only.
  - Stores/references: older progress export/status format.
  - Current dashboard progress storage is IndexedDB, not this key.

- `nest_notes`
  - Used by: `settings.js` only.
  - Stores/references: older notes export/status format.
  - Current notes storage is IndexedDB, not this key.

- `iddCommProgress`
  - Used by: `quiz-intellectual-disability.html`.
  - Stores: current standalone quiz progress, selected answers, and score.

- `dsm5OverviewProgress`
  - Used by: `quiz-dsm5-overview.html`.
  - Stores: current standalone quiz progress, selected answers, and score.

## IndexedDB inventory

Database: `nest_db`

Version: `2`

Object stores currently created or used:

- `checklists`
  - Used by: dashboard.
  - Stores: daily checklist items by date.

- `timelogs`
  - Used by: dashboard.
  - Stores: time log entries with category, minutes, date, and timestamp.

- `progress`
  - Used by: dashboard.
  - Stores: progress values by category.

- `settings`
  - Created by: dashboard database setup.
  - Current active use: no direct current reads/writes found.

- `quiz_scores`
  - Used by: quiz hub/player.
  - Stores: quiz score history.

- `pdf_files`
  - Used by: upload page.
  - Stores: PDF metadata, not full file contents.

- `notes`
  - Used by: notes page.
  - Stores: notes with title/content/date/updated fields.

- `weeklyPlans`
  - Created by: dashboard database setup.
  - Current active use: no direct current reads/writes found. The visible weekly plan is hard-coded in `dashboard.js`.

## Other project files related to app data

- `api.js`: front-end local update bridge for Sonya-style updates. It reads `nest_pending_updates` and writes some processed updates into IndexedDB. Known issue: its `progress` handler calls `updateProgress(...)`, but the dashboard currently exposes `saveProgress(...)`, so progress updates may fail until the bridge is repaired.
- `sonya_api.py`: separate Python API helper/server file. It is not loaded by the static HTML pages.
- `API-README.md`: documentation for the API/Sonya integration idea.
- `manifest.json`: PWA metadata for The Nest.
- `assets/owl-icon.svg`: app icon.
- `styles.css`: global visual styling.

## Main cleanup notes for a future upgrade

- Decide whether Calendar should fully replace Schedule, or whether both should be kept and synchronized.
- Update Settings export/status so it exports current IndexedDB data, not only older localStorage keys.
- Fix the Settings PIN validation from four equals signs to four digits.
- Make Clear Data remove all current localStorage keys, including `nest_calendar_events_v1`, `nest_pending_updates`, and `nest_last_sync`.
- If PDF uploads should preserve real files, update `upload.js` to store file blobs or use a real backend/storage service.
- Repair the `api.js` progress update path before relying on Sonya/Hermes queued progress updates.
