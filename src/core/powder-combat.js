import {mpCost} from './conditional-combat.js';
import {teamResourceDefinition,teamResourceState,changeTeamResource} from './team-resources.js';

export function projectedPowderSpend(content,battle,actor,paidMp){
 const spent={};for(const[id,state]of Object.entries(battle.teamResources?.[actor.team]??{})){const rule=teamResourceDefinition(content,id);if(rule?.mpPerCharge)spent[id]=Math.min(state.value,Math.floor(paidMp/rule.mpPerCharge));}return spent;
}
export function payMpTeamResources(battle,actor,paidMp,io){
 const spent=projectedPowderSpend(battle.content,battle,actor,paidMp);
 for(const[id,n]of Object.entries(spent))if(n>0)changeTeamResource(battle,actor,id,-n,io);
 return spent;
}
export function sharedPenetration(content,spent){return Object.entries(spent??{}).reduce((sum,[id,n])=>sum+n*(teamResourceDefinition(content,id)?.penetrationPerCharge??0),0);}
export function spentSharedDamage(actor,spent){const p=actor.passive;return p?.type==='spent_shared_damage'?Math.min(p.cap,(spent?.[p.resource]??0)*p.perCharge):0;}
export function nativePenetration(actor,type){const p=actor.passive;return p?.type==='damage_penetration'&&p.damageType===type?p.ratio:0;}
export function lightningChargeEligible(skill,context){return Boolean(skill&&!skill.id.startsWith('$')&&(skill.activation!=='passive'||context.reactionKind==='follow_up'));}
export function validatePowderContent(content){
 const errors=[],actors=[...Object.values(content.characters),...Object.values(content.enemies)];
 for(const a of actors){const p=a.passive;
  if(p?.type==='damage_penetration'&&(!p.name||!p.description||!['physical','magical'].includes(p.damageType)||!Number.isFinite(p.ratio)||p.ratio<=0||p.ratio>1))errors.push(a.id+': invalid native penetration');
  if(p?.type==='element_received_charge'&&(!p.name||!p.description||!a.resources?.[p.resource]||!['plain','fire','water','earth','wind','thunder','light','dark','moon'].includes(p.element)||p.amount!==1))errors.push(a.id+': invalid received element charge');
  if(p?.type==='spent_shared_damage'&&(!p.name||!p.description||!teamResourceDefinition(content,p.resource)||!Number.isFinite(p.perCharge)||p.perCharge<=0||!Number.isFinite(p.cap)||p.cap<=0||p.cap>2))errors.push(a.id+': invalid shared spending bonus');
  if(p?.type==='powder_ally_followup'){const f=content.abilities[p.followUpAbility];if(!p.name||!p.description||!teamResourceDefinition(content,p.resource)||f?.activation!=='passive'||f?.target!=='enemy_splash'||f?.cost||f?.cooldown||f?.effects.some(e=>e.type!=='damage')||!Number.isInteger(p.perRound)||p.perRound<1||p.perRound>5||!Number.isFinite(p.penetrationPerCharge)||p.penetrationPerCharge<=0||p.penetrationPerCharge>1||p.generatedAfterPowered!==1)errors.push(a.id+': invalid powder follow-up');}
 }
 return errors;
}

export function previewPaidMp(skill,actor){const primary=mpCost(skill,actor);if(actor.passive?.type!=='extra_mp_damage'||!skill.effects.some(e=>e.type==='damage')||!skill.cost?.mp)return primary;const cap=Math.ceil(skill.cost.mp*actor.passive.extraCostRatio);return primary+Math.min(cap,actor.mp===undefined?cap:Math.max(0,actor.mp-primary));}
