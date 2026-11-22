import {baseStatValue} from './combat-math.js';
import {isAlive} from './actor-life.js';
import {coefficientFactor,getActorSkillRank,skillRules} from './skill-rules.js';

export const REVELATION_COST=30;
export function normalizeRevelations(value,content,owned){
 if(value===undefined)return {};
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Dữ liệu Nguyệt Quang Hé Lộ không hợp lệ.');
 const result={};
 for(const[id,state]of Object.entries(value)){
  if(!content.characters[id]?.moonlightRevelation||!owned.includes(id)||!state||state.unlocked!==true||typeof state.enabled!=='boolean'||Object.keys(state).some(k=>!['unlocked','enabled'].includes(k)))throw Error('Dữ liệu Nguyệt Quang Hé Lộ không hợp lệ.');
  result[id]={unlocked:true,enabled:state.enabled};
 }
 return result;
}
export function changeRevelation(campaign,content,id,enabled,options={}){
 const definition=content.characters[id]?.moonlightRevelation;
 if(!definition||!campaign.unlockedCharacterIds.includes(id))throw Error('Chưa sở hữu nhân vật có Nguyệt Quang Hé Lộ.');
 if(options.battleActive||campaign.chronicles?.activeSession)throw Error('Hãy kết thúc trận hoặc chuyến hầm ngục trước khi thay đổi Nguyệt Quang Hé Lộ.');
 if(typeof enabled!=='boolean')throw Error('Lựa chọn Nguyệt Quang Hé Lộ không hợp lệ.');
 const state=normalizeRevelations(campaign.moonlightRevelations,content,campaign.unlockedCharacterIds),first=!state[id];
 if(first&&(!Number.isSafeInteger(campaign.recruitmentShards)||campaign.recruitmentShards<REVELATION_COST))throw Error('Không đủ Pure Prisma.');
 if(first&&!enabled)throw Error('Hãy mở khóa Nguyệt Quang Hé Lộ trước.');
 const next=structuredClone(campaign);
 if(first)next.recruitmentShards-=REVELATION_COST;
 next.moonlightRevelations={...state,[id]:{unlocked:true,enabled}};
 return next;
}
export function activeMoonlight(battle,team,id){const a=battle.moonlight?.[team]?.active;return Boolean(a?.id===id&&battle.round<=a.expiresAfterRound);}
export function revelationActive(battle,actor){return actor.moonlightRevelationEnabled===true&&activeMoonlight(battle,actor.team,actor.moonlightRevelation?.blessingId);}
export function syncMoonlightAuras(battle){
 for(const actor of battle.actors){
  actor.moonlightModifiers={};actor.moonlightBaseBonuses=isAlive(actor)&&revelationActive(battle,actor)?{...actor.moonlightRevelation.baseStatBonuses}:{};
  if(isAlive(actor)&&revelationActive(battle,actor)&&actor.moonlightRevelation.baseAttackFromSpeed){const r=actor.moonlightRevelation.baseAttackFromSpeed;actor.moonlightBaseBonuses.attack=Math.min(r.cap,Math.max(0,baseStatValue(actor,'speed'))*r.ratio);}
  actor.moonlightRevelationActive=isAlive(actor)&&revelationActive(battle,actor)&&(!actor.moonlightRevelation.requiresMode||actor.activeMode===actor.moonlightRevelation.requiresMode);
  if(isAlive(actor)&&revelationActive(battle,actor))for(const[key,n]of Object.entries(actor.moonlightRevelation.modifiers??{}))actor.moonlightModifiers[key]=n;
  for(const source of battle.actors){
   const mode=source.combatModes?.[source.activeMode];
   if(source.team!==actor.team||!isAlive(source)||!mode?.teamAuraElements?.includes(actor.element))continue;
   const factor=activeMoonlight(battle,source.team,mode.enhancedByMoonlight)?2:1;
   for(const[key,n]of Object.entries(source.modeAppliedModifiers??mode.statModifiers??{}))actor.moonlightModifiers[key]=(actor.moonlightModifiers[key]??0)+n*factor;
  }
 }
}
// Inject into the same cast after its real resource payment, before damage resolves.
export function revelationEffects(battle,actor,skill,spent){
 if(!revelationActive(battle,actor)||actor.moonlightRevelation.requiresMode&&actor.activeMode!==actor.moonlightRevelation.requiresMode)return skill.effects;
 const rule=actor.moonlightRevelation;if(rule.followUpOnly)return skill.effects;
 if(rule.allDamagingSkills?(skill.id.startsWith('$')||!skill.effects.some(e=>e.type==='damage')):skill.id!==rule.abilityId)return skill.effects;
 const effects=skill.effects.map(effect=>effect.type==='damage'&&(!rule.moonAtResource||spent>=rule.moonAtResource)?{...effect,additionalElements:[...new Set([...(effect.additionalElements??[]),'moon'])]}:effect);
 if(rule.bonusOnlyAbility&&skill.id!==rule.abilityId)return effects;
 if(!rule.commandMultiplier&&!rule.bonusMultiplier)return effects;
 if(rule.commandMultiplier)return [...effects,{type:'command_moonlight',blessingId:rule.blessingId,multiplier:rule.commandMultiplier,...(rule.commandTargetMode?{targetMode:rule.commandTargetMode,hits:1}:{})}];
 const count=rule.perSpentResource?spent:1,base=skill.effects.find(e=>e.type==='damage');
 return [...effects,{type:'damage',damageType:base.damageType,element:actor.element,additionalElements:['moon'],scalingStat:rule.bonusScalingStat??'attack',multiplier:rule.bonusMultiplier,hits:count,rankDamageFactor:1,...(base.unavoidable?{unavoidable:true}:{})}];
}
export function moonlightRoundStart(battle,io){
 for(const actor of battle.actors){const mode=actor.combatModes?.[actor.activeMode];
  if(!isAlive(actor)||!mode?.roundStartAbility||actor.moonlightModePulseRound===battle.round)continue;
  actor.moonlightModePulseRound=battle.round;
  io.pulse(battle,actor,mode.roundStartAbility,mode.name,'start');
  if(io.outcome(battle))return;
 }
}
export function moonlightRoundEnd(battle,io){
 for(const actor of battle.actors){const p=actor.passive;
  if(!isAlive(actor)||p?.type!=='moonlight_team_mp'||!activeMoonlight(battle,actor.team,p.blessingId)||actor.moonlightMpRound===battle.round)continue;
  actor.moonlightMpRound=battle.round;io.announce(battle,actor);
  for(const ally of battle.actors.filter(a=>a.team===actor.team&&isAlive(a)&&p.elements.includes(a.element)))io.restore(battle,ally,'mp',Math.ceil(io.maxMp(battle.content,ally)*p.ratio),actor.id);
 }
}
export function moonlightPulseRank(content,actor,skill){
 if(!skill.rankFromAbility)return skill;
 const source=content.abilities[skill.rankFromAbility];
 const factor=coefficientFactor(getActorSkillRank(actor,source),actor.skillProgression??skillRules(content));
 return {...skill,effects:skill.effects.map(e=>e.type==='damage'||e.type==='command_moonlight'&&e.rankScaling?{...e,rankDamageFactor:factor}:['heal','shield'].includes(e.type)?{...e,...Object.fromEntries(['multiplier','primaryMultiplier','flat'].filter(k=>e[k]!==undefined).map(k=>[k,e[k]*factor]))}:e)};
}

// Runs after signature-gear and ordinary Rank coefficients have resolved. Never mutate authored effects.
export function revelationDamageEffect(battle,actor,effect,context){
 const rule=actor?.moonlightRevelation;if(!rule||!revelationActive(battle,actor)||context?.skillId!==rule.abilityId)return effect;
 let result=effect;if(rule.counterRank){const rank=battle.pvpRules?Math.min(5,rule.counterRank):rule.counterRank,base=battle.content.abilities[rule.abilityId].effects.find(e=>e.type==='damage');result={...result,multiplier:Math.max(result.multiplier,base.multiplier*coefficientFactor(rank,actor.skillProgression??skillRules(battle.content)))};}
 if(rule.onHitStatus)result={...result,onHitStatus:rule.onHitStatus};return result;
}
