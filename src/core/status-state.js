// Linked buffs are derived from their parent, so they cannot outlive it or erase independent grants.
export function activeStatuses(actor) {
  const statuses=actor?.statuses??[];
  const active = new Map(statuses.map(status => [status.id, status]));
  for (const parent of statuses) {
    for (const id of parent.linkedStatuses ?? []) {
      if (!active.has(id)) active.set(id, { id, remaining: parent.remaining, sourceId: parent.sourceId, stacks: 1, ...(parent.linkedAppliedModifiers?.[id]?{appliedModifiers:{...parent.linkedAppliedModifiers[id]}}:{}) });
    }
  }
  for(const id of actor.combatModes?.[actor.activeMode]?.boundStatuses??[])active.set(id,{id,remaining:null,sourceId:actor.id,stacks:1,innate:true,modeBound:true});
  const p=actor.passive;
  if(p?.type==='vampire_contingency'&&actor.activeMode!==p.modeId&&(actor.hp===undefined||actor.hp>0)&&!active.has(p.tauntStatus))active.set(p.tauntStatus,{id:p.tauntStatus,remaining:null,sourceId:actor.id,stacks:1,innate:true});
  return [...active.values()];
}
