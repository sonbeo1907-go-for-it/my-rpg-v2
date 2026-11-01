// Global follow-up rule: an allied action must come from another ally; never self-trigger.
// Keep this rule in the engine, never as a character-data toggle.
export const FOLLOW_UP_LABEL = 'Liên kích (FuA)';
export const REACTION_LABELS = { follow_up: FOLLOW_UP_LABEL, counter: 'Phản công' };
export function canTriggerFollowUp(owner, source, target) {
  return owner.hp > 0 && target.hp > 0
    && owner.id !== source.id
    && owner.team === source.team
    && owner.team !== target.team;
}
