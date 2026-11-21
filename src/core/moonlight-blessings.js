import {coefficientFactor,skillRules} from './skill-rules.js';
import {moonlightOffenseMultiplier} from './moonlight-synergy.js';
import {revelationActive} from './moonlight-revelation.js';
import {isAlive} from './actor-life.js';
import {damageElements} from './elements.js';

const pairKey=pair=>[...pair].sort().join(':');
const PAIRS=new Set([['water','thunder'],['water','fire'],['light','earth'],['light','dark']].map(pairKey));
export function validateMoonlight(content){
 const errors=[],defs=content.moonlightBlessings??{};
 for(const d of Object.values(defs)){
  if(!d.name||!d.description||!Array.isArray(d.elements)||d.elements.length!==2||!PAIRS.has(pairKey(d.elements))||!['attack','magic'].includes(d.stat)||!Number.isFinite(d.statRatio)||d.statRatio<=0||d.durationRounds!==3||!['all_enemies','anchored_enemies'].includes(d.targetMode)||!Array.isArray(d.phases)||!d.phases.length||new Set(d.phases).size!==d.phases.length||d.phases.some(p=>!['start','end'].includes(p)))errors.push(d.id+': invalid moonlight definition');
  const skill=content.abilities?.[d.abilityId];
  if(!skill||skill.activation!=='passive'||skill.growthProfile!=='fixed'||skill.effects?.length!==1||skill.effects[0].type!=='damage'||skill.effects[0].scalingStat!==d.stat||!damageElements(skill.effects[0]).includes('moon'))errors.push(d.id+': invalid moonlight pulse');
 }
 for(const a of [...Object.values(content.characters??{}),...Object.values(content.enemies??{})]){
  if(a.moonlightBlessings!==undefined&&(!Array.isArray(a.moonlightBlessings)||!a.moonlightBlessings.length||new Set(a.moonlightBlessings).size!==a.moonlightBlessings.length||a.moonlightBlessings.some(id=>!defs[id])))errors.push(a.id+': invalid moonlight access');
  const revelation=a.moonlightRevelation;
  if(revelation&&(!defs[revelation.blessingId]||!a.abilities.includes(revelation.abilityId)||!revelation.name||!revelation.description||revelation.commandMultiplier!==undefined&&(!Number.isFinite(revelation.commandMultiplier)||revelation.commandMultiplier<=0||revelation.commandMultiplier>10)||revelation.bonusMultiplier!==undefined&&(!Number.isFinite(revelation.bonusMultiplier)||revelation.bonusMultiplier<=0)||revelation.modifiers&&Object.entries(revelation.modifiers).some(([key,n])=>!['attack','magic','defense','resistance','speed'].includes(key)||!Number.isFinite(n)||n<0||n>1)))errors.push(a.id+': invalid moonlight revelation');
  const p=a.passive;if(p?.type==='moonlight_team_mp'&&(!defs[p.blessingId]||!Number.isFinite(p.ratio)||p.ratio<=0||p.ratio>1||!Array.isArray(p.elements)||!p.elements.length||p.elements.some(e=>!defs[p.blessingId].elements.includes(e))))errors.push(a.id+': invalid moonlight recovery');
  if(p?.type==='moonlight_guardian'&&(!a.moonlightBlessings?.includes(p.blessingId)||!defs[p.blessingId]||!a.abilities.includes(p.followUpAbility)||!Number.isInteger(p.perRound)||p.perRound<1||p.perRound>3))errors.push(a.id+': invalid moonlight guardian');
 }
 return errors;
}
export function initializeMoonlight(battle,previous){
 battle.moonlight={};
 for(const team of new Set(battle.actors.map(a=>a.team))){
  const allowed=[...new Set(battle.actors.filter(a=>a.team===team).flatMap(a=>a.moonlightBlessings??[]))].sort();
  if(!allowed.length)continue;
  const old=previous?.[team];
  battle.moonlight[team]=old?structuredClone(old):{slots:[],active:null,lastActivatedRound:-1,revision:0};
  battle.moonlight[team].allowed=allowed;
 }
}
export function moonlightSourceId(team){return 'moonlight_'+team;}
export function moonlightDefinition(battle,team){const active=battle.moonlight?.[team]?.active;return active?battle.content.moonlightBlessings?.[active.id]:null;}
export function moonlightStat(battle,team,readStat){
 const d=moonlightDefinition(battle,team);if(!d)return 0;
 const members=battle.actors.filter(a=>a.team===team&&isAlive(a)&&battle.content.characters[a.definitionId??a.id]&&d.elements.includes(a.element));
 return members.length?members.reduce((n,a)=>n+readStat(a,d.stat),0)/members.length*d.statRatio*moonlightOffenseMultiplier(battle,team,d.id):0;
}
// Observe real enemy HP/shield damage; never allow a blessing to fuel itself.
export function recordMoonlightDamage(battle,source,target,effect,amount,io){
 const state=battle.moonlight?.[source?.team];
 if(!state||state.active||amount<=0||source.team===target.team||!battle.actors.includes(source))return;
 for(const element of damageElements(effect)){
  if(state.slots.includes(element)||state.slots.length>=2)continue;
  const candidates=state.allowed.map(id=>battle.content.moonlightBlessings[id]).filter(d=>d.elements.includes(element)&&state.slots.every(e=>d.elements.includes(e)));
  if(!candidates.length)continue;
  state.slots.push(element);state.revision++;
  io.emit(battle,{type:'moonlight_charge',sourceId:source.id,team:source.team,element,slots:[...state.slots]});
 }
}
function makeSource(battle,team,d,amount){
 const id=moonlightSourceId(team);
 let actor=battle.sourceActors.find(a=>a.id===id);
 if(!actor){actor={id,definitionId:'moonlight.'+d.id,actorKind:'moonlight',name:d.name,team,hp:1,mp:0,stats:{maxHp:1,maxMp:0,attack:0,magic:0,defense:0,resistance:0,speed:0},statuses:[],cooldowns:{},abilities:[],resources:{},resourceValues:{},tags:[]};battle.sourceActors.push(actor);}
 actor.name=d.name;actor.element=battle.content.abilities[d.abilityId].effects[0].element;actor.stats[d.stat]=amount;actor.definitionId='moonlight.'+d.id;
 return actor;
}
// Called only at engine quiescent boundaries, after all synchronous reactions.
export function settleMoonlight(battle,io){
 if(battle.outcome||!battle.actors.some(a=>a.team==='party'&&isAlive(a))||!battle.actors.some(a=>a.team==='enemy'&&isAlive(a)))return;
 for(const [team,state]of Object.entries(battle.moonlight??{})){
  if(state.active||state.slots.length!==2||state.lastActivatedRound===battle.round)continue;
  const d=state.allowed.map(id=>battle.content.moonlightBlessings[id]).find(d=>pairKey(d.elements)===pairKey(state.slots));if(!d)continue;
  state.slots=[];state.lastActivatedRound=battle.round;state.revision++;
  state.active={id:d.id,startedRound:battle.round,expiresAfterRound:battle.round+d.durationRounds-1,pulses:{},targets:d.targetMode==='anchored_enemies'?battle.actors.filter(a=>a.team!==team&&isAlive(a)).map(a=>a.id):[],followUps:{}};
  io.onActivate?.(battle,team,d);
  const source=makeSource(battle,team,d,moonlightStat(battle,team,(a,key)=>io.stat(battle,a,key)));
  io.write(battle,'Nguyệt Quang Chúc Phúc — '+d.name+' kích hoạt trong 3 vòng.');
  io.emit(battle,{type:'moonlight_enter',sourceId:source.id,team,blessingId:d.id,label:d.name,stat:d.stat,statValue:source.stats[d.stat],targetIds:state.active.targets});
 }
}
export function moonlightDamageEffect(battle,source,effect,context){
 const p=source?.passive,rule=source?.moonlightRevelation;
 const native=(['moonlight_guardian','moonlight_potency'].includes(p?.type)&&battle.moonlight?.[source.team]?.active?.id===p.blessingId)||(p?.type==='moonlight_activation_mode'&&source.activeMode===p.modeId);
 const revealed=rule&&(rule.allDamagingSkills||rule.followUpOnly)&&revelationActive(battle,source)&&(!rule.requiresMode||source.activeMode===rule.requiresMode)&&(!rule.followUpOnly||context?.skillId===source.passive?.followUpAbility);
 if(!native&&!revealed)return effect;
 return {...effect,additionalElements:[...new Set([...(effect.additionalElements??[]),'moon'])].filter(e=>e!==effect.element)};
}
// All blessing attacks share their guardian reaction path. Only natural pulses own clock slots.
function performMoonlightAttack(battle,team,phase,io,multiplier){
 const state=battle.moonlight?.[team],active=state?.active,d=moonlightDefinition(battle,team);
 if(!active||!d||state.attackInProgress||battle.outcome||battle.round>active.expiresAfterRound)return false;
 if(!battle.actors.some(a=>a.team===team&&isAlive(a))||!battle.actors.some(a=>a.team!==team&&isAlive(a)))return false;
 const targets=battle.actors.filter(a=>a.team!==team&&isAlive(a)&&(d.targetMode!=='anchored_enemies'||active.targets.includes(a.id)));
 if(!targets.length)return false;
 const amount=moonlightStat(battle,team,(a,key)=>io.stat(battle,a,key)),source=makeSource(battle,team,d,amount);
 state.attackInProgress=true;
 try{
  if(io.pulse(battle,source,d,targets,amount,phase,multiplier)===false)return false;
  if(io.outcome(battle))return true;
  for(const owner of battle.actors){
   const p=owner.passive;if(owner.team!==team||!isAlive(owner)||p?.type!=='moonlight_guardian'||p.blessingId!==d.id)continue;
   const count=active.followUps[owner.id];if(count?.round===battle.round&&count.count>=p.perRound)continue;
   active.followUps[owner.id]={round:battle.round,count:(count?.round===battle.round?count.count:0)+1};
   io.followUp(battle,owner,p.followUpAbility);
   if(io.outcome(battle))break;
  }
  return true;
 }finally{delete state.attackInProgress;}
}
export function pulseMoonlight(battle,phase,io){
 for(const [team,state]of Object.entries(battle.moonlight??{})){
  const active=state.active,d=moonlightDefinition(battle,team);
  if(!active||!d||!d.phases.includes(phase)||active.pulses[phase]===battle.round||state.attackInProgress||battle.round>active.expiresAfterRound||battle.outcome)continue;
  active.pulses[phase]=battle.round;
  performMoonlightAttack(battle,team,phase,io);
  if(battle.outcome)return;
 }
}
export function canCommandMoonlight(battle,actor,blessingId){
 if(typeof blessingId!=='string'||!battle.content.moonlightBlessings?.[blessingId])return false;
 const state=battle.moonlight?.[actor?.team];
 return Boolean(actor&&battle.actors.includes(actor)&&isAlive(actor)&&!battle.outcome&&!state?.attackInProgress&&state?.active?.id===blessingId&&battle.round<=state.active.expiresAfterRound);
}
export function commandMoonlight(battle,actor,blessingId,io,request){
 const options=typeof request==='number'?{multiplier:request}:request;
 const rules=skillRules(battle.content),maxRankFactor=coefficientFactor(rules.mastery?.maxRank??rules.maxRank,rules);
 if(options!==undefined&&(!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(k=>!['multiplier','primaryMultiplier','primaryTargetId','rankDamageFactor'].includes(k))||['multiplier','primaryMultiplier'].some(k=>options[k]!==undefined&&(!Number.isFinite(options[k])||options[k]<=0||options[k]>10))||options.rankDamageFactor!==undefined&&(!Number.isFinite(options.rankDamageFactor)||options.rankDamageFactor<1||options.rankDamageFactor>maxRankFactor)||options.primaryTargetId!==undefined&&typeof options.primaryTargetId!=='string'))return false;
 if(!canCommandMoonlight(battle,actor,blessingId))return false;
 return performMoonlightAttack(battle,actor.team,'command',io,options);
}

export function expireMoonlight(battle,io){
 for(const [team,state]of Object.entries(battle.moonlight??{}))if(state.active&&battle.round>=state.active.expiresAfterRound){
  const d=moonlightDefinition(battle,team);state.active=null;state.slots=[];state.revision++;
  io.emit(battle,{type:'moonlight_exit',sourceId:moonlightSourceId(team),team,blessingId:d.id,label:d.name});
  io.write(battle,'Nguyệt Quang Chúc Phúc — '+d.name+' kết thúc.');
 }
}
