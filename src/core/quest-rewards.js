import {bountyBlueprintAmount,repeatBountyRewards} from './bounty-rewards.js';
import {questRewardMultiplier} from './quest-difficulty.js';
// Reward rolls are independent of the deterministic combat RNG.
// Keep classification independent from the random currency actually granted.
export function randomQuestReward(encounter){return Boolean(encounter&&encounter.category!=='chronicle'&&encounter.rewardPolicy!=='none'&&!encounter.travelerStory&&['normal','boss'].includes(encounter.rewardTier??'normal'));}
export function victoryRewardPreview(content,id,difficultyId,campaign){const e=content.encounters[id];if(e?.rewardPolicy==='none')return 'Không cấp tiền tệ hoặc EXP';const tier=e?.rewardTier??'normal',r=content.economy.default,coins=tier==='super'?r.superVictoryCoins:tier==='boss'?r.bossVictoryCoins:r.victoryCoins;const factor=questRewardMultiplier(content,e,difficultyId);if(repeatBountyRewards(content,e,difficultyId,campaign))return Math.round(coins*factor)+' Coin (40%) / '+Math.round(r.bossFragmentReward*factor)+' Vụn Prisma (40%) / '+bountyBlueprintAmount(content,e,difficultyId)+' Bản Thiết Kế (20%)';return randomQuestReward(e)?`${Math.round(coins*factor)} Coin hoặc ${Math.round((tier==='boss'?r.bossFragmentReward:r.normalFragmentReward)*factor)} Vụn Prisma · mỗi loại 50%`:`${coins} Coin`;}
export function prepareVictoryReward(battle,content,random=battle.rewardRandom??Math.random,campaign){
 if(battle.victoryReward)return battle.victoryReward;
 if(content.encounters[battle.encounterId]?.rewardPolicy==='none'){battle.victoryReward=Object.freeze({});return battle.victoryReward;}
 const encounter=content.encounters[battle.encounterId],r=content.economy.default,tier=encounter?.rewardTier??'normal';
 const coins=tier==='super'?r.superVictoryCoins:tier==='boss'?r.bossVictoryCoins:r.victoryCoins;
 let reward={coins};if(randomQuestReward(encounter)){const roll=random();if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Nguồn thưởng không hợp lệ.');if(repeatBountyRewards(content,encounter,battle.questDifficulty,campaign)){const br=r.bountyBlueprintRewards;reward=roll<br.coinChance?{coins}:roll<br.coinChance+br.fragmentChance?{prismaFragments:r.bossFragmentReward}:{blueprints:bountyBlueprintAmount(content,encounter,battle.questDifficulty)};}else if(roll>=r.coinRewardChance)reward={prismaFragments:tier==='boss'?r.bossFragmentReward:r.normalFragmentReward};}
 const factor=questRewardMultiplier(content,encounter,battle.questDifficulty);reward=Object.fromEntries(Object.entries(reward).map(([k,n])=>[k,k==='blueprints'?n:Math.round(n*factor)]));
 battle.victoryReward=Object.freeze(reward);return battle.victoryReward;
}
export function victoryRewardText(reward){return reward?.blueprints?`${reward.blueprints} Bản Thiết Kế`:reward?.prismaFragments?`${reward.prismaFragments} Vụn Prisma`:`${reward?.coins??0} Coin`;}
