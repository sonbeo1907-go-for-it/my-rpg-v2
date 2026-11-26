import {baseStatValue} from './combat-math.js';
import {damageFlags} from './damage-kind.js';

export const CRITICAL_MULTIPLIER=1.5;
export const WEAKNESS_CRITICAL_CHANCE=.15;
export function criticalChance(actor,weakness=false) {
 let gearChance=0;
 for(const recipe of actor?.gearEffects??[]){const e=recipe.effect;if(!['critical_chance','normal_damage_chance'].includes(e.type))continue; // Legacy encounter snapshots.
  gearChance=Math.max(gearChance,Math.min(1,Math.max(0,baseStatValue(actor,e.stat)/e.atStat)));
 }
 return Math.min(1,gearChance+(weakness?WEAKNESS_CRITICAL_CHANCE:0));
}

// Share the roll, not the result: weakness can differ across targets/hits.
// Reactions own a fresh action context. Moon damage never rolls or benefits.
export function resolveCritical(battle,actor,effect,context,weakness=false) {
 if(!actor||!damageFlags(effect).normalDamage)return {critical:false,multiplier:1};
 const chance=criticalChance(actor,weakness);
 if(chance===0)return {critical:false,multiplier:1};
 if(chance===1)return {critical:true,multiplier:CRITICAL_MULTIPLIER};
 const rolls=context.criticalRolls??=new Map();
 if(!rolls.has(actor.id)){
  const roll=battle.random();
  if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Nguồn ngẫu nhiên Bạo Kích không hợp lệ.');
  rolls.set(actor.id,roll);
 }
 const critical=rolls.get(actor.id)<chance;
 return {critical,multiplier:critical?CRITICAL_MULTIPLIER:1};
}

export function criticalMultiplier(battle,actor,effect,context,weakness=false) {return resolveCritical(battle,actor,effect,context,weakness).multiplier;}
