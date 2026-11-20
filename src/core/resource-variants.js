// Resolve before cost, availability, rank growth and previews. Never mutate authored data.
export function resourceVariantKey(actor,skill){const v=skill.resourceVariants;return !v?'':(actor?.resourceValues?.[v.resource]??0)>=v.minimum?'ready':'empty';}
export function resourceVariantAbility(actor,skill){const key=resourceVariantKey(actor,skill);return key?{...skill,...skill.resourceVariants[key],id:skill.id,skillLineId:skill.skillLineId}:skill;}
