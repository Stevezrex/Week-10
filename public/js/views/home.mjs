import { h, icon } from '../ui.mjs';

export function render(root, ctx) {
  const cards = [
    { id: 'prepare', title: 'Prepare', text: 'Plan the meeting, the invitation and the room.', icon: 'clipboard' },
    { id: 'meeting', title: 'Meeting', text: 'Chair the meeting as it happens.', icon: 'video' },
    { id: 'records', title: 'Records', text: 'Write the minutes, decisions, actions and follow up.', icon: 'table' },
  ];
  const nodes = {};
  const grid = h('div', { class: 'cards3' }, cards.map((c) => {
    const ring = h('div', { class: 'ring' }, h('span'));
    const state = h('span', { class: 'sec-state' });
    const count = h('p', { class: 'muted small' });
    nodes[c.id] = { ring, state, count };
    return h('a', { class: 'card progress-card', href: `#/${c.id}` },
      h('div', { class: 'card-head' }, h('span', { class: 'sec-num' }, icon(c.icon)), h('h2', { text: c.title }), state),
      ring,
      h('p', { text: c.text }),
      count,
    );
  }));

  function update() {
    for (const c of cards) {
      const p = ctx.progress(c.id);
      const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
      nodes[c.id].ring.style.setProperty('--p', String(pct));
      nodes[c.id].ring.firstChild.textContent = `${pct}%`;
      const done = p.done === p.total;
      nodes[c.id].state.textContent = done ? 'Complete' : 'Incomplete';
      nodes[c.id].state.classList.toggle('done', done);
      nodes[c.id].count.textContent = `${p.done} of ${p.total} items answered`;
    }
  }
  update();

  root.append(
    h('div', { class: 'page-head' }, h('h1', { text: 'Home' }), h('p', { class: 'guide', text: ctx.guidance('home') })),
    grid,
    h('div', { class: 'home-actions' },
      h('a', { class: 'btn', href: '#/research' }, icon('book'), 'Open research'),
      h('a', { class: 'btn', href: '#/review' }, icon('flag'), 'Review unanswered items')),
  );
  return ctx.onChange(update);
}
