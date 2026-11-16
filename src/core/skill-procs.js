import {isAlive} from './actor-life.js';
import {damageElements} from './elements.js';

// Called only after a direct hit really removed HP/shield. The cast context owns
// deduplication; a multi-hit/AoE is one opportunity, a follow-up has a new context.
export function canGainMagicSkillCharge(owner,source,effect,context){
 const p=owner.passive,skill=context.skill;
 return p?.type==='skill_magic_charge'&&isAlive(owner)&&owner.id!==source.id&&owner.team===source.team
  &&effect.damageType==='magical'&&skill&&!skill.id.startsWith('$')&&!context.automatic
  &&(!context.reaction||context.reactionKind==='follow_up')
  &&!damageElements(effect).some(element=>p.excludedElements.includes(element));
}

export function validateSkillProcs(content,fail,elements){
 for(const actor of [...Object.values(content.characters),...Object.values(content.enemies)]){
  const p=actor.passive;
  if(p?.type==='skill_magic_charge'&&(!actor.resources?.[p.resource]||!Number.isInteger(p.amount)||p.amount<1||!Number.isInteger(p.skillAmount)||p.skillAmount<1||!Array.isArray(p.excludedElements)||p.excludedElements.some(e=>!elements.includes(e))||new Set(p.excludedElements).size!==p.excludedElements.length))fail(actor.id+': invalid magic skill resource passive');
  if(p?.followUpGuarantee!==undefined&&(p.type!=='stat_boost'||typeof p.followUpGuarantee!=='boolean'))fail(actor.id+': invalid follow-up guarantee');
  const owned=new Set(actor.abilities??[]);
  for(const id of owned){const rule=content.abilities[id]?.chanceFollowUp;if(rule&&!owned.has(rule.abilityId))fail(actor.id+': follow-up must be an owned skill');}
 }
 for(const skill of Object.values(content.abilities)){
  for(const effect of skill.effects??[])if(effect.primaryPerResource!==undefined&&(!Number.isFinite(effect.primaryPerResource)||effect.primaryPerResource<0||effect.type!=='damage'||effect.primaryMultiplier===undefined||effect.perResource===undefined||!skill.cost?.resource))fail(skill.id+': invalid primary resource scaling');
  const rule=skill.chanceFollowUp;if(!rule)continue;
  const next=content.abilities[rule.abilityId];
  if(!Number.isFinite(rule.chance)||rule.chance<=0||rule.chance>1||!next||Object.keys(rule).some(k=>!['chance','abilityId'].includes(k)))fail(skill.id+': invalid chance follow-up');
  if(!['enemy','all_enemies','enemy_splash'].includes(skill.target)||!skill.effects?.some(e=>e.type==='damage')||!next?.effects?.every(e=>e.type==='damage')||!['enemy','all_enemies','enemy_splash'].includes(next?.target)||next?.cost?.resource||next?.cost?.teamResource||next?.cost?.preferResource||next?.cost?.preferTeamResource||next?.resourceFollowUp||next?.survivingTargetRepeat)fail(skill.id+': incompatible chance follow-up');
  let cursor=skill;const seen=new Set();
  while(cursor?.chanceFollowUp){if(seen.has(cursor.id)||seen.size>=8){fail(skill.id+': cyclic or overlong chance follow-up');break;}seen.add(cursor.id);cursor=content.abilities[cursor.chanceFollowUp.abilityId];}
 }
}
