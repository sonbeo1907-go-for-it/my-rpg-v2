import {isAlive} from './actor-life.js';

// Derived team aura; shield presence is checked again before every hit/stat query.
export function syncShieldGuardAuras(battle){
 const teams={};
 for(const source of battle.actors){const p=source.passive;if(!isAlive(source)||p?.type!=='shielded_ally_guard')continue;
  const team=teams[source.team]??={base:{},magicReduction:0};
  for(const [key,n]of Object.entries(p.baseStatBonuses))team.base[key]=Math.max(team.base[key]??0,n);
  team.magicReduction=Math.max(team.magicReduction,p.magicReduction);
 }
 for(const target of battle.actors){
  if(!teams[target.team]){delete target.shieldGuardBaseBonuses;delete target.shieldGuardMagicReduction;continue;}
  const p=isAlive(target)&&target.shield>0?teams[target.team]:null;
  target.shieldGuardBaseBonuses={...(p?.base??{})};target.shieldGuardMagicReduction=p?.magicReduction??0;
 }
}
export function takeDebuffs(content,target,count){
 const removed=target.statuses.filter(s=>(count===undefined||s.remaining!==0)&&content.statuses[s.id].kind==='debuff').slice(0,count??Infinity);
 target.statuses=target.statuses.filter(s=>!removed.includes(s));return removed;
}
export function validateShieldGuards(content,fail){
 for(const actor of [...Object.values(content.characters),...Object.values(content.enemies)]){const p=actor.passive;
  if(p?.type==='shielded_ally_guard'&&(!p.name||!p.description||!Number.isFinite(p.magicReduction)||p.magicReduction<=0||p.magicReduction>.75||!p.baseStatBonuses||Array.isArray(p.baseStatBonuses)||Object.keys(p.baseStatBonuses).length!==1||!Number.isFinite(p.baseStatBonuses.resistance)||p.baseStatBonuses.resistance<=0||p.baseStatBonuses.resistance>100))fail(actor.id+': invalid shielded ally guard');
 }
 for(const skill of Object.values(content.abilities))for(const effect of skill.effects??[]){
  if(effect.snapshotScaling!==undefined&&(!['shield','heal'].includes(effect.type)||effect.snapshotScaling!==true))fail(skill.id+': invalid support scaling snapshot');
  if(effect.type==='cleanse'&&effect.count!==undefined&&(!Number.isSafeInteger(effect.count)||effect.count<1||effect.count>20))fail(skill.id+': invalid counted cleanse');
 }
}
