import {gearDismantleYield} from './gear-rules.js';
import { gearLocation } from './equipment.js';
import { validateGear } from './economy.js';
import { blacksmithRules, FORGE_STATS, exclusiveRollRange, exclusiveCraftUnlocked } from './blacksmith-rules.js';
import { normalizeBlacksmithState } from './blacksmith-state.js';

const count = value => Number.isSafeInteger(value)&&value>=0;
function add(value,delta) { if(!count(value)||!Number.isSafeInteger(value+delta)||value+delta<0) throw new Error('Số dư vượt giới hạn hoặc không đủ nguyên liệu.');return value+delta; }
function normalized(campaign,content) { return {...structuredClone(campaign),...normalizeBlacksmithState(campaign,content,campaign)}; }
function revision(next) { next.blacksmithRevision=add(next.blacksmithRevision,1);return next.blacksmithRevision; }
function templateFor(content,id) { if(!Object.hasOwn(content.exclusiveGear,id)) throw new Error('Mẫu Trấn Phái không tồn tại.');return content.exclusiveGear[id]; }
function ownedFor(next,id) { const item=next.exclusiveGear.find(item=>item.templateId===id);if(!item)throw new Error('Chưa chế tạo mẫu Trấn Phái này.');return item; }
function roll(random) { const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw new Error('Nguồn tạo chỉ số không hợp lệ.');return n; }
export function rollExclusiveStat(content,random=Math.random) {
  const statKey=FORGE_STATS[Math.floor(roll(random)*FORGE_STATS.length)], range=exclusiveRollRange(content,statKey);
  return {statKey,statValue:range.min+Math.floor(roll(random)*(range.max-range.min+1))};
}
export function dismantleQuote(campaign,content,ids) {
  const rules=blacksmithRules(content);
  if(!Array.isArray(ids)||ids.length<1||ids.length>rules.maxDismantle||new Set(ids).size!==ids.length)throw new Error('Chọn từ 1 đến 99 trang bị khác nhau.');
  const selected=ids.map(id=>{
    const gear=campaign.gear.find(item=>item.id===id);
    if(!gear||!validateGear(gear,content)||gearLocation(campaign,id)||campaign.pendingGearReforge?.gearId===id||!Object.hasOwn(rules.dismantleYield,gear.typeId))throw new Error('Có trang bị không tồn tại, đang được sử dụng hoặc không thể phân rã.');
    return gear;
  });
  const yields=selected.reduce((sum,item)=>sum+gearDismantleYield(content,item),0);
  return {count:selected.length,fragments:yields,groups:Object.fromEntries(Object.keys(rules.dismantleYield).map(type=>[type,selected.filter(item=>item.typeId===type).length])),after:add(campaign.prismaFragments??0,yields)};
}
export function dismantleGear(campaign,content,ids) {
  const next=normalized(campaign,content),quote=dismantleQuote(next,content,ids),remove=new Set(ids);
  next.gear=next.gear.filter(item=>!remove.has(item.id));
  for(const result of next.gacha?.lastSummon?.results??[]) if(result.kind==='gear'&&remove.has(result.gear.id))result.dismantled=true;
  next.prismaFragments=quote.after;revision(next);return next;
}
export function craftExclusive(campaign,content,id,random=Math.random) {
  const next=normalized(campaign,content),template=templateFor(content,id),rules=blacksmithRules(content);
  if(template.source?.type==='quest')throw new Error('Trấn Phái này chỉ nhận từ phần thưởng nhiệm vụ.');
  if(!exclusiveCraftUnlocked(next,template))throw new Error('Hoàn thành chương truyện để mở công thức Trấn Phái.');
  if(!template.enabled)throw new Error('Mẫu Trấn Phái này chưa mở chế tạo.');
  if(!next.unlockedCharacterIds.includes(template.characterId))throw new Error('Cần sở hữu nhân vật trước khi chế tạo Trấn Phái.');
  if(next.exclusiveGear.some(item=>item.templateId===id))throw new Error('Mẫu Trấn Phái này đã được chế tạo.');
  for(const[key,cost]of Object.entries(rules.craftCost))next[key]=add(next[key],-cost);
  next.exclusiveGear.push({templateId:id,...(template.initialStat??rollExclusiveStat(content,random))});revision(next);return next;
}
export function beginReforge(campaign,content,id,random=Math.random) {
  const next=normalized(campaign,content);templateFor(content,id);const item=ownedFor(next,id);
  if(next.pendingReforge||next.pendingGearReforge)throw new Error('Hãy chọn kết quả tái rèn đang chờ trước.');
  next.originalPrisma=add(next.originalPrisma,-blacksmithRules(content).reforgeCost);
  const stat=rollExclusiveStat(content,random);
  next.pendingReforge={id:revision(next),templateId:id,previousStatKey:item.statKey,previousStatValue:item.statValue,nextStatKey:stat.statKey,nextStatValue:stat.statValue};return next;
}
export function finishReforge(campaign,content,pendingId,useNew) {
  const next=normalized(campaign,content),pending=next.pendingReforge;
  if(!pending||pending.id!==pendingId||typeof useNew!=='boolean')throw new Error('Kết quả tái rèn đã thay đổi hoặc không còn chờ chọn.');
  const item=ownedFor(next,pending.templateId);
  if(useNew){item.statKey=pending.nextStatKey;item.statValue=pending.nextStatValue;}
  next.pendingReforge=null;revision(next);return next;
}
export function equipExclusive(campaign,content,characterId,id) {
  const next=normalized(campaign,content),template=templateFor(content,id);ownedFor(next,id);
  if(!Object.hasOwn(content.characters,characterId)||!next.unlockedCharacterIds.includes(characterId)||template.characterId!==characterId)throw new Error('Trấn Phái không dành cho nhân vật này.');
  next.equippedExclusiveGear[characterId]=id;return next;
}
export function unequipExclusive(campaign,content,characterId) {
  const next=normalized(campaign,content);
  if(!Object.hasOwn(content.characters,characterId)||!next.unlockedCharacterIds.includes(characterId))throw new Error('Nhân vật chưa được sở hữu.');
  delete next.equippedExclusiveGear[characterId];return next;
}
