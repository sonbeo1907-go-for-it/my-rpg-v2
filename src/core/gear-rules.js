import {validGearEffect} from './gear-effect-schema.js';
export const GEAR_STAT_KEYS=['maxHp','maxMp','attack','magic','defense','resistance','speed'];
export const isT4=gear=>['t4_stats','t4_effect'].includes(gear?.typeId);
export const gearName=(content,gear)=>gear?.effectId?content.gearEffects?.[gear.effectId]?.name:content.gearTypes[gear?.typeId]?.name;
export function t4Stats(content,primary,secondary){
  const result={};for(const[key,points]of[[primary,5],[secondary,3]]){const scale=content.economy.default.gearStats.find(s=>s.stat===key)?.scale;if(!scale)throw Error('Dòng chỉ số không hợp lệ.');result[key]=(result[key]??0)+points*scale;}return result;
}
export function validT4Gear(gear,content){
  if(!/^rune_[1-9]\d*$/.test(gear.id))return false;
  if(gear.typeId==='t4_effect')return typeof gear.effectId==='string'&&Object.hasOwn(content.gearEffects??{},gear.effectId)&&Object.keys(gear.stats).length===0&&gear.primaryStat===undefined&&gear.secondaryStat===undefined;
  if(gear.effectId!==undefined||!GEAR_STAT_KEYS.includes(gear.primaryStat)||!GEAR_STAT_KEYS.includes(gear.secondaryStat))return false;
  const expected=t4Stats(content,gear.primaryStat,gear.secondaryStat);
  return Object.keys(gear.stats).length===Object.keys(expected).length&&Object.entries(expected).every(([key,n])=>gear.stats[key]===n);
}
export function gearRecipeUnlocked(campaign,recipe){return (!recipe.requires?.storyFlag||campaign.storyFlags.includes(recipe.requires.storyFlag))&&(!recipe.requires?.firstClear||campaign.claimedFirstClearRewards.includes(recipe.requires.firstClear));}
export function gearDismantleYield(content,gear){return gear?.effectId?content.gearEffects[gear.effectId].dismantleYield:content.blacksmith.default.dismantleYield[gear?.typeId]??0;}
export function validateT4Content(content){
 const errors=[],r=content.blacksmith?.default,whole=n=>Number.isSafeInteger(n)&&n>0;
 if(!r?.gearCraftCosts||!r?.secondaryReforgeCost||!content.gearEffects)return ['Missing T4 crafting content'];
 for(const cost of [...Object.values(r.gearCraftCosts),r.secondaryReforgeCost])if(!cost||Object.keys(cost).length!==2||!whole(cost.coins)||!whole(cost.prismaFragments))errors.push('blacksmith: invalid T4 cost');
 for(const id of ['stats','common','special'])if(!r.gearCraftCosts[id])errors.push('blacksmith: missing T4 cost '+id);
 for(const type of ['t4_stats','t4_effect'])if(!whole(r.dismantleYield?.[type]))errors.push('blacksmith: invalid T4 salvage yield');
 for(const t of Object.values(content.gearEffects)){
  if(!t.name?.trim()||!t.description?.trim()||!['common','special'].includes(t.costClass)||typeof t.effectGroup!=='string'||!t.effectGroup.trim()||!Number.isSafeInteger(t.cooldownRounds)||t.cooldownRounds<0||!whole(t.dismantleYield)||!validGearEffect(t,content)||['oncePerRound','oncePerEncounter'].some(key=>t[key]!==undefined&&typeof t[key]!=='boolean'))errors.push('gearEffects: invalid recipe '+t.id);
  if(t.requires?.storyFlag&&!Object.values(content.upgrades).some(u=>u.requires?.storyFlag===t.requires.storyFlag))errors.push('gearEffects: invalid story unlock '+t.id);
  if(t.requires?.firstClear&&!content.encounters[t.requires.firstClear]?.firstClearRewards?.some(r=>r.type==='gear_recipe'&&r.recipeId===t.id))errors.push('gearEffects: invalid boss unlock '+t.id);
  if(t.costClass==='special'&&!t.requires?.storyFlag&&!t.requires?.firstClear)errors.push('gearEffects: missing special unlock '+t.id);
 }
 return errors;
}
