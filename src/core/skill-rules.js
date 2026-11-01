// Rank formulas are shared by persistence, combat and previews.
export const DEFAULT_SKILL_RULES=Object.freeze({maxRank:5,characterLevelRequired:[1,15,30,40,50],coins:{base:400,multiplier:2},coefficientGrowthPerRank:1.1,statBuffGrowthPerRank:1.05,outputBuffMpMultiplierPerRank:.9,outputBuffMpCostFloorRatio:.7});
export const SKILL_PROFILES=['basic','damage','heal','shield','stat_buff','output_buff_mp','fixed'];
export const GROWING_STATS=['attack','magic','defense','resistance'];
export const OUTPUT_BUFF_STATS=['damageBonus','attackMultiplier','damageVsShielded'];
// A skill rank improves every eligible output group. Utility and fixed sources stay authored.
export function skillGrowthGroups(content,skill){
 if(skill.growthProfile==='fixed'||skill.rankable===false||skill.activation==='passive')return [];
 const groups=new Set();
 for(const effect of skill.effects??[]){
  if(effect.type==='damage')groups.add(skill.id==='$attack'?'basic':'damage');
  if(['heal','shield'].includes(effect.type))groups.add(effect.type);
  for(const id of [effect.status,...effect.linkedStatuses??[]].filter(Boolean)){
   const status=content?.statuses?.[id];if(status?.kind!=='buff')continue;
   if(GROWING_STATS.some(key=>(status.modifiers?.[key]??0)>0))groups.add('stat_buff');
   if(OUTPUT_BUFF_STATS.some(key=>(status.modifiers?.[key]??0)>0)&&skill.cost?.mp>0&&Math.ceil(skill.cost.mp*outputMpFactor(5))<skill.cost.mp)groups.add('output_buff_mp');
  }
  if(effect.type==='enter_mode'&&skill.growthAdapter==='mode_stat_buff')groups.add('stat_buff');
  if(effect.type==='enter_mode'&&effect.followUpBonus>0)groups.add('damage');
 }
 return [...groups];
}
export const skillRules=content=>content?.progressionRules?.default?.skillProgression??DEFAULT_SKILL_RULES;
export const skillRankCap=(level,rules=DEFAULT_SKILL_RULES)=>rules.characterLevelRequired.filter(required=>level>=required).length;
export const skillUpgradeCost=(rank,rules=DEFAULT_SKILL_RULES)=>rank>=1&&rank<rules.maxRank?rules.coins.base*rules.coins.multiplier**(rank-1):0;
export const coefficientFactor=(rank,rules=DEFAULT_SKILL_RULES)=>rules.coefficientGrowthPerRank**(rank-1);
export const statBuffFactor=(rank,rules=DEFAULT_SKILL_RULES)=>rules.statBuffGrowthPerRank**(rank-1);
export const outputMpFactor=(rank,rules=DEFAULT_SKILL_RULES)=>Math.max(rules.outputBuffMpCostFloorRatio,rules.outputBuffMpMultiplierPerRank**(rank-1));
export const skillLineId=skill=>skill.id==='$attack'?'basic':skill.skillLineId??skill.id;
export const getActorSkillRank=(actor,skill)=>actor?.team==='enemy'?1:actor?.skillRanks?.[skillLineId(skill)]??1;
export const getSkillRank=(campaign,id,line)=>campaign.characters[id]?.skillRanks?.[line]??1;
export function normalizeSkillRanks(ranks,level,rules=DEFAULT_SKILL_RULES){
 if(ranks===undefined)return {};
 if(!ranks||typeof ranks!=='object'||Array.isArray(ranks)||Object.getPrototypeOf(ranks)!==Object.prototype&&Object.getPrototypeOf(ranks)!==null)throw Error('Dữ liệu cấp kỹ năng không hợp lệ.');
 for(const[key,rank]of Object.entries(ranks))if(!key||!Number.isInteger(rank)||rank<1||rank>rules.maxRank||rank>skillRankCap(level,rules))throw Error('Cấp kỹ năng vượt giới hạn nhân vật.');
 return {...ranks};
}
export function characterSkillIds(content,state,id){
 let ids=[...(content.characters[id]?.abilities??[])];
 for(const upgrade of (state.upgradeIds??[]).map(key=>content.upgrades[key]).filter(Boolean).sort((a,b)=>(a.order??0)-(b.order??0)||a.id.localeCompare(b.id)))for(const change of upgrade.changes){
  if(change.type==='unlock_ability'&&!ids.includes(change.ability))ids.push(change.ability);
  if(change.type==='replace_ability')ids=ids.map(key=>key===change.from?change.to:key);
 }
 return ids;
}
export function validateCharacterSkillRanks(content,campaign,id){
 const state=campaign.characters[id];if(!state||!content.characters[id])throw Error('Nhân vật không hợp lệ.');
 const ranks=normalizeSkillRanks(state.skillRanks,state.level,skillRules(content));
 const ids=characterSkillIds(content,state,id);
 for(const key of Object.keys(ranks)){
  const skill=key==='basic'?{growthProfile:'basic',rankable:true}:ids.map(id=>content.abilities[id]).find(skill=>skillLineId(skill)===key);
  if(!campaign.unlockedCharacterIds.includes(id)||!skill||skill.growthProfile==='fixed'||skill.rankable===false||skill.activation==='passive')throw Error('Cấp kỹ năng không thuộc nhân vật đã sở hữu hoặc kỹ năng chưa mở khóa.');
 }
 return ranks;
}
export function validateSkillProgression(content){
 const errors=[],r=content.progressionRules?.default?.skillProgression;
 if(!r||Object.entries(DEFAULT_SKILL_RULES).some(([key,value])=>typeof value==='object'?Array.isArray(value)?JSON.stringify(r[key])!==JSON.stringify(value):Object.entries(value).some(([k,n])=>r[key]?.[k]!==n):r[key]!==value))errors.push('Invalid common skill progression rules');
 for(const skill of Object.values(content.abilities??{})){
  if(!SKILL_PROFILES.includes(skill.growthProfile)||typeof skill.skillLineId!=='string'||!skill.skillLineId)errors.push(skill.id+': missing skill growth profile/line');
  if(skill.growthProfile==='fixed'&&(!skill.fixedReason||skill.rankable!==false))errors.push(skill.id+': fixed skill requires a reason');
  if(skill.activation==='passive'&&skill.growthProfile!=='fixed')errors.push(skill.id+': automatic skill must remain fixed');
  if(skill.effects.some(e=>['enter_mode','prepare_mode','formula_field','edit_formula','end_formula'].includes(e.type)||e.formulaScaling)&&skill.growthProfile!=='fixed'&&!skill.growthAdapter)errors.push(skill.id+': missing explicit growth adapter');
  const referenced=skill.effects.flatMap(effect=>[effect.status,...effect.linkedStatuses??[]]).filter(Boolean).map(id=>content.statuses?.[id]);
  const statBuff=referenced.some(status=>status?.kind==='buff'&&GROWING_STATS.some(key=>(status.modifiers?.[key]??0)>0));
  const outputBuff=referenced.some(status=>status?.kind==='buff'&&OUTPUT_BUFF_STATS.some(key=>(status.modifiers?.[key]??0)>0));
  if(['damage','heal','shield'].includes(skill.growthProfile)&&!skill.effects.some(effect=>effect.type===skill.growthProfile))errors.push(skill.id+': profile has no growing effect');
  if(skill.growthProfile==='stat_buff'&&!statBuff&&skill.growthAdapter!=='mode_stat_buff')errors.push(skill.id+': no eligible positive stat buff');
  if(skill.growthProfile==='output_buff_mp'&&(!(skill.cost?.mp>0)||!outputBuff||Math.ceil(skill.cost.mp*outputMpFactor(5))>=skill.cost.mp))errors.push(skill.id+': no MP growth');
  if(skill.growthAdapter!==undefined&&!['mode_stat_buff','mode_command'].includes(skill.growthAdapter))errors.push(skill.id+': unknown growth adapter');
  if(skill.growthAdapter==='mode_stat_buff'&&(skill.growthProfile!=='stat_buff'||!skill.effects.some(e=>e.type==='enter_mode')))errors.push(skill.id+': invalid mode stat adapter');
  if(skill.id.startsWith('arthur.ogres_bane')&&(skill.growthProfile!=='fixed'||skill.fixedByStory!==true||skill.rankable!==false))errors.push(skill.id+': Ogre Bane must remain story fixed');
  if(skill.growthProfile!=='fixed'&&skill.rankable!==true)errors.push(skill.id+': growing skills must explicitly be rankable');
  const groups=skillGrowthGroups(content,skill);
  if(skill.growthGroups!==undefined&&(!Array.isArray(skill.growthGroups)||JSON.stringify(skill.growthGroups)!==JSON.stringify(groups)))errors.push(skill.id+': growth groups must include every eligible effect');
  if(groups.length>1&&!Array.isArray(skill.growthGroups))errors.push(skill.id+': mixed skill requires all growth groups');
  if(skill.growthProfile!=='fixed'&&!groups.length)errors.push(skill.id+': no eligible growth group');
 }
 for(const upgrade of Object.values(content.upgrades??{}))for(const change of upgrade.changes)if(change.type==='replace_ability'){
  const a=content.abilities[change.from],b=content.abilities[change.to];
  if(a&&b&&!(a.growthProfile==='fixed'&&b.growthProfile==='fixed')&&(skillLineId(a)!==skillLineId(b)||a.growthProfile!==b.growthProfile))errors.push(upgrade.id+': replacement must inherit skill rank');
 }
 return errors;
}
