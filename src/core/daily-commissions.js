import {dungeonDay} from './dungeon-rules.js';

export const DAILY_TASKS=[
 {id:'login',name:'Đăng nhập vào game',counter:'loggedIn',target:1,reward:{prisma:1}},
 {id:'quest_1',name:'Hoàn thành 1 quest Thảo phạt',counter:'questClears',target:1,reward:{coins:1000}},
 {id:'quest_3',name:'Hoàn thành 3 quest Thảo phạt',counter:'questClears',target:3,reward:{coins:1500}},
 {id:'quest_5',name:'Hoàn thành 5 quest Thảo phạt',counter:'questClears',target:5,reward:{coins:2000}},
 {id:'dungeon',name:'Hoàn thành 1 lượt thám hiểm',counter:'dungeonClears',target:1,reward:{recruitmentShards:3}},
];
export const DAILY_MILESTONES=[
 {id:'1',target:1,reward:{coins:500}},
 {id:'2',target:2,reward:{recruitmentShards:3}},
 {id:'3',target:3,reward:{coins:1500}},
 {id:'4',target:4,reward:{recruitmentShards:5}},
 {id:'5',target:5,reward:{originalPrisma:1}},
];
export const emptyDailyCommissions=()=>({day:null,loggedIn:false,questClears:0,dungeonClears:0,claimedTasks:[],claimedMilestones:[]});
const completed=(state,task)=>Number(state[task.counter])>=task.target;
export function normalizeDailyCommissions(input){
 if(input===undefined)return emptyDailyCommissions();
 const fail=()=>{throw new Error('Dữ liệu Ủy Thác Hằng Ngày không hợp lệ.');};
 if(!input||typeof input!=='object'||Array.isArray(input))fail();
 const {day,loggedIn,questClears,dungeonClears,claimedTasks,claimedMilestones}=input;
 if(day!==null&&(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day+'T00:00:00Z'))||new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day))fail();
 if(typeof loggedIn!=='boolean'||!Number.isSafeInteger(questClears)||questClears<0||questClears>5||!Number.isSafeInteger(dungeonClears)||dungeonClears<0||dungeonClears>1)fail();
 const validClaims=(list,defs)=>Array.isArray(list)&&new Set(list).size===list.length&&list.every(id=>defs.some(def=>def.id===id));
 if(!validClaims(claimedTasks,DAILY_TASKS)||!validClaims(claimedMilestones,DAILY_MILESTONES))fail();
 if(day===null&&(loggedIn||questClears||dungeonClears||claimedTasks.length||claimedMilestones.length))fail();
 if((questClears||dungeonClears)&&!loggedIn)fail();
 const state={day,loggedIn,questClears,dungeonClears,claimedTasks:[...claimedTasks],claimedMilestones:[...claimedMilestones]};
 const count=DAILY_TASKS.filter(task=>completed(state,task)).length;
 if(claimedTasks.some(id=>!completed(state,DAILY_TASKS.find(task=>task.id===id)))||claimedMilestones.some(id=>DAILY_MILESTONES.find(m=>m.id===id).target>count))fail();
 return state;
}
function dayState(campaign,now){
 const state=normalizeDailyCommissions(campaign.dailyCommissions),today=dungeonDay(now);
 // Never grant another reset by moving the device clock backwards.
 return !state.day||today>state.day?{...emptyDailyCommissions(),day:today}:state;
}
export function needsDailyVisit(campaign,now=new Date()) {return !dayState(campaign,now).loggedIn;}
export function visitDailyCommissions(campaign,now=new Date()){
 const next=structuredClone(campaign);next.dailyCommissions=dayState(campaign,now);next.dailyCommissions.loggedIn=true;return next;
}
// Call only on the transaction clone whose victory rewards are committed together.
export function recordDailyClear(campaign,kind,now=new Date()){
 const state=dayState(campaign,now);state.loggedIn=true;
 if(kind==='quest')state.questClears=Math.min(5,state.questClears+1);
 else if(kind==='dungeon')state.dungeonClears=1;
 else throw new Error('Loại tiến độ ngày không hợp lệ.');
 campaign.dailyCommissions=state;
}
export function dailyCommissionView(campaign,now=new Date()){
 const state=dayState(campaign,now),count=DAILY_TASKS.filter(task=>completed(state,task)).length;
 const tasks=DAILY_TASKS.map(task=>({...task,key:'task:'+task.id,progress:Math.min(task.target,Number(state[task.counter])),complete:completed(state,task),claimed:state.claimedTasks.includes(task.id)}));
 const milestones=DAILY_MILESTONES.map(m=>({...m,key:'milestone:'+m.id,complete:count>=m.target,claimed:state.claimedMilestones.includes(m.id)}));
 const available=[...tasks,...milestones].filter(item=>item.complete&&!item.claimed);
 return {day:state.day,loggedIn:state.loggedIn,count,tasks,milestones,available};
}
export function claimDailyCommissions(campaign,keys,now=new Date()){
 const next=visitDailyCommissions(campaign,now),view=dailyCommissionView(next,now);
 const requested=keys??view.available.map(item=>item.key);
 if(!Array.isArray(requested)||!requested.length||requested.length>10||new Set(requested).size!==requested.length)throw new Error('Chưa có phần thưởng ngày để nhận.');
 const items=requested.map(key=>view.available.find(item=>item.key===key));
 if(items.some(item=>!item))throw new Error('Phần thưởng chưa hoàn thành hoặc đã nhận.');
 for(const item of items){
  for(const [currency,amount] of Object.entries(item.reward)){
   if(!Number.isSafeInteger(next[currency])||next[currency]<0||!Number.isSafeInteger(next[currency]+amount))throw new Error('Số dư vượt giới hạn cho phép.');
   next[currency]+=amount;
  }
  next.dailyCommissions[item.key.startsWith('task:')?'claimedTasks':'claimedMilestones'].push(item.id);
 }
 return next;
}
