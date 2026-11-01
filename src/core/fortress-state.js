import {createFortressParty} from './fortress-session.js';
// Book II is additive: Book I's pending locations and weekly ledger keep their format.
export const FORTRESS_FLAGS=['powderTransferDelegation','assignedMedicalTransfer','transferRequested','medicalCrateReceived','medicalCrateDelivered','supplyManifestVerified','supplySupportReady','gunpowderReceived','gunpowderDelivered','fuseReplaced','signalReady','cannonCalibrated','cannonSupportReady','spyInvestigationResolved'];
export const emptyFortressBook=()=>({firstClearIds:[],eventClearIds:[],lastEventIdsByLocation:{},noNewEventStreakByLocation:{},evidenceNotes:[],incidentLedger:[],securityConcern:0,supportFlags:Object.fromEntries(FORTRESS_FLAGS.map(k=>[k,false])),finaleCleared:false,suspendedEvent:null,lastCompletion:null,activityLog:[]});
const record=x=>x&&typeof x==='object'&&!Array.isArray(x),uint=x=>Number.isSafeInteger(x)&&x>=0,unique=a=>Array.isArray(a)&&new Set(a).size===a.length,date=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
export function normalizeFortressState(s,content,campaign){
 const fail=()=>{throw Error('Dữ liệu phiên pháo đài không hợp lệ.');};
 s.books??={};s.books.book2??=emptyFortressBook();s.inventory??=[];s.activeSession??=null;s.nextSessionId??=1;
 const book=s.books.book2,definition=content.chronicles.book2;
 book.activityLog??=[];
 if(!definition||!record(s.books)||!record(book)||!uint(s.nextSessionId)||s.nextSessionId<1||!Array.isArray(s.inventory)||s.inventory.length>100)fail();
 for(const[field,intro]of [['firstClearIds',true],['eventClearIds',false]])if(!unique(book[field])||book[field].some(id=>content.chronicleEvents[id]?.bookId!=='book2'||content.chronicleEvents[id]?.intro!==intro))fail();
 if(!record(book.supportFlags)||FORTRESS_FLAGS.some(k=>typeof book.supportFlags[k]!=='boolean')||Object.keys(book.supportFlags).some(k=>!FORTRESS_FLAGS.includes(k)))fail();
 const flags=book.supportFlags;
 if(flags.cannonSupportReady!==Boolean(flags.gunpowderDelivered&&flags.fuseReplaced&&flags.signalReady&&flags.cannonCalibrated)||flags.supplySupportReady!==Boolean(flags.medicalCrateDelivered&&flags.supplyManifestVerified))fail();
 if(typeof book.finaleCleared!=='boolean'||book.finaleCleared!==book.eventClearIds.includes('book2.finale')||flags.spyInvestigationResolved!==book.eventClearIds.includes('book2.j04'))fail();
 const itemKeys=new Set();
 for(const item of s.inventory){const d=definition.items[item?.itemId];if(!record(item)||item.bookId!=='book2'||!d||itemKeys.has(item.itemId)||!['owned','used','handed_over','invalidated'].includes(item.status)||!['carried','stored','delivered','archive'].includes(item.custody)||item.scope!==d.scope||!date(item.acquiredAt)||typeof item.provenance!=='string'||!item.provenance||item.provenance.length>250||item.status==='handed_over'&&item.custody!=='delivered'||!d.military&&item.custody==='stored')fail();itemKeys.add(item.itemId);}
 for(const [flag,item] of [['gunpowderDelivered','gunpowder_crate'],['medicalCrateDelivered','medical_crate'],['fuseReplaced','fuse_replacement']])if(flags[flag]&&!s.inventory.some(i=>i.itemId===item&&i.status==='handed_over'))fail();
 if(!Array.isArray(book.incidentLedger)||book.incidentLedger.length>1000||!unique(book.incidentLedger.map(i=>i?.id)))fail();
 for(const i of book.incidentLedger)if(!record(i)||!/^book2-[a-j]-\d+:(force|sneak)$/.test(i.id)||![1,2].includes(i.severity)||typeof i.resolved!=='boolean'||!date(i.createdAt))fail();
 if(book.securityConcern!==Math.min(3,book.incidentLedger.filter(i=>!i.resolved).reduce((n,i)=>n+i.severity,0)))fail();
 if(!unique(book.evidenceNotes)||book.evidenceNotes.length>100||book.evidenceNotes.some(x=>typeof x!=='string'||!x||x.length>1000))fail();
 for(const field of ['lastEventIdsByLocation','noNewEventStreakByLocation'])if(!record(book[field]))fail();
 for(const[id,list]of Object.entries(book.lastEventIdsByLocation))if(!definition.locations.some(l=>l.id===id)||!unique(list)||list.length>2||list.some(k=>content.chronicleEvents[k]?.bookId!=='book2'||content.chronicleEvents[k]?.locationId!==id||content.chronicleEvents[k]?.hidden||content.chronicleEvents[k]?.intro))fail();
 for(const[id,n]of Object.entries(book.noNewEventStreakByLocation))if(!definition.locations.some(l=>l.id===id)||!uint(n)||n>2)fail();
 function pending(p){
  const e=content.chronicleEvents[p?.eventId],step=e?.steps.find(x=>x.id===p.stepId);
  if(!record(p)||e?.bookId!=='book2'||!step||p.originLocation!==e.locationId||p.battleStepId!==(e.steps.find(st=>st.battle)?.id??null)||!/^book2-[a-j]-[1-9]\d*$/.test(p.instanceId)||!date(p.startedAt)||!uint(p.seed)||p.seed>4294967295||!Number.isInteger(p.level)||p.level<1||p.level>40||e.finale&&p.level!==1||!['scene','battle','retry'].includes(p.status)||typeof p.battleWon!=='boolean'||!Array.isArray(p.choiceHistory)||p.choiceHistory.length>100||!record(p.chanceResults)||!unique(p.committedEffects)||p.committedEffects.length>200||p.selectedBranchId!==null&&!e.branches.includes(p.selectedBranchId))fail();
  for(const h of p.choiceHistory)if(!record(h)||typeof h.actionId!=='string'||!e.steps.some(st=>st.id===h.stepId&&st.actions?.some(a=>a.id===h.actionId)))fail();
  if(Object.entries(p.chanceResults).some(([k,v])=>k!=='sneak'||typeof v!=='boolean'))fail();
  const r=p.rewardRoll;if(!record(r)||!['coins','prismaFragments','recruitmentShards'].includes(r.currency)||!uint(r.amount)||r.currency==='coins'&&(r.amount<100||r.amount>200)||r.currency==='prismaFragments'&&(r.amount<10||r.amount>20)||r.currency==='recruitmentShards'&&r.amount!==1)fail();
  if(p.battleSnapshot!==null){const b=p.battleSnapshot;if(!record(b)||b.encounterId!==e.encounterId||!uint(b.rngState)||b.rngState>4294967295||typeof b.state!=='string'||b.state.length>2e6)fail();let state;try{state=JSON.parse(b.state);}catch{fail();}if(!state||state.encounterId!==e.encounterId||state.enemyLevel!==p.level||state.chronicle?.bookId!=='book2'||state.chronicle?.instanceId!==p.instanceId||!Array.isArray(state.actors)||state.actors.length>8||state.actors.some(a=>!record(a)||!record(a.stats)||!Number.isFinite(a.hp)||a.hp<0||a.hp>a.stats.maxHp||!content.characters[a.definitionId]&&!content.enemies[a.definitionId]))fail();}
  if(p.status==='battle'&&!p.battleSnapshot||p.battleWon&&p.selectedBranchId!=='combat')fail();
 }
 if(!Array.isArray(book.activityLog)||book.activityLog.length>200||!unique(book.activityLog.map(x=>x?.id)))fail();
 for(const log of book.activityLog)if(!record(log)||typeof log.id!=='string'||!/^fortress-[1-9]\d*$/.test(log.sessionId)||!definition.locations.some(l=>l.id===log.locationId)||!['activity','service','battle','rest','travel'].includes(log.kind)||typeof log.message!=='string'||!log.message||log.message.length>2000||!date(log.at)||!record(log.reward)||Object.entries(log.reward).some(([k,v])=>!['coins','prismaFragments','recruitmentShards'].includes(k)||!uint(v)))fail();
 if(s.activeSession!==null){const a=s.activeSession;
 if(a.partyIds===undefined&&a.partyVitals===undefined&&a.restUsed===undefined){const initial=createFortressParty(campaign,content,a.activeEvent?.battleSnapshot);Object.assign(a,initial);}
 if(!Array.isArray(a.partyIds)||JSON.stringify(a.partyIds)!==JSON.stringify(campaign.party)||!record(a.partyVitals)||typeof a.restUsed!=='boolean'||Object.keys(a.partyVitals).length!==a.partyIds.filter(Boolean).length||a.partyIds.filter(Boolean).some(id=>{const v=a.partyVitals[id];return !record(v)||!['hp','mp','maxHp','maxMp'].every(k=>uint(v[k]))||v.maxHp<1||v.hp>v.maxHp||v.mp>v.maxMp||v.maxHp>1e9||v.maxMp>1e9;}))fail();
 if(!record(a)||a.bookId!=='book2'||a.status!=='active'||!/^fortress-[1-9]\d*$/.test(a.sessionId)||!definition.locations.some(l=>l.id===a.currentLocation)||!date(a.startedAt)||!uint(a.rngState)||a.rngState>4294967295||!uint(a.actionRevision)||!s.firstClearIds.includes('book1.intro.f10')||book.suspendedEvent!==null)fail();if(a.activeEvent!==null)pending(a.activeEvent);}
 if(book.suspendedEvent!==null){if(s.activeSession!==null)fail();pending(book.suspendedEvent);if(book.suspendedEvent.status==='battle')fail();}
 if(s.activeBattle==='book2'&&(!s.activeSession?.activeEvent?.battleSnapshot||s.activeSession.activeEvent.status!=='battle'))fail();
 if(s.activeSession&&s.activeBattle&&s.activeBattle!=='book2')fail();
 return s;
}
