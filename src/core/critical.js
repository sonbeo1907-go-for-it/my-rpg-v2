import {baseStatValue} from './combat-math.js';
import {damageFlags} from './damage-kind.js';

export const CRITICAL_MULTIPLIER=1.5;
export function criticalChance(actor) {
 let chance=0;
 for(const recipe of actor?.gearEffects??[]){const e=recipe.effect;if(!['critical_chance','normal_damage_chance'].includes(e.type))continue; // Legacy encounter snapshots keep the old recipe type.
  chance=Math.max(chance,Math.min(1,Math.max(0,baseStatValue(actor,e.stat)/e.atStat)));
 }
 return chance;
}

// One roll per source/action shared by normal hits. Reactions own a fresh context.
// Critical is an independent final multiplier, before PvP caps and shield/HP routing.
export function resolveCritical(battle,actor,effect,context) {
 if(!actor||!damageFlags(effect).normalDamage)return {critical:false,multiplier:1};
 const checks=context.criticalChecks??=new Map();
 if(!checks.has(actor.id)){
  const chance=criticalChance(actor),roll=chance>0&&chance<1?battle.random():null;
  if(roll!==null&&(!Number.isFinite(roll)||roll<0||roll>=1))throw Error('Nguồn ngẫu nhiên Bạo Kích không hợp lệ.');
  checks.set(actor.id,chance===1||(chance>0&&roll<chance));
 }
 const critical=checks.get(actor.id);
 return {critical,multiplier:critical?CRITICAL_MULTIPLIER:1};
}

export function criticalMultiplier(battle,actor,effect,context) {return resolveCritical(battle,actor,effect,context).multiplier;}
