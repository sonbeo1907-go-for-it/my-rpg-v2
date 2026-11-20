// First-clear upgrades grant an effective rank floor. Raw account ranks and levels
// stay intact; these rewards never spend currency or manufacture character XP.
export function storySkillRankFloors(content,state){
 const floors={};
 for(const id of state?.upgradeIds??[])for(const change of content?.upgrades?.[id]?.changes??[]){
  if(change.type==='skill_rank_floor')floors[change.lineId]=Math.max(floors[change.lineId]??1,change.rank);
 }
 return floors;
}
export function actorSkillRankLimit(actor,skill){
 if(actor?.masteryDisabled)return 5;
 if(skill.masterySource==='story')return Math.max(5,actor?.storySkillRankCaps?.[skill.skillLineId??skill.id]??5);
 return skill.masteryEligible===false?5:Infinity;
}
