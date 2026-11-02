// Charge-based damage buffs are spent once per direct damaging action, not per hit/target.
export function captureDamageBuffs(content,actor){
 return actor.statuses.filter(s=>content.statuses[s.id].damageUses&&(s.charges??0)>0);
}
export function settleDamageBuffs(battle,actor,context,io){
 if(!context.dealtDirectDamage)return;
 for(const status of context.damageUseBuffs??[]){
  if(!actor.statuses.includes(status))continue;
  status.charges=Math.max(0,status.charges-1);
  io.emit(battle,{type:'status_consumed',sourceId:actor.id,targetId:actor.id,statusId:status.id,amount:1,remaining:status.charges});
  io.write(battle,actor.name+': '+battle.content.statuses[status.id].name+' còn '+status.charges+' lần.');
  if(!status.charges)actor.statuses=actor.statuses.filter(s=>s!==status);
 }
}
