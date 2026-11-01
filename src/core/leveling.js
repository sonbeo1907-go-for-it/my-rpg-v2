import {normalizeSkillRanks,skillRules} from './skill-rules.js';
import {validateEnemyScalingRules} from './enemy-scaling.js';
// Character progression is flat base growth; equipment and percentage buffs apply afterwards.
export const ALLOCATION_STATS=['maxHp','maxMp','attack','magic','defense','resistance','speed'];
export const levelRules=content=>content.progressionRules.default;
const whole=n=>Number.isSafeInteger(n)&&n>=0;
export const levelCap=(state,content)=>levelRules(content).caps[state.limitBreakRank??0];
export function xpRequired(content,level){const r=levelRules(content);if(!Number.isInteger(level)||level<1||level>r.maxLevel)throw Error('Cấp độ không hợp lệ.');return level===r.maxLevel?0:r.xp.base+r.xp.linear*(level-1)+r.xp.quadratic*(level-1)**2;}
export function allocationLimit(content,level,key){const r=levelRules(content).allocations[key];if(!r)throw Error('Chỉ số phân bổ không hợp lệ.');return Math.min(r.max,Math.ceil((level-1)/r.everyLevels));}
export function allocationSpent(content,allocations){return Object.entries(allocations).reduce((n,[key,count])=>n+count*levelRules(content).allocations[key].cost,0);}
export function unspentPoints(content,state){return state.level-1-allocationSpent(content,state.allocations??{});}
export function normalizeLevelState(content,state,{legacy=false}={}){
 if(!state||!Number.isInteger(state.level)||state.level<1||state.level>(legacy?99:levelRules(content).maxLevel))throw Error('Cấp độ nhân vật không hợp lệ.');
 const level=Math.min(levelRules(content).maxLevel,state.level),rank=legacy?Math.max(0,Math.ceil((level-20)/10)):state.limitBreakRank;
 const xp=legacy?0:state.xp,allocations=legacy?{}:state.allocations;
 if(!Number.isInteger(rank)||rank<0||rank>3||level>levelRules(content).caps[rank]||rank>0&&level<levelRules(content).caps[rank-1]||!whole(xp)||!allocations||typeof allocations!=='object'||Array.isArray(allocations))throw Error('Tiến trình cấp độ không hợp lệ.');
 for(const [key,count]of Object.entries(allocations))if(!ALLOCATION_STATS.includes(key)||!whole(count)||count>allocationLimit(content,level,key))throw Error('Điểm phân bổ vượt giới hạn.');
 const result={level,xp,allocations:{...allocations},limitBreakRank:rank,skillRanks:normalizeSkillRanks(state.skillRanks,level,skillRules(content)),upgradeIds:[...(state.upgradeIds??[])]};
 if(unspentPoints(content,result)<0||level===levelRules(content).maxLevel&&xp!==0||level<levelRules(content).maxLevel&&(xp>xpRequired(content,level)||level<levelCap(result,content)&&xp===xpRequired(content,level)))throw Error('EXP hoặc số điểm phân bổ không hợp lệ.');
 return result;
}
export function allocationBonuses(content,state){return Object.fromEntries(Object.entries(state.allocations??{}).filter(([,n])=>n>0).map(([key,n])=>[key,n*levelRules(content).allocations[key].gain]));}
export function grantCharacterXp(campaign,content,id,amount){
 if(!whole(amount)||!campaign.unlockedCharacterIds.includes(id))throw Error('Người nhận hoặc EXP không hợp lệ.');
 const state=campaign.characters[id],before=state.level,oldXp=state.xp;normalizeLevelState(content,state);let available=oldXp+amount;
 if(!Number.isSafeInteger(available))throw Error('EXP vượt giới hạn.');
 while(state.level<levelCap(state,content)&&available>=xpRequired(content,state.level)){const need=xpRequired(content,state.level);available-=need;state.level++;}
 const accepted=state.level===levelRules(content).maxLevel?0:Math.min(available,xpRequired(content,state.level));
 const lost=Math.max(0,available-accepted);state.xp=accepted;
 return {characterId:id,fromXp:oldXp,toXp:state.xp,fromLevel:before,toLevel:state.level,amount,lost,accepted:amount-lost,points:state.level-before,capped:state.level===levelCap(state,content)};
}
export function grantPartyXp(campaign,content,ids,amount){if(!whole(amount))throw Error('EXP không hợp lệ.');return [...new Set(ids)].map(id=>grantCharacterXp(campaign,content,id,amount));}
function editable(campaign,id,options){if(campaign.chronicles?.activeSession)throw Error('Đội hình và trang bị đã khóa trong phiên pháo đài. Hãy rời qua cổng để thay đổi.');if(options?.battleActive)throw Error('Hãy kết thúc trận hoặc chuyến hầm ngục trước khi thay đổi tiến trình.');if(!campaign.unlockedCharacterIds.includes(id))throw Error('Chưa sở hữu nhân vật này.');}
export function allocatePoints(campaign,content,id,allocations,options={}){editable(campaign,id,options);const next=structuredClone(campaign);next.characters[id]=normalizeLevelState(content,{...next.characters[id],allocations});return next;}
export function resetAllocations(campaign,content,id,options={}){return allocatePoints(campaign,content,id,{},options);}
export function limitBreak(campaign,content,id,options={}){
 editable(campaign,id,options);const state=campaign.characters[id],r=levelRules(content);
 if(state.limitBreakRank>=3||state.level!==levelCap(state,content))throw Error('Chưa đạt mốc Đột Phá.');
 const cost=r.limitBreakCosts[state.limitBreakRank];if(campaign.limitBreakStones<cost)throw Error('Không đủ Tinh Thạch Phá Giới.');
 const next=structuredClone(campaign);next.limitBreakStones-=cost;const bank=next.characters[id].xp;next.characters[id].xp=0;next.characters[id].limitBreakRank++;grantCharacterXp(next,content,id,bank);return next;
}
export function validateLevelRules(content){
 const r=content.progressionRules?.default,errors=[];if(!r||r.maxLevel!==50||JSON.stringify(r.caps)!=='[20,30,40,50]'||JSON.stringify(r.limitBreakCosts)!=='[1,2,3]')return ['Invalid progression rules'];
 if(!r.xp||['base','linear','quadratic'].some(k=>!whole(r.xp[k]))||!r.xp.base)errors.push('Invalid XP curve');
 for(const key of ALLOCATION_STATS){const a=r.allocations?.[key];if(!a||!['gain','cost','max','everyLevels'].every(k=>whole(a[k])&&a[k]>0))errors.push('Invalid allocation '+key);}
 if(!r.questDifficulties||Object.keys(r.questDifficulties).length!==5||Object.values(r.questDifficulties).some(d=>!d.name||!Number.isInteger(d.level)||d.level<1||d.level>50||!whole(d.xp)||!Number.isFinite(d.rewardMultiplier)||d.rewardMultiplier<1))errors.push('Invalid quest difficulty rules');
 if(['normal','boss','bounty'].some(k=>!whole(r.questXpMultipliers?.[k])||r.questXpMultipliers[k]<1))errors.push('Invalid quest XP multipliers');if(!r.enemyGrowth||ALLOCATION_STATS.some(k=>!Number.isFinite(r.enemyGrowth[k])||r.enemyGrowth[k]<0))errors.push('Invalid enemy growth');
 if(!Array.isArray(r.milestones)||r.milestones.some((m,i)=>!Number.isInteger(m.level)||m.level<1||m.level>99||i>0&&m.level<=r.milestones[i-1].level||['offense','defense'].some(k=>!Number.isFinite(m[k])||m[k]<0)))errors.push('Invalid enemy milestones');errors.push(...validateEnemyScalingRules(content));return errors;
}
