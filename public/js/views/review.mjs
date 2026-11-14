import { h, icon } from '../ui.mjs';

const SCREENS = [
  { id: 'prepare', title: 'Prepare' },
  { id: 'meeting', title: 'Meeting' },
  { id: 'records', title: 'Records' },
];

export function render(root, ctx) {
  const items = ctx.allItems();
  const link = (i) => (i.screen === 'meeting' ? `#/meeting/${ctx.beatOf(i.key)}` : `#/${i.screen}/${i.key}`);
  const groups = SCREENS.map((s) => ({ ...s, list: items.filter((i) => i.screen === s.id && !ctx.isAnswered(i.key)) })).filter((g) => g.list.length);
  const total = groups.reduce((n, g) => n + g.list.length, 0);

  const group = (g) => h('section', { class: 'card review-group' },
    h('div', { class: 'card-head' }, h('h2', { text: g.title }), h('span', { class: 'sec-state', text: `${g.list.length} unanswered` })),
    h('ul', { class: 'review-list' }, g.list.map((i) => h('li', null,
      h('a', { href: link(i) }, icon('alert'), h('span', { text: i.label }), ctx.isPartial(i.key) ? h('span', { class: 'muted small', text: 'Partly answered' }) : null)))));

  root.append(
    h('div', { class: 'page-head' }, h('h1', { text: 'Review' }), h('p', { class: 'guide', text: ctx.guidance('review') })),
    total === 0
      ? h('div', { class: 'review-ok' }, icon('check'), 'Every item has an answer.')
      : h('div', null, h('p', { class: 'muted', text: `${total} ${total === 1 ? 'item is' : 'items are'} unanswered.` }), groups.map(group)),
  );
}
