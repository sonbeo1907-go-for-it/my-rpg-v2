import {recordTobinCraft} from './tobin-recruitment.js';
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
 next.blacksmithRevision=checked(next.blacksmithRevision,1);recordTobinCraft(next,content);return next;
}
export function advancedReforgeUnlocked(campaign,content){
 return campaign.claimedFirstClearRewards.includes(content.blacksmith.default.advancedSecondaryReforge.requiresFirstClear);
}
export function secondaryReforgeChance(content,count){
 const max=content.blacksmith.default.advancedSecondaryReforge.maxMaterials;
 if(!Number.isSafeInteger(count)||count<0||count>max)throw Error('Số nguyên liệu tái rèn không hợp lệ.');
 return (max+(GEAR_STAT_KEYS.length-1)*count)/(GEAR_STAT_KEYS.length*max);
}
export function reforgeMaterials(campaign){
 const equipped=new Set(Object.values(campaign.equipment??{}).flat());
 return campaign.gear.filter(g=>['t3_focused','t3_dual'].includes(g.typeId)&&!equipped.has(g.id));
}
/** @param {{targetStat:string,materialIds:string[]}|null} [advanced] */
export function gearReforgeQuote(campaign,content,gearId,advanced=null){
 if(campaign.pendingGearReforge||campaign.pendingReforge)throw Error('Hãy chọn kết quả tái rèn đang chờ trước.');
 const gear=campaign.gear.find(g=>g.id===gearId);
 if(!gear||gear.typeId!=='t4_stats'||!validateGear(gear,content))throw Error('Chỉ tái rèn dòng phụ của Gear Cấp 4 chỉ số.');
 const quote={gearId,cost:{...content.blacksmith.default.secondaryReforgeCost},advanced:null};
 if(advanced!==null){
  if(!advancedReforgeUnlocked(campaign,content))throw Error('Hạ Yamata no Orochi để mở Tái rèn nâng cao.');
  const {targetStat,materialIds}=advanced,rules=content.blacksmith.default.advancedSecondaryReforge;
  if(!GEAR_STAT_KEYS.includes(targetStat)||!Array.isArray(materialIds)||materialIds.length<1||materialIds.length>rules.maxMaterials||new Set(materialIds).size!==materialIds.length)throw Error('Chọn dòng phụ và từ 1 đến '+rules.maxMaterials+' trang bị T3 khác nhau.');
  const eligible=new Map(reforgeMaterials(campaign).map(g=>[g.id,g]));
  if(materialIds.some(id=>!eligible.has(id)||!validateGear(eligible.get(id),content)))throw Error('Nguyên liệu phải là trang bị T3 chưa sử dụng và còn trong túi đồ.');
  quote.advanced={targetStat,materialIds:[...materialIds],materialCount:materialIds.length,chance:secondaryReforgeChance(content,materialIds.length)};
 }
 return quote;
}
/** @param {{targetStat:string,materialIds:string[]}|null} [advanced] */
export function beginGearReforge(campaign,content,gearId,random=Math.random,advanced=null){
 const next=clone(campaign,content),quote=gearReforgeQuote(next,content,gearId,advanced),gear=next.gear.find(g=>g.id===gearId);
 // One roll: an advanced miss chooses uniformly among the other six stats.
 // The displayed probability is exact, not boosted again by a fallback roll.
 const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw Error('Nguồn ngẫu nhiên không hợp lệ.');
 const a=quote.advanced,others=a?GEAR_STAT_KEYS.filter(k=>k!==a.targetStat):GEAR_STAT_KEYS;
 const nextSecondaryStat=a&&n<a.chance?a.targetStat:others[Math.min(others.length-1,Math.floor((a?(n-a.chance)/(1-a.chance):n)*others.length))];
 pay(next,quote.cost);
 if(a){const remove=new Set(a.materialIds);next.gear=next.gear.filter(g=>!remove.has(g.id));for(const r of next.gacha.lastSummon?.results??[])if(r.kind==='gear'&&remove.has(r.gear.id))r.dismantled=true;}
 next.blacksmithRevision=checked(next.blacksmithRevision,1);
 next.pendingGearReforge={id:next.blacksmithRevision,gearId,primaryStat:gear.primaryStat,previousSecondaryStat:gear.secondaryStat,nextSecondaryStat,...(a?{advanced:{targetStat:a.targetStat,materialCount:a.materialCount}}:{})};return next;
}
export function finishGearReforge(campaign,content,pendingId,useNew){
 const next=clone(campaign,content),pending=next.pendingGearReforge;if(!pending||pending.id!==pendingId||typeof useNew!=='boolean')throw Error('Kết quả tái rèn đã thay đổi.');
 const gear=next.gear.find(g=>g.id===pending.gearId);if(useNew){gear.secondaryStat=pending.nextSecondaryStat;gear.stats=t4Stats(content,gear.primaryStat,gear.secondaryStat);}next.pendingGearReforge=null;next.blacksmithRevision=checked(next.blacksmithRevision,1);return next;
}
