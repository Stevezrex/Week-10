import guide from './marking-guide.json' with { type: 'json' };
import config from '../../../week.config.json' with { type: 'json' };

export const SERVER_MAX = 75;
const G = guide.items;

const arr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const str = (v) => (typeof v === 'string' ? v : '');
const optOf = (opts, id) => (opts || []).find((o) => o.id === id);
const num = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

function markSingle(item, v) {
  return optOf(item.options, str(v))?.marks ?? 0;
}

function markComposite(item, v) {
  const a = obj(v);
  return item.fields.reduce((sum, f) => sum + (optOf(f.options, str(a[f.id]))?.marks ?? 0), 0);
}

function markOrder(item, v) {
  const a = arr(v);
  const pos = (id) => a.indexOf(id);
  const r = item.rules;
  if (item.ruleset === 'agenda') {
    let m = 0;
    if (a.length && pos(r.first) === 0) m += 1;
    if (a.length && pos(r.last) === a.length - 1 && pos(r.last) !== -1) m += 1;
    const [x, y] = r.before;
    if (pos(x) !== -1 && pos(y) !== -1 && pos(x) < pos(y)) m += 1;
    return m;
  }
  // steps: each correct relative order among the first five cards is 0.5, rounded; last card last is 1
  let pairs = 0;
  for (let i = 0; i < r.order.length; i++) {
    for (let j = i + 1; j < r.order.length; j++) {
      const p = pos(r.order[i]);
      const q = pos(r.order[j]);
      if (p !== -1 && q !== -1 && p < q) pairs += 0.5;
    }
  }
  const lastOk = a.length && pos(r.last) === a.length - 1 ? 1 : 0;
  return Math.round(pairs) + lastOk;
}

function markMinutes(item, v) {
  const a = obj(v);
  const t = Object.fromEntries(item.ids.map((id) => [id, num(a[id])]));
  const total = item.ids.reduce((s, id) => s + t[id], 0);
  if (total !== item.total) return 0;
  const ok = t.decide >= item.rules.decideMin && t.option + t.budget >= item.rules.optionBudgetMin;
  return ok ? 2 : 1;
}

function markTicks(item, v) {
  const ticked = [...new Set(arr(v))].filter((id) => optOf(item.options, id));
  const n = ticked.filter((id) => item.correct.includes(id)).length;
  switch (item.key) {
    case 'p3_papers':
      return Math.min(n, item.max);
    case 'p4_invitation':
      return n >= 6 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0;
    case 'attachments':
      return Math.min(n, item.max);
    case 'recipients': {
      if (ticked.includes('femi') || ticked.includes('staff')) return 0;
      return n >= 4 ? 1 : n >= 3 ? 0.5 : 0;
    }
    default:
      return Math.min(n, item.max ?? n);
  }
}

export function markItem(key, value) {
  const item = G[key];
  if (!item || item.typed) return 0;
  switch (item.type) {
    case 'single': return markSingle(item, value);
    case 'composite': return markComposite(item, value);
    case 'order': return markOrder(item, value);
    case 'minutes': return markMinutes(item, value);
    case 'ticks': return markTicks(item, value);
    default: return 0;
  }
}

export function markAnswers(answers) {
  const a = obj(answers);
  const marks = {};
  let score = 0;
  for (const key of guide.order) {
    if (G[key].typed) continue;
    const m = markItem(key, a[key]);
    marks[key] = m;
    score += m;
  }
  return { score: Math.round(score * 100) / 100, marks };
}

/* Readable text for exports. */
export function formatAnswer(key, value) {
  const item = G[key];
  if (!item) return '';
  if (item.typed || item.type === 'text') return str(value);
  const text = (opts, id) => optOf(opts, id)?.text ?? id;
  switch (item.type) {
    case 'single':
      return value ? text(item.options, value) : '';
    case 'composite': {
      const a = obj(value);
      const prefix = item.ref && item.ui === 'action' ? `${item.ref} ` : '';
      return item.fields
        .filter((f) => a[f.id])
        .map((f) => `${prefix}${f.label}: ${text(f.options, a[f.id])}`)
        .join('; ');
    }
    case 'order': {
      const a = arr(value);
      return a.map((id) => item.items.find((x) => x.id === id)?.text ?? id).join(' > ');
    }
    case 'minutes': {
      const a = obj(value);
      const names = G.p3_order.items;
      const parts = item.ids
        .filter((id) => a[id] !== undefined && a[id] !== '')
        .map((id) => `${names.find((x) => x.id === id)?.text ?? id} ${num(a[id])}`);
      return parts.length ? `${parts.join('; ')}; total ${item.ids.reduce((s, id) => s + num(a[id]), 0)}` : '';
    }
    case 'ticks':
      return arr(value).map((id) => text(item.options, id)).join(' | ');
    default:
      return '';
  }
}

export const answerColumns = config.answerColumns;
export const guideOrder = guide.order;
export const isAnswered = (key, value) => {
  const item = G[key];
  if (!item) return false;
  switch (item.type) {
    case 'text': return str(value).trim().length > 0;
    case 'single': return !!optOf(item.options, str(value));
    case 'ticks': return arr(value).length > 0;
    case 'order': return arr(value).length === item.items.length;
    case 'minutes': { const a = obj(value); return item.ids.every((id) => a[id] !== undefined && a[id] !== ''); }
    case 'composite': { const a = obj(value); return item.fields.every((f) => !!a[f.id]); }
    default: return false;
  }
};

/* Maximum server mark for an item. */
export function maxMarks(key) {
  const item = G[key];
  if (!item || item.typed) return null;
  const best = (opts) => Math.max(0, ...opts.map((o) => o.marks ?? 0));
  switch (item.type) {
    case 'single': return best(item.options);
    case 'composite': return item.fields.reduce((s, f) => s + best(f.options), 0);
    case 'order': return item.ruleset === 'agenda' ? 3 : 6;
    case 'minutes': return 2;
    case 'ticks': return { p3_papers: 2, p4_invitation: 3, attachments: 2, recipients: 1 }[key] ?? item.max;
    default: return 0;
  }
}

export const itemMeta = (key) => {
  const item = G[key];
  return { key, label: item.label || item.ref || key, screen: item.screen, typed: !!item.typed, ref: item.ref || '' };
};
