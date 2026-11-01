
import {isAlive} from "./actor-life.js";
export const FORMULA_TAGS=['lead','break','strike'];
export const FORMULA_NAMES={lead:'Dẫn',break:'Phá',strike:'Kích'};
export function activeFormula(battle,owner) {
  return isAlive(owner) && owner.formulaField && battle.round<=owner.formulaField.expiresAfterRound ? owner.formulaField : null;
}
export function formulaDefinition(content,field) {
  return content.abilities[field?.abilityId]?.effects.find(effect=>effect.type==='formula_field')??null;
}
export function classifyFormulaSkill(content,skill) {
  if (!skill || !skill.id || skill.id.startsWith('$') || skill.activation==='passive' || skill.formulaTag==='none') return null;
  if (skill.formulaTag) return skill.formulaTag;
  if (skill.effects.some(effect=>effect.type==='damage')) return 'strike';
  if(skill.effects.some(effect=>effect.type==='dispel'))return 'break';
  if (['enemy','all_enemies','random_enemies'].includes(skill.target) && skill.effects.some(effect=>['status','toggle_status'].includes(effect.type) && content.statuses[effect.status]?.kind==='debuff' && effect.to!=='self')) return 'break';
  return 'lead';
}
export function formulaCounts(content,owner,field) {
  const definition=formulaDefinition(content,field);
  const entries=field?.entries??[];
  const correct=entries.reduce((sum,entry,index)=>sum+Number(entry.tag===definition?.sequence[index]),0);
  const contributors=new Set(entries.filter(entry=>entry.sourceId!==owner?.id).map(entry=>entry.sourceId)).size;
  return {correct,contributors,ready:entries.length===(definition?.sequence.length??3),perfect:entries.length===3 && correct===3};
}
export function formulaPower(owner,{correct=0,contributors=0}={}) {
  const passive=owner?.passive;
  const baseMagic=passive?.type==='formula_scholar'?Math.min(passive.maxSources,Math.max(0,contributors))*passive.amount:0;
  return {correct:Math.max(0,Math.min(3,correct)),contributors,baseMagic};
}
export function formulaSnapshot(battle,owner) {
  const field=activeFormula(battle,owner),counts=formulaCounts(battle.content,owner,field);
  return {...counts,...formulaPower(owner,counts),entries:structuredClone(field?.entries??[])};
}
export function formulaDamage(effect,snapshot={}) {
  if (!effect.formulaScaling) return effect;
  const correct=Math.max(0,Math.min(3,snapshot?.correct??0));
  return {...effect,multiplier:Math.round(((effect.multiplier??1)+correct*effect.formulaScaling.perCorrect)*1e8)/1e8,
    penetration:(effect.penetration??0)+(correct===3?effect.formulaScaling.perfectPenetration:0)};
}
export function formulaAvailability(battle,owner,skill) {
  const field=activeFormula(battle,owner);
  if (skill.effects.some(effect=>effect.type==='formula_field') && field) return {ok:false,reason:'Đại Đồ Thức đang hoạt động.'};
  if (skill.requiresFormula && !field) return {ok:false,reason:'Cần Đại Đồ Thức đang hoạt động.'};
  if (skill.minFormulaEntries && (field?.entries.length??0)<skill.minFormulaEntries) return {ok:false,reason:'Cần '+skill.minFormulaEntries+' dấu trong Đại Đồ Thức.'};
  return null;
}
export function validateFormulaEdit(field,edit) {
  if (!field || !edit || typeof edit!=='object') throw new Error('Hãy chọn cách Hiệu chỉnh luận cứ.');
  const valid=index=>Number.isInteger(index)&&index>=0&&index<field.entries.length;
  if (edit.kind==='swap' && valid(edit.left) && valid(edit.right) && edit.left!==edit.right && Object.keys(edit).every(key=>['kind','left','right'].includes(key))) return;
  if (edit.kind==='rewrite' && valid(edit.index) && FORMULA_TAGS.includes(edit.tag) && field.entries[edit.index].tag!==edit.tag && Object.keys(edit).every(key=>['kind','index','tag'].includes(key))) return;
  throw new Error('Hiệu chỉnh không hợp lệ: chọn hai ô khác nhau hoặc một dấu mới.');
}
export function editedFormulaEntries(field,edit,owner,skill) {
  validateFormulaEdit(field,edit);
  const entries=structuredClone(field.entries);
  if (edit.kind==='swap') [entries[edit.left],entries[edit.right]]=[entries[edit.right],entries[edit.left]];
  else entries[edit.index]={tag:edit.tag,sourceId:owner.id,sourceName:owner.name,abilityId:skill.id,abilityName:skill.name,rewritten:true};
  return entries;
}
export function defaultFormulaEdit(field) {
  return field?.entries.length>1 ? {kind:'swap',left:0,right:1} : {kind:'rewrite',index:0,tag:FORMULA_TAGS.find(tag=>tag!==field?.entries[0]?.tag)??'lead'};
}
export function openFormula(battle,owner,skill,effect,io) {
  if (activeFormula(battle,owner)) throw new Error('Đại Đồ Thức đang hoạt động.');
  owner.formulaField={abilityId:skill.id,expiresAfterRound:battle.round+effect.durationRounds-1,entries:[]};
  io.write(battle,owner.name+' dựng '+effect.name+' trong '+effect.durationRounds+' vòng.');
  io.emit(battle,{type:'formula_open',sourceId:owner.id,expiresAfterRound:owner.formulaField.expiresAfterRound});
}
export function closeFormula(battle,owner,io,reason) {
  if (!owner?.formulaField) return;
  delete owner.formulaField;
  io.write(battle,owner.name+': Đại Đồ Thức kết thúc.');
  io.emit(battle,{type:'formula_end',sourceId:owner.id,reason});
}
export function expireFormulaFields(battle,io,atEnd=false) {
  for (const owner of battle.actors) if (owner.formulaField && (!isAlive(owner) || (atEnd?battle.round>=owner.formulaField.expiresAfterRound:battle.round>owner.formulaField.expiresAfterRound))) closeFormula(battle,owner,io,!isAlive(owner)?'owner_ko':'expired');
}
export function recordFormulaAction(battle,actor,skill,io) {
  const tag=classifyFormulaSkill(battle.content,skill);
  if (!tag || !isAlive(actor)) return;
  for (const owner of battle.actors) {
    const field=activeFormula(battle,owner);
    if (!field || owner.id===actor.id || owner.team!==actor.team) continue;
    field.entries=[...field.entries,{tag,sourceId:actor.id,sourceName:actor.name,abilityId:skill.id,abilityName:skill.name}].slice(-3);
    io.write(battle,owner.name+': ghi '+FORMULA_NAMES[tag]+' từ '+actor.name+' → '+field.entries.map(entry=>FORMULA_NAMES[entry.tag]).join(' · ')+'.');
    io.emit(battle,{type:'formula_record',visualId:'record-'+battle.actionCount+'-'+owner.id,sourceId:owner.id,actorId:actor.id,tag,entries:structuredClone(field.entries)});
  }
}
export function formulaForecast(battle,actor,skill) {
  const tag=classifyFormulaSkill(battle.content,skill);
  if (!tag || !actor) return [];
  return battle.actors.flatMap(owner=>{
    const field=activeFormula(battle,owner);
    if (!field || owner.id===actor.id || owner.team!==actor.team) return [];
    const entries=[...field.entries,{tag,sourceId:actor.id,sourceName:actor.name,abilityId:skill.id,abilityName:skill.name}].slice(-3);
    const counts=formulaCounts(battle.content,owner,{...field,entries});
    return [{ownerId:owner.id,ownerName:owner.name,tag,entries,...counts,...formulaPower(owner,counts)}];
  });
}
