const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const primaryPages = [
  'dashboard.html', 'calendar.html', 'dissertation.html', 'quiz.html',
  'pdf-library.html', 'notes.html', 'settings.html'
];

test('dashboard contains no stale April schedule or fake event dots', () => {
  const js = read('dashboard.js');
  assert.doesNotMatch(js, /WEEK_OVERRIDE|2026-04-0[6-9]|2026-04-1[01]/);
  assert.doesNotMatch(js, /\[19,\s*20,\s*26\]/);
});

test('dashboard is a decision system backed by current data', () => {
  const html = read('dashboard.html');
  for (const label of ['Now / Next', 'Top Priorities', 'Due Soon', 'Dissertation Next Action', 'Quick Capture']) {
    assert.match(html, new RegExp(label.replace('/', '\\/'), 'i'));
  }
  assert.doesNotMatch(html, /Who.s Working on What|Combined Progress|Legacy Schedule/i);
});

test('primary pages share semantic navigation and app shell', () => {
  for (const page of primaryPages) {
    const html = read(page);
    assert.match(html, /<script[^>]+src=["']app-shell\.js["']/i, `${page} loads app shell`);
    assert.match(html, /<main\b/i, `${page} has main landmark`);
  }
  const shell = read('app-shell.js');
  for (const label of ['Today', 'Plan', 'Dissertation', 'Study', 'Library', 'Notes', 'Settings']) {
    assert.match(shell, new RegExp(label));
  }
  assert.match(shell, /aria-current/);
});

test('legacy schedule redirects to the canonical calendar', () => {
  const html = read('schedule.html');
  assert.match(html, /calendar\.html/);
  assert.match(html, /http-equiv=["']refresh["']/i);
});

test('security and upload wording are truthful', () => {
  assert.doesNotMatch(read('README.md'), /Secure access with PIN|PIN:\s*\*\*0315\*\*/i);
  assert.doesNotMatch(read('settings.html'), /email verification|verification code sent/i);
  assert.match(read('index.html'), /local convenience lock|not security/i);
  assert.doesNotMatch(read('dashboard.html'), /Upload PDF/i);
});

test('manifest points at the actual GitHub Pages application', () => {
  const manifest = JSON.parse(read('manifest.json'));
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
});

test('calendar does not request a missing config file', () => {
  assert.doesNotMatch(read('calendar.html'), /src=["']supabase-config\.js["']/i);
});

test('notes provides search, tags, categories, and accessible save status', () => {
  const html = read('notes.html');
  assert.match(html, /search/i);
  assert.match(html, /tag/i);
  assert.match(html, /category/i);
  assert.match(html, /aria-live|role=["']status["']/i);
});

test('library provides category filters and privacy labels', () => {
  const html = read('pdf-library.html');
  assert.match(html, /categor/i);
  assert.match(html, /privacy|public/i);
  const data = read('pdf-library-data.js');
  assert.match(data, /category/);
  assert.match(data, /privacy/);
});

test('global UI includes visible keyboard focus and reduced motion support', () => {
  const css = read('styles.css');
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /--surface|--background/);
});

test('storage registry covers all Nest application namespaces', () => {
  const storage = read('storage.js');
  for (const key of ['nest-theme-mode', 'nest-active-version', 'eppp-', 'nest_calendar_events_v1']) {
    assert.match(storage, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('app contains no known fake integration method calls', () => {
  const api = read('api.js');
  assert.doesNotMatch(api, /db\.updateProgress|dashboard\.loadData/);
  assert.doesNotMatch(api, /DATA_URL/);
});

test('dashboard exposes editable local decision data without claiming cloud sync', () => {
  const html = read('dashboard.html');
  const js = read('dashboard.js');
  for (const id of ['now-next', 'priorities-list', 'due-soon-list', 'dissertation-action', 'quick-capture']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(js, /nest-dashboard-v2/);
  assert.match(js, /nest_calendar_events_v1/);
  assert.doesNotMatch(`${html}\n${js}`, /synced|online status/i);
});

test('dissertation workspace stores the complete editable workflow', () => {
  const html = read('dissertation.html');
  const js = read('dissertation.js');
  for (const field of ['chapter', 'section', 'nextAction', 'milestone', 'dueDate', 'pageCount', 'wordCount', 'feedbackState', 'blockers', 'relatedLinks']) {
    assert.match(`${html}\n${js}`, new RegExp(field, 'i'));
  }
  assert.match(js, /nest-dissertation-v1/);
});

test('calendar dialog and view tabs expose keyboard semantics', () => {
  const html = read('calendar.html');
  const js = read('calendar.js');
  assert.match(html, /role=["']dialog["']/i);
  assert.match(html, /aria-modal=["']true["']/i);
  assert.match(html, /role=["']tab["']/i);
  assert.match(js, /Escape/);
  assert.match(js, /previousFocus|returnFocus/i);
});

test('notes and library persist upgraded organization behavior', () => {
  const notes = `${read('notes.html')}\n${read('notes.js')}`;
  assert.match(notes, /note-search/);
  assert.match(notes, /note-category/);
  assert.match(notes, /note-tags/);
  assert.match(notes, /pinned/);
  assert.match(notes, /<option[^>]*>Inbox<\/option>/i);

  const library = `${read('pdf-library.html')}\n${read('pdf-library.js')}`;
  assert.match(library, /category-filter/);
  assert.match(library, /status-filter/);
  assert.match(library, /nest-library-favorites/);
  assert.match(library, /nest-library-recent/);
  assert.match(read('pdf-library-data.js'), /Archived/);
});

test('backup import validates registry namespaces and creates a recovery export', () => {
  const storage = read('storage.js');
  const settings = read('settings.js');
  assert.match(storage, /validateBackup/);
  assert.match(settings, /pre-import-recovery/i);
  assert.match(settings, /NestStorage/);
});

test('hidden controls remain hidden when layout utility classes set display', () => {
  assert.match(read('styles.css'), /\[hidden\]\s*\{\s*display\s*:\s*none\s*!important/);
});

test('dashboard quick capture writes a real note instead of an orphan queue', () => {
  const dashboard = read('dashboard.js');
  const storage = read('storage.js');
  assert.match(dashboard, /NestStorage\.addNote/);
  assert.doesNotMatch(dashboard, /nest-quick-capture/);
  assert.match(storage, /addNote/);
  assert.match(storage, /['"]notes['"]/);
});

test('legacy upload page cannot simulate storing a file', () => {
  assert.match(read('upload.html'), /http-equiv=["']refresh["'][^>]+pdf-library\.html/i);
  assert.doesNotMatch(read('upload.js'), /simulate upload|uploadFile\s*\(/i);
});

test('calendar cleanup removes only positively identified obsolete seeds', () => {
  const calendar = read('calendar.js');
  assert.doesNotMatch(calendar, /startsWith\(['"]seed-/);
  assert.doesNotMatch(calendar, /const\s+SEED_RECURRING/);
  assert.match(calendar, /seed-2-10-00-cognitive-development-class/);
});

test('backup validation rejects unknown stores and malformed store rows before restore', () => {
  const storage = read('storage.js');
  assert.match(storage, /Unknown IndexedDB store/);
  assert.match(storage, /Invalid records for store/);
  assert.match(storage, /Object\.keys\(data\.indexedDB/);
});

test('Today clock-derived cards refresh while the page remains open', () => {
  const dashboard = read('dashboard.js');
  assert.match(dashboard, /renderTemporal/);
  assert.match(dashboard, /setInterval/);
});

test('mobile navigation respects device safe areas', () => {
  assert.match(read('styles.css'), /safe-area-inset-bottom/);
});

test('Study hub uses only the shared shell and no placeholder icons', () => {
  const html = read('quiz.html');
  assert.doesNotMatch(html, /class=["']app-header|\[(?:Brain|Life|Book|Group|Back|Done)\]/i);
  assert.match(html, /class=["']page-heading/);
});
