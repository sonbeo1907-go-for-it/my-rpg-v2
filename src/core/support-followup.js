export function isSupportAction(skill){return skill?.activation!=='passive'&&skill?.effects?.length>0&&!skill.effects.some(e=>e.type==='damage');}
export function supportFollowupLimit(actor){const p=actor.passive;return actor.activeMode===p.modeId?p.modePerRound:p.perRound;}
export function supportFollowupBonus(actor){return actor.activeMode===actor.passive?.modeId?actor.modeFollowUpBonus??0:0;}
export function supportFollowupReady(battle,owner,source,skill){
 const p=owner.passive,state=owner.supportFollowupState;
 return p?.type==='ally_support_followup'&&owner.hp>0&&source.hp>0&&owner.id!==source.id&&owner.team===source.team&&isSupportAction(skill)&&(state?.round!==battle.round||state.count<supportFollowupLimit(owner));
}
