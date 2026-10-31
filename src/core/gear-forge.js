import {validateGear} from './economy.js';
import {gearLocation} from './equipment.js';
import {GEAR_STAT_KEYS,t4Stats,gearRecipeUnlocked} from './gear-rules.js';
import {normalizeBlacksmithState} from './blacksmith-state.js';
const checked=(n,d)=>{if(!Number.isSafeInteger(n)||n<0||!Number.isSafeInteger(n+d)||n+d<0)throw Error('Không đủ nguyên liệu hoặc số dư không hợp lệ.');return n+d;};
const clone=(campaign,content)=>({...structuredClone(campaign),...normalizeBlacksmithState(campaign,content,campaign)});
function pay(next,cost){for(const[field,n]of Object.entries(cost))next[field]=checked(next[field],-n);}
function secondary(random){const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw Error('Nguồn ngẫu nhiên không hợp lệ.');return GEAR_STAT_KEYS[Math.floor(n*GEAR_STAT_KEYS.length)];}
export function craftGear(campaign,content,{primaryStat,effectId,materialId},random=Math.random){
 const next=clone(campaign,content),material=next.gear.find(g=>g.id===materialId);
 if(!material||!['t3_focused','t3_dual'].includes(material.typeId)||!validateGear(material,content)||gearLocation(next,materialId)||next.pendingGearReforge?.gearId===materialId)throw Error('Cần một Gear T3 chưa trang bị làm nguyên liệu.');
 let item,cost;
 if(effectId!==undefined){const recipe=Object.hasOwn(content.gearEffects,effectId)?content.gearEffects[effectId]:null;if(!recipe||!gearRecipeUnlocked(next,recipe))throw Error('Công thức hiệu ứng chưa mở.');if(primaryStat!==undefined)throw Error('Gear hiệu ứng không có chỉ số.');cost=content.blacksmith.default.gearCraftCosts[recipe.costClass];item={typeId:'t4_effect',effectId,stats:{}};}
 else{if(!GEAR_STAT_KEYS.includes(primaryStat))throw Error('Hãy chọn dòng chính.');const secondaryStat=secondary(random);cost=content.blacksmith.default.gearCraftCosts.stats;item={typeId:'t4_stats',primaryStat,secondaryStat,stats:t4Stats(content,primaryStat,secondaryStat)};}
 pay(next,cost);next.craftedGearSerial=checked(next.craftedGearSerial,1);item.id='rune_'+next.craftedGearSerial;
 if(next.gear.some(g=>g.id===item.id))throw Error('Mã trang bị bị trùng.');
 next.gear=next.gear.filter(g=>g.id!==materialId);next.gear.push(item);
 for(const result of next.gacha.lastSummon?.results??[])if(result.kind==='gear'&&result.gear.id===materialId)result.dismantled=true;
 next.blacksmithRevision=checked(next.blacksmithRevision,1);return next;
}
export function beginGearReforge(campaign,content,gearId,random=Math.random){
 const next=clone(campaign,content),gear=next.gear.find(g=>g.id===gearId);
 if(next.pendingGearReforge||next.pendingReforge)throw Error('Hãy chọn kết quả tái rèn đang chờ trước.');
 if(!gear||gear.typeId!=='t4_stats'||!validateGear(gear,content))throw Error('Chỉ tái rèn dòng phụ của Gear Cấp 4 chỉ số.');
 const nextSecondaryStat=secondary(random);pay(next,content.blacksmith.default.secondaryReforgeCost);next.blacksmithRevision=checked(next.blacksmithRevision,1);
 next.pendingGearReforge={id:next.blacksmithRevision,gearId,primaryStat:gear.primaryStat,previousSecondaryStat:gear.secondaryStat,nextSecondaryStat};return next;
}
export function finishGearReforge(campaign,content,pendingId,useNew){
 const next=clone(campaign,content),pending=next.pendingGearReforge;if(!pending||pending.id!==pendingId||typeof useNew!=='boolean')throw Error('Kết quả tái rèn đã thay đổi.');
 const gear=next.gear.find(g=>g.id===pending.gearId);if(useNew){gear.secondaryStat=pending.nextSecondaryStat;gear.stats=t4Stats(content,gear.primaryStat,gear.secondaryStat);}next.pendingGearReforge=null;next.blacksmithRevision=checked(next.blacksmithRevision,1);return next;
}
