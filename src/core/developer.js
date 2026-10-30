export const ASTORIA_FLAG='developer.astoria';
export function setAstoriaEnabled(campaign,enabled,{battleActive=false}={}) {
  if (battleActive) throw new Error('Kết thúc chuyến đi hoặc trận đấu trước khi đổi nhân vật thử nghiệm.');
  const next=structuredClone(campaign);
  next.storyFlags=next.storyFlags.filter(flag=>flag!==ASTORIA_FLAG);
  next.unlockedCharacterIds=next.unlockedCharacterIds.filter(id=>id!=='astoria');
  delete next.extraGearSlots.astoria;
  if (enabled) {
    next.storyFlags.push(ASTORIA_FLAG);
    next.unlockedCharacterIds.push('astoria');
  } else {
    // Gear remains in inventory; every preset remains a valid nonempty party.
    delete next.equipment.astoria;
    delete next.equippedExclusiveGear.astoria;
    const clean=slots=>{ if(!slots)return null; const result=slots.map(id=>id==='astoria'?null:id); if(!result.some(Boolean))result[0]='arthur'; return result; };
    next.party=clean(next.party);
    for (const preset of next.partyPresets??[]) preset.slots=clean(preset.slots);
  }
  return next;
}
