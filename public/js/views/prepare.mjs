import { h, renderItem, scrollToItem } from '../ui.mjs';

export function render(root, ctx, param) {
  const { sections, items } = ctx.data().case.prepare;
  const bySection = (id) => items.filter((i) => i.section === id);
  const chips = {};
  const rendered = {};

  const cards = sections.map((s, n) => {
    const chip = h('span', { class: 'sec-state' });
    chips[s.id] = chip;
    const card = h('section', { class: 'card', 'aria-labelledby': `sec-${s.id}` },
      h('div', { class: 'card-head' }, h('span', { class: 'sec-num', text: String(n + 1) }), h('h2', { id: `sec-${s.id}`, text: s.title }), chip),
      bySection(s.id).map((item) => {
        const el = renderItem(item, ctx);
        rendered[item.key] = el;
        return el;
      }));
    return card;
  });

  function updateChips() {
    for (const s of sections) {
      const done = bySection(s.id).every((i) => ctx.isAnswered(i.key));
      chips[s.id].textContent = done ? 'Complete' : 'Incomplete';
      chips[s.id].classList.toggle('done', done);
    }
  }
  updateChips();

  const off = ctx.onChange((key) => {
    updateChips();
    if (key === 'p3_order') rendered.p3_minutes.body.redraw?.();
    if (['p2_invitees', 'p3_papers', 'p4_slot', 'p4_invitation'].includes(key)) rendered.p4_invitation.body.refresh?.();
  });

  root.append(
    h('div', { class: 'page-head' }, h('h1', { text: 'Prepare' }), h('p', { class: 'guide', text: ctx.guidance('prepare') })),
    ...cards,
  );
  if (param) scrollToItem(root, param);
  return off;
}
