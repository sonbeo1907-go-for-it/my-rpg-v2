import {activeStatuses} from './status-state.js';

// Preferred resource replaces MP only when the full authored amount is available.
export function resourceCost(skill,actor) {
  const preferred=skill.cost?.preferResource;
  return preferred && (actor?.resourceValues?.[preferred.id]??0)>=preferred.amount ? preferred : skill.cost?.resource??null;
}
export function mpCost(skill,actor) {
  const base=skill.cost?.preferResource && resourceCost(skill,actor)===skill.cost.preferResource ? 0 : skill.cost?.mp??0,passive=actor?.passive;
  if (base<=0 || passive?.type!=='kill_mp_discount' || !(actor.statuses??[]).some(status=>status.id===passive.statusId && (status.remaining==null || status.remaining>0))) return base;
  return Math.max(1,Math.ceil(base*(1-passive.ratio)));
}
export function debuffTypeCount(content,target) {
  if (!target) return 0;
  return new Set(activeStatuses({...target,statuses:target.statuses??[]}).filter(status=>
    content.statuses[status.id]?.kind==='debuff' && (status.remaining==null || status.remaining>0) && (status.stacks??1)>0
  ).map(status=>status.id)).size;
}
export function debuffDamageBonus(passive,count) {
  if (passive?.type!=='target_debuff_damage') return 0;
  return count>=Math.ceil(passive.cap/passive.ratio) ? passive.cap : Math.max(0,count)*passive.ratio;
}
export function targetsAsGroup(skill) {
  return Boolean(skill?.target?.startsWith('all_') || ['random_enemies','adjacent_allies'].includes(skill?.target));
}
export function randomTargetLabel(skill) {
  const hits=skill.effects.filter(effect=>effect.type==='damage').reduce((sum,effect)=>sum+(effect.hits??1),0);
  return `Ngẫu nhiên · ${hits} đòn`;
}
