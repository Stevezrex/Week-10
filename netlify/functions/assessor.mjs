import week from '../../week.config.json' with { type: 'json' };
import { createHash } from 'node:crypto';
import { getJSON, setJSON, delKey } from './lib/blobs.mjs';
import { json, readSession, makeCookie, clearCookie, sameSecret } from './lib/session.mjs';
import { loadAll, getLearner, workKey, finalKey, MAX_ATTEMPTS } from './lib/attempts.mjs';
import { markAnswers, formatAnswer, guideOrder, itemMeta, maxMarks } from './lib/marking.mjs';

export const config = { path: '/api/assessor' };

const EIGHT_HOURS = 8 * 60 * 60;
const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60 * 1000;

const clientId = (req) =>
  req.headers.get('x-nf-client-connection-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';

const csvCell = (v) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function exportRows(all, drafts) {
  const rows = [];
  for (const { learner, attempts } of all) {
    for (const a of attempts) {
      if (a.final) {
        rows.push({ status: 'final', ...a.final });
      } else if (drafts && a.work) {
        const { score, marks } = markAnswers(a.work.answers);
        rows.push({
          status: 'draft',
          attempt_id: a.work.attemptId,
          learner_name: learner.name,
          learner_email: learner.email,
          attempt_no: a.n,
          started_at: a.work.startedAt,
          submitted_at: '',
          submit_reason: 'open',
          score,
          marks,
          answers: a.work.answers,
        });
      }
    }
  }
  return rows;
}

const head = ['status', 'attempt_id', 'learner_name', 'learner_email', 'attempt_no', 'started_at', 'submitted_at', 'submit_reason', 'score', 'marks_json', ...week.answerColumns];

function toCsv(rows) {
  const lines = [head.join(',')];
  for (const r of rows) {
    const cells = [
      r.status, r.attempt_id, r.learner_name, r.learner_email, r.attempt_no, r.started_at, r.submitted_at,
      r.submit_reason, r.score, JSON.stringify(r.marks),
      ...week.answerColumns.map((c) => formatAnswer(c, r.answers[c])),
    ];
    lines.push(cells.map(csvCell).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}

const toJson = (rows) =>
  JSON.stringify(
    rows.map((r) => ({
      status: r.status, attempt_id: r.attempt_id, learner_name: r.learner_name, learner_email: r.learner_email,
      attempt_no: r.attempt_no, started_at: r.started_at, submitted_at: r.submitted_at, submit_reason: r.submit_reason,
      score: r.score, marks: r.marks,
      answers_text: Object.fromEntries(week.answerColumns.map((c) => [c, formatAnswer(c, r.answers[c])])),
      answers: r.answers,
    })),
    null, 2,
  );

const ACTIONS = new Set(['signin', 'signout', 'me', 'roster', 'attempt', 'export']);

// One log line per failure: function, step, reason. No names or emails.
export default async (req) => {
  const ctx = { step: 'request' };
  try {
    return await handle(req, ctx);
  } catch (e) {
    const reason = String(e?.message || e).replace(/\S+@\S+/g, '[email]').slice(0, 160);
    console.error(`[assessor] step=${ctx.step} reason=${reason}`);
    return json({ error: 'server', message: 'Something went wrong. Try again.' }, 500);
  }
};

async function handle(req, ctx) {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const action = body?.action;
  // A malformed request is refused before any Blob read.
  if (!body || typeof body !== 'object' || !ACTIONS.has(action)) return json({ error: 'bad_request' }, 400);
  if (action === 'attempt' && (!Number.isInteger(Number(body.n)) || Number(body.n) < 1 || Number(body.n) > MAX_ATTEMPTS || !String(body.email || '').includes('@'))) return json({ error: 'bad_request' }, 400);
  ctx.step = action;

  if (action === 'signin') {
    const pass = process.env.ASSESSOR_PASSCODE;
    // Five wrong passcodes lock sign in for 15 minutes. Blobs are written only on a wrong passcode.
    const lockKey = `lock/${createHash('sha256').update(clientId(req)).digest('hex').slice(0, 24)}`;
    const lock = await getJSON(lockKey);
    const now = Date.now();
    if (lock?.until && now < lock.until) return json({ error: 'locked', message: 'Too many wrong passcodes. Try again in 15 minutes.' }, 429);
    if (!pass || !sameSecret(body.passcode || '', pass)) {
      const fresh = !lock || now - lock.first > LOCK_MS;
      const n = fresh ? 1 : lock.n + 1;
      await setJSON(lockKey, { n, first: fresh ? now : lock.first, until: n >= LOCK_AFTER ? now + LOCK_MS : 0 });
      return json({ error: 'passcode', message: 'Passcode not accepted.' }, 401);
    }
    if (lock) await delKey(lockKey);
    return json({ ok: true }, 200, { 'set-cookie': makeCookie({ r: 'a' }, EIGHT_HOURS) });
  }

  const sess = readSession(req);
  if (!sess || sess.r !== 'a') return json({ error: 'auth' }, 401);

  if (action === 'signout') return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
  if (action === 'me') return json({ ok: true });

  if (action === 'roster') {
    const all = await loadAll();
    const rows = all.map(({ learner, attempts }) => {
      const open = attempts.find((a) => a.work && !a.final);
      const finals = attempts.filter((a) => a.final);
      const last = finals[finals.length - 1];
      return {
        name: learner.name,
        email: learner.email,
        attempts: `${learner.attempts} of ${MAX_ATTEMPTS}`,
        status: open ? `In progress (attempt ${open.n})` : learner.attempts === 0 ? 'Not started' : 'Submitted',
        submittedAt: last ? last.final.submitted_at : '',
        list: attempts.map((a) => ({
          n: a.n,
          state: a.final ? 'Submitted' : 'Open',
          submittedAt: a.final?.submitted_at || '',
          reason: a.final?.submit_reason || '',
          score: a.final ? a.final.score : null,
        })),
      };
    });
    return json({ ok: true, rows });
  }

  if (action === 'attempt') {
    const email = String(body.email || '').toLowerCase();
    const n = Number(body.n);
    const learner = await getLearner(email);
    if (!learner || n > learner.attempts) return json({ error: 'missing' }, 404);
    const [work, final] = await Promise.all([getJSON(workKey(email, n)), getJSON(finalKey(email, n))]);
    const entry = { learner };
    const a = work || final ? { n, work, final } : null;
    if (!a) return json({ error: 'missing' }, 404);
    const src = a.final || { answers: a.work.answers, ...markAnswers(a.work.answers), started_at: a.work.startedAt };
    const items = guideOrder.map((key) => ({
      ...itemMeta(key),
      answer: formatAnswer(key, src.answers[key]),
      mark: src.marks ? src.marks[key] ?? null : null,
      max: maxMarks(key),
    }));
    return json({
      ok: true,
      learner: { name: entry.learner.name, email: entry.learner.email },
      attempt: {
        n, state: a.final ? 'Submitted' : 'Open', started_at: src.started_at,
        submitted_at: a.final?.submitted_at || '', submit_reason: a.final?.submit_reason || '', score: src.score,
      },
      items,
    });
  }

  if (action === 'export') {
    const all = await loadAll();
    const rows = exportRows(all, !!body.drafts);
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    if (body.format === 'json') {
      return new Response(toJson(rows), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'content-disposition': `attachment; filename="week10-export-${stamp}.json"`, 'cache-control': 'no-store' },
      });
    }
    return new Response(toCsv(rows), {
      headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="week10-export-${stamp}.csv"`, 'cache-control': 'no-store' },
    });
  }

  return json({ error: 'unknown_action' }, 400);
}
