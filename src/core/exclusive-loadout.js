import {specialPassives} from './exclusive-specials.js';
import {allocationBonuses} from './leveling.js';
import {equippedGear} from './equipment.js';
import {equippedExclusive} from './blacksmith-state.js';
import {effectiveStat} from './combat-math.js';
import {exclusiveStatModifiers} from './exclusive-hooks.js';

export function preparedPartyMaxMp(content,campaign){return campaign.party.filter(Boolean).reduce((sum,id)=>{
 const actor=structuredClone(content.characters[id]);actor.stats.maxMp+=(allocationBonuses(content,campaign.characters[id]).maxMp??0);
 for(const gear of equippedGear(campaign,id))actor.stats.maxMp+=gear.stats.maxMp??0;
 const exclusive=equippedExclusive(campaign,content,id);if(exclusive){actor.exclusiveGear=exclusive;if(exclusive.statKey==='maxMp')actor.stats.maxMp+=exclusive.statValue;actor.exclusiveModifiers=exclusiveStatModifiers(actor);}
 return sum+effectiveStat(actor,'maxMp');
},0);}
export function applySpecialLoadout(content,campaign,actor){
 const gearBonus={};for(const effect of actor.gearEffects??[]){const e=effect.effect;if(e.type!=='mp_stat_conversion')continue;const amount=Math.min(e.cap,Math.floor(effectiveStat(actor,'maxMp')*e.ratio));gearBonus[e.stat]=(gearBonus[e.stat]??0)+amount;}
 if(Object.keys(gearBonus).length){actor.gearEffectBonuses=gearBonus;actor.gearBonuses??={};for(const[k,n]of Object.entries(gearBonus)){actor.stats[k]+=n;actor.gearBonuses[k]=(actor.gearBonuses[k]??0)+n;}}
 if(!campaign.party.includes(actor.id))return;
 const ids=campaign.party.filter(Boolean),others=ids.filter(id=>id!==actor.id);
 for(const p of specialPassives(actor,'team_tag_power')){
  const count=others.filter(id=>content.characters[id].tags?.includes(p.tag)).length;
  actor.exclusiveTeamModifiers=Object.fromEntries(Object.entries(p.modifiers).map(([key,n])=>[key,n*count]));
  actor.exclusiveTeamPenetration=others.length>0&&count===others.length?p.fullTeamPenetration:0;
 }
 let guard=0;for(const id of ids){const source={exclusiveGear:equippedExclusive(campaign,content,id)};for(const p of specialPassives(source,'team_mp_magic_guard'))guard=Math.max(guard,Math.min(p.cap,preparedPartyMaxMp(content,campaign)/p.atMp*p.cap));}
 if(guard)actor.teamMagicDamageReduction=guard;
}
