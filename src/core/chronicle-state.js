import {emptyFortressBook,normalizeFortressState} from './fortress-state.js';
export const emptyChronicleState=()=>({version:1,books:{book2:emptyFortressBook()},inventory:[],activeSession:null,nextSessionId:1,nextInstanceId:1,firstClearIds:[],eventClearIds:[],pendingByLocation:{},lastEventIdsByLocation:{},noNewEventStreakByLocation:{},weeklyRewardLedger:{weekKey:null,count:0,claimedInstanceIds:[]},activeBattle:null,aliceFirstEncounterCleared:false,aliceDifficultyClears:[]});
const record=x=>x&&typeof x==='object'&&!Array.isArray(x),whole=x=>Number.isSafeInteger(x)&&x>=0;
const unique=a=>Array.isArray(a)&&new Set(a).size===a.length;
export function normalizeChronicleState(input,content,campaign){
 const s=input===undefined?emptyChronicleState():structuredClone(input),fail=()=>{throw Error('Dữ liệu Biên Niên Ký không hợp lệ.');};
 if(!record(s)||s.version!==1||!whole(s.nextInstanceId)||s.nextInstanceId<1)fail();
 for(const[field,intro]of [['firstClearIds',true],['eventClearIds',false]])if(!unique(s[field])||s[field].some(id=>!content.chronicleEvents[id]||(content.chronicleEvents[id].bookId!=='book1'||content.chronicleEvents[id].intro!==intro)))fail();
 if(!record(s.pendingByLocation)||!record(s.lastEventIdsByLocation)||!record(s.noNewEventStreakByLocation)||!record(s.weeklyRewardLedger))fail();
 const ids=content.chronicles.book1.locations.map(l=>l.id),seen=new Set();
 for(const[id,p]of Object.entries(s.pendingByLocation)){
  const e=content.chronicleEvents[p?.eventId],step=e?.steps.find(x=>x.id===p.stepId);
  if(!ids.includes(id)||!record(p)||!e||e.locationId!==id||!step||!/^book1-[a-j]-[1-9][0-9]*$/.test(p.instanceId)||seen.has(p.instanceId)||!Number.isInteger(p.level)||p.level<1||p.level>40||e.code==='J04'&&p.level!==1||!Number.isInteger(p.seed)||p.seed<0||p.seed>4294967295||!['scene','battle','retry'].includes(p.status)||typeof p.startedAt!=='string'||!Number.isFinite(Date.parse(p.startedAt))||typeof p.battleWon!=='boolean'||p.battleStepId!==(e.steps.find(s=>s.battle)?.id??null))fail();
  const r=p.rewardRoll;if(!record(r)||!['coins','prismaFragments','recruitmentShards'].includes(r.currency)||!whole(r.amount)||r.amount<1||r.currency==='coins'&&(r.amount<100||r.amount>200)||r.currency==='prismaFragments'&&(r.amount<10||r.amount>20)||r.currency==='recruitmentShards'&&r.amount!==1)fail();
  if(p.battleSnapshot!==null){const b=p.battleSnapshot;if(!e.encounterId||!record(b)||b.encounterId!==e.encounterId||!whole(b.rngState)||b.rngState>4294967295||typeof b.state!=='string'||b.state.length>2_000_000)fail();let state;try{state=JSON.parse(b.state);}catch{fail();}if(!state||state.encounterId!==e.encounterId||state.enemyLevel!==p.level||state.chronicle?.instanceId!==p.instanceId||!Array.isArray(state.actors)||state.actors.length>8||state.actors.some(a=>!record(a)||!record(a.stats)||!Number.isFinite(a.hp)||a.hp<0||a.hp>a.stats.maxHp||!content.characters[a.definitionId]&&!content.enemies[a.definitionId]))fail();}
  seen.add(p.instanceId);
 }
 for(const[id,list]of Object.entries(s.lastEventIdsByLocation))if(!ids.includes(id)||!unique(list)||list.length>2||list.some(key=>content.chronicleEvents[key]?.locationId!==id||content.chronicleEvents[key].hidden||content.chronicleEvents[key].intro))fail();
 for(const[id,n]of Object.entries(s.noNewEventStreakByLocation))if(!ids.includes(id)||!whole(n)||n>2)fail();
 const l=s.weeklyRewardLedger;if(l.weekKey!==null&&(typeof l.weekKey!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(l.weekKey)||!Number.isFinite(Date.parse(l.weekKey))||new Date(l.weekKey+'T00:00:00Z').getUTCDay()!==1)||!whole(l.count)||l.count>28||!unique(l.claimedInstanceIds)||l.claimedInstanceIds.length!==l.count||l.claimedInstanceIds.some(id=>typeof id!=='string'||!/^book[12]-[a-j]-[1-9][0-9]*$/.test(id))||l.weekKey===null&&l.count)fail();
 if(typeof s.aliceFirstEncounterCleared!=='boolean'||!unique(s.aliceDifficultyClears)||s.aliceDifficultyClears.some(n=>![60,70,80,90].includes(n))||!s.aliceFirstEncounterCleared&&s.aliceDifficultyClears.length)fail();
 const legacy=campaign.claimedFirstClearRewards?.includes('alice_superboss');
 if(legacy)s.aliceFirstEncounterCleared=true;
 if(s.eventClearIds.includes('book1.j04')!==s.aliceFirstEncounterCleared&&!legacy)fail();
 if(s.activeBattle!==null&&s.activeBattle!=='book2'&&(!ids.includes(s.activeBattle)||!s.pendingByLocation[s.activeBattle]?.battleSnapshot||s.pendingByLocation[s.activeBattle].status!=='battle'))fail();
 return normalizeFortressState(s,content,campaign);
}
