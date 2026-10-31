// Reward rolls are independent of the deterministic combat RNG.
// Keep classification independent from the random currency actually granted.
export function randomQuestReward(encounter){return Boolean(encounter&&!encounter.travelerStory&&['normal','boss'].includes(encounter.rewardTier??'normal'));}
export function victoryRewardPreview(content,id){const e=content.encounters[id],tier=e?.rewardTier??'normal',r=content.economy.default,coins=tier==='super'?r.superVictoryCoins:tier==='boss'?r.bossVictoryCoins:r.victoryCoins;return randomQuestReward(e)?`${coins} Coin hoặc ${tier==='boss'?r.bossFragmentReward:r.normalFragmentReward} Vụn Prisma · mỗi loại 50%`:`${coins} Coin`;}
export function prepareVictoryReward(battle,content,random=battle.rewardRandom??Math.random){
 if(battle.victoryReward)return battle.victoryReward;
 const encounter=content.encounters[battle.encounterId],r=content.economy.default,tier=encounter?.rewardTier??'normal';
 const coins=tier==='super'?r.superVictoryCoins:tier==='boss'?r.bossVictoryCoins:r.victoryCoins;
 let reward={coins};if(randomQuestReward(encounter)){const roll=random();if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Nguồn thưởng không hợp lệ.');if(roll>=r.coinRewardChance)reward={prismaFragments:tier==='boss'?r.bossFragmentReward:r.normalFragmentReward};}
 battle.victoryReward=Object.freeze(reward);return battle.victoryReward;
}
export function victoryRewardText(reward){return reward?.prismaFragments?`${reward.prismaFragments} Vụn Prisma`:`${reward?.coins??0} Coin`;}
