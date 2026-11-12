import {isAlive} from './actor-life.js';
export const GUARDIAN_GEAR_TYPES=['shield_team_guard','ally_shield_relay','support_cooldown','full_hp_offense','low_hp_offense','single_skill_echo','debuff_skill_echo','healing_team_resonance'];
export function* guardianRecipes(actor,type){const groups=new Set();for(const r of actor?.gearEffects??[]){if(r.effect.type!==type||groups.has(r.effectGroup))continue;groups.add(r.effectGroup);yield r;}}
export function conditionalGearBaseBonus(actor,key){
 let extra=0;for(const r of actor.gearEffects??[]){const e=r.effect;if(!['full_hp_offense','low_hp_offense'].includes(e.type))continue;
 const qualifies=e.type==='full_hp_offense'?actor.hp===undefined||actor.hp>=actor.stats.maxHp:actor.hp!==undefined&&actor.hp/actor.stats.maxHp<e.threshold;
 if(qualifies)extra+=actor.gearConditionalBonuses?.[r.effectGroup]?.[key]??0;
 }return extra;
}
export function gearGuardAfterShield(b,actor,skill,context,io){
 if(!isAlive(actor)||context.reaction||context.automatic||skill.id.startsWith('$')||skill.activation==='passive'||!skill.effects.some(e=>e.type==='shield'))return;
 for(const r of guardianRecipes(actor,'shield_team_guard'))for(const ally of b.actors.filter(x=>x.team===actor.team&&isAlive(x)))io.status(b,ally,r.effect.status,2,actor.id);
}
export function gearSupportCooldown(b,actor,io){
 if(b.phase!=='main'||!isAlive(actor))return;
 for(const r of guardianRecipes(actor,'support_cooldown')){
  const candidates=(actor.abilities??[]).filter(id=>!id.startsWith('$')&&actor.cooldowns[id]>0&&b.content.abilities[id]?.activation!=='passive'&&b.content.abilities[id]?.effects.some(e=>e.type==='heal'||e.type==='shield')).sort((a,z)=>actor.cooldowns[z]-actor.cooldowns[a]||actor.abilities.indexOf(a)-actor.abilities.indexOf(z));
  const id=candidates[0];if(!id)continue;actor.cooldowns[id]=Math.max(0,actor.cooldowns[id]-r.effect.amount);io.emit(b,{type:'cooldowns_reduced',sourceId:actor.id,targetId:actor.id,amount:r.effect.amount,abilityId:id,gearEffectId:r.id});io.write(b,actor.name+' kích hoạt '+r.name+': giảm '+r.effect.amount+' vòng hồi chiêu '+b.content.abilities[id].name+'.');
 }
}
export function gearShieldBroken(b,target,attacker,io){
 if(!isAlive(target)||attacker.team===target.team)return;
 for(const owner of b.actors.filter(x=>x.team===target.team&&isAlive(x))){for(const r of guardianRecipes(owner,'ally_shield_relay')){
  if(owner.gearEffectProcRounds?.[r.effectGroup]===b.round)continue;
  (owner.gearEffectProcRounds??={})[r.effectGroup]=b.round;
  io.shield(b,target,Math.round(owner.stats.maxHp*r.effect.ratio),owner.id);
  io.emit(b,{type:'passive',sourceId:owner.id,targetId:target.id,label:r.name,gearEffectId:r.id});
 }}
}
export function gearHealingOccurred(b,source,target,amount,token,io){
 if(!source||!isAlive(source)||!isAlive(target)||source.team!==target.team||amount<=0)return;
 for(const r of guardianRecipes(source,'healing_team_resonance')){
  token.gearHealingWinners??=new Map();const winner=token.gearHealingWinners.get(r.effectGroup);
  if(winner&&winner!==source.id)continue;
  const used=b.gearTeamProcRounds?.[source.team]?.[r.effectGroup]===b.round;
  if(used&&!winner)continue;
  if(!used){
   ((b.gearTeamProcRounds??={})[source.team]??={})[r.effectGroup]=b.round;token.gearHealingWinners.set(r.effectGroup,source.id);
   io.emit(b,{type:'passive',sourceId:source.id,targetId:target.id,label:r.name,gearEffectId:r.id});
   for(const ally of b.actors.filter(x=>x.team===source.team&&isAlive(x)))io.restore(b,ally,'mp',r.effect.amount,source.id);
  }
  token.gearHealingProtected??=new Set();const key=r.effectGroup+':'+target.id;if(token.gearHealingProtected.has(key))continue;token.gearHealingProtected.add(key);
  io.status(b,target,r.effect.status,1,source.id);
 }
}
export function validGuardianRecipe(r,c){
 const e=r.effect;if(!GUARDIAN_GEAR_TYPES.includes(e?.type))return null;
 if(r.cooldownRounds!==0||r.hook!==undefined||r.condition!==undefined||r.oncePerEncounter!==undefined)return false;
 const mods={shield_team_guard:{defense:.15,resistance:.15},ally_shield_relay:{maxHp:.15},support_cooldown:{maxHp:.15},full_hp_offense:{attack:.15,magic:.15},low_hp_offense:{attack:.2,magic:.2},single_skill_echo:{attack:.12,magic:.12},debuff_skill_echo:{magic:.15},healing_team_resonance:{magic:.15}}[e.type];
 if(JSON.stringify(e.modifiers)!==JSON.stringify(mods))return false;
 if(['ally_shield_relay','single_skill_echo'].includes(e.type)?r.oncePerRound!==true:r.oncePerRound!==undefined)return false;
 if(e.type==='healing_team_resonance'?r.oncePerTeamRound!==true:r.oncePerTeamRound!==undefined)return false;
 switch(e.type){
 case 'shield_team_guard':return c.statuses[e.status]?.modifiers?.directDamageReduction===.15&&c.statuses[e.status]?.durationClock==='round';
 case 'ally_shield_relay':return e.ratio===.35;
 case 'support_cooldown':return e.amount===1;
 case 'full_hp_offense':return true;
 case 'low_hp_offense':return e.threshold===.7;
 case 'single_skill_echo':return e.ratio===.85&&e.maxTargets===2;
 case 'debuff_skill_echo':return e.threshold===2&&e.highThreshold===4&&e.ratio===.9&&e.highRatio===1.8;
 case 'healing_team_resonance':return e.amount===6&&c.statuses[e.status]?.modifiers?.damageReduction===.1&&c.statuses[e.status]?.durationClock==='round';
 }return false;
}
