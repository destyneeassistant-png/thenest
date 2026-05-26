// The Nest Supabase frontend config template.
//
// Copy this file to `supabase-config.js` for local/private deployment setup, then
// fill in your Supabase project URL and PUBLIC anon key.
//
// Important security notes:
// - The anon key is designed to be used in browser apps, but it is still only safe
//   when Supabase Row Level Security (RLS) policies are enabled.
// - NEVER put the Supabase service_role key, database password, GitHub token, or
//   any other private secret in this file. This app is static/public frontend code.
// - Sonya/Hermes scheduled jobs should use server-side environment variables; see
//   scripts/read_calendar_events.py and docs/calendar-sync.md.

window.NEST_SUPABASE_CONFIG = {
    enabled: false,
    url: 'https://YOUR_PROJECT_REF.supabase.co',
    anonKey: 'YOUR_PUBLIC_ANON_KEY',

    // Owner/profile identifier used to scope this personal Nest calendar.
    // Use the same UUID in the SQL seed/docs and in scheduled-job env vars.
    ownerId: '00000000-0000-0000-0000-000000000000',

    // Table names can be changed later without touching calendar.js.
    calendarTable: 'calendar_events',
    syncLogTable: 'assistant_sync_log'
};
