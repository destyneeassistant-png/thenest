# Activating private sync for The Nest

This repository can prepare the frontend, schemas, migration tools, and safety rules, but authenticated private sync **cannot be completed without** a Supabase project, its public project URL/anon key, a real user account, and a server-side secret environment for Hermes.

## Required order

1. Create a Supabase project in Destynee's account.
2. Enable Supabase Auth using email magic links or email/password.
3. Apply the SQL schemas and confirm RLS is enabled.
4. Create a private `documents` Storage bucket.
5. Configure the browser with only the project URL and anon key.
6. Sign in and derive every owner ID from `auth.uid()`—never from a user-editable frontend config value.
7. Migrate local calendar/tasks only after showing an export and migration preview.
8. Verify a second unauthenticated browser cannot read any rows or files.
9. Configure Hermes server-side access separately and test the audit/undo path.

## Non-negotiable controls

- Keep RLS enabled on every personal table.
- The service-role key must **never appear in frontend JavaScript**, GitHub, browser storage, screenshots, chat, or exported Nest backups.
- Private documents must be returned through short-lived **signed URLs**, not public bucket URLs.
- Assistant changes must create an audit record with actor, action, target, timestamp, result, and enough information to undo the change.
- Destructive or sensitive assistant actions require confirmation.
- Never sync credentials, identifiable clinical material, or protected health information through this app.

## Acceptance tests

- Logged-out reads and writes fail.
- User A cannot read or edit User B rows.
- Browser requests use the authenticated session and `auth.uid()` ownership.
- Private Storage objects cannot be opened with a permanent public URL.
- Expired signed URLs fail.
- Sonya/Hermes can create an approved test event server-side without exposing the service-role secret.
- A repeated update is idempotent and does not duplicate records.
- Deleted records remain tombstoned and cannot be resurrected by an old browser.
- Every assistant update appears in the audit history and can be reverted.

Until all tests pass, The Nest must label cloud sync and private document storage as “Not configured.”
