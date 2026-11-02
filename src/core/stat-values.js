import { activeStatuses } from './status-state.js';
import { effectiveStat } from './combat-math.js';

// Stack-scaled modifiers and mutually exclusive modifier groups are shared by UI and engine.
export function statusModifier(content, actor, key, ignoreConsumables = false) {
  let sum = 0;
  const groups = new Map();
  for (const status of activeStatuses(actor)) {
    const definition = content.statuses[status.id];
    if (ignoreConsumables && definition.consumeOnAttack) continue;
    const value = (status.appliedModifiers?.[key] ?? definition.modifiers?.[key] ?? 0) * (definition.modifiersPerStack ? status.stacks ?? 1 : 1);
    if (definition.modifierGroup) {
      const old = groups.get(definition.modifierGroup) ?? 0;
      if (Math.abs(value) > Math.abs(old)) groups.set(definition.modifierGroup,value);
    } else sum += value;
  }
  return sum + (actor.exclusiveFieldModifiers?.[key]??0) + [...groups.values()].reduce((a,b) => a+b,0);
}
export function battleStat(content, actor, key, ignoreConsumables = false, additionalModifier = 0, baseBonus = 0) {
  return effectiveStat(actor,key,statusModifier(content,actor,key,ignoreConsumables) + additionalModifier,baseBonus);
}

// Prepared stats remain immutable; temporary capacity is derived for every MP consumer.
export function battleMaxMp(content,actor){
 const prepared=actor.stats.maxMp,base=actor.baseStats?.maxMp??prepared;
 return Math.max(0,Math.floor(prepared+base*statusModifier(content,actor,'maxMp')));
}
export function clampBattleMp(content,actor){if(actor.mp!==undefined)actor.mp=Math.max(0,Math.min(actor.mp,battleMaxMp(content,actor)));}
