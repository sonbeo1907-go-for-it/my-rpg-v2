export const MAX_FARM_RUNS=999;
export const FARM_CURRENCIES=['coins','prisma','recruitmentShards','originalPrisma','prismaFragments','blueprints','limitBreakStones','xpBooksGreen','xpBooksBlue','xpBooksPurple'];
export function farmLimit(value){if(!Number.isSafeInteger(value)||value<1||value>MAX_FARM_RUNS)throw Error('Số lượt farm phải là số nguyên từ 1 đến 999.');return value;}
export function validateFarmTarget(content,target){
 if(target?.kind==='quest'){const e=content.encounters[target.id];if(!e||e.travelerStory||e.trialId||e.category==='chronicle')throw Error('Nội dung này không hỗ trợ farm lặp lại.');}
 else if(target?.kind==='dungeon'){if(!content.dungeons[target.id]||content.dungeons[target.id].closed)throw Error('Hầm ngục chưa mở.');}
 else if(target?.kind==='battle'&&content.encounters[target.id]?.trialId)throw Error('Biên niên ký này không hỗ trợ farm lặp lại.');
 else if(target?.kind!=='battle')throw Error('Mục tiêu farm không hợp lệ.');
}
export function createFarmSession(target,limit,sessionId){return {target:structuredClone(target),limit:farmLimit(limit),sessionId,settled:[],enabled:true,enteredBattle:false,completed:0,wins:0,losses:0,draws:0,totals:{},xp:{},reason:'Đang chiến đấu'};}
export function stopFarmSession(state,reason='Đã dừng theo yêu cầu'){return state?{...state,enabled:false,reason}:null;}
export function recordFarmResult(state,sessionId,battle,before,after){
 if(!state||state.sessionId!==sessionId||state.settled.includes(sessionId)||!battle.outcome)return state;
 if(battle.outcome==='victory'&&!battle.rewardClaimed)return state;
 const next={...state,settled:[...state.settled,sessionId],completed:state.completed+1,totals:{...state.totals},xp:{...state.xp}};
 if(battle.outcome==='victory'){
  next.wins++;for(const key of FARM_CURRENCIES){const n=Math.max(0,(after?.[key]??0)-(before?.[key]??0));if(n)next.totals[key]=(next.totals[key]??0)+n;}
  for(const r of battle.xpAwards??[])next.xp[r.characterId]=(next.xp[r.characterId]??0)+r.accepted;
  next.reason=next.completed>=next.limit?'Đã hoàn thành số lượt đã chọn':'Đã lưu thưởng · Chuẩn bị trận tiếp';
  if(next.completed>=next.limit)next.enabled=false;
  if(!state.enabled)next.reason='Đã dừng · Thưởng trận vừa chơi đã lưu';
 }else{if(battle.outcome==='defeat')next.losses++;else next.draws++;next.enabled=false;next.reason=battle.outcome==='defeat'?'Dừng vì đội hình đã thua':'Dừng vì trận đấu hòa';}
 return next;
}
