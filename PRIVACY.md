# The Nest privacy boundary

The Nest is currently delivered through **public GitHub Pages**. Anything committed to this repository—including HTML, JavaScript, PDFs, Word files, spreadsheets, filenames, and static data—must be treated as publicly accessible through a direct URL and repository history.

## What the local lock does

The four-digit lock is a local convenience screen. It is **not authentication** and does not protect direct page URLs, repository files, browser storage, or static documents. Do not rely on it for privacy or security.

## Safe content for this version

Use the public static app only for material you are comfortable treating as public or pseudonymous, such as general study resources and non-sensitive academic tools.

**Do not store identifiable clinical material, therapy details, credentials, secrets, protected health information, private schedules, or unpublished sensitive records in this public repository.** Calendar, notes, and local task data remain in the current browser unless an authenticated backend is explicitly configured.

## Documents

Every document listed from `assets/` has a public-link privacy label. “Public link” means the file can be opened without signing in. Removing a file from the current branch does not automatically remove it from Git history.

## Backups

Local backups may contain schedules, notes, study history, and personal information. Store exported JSON files somewhere private. The app validates backup structure before restore, but browser-local storage is still less durable than an authenticated database.

## Required private architecture

True private sync requires infrastructure that is not provided by GitHub Pages alone:

1. **Supabase Auth** or equivalent real authentication.
2. Row Level Security deriving ownership from the signed-in user.
3. **Private Storage** buckets with short-lived signed URLs for documents.
4. Server-side Sonya/Hermes operations using secrets that are never exposed in frontend code.
5. Audit logs, confirmation rules, and undo for assistant-made changes.

The repository contains schemas and adapters that prepare for this migration, but cloud authentication and private storage are not operational until a Supabase project and credentials are configured and verified.
