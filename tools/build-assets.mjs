// Generates logos, icon sprite, avatars, camera tiles and the waiting room illustration.
// Dimensional vector art: gradients, soft shadows, highlights.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'img');
const out = (rel, svg) => {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, svg);
};

/* ---------- colour helpers ---------- */
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (h, amt) => {
  const t = amt < 0 ? 0 : 255;
  const a = Math.abs(amt);
  return toHex(hex(h).map((v) => v + (t - v) * a));
};

/* ---------- KobaMart logo mark ---------- */
out('kobamart-mark.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B7552"/><stop offset=".5" stop-color="#0B3D2E"/><stop offset="1" stop-color="#052319"/></linearGradient>
<linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="bag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#E4ECE7"/><stop offset="1" stop-color="#B9CBC0"/></linearGradient>
<linearGradient id="bagtop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CAD8CF"/><stop offset="1" stop-color="#EEF3EF"/></linearGradient>
<linearGradient id="amb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFD35A"/><stop offset=".5" stop-color="#F2A900"/><stop offset="1" stop-color="#B87A00"/></linearGradient>
<filter id="ds" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="2.6" flood-color="#021510" flood-opacity=".55"/></filter>
<filter id="ds2" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="#021510" flood-opacity=".5"/></filter>
</defs>
<rect x="3" y="3" width="90" height="90" rx="23" fill="url(#g)"/>
<rect x="3.6" y="3.6" width="88.8" height="88.8" rx="22.4" fill="none" stroke="#7BE0B4" stroke-opacity=".28" stroke-width="1.2"/>
<path d="M3 27a24 24 0 0 1 24-24h42a24 24 0 0 1 24 24v18C70 58 26 58 3 45z" fill="url(#gl)"/>
<ellipse cx="48" cy="73" rx="26" ry="5" fill="#021510" opacity=".35"/>
<path d="M33 36l-4-4M63 36l4-4" stroke="none"/>
<g filter="url(#ds)">
<path d="M26 40h44l-5 32H31z" fill="url(#bag)"/>
<path d="M26 40h44l-.9 5.6H26.9z" fill="url(#bagtop)"/>
<path d="M65 40l-5 32h5l5-32z" fill="#0B3D2E" opacity=".1"/>
<path d="M30 49c10 4 26 4 36 0" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/>
</g>
<g filter="url(#ds2)" fill="none" stroke-linecap="round">
<path d="M37 40c-1-8 1-14 5-17M59 40c1-8-1-14-5-17" stroke="url(#amb)" stroke-width="5.2"/>
<path d="M37.6 38c-.8-6 .6-11 3.6-14.4M58.4 38c.8-6-.6-11-3.6-14.4" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>
</g>
</svg>
`);

/* ---------- Linkup mark ---------- */
out('linkup-mark.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64">
<defs>
<linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6AA2FF"/><stop offset=".5" stop-color="#0B5CFF"/><stop offset="1" stop-color="#0638A8"/></linearGradient>
<filter id="s" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="2.4" flood-color="#031a52" flood-opacity=".6"/></filter>
<clipPath id="top"><rect x="48" y="0" width="30" height="32"/></clipPath>
</defs>
<g filter="url(#s)" fill="none" stroke-linecap="round">
<circle cx="34" cy="32" r="19" stroke="url(#r)" stroke-width="10"/>
<circle cx="62" cy="32" r="19" stroke="url(#r)" stroke-width="10"/>
<g clip-path="url(#top)"><circle cx="34" cy="32" r="19" stroke="url(#r)" stroke-width="10"/></g>
</g>
<g fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.8" stroke-linecap="round"><path d="M22 22a14 14 0 0 1 12-7M50 22a14 14 0 0 1 12-7"/></g>
</svg>
`);

/* ---------- icons ---------- */
const icons = {
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
  'mic-off': '<path d="M9 9v2a3 3 0 0 0 5 2.2M15 9V6a3 3 0 0 0-5.9-.8M5 11a7 7 0 0 0 11.2 5.6M19 11a7 7 0 0 1-.6 2.8M12 18v3M9 21h6M3 3l18 18"/>',
  video: '<rect x="3" y="6" width="12" height="12" rx="2"/><path d="M15 10l6-3v10l-6-3"/>',
  'video-off': '<path d="M15 10l6-3v10l-4-2M15 14v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M3 3l18 18"/>',
  'share-screen': '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 13V8M9.5 10.5L12 8l2.5 2.5M8 20h8"/>',
  record: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-4 3-6 6.5-6s6.5 2 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c3 0 4.5 2 4.5 5"/>',
  hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 12V6a1.5 1.5 0 0 1 3 0v8c0 4-2.5 7-6 7-2.5 0-4-1.2-5.2-3.2L3.5 14a1.5 1.5 0 0 1 2.5-1.6L8 15"/>',
  more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
  leave: '<path d="M3 14c5-5.5 13-5.5 18 0l-2.5 2.5-3.2-1.6v-2.6a10 10 0 0 0-6.6 0V15l-3.2 1.6z"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  document: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  paperclip: '<path d="M20 11l-8 8a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  send: '<path d="M3 11l18-7-7 18-3-8z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  download: '<path d="M12 4v11M7.5 11L12 15.5 16.5 11M5 20h14"/>',
  up: '<path d="M6 14l6-6 6 6"/>',
  down: '<path d="M6 10l6 6 6-6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
  book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
  table: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M9 10v9"/>',
  flag: '<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  logout: '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',
};
const symbols = Object.entries(icons)
  .map(([id, d]) => `<symbol id="${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</symbol>`)
  .join('\n');
out('sprite.svg', `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols}\n</svg>\n`);

/* ---------- People: shaded busts ---------- */
const dark = '#1A1412';

function bust(p, k) {
  const sk = p.skin;
  const skHi = shade(sk, 0.22);
  const skLo = shade(sk, -0.28);
  const skDeep = shade(sk, -0.45);
  const lip = toHex(hex(sk).map((v, i) => v * 0.62 + [120, 40, 60][i] * 0.38));
  const hairHi = shade(p.hair || dark, 0.35);
  const id = (n) => `${k}${n}`;

  const defs = `
<radialGradient id="${id('skin')}" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="${skHi}"/><stop offset=".5" stop-color="${sk}"/><stop offset="1" stop-color="${skLo}"/></radialGradient>
<linearGradient id="${id('neck')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skDeep}"/><stop offset=".45" stop-color="${skLo}"/><stop offset="1" stop-color="${sk}"/></linearGradient>
<linearGradient id="${id('cloth')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(p.cloth, 0.2)}"/><stop offset=".55" stop-color="${p.cloth}"/><stop offset="1" stop-color="${shade(p.cloth, -0.35)}"/></linearGradient>
<linearGradient id="${id('hair')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hairHi}"/><stop offset=".5" stop-color="${p.hair || dark}"/><stop offset="1" stop-color="${shade(p.hair || dark, -0.3)}"/></linearGradient>
<linearGradient id="${id('wrap')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD35A"/><stop offset=".5" stop-color="#F2A900"/><stop offset="1" stop-color="#A86E00"/></linearGradient>
<linearGradient id="${id('lens')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".5" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity=".18"/></linearGradient>
<clipPath id="${id('nk')}"><rect x="51" y="62" width="18" height="32" rx="7"/></clipPath>
<filter id="${id('blur')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="${id('blur2')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1"/></filter>`;

  const shoulders = `M4 126C4 99 29 88 60 88s56 11 56 38z`;
  const body = `
<path d="${shoulders}" fill="url(#${id('cloth')})"/>
<path d="M4 126C4 99 29 88 60 88c-8 6-22 10-34 14-10 4-17 12-20 24z" fill="#fff" opacity=".1"/>
<path d="M116 126c0-27-25-38-56-38 14 6 28 12 40 22 8 6 14 10 16 16z" fill="#000" opacity=".22"/>
${p.clothDetail}`;

  const neck = `
<rect x="51" y="62" width="18" height="32" rx="7" fill="url(#${id('neck')})"/>
<g clip-path="url(#${id('nk')})"><ellipse cx="60" cy="70" rx="13" ry="7" fill="#000" opacity=".3" filter="url(#${id('blur2')})"/></g>`;

  const ears = `
<ellipse cx="41.3" cy="53" rx="3.4" ry="5.6" fill="${skLo}"/><ellipse cx="41.8" cy="53" rx="1.8" ry="3.4" fill="${skDeep}" opacity=".55"/>
<ellipse cx="78.7" cy="53" rx="3.4" ry="5.6" fill="${skLo}"/><ellipse cx="78.2" cy="53" rx="1.8" ry="3.4" fill="${skDeep}" opacity=".55"/>`;

  const head = `<ellipse cx="60" cy="50" rx="19.5" ry="22.5" fill="url(#${id('skin')})"/>
<ellipse cx="60" cy="50" rx="19.5" ry="22.5" fill="none" stroke="${skDeep}" stroke-opacity=".25" stroke-width=".8"/>`;

  const brow = p.brow || p.hair || dark;
  const face = `
<ellipse cx="46" cy="59" rx="4.4" ry="3" fill="#C2504A" opacity=".13" filter="url(#${id('blur2')})"/>
<ellipse cx="74" cy="59" rx="4.4" ry="3" fill="#C2504A" opacity=".13" filter="url(#${id('blur2')})"/>
<path d="M45.5 47.2c2.4-2 5.8-2.2 8.4-.7M66 46.5c2.6-1.5 6-1.3 8.4.7" fill="none" stroke="${brow}" stroke-width="1.7" stroke-linecap="round"/>
<g><path d="M47.6 51.6c1.6-2 5-2.4 7.4-.2-.6 2.5-6.6 3.4-7.4.2z" fill="#F4EEE8"/><circle cx="51.4" cy="51.7" r="1.95" fill="#3A2216"/><circle cx="51.4" cy="51.7" r=".95" fill="#000"/><circle cx="50.8" cy="51" r=".55" fill="#fff"/>
<path d="M47.2 51.2c2-2.3 5.8-2.4 8.2-.1" fill="none" stroke="${skDeep}" stroke-width=".9" stroke-linecap="round"/></g>
<g><path d="M65 51.4c2.4-2.2 5.8-1.8 7.4.2-.8 3.2-6.8 2.3-7.4-.2z" fill="#F4EEE8"/><circle cx="68.6" cy="51.7" r="1.95" fill="#3A2216"/><circle cx="68.6" cy="51.7" r=".95" fill="#000"/><circle cx="68" cy="51" r=".55" fill="#fff"/>
<path d="M64.6 51.1c2.4-2.3 6.2-2.2 8.2.1" fill="none" stroke="${skDeep}" stroke-width=".9" stroke-linecap="round"/></g>
<path d="M60 49.5c-.9 4.6-2.4 8.2-3.6 10.2 1.9 1.5 5.3 1.5 7.2 0-1.2-2-2.7-5.6-3.6-10.2z" fill="${skDeep}" opacity=".28"/>
<ellipse cx="58.7" cy="53.5" rx="1.1" ry="4" fill="#fff" opacity=".16"/>
<path d="M56.6 60.3c.8.9 1.6 1 2.4.5M63.4 60.3c-.8.9-1.6 1-2.4.5" fill="none" stroke="${skDeep}" stroke-width="1" stroke-linecap="round" opacity=".7"/>
<path d="M53.6 65.6c2-1.3 4-1.6 6.4-.9 2.4-.7 4.4-.4 6.4.9-1.9 3.1-4 4-6.4 4s-4.5-.9-6.4-4z" fill="${lip}"/>
<path d="M53.6 65.6c2-1.3 4-1.6 6.4-.9 2.4-.7 4.4-.4 6.4.9-2.4.9-4.4 1.3-6.4 1.1-2-.2-4-.2-6.4-1.1z" fill="#000" opacity=".16"/>
<ellipse cx="60" cy="68" rx="3.2" ry=".9" fill="#fff" opacity=".28"/>
<path d="M54 65.6h12" stroke="${skDeep}" stroke-width=".7" opacity=".7"/>`;

  return `<defs>${defs}</defs>${p.back ? p.back(id) : ''}${body}${neck}${ears}${head}${p.faceExtra ? p.faceExtra(id, { sk, skLo, skDeep, hairHi }) : ''}${face}${p.front ? p.front(id, { sk, skLo, skDeep, hairHi }) : ''}${p.accessory ? p.accessory(id) : ''}`;
}

const people = {
  ifeoma: {
    skin: '#7A4A34', hair: dark, cloth: '#1F2A44', bg: '#DDE7F0', tone: ['#EDF3F9', '#C6D4E3'],
    clothDetail: `
<path d="M47 89l13 24 13-24-13 2z" fill="#E9E4DA"/><path d="M50 89l10 20 10-20z" fill="#7A4A34"/><path d="M50 89l10 20 10-20z" fill="#000" opacity=".12"/>
<path d="M47 89L33 122M73 89l14 33" stroke="#3B4B78" stroke-width="2.2" fill="none"/>
<path d="M47 89l8 15-8 12-14 6 4-20zM73 89l-8 15 8 12 14 6-4-20z" fill="#2B3A62" opacity=".85"/>
<circle cx="60" cy="108" r="1.5" fill="#C9A24A"/>`,
    back: (id) => `<g fill="url(#${id('hair')})">${Array.from({ length: 13 }, (_, i) => {
      const a = (200 + i * (140 / 12)) * (Math.PI / 180);
      return `<circle cx="${(60 + 23.6 * Math.cos(a)).toFixed(1)}" cy="${(46 + 24 * Math.sin(a)).toFixed(1)}" r="9.4"/>`;
    }).join('')}<ellipse cx="60" cy="38" rx="22" ry="16"/></g>`,
    front: (id) => `<path d="M40.4 49c-1.6-12 5-21.5 19.6-21.5S79.2 37 79.6 49c-2.4-6.4-5.8-10.4-9.6-12.6-6.2 2.4-13.8 2.4-20 0-3.8 2.2-7.2 6.2-9.6 12.6z" fill="url(#${id('hair')})"/>
<path d="M48 31c5-3 11-3.6 17-2" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2" stroke-linecap="round"/>`,
    accessory: () => `<circle cx="41.5" cy="59.5" r="1.8" fill="#E8C766"/><circle cx="78.5" cy="59.5" r="1.8" fill="#E8C766"/>`,
  },
  tunde: {
    skin: '#8D5B3E', hair: dark, cloth: '#2E6F5E', bg: '#E9E3D5', tone: ['#F6F2E8', '#CFC6B1'],
    clothDetail: `
<path d="M50 89l10 14 10-14-4-2-6 7-6-7z" fill="#8D5B3E"/><path d="M50 89l10 14 10-14-4-2-6 7-6-7z" fill="#000" opacity=".16"/>
<path d="M49 88l-10 8 9 14 12-7zM71 88l10 8-9 14-12-7z" fill="#3C8571"/>
<path d="M49 88l-10 8 9 14 3-2-6-12 7-6zM71 88l10 8-9 14-3-2 6-12-7-6z" fill="#1F5546" opacity=".6"/>
<path d="M60 103v22" stroke="#1F5546" stroke-width="1.2" opacity=".7"/>`,
    faceExtra: (id, c) => `<path d="M41.6 53c.2 15 8 23.6 18.4 23.6S78.2 68 78.4 53c-1.6 7.6-5.6 10-9.4 10.4-3 1.4-6 1.8-9 1.8s-6-.4-9-1.8c-3.8-.4-7.8-2.8-9.4-10.4z" fill="url(#${id('hair')})"/>
<path d="M51 62.4c3-.7 5.6-.2 9 .4 3.4-.6 6-1.1 9-.4-2 2.6-5.4 3-9 3s-7-.4-9-3z" fill="${dark}"/>`,
    front: (id) => `<path d="M40.6 49c-1.4-13 6-22.4 19.4-22.4S79 36 79.4 49c-3.2-5.6-8.6-8.6-19.4-8.6S43.8 43.4 40.6 49z" fill="url(#${id('hair')})"/>
<path d="M47 33c6-2.4 13-2.6 20-.6" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="2" stroke-linecap="round"/>`,
  },
  amaka: {
    skin: '#9A6544', hair: dark, cloth: '#3A3A40', bg: '#EADCE5', tone: ['#F6EDF2', '#D3BFCC'],
    clothDetail: `
<path d="M46 89l14 22 14-22-14 2z" fill="#D9D5DC"/><path d="M50 89l10 18 10-18z" fill="#9A6544"/><path d="M50 89l10 18 10-18z" fill="#000" opacity=".14"/>
<path d="M46 89l-12 33 14-7 8-12zM74 89l12 33-14-7-8-12z" fill="#4B4B52"/>
<path d="M46 89l-12 33M74 89l12 33" stroke="#25252A" stroke-width="1.6" fill="none"/>`,
    back: (id) => `<g><circle cx="60" cy="21.6" r="9.8" fill="url(#${id('hair')})"/>
<g stroke="#fff" stroke-opacity=".16" stroke-width="1" fill="none"><path d="M52.5 18c4 4 11 4 15 0M52 22.5c4.4 4 11.6 4 16 0M53.5 26.5c3.4 2.8 9.6 2.8 13 0"/></g></g>`,
    front: (id) => `<path d="M40.4 50c-2-14.6 6-24.6 19.6-24.6S81.8 35.4 79.6 50c-1.8-8-5.4-14.2-11.2-17-4.6 2.6-12.2 2.6-16.8 0-5.8 2.8-9.4 9-11.2 17z" fill="url(#${id('hair')})"/>
<g stroke="#fff" stroke-opacity=".17" stroke-width=".9" fill="none"><path d="M47.6 31c.6 4 1.4 7 3.2 10M53 28.6c.2 4 .6 7.4 1.4 10.6M60 27.6v11M67 28.6c-.2 4-.6 7.4-1.4 10.6M72.4 31c-.6 4-1.4 7-3.2 10"/></g>`,
    accessory: (id) => `<g fill="none" stroke="#17171A" stroke-width="1.7"><rect x="45" y="46.8" width="13.2" height="9.6" rx="4.2"/><rect x="61.8" y="46.8" width="13.2" height="9.6" rx="4.2"/><path d="M58.2 50.6c1-1 2.6-1 3.6 0"/><path d="M45 50l-3.6-.8M75 50l3.6-.8"/></g>
<rect x="45.4" y="47.2" width="12.4" height="8.8" rx="3.8" fill="url(#${id('lens')})"/><rect x="62.2" y="47.2" width="12.4" height="8.8" rx="3.8" fill="url(#${id('lens')})"/>`,
  },
  kemi: {
    skin: '#B07650', hair: dark, cloth: '#F7F1E3', bg: '#DCEBDD', tone: ['#EFF7EF', '#BFD6C2'],
    clothDetail: `
<path d="M44 89c4 10 12 16 16 16s12-6 16-16c-5 1-11 2-16 2s-11-1-16-2z" fill="#B07650"/><path d="M44 89c4 10 12 16 16 16s12-6 16-16c-5 1-11 2-16 2s-11-1-16-2z" fill="#000" opacity=".12"/>
<path d="M44 89c-6 3-12 8-14 14M76 89c6 3 12 8 14 14" stroke="#D9CDB4" stroke-width="1.6" fill="none"/>
<path d="M40 104c8 6 14 9 20 9s12-3 20-9" stroke="#fff" stroke-opacity=".6" stroke-width="1.2" fill="none"/>`,
    back: (id) => `<path d="M71 20c9-9 22-6 22 3 0 6-7 8-12 6 2 4-1 8-6 8z" fill="url(#${id('wrap')})"/>
<path d="M74 22c6-5 14-3 15 1M77 28c4-2 8-1 10 1" stroke="#7C4F00" stroke-opacity=".4" stroke-width="1" fill="none"/>`,
    front: (id) => `<path d="M39.6 50c-2.4-15 6.2-27.2 20.4-27.2S82.8 35 80.4 50c-3.4-7-9.6-11-20.4-11S43 43 39.6 50z" fill="url(#${id('wrap')})"/>
<g fill="none" stroke-linecap="round"><path d="M42 44c6-6 15-9 24-8M43 38c6-6 15-9 24-8M48 31c5-2 11-2.8 17-1.4" stroke="#7C4F00" stroke-opacity=".38" stroke-width="1.3"/><path d="M44 41c5-4.4 12-7 19-6.6M52 28c5-1.4 10-1 14 .8" stroke="#fff" stroke-opacity=".38" stroke-width="1.6"/></g>
<path d="M39.8 46c.2-3 1.2-6 3.4-8.4" stroke="#7C4F00" stroke-opacity=".3" stroke-width="1.2" fill="none"/>`,
    accessory: () => `<circle cx="41.2" cy="60.4" r="2.1" fill="#F2A900"/><circle cx="41.2" cy="60.4" r=".8" fill="#fff" opacity=".7"/><circle cx="78.8" cy="60.4" r="2.1" fill="#F2A900"/><circle cx="78.8" cy="60.4" r=".8" fill="#fff" opacity=".7"/>`,
  },
};

function avatarSvg(key) {
  const p = people[key];
  const k = key.slice(0, 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<defs><clipPath id="${k}c"><circle cx="60" cy="60" r="60"/></clipPath>
<radialGradient id="${k}bg" cx=".3" cy=".2" r=".95"><stop offset="0" stop-color="${p.tone[0]}"/><stop offset="1" stop-color="${p.tone[1]}"/></radialGradient>
<radialGradient id="${k}vg" cx=".5" cy=".5" r=".6"><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient></defs>
<g clip-path="url(#${k}c)">
<rect width="120" height="120" fill="url(#${k}bg)"/>
${bust(p, k)}
<rect width="120" height="120" fill="url(#${k}vg)"/>
<circle cx="60" cy="60" r="59.2" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.6"/>
</g>
</svg>
`;
}

function sceneSvg(key) {
  const p = people[key];
  const k = key.slice(0, 2);
  const [a, b] = p.tone;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="${k}wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${shade(b, -0.1)}"/></linearGradient>
<radialGradient id="${k}vig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient>
<linearGradient id="${k}win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient>
<filter id="${k}bl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="${k}bl2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>
<rect width="320" height="180" fill="url(#${k}wall)"/>
<g filter="url(#${k}bl)">
<rect x="14" y="14" width="64" height="86" rx="3" fill="url(#${k}win)"/>
<rect x="238" y="40" width="70" height="8" rx="2" fill="${shade(b, -0.35)}" opacity=".55"/><rect x="238" y="70" width="70" height="8" rx="2" fill="${shade(b, -0.35)}" opacity=".55"/><rect x="238" y="100" width="70" height="8" rx="2" fill="${shade(b, -0.35)}" opacity=".55"/>
<circle cx="268" cy="30" r="9" fill="#F2A900" opacity=".5"/><circle cx="290" cy="58" r="7" fill="#0B3D2E" opacity=".45"/><circle cx="256" cy="88" r="8" fill="#3A8F6C" opacity=".5"/>
<ellipse cx="42" cy="150" rx="26" ry="20" fill="#3A8F6C" opacity=".55"/>
</g>
<g filter="url(#${k}bl2)" fill="#fff"><circle cx="110" cy="30" r="7" opacity=".28"/><circle cx="212" cy="24" r="5" opacity=".24"/><circle cx="196" cy="140" r="6" opacity=".16"/></g>
<g transform="translate(76 14) scale(1.46)">${bust(p, k)}</g>
<rect width="320" height="180" fill="url(#${k}vig)"/>
</svg>
`;
}

for (const key of Object.keys(people)) out(`avatars/${key}.svg`, avatarSvg(key));
for (const key of ['ifeoma', 'tunde', 'amaka']) out(`cam/${key}.svg`, sceneSvg(key));

/* ---------- Empty waiting room illustration (under 10 KB) ---------- */
out('empty-room.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110">
<defs>
<linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A4A4F"/><stop offset="1" stop-color="#2B2B2E"/></linearGradient>
<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A5A60"/><stop offset="1" stop-color="#3A3A3E"/></linearGradient>
<linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6AA2FF"/><stop offset="1" stop-color="#0B5CFF"/></linearGradient>
<filter id="s" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".55"/></filter>
</defs>
<ellipse cx="80" cy="98" rx="62" ry="7" fill="#000" opacity=".35"/>
<g filter="url(#s)">
<rect x="26" y="40" width="46" height="36" rx="10" fill="url(#a)"/><rect x="88" y="40" width="46" height="36" rx="10" fill="url(#a)"/>
<rect x="20" y="64" width="120" height="26" rx="9" fill="url(#b)"/>
<rect x="30" y="66" width="100" height="3" rx="1.5" fill="#fff" opacity=".12"/>
<rect x="30" y="88" width="7" height="10" rx="2" fill="#2B2B2E"/><rect x="123" y="88" width="7" height="10" rx="2" fill="#2B2B2E"/>
</g>
<g filter="url(#s)"><circle cx="80" cy="22" r="11" fill="none" stroke="url(#r)" stroke-width="4"/></g>
<path d="M80 15.5v6.5l4 2.4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
</svg>
`);

console.log('assets written');
