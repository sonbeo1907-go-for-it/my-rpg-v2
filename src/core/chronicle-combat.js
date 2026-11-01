import {getFortressPending,fortressLocationOpen} from './fortress.js';
import {createBattle} from './battle.js';
import {seededRandom} from './random.js';
import {getChroniclePending} from './chronicles.js';
const encode=(key,value)=>key==='content'||typeof value==='function'?undefined:value instanceof Set?{$chronicleSet:[...value]}:value instanceof Map?{$chronicleMap:[...value]}:value;
const decode=(key,value)=>value&&typeof value==='object'&&Object.hasOwn(value,'$chronicleSet')?new Set(value.$chronicleSet):value&&typeof value==='object'&&Object.hasOwn(value,'$chronicleMap')?new Map(value.$chronicleMap):value;
export function snapshotChronicleBattle(battle){return {encounterId:battle.encounterId,rngState:battle.random.getState(),state:JSON.stringify(battle,encode)};}
export function restoreChronicleBattle(content,snapshot){const b=JSON.parse(snapshot.state,decode);b.content=content;b.random=seededRandom(snapshot.rngState);return b;}
export function checkpointChronicleBattle(campaign,content,battle){
 if(battle.chronicle?.bookId==='book2')return checkpointFortressBattle(campaign,content,battle);const next=structuredClone(campaign),s=next.chronicles,{pending:p}=getChroniclePending(next,content,battle.chronicle.locationId,battle.chronicle.instanceId);p.battleSnapshot=snapshotChronicleBattle(battle);p.status=battle.outcome==='defeat'?'retry':'battle';s.activeBattle=battle.outcome==='defeat'?null:p.locationId;return next;}
export function createChronicleBattle(content,campaign,locationId,instanceId){
 if(locationId==='book2')return createFortressBattle(content,campaign,instanceId);
 if(campaign.chronicles.activeSession)throw Error('Hãy rời phiên pháo đài trước.');
 const{pending:p,event,step}=getChroniclePending(campaign,content,locationId,instanceId);if(!step.battle)throw Error('Chưa tới bước chiến đấu.');if(campaign.chronicles.activeBattle&&campaign.chronicles.activeBattle!==locationId)throw Error('Đang có trận chiến khác.');
 if(p.battleSnapshot&&p.status!=='retry')return restoreChronicleBattle(content,p.battleSnapshot);
 const b=createBattle(content,campaign,event.encounterId,seededRandom(p.seed),{enemyLevel:p.level,chronicleInstanceId:p.instanceId});b.chronicle={locationId,instanceId:p.instanceId};return b;
}
export function advanceChronicleWave(content,campaign,battle){
 const e=content.encounters[battle.encounterId],index=battle.storyWave?.waveIndex??0;
 if(battle.outcome!=='victory'||!e.waves||index===e.waves.length-1)return battle;
 const p=campaign.chronicles.pendingByLocation[battle.chronicle.locationId];
 const b=createBattle(content,campaign,e.id,battle.random,{enemyLevel:p.level,chronicleInstanceId:p.instanceId,storyWaveIndex:index+1,partyActors:battle.actors.filter(a=>a.team==='party'),sourceActors:[...(battle.sourceActors??[]),...battle.actors.filter(a=>a.team==='enemy')],turnOrderField:battle.turnOrderField,roundOffset:battle.round,enemyIdPrefix:'chronicle_'+(index+1)+'_enemy_',log:[...battle.log,'— Đợt '+(index+2)+'/'+e.waves.length+' —']});b.chronicle={...battle.chronicle};return b;
}
export function finishChronicleBattle(campaign,content,battle){
 if(battle.chronicle?.bookId==='book2')return finishFortressBattle(campaign,content,battle);
 if(battle.outcome!=='victory'||battle.continuesOnVictory||battle.rewardClaimed)return campaign;
 const next=structuredClone(campaign),s=next.chronicles,{pending:p,event,step}=getChroniclePending(next,content,battle.chronicle.locationId,battle.chronicle.instanceId);if(!step.battle||event.encounterId!==battle.encounterId)throw Error('Trận chiến không thuộc sự kiện này.');
 p.stepId=event.steps[event.steps.indexOf(step)+1].id;p.battleWon=true;p.status='scene';p.battleSnapshot=null;s.activeBattle=null;return next;
}

export function activeChronicleSnapshot(campaign){const s=campaign?.chronicles,id=s?.activeBattle;return id==='book2'?s.activeSession?.activeEvent?.battleSnapshot:id?s.pendingByLocation[id]?.battleSnapshot:null;}
function createFortressBattle(content,campaign,instanceId){
 const {session:a,pending:p,event:e,step}=getFortressPending(campaign,content,instanceId);
 if(!step.battle||p.selectedBranchId!=='combat'||a.currentLocation!==step.locationId||!fortressLocationOpen(campaign,content,step.locationId)||campaign.chronicles.activeBattle&&campaign.chronicles.activeBattle!=='book2')throw Error('Chưa tới bước chiến đấu hợp lệ.');
 if(p.battleSnapshot&&p.status!=='retry')return restoreChronicleBattle(content,p.battleSnapshot);
 const b=createBattle(content,campaign,e.encounterId,seededRandom(p.seed),{enemyLevel:p.level,chronicleInstanceId:p.instanceId});b.chronicle={bookId:'book2',locationId:'book2',instanceId:p.instanceId,sessionId:a.sessionId};return b;
}
function checkpointFortressBattle(campaign,content,battle){
 const next=structuredClone(campaign),s=next.chronicles,{session:a,pending:p,event:e,step}=getFortressPending(next,content,battle.chronicle.instanceId);
 if(!step.battle||a.sessionId!==battle.chronicle.sessionId||e.encounterId!==battle.encounterId)throw Error('Trận chiến không thuộc công việc hiện tại.');
 p.battleSnapshot=snapshotChronicleBattle(battle);p.status=battle.outcome==='defeat'?'retry':'battle';s.activeBattle=battle.outcome==='defeat'?null:'book2';return next;
}
function finishFortressBattle(campaign,content,battle){
 if(battle.outcome!=='victory'||battle.continuesOnVictory||battle.rewardClaimed)return campaign;
 const next=structuredClone(campaign),{session:a,pending:p,event:e,step}=getFortressPending(next,content,battle.chronicle.instanceId);
 if(!step.battle||a.sessionId!==battle.chronicle.sessionId||e.encounterId!==battle.encounterId)throw Error('Trận chiến không thuộc công việc hiện tại.');
 p.stepId=step.after;p.battleWon=true;p.status='scene';p.battleSnapshot=null;a.actionRevision++;next.chronicles.activeBattle=null;return next;
}
