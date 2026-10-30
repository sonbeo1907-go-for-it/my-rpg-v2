import {battleStat} from './stat-values.js';

export function copyTurnOrderField(field) {
  if (field == null) return null;
  if (field.kind !== 'team_priority' || !['party','enemy'].includes(field.priorityTeam) || typeof field.name !== 'string' || !field.name || typeof field.sourceId !== 'string' || !field.sourceId || !Number.isSafeInteger(field.expiresAfterRound) || field.expiresAfterRound < 0) throw new Error('Hiệu ứng thứ tự lượt không hợp lệ.');
  return structuredClone(field);
}
// Round-wide fields are independent of actor status clocks and of extra actions.
export function activeTurnOrderField(battle) {
  const field=battle.turnOrderField;
  return field?.kind==='team_priority' && battle.round<=field.expiresAfterRound ? field : null;
}
export function orderActorIds(battle,ids) {
  const actors=new Map(battle.actors.map(actor=>[actor.id,actor]));
  const field=activeTurnOrderField(battle);
  return [...ids].sort((left,right)=>{
    const a=actors.get(left),b=actors.get(right);
    const priority=field ? Number(b.team===field.priorityTeam)-Number(a.team===field.priorityTeam) : 0;
    return priority || battleStat(battle.content,b,'speed')-battleStat(battle.content,a,'speed');
  });
}
export function expireTurnOrderField(battle,io,atRoundEnd=false) {
  const field=battle.turnOrderField;
  if (field && (atRoundEnd ? battle.round>=field.expiresAfterRound : battle.round>field.expiresAfterRound)) {
    battle.turnOrderField=null;
    io.write(battle,field.name+' hết hiệu lực.');
    io.emit(battle,{type:'turn_order_field_end',sourceId:field.sourceId});
  }
}
export function applyTurnOrderField(battle,actor,effect,io) {
  battle.turnOrderField={kind:'team_priority',name:effect.name,sourceId:actor.id,priorityTeam:actor.team,expiresAfterRound:battle.round+effect.durationRounds-1};
  // Freeze history and the current action. Reorder only actors that have not acted.
  const prefix=battle.queue.slice(0,battle.cursor+1);
  battle.queue=[...prefix,...orderActorIds(battle,battle.queue.slice(battle.cursor+1))];
  if (battle.phase==='main') battle.mainTurnOrder=[...battle.queue];
  io.write(battle,effect.name+': phe của '+actor.name+' được ưu tiên, giữ thứ tự SPD trong từng phe.');
  io.emit(battle,{type:'turn_order_field',sourceId:actor.id,field:structuredClone(battle.turnOrderField)});
}
export function skillBaseStatBonuses(battle,actor,skill,targets) {
  const passive=actor.passive;
  if (passive?.type!=='later_target_base_stat' || skill.id?.startsWith('$') || skill.activation==='passive' || !skill.effects.some(effect=>effect.type==='damage')) return {};
  const order=battle.mainTurnOrder??[],rank=order.indexOf(actor.id);
  if (rank<0 || !targets.some(target=>target.hp>0 && target.team!==actor.team && order.indexOf(target.id)>rank)) return {};
  return {[passive.stat]:passive.amount}; // One grant per cast, even for AoE / multi-hit.
}
