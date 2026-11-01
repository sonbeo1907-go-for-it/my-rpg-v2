// Pure, data-driven Trấn Phái adapters. No battle state is mutated here.
export const SPECIAL_EXCLUSIVE_TYPES=['brace_chance','resource_skill_stat','resource_stat_status','after_skill_shield','heal_threshold','defend_recovery','skill_status_strength','skill_extra_buff','after_skill_mp','skill_speed_damage','shield_break_mp','automatic_damage_mp','team_tag_power','ward_shield','heal_buff_count','extra_payment_stat','team_mp_magic_guard','marked_ally_ratio'];
export function specialPassives(actor,type){const p=actor?.exclusiveGear?.template?.passive;return (p?.type==='bundle'?p.effects:p?[p]:[]).filter(p=>!type||p.type===type);}
export const hasLiveStatus=(actor,id)=>actor?.statuses?.some(s=>s.id===id&&(s.remaining==null||s.remaining>0))??false;
export function validateSpecialPassive(p,content){
 if(!SPECIAL_EXCLUSIVE_TYPES.includes(p.type)||!p.name?.trim()||!p.description?.trim())return false;
 if(p.abilityIds!==undefined&&(!Array.isArray(p.abilityIds)||!p.abilityIds.length||p.abilityIds.some(id=>!content.abilities[id])))return false;
 for(const key of ['statusId','requiresStatus'])if(p[key]!==undefined&&!content.statuses[p[key]])return false;
 if(p.stat!==undefined&&!['attack','magic','defense','resistance','speed'].includes(p.stat))return false;
 for(const key of ['ratio','bonusChance','atStat','duration','amount','threshold','hpRatio','extraDuration','mpMultiplier','fullTeamPenetration','atMp','cap','stacks'])if(p[key]!==undefined&&(!Number.isFinite(p[key])||p[key]<=0))return false;
 const required={brace_chance:['statusId','stat','atStat','bonusChance','resourceId'],resource_skill_stat:['resourceId','stat','ratio'],resource_stat_status:['resourceId','statusId','duration'],after_skill_shield:['abilityIds','target','stat','ratio'],heal_threshold:['threshold','stat','ratio'],defend_recovery:['resourceId','amount','hpRatio'],skill_status_strength:['abilityIds','statusId','ratio','extraDuration','mpMultiplier'],skill_extra_buff:['abilityIds','statusId','duration','rankGrowth'],after_skill_mp:['abilityIds','amount'],skill_speed_damage:['abilityIds','requiresStatus','ratio'],shield_break_mp:['amount','oncePerRound'],automatic_damage_mp:['abilityIds','amount','oncePerRound'],team_tag_power:['tag','modifiers','fullTeamPenetration'],ward_shield:['stat','ratio'],heal_buff_count:['abilityIds','statusId','stat','ratio'],extra_payment_stat:['stat','ratio'],team_mp_magic_guard:['atMp','cap'],marked_ally_ratio:['statusId','stacks','ratio']};
 if(required[p.type].some(key=>p[key]===undefined))return false;
 if(['duration','amount','extraDuration','stacks'].some(key=>p[key]!==undefined&&!Number.isSafeInteger(p[key])))return false;
 if(['threshold','hpRatio','bonusChance','fullTeamPenetration','cap'].some(key=>p[key]!==undefined&&p[key]>1))return false;
 if(p.resourceId!==undefined&&(typeof p.resourceId!=='string'||!Object.values(content.characters).some(c=>c.resources?.[p.resourceId])))return false;
 if(p.tag!==undefined&&!Object.values(content.characters).some(c=>c.tags?.includes(p.tag)))return false;
 if(p.type==='after_skill_shield'&&!['self','lowest_hp_ally'].includes(p.target))return false;
 if(p.type==='skill_extra_buff'&&p.rankGrowth!=='stat_buff')return false;
 if(p.type==='team_tag_power'&&(!p.modifiers||Object.entries(p.modifiers).some(([key,n])=>!['attack','magic','defense','resistance'].includes(key)||!Number.isFinite(n)||n<=0)))return false;
 if(['shield_break_mp','automatic_damage_mp'].includes(p.type)&&p.oncePerRound!==true)return false;
 return true;
}
export function specialMpMultiplier(actor,skillId){return specialPassives(actor,'skill_status_strength').filter(p=>p.abilityIds.includes(skillId)).reduce((n,p)=>n*p.mpMultiplier,1);}
export function applySpecialSkillModifiers(content,actor,skill,statFactor){
 for(const p of specialPassives(actor)){
  if(!p.abilityIds?.includes(skill.id))continue;
  if(p.type==='skill_status_strength')skill.effects=skill.effects.map(effect=>effect.status===p.statusId?{...effect,duration:effect.duration+p.extraDuration,appliedModifiers:Object.fromEntries(Object.entries(content.statuses[effect.status].modifiers??{}).map(([k,n])=>[k,n*p.ratio]))}:effect);
  if(p.type==='skill_extra_buff')skill.effects.push({type:'status',status:p.statusId,duration:p.duration,appliedModifiers:Object.fromEntries(Object.entries(content.statuses[p.statusId].modifiers).map(([k,n])=>[k,n*statFactor]))});
 }
 return skill;
}
export function specialSkillStatBonuses(actor,skill,{spentResource,spent=0,fullExtraPayment=false}={}){
 const result={};for(const p of specialPassives(actor)){
  if(p.type==='resource_skill_stat'&&spent>0&&spentResource===p.resourceId||p.type==='extra_payment_stat'&&fullExtraPayment)result[p.stat]=(result[p.stat]??0)+p.ratio;
 }return result;
}
