import { h, icon, clear, brand } from './ui.mjs';
import * as api from './api.mjs';

const root = document.getElementById('root');
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '');

function shell(...kids) {
  const main = h('main', { class: 'assessor', id: 'main', tabindex: '-1' }, ...kids);
  return h('div', { class: 'app app-plain' }, h('header', { class: 'topbar' }, brand(), h('span', { class: 'topbar-spacer' }), h('span', { class: 'muted', text: 'Assessor' })), main);
}

function signIn(message = '') {
  const input = h('input', { class: 'input', id: 'passcode', type: 'password', autocomplete: 'current-password', required: true });
  const err = h('div', { class: 'notice', role: 'alert', hidden: !message, text: message });
  const btn = h('button', { class: 'btn btn-primary btn-block', type: 'submit', text: 'Sign in' });
  const form = h('form', { class: 'card cover-card' },
    h('h2', { text: 'Assessor sign in' }), err,
    h('div', { class: 'field' }, h('label', { for: 'passcode', text: 'Passcode' }), input), btn);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    let r;
    try { r = await api.assessor('signin', { passcode: input.value }); } catch { r = { ok: false, data: { message: 'Could not reach the server.' } }; }
    btn.disabled = false;
    if (r.ok) dashboard(); else { err.textContent = r.data.message || 'Passcode not accepted.'; err.hidden = false; }
  });
  clear(root).append(shell(h('div', { class: 'cover-panel' }, form)));
  input.focus();
}

async function dashboard() {
  const tbody = h('tbody');
  const detail = h('div');
  const drafts = h('input', { type: 'checkbox', id: 'drafts' });
  const msg = h('p', { class: 'muted', role: 'status' });

  async function load() {
    msg.textContent = 'Loading';
    let r;
    try { r = await api.assessor('roster'); } catch { msg.textContent = 'Could not reach the server.'; return; }
    if (r.status === 401) { signIn(); return; }
    msg.textContent = r.data.rows.length ? '' : 'No learners yet.';
    clear(tbody);
    r.data.rows.forEach((row) => {
      const tr = h('tr', null,
        h('td', { text: row.name }), h('td', { text: row.email }), h('td', { text: row.attempts }),
        h('td', null, h('span', { class: `pill-status ${row.status === 'Submitted' ? 'ok' : row.status.startsWith('In progress') ? 'open' : ''}`, text: row.status })),
        h('td', { text: when(row.submittedAt) }),
        h('td', null, row.list.map((a) => h('button', { class: 'btn', type: 'button', style: null, text: `Attempt ${a.n}`, onclick: () => view(row.email, a.n) }))));
      tbody.append(tr);
    });
  }

  async function view(email, n) {
    const r = await api.assessor('attempt', { email, n });
    if (!r.ok) { detail.replaceChildren(h('p', { class: 'notice', text: 'Could not load that attempt.' })); return; }
    const { learner, attempt, items } = r.data;
    detail.replaceChildren(h('section', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', { text: `${learner.name}, attempt ${attempt.n}` }), h('span', { class: `pill-status ${attempt.state === 'Submitted' ? 'ok' : 'open'}`, text: attempt.state })),
      h('p', { class: 'muted', text: `Started ${when(attempt.started_at)}. ${attempt.submitted_at ? `Submitted ${when(attempt.submitted_at)} (${attempt.submit_reason}).` : 'Not submitted.'} Server score ${attempt.score} of 75.` }),
      h('div', { class: 'table-wrap' }, h('table', { class: 'atable' },
        h('thead', null, h('tr', null, h('th', { text: 'Item' }), h('th', { text: 'Answer' }), h('th', { text: 'Mark' }))),
        h('tbody', null, items.map((i) => h('tr', null,
          h('td', { text: i.ref ? `${i.key} (${i.ref})` : i.key }),
          h('td', { class: 'answer-cell', text: i.answer || 'Blank' }),
          h('td', { class: 'mark-cell', text: i.typed ? 'Assessor' : `${i.mark ?? 0} of ${i.max}` }))))))));
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function download(format) {
    msg.textContent = 'Preparing the file';
    let r;
    try { r = await api.assessorFile({ format, drafts: drafts.checked }); } catch { msg.textContent = 'Could not reach the server.'; return; }
    if (!r.ok) { msg.textContent = r.status === 401 ? 'Your session ended. Sign in again.' : 'Could not build the export.'; return; }
    const url = URL.createObjectURL(r.blob);
    const a = h('a', { href: url, download: r.name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    msg.textContent = '';
  }

  clear(root).append(shell(
    h('div', { class: 'page-head' }, h('h1', { text: 'Week 10 results' }), h('p', { class: 'guide', text: 'Open attempts past their deadline are submitted when this page loads.' })),
    h('div', { class: 'toolbar-row' },
      h('button', { class: 'btn btn-primary', type: 'button', onclick: () => download('csv') }, icon('download'), 'Export all, CSV'),
      h('button', { class: 'btn', type: 'button', onclick: () => download('json') }, icon('download'), 'Export all, JSON'),
      h('label', { for: 'drafts' }, drafts, 'Include open drafts'),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: load }, icon('refresh'), 'Refresh'),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => { await api.assessor('signout'); signIn(); } }, icon('logout'), 'Sign out')),
    msg,
    h('div', { class: 'card', style: null }, h('div', { class: 'table-wrap' }, h('table', { class: 'atable' },
      h('thead', null, h('tr', null, ['Name', 'Email', 'Attempts', 'Status', 'Submitted at', 'View'].map((t) => h('th', { text: t })))), tbody))),
    detail));
  load();
}

(async () => {
  try {
    const r = await api.assessor('me');
    if (r.ok) { dashboard(); return; }
  } catch { /* fall through */ }
  signIn();
})();
