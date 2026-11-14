// Shared components. All text is set with textContent.

const SVG_NS = 'http://www.w3.org/2000/svg';

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'for') el.htmlFor = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else if (['value', 'checked', 'disabled', 'selected', 'type', 'rows', 'min', 'max', 'step', 'id', 'name', 'placeholder', 'href', 'src', 'alt', 'title', 'maxLength'].includes(k)) el[k] = v;
    else el.setAttribute(k, v);
  }
  const add = (kid) => {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) kid.forEach(add);
    else el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  };
  kids.forEach(add);
  return el;
}

export function icon(name, cls = '') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', `icon ${cls}`.trim());
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `/img/sprite.svg#${name}`);
  svg.append(use);
  return svg;
}

export const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

let uid = 0;
export const nextId = (p = 'f') => `${p}${++uid}`;

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Answer helpers ---------- */

export function isAnswered(item, v) {
  switch (item.type) {
    case 'text': return typeof v === 'string' && v.trim().length > 0;
    case 'single': return typeof v === 'string' && !!item.options.find((o) => o.id === v);
    case 'ticks': return Array.isArray(v) && v.length > 0;
    case 'order': return Array.isArray(v) && v.length === item.items.length;
    case 'minutes': return !!v && item.ids.every((id) => v[id] !== undefined && v[id] !== '');
    case 'composite': return !!v && item.fields.every((f) => !!v[f.id]);
    default: return false;
  }
}

export function isPartial(item, v) {
  if (isAnswered(item, v)) return false;
  switch (item.type) {
    case 'composite': return !!v && item.fields.some((f) => !!v[f.id]);
    case 'minutes': return !!v && item.ids.some((id) => v[id] !== undefined && v[id] !== '');
    default: return false;
  }
}

/* ---------- Dialog ---------- */

export function confirmDialog({ title, text, confirm, danger = false, cancel = 'Keep working' }) {
  return new Promise((resolve) => {
    const dlg = h('dialog', { class: 'dlg', 'aria-labelledby': 'dlg-title' });
    const done = (val) => { dlg.close(); dlg.remove(); resolve(val); };
    dlg.append(
      h('h2', { id: 'dlg-title', text: title }),
      h('p', { text }),
      h('div', { class: 'dlg-actions' },
        h('button', { class: 'btn', type: 'button', text: cancel, onclick: () => done(false) }),
        h('button', { class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`, type: 'button', text: confirm, onclick: () => done(true) }),
      ),
    );
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); done(false); });
    document.body.append(dlg);
    dlg.showModal();
    dlg.querySelector('.btn').focus();
  });
}

/* ---------- Form controls ---------- */

export function selectEl({ options, value, onChange, label, placeholder = 'Select', id }) {
  const sel = h('select', { class: 'select', id: id || nextId('s'), 'aria-label': label },
    h('option', { value: '', text: placeholder }),
    options.map((o) => h('option', { value: o.id, text: o.text, selected: o.id === value })),
  );
  sel.addEventListener('change', () => onChange(sel.value));
  return sel;
}

export function radioStack({ name, options, value, onChange, compact = false }) {
  return h('div', { class: `choices${compact ? ' choices-compact' : ''}`, role: 'radiogroup' },
    options.map((o) => {
      const id = nextId('r');
      const input = h('input', { type: 'radio', id, name, value: o.id, checked: o.id === value });
      input.addEventListener('change', () => input.checked && onChange(o.id));
      return h('label', { class: 'choice', for: id }, input, h('span', { class: 'choice-text', text: o.text }));
    }),
  );
}

export function tickStack({ name, options, value, onChange, pills = false }) {
  const current = new Set(value || []);
  return h('div', { class: `ticks${pills ? ' ticks-pills' : ''}` },
    options.map((o) => {
      const id = nextId('t');
      const input = h('input', { type: 'checkbox', id, name, value: o.id, checked: current.has(o.id) });
      input.addEventListener('change', () => {
        if (input.checked) current.add(o.id); else current.delete(o.id);
        onChange(options.filter((x) => current.has(x.id)).map((x) => x.id));
      });
      return h('label', { class: 'tick', for: id }, input, pills ? icon('paperclip') : null, h('span', { class: 'tick-text', text: o.text }));
    }),
  );
}

export function textBox({ value, onInput, label, hint, rows = 8, id }) {
  const ta = h('textarea', { class: 'textbox', id: id || nextId('x'), rows, placeholder: hint || '', 'aria-label': label, spellcheck: 'true' });
  ta.value = value || '';
  ta.addEventListener('input', () => onInput(ta.value));
  return ta;
}

/* ---------- Item components ---------- */

const initials = (name) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export function avatarEl(person, size = 'md') {
  if (person && person.avatar) {
    return h('img', { class: `avatar avatar-${size}`, src: `/img/avatars/${person.avatar}`, alt: '', width: 120, height: 120 });
  }
  return h('span', { class: `avatar avatar-${size} avatar-initials`, 'aria-hidden': 'true', text: initials(person ? person.name : '?') });
}

function peopleStatus(item, ctx) {
  const val = { ...(ctx.get(item.key) || {}) };
  const rows = item.fields.map((f) => {
    const p = ctx.person(f.id);
    return h('div', { class: 'row-person' },
      avatarEl(p, 'sm'),
      h('div', { class: 'row-person-text' }, h('strong', { text: p.name }), h('span', { class: 'muted', text: p.role })),
      selectEl({
        options: f.options, value: val[f.id], label: `${p.name}: invitation status`,
        onChange: (v) => { if (v) val[f.id] = v; else delete val[f.id]; ctx.set(item.key, { ...val }); },
      }),
    );
  });
  return h('div', { class: 'rows' }, rows);
}

function roles(item, ctx) {
  const val = { ...(ctx.get(item.key) || {}) };
  return h('div', { class: 'rows' },
    h('div', { class: 'row-role' }, h('span', { class: 'row-role-label', text: item.fixed.label }), h('span', { class: 'fixed-value', text: item.fixed.value })),
    item.fields.map((f) =>
      h('div', { class: 'row-role' },
        h('label', { class: 'row-role-label', for: `${item.key}-${f.id}`, text: f.label }),
        selectEl({
          id: `${item.key}-${f.id}`, options: f.options, value: val[f.id], label: f.label,
          onChange: (v) => { if (v) val[f.id] = v; else delete val[f.id]; ctx.set(item.key, { ...val }); },
        }),
      )),
  );
}

function orderList(item, ctx) {
  const wrap = h('div', { class: 'order' });
  const ids = () => {
    const v = ctx.get(item.key);
    return Array.isArray(v) && v.length === item.items.length ? v : item.items.map((x) => x.id);
  };
  const text = (id) => item.items.find((x) => x.id === id).text;
  let focusId = null;

  function draw() {
    const set = isAnswered(item, ctx.get(item.key));
    const order = ids();
    clear(wrap);
    const list = h('ol', { class: 'order-list' },
      order.map((id, i) =>
        h('li', { class: 'order-item', dataset: { id } },
          h('span', { class: 'order-n', text: String(i + 1) }),
          h('span', { class: 'order-text', text: text(id) }),
          h('span', { class: 'order-btns' },
            h('button', { class: 'btn btn-icon', type: 'button', 'aria-label': `Move up: ${text(id)}`, disabled: i === 0, dataset: { move: 'up', id }, onclick: () => move(i, -1, id) }, icon('up')),
            h('button', { class: 'btn btn-icon', type: 'button', 'aria-label': `Move down: ${text(id)}`, disabled: i === order.length - 1, dataset: { move: 'down', id }, onclick: () => move(i, 1, id) }, icon('down')),
          ),
        )),
    );
    wrap.append(list);
    if (!set) {
      wrap.append(h('div', { class: 'order-note' },
        h('span', { class: 'muted', text: 'This order is not recorded yet. Move an item or use it as it is.' }),
        h('button', { class: 'btn', type: 'button', text: 'Use this order', onclick: () => ctx.set(item.key, [...order]) }),
      ));
    }
    if (focusId) {
      const b = wrap.querySelector(`[data-id="${focusId}"][data-move]:not([disabled])`) || wrap.querySelector(`[data-id="${focusId}"][data-move]`);
      if (b) b.focus();
      focusId = null;
    }
  }

  function move(i, d, id) {
    const order = [...ids()];
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    focusId = id;
    ctx.set(item.key, order);
    draw();
  }

  draw();
  return wrap;
}

function minutesInputs(item, ctx) {
  const source = ctx.item('p3_order');
  const wrap = h('div', { class: 'minutes' });
  const total = h('div', { class: 'minutes-total' });
  const val = { ...(ctx.get(item.key) || {}) };
  const sum = () => item.ids.reduce((s, id) => s + (Number(val[id]) || 0), 0);
  const order = () => {
    const v = ctx.get('p3_order');
    return Array.isArray(v) && v.length === source.items.length ? v : source.items.map((x) => x.id);
  };
  const updateTotal = () => {
    total.textContent = `Running total: ${sum()} of ${item.total} minutes`;
  };
  function draw() {
    clear(wrap);
    order().forEach((id) => {
      const name = source.items.find((x) => x.id === id).text;
      const inputId = nextId('m');
      const input = h('input', { class: 'minutes-input', type: 'number', min: 0, max: item.total, step: 1, id: inputId, value: val[id] ?? '', inputMode: 'numeric' });
      input.addEventListener('input', () => {
        if (input.value === '') delete val[id];
        else val[id] = Math.max(0, Math.min(item.total, Math.floor(Number(input.value) || 0)));
        updateTotal();
        ctx.set(item.key, { ...val });
      });
      wrap.append(h('div', { class: 'minutes-row' }, h('label', { for: inputId, text: name }), h('span', { class: 'minutes-unit' }, input, ' min')));
    });
    wrap.append(total);
    updateTotal();
  }
  draw();
  wrap.redraw = draw;
  return wrap;
}

/* ---------- Composers ---------- */

function chips(list) {
  if (!list.length) return h('span', { class: 'muted', text: 'None' });
  return h('span', { class: 'chips' }, list.map((t) => h('span', { class: 'chip', text: t })));
}

const invitationLines = {
  purpose: () => 'Purpose and decision needed: we need to choose our courier partner for Q1, before the current contract ends on 31 December.',
  when: (ctx) => {
    const slot = ctx.item('p4_slot').options.find((o) => o.id === ctx.get('p4_slot'));
    return `When: ${slot ? slot.text : 'choose a slot above'}, 30 minutes, WAT.`;
  },
  link: () => 'Joining link: https://linkup.example/kobamart/q1-courier',
  agenda: (ctx) => {
    const papers = ctx.item('p3_papers').options.filter((o) => (ctx.get('p3_papers') || []).includes(o.id)).map((o) => o.text);
    return `Agenda and papers are attached${papers.length ? `: ${papers.join(', ')}` : ''}.`;
  },
  contrib: () => 'What each person does: Tunde presents the options, Amaka confirms the budget, Kemi reports the complaint trend and Ifeoma makes the decision.',
  access: () => 'If you need any access support, contact me before the meeting.',
  prices: () => 'Price lists: SwiftLane Lagos ₦2,800, other states ₦6,500 per parcel. Eko Express Lagos ₦2,200, other states ₦5,200 per parcel.',
  reclink: () => 'Recording: https://linkup.example/kobamart/recordings/q1-courier',
};

function invitationComposer(item, ctx) {
  const preview = h('div', { class: 'composer' });
  const picks = () => ctx.get(item.key) || [];

  function drawPreview() {
    const p = picks();
    const inv = ctx.get('p2_invitees') || {};
    const to = ctx.people().filter((x) => inv[x.id] === 'req' || inv[x.id] === 'opt').map((x) => x.name);
    clear(preview);
    preview.append(...[
      h('div', { class: 'comp-row' }, h('span', { class: 'comp-label', text: 'To' }), chips(to)),
      h('div', { class: 'comp-row' }, h('span', { class: 'comp-label', text: 'Cc' }), chips([])),
      h('div', { class: 'comp-row' }, h('span', { class: 'comp-label', text: 'Subject' }),
        p.includes('subject') ? h('span', { text: 'Courier partner decision: Thursday 26 November 2026' }) : h('span', { class: 'muted', text: 'No subject' })),
      p.includes('agenda') ? h('div', { class: 'comp-row' }, h('span', { class: 'comp-label', text: 'Attached' }),
        h('span', { class: 'attach-pills' },
          ['Agenda', ...ctx.item('p3_papers').options.filter((o) => (ctx.get('p3_papers') || []).includes(o.id)).map((o) => o.text)]
            .map((t) => h('span', { class: 'attach-pill' }, icon('paperclip'), t)))) : null,
      h('div', { class: 'comp-body' },
        p.length ? p.filter((id) => invitationLines[id]).map((id) => h('p', { text: invitationLines[id](ctx) })) : h('p', { class: 'muted', text: 'The email body is empty.' })),
      h('div', { class: 'comp-foot' }, h('span', { text: 'Saved' })),
    ].filter(Boolean));
  }

  const box = h('div', { class: 'invitation' },
    tickStack({ name: item.key, options: item.options, value: picks(), onChange: (v) => { ctx.set(item.key, v); drawPreview(); } }),
    h('p', { class: 'muted small', text: 'Preview of the email' }),
    preview,
  );
  box.refresh = drawPreview;
  drawPreview();
  return box;
}

export function followupComposer(ctx) {
  const rec = ctx.item('recipients');
  const att = ctx.item('attachments');
  const msg = ctx.item('followup_message');
  const toRow = h('span', { class: 'comp-value' });
  const attRow = h('span', { class: 'comp-value' });

  const drawTo = () => {
    clear(toRow);
    const picks = ctx.get('recipients') || [];
    toRow.append(chips(rec.options.filter((o) => picks.includes(o.id)).map((o) => o.text)));
  };
  const drawAtt = () => {
    clear(attRow);
    const picks = ctx.get('attachments') || [];
    const list = att.options.filter((o) => picks.includes(o.id));
    attRow.append(list.length ? h('span', { class: 'attach-pills' }, list.map((o) => h('span', { class: 'attach-pill' }, icon('paperclip'), o.text))) : h('span', { class: 'muted', text: 'None' }));
  };

  const ui = ctx.get('_ui') || {};
  const subject = h('input', { class: 'comp-input', type: 'text', id: 'followup-subject', value: ui.followup_subject || '', placeholder: 'Subject', 'aria-label': 'Subject', maxLength: 200 });
  subject.addEventListener('input', () => ctx.setUi({ followup_subject: subject.value }));

  const box = h('div', { class: 'composer composer-edit', dataset: { key: 'followup' } },
    h('div', { class: 'comp-row' }, h('span', { class: 'comp-label', text: 'To' }), toRow),
    h('div', { class: 'comp-row' }, h('span', { class: 'comp-label', text: 'Cc' }), chips([])),
    h('div', { class: 'comp-row' }, h('label', { class: 'comp-label', for: 'followup-subject', text: 'Subject' }), subject),
    h('div', { class: 'comp-row' }, h('span', { class: 'comp-label', text: 'Attached' }), attRow),
    h('div', { class: 'comp-body' }, textBox({ value: ctx.get('followup_message'), onInput: (v) => ctx.set('followup_message', v), label: 'Email body', hint: msg.hint, rows: 12, id: 'followup_message' })),
    h('div', { class: 'comp-foot' }, h('span', { text: 'Saved' })),
  );

  const pickers = h('div', { class: 'comp-pickers' },
    h('fieldset', { class: 'item', dataset: { key: 'recipients' } },
      h('legend', { text: rec.label }),
      tickStack({ name: 'recipients', options: rec.options, value: ctx.get('recipients'), onChange: (v) => { ctx.set('recipients', v); drawTo(); } })),
    h('fieldset', { class: 'item', dataset: { key: 'attachments' } },
      h('legend', { text: att.label }),
      tickStack({ name: 'attachments', options: att.options, value: ctx.get('attachments'), onChange: (v) => { ctx.set('attachments', v); drawAtt(); }, pills: true })),
  );

  drawTo();
  drawAtt();
  return h('div', { class: 'followup' }, pickers, box);
}

/* ---------- Dispatcher ---------- */

export function renderItem(item, ctx, { legend = true } = {}) {
  let body;
  switch (item.type) {
    case 'single':
      body = radioStack({ name: item.key, options: item.options, value: ctx.get(item.key), onChange: (v) => ctx.set(item.key, v) });
      break;
    case 'text':
      body = textBox({ value: ctx.get(item.key), onInput: (v) => ctx.set(item.key, v), label: item.label, hint: item.hint, rows: item.key === 'minute_text' ? 14 : 7, id: item.key });
      break;
    case 'order':
      body = orderList(item, ctx);
      break;
    case 'minutes':
      body = minutesInputs(item, ctx);
      break;
    case 'ticks':
      body = item.ui === 'invitation'
        ? invitationComposer(item, ctx)
        : tickStack({ name: item.key, options: item.options, value: ctx.get(item.key), onChange: (v) => ctx.set(item.key, v) });
      break;
    case 'composite':
      body = item.ui === 'people_status' ? peopleStatus(item, ctx) : item.ui === 'roles' ? roles(item, ctx) : null;
      break;
    default:
      body = null;
  }
  const wrap = h('fieldset', { class: 'item', dataset: { key: item.key } },
    legend ? h('legend', { text: item.label }) : null,
    body,
  );
  wrap.body = body;
  return wrap;
}

/* ---------- Tables for records ---------- */

export function recordTable({ columns, rows, className = '' }) {
  return h('div', { class: `table-wrap ${className}`.trim() },
    h('table', { class: 'rtable' },
      h('thead', null, h('tr', null, columns.map((c) => h('th', { scope: 'col', text: c })))),
      h('tbody', null, rows)),
  );
}

export function decisionRow(item, ctx, columns) {
  const val = { ...(ctx.get(item.key) || {}) };
  const set = (fid, v) => { if (v) val[fid] = v; else delete val[fid]; ctx.set(item.key, { ...val }); };
  const field = (id) => item.fields.find((f) => f.id === id);
  const cellSelect = (id) => {
    const f = field(id);
    return f ? h('td', null, selectEl({ options: f.options, value: val[id], label: `${item.ref} ${f.label}`, onChange: (v) => set(id, v) })) : h('td', { class: 'cell-empty' });
  };
  const cellStack = (id) => {
    const f = field(id);
    return f ? h('td', { class: 'cell-wide' }, radioStack({ name: `${item.key}-${id}`, options: f.options, value: val[id], onChange: (v) => set(id, v), compact: true })) : h('td', { class: 'cell-empty' });
  };
  const tr = h('tr', { dataset: { key: item.key } },
    h('th', { scope: 'row', class: 'ref', text: item.ref }),
    cellStack('wording'),
    cellSelect('authority'),
    cellSelect('method'),
    cellSelect('status'),
    cellStack('condition'),
    cellSelect('action'),
  );
  return tr;
}

export function actionRow(item, ctx) {
  const val = { ...(ctx.get(item.key) || {}) };
  const set = (fid, v) => { if (v) val[fid] = v; else delete val[fid]; ctx.set(item.key, { ...val }); };
  const f = (id) => item.fields.find((x) => x.id === id);
  return h('tr', { dataset: { key: item.key } },
    h('th', { scope: 'row', class: 'ref', text: item.ref }),
    h('td', { class: 'cell-task', text: item.task }),
    h('td', null, selectEl({ options: f('owner').options, value: val.owner, label: `${item.ref} owner`, onChange: (v) => set('owner', v) })),
    h('td', null, selectEl({ options: f('due').options, value: val.due, label: `${item.ref} due date`, onChange: (v) => set('due', v) })),
    h('td', { class: 'cell-status', text: 'Not started' }),
  );
}

/* ---------- Documents ---------- */

export function docPage(doc) {
  const meta = [];
  if (doc.kind === 'email') {
    meta.push(['From', doc.from], ['To', doc.to], ['Subject', doc.subject]);
  } else {
    if (doc.from) meta.push(['From', doc.from]);
    if (doc.date) meta.push(['Date', doc.date]);
  }
  return h('article', { class: 'doc' },
    h('header', { class: 'doc-band' },
      h('img', { class: 'doc-logo', src: '/img/kobamart-mark.svg', alt: '', width: 28, height: 28 }),
      h('span', { class: 'doc-band-title', text: `${doc.code}. ${doc.title}` })),
    h('div', { class: 'doc-body' },
      meta.length ? h('dl', { class: 'doc-meta' }, meta.map(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })])) : null,
      doc.blocks.map((b) => {
        if (b.type === 'p') return h('p', { text: b.text });
        if (b.type === 'ol') return h('ol', null, b.items.map((t) => h('li', { text: t })));
        if (b.type === 'ul') return h('ul', null, b.items.map((t) => h('li', { text: t })));
        if (b.type === 'table') {
          return h('div', { class: 'table-wrap' }, h('table', { class: 'dtable' },
            h('thead', null, h('tr', null, b.columns.map((c) => h('th', { scope: 'col', text: c })))),
            h('tbody', null, b.rows.map((r) => h('tr', null, r.map((c, i) => (i === 0 ? h('th', { scope: 'row', text: c }) : h('td', { text: c }))))))));
        }
        return null;
      })),
  );
}

export function brand(size = 'md') {
  return h('span', { class: `brand brand-${size}` },
    h('img', { src: '/img/kobamart-mark.svg', alt: '', width: 32, height: 32 }),
    h('span', { class: 'wordmark' }, h('span', { class: 'wm-koba', text: 'Koba' }), h('span', { class: 'wm-mart', text: 'Mart' })),
  );
}

/* ---------- Scroll to an item ---------- */

export function scrollToItem(root, key) {
  requestAnimationFrame(() => {
    const el = root.querySelector(`[data-key="${CSS.escape(key)}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
    el.classList.add('flash');
    const focusable = el.querySelector('input, select, textarea, button');
    focusable?.focus({ preventScroll: true });
    setTimeout(() => el.classList.remove('flash'), 1800);
  });
}
