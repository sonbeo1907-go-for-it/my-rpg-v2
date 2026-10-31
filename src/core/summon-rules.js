export function validateSummonDefinition(actor,content,fail) {
 const id=actor.id,own=skill=>actor.abilities?.includes(skill),command=skill=>['$attack','$defend'].includes(skill)||own(skill);
 if (actor.normalAbilities!==undefined && (!Array.isArray(actor.normalAbilities)||!actor.normalAbilities.length||new Set(actor.normalAbilities).size!==actor.normalAbilities.length||actor.normalAbilities.some(skill=>!own(skill)))) fail(id+': invalid normal command set');
 if (actor.preModeAbility!==undefined && (!own(actor.preModeAbility)||content.abilities[actor.preModeAbility]?.target!=='self'||!content.abilities[actor.preModeAbility]?.effects.some(effect=>effect.type==='prepare_mode'))) fail(id+': invalid preparation ability');
 for(const [key,mode] of Object.entries(actor.combatModes??{})) {
  const life=mode.lifetime??'resource';
  if (!mode.name||!['resource','rounds','permanent'].includes(life)||!Array.isArray(mode.allowedAbilities)||!mode.allowedAbilities.length||new Set(mode.allowedAbilities).size!==mode.allowedAbilities.length||mode.allowedAbilities.some(skill=>!command(skill))||!Number.isFinite(mode.exitMpRatio)||mode.exitMpRatio<0||mode.exitMpRatio>1||!mode.baseStatBonuses||Object.entries(mode.baseStatBonuses).some(([stat,n])=>!['attack','magic','defense','resistance','speed'].includes(stat)||!Number.isFinite(n)||n<0)||!/^\/art\/[a-z0-9_-]+\.svg$/.test(mode.background)) fail(id+': invalid combat mode');
  if (life==='resource'&&(!actor.resources?.[mode.resource]||mode.emptyExit!=='turn_start_or_round_end')) fail(id+': invalid resource mode');
  if (life==='rounds'&&(!Number.isInteger(mode.durationRounds)||mode.durationRounds<1||mode.durationRounds>20)) fail(id+': invalid timed mode');
  if (life!=='resource' && (mode.resource!==undefined||mode.emptyExit!==undefined)) fail(id+': conflicting mode lifetime');
  if (mode.music!==undefined&&!content.music[mode.music]) fail(id+': invalid mode music');
  if (mode.commandAbilities!==undefined&&(!Array.isArray(mode.commandAbilities)||!mode.commandAbilities.length||new Set(mode.commandAbilities).size!==mode.commandAbilities.length||mode.commandAbilities.some(skill=>!mode.allowedAbilities.includes(skill)))) fail(id+': invalid transformed commands');
  if (mode.entryEffects!==undefined&&(!Array.isArray(mode.entryEffects)||!mode.entryEffects.length||mode.entryEffects.some(e=>e.type!=='shield'||e.scalingStat!=='maxHp'||!Number.isFinite(e.multiplier)||e.multiplier<=0||e.multiplier>2||Object.keys(e).some(k=>!['type','scalingStat','multiplier'].includes(k))))) fail(id+': invalid mode entry shield');
 }
 for(const [key,summon] of Object.entries(actor.companions??{})) {
  if (!key||!summon.name||!summon.summary||!Number.isInteger(summon.durationRounds)||summon.durationRounds<1||summon.durationRounds>10||!actor.combatModes?.[summon.requiresMode]||!/^\/art\/[a-z0-9_-]+\.svg$/.test(summon.background)) fail(id+': invalid companion');
  for(const abilityId of [summon.roundStartAbility,summon.roundEndAbility]) {
   const a=content.abilities[abilityId];
   if (!a||a.activation!=='passive'||a.target!=='all_enemies'||a.cost||a.cooldown||!a.effects?.length||a.effects.some(e=>e.type!=='damage')) fail(id+': invalid companion pulse');
  }
 }
 for(const abilityId of actor.abilities??[]) for(const effect of content.abilities[abilityId]?.effects??[]) {
  if (['prepare_mode','enter_mode'].includes(effect.type)&&!actor.combatModes?.[effect.mode]) fail(id+': unknown prepared mode');
  if (effect.type==='summon_companion' && !actor.companions?.[effect.companion]) fail(id+': unknown companion');
 }
}
