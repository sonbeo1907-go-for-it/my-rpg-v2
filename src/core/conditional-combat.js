import {getActorSkillRank,outputMpFactor} from './skill-rules.js';
import {activeStatuses} from './status-state.js';

// Preferred resource replaces MP only when the full authored amount is available.
export function resourceCost(skill,actor) {
  const preferred=skill.cost?.preferResource;
  return preferred && (actor?.resourceValues?.[preferred.id]??0)>=preferred.amount ? preferred : skill.cost?.resource??null;
}
export function mpCost(skill,actor) {
  const base=skill.cost?.preferResource && resourceCost(skill,actor)===skill.cost.preferResource ? 0 : skill.cost?.mp??0;
  if(base<=0)return base;
  const p=actor?.passive,mode=actor?.combatModes?.[actor.activeMode];
  const native=p?.type==='kill_mp_discount' && (actor.statuses??[]).some(s=>s.id===p.statusId && (s.remaining==null||s.remaining>0)) ? 1-p.ratio : 1;
  const discount=mode?.mpCostReduction && mode.discountAbilityIds.includes(skill.id) ? 1-mode.mpCostReduction : 1;
  return Math.max(1,Math.ceil(base*native*discount*(skill.rankMpMultiplier??((skill.growthGroups?.includes('output_buff_mp')||skill.growthProfile==='output_buff_mp')&&actor?.team!=='enemy'?outputMpFactor(getActorSkillRank(actor,skill),actor?.skillProgression):1))));
}
export function hpCost(skill,actor) {return skill.cost?.hpMaxRatio ? Math.ceil(actor.stats.maxHp*skill.cost.hpMaxRatio) : 0;}
export function buffTypeCount(content,target) {
  if(!target)return 0;
  return new Set(activeStatuses({...target,statuses:target.statuses??[]}).filter(s=>content.statuses[s.id]?.kind==='buff'&&(s.remaining==null||s.remaining>0)&&(s.stacks??1)>0).map(s=>s.id)).size;
}
export function buffDamageBonus(passive,count) {return passive?.type==='target_buff_damage' ? Math.min(passive.cap,Math.max(0,count)*passive.ratio) : 0;}
export function lowHpDamageBonus(passive,hpRatio) {return passive?.type==='low_hp_damage' ? passive.ratio*(1-Math.max(0,Math.min(1,hpRatio))) : 0;}
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
  return Boolean(skill?.target?.startsWith('all_') || ['random_enemies','adjacent_allies','enemy_splash'].includes(skill?.target));
}
export function randomTargetLabel(skill) {
  const hits=skill.effects.filter(effect=>effect.type==='damage').reduce((sum,effect)=>sum+(effect.hits??1),0);
  return `Ngẫu nhiên · ${hits} đòn`;
}
