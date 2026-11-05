// Reusable schemas shared by native passives and story upgrades.
export function validReactivePassive(passive, content, actor) {
  if (!passive || !passive.name?.trim()) return false;
  if(passive.type==='starting_resource_skill_chance')return Boolean(actor.resources?.[passive.resource]&&Number.isInteger(passive.initial)&&passive.initial>=0&&passive.initial<=actor.resources[passive.resource].max&&actor.abilities.includes(passive.abilityId)&&Number.isInteger(passive.amount)&&passive.amount>0&&['maxHp','maxMp','attack','magic','defense','resistance','speed'].includes(passive.stat)&&Number.isFinite(passive.atStat)&&passive.atStat>0&&Number.isFinite(passive.cap)&&passive.cap>0&&passive.cap<=1);
  if (passive.type === 'detonation_base_growth') return passive.stat==='magic' && content.statuses[passive.statusId]?.kind==='debuff' && Number.isInteger(passive.increment) && passive.increment>0 && Number.isInteger(passive.cap) && passive.cap>=passive.increment && passive.cap<=100;
  if (passive.type === 'buffed_ally_mp') {
    return Number.isInteger(passive.amount) && passive.amount > 0
      && Number.isInteger(passive.weaknessBonus) && passive.weaknessBonus >= 0
      && Array.isArray(passive.statusIds) && passive.statusIds.length > 0
      && new Set(passive.statusIds).size === passive.statusIds.length
      && passive.statusIds.every(id => content.statuses[id]?.kind === 'buff');
  }
  if (passive.type === 'dodge_counter') {
    const ability = content.abilities[passive.counterAbility];
    return Boolean((passive.resource===undefined||actor.resources?.[passive.resource]) && ability?.activation === 'passive'
      && ability.target === 'enemy' && !ability.cost && !ability.cooldown
      && ability.effects.some(effect => effect.type === 'damage')
      && ability.effects.every(effect => ['damage', 'status'].includes(effect.type)));
  }
  return false;
}
