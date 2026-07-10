# The Nest 2.0 rebuild specification

Goal: turn the static prototype into a trustworthy, Vercel-inspired academic command center while preserving existing local data and unpublished document-library additions.

## Required vertical slices

1. Shared app shell and design system
- Vercel-inspired neutral light/dark tokens, Geist typography, shadow-as-border cards, 8px spacing, restrained radii.
- Shared semantic navigation: Today, Plan, Dissertation, Study, Library, Notes, Settings.
- Desktop top navigation and mobile bottom navigation.
- Visible focus states, 44px targets, reduced-motion support.

2. Today dashboard
- Current calendar events only; no hard-coded schedules or routines.
- Now/Next, up to three editable priorities, due-soon items, dissertation next action, study recommendation, quick capture.
- Honest empty states when current data is absent.
- Remove static agent statuses, facts, duplicate charts, legacy schedule links, fake event dots, and upload metadata shortcut.

3. One calendar
- `calendar.html` is canonical.
- `schedule.html` becomes a migration-safe redirect.
- Current local storage remains supported; no semester seeds.
- Improve dialog/tab keyboard semantics, Escape behavior, focus return, and rendering bugs.
- Do not request a nonexistent Supabase config file.

4. Trust and privacy
- PIN is labeled a local convenience lock, not authentication.
- Remove fake email verification.
- Remove misleading online/sync/upload claims.
- Mark static library files as public-link resources and warn against clinical/private content.
- Keep uncommitted document additions intact.
- Correct manifest paths.

5. Academic workflows
- Add editable Dissertation workspace: current chapter/section, next action, milestone/due date, page/word count, feedback state, blockers, related links.
- Upgrade Notes with search, category, tags, pinning and safe autosave navigation.
- Upgrade Library with categories, privacy badges, favorites/recent tracking, and richer search.
- Consolidate quiz hub presentation and expose aggregate recommendations from available scores; do not invent question history not recorded by old quizzes.

6. Storage and backups
- Shared storage registry/module for every localStorage namespace and IndexedDB schema.
- Settings uses one theme key and truthful backup/clear descriptions.
- Validate backup structure before destructive restore and create a pre-import recovery download where practical.

7. Documentation and verification
- Update README to match reality; no public PIN.
- Add static checks and Node tests.
- No dependency/build framework migration in this pass.
- No claim that Supabase Auth/private Storage is complete without credentials.
