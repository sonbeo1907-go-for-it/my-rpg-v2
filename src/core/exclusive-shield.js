import {coefficientFactor,skillRules} from './skill-rules.js';

// Shared by the live Trấn handler and the UI preview so the displayed shield matches the cast.
export function exclusiveShieldAmount(content,passive,skill,readStat){
 const rank=skill?.skillRank??1;
 const factor=passive.rankGrowth===true?(skill?.rankDamageFactor??coefficientFactor(rank,skillRules(content))):1;
 return Math.round((readStat(passive.stat)??0)*(passive.ratio??0)*factor);
}
