// Hooks are selected by reusable passive type and authored ability/status IDs, never translated names.
export function exclusivePassive(actor,type,skillId) {
  const passive = actor.exclusiveGear?.template?.passive;
  return passive?.type === type && (!passive.abilityIds || passive.abilityIds.includes(skillId)) ? passive : null;
}
export const procAvailable = (battle,actor,key) => actor.procRounds?.[key] !== battle.round;
export function markProc(battle,actor,key) { (actor.procRounds ??= {})[key] = battle.round; }

export function validateExclusivePassive(passive,content) {
  if (!passive || !passive.description?.trim()) return false;
  const types = ['stat_boost','skill_scaling_override','skill_damage','skill_penetration','after_skill_status','skill_resource_bonus','dodge_heal','fresh_mark_bonus','consumed_targets_mp','shield_break_heal_bonus','skill_status_duration','cover_damage_reduction','next_turn_heal'];
  if (!types.includes(passive.type)) return false;
  if (passive.type === 'stat_boost') return Boolean(passive.modifiers && Object.keys(passive.modifiers).length && Object.entries(passive.modifiers).every(([key,n]) => ['maxHp','maxMp','attack','magic','defense','resistance','speed'].includes(key) && Number.isFinite(n) && n >= 0 && n <= 10));
  if (!passive.name?.trim()) return false;
  if (passive.to !== undefined && !['self','targets'].includes(passive.to)) return false;
  if (passive.oncePerRound !== undefined && typeof passive.oncePerRound !== 'boolean') return false;
  const skillTypes=['skill_scaling_override','skill_damage','skill_penetration','after_skill_status','skill_resource_bonus','fresh_mark_bonus','consumed_targets_mp','skill_status_duration','next_turn_heal'];
  if (skillTypes.includes(passive.type) && (!Array.isArray(passive.abilityIds) || !passive.abilityIds.length || passive.abilityIds.some(id=>!content.abilities[id]))) return false;
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

export function exclusiveDamageEffect(actor,skillId,effect){const p=exclusivePassive(actor,'skill_scaling_override',skillId);return p&&effect.type==='damage'?{...effect,multiplier:p.multiplier}:effect;}
