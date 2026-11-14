// Generates public/data/*.json (no marks) and the private marking guide (with marks).
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from './content.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const write = (rel, data) => {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 1) + '\n');
};

const SECRET_KEYS = new Set(['marks', 'correct', 'max', 'rules']);
const strip = (v) => {
  if (Array.isArray(v)) return v.map(strip);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) if (!SECRET_KEYS.has(k)) out[k] = strip(x);
    return out;
  }
  return v;
};

const pub = Object.fromEntries(C.items.map((i) => [i.key, strip(i)]));
const byScreen = (s) => C.items.filter((i) => i.screen === s).map((i) => pub[i.key]);

const beats = C.beats.map((b) => ({ ...b, prompts: b.prompts.map((k) => pub[k]) }));

write('public/data/case.json', {
  meeting: C.meeting,
  company: C.company,
  people: C.people.map(({ authority, ...p }) => ({ ...p, authority })),
  availability: C.availability,
  documents: C.documents,
  guidance: C.guidance,
  prepare: { sections: C.sections.prepare, items: byScreen('prepare') },
});
write('public/data/beats.json', { beats });
write('public/data/records.json', {
  notes: C.notes,
  sections: C.sections.records,
  decisionColumns: C.decisionColumns,
  items: byScreen('records'),
});

// Private guide: every item with options and marks.
const itemsByKey = Object.fromEntries(C.items.map((i) => [i.key, i]));
write('netlify/functions/lib/marking-guide.json', {
  order: C.items.map((i) => i.key),
  items: itemsByKey,
});

console.log(`items: ${C.items.length}`);
