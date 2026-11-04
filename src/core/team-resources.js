import {isAlive} from './actor-life.js';

// Shared, serializable pools. A declaration grants access to the whole side, not its owner alone.
export function teamResourceDefinition(content,id){
 for(const actor of [...Object.values(content.characters),...Object.values(content.enemies)])if(actor.teamResources?.[id])return actor.teamResources[id];
 return null;
}
export function initializeTeamResources(battle,previous){
 battle.teamResources={};
 for(const actor of battle.actors)for(const[id,definition]of Object.entries(actor.teamResources??{})){
  const side=battle.teamResources[actor.team]??={};if(side[id])continue;
  const old=previous?.[actor.team]?.[id];
  if(old&&(!Number.isSafeInteger(old.value)||old.value<0||old.value>definition.max||!Number.isSafeInteger(old.revision)||old.revision<0||!Number.isSafeInteger(old.spent)||old.spent<0))throw Error('Dữ liệu tài nguyên đội không hợp lệ.');
  if(old?.growthRounds&&(typeof old.growthRounds!=='object'||Array.isArray(old.growthRounds)||Object.entries(old.growthRounds).some(([k,v])=>!['member','other'].includes(k)||!Number.isSafeInteger(v)||v<0)))throw Error('Dữ liệu tăng trưởng tài nguyên đội không hợp lệ.');
  side[id]={growthRounds:structuredClone(old?.growthRounds??{}),name:definition.name,icon:definition.icon,max:definition.max,value:old?.value??0,revision:old?.revision??0,spentRound:old?.spentRound??0,spent:old?.spent??0};
 }
}
export const teamResourceState=(battle,actor,id)=>battle.teamResources?.[typeof actor==='string'?actor:actor.team]?.[id]??null;
export const teamResourceValue=(battle,actor,id)=>teamResourceState(battle,actor,id)?.value??0;
export const teamResourceSpent=(battle,actor,id)=>{const state=teamResourceState(battle,actor,id);return state?.spentRound===battle.round?state.spent:0;};
export function selectedTeamCost(battle,actor,skill){const preferred=skill.cost?.preferTeamResource;return preferred&&teamResourceValue(battle,actor,preferred.id)>=preferred.amount?preferred:skill.cost?.teamResource??null;}
export function spentTeamHits(effect,spent){const r=effect.hitsWhenTeamSpent;return r&&spent>=r.at?{...effect,hits:r.hits}:effect;}
export function growTeamResources(battle,actor,skill,io){
 if(skill.id.startsWith('$')||skill.activation==='passive')return;
 for(const[id,state]of Object.entries(battle.teamResources?.[actor.team]??{})){
  const rule=teamResourceDefinition(battle.content,id)?.naturalGrowth;if(!rule)continue;
  const group=actor.tags?.includes(rule.memberTag)?'member':'other';
  state.growthRounds??={};if(state.growthRounds[group]===battle.round)continue;
  state.growthRounds[group]=battle.round;changeTeamResource(battle,actor,id,rule.amount,io);
 }
}
export const teamCostAmount=(cost,value)=>cost?.all?value:cost?.amount??0;
export function teamSpendStatBonuses(actor,skill,spent){const p=actor.passive;return p?.type==='spent_team_resource_stat'&&p.resource===skill.cost?.teamResource?.id&&spent>0?{[p.stat]:p.ratio}:{};}
export function scaledSpentTeamEffect(effect,spent){const r=effect.spentTeamResourceScaling;if(!r)return effect;const full=r.fullSpend&&spent>=r.fullSpend.at?r.fullSpend:{};return {...effect,multiplier:(effect.multiplier??1)+r.perStack*spent,penetration:(effect.penetration??0)+(full.penetration??0),spentResourceDamageBonus:full.damageBonus??0};}
export function teamCostAvailability(battle,actor,skill){
 const cost=skill.cost?.teamResource;if(!cost)return null;
 const state=teamResourceState(battle,actor,cost.id);
 return !state||state.value<(cost.all?cost.min:cost.amount)?{ok:false,reason:'Cần '+(cost.all?cost.min:cost.amount)+' '+(state?.name??teamResourceDefinition(battle.content,cost.id)?.name??'tài nguyên đội')+'.'}:null;
}
export function changeTeamResource(battle,actor,id,amount,io){
 const state=teamResourceState(battle,actor,id);if(!state)throw Error('Đội chưa có tài nguyên này.');
 if(!Number.isSafeInteger(amount)||!amount||amount<0&&state.value<-amount)throw Error('Không đủ tài nguyên đội.');
 const before=state.value;state.value=Math.max(0,Math.min(state.max,before+amount));state.revision++;
 const created=Math.max(0,amount),spent=Math.max(0,-amount);
 if(spent){if(state.spentRound!==battle.round){state.spentRound=battle.round;state.spent=0;}state.spent+=spent;}
 const event={type:created?'team_resource_created':'team_resource_spent',resource:id,team:actor.team,sourceId:actor.id,amount:Math.abs(state.value-before),created,spent,value:state.value,max:state.max,revision:state.revision,capped:created>0&&state.value-before<created};
 io.emit(battle,event);io.write(battle,actor.name+': '+(created?'tạo '+created:'tiêu '+spent)+' '+state.name+' → '+state.value+'/'+state.max+(event.capped?' (đã đầy; vẫn ghi nhận tạo '+state.name+')':'')+'.');
 // Requested creation is intentional: even an overflow is a completed creation event.
 for(const owner of battle.actors.filter(a=>a.team===actor.team&&isAlive(a))){
  const p=owner.passive;if(p?.type!=='team_resource_growth'||p.resource!==id)continue;
  const nextStacks=Math.min(battle.content.statuses[p.statusId].maxStacks??1,(owner.statuses.find(s=>s.id===p.statusId)?.stacks??0)+(created||spent));
  const baseStatModifiers=p.baseStatPerStack?Object.fromEntries(Object.entries(p.baseStatPerStack).map(([key,n])=>[key,n*nextStacks])):undefined;
  io.announce(battle,owner,owner.id);io.status(battle,owner,p.statusId,p.duration,owner.id,{stacks:created||spent,baseStatModifiers});
 }
 return event;
}
export function scaledTeamEffect(content,effect,count){
 const rule=effect.teamResourceScaling;if(!rule)return effect;
 const next={...effect};
 if(['damage','shield','heal'].includes(effect.type))next.multiplier=(effect.multiplier??0)+rule.perStack*count;
 else if(effect.type==='status')next.appliedModifiers=Object.fromEntries(Object.entries(effect.appliedModifiers??content.statuses[effect.status].modifiers).map(([key,n])=>[key,n+rule.perStack*count]));
 return next;
}
export function validateTeamResourceContent(content){
 const errors=[],fail=m=>errors.push(m),definitions=new Map();
 const actors=[...Object.values(content.characters),...Object.values(content.enemies)];
 for(const actor of actors){
  if(actor.teamResources!==undefined&&(!actor.teamResources||typeof actor.teamResources!=='object'||Array.isArray(actor.teamResources)))fail(actor.id+': invalid shared resource declarations');
  for(const[id,d]of Object.entries(actor.teamResources??{})){
   if(!/^[a-z][a-z0-9_]*$/.test(id)||!d||typeof d.name!=='string'||!d.name||!Number.isSafeInteger(d.max)||d.max<1||d.max>99||typeof d.description!=='string'||!d.description||!['masquerade','cartridge','soul_flame'].includes(d.icon))fail(actor.id+': invalid team resource');
   if(d?.naturalGrowth&&(!/^[a-z][a-z0-9_]*$/.test(d.naturalGrowth.memberTag)||d.naturalGrowth.amount!==1))fail(actor.id+': invalid team natural growth');
   if((d?.mpPerCharge!==undefined||d?.penetrationPerCharge!==undefined)&&(!Number.isInteger(d.mpPerCharge)||d.mpPerCharge<1||d.mpPerCharge>50||!Number.isFinite(d.penetrationPerCharge)||d.penetrationPerCharge<=0||d.penetrationPerCharge>1))fail(actor.id+': invalid MP-funded resource');
   if(definitions.has(id)&&JSON.stringify(definitions.get(id))!==JSON.stringify(d))fail(actor.id+': inconsistent shared resource');else definitions.set(id,d);
  }
 }
 for(const actor of actors){const p=actor.passive;
  if(p?.type==='team_resource_growth'&&(!definitions.has(p.resource)||!p.name||!p.description||!content.statuses[p.statusId]?.modifiersPerStack||!Number.isInteger(p.duration)||p.duration<1))fail(actor.id+': invalid resource growth');
  if(p?.baseStatPerStack!==undefined&&(p.type!=='team_resource_growth'||!Object.keys(p.baseStatPerStack).length||Object.entries(p.baseStatPerStack).some(([k,v])=>!['attack','magic','defense','resistance','speed'].includes(k)||!Number.isFinite(v)||v<=0||v>20)))fail(actor.id+': invalid shared growth base stat');
  if(p?.type==='spent_resource_followup'){
   const a=content.abilities[p.followUpAbility];if(!definitions.has(p.resource)||!p.name||!p.description||a?.activation!=='passive'||a.target!=='enemy'||a.cost||a.cooldown||a.effects.some(e=>e.type!=='damage'))fail(actor.id+': invalid spent-resource follow-up');
  }
  if(p?.type==='spent_team_resource_stat'&&(!definitions.has(p.resource)||!p.name||!p.description||!['attack','magic','defense','resistance','speed'].includes(p.stat)||!Number.isFinite(p.ratio)||p.ratio<=0||p.ratio>1))fail(actor.id+': invalid spent-team-resource stat bonus');
  if(p?.type==='spent_resource_team_mp'&&(!definitions.has(p.resource)||!p.name||!p.description||!Number.isFinite(p.perStack)||p.perStack<=0||!Number.isFinite(p.cap)||p.cap<p.perStack||p.cap>1))fail(actor.id+': invalid spent-resource MP');
  for(const mode of Object.values(actor.combatModes??{}))if(mode.lifetime==='team_resource'&&(!definitions.has(mode.resource)||mode.presentationScope!=='actor'||mode.background||mode.music||!mode.commandAbilities?.length))fail(actor.id+': invalid shared-resource mode');
 }
 for(const skill of Object.values(content.abilities)){
  const preferred=skill.cost?.preferTeamResource;
  if(preferred&&(!definitions.has(preferred.id)||!Number.isInteger(preferred.amount)||preferred.amount<1||preferred.amount>definitions.get(preferred.id).max||!(skill.cost.mp>0)||Object.keys(skill.cost).some(k=>!['mp','preferTeamResource'].includes(k))||Object.keys(preferred).some(k=>!['id','amount'].includes(k))))fail(skill.id+': invalid preferred team cost');
  const cost=skill.cost?.teamResource;
  if(cost&&(!definitions.has(cost.id)||(cost.all===true?cost.amount!==undefined||!Number.isSafeInteger(cost.min)||cost.min<1||cost.min>definitions.get(cost.id).max:cost.all!==undefined||cost.min!==undefined||!Number.isSafeInteger(cost.amount)||cost.amount<1||cost.amount>definitions.get(cost.id).max)||Object.keys(cost).some(k=>!['id','amount','all','min'].includes(k))))fail(skill.id+': invalid team cost');
  for(const e of skill.effects??[]){
   if(e.type==='team_resource'&&(!definitions.has(e.resource)||!Number.isSafeInteger(e.amount)||e.amount<1||e.amount>99||e.to||e.teamResourceScaling))fail(skill.id+': invalid team gain');
   const conditional=e.hitsWhenTeamSpent;if(conditional&&(!definitions.has(conditional.id)||e.type!=='damage'||(skill.cost?.preferTeamResource??cost)?.id!==conditional.id||conditional.at!==(skill.cost?.preferTeamResource??cost)?.amount||!Number.isInteger(conditional.hits)||conditional.hits<1||conditional.hits>10))fail(skill.id+': invalid conditional team hits');
   const spent=e.spentTeamResourceScaling;if(spent&&(!definitions.has(spent.id)||e.type!=='damage'||skill.cost?.teamResource?.id!==spent.id||!Number.isFinite(spent.perStack)||spent.perStack<=0||spent.perStack>2||spent.fullSpend&&(!Number.isInteger(spent.fullSpend.at)||spent.fullSpend.at<1||spent.fullSpend.at>definitions.get(spent.id).max||!Number.isFinite(spent.fullSpend.damageBonus??0)||spent.fullSpend.damageBonus<0||spent.fullSpend.damageBonus>1||!Number.isFinite(spent.fullSpend.penetration??0)||spent.fullSpend.penetration<0||spent.fullSpend.penetration>1)))fail(skill.id+': invalid spent team-resource scaling');
   const r=e.teamResourceScaling;if(r&&(!definitions.has(r.id)||!['damage','shield','heal','status'].includes(e.type)||!Number.isFinite(r.perStack)||r.perStack<=0||r.perStack>1||e.type==='status'&&(!content.statuses[e.status]?.modifiers||Object.keys(content.statuses[e.status].modifiers).some(k=>!['attack','magic','defense','resistance'].includes(k)))))fail(skill.id+': invalid team-resource scaling');
  }
 }
 return errors;
}
