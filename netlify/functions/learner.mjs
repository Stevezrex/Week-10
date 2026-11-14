import { randomUUID } from 'node:crypto';
import { getJSON } from './lib/blobs.mjs';
import { json, readSession, makeCookie, clearCookie } from './lib/session.mjs';
import { namesMatch, validName, validEmail } from './lib/names.mjs';
import {
  getLearner, listLearners, createLearner, openAttempt, statusOf, startAttempt, claimAttempt, workKey,
  saveWork, resetWork, finalizeAttempt, sweepLearner, isLate, MAX_ATTEMPTS,
} from './lib/attempts.mjs';

export const config = { path: '/api/learner' };

const SESSION_SECONDS = 8 * 60 * 60;

async function view(learner, extra = {}, known) {
  const open = known === undefined ? await openAttempt(learner) : known;
  const out = { ok: true, serverNow: Date.now(), status: statusOf(learner, open), ...extra };
  if (open) out.work = { answers: open.work.answers, rev: open.work.rev || 0, gen: open.work.gen || 0 };
  return out;
}

const ACTIONS = new Set(['enter', 'me', 'start', 'save', 'reset', 'submit', 'signout']);
const validN = (n) => Number.isInteger(n) && n >= 1 && n <= MAX_ATTEMPTS;
const bad = () => json({ error: 'bad_request' }, 400);

// One log line per failure: function, step, reason. No names or emails.
export default async (req) => {
  const ctx = { step: 'request' };
  try {
    return await handle(req, ctx);
  } catch (e) {
    const reason = String(e?.message || e).replace(/\S+@\S+/g, '[email]').slice(0, 160);
    console.error(`[learner] step=${ctx.step} reason=${reason}`);
    return json({ error: 'server', message: 'Something went wrong. Try again.' }, 500);
  }
};

async function handle(req, ctx) {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body;
  try { body = await req.json(); } catch { return bad(); }
  const action = body?.action;
  // A malformed request is refused before any Blob read.
  if (!body || typeof body !== 'object' || !ACTIONS.has(action)) return bad();
  if (action === 'save' && (!validN(Number(body.n)) || typeof body.answers !== 'object' || body.answers === null)) return bad();
  if ((action === 'submit' || action === 'reset') && body.n !== undefined && !validN(Number(body.n))) return bad();
  ctx.step = action;

  if (action === 'enter') {
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    if (!validName(name)) return json({ error: 'name', message: 'Enter your full name.' }, 400);
    if (!validEmail(email)) return json({ error: 'email', message: 'Enter a valid email address.' }, 400);

    let learner = await getLearner(email);
    if (learner) {
      if (!namesMatch(learner.name, name)) {
        return json({ error: 'email_name', message: 'This email is registered under a different name. Contact your tutor.' }, 409);
      }
    } else {
      const all = await listLearners();
      if (all.some((l) => namesMatch(l.name, name))) {
        return json({ error: 'name_email', message: 'This name is already registered under another email. Contact your tutor.' }, 409);
      }
      learner = await createLearner(name, email);
    }
    await sweepLearner(learner);
    learner = await getLearner(email);
    // Each login gets its own id. The newest login takes the open attempt.
    const device = randomUUID();
    const open = await claimAttempt(learner, device);
    return json(await view(learner, {}, open), 200, { 'set-cookie': makeCookie({ r: 'l', k: email, d: device }, SESSION_SECONDS) });
  }

  const sess = readSession(req);
  if (!sess || sess.r !== 'l') return json({ error: 'auth' }, 401);
  const device = sess.d || '';

  if (action === 'signout') return json({ ok: true }, 200, { 'set-cookie': clearCookie() });

  // Hot path: one read and one write.
  if (action === 'save') {
    const n = Number(body.n);
    const work = await getJSON(workKey(sess.k, n));
    if (!work || work.finalized) return json({ error: 'no_attempt', message: 'No attempt is open.' }, 409);
    if (isLate(work)) {
      const l = await getLearner(sess.k);
      const done = await finalizeAttempt(l, n, { reason: 'deadline' });
      return json({ ended: true, reason: 'deadline', ...done, serverNow: Date.now() }, 200, { 'set-cookie': clearCookie() });
    }
    const r = await saveWork({ email: sess.k }, n, body.answers, body.gen, device, work);
    if (r.error === 'moved') return json({ error: 'moved', message: 'This attempt was opened on another device.' }, 409);
    if (r.error) return json({ error: 'no_attempt', message: 'No attempt is open.' }, 409);
    return json({ ok: true, rev: r.work.rev || 0, gen: r.work.gen || 0, stale: !!r.stale, serverNow: Date.now() });
  }

  let learner = await getLearner(sess.k);
  if (!learner) return json({ error: 'auth' }, 401);

  // Any request after the deadline ends the attempt.
  const open0 = await openAttempt(learner);
  if (open0 && isLate(open0.work)) {
    const done = await finalizeAttempt(learner, open0.n, { reason: 'deadline' });
    return json({ ended: true, reason: 'deadline', ...done, serverNow: Date.now() }, 200, { 'set-cookie': clearCookie() });
  }

  const moved = open0 && open0.work.device && open0.work.device !== device;
  if (moved) return json({ error: 'moved', message: 'This attempt was opened on another device.' }, 409);

  if (action === 'me') return json(await view(learner, {}, open0));

  if (action === 'start') {
    const res = await startAttempt(learner, device);
    if (res.error === 'none_left') return json({ error: 'none_left', message: 'No attempts left.' }, 409);
    learner = await getLearner(learner.email);
    return json(await view(learner));
  }

  const open = open0;
  if (!open) return json({ error: 'no_attempt', message: 'No attempt is open.' }, 409);
  if (body.n && Number(body.n) !== open.n) return json({ error: 'stale', message: 'This attempt is no longer open.' }, 409);

  if (action === 'reset') {
    const r = await resetWork(learner, open.n, device);
    if (r.error === 'used') return json({ error: 'reset_used', message: 'Reset used.' }, 409);
    if (r.error) return json({ error: 'no_attempt', message: 'No attempt is open.' }, 409);
    return json({ ok: true, resetUsed: true, rev: r.work.rev, gen: r.work.gen, serverNow: Date.now() });
  }

  if (action === 'submit') {
    const done = await finalizeAttempt(learner, open.n, {
      reason: body.reason === 'timer' ? 'timer' : 'submit',
      incoming: body.answers || null,
      gen: body.gen,
      device,
    });
    if (done.error === 'moved') return json({ error: 'moved', message: 'This attempt was opened on another device.' }, 409);
    if (done.error) return json({ error: done.error }, 404);
    return json({ ended: true, ...done, serverNow: Date.now() }, 200, { 'set-cookie': clearCookie() });
  }

  return json({ error: 'unknown_action' }, 400);
}
