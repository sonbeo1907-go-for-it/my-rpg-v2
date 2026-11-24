import {moonlightCyclePhase} from './moonlight-cycle.js';
import {isAlive} from './actor-life.js';
import {damageElements} from './elements.js';

// Only registered, implemented definitions can be granted. Future recipes opt in automatically.
export function moonlightAccess(actor,content){return actor.passive?.type==='moonlight_hymn'&&actor.passive.allBlessings?Object.keys(content.moonlightBlessings??{}):actor.moonlightBlessings??[];}
export function anyMoonlight(battle,team){const active=battle.moonlight?.[team]?.active;return Boolean(active&&battle.round<=active.expiresAfterRound);}
function field(actor){return isAlive(actor)?actor.combatModes?.[actor.activeMode]?.moonlightField:null;}
function* gear(actor,type){const groups=new Set();for(const r of actor?.gearEffects??[]){if(r.effect.type!==type||groups.has(r.effectGroup))continue;groups.add(r.effectGroup);yield r;}}

export function syncLunarAuras(battle){
 const flats={};
 for(const owner of battle.actors){
  owner.moonlightGearActive=anyMoonlight(battle,owner.team);
  if(!isAlive(owner)||!owner.moonlightGearActive)continue;
  for(const r of gear(owner,'moonlit_vitality')){
   const team=flats[owner.team]??={};
   for(const [key,n]of Object.entries(r.effect.teamBaseBonuses))team[key]=Math.max(team[key]??0,n);
  }
 }
 for(const actor of battle.actors){
  actor.lunarBaseBonuses={...(flats[actor.team]??{})};actor.lunarModifiers={};
  actor.lunarCyclePhase=moonlightCyclePhase(battle,actor.team)?.id??null;
  if(isAlive(actor)&&actor.passive?.type==='moonlight_full_sinner'&&actor.lunarCyclePhase==='full')actor.lunarBaseBonuses.magic=(actor.lunarBaseBonuses.magic??0)+actor.passive.fullMoonBaseMagic;
  for(const owner of battle.actors){const f=field(owner);if(!f||owner.team===actor.team)continue;
   for(const[key,n]of Object.entries(f.enemyModifiers))actor.lunarModifiers[key]=Math.min(actor.lunarModifiers[key]??0,n);
  }
 }
}
export function lunarBaseDamageMultiplier(battle,source,effect){
 if(!source||!damageElements(effect).includes('moon'))return 1;
 let ratio=0;for(const owner of battle.actors)if(owner.team===source.team&&isAlive(owner)&&owner.passive?.type==='moonlight_hymn')ratio=Math.max(ratio,owner.passive.moonDamageBonus);
 return 1+ratio;
}
export function lunarOutgoingAmp(battle,source,effect,context){
 if(!source||!anyMoonlight(battle,source.team)||!damageElements(effect).includes('moon'))return 1;
 // A commanded pulse keeps its independent blessing source; only this cast borrows the commander's gear amp.
 const owner=source.actorKind==='moonlight'&&context?.moonlightCommanderId?battle.actors.find(a=>a.id===context.moonlightCommanderId&&a.team===source.team):source;
 let ratio=0;for(const r of gear(owner,'moonlit_offense'))ratio=Math.max(ratio,r.effect.moonDamageBonus);
 return 1+ratio;
}
export function lunarIncomingMultiplier(battle,target,effect){
 if(!damageElements(effect).includes('moon'))return 1;
 let ratio=0;for(const owner of battle.actors){const f=field(owner);if(f&&owner.team!==target.team)ratio=Math.max(ratio,f.moonDamageTaken);}
 return 1+ratio;
}
export function moonlightEmpoweredBuff(battle,actor,effect){
 let result=effect;
 if(effect.moonlightDouble&&anyMoonlight(battle,actor.team))result={...result,baseStatModifiers:Object.fromEntries(Object.entries(effect.baseStatModifiers).map(([key,n])=>[key,n*2]))};
 const mark=effect.onHitStatus;if(mark?.moonlightMultiplier){const factor=anyMoonlight(battle,actor.team)?mark.moonlightMultiplier:1;result={...result,onHitStatus:{...mark,appliedModifiers:Object.fromEntries(Object.entries(battle.content.statuses[mark.status].modifiers).map(([key,n])=>[key,n*factor]))}};}
 return result;
}
// Damage aspect is selected at the pulse, not at mode entry. Unimplemented recipes stay unreachable.
export function moonlightAspectAbility(battle,owner,skill){
 if(!skill.effects.some(e=>e.moonlightAspect))return skill;
 if(!anyMoonlight(battle,owner.team))return null;
 const id=battle.moonlight[owner.team].active.id;
 const aspects={thunder_wrath:['physical','thunder'],bountiful_seed:['magical','earth'],nameless_song:['physical','dark'],chaotic_eclipse:['magical','fire']};
 const aspect=aspects[id];if(!aspect)return null;
 return {...skill,effects:skill.effects.map(e=>e.moonlightAspect?{...e,damageType:aspect[0],element:aspect[1],additionalElements:['moon']}:e)};
}
export function lunarRoundStart(battle,io){
 for(const owner of battle.actors){const f=field(owner);if(!f||battle.outcome||owner.lunarStartRound===battle.round)continue;
  owner.lunarStartRound=battle.round;
  const skill=battle.content.abilities[f.roundStartAbility];
  io.write(battle,owner.combatModes[owner.activeMode].name+' · đầu vòng: giải 1 hiệu ứng bất lợi và cấp Hộ Ấn cho toàn đội.');
  io.emit(battle,{type:'ability_cast',sourceId:owner.id,abilityId:skill.id,targetIds:battle.actors.filter(a=>a.team===owner.team&&isAlive(a)).map(a=>a.id),automaticCast:true,area:true});
  io.apply(battle,owner,skill.effects);
 }
}
export function lunarRoundEnd(battle,io){
 for(const owner of battle.actors){const f=field(owner);if(!f||battle.outcome||owner.lunarEndRound===battle.round)continue;
  owner.lunarEndRound=battle.round;io.pulse(battle,owner,f.roundEndAbility,owner.combatModes[owner.activeMode].name,'end');
  if(io.outcome(battle))return;
 }
}

export function validateLunarSupport(content){
 const errors=[],bad=(id,part)=>errors.push(id+': invalid lunar '+part);
 for(const actor of Object.values(content.characters??{})){
  const p=actor.passive;if(p?.type==='moonlight_hymn'&&(p.allBlessings!==true||!Number.isFinite(p.moonDamageBonus)||p.moonDamageBonus<=0||p.moonDamageBonus>1||!p.name||!p.description))bad(actor.id,'hymn');
  for(const mode of Object.values(actor.combatModes??{})){const f=mode.moonlightField;if(f===undefined)continue;if(!f||typeof f!=='object'||Array.isArray(f)){bad(actor.id,'field');continue;}
   const start=content.abilities[f.roundStartAbility],end=content.abilities[f.roundEndAbility];
   if(mode.lifetime!=='rounds'||!f.enemyModifiers||Object.keys(f.enemyModifiers).sort().join(':')!=='attack:magic'||Object.values(f.enemyModifiers).some(n=>!Number.isFinite(n)||n>=0||n< -1)||!Number.isFinite(f.moonDamageTaken)||f.moonDamageTaken<=0||f.moonDamageTaken>1||start?.activation!=='passive'||start.target!=='all_allies'||!Array.isArray(start.effects)||!start.effects.length||start.cost||start.cooldown||start.effects.some(e=>!['cleanse','status'].includes(e.type)||e.to!=='all_allies')||end?.activation!=='passive'||end.target!=='all_enemies'||!Array.isArray(end.effects)||!end.effects.length||end.cost||end.cooldown||!end.effects.every(e=>e.type==='damage'&&e.moonlightAspect===true)||!actor.abilities.includes(end.rankFromAbility))bad(actor.id,'field');
  }
 }
 for(const skill of Object.values(content.abilities??{}))for(const effect of skill.effects??[]){
  if(effect.moonlightDouble!==undefined&&(effect.moonlightDouble!==true||effect.type!=='status'||content.statuses[effect.status]?.kind!=='buff'||!effect.baseStatModifiers||Object.keys(effect.baseStatModifiers).length!==2||!effect.baseStatModifiers.attack||!effect.baseStatModifiers.magic))bad(skill.id,'empowered buff');
  if(effect.moonlightAspect!==undefined&&(effect.moonlightAspect!==true||effect.type!=='damage'||effect.scalingStat!=='maxHp'||!Object.values(content.characters).some(a=>Object.values(a.combatModes??{}).some(m=>m.moonlightField?.roundEndAbility===skill.id))))bad(skill.id,'aspect');
 }
 return errors;
}
