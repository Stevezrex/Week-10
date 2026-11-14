// Countdown from the server deadline, corrected by the server clock offset.
export function fmt(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const two = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${two(m)}:${two(sec)}` : `${two(m)}:${two(sec)}`;
}

export function startTimer({ deadline, offset, onTick, onZero }) {
  let fired = false;
  const tick = () => {
    const left = deadline - (Date.now() + offset);
    onTick(left);
    if (left <= 0 && !fired) { fired = true; clearInterval(id); onZero(); }
  };
  const id = setInterval(tick, 1000);
  tick();
  return () => clearInterval(id);
}
