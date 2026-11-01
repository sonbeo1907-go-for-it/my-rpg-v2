
import {isAlive} from "./actor-life.js";
import {enterCombatMode,checkCombatMode} from './combat-modes.js';

export function prepareCombatMode(battle,actor,id,io) {
  actor.pendingMode={id,readyRound:battle.round+1};
  io.write(battle,actor.name+': Thổ Địa Vũ Trang sẽ hoàn tất đầu vòng '+actor.pendingMode.readyRound+'.');
  io.emit(battle,{type:'mode_prepare',sourceId:actor.id,mode:id,readyRound:actor.pendingMode.readyRound});
}
export function prepareCompanion(battle,actor,id,io) {
  actor.companionStates??={};
  actor.companionStates[id]={readyRound:battle.round+1,active:false,pulses:{}};
  io.write(battle,actor.name+' gọi '+actor.companions[id].name+': đến vào đầu vòng '+(battle.round+1)+'.');
  io.emit(battle,{type:'companion_prepare',sourceId:actor.id,companionId:id,readyRound:battle.round+1});
}
export function roundSummons(battle,phase,io) {
  // Snapshot owners; summoned companions never become party slots or turn-queue actors.
  for (const owner of battle.actors) {
    checkCombatMode(battle,owner,phase==='start'?'round_start':'owner_state',io);
    if (!isAlive(owner) || battle.outcome) continue;
    const pending=owner.pendingMode;
    if (phase==='start' && pending && pending.readyRound<=battle.round) {
      delete owner.pendingMode;
      if (!owner.activeMode) enterCombatMode(battle,owner,pending.id,io);
    }
    for (const [id,state] of Object.entries(owner.companionStates??{})) {
      const definition=owner.companions[id];
      if (definition.requiresMode && owner.activeMode!==definition.requiresMode) {delete owner.companionStates[id];continue;}
      if (!state.active && phase==='start' && state.readyRound<=battle.round) {
        state.active=true;state.expiresAfterRound=battle.round+definition.durationRounds-1;
        io.write(battle,definition.name+' xuất hiện.');
        io.emit(battle,{type:'companion_enter',sourceId:owner.id,companionId:id});
      }
      if (!state.active || battle.round>state.expiresAfterRound) {if (state.active) delete owner.companionStates[id];continue;}
      if (state.pulses[phase]===battle.round) continue;
      state.pulses[phase]=battle.round; // Reserve before any reactions or boss transition.
      const ability=phase==='start'?definition.roundStartAbility:definition.roundEndAbility;
      if (ability) io.pulse(battle,owner,ability,definition.name,phase);
      if (io.outcome(battle)) return;
    }
  }
}
export function expireRoundSummons(battle,io) {
  for (const owner of battle.actors) {
    for (const [id,state] of Object.entries(owner.companionStates??{})) {
      if (state.active && battle.round>=state.expiresAfterRound) {
        delete owner.companionStates[id];
        io.write(battle,owner.companions[id].name+' rời sân.');
        io.emit(battle,{type:'companion_exit',sourceId:owner.id,companionId:id,reason:'expired'});
      }
    }
  }
}
