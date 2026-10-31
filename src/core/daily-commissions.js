import {dungeonDay} from './dungeon-rules.js';
export const DAILY_TASKS=[
 {id:'login',name:'Đăng nhập vào game',counter:'loggedIn',target:1,reward:{prisma:1}},
 {id:'quest_1',name:'Hoàn thành 1 quest Thảo phạt',counter:'questClears',target:1,reward:{coins:1000}},
 {id:'quest_3',name:'Hoàn thành 3 quest Thảo phạt',counter:'questClears',target:3,reward:{coins:1500}},
 {id:'quest_5',name:'Hoàn thành 5 quest Thảo phạt',counter:'questClears',target:5,reward:{coins:2000}},
 {id:'dungeon',name:'Hoàn thành 1 lượt thám hiểm',counter:'dungeonClears',target:1,reward:{recruitmentShards:3}},
 {id:'training',name:'Hoàn thành 1 Rèn Luyện hoặc Phá Giới',counter:'trainingClears',target:1,reward:{sweepTickets:2}},
];
export const DAILY_MILESTONES=[
 {id:'1',target:1,reward:{coins:500}},{id:'2',target:2,reward:{recruitmentShards:3}},
 {id:'3',target:3,reward:{sweepTickets:2}},{id:'4',target:4,reward:{coins:1500}},
 {id:'5',target:5,reward:{recruitmentShards:5}},{id:'6',target:6,reward:{originalPrisma:1}},
];
export const emptyDailyCommissions=()=>({version:2,day:null,loggedIn:false,questClears:0,dungeonClears:0,trainingClears:0,claimedTasks:[],claimedMilestones:[],legacyMilestoneClaims:[]});
const completed=(state,task)=>Number(state[task.counter])>=task.target;
export function normalizeDailyCommissions(input){
 if(input===undefined)return emptyDailyCommissions();
 const fail=()=>{throw Error('Dữ liệu Ủy Thác Hằng Ngày không hợp lệ.');};
 if(!input||typeof input!=='object'||Array.isArray(input))fail();
 const legacy=input.version===undefined;if(!legacy&&input.version!==2)fail();
 const {day,loggedIn,questClears,dungeonClears,claimedTasks}=input;
 if(day!==null&&(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day+'T00:00:00Z'))||new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day))fail();
 const trainingClears=legacy?0:input.trainingClears;
 if(typeof loggedIn!=='boolean'||!Number.isSafeInteger(questClears)||questClears<0||questClears>5||!Number.isSafeInteger(dungeonClears)||dungeonClears<0||dungeonClears>1||!Number.isInteger(trainingClears)||trainingClears<0||trainingClears>1||trainingClears>dungeonClears)fail();
 const valid=(list,ids)=>Array.isArray(list)&&new Set(list).size===list.length&&list.every(id=>ids.includes(id));
 if(!valid(claimedTasks,DAILY_TASKS.filter(t=>!legacy||t.id!=='training').map(t=>t.id)))fail();
 let claimedMilestones=input.claimedMilestones,legacyMilestoneClaims=legacy?[]:input.legacyMilestoneClaims;
 const state={version:2,day,loggedIn,questClears,dungeonClears,trainingClears,claimedTasks:[...claimedTasks],claimedMilestones:[],legacyMilestoneClaims:[]};
 const count=DAILY_TASKS.filter(task=>completed(state,task)).length;
 if(legacy){if(!valid(claimedMilestones,['1','2','3','4','5'])||claimedMilestones.some(id=>Number(id)>count))fail();claimedMilestones=claimedMilestones.map(id=>String(Number(id)>=3?Number(id)+1:Number(id)));legacyMilestoneClaims=claimedMilestones.filter(id=>Number(id)>count);}
 if(!valid(claimedMilestones,DAILY_MILESTONES.map(m=>m.id))||!valid(legacyMilestoneClaims,['4','5','6'])||legacyMilestoneClaims.some(id=>!claimedMilestones.includes(id)))fail();
 if(day===null&&(loggedIn||questClears||dungeonClears||trainingClears||claimedTasks.length||claimedMilestones.length))fail();
 if((questClears||dungeonClears)&&!loggedIn)fail();
 if(claimedTasks.some(id=>!completed(state,DAILY_TASKS.find(t=>t.id===id)))||claimedMilestones.some(id=>Number(id)>count&&!legacyMilestoneClaims.includes(id)))fail();
 return {...state,claimedMilestones:[...claimedMilestones],legacyMilestoneClaims:[...legacyMilestoneClaims]};
}
function dayState(campaign,now){const s=normalizeDailyCommissions(campaign.dailyCommissions),today=dungeonDay(now);return !s.day||today>s.day?{...emptyDailyCommissions(),day:today}:s;}
export function needsDailyVisit(campaign,now=new Date()){return !dayState(campaign,now).loggedIn;}
export function visitDailyCommissions(campaign,now=new Date()){const next=structuredClone(campaign);next.dailyCommissions=dayState(campaign,now);next.dailyCommissions.loggedIn=true;return next;}
export function recordDailyClear(campaign,kind,now=new Date()){
 const s=dayState(campaign,now);s.loggedIn=true;
 if(kind==='quest')s.questClears=Math.min(5,s.questClears+1);else if(kind==='dungeon')s.dungeonClears=1;else if(kind==='training'){s.trainingClears=1;s.dungeonClears=1;}else throw Error('Loại tiến độ ngày không hợp lệ.');campaign.dailyCommissions=s;
}
export function dailyCommissionView(campaign,now=new Date()){
 const state=dayState(campaign,now),count=DAILY_TASKS.filter(t=>completed(state,t)).length;
 const tasks=DAILY_TASKS.map(t=>({...t,key:'task:'+t.id,progress:Math.min(t.target,Number(state[t.counter])),complete:completed(state,t),claimed:state.claimedTasks.includes(t.id)}));
 const milestones=DAILY_MILESTONES.map(m=>({...m,key:'milestone:'+m.id,complete:count>=m.target,claimed:state.claimedMilestones.includes(m.id)}));
 return {day:state.day,loggedIn:state.loggedIn,count,total:DAILY_TASKS.length,tasks,milestones,available:[...tasks,...milestones].filter(i=>i.complete&&!i.claimed)};
}
export function claimDailyCommissions(campaign,keys,now=new Date()){
 const next=visitDailyCommissions(campaign,now),view=dailyCommissionView(next,now),requested=keys??view.available.map(i=>i.key);
 if(!Array.isArray(requested)||!requested.length||requested.length>12||new Set(requested).size!==requested.length)throw Error('Chưa có phần thưởng ngày để nhận.');
 const items=requested.map(key=>view.available.find(i=>i.key===key));if(items.some(i=>!i))throw Error('Phần thưởng chưa hoàn thành hoặc đã nhận.');
 for(const item of items){for(const[k,n]of Object.entries(item.reward)){if(!Number.isSafeInteger(next[k])||next[k]<0||!Number.isSafeInteger(next[k]+n))throw Error('Số dư vượt giới hạn.');next[k]+=n;}next.dailyCommissions[item.key.startsWith('task:')?'claimedTasks':'claimedMilestones'].push(item.id);}return next;
}
