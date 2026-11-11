import {isAlive} from './actor-life.js';
import {specialPassives} from './exclusive-specials.js';

const activeAttack = context => context.skill && !context.skill.id.startsWith('$') && context.skill.activation !== 'passive' && !context.reaction && !context.automatic && context.skill.effects.some(e=>e.type==='damage');

// Capture the whole cast before damage: each defender keeps its own element for every hit.
export function prepareExposureAttunement(actor,targets,context){
 const p=actor.passive;if(p?.type!=='exposure_attunement'||!activeAttack(context))return;
 context.attunedElements=new Map(targets.filter(t=>t.team!==actor.team&&context.exposures.has(t.id)).map(t=>[t.id,context.exposures.get(t.id).element]));
}
export function attunedDamageEffect(target,effect,context){
 const element=context.attunedElements?.get(target.id);if(!element)return effect;
 const {additionalElements,...rest}=effect;return {...rest,element};
}
export function recordCreatedExposure(content,context,applied){
 if(applied&&content.statuses[applied.id]?.exposedElement)context.createdExposure=true;
}
export function finishExposureSkill(battle,actor,context,io){
 if(!isAlive(actor)||!context.skill||context.skill.id.startsWith('$')||context.skill.activation==='passive'||context.reaction||context.automatic)return;
 const p=actor.passive;
 if(p?.type==='exposure_attunement'&&context.attunedElements?.size){io.announce(battle,actor);io.restore(battle,actor,p.resource,p.amount,actor.id);}
 if(!context.createdExposure)return;
 for(const owner of battle.actors.filter(a=>a.team===actor.team&&a.id!==actor.id&&isAlive(a)))for(const exclusive of specialPassives(owner,'ally_exposure_self_buff')){
  io.announce(battle,owner,owner.id,exclusive.name);io.status(battle,owner,exclusive.statusId,undefined,owner.id);
 }
}

// Full recovery is conditional, not a resurrection. Only active ability cooldowns are eligible.
export function restoreTeamAtResource(battle,actor,effect,context,io){
 if(!isAlive(actor)||(context.initialResources?.[effect.resource]??0)<effect.minimum||(actor.resourceValues[effect.resource]??0)<effect.minimum)return;
 io.restore(battle,actor,effect.resource,-actor.resourceValues[effect.resource],actor.id);
 for(const ally of battle.actors.filter(a=>a.team===actor.team&&isAlive(a))){
  ally.statuses=ally.statuses.filter(s=>battle.content.statuses[s.id]?.kind!=='debuff');
  io.clamp(battle.content,ally);
  io.heal(battle,ally,ally.stats.maxHp,actor.id);
  io.restore(battle,ally,'mp',io.maxMp(battle.content,ally),actor.id);
  for(const id of ally.abilities??[]){const skill=battle.content.abilities[id];if(skill&&skill.activation!=='passive'&&!id.startsWith('$')&&skill.cooldown>0)ally.cooldowns[id]=0;}
  io.emit(battle,{type:'cleanse',sourceId:actor.id,targetId:ally.id});
  io.emit(battle,{type:'cooldowns_reduced',sourceId:actor.id,targetId:ally.id,amount:99});
 }
 io.write(battle,'Khúc Ca Ngoài Sử Sách: toàn đội còn sống hồi đầy HP, MP, giải hiệu ứng bất lợi và làm mới hồi chiêu kỹ năng.');
}
