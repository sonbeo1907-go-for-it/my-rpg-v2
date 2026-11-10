import {isAlive} from './actor-life.js';
// Patricia: each living team member currently holding a shield adds a flat % of her MAG.
export function shieldAuraBonus(battle,actor){
 const passive=actor?.passive;
 if(passive?.type!=='shielded_ally_magic'||!battle)return 0;
 const snapshot=battle.shieldAuraSnapshot;
 const count=snapshot?.actionCount===battle.actionCount
  ? snapshot.counts[actor.id]??0
  : battle.actors.filter(ally=>ally.team===actor.team&&isAlive(ally)&&ally.shield>0).length;
 return count*(passive.ratio??0);
}
// Snapshot at the start of an action so a team-shield cast scales from the board before it.
export function captureShieldAuras(battle){
 const counts={};
 for(const actor of battle.actors.filter(item=>item.passive?.type==='shielded_ally_magic')){
  counts[actor.id]=battle.actors.filter(ally=>ally.team===actor.team&&isAlive(ally)&&ally.shield>0).length;
 }
 battle.shieldAuraSnapshot={actionCount:battle.actionCount,counts};
}
