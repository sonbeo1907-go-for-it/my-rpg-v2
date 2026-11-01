export const EMERGENCY_HP_THRESHOLD = 0.35;
export const EMERGENCY_HEAL_MULTIPLIER = 1.6;

export function mpRestoreAmount(effect, maxMp) {
  return (effect.amount ?? 0) + Math.ceil(maxMp * (effect.maxMpRatio ?? 0));
}

export function effectiveStat(actor, key, temporaryModifier = 0, baseBonus = 0) {
  let base = (actor.baseStats?.[key] ?? actor.stats[key]) + baseBonus;
  base += actor.combatModes?.[actor.activeMode]?.baseStatBonuses?.[key] ?? 0;
  if (actor.passive?.type === 'stat_conversion' && actor.passive.toStat === key) base += (actor.baseStats?.[actor.passive.fromStat] ?? actor.stats[actor.passive.fromStat]) * actor.passive.ratio;
  const permanent = actor.passive?.type === 'stat_boost' ? actor.passive.modifiers[key] ?? 0 : 0;
  const resourceBonus = actor.passive?.type === 'resource_stat_boost' && actor.passive.stat === key
    ? (actor.resourceValues?.[actor.passive.resource] ?? 0) * actor.passive.ratio : 0;
  const field = actor.passive?.type === 'field_growth' && actor.passive.stat === key
    ? actor.statuses?.find(status => status.id === actor.passive.statusId) : null;
  const fieldBonus = field ? Math.min(actor.passive.maxStacks, field.growth ?? 0) * actor.passive.ratio : 0;
  return base * Math.max(0.1, 1 + permanent + (actor.exclusiveModifiers?.[key] ?? 0) + resourceBonus + fieldBonus + (actor.modeAppliedModifiers?.[key]??actor.combatModes?.[actor.activeMode]?.statModifiers?.[key]??0) + temporaryModifier);
}

export function damageMultiplier(effect, { spent = 0, stacks = 0, hpRatio = 1, buffs = 0 } = {}) {
  return (effect.multiplier ?? 1)
    + spent * (effect.perResource ?? 0)
    + stacks * (effect.perStack ?? 0)
    + (effect.lowHpBonus ?? 0) * (1 - hpRatio)
    + (effect.perTargetBuff??0)*Math.min(effect.maxTargetBuffs??0,buffs);
}

export function shieldedDamageMultiplier(shield, bonus = 0) {
  return shield > 0 ? Math.max(0.1, 1 + bonus) : 1;
}

export function incomingDamageMultiplier(bonus = 0) {
  return Math.max(0.1, 1 + bonus);
}

export function speedDamageRatio(actor, damageType, skillRatio = 0) {
  return damageType === 'physical' ? skillRatio + (actor.passive?.type === 'speed_damage' ? actor.passive.ratio : 0) : 0;
}

export function speedDamageBonus(actor, damageType, speed = effectiveStat(actor, 'speed'), skillRatio = 0) {
  return speed * speedDamageRatio(actor, damageType, skillRatio);
}

// Keep rounding identical in combat and the preparation preview.
export function supportAmount(effect, scalingValue, emergency = false) {
  const base = Math.round((effect.flat ?? 0) + scalingValue * (effect.multiplier ?? 0));
  return Math.round(base * (effect.emergency && emergency ? EMERGENCY_HEAL_MULTIPLIER : 1));
}
