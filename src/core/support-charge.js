import {isAlive} from './actor-life.js';
import {resolveRankedAbility} from './skill-resolver.js';
import {coefficientFactor,skillRules} from './skill-rules.js';

export function supportChargeEligible(owner,source,skill){
 const p=owner.passive;
 return p?.type==='support_charge_followup'&&isAlive(owner)&&owner.id!==source.id&&owner.team===source.team&&!p.excludedElements.includes(source.element)
  &&!skill.id.startsWith('$')&&skill.activation!=='passive'&&!skill.effects.some(e=>e.type==='damage');
}
export function supportChargeFollowupEligible(owner,source,context){
 const p=owner.passive;
 return p?.type==='support_charge_followup'&&isAlive(owner)&&owner.id!==source.id&&owner.team===source.team&&!p.excludedElements.includes(source.element)
  &&!context.reaction&&!context.automatic&&(owner.resourceValues[p.resource]??0)>0
  &&context.gearImpacts?.some(hit=>hit.damageType==='magical'&&!(hit.elements??[hit.element]).some(e=>p.excludedElements.includes(e)));
}
export function rankedSupportFollowup(content,owner,rankOverride){
 const p=owner.passive,source=content.abilities[p.followUpAbility],parent=resolveRankedAbility(content,owner,p.rankAbilityId,rankOverride);
 const factor=coefficientFactor(parent.skillRank,owner.skillProgression??skillRules(content));
 return {...source,linkedSkillRank:parent.skillRank,effects:source.effects.map(e=>e.type==='damage'?{...e,rankDamageFactor:factor}:e)};
}
export function validateSupportCharges(content,fail,elements){
 for(const actor of Object.values(content.characters))if(actor.passive?.type==='support_charge_followup'){
  const p=actor.passive,follow=content.abilities[p.followUpAbility],rank=content.abilities[p.rankAbilityId];
  if(!actor.resources?.[p.resource]||!Number.isSafeInteger(p.perRound)||p.perRound<1||p.perRound>5||!Array.isArray(p.excludedElements)||p.excludedElements.some(e=>!elements.includes(e))||!actor.abilities.includes(p.rankAbilityId)||rank?.linkedPassiveGrowth?.abilityId!==p.followUpAbility||follow?.activation!=='passive'||follow?.target!=='all_enemies'||follow?.effects.some(e=>e.type!=='damage'))fail(actor.id+': invalid support charge follow-up');
 }
 for(const skill of Object.values(content.abilities)){
  if(skill.excludedTargetElements!==undefined&&(!['ally','all_allies'].includes(skill.target)||!Array.isArray(skill.excludedTargetElements)||!skill.excludedTargetElements.length||new Set(skill.excludedTargetElements).size!==skill.excludedTargetElements.length||skill.excludedTargetElements.some(e=>!elements.includes(e))||skill.targetElement))fail(skill.id+': invalid excluded ally elements');
  if(skill.linkedPassiveGrowth!==undefined){const linked=content.abilities[skill.linkedPassiveGrowth?.abilityId];if(!linked||linked.activation!=='passive'||!linked.effects.some(e=>e.type==='damage')||skill.activation==='passive'||skill.growthProfile==='fixed')fail(skill.id+': invalid linked passive growth');}
  for(const e of skill.effects??[])if(e.baseStatModifiers!==undefined&&(e.type!=='status'||!['buff','debuff'].includes(content.statuses[e.status]?.kind)||!e.baseStatModifiers||typeof e.baseStatModifiers!=='object'||Array.isArray(e.baseStatModifiers)||!Object.keys(e.baseStatModifiers).length||Object.entries(e.baseStatModifiers).some(([key,n])=>!['attack','magic','defense','resistance','speed'].includes(key)||!Number.isFinite(n)||n===0||Math.abs(n)>100||content.statuses[e.status]?.kind==='buff'&&n<0||content.statuses[e.status]?.kind==='debuff'&&n>0)))fail(skill.id+': invalid flat base stat buff');
 }
 for(const s of Object.values(content.statuses))if(s.consumeDamageType!==undefined&&(!s.damageUses||!['physical','magical'].includes(s.consumeDamageType)||s.kind!=='buff'))fail(s.id+': invalid typed damage consumption');
}
