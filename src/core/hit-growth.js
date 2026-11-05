import {activeStatuses} from './status-state.js';
export function hitGrowthRatio(content,actor){return Math.max(0,...activeStatuses({...actor,statuses:actor.statuses??[]}).map(s=>content.statuses[s.id]?.hitDamageGrowth??0));}
export function modePenetration(actor,damageType){const rule=actor.combatModes?.[actor.activeMode]?.penetration;return rule?.damageType===damageType?rule.ratio:0;}
