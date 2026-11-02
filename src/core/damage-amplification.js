import {activeStatuses} from './status-state.js';
import {statusModifier} from './stat-values.js';

// Skill-created amplification shares one strongest eligible value, including conditional shield bonuses.
// Intrinsic passives, equipment, weakness and enemy damage-taken effects remain separate mechanics.
export function skillDamageBonus(content,actor,target,ignoreConsumables=false){
 let best=0,unconditional=0;
 for(const status of activeStatuses(actor)){
  const d=content.statuses[status.id];if(d.kind!=='buff'||status.remaining===0||d.damageUses&&(status.charges??0)<=0||ignoreConsumables&&d.consumeOnAttack)continue;
  const mods=status.appliedModifiers??d.modifiers??{},stacks=d.modifiersPerStack?status.stacks??1:1;
  const plain=Math.max(0,(mods.damageBonus??0)*stacks);unconditional=Math.max(unconditional,plain);
  best=Math.max(best,plain,Math.max(0,(mods.attackMultiplier??1)-1),target.shield>0?Math.max(0,(mods.damageVsShielded??0)*stacks):0);
 }
 return best+statusModifier(content,actor,'damageBonus',ignoreConsumables)-unconditional;
}
