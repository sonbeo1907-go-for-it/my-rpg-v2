
import {isAlive} from "./actor-life.js";
// Damage type selects defense/evasion/reactions; the authored scaling selects power independently.
export function scalingKeys(effect) {
  return effect.scalingStats ?? [effect.scalingStat ?? (effect.type==='damage' && effect.damageType==='physical' ? 'attack' : 'magic')];
}
export function scalingValue(effect,read) {
  const keys=scalingKeys(effect);
  return keys.reduce((sum,key)=>sum+read(key),0)/keys.length;
}
export function scalingLabel(effect,labels) {
  const keys=scalingKeys(effect),names=keys.map(key=>labels[key]??key);
  return keys.length>1 ? '('+names.join(' + ')+')/'+keys.length : names[0];
}
export function splashEnemies(battle,actor,targetId) {
  const members=battle.actors.filter(other=>other.team!==actor.team);
  const anchor=members.find(other=>other.id===targetId && isAlive(other));
  if (!anchor) return [];
  const slot=anchor.formationSlot??members.indexOf(anchor);
  return members.filter((other,index)=>isAlive(other) && Math.abs((other.formationSlot??index)-slot)<=1);
}
// Fixed formation slots include empty and fallen occupants. Never compress around a gap.
export function adjacentAllies(battle,actor) {
  const members=battle.actors.filter(other=>other.team===actor.team);
  const size=actor.team==='party'?4:members.length;
  const slot=actor.formationSlot??members.indexOf(actor);
  const slots=new Set([(slot+size-1)%size,(slot+1)%size]);
  return members.filter((other,index)=>other.id!==actor.id && isAlive(other) && slots.has(other.formationSlot??index));
}
