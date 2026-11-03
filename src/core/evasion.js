import {activeStatuses} from './status-state.js';
export function hasTrueStrike(content,actor){return actor.passive?.type==='true_strike'||actor.combatModes?.[actor.activeMode]?.bypassEvasion===true||activeStatuses({...actor,statuses:actor.statuses??[]}).some(s=>(s.remaining==null||s.remaining>0)&&content.statuses[s.id]?.bypassEvasion===true);}
// Permanent flat stats (including gear) count; temporary percentage buffs/debuffs do not.
export function evasionBaseSpeed(actor){return Math.max(0,(actor.baseStats?.speed??actor.stats.speed)+(actor.combatModes?.[actor.activeMode]?.baseStatBonuses?.speed??0));}
// Native rules come from the passive and from the active combat mode; both use the same shape.
export function evasionRules(actor){return [actor.passive?.evasion,actor.combatModes?.[actor.activeMode]?.evasion].filter(Boolean);}
export function nativeEvasion(actor,damageType){
  let total=0,cap=0;
  for(const rule of evasionRules(actor)){
    if(!rule.damageTypes.includes(damageType))continue;
    total+=rule.baseChance+rule.perBaseSpeed*evasionBaseSpeed(actor);
    cap=Math.max(cap,rule.cap);
  }
  return cap?Math.min(cap,Math.max(0,total)):0;
}
export function evasionChance(actor,effect,physicalBonus=0){
 if(effect.unavoidable)return 0;
 const rules=evasionRules(actor),supported=rules.some(rule=>rule.damageTypes.includes(effect.damageType));
 const cap=rules.reduce((best,rule)=>Math.max(best,rule.cap),0),native=nativeEvasion(actor,effect.damageType);
 return Math.min(supported?cap:.85,Math.max(0,native+(effect.damageType==='physical'?physicalBonus:0)));
}
export function validEvasion(rule){return Boolean(rule&&Number.isFinite(rule.baseChance)&&rule.baseChance>=0&&Number.isFinite(rule.perBaseSpeed)&&rule.perBaseSpeed>=0&&Number.isFinite(rule.cap)&&rule.cap>0&&rule.cap<=1&&rule.baseChance<=rule.cap&&Array.isArray(rule.damageTypes)&&rule.damageTypes.length&&new Set(rule.damageTypes).size===rule.damageTypes.length&&rule.damageTypes.every(t=>['physical','magical'].includes(t)));}
