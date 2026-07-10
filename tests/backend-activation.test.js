const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('backend activation checklist refuses unsafe anonymous ownership', () => {
  const text = fs.readFileSync(path.join(root, 'docs', 'backend-activation.md'), 'utf8');
  assert.match(text, /auth\.uid\(\)/);
  assert.match(text, /service.role.*never.*frontend/is);
  assert.match(text, /signed URL/i);
  assert.match(text, /RLS/i);
  assert.match(text, /cannot be completed without/i);
});
