// Selected ally controls the bonus for every recipient; never mutate authored/ranked data.
export function selectedAllyStatusEffect(skill,effect,ally,content){
 const bonus=skill?.selectedAllyBuffBonus;
 if(effect.type!=='status'||!bonus?.elements.includes(ally?.element))return effect;
 const definition=content.statuses[effect.status];
 if(definition?.kind!=='buff')return effect;
 const k=bonus.multiplier,next={...effect,appliedModifiers:Object.fromEntries(Object.entries(effect.appliedModifiers??definition.modifiers??{}).map(([key,n])=>[key,n*k]))};
 if(effect.duration!==undefined)next.duration=effect.duration*k;
 if(effect.charges!==undefined||definition.damageUses)next.charges=(effect.charges??definition.damageUses)*k;
 return next;
}
