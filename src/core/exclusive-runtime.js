import {specialPassives,hasLiveStatus} from './exclusive-specials.js';
import {procAvailable,markProc} from './exclusive-hooks.js';
const alive=a=>a?.hp>0;
function announce(b,a,p,io,targetId=a.id){io.emit(b,{type:'passive',sourceId:a.id,targetId,label:p.name,exclusive:true});io.write(b,a.name+' kích hoạt '+p.name+'.');}
export function exclusiveResourceChanged(b,a,id,delta,io){if(!delta||!alive(a))return;for(const p of specialPassives(a,'resource_stat_status'))if(p.resourceId===id){announce(b,a,p,io);io.status(b,a,p.statusId,p.duration,a.id);}}
export function exclusiveAttackResourceChance(a,statusId,trigger,readStat){const p=specialPassives(a,'brace_chance').find(p=>p.statusId===statusId&&p.resourceId===trigger.resource);return p?Math.min(1,trigger.chance+p.bonusChance*Math.max(0,readStat(p.stat))/p.atStat):trigger.chance;}
export function exclusiveHealBonus(b,a,target,skill,io){
 let bonus=0;for(const p of specialPassives(a)){
  if(p.type==='heal_threshold'&&target.team===a.team&&target.hp/target.stats.maxHp<p.threshold)bonus+=io.stat(b,a,p.stat)*p.ratio;
  if(p.type==='heal_buff_count'&&p.abilityIds.includes(skill?.id))bonus+=io.stat(b,a,p.stat)*p.ratio*b.actors.filter(t=>alive(t)&&t.team===a.team&&hasLiveStatus(t,p.statusId)).length;
 }return Math.round(bonus);
}
export function exclusiveAfterSkill(b,a,skill,context,io){
 if(!alive(a))return;const team=b.actors.filter(t=>alive(t)&&t.team===a.team);
 for(const p of specialPassives(a)){
  if(p.type==='defend_recovery'&&skill.id==='$defend'){announce(b,a,p,io);io.restore(b,a,p.resourceId,p.amount);io.heal(b,a,a.stats.maxHp*p.hpRatio,a.id,p.name);}
  if(p.abilityIds&&!p.abilityIds.includes(skill.id))continue;
  if(p.type==='after_skill_shield'){const t=p.target==='self'?a:[...team].sort((x,y)=>x.hp/x.stats.maxHp-y.hp/y.stats.maxHp)[0];if(t){announce(b,a,p,io,t.id);io.shield(b,t,Math.round(io.stat(b,a,p.stat)*p.ratio),a.id);}}
  if(p.type==='after_skill_mp'&&(!p.requiresStatus||context.startStatusIds?.has(p.requiresStatus))){const amount=p.amount*(p.perAlly?team.filter(t=>t.tags?.includes(p.tag)).length:1);if(amount){announce(b,a,p,io);io.restore(b,a,'mp',amount);}}
 }
}
export function exclusiveShieldBreak(b,a,io){for(const p of specialPassives(a,'shield_break_mp'))if(alive(a)&&procAvailable(b,a,'exclusive_shield_mp')){markProc(b,a,'exclusive_shield_mp');announce(b,a,p,io);io.restore(b,a,'mp',p.amount);}}
export function exclusiveAutomaticHit(b,a,skillId,landed,io){if(!landed||!alive(a))return;for(const p of specialPassives(a,'automatic_damage_mp'))if(p.abilityIds.includes(skillId)&&procAvailable(b,a,'exclusive_auto_mp')){markProc(b,a,'exclusive_auto_mp');announce(b,a,p,io);io.restore(b,a,'mp',p.amount);}}
export function exclusiveWardBlocked(b,owner,target,io){if(!owner||owner.team!==target.team)return;for(const p of specialPassives(owner,'ward_shield')){announce(b,owner,p,io,target.id);io.shield(b,target,Math.round(io.stat(b,owner,p.stat)*p.ratio),owner.id);}}
