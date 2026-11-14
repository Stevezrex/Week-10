// Master content. Marks live here and in the generated marking guide only.
// Run `node tools/build-data.mjs` after any change.

const o = (id, text, marks = 0) => ({ id, text, marks });

export const meeting = {
  title: 'Q1 courier partner decision',
  date: 'Thursday 26 November 2026',
  start: '10:00',
  end: '10:30',
  zone: 'WAT',
  platform: 'Linkup',
};

export const company = {
  name: 'KobaMart Nigeria Ltd.',
  summary:
    'Lagos online retailer of home and kitchen goods. Founded 2019. Head office in Opebi, Ikeja. About 42 staff and 2,400 orders a month, 70% in Lagos. CEO: Chinedu Okeke.',
};

export const people = [
  { id: 'ifeoma', name: 'Ifeoma Adebayo', short: 'Ifeoma', role: 'Head of Operations', authority: 'Approves courier contracts within the approved budget line. Sends anything above it to the CEO.', email: 'ifeoma@kobamart.example', avatar: 'ifeoma.svg' },
  { id: 'tunde', name: 'Tunde Bello', short: 'Tunde', role: 'Logistics Lead', authority: 'Compares and recommends. Cannot approve.', email: 'tunde@kobamart.example', avatar: 'tunde.svg' },
  { id: 'amaka', name: 'Amaka Obi', short: 'Amaka', role: 'Finance Manager', authority: 'Confirms the budget line.', email: 'amaka@kobamart.example', avatar: 'amaka.svg' },
  { id: 'kemi', name: 'Kemi Adeyemi', short: 'Kemi', role: 'Customer Support Lead', authority: 'Reports complaint trends. Advises.', email: 'kemi@kobamart.example', avatar: 'kemi.svg' },
  { id: 'chinedu', name: 'Chinedu Okeke', short: 'Chinedu', role: 'CEO', authority: 'Approves spend above the budget line.', email: 'chinedu@kobamart.example' },
  { id: 'sade', name: 'Sade Lawal', short: 'Sade', role: 'Warehouse Supervisor', authority: 'Runs dispatch.', email: 'sade@kobamart.example' },
  { id: 'femi', name: 'Femi Ajayi', short: 'Femi', role: 'SwiftLane account manager (external)', authority: '', email: 'femi.ajayi@swiftlane.example' },
  { id: 'dayo', name: 'Dayo Peters', short: 'Dayo', role: 'Operations intern', authority: '', email: 'dayo@kobamart.example' },
];

const P = Object.fromEntries(people.map((p) => [p.id, p.name]));

export const availability = {
  people: ['ifeoma', 'tunde', 'amaka', 'kemi'],
  slots: [
    { id: 'wed14', label: 'Wed 25 Nov, 14:00', cells: { ifeoma: 'Free', tunde: 'Free', amaka: 'Busy (payroll review)', kemi: 'Free' } },
    { id: 'thu10', label: 'Thu 26 Nov, 10:00', cells: { ifeoma: 'Free', tunde: 'Free', amaka: 'Free', kemi: 'Free' } },
    { id: 'thu15', label: 'Thu 26 Nov, 15:00', cells: { ifeoma: 'Free', tunde: 'Busy (warehouse audit)', amaka: 'Free', kemi: 'Free' } },
    { id: 'fri09', label: 'Fri 27 Nov, 09:00', cells: { ifeoma: 'Free', tunde: 'Free', amaka: 'Free', kemi: 'Busy (support rota)' } },
    { id: 'fri15', label: 'Fri 27 Nov, 15:00', cells: { ifeoma: 'Busy (travelling to Abuja)', tunde: 'Free', amaka: 'Free', kemi: 'Free' } },
  ],
};

export const documents = [
  {
    id: 'r1', code: 'R1', title: 'Brief from Ifeoma Adebayo', kind: 'email',
    from: 'Ifeoma Adebayo', to: 'You', subject: 'Courier partner decision, please set up a meeting this week',
    blocks: [
      { type: 'p', text: 'Hi,' },
      { type: 'p', text: 'We need to choose our courier partner for Q1 before the current contract ends on 31 December. I want to decide in a 30 minute online meeting this week with Tunde, Amaka and Kemi.' },
      { type: 'p', text: 'Tunde has compared the two options and Amaka holds the Q1 budget. Kemi has the latest complaint figures. Please plan the meeting, send the invitation and papers, run it, and send me the minutes and actions afterwards. You chair and take the minutes.' },
      { type: 'p', text: 'I can approve a courier contract within the approved budget line. Anything above it goes to Chinedu.' },
      { type: 'p', text: 'We need a decision by Friday 4 December to give 30 days\' notice for a 4 January start.' },
      { type: 'p', text: 'Thanks,' },
      { type: 'p', text: 'Ifeoma' },
    ],
  },
  {
    id: 'r2', code: 'R2', title: 'People and authority', kind: 'memo',
    blocks: [
      { type: 'p', text: 'KobaMart Nigeria Ltd. is a Lagos online retailer of home and kitchen goods, founded in 2019, with about 42 staff and 2,400 orders a month. Email addresses follow the format firstname@kobamart.example. Femi is at femi.ajayi@swiftlane.example.' },
      { type: 'table', columns: ['Person', 'Role', 'Authority'], rows: people.map((p) => [p.name, p.role, p.authority]) },
    ],
  },
  {
    id: 'r3', code: 'R3', title: 'Availability', kind: 'memo',
    blocks: [
      { type: 'p', text: 'Wednesday 25 to Friday 27 November, WAT. Free unless shown.' },
      { type: 'table', columns: ['Slot', 'Ifeoma', 'Tunde', 'Amaka', 'Kemi'], rows: availability.slots.map((s) => [s.label, ...availability.people.map((id) => s.cells[id])]) },
    ],
  },
  {
    id: 'r4', code: 'R4', title: 'Option comparison', kind: 'memo', from: 'Tunde Bello', date: '18 November',
    blocks: [
      { type: 'p', text: 'Figures from a six week pilot of 300 parcels per courier.' },
      {
        type: 'table', columns: ['', 'SwiftLane', 'Eko Express'],
        rows: [
          ['Lagos, per parcel', '₦2,800', '₦2,200'],
          ['Other states, per parcel', '₦6,500', '₦5,200'],
          ['Monthly cost (1,680 Lagos and 720 other state parcels)', '₦9,384,000', '₦7,440,000'],
          ['Lagos delivery', 'Same or next day', 'Same or next day'],
          ['Abuja and Port Harcourt delivery', '1 to 3 days', '3 to 5 days'],
          ['Delivered on time', '94%', '86%'],
          ['Failed on first attempt', '8%', '14%'],
          ['Contract', '12 months, 30 days\' notice', '12 months, 30 days\' notice'],
        ],
      },
    ],
  },
  {
    id: 'r5', code: 'R5', title: 'Q1 budget note', kind: 'memo', from: 'Amaka Obi',
    blocks: [
      { type: 'p', text: 'The Q1 courier budget line is ₦8,500,000 a month (₦25,500,000 for the quarter). Courier spend above the line needs CEO approval. Funds are confirmed in writing after the decision.' },
    ],
  },
  {
    id: 'r6', code: 'R6', title: 'Complaint trend', kind: 'memo', from: 'Kemi Adeyemi', date: '17 November',
    blocks: [
      { type: 'p', text: 'Late delivery complaints were 31% of support tickets in October, up from 22% in September. Most come from Abuja and Port Harcourt orders.' },
      { type: 'p', text: 'Customer details are held in the complaint log, which is restricted.' },
    ],
  },
  {
    id: 'r7', code: 'R7', title: 'KobaMart Meeting and Records Policy', kind: 'memo', from: 'Chinedu Okeke', date: 'Version 3, issued 1 March 2026',
    blocks: [
      {
        type: 'ol',
        items: [
          'A decision is recorded only when the person with authority states it. Recommendations are recorded as recommendations.',
          'The Head of Operations approves vendor contracts within the approved budget line. Spend above the line needs CEO approval.',
          'Papers go out before the meeting. Items without papers are deferred.',
          'A meeting is recorded only for a stated purpose. The chair announces it at the start. Recordings are stored in Operations/Meetings, open to the chair and the head of the function only, and deleted 30 days after the minutes are approved.',
          'Minutes are issued within 24 hours. They record decisions, actions with an owner and a due date, and unresolved matters.',
          'Minutes and action extracts go to attendees. Vendor pricing goes to the Head of Operations and the Finance Manager only. Customer complaint logs contain personal data and are not attached to meeting records or emails.',
          'Vendors do not attend internal decision meetings.',
          'Minutes are kept for six years.',
        ],
      },
    ],
  },
  {
    id: 'r8', code: 'R8', title: 'Linkup platform notes', kind: 'memo',
    blocks: [
      {
        type: 'ul',
        items: [
          'The waiting room is on by default. The host admits participants by name.',
          'Only the host can record. A banner shows to everyone when recording starts.',
          'Screen sharing is limited to the host until the host gives presenter rights.',
          'The host can mute any participant.',
          'Participants can join by phone.',
          'Audio mode, with no video, works on weak connections.',
        ],
      },
    ],
  },
];

/* ---------- Scored items ---------- */

const reqOptNo = [
  { id: 'req', text: 'Required' },
  { id: 'opt', text: 'Optional' },
  { id: 'no', text: 'Not invited' },
];

const invitee = (id, good) => ({
  id,
  label: P[id],
  options: reqOptNo.map((c) => ({ ...c, marks: good.includes(c.id) ? 0.5 : 0 })),
});

const personChoices = ['you', 'ifeoma', 'tunde', 'amaka', 'kemi'];
const roleField = (id, label, correct) => ({
  id,
  label,
  options: personChoices.map((c) => ({ id: c, text: c === 'you' ? 'You' : P[c], marks: c === correct ? 1 : 0 })),
});

const dueChoices = [
  ['fri27', 'Fri 27 Nov'], ['mon30', 'Mon 30 Nov'], ['tue1', 'Tue 1 Dec'], ['wed2', 'Wed 2 Dec'],
  ['thu3', 'Thu 3 Dec'], ['fri4', 'Fri 4 Dec'], ['asap', 'ASAP'], ['nextweek', 'Next week'],
];
const attendees = ['ifeoma', 'tunde', 'amaka', 'kemi'];
const actionItem = (key, ref, task, owner, due) => ({
  key, type: 'composite', ui: 'action', screen: 'records', section: 'actions', label: `Action ${ref}`, ref, task,
  fields: [
    { id: 'owner', label: 'Owner', options: attendees.map((a) => o(a, P[a], a === owner ? 1 : 0)) },
    { id: 'due', label: 'Due', options: dueChoices.map(([id, t]) => o(id, t, id === due ? 1 : 0)) },
  ],
});

const statusChoices = (good) => ['Proposed', 'Approved', 'Rejected', 'Deferred', 'Referred'].map((t) => o(t.toLowerCase(), t, t.toLowerCase() === good ? 1 : 0));
const actionRefs = ['a1', 'a2', 'a3'].map((id, i) => o(id, `A${i + 1}`, 0));

export const items = [
  /* Prepare, P1 */
  {
    key: 'p1_purpose', type: 'single', screen: 'prepare', section: 'p1', label: 'What is the purpose of the meeting?',
    options: [
      o('decide', 'Decide which courier partner KobaMart uses from 4 January 2027, within the approved budget line.', 3),
      o('compare', 'Compare SwiftLane and Eko Express and agree the next steps.', 1),
      o('discuss', 'Discuss courier options and complaints.', 0),
    ],
  },
  {
    key: 'p1_outcome', type: 'single', screen: 'prepare', section: 'p1', label: 'What outcome do you need from the meeting?',
    options: [
      o('decision', 'A decision', 3),
      o('recommendation', 'A recommendation for approval at a later meeting', 1),
      o('info', 'An information update', 0),
    ],
  },
  /* P2 */
  {
    key: 'p2_invitees', type: 'composite', ui: 'people_status', screen: 'prepare', section: 'p2', label: 'Who do you invite, and how?',
    fields: [
      invitee('ifeoma', ['req']), invitee('tunde', ['req']), invitee('amaka', ['req']), invitee('kemi', ['req', 'opt']),
      invitee('chinedu', ['no']), invitee('sade', ['no']), invitee('femi', ['no']), invitee('dayo', ['no']),
    ],
  },
  {
    key: 'p2_roles', type: 'composite', ui: 'roles', screen: 'prepare', section: 'p2', label: 'Who does what in the meeting?',
    fixed: { label: 'Chair, host and minute taker', value: 'You' },
    fields: [
      roleField('decide', 'Makes the decision', 'ifeoma'),
      roleField('present', 'Presents the options', 'tunde'),
      roleField('budget', 'Confirms the budget', 'amaka'),
    ],
  },
  /* P3 */
  {
    key: 'p3_order', type: 'order', ruleset: 'agenda', screen: 'prepare', section: 'p3', label: 'Put the agenda items in order.',
    items: [
      { id: 'budget', text: 'Budget check' },
      { id: 'complaint', text: 'Complaint trend' },
      { id: 'decide', text: 'Decision, actions and close' },
      { id: 'opening', text: 'Opening and purpose' },
      { id: 'option', text: 'Option comparison' },
    ],
    rules: { first: 'opening', last: 'decide', before: ['option', 'budget'] },
  },
  {
    key: 'p3_minutes', type: 'minutes', screen: 'prepare', section: 'p3', label: 'Give each item its minutes. The meeting is 30 minutes.',
    total: 30,
    ids: ['opening', 'complaint', 'option', 'budget', 'decide'],
    rules: { decideMin: 6, optionBudgetMin: 12 },
  },
  {
    key: 'p3_papers', type: 'ticks', screen: 'prepare', section: 'p3', label: 'Tick the papers you attach.',
    options: [
      { id: 'r4', text: 'Option comparison (R4)' },
      { id: 'r5', text: 'Q1 budget note (R5)' },
      { id: 'r6', text: 'Complaint trend summary (R6)' },
      { id: 'log', text: 'Customer complaint log (names and phone numbers)' },
      { id: 'staff', text: 'Staff directory' },
    ],
    correct: ['r4', 'r5'], max: 2,
  },
  /* P4 */
  {
    key: 'p4_slot', type: 'single', screen: 'prepare', section: 'p4', label: 'Choose the slot for the meeting.',
    options: [
      o('wed14', 'Wednesday 25 November, 14:00', 0),
      o('thu10', 'Thursday 26 November, 10:00', 2),
      o('thu15', 'Thursday 26 November, 15:00', 0),
      o('fri09', 'Friday 27 November, 09:00', 1),
      o('fri15', 'Friday 27 November, 15:00', 0),
    ],
  },
  {
    key: 'p4_invitation', type: 'ticks', ui: 'invitation', screen: 'prepare', section: 'p4', label: 'Tick what the invitation includes.',
    options: [
      { id: 'subject', text: 'Subject naming the purpose and date' },
      { id: 'purpose', text: 'Purpose and the decision needed' },
      { id: 'when', text: 'Date, start time, duration and time zone (WAT)' },
      { id: 'link', text: 'Joining link' },
      { id: 'agenda', text: 'Agenda and papers attached' },
      { id: 'contrib', text: 'What each person contributes and prepares' },
      { id: 'access', text: 'Contact for access needs' },
      { id: 'prices', text: 'Both couriers\' full price lists in the email body' },
      { id: 'reclink', text: 'A link to the meeting recording' },
    ],
    correct: ['subject', 'purpose', 'when', 'link', 'agenda', 'contrib', 'access'], max: 3,
  },
  /* P5 */
  {
    key: 'p5_access', type: 'single', screen: 'prepare', section: 'p5', label: 'How do people get into the meeting?',
    options: [
      o('access_name', 'Waiting room on. Admit by name against the invitee list.', 2),
      o('access_link', 'Waiting room on. Admit anyone with the link.', 1),
      o('access_open', 'Open link, no waiting room.', 0),
    ],
  },
  {
    key: 'p5_sharing', type: 'single', screen: 'prepare', section: 'p5', label: 'How is screen sharing set?',
    options: [
      o('share_host', 'Sharing limited to the host. Give Tunde presenter rights for the option comparison.', 1),
      o('share_all', 'Everyone can share at any time.', 0),
      o('share_hostall', 'The host shares and presents everything.', 0),
    ],
  },
  {
    key: 'p5_recording', type: 'single', screen: 'prepare', section: 'p5', label: 'What do you do about recording?',
    recordingIds: ['rec_minutes', 'rec_shared', 'rec_silent'],
    options: [
      o('rec_minutes', 'Record to check the minutes only. Announce it at the start. Limit access to the host. Delete it 30 days after the minutes are approved.', 2),
      o('rec_none', 'Do not record. Take the minutes live.', 2),
      o('rec_shared', 'Record, announce it, and store it on the shared drive for all staff.', 1),
      o('rec_silent', 'Record without announcing it.', 0),
    ],
  },

  /* Meeting */
  {
    key: 'opening_statement', type: 'text', typed: true, screen: 'meeting', label: 'Open the meeting. Type what you say.',
    hint: 'Type your opening.',
  },
  {
    key: 'm2_steps', type: 'order', ruleset: 'steps', screen: 'meeting', label: 'Put the steps in the order you would take them.',
    items: [
      { id: 's3', text: 'Ask Tunde whether he is joined on a second device' },
      { id: 's6', text: 'End the meeting and restart it' },
      { id: 's2', text: 'Mute Tunde from the host controls' },
      { id: 's5', text: 'Ask Tunde to leave and rejoin, or join by phone' },
      { id: 's1', text: 'Ask in chat who else hears the echo' },
      { id: 's4', text: 'Ask Tunde to use headphones or move away from his speaker' },
    ],
    rules: { order: ['s1', 's2', 's3', 's4', 's5'], last: 's6' },
  },
  {
    key: 'm3_absent', type: 'single', screen: 'meeting', label: 'What do you do?',
    options: [
      o('absent_msg', 'Message Amaka for her arrival time. Start with the complaint trend and the option comparison. Move the budget check to the end.', 5),
      o('absent_delay', 'Delay the start by 10 minutes.', 2),
      o('absent_decide', 'Start and decide without Finance. Ask Amaka to confirm later.', 1),
      o('absent_cancel', 'Cancel the meeting.', 0),
    ],
  },
  {
    key: 'm4_record', type: 'single', screen: 'meeting', label: 'What do you record for this item?',
    options: [
      o('rc_reco', 'Recommendation: Eko Express (Tunde Bello). Ifeoma Adebayo indicated support. Decision pending budget confirmation by Amaka Obi.', 5),
      o('rc_dec_subj', 'Decision: Eko Express approved subject to budget.', 2),
      o('rc_disc', 'Discussion on courier options.', 2),
      o('rc_dec', 'Decision: Eko Express approved.', 0),
    ],
  },
  {
    key: 'm5_paperless', type: 'single', screen: 'meeting', label: 'Kemi\'s packaging item has no paper.',
    options: [
      o('pp_log', 'Thank Kemi. Log it for a future agenda. Ask her to send a paper first.', 3),
      o('pp_email', 'Tell her to email you later.', 1),
      o('pp_add', 'Add 5 minutes for it now.', 0),
    ],
  },
  {
    key: 'm5_overrun', type: 'single', screen: 'meeting', label: 'The meeting is 4 minutes over.',
    options: [
      o('ov_sum', 'Summarize the point reached, take the remaining discussion in the decision item, and move on.', 2),
      o('ov_cut', 'Cut the discussion and skip the budget check.', 1),
      o('ov_run', 'Let it run.', 0),
    ],
  },
  {
    key: 'm6_action', type: 'single', screen: 'meeting', label: 'What do you do about "someone should chase Eko"?',
    options: [
      o('act_ask', 'Ask: Who owns this, and by what date? Record the answer.', 4),
      o('act_tunde', 'Assign it to Tunde with a deadline, without asking Ifeoma.', 2),
      o('act_self', 'Assign it to yourself.', 1),
      o('act_record', 'Record "Eko to be chased."', 0),
    ],
  },
  {
    key: 'closing_recap', type: 'text', typed: true, screen: 'meeting', label: 'Close the meeting. Type the recap you give.',
    hint: 'Type your closing recap.',
  },

  /* Records */
  {
    key: 'r_attendance', type: 'single', screen: 'records', section: 'minutes', label: 'Attendance line',
    options: [
      o('att_ok', 'Present: Ifeoma Adebayo, Tunde Bello, Kemi Adeyemi, Amaka Obi (joined 10:14). In attendance: minute taker. Apologies: none.', 1),
      o('att_all', 'Present: all four attendees. Apologies: none.', 0),
      o('att_apol', 'Present: Ifeoma, Tunde, Kemi. Apologies: Amaka Obi.', 0),
    ],
  },
  {
    key: 'r_headings', type: 'single', screen: 'records', section: 'minutes', label: 'Item headings',
    options: [
      o('hd_ok', '1 Opening and purpose, 2 Complaint trend, 3 Option comparison, 4 Budget check, 5 Decision and actions, 6 Other business and next meeting', 1),
      o('hd_decision', '1 Decision, 2 Actions, 3 Option comparison, 4 Budget check, 5 Complaint trend', 0),
      o('hd_alpha', 'Items in alphabetical order', 0),
    ],
  },
  {
    key: 'r_style', type: 'single', screen: 'records', section: 'minutes', label: 'Wording style',
    options: [
      o('st_ok', '3.2 Eko Express was recommended by the Logistics Lead. 5.1 Decision (D1): Eko Express was approved from 4 January 2027. 5.2 Action (A1): the Logistics Lead would obtain written confirmation by 1 December 2026.', 1),
      o('st_we', 'We decided to go with Eko Express. Tunde will get the confirmation by Tuesday.', 0),
      o('st_notes', 'The meeting notes that Eko Express is approved.', 0),
    ],
  },
  {
    key: 'minute_text', type: 'text', typed: true, screen: 'records', section: 'minutes',
    label: 'Write the minute for items 3 to 5: option comparison, budget check, and decision and actions.',
    hint: 'Write the minute in your own words.',
  },
  {
    key: 'd1', type: 'composite', ui: 'decision', screen: 'records', section: 'decisions', label: 'Decision D1', ref: 'D1',
    fields: [
      {
        id: 'wording', label: 'Wording',
        options: [
          o('w_full', 'Eko Express approved as the Q1 courier partner from 4 January 2027, subject to written confirmation of delivery to Abuja and Port Harcourt within 4 days', 2),
          o('w_plain', 'Eko Express approved as courier partner', 1),
          o('w_reco', 'Eko Express recommended', 0),
        ],
      },
      {
        id: 'authority', label: 'Authority',
        options: [
          o('au_ifeoma', 'Ifeoma Adebayo, Head of Operations', 1),
          o('au_tunde', 'Tunde Bello, Logistics Lead', 0),
          o('au_amaka', 'Amaka Obi, Finance Manager', 0),
          o('au_chinedu', 'Chinedu Okeke, CEO', 0),
        ],
      },
      {
        id: 'method', label: 'Method',
        options: [
          o('me_auth', 'Stated by the decision maker after discussion', 0),
          o('me_vote', 'Vote of those present', 0),
          o('me_agree', 'Agreed by all present', 0),
          o('me_chair', 'Decided by the chair', 0),
        ],
      },
      { id: 'status', label: 'Status', options: statusChoices('approved') },
      {
        id: 'condition', label: 'Conditions',
        options: [
          o('co_eko', 'Written confirmation from Eko Express of delivery to Abuja and Port Harcourt within 4 days', 1),
          o('co_budget', 'Written confirmation of the Q1 budget line from Finance', 0),
          o('co_ceo', 'Approval from the CEO', 0),
          o('co_none', 'None', 0),
        ],
      },
      { id: 'action', label: 'Related actions', options: actionRefs },
    ],
  },
  {
    key: 'd2', type: 'composite', ui: 'decision', screen: 'records', section: 'decisions', label: 'Decision D2', ref: 'D2',
    fields: [
      {
        id: 'wording', label: 'Wording',
        options: [
          o('w_defer', 'Packaging supplier change deferred until Kemi Adeyemi sends a paper', 1),
          o('w_approve', 'Packaging supplier change approved', 0),
          o('w_reject', 'Packaging supplier change rejected', 0),
        ],
      },
      { id: 'status', label: 'Status', options: statusChoices('deferred') },
      { id: 'action', label: 'Related actions', options: actionRefs.map((a) => ({ ...a, marks: a.id === 'a3' ? 1 : 0 })) },
    ],
  },
  actionItem('a1', 'A1', 'Obtain written confirmation from Eko Express of delivery to Abuja and Port Harcourt within 4 days', 'tunde', 'tue1'),
  actionItem('a2', 'A2', 'Send Ifeoma the Q1 courier budget line in writing', 'amaka', 'mon30'),
  actionItem('a3', 'A3', 'Send the packaging supplier paper to Ifeoma', 'kemi', 'wed2'),
  {
    key: 'recipients', type: 'ticks', ui: 'recipients', screen: 'records', section: 'followup', label: 'Who receives the follow up?',
    options: [
      { id: 'ifeoma', text: 'Ifeoma Adebayo' },
      { id: 'tunde', text: 'Tunde Bello' },
      { id: 'amaka', text: 'Amaka Obi' },
      { id: 'kemi', text: 'Kemi Adeyemi' },
      { id: 'chinedu', text: 'Chinedu Okeke' },
      { id: 'femi', text: 'Femi Ajayi' },
      { id: 'staff', text: 'All staff list' },
    ],
    correct: ['ifeoma', 'tunde', 'amaka', 'kemi'], max: 1,
  },
  {
    key: 'attachments', type: 'ticks', ui: 'attachments', screen: 'records', section: 'followup', label: 'Tick the attachments.',
    options: [
      { id: 'minutes', text: 'Minutes with decision summary' },
      { id: 'actions', text: 'Action register extract' },
      { id: 'prices', text: 'Option comparison with both price lists' },
      { id: 'log', text: 'Customer complaint log' },
      { id: 'rec', text: 'Meeting recording link' },
    ],
    correct: ['minutes', 'actions'], max: 2,
  },
  {
    key: 'followup_message', type: 'text', typed: true, ui: 'followup', screen: 'records', section: 'followup',
    label: 'Write the follow up email.', hint: 'Write the message to the attendees.',
  },
];

export const decisionColumns = ['Reference', 'Wording', 'Authority', 'Method', 'Status', 'Conditions', 'Related actions'];

/* ---------- Meeting beats ---------- */

export const beats = [
  {
    id: 'b1', n: 1, time: '10:00', title: 'Opening',
    lines: [
      { kind: 'speech', who: 'ifeoma', text: 'Good morning.' },
      { kind: 'speech', who: 'tunde', text: 'Morning. Can everyone hear me?' },
      { kind: 'speech', who: 'kemi', text: 'Morning all, I\'m in.' },
      { kind: 'system', text: 'Amaka Obi has not joined.' },
    ],
    prompts: ['opening_statement'],
  },
  {
    id: 'b2', n: 2, time: '10:03', title: 'Echo',
    badges: { tunde: 'echo' },
    lines: [
      { kind: 'speech', who: 'ifeoma', text: 'Let\'s start with the complaint numbers. Kemi?' },
      { kind: 'speech', who: 'kemi', text: 'Late delivery complaints were 31% of tickets in October, up from 22% in September. Most are from Abuja and Port Harcourt orders.' },
      { kind: 'chat', who: 'kemi', text: 'Tunde, there is an echo on your line.' },
      { kind: 'chat', who: 'ifeoma', text: 'I can hear myself too.' },
    ],
    prompts: ['m2_steps'],
  },
  {
    id: 'b3', n: 3, time: '10:06', title: 'Budget holder absent',
    lines: [
      { kind: 'speech', who: 'ifeoma', text: 'Is Amaka joining? We can\'t decide anything on budget without her.' },
      { kind: 'speech', who: 'tunde', text: 'I can take the comparison first if that helps.' },
      { kind: 'system', text: 'Participants: Amaka Obi is invited and has not joined.' },
    ],
    prompts: ['m3_absent'],
  },
  {
    id: 'b4', n: 4, time: '10:12', title: 'Recommendation',
    lines: [
      { kind: 'speech', who: 'tunde', text: 'Having looked at everything, I think we go with Eko Express. It is about ₦1.9m a month cheaper.' },
      { kind: 'speech', who: 'ifeoma', text: 'Sounds good to me.' },
      { kind: 'speech', who: 'kemi', text: 'Can I flag Abuja and Port Harcourt before we lock that in?' },
      { kind: 'system', text: '10:14 Amaka Obi joined.', effect: 'join:amaka' },
      { kind: 'speech', who: 'amaka', text: 'Sorry, I was on another call. Where are we?' },
    ],
    prompts: ['m4_record'],
  },
  {
    id: 'b5', n: 5, time: '10:18', title: 'Paperless item and overrun',
    lines: [
      { kind: 'speech', who: 'amaka', text: 'The Q1 courier line is ₦8.5m a month. Eko at ₦7.44m fits. SwiftLane at ₦9.38m would need Chinedu\'s approval.' },
      { kind: 'speech', who: 'kemi', text: 'Before we close, can we also switch our packaging supplier? Same logic, it is cheaper.' },
      { kind: 'speech', who: 'ifeoma', text: 'Is there a paper on that?' },
      { kind: 'speech', who: 'kemi', text: 'Not yet.' },
      { kind: 'system', text: 'Agenda: the option comparison is 4 minutes over.', effect: 'overrun' },
    ],
    prompts: ['m5_paperless', 'm5_overrun'],
  },
  {
    id: 'b6', n: 6, time: '10:26', title: 'Vague action',
    lines: [
      { kind: 'speech', who: 'tunde', text: 'Eko have told me informally they can do four days to Abuja and Port Harcourt. Nothing in writing.' },
      { kind: 'speech', who: 'ifeoma', text: 'Right. We go with Eko Express from 4 January, as long as they confirm Abuja and Port Harcourt delivery in writing. Amaka, send me the budget line in writing. And someone should chase Eko about the delivery times.' },
    ],
    afterKey: 'm6_action',
    afterLines: [
      { kind: 'speech', who: 'tunde', text: 'I\'ll take that.' },
      { kind: 'speech', who: 'ifeoma', text: 'Tunde, by Tuesday. Kemi, send me the packaging paper by Wednesday. We meet again Thursday at 10.' },
      { kind: 'speech', who: 'amaka', text: 'I\'ll send the budget line on Monday.' },
    ],
    prompts: ['m6_action'],
  },
  {
    id: 'b7', n: 7, time: '10:29', title: 'Close',
    lines: [
      { kind: 'speech', who: 'ifeoma', text: 'We are nearly out of time. Please close.' },
      { kind: 'speech', who: 'tunde', text: 'I have to drop at half past.' },
    ],
    prompts: ['closing_recap'],
  },
];

/* ---------- Records notes ---------- */

export const notes = [
  ['Date', 'Thursday 26 November 2026, 10:00 to 10:30 WAT, on Linkup.'],
  ['Present', 'Ifeoma Adebayo, Tunde Bello, Kemi Adeyemi, Amaka Obi (joined 10:14). In attendance: you, chair and minute taker. Apologies: none.'],
  ['Complaint trend (Kemi Adeyemi)', 'Late delivery complaints were 31% of tickets in October, up from 22% in September. Most come from Abuja and Port Harcourt orders.'],
  ['Option comparison (Tunde Bello)', 'Eko Express ₦7.44m a month, SwiftLane ₦9.38m. Abuja and Port Harcourt delivery: Eko 3 to 5 days, SwiftLane 1 to 3 days. Tunde recommended Eko Express. Ifeoma said "sounds good" at 10:12.'],
  ['Budget check (Amaka Obi, 10:18)', 'The Q1 courier line is ₦8.5m a month. Eko Express fits. SwiftLane would need CEO approval.'],
  ['Delivery times', 'Eko Express has told Tunde informally it can deliver to Abuja and Port Harcourt in four days. There is no written confirmation.'],
  ['10:18', 'Kemi asked to switch the packaging supplier. There is no paper. Ifeoma deferred it.'],
  ['10:26', 'Ifeoma decided: Eko Express from 4 January 2027, as long as Eko confirms Abuja and Port Harcourt delivery in writing.'],
  ['Actions', 'Tunde, written confirmation from Eko Express by Tuesday 1 December. Amaka, budget line in writing to Ifeoma by Monday 30 November. Kemi, packaging supplier paper to Ifeoma by Wednesday 2 December.'],
  ['Next meeting', 'Thursday 3 December 2026, 10:00 WAT.'],
];

export const guidance = {
  cover: 'You have 3 attempts. Each attempt runs for 120 minutes from the moment you start. Your work saves as you go.',
  home: 'Work through Prepare, Meeting and Records in any order. Research stays open throughout.',
  research: 'Open each document from the list. Everything here is available while you work.',
  prepare: 'Complete each section. Your selections save automatically.',
  meeting: 'Messages appear as the meeting runs. Respond in the panel under the room. You can return to earlier moments.',
  records: 'The meeting notes are on the left. Complete each record on the right.',
  review: 'Unanswered items are listed. Select one to go back to it.',
  reset: 'Clears every answer in this attempt. Available once per attempt.',
  logout: 'Ends this attempt and records your work.',
};

export const sections = {
  prepare: [
    { id: 'p1', title: 'Purpose and outcome' },
    { id: 'p2', title: 'Invitees and roles' },
    { id: 'p3', title: 'Agenda and papers' },
    { id: 'p4', title: 'Invitation and slot' },
    { id: 'p5', title: 'Access and recording' },
  ],
  records: [
    { id: 'minutes', title: 'Minutes' },
    { id: 'decisions', title: 'Decision log' },
    { id: 'actions', title: 'Action register' },
    { id: 'followup', title: 'Follow up' },
  ],
};
