import {tournamentRandom} from './tournament-schedule.js';
import {awardAcademyTokens} from './academy-event-economy.js';

export function selectAcademySpecial(definition,firstClear,seed){
 const rule=definition.specialEncounters;if(!firstClear||!rule.configured)return null;
 const random=tournamentRandom(seed);if(random()>=rule.chance)return null;
 return {characterId:rule.characterIds[Math.floor(random()*rule.characterIds.length)],status:'waiting',checkpoint:null,pendingOutcome:null};
}
export function academySpecialAvailable(run){return Boolean(run&&!run.outcome&&run.specialEncounter&&['available','active'].includes(run.specialEncounter.status));}
export function revealAcademySpecial(run){
 if(run.specialEncounter?.status==='waiting'&&(run.phase!=='group'||run.round>1))run.specialEncounter.status=run.outcome?'declined':'available';
}
function change(campaign,{runId,revision}){
 const next=structuredClone(campaign),s=next.tournaments,r=s?.activeRun;
 if(!r||r.runId!==runId||s.revision!==revision||!Number.isSafeInteger(s.revision+1)||r.outcome||!academySpecialAvailable(r)||r.battleCheckpoint||r.pendingResult)throw Error('Thử thách đặc biệt chưa sẵn sàng.');
 s.revision++;return next;
}
export function checkpointAcademySpecial(campaign,args){
 const next=change(campaign,args),e=next.tournaments.activeRun.specialEncounter;
 if(e.pendingOutcome||!args.checkpoint||JSON.stringify(args.checkpoint).length>2_000_000||args.outcome&&!['victory','defeat'].includes(args.outcome))throw Error('Không thể lưu thử thách đặc biệt.');
 e.status='active';e.checkpoint=structuredClone(args.checkpoint);e.pendingOutcome=args.outcome??null;return next;
}
export function finishAcademySpecial(campaign,args){
 const next=change(campaign,args),s=next.tournaments,r=s.activeRun,e=r.specialEncounter;
 if(args.retry){if(e.pendingOutcome!=='defeat')throw Error('Không có trận thua để thử lại.');e.checkpoint=null;e.pendingOutcome=null;e.status='available';return next;}
 if(args.decline){if(e.status!=='available')throw Error('Hãy kết thúc trận đang dở trước.');e.status='declined';}
 else{if(!e.pendingOutcome)throw Error('Thử thách chưa kết thúc.');e.status=e.pendingOutcome;if(e.status==='victory')awardAcademyTokens(s,r,'special:'+e.characterId,r.snapshot.definition.specialEncounters.rewardTokens);}
 e.checkpoint=null;e.pendingOutcome=null;return next;
}
export function validateAcademySpecial(run,fail){
 const e=run.specialEncounter;if(e===undefined||e===null)return;
 const rule=run.snapshot.definition.specialEncounters;
 if(!run.firstClearAtCreation||!rule.configured||!rule.characterIds.includes(e.characterId)||!['waiting','available','active','victory','defeat','declined'].includes(e.status)||!['victory','defeat',null].includes(e.pendingOutcome)||e.status!=='active'&&(e.checkpoint!==null||e.pendingOutcome!==null)||e.status==='active'&&(!e.checkpoint||JSON.stringify(e.checkpoint).length>2_000_000)||e.pendingOutcome&&!e.checkpoint||e.status==='waiting'&&run.phase!=='group'||e.status==='active'&&(run.battleCheckpoint||run.pendingResult))fail();
}
