import {levelRules} from './leveling.js';
export const hasQuestDifficulties=e=>Boolean(e&&!e.travelerStory&&(e.rewardTier??'normal')!=='super');
export function questDifficulty(content,encounter,id){if(!hasQuestDifficulties(encounter))return null;const key=id??encounter.defaultDifficulty??'very_easy';const d=levelRules(content).questDifficulties[key];if(!d)throw Error('Độ khó nhiệm vụ không hợp lệ.');return {id:key,...d};}
export function questExperience(content,encounter,id){const d=questDifficulty(content,encounter,id);return d?d.xp*levelRules(content).questXpMultipliers[encounter.category==='bounty'?'bounty':encounter.rewardTier??'normal']:0;}
export function questRewardMultiplier(content,encounter,id){return questDifficulty(content,encounter,id)?.rewardMultiplier??1;}
