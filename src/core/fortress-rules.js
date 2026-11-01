import {chroniclePartyLevel,chronicleWeek} from './chronicle-rules.js';
export const fortressBook=c=>c.chronicles.books.book2;
export const fortressUnlocked=c=>Boolean(c.chronicles?.firstClearIds.includes('book1.intro.f10'));
export const fortressToken=c=>{const a=c.chronicles.activeSession;return a?a.sessionId+':'+a.actionRevision:null;};
export const fortressCleared=(c,id)=>{const b=fortressBook(c);return b.firstClearIds.includes(id)||b.eventClearIds.includes(id);};
export function fortressLocationOpen(c,content,id){const l=content.chronicles.book2.locations.find(x=>x.id===id);return Boolean(l&&fortressUnlocked(c)&&l.requires.every(req=>fortressCleared(c,req)));}
export function fortressEventReady(c,content,e){return Boolean(e?.bookId==='book2'&&e.requires.every(id=>fortressCleared(c,id))&&fortressLocationOpen(c,content,e.locationId)&&(e.intro||fortressBook(c).firstClearIds.length===10)&&(!e.hidden||!fortressCleared(c,e.id)));}
export function fortressRequireSession(c,content,token){const a=c.chronicles?.activeSession;if(!fortressUnlocked(c)||!a||a.bookId!=='book2')throw Error('Hãy tiến vào pháo đài từ kệ sách.');if(token!==fortressToken(c))throw Error('Thao tác đã thay đổi. Hãy thử lại từ cảnh hiện tại.');if(c.chronicles.activeBattle||a.activeEvent?.status==='battle')throw Error('Hãy tiếp tục hoặc rút khỏi trận chiến.');return a;}
export function fortressRequirement(c,content,requires={}){
 const a=c.chronicles.activeSession,b=fortressBook(c),inventory=c.chronicles.inventory;
 if(requires.location&&a?.currentLocation!==requires.location)return false;
 if(requires.flags?.some(k=>!b.supportFlags[k])||requires.notFlags?.some(k=>b.supportFlags[k])||requires.cleared?.some(id=>!fortressCleared(c,id)))return false;
 if(requires.event&&a?.activeEvent?.eventId!==requires.event||requires.eventAny&&!requires.eventAny.includes(a?.activeEvent?.eventId))return false;
 if(requires.items?.some(id=>!inventory.some(i=>i.bookId==='book2'&&i.itemId===id&&i.status!=='invalidated')))return false;
 if(requires.missingItems?.some(id=>inventory.some(i=>i.bookId==='book2'&&i.itemId===id)))return false;
 if(requires.carried?.some(id=>!inventory.some(i=>i.bookId==='book2'&&i.itemId===id&&i.status==='owned'&&i.custody==='carried')))return false;
 if(requires.partyMembers?.some(id=>!c.party.includes(id)))return false;
 if(requires.authorityScope==='powder_transfer'&&(!c.party.includes('victorina')||!b.supportFlags.powderTransferDelegation))return false;
 if(requires.authorityScope==='medical_transfer'&&(!c.party.includes('sieg')||!b.supportFlags.assignedMedicalTransfer))return false;
 if(requires.expertiseScope&&requires.expertiseScope!=='courier_trace'||requires.expertiseScope==='courier_trace'&&!c.party.includes('chelsea'))return false;
 if(requires.incident&&!b.incidentLedger.some(i=>!i.resolved))return false;
 if(requires.stored&&!inventory.some(i=>i.itemId===requires.stored&&i.status==='owned'&&i.custody==='stored'))return false;
 return true;
}
export function fortressSupport(c,content,encounter,instanceId){
 const p=c.chronicles?.activeSession?.activeEvent;
 if(encounter.category!=='chronicle'||encounter.bookId!=='book2'||encounter.chronicleKind!=='fortress_defense'||p?.instanceId!==instanceId||p.eventId!==encounter.chronicleEventId)return null;
 const f=fortressBook(c).supportFlags,cannon=f.cannonSupportReady,supply=f.supplySupportReady;
 return {source:'chronicle',bookId:'book2',kind:'fortress_defense',id:'chronicle_book2_fortress_support',cannon,supply,modifiers:{attack:(cannon ? .2 : 0)+(supply ? .1 : 0),magic:cannon ? .2 : 0,resistance:supply ? .1 : 0}};
}
export function fortressChooseEvent(c,content,random){
 const a=c.chronicles.activeSession,b=fortressBook(c),l=content.chronicles.book2.locations.find(x=>x.id===a.currentLocation);
 if(!fortressCleared(c,l.introId)){const e=content.chronicleEvents[l.introId];if(!fortressEventReady(c,content,e))throw Error('Hãy hoàn tất công việc trước đó.');return e;}
 if(b.firstClearIds.length!==10)throw Error('Hãy tiếp tục làm quen với các khu vực.');
 let events=Object.values(content.chronicleEvents).filter(e=>e.bookId==='book2'&&!e.intro&&!e.hidden&&!e.finale&&e.locationId===l.id&&fortressEventReady(c,content,e));
 const unseen=events.filter(e=>!fortressCleared(c,e.id));if((b.noNewEventStreakByLocation[l.id]??0)>=2&&unseen.length)events=unseen;
 const last=b.lastEventIdsByLocation[l.id]?.[0];if(events.length>1)events=events.filter(e=>e.id!==last);
 const groups={npc:events.filter(e=>!e.encounterId).length,combat:events.filter(e=>e.encounterId).length};
 const pool=events.map(e=>({e,w:(e.encounterId?(1-l.npcWeight)/Math.max(1,groups.combat):l.npcWeight/Math.max(1,groups.npc))*(fortressCleared(c,e.id)?1:3)}));
 let cursor=random()*pool.reduce((n,x)=>n+x.w,0);for(const x of pool){cursor-=x.w;if(cursor<0)return x.e;}if(!pool.length)throw Error('Chưa có hoạt động tại đây.');return pool.at(-1).e;
}
export function fortressWeeklyReward(c,p,now){const key=chronicleWeek(now),s=c.chronicles;let l=s.weeklyRewardLedger;if(!l.weekKey||key>l.weekKey)l=s.weeklyRewardLedger={weekKey:key,count:0,claimedInstanceIds:[]};if(l.count>=28||l.claimedInstanceIds.includes(p.instanceId))return {};l.count++;l.claimedInstanceIds.push(p.instanceId);return {[p.rewardRoll.currency]:p.rewardRoll.amount};}
export {chroniclePartyLevel};
