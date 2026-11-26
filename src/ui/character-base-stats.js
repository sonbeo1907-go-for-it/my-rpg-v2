import {allocationBonuses} from '../core/leveling.js';
import {equippedGear} from '../core/equipment.js';
import {equippedExclusive} from '../core/blacksmith-state.js';

// Sheet base includes allocation and authored flat equipment rolls, before passive/aura/% effects.
// Read the equipped items themselves: actor.gearBonuses also contains percentage-effect totals.
export function characterBaseStats(content,id,state,campaign) {
 const base=content.characters[id];if(!base)throw Error('Không tìm thấy nhân vật.');
 const bonuses=allocationBonuses(content,state),stats=Object.fromEntries(Object.entries(base.stats).map(([key,value])=>[key,value+(bonuses[key]??0)]));
 if(campaign){
  for(const item of equippedGear(campaign,id))for(const [key,value]of Object.entries(item.stats))stats[key]+=value;
  const exclusive=equippedExclusive(campaign,content,id);if(exclusive)stats[exclusive.statKey]+=exclusive.statValue;
 }
 return stats;
}
