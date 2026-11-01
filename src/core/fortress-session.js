import {resolveCharacter} from './progression.js';

export function createFortressParty(campaign,content,snapshot=null){
 const partyIds=[...campaign.party],partyVitals={};
 let actors=[];try{actors=snapshot?.state?JSON.parse(snapshot.state).actors??[]:[];}catch{}
 for(const id of partyIds.filter(Boolean)){
  const stats=resolveCharacter(content,campaign,id).stats,actor=actors.find(a=>a.team==='party'&&a.id===id);
  partyVitals[id]={hp:Math.min(stats.maxHp,Math.max(0,actor?.hp??stats.maxHp)),mp:Math.min(stats.maxMp,Math.max(0,actor?.mp??stats.maxMp)),maxHp:stats.maxHp,maxMp:stats.maxMp};
 }
 return {partyIds,partyVitals,restUsed:false};
}
export function assertFortressParty(campaign){
 const a=campaign.chronicles?.activeSession;
 if(a&&JSON.stringify(a.partyIds)!==JSON.stringify(campaign.party))throw Error('Đội hình đã khóa trong phiên pháo đài. Hãy rời qua cổng trước khi thay đổi.');
}
export function assertFortressLoadoutUnchanged(before,after,content){
 const a=before.chronicles?.activeSession;if(!a)return;
 const signature=c=>JSON.stringify({party:c.party,preset:c.activePartyPresetId,members:a.partyIds.filter(Boolean).map(id=>({state:c.characters[id],character:resolveCharacter(content,c,id),slots:c.equipment[id]??[]}))});
 if(signature(before)!==signature(after))throw Error('Đội hình, kỹ năng và trang bị đã khóa trong phiên pháo đài. Hãy rời qua cổng để thay đổi.');
}
export function captureFortressVitals(session,battle){
 for(const id of session.partyIds.filter(Boolean)){
  const actor=battle.actors.find(a=>a.team==='party'&&a.id===id);if(!actor)continue;
  session.partyVitals[id]={hp:Math.max(0,Math.min(actor.stats.maxHp,actor.hp)),mp:Math.max(0,Math.min(actor.stats.maxMp,actor.mp)),maxHp:actor.stats.maxHp,maxMp:actor.stats.maxMp};
 }
}
export function restoreFortressVitals(campaign,actors){
 const session=campaign.chronicles?.activeSession;if(!session)return;
 assertFortressParty(campaign);
 for(const actor of actors.filter(a=>a.team==='party')){const saved=session.partyVitals[actor.id];if(saved){actor.hp=Math.min(actor.stats.maxHp,saved.hp);actor.mp=Math.min(actor.stats.maxMp,saved.mp);}}
}
export function restFortressParty(campaign){
 const a=campaign.chronicles?.activeSession;
 if(!a||a.currentLocation!=='f'||a.restUsed||campaign.chronicles.activeBattle||a.activeEvent?.status==='battle')throw Error('Chỉ được nghỉ tại trạm quân y một lần trong mỗi phiên.');
 for(const v of Object.values(a.partyVitals)){v.hp=v.maxHp;v.mp=v.maxMp;}a.restUsed=true;
}
export function appendFortressLog(campaign,message,{kind='activity',reward={},now=new Date()}={}){
 const s=campaign.chronicles,a=s.activeSession;if(!a)return;
 const book=s.books.book2;book.activityLog??=[];const id=a.sessionId+':'+a.actionRevision+':'+kind;
 if(book.activityLog.some(e=>e.id===id))return;
 book.activityLog.push({id,sessionId:a.sessionId,locationId:a.currentLocation,kind,message,reward:structuredClone(reward),at:now.toISOString()});
 if(book.activityLog.length>200)book.activityLog.splice(0,book.activityLog.length-200);
}
