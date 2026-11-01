// Linked buffs are derived from their parent, so they cannot outlive it or erase independent grants.
export function activeStatuses(actor) {
  const active = new Map(actor.statuses.map(status => [status.id, status]));
  for (const parent of actor.statuses) {
    for (const id of parent.linkedStatuses ?? []) {
      if (!active.has(id)) active.set(id, { id, remaining: parent.remaining, sourceId: parent.sourceId, stacks: 1, ...(parent.linkedAppliedModifiers?.[id]?{appliedModifiers:{...parent.linkedAppliedModifiers[id]}}:{}) });
    }
  }
  return [...active.values()];
}
