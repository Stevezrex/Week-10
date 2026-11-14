// Writes public/index.html (with the static Netlify Forms definition) and public/assessor.html.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(root, 'week.config.json'), 'utf8'));

const standard = ['attempt_id', 'learner_name', 'learner_email', 'attempt_no', 'started_at', 'submitted_at', 'submit_reason', 'score'];
const long = new Set(['answers_json', 'marks_json', 'opening_statement', 'closing_recap', 'minute_text', 'followup_message']);
const fields = [...standard, 'marks_json', 'answers_json', ...cfg.answerColumns];
const seen = new Set();
const inputs = fields
  .filter((f) => !seen.has(f) && seen.add(f))
  .map((f) => (long.has(f) ? `    <textarea name="${f}"></textarea>` : `    <input type="text" name="${f}">`))
  .join('\n');

const head = (title, script) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<link rel="icon" href="/img/kobamart-mark.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/inter-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/app.css">
<script type="module" src="${script}"></script>
</head>
<body>`;

writeFileSync(join(root, 'public/index.html'), `${head('Week ' + cfg.week + ': ' + cfg.title, '/js/app.mjs')}
<a class="skip-link" href="#main">Skip to content</a>
<div id="root"></div>
<form name="${cfg.formName}" method="POST" data-netlify="true" hidden>
    <input type="hidden" name="form-name" value="${cfg.formName}">
${inputs}
</form>
</body>
</html>
`);

writeFileSync(join(root, 'public/assessor.html'), `${head('Assessor: Week ' + cfg.week, '/js/assessor.mjs')}
<a class="skip-link" href="#main">Skip to content</a>
<div id="root"></div>
</body>
</html>
`);
console.log('html written');
