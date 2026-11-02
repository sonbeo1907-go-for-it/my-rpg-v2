import {teamResourceValue} from './team-resources.js';
import {battleMaxMp} from './stat-values.js';

import {isAlive} from "./actor-life.js";
// Modes and their timers live on the owning actor and travel between dungeon rooms.
export function activeCombatMode(actor) { return actor?.combatModes?.[actor.activeMode] ?? null; }
export function modeLifetime(mode) { return mode?.lifetime ?? 'resource'; }
export function commandAbilityIds(actor) {
  const mode=activeCombatMode(actor);
  if (mode?.commandAbilities) return mode.commandAbilities;
  if (!mode && actor.preModeAbility) return [actor.preModeAbility,'$defend'];
  return ['$attack',...(actor.normalAbilities && !mode ? actor.normalAbilities : actor.abilities),'$defend'];
}
export function enterCombatMode(battle,actor,id,io,appliedModifiers,followUpBonus) {
  if (actor.activeMode || !actor.combatModes?.[id]) throw new Error('Không thể chuyển dạng.');
  const mode=actor.combatModes[id];
  actor.activeMode=id;
  if(mode.resetResourceOnEnter)actor.resourceValues[mode.resetResourceOnEnter]=0;
  if(followUpBonus!==undefined)actor.modeFollowUpBonus=followUpBonus;else delete actor.modeFollowUpBonus;
  if(appliedModifiers)actor.modeAppliedModifiers={...appliedModifiers};else delete actor.modeAppliedModifiers;
  if (modeLifetime(mode)==='rounds') actor.modeExpiresAfterRound=battle.round+mode.durationRounds-1;
  io.write(battle,actor.name+' triển khai '+mode.name+'.');
  io.emit(battle,{type:'mode_enter',sourceId:actor.id,mode:id});
  if (mode.entryEffects) io.apply(battle,actor,mode.entryEffects);
}
export function leaveCombatMode(battle,actor,reason,io) {
  const mode=activeCombatMode(actor);
  if (!mode) return false;
  const id=actor.activeMode;
  if(mode.clearResourceOnExit)actor.resourceValues[mode.clearResourceOnExit]=0;
  delete actor.activeMode;delete actor.modeExpiresAfterRound;delete actor.modeAppliedModifiers;delete actor.modeFollowUpBonus;
  if(mode.exitCooldown){
    const {abilityId,rounds}=mode.exitCooldown;
    // Match ordinary skill cooldowns: skip the next N round starts, available at R+N+1.
    actor.cooldowns??={};actor.cooldowns[abilityId]=Math.max(actor.cooldowns[abilityId]??0,rounds+1);
    io.emit(battle,{type:'cooldown_started',sourceId:actor.id,abilityId,rounds,reason:'mode_exit',mode:id});
    io.write(battle,actor.name+': '+battle.content.abilities[abilityId].name+' bắt đầu hồi chiêu '+rounds+' vòng sau khi rời '+mode.name+'.');
  }
  if(mode.reentryCooldownRounds){actor.modeReentryAfterRound??={};actor.modeReentryAfterRound[id]=battle.round+mode.reentryCooldownRounds;io.write(battle,actor.name+': '+mode.name+' nghỉ '+mode.reentryCooldownRounds+' vòng.');io.emit(battle,{type:'mode_reentry_cooldown',sourceId:actor.id,mode:id,readyRound:battle.round+mode.reentryCooldownRounds+1});}
  for (const [key,state] of Object.entries(actor.companionStates??{})) {
    if (actor.companions[key].requiresMode===id) {delete actor.companionStates[key];io.emit(battle,{type:'companion_exit',sourceId:actor.id,companionId:key,reason});}
  }
  io.emit(battle,{type:'mode_exit',sourceId:actor.id,mode:id,reason});
  io.write(battle,mode.name+' rời sân.');
  if (mode.exitMpRatio>0) io.restore(battle,actor,'mp',Math.ceil(battleMaxMp(battle.content,actor)*mode.exitMpRatio),actor.id);
  return true;
}
export function isContinuingVictory(battle) { return battle?.outcome==='victory' && battle.continuesOnVictory===true; }
export function checkCombatMode(battle,actor,reason,io) {
  const ended=!isAlive(actor) || (battle.outcome && !isContinuingVictory(battle));
  if (ended) {delete actor.pendingMode;delete actor.companionStates;}
  const mode=activeCombatMode(actor);
  const expired=modeLifetime(mode)==='rounds' && (reason==='round_end' ? battle.round>=actor.modeExpiresAfterRound : battle.round>actor.modeExpiresAfterRound);
  const empty=modeLifetime(mode)==='team_resource' ? ['turn_start','round_end','action_end'].includes(reason)&&teamResourceValue(battle,actor,mode.resource)<=0 : modeLifetime(mode)==='resource' && (reason==='turn_start'||reason==='round_end') && (actor.resourceValues?.[mode?.resource]??0)<=0;
  return mode && (ended||expired||empty) ? leaveCombatMode(battle,actor,reason,io) : false;
}
export function modeAvailability(actor,skill) {
  const mode=activeCombatMode(actor);
  const allowed=mode?.commandAbilities??mode?.allowedAbilities;
  if (mode && !allowed.includes(skill.id)) return {ok:false,reason:'Không thể sử dụng khi '+mode.name+' đang hiện diện.'};
  if (!mode && actor.preModeAbility && ![actor.preModeAbility,'$defend'].includes(skill.id)) return {ok:false,reason:'Cần triển khai Thổ Địa Vũ Trang.'};
  if (!mode && actor.normalAbilities && ![...actor.normalAbilities,'$attack','$defend'].includes(skill.id)) return {ok:false,reason:'Kỹ năng chỉ dùng trong dạng triệu hồi.'};
  if (skill.requiresMode && actor.activeMode!==skill.requiresMode) return {ok:false,reason:'Cần '+(actor.combatModes?.[skill.requiresMode]?.name??skill.requiresMode)+'.'};
  if (skill.effects.some(effect=>effect.type==='prepare_mode') && (actor.activeMode||actor.pendingMode)) return {ok:false,reason:actor.pendingMode?'Đang chuẩn bị lên giáp vào đầu vòng sau.':'Đã triển khai giáp.'};
  const summon=skill.effects.find(effect=>effect.type==='summon_companion');
  if (summon && actor.companionStates?.[summon.companion]) return {ok:false,reason:'Golem đang được triệu hồi hoặc còn hiện diện.'};
  const required=skill.requiresResource;
  if (required && (actor.resourceValues?.[required.id]??0)<required.min) return {ok:false,reason:'Cần '+required.min+' '+(actor.resources?.[required.id]?.name??required.id)+'.'};
  return null;
}
// Each scene retains its own source. One audio override wins; silent modes never mute Magnamut.
export function battlePresentation(actors) {
  const scenes=[];
  for (const actor of actors.filter(actor=>isAlive(actor))) {
    const mode=activeCombatMode(actor);
    if (mode && !['actor','none'].includes(mode.presentationScope)) scenes.push({ownerId:actor.id,mode:actor.activeMode,name:mode.name,music:mode.music,background:mode.background,summary:actor.modeFollowUpBonus!==undefined?('+'+Number(((actor.modeAppliedModifiers?.magic??mode.statModifiers?.magic??0)*100).toFixed(2))+'% MAG · Liên kích '+actor.passive.modePerRound+' lần/vòng · thêm '+Number((actor.modeFollowUpBonus*100).toFixed(2))+'% MAG hệ số'):mode.summary??'+15 MAG căn bản · Mệnh lệnh hủy diệt'});
    for (const [id,state] of Object.entries(actor.companionStates??{})) {
      if (!state.active) continue;
      const companion=actor.companions[id];
      scenes.push({ownerId:actor.id,mode:id,name:companion.name,background:companion.background,summary:companion.summary});
    }
  }
  if (!scenes.length) return null;
  const primary=scenes.find(scene=>scene.music)??scenes[0];
  return {...primary,scenes,music:scenes.find(scene=>scene.music)?.music??null};
}
