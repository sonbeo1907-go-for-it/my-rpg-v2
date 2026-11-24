import {bindWaningBuffs} from './witch-cycle.js';
import {moonlightAccess} from './lunar-support.js';
import {isAlive} from './actor-life.js';
import {enterCombatMode} from './combat-modes.js';

export function moonlightActivated(battle,team,definition,io){
 if(definition.id==='chaotic_eclipse')bindWaningBuffs(battle,team);
 for(const actor of battle.actors){const p=actor.passive;
  if(actor.team!==team||!isAlive(actor)||p?.blessingId!==definition.id)continue;
  if(p.type==='moonlight_activation_resource'){
   const amount=Math.max(0,p.amount-(actor.resourceValues[p.resource]??0));
   io.announce?.(battle,actor);io.restore(battle,actor,p.resource,amount);
   io.write(battle,actor.name+': '+actor.resources[p.resource].name+' '+actor.resourceValues[p.resource]+' / '+actor.resources[p.resource].max+'.');continue;
  }
  if(p.type!=='moonlight_activation_mode')continue;
  if(actor.activeMode===p.modeId){actor.modeTurnsRemaining=Math.max(actor.modeTurnsRemaining??0,actor.combatModes[p.modeId].durationTurns);io.emit(battle,{type:'mode_refresh',sourceId:actor.id,mode:p.modeId});io.write(battle,actor.name+': '+actor.combatModes[p.modeId].name+' kéo dài lên 5 lượt chính.');}
  else if(!actor.activeMode)enterCombatMode(battle,actor,p.modeId,io);
 }
}
export function moonlightOffenseMultiplier(battle,team,blessingId){
 let ratio=0;
 for(const actor of battle.actors){const p=actor.passive;if(actor.team===team&&isAlive(actor)&&p?.type==='moonlight_activation_mode'&&p.blessingId===blessingId&&actor.activeMode===p.modeId)ratio=Math.max(ratio,p.blessingAttackBonus??0);}
 for(const actor of battle.actors){const p=actor.passive;if(actor.team===team&&isAlive(actor)&&p?.type==='moonlight_cycle_sage'&&p.blessingId===blessingId)ratio=Math.max(ratio,p.blessingMagicBonus);}
 return 1+ratio;
}
export function moonlightPotencyMultiplier(battle,team,blessingId){
 let ratio=0;
 for(const actor of battle.actors){const p=actor.passive;if(actor.team===team&&isAlive(actor)&&p?.type==='moonlight_potency'&&p.blessingId===blessingId)ratio=Math.max(ratio,actor.activeMode===p.modeId?p.modeRatio:p.ratio);}
 return 1+ratio;
}

export function providerBuff(effect,target,content){
 if(!effect.moonlightProviderBonus||!moonlightAccess(target,content).length)return effect;
 const q=effect.moonlightProviderBonus,modifiers=effect.appliedModifiers??content.statuses[effect.status].modifiers;
 return {...effect,duration:effect.duration*q.durationMultiplier,appliedModifiers:Object.fromEntries(Object.entries(modifiers).map(([key,n])=>[key,n*q.modifierMultiplier]))};
}

export function validateMoonlightSynergies(content){
 const errors=[],fail=id=>errors.push(id+': invalid moonlight synergy');
 for(const actor of Object.values(content.characters??{})){
  const rule=actor.moonlightRevelation;
  if(rule?.onHitStatus&&(!content.statuses[rule.onHitStatus.status]||content.statuses[rule.onHitStatus.status].kind!=='debuff'||!Number.isInteger(rule.onHitStatus.duration)||rule.onHitStatus.duration<1||rule.onHitStatus.duration>20))fail(actor.id);
  if(rule?.counterRank!==undefined&&(!Number.isInteger(rule.counterRank)||rule.counterRank<1||rule.counterRank>8||actor.passive?.counterAbility!==rule.abilityId))fail(actor.id);
  if(rule?.baseAttackFromSpeed&&(!Number.isFinite(rule.baseAttackFromSpeed.ratio)||rule.baseAttackFromSpeed.ratio<=0||rule.baseAttackFromSpeed.ratio>1||!Number.isFinite(rule.baseAttackFromSpeed.cap)||rule.baseAttackFromSpeed.cap<=0||rule.baseAttackFromSpeed.cap>100))fail(actor.id);
  if(rule?.bonusOnlyAbility!==undefined&&rule.bonusOnlyAbility!==true)fail(actor.id);
  if(rule&&(rule.requiresMode!==undefined&&!actor.combatModes?.[rule.requiresMode]||rule.allDamagingSkills!==undefined&&rule.allDamagingSkills!==true||rule.followUpOnly!==undefined&&(rule.followUpOnly!==true||!actor.passive?.followUpAbility)||rule.modePerRound!==undefined&&(!rule.followUpOnly||!Number.isInteger(rule.modePerRound)||rule.modePerRound<1||rule.modePerRound>5)||rule.bonusScalingStat!==undefined&&!['attack','magic'].includes(rule.bonusScalingStat)))fail(actor.id);
  if(rule?.baseStatBonuses&&(!Object.keys(rule.baseStatBonuses).length||Object.entries(rule.baseStatBonuses).some(([key,n])=>!['attack','magic','defense','resistance','speed'].includes(key)||!Number.isFinite(n)||n<=0||n>100)))fail(actor.id);
  if(rule?.commandTargetMode!==undefined&&(rule.commandTargetMode!=='selected'||!rule.commandMultiplier||!['anchored_enemies','selected'].includes(content.moonlightBlessings[rule.blessingId]?.targetMode)))fail(actor.id);
  const p=actor.passive;
  if(p?.type==='moonlight_activation_resource'&&(!actor.moonlightBlessings?.includes(p.blessingId)||!Number.isInteger(p.amount)||p.amount<1||p.amount!==actor.resources?.[p.resource]?.max))fail(actor.id);
  if(p?.type==='moonlight_potency'&&(!actor.moonlightBlessings?.includes(p.blessingId)||!actor.combatModes?.[p.modeId]||!Number.isFinite(p.ratio)||p.ratio<0||!Number.isFinite(p.modeRatio)||p.modeRatio<p.ratio||p.modeRatio>2))fail(actor.id);
  if(p?.type==='moonlight_activation_mode'&&(!actor.moonlightBlessings?.includes(p.blessingId)||actor.combatModes?.[p.modeId]?.lifetime!=='turns'||actor.combatModes[p.modeId]?.durationClock!=='main_turn'||!Number.isFinite(p.blessingAttackBonus)||p.blessingAttackBonus<0||p.blessingAttackBonus>1))fail(actor.id);
 }
 for(const skill of Object.values(content.abilities??{})){
  if(skill.targetElements!==undefined&&(!Array.isArray(skill.targetElements)||!skill.targetElements.length||new Set(skill.targetElements).size!==skill.targetElements.length||skill.targetElements.some(e=>!['light','earth','water','thunder','fire','wind','plain','dark','moon','sword_soul'].includes(e))||!['ally','all_allies'].includes(skill.target)))fail(skill.id);
  for(const e of skill.effects??[])if(e.moonlightProviderBonus){const q=e.moonlightProviderBonus;if(e.type!=='status'||content.statuses[e.status]?.kind!=='buff'||content.statuses[e.status]?.durationClock!=='round'||q.modifierMultiplier!==2||q.durationMultiplier!==2||Object.keys(q).some(k=>!['modifierMultiplier','durationMultiplier'].includes(k)))fail(skill.id);}
  const v=skill.resourceVariants;if(!v)continue;
  if(!Number.isInteger(v.minimum)||v.minimum<1||!Object.values(content.characters).some(a=>a.abilities.includes(skill.id)&&a.resources?.[v.resource]?.max>=v.minimum)||Object.keys(v).some(k=>!['resource','minimum','ready','empty'].includes(k))){fail(skill.id);continue;}
  for(const [key,variant]of Object.entries({ready:v.ready,empty:v.empty})){
   if(!variant||Object.keys(variant).some(k=>!['effects','cost','cooldown','description'].includes(k))||!Number.isInteger(variant.cooldown)||variant.cooldown<0||variant.cooldown>10||!Array.isArray(variant.effects)||!variant.effects.some(e=>e.type==='damage')){fail(skill.id);continue;}
   if(key==='ready'?(variant.cost?.resource?.id!==v.resource||variant.cost.resource.amount!==v.minimum||variant.cost.mp!==undefined):(!Number.isInteger(variant.cost?.mp)||variant.cost.mp<=0||variant.cost.resource!==undefined))fail(skill.id);
   for(const e of variant.effects){
    if(!['damage','command_moonlight'].includes(e.type)||!Number.isFinite(e.multiplier)||e.multiplier<=0||e.multiplier>10||e.primaryMultiplier!==undefined&&(!Number.isFinite(e.primaryMultiplier)||e.primaryMultiplier<=0||e.primaryMultiplier>10))fail(skill.id);
    if(e.type==='damage'&&(!['physical','magical'].includes(e.damageType)||!['light','earth','water','thunder','fire','wind','plain','dark','moon','sword_soul'].includes(e.element)||!['attack','magic'].includes(e.scalingStat)))fail(skill.id);
    if(e.type==='command_moonlight'&&(!content.moonlightBlessings[e.blessingId]||e.optional!==true||e.rankScaling!==undefined&&typeof e.rankScaling!=='boolean'||e.rankScaling===true&&(skill.rankable!==true||skill.growthProfile==='fixed')))fail(skill.id);
   }
  }
 }
 return errors;
}
