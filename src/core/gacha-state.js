// Pity belongs to each banner. Presentation history is saved with the rewards, never grants them again.
export function normalizeGachaState(input, campaign, content) {
  if (!input || !Number.isSafeInteger(input.totalPulls) || input.totalPulls < 0) throw new Error('Số lượt quay không hợp lệ.');
  const pity = input.pity ?? {};
  if (!pity || typeof pity !== 'object' || Array.isArray(pity)) throw new Error('Bộ đếm pity không hợp lệ.');
  for (const [id, count] of Object.entries(pity)) {
    const banner = content.banners[id];
    if (!Object.hasOwn(content.banners, id) || !banner.pity || !Number.isSafeInteger(count) || count < 0 || count >= banner.pity.characterAt || count > input.totalPulls) throw new Error('Bộ đếm pity không hợp lệ.');
  }
  let lastSummon = null;
  if (input.lastSummon != null) {
    const batch = input.lastSummon; const banner = content.banners[batch.bannerId];
    if (!Object.hasOwn(content.banners, batch.bannerId) || batch.id !== `summon_${input.totalPulls}` || !Array.isArray(batch.results) || ![1, 10].includes(batch.results.length) || batch.results.length > input.totalPulls) throw new Error('Kết quả chiêu mộ không hợp lệ.');
    const results = batch.results.map((result, index) => {
      if (result?.kind === 'gear') {
        const gear = campaign.gear.find(item => item.id === result.gear?.id);
        if (!gear || gear.id !== `gear_${input.totalPulls - batch.results.length + index + 1}` || gear.typeId !== result.gear.typeId || !result.gear.stats || Object.keys(gear.stats).length !== Object.keys(result.gear.stats).length || Object.entries(gear.stats).some(([key, value]) => result.gear.stats[key] !== value)) throw new Error('Gear trong kết quả chiêu mộ không hợp lệ.');
        return { kind: 'gear', gear: structuredClone(gear) };
      }
      if (result?.kind === 'character') {
        if (!banner.characterPool.includes(result.characterId) || !campaign.unlockedCharacterIds.includes(result.characterId) || typeof result.duplicate !== 'boolean' || typeof result.slotUnlocked !== 'boolean' || typeof result.guaranteed !== 'boolean'
          || result.shards !== (result.duplicate ? content.economy.default.duplicateShards : 0) || !Number.isInteger(result.gearSlots) || result.gearSlots < content.economy.default.baseGearSlots || result.gearSlots > content.economy.default.maxGearSlots) throw new Error('Nhân vật trong kết quả chiêu mộ không hợp lệ.');
        return { kind: 'character', characterId: result.characterId, duplicate: result.duplicate, shards: result.shards, slotUnlocked: result.slotUnlocked, gearSlots: result.gearSlots, guaranteed: result.guaranteed };
      }
      throw new Error('Loại kết quả chiêu mộ không hợp lệ.');
    });
    lastSummon = { id: batch.id, bannerId: batch.bannerId, results };
  }
  return { totalPulls: input.totalPulls, pity: { ...pity }, lastSummon };
}
