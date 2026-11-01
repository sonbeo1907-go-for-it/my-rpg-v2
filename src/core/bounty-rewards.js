import {questDifficulty} from './quest-difficulty.js';
export function bountyBlueprintAmount(content,encounter,difficultyId){
 if(encounter?.category!=='bounty')return 0;
 const r=content.economy.default.bountyBlueprintRewards,level=questDifficulty(content,encounter,difficultyId)?.level??0;
 return level<r.minLevel?0:[...r.amountByLevel].reverse().find(item=>level>=item.level)?.amount??0;
}
export function repeatBountyRewards(content,encounter,difficultyId,campaign){return Boolean(bountyBlueprintAmount(content,encounter,difficultyId)&&campaign?.claimedFirstClearRewards?.includes(encounter.id));}
