import {normalizeBlueprintState} from './blueprint-shop.js';
import {validT4Gear,GEAR_STAT_KEYS} from './gear-rules.js';
import { validExclusiveStat } from './blacksmith-rules.js';
const record = value => value && typeof value === 'object' && !Array.isArray(value);
export function emptyBlacksmithState() {
  return { blueprints:0,unlockedExclusiveRecipes:[],prismaFragments:0, originalPrisma:0, exclusiveGear:[], equippedExclusiveGear:{}, pendingReforge:null, blacksmithRevision:0, craftedGearSerial:0, pendingGearReforge:null };
}
export function normalizeBlacksmithState(input, content, campaign) {
  const state={...emptyBlacksmithState(),...normalizeBlueprintState(input,content)};
  for(const key of ['prismaFragments','originalPrisma','blacksmithRevision','craftedGearSerial']) {
    const value=input[key]===undefined?0:input[key];
    if(!Number.isSafeInteger(value)||value<0) throw new Error('Số dư hoặc phiên bản Thợ Rèn không hợp lệ.');
    state[key]=value;
  }
  const items=input.exclusiveGear===undefined?[]:input.exclusiveGear;
  if(!Array.isArray(items)) throw new Error('Bộ sưu tập Trấn Phái không hợp lệ.');
  const ids=new Set();
  for(const item of items) {
    if(!record(item)||typeof item.templateId!=='string'||!Object.hasOwn(content.exclusiveGear,item.templateId)||ids.has(item.templateId)||!validExclusiveStat(content,item.statKey,item.statValue)) throw new Error('Trấn Phái trong dữ liệu lưu không hợp lệ.');
    const template=content.exclusiveGear[item.templateId];
    if(!campaign.unlockedCharacterIds.includes(template.characterId)) throw new Error('Trấn Phái thuộc nhân vật chưa sở hữu.');
    ids.add(item.templateId);state.exclusiveGear.push({templateId:item.templateId,statKey:item.statKey,statValue:item.statValue});
  }
  const equipped=input.equippedExclusiveGear===undefined?{}:input.equippedExclusiveGear;
  if(!record(equipped)) throw new Error('Ô Trấn Phái không hợp lệ.');
  for(const [id,templateId]of Object.entries(equipped)) {
    if(!Object.hasOwn(content.characters,id)||!campaign.unlockedCharacterIds.includes(id)||!(templateId===null||(ids.has(templateId)&&content.exclusiveGear[templateId].characterId===id))) throw new Error('Trang bị Trấn Phái không hợp lệ.');
    state.equippedExclusiveGear[id]=templateId;
  }
  const pending=input.pendingReforge===undefined?null:input.pendingReforge;
  if(pending!==null) {
    const owned=state.exclusiveGear.find(item=>item.templateId===pending?.templateId);
    if(!record(pending)||!owned||!Number.isSafeInteger(pending.id)||pending.id<1||pending.id>state.blacksmithRevision||owned.statKey!==pending.previousStatKey||owned.statValue!==pending.previousStatValue||!validExclusiveStat(content,pending.nextStatKey,pending.nextStatValue)) throw new Error('Kết quả tái rèn đang chờ không hợp lệ.');
    state.pendingReforge={id:pending.id,templateId:pending.templateId,previousStatKey:pending.previousStatKey,previousStatValue:pending.previousStatValue,nextStatKey:pending.nextStatKey,nextStatValue:pending.nextStatValue};
  }
  if(input.pendingGearReforge!=null){const p=input.pendingGearReforge,g=campaign.gear.find(g=>g.id===p?.gearId);
    if(!record(p)||state.pendingReforge||!g||g.typeId!=='t4_stats'||!validT4Gear(g,content)||!Number.isSafeInteger(p.id)||p.id<1||p.id>state.blacksmithRevision||g.primaryStat!==p.primaryStat||g.secondaryStat!==p.previousSecondaryStat||!GEAR_STAT_KEYS.includes(p.nextSecondaryStat))throw Error('Kết quả tái rèn dòng phụ không hợp lệ.');
    state.pendingGearReforge={id:p.id,gearId:p.gearId,primaryStat:p.primaryStat,previousSecondaryStat:p.previousSecondaryStat,nextSecondaryStat:p.nextSecondaryStat};
  }
  return state;
}
export function equippedExclusive(campaign,content,characterId) {
  const templateId=campaign.equippedExclusiveGear?.[characterId];
  const owned=campaign.exclusiveGear?.find(item=>item.templateId===templateId);
  return owned?{...owned,template:content.exclusiveGear[templateId]}:null;
}
