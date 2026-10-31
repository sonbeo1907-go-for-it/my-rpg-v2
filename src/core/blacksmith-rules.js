import {validateT4Content} from './gear-rules.js';
import { validateExclusivePassive } from './exclusive-hooks.js';
export const FORGE_STATS = ['maxHp','maxMp','attack','magic','defense','resistance','speed'];
export const FORGE_CURRENCIES = ['coins','prismaFragments','recruitmentShards','originalPrisma'];
export const blacksmithRules = content => content.blacksmith.default;
const whole = n => Number.isSafeInteger(n) && n >= 0;
export function exclusiveRollRange(content, statKey) {
  const scale = content.economy.default.gearStats.find(item => item.stat === statKey)?.scale;
  if (!scale) throw new Error('Chỉ số Trấn Phái không hợp lệ.');
  const rules = blacksmithRules(content);
  return { min: rules.rollMinPoints * scale, max: rules.rollMaxPoints * scale };
}
export function validExclusiveStat(content, key, value) {
  if (!FORGE_STATS.includes(key) || !whole(value)) return false;
  const range = exclusiveRollRange(content,key);
  return value >= range.min && value <= range.max;
}
export function validateBlacksmithContent(content) {
  const errors=[], rules=content.blacksmith?.default;
  if (!rules || !content.exclusiveGear || !content.items) return ['Missing blacksmith, exclusiveGear or items'];
  if (!whole(rules.maxDismantle) || rules.maxDismantle < 1 || rules.maxDismantle > 99) errors.push('blacksmith: invalid dismantle limit');
  for(const id of ['t1','t2','t3_focused','t3_dual']) if(!whole(rules.dismantleYield?.[id]) || rules.dismantleYield[id]<1) errors.push(`blacksmith: invalid yield ${id}`);
  if(!rules.craftCost || Object.keys(rules.craftCost).length!==4 || FORGE_CURRENCIES.some(key=>!whole(rules.craftCost[key])||rules.craftCost[key]<1)) errors.push('blacksmith: invalid craft cost');
  if(!whole(rules.reforgeCost)||rules.reforgeCost<1||!whole(rules.rollMinPoints)||rules.rollMinPoints<1||!whole(rules.rollMaxPoints)||rules.rollMaxPoints<rules.rollMinPoints) errors.push('blacksmith: invalid roll/cost');
  if(rules.rollPolicy!=='uniform_stat_then_integer'||rules.allowIdenticalReforge!==true||rules.requireOwnedCharacter!==true) errors.push('blacksmith: unsupported roll/ownership policy');
  for(const template of Object.values(content.exclusiveGear)) {
    if(!Object.hasOwn(content.characters,template.characterId)||typeof template.enabled!=='boolean'||!template.name?.trim()||!template.description?.trim()||!template.passive?.description?.trim()) errors.push(`exclusiveGear: invalid template ${template.id}`);
    // New combat passive types must get an explicit, tested adapter before being enabled.
    if(!validateExclusivePassive(template.passive,content)) errors.push('exclusiveGear: unsupported passive '+template.id);
    if(template.initialStat&&!validExclusiveStat(content,template.initialStat.statKey,template.initialStat.statValue))errors.push('exclusiveGear: invalid initial stat '+template.id);
    if(template.requires?.firstClear&&!content.encounters[template.requires.firstClear]?.firstClearRewards?.some(r=>r.type==='exclusive_recipe'&&r.templateId===template.id))errors.push('exclusiveGear: invalid recipe gate '+template.id);
    if(template.source && (template.source.type!=='quest' || !content.encounters[template.source.encounterId] || !validExclusiveStat(content,template.source.statKey,template.source.statValue))) errors.push('exclusiveGear: invalid quest source '+template.id);
  }
  for(const item of Object.values(content.items)) if(!['coins','prisma','recruitmentShards','originalPrisma','prismaFragments'].includes(item.field)||!item.name?.trim()||!item.description?.trim()||!['coin','prisma','pure','original','fragments'].includes(item.kind)) errors.push(`items: invalid resource ${item.id}`);
  return [...errors,...validateT4Content(content)];
}

export const exclusiveCraftUnlocked=(campaign,template)=>!template.requires?.firstClear||campaign.claimedFirstClearRewards.includes(template.requires.firstClear);
