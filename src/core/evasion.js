// Permanent flat stats (including gear) count; temporary percentage buffs/debuffs do not.
export function evasionBaseSpeed(actor){return Math.max(0,(actor.baseStats?.speed??actor.stats.speed)+(actor.combatModes?.[actor.activeMode]?.baseStatBonuses?.speed??0));}
export function nativeEvasion(actor,damageType){const rule=actor.passive?.evasion;return rule?.damageTypes.includes(damageType)?Math.min(rule.cap,Math.max(0,rule.baseChance+rule.perBaseSpeed*evasionBaseSpeed(actor))):0;}
export function evasionChance(actor,effect,physicalBonus=0){
 if(effect.unavoidable)return 0;
 const rule=actor.passive?.evasion,native=nativeEvasion(actor,effect.damageType),supported=rule?.damageTypes.includes(effect.damageType);
 return Math.min(supported?rule.cap:.85,Math.max(0,native+(effect.damageType==='physical'?physicalBonus:0)));
}
export function validEvasion(rule){return Boolean(rule&&Number.isFinite(rule.baseChance)&&rule.baseChance>=0&&Number.isFinite(rule.perBaseSpeed)&&rule.perBaseSpeed>=0&&Number.isFinite(rule.cap)&&rule.cap>0&&rule.cap<=1&&rule.baseChance<=rule.cap&&Array.isArray(rule.damageTypes)&&rule.damageTypes.length&&new Set(rule.damageTypes).size===rule.damageTypes.length&&rule.damageTypes.every(t=>['physical','magical'].includes(t)));}
