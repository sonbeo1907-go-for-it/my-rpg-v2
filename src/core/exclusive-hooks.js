import {validateSpecialPassive,SPECIAL_EXCLUSIVE_TYPES,specialPassives,hasLiveStatus} from './exclusive-specials.js';
export function exclusivePassives(actor){const p=actor.exclusiveGear?.template?.passive;return p?.type==='bundle'?p.effects:p?[p]:[];}
export function exclusiveStatModifiers(actor){const mods={};for(const p of exclusivePassives(actor).filter(p=>p.type==='stat_boost'))for(const[k,n]of Object.entries(p.modifiers))mods[k]=(mods[k]??0)+n;return mods;}
// Hooks are selected by reusable passive type and authored ability/status IDs, never translated names.
export function exclusivePassive(actor,type,skillId) {
  return exclusivePassives(actor).find(p=>p.type===type&&(!p.abilityIds||p.abilityIds.includes(skillId)))??null;
}
export const procAvailable = (battle,actor,key) => actor.procRounds?.[key] !== battle.round;
export function markProc(battle,actor,key) { (actor.procRounds ??= {})[key] = battle.round; }

export function validateExclusivePassive(passive,content) {
  if (!passive || !passive.description?.trim()) return false;
  if(SPECIAL_EXCLUSIVE_TYPES.includes(passive.type))return validateSpecialPassive(passive,content);
  if(passive.type==='bundle')return Boolean(passive.name?.trim()&&Array.isArray(passive.effects)&&passive.effects.length>=2&&passive.effects.length<=4&&new Set(passive.effects.map(p=>p?.type)).size===passive.effects.length&&passive.effects.every(p=>p?.type!=='bundle'&&validateExclusivePassive(p,content)));
  const types = ['field_duration','field_stat_boost','shield_break_restore_hp','share_shielded_passive','stat_boost','skill_scaling_override','skill_damage','skill_penetration','after_skill_status','skill_resource_bonus','dodge_heal','fresh_mark_bonus','consumed_targets_mp','shield_break_heal_bonus','skill_status_duration','cover_damage_reduction','next_turn_heal'];
  if (!types.includes(passive.type)) return false;
  if (passive.type === 'stat_boost') return Boolean(passive.modifiers && Object.keys(passive.modifiers).length && Object.entries(passive.modifiers).every(([key,n]) => ['maxHp','maxMp','attack','magic','defense','resistance','speed'].includes(key) && Number.isFinite(n) && n >= 0 && n <= 10));
  if (!passive.name?.trim()) return false;
  if (passive.to !== undefined && !['self','targets'].includes(passive.to)) return false;
  if (passive.oncePerRound !== undefined && typeof passive.oncePerRound !== 'boolean') return false;
  const skillTypes=['field_duration','field_stat_boost','skill_scaling_override','skill_damage','skill_penetration','after_skill_status','skill_resource_bonus','fresh_mark_bonus','consumed_targets_mp','skill_status_duration','next_turn_heal'];
  if (skillTypes.includes(passive.type) && (!Array.isArray(passive.abilityIds) || !passive.abilityIds.length || passive.abilityIds.some(id=>!content.abilities[id]))) return false;
  if(passive.type==='field_duration'&&(!Number.isInteger(passive.extraRounds)||passive.extraRounds<1||passive.extraRounds>3))return false;
  if(['field_duration','field_stat_boost'].includes(passive.type)&&passive.abilityIds.some(id=>!content.abilities[id].effects.some(e=>e.type==='turn_order_field')))return false;
  if(passive.type==='field_stat_boost'&&(!passive.modifiers||!Object.keys(passive.modifiers).length||Object.entries(passive.modifiers).some(([k,n])=>!['attack','magic','defense','resistance','speed'].includes(k)||!Number.isFinite(n)||n<=0||n>1)))return false;
  if(passive.type==='shield_break_restore_hp'&&(!Number.isFinite(passive.multiplier)||passive.multiplier<=0||passive.multiplier>1||!Array.isArray(passive.scalingStats)||JSON.stringify(passive.scalingStats)!=='["defense","resistance"]'))return false;
  if(passive.type==='skill_scaling_override'&&(!Number.isFinite(passive.multiplier)||passive.multiplier<=0||passive.multiplier>10))return false;
  if (['skill_damage','skill_penetration','dodge_heal','shield_break_heal_bonus','cover_damage_reduction','next_turn_heal'].includes(passive.type) && (!Number.isFinite(passive.ratio) || passive.ratio <= 0 || passive.ratio > 1)) return false;
  if (['after_skill_status','fresh_mark_bonus','consumed_targets_mp','skill_status_duration'].includes(passive.type) && !content.statuses[passive.statusId]) return false;
  if (['after_skill_status','fresh_mark_bonus'].includes(passive.type) && (!Number.isInteger(passive.duration) || passive.duration < 1)) return false;
  if (['skill_resource_bonus','consumed_targets_mp','fresh_mark_bonus'].includes(passive.type) && (!Number.isInteger(passive.amount) || passive.amount < 1)) return false;
  if (passive.type==='skill_status_duration' && (!Number.isInteger(passive.extraDuration) || passive.extraDuration < 1)) return false;
  if (passive.type==='consumed_targets_mp' && (!Number.isInteger(passive.minTargets) || passive.minTargets < 1)) return false;
  if (passive.type==='skill_resource_bonus' && typeof passive.resource!=='string') return false;
  if (passive.minSpent!==undefined && (!Number.isInteger(passive.minSpent) || passive.minSpent < 0)) return false;
  return true;
}

export function exclusiveDamageEffect(actor,skillId,effect){
 if(effect.type!=='damage'||effect.rankDamageApplied)return effect;
 const p=exclusivePassive(actor,'skill_scaling_override',skillId),result=p?{...effect,multiplier:p.multiplier}:{...effect};
 if(effect.rankDamageFactor!==undefined){
  for(const key of ['multiplier','primaryMultiplier','perResource','perStack','lowHpBonus','perTargetBuff','speedMultiplier'])if(result[key]!==undefined)result[key]*=effect.rankDamageFactor;
  result.rankDamageApplied=true;
 }
 const speed=specialPassives(actor,'skill_speed_damage').find(p=>p.abilityIds.includes(skillId)&&hasLiveStatus(actor,p.requiresStatus));
 if(speed){result.speedMultiplier=(result.speedMultiplier??0)+speed.ratio;result.rankDamageApplied=true;}
 return result;
}
