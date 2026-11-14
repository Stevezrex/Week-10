import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryStore } from './memory-store.mjs';

process.env.SESSION_SECRET = 'a'.repeat(64);
process.env.ASSESSOR_PASSCODE = 'correct-horse-battery';
process.env.URL = 'https://w10.test';
globalThis.__W10_STORE__ = memoryStore();

const posts = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => { posts.push({ url, body: new URLSearchParams(init.body) }); return new Response('', { status: 200 }); };

const learner = (await import('../../netlify/functions/learner.mjs')).default;
const assessor = (await import('../../netlify/functions/assessor.mjs')).default;
const M = await import('../../netlify/functions/lib/marking.mjs');
const N = await import('../../netlify/functions/lib/names.mjs');
const guide = (await import('../../netlify/functions/lib/marking-guide.json', { with: { type: 'json' } })).default;

const call = async (fn, body, cookie) => {
  const res = await fn(new Request('http://x/api', { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) }));
  const sc = res.headers.get('set-cookie');
  const type = res.headers.get('content-type') || '';
  return { status: res.status, data: type.includes('json') ? await res.json() : await res.text(), cookie: sc ? sc.split(';')[0] : null, headers: res.headers };
};

/* Perfect answers, built from the guide. */
function perfect() {
  const a = {};
  for (const key of guide.order) {
    const it = guide.items[key];
    if (it.typed) { a[key] = `typed ${key}`; continue; }
    const best = (opts) => [...opts].sort((x, y) => (y.marks ?? 0) - (x.marks ?? 0))[0].id;
    if (it.type === 'single') a[key] = best(it.options);
    else if (it.type === 'composite') a[key] = Object.fromEntries(it.fields.map((f) => [f.id, best(f.options)]));
    else if (it.type === 'order') a[key] = it.ruleset === 'agenda' ? ['opening', 'complaint', 'option', 'budget', 'decide'] : [...it.rules.order, it.rules.last];
    else if (it.type === 'minutes') a[key] = { opening: 3, complaint: 5, option: 8, budget: 4, decide: 10 };
    else if (it.type === 'ticks') a[key] = it.correct;
  }
  // D1 related action and D2 related action: D2 must be A3
  return a;
}

test('maximum server marks add up to 75', () => {
  const total = guide.order.reduce((s, k) => s + (M.maxMarks(k) ?? 0), 0);
  assert.equal(total, 75);
  const stage = (pre) => guide.order.filter((k) => guide.items[k].screen === pre).reduce((s, k) => s + (M.maxMarks(k) ?? 0), 0);
  assert.equal(stage('prepare'), 30);
  assert.equal(stage('meeting'), 25 - 0);
  assert.equal(stage('records'), 20);
});

test('perfect answers score 75 and blank answers score 0', () => {
  assert.equal(M.markAnswers(perfect()).score, 75);
  assert.equal(M.markAnswers({}).score, 0);
  assert.equal(M.markAnswers(null).score, 0);
});

test('no negative marks anywhere', () => {
  const a = perfect();
  a.p3_papers = ['log', 'staff'];
  a.p4_invitation = ['prices', 'reclink'];
  a.p2_invitees = Object.fromEntries(['ifeoma', 'tunde', 'amaka', 'kemi', 'chinedu', 'sade', 'femi', 'dayo'].map((p) => [p, 'no']));
  const { marks, score } = M.markAnswers(a);
  assert.ok(Object.values(marks).every((m) => m >= 0));
  assert.equal(marks.p3_papers, 0);
  assert.equal(marks.p4_invitation, 0);
  assert.equal(marks.p2_invitees, 2); // chinedu, sade, femi, dayo not invited
  assert.ok(score > 0);
});

test('item rules', () => {
  const mk = (k, v) => M.markItem(k, v);
  assert.equal(mk('p2_invitees', { ifeoma: 'req', tunde: 'req', amaka: 'req', kemi: 'opt', chinedu: 'no', sade: 'no', femi: 'no', dayo: 'no' }), 4);
  assert.equal(mk('p2_invitees', { ifeoma: 'req', tunde: 'opt', amaka: 'req', kemi: 'req', chinedu: 'req', sade: 'no', femi: 'no', dayo: 'no' }), 3);
  assert.equal(mk('p3_order', ['opening', 'complaint', 'option', 'budget', 'decide']), 3);
  assert.equal(mk('p3_order', ['opening', 'budget', 'option', 'complaint', 'decide']), 2);
  assert.equal(mk('p3_order', ['complaint', 'opening', 'budget', 'option', 'decide']), 1);
  assert.equal(mk('p3_minutes', { opening: 3, complaint: 5, option: 8, budget: 4, decide: 10 }), 2);
  assert.equal(mk('p3_minutes', { opening: 5, complaint: 10, option: 6, budget: 4, decide: 5 }), 1);
  assert.equal(mk('p3_minutes', { opening: 5, complaint: 10, option: 6, budget: 4, decide: 6 }), 0);
  assert.equal(mk('p4_invitation', ['subject', 'purpose', 'when', 'link', 'agenda', 'contrib']), 3);
  assert.equal(mk('p4_invitation', ['subject', 'purpose', 'when', 'link']), 2);
  assert.equal(mk('p4_invitation', ['subject', 'purpose']), 1);
  assert.equal(mk('p4_invitation', ['subject']), 0);
  assert.equal(mk('m2_steps', ['s1', 's2', 's3', 's4', 's5', 's6']), 6);
  assert.equal(mk('m2_steps', ['s6', 's5', 's4', 's3', 's2', 's1']), 0);
  assert.equal(mk('m2_steps', ['s1', 's2', 's3', 's4', 's6', 's5']), 5); // 5 pairs credit, last card not last
  assert.equal(mk('recipients', ['ifeoma', 'tunde', 'amaka', 'kemi']), 1);
  assert.equal(mk('recipients', ['ifeoma', 'tunde', 'amaka', 'kemi', 'chinedu']), 1);
  assert.equal(mk('recipients', ['ifeoma', 'tunde', 'amaka']), 0.5);
  assert.equal(mk('recipients', ['ifeoma', 'tunde', 'amaka', 'kemi', 'femi']), 0);
  assert.equal(mk('attachments', ['minutes', 'actions']), 2);
  assert.equal(mk('attachments', ['actions']), 1);
  assert.equal(mk('attachments', ['log', 'rec']), 0);
  assert.equal(mk('d1', { wording: 'w_plain', authority: 'au_ifeoma', status: 'approved', condition: 'co_none' }), 3);
  assert.equal(mk('d2', { wording: 'w_defer', status: 'deferred', action: 'a3' }), 3);
  assert.equal(mk('a1', { owner: 'tunde', due: 'tue1' }), 2);
  assert.equal(mk('a1', { owner: 'tunde', due: 'asap' }), 1);
  assert.equal(mk('m3_absent', 'absent_delay'), 2);
  assert.equal(mk('opening_statement', 'long text'), 0);
});

test('name matching', () => {
  assert.ok(N.namesMatch('Adaeze Okonkwo', 'okonkwo adaeze'));
  assert.ok(N.namesMatch('Adaeze Okonkwo', 'Adaeze C. Okonkwo'));
  assert.ok(N.namesMatch('Adaeze Okonkwo', 'Adaeze Okonkwo-Obi'));
  assert.ok(N.namesMatch('Adaeze Okonkwo', 'Adaeze Okonkwa'));
  assert.ok(N.namesMatch('José Álvarez', 'jose alvarez'));
  assert.ok(!N.namesMatch('Adaeze Okonkwo', 'Adaeze Okoro'));
  assert.ok(!N.namesMatch('Tunde Bello', 'Tunde Belo'));
  assert.ok(!N.namesMatch('John Smith', 'John Doe'));
});

let cookie;
test('enter, identity rules, start, save, reset', async () => {
  let r = await call(learner, { action: 'enter', name: 'Chioma Eze', email: 'Chioma@Example.com ' });
  assert.equal(r.status, 200);
  cookie = r.cookie;
  assert.equal(r.data.status.attemptsLeft, 3);
  assert.equal(r.data.status.open, null);

  r = await call(learner, { action: 'enter', name: 'Someone Else', email: 'chioma@example.com' });
  assert.equal(r.status, 409);
  assert.equal(r.data.message, 'This email is registered under a different name. Contact your tutor.');

  r = await call(learner, { action: 'enter', name: 'chioma EZE', email: 'other@example.com' });
  assert.equal(r.status, 409);
  assert.equal(r.data.message, 'This name is already registered under another email. Contact your tutor.');

  r = await call(learner, { action: 'me' });
  assert.equal(r.status, 401);

  r = await call(learner, { action: 'start' }, cookie);
  assert.equal(r.data.status.open.n, 1);
  assert.equal(r.data.status.attemptsLeft, 2);
  const dl = Date.parse(r.data.status.open.deadline) - Date.parse(r.data.status.open.startedAt);
  assert.equal(dl, 120 * 60 * 1000);

  r = await call(learner, { action: 'save', n: 1, answers: { p1_outcome: 'decision', junk: 'x' }, clientUpdatedAt: 111 }, cookie);
  assert.equal(r.status, 200);
  r = await call(learner, { action: 'me' }, cookie);
  assert.deepEqual(r.data.work.answers, { p1_outcome: 'decision' });

  r = await call(learner, { action: 'reset', n: 1 }, cookie);
  assert.equal(r.status, 200);
  r = await call(learner, { action: 'reset', n: 1 }, cookie);
  assert.equal(r.status, 409);
  r = await call(learner, { action: 'me' }, cookie);
  assert.deepEqual(r.data.work.answers, {});
  assert.equal(r.data.status.open.resetUsed, true);
});

test('submit records once, posts to Forms once, signs out', async () => {
  posts.length = 0;
  const answers = perfect();
  let r = await call(learner, { action: 'submit', n: 1, answers, gen: 1 }, cookie);
  assert.equal(r.status, 200);
  assert.equal(r.data.ended, true);
  assert.equal(r.data.attemptsLeft, 2);
  assert.ok(!('score' in r.data));
  assert.match(r.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal(posts.length, 1);
  const p = posts[0].body;
  assert.equal(p.get('form-name'), 'week10-results');
  assert.equal(p.get('score'), '75');
  assert.equal(p.get('submit_reason'), 'submit');
  assert.equal(p.get('opening_statement'), 'typed opening_statement');
  assert.ok(p.get('p5_recording').startsWith('Record to check the minutes'));
  assert.equal(JSON.parse(p.get('marks_json')).p1_purpose, 3);

  // second submit returns without a second record
  const again = await call(learner, { action: 'enter', name: 'Chioma Eze', email: 'chioma@example.com' });
  cookie = again.cookie;
  r = await call(learner, { action: 'me' }, cookie);
  assert.equal(r.data.status.open, null);
  assert.equal(posts.length, 1);
});

test('second attempt, then deadline ends it with its saved work', async () => {
  let r = await call(learner, { action: 'start' }, cookie);
  assert.equal(r.data.status.open.n, 2);
  await call(learner, { action: 'save', n: 2, answers: { p1_purpose: 'decide', p1_outcome: 'decision' }, clientUpdatedAt: 5 }, cookie);
  // push the deadline into the past
  const store = globalThis.__W10_STORE__;
  const key = [...store._dump().keys()].find((k) => k.endsWith('/2') && k.startsWith('work/'));
  const w = await store.get(key);
  w.deadline = new Date(Date.now() - 1000).toISOString();
  await store.setJSON(key, w);
  posts.length = 0;
  r = await call(learner, { action: 'save', n: 2, answers: { p1_purpose: 'compare' }, clientUpdatedAt: 9 }, cookie);
  assert.equal(r.data.ended, true);
  assert.equal(r.data.reason, 'deadline');
  assert.equal(posts.length, 1);
  assert.equal(posts[0].body.get('submit_reason'), 'deadline');
  assert.equal(posts[0].body.get('score'), '6'); // late save ignored, earlier work marked
});

test('an abandoned attempt past its deadline is finalized by the assessor', async () => {
  let r = await call(learner, { action: 'enter', name: 'Chioma Eze', email: 'chioma@example.com' });
  cookie = r.cookie;
  r = await call(learner, { action: 'start' }, cookie);
  assert.equal(r.data.status.open.n, 3);
  await call(learner, { action: 'save', n: 3, answers: { p1_purpose: 'decide' }, clientUpdatedAt: 5 }, cookie);
  const store = globalThis.__W10_STORE__;
  const key = [...store._dump().keys()].find((k) => k.endsWith('/3') && k.startsWith('work/'));
  const w = await store.get(key);
  w.deadline = new Date(Date.now() - 1000).toISOString();
  await store.setJSON(key, w);

  r = await call(assessor, { action: 'roster' });
  assert.equal(r.status, 401);
  r = await call(assessor, { action: 'signin', passcode: 'wrong' });
  assert.equal(r.status, 401);
  r = await call(assessor, { action: 'signin', passcode: 'correct-horse-battery' });
  assert.equal(r.status, 200);
  const ac = r.cookie;

  r = await call(assessor, { action: 'roster' }, ac);
  assert.equal(r.data.rows.length, 1);
  assert.equal(r.data.rows[0].attempts, '3 of 3');
  assert.equal(r.data.rows[0].status, 'Submitted');

  r = await call(assessor, { action: 'attempt', email: 'chioma@example.com', n: 1 }, ac);
  assert.equal(r.data.attempt.score, 75);
  assert.equal(r.data.items.length, 32);

  r = await call(assessor, { action: 'export', format: 'csv' }, ac);
  assert.match(r.headers.get('content-type'), /text\/csv/);
  const lines = r.data.trim().split('\r\n');
  assert.equal(lines.length > 3, true);
  assert.ok(lines[0].startsWith('status,attempt_id,learner_name'));
  r = await call(assessor, { action: 'export', format: 'json', drafts: true }, ac);
  const rows = r.data;
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((x) => x.attempt_no), [1, 2, 3]);
  assert.deepEqual(rows.map((x) => x.submit_reason), ['submit', 'deadline', 'deadline']);
});


/* ---------- Framework checks ---------- */

test('one device at a time: the newest login takes the attempt', async () => {
  const who = { name: 'Ngozi Okafor', email: 'ngozi@example.com' };
  let a = await call(learner, { action: 'enter', ...who });
  const cookieA = a.cookie;
  await call(learner, { action: 'start' }, cookieA);
  let r = await call(learner, { action: 'save', n: 1, answers: { p1_purpose: 'decide' }, clientUpdatedAt: 10 }, cookieA);
  assert.equal(r.status, 200);

  const b = await call(learner, { action: 'enter', ...who });
  const cookieB = b.cookie;
  assert.notEqual(cookieA, cookieB);
  assert.deepEqual(b.data.work.answers, { p1_purpose: 'decide' });

  r = await call(learner, { action: 'save', n: 1, answers: { p1_purpose: 'compare' }, clientUpdatedAt: 99 }, cookieA);
  assert.equal(r.status, 409);
  assert.equal(r.data.error, 'moved');
  r = await call(learner, { action: 'reset', n: 1 }, cookieA);
  assert.equal(r.data.error, 'moved');
  r = await call(learner, { action: 'submit', n: 1, answers: { p1_purpose: 'compare' }, reason: 'submit' }, cookieA);
  assert.equal(r.data.error, 'moved');
  r = await call(learner, { action: 'me' }, cookieA);
  assert.equal(r.data.error, 'moved');

  r = await call(learner, { action: 'save', n: 1, answers: { p1_purpose: 'decide', p1_outcome: 'decision' }, clientUpdatedAt: 20 }, cookieB);
  assert.equal(r.status, 200);
  r = await call(learner, { action: 'me' }, cookieB);
  assert.deepEqual(r.data.work.answers, { p1_purpose: 'decide', p1_outcome: 'decision' });

  // revision rises with each accepted save
  r = await call(learner, { action: 'me' }, cookieB);
  assert.equal(r.data.work.rev, 2);

  // a save sent before a reset is ignored and writes nothing
  const store = globalThis.__W10_STORE__;
  r = await call(learner, { action: 'reset', n: 1 }, cookieB);
  assert.equal(r.status, 200);
  assert.equal(r.data.gen, 1);
  store.reset();
  r = await call(learner, { action: 'save', n: 1, answers: { p1_purpose: 'compare' }, gen: 0 }, cookieB);
  assert.equal(r.status, 200);
  assert.equal(r.data.stale, true);
  assert.equal(store.ops.set, 0);
  r = await call(learner, { action: 'me' }, cookieB);
  assert.deepEqual(r.data.work.answers, {});
  r = await call(learner, { action: 'save', n: 1, answers: { p1_purpose: 'decide' }, gen: 1 }, cookieB);
  assert.equal(r.data.stale, false);
});

test('a save is one read and one write, and is refused once the attempt is closed', async () => {
  const store = globalThis.__W10_STORE__;
  const cookieB = (await call(learner, { action: 'enter', name: 'Ngozi Okafor', email: 'ngozi@example.com' })).cookie;
  store.reset();
  let r = await call(learner, { action: 'save', n: 1, answers: { p1_purpose: 'decide' }, gen: 1 }, cookieB);
  assert.equal(r.status, 200);
  assert.deepEqual({ get: store.ops.get, set: store.ops.set, list: store.ops.list }, { get: 1, set: 1, list: 0 });

  r = await call(learner, { action: 'submit', n: 1, answers: { p1_purpose: 'decide' }, gen: 1, reason: 'submit' }, cookieB);
  assert.equal(r.data.ended, true);
  r = await call(learner, { action: 'save', n: 1, answers: { p1_purpose: 'compare' }, clientUpdatedAt: 99 }, cookieB);
  assert.equal(r.status, 409);
  assert.equal(r.data.error, 'no_attempt');
});

test('five wrong assessor passcodes lock sign in for that address', async () => {
  const hdr = (ip, body) => new Request('http://x/api', { method: 'POST', headers: { 'content-type': 'application/json', 'x-nf-client-connection-ip': ip }, body: JSON.stringify(body) });
  for (let i = 0; i < 5; i++) {
    const res = await assessor(hdr('10.0.0.9', { action: 'signin', passcode: 'nope' + i }));
    assert.equal(res.status, 401);
  }
  let res = await assessor(hdr('10.0.0.9', { action: 'signin', passcode: 'correct-horse-battery' }));
  assert.equal(res.status, 429);
  // another address is not locked, and a good passcode clears its own counter
  res = await assessor(hdr('10.0.0.10', { action: 'signin', passcode: 'wrong' }));
  assert.equal(res.status, 401);
  res = await assessor(hdr('10.0.0.10', { action: 'signin', passcode: 'correct-horse-battery' }));
  assert.equal(res.status, 200);
  assert.equal([...globalThis.__W10_STORE__._dump().keys()].filter((k) => k.startsWith('lock/')).length, 1);
});

test('export of 100 learners runs in parallel batches of 25', async () => {
  const store = globalThis.__W10_STORE__;
  for (let i = 0; i < 100; i++) {
    const word = () => Array.from({ length: 9 }, () => 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]).join('');
    const who = { name: `${word()} ${word()}`, email: `bulk${i}@example.com` };
    const e = await call(learner, { action: 'enter', ...who });
    await call(learner, { action: 'start' }, e.cookie);
    await call(learner, { action: 'submit', n: 1, answers: perfect(), reason: 'submit' }, e.cookie);
  }
  const ac = (await call(assessor, { action: 'signin', passcode: 'correct-horse-battery' }, null)).cookie
    || (await assessor(new Request('http://x/api', { method: 'POST', headers: { 'content-type': 'application/json', 'x-nf-client-connection-ip': '10.0.0.10' }, body: JSON.stringify({ action: 'signin', passcode: 'correct-horse-battery' }) }))).headers.get('set-cookie').split(';')[0];
  store.delay = 20;
  store.reset();
  const t0 = Date.now();
  const r = await call(assessor, { action: 'export', format: 'csv' }, ac);
  const ms = Date.now() - t0;
  store.delay = 0;
  const lines = r.data.trim().split('\r\n');
  assert.ok(lines.length >= 101);
  assert.ok(store.maxInflight <= 25, `in flight ${store.maxInflight}`);
  assert.ok(ms < 5000, `export took ${ms} ms at 20 ms a read`);
});

test('malformed requests are refused before any Blob read', async () => {
  const store = globalThis.__W10_STORE__;
  const cookie = (await call(learner, { action: 'enter', name: 'Ngozi Okafor', email: 'ngozi@example.com' })).cookie;
  store.reset();
  for (const body of [{ action: 'nope' }, { action: 'save', n: 'x', answers: {} }, { action: 'save', n: 99, answers: {} }, { action: 'save', n: 1, answers: null }, { action: 'reset', n: 0 }, [], 'x']) {
    const r = await call(learner, body, cookie);
    assert.equal(r.status, 400, JSON.stringify(body));
  }
  const bad = await learner(new Request('http://x/api', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{oops' }));
  assert.equal(bad.status, 400);
  const ac = (await call(assessor, { action: 'signin', passcode: 'correct-horse-battery' }, null)).cookie;
  store.reset();
  const r2 = await call(assessor, { action: 'attempt', email: 'nobody', n: 1 }, ac);
  assert.equal(r2.status, 400);
  assert.equal(store.ops.get + store.ops.set + store.ops.list, 0);
});

test('a failed call logs one line with no name or email', async () => {
  const store = globalThis.__W10_STORE__;
  const logs = [];
  const orig = console.error;
  console.error = (...a) => logs.push(a.join(' '));
  const realGet = store.get;
  store.get = async () => { throw new Error('Blob error for ngozi@example.com'); };
  const cookie = 'dummy';
  const res = await learner(new Request('http://x/api', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'enter', name: 'Ngozi Okafor', email: 'ngozi@example.com' }) }));
  store.get = realGet;
  console.error = orig;
  assert.equal(res.status, 500);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /^\[learner\] step=enter reason=/);
  assert.ok(!/ngozi|Okafor/.test(logs[0]));
});

test('export before any learner holds the header only, then one row after a submit', async () => {
  const saved = globalThis.__W10_STORE__;
  globalThis.__W10_STORE__ = memoryStore();
  try {
    const ac = (await call(assessor, { action: 'signin', passcode: 'correct-horse-battery' }, null)).cookie;
    let r = await call(assessor, { action: 'export', format: 'csv' }, ac);
    assert.equal(r.status, 200);
    assert.equal(r.data.trim().split('\r\n').length, 1);
    assert.ok(r.data.startsWith('status,attempt_id,learner_name'));
    const e = await call(learner, { action: 'enter', name: 'Tola Ibrahim', email: 'tola@example.com' });
    await call(learner, { action: 'start' }, e.cookie);
    await call(learner, { action: 'submit', n: 1, answers: perfect(), reason: 'submit' }, e.cookie);
    r = await call(assessor, { action: 'export', format: 'csv' }, ac);
    assert.equal(r.data.trim().split('\r\n').length, 2);
  } finally {
    globalThis.__W10_STORE__ = saved;
  }
});

test('submit twice at once records one attempt and posts one row', async () => {
  const e = await call(learner, { action: 'enter', name: 'Kunle Adebayo', email: 'kunle@example.com' });
  await call(learner, { action: 'start' }, e.cookie);
  posts.length = 0;
  const [a, b] = await Promise.all([
    call(learner, { action: 'submit', n: 1, answers: perfect(), reason: 'submit' }, e.cookie),
    call(learner, { action: 'submit', n: 1, answers: perfect(), reason: 'submit' }, e.cookie),
  ]);
  assert.equal(a.data.ended, true);
  assert.equal(b.data.ended, true);
  assert.equal(posts.length, 1);
  const ac = (await call(assessor, { action: 'signin', passcode: 'correct-horse-battery' }, null)).cookie;
  const r = await call(assessor, { action: 'export', format: 'csv' }, ac);
  assert.equal(r.data.split('\r\n').filter((l) => l.includes('kunle@example.com')).length, 1);
});
