import {skillRules,skillLineId,skillRankCap,skillUpgradeCost,getSkillRank,characterSkillIds,validateCharacterSkillRanks} from './skill-rules.js';
import {resolveRankedAbility} from './skill-resolver.js';
export {getSkillRank,skillRankCap,skillUpgradeCost} from './skill-rules.js';

export function skillUpgradeQuote(campaign,content,id,line,options={}){
 const state=campaign.characters[id],rules=skillRules(content);
 const skill=line==='basic'?{id:'$attack',name:'Đánh thường',target:'enemy',growthProfile:'basic',effects:content.characters[id]?.basicAttack??[{type:'damage',damageType:content.characters[id]?.basicDamageType??'physical',element:content.characters[id]?.element,multiplier:1}]}:characterSkillIds(content,state??{},id).map(id=>content.abilities[id]).find(skill=>skillLineId(skill)===line);
 const rank=getSkillRank(campaign,id,line),nextRank=rank+1,coinCost=skillUpgradeCost(rank,rules),requiredLevel=rules.characterLevelRequired[rank];
 let reason='';
 try{if(state)validateCharacterSkillRanks(content,campaign,id);}catch(error){reason=error.message;}
 if(reason)return {ok:false,reason,rank:1,nextRank:2,coinCost:0,requiredLevel:15,fixed:true,skill,current:null,next:null};
 if(!state||!campaign.unlockedCharacterIds.includes(id))reason='Chưa sở hữu nhân vật này.';
 else if(!skill)reason='Kỹ năng chưa mở khóa.';
 else if(skill.growthProfile==='fixed'||skill.rankable===false||skill.activation==='passive')reason=skill.fixedReason??'Kỹ năng cố định, không có cấp nâng.';
 else if(rank>=rules.maxRank)reason='Đã đạt cấp kỹ năng tối đa.';
 else if(options.battleActive||options.dungeonActive||options.locked)reason='Hãy kết thúc trận hoặc chuyến hầm ngục trước khi nâng kỹ năng.';
 else if(state.level<requiredLevel)reason='Cần nhân vật Lv'+requiredLevel+'.';
 else if(campaign.coins<coinCost)reason='Không đủ Coin.';
 const actor={...content.characters[id],skillRanks:state?.skillRanks??{},skillProgression:rules};
 return {ok:!reason,reason,rank,nextRank:Math.min(rules.maxRank,nextRank),coinCost,requiredLevel,fixed:!skill||skill.growthProfile==='fixed'||skill.rankable===false||skill.activation==='passive',skill,current:skill?resolveRankedAbility(content,actor,skill,rank):null,next:skill&&rank<rules.maxRank?resolveRankedAbility(content,actor,skill,nextRank):null};
}
// Clone before changing either balance or rank. Caller publishes only after persistence succeeds.
export function upgradeSkill(campaign,content,id,line,options={}){
 validateCharacterSkillRanks(content,campaign,id);
 const quote=skillUpgradeQuote(campaign,content,id,line,options);
 if(!quote.ok)throw Error(quote.reason);
 if(options.expectedRank!==undefined&&options.expectedRank!==quote.rank)throw Error('Cấp kỹ năng đã thay đổi. Hãy xem lại nâng cấp.');
 const next=structuredClone(campaign);
 next.coins-=quote.coinCost;
 next.characters[id].skillRanks={...next.characters[id].skillRanks,[line]:quote.nextRank};
 validateCharacterSkillRanks(content,next,id);
 return next;
}
export async function upgradeSkillAndPersist(campaign,content,id,line,persist,options={}){const next=upgradeSkill(campaign,content,id,line,options);await persist(next);return next;}
