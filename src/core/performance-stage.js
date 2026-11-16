import {isAlive} from './actor-life.js';
import {damageElements} from './elements.js';

export function livePerformanceStage(battle,actor){return actor.performanceStage&&battle.round<=actor.performanceStage.expiresAfterRound?actor.performanceStage:null;}
export function syncPerformanceStages(battle,io,atEnd=false){
 for(const actor of battle.actors){const stage=actor.performanceStage;
  if(stage&&(atEnd?battle.round>=stage.expiresAfterRound:battle.round>stage.expiresAfterRound)){
   delete actor.performanceStage;io?.write(battle,stage.name+' kết thúc.');io?.emit(battle,{type:'performance_stage_end',sourceId:actor.id});
  }
 }
 for(const actor of battle.actors){const speed=Math.max(0,...battle.actors.filter(a=>a.team===actor.team).map(a=>livePerformanceStage(battle,a)?.speed??0));
  if(speed)actor.performanceModifiers={speed};else delete actor.performanceModifiers;
 }
}
export function applyPerformanceStage(battle,source,effect,io){
 source.performanceStage={name:effect.name,speed:effect.speed,expiresAfterRound:battle.round+effect.durationRounds-1};
 syncPerformanceStages(battle);
 const prefix=battle.queue.slice(0,battle.cursor+1);battle.queue=[...prefix,...io.order(battle,battle.queue.slice(battle.cursor+1))];
 if(battle.phase==='main')battle.mainTurnOrder=[...battle.queue];
 io.write(battle,source.name+' dựng '+effect.name+' · toàn đội +'+Math.round(effect.speed*100)+'% SPD trong '+effect.durationRounds+' vòng.');
 io.emit(battle,{type:'performance_stage',sourceId:source.id,team:source.team,label:effect.name,durationRounds:effect.durationRounds});
}
export function isMagicSkillContext(skill,context={}){
 return Boolean(skill&&!skill.id.startsWith('$')&&!context.automatic&&!context.gearEffectId&&(!context.reaction||context.reactionKind==='follow_up'));
}
export function magicalSkillHitCount(skill){return Math.max(1,(skill?.effects??[]).filter(e=>e.type==='damage'&&e.damageType==='magical').reduce((sum,e)=>sum+(e.hits??1),0));}
export function flatMagicSkillTotal(content,actor,skill,context={}){
 if(!isMagicSkillContext(skill,context)||!skill.effects.some(e=>e.type==='damage'&&e.damageType==='magical'))return 0;
 return (context.damageUseBuffs??actor.statuses??[]).filter(s=>content.statuses[s.id]?.flatMagicSkill&&(s.charges??0)>0).reduce((sum,s)=>sum+(s.flatSkillBonus??0),0);
}
export function flatMagicSkillHitBonus(battle,actor,effect,context){
 if(effect.damageType!=='magical')return 0;
 const total=flatMagicSkillTotal(battle.content,actor,context.skill,context);if(!total)return 0;
 context.flatMagicBuffsUsed??=new Set();
 for(const s of context.damageUseBuffs??[])if(battle.content.statuses[s.id]?.flatMagicSkill)context.flatMagicBuffsUsed.add(s);
 return total/magicalSkillHitCount(context.skill);
}
export function performanceDamageMultiplier(battle,attacker,effect,context){
 if(effect.damageType!=='magical'||!isMagicSkillContext(context.skill,context))return 1;
 const ratio=Math.max(0,...battle.actors.filter(owner=>owner.team===attacker.team&&isAlive(owner)&&owner.passive?.type==='performance_stage_amp'&&livePerformanceStage(battle,owner)&&!damageElements(effect).some(e=>owner.passive.excludedElements.includes(e))).map(owner=>owner.passive.ratio));
 return 1+ratio;
}
export function validatePerformanceContent(content,fail,elements){
 for(const actor of Object.values(content.characters))if(actor.passive?.type==='performance_stage_amp'){
  const p=actor.passive;if(!Number.isFinite(p.ratio)||p.ratio<=0||p.ratio>1||!Array.isArray(p.excludedElements)||p.excludedElements.some(e=>!elements.includes(e))||!actor.abilities.some(id=>content.abilities[id]?.effects?.some(e=>e.type==='performance_stage')))fail(actor.id+': invalid performance passive');
 }
 for(const status of Object.values(content.statuses))if(status.flatMagicSkill!==undefined&&(status.flatMagicSkill!==true||status.kind!=='buff'||status.damageUses!==1||status.persistent!==true||status.consumeOnAttack||status.durationClock||Object.keys(status.modifiers??{}).length))fail(status.id+': invalid flat magic skill buff');
 for(const skill of Object.values(content.abilities))for(const e of skill.effects??[]){
  if(e.type==='performance_stage'&&(skill.target!=='self'||!e.name?.trim()||!Number.isSafeInteger(e.durationRounds)||e.durationRounds<1||e.durationRounds>10||!Number.isFinite(e.speed)||e.speed<=0||e.speed>1))fail(skill.id+': invalid performance stage');
  if(e.flatSkillScaling!==undefined&&(e.type!=='status'||!content.statuses[e.status]?.flatMagicSkill||e.flatSkillScaling.stat!=='magic'||!Number.isFinite(e.flatSkillScaling.multiplier)||e.flatSkillScaling.multiplier<=0||e.flatSkillScaling.multiplier>5))fail(skill.id+': invalid flat skill scaling');
 }
}
