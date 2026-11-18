export function claimAcademyClark(campaign){
 const next=structuredClone(campaign),s=next.tournaments;s.rewardClaims??=[];
 if(!s.firstClear||s.rewardClaims.includes('clark'))return campaign;
 if(!next.unlockedCharacterIds.includes('clark'))next.unlockedCharacterIds.push('clark');
 s.rewardClaims.push('clark');s.revision++;return next;
}
export function acceptAcademyRules(campaign,{revision}){
 const next=structuredClone(campaign),s=next.tournaments;
 if(s.revision!==revision||!Number.isSafeInteger(s.revision+1))throw Error('Thông báo đã thay đổi. Hãy mở lại.');
 s.rewardClaims??=[];s.rulesAccepted=true;
 if(!s.rewardClaims.includes('luka')){if(!next.unlockedCharacterIds.includes('luka'))next.unlockedCharacterIds.push('luka');s.rewardClaims.push('luka');}
 s.revision++;return claimAcademyClark(next);
}
