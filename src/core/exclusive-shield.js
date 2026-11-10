import {coefficientFactor,skillRules} from './skill-rules.js';
import {battleStat} from './stat-values.js';

// Shared by the live Trấn handler and the UI preview so the displayed shield matches the cast.
export function exclusiveShieldAmount(content,passive,skill,readStat){
 const rank=skill?.skillRank??1;
 const factor=passive.rankGrowth===true?(skill?.rankDamageFactor??coefficientFactor(rank,skillRules(content))):1;
 return Math.round((readStat(passive.stat)??0)*(passive.ratio??0)*factor);
}
// Out-of-battle preview already knows the wearer's own flat aura; add that base bonus back.
export function previewExclusiveStat(content,actor,key){
 const flat=actor?.passive?.type==='living_team_flat_guard'?(actor.passive.modifiers?.[key]??0):0;
 return battleStat(content,actor,key,false,0,flat);
}
