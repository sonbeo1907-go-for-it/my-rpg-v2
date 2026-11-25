import {baseStatValue} from './combat-math.js';
import {isOnlyNormalDamage} from './damage-kind.js';

// One independent check per group/action, not per hit or AoE target.
// This stage precedes defense and amplification; it is not a charged damage buff.
export function normalGearBaseMultiplier(battle,actor,effect,context) {
 if(!actor||!isOnlyNormalDamage(effect))return 1;
 let bonus=0;const seen=new Set();
 for(const recipe of actor.gearEffects??[]){
  const e=recipe.effect;
  if(e.type!=='normal_damage_chance'||seen.has(recipe.effectGroup))continue;
  seen.add(recipe.effectGroup);
  const key=actor.id+':'+recipe.effectGroup;
  const checks=context.normalGearChecks??=new Map();
  if(!checks.has(key)){
   const chance=Math.max(0,Math.min(1,baseStatValue(actor,e.stat)/e.atStat));
   const roll=chance>0&&chance<1?battle.random():null;
   if(roll!==null&&(!Number.isFinite(roll)||roll<0||roll>=1))throw Error('Nguồn ngẫu nhiên hiệu ứng gear không hợp lệ.');
   checks.set(key,chance===1||(chance>0&&roll<chance));
  }
  if(checks.get(key))bonus+=e.ratio;
 }
 return 1+bonus;
}
