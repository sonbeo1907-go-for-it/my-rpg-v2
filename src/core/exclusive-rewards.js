// Mutates only the draft campaign used by the atomic first-clear transaction.
export function grantQuestExclusive(campaign,content,templateId) {
  const template=content.exclusiveGear[templateId], source=template?.source;
  if (source?.type!=='quest' || !campaign.unlockedCharacterIds.includes(template.characterId)) throw new Error('Trấn Phái thưởng không hợp lệ.');
  campaign.exclusiveGear ??= [];
  const alreadyOwned=campaign.exclusiveGear.some(item=>item.templateId===templateId);
  if (!alreadyOwned) {
    campaign.exclusiveGear.push({templateId,statKey:source.statKey,statValue:source.statValue});
    const revision=(campaign.blacksmithRevision??0)+1;
    if(!Number.isSafeInteger(revision))throw new Error('Tiến trình lò rèn vượt giới hạn.');
    campaign.blacksmithRevision=revision;
  }
  return {type:'exclusive',templateId,alreadyOwned};
}
