// Party composition bonuses are flat base stats, resolved once before combat and shared by previews.
export function teamBonusesFor(content, campaign, characterId) {
  const result = { bonuses: {}, sources: [] };
  const ids = campaign.party.filter(Boolean);
  if (!ids.includes(characterId)) return result;
  const recipient = content.characters[characterId];
  for (const sourceId of ids) {
    const passive = content.characters[sourceId].passive;
    if (!passive || !['team_flat_self', 'team_flat_aura'].includes(passive.type)) continue;
    if (passive.type === 'team_flat_self' && sourceId !== characterId) continue;
    if (passive.type === 'team_flat_aura' && !recipient.tags?.includes(passive.tag)) continue;
    const excludeSelf = passive.type === 'team_flat_self' ? passive.excludeSelf : !passive.countSelf;
    const count = ids.filter(id => (!excludeSelf || id !== sourceId) && content.characters[id].tags?.includes(passive.tag)).length;
    if (!count) continue;
    const bonuses = Object.fromEntries(Object.entries(passive.modifiers).map(([key, amount]) => [key, amount * count]));
    for (const [key, amount] of Object.entries(bonuses)) result.bonuses[key] = (result.bonuses[key] ?? 0) + amount;
    result.sources.push({ sourceId, name: passive.name, count, bonuses });
  }
  return result;
}
