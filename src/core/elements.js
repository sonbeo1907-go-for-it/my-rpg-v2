// Multiple affinities describe one hit, never separate damage instances.
export const damageElements=effect=>[...new Set([effect.element,...effect.additionalElements??[]].filter(Boolean))];
export const elementLabel=(effect,names)=>damageElements(effect).map(e=>names[e]??e).join(' / ');
export const elementalResistance=(target,effect)=>Math.max(...damageElements(effect).map(e=>target.resistances?.[e]??1));
