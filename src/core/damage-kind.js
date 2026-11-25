import {damageElements} from './elements.js';

export function damageFlags(effect) {
 const flags={...effect.damageFlags};
 for(const [key,value]of Object.entries(effect))if(key.endsWith('Damage')&&typeof value==='boolean')flags[key]=value;
 const effectDamage=damageElements({element:effect.element,additionalElements:[...(effect.additionalElements??[]),...(effect.elements??[])]}).includes('moon');
 return {...flags,effectDamage,normalDamage:!effectDamage};
}

export function isOnlyNormalDamage(effect) {return damageFlags(effect).normalDamage;}

export function copyDamageFlags(source) {
 const flags=damageFlags(source);
 return {...flags,damageFlags:{...flags}};
}
