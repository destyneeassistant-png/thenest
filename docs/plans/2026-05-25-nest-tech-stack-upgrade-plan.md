# The Nest Tech Stack Upgrade Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task after GitHub authentication is fixed.

**Goal:** Upgrade The Nest from a static browser-only academic dashboard into a reliable, synced, secure academic command center that Sonya/Hermes can update from Telegram.

**Architecture:** Keep the current static HTML/CSS/JS app working while improving it in phases. First stabilize the existing prototype, then add a cloud data layer with Supabase, then optionally migrate the frontend to React/Vite once the feature set is stable enough to justify it.

**Tech Stack Path:**
- Current: HTML, CSS, vanilla JavaScript, GitHub Pages, localStorage/IndexedDB-style browser storage.
- Near-term: same frontend + cleaner file organization + export/import backup tools.
- Mid-term: Supabase database/auth/storage + secure API bridge for Sonya.
- Long-term: React/Vite frontend + Supabase + optional Google Calendar integration.

---

## Phase 0: Unlock Publishing and Protect Current Work

### Task 0.1: Fix GitHub authentication

**Objective:** Restore the ability to publish changes to the live GitHub Pages site.

**Files:**
- No app files modified.

**Steps:**
1. Generate or provide a valid GitHub personal access token for `destyneeassistant-png` with repo access.
2. Update git credentials or `gh` auth.
3. Verify with:
   ```bash
   git ls-remote origin
   ```
4. Push the already-created local calendar commit:
   ```bash
   git push origin master
   ```

**Verification:**
- `git push origin master` succeeds.
- Live site eventually shows `/calendar.html`.

### Task 0.2: Snapshot the current app state

**Objective:** Create a clean checkpoint before deeper changes.

**Files:**
- Modify only if needed: `README.md` or `docs/CHANGELOG.md`

**Steps:**
1. Confirm git status.
2. Commit only intentional files.
3. Do not accidentally include unrelated untracked files unless Destynee wants them.

**Verification:**
```bash
git status --short
```
Expected: clean or only known intentionally untracked files.

---

## Phase 1: Stabilize the Current Static App

### Task 1.1: Create a shared app inventory

**Objective:** Document every current page, its purpose, and its data source.

**Files:**
- Create: `docs/app-inventory.md`

**Content to include:**
- Dashboard
- Calendar
- Schedule
- Quizzes
- Notes
- Upload/PDF tools
- Forensic topics pages
- Settings
- Any data stored in `localStorage`

**Verification:**
- The document clearly answers: “What pages exist, what do they do, and where does their data live?”

### Task 1.2: Define the data model before adding more features

**Objective:** Decide the main entities The Nest needs before building the backend.

**Files:**
- Create: `docs/data-model.md`

**Entities:**
- User/Profile
- CalendarEvent
- StudyLog
- DissertationTask
- DissertationSection
- QuizQuestion
- QuizAttempt
- Note
- Document/PDF
- Reminder
- SonyaUpdate

**Verification:**
- Each entity has fields listed in plain English.
- Each entity states whether it should be local-only, synced, or sensitive/private.

### Task 1.3: Add a backup/export center

**Objective:** Make sure browser-stored data can be exported before any backend migration.

**Files:**
- Create or modify: `settings.html`
- Create or modify: `settings.js`
- Possibly create: `backup.js`

**Features:**
- Export all Nest local data as one JSON file.
- Import a backup JSON file.
- Show a warning before replacing current data.

**Verification:**
1. Add a test calendar event.
2. Export backup.
3. Clear local data in browser devtools.
4. Import backup.
5. Confirm event returns.

### Task 1.4: Clean navigation and page consistency

**Objective:** Make the app feel coherent before adding heavier infrastructure.

**Files:**
- Modify: `dashboard.html`
- Modify: `styles.css`
- Modify major pages as needed: `calendar.html`, `schedule.html`, `quiz.html`, `notes.html`, `settings.html`

**Features:**
- Consistent header/nav.
- Clear links to Dashboard, Calendar, Notes, Quizzes, Dissertation, Settings.
- Mobile-friendly navigation.

**Verification:**
- Every major page can return to Dashboard.
- No dead navigation links.
- Browser console has no JS errors.

---

## Phase 2: Improve Calendar Into a Real Planning Tool

### Task 2.1: Merge old Schedule and new Calendar concepts

**Objective:** Avoid having two competing schedule systems.

**Files:**
- Review: `schedule.html`, `schedule.js`
- Review: `calendar.html`, `calendar.js`
- Create: `docs/calendar-migration-notes.md`

**Decision:**
- Either keep `schedule.html` as a simple legacy view and make `calendar.html` primary.
- Or gradually retire `schedule.html` after calendar reaches feature parity.

**Verification:**
- User knows which page is the main calendar.
- Dashboard points to the main calendar.

### Task 2.2: Add recurring-event editing rules

**Objective:** Make recurring events safer and clearer.

**Files:**
- Modify: `calendar.js`
- Modify: `calendar.html` if needed

**Features:**
- When editing a recurring event, user can choose:
  - This event only
  - This and future events
  - Entire series

**Verification:**
- Editing a weekly event does not accidentally delete the entire series.

### Task 2.3: Add calendar categories tuned to Destynee’s life

**Objective:** Make the calendar match actual use.

**Categories:**
- Class
- Dissertation
- Practicum/Clinical
- Reports
- Meetings
- Study/Quals
- Wellness
- Personal
- Deadlines

**Files:**
- Modify: `calendar.js`
- Modify: `calendar.html`

**Verification:**
- Category colors display in month/week/day/agenda.

---

## Phase 3: Add Supabase as the Cloud Data Layer

### Task 3.1: Create Supabase project

**Objective:** Add a real backend/database without building a custom server first.

**External setup:**
- Create a Supabase project.
- Save project URL and anon key.
- Do not commit service-role secrets to frontend code.

**Verification:**
- Supabase dashboard opens.
- Project URL and anon key are available for frontend use.

### Task 3.2: Create database tables

**Objective:** Store core Nest data in the cloud.

**Tables:**
- `profiles`
- `calendar_events`
- `study_logs`
- `dissertation_tasks`
- `quiz_attempts`
- `notes`
- `documents`
- `sonya_updates`

**Files:**
- Create: `supabase/schema.sql`

**Verification:**
- SQL runs successfully in Supabase.
- Tables exist.

### Task 3.3: Add Supabase client to the app

**Objective:** Let the frontend read/write to Supabase.

**Files:**
- Create: `supabaseClient.js`
- Modify: pages that need data access

**Verification:**
- Browser can connect to Supabase using anon key.
- No secret key is exposed beyond the allowed anon key.

### Task 3.4: Migrate calendar events from localStorage to Supabase

**Objective:** Make calendar sync across devices.

**Files:**
- Modify: `calendar.js`
- Possibly create: `calendarStore.js`

**Approach:**
- Keep localStorage as fallback/cache.
- Load events from Supabase if logged in.
- Save events to Supabase.
- Provide one-click migration from localStorage.

**Verification:**
1. Create event on one browser/device.
2. Open app on another browser/device.
3. Event appears after login/sync.

---

## Phase 4: Add Authentication and Privacy

### Task 4.1: Add login page

**Objective:** Protect cloud-synced personal data.

**Files:**
- Create: `login.html`
- Create: `login.js`
- Modify: `styles.css`

**Auth method:**
- Supabase email magic link or email/password.

**Verification:**
- User can log in.
- User can log out.
- Logged-out user cannot access private synced data.

### Task 4.2: Add row-level security policies

**Objective:** Ensure only Destynee can read/write her own data.

**Files:**
- Create: `supabase/rls-policies.sql`

**Verification:**
- Logged-out requests fail.
- Logged-in requests only access that user’s rows.

---

## Phase 5: Create the Sonya/Hermes API Bridge

### Task 5.1: Define what Sonya is allowed to update

**Objective:** Keep AI actions useful but safe.

**Files:**
- Create: `docs/sonya-api-permissions.md`

**Allowed actions:**
- Add calendar event
- Update study log
- Add dissertation task
- Mark task complete
- Add note
- Add reminder

**Not allowed without confirmation:**
- Delete large data sets
- Send external messages
- Share private documents
- Change auth/security settings

**Verification:**
- Permissions document is clear and user-approved.

### Task 5.2: Create `sonya_updates` workflow

**Objective:** Allow Hermes/Sonya to queue updates that the app can process.

**Files:**
- Modify: `api.js`
- Modify or create: `sonyaBridge.js`
- Supabase table: `sonya_updates`

**Flow:**
1. Sonya writes an update row.
2. App checks pending updates.
3. App applies safe updates.
4. App marks update processed.

**Verification:**
- A test update from Sonya appears in the app.
- Processed updates are not applied twice.

---

## Phase 6: Decide Whether to Migrate to React/Vite

### Task 6.1: Make the migration decision

**Objective:** Avoid a premature rebuild.

**Criteria to migrate:**
- Repeated layout/header code is slowing development.
- Calendar/dashboard state gets hard to manage.
- Quiz/dissertation modules need reusable components.
- App needs route-level structure and shared stores.

**Decision options:**
- Stay static vanilla JS.
- Move only new features to modular JS.
- Rebuild frontend in React/Vite.

**Verification:**
- Decision recorded in `docs/frontend-architecture-decision.md`.

### Task 6.2: If approved, create React/Vite version

**Objective:** Modernize frontend without losing existing features.

**Files:**
- Create: `package.json`
- Create: `src/`
- Create components:
  - `AppShell`
  - `Dashboard`
  - `Calendar`
  - `Notes`
  - `Quiz`
  - `DissertationTracker`

**Verification:**
- Existing major features are available in React version.
- Build passes:
  ```bash
  npm run build
  ```

---

## Phase 7: Add Advanced Integrations Later

### Task 7.1: Google Calendar sync

**Objective:** Sync Nest calendar with Google Calendar if needed.

**Do later because:**
- OAuth adds complexity.
- We should first make Nest’s internal calendar reliable.

### Task 7.2: Push notifications

**Objective:** Let the app remind Destynee outside Telegram.

**Do later because:**
- Browser push notifications require service worker setup and permission handling.

### Task 7.3: PDF/document library

**Objective:** Store dissertation PDFs, packets, and notes in a structured library.

**Backend:**
- Supabase Storage for files.
- `documents` table for metadata.

---

## Recommended Implementation Order

1. Fix GitHub publishing.
2. Publish current calendar.
3. Add backup/export center.
4. Clean navigation.
5. Make calendar primary and polish recurring events.
6. Document data model.
7. Add Supabase project and schema.
8. Move calendar data to Supabase.
9. Add login/auth.
10. Add Sonya update bridge.
11. Add dissertation/task/study modules to Supabase.
12. Decide whether to migrate to React/Vite.
13. Add advanced integrations only after the core is stable.

---

## Plain-English Summary

Do not rebuild The Nest immediately. First, make the current version stable and publishable. Then add cloud storage so your calendar, dissertation work, study logs, and notes sync across devices. After that, add a secure Sonya bridge so Telegram updates can flow into the app. Only migrate to React/Vite once the app is large enough that vanilla HTML/JS starts slowing us down.
