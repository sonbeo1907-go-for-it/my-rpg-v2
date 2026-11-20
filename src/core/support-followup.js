import {revelationActive} from './moonlight-revelation.js';

import {isAlive} from "./actor-life.js";
export function isSupportAction(skill){return skill?.activation!=='passive'&&skill?.effects?.length>0&&!skill.effects.some(e=>e.type==='damage');}
export function supportFollowupLimit(actor,battle){const p=actor.passive,rule=actor.moonlightRevelation,revealed=battle?revelationActive(battle,actor):actor.moonlightRevelationActive;return actor.activeMode===p.modeId?(revealed&&rule?.modePerRound?rule.modePerRound:p.modePerRound):p.perRound;}
export function supportFollowupBonus(actor){return actor.activeMode===actor.passive?.modeId?actor.modeFollowUpBonus??0:0;}
export function supportFollowupReady(battle,owner,source,skill){
 const p=owner.passive,state=owner.supportFollowupState;
 return p?.type==='ally_support_followup'&&isAlive(owner)&&isAlive(source)&&owner.id!==source.id&&owner.team===source.team&&isSupportAction(skill)&&(!p.excludeDefend||skill.id!=='$defend')&&(state?.round!==battle.round||state.count<supportFollowupLimit(owner,battle));
}
