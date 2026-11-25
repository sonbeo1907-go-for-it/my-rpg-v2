import {damageElements} from './elements.js';

// Damage flags have their own namespace; targeting/VFX/automatic booleans are not damage kinds.
// Keep explicit future flags rather than reducing every packet to just Moon/non-Moon.
export function damageFlags(effect) {
 const flags={...effect.damageFlags};
 for(const [key,value]of Object.entries(effect))if(key.endsWith('Damage')&&typeof value==='boolean')flags[key]=value;
 const moon=damageElements({element:effect.element,additionalElements:[...(effect.additionalElements??[]),...(effect.elements??[])]}).includes('moon');
 const effectDamage=moon||flags.effectDamage===true;
 const other=Object.entries(flags).some(([key,value])=>key!=='normalDamage'&&value===true);
 return {...flags,effectDamage,normalDamage:moon?false:flags.normalDamage??!(effectDamage||other)};
}

export function isOnlyNormalDamage(effect) {
 const flags=damageFlags(effect);
 return flags.normalDamage===true&&!Object.entries(flags).some(([key,value])=>key!=='normalDamage'&&value===true);
}

// Copy the entire namespace so future damage kinds survive generated follow-up packets.
export function copyDamageFlags(source) {
 const flags=damageFlags(source);
 return {...flags,damageFlags:{...flags}};
}
