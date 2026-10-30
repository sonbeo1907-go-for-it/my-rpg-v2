// Reusable schemas shared by native passives and story upgrades.
export function validReactivePassive(passive, content, actor) {
  if (!passive || !passive.name?.trim()) return false;
  if (passive.type === 'buffed_ally_mp') {
    return Number.isInteger(passive.amount) && passive.amount > 0
      && Number.isInteger(passive.weaknessBonus) && passive.weaknessBonus >= 0
      && Array.isArray(passive.statusIds) && passive.statusIds.length > 0
      && new Set(passive.statusIds).size === passive.statusIds.length
      && passive.statusIds.every(id => content.statuses[id]?.kind === 'buff');
  }
  if (passive.type === 'dodge_counter') {
    const ability = content.abilities[passive.counterAbility];
    return Boolean(actor.resources?.[passive.resource] && ability?.activation === 'passive'
      && ability.target === 'enemy' && !ability.cost && !ability.cooldown
      && ability.effects.some(effect => effect.type === 'damage')
      && ability.effects.every(effect => ['damage', 'status'].includes(effect.type)));
  }
  return false;
}
