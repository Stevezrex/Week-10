import { h, icon, clear, brand } from '../ui.mjs';
import { fmt } from '../timer.mjs';

function hero() {
  const tile = (img, name, speak) => h('div', { class: `hero-tile${speak ? ' speak' : ''}` }, h('img', { src: `/img/cam/${img}.svg`, alt: '' }), h('span', { text: name }));
  return h('section', { class: 'cover-hero', 'aria-label': 'About this simulation' },
    brand('lg'),
    h('h1', { text: 'Run the client meeting' }),
    h('p', { text: 'Plan it, chair it and write it up. You work as the virtual assistant to the Head of Operations at KobaMart.' }),
    h('div', { class: 'hero-window', 'aria-hidden': 'true' },
      h('div', { class: 'hero-bar' }, h('img', { src: '/img/linkup-mark.svg', alt: '' }), 'Q1 courier partner decision'),
      h('div', { class: 'hero-grid' },
        tile('ifeoma', 'Ifeoma Adebayo', false), tile('tunde', 'Tunde Bello', true),
        tile('amaka', 'Amaka Obi', false),
        h('div', { class: 'hero-tile' }, h('div', { class: 'tile-off' }, h('img', { class: 'avatar', src: '/img/avatars/kemi.svg', alt: '' })), h('span', { text: 'Kemi Adeyemi' }))),
      h('div', { class: 'hero-tool' }, h('i'), h('i'), h('i'), h('i'), h('i', { class: 'red' }))),
  );
}

export function render(root, ctx, state, actions) {
  const panel = h('div', { class: 'cover-panel' });
  const page = h('div', { class: 'cover' }, hero(), panel);
  const guide = ctx.guidance('cover');

  function form(message = '') {
    const name = h('input', { class: 'input', id: 'learner-name', type: 'text', autocomplete: 'name', required: true, maxLength: 120 });
    const email = h('input', { class: 'input', id: 'learner-email', type: 'email', autocomplete: 'email', required: true, maxLength: 200 });
    const btn = h('button', { class: 'btn btn-primary btn-block', type: 'submit', text: 'Continue' });
    const err = h('div', { class: 'notice', role: 'alert', hidden: !message, text: message });
    const f = h('form', { class: 'card cover-card', novalidate: true },
      h('h2', { text: 'Sign in' }),
      h('p', { class: 'muted', text: guide }),
      err,
      h('div', { class: 'field' }, h('label', { for: 'learner-name', text: 'Full name' }), name),
      h('div', { class: 'field' }, h('label', { for: 'learner-email', text: 'Email' }), email),
      btn,
    );
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.hidden = true;
      state.notice = '';
      if (!name.value.trim() || !email.value.trim()) { err.textContent = 'Enter your name and email.'; err.hidden = false; return; }
      btn.disabled = true;
      let r;
      try { r = await actions.enter(name.value, email.value); } catch { r = { error: 'Could not reach the server. Check your connection and try again.' }; }
      btn.disabled = false;
      if (r.error) { err.textContent = r.error; err.hidden = false; return; }
      draw();
    });
    return f;
  }

  function status(message = '') {
    const s = state.status;
    const open = s.open;
    const left = open ? Math.max(0, Date.parse(open.deadline) - (Date.now() + state.offset)) : 0;
    const err = h('div', { class: 'notice', role: 'alert', hidden: !message, text: message });
    let action;
    if (open) {
      action = h('button', { class: 'btn btn-primary btn-block', type: 'button', text: `Resume attempt ${open.n}`, onclick: async (e) => { e.target.disabled = true; await actions.resume(); } });
    } else if (s.attemptsLeft > 0) {
      action = h('button', { class: 'btn btn-primary btn-block', type: 'button', text: `Start attempt ${s.attemptsStarted + 1}`, onclick: async (e) => {
        e.target.disabled = true;
        const r = await actions.start();
        if (r.error) { e.target.disabled = false; draw(r.error); }
      } });
    } else {
      action = h('p', { class: 'muted', text: 'You have used all your attempts.' });
    }
    return h('div', { class: 'card cover-card' },
      h('h2', { text: `Hello, ${s.name.split(' ')[0]}` }),
      h('p', { class: 'muted', text: guide }),
      err,
      h('div', { class: 'stat-row' },
        h('div', { class: 'stat' }, h('strong', { text: String(s.attemptsLeft) }), h('span', { text: 'Attempts left' })),
        open ? h('div', { class: 'stat' }, h('strong', { text: fmt(left) }), h('span', { text: `Time left in attempt ${open.n}` })) : h('div', { class: 'stat' }, h('strong', { text: `${s.attemptsStarted} of ${s.max}` }), h('span', { text: 'Attempts used' }))),
      action,
      h('p', { class: 'small muted', style: null }, h('button', { class: 'btn btn-ghost', type: 'button', text: 'Not you? Sign out', onclick: () => actions.signOut() })),
    );
  }

  function draw(message) {
    clear(panel).append(state.status ? status(message) : form(message));
  }
  draw(state.notice || '');
  clear(root).append(page);
  const first = panel.querySelector('input, button');
  first?.focus({ preventScroll: true });
}
