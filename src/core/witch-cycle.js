import {moonlightCyclePhase} from './moonlight-cycle.js';
import {isAlive} from './actor-life.js';

// Select once before paying or resolving the cast: an activation caused by this spell
// cannot change its branch halfway through the action.
export function cycleAbility(battle,actor,ability){
 const raw=typeof ability==='string'?battle.content.abilities[ability]:ability;
 const base=battle.content.abilities[raw?.cycleBaseId??raw?.id]??raw;
 if(!base)return base;
 if(!base.moonlightFullAbility&&!base.moonlightWaningDouble)return raw;
 const phase=moonlightCyclePhase(battle,actor?.team)?.id??'inactive';
 let selected=phase==='full'&&base.moonlightFullAbility?battle.content.abilities[base.moonlightFullAbility]:base;
 if(!selected)return base;
 selected={...selected,id:base.id,skillLineId:base.skillLineId,cycleBaseId:base.id,cyclePhase:phase,rankSource:undefined,rankResolved:false};
 if(base.moonlightWaningDouble&&phase==='waning')selected.effects=selected.effects.map(e=>({...e,...(e.type==='heal'?{targetMaxHpRatio:e.targetMaxHpRatio*2}:e.type==='resource'?{maxMpRatio:e.maxMpRatio*2}:e.type==='extend_buffs'?{turns:e.turns*2}:{})}));
 return selected;
}
export function chosenAlly(battle,actor,id){return battle.actors.find(a=>a.id===id&&a.team===actor.team&&isAlive(a));}
export function extendBeneficial(battle,source,target,turns,io){
 const extended=[];
 for(const s of target.statuses){const d=battle.content.statuses[s.id];
  if(d?.kind!=='buff'||!Number.isFinite(s.remaining)||s.remaining<=0||d.persistent||d.damageUses||s.charges!==undefined)continue;
  s.remaining+=turns;if(Number.isFinite(s.expiresAfterRound))s.expiresAfterRound+=turns;extended.push(s.id);
 }
 if(extended.length){io.emit(battle,{type:'buffs_extended',sourceId:source.id,targetId:target.id,statusIds:extended,amount:turns});io.write(battle,target.name+': kéo dài '+extended.length+' hiệu ứng có lợi thêm '+turns+' lượt.');}
}
export function validateWitchCycle(content){
 const errors=[];
 for(const a of Object.values(content.characters))if(a.passive?.type==='moonlight_cycle_sage'){
  const p=a.passive;if(p.blessingId!=='chaotic_eclipse'||!a.moonlightBlessings?.includes(p.blessingId)||!Number.isFinite(p.blessingMagicBonus)||p.blessingMagicBonus<=0||p.blessingMagicBonus>1||p.selfAmplification!==true)errors.push(a.id+': invalid cycle sage');
 }
 for(const a of Object.values(content.characters))if(a.passive?.type==='moonlight_full_sinner'){const p=a.passive;if(p.blessingId!=='chaotic_eclipse'||!a.moonlightBlessings?.includes(p.blessingId)||p.fullMoonBaseMagic!==28||p.fullMoonMpMultiplier!==2)errors.push(a.id+': invalid full moon sinner');}
 for(const s of Object.values(content.statuses))if(s.untilMoonlightWaningEnd!==undefined&&(s.untilMoonlightWaningEnd!==true||s.kind!=='buff'||!s.persistent||s.defaultDuration||s.durationClock||s.charges||s.damageUses||s.maxStacks))errors.push(s.id+': invalid waning clock');
 for(const a of Object.values(content.abilities)){
  if(a.requiresMoonlightPhase!==undefined&&(a.requiresMoonlightPhase!=='full'||!a.effects.some(e=>e.type==='command_moonlight'&&e.blessingId==='chaotic_eclipse')))errors.push(a.id+': invalid required moon phase');
  if(a.moonlightFullAbility){const f=content.abilities[a.moonlightFullAbility];if(!f||f.id===a.id||f.moonlightFullAbility||f.target!==a.target||f.skillLineId!==a.skillLineId||f.cost?.mp!==a.cost?.mp||f.cooldown!==a.cooldown||!a.rankable||!f.rankable)errors.push(a.id+': invalid moonlight full variant');}
  if(a.moonlightWaningDouble!==undefined&&(a.moonlightWaningDouble!==true||a.target!=='all_allies'||!a.effects.some(e=>e.targetMaxHpRatio)))errors.push(a.id+': invalid waning restoration');
  if(a.secondaryAllyTarget!==undefined&&(a.secondaryAllyTarget!==true||a.target!=='enemy'||!a.effects.some(e=>e.to==='selected_ally')))errors.push(a.id+': invalid second target');
  for(const e of a.effects){if(e.to==='selected_ally'&&(!a.secondaryAllyTarget||e.type!=='status'||content.statuses[e.status]?.kind!=='buff'))errors.push(a.id+': invalid chosen ally effect');
   if(e.recipientElements!==undefined&&(!Array.isArray(e.recipientElements)||!e.recipientElements.length||e.recipientElements.some(x=>!['water','fire'].includes(x))||e.to!=='all_allies'||e.type!=='status'))errors.push(a.id+': invalid recipient elements');
   if(e.targetMaxHpRatio!==undefined&&(e.type!=='heal'||!Number.isFinite(e.targetMaxHpRatio)||e.targetMaxHpRatio<=0||e.targetMaxHpRatio>1||e.multiplier!==undefined||e.flat!==undefined))errors.push(a.id+': invalid target HP heal');
   if(e.type==='extend_buffs'&&(!Number.isInteger(e.turns)||e.turns<1||e.turns>3||a.target!=='all_allies'))errors.push(a.id+': invalid buff extension');
  }
 }
 return errors;
}

export function markWaningBuff(battle,actor){const active=battle.moonlight?.[actor.team]?.active;return {waningCycleStart:moonlightCyclePhase(battle,actor.team)?active.startedRound:null};}
export function bindWaningBuffs(battle,team){for(const actor of battle.actors.filter(a=>a.team===team))for(const s of actor.statuses)if(battle.content.statuses[s.id]?.untilMoonlightWaningEnd&&s.waningCycleStart==null)s.waningCycleStart=battle.moonlight[team].active.startedRound;}
export function expireWaningBuffs(battle,io){for(const actor of battle.actors){const active=battle.moonlight?.[actor.team]?.active;if(moonlightCyclePhase(battle,actor.team)?.id!=='waning')continue;actor.statuses=actor.statuses.filter(s=>{if(!battle.content.statuses[s.id]?.untilMoonlightWaningEnd||s.waningCycleStart!==active.startedRound)return true;io.emit(battle,{type:'status_expired',sourceId:s.sourceId,targetId:actor.id,statusId:s.id});io.write(battle,actor.name+': '+battle.content.statuses[s.id].name+' kết thúc cùng Trăng Tàn.');return false;});}}
