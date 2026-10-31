import {exclusivePassive} from './exclusive-hooks.js';
export function extendedFieldDuration(actor,skillId,effect){return effect.durationRounds+(exclusivePassive(actor,'field_duration',skillId)?.extraRounds??0);}
export function syncExclusiveFieldModifiers(battle){
 const f=battle.turnOrderField,active=f&&battle.round<=f.expiresAfterRound;
 for(const actor of battle.actors){delete actor.exclusiveFieldModifiers;const p=exclusivePassive(actor,'field_stat_boost',f?.abilityId);if(active&&f.sourceId===actor.id&&f.abilityId&&p)actor.exclusiveFieldModifiers={...p.modifiers};}
}
export function shieldedDamageBonus(battle,actor){
 if(actor.shield<=0)return 0;
 let value=actor.passive?.type==='shielded_damage_bonus'?actor.passive.ratio:0;
 for(const source of battle.actors)if(source.hp>0&&source.team===actor.team&&source.passive?.type==='shielded_damage_bonus'&&exclusivePassive(source,'share_shielded_passive'))value=Math.max(value,source.passive.ratio);
 return value;
}
