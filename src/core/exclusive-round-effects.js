import {specialPassives} from './exclusive-specials.js';
import {isAlive} from './actor-life.js';
import {procAvailable,markProc} from './exclusive-hooks.js';
import {changeTeamResource} from './team-resources.js';

// A real round start, not a turn/Extra start. Absolute status deadlines survive carry.
export function activateRoundExclusiveEffects(battle,io){
 for(const owner of battle.actors.filter(isAlive))for(const p of specialPassives(owner,'round_team_resource_status')){
  const key='exclusive:round_team_resource_status:'+p.statusId;
  if(!procAvailable(battle,owner,key))continue;
  markProc(battle,owner,key);io.announce(battle,owner,owner.id,p.name);
  changeTeamResource(battle,owner,p.teamResourceId,p.amount,io);
  for(const ally of battle.actors.filter(a=>a.team===owner.team&&isAlive(a)))io.status(battle,ally,p.statusId,p.duration,owner.id,{baseStatModifiers:p.baseStatModifiers});
 }
}
