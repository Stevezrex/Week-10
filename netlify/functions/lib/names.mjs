const words = (name) =>
  String(name || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 1);

function oneApart(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let diff = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++diff > 1) return false;
    if (a.length === b.length) { i++; j++; }
    else if (a.length > b.length) i++;
    else j++;
  }
  return diff + (a.length - i) + (b.length - j) <= 1;
}

const wordMatch = (a, b) => a === b || (a.length >= 5 && b.length >= 5 && oneApart(a, b));

export function namesMatch(n1, n2) {
  const a = words(n1);
  const b = words(n2);
  if (!a.length || !b.length) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.every((w) => long.some((x) => wordMatch(w, x)));
}

export const validName = (n) => words(n).length >= 1 && String(n).trim().length <= 120;
export const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 200;
