const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('privacy documentation states the actual public static-site boundary', () => {
  const text = fs.readFileSync(path.join(root, 'PRIVACY.md'), 'utf8');
  assert.match(text, /public GitHub Pages/i);
  assert.match(text, /not authentication/i);
  assert.match(text, /do not store.*clinical/i);
  assert.match(text, /Supabase Auth/i);
  assert.match(text, /private Storage/i);
});
