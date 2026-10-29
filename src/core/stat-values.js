import { activeStatuses } from './status-state.js';
import { effectiveStat } from './combat-math.js';

// One shared stat calculation for the engine and live combat presentation.
export function battleStat(content, actor, key, ignoreConsumables = false) {
  const modifier = activeStatuses(actor).reduce((sum, status) => {
    const definition = content.statuses[status.id];
    return sum + (ignoreConsumables && definition.consumeOnAttack ? 0 : definition.modifiers?.[key] ?? 0);
  }, 0);
  return effectiveStat(actor, key, modifier);
}
