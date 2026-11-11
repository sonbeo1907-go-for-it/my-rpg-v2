
import {isAlive} from "./actor-life.js";
// Ally-triggered follow-ups require another ally; this predicate never allows self-trigger.
// Explicit authored survivingTargetRepeat is a separate self-repeat mechanic (Anabel), with its own limiter.
export const FOLLOW_UP_LABEL = 'Liên kích (FuA)';
export const REACTION_LABELS = { follow_up: FOLLOW_UP_LABEL, counter: 'Phản công' };
export function canTriggerFollowUp(owner, source, target) {
  return isAlive(owner) && isAlive(target)
    && owner.id !== source.id
    && owner.team === source.team
    && owner.team !== target.team;
}
