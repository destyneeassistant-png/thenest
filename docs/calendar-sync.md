# The Nest calendar sync: browser + Sonya/Hermes scheduled jobs

The Nest calendar still works locally with `localStorage` first. Supabase sync is optional and only turns on when frontend config is present and enabled.

## What changed

- Browser calendar storage remains `localStorage.nest_calendar_events_v1`.
- `calendar.html` loads optional Supabase support.
- `supabase-calendar.js` syncs events with Supabase when `window.NEST_SUPABASE_CONFIG.enabled === true`.
- If Supabase is missing, misconfigured, or down, calendar saves still happen locally.
- Sonya/Hermes scheduled jobs can read the same calendar table server-side using `SUPABASE_SERVICE_ROLE_KEY`.

## Frontend config pattern

1. Copy:

   ```bash
   cp supabase-config.example.js supabase-config.js
   ```

2. Edit `supabase-config.js` locally or in the static-host deployment environment:

   ```js
   window.NEST_SUPABASE_CONFIG = {
       enabled: true,
       url: 'https://YOUR_PROJECT_REF.supabase.co',
       anonKey: 'YOUR_PUBLIC_ANON_KEY',
       ownerId: 'DESTYNEE_SUPABASE_AUTH_USER_UUID',
       calendarTable: 'calendar_events',
       syncLogTable: 'assistant_sync_log'
   };
   ```

3. Do not commit `supabase-config.js`. It is gitignored.

Safe to expose in frontend:
- Supabase project URL
- Supabase anon/public key, only with RLS enabled

Never expose in frontend:
- Supabase service role key
- Database password
- GitHub token
- Any Hermes/Telegram/Gmail/OpenAI secret

## Database setup

Run `docs/supabase-calendar-schema.sql` in Supabase SQL editor.

The schema creates:

- `calendar_events`: app calendar event table.
- `assistant_sync_log`: simple audit trail for frontend/assistant sync actions.
- `assistant_calendar_events`: assistant-readable view of non-deleted events.
- Row Level Security policies for signed-in browser users.

Important: the included RLS policies assume Supabase Auth is configured and `owner_id = auth.uid()`.
That is the safe pattern for a public static frontend. Do not turn off RLS or add broad anonymous write policies unless you accept that anyone with the static site/config can read or alter calendar rows.

## Scheduled-job reader setup

Server-side jobs should use environment variables, not frontend config:

```bash
export NEST_SUPABASE_URL='https://YOUR_PROJECT_REF.supabase.co'
export NEST_SUPABASE_SERVICE_ROLE_KEY='YOUR_SERVER_SIDE_SERVICE_ROLE_KEY'
export NEST_SUPABASE_OWNER_ID='DESTYNEE_SUPABASE_AUTH_USER_UUID'
python3 scripts/read_calendar_events.py --days 7
```

Optional env var:

```bash
export NEST_SUPABASE_CALENDAR_TABLE='assistant_calendar_events'
```

Use the service role key only inside Hermes/server-side environments. It bypasses RLS and must never be placed in `supabase-config.js`, HTML, or any public static file.

## Local fallback behavior

If `supabase-config.js` is missing, disabled, or invalid:

- The calendar displays `Local-only mode`.
- Events are saved to `localStorage.nest_calendar_events_v1`.
- Import/export JSON still works.
- Existing localStorage and legacy `nest_events` migration behavior are preserved.

## Current credential/user actions needed

Destynee/Sonya still needs to:

1. Create or choose a Supabase project.
2. Run `docs/supabase-calendar-schema.sql`.
3. Configure Supabase Auth for Destynee and get her Auth user UUID.
4. Fill `supabase-config.js` locally/deployment-side with project URL, anon key, and owner UUID.
5. Add server-side Hermes env vars for scheduled jobs:
   - `NEST_SUPABASE_URL`
   - `NEST_SUPABASE_SERVICE_ROLE_KEY`
   - `NEST_SUPABASE_OWNER_ID`
6. Test by creating one calendar event in The Nest, then running:

   ```bash
   python3 scripts/read_calendar_events.py --days 14 --pretty
   ```
