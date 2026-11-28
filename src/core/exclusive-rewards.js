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

// Conditional rewards are independent of first-clear receipts. A later eligible
// clear can earn the item; ownership prevents duplicates and preserves reforges.
export function partyQuestExclusiveTemplates(content,encounterId){
 return Object.values(content.exclusiveGear).filter(t=>t.enabled&&t.source?.type==='quest'&&t.source.encounterId===encounterId&&t.source.requiredPartyIds?.length);
}
export function grantPartyQuestExclusives(campaign,battle,content){
 const partyIds=new Set((battle.actors??[]).filter(a=>a.team==='party'&&a.actorKind!=='summon').map(a=>a.definitionId??a.id));
 return partyQuestExclusiveTemplates(content,battle.encounterId).filter(t=>
  t.source.requiredPartyIds.every(id=>partyIds.has(id))&&campaign.unlockedCharacterIds.includes(t.characterId)&&!campaign.exclusiveGear?.some(item=>item.templateId===t.id)
 ).map(t=>({...grantQuestExclusive(campaign,content,t.id),conditional:true}));
}
