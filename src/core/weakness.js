import { activeStatuses } from './status-state.js';
import { WEAKNESS_MULTIPLIER } from './content.js';

// Reservations belong to a live status instance, never to saved battle state.
// Nested reactions cannot borrow the last charge claimed by an outer cast.
const reservations = new WeakMap();
const active = status => (status.stacks ?? 1) > 0 && (status.remaining == null || status.remaining > 0);

export function exposureStatus(content, actor) {
  return actor.statuses?.find(status => active(status) && content.statuses[status.id]?.exposedElement);
}

export function availableExposureStacks(status) {
  return Math.max(0, (status?.stacks ?? 0) - (status ? reservations.get(status) ?? 0 : 0));
}

export function weaknessElements(content, actor) {
  const exposure = exposureStatus(content, actor);
  return [...new Set([...(actor.weaknesses ?? []), ...(exposure ? [content.statuses[exposure.id].exposedElement] : [])])];
}

export function captureExposures(battle) {
  return new Map(battle.actors.flatMap(target => {
    const status = exposureStatus(battle.content, target);
    return status && availableExposureStacks(status) > 0
      ? [[target.id, { status, element: battle.content.statuses[status.id].exposedElement, reserved: false }]] : [];
  }));
}

function eligibleExposure(target, element, context) {
  const entry = context.exposures?.get(target.id);
  return entry?.element === element && (entry.reserved ||
    target.statuses.includes(entry.status) && active(entry.status) && availableExposureStacks(entry.status) > 0) ? entry : null;
}

export function resolveWeakness(content, attacker, target, effect, context) {
  const elementWeakness = Boolean(target.weaknesses?.includes(effect.element) || eligibleExposure(target, effect.element, context));
  const typeWeakness = target.damageTypeWeaknesses?.includes(effect.damageType) ?? false;
  const weakness = elementWeakness || typeWeakness;
  const multiplier = weakness ? Math.max(WEAKNESS_MULTIPLIER, ...activeStatuses(attacker)
    .filter(active).map(status => content.statuses[status.id]?.weaknessMultiplier ?? WEAKNESS_MULTIPLIER)) : 1;
  return { elementWeakness, typeWeakness, weakness, multiplier };
}

export function reserveExposure(target, element, context) {
  const entry = eligibleExposure(target, element, context);
  if (!entry || entry.reserved) return;
  entry.reserved = true;
  reservations.set(entry.status, (reservations.get(entry.status) ?? 0) + 1);
}

export function finishExposures(battle, context, notify) {
  for (const [targetId, entry] of context.exposures ?? []) {
    if (!entry.reserved) continue;
    const count = (reservations.get(entry.status) ?? 1) - 1;
    if (count > 0) reservations.set(entry.status, count);
    else reservations.delete(entry.status);
    const target = battle.actors.find(actor => actor.id === targetId);
    // A refresh already deducted pending charges before creating its new instance.
    if (target?.statuses.includes(entry.status)) {
      entry.status.stacks -= 1;
      if (entry.status.stacks <= 0) target.statuses = target.statuses.filter(status => status !== entry.status);
    }
    const current = target && exposureStatus(battle.content, target);
    const remaining = current && battle.content.statuses[current.id].exposedElement === entry.element ? current.stacks : 0;
    if (target) notify(target, entry.status.id, remaining);
    entry.reserved = false;
  }
}
