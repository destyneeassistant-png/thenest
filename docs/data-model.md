# The Nest Data Model

Practical initial model for migrating The Nest from static browser storage to Supabase while keeping the current GitHub Pages app usable during the transition.

## Classification guide

- **Synced:** should live in Supabase so it can be used across devices and updated by Sonya/Hermes through a secure bridge.
- **Sensitive/private:** can be synced, but requires stricter handling: Supabase Row Level Security, private storage buckets, least-privilege service roles, audit fields, and no public exposure.
- **Local-only:** should stay in the browser/device unless the user explicitly exports or opts in to sync. Usually UI preferences, cache, draft state, or data not worth storing in the cloud.

## General conventions

All synced or sensitive/private entities should eventually include:

- **ID:** stable unique identifier.
- **Owner/user:** the profile that owns the record.
- **Created at:** when the record was created.
- **Updated at:** when the record was last changed.
- **Created by:** whether the user, Sonya/Hermes, an import, or a migration created it.
- **Source:** current app, calendar import, Telegram/Sonya update, manual entry, PDF upload, or migration.
- **Archive/deleted flag:** soft-delete marker so accidental removals can be recovered.

## Entities

### User/Profile

**Classification:** sensitive/private

Represents the owner of The Nest and basic app personalization.

**Fields:**

- **ID:** unique Supabase/auth user identifier.
- **Display name:** name shown in the app.
- **Email or login identifier:** authentication contact; private.
- **Timezone:** used for calendar, reminders, and daily summaries.
- **Program/role:** academic context, such as doctoral student or practicum trainee.
- **Current focus areas:** high-level priorities like dissertation, quals/EPPP, practicum, reports, wellness.
- **Default reminder preferences:** preferred advance notice and quiet hours.
- **Theme/UI preferences:** color mode, dashboard layout, and default landing page.
- **Sonya permissions:** what Sonya/Hermes is allowed to create, edit, or summarize.
- **Emergency/private notes flag:** marker for whether especially sensitive information exists; do not store those notes in public logs.

**Migration notes:** keep UI-only preferences local until sync settings exist. Treat profile/contact information as private from day one.

---

### CalendarEvent

**Classification:** synced; sensitive/private when it includes clinical, therapy, health, location, or personal details

Represents a dated event shown on the calendar or schedule.

**Fields:**

- **ID:** unique event identifier.
- **Owner/user:** profile that owns the event.
- **Title:** short event name.
- **Description/notes:** optional details, instructions, or context.
- **Date:** local calendar date for the event.
- **Start time:** local start time.
- **End time:** local end time.
- **All-day flag:** whether the event has no specific time.
- **Category/calendar:** class, dissertation, study/quals, meeting, clinical/practicum, wellness, personal, deadline, other.
- **Location:** physical or virtual location.
- **Repeat rule:** none, daily, weekly, monthly, or later an RFC-style recurrence rule.
- **Repeat end:** optional date or count for recurring events.
- **Series ID:** links repeated occurrences to the parent event.
- **Occurrence override:** marker for changed/deleted single occurrences.
- **Reminder setting:** none or advance notice timing.
- **Status:** planned, confirmed, done, canceled, tentative.
- **Visibility/sensitivity:** normal, private, clinical, health, or personal.
- **External calendar ID:** optional future Google Calendar mapping.

**Migration notes:** maps from `localStorage` key `nest_calendar_events_v1` and legacy `nest_events`. Current categories in `calendar.js` should seed the first controlled vocabulary.

---

### StudyLog

**Classification:** synced

Tracks study/work time and learning effort across dissertation, homework, reports, class, quals/EPPP, and wellness.

**Fields:**

- **ID:** unique log identifier.
- **Owner/user:** profile that owns the log.
- **Date:** day the work happened.
- **Start time:** optional start time.
- **End time:** optional end time.
- **Minutes:** duration recorded.
- **Category:** dissertation, homework, reports, class, quals/EPPP, reading, practicum admin, wellness, other.
- **Related entity:** optional link to a dissertation task, section, quiz, note, calendar event, or document.
- **Description:** what was worked on.
- **Energy/focus rating:** optional self-rating for reflection.
- **Outcome:** completed, partial, postponed, or notes about progress.
- **Logged by:** manual entry, timer button, Sonya/Hermes, import, or migration.

**Migration notes:** maps from IndexedDB store `timelogs`. Existing dashboard buttons add 15-minute increments by category.

---

### DissertationTask

**Classification:** synced; sensitive/private if it contains advisor feedback, defense strategy, or personal/clinical examples

Represents an actionable dissertation to-do item.

**Fields:**

- **ID:** unique task identifier.
- **Owner/user:** profile that owns the task.
- **Title:** short task name.
- **Description:** task details or instructions.
- **Section:** optional link to a DissertationSection.
- **Status:** not started, next, in progress, blocked, waiting, done, archived.
- **Priority:** low, medium, high, urgent.
- **Due date:** target deadline.
- **Scheduled date/time:** optional planned work block.
- **Estimated minutes:** expected effort.
- **Actual minutes:** rolled up from linked StudyLog entries.
- **Page target:** optional target page number or range.
- **Completion criteria:** plain-English definition of done.
- **Blocker:** reason it cannot move forward.
- **Related documents:** links to drafts, PDFs, notes, or references.
- **Advisor/committee relevance:** optional person or meeting connected to the task.

**Migration notes:** current dashboard progress is page/hour based; this entity gives that progress actionable units.

---

### DissertationSection

**Classification:** synced; sensitive/private if section notes include unpublished research details, advisor feedback, or clinical/private material

Represents a structural part of the dissertation manuscript.

**Fields:**

- **ID:** unique section identifier.
- **Owner/user:** profile that owns the section.
- **Parent section:** optional parent for chapters/subsections.
- **Title:** section or chapter name.
- **Order:** display/order number.
- **Chapter:** chapter label or number.
- **Status:** outline, drafting, revising, advisor review, committee review, done, parked.
- **Current page:** current page number or count.
- **Target page:** target page number or count.
- **Word count:** optional current word count.
- **Target word count:** optional target word count.
- **Summary:** what belongs in the section.
- **Open questions:** unresolved issues to answer.
- **Next action:** the next concrete step.
- **Related tasks:** linked DissertationTask records.
- **Related notes/documents:** linked notes, PDFs, drafts, or references.

**Migration notes:** maps from the dashboard progress concepts currently stored in IndexedDB `progress` keys like `dissertation` and `dissertationHours`.

---

### QuizQuestion

**Classification:** synced for general study content; sensitive/private only if the user creates questions from private notes or paid/restricted materials

Represents a reusable quiz question for psychology, DSM-5, EPPP/quals, forensic topics, or class content.

**Fields:**

- **ID:** unique question identifier.
- **Topic:** broad subject area.
- **Subtopic:** narrower content area.
- **Question text:** the prompt shown to the user.
- **Question type:** multiple choice, true/false, short answer, flashcard, or case vignette.
- **Answer choices:** options shown for multiple choice questions.
- **Correct answer:** correct option or expected answer.
- **Explanation/rationale:** why the answer is correct.
- **Source/reference:** page, article, lecture, PDF, or manual reference.
- **Difficulty:** easy, medium, hard, exam-level.
- **Tags:** searchable labels.
- **Active flag:** whether it should appear in quizzes.
- **Created by:** seeded app content, user, Sonya/Hermes, or import.

**Migration notes:** current questions are hard-coded in quiz pages/JS. Supabase should allow seeded shared questions plus private user-created questions.

---

### QuizAttempt

**Classification:** synced

Represents one quiz session or score record.

**Fields:**

- **ID:** unique attempt identifier.
- **Owner/user:** profile that took the quiz.
- **Quiz/topic:** topic or quiz set attempted.
- **Started at:** when the attempt began.
- **Completed at:** when the attempt ended.
- **Score:** number correct.
- **Total questions:** number attempted.
- **Percentage:** calculated score percentage.
- **Question responses:** question ID, selected answer, correctness, time spent, and whether the explanation was viewed.
- **Mode:** practice, review, timed, exam simulation, or quick drill.
- **Tags:** content areas covered.
- **Notes:** optional reflection or topics to review.

**Migration notes:** maps from IndexedDB store `quiz_scores`; current store only has topic, score, total, percentage, and date, so response-level detail is a future enhancement.

---

### Note

**Classification:** sensitive/private by default

Represents user notes, study reflections, class notes, dissertation notes, clinical/practicum notes, or quick captures from Sonya/Hermes.

**Fields:**

- **ID:** unique note identifier.
- **Owner/user:** profile that owns the note.
- **Title:** optional short title.
- **Body:** note content.
- **Format:** plain text, markdown, checklist, or rich text later.
- **Date:** note date.
- **Pinned flag:** whether it appears on the dashboard.
- **Category:** dissertation, class, quals/EPPP, practicum, reports, wellness, personal, admin, other.
- **Tags:** searchable labels.
- **Related entity:** optional link to event, task, section, document, quiz question, or reminder.
- **Sensitivity:** normal, private, clinical, health, personal, credentials/secret.
- **Source:** manual, Sonya/Hermes, PDF annotation, migration, import.
- **Summary:** optional generated short summary.

**Migration notes:** maps from IndexedDB store `notes`. Do not sync credentials, secrets, or identifiable clinical material without explicit privacy design.

---

### Document/PDF

**Classification:** sensitive/private by default

Represents uploaded PDFs, articles, drafts, forms, study guides, and extracted document metadata. Files should use private Supabase Storage buckets.

**Fields:**

- **ID:** unique document identifier.
- **Owner/user:** profile that owns the document.
- **Title:** user-facing document name.
- **Original filename:** upload filename.
- **File type:** PDF, DOCX, image, text, or other.
- **Storage path:** private Supabase Storage path after backend migration; currently the static app stores metadata only, not the actual PDF file contents.
- **File size:** size in bytes or readable size.
- **Checksum/hash:** optional duplicate detection and integrity check.
- **Uploaded at:** when the file was added.
- **Category:** dissertation, article, class, practicum, report, EPPP/quals, admin, personal, other.
- **Tags:** searchable labels.
- **Citation/reference:** APA or source metadata if known.
- **Extracted text status:** not started, processing, complete, failed.
- **Extracted text:** optional searchable text; may need separate private table.
- **Notes/annotations:** linked notes or highlights.
- **Related entity:** optional link to dissertation section, task, calendar event, quiz question, or study log.
- **Sensitivity:** normal academic, copyrighted/restricted, private, clinical, personal.

**Migration notes:** maps from IndexedDB store `pdf_files` and existing static PDFs. Current `upload.js` stores metadata only, not file blobs; real file persistence should use private Supabase Storage or another protected storage backend. Avoid public URLs for private uploads.

---

### DailyChecklist

**Classification:** local-only by default; synced if Destynee wants daily dashboard history across devices

Represents the dashboard checklist/habit-completion state currently stored by date.

**Fields:**

- **ID:** unique checklist-day identifier.
- **Owner/user:** profile that owns the checklist if synced.
- **Date:** the day the checklist belongs to.
- **Items:** list of checklist items with label, category, completion status, and completed time.
- **Template/source:** default dashboard checklist, weekly plan, Sonya/Hermes suggestion, or user-created template.
- **Completion summary:** count completed, count total, and optional percentage.
- **Notes:** optional reflection about the day.
- **Visibility/sensitivity:** normal, private, clinical, health, or personal depending on item content.

**Migration notes:** maps from IndexedDB store `checklists`. Keep local-only until account sync and privacy rules exist; checklist content can reveal routines, health, clinical work, or personal obligations.

---

### Reminder

**Classification:** synced; sensitive/private if reminder content reveals clinical, health, or personal details

Represents notification intent, separate from the calendar event itself.

**Fields:**

- **ID:** unique reminder identifier.
- **Owner/user:** profile that owns the reminder.
- **Title:** short reminder text.
- **Message:** optional detailed reminder body.
- **Due date/time:** when the reminder should fire.
- **Timezone:** timezone used for scheduling.
- **Related entity:** optional event, task, section, note, document, quiz, or study log.
- **Channel:** in-app, Telegram/Sonya, email, browser notification, or future push.
- **Lead time:** minutes/hours/days before a related event.
- **Repeat rule:** none, daily, weekly, monthly, custom.
- **Status:** pending, sent, snoozed, dismissed, completed, failed.
- **Snooze until:** optional next reminder time.
- **Sensitivity:** normal or private.

**Migration notes:** current CalendarEvent has a simple reminder field; this entity supports reliable reminders and Telegram delivery later.

---

### SonyaUpdate

**Classification:** sensitive/private

Represents an auditable update request made by Sonya/Hermes through Telegram or another assistant bridge.

**Fields:**

- **ID:** unique update identifier.
- **Owner/user:** profile affected by the update.
- **Received at:** when Sonya/Hermes received the instruction.
- **Requested by:** user, Sonya, Hermes, import, scheduled automation.
- **Source channel:** Telegram, API, CLI, app UI, or migration.
- **Raw instruction:** original user message or command; private.
- **Parsed intent:** create event, edit task, add note, summarize, upload document metadata, log study time, etc.
- **Target entity type:** CalendarEvent, StudyLog, DissertationTask, Note, Reminder, etc.
- **Target entity ID:** created or modified record ID when available.
- **Proposed changes:** structured summary of fields to change.
- **Confirmation status:** not required, pending, approved, rejected, auto-applied.
- **Execution status:** queued, applied, failed, reverted, needs review.
- **Error message:** failure details if any.
- **Privacy level:** normal, private, clinical/health/personal.
- **Audit summary:** human-readable record of what changed.

**Migration notes:** this is essential for safe assistant-driven updates. Keep raw messages private, log only necessary details, and require confirmation for destructive or high-sensitivity edits.

## Initial sync priority

1. **User/Profile, auth/RLS policies, and SonyaUpdate audit table:** foundational safety layer before syncing private data or allowing assistant-driven writes.
2. **CalendarEvent, Reminder, StudyLog, DissertationTask, and DissertationSection:** highest practical value for cross-device use and Sonya/Hermes planning updates once the foundation exists.
3. **DailyChecklist:** keep local-only at first; sync only if Destynee wants cross-device dashboard history.
4. **Note and Document/PDF:** high value but privacy/storage design must be completed first.
5. **QuizQuestion and QuizAttempt:** useful once quiz content is normalized out of static files.
6. **Local-only preferences/caches:** keep out of Supabase until there is a clear reason to sync.

## Current storage mapping

- **`localStorage:nest_calendar_events_v1`:** CalendarEvent records in the new calendar.
- **`localStorage:nest_events`:** legacy calendar/schedule events to migrate into CalendarEvent.
- **`localStorage:nest_pending_updates`:** temporary SonyaUpdate-style queue for the current local bridge; future version should become an audited `sonya_updates` table.
- **`localStorage:nest_last_sync`:** local-only bridge sync metadata.
- **`localStorage:nest_pin`:** legacy local PIN; do not migrate raw PIN values. Replace with Supabase Auth or another real authentication method.
- **`localStorage:nest_theme`:** local-only UI preference or optional future User/Profile preference.
- **`localStorage:iddCommProgress`:** local-only draft QuizAttempt/progress for the Intellectual Disability & Communication Disorders standalone quiz.
- **`localStorage:dsm5OverviewProgress`:** local-only draft QuizAttempt/progress for the DSM-5 Overview standalone quiz.
- **IndexedDB `nest_db.checklists`:** DailyChecklist records; local-only by default until sync/privacy rules are approved.
- **IndexedDB `nest_db.timelogs`:** StudyLog.
- **IndexedDB `nest_db.progress`:** dissertation pages/hours and movement progress; likely DissertationSection, StudyLog rollups, or profile dashboard metrics.
- **IndexedDB `nest_db.settings`:** mostly local-only unless explicitly chosen for profile sync.
- **IndexedDB `nest_db.quiz_scores`:** QuizAttempt summary.
- **IndexedDB `nest_db.pdf_files`:** Document/PDF metadata only; real file storage is not currently persisted by the static app.
- **IndexedDB `nest_db.notes`:** Note.
- **IndexedDB `nest_db.weeklyPlans`:** currently created but not actively used; possible future CalendarEvent, Reminder, DissertationTask, or planning template records.
