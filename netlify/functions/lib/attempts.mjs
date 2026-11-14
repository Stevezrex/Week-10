import { randomUUID } from 'node:crypto';
import config from '../../../week.config.json' with { type: 'json' };
import { getJSON, setJSON, listKeys, store, inBatches } from './blobs.mjs';
import { markAnswers, guideOrder } from './marking.mjs';
import { postToForms } from './forms.mjs';

export const MAX_ATTEMPTS = config.attempts;
export const ATTEMPT_MS = config.minutes * 60 * 1000;

const BATCH = 25;
const enc = encodeURIComponent;
export const learnerKey = (email) => `learner/${enc(email)}`;
export const workKey = (email, n) => `work/${enc(email)}/${n}`;
export const finalKey = (email, n) => `final/${enc(email)}/${n}`;

export const getLearner = (email) => getJSON(learnerKey(email));

export async function listLearners() {
  const keys = await listKeys('learner/');
  const all = await inBatches(keys, BATCH, (k) => getJSON(k));
  return all.filter(Boolean);
}

export async function createLearner(name, email) {
  const rec = { name, email, attempts: 0, createdAt: new Date().toISOString() };
  await setJSON(learnerKey(email), rec);
  return rec;
}

const MAX_TEXT = 20000;
export function cleanAnswers(input) {
  const out = {};
  if (!input || typeof input !== 'object') return out;
  const clip = (v) => {
    if (typeof v === 'string') return v.slice(0, MAX_TEXT);
    if (Array.isArray(v)) return v.slice(0, 50).map(clip);
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.entries(v).slice(0, 50).map(([k, x]) => [k.slice(0, 80), clip(x)]));
    }
    return typeof v === 'number' || typeof v === 'boolean' ? v : undefined;
  };
  for (const key of [...guideOrder, '_ui']) if (key in input) out[key] = clip(input[key]);
  return out;
}

/* Current open attempt: a work blob with no final blob. */
export async function openAttempt(learner) {
  const n = learner.attempts;
  if (!n) return null;
  const [work, fin] = await Promise.all([getJSON(workKey(learner.email, n)), getJSON(finalKey(learner.email, n))]);
  if (!work || fin) return null;
  return { n, work };
}

export const statusOf = (learner, open) => ({
  name: learner.name,
  email: learner.email,
  attemptsStarted: learner.attempts,
  attemptsLeft: MAX_ATTEMPTS - learner.attempts,
  max: MAX_ATTEMPTS,
  open: open
    ? {
        n: open.n,
        startedAt: open.work.startedAt,
        deadline: open.work.deadline,
        resetUsed: !!open.work.resetUsed,
      }
    : null,
});

export async function startAttempt(learner, device = '') {
  const open = await openAttempt(learner);
  if (open) return { error: 'open', open };
  if (learner.attempts >= MAX_ATTEMPTS) return { error: 'none_left' };
  const n = learner.attempts + 1;
  const now = Date.now();
  const work = {
    attemptId: randomUUID(),
    answers: {},
    resetUsed: false,
    device,
    startedAt: new Date(now).toISOString(),
    deadline: new Date(now + ATTEMPT_MS).toISOString(),
    updatedAt: new Date(now).toISOString(),
    rev: 0,
    gen: 0,
  };
  const res = await setJSON(workKey(learner.email, n), work, { onlyIfNew: true });
  if (!res.modified) return { error: 'open', open: await openAttempt({ ...learner, attempts: n }) };
  learner.attempts = n;
  await setJSON(learnerKey(learner.email), learner);
  return { open: { n, work } };
}

/* The newest login takes the attempt. Saves from an older login are refused. */
export async function claimAttempt(learner, device) {
  const open = await openAttempt(learner);
  if (!open) return null;
  if (open.work.device !== device) {
    open.work = { ...open.work, device };
    await setJSON(workKey(learner.email, open.n), open.work);
  }
  return open;
}

/*
 One read and one write. A save is ignored when the attempt is closed, comes from an older login,
 or was sent before a reset (older generation). Each accepted save raises the revision.
*/
export async function saveWork(learner, n, answers, gen, device = null, known = null) {
  const key = workKey(learner.email, n);
  const work = known || (await getJSON(key));
  if (!work) return { error: 'missing' };
  if (work.finalized) return { error: 'closed' };
  if (device !== null && work.device && work.device !== device) return { error: 'moved' };
  if ((Number(gen) || 0) !== (work.gen || 0)) return { work, stale: true };
  const next = { ...work, answers: cleanAnswers(answers), rev: (work.rev || 0) + 1, updatedAt: new Date().toISOString() };
  await setJSON(key, next);
  return { work: next };
}

export async function resetWork(learner, n, device = null) {
  const key = workKey(learner.email, n);
  const work = await getJSON(key);
  if (!work || work.finalized) return { error: 'missing' };
  if (device !== null && work.device && work.device !== device) return { error: 'moved' };
  if (work.resetUsed) return { error: 'used' };
  const next = { ...work, answers: {}, resetUsed: true, rev: (work.rev || 0) + 1, gen: (work.gen || 0) + 1, updatedAt: new Date().toISOString() };
  await setJSON(key, next);
  return { work: next };
}

export const isLate = (work, now = Date.now()) => now > Date.parse(work.deadline);

/*
 Final submission, in order:
 1 check the deadline, 2 read the latest work, 3 mark, 4 write final once, 5 post to Forms once, 6 return status.
 `incoming` carries the browser's latest answers for an on time submit. It is ignored for a late request.
*/
export async function finalizeAttempt(learner, n, { reason = 'submit', incoming = null, gen = 0, device = null } = {}) {
  const now = Date.now();
  const key = workKey(learner.email, n);
  let work = await getJSON(key);
  if (!work) return { error: 'missing' };

  const late = isLate(work, now);
  const timerHit = reason === 'timer' && now >= Date.parse(work.deadline) - 15000;
  const submit_reason = late || timerHit ? 'deadline' : 'submit';

  if (incoming && !late) {
    const r = await saveWork(learner, n, incoming, gen, device, work);
    if (r.error === 'moved') return r;
    if (r.work) work = r.work;
  }

  const { score, marks } = markAnswers(work.answers);
  const rec = {
    attempt_id: work.attemptId,
    learner_name: learner.name,
    learner_email: learner.email,
    attempt_no: n,
    started_at: work.startedAt,
    submitted_at: new Date(now).toISOString(),
    submit_reason,
    score,
    marks,
    answers: work.answers,
  };

  const res = await setJSON(finalKey(learner.email, n), rec, { onlyIfNew: true });
  if (res.modified) {
    const sent = await postToForms(rec);
    await setJSON(key, { ...work, finalized: true, forms: sent ? 'sent' : 'failed' });
  }
  return { status: 'recorded', attemptNo: n, attemptsLeft: MAX_ATTEMPTS - learner.attempts };
}

/* Finalize any attempt that ran past its deadline without a submit. */
export async function sweepLearner(learner) {
  const open = await openAttempt(learner);
  if (open && isLate(open.work)) {
    await finalizeAttempt(learner, open.n, { reason: 'deadline' });
    return true;
  }
  return false;
}

/*
 Every attempt of every learner. Reads run in parallel batches of 25.
 With sweep on, an open attempt past its deadline is finalized first, a few at a time.
*/
export async function loadAll({ sweep = true } = {}) {
  const learners = await listLearners();
  const tasks = [];
  for (const l of learners) {
    for (let n = 1; n <= l.attempts; n++) {
      tasks.push({ l, n, key: workKey(l.email, n), kind: 'work' }, { l, n, key: finalKey(l.email, n), kind: 'final' });
    }
  }
  const got = await inBatches(tasks, BATCH, (t) => getJSON(t.key));
  const byLearner = new Map(learners.map((l) => [l.email, { learner: l, attempts: new Map() }]));
  tasks.forEach((t, i) => {
    const e = byLearner.get(t.l.email);
    const a = e.attempts.get(t.n) || { n: t.n, work: null, final: null };
    a[t.kind] = got[i];
    e.attempts.set(t.n, a);
  });

  if (sweep) {
    const overdue = [];
    for (const e of byLearner.values()) {
      for (const a of e.attempts.values()) if (a.work && !a.final && isLate(a.work)) overdue.push({ e, a });
    }
    await inBatches(overdue, 5, async ({ e, a }) => {
      await finalizeAttempt(e.learner, a.n, { reason: 'deadline' });
      a.final = await getJSON(finalKey(e.learner.email, a.n));
    });
  }

  return [...byLearner.values()]
    .map((e) => ({ learner: e.learner, attempts: [...e.attempts.values()].sort((x, y) => x.n - y.n) }))
    .sort((x, y) => x.learner.name.localeCompare(y.learner.name));
}

export { store };
