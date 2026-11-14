import config from '../../../week.config.json' with { type: 'json' };
import { formatAnswer } from './marking.mjs';

// One POST to Netlify Forms. A failure does not affect the submission.
export async function postToForms(rec) {
  const base = process.env.URL;
  if (!base) return false;
  const body = new URLSearchParams();
  body.set('form-name', config.formName);
  body.set('attempt_id', rec.attempt_id);
  body.set('learner_name', rec.learner_name);
  body.set('learner_email', rec.learner_email);
  body.set('attempt_no', String(rec.attempt_no));
  body.set('started_at', rec.started_at);
  body.set('submitted_at', rec.submitted_at);
  body.set('submit_reason', rec.submit_reason);
  body.set('score', String(rec.score));
  body.set('marks_json', JSON.stringify(rec.marks));
  body.set('answers_json', JSON.stringify(rec.answers));
  for (const col of config.answerColumns) body.set(col, formatAnswer(col, rec.answers[col]));
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
    });
    if (res.status >= 400) console.error(`[forms] post failed status=${res.status}`);
    return res.status < 400;
  } catch (e) {
    console.error(`[forms] post failed reason=${e?.name || 'error'}`);
    return false;
  }
}
