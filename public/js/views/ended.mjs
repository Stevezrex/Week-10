import { h, icon, brand } from '../ui.mjs';

export function render(ctx, state) {
  const left = state.ended.attemptsLeft;
  return h('div', { class: 'app app-plain' },
    h('header', { class: 'topbar' }, brand()),
    h('main', { class: 'main', id: 'main', tabindex: '-1' },
      h('div', { class: 'card ended' },
        h('span', { class: 'ended-icon' }, icon('check')),
        h('h1', { text: 'Your work has been recorded. You are signed out.' }),
        h('p', { class: 'muted', text: `Attempts left: ${left}` }),
        h('a', { class: 'btn', href: '#/start' }, 'Back to the start'))),
  );
}
