// Pure, data-driven Trấn Phái adapters. No battle state is mutated here.
export const SPECIAL_EXCLUSIVE_TYPES=['defend_adjacent_support','brace_chance','resource_skill_stat','resource_stat_status','after_skill_shield','heal_threshold','defend_recovery','skill_status_strength','skill_extra_buff','after_skill_mp','skill_speed_damage','shield_break_mp','automatic_damage_mp','team_tag_power','ward_shield','heal_buff_count','extra_payment_stat','team_mp_magic_guard','marked_ally_ratio','native_passive_override','skill_hp_difference_stat','skill_status_override','enemy_status_self_buff','resource_skill_penetration','resource_chance_bonus','mode_mp_discount','mode_stat_boost','resource_keep_chance','end_round_shielded_mp','on_revive_reset_cooldown'];
export function specialPassives(actor,type){const p=actor?.exclusiveGear?.template?.passive;return (p?.type==='bundle'?p.effects:p?[p]:[]).filter(p=>!type||p.type===type);}
export const hasLiveStatus=(actor,id)=>actor?.statuses?.some(s=>s.id===id&&(s.remaining==null||s.remaining>0))??false;
export function validateSpecialPassive(p,content){
 if(!SPECIAL_EXCLUSIVE_TYPES.includes(p.type)||!p.name?.trim()||!p.description?.trim())return false;
 if(p.abilityIds!==undefined&&(!Array.isArray(p.abilityIds)||!p.abilityIds.length||p.abilityIds.some(id=>!content.abilities[id])))return false;
 for(const key of ['statusId','requiresStatus'])if(p[key]!==undefined&&!content.statuses[p[key]])return false;
 if(p.stat!==undefined&&!['attack','magic','defense','resistance','speed'].includes(p.stat))return false;
 for(const key of ['ratio','bonusChance','atStat','duration','amount','threshold','hpRatio','extraDuration','mpMultiplier','fullTeamPenetration','atMp','cap','stacks'])if(p[key]!==undefined&&(!Number.isFinite(p[key])||p[key]<=0))return false;
 const required={defend_adjacent_support:["ratio","statusId","duration"],brace_chance:['statusId','stat','atStat','bonusChance','resourceId'],resource_skill_stat:['resourceId','stat','ratio'],resource_stat_status:['resourceId','statusId','duration'],after_skill_shield:['abilityIds','target','stat','ratio'],heal_threshold:['threshold','stat','ratio'],defend_recovery:['resourceId','amount','hpRatio'],skill_status_strength:['abilityIds','statusId','ratio','extraDuration','mpMultiplier'],skill_extra_buff:['abilityIds','statusId','duration','rankGrowth'],after_skill_mp:['abilityIds','amount'],skill_speed_damage:['abilityIds','requiresStatus','ratio'],shield_break_mp:['amount','oncePerRound'],automatic_damage_mp:['abilityIds','amount','oncePerRound'],team_tag_power:['tag','modifiers','fullTeamPenetration'],ward_shield:['stat','ratio'],heal_buff_count:['abilityIds','statusId','stat','ratio'],extra_payment_stat:['stat','ratio'],team_mp_magic_guard:['atMp','cap'],marked_ally_ratio:['statusId','stacks','ratio'],native_passive_override:['passiveType','changes'],skill_hp_difference_stat:['stat','ratio','cap'],skill_status_override:['abilityIds','statusId','modifiers'],enemy_status_self_buff:['statusKind','statusId','duration'],resource_skill_penetration:['abilityIds','resourceId','damageType','ratio'],resource_chance_bonus:['resourceId','chance','failureStep','amount'],mode_mp_discount:['modeId','ratio'],mode_stat_boost:['modeId','stat','ratio'],resource_keep_chance:['abilityIds','resourceId','stat','atStat'],end_round_shielded_mp:['ratio'],on_revive_reset_cooldown:['abilityIds']};
 if(required[p.type].some(key=>p[key]===undefined))return false;
 if(['duration','amount','extraDuration','stacks'].some(key=>p[key]!==undefined&&!Number.isSafeInteger(p[key])))return false;
 if(['threshold','hpRatio','bonusChance','fullTeamPenetration','cap'].some(key=>p[key]!==undefined&&p[key]>1))return false;
 if(p.resourceId!==undefined&&(typeof p.resourceId!=='string'||!Object.values(content.characters).some(c=>c.resources?.[p.resourceId])))return false;
 if(p.tag!==undefined&&!Object.values(content.characters).some(c=>c.tags?.includes(p.tag)))return false;
 if(p.type==='after_skill_shield'&&!['self','lowest_hp_ally'].includes(p.target))return false;
 if(p.type==='skill_extra_buff'&&p.rankGrowth!=='stat_buff')return false;
 if(p.type==='team_tag_power'&&(!p.modifiers||Object.entries(p.modifiers).some(([key,n])=>!['attack','magic','defense','resistance'].includes(key)||!Number.isFinite(n)||n<=0)))return false;
 if(['shield_break_mp','automatic_damage_mp'].includes(p.type)&&p.oncePerRound!==true)return false;
 if(p.type==='native_passive_override'){
  if(!['dot_potency_bonus','stat_conversion','resource_stat_boost','formation_stance'].includes(p.passiveType)||!p.changes||Array.isArray(p.changes))return false;
  const keys=Object.keys(p.changes);if(!keys.length||keys.some(k=>!(p.passiveType==='formation_stance'?['odd','even','description']:['ratio','description']).includes(k)))return false;
  if(p.passiveType==='formation_stance'){if(['odd','even'].some(k=>!p.changes[k]?.name?.trim()||!p.changes[k].modifiers||!Object.keys(p.changes[k].modifiers).length||Object.entries(p.changes[k].modifiers).some(([s,n])=>!['attack','magic','defense','resistance','speed'].includes(s)||!Number.isFinite(n)||n<=0||n>1)))return false;}
  else if(!Number.isFinite(p.changes.ratio)||p.changes.ratio<=0||p.changes.ratio>1)return false;
  if(p.changes.description!==undefined&&!p.changes.description?.trim())return false;
 }
 if(p.type==='skill_hp_difference_stat'&&(p.stat!=='attack'||p.ratio>2))return false;
 if(p.type==='skill_status_override'&&(!p.modifiers||!Object.keys(p.modifiers).length||Object.entries(p.modifiers).some(([k,n])=>!['attack','magic','defense','resistance','speed'].includes(k)||!Number.isFinite(n)||n>=0||n< -1)))return false;
 if(p.type==='enemy_status_self_buff'&&(!['buff','debuff'].includes(p.statusKind)||content.statuses[p.statusId]?.kind!=='buff'||!content.statuses[p.statusId]?.maxStacks))return false;
 if(p.type==='resource_skill_penetration'&&(!['physical','magical'].includes(p.damageType)||p.ratio>1||p.abilityIds.some(id=>![content.abilities[id].cost?.resource?.id,content.abilities[id].cost?.preferResource?.id].includes(p.resourceId))))return false;
 if(p.type==='resource_chance_bonus'&&(!Number.isFinite(p.chance)||p.chance<=0||p.chance>1||!Number.isFinite(p.failureStep)||p.failureStep<=0||p.failureStep>1||p.amount!==1))return false;
 if(p.type==='mode_mp_discount'&&(!Object.values(content.characters).some(a=>a.combatModes?.[p.modeId])||p.ratio>=1||!p.modeSummary?.trim()))return false;
 if(p.type==='mode_stat_boost'&&(!Object.values(content.characters).some(a=>a.combatModes?.[p.modeId])||p.ratio>=1))return false;
 if(p.type==='resource_keep_chance'&&(p.abilityIds.some(id=>content.abilities[id].cost?.resource?.id!==p.resourceId)||p.cap!==undefined&&(p.cap<=0||p.cap>1)))return false;
 return true;
}
export function specialMpMultiplier(actor,skillId){return specialPassives(actor,'skill_status_strength').filter(p=>p.abilityIds.includes(skillId)).reduce((n,p)=>n*p.mpMultiplier,1);}
export function applySpecialSkillModifiers(content,actor,skill,statFactor){
 for(const p of specialPassives(actor)){
  if(!p.abilityIds?.includes(skill.id))continue;
  if(p.type==='skill_status_override')skill.effects=skill.effects.map(e=>e.status===p.statusId?{...e,appliedModifiers:{...p.modifiers}}:e);
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

export function applyNativeExclusiveUpgrades(actor){
 for(const p of specialPassives(actor)){
  if(p.type==='native_passive_override'&&actor.passive?.type===p.passiveType)actor.passive={...actor.passive,...structuredClone(p.changes)};
  if(p.type==='mode_mp_discount'&&actor.combatModes?.[p.modeId]){const mode=actor.combatModes[p.modeId];mode.mpCostReduction=p.ratio;mode.summary=p.modeSummary;}
 }
}
export function specialHitStatBonus(actor,target,context,key){
 if(context.reaction||context.automatic||!context.skill||context.skill.id.startsWith('$')||context.skill.activation==='passive')return 0;
 return specialPassives(actor,'skill_hp_difference_stat').filter(p=>p.stat===key).reduce((sum,p)=>sum+Math.min(p.cap,p.ratio*Math.abs(actor.hp/actor.stats.maxHp-target.hp/target.stats.maxHp)),0);
}
export function specialResourcePenetration(actor,skillId,effect,spent){
 return specialPassives(actor,'resource_skill_penetration').filter(p=>p.abilityIds.includes(skillId)&&p.damageType===effect.damageType).reduce((sum,p)=>sum+p.ratio*spent,0);
}
export function specialResourceKeepChance(actor,skillId,resourceId,baseStat){
 const p=specialPassives(actor,'resource_keep_chance').find(p=>p.abilityIds.includes(skillId)&&p.resourceId===resourceId);
 if(!p)return null;
 const cap=p.cap??1;
 return {passive:p,chance:Math.min(cap,Math.max(0,baseStat(p.stat))/p.atStat*cap)};
}
