// HP zero is a living combat state only for authored Agony enemies.
export function isInAgony(actor){return actor?.group==='agony'&&Boolean(actor.agony)&&actor.agonyState?.active===true&&actor.hp===0&&actor.stats.maxHp>0;}
export function isAlive(actor){return Boolean(actor&&(actor.hp>0||isInAgony(actor)));}
export function routesToMaxHp(actor,element){return actor?.group==='agony'&&Boolean(actor.agony)&&(isInAgony(actor)||element===actor.agony.directMaxHpElement);}
export function agonyReduction(actor){return isInAgony(actor)?actor.agony.damageReduction:0;}
export function applyLifeDamage(battle,target,amount,{element,healthFloor=0}={},io){
 const result={hpLost:0,maxHpLost:0,entered:false};if(!isAlive(target)||!Number.isFinite(amount)||amount<=0)return result;
 amount=Math.max(0,Math.floor(amount));
 if(routesToMaxHp(target,element)){
  result.maxHpLost=Math.min(target.stats.maxHp,amount);target.stats.maxHp-=result.maxHpLost;
  if(target.baseStats?.maxHp!==undefined)target.baseStats.maxHp=target.stats.maxHp;
  target.hp=Math.min(target.hp,target.stats.maxHp);
  if(target.stats.maxHp===0){target.hp=0;if(target.agonyState)target.agonyState.active=false;}
  return result;
 }
 result.hpLost=Math.min(Math.max(0,target.hp-healthFloor),amount);target.hp-=result.hpLost;
 if(target.hp===0&&target.stats.maxHp>0&&target.group==='agony'&&target.agony){
  const previous=target.agonyState;target.agonyState={active:true,expiresAfterRound:battle.round+target.agony.roundsAfterTrigger,initialMaxHp:previous?.initialMaxHp??target.stats.maxHp,cycles:(previous?.cycles??0)+1};
  // Losing an old shield is a state change, never a shield-break proc.
  target.shield=0;target.shieldSourceId=null;delete target.shieldExpiresAfterRound;
  result.entered=true;io?.write(battle,target.name+' hóa Oán Hận đến hết vòng '+target.agonyState.expiresAfterRound+'.');
  io?.emit(battle,{type:'agony_enter',sourceId:target.id,targetId:target.id,label:'Oán Hận · còn đứng vững ở 0 HP'});
 }
 return result;
}
export function expireAgony(battle,io){
 for(const actor of battle.actors){if(!isInAgony(actor)||battle.round<actor.agonyState.expiresAfterRound)continue;
  actor.agonyState.active=false;actor.hp=actor.stats.maxHp;
  io.write(battle,actor.name+' trở lại từ Oán Hận: '+actor.hp+' / '+actor.stats.maxHp+' HP.');
  io.emit(battle,{type:'agony_return',sourceId:actor.id,targetId:actor.id,label:'Oán Hận kết thúc · trở lại với '+actor.hp+' HP',amount:actor.hp});
 }
}
