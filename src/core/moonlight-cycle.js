import {isAlive} from './actor-life.js';
import {damageElements} from './elements.js';

// Derived from the common-round deadline. Extra turns, forecasts and room carry never tick a second clock.
export function moonlightCyclePhase(battle,team){
 const active=battle.moonlight?.[team]?.active,d=battle.content.moonlightBlessings?.[active?.id];
 if(!active||!d?.cycle||battle.round>active.expiresAfterRound)return null;
 let elapsed=battle.round-active.startedRound;
 if(elapsed<0)return null;
 for(let index=0;index<d.cycle.length;index++){
  const phase=d.cycle[index];
  if(elapsed<phase.durationRounds)return {...phase,index,remainingRounds:phase.durationRounds-elapsed};
  elapsed-=phase.durationRounds;
 }
 return null;
}
export function moonlightMagicAmplification(battle,source,effect){
 const active=battle.moonlight?.[source?.team]?.active,d=battle.content.moonlightBlessings?.[active?.id],rule=d?.damageAmplification;
 if(!rule||effect.damageType!==rule.damageType||!damageElements(effect).includes(rule.element))return 1;
 // Independent blessing source: commanding a hit does not turn it into the commander's damage.
 const sage=battle.actors.some(a=>a.team===source.team&&isAlive(a)&&a.passive?.type==='moonlight_cycle_sage'&&a.passive.blessingId===active?.id&&a.passive.selfAmplification);
 if(source.actorKind==='moonlight'&&(active.includeBlessingDamage??(sage||rule.includeBlessingDamage))!==true)return 1;
 return 1+(moonlightCyclePhase(battle,source.team)?.damageAmp??0);
}
// Runtime opt-in for a future character hook. Only this instance/team changes; no clock or stat mutation.
export function setMoonlightSelfAmplification(battle,team,enabled){
 const state=battle.moonlight?.[team],active=state?.active,rule=battle.content.moonlightBlessings?.[active?.id]?.damageAmplification;
 if(typeof enabled!=='boolean'||!rule||!moonlightCyclePhase(battle,team)||battle.outcome)return false;
 if(active.includeBlessingDamage!==enabled){active.includeBlessingDamage=enabled;state.revision++;}
 return true;
}
export function advanceMoonlightCycles(battle,io){
 for(const [team,state]of Object.entries(battle.moonlight??{})){
  const phase=moonlightCyclePhase(battle,team);
  if(!phase||phase.id===state.active.cyclePhaseId)continue;
  state.active.cyclePhaseId=phase.id;state.revision++;
  io.write(battle,battle.content.moonlightBlessings[state.active.id].name+' — '+phase.name+': khuếch đại phép Hỏa '+Math.round(phase.damageAmp*100)+'%.');
  io.emit(battle,{type:'moonlight_phase',team,blessingId:state.active.id,phaseId:phase.id,label:phase.name,damageAmp:phase.damageAmp});
 }
}
export function validMoonlightCycle(d){
 if(d.cycle===undefined)return d.damageAmplification===undefined;
 const rule=d.damageAmplification;
 return Array.isArray(d.cycle)&&d.cycle.length===3&&d.cycle.map(p=>p?.id).join(':')==='waning:full:waxing'
  &&d.cycle.every(p=>p&&typeof p.name==='string'&&p.name.trim()&&Number.isInteger(p.durationRounds)&&p.durationRounds>0&&p.durationRounds<=6&&Number.isFinite(p.damageAmp)&&p.damageAmp>=0&&p.damageAmp<=1&&Object.keys(p).every(k=>['id','name','durationRounds','damageAmp'].includes(k)))
  &&d.cycle.reduce((n,p)=>n+p.durationRounds,0)===d.durationRounds&&rule?.damageType==='magical'&&rule.element==='fire'&&(rule.includeBlessingDamage===undefined||typeof rule.includeBlessingDamage==='boolean')&&Object.keys(rule).every(k=>['damageType','element','includeBlessingDamage'].includes(k))
  &&d.stat==='magic'&&d.targetMode==='selected'&&Array.isArray(d.phases)&&d.phases.length===0;
}
