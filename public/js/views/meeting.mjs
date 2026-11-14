import { h, icon, clear, renderItem, reducedMotion, avatarEl } from '../ui.mjs';

const TILE_ORDER = ['ifeoma', 'tunde', 'kemi', 'amaka'];
const CAMERA_ON = { ifeoma: true, tunde: true, kemi: false, amaka: true };
const LINE_GAP = 1500;

const initials = (name) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export function render(root, ctx, param) {
  const { beats, case: kase } = ctx.data();
  const people = Object.fromEntries(ctx.people().map((p) => [p.id, p]));
  const learnerName = ctx.learnerName();
  const phone = window.matchMedia('(max-width: 639px)');
  const ui = () => ctx.get('_ui') || {};
  const furthest = () => ui().furthest || 0;

  let cur = (() => {
    const byParam = beats.findIndex((b) => b.id === param);
    const start = byParam >= 0 ? byParam : ui().current ?? furthest();
    return Math.max(0, Math.min(start, furthest()));
  })();
  let shown = 0;
  let timers = [];
  let panel = phone.matches ? null : 'chat';
  const offs = [];

  const recordingOn = () => {
    const item = ctx.item('p5_recording');
    return item.recordingIds.includes(ctx.get('p5_recording'));
  };
  const confirmedMap = () => ui().confirmed || {};
  const beatLines = (i) => {
    const b = beats[i];
    return [...b.lines, ...(b.afterKey && confirmedMap()[b.id] ? b.afterLines : [])];
  };

  /* ---------- Room ---------- */
  const clockEl = h('div', { class: 'room-clock' });
  const rightEl = h('div', { class: 'room-right' });
  const bannerHost = h('div');
  const gridEl = h('div', { class: 'grid' });
  const sideEl = h('aside', { class: 'side', 'aria-label': 'Meeting panels' });
  const captionEl = h('div', { class: 'captions', 'aria-live': 'polite' });
  const videosEl = h('div', { class: 'videos' }, gridEl, captionEl);
  const stageEl = h('div', { class: 'stage' }, videosEl, sideEl);
  const toolbarEl = h('div', { class: 'toolbar-wrap' });

  const room = h('section', { class: 'room', 'aria-label': 'Meeting room' },
    h('div', { class: 'room-top' },
      h('div', { class: 'room-title' }, h('img', { src: '/img/linkup-mark.svg', alt: '' }), icon('lock'), h('span', { text: kase.meeting.title })),
      clockEl, rightEl),
    bannerHost, stageEl, toolbarEl);

  function state() {
    const lines = beatLines(cur).slice(0, shown);
    const speech = [...lines].reverse().find((l) => l.kind === 'speech');
    const joinSeen = lines.some((l) => l.effect === 'join:amaka');
    return {
      lines,
      speaker: beats[cur].badges?.tunde === 'echo' ? 'tunde' : speech?.who || null,
      amakaJoined: cur > 3 || (cur === 3 && joinSeen),
      joinSeen,
      overrun: cur > 4 || (cur === 4 && lines.some((l) => l.effect === 'overrun')),
    };
  }

  function drawTop(st) {
    clockEl.replaceChildren(st.joinSeen && cur === 3 ? '10:14' : beats[cur].time, h('small', { text: kase.meeting.zone }));
    clear(rightEl);
    if (recordingOn()) rightEl.append(h('span', { class: 'rec-pill', text: 'Recording' }));
    clear(bannerHost);
    if (recordingOn()) bannerHost.append(h('div', { class: 'rec-banner', role: 'status', text: 'This meeting is being recorded.' }));
  }

  function tile(id, st) {
    const p = people[id];
    const joined = id !== 'amaka' || st.amakaJoined;
    const micOn = joined && (st.speaker === id || id === 'tunde');
    const el = h('div', { class: `tile${st.speaker === id && joined ? ' speaking' : ''}${joined ? '' : ' away'}`, dataset: { person: id } });
    if (joined && CAMERA_ON[id]) el.append(h('img', { class: 'cam', src: `/img/cam/${id}.svg`, alt: '' }));
    else el.append(h('div', { class: 'tile-off' }, avatarEl(p, 'lg')));
    if (!joined) el.append(h('div', { class: 'tile-away-text', text: 'Not joined' }));
    if (joined && beats[cur].badges?.[id] === 'echo') el.append(h('span', { class: 'tile-wave', 'aria-label': 'Echo on this line' }, h('i'), h('i'), h('i'), h('i'), h('i')));
    const mic = joined ? icon(micOn ? 'mic' : 'mic-off', micOn ? 'mic-on' : 'mic-off') : null;
    el.append(h('span', { class: 'tile-name' }, mic, p.name));
    return el;
  }

  function drawGrid(st) {
    clear(gridEl);
    TILE_ORDER.forEach((id) => gridEl.append(tile(id, st)));
    gridEl.append(h('div', { class: 'tile-self', 'aria-label': 'Your video, camera off' }, h('span', { class: 'initials', text: initials(learnerName) }), h('span', { class: 'tile-name', text: 'You' })));
    const speech = [...st.lines].reverse().find((l) => l.kind === 'speech');
    clear(captionEl);
    captionEl.classList.toggle('idle', !speech);
    if (speech) captionEl.append(h('strong', { text: people[speech.who].short }), speech.text);
    else captionEl.append('Live captions are on.');
  }

  /* ---------- Side panels ---------- */
  function chatBody(st) {
    const wrap = h('div', { class: 'chat' });
    for (let j = 0; j <= cur; j++) {
      const all = beatLines(j);
      const list = j === cur ? st.lines : all;
      if (!list.length) continue;
      wrap.append(h('div', { class: 'chat-day', text: beats[j].time }));
      list.forEach((l, idx) => {
        const fresh = j === cur && idx === list.length - 1 && !reducedMotion() && shown < all.length + 1 && wasAnimating;
        if (l.kind === 'system') { wrap.append(h('div', { class: `chat-line is-system${fresh ? ' new' : ''}`, text: l.text })); return; }
        const p = people[l.who];
        wrap.append(h('div', { class: `chat-line${l.kind === 'chat' ? ' is-chat' : ''}${fresh ? ' new' : ''}` },
          h('div', { class: 'chat-who' }, h('strong', { text: p.name }), l.kind === 'chat' ? 'in chat' : 'speaking'),
          h('div', { class: 'chat-text', text: l.text })));
      });
    }
    return wrap;
  }

  function peopleBody(st) {
    const joined = TILE_ORDER.filter((id) => id !== 'amaka' || st.amakaJoined);
    const line = (p, extra) => h('div', { class: 'person-line' }, avatarEl(p, 'sm'), h('div', { class: 'grow' }, h('div', { text: p.name }), extra), icon('mic-off'));
    return h('div', { class: 'people-group' },
      h('h3', { text: `In the meeting (${joined.length + 1})` }),
      joined.map((id) => line(people[id], h('div', { class: 'muted small', text: people[id].role }))),
      h('div', { class: 'person-line' }, h('span', { class: 'avatar avatar-sm avatar-initials', text: initials(learnerName) }), h('div', { class: 'grow' }, h('div', { text: 'You' }), h('div', { class: 'muted small', text: 'Host and chair' })), icon('video-off')),
      !st.amakaJoined ? [h('h3', { text: 'Invited, not joined' }), h('div', { class: 'person-line' }, avatarEl(people.amaka, 'sm'), h('div', { class: 'grow' }, h('div', { text: people.amaka.name }), h('div', { class: 'away', text: 'Invited, not joined' })))] : null,
      h('h3', { text: 'Waiting room' }),
      h('div', { class: 'lobby-empty' }, h('img', { src: '/img/empty-room.svg', alt: '' }), h('span', { text: 'No one is waiting.' })));
  }

  function agendaBody(st) {
    const order = ctx.get('p3_order');
    const mins = ctx.get('p3_minutes') || {};
    const spec = ctx.item('p3_order');
    if (!Array.isArray(order) || order.length !== spec.items.length) {
      return h('p', { class: 'muted', text: 'Your agenda is not set yet. Complete the agenda in Prepare.' });
    }
    const anyMinutes = Object.values(mins).some((v) => v !== '' && v !== undefined);
    let t = 0;
    const fmt = (m) => `10:${String(m).padStart(2, '0')}`;
    return h('div', null, order.map((id) => {
      const name = spec.items.find((x) => x.id === id).text;
      const m = Number(mins[id]) || 0;
      const time = anyMinutes ? (m ? `${fmt(t)} to ${t + m === 30 ? '10:30' : fmt(t + m)}` : 'No time set') : 'No time set';
      t += m;
      return h('div', { class: 'agenda-row' }, h('span', { class: 'agenda-time', text: time }), h('span', { class: 'agenda-name', text: name }), id === 'option' && st.overrun ? h('span', { class: 'agenda-over', text: 'Over by 4 min' }) : null);
    }));
  }

  function drawSide(st) {
    stageEl.classList.toggle('with-side', !!panel);
    sideEl.hidden = !panel;
    if (!panel) return;
    const tabs = [['chat', 'Chat'], ['people', 'People'], ['agenda', 'Agenda']];
    const body = h('div', { class: 'side-body' }, panel === 'chat' ? chatBody(st) : panel === 'people' ? peopleBody(st) : agendaBody(st));
    clear(sideEl).append(
      h('div', { class: 'side-tabs', role: 'tablist' },
        tabs.map(([id, label]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(panel === id), text: label, onclick: () => { panel = id; draw(); } })),
        h('button', { type: 'button', class: 'side-close', 'aria-label': 'Close panel', onclick: () => { panel = null; draw(); } }, icon('close'))),
      body);
    if (panel === 'chat') body.scrollTop = body.scrollHeight;
  }

  function drawToolbar() {
    const rec = recordingOn();
    const btn = (label, ico, opts = {}) => h('button', {
      type: 'button', class: `tb${opts.can ? ' can' : ''}${opts.on ? ' on' : ''}${opts.red ? ' red' : ''}${opts.phoneHide ? ' hide-phone' : ''}`,
      'aria-label': label, 'aria-pressed': opts.can ? String(panel === opts.panel) : null, onclick: opts.onclick || null,
    }, h('span', { class: 'ico' }, icon(ico)), h('span', { text: label }));
    clear(toolbarEl).append(h('div', { class: 'toolbar' },
      btn('Mic', 'mic'),
      btn('Camera', 'video-off', { red: true }),
      btn('Share', 'share-screen', { phoneHide: true }),
      btn('Record', 'record', { phoneHide: true, red: rec }),
      btn('Chat', 'chat', { can: true, panel: 'chat', on: panel === 'chat', onclick: () => { panel = panel === 'chat' ? null : 'chat'; draw(); } }),
      btn('Participants', 'people', { can: true, panel: 'people', on: panel === 'people', onclick: () => { panel = panel === 'people' ? null : 'people'; draw(); } }),
      btn('Raise hand', 'hand', { phoneHide: true }),
      btn('More', 'more', { phoneHide: true }),
      h('button', { type: 'button', class: 'tb leave', 'aria-label': 'Leave' }, h('span', { class: 'pill' }, icon('leave'), 'Leave'))));
  }

  let wasAnimating = false;
  function draw() {
    const st = state();
    drawTop(st);
    drawGrid(st);
    drawSide(st);
    drawToolbar();
  }

  /* ---------- Reveal ---------- */
  const stopTimers = () => { timers.forEach(clearTimeout); timers = []; };

  function revealFrom(startCount, total) {
    stopTimers();
    shown = startCount;
    wasAnimating = true;
    const step = () => {
      if (shown >= total) { wasAnimating = false; return; }
      shown += 1;
      draw();
      if (shown < total) timers.push(setTimeout(step, LINE_GAP));
      else wasAnimating = false;
    };
    step();
    if (shown < total) timers.push(setTimeout(step, LINE_GAP));
  }

  function openBeat() {
    stopTimers();
    const b = beats[cur];
    const total = beatLines(cur).length;
    const seen = ui().seen || {};
    if (seen[b.id] || reducedMotion()) {
      shown = total;
      wasAnimating = false;
      draw();
    } else {
      revealFrom(0, total);
    }
    if (!seen[b.id]) ctx.setUi({ seen: { ...seen, [b.id]: true } });
  }

  /* ---------- Response panel ---------- */
  const responseHost = h('div');

  function buildResponse() {
    const b = beats[cur];
    const confirmed = !!confirmedMap()[b.id];
    const last = cur === beats.length - 1;
    const ready = () => b.prompts.every((p) => ctx.isAnswered(p.key));

    const nav = h('div', { class: 'beatnav', role: 'group', 'aria-label': 'Meeting moments' },
      beats.map((bt, i) => h('button', {
        type: 'button', class: `beat-chip${confirmedMap()[bt.id] ? ' done' : ''}`, 'aria-current': i === cur ? 'step' : null, disabled: i > furthest(),
        onclick: () => goTo(i),
      }, h('small', { text: bt.time }), h('strong', { text: bt.title }))));

    const confirmBtn = h('button', { class: 'btn btn-primary', type: 'button', text: confirmed ? 'Update answer' : 'Confirm', disabled: !ready() });
    confirmBtn.addEventListener('click', () => {
      const wasConfirmed = !!confirmedMap()[b.id];
      ctx.setUi({
        confirmed: { ...confirmedMap(), [b.id]: true },
        furthest: Math.max(furthest(), Math.min(cur + 1, beats.length - 1)),
        current: cur,
      });
      if (b.afterKey && !wasConfirmed) {
        const total = beatLines(cur).length;
        revealFrom(b.lines.length, total);
      }
      buildResponse();
      draw();
    });

    const actions = h('div', { class: 'response-actions' }, confirmBtn);
    if (confirmed && !last) actions.append(h('button', { class: 'btn', type: 'button', text: `Continue to ${beats[cur + 1].time}`, onclick: () => goTo(cur + 1) }));
    if (confirmed && last) actions.append(h('a', { class: 'btn', href: '#/records', text: 'Continue to Records' }));

    const off = ctx.onChange((key) => { if (b.prompts.some((p) => p.key === key)) confirmBtn.disabled = !ready(); });
    cleanups.push(off);

    clear(responseHost).append(h('section', { class: 'card response-card response', 'aria-label': 'Your response' },
      nav,
      h('div', { class: 'prompt' }, h('h2', { text: `${b.time}  ${b.title}` }), b.prompts.map((p) => renderItem(p, ctx))),
      actions,
      confirmed && last ? h('div', { class: 'beat-done', role: 'status', text: 'The meeting has ended.' }) : null));
  }

  const cleanups = [];
  function goTo(i) {
    cur = i;
    history.replaceState(null, '', `#/meeting/${beats[i].id}`);
    ctx.setUi({ current: i });
    cleanups.splice(0).forEach((f) => f());
    buildResponse();
    openBeat();
    window.scrollTo({ top: 0 });
  }

  phone.addEventListener('change', () => { panel = phone.matches ? null : 'chat'; draw(); });

  root.append(
    h('div', { class: 'page-head' }, h('h1', { text: 'Meeting' }), h('p', { class: 'guide', text: ctx.guidance('meeting') })),
    h('div', { class: 'meeting' }, room, responseHost));

  buildResponse();
  openBeat();
  offs.push(ctx.onChange((key) => { if (['p3_order', 'p3_minutes', 'p5_recording'].includes(key)) draw(); }));

  return () => { stopTimers(); offs.forEach((f) => f()); cleanups.splice(0).forEach((f) => f()); };
}
