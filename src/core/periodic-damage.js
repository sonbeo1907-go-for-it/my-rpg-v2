import {supportAmount} from './combat-math.js';
// Potency is per stack and snapshots the source at application; ticks never re-read live stats.
export function periodicPotency(status,source,read) {
  const dot=status.damageOverTime,passive=source?.passive;
  const bonus=passive?.type==='dot_potency_bonus' && passive.statusIds.includes(status.id) ? 1+passive.ratio : 1;
  return Math.max(1,supportAmount({...dot,multiplier:(dot.multiplier??0)*bonus,flat:(dot.flat??0)*bonus},read(dot.scalingStat)));
}
