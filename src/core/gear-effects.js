import {activeStatuses} from './status-state.js';

const alive=a=>a?.hp>0;
function* recipes(actor,type){const seen=new Set();for(const r of actor.gearEffects??[]){if(seen.has(r.effectGroup)||r.effect.type!==type)continue;seen.add(r.effectGroup);yield r;}}
function ready(b,a,r){return alive(a)&&b.round>=(a.gearEffectReadyRounds?.[r.effectGroup]??0)&&(!r.oncePerRound||a.gearEffectProcRounds?.[r.effectGroup]!==b.round)&&(!r.oncePerEncounter||!a.gearEffectEncounterUses?.[r.effectGroup]);}
function activated(b,a,r,io,targetId=a.id){
 if(r.cooldownRounds)(a.gearEffectReadyRounds??={})[r.effectGroup]=b.round+r.cooldownRounds;
 if(r.oncePerRound)(a.gearEffectProcRounds??={})[r.effectGroup]=b.round;
 if(r.oncePerEncounter)(a.gearEffectEncounterUses??={})[r.effectGroup]=true;
 io.emit(b,{type:'passive',sourceId:a.id,targetId,label:r.name,gearEffectId:r.id});io.write(b,a.name+' kích hoạt '+r.name+'.');
}
const activeSkill=ctx=>Boolean(ctx?.skill&&ctx.skillId&&!ctx.skillId.startsWith('$')&&!ctx.reaction&&!ctx.automatic&&ctx.skill?.activation!=='passive');
const singleSkill=ctx=>activeSkill(ctx)&&ctx.skill?.target==='enemy';
const regain=(b,a,amount,io)=>{const before=a.mp;io.restore(b,a,'mp',amount,a.id);return a.mp>before;};

export function initializeGearEncounter(b,preserve=false){for(const a of b.actors){if(!preserve||a.gearEncounterId!==b.encounterId){a.gearEncounterId=b.encounterId;a.gearEffectEncounterUses={};}}}

export function activateRoundGear(b,io){
 for(const a of b.actors){if(!alive(a))continue;const seen=new Set();for(const r of a.gearEffects??[]){
  if(r.hook&&r.hook!=='round_start'||seen.has(r.effectGroup)||!ready(b,a,r))continue;seen.add(r.effectGroup);
  const statuses=activeStatuses(a).filter(s=>(s.remaining==null||s.remaining>0)&&(s.stacks??1)>0);
  if(r.condition==='no_ward'&&statuses.some(s=>{const ward=b.content.statuses[s.id]?.effectImmunity;return ward&&(s.charges??ward.charges)>0;}))continue;
  if(r.condition==='missing_hp'&&a.hp>=a.stats.maxHp||r.condition==='missing_mp'&&a.mp>=a.stats.maxMp)continue;
  if(r.condition==='missing_status'&&statuses.some(s=>s.id===r.effect.status))continue;
  const e=r.effect;
  if(e.type==='status')io.status(b,a,e.status,e.duration,a.id);
  else if(e.type==='heal')io.heal(b,a,Math.ceil(a.stats.maxHp*e.ratio),a.id);
  else if(e.type==='mp')io.restore(b,a,'mp',Math.ceil(a.stats.maxMp*e.ratio),a.id);
  else continue;
  activated(b,a,r,io);
 }}
}

export function gearMainTurn(b,a,io){if(b.phase!=='main')return;for(const r of recipes(a,'low_mp'))if(ready(b,a,r)&&a.mp/a.stats.maxMp<=r.effect.threshold){if(regain(b,a,Math.max(r.effect.minimum,Math.ceil(a.stats.maxMp*r.effect.ratio)),io))activated(b,a,r,io);}}
export function gearGuardReduction(a){return activeStatuses(a).some(s=>s.id==='guard'&&(s.remaining==null||s.remaining>0))?[...recipes(a,'guard_reduction')].reduce((n,r)=>n+r.effect.ratio,0):0;}
export function gearIncomingMultiplier(b,target,effect,io){let ratio=1;for(const r of recipes(target,'direct_reduction'))if(r.effect.damageType===effect.damageType&&ready(b,target,r)){ratio*=1-r.effect.ratio;activated(b,target,r,io);}return ratio;}

export function gearOutgoingMultiplier(b,a,target,ctx){
 if(!singleSkill(ctx))return 1;
 const hp=ctx.gearTargetHpRatios?.get(target.id)??target.hp/target.stats.maxHp;
 let result=1;
 for(const r of recipes(a,'healthy_target_bonus'))if(hp>=r.effect.threshold)result*=1+r.effect.ratio;
 for(const r of recipes(a,'execute_bonus'))if(hp<r.effect.threshold)result*=1+r.effect.ratio;
 return result;
}
export function gearShieldExtra(a,baseAbsorbed){return Math.floor(baseAbsorbed*[...recipes(a,'shield_only_bonus')].reduce((n,r)=>n+r.effect.ratio,0));}

export function gearHpLoss(b,a,hpAfterLoss,io){
 if(!alive(a)||hpAfterLoss<=0)return;
 for(const r of recipes(a,'critical_heal'))if(ready(b,a,r)&&hpAfterLoss/a.stats.maxHp<r.effect.threshold&&a.hp<a.stats.maxHp){activated(b,a,r,io);io.heal(b,a,Math.round(a.stats.maxHp*r.effect.ratio),a.id);}
}
export function gearAfterDirectHit(b,target,impact,io){
 if(impact.lostHp>0)gearHpLoss(b,target,impact.hpAfter,io);
 for(const r of recipes(target,'impact_shield'))if(ready(b,target,r)&&impact.lostHp+impact.absorbed>=target.stats.maxHp*r.effect.threshold){const amount=Math.round(target.stats.maxHp*r.effect.ratio);if(amount>target.shield){activated(b,target,r,io);io.shield(b,target,amount);}}
}
export function gearObserveWeakness(b,attacker,io){for(const a of b.actors){if(a.team!==attacker.team)continue;for(const r of recipes(a,'ally_weakness_shield'))if(ready(b,a,r)){const amount=Math.round(a.stats.maxHp*r.effect.ratio);if(amount>a.shield){activated(b,a,r,io);io.shield(b,a,amount);}}}}

export function gearBuffApplied(b,source,target,definition,io){
 if(definition.kind!=='buff'||!source||source.id===target.id||source.team!==target.team)return;
 for(const r of recipes(source,'ally_buff_mp'))if(ready(b,source,r)&&source.mp<source.stats.maxMp){activated(b,source,r,io);regain(b,source,r.effect.amount,io);}
}

// Choose once before the heal resolves: AoE order cannot change the lowest-HP recipient.
export function prepareGearHealing(b,actor,targets,skill,ctx){
 if(!activeSkill(ctx)||!skill.effects.some(e=>e.type==='heal'))return;
 const candidates=targets.filter(t=>alive(t)&&t.team===actor.team).sort((a,b)=>a.hp/a.stats.maxHp-b.hp/b.stats.maxHp);
 ctx.gearHealRatios=new Map(candidates.map(t=>[t.id,t.hp/t.stats.maxHp]));
 ctx.gearHealTargets=new Map([...recipes(actor,'emergency_heal')].map(r=>[r.effectGroup,candidates.find(t=>t.hp/t.stats.maxHp<r.effect.threshold)?.id]));
}
export function gearSkillHealed(b,source,target,amount,ctx,io){
 if(!activeSkill(ctx)||!amount||!alive(target))return;
 for(const r of recipes(source,'emergency_heal'))if(ready(b,source,r)&&ctx.gearHealTargets?.get(r.effectGroup)===target.id){activated(b,source,r,io,target.id);io.heal(b,target,Math.round(target.stats.maxHp*r.effect.ratio),source.id);}
 if(source.id===target.id||source.team!==target.team)return;
 for(const r of recipes(target,'healed_mp'))if(ready(b,target,r)&&target.mp<target.stats.maxMp){activated(b,target,r,io);regain(b,target,r.effect.amount,io);}
}
export function gearAfterAction(b,actor,skill,io){if(skill.id!=='$defend')return;for(const r of recipes(actor,'defend_mp'))if(ready(b,actor,r)&&actor.mp<actor.stats.maxMp){activated(b,actor,r,io);regain(b,actor,r.effect.amount,io);}}

export function gearAfterAttack(b,actor,ctx,io){
 if(!activeSkill(ctx)||!alive(actor))return;
 const hits=ctx.gearImpacts??[];
 for(const r of actor.gearEffects??[]){if(!ready(b,actor,r))continue;const e=r.effect;
  if(e.type==='weakness_mp'&&hits.some(h=>h.weakness)&&actor.mp<actor.stats.maxMp){activated(b,actor,r,io);regain(b,actor,e.amount,io);}
  if(e.type==='damage_status'){
   const valid=hits.filter(h=>h.lostHp>0&&h.damageType===e.damageType&&alive(h.target));const hit=valid.find(h=>h.target.id===ctx.primaryTargetId)??valid[0];
   if(hit){activated(b,actor,r,io,hit.target.id);io.status(b,hit.target,e.status,e.duration,actor.id);}
  }
  if(e.type==='exposure_on_hit'&&singleSkill(ctx)){
   const hit=hits.find(h=>!h.elementWeakness&&alive(h.target));if(!hit)continue;
   const n=b.random();if(!Number.isFinite(n)||n<0||n>=1)throw Error('Nguồn ngẫu nhiên hiệu ứng gear không hợp lệ.');
   if(n<e.chance){const applied=io.status(b,hit.target,'exposure_'+hit.element,undefined,actor.id);if(applied)activated(b,actor,r,io,hit.target.id);}
  }
 }
}
