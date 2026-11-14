import { h, icon, docPage } from '../ui.mjs';

export function render(root, ctx, param) {
  const docs = ctx.data().case.documents;
  const current = docs.find((d) => d.id === param) || null;
  const list = h('nav', { class: 'doc-list', 'aria-label': 'Research documents' },
    docs.map((d) => h('a', { class: 'doc-link', href: `#/research/${d.id}`, 'aria-current': current && current.id === d.id ? 'page' : null },
      h('span', { class: 'doc-code', text: d.code }), h('span', { text: d.title }))));
  const view = h('div', { class: 'doc-view' },
    h('a', { class: 'btn back-link', href: '#/research' }, 'All documents'),
    docPage(current || docs[0]));
  root.append(
    h('div', { class: 'page-head' }, h('h1', { text: 'Research' }), h('p', { class: 'guide', text: ctx.guidance('research') })),
    h('div', { class: `research${current ? ' has-doc' : ''}` }, list, view),
  );
}
