export const SUMMON_RARITIES = {
  low: { rank: 1, name: 'Cấp thấp', color: '#76e69a' },
  mid: { rank: 2, name: 'Cấp trung', color: '#65baff' },
  high: { rank: 3, name: 'Cấp cao', color: '#bd8bff' },
  character: { rank: 4, name: 'Nhân vật', color: '#ffbe62' }
};
export function summonRarity(result) { return result.kind === 'character' ? 'character' : result.gear.typeId === 't1' ? 'low' : result.gear.typeId === 't2' ? 'mid' : 'high'; }
export function highestSummonRarity(results) { return results.reduce((best, item) => SUMMON_RARITIES[summonRarity(item)].rank > SUMMON_RARITIES[best].rank ? summonRarity(item) : best, 'low'); }
export function bannerRates(banner) {
  const total = banner.gearWeight + banner.characterWeight; const gearTotal = banner.gearRates.reduce((sum, rate) => sum + rate.weight, 0);
  const byType = Object.fromEntries(banner.gearRates.map(rate => [rate.typeId, banner.gearWeight / total * rate.weight / gearTotal]));
  return { low: byType.t1 ?? 0, mid: byType.t2 ?? 0, high: (byType.t3_focused ?? 0) + (byType.t3_dual ?? 0), character: banner.characterWeight / total, byType };
}
