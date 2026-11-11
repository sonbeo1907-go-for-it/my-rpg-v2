import {unlockCharacter} from './ownership.js';
import {unlockDuplicateSlot} from './gear-slots.js';

export const REMULIA_SLOT_SCORE=8;
export const REMULIA_RECIPE_SCORE=16;
export const REMULIA_RECIPE_FLAG='song.remulia.recipe';
export function trialMilestoneProgress(campaign){
 const best=campaign.unrecordedLedger?.best??{},ids=['song_chimera','song_ego','song_calamity'];
 return {wins:ids.filter(id=>Object.hasOwn(best,id)).length,slots:ids.filter(id=>(best[id]??-1)>=REMULIA_SLOT_SCORE).length,recipe:ids.some(id=>(best[id]??-1)>=REMULIA_RECIPE_SCORE)};
}
// Called inside reward transactions and after save normalization. Receipts prevent extra slots on reload.
export function grantTrialMilestones(campaign,content){
 if(!content.characters.remulia)return [];
 const progress=trialMilestoneProgress(campaign),granted=[];campaign.storyFlags??=[];
 if(progress.wins===3&&!campaign.unlockedCharacterIds.includes('remulia')){unlockCharacter(campaign,content,'remulia');granted.push({characterId:'remulia',duplicate:false,slotUnlocked:false});}
 if(campaign.unlockedCharacterIds.includes('remulia'))for(const id of ['song_chimera','song_ego','song_calamity']){
  const flag='song.remulia.slot.'+id;
  if((campaign.unrecordedLedger?.best?.[id]??-1)>=REMULIA_SLOT_SCORE&&!campaign.storyFlags.includes(flag)){
   granted.push({type:'gear_slot',characterId:'remulia',slotUnlocked:unlockDuplicateSlot(campaign,content,'remulia')});campaign.storyFlags.push(flag);
  }
 }
 if(progress.recipe&&!campaign.storyFlags.includes(REMULIA_RECIPE_FLAG)){campaign.storyFlags.push(REMULIA_RECIPE_FLAG);granted.push({type:'exclusive_recipe',templateId:'remulia.lost_tuning_fork'});}
 return granted;
}
