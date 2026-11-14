import { h, renderItem, recordTable, decisionRow, actionRow, followupComposer, scrollToItem } from '../ui.mjs';

export function render(root, ctx, param) {
  const rec = ctx.data().records;
  const items = rec.items;
  const sectionOf = (i) => i.section;
  const inSection = (id) => items.filter((i) => sectionOf(i) === id);
  const chips = {};
  const rendered = {};

  const notes = h('aside', { class: 'card notes', 'aria-label': 'Meeting notes' },
    h('h2', { text: 'Meeting notes' }),
    h('dl', null, rec.notes.map(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })])));

  const chip = (id) => { chips[id] = h('span', { class: 'sec-state' }); return chips[id]; };
  const head = (n, id, title) => h('div', { class: 'card-head' }, h('span', { class: 'sec-num', text: String(n) }), h('h2', { id: `sec-${id}`, text: title }), chip(id));

  const minutes = h('section', { class: 'card', 'aria-labelledby': 'sec-minutes' },
    head(1, 'minutes', 'Minutes'),
    ['r_attendance', 'r_headings', 'r_style', 'minute_text'].map((k) => { rendered[k] = renderItem(ctx.item(k), ctx); return rendered[k]; }));

  const decisions = h('section', { class: 'card', 'aria-labelledby': 'sec-decisions' },
    head(2, 'decisions', 'Decision log'),
    recordTable({ columns: rec.decisionColumns, rows: ['d1', 'd2'].map((k) => decisionRow(ctx.item(k), ctx, rec.decisionColumns)) }));

  const actions = h('section', { class: 'card', 'aria-labelledby': 'sec-actions' },
    head(3, 'actions', 'Action register'),
    recordTable({ columns: ['Ref', 'Task', 'Owner', 'Due', 'Status'], rows: ['a1', 'a2', 'a3'].map((k) => actionRow(ctx.item(k), ctx)) }));

  const followup = h('section', { class: 'card', 'aria-labelledby': 'sec-followup' },
    head(4, 'followup', 'Follow up'),
    followupComposer(ctx));

  function updateChips() {
    for (const id of Object.keys(chips)) {
      const done = inSection(id).every((i) => ctx.isAnswered(i.key));
      chips[id].textContent = done ? 'Complete' : 'Incomplete';
      chips[id].classList.toggle('done', done);
    }
  }
  updateChips();
  const off = ctx.onChange(updateChips);

  root.append(
    h('div', { class: 'page-head' }, h('h1', { text: 'Records' }), h('p', { class: 'guide', text: ctx.guidance('records') })),
    h('div', { class: 'records-layout' }, notes, h('div', { class: 'records-main' }, minutes, decisions, actions, followup)));
  if (param) scrollToItem(root, param);
  return off;
}
