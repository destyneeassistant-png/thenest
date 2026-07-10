const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'dashboard.html', 'calendar.html', 'dissertation.html', 'quiz.html', 'pdf-library.html', 'notes.html', 'settings.html'];
const errors = [];
for (const page of pages) {
  const file = path.join(root, page);
  if (!fs.existsSync(file)) { errors.push(`Missing page: ${page}`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/(?:src|href)=["']([^"'#?]+)["']/g)) {
    const ref = match[1];
    if (/^(?:https?:|data:|mailto:)/.test(ref) || ref.endsWith('.html')) continue;
    if (!fs.existsSync(path.join(root, ref))) errors.push(`${page}: missing local asset ${ref}`);
  }
}
const data = fs.readFileSync(path.join(root, 'pdf-library-data.js'), 'utf8');
for (const match of data.matchAll(/"href":\s*"([^"]+)"/g)) {
  if (!fs.existsSync(path.join(root, match[1]))) errors.push(`Library entry missing file: ${match[1]}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Static app check passed: ${pages.length} pages and all library assets resolved.`);
}
