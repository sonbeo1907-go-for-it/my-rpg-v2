import {isAlive} from './actor-life.js';
const liveStatus=s=>(s.remaining==null||s.remaining>0)&&(s.stacks??1)>0;
export function boundAlly(battle,source,bindingId=source?.passive?.statusId){
 if(!source||!isAlive(source)||source.passive?.type!=='turn_delegate'||!bindingId)return null;
 return battle.actors.find(a=>a.id!==source.id&&a.team===source.team&&isAlive(a)&&a.statuses?.some(s=>s.id===bindingId&&s.sourceId===source.id&&liveStatus(s)))??null;
}
export function cleanupTurnDelegations(battle){
 for(const target of battle.actors)target.statuses=target.statuses.filter(s=>{
  if(!battle.content.statuses[s.id]?.turnDelegation)return true;
  const owner=battle.actors.find(a=>a.id===s.sourceId);
  return liveStatus(s)&&isAlive(target)&&owner?.team===target.team&&target.id!==owner.id&&isAlive(owner)&&owner.passive?.type==='turn_delegate'&&owner.passive.statusId===s.id;
 });
}
// Freeze the delegate for the current action, even when the fifth turn ends its link.
export function delegatedTurnActor(battle){
 const d=battle.delegatedTurn,ownerId=battle.queue[battle.cursor];
 const valid=d&&d.ownerId===ownerId&&d.cursor===battle.cursor&&d.round===battle.round&&d.phase===battle.phase;
 return battle.actors.find(a=>a.id===(valid?d.actorId:ownerId))??null;
}
export function turnOrderEntries(battle){
 if(battle.outcome)return [];
 return battle.queue.slice(battle.cursor).map((ownerId,offset)=>{
  const owner=battle.actors.find(a=>a.id===ownerId);if(!owner||!isAlive(owner))return null;
  const actor=offset===0?delegatedTurnActor(battle):battle.phase==='main'?(boundAlly(battle,owner)??owner):owner;
  return {key:ownerId,ownerId,actorId:actor.id,actor,delegated:actor.id!==ownerId};
 }).filter(Boolean);
}
export function bindTurns(battle,source,target,effect,io){
 if(!target||!isAlive(source)||!isAlive(target)||target.team!==source.team||source.id===target.id)return;
 const applied=io.status(battle,target,effect.bindingId,effect.duration,source.id);
 if(!applied)return; // A rejected new buff must not erase the previous link.
 for(const a of battle.actors)if(a.id!==target.id)a.statuses=a.statuses.filter(s=>!(s.id===effect.bindingId&&s.sourceId===source.id));
 io.write(battle,source.name+' liên kết Voodoo với '+target.name+'.');
 io.emit(battle,{type:'turn_binding',sourceId:source.id,targetId:target.id,statusId:effect.bindingId,label:'Voodoo'});
}
export function grantDelegationExtraTurns(battle,io){
 for(const source of battle.actors)if(boundAlly(battle,source)){
  if(battle.extraTurnGrants.has(source.id)||battle.extraTurnUsed.has(source.id))continue;
  battle.extraTurnGrants.add(source.id);battle.extraPhaseRequired=true;
  io.emit(battle,{type:'extra_turn',sourceId:source.id,targetId:source.id,label:'Voodoo'});
  io.write(battle,source.name+' nhận Lượt Thêm từ Voodoo.');
 }
}
export function applyBoundExposure(battle,source,targets,effect,context,io){
 const ally=boundAlly(battle,source,effect.bindingId),id=ally&&'exposure_'+ally.element;
 if(!id||!battle.content.statuses[id])return;
 const hits=new Set((context.gearImpacts??[]).filter(h=>h.lostHp+h.absorbed>0).map(h=>h.target.id));
 for(const target of targets)if(isAlive(target)&&hits.has(target.id))io.status(battle,target,id,undefined,source.id,{stacks:effect.stacks});
}
export function validateTurnDelegation(content){
 const errors=[],statuses=content.statuses??{},skills=Object.values(content.abilities??{});
 for(const status of Object.values(statuses))if(status.turnDelegation!==undefined){
  if(status.turnDelegation!==true||status.kind!=='buff'||status.durationClock!=='main_turn'||status.persistent||status.maxStacks||status.damageUses||status.skipTurn||status.damageOverTime||!Number.isSafeInteger(status.defaultDuration)||status.defaultDuration<1)errors.push('invalid turn binding '+status.id);
 }
 for(const actor of Object.values(content.characters??{}))if(actor.passive?.type==='turn_delegate'){
  const p=actor.passive;
  if(!p.name?.trim()||!p.description?.trim()||!statuses[p.statusId]?.turnDelegation||!actor.abilities?.some(id=>content.abilities[id]?.effects.some(e=>e.type==='bind_turns'&&e.bindingId===p.statusId)))errors.push('invalid turn delegate '+actor.id);
 }
 for(const skill of skills)for(const effect of skill.effects??[])if(['bind_turns','bound_exposure'].includes(effect.type)){
  if(!statuses[effect.bindingId]?.turnDelegation)errors.push('unknown turn binding '+skill.id);
  if(effect.type==='bind_turns'&&(skill.target!=='ally'||skill.excludeSelf!==true||!Number.isSafeInteger(effect.duration)||effect.duration<1||effect.duration>10||skill.activation==='passive'))errors.push('invalid turn binding skill '+skill.id);
  if(effect.type==='bound_exposure'&&(!['enemy','all_enemies','enemy_splash'].includes(skill.target)||effect.requiresDamageHit!==true||!Number.isInteger(effect.stacks)||effect.stacks<1||effect.stacks>3||!skill.effects.some(e=>e.type==='damage')))errors.push('invalid bound exposure '+skill.id);
  for(const a of Object.values(content.characters??{}).filter(a=>a.abilities?.includes(skill.id)))if(a.passive?.type!=='turn_delegate'||a.passive.statusId!==effect.bindingId)errors.push('incompatible turn binding owner '+skill.id);
 }
 return errors;
}
