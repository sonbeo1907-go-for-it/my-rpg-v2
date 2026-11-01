import {emptyFortressBook} from './fortress-state.js';
import {seededRandom} from './random.js';
import {fortressBook,fortressUnlocked,fortressToken,fortressRequireSession,fortressLocationOpen,fortressEventReady,fortressRequirement,fortressChooseEvent,fortressCleared,fortressWeeklyReward,chroniclePartyLevel} from './fortress-rules.js';
export * from './fortress-rules.js';
function randomSeed(random){const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw Error('Nguồn ngẫu nhiên không hợp lệ.');return Math.floor(n*4294967296);}
export function enterFortress(c,content,{random=Math.random,now=new Date()}={}){
 if(!fortressUnlocked(c))throw Error('Hãy hoàn thành mười phần truyện chính Quyển I.');
 if(c.chronicles.activeBattle)throw Error('Hãy hoàn tất trận chiến đang diễn ra.');
 if(c.chronicles.activeSession)return structuredClone(c);
 const next=structuredClone(c),s=next.chronicles;s.books??={};s.books.book2??=emptyFortressBook();s.inventory??=[];s.nextSessionId??=1;
 s.activeSession={sessionId:'fortress-'+s.nextSessionId++,bookId:'book2',status:'active',currentLocation:'a',startedAt:now.toISOString(),actionRevision:0,rngState:randomSeed(random),activeEvent:fortressBook(next).suspendedEvent};fortressBook(next).suspendedEvent=null;return next;
}
export function moveFortress(c,content,{token,locationId}){
 const next=structuredClone(c),a=fortressRequireSession(next,content,token);if(!fortressLocationOpen(next,content,locationId))throw Error('Khu vực chưa được phép tiếp cận.');a.currentLocation=locationId;a.actionRevision++;return next;
}
export function leaveFortress(c,content,{token,confirmed=false}){
 const next=structuredClone(c),a=fortressRequireSession(next,content,token);if(!confirmed||!['a','i'].includes(a.currentLocation)||a.currentLocation==='i'&&!fortressCleared(next,'book2.intro.f09'))throw Error('Chỉ có thể rời pháo đài qua cổng sau khi xác nhận.');
 fortressBook(next).suspendedEvent=a.activeEvent;for(const item of next.chronicles.inventory)if(item.bookId==='book2'&&content.chronicles.book2.items[item.itemId].military&&item.status==='owned'&&item.custody==='carried')item.custody='stored';next.chronicles.activeSession=null;return next;
}
export function beginFortressEvent(c,content,{token,hiddenId=null,finale=false},now=new Date()){
 const next=structuredClone(c),a=fortressRequireSession(next,content,token);if(a.activeEvent||fortressBook(next).suspendedEvent)throw Error('Hãy tiếp tục công việc đang làm.');
 const random=seededRandom(a.rngState);let e;
 if(finale){e=content.chronicleEvents['book2.finale'];if(a.currentLocation!=='h'||!fortressEventReady(next,content,e))throw Error('Không có tương tác tại đây.');}
 else if(hiddenId){e=content.chronicleEvents[hiddenId];if(!e?.hidden||e.finale||e.locationId!==a.currentLocation||!fortressEventReady(next,content,e))throw Error('Không có tương tác tại đây.');}
 else e=fortressChooseEvent(next,content,random);
 const type=random(),currency=type<.75?'coins':type<.95?'prismaFragments':'recruitmentShards',amount=currency==='coins'?100+Math.floor(random()*101):currency==='prismaFragments'?10+Math.floor(random()*11):1;
 a.activeEvent={instanceId:'book2-'+e.locationId+'-'+next.chronicles.nextInstanceId++,eventId:e.id,originLocation:e.locationId,stepId:e.steps[0].id,battleStepId:e.steps.find(s=>s.battle)?.id??null,selectedBranchId:null,choiceHistory:[],chanceResults:{},rewardRoll:{currency,amount},level:e.finale?1:chroniclePartyLevel(next),seed:Math.floor(random()*4294967296),status:'scene',startedAt:now.toISOString(),battleWon:false,battleSnapshot:null,committedEffects:[]};a.rngState=random.getState();a.actionRevision++;return next;
}
function grantItem(c,content,id,provenance,now){const s=c.chronicles,d=content.chronicles.book2.items[id];if(!d)throw Error('Vật phẩm không tồn tại.');if(s.inventory.some(i=>i.bookId==='book2'&&i.itemId===id))return;s.inventory.push({bookId:'book2',itemId:id,status:'owned',custody:d.military?'carried':'archive',scope:d.scope,provenance,acquiredAt:now.toISOString()});}
function incident(c,p,type,severity,now){const b=fortressBook(c),id=p.instanceId+':'+type;if(!b.incidentLedger.some(i=>i.id===id))b.incidentLedger.push({id,severity,resolved:false,createdAt:now.toISOString()});b.securityConcern=Math.min(3,b.incidentLedger.filter(i=>!i.resolved).reduce((n,i)=>n+i.severity,0));}
function applyEffects(c,content,effects={},source,now){
 const b=fortressBook(c),f=b.supportFlags;
 for(const id of effects.grantItems??[])grantItem(c,content,id,source,now);
 for(const id of effects.handOverItems??[]){const i=c.chronicles.inventory.find(i=>i.bookId==='book2'&&i.itemId===id&&i.status==='owned'&&i.custody==='carried');if(!i)throw Error('Vật tư chưa được nhận lại hoặc đã bàn giao.');i.status='handed_over';i.custody='delivered';}
 for(const id of effects.flags??[])f[id]=true;
 for(const id of effects.retrieve??[]){const i=c.chronicles.inventory.find(i=>i.bookId==='book2'&&i.itemId===id&&i.status==='owned'&&i.custody==='stored');if(!i)throw Error('Không có lô hàng đang ký gửi.');i.custody='carried';}
 if(effects.resolveIncident){const i=b.incidentLedger.find(i=>!i.resolved);if(!i)throw Error('Không có biên bản cần giải trình.');i.resolved=true;b.securityConcern=Math.min(3,b.incidentLedger.filter(x=>!x.resolved).reduce((n,x)=>n+x.severity,0));}
 for(const note of effects.notes??[])if(!b.evidenceNotes.includes(note))b.evidenceNotes.push(note);
 f.cannonSupportReady=Boolean(f.gunpowderDelivered&&f.fuseReplaced&&f.signalReady&&f.cannonCalibrated);f.supplySupportReady=Boolean(f.medicalCrateDelivered&&f.supplyManifestVerified);
}
export function fortressServiceOptions(c,content){const a=c.chronicles?.activeSession;if(!a||c.chronicles.activeBattle)return [];return content.chronicles.book2.services.filter(s=>fortressRequirement(c,content,{...s.requires,location:s.locationId}));}
export function performFortressService(c,content,{token,serviceId},now=new Date()){
 const next=structuredClone(c),a=fortressRequireSession(next,content,token),s=content.chronicles.book2.services.find(x=>x.id===serviceId);
 if(!s||!fortressRequirement(next,content,{...s.requires,location:s.locationId}))throw Error('Không đủ giấy tờ, vật tư hoặc quyền thực hiện công việc này.');
 applyEffects(next,content,s.effects,s.label,now);a.actionRevision++;fortressBook(next).lastCompletion={serviceId,ending:s.result,reward:{}};return next;
}
export function getFortressPending(c,content,instanceId){const a=c.chronicles?.activeSession,p=a?.activeEvent,e=content.chronicleEvents[p?.eventId],step=e?.steps.find(s=>s.id===p.stepId);if(!a||!p||instanceId&&p.instanceId!==instanceId||!step)throw Error('Công việc đã thay đổi. Hãy mở lại phiên pháo đài.');return {session:a,pending:p,event:e,step};}
export function actFortressEvent(c,content,{token,instanceId,stepId,actionId},now=new Date()){
 const next=structuredClone(c),a=fortressRequireSession(next,content,token),{pending:p,event:e,step}=getFortressPending(next,content,instanceId);
 if(step.id!==stepId||step.battle||step.locationId&&a.currentLocation!==step.locationId)throw Error('Hãy đến đúng nơi để tiếp tục công việc.');
 const action=step.actions?.find(x=>x.id===actionId);if(!action||!fortressRequirement(next,content,action.requires))throw Error('Phương án không còn hợp lệ với đội hình hoặc giấy tờ hiện tại.');
 if(action.kind==='chance'&&Object.hasOwn(p.chanceResults,'sneak'))throw Error('Lần thử lén này đã có kết quả; hãy giải quyết bằng phương án khác.');
 if(action.branch)p.selectedBranchId=action.branch;else p.selectedBranchId??='interact';
 p.choiceHistory.push({stepId:step.id,actionId:action.id,party:[...next.party]});
 let destination=action.next;
 if(action.kind==='chance'){const random=seededRandom(a.rngState),success=random()<.5;p.chanceResults.sneak=success;a.rngState=random.getState();if(!success)incident(next,p,'sneak',1,now);destination=success?action.success:action.failure;}
 if(action.incident)incident(next,p,'force',2,now);
 applyEffects(next,content,action.effects,action.label,now);p.committedEffects.push(p.instanceId+':'+p.choiceHistory.length+':'+action.id);a.actionRevision++;
 if(destination!=='complete'){p.stepId=destination;p.status='scene';return next;}
 if(p.selectedBranchId==='combat'&&!p.battleWon)throw Error('Hãy hoàn tất trận chiến trước.');
 const b=fortressBook(next),list=e.intro?b.firstClearIds:b.eventClearIds,wasNew=!list.includes(e.id);if(wasNew)list.push(e.id);
 applyEffects(next,content,e.effects,e.name,now);
 if(e.id==='book2.j04')b.supportFlags.spyInvestigationResolved=true;
 if(e.finale)b.finaleCleared=true;
 if(!e.intro&&!e.hidden&&!e.finale){b.lastEventIdsByLocation[e.locationId]=[e.id,...(b.lastEventIdsByLocation[e.locationId]??[]).filter(id=>id!==e.id)].slice(0,2);b.noNewEventStreakByLocation[e.locationId]=wasNew?0:Math.min(2,(b.noNewEventStreakByLocation[e.locationId]??0)+1);}
 const reward=!e.intro&&!e.hidden&&!e.finale?fortressWeeklyReward(next,p,now):{};
 for(const [key,amount]of Object.entries(reward)){if(!Number.isSafeInteger(next[key]+amount))throw Error('Số dư vượt giới hạn.');next[key]+=amount;}
 b.lastCompletion={instanceId:p.instanceId,eventId:e.id,ending:e.ending,reward};a.activeEvent=null;return next;
}
