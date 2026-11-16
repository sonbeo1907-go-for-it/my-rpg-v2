import {isAlive} from './actor-life.js';
import {activeStatuses} from './status-state.js';

const ruleFor = battle => battle.content.encounters[battle.encounterId]?.bossEncounter;
const bosses = battle => battle.actors.filter(a=>a.boss&&a.team==='enemy');
const fallback = actor => actor.boss.phases[0].rotation[0][0];
const announce = (battle,io,message,actor,detail={}) => {
  io.write(battle,message);
  io.emit?.(battle,{type:'boss_mechanic',sourceId:actor?.id,label:message,...detail});
};

// All state is serializable battle/actor state. No timers, closures or module-global quotas.
export function initializeEncounterBosses(battle) {
  const rule=ruleFor(battle);
  if(rule)battle.linkedBossState={fallenIds:[],soloActorId:null,survivorReadyRound:null,warningRound:null};
}

export function finishEncounterBosses(battle){
  for(const actor of bosses(battle)){
    actor.bossState.pendingMoves=[];
    delete actor.bossState.executingRitual;delete actor.bossState.stanceExposure;
  }
}

export function observeEncounterBosses(battle,io) {
  const rule=ruleFor(battle),state=battle.linkedBossState;
  if(!rule||!state)return;
  const members=bosses(battle),alive=members.filter(isAlive);
  const fallen=members.filter(a=>!isAlive(a)).map(a=>a.id);
  if(fallen.length===state.fallenIds.length)return;
  state.fallenIds=fallen;
  for(const actor of members)actor.bossState.pendingMoves=actor.bossState.pendingMoves.filter(move=>move.ritual?.kind!=='link');
  if(alive.length===1){
    state.soloActorId=alive[0].id;state.survivorReadyRound=battle.round+1;
    announce(battle,io,`${alive[0].name}: Độc Giữ Thiên Môn — hai hành động và tăng 15% sát thương từ vòng ${state.survivorReadyRound}.`,alive[0],{kind:'last_stand'});
  }
  if(!alive.length){state.soloActorId=null;state.survivorReadyRound=null;}
}

export function encounterBossRoundStart(battle,io) {
  observeEncounterBosses(battle,io);
  const rule=ruleFor(battle),state=battle.linkedBossState;
  if(rule&&state&&!state.fallenIds.length&&battle.round>=rule.firstWarningRound
    &&(battle.round-rule.firstWarningRound)%rule.cycleRounds===0&&state.warningRound!==battle.round){
    state.warningRound=battle.round;
    for(const spec of rule.rituals){
      const actor=bosses(battle).find(a=>a.definitionId===spec.enemyId&&isAlive(a));
      if(!actor)continue;
      actor.bossState.pendingMoves.push({abilityId:spec.abilityId,warningRound:battle.round,readyRound:battle.round+1,
        ritual:{kind:'link',marks:0,maxMarks:rule.marks,announced:true,cancelled:false}});
      announce(battle,io,`${actor.name} chuẩn bị Thiên Môn Lôi Bạo — giải phóng vòng ${battle.round+1}. Đánh điểm yếu ${rule.marks} lần để ngắt phần nghi thức này.`,actor,{kind:'warning'});
    }
  }
  for(const actor of bosses(battle).filter(isAlive))for(const move of actor.bossState.pendingMoves){
    if(move.ritual&&!move.ritual.announced&&move.warningRound<=battle.round){
      move.ritual.announced=true;
      announce(battle,io,`${actor.name}: ${battle.content.abilities[move.abilityId].name} sẽ giải phóng ở vòng ${move.readyRound}. ${move.ritual.kind==='stance'?'Phá ba dấu Sơn Thế hoặc chuẩn bị phòng thủ.':'Giải hiệu ứng bất lợi để giảm sức mạnh nghi thức.'}`,actor,{kind:'warning'});
    }
  }
}

export function prepareBossRitual(battle,actor,move) {
  const rule=actor.boss?.ritual;
  if(rule?.abilityId!==move.abilityId)return;
  move.warningRound=battle.round+1;
  // A complete Main Round to respond, irrespective of caster speed or extra turns.
  move.readyRound=Math.max(move.readyRound,battle.round+2);
  move.ritual={kind:rule.kind,marks:0,maxMarks:rule.marks??0,cancelled:false,announced:false};
}

export function observeBossWeakness(battle,attacker,target,context,io) {
  if(attacker.team===target.team||!isAlive(target))return;
  const moves=target.bossState?.pendingMoves?.filter(move=>move.ritual?.maxMarks>0&&move.warningRound<=battle.round&&!move.ritual.cancelled)??[];
  if(!moves.length)return;
  context.ritualMarkedTargets??=new Set();
  if(context.ritualMarkedTargets.has(target.id))return;
  context.ritualMarkedTargets.add(target.id);
  for(const move of moves){
    const ritual=move.ritual;ritual.marks=Math.min(ritual.maxMarks,ritual.marks+1);
    announce(battle,io,`${target.name}: ${ritual.kind==='stance'?'Sơn Thế đã phá':'Liên Kết đã phá'} ${ritual.marks}/${ritual.maxMarks}.`,target,{kind:'mark_break'});
    if(ritual.marks===ritual.maxMarks){
      ritual.cancelled=true;
      if(ritual.kind==='stance'){
        const state=target.bossState;
        state.stanceExposure={untilMainTurn:(state.mainTurnsCompleted??0)+(state.turnInProgress?2:1),damageBonus:target.boss.ritual.exposedDamage};
      }
      announce(battle,io,`${target.name}: ${ritual.kind==='stance'?'Vỡ Thế! Nhận thêm 20% sát thương đến hết lượt chính kế tiếp.':'Phối hợp bị ngắt!'} ${battle.content.abilities[move.abilityId].name} đã bị hủy.`,target,{kind:'interrupted'});
    }
  }
}

export function cancelBossRituals(battle,actor,io) {
  if(actor.bossState.pendingMoves.some(m=>m.ritual))announce(battle,io,`${actor.name}: chuyển giai đoạn, hủy nghi thức cũ.`,actor,{kind:'cancelled'});
}

export function bossActionCount(battle,actor,normal) {
  const state=battle.linkedBossState,rule=ruleFor(battle);
  return rule&&state?.soloActorId===actor.id&&battle.round>=state.survivorReadyRound?rule.survivor.actionsPerTurn:normal;
}
export function beginBossRitualTurn(actor){actor.bossState.turnInProgress=true;}
export function finishBossRitualTurn(battle,actor){
  const state=actor.bossState;
  if(!state||battle.phase!=='main')return;
  state.mainTurnsCompleted=(state.mainTurnsCompleted??0)+1;
  delete state.turnInProgress;delete state.executingRitual;
  if(state.stanceExposure&&state.mainTurnsCompleted>=state.stanceExposure.untilMainTurn)delete state.stanceExposure;
}
export function ritualJobAbility(actor,job) {return job.ritual?.cancelled?fallback(actor):job.abilityId;}
export function beginRitualAction(actor,job,skillId){
  if(job.ritual&&!job.ritual.cancelled&&job.abilityId===skillId)actor.bossState.executingRitual=structuredClone(job);
  else delete actor.bossState.executingRitual;
}

export function curseDebuffCount(battle,source,target){
  return new Set(activeStatuses(target).filter(s=>s.sourceId===source.id&&battle.content.statuses[s.id]?.kind==='debuff').map(s=>s.id)).size;
}
export const bossIncomingMultiplier=target=>1+(target?.bossState?.stanceExposure?.damageBonus??0);
export function encounterOffenseMultiplier(battle,attacker,target,context){
  let ratio=1;
  const active=attacker.bossState?.executingRitual,rule=attacker.boss?.ritual;
  if(active&&context.skillId===active.abilityId){
    if(active.ritual.kind==='stance')ratio*=1-active.ritual.marks*rule.reductionPerMark;
    if(active.ritual.kind==='curse')ratio*=1+Math.min(rule.maxTypes,curseDebuffCount(battle,attacker,target))*rule.perDebuff;
  }
  const state=battle.linkedBossState;
  if(state?.soloActorId===attacker.id&&battle.round>=state.survivorReadyRound)ratio*=ruleFor(battle).survivor.damageMultiplier;
  return ratio;
}

export const encounterHitMultiplier=(battle,attacker,target,context)=>encounterOffenseMultiplier(battle,attacker,target,context)*bossIncomingMultiplier(target);

// Presentation derives the same deadlines and source-specific debuffs as actual damage.
export function bossRitualNotices(battle){
  const notices=[];
  for(const actor of bosses(battle).filter(isAlive)){
    for(const move of actor.bossState.pendingMoves.filter(m=>m.ritual)){
      const r=move.ritual,curse=r.kind==='curse';
      notices.push({id:actor.id+':'+move.abilityId,actorId:actor.id,name:actor.name,ability:battle.content.abilities[move.abilityId].name,
        readyRound:move.readyRound,warningRound:move.warningRound,cancelled:r.cancelled,kind:r.kind,marks:r.marks,maxMarks:r.maxMarks,
        advice:r.kind==='stance'?'Đánh điểm yếu phá Sơn Thế; mỗi dấu giảm 15% sức mạnh chiêu.':'Đánh điểm yếu hai lần vào cùng một boss để ngắt phần phối hợp.',
        targets:curse?battle.actors.filter(a=>a.team!==actor.team&&isAlive(a)).map(a=>({id:a.id,name:a.name,bonus:Math.min(actor.boss.ritual.maxTypes,curseDebuffCount(battle,actor,a))*actor.boss.ritual.perDebuff})):null});
    }
    if(actor.bossState.stanceExposure)notices.push({id:actor.id+':exposed',actorId:actor.id,name:actor.name,kind:'exposed',advice:'Vỡ Thế · nhận thêm 20% sát thương đến hết lượt chính kế tiếp.'});
  }
  const state=battle.linkedBossState;
  if(state?.soloActorId){const actor=bosses(battle).find(a=>a.id===state.soloActorId&&isAlive(a));if(actor)notices.push({id:'last-stand',actorId:actor.id,name:actor.name,kind:'last_stand',advice:`Độc Giữ Thiên Môn · hai hành động/lượt, sát thương +15% ${battle.round<state.survivorReadyRound?'từ vòng '+state.survivorReadyRound:'đang có hiệu lực'}.`});}
  return notices;
}

export function validateBossRitual(actor,content,fail){
  if(actor.formationSpan!==undefined&&(!Number.isInteger(actor.formationSpan)||actor.formationSpan<1||actor.formationSpan>3))fail(actor.id+': invalid formation span');
  const rule=actor.boss?.ritual;if(!rule)return;
  const skill=content.abilities[rule.abilityId];
  if(!['stance','curse'].includes(rule.kind)||!actor.abilities.includes(rule.abilityId)||!skill?.bossHeavy||!Number.isInteger(skill.windup?.rounds)||skill.windup.rounds<2||skill.target!=='all_enemies')fail(actor.id+': invalid boss ritual');
  if(rule.kind==='stance'&&(!Number.isInteger(rule.marks)||rule.marks<1||rule.marks>6||!Number.isFinite(rule.reductionPerMark)||rule.reductionPerMark<0||rule.reductionPerMark*rule.marks>=1||!Number.isFinite(rule.exposedDamage)||rule.exposedDamage<=0||rule.exposedDamage>1))fail(actor.id+': invalid stance ritual');
  if(rule.kind==='curse'&&(!Number.isInteger(rule.maxTypes)||rule.maxTypes<1||rule.maxTypes>8||!Number.isFinite(rule.perDebuff)||rule.perDebuff<=0||rule.perDebuff>1))fail(actor.id+': invalid curse ritual');
}

export function validateEncounterBosses(encounter,content,fail){
  const enemies=(encounter.enemies??[]).map(id=>content.enemies[id]).filter(Boolean);
  if(enemies.reduce((n,e)=>n+(e.formationSpan??1),0)>4)fail(encounter.id+': encounter formation exceeds four slots');
  const rule=encounter.bossEncounter;
  if(!rule)return;
  if(rule.type!=='linked_bosses'||enemies.length!==2||enemies.some(e=>!e.boss||!e.controlImmunities?.includes('stun'))||!Number.isInteger(rule.firstWarningRound)||rule.firstWarningRound<2||!Number.isInteger(rule.cycleRounds)||rule.cycleRounds<3||!Number.isInteger(rule.marks)||rule.marks<1||rule.marks>6||rule.survivor?.actionsPerTurn!==2||!Number.isFinite(rule.survivor?.damageMultiplier)||rule.survivor.damageMultiplier<1||rule.survivor.damageMultiplier>2){fail(encounter.id+': invalid linked bosses');return;}
  if(!Array.isArray(rule.rituals)||rule.rituals.length!==2||new Set(rule.rituals.map(r=>r.enemyId)).size!==2||rule.rituals.some(r=>{
    const e=enemies.find(e=>e.id===r.enemyId),s=content.abilities[r.abilityId];
    return !e?.abilities.includes(r.abilityId)||!s?.bossHeavy||s.target!=='all_enemies'||s.windup||!s.effects.some(e=>e.type==='damage');
  }))fail(encounter.id+': invalid linked ritual skills');
}
