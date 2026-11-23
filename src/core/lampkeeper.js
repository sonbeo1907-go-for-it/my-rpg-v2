import {isAlive} from './actor-life.js';
import {debuffTypeCount} from './conditional-combat.js';

// Ephemeral execution scope, never saved on battle or shared with forecast clones.
const scopes=new WeakMap();
export const debuffBatch=battle=>scopes.get(battle);
export function setDebuffBatch(battle,batch){if(batch)scopes.set(battle,batch);else scopes.delete(battle);}
export function withDebuffBatch(battle,batch,fn){const previous=scopes.get(battle);scopes.set(battle,batch);try{return fn();}finally{setDebuffBatch(battle,previous);}}
export function witnessedDebuff(battle,target,io){
 if(!isAlive(target))return;
 const batch=debuffBatch(battle)??{},seen=batch.lampkeeperWitnesses??=new Set();
 for(const owner of battle.actors){const p=owner.passive;
  if(!isAlive(owner)||owner.team===target.team||!['debuff_witness_resource','debuff_witness_support'].includes(p?.type)||seen.has(owner.id))continue;
  seen.add(owner.id);io.announce(battle,owner,owner.id);
  if(p.type==='debuff_witness_resource'){io.restore(battle,owner,p.resource,p.amount,owner.id);continue;}
  const mpState=owner.lampkeeperMpState,mpUses=mpState?.round===battle.round?mpState.uses:0,refund=mpUses<(p.mpPerRound??Infinity);
  if(refund)owner.lampkeeperMpState={round:battle.round,uses:mpUses+1};
  for(const ally of battle.actors.filter(a=>a.team===owner.team&&isAlive(a))){
   if(p.elements.includes(ally.element)){const old=ally.statuses.find(s=>s.id===p.statusId),stacks=Math.min(p.maxStacks,(old?.stacks??0)+1);io.status(battle,ally,p.statusId,p.duration,owner.id,{baseStatModifiers:{attack:p.baseAttack*stacks}});}
   if(refund)io.restore(battle,ally,'mp',Math.ceil(io.maxMp(battle.content,ally)*p.mpRatio),owner.id);
  }
 }
}
export function extendHostileDebuffs(battle,actor,turns,io){
 for(const target of battle.actors.filter(a=>a.team!==actor.team&&isAlive(a))){let changed=false;
  for(const status of target.statuses){const d=battle.content.statuses[status.id];if(d?.kind!=='debuff'||(status.stacks??1)<=0||status.remaining===null)continue;
   if(d.durationClock==='round'){
    const deadline=status.expiresAfterRound??battle.round+(status.remaining??0)-1;if(deadline<battle.round)continue;
    status.expiresAfterRound=deadline+turns;status.remaining=Math.max(1,status.expiresAfterRound-battle.round+1);
   }else{if(!(status.remaining>0))continue;status.remaining+=turns;}
   changed=true;io.emit(battle,{type:'status_extended',sourceId:actor.id,targetId:target.id,statusId:status.id,amount:turns,remaining:status.remaining});io.write(battle,target.name+': '+d.name+' kéo dài thêm '+turns+' lượt.');
  }
  if(changed)witnessedDebuff(battle,target,io);
 }
}
export function syncLampkeeperAuras(battle){
 for(const owner of battle.actors){owner.lampkeeperModifiers={};const rule=owner.combatModes?.[owner.activeMode]?.debuffAttack;
  if(!isAlive(owner)||!rule)continue;const count=battle.actors.filter(a=>a.team!==owner.team&&isAlive(a)).reduce((n,a)=>n+debuffTypeCount(battle.content,a),0);
  owner.lampkeeperModifiers.attack=Math.min(rule.cap,count*rule.perDebuff);
 }
}
export function lampkeeperRoundEnd(battle,io){
 for(const owner of battle.actors){const mode=owner.combatModes?.[owner.activeMode];if(!isAlive(owner)||!mode?.roundEndAbility||owner.lampkeeperEndRound===battle.round||battle.outcome)continue;
  owner.lampkeeperEndRound=battle.round;io.pulse(battle,owner,mode.roundEndAbility,mode.name,'end');if(io.outcome(battle))return;
 }
}
export function validateLampkeepers(content){
 const errors=[];for(const a of Object.values(content.characters??{})){const p=a.passive;
  if(p?.type==='debuff_witness_resource'&&(!a.moonlightBlessings?.includes(p.blessingId)||!a.resources?.[p.resource]||p.amount!==1))errors.push(a.id+': invalid debuff witness resource');
  if(p?.type==='debuff_witness_support'&&(!a.moonlightBlessings?.includes(p.blessingId)||JSON.stringify(p.elements)!=='["light","dark"]'||p.baseAttack!==4||p.maxStacks!==3||p.duration!==3||p.mpRatio!==.03||p.mpPerRound!==3||content.statuses[p.statusId]?.maxStacks!==3||content.statuses[p.statusId]?.durationClock!=='main_turn'))errors.push(a.id+': invalid debuff witness support');
  for(const mode of Object.values(a.combatModes??{})){
   if(mode.debuffAttack&&(mode.debuffAttack.perDebuff!==.08||mode.debuffAttack.cap!==.24))errors.push(a.id+': invalid debuff mode attack');
   if(mode.roundEndAbility&&(!content.abilities[mode.roundEndAbility]||!['rounds','turns'].includes(mode.lifetime)))errors.push(a.id+': invalid round-end mode ability');
  }
 }
 return errors;
}
