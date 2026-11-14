import { h, icon, clear, confirmDialog, brand, isAnswered, isPartial } from './ui.mjs';
import * as api from './api.mjs';
import { createSaver, saveLocal, loadLocal, clearLocal, localKey } from './store.mjs';
import { startTimer, fmt } from './timer.mjs';
import * as startView from './views/start.mjs';
import * as homeView from './views/home.mjs';
import * as researchView from './views/research.mjs';
import * as prepareView from './views/prepare.mjs';
import * as meetingView from './views/meeting.mjs';
import * as recordsView from './views/records.mjs';
import * as reviewView from './views/review.mjs';
import * as endedView from './views/ended.mjs';

const root = document.getElementById('root');

export const state = {
  data: null,
  status: null, // learner status from the server
  answers: {},
  rev: 0, // server revision this device last saw
  gen: 0, // reset generation
  changeSeq: 0,
  pendingNotice: '',
  notice: '',
  offset: 0,
  left: null,
  ended: null,
  saveState: '',
};

let allItems = [];
let itemsByKey = {};
let peopleById = {};
const promptBeat = {};
const listeners = new Set();
let saver = null;
let stopTimer = null;
let shell = null; // references to shell elements
let cleanup = null;
let routeName = 'start';

/* ---------- Data ---------- */

async function loadData() {
  const get = (p) => fetch(p, { credentials: 'same-origin' }).then((r) => r.json());
  const [kase, beats, records] = await Promise.all([get('/data/case.json'), get('/data/beats.json'), get('/data/records.json')]);
  state.data = { case: kase, beats: beats.beats, records };
  allItems = [...kase.prepare.items, ...beats.beats.flatMap((b) => b.prompts), ...records.items];
  itemsByKey = Object.fromEntries(allItems.map((i) => [i.key, i]));
  peopleById = Object.fromEntries(kase.people.map((p) => [p.id, p]));
  beats.beats.forEach((b) => b.prompts.forEach((p) => { promptBeat[p.key] = b.id; }));
}

export const screenItems = (screen) => allItems.filter((i) => i.screen === screen);

/* ---------- Context for views ---------- */

export const ctx = {
  get: (k) => state.answers[k],
  set(k, v) {
    state.answers = { ...state.answers, [k]: v };
    touched();
    listeners.forEach((fn) => fn(k));
  },
  setUi(patch) {
    state.answers = { ...state.answers, _ui: { ...(state.answers._ui || {}), ...patch } };
    touched();
  },
  item: (k) => itemsByKey[k],
  person: (id) => peopleById[id],
  people: () => state.data.case.people,
  data: () => state.data,
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  navigate: (hash) => { location.hash = hash; },
  endAttempt: () => endAttempt(),
  isComplete: (screen) => screenItems(screen).every((i) => isAnswered(i, state.answers[i.key])),
  progress(screen) {
    const items = screenItems(screen);
    const done = items.filter((i) => isAnswered(i, state.answers[i.key])).length;
    return { done, total: items.length };
  },
  beatOf: (key) => promptBeat[key],
  allItems: () => allItems,
  isAnswered: (key) => isAnswered(itemsByKey[key], state.answers[key]),
  isPartial: (key) => isPartial(itemsByKey[key], state.answers[key]),
  guidance: (k) => state.data.case.guidance[k],
  learnerName: () => state.status?.name || 'You',
};

/* The local copy records the server revision it was based on, and whether it holds unsent changes. */
function persistLocal(dirty) {
  const open = state.status?.open;
  if (!open) return;
  saveLocal(localKey(state.status.email, open.n), { answers: state.answers, baseRev: state.rev, gen: state.gen, dirty });
}

function touched() {
  state.changeSeq++;
  persistLocal(true);
  saver?.changed();
  updateShellStatus();
}

/* ---------- Server state ---------- */

function applyStatus(data) {
  state.status = data.status;
  state.offset = (data.serverNow || Date.now()) - Date.now();
}

const sameAnswers = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {});

/*
 Use the device copy only if it holds unsent changes and the server has not moved since the copy
 was taken. If another device saved in between, the server's work stays and the learner is told.
*/
async function hydrate(work) {
  const open = state.status.open;
  const local = await loadLocal(localKey(state.status.email, open.n));
  state.rev = work?.rev || 0;
  state.gen = work?.gen || 0;
  state.answers = work?.answers || {};
  if (!local || !local.dirty || sameAnswers(local.answers, work?.answers)) return;
  if (local.gen === state.gen && local.baseRev === state.rev) {
    state.answers = local.answers || {};
    state.changeSeq++;
    persistLocal(true);
    saver.markDirty();
    saver.flush();
  } else {
    persistLocal(false);
    state.pendingNotice = 'Newer work from another device was kept. Unsent changes on this device were not applied.';
  }
}

function makeSaver() {
  saver?.stop();
  saver = createSaver(async ({ keepalive }) => {
    const open = state.status?.open;
    if (!open) return true;
    const seq = state.changeSeq;
    const r = await api.learner('save', { n: open.n, answers: state.answers, gen: state.gen }, { keepalive });
    if (r.data.ended) { finishLocally(r.data); return true; }
    if (r.data.error === 'moved') { handleMoved(); return true; }
    if (r.status === 401) { handleSessionEnded(); return true; }
    if (r.status === 409) { handleClosed(); return true; }
    if (!r.ok) return false;
    if (r.data.rev !== undefined) state.rev = r.data.rev;
    persistLocal(state.changeSeq !== seq);
    return true;
  }, (s) => { state.saveState = s; updateSaveState(); });
}

function beginAttempt() {
  if (!state.saveState) state.saveState = 'saved';
  stopTimer?.();
  const deadline = Date.parse(state.status.open.deadline);
  stopTimer = startTimer({
    deadline, offset: state.offset,
    onTick: (left) => { state.left = left; updateTimer(); },
    onZero: () => autoSubmit(),
  });
}

/* Another login took this attempt. This device stops and saves nothing more. */
function handleMoved() {
  stopTimer?.();
  stopTimer = null;
  saver?.stop();
  state.status = null;
  state.answers = {};
  shell = null;
  state.notice = 'This attempt was opened on another device, so this device has stopped. Sign in again to take it back.';
  location.hash = '#/';
  render();
}

/* A 401 or 409 stops the sending. The device copy stays and is checked at the next sign in. */
function handleSessionEnded() {
  stopTimer?.();
  stopTimer = null;
  saver?.stop();
  state.status = null;
  state.answers = {};
  shell = null;
  state.notice = 'Your session ended. Sign in again. Your answers on this device are kept.';
  location.hash = '#/';
  render();
}

function handleClosed() {
  stopTimer?.();
  stopTimer = null;
  saver?.stop();
  const open = state.status?.open;
  if (open) clearLocal(localKey(state.status.email, open.n));
  state.status = null;
  state.answers = {};
  shell = null;
  state.notice = 'This attempt has ended. Sign in to see your attempts.';
  location.hash = '#/';
  render();
}

function finishLocally(data) {
  stopTimer?.();
  stopTimer = null;
  saver?.stop();
  const open = state.status?.open;
  if (open) clearLocal(localKey(state.status.email, open.n));
  state.ended = { attemptNo: data.attemptNo, attemptsLeft: data.attemptsLeft };
  state.status = null;
  state.answers = {};
  shell = null;
  location.hash = '#/ended';
  render();
}

/* ---------- Enter, start, resume ---------- */

export const actions = {
  async enter(name, email) {
    const r = await api.learner('enter', { name, email });
    if (!r.ok) return { error: r.data.message || 'Could not sign in. Try again.' };
    applyStatus(r.data);
    state.ended = null;
    return { work: r.data.work };
  },
  async resume() {
    makeSaver();
    const r = await api.learner('me');
    if (r.data.ended) { finishLocally(r.data); return; }
    if (r.data.error === 'moved') { handleMoved(); return; }
    if (r.status === 401) { handleSessionEnded(); return; }
    if (!r.ok || !r.data.status?.open) return;
    applyStatus(r.data);
    await hydrate(r.data.work);
    beginAttempt();
    location.hash = '#/home';
  },
  async start() {
    const r = await api.learner('start');
    if (!r.ok) return { error: r.data.message || 'Could not start the attempt.' };
    applyStatus(r.data);
    makeSaver();
    state.answers = {};
    state.rev = r.data.work?.rev || 0;
    state.gen = r.data.work?.gen || 0;
    state.saveState = 'saved';
    beginAttempt();
    location.hash = '#/home';
    return {};
  },
  async signOut() {
    await api.learner('signout');
    state.status = null;
    state.answers = {};
    render();
  },
};

/* ---------- Submit, reset ---------- */

function blankCount() {
  return allItems.filter((i) => !isAnswered(i, state.answers[i.key])).length;
}

async function submit(reason) {
  const open = state.status.open;
  try {
    await saveLocal(localKey(state.status.email, open.n), { answers: state.answers, baseRev: state.rev, gen: state.gen, dirty: true });
    const r = await api.learner('submit', { n: open.n, answers: state.answers, gen: state.gen, reason });
    if (r.data.ended) { finishLocally(r.data); return true; }
    if (r.data.error === 'moved') { handleMoved(); return true; }
    if (r.status === 401) { handleSessionEnded(); return true; }
    if (r.status === 409) { handleClosed(); return true; }
  } catch { /* handled below */ }
  banner('Could not submit. Check your connection and try again.');
  return false;
}

export async function endAttempt() {
  const open = state.status?.open;
  if (!open) return;
  const ok = await confirmDialog({
    title: 'Submit and finish?',
    text: `Your latest saved work will be recorded. You cannot change it afterwards. ${blankCount()} items are still blank. This ends attempt ${open.n} of ${state.status.max}.`,
    confirm: 'Submit', danger: true, cancel: 'Keep working',
  });
  if (ok) await submit('submit');
}

/* Runs once when the countdown reaches zero, and again when the signal returns if that call failed. */
let autoPending = false;
async function autoSubmit() {
  if (!state.status?.open) return;
  autoPending = !(await submit('timer'));
}

async function resetAttempt() {
  const open = state.status?.open;
  if (!open || open.resetUsed) return;
  const ok = await confirmDialog({
    title: 'Reset this attempt?',
    text: 'Every answer in this attempt is cleared. You can do this once per attempt.',
    confirm: 'Reset', danger: true, cancel: 'Cancel',
  });
  if (!ok) return;
  try {
    const r = await api.learner('reset', { n: open.n });
    if (r.data.ended) { finishLocally(r.data); return; }
    if (r.data.error === 'moved') { handleMoved(); return; }
    if (r.status === 401) { handleSessionEnded(); return; }
    if (r.status === 409 && r.data.error === 'no_attempt') { handleClosed(); return; }
    if (!r.ok) { banner(r.data.message === 'Reset used.' ? 'Reset used.' : 'Could not reset. Try again.'); return; }
    state.answers = {};
    state.rev = r.data.rev;
    state.gen = r.data.gen;
    open.resetUsed = true;
    await clearLocal(localKey(state.status.email, open.n));
    saver.stop();
    state.saveState = 'saved';
    shell = null;
    render();
  } catch {
    banner('Could not reset. Check your connection and try again.');
  }
}

/* ---------- Shell ---------- */

const NAV = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'research', label: 'Research', icon: 'book' },
  { id: 'prepare', label: 'Prepare', icon: 'clipboard', status: true },
  { id: 'meeting', label: 'Meeting', icon: 'video', status: true },
  { id: 'records', label: 'Records', icon: 'table', status: true },
  { id: 'review', label: 'Review', icon: 'flag' },
];

function banner(text) {
  const main = document.getElementById('main');
  if (!main) { alert(text); return; }
  main.querySelector('.notice.top')?.remove();
  const el = h('div', { class: 'notice top', role: 'alert', text });
  main.prepend(el);
  window.scrollTo({ top: 0 });
  setTimeout(() => el.remove(), 9000);
}

function buildShell() {
  const refs = {};
  refs.timer = h('span', { class: 'timer', role: 'timer' }, icon('clock'), h('span', { class: 'timer-text', text: '--:--' }), h('span', { class: 'timer-label', text: 'left' }));
  refs.save = h('span', { class: 'save-state', 'aria-live': 'polite' });
  refs.reset = h('button', { class: 'btn btn-ghost btn-reset', type: 'button', title: ctx.guidance('reset'), onclick: resetAttempt }, icon('refresh'), h('span', { class: 'reset-text', text: 'Reset' }));
  refs.menuReset = h('button', { class: 'btn', type: 'button', title: ctx.guidance('reset'), onclick: () => { refs.pop.hidden = true; resetAttempt(); } }, icon('refresh'), h('span', { class: 'menu-reset-text', text: 'Reset' }));
  refs.pop = h('div', { class: 'menu-pop', hidden: true }, refs.menuReset);
  refs.menuBtn = h('button', { class: 'btn btn-icon btn-ghost', type: 'button', 'aria-label': 'More actions', 'aria-expanded': 'false', onclick: () => { refs.pop.hidden = !refs.pop.hidden; refs.menuBtn.setAttribute('aria-expanded', String(!refs.pop.hidden)); } }, icon('more'));
  refs.end = h('button', { class: 'btn', type: 'button', title: ctx.guidance('logout'), onclick: () => endAttempt() }, icon('logout'), h('span', { class: 'end-text', text: 'Log out' }));

  const top = h('header', { class: 'topbar' },
    h('a', { href: '#/home', 'aria-label': 'KobaMart home' }, brand()),
    h('span', { class: 'topbar-spacer' }),
    refs.save, refs.timer, refs.reset,
    h('span', { class: 'menu-wrap' }, refs.menuBtn, refs.pop),
    refs.end,
  );

  refs.links = {};
  const rail = h('nav', { class: 'rail', 'aria-label': 'Sections' },
    h('div', { class: 'rail-title', text: 'Week 10' }),
    NAV.map((n) => {
      const dot = n.status ? h('span', { class: 'status-dot', 'aria-hidden': 'true' }) : null;
      const a = h('a', { class: 'rail-link', href: `#/${n.id}` }, icon(n.icon), h('span', { class: 'grow', text: n.label }), dot,
        n.status ? h('span', { class: 'sr-only', text: '' }) : null);
      refs.links[n.id] = { a, dot };
      return a;
    }),
    h('div', { class: 'rail-foot', text: 'Your work saves as you go.' }),
  );

  refs.tabs = {};
  refs.more = h('div', { class: 'more-pop', hidden: true },
    h('a', { href: '#/research' }, icon('book'), 'Research'),
    h('a', { href: '#/review' }, icon('flag'), 'Review'));
  refs.more.addEventListener('click', () => { refs.more.hidden = true; });
  const tab = (n) => { const a = h('a', { class: 'tab', href: `#/${n.id}` }, icon(n.icon), n.label); refs.tabs[n.id] = a; return a; };
  refs.moreBtn = h('button', { class: 'tab', type: 'button', 'aria-expanded': 'false', onclick: () => { refs.more.hidden = !refs.more.hidden; refs.moreBtn.setAttribute('aria-expanded', String(!refs.more.hidden)); } }, icon('menu'), 'More');
  const tabbar = h('nav', { class: 'tabbar', 'aria-label': 'Sections' }, tab(NAV[0]), tab(NAV[2]), tab(NAV[3]), tab(NAV[4]), refs.moreBtn);

  refs.main = h('main', { class: 'main', id: 'main', tabindex: '-1' });
  refs.el = h('div', { class: 'app' }, top, rail, refs.main, tabbar, refs.more);
  return refs;
}

function updateTimer() {
  if (!shell) return;
  shell.timer.querySelector('.timer-text').textContent = fmt(state.left ?? 0);
  shell.timer.classList.toggle('low', (state.left ?? 0) < 5 * 60 * 1000);
}

function updateSaveState() {
  if (!shell) return;
  const map = { saving: 'Saving', pending: 'Saving', saved: 'Saved', failed: 'Waiting for signal' };
  shell.save.textContent = map[state.saveState] ?? 'Saved';
  shell.save.title = state.saveState === 'failed' ? 'Your work is on this device only.' : '';
  shell.save.classList.toggle('failed', state.saveState === 'failed');
}

function updateShellStatus() {
  if (!shell) return;
  const open = state.status?.open;
  shell.reset.disabled = !!open?.resetUsed;
  shell.menuReset.disabled = !!open?.resetUsed;
  const label = open?.resetUsed ? 'Reset used' : 'Reset';
  shell.reset.querySelector('.reset-text').textContent = label;
  shell.menuReset.querySelector('.menu-reset-text').textContent = label;
  for (const n of NAV) {
    if (!n.status) continue;
    shell.links[n.id].dot.classList.toggle('done', ctx.isComplete(n.id));
  }
  const review = routeName === 'review';
  shell.end.querySelector('.end-text').textContent = review ? 'Submit and log out' : 'Log out';
  shell.end.classList.toggle('btn-primary', review);
}

function markNav() {
  for (const n of NAV) {
    shell.links[n.id].a.toggleAttribute('aria-current', false);
    if (shell.links[n.id].a.getAttribute('aria-current')) shell.links[n.id].a.removeAttribute('aria-current');
    shell.tabs[n.id]?.removeAttribute('aria-current');
  }
  const cur = shell.links[routeName];
  if (cur) cur.a.setAttribute('aria-current', 'page');
  shell.tabs[routeName]?.setAttribute('aria-current', 'page');
}

/* ---------- Routing ---------- */

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: parts[0] || 'start', param: parts[1] || null };
}

const views = { home: homeView, research: researchView, prepare: prepareView, meeting: meetingView, records: recordsView, review: reviewView };

async function render() {
  if (!state.data) return;
  saver?.flush();
  cleanup?.();
  cleanup = null;
  let { name, param } = parseRoute();
  const inAttempt = !!state.status?.open && !!saver;

  if (name === 'ended') {
    if (!state.ended) { location.hash = '#/start'; return; }
    shell = null;
    clear(root).append(endedView.render(ctx, state));
    return;
  }

  if (!inAttempt || name === 'start' || !views[name]) {
    if (inAttempt && name !== 'start' && !views[name]) { location.hash = '#/home'; return; }
    shell = null;
    routeName = 'start';
    clear(root);
    cleanup = startView.render(root, ctx, state, actions) || null;
    document.title = 'Week 10: Run the client meeting';
    return;
  }

  routeName = name;
  if (!shell || !root.contains(shell.el)) {
    shell = buildShell();
    clear(root).append(shell.el);
    updateTimer();
  }
  clear(shell.main);
  shell.main.append(h('div', { class: 'page' }));
  const page = shell.main.firstChild;
  markNav();
  updateShellStatus();
  updateSaveState();
  cleanup = views[name].render(page, ctx, param) || null;
  if (state.pendingNotice) { banner(state.pendingNotice); state.pendingNotice = ''; }
  document.title = `${NAV.find((n) => n.id === name).label} | Week 10`;
  if (!param) window.scrollTo({ top: 0 });
}

/* ---------- Boot ---------- */

async function boot() {
  try {
    await loadData();
  } catch {
    clear(root).append(h('div', { class: 'ended' }, h('h1', { text: 'This page could not load.' }), h('p', { class: 'muted', text: 'Check your connection and refresh.' })));
    return;
  }
  try {
    const r = await api.learner('me');
    if (r.ok && r.data.status) applyStatus(r.data);
  } catch { /* shows the cover */ }

  window.addEventListener('hashchange', render);
  window.addEventListener('online', () => { if (autoPending) autoSubmit(); else saver?.flush(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saver?.flush(true); });
  window.addEventListener('pagehide', () => saver?.flush(true));
  if (!location.hash || location.hash === '#/') location.hash = '#/start';
  render();
}

boot();
