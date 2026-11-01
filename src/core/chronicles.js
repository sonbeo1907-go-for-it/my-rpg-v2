import {emptyChronicleState} from './chronicle-state.js';
import {chronicleWeek,chroniclePartyLevel,chronicleLocation,chronicleEventReady,chronicleLocationOpen,chronicleObservationReady} from './chronicle-rules.js';
export * from './chronicle-rules.js';
export function chronicleLedger(state,now=new Date()){const key=chronicleWeek(now),l=state.weeklyRewardLedger;return !l.weekKey||key>l.weekKey?{weekKey:key,count:0,claimedInstanceIds:[]}:l;}
function roll(random){const x=random();if(!Number.isFinite(x)||x<0||x>=1)throw Error('Nguồn ngẫu nhiên không hợp lệ.');return x;}
function weighted(items,random){let cursor=roll(random)*items.reduce((n,i)=>n+i.weight,0);for(const i of items){cursor-=i.weight;if(cursor<0)return i.event;}return items.at(-1).event;}
export function chooseChronicleEvent(content,state,locationId,random=Math.random){
 const l=chronicleLocation(content,locationId);if(!chronicleLocationOpen(content,state,locationId))throw Error('Địa điểm chưa được khám phá.');
 if(!state.firstClearIds.includes(l.introId))return content.chronicleEvents[l.introId];
 const candidates=Object.values(content.chronicleEvents).filter(e=>!e.intro&&e.locationId===locationId&&e.code!=='J04'&&chronicleEventReady(content,state,e));
 const hidden=candidates.find(e=>e.hidden&&!state.eventClearIds.includes(e.id));if(hidden)return hidden;
 let ordinary=candidates.filter(e=>!e.hidden),unseen=ordinary.filter(e=>!state.eventClearIds.includes(e.id));
 if(!ordinary.length)throw Error('Chưa có hoạt động ở địa điểm này.');
 if((state.noNewEventStreakByLocation[locationId]??0)>=2&&unseen.length)ordinary=unseen;
 const last=state.lastEventIdsByLocation[locationId]?.[0];if(ordinary.length>1)ordinary=ordinary.filter(e=>e.id!==last);
 const countNpc=candidates.filter(e=>!e.hidden&&!e.encounterId).length,countCombat=candidates.filter(e=>!e.hidden&&e.encounterId).length;
 return weighted(ordinary.map(event=>({event,weight:(event.encounterId?(1-l.npcWeight)/Math.max(1,countCombat):l.npcWeight/Math.max(1,countNpc))*(state.eventClearIds.includes(event.id)?1:3)})),random);
}
export function beginChronicleEvent(campaign,content,locationId,{observe=false,random=Math.random,now=new Date()}={}){
 const next=structuredClone(campaign),s=next.chronicles??=emptyChronicleState();if(s.activeSession)throw Error('Hãy rời pháo đài qua cổng trước khi mở quyển khác.');if(s.activeBattle)throw Error('Hãy tiếp tục trận chiến đang diễn ra.');
 if(s.pendingByLocation[locationId])return next;
 if(!chronicleLocationOpen(content,s,locationId))throw Error('Địa điểm chưa được khám phá.');
 const event=observe?content.chronicleEvents['book1.j04']:chooseChronicleEvent(content,s,locationId,random);
 if(observe&&(locationId!=='j'||!chronicleObservationReady(content,s)))throw Error('Không có tương tác ở đây.');
 const type=roll(random),currency=type<.75?'coins':type<.95?'prismaFragments':'recruitmentShards';const amount=currency==='coins'?100+Math.floor(roll(random)*101):currency==='prismaFragments'?10+Math.floor(roll(random)*11):1;
 const p={instanceId:'book1-'+locationId+'-'+s.nextInstanceId++,eventId:event.id,locationId,stepId:event.steps[0].id,status:'scene',startedAt:now.toISOString(),rewardRoll:{currency,amount},level:event.code==='J04'?1:chroniclePartyLevel(campaign),seed:Math.floor(roll(random)*4294967296),battleWon:false,battleStepId:event.steps.find(s=>s.battle)?.id??null,battleSnapshot:null};s.pendingByLocation[locationId]=p;return next;
}
export function getChroniclePending(campaign,content,locationId,instanceId){const p=campaign.chronicles.pendingByLocation[locationId];if(!p||instanceId&&p.instanceId!==instanceId)throw Error('Sự kiện đã thay đổi. Hãy mở lại địa điểm.');const event=content.chronicleEvents[p.eventId],step=event.steps.find(s=>s.id===p.stepId);if(!step)throw Error('Bước sự kiện không hợp lệ.');return {pending:p,event,step};}
export function actChronicle(campaign,content,{locationId,instanceId,stepId,actionId},now=new Date()){
 const next=structuredClone(campaign),s=next.chronicles;if(s.activeSession)throw Error('Hãy rời phiên pháo đài trước.');if(s.activeBattle)throw Error('Hãy kết thúc trận chiến trước.');const{pending:p,event,step}=getChroniclePending(next,content,locationId,instanceId);if(p.stepId!==stepId||step.battle)throw Error('Bước sự kiện đã thay đổi.');const action=step.actions.find(a=>a.id===actionId);if(!action)throw Error('Thao tác không hợp lệ.');
 if(action.next!=='complete'){p.stepId=action.next;p.status='scene';return next;}
 if(event.encounterId&&!p.battleWon)throw Error('Chưa hoàn thành trận chiến.');
 const wasNew=!(event.intro?s.firstClearIds:s.eventClearIds).includes(event.id);if(wasNew)(event.intro?s.firstClearIds:s.eventClearIds).push(event.id);
 if(!event.intro&&!event.hidden){s.lastEventIdsByLocation[locationId]=[event.id,...(s.lastEventIdsByLocation[locationId]??[]).filter(id=>id!==event.id)].slice(0,2);s.noNewEventStreakByLocation[locationId]=wasNew?0:Math.min(2,(s.noNewEventStreakByLocation[locationId]??0)+1);}
 let reward={};if(event.code==='J04')s.aliceFirstEncounterCleared=true;else if(event.intro&&wasNew)reward=event.firstReward??{};else if(!event.intro){const ledger=chronicleLedger(s,now);s.weeklyRewardLedger=ledger;if(ledger.count<content.chronicles.book1.weeklyRewards){ledger.count++;ledger.claimedInstanceIds.push(p.instanceId);reward={[p.rewardRoll.currency]:p.rewardRoll.amount};}}
 for(const[key,amount]of Object.entries(reward)){if(!Number.isSafeInteger(next[key])||!Number.isSafeInteger(next[key]+amount))throw Error('Số dư vượt giới hạn.');next[key]+=amount;}
 s.lastCompletion={instanceId:p.instanceId,locationId,eventId:event.id,reward,ending:event.ending};delete s.pendingByLocation[locationId];return next;
}
