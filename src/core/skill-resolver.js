import {applySpecialSkillModifiers} from './exclusive-specials.js';
import {skillRules,skillLineId,getActorSkillRank,coefficientFactor,statBuffFactor,outputMpFactor,GROWING_STATS,skillGrowthGroups} from './skill-rules.js';

export function rankedModifiers(modifiers,factor){return Object.fromEntries(Object.entries(modifiers??{}).map(([key,n])=>[key,GROWING_STATS.includes(key)&&n>0?n*factor:n]));}
export function resolveRankedAbility(content,actor,ability,rankOverride){
 let source=typeof ability==='string'?content.abilities[ability]:ability;
 if(!source)return source;
 if(source.rankResolved&&rankOverride===undefined&&source.rankOwnerId===actor?.id&&source.rankTeam===actor?.team)return source;
 source=source.rankSource??source;
 const profile=source.id==='$attack'?'basic':source.growthProfile??'fixed';
 const rank=actor?.team==='enemy'||profile==='fixed'||source.activation==='passive'?1:rankOverride??getActorSkillRank(actor,source);
 if(!Number.isInteger(rank)||rank<1||rank>5)throw Error('Cấp kỹ năng không hợp lệ.');
 const groups=profile==='fixed'?[]:skillGrowthGroups(content,source);
 const rules=actor?.skillProgression??skillRules(content),f10=coefficientFactor(rank,rules),f05=statBuffFactor(rank,rules);
 const resolved={...source,rankSource:source,rankOwnerId:actor?.id,rankTeam:actor?.team,skillRank:rank,skillLineId:skillLineId(source),growthProfile:profile,growthGroups:groups,rankResolved:true,rankMpMultiplier:groups.includes('output_buff_mp')?outputMpFactor(rank,rules):1};
 resolved.effects=source.effects.map(effect=>{
  let next={...effect};
  if((groups.includes('basic')||groups.includes('damage'))&&effect.type==='damage')next.rankDamageFactor=f10;
  if(groups.includes(effect.type)&&['heal','shield'].includes(effect.type))for(const key of ['multiplier','flat'])if(next[key]!==undefined)next[key]*=f10;
  if(groups.includes('stat_buff')&&['status','toggle_status'].includes(effect.type)){
   const status=content.statuses[effect.status];
   if(status?.kind==='buff')next.appliedModifiers=rankedModifiers(status.modifiers,f05);
   next.linkedAppliedModifiers=Object.fromEntries((effect.linkedStatuses??[]).filter(id=>content.statuses[id]?.kind==='buff').map(id=>[id,rankedModifiers(content.statuses[id].modifiers,f05)]));
  }
  if(groups.includes('stat_buff')&&source.growthAdapter==='mode_stat_buff'&&effect.type==='enter_mode')next.modeAppliedModifiers=rankedModifiers(actor.combatModes[effect.mode].statModifiers,f05);
  if(effect.type==='enter_mode'&&effect.followUpBonus!==undefined)next.followUpBonus=effect.followUpBonus*f10;
  return next;
 });
 return applySpecialSkillModifiers(content,actor,resolved,f05);
}

export function modeModifiersForPreview(content,actor,mode){
 if(actor.combatModes?.[actor.activeMode]===mode&&actor.modeAppliedModifiers)return actor.modeAppliedModifiers;
 const cast=(actor.abilities??[]).map(id=>content.abilities[id]).find(skill=>skill?.effects.some(effect=>effect.type==='enter_mode'&&actor.combatModes?.[effect.mode]===mode));
 return cast?resolveRankedAbility(content,actor,cast).effects.find(effect=>effect.type==='enter_mode')?.modeAppliedModifiers??mode.statModifiers??{}:mode.statModifiers??{};
}
