const HOOKS={direct_reduction:'before_direct_hit',impact_shield:'after_direct_hit',critical_heal:'hp_loss',defend_mp:'after_action',low_mp:'main_turn_start',ally_buff_mp:'buff_applied',guard_reduction:'damage_reduction',emergency_heal:'skill_heal',healed_mp:'skill_healed',healthy_target_bonus:'skill_damage',shield_only_bonus:'shield_damage',execute_bonus:'skill_damage',damage_status:'after_skill_attack',weakness_mp:'after_skill_attack',exposure_on_hit:'after_skill_attack',ally_weakness_shield:'ally_weakness_hit'};
export function validGearEffect(recipe,content){
 const e=recipe.effect,ratio=n=>Number.isFinite(n)&&n>0&&n<=1,whole=n=>Number.isSafeInteger(n)&&n>0;
 if(!e)return false;
 if(e.type==='mp_stat_conversion')return recipe.hook==='base_stats'&&recipe.cooldownRounds===0&&recipe.oncePerRound===undefined&&recipe.oncePerEncounter===undefined&&recipe.condition===undefined&&['attack','magic'].includes(e.stat)&&e.ratio===.05&&e.cap===25;
 if(['status','heal','mp'].includes(e.type)){
  if(recipe.hook&&recipe.hook!=='round_start')return false;
  if(!['no_ward','missing_hp','missing_mp','missing_status'].includes(recipe.condition)||!whole(recipe.cooldownRounds))return false;
  return e.type==='status'?content.statuses[e.status]?.kind==='buff'&&(content.statuses[e.status].persistent||whole(e.duration)):ratio(e.ratio)&&e.ratio<=.25;
 }
 if(HOOKS[e.type]!==recipe.hook||!Object.hasOwn(HOOKS,e.type)||recipe.condition!==undefined)return false;
 if(['direct_reduction','damage_status'].includes(e.type)&&!['physical','magical'].includes(e.damageType))return false;
 if(['impact_shield','critical_heal','low_mp','emergency_heal','healthy_target_bonus','execute_bonus'].includes(e.type)&&!ratio(e.threshold))return false;
 if(['direct_reduction','impact_shield','critical_heal','low_mp','guard_reduction','emergency_heal','healthy_target_bonus','shield_only_bonus','execute_bonus','ally_weakness_shield'].includes(e.type)&&!ratio(e.ratio))return false;
 if(['defend_mp','ally_buff_mp','healed_mp','weakness_mp'].includes(e.type)&&!whole(e.amount))return false;
 if(e.type==='low_mp'&&!whole(e.minimum))return false;
 if(e.type==='damage_status'&&(content.statuses[e.status]?.kind!=='debuff'||!whole(e.duration)))return false;
 if(e.type==='exposure_on_hit'&&!ratio(e.chance))return false;
 if(['critical_heal'].includes(e.type)&&recipe.oncePerEncounter!==true)return false;
 if(['ally_buff_mp','emergency_heal','healed_mp','ally_weakness_shield'].includes(e.type)&&recipe.oncePerRound!==true)return false;
 return true;
}
export function gearEffectTiming(recipe){return recipe.hook==='base_stats'?'Luôn hoạt động':recipe.oncePerEncounter?'1 lần / trận':recipe.oncePerRound?'1 lần / vòng':recipe.cooldownRounds?`${recipe.cooldownRounds} vòng`:'Không hồi chiêu';}
export function gearRecipeRequirement(content,recipe){return recipe.requires?.firstClear?`Thắng ${content.encounters[recipe.requires.firstClear]?.name??'Truy Nã'} lần đầu để mở.`:recipe.requires?.storyFlag?'Hoàn thành vĩ thanh Arthur để mở công thức.':'Công thức đã sẵn sàng.';}
export function gearRecipeSource(recipe){return recipe.requires?.firstClear?`/quests?tab=bounty&selected=${recipe.requires.firstClear}`:'/stories/epilogue';}
