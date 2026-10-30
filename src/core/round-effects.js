// Global-round effects use absolute deadlines, including the casting round.
// Recompute on entry as well as round end so a victory/room transition cannot extend them.
export function expireRoundEffects(battle,io,atEnd=false) {
  for (const actor of battle.actors) {
    actor.statuses=actor.statuses.filter(status=>{
      if (battle.content.statuses[status.id].durationClock!=='round') return true;
      status.expiresAfterRound??=battle.round+status.remaining-1;
      status.remaining=Math.max(0,status.expiresAfterRound-battle.round+(atEnd?0:1));
      if (status.remaining>0) return true;
      io.write(battle,actor.name+': '+battle.content.statuses[status.id].name+' hết hiệu lực.');
      io.emit(battle,{type:'status_expired',targetId:actor.id,statusId:status.id});
      return false;
    });
    if (actor.shieldExpiresAfterRound!==undefined && (atEnd ? battle.round>=actor.shieldExpiresAfterRound : battle.round>actor.shieldExpiresAfterRound)) {
      if (actor.shield>0) {
        io.write(battle,actor.name+': khiên hết thời hạn.');
        io.emit(battle,{type:'shield_expired',targetId:actor.id,sourceId:actor.shieldSourceId});
      }
      actor.shield=0;actor.shieldSourceId=null;delete actor.shieldExpiresAfterRound;
    }
  }
}
