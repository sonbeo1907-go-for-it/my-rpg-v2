import {resolveRankedAbility} from './skill-resolver.js';
import {activeStatuses} from './status-state.js';
import {defaultFormulaEdit,activeFormula,editedFormulaEntries,formulaCounts} from './formula-field.js';
import {commandAbilityIds} from './combat-modes.js';
import {battleStat,battleMaxMp} from './stat-values.js';
import {isAlive} from './actor-life.js';
import {softCapValue} from './pvp-damage.js';
const GENERIC={healBelow:.45,reserveMpRatio:.15,setupAbilities:[],burstAbilities:[],skillBias:{}};
export function arenaAiProfile(b,actor){return b.content.pvpAiProfiles?.[actor.characterId??actor.definitionId]??GENERIC;}
export function validatePvpAi(content){const errors=[];for(const[id,p]of Object.entries(content.pvpAiProfiles??{})){
 const c=content.characters[id];if(!c||id==='monica'||p.id!==id||!Number.isFinite(p.healBelow)||p.healBelow<=0||p.healBelow>1||!Number.isFinite(p.reserveMpRatio)||p.reserveMpRatio<0||p.reserveMpRatio>1){errors.push('PvP AI: invalid profile '+id);continue;}
 const skills=new Set([...c.abilities,...Object.values(content.upgrades).filter(u=>u.characterId===id).flatMap(u=>u.changes.flatMap(x=>[x.ability,x.to].filter(Boolean)))]);
 for(const key of ['setupAbilities','burstAbilities'])if(!Array.isArray(p[key])||p[key].some(x=>!skills.has(x)))errors.push('PvP AI: invalid ability list '+id);
 if(!p.skillBias||Object.entries(p.skillBias).some(([key,n])=>!skills.has(key)||!Number.isFinite(n)||Math.abs(n)>100))errors.push('PvP AI: invalid bias '+id);
 }return errors;}
function bestEdit(b,a,skill){
 const field=activeFormula(b,a);if(!field)return null;
 const edits=[];for(let i=0;i<field.entries.length;i++){for(let j=i+1;j<field.entries.length;j++)edits.push({kind:'swap',left:i,right:j});for(const tag of ['lead','break','strike'])if(field.entries[i].tag!==tag)edits.push({kind:'rewrite',index:i,tag});}
 const score=f=>{const x=formulaCounts(b.content,a,f);return x.correct*10+x.contributors;},before=score(field);
 const best=edits.map(edit=>({edit,score:score({...field,entries:editedFormulaEntries(field,edit,a,skill)})})).sort((x,y)=>y.score-x.score)[0];
 return best&&best.score>before?best.edit:null;
}
function threat(b,target,io){
 let maximum=0;
 for(const enemy of b.actors.filter(a=>a.team!==target.team&&isAlive(a)))for(const id of enemy.abilities){const rawSkill=b.content.abilities[id];if(!rawSkill||rawSkill.activation==='passive')continue;const s=resolveRankedAbility(b.content,enemy,rawSkill);if(!io.abilityAvailability(b,enemy,s).ok)continue;
 for(const e of s.effects.filter(e=>e.type==='damage')){const keys=e.scalingStats??[e.scalingStat??(e.damageType==='physical'?'attack':'magic')],power=keys.reduce((n,k)=>n+battleStat(b.content,enemy,k),0)/keys.length;
 const raw=Math.max(1,power*(e.primaryMultiplier??e.multiplier??1)*(e.rankDamageFactor??1)*(e.hits??1)-battleStat(b.content,target,e.damageType==='physical'?'defense':'resistance')*.55);
 maximum=Math.max(maximum,b.pvpRules?softCapValue(raw,b.pvpRules.softCaps.single):raw);
 }}return maximum;
}
function cheapScore(b,a,skill,t,p){
 let n=skill.id==='$defend'?(a.mp/battleMaxMp(b.content,a)<p.reserveMpRatio?40:0):skill.id==='$attack'?10:0;
 for(const e of skill.effects){
  if(e.type==='damage')n+=20+(e.multiplier??1)*5+(1-t.hp/t.stats.maxHp)*20;
  if(e.type==='heal')n+=(1-t.hp/t.stats.maxHp)*150;
  if(e.type==='shield')n+=t.shield===0?32:0;
  if(e.type==='status')n+=activeStatuses(t).some(s=>s.id===e.status)?-10:24;
  if(['enter_mode','prepare_mode','formula_field','summon_companion'].includes(e.type))n+=45;
  if(e.type==='grant_extra_turn')n+=25;
  if(e.type==='turn_order_field')n+=b.turnOrderField?.priorityTeam===a.team?0:60;
 }
 return n+(p.skillBias[skill.id]??0)-(skill.cost?.mp??0)*.1;
}
function evaluate(b,trial,a,skill,p,threats){
 const after=trial.actors.find(x=>x.id===a.id),allies=b.actors.filter(x=>x.team===a.team),enemies=b.actors.filter(x=>x.team!==a.team);
 if(enemies.every(x=>!isAlive(trial.actors.find(y=>y.id===x.id))))return {score:100000,reason:'kết thúc trận'};
 let kills=0,damage=0,protection=0,rescues=0,loss=0,buffs=0,cleanses=0,debuffs=0;
 for(const x of enemies){const y=trial.actors.find(t=>t.id===x.id);if(isAlive(x)&&!isAlive(y))kills++;damage+=Math.max(0,x.hp-y.hp)+Math.max(0,x.shield-y.shield)*.35;for(const status of activeStatuses(y)){const def=b.content.statuses[status.id];if(def?.kind==='debuff'&&!activeStatuses(x).some(old=>old.id===status.id&&(old.remaining??99)>1))debuffs+=Object.values(status.appliedModifiers??def.modifiers??{}).reduce((n,v)=>n+Math.max(0,-v)*90,0)+8;}debuffs+=activeStatuses(x).filter(status=>b.content.statuses[status.id]?.kind==='buff'&&!activeStatuses(y).some(old=>old.id===status.id)).length*24;}
 for(const x of allies){const y=trial.actors.find(t=>t.id===x.id);if(isAlive(x)&&!isAlive(y))loss+=3000;loss+=Math.max(0,x.hp-y.hp)*2;
  const healing=Math.max(0,y.hp-x.hp),shield=Math.max(0,y.shield-x.shield),fresh=activeStatuses(y).filter(s=>!activeStatuses(x).some(old=>old.id===s.id&&((old.remaining??99)>1||(old.charges??0)>0)));
  const ward=fresh.some(s=>b.content.statuses[s.id]?.effectImmunity)?20:0;
  const reduction=fresh.reduce((n,s)=>n+(b.content.statuses[s.id]?.modifiers?.damageReduction??0)*70,0);
  protection+=healing*.8+shield*.28+ward+reduction;
  const removed=activeStatuses(x).filter(s=>b.content.statuses[s.id]?.kind==='debuff'&&!activeStatuses(y).some(v=>v.id===s.id));cleanses+=removed.length;
  if(isAlive(x)&&(x.hp/x.stats.maxHp<p.healBelow||x.hp+x.shield<(threats[x.id]??0)*.8)&&(healing+shield+ward+reduction>0||removed.length))rescues+=1;
  for(const status of fresh.filter(s=>b.content.statuses[s.id]?.kind==='buff')){const def=b.content.statuses[status.id],mods=status.appliedModifiers??def.modifiers??{};buffs+=12+Object.entries(mods).reduce((n,[key,v])=>n+Math.max(0,key==='attackMultiplier'?v-1:v)*(['damageBonus','attackMultiplier'].includes(key)?100*(status.charges??def.damageUses??1):key==='maxMp'?40:90),0);}
 }
 const newMode=after.activeMode!==a.activeMode&&after.activeMode||after.pendingMode&&!a.pendingMode||after.formulaField&&!a.formulaField;
 const newCompanion=Object.keys(after.companionStates??{}).length>Object.keys(a.companionStates??{}).length;
 const setup=p.setupAbilities.includes(skill.id)&&(newMode||newCompanion||buffs>0);
 const resourceGain=Object.entries(after.resourceValues??{}).reduce((n,[id,v])=>n+Math.max(0,v-(a.resourceValues?.[id]??0))*12,0);
 const spentResource=Object.entries(a.resourceValues??{}).some(([id,n])=>n>=(a.resources?.[id]?.max??99)*.67&&(after.resourceValues?.[id]??0)<n);
 const mpGain=Math.max(0,after.mp-a.mp),lowMp=a.mp/battleMaxMp(b.content,a)<p.reserveMpRatio;
 let score=rescues*1000+kills*600+damage+protection+buffs+debuffs+cleanses*18-loss+(newMode||newCompanion?70:0)+(setup?120:0)+resourceGain+(spentResource&&p.burstAbilities.includes(skill.id)?40:0)+mpGain*(lowMp?7:1)+(p.skillBias[skill.id]??0);
 if(skill.id==='$defend'&&!lowMp&&!rescues)score-=18;
 if(skill.id!=='$defend'&&after.mp/battleMaxMp(b.content,after)<p.reserveMpRatio&&!kills)score-=15;
 if(trial.extraTurnGrants.size>b.extraTurnGrants.size)score+=45*(trial.extraTurnGrants.size-b.extraTurnGrants.size);
 if(trial.turnOrderField?.priorityTeam===a.team&&b.turnOrderField?.priorityTeam!==a.team){const pending=b.queue.slice(b.cursor+1),next=trial.queue.slice(trial.cursor+1);let moved=0;for(const id of pending)if(b.actors.find(x=>x.id===id)?.team===a.team)moved+=Math.max(0,pending.indexOf(id)-next.indexOf(id));score+=40+moved*(trial.turnOrderField.kind==='speed_shift'?15:60);}
 if(resourceGain>0&&Object.entries(a.resourceValues??{}).some(([id,v])=>v<(a.resources[id]?.max??0)*.67))score+=40;
 for(const [id,state]of Object.entries(trial.teamResources?.[a.team]??{}))score+=Math.max(0,state.value-(b.teamResources?.[a.team]?.[id]?.value??0))*10;
 for(const x of trial.actors)for(const s of activeStatuses(x)){if(x.team!==a.team&&b.content.statuses[s.id]?.damageOverTime&&!activeStatuses(b.actors.find(y=>y.id===x.id)).some(v=>v.id===s.id))score+=(s.potency??0)*Math.min(2,s.remaining??1)*.6;}
 const reason=rescues?'cứu hoặc bảo vệ đồng đội':kills?'kết liễu mục tiêu':setup||newMode?'chuẩn bị sức mạnh':skill.id==='$defend'&&lowMp?'phòng thủ để hồi MP':spentResource?'bùng nổ bằng tài nguyên':cleanses?'giải hiệu ứng bất lợi':'gây áp lực hiệu quả';
 return {score,reason};
}
export function chooseBattleAction(b,actor,io){
 const p=arenaAiProfile(b,actor),candidates=[];
 for(const id of new Set([...commandAbilityIds(actor),'$attack','$defend'])){
  const raw=id==='$attack'?io.basicAbility(actor):id==='$defend'?{id:'$defend',name:'Phòng thủ',target:'self',effects:[]} : b.content.abilities[id];
  if(!raw||raw.activation==='passive')continue;
  const skill=resolveRankedAbility(b.content,actor,raw);if(!io.abilityAvailability(b,actor,skill).ok)continue;
  const edit=skill.effects.some(e=>e.type==='edit_formula')?bestEdit(b,actor,skill):undefined;if(edit===null)continue;
  let targets=io.targetsFor(b,actor,skill);if(['self','all_allies','all_enemies','adjacent_allies','random_enemies'].includes(skill.target)&&!skill.effects.some(e=>e.primaryMultiplier!==undefined))targets=targets.slice(0,1);
  for(const target of targets)candidates.push({skill,score:cheapScore(b,actor,skill,target,p),command:{actorId:actor.id,abilityId:id,targetId:target.id,...(edit?{formulaEdit:edit}:{})}});
 }
 candidates.sort((a,b)=>b.score-a.score);
 const shortlist=candidates.slice(0,b.pvpRules?.ai.maxCandidates??12),threats=Object.fromEntries(b.actors.filter(a=>a.team===actor.team).map(a=>[a.id,threat(b,a,io)]));
 for(const c of shortlist){if(io.forecast){try{Object.assign(c,evaluate(b,io.forecast(b,c.command),actor,c.skill,p,threats));}catch{c.score=-Infinity;}}}
 shortlist.sort((a,b)=>b.score-a.score);const best=shortlist.find(c=>Number.isFinite(c.score));if(!best)throw Error('AI không tìm được hành động hợp lệ.');
 return {...best.command,aiReason:best.reason??'chỉ dẫn chung',aiScore:Math.round(best.score)};
}
