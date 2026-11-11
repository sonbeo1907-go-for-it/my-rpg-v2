import {isAlive} from './actor-life.js';
import {buffTypeCount} from './conditional-combat.js';

// Percentage auras are not statuses: dispels cannot remove them and they stop on source KO.
export function preparedTeamAuras(content,campaign){
 const modifiers={};
 for(const id of campaign.party.filter(Boolean)){
  const p=content.characters[id]?.passive;if(p?.type!=='team_stat_aura')continue;
  for(const [stat,ratio]of Object.entries(p.modifiers))modifiers[stat]=Math.max(modifiers[stat]??0,ratio);
 }
 return modifiers;
}
export function syncTeamStatAuras(battle){
 const teams={};
 for(const source of battle.actors){const p=source.passive;if(!isAlive(source)||p?.type!=='team_stat_aura')continue;
  const modifiers=teams[source.team]??={};for(const [key,ratio]of Object.entries(p.modifiers))modifiers[key]=Math.max(modifiers[key]??0,ratio);
 }
 for(const actor of battle.actors)actor.teamAuraModifiers={...(teams[actor.team]??{})};
}
export function selfBuffOffense(content,actor){
 const p=actor.passive;if(p?.type!=='self_buff_offense')return {damage:0,penetration:0};
 const count=buffTypeCount(content,actor);
 return {damage:Math.min(p.cap,count*p.damagePerBuff),penetration:Math.min(p.cap,count*p.penetrationPerBuff)};
}
