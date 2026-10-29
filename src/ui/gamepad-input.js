const ACTIONS = { 0: 'a', 1: 'b', 2: 'x', 3: 'y', 4: 'lb', 5: 'rb', 9: 'menu' };
export class GamepadReader {
  constructor() { this.reset(); }
  reset() { this.identity = null; this.previous = []; this.direction = null; this.repeatAt = 0; }
  read(pad, now) {
    if (!pad || !pad.connected || pad.mapping !== 'standard') { this.reset(); return { actions: [], scroll: 0 }; }
    const pressed = Array.from(pad.buttons, button => button.pressed || button.value > .5);
    const identity = `${pad.index}:${pad.id}`;
    if (this.identity !== identity) { this.reset(); this.identity = identity; this.previous = pressed; return { actions: [], scroll: 0 }; }
    const actions = Object.entries(ACTIONS).filter(([index]) => pressed[index] && !this.previous[index]).map(([, action]) => action);
    const x = pad.axes[0] ?? 0, y = pad.axes[1] ?? 0;
    let direction = pressed[12] ? 'up' : pressed[13] ? 'down' : pressed[14] ? 'left' : pressed[15] ? 'right' : null;
    if (!direction && Math.max(Math.abs(x), Math.abs(y)) > .55) direction = Math.abs(x) > Math.abs(y) ? x < 0 ? 'left' : 'right' : y < 0 ? 'up' : 'down';
    if (direction !== this.direction) { this.direction = direction; this.repeatAt = now + 350; if (direction) actions.push(direction); }
    else if (direction && now >= this.repeatAt) { actions.push(direction); this.repeatAt = now + 120; }
    this.previous = pressed;
    const scroll = Math.abs(pad.axes[3] ?? 0) > .25 ? pad.axes[3] : 0;
    // A frame performs at most one command; Menu and discrete buttons take priority.
    return { actions: actions.includes('menu') ? ['menu'] : actions.slice(0, 1), scroll };
  }
}
export function spatialNext(items, currentId, direction) {
  const current = items.find(item => item.id === currentId);
  if (!current) return items[0]?.id ?? null;
  const horizontal = direction === 'left' || direction === 'right';
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;
  let best = null, score = Infinity;
  for (const item of items) {
    if (item.id === currentId) continue;
    const dx = (item.left + item.right - current.left - current.right) / 2;
    const dy = (item.top + item.bottom - current.top - current.bottom) / 2;
    const primary = (horizontal ? dx : dy) * sign;
    if (primary <= 2) continue;
    const overlap = horizontal ? item.bottom > current.top && item.top < current.bottom : item.right > current.left && item.left < current.right;
    const candidate = primary + Math.abs(horizontal ? dy : dx) * 3 + (overlap ? 0 : 120);
    if (candidate < score) { best = item.id; score = candidate; }
  }
  return best;
}
