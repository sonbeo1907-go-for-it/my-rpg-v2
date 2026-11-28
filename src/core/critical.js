import {baseStatValue} from './combat-math.js';
import {specialPassives} from './exclusive-specials.js';
import {activeStatuses} from './status-state.js';
import {damageFlags} from './damage-kind.js';

export const CRITICAL_MULTIPLIER=1.5;
export const WEAKNESS_CRITICAL_CHANCE=.15;
export const MAX_CRITICAL_MULTIPLIER=2;
// Add percentage-point bonuses before applying one global cap to total Crit damage.
export function stackCriticalDamageBonuses(bonuses=[]){
 return Math.min(MAX_CRITICAL_MULTIPLIER,CRITICAL_MULTIPLIER+bonuses.reduce((sum,n)=>sum+(Number.isFinite(n)&&n>0?n:0),0));
}
export function criticalDamageMultiplier(actor,content){
 const bonuses=specialPassives(actor,'critical_damage_bonus').map(p=>p.ratio);
 for(const status of activeStatuses(actor??{})){
  const definition=content?.statuses?.[status.id];
  if(definition?.kind!=='buff'||status.remaining!=null&&status.remaining<=0||(status.stacks??1)<=0)continue;
  bonuses.push((status.appliedModifiers?.criticalDamageBonus??definition.modifiers?.criticalDamageBonus??0)*(definition.modifiersPerStack?status.stacks??1:1));
 }
 return stackCriticalDamageBonuses(bonuses);
}
export function criticalChance(actor,weakness=false,content) {
 let gearChance=0;
 for(const recipe of actor?.gearEffects??[]){const e=recipe.effect;if(!['critical_chance','normal_damage_chance'].includes(e.type))continue; // Legacy encounter snapshots.
  gearChance=Math.max(gearChance,Math.min(1,Math.max(0,baseStatValue(actor,e.stat)/e.atStat)));
 }
 const exclusiveChance=specialPassives(actor,'critical_chance_bonus').reduce((sum,p)=>sum+p.ratio,0);
 let statusChance=0;
 for(const status of activeStatuses(actor??{})){
  const definition=content?.statuses?.[status.id];
  if(definition?.kind!=='buff'||status.remaining!=null&&status.remaining<=0||(status.stacks??1)<=0)continue;
  statusChance+=(status.appliedModifiers?.criticalChanceBonus??definition.modifiers?.criticalChanceBonus??0)*(definition.modifiersPerStack?status.stacks??1:1);
 }
 return Math.min(1,gearChance+exclusiveChance+statusChance+(weakness?WEAKNESS_CRITICAL_CHANCE:0));
}

// Share the roll, not the result: weakness can differ across targets/hits.
// Reactions own a fresh action context. Moon damage never rolls or benefits.
export function resolveCritical(battle,actor,effect,context,weakness=false) {
 if(!actor||!damageFlags(effect).normalDamage)return {critical:false,multiplier:1};
 const chance=criticalChance(actor,weakness,battle.content);
 if(chance===0)return {critical:false,multiplier:1};
 if(chance===1)return {critical:true,multiplier:criticalDamageMultiplier(actor,battle.content)};
 const rolls=context.criticalRolls??=new Map();
 if(!rolls.has(actor.id)){
  const roll=battle.random();
  if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Nguồn ngẫu nhiên Bạo Kích không hợp lệ.');
  rolls.set(actor.id,roll);
 }
 const critical=rolls.get(actor.id)<chance;
 return {critical,multiplier:critical?criticalDamageMultiplier(actor,battle.content):1};
}

export function criticalMultiplier(battle,actor,effect,context,weakness=false) {return resolveCritical(battle,actor,effect,context,weakness).multiplier;}
