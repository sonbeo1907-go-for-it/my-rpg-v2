import {baseStatValue} from './combat-math.js';
import {battleStat} from './stat-values.js';
import {isAlive} from './actor-life.js';

export function teamPhysicalGuard(battle,team){
 return Math.max(0,...battle.actors.filter(a=>a.team===team&&isAlive(a)&&a.passive?.type==='base_speed_physical_guard').map(a=>Math.min(a.passive.cap,Math.max(0,baseStatValue(a,'speed'))/a.passive.atSpeed*a.passive.cap)));
}
export function alteredDefenseBonus(content,attacker,target){
 const p=attacker.passive;if(p?.type!=='altered_defense_damage')return 0;
 return Math.abs(battleStat(content,target,'defense')-(target.baseStats?.defense??target.stats.defense))>1e-8?p.ratio:0;
}
export function validateTacticalPassives(content){
 const errors=[];
 for(const a of [...Object.values(content.characters),...Object.values(content.enemies)]){const p=a.passive;
  if(p?.type==='base_speed_physical_guard'&&(!p.name||!p.description||!Number.isFinite(p.cap)||p.cap<=0||p.cap>.75||!Number.isFinite(p.atSpeed)||p.atSpeed<=0))errors.push(a.id+': invalid base speed guard');
  if(p?.type==='altered_defense_damage'&&(!p.name||!p.description||!Number.isFinite(p.ratio)||p.ratio<=0||p.ratio>2))errors.push(a.id+': invalid altered defense bonus');
  if(p?.type==='vampire_contingency'){
   const mode=a.combatModes?.[p.modeId],follow=content.abilities[p.followUpAbility];
   if(!p.name||!p.description||!Number.isFinite(p.threshold)||p.threshold<=0||p.threshold>=1||!mode||mode.lifetime!=='rounds'||!mode.reentryCooldownRounds||!content.statuses[p.tauntStatus]?.taunt||!content.statuses[p.immortalityStatus]?.preventDeath||follow?.activation!=='passive'||follow?.target!=='enemy_splash'||follow?.cost||follow?.cooldown||follow?.effects.some(e=>e.type!=='damage'))errors.push(a.id+': invalid vampire contingency');
  }
  if(p?.type==='low_hp_immortality'&&(!p.name||!p.description||!Number.isFinite(p.ratio)||p.ratio<=0||p.ratio>1||!Number.isFinite(p.threshold)||p.threshold<=0||p.threshold>=1||!content.statuses[p.immortalityStatus]?.preventDeath||content.statuses[p.immortalityStatus]?.durationClock!=='round'))errors.push(a.id+': invalid low HP immortality');
 }
 return errors;
}
