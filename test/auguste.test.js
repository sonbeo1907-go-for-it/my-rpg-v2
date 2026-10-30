import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,getActor,executeAction,basicAbility,DEFEND,abilityAvailability} from '../src/core/battle.js';
import {formulaSnapshot,formulaDamage,formulaCounts,classifyFormulaSkill,formulaForecast,activeFormula} from '../src/core/formula-field.js';
import {battleStat} from '../src/core/stat-values.js';
import {validateContent} from '../src/core/content.js';
import {liveSkillChoices,compactSkillScaling} from '../src/ui/combat-presentation.js';
import {skillPresentation} from '../src/ui/skill-copy.js';
import {createDungeonRun,advanceDungeonWave} from '../src/core/dungeon.js';
const content=await loadContent();
function setup(party=['auguste','iris','fran','lisbeth'],change=()=>{}){
 const c=structuredClone(content);c.characters.auguste.stats.speed=100;
 c.abilities['test.lead']={id:'test.lead',name:'Lead',target:'self',effects:[{type:'status',status:'calibrated',duration:2}]};
 c.abilities['test.break']={id:'test.break',name:'Break',target:'enemy',effects:[{type:'status',status:'fractured',duration:2}]};
 c.abilities['test.strike']={id:'test.strike',name:'Strike',target:'enemy',effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:1,hits:4}]};
 for(const id of party)c.characters[id].abilities.push('test.lead','test.break','test.strike');change(c);
 const save=createGameSave(c);save.party=party;save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];const b=createBattle(c,save,'forest_patrol',()=>.99);
 for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.statuses=[];e.stats.defense=e.stats.resistance=0;e.weaknesses=[];e.resistances={};}
 return {b,c,save};
}
function act(b,id='$defend',target,extra={}){const a=activeActor(b),skill=id==='$defend'?DEFEND:id==='$attack'?basicAbility(a):b.content.abilities[id];executeAction(b,{actorId:a.id,abilityId:id,targetId:target??(skill.target==='enemy'?b.actors.find(t=>t.team!==a.team&&t.hp>0).id:a.id),...extra});}
function until(b,predicate){for(let i=0;i<150;i++){if(predicate())return;assert.equal(b.outcome,null);act(b);}throw Error('No matching turn');}
const ready=(b,id)=>until(b,()=>activeActor(b)?.id===id);
const entries=(tags=['lead','break','strike'],sources=['iris','fran','lisbeth'])=>tags.map((tag,index)=>({tag,sourceId:sources[index],sourceName:sources[index],abilityId:'test.'+tag,abilityName:tag}));
function opened(party,change){const result=setup(party,change);act(result.b,'auguste.lecture');return result;}
function fill(b,tags,sources){getActor(b,'auguste').formulaField.entries=entries(tags,sources);}
const hits=(b,id='auguste')=>b.events.filter(e=>e.type==='damage'&&e.sourceId===id);

test('Auguste is a locked official Plain sorcerer; old save format includes him without granting copies',()=>{
 const save=createGameSave(content);assert.equal(content.characters.auguste.roleGroup,'sorcerer');assert.equal(content.characters.auguste.element,'plain');assert.ok(content.banners.standard.characterPool.includes('auguste'));assert.equal(save.unlockedCharacterIds.includes('auguste'),false);assert.equal(save.extraGearSlots.auguste??0,0);assert.deepEqual(decodeGameSave(encodeGameSave(save,content),content),save);assert.equal(content.characters.auguste.stats.magic,36);
});
test('lecture creates three empty slots, spends 20 MP and grants a delayed extra action once',()=>{
 const {b}=opened(),a=getActor(b,'auguste');assert.equal(a.mp,120);assert.equal(a.formulaField.expiresAfterRound,3);assert.deepEqual(a.formulaField.entries,[]);assert.deepEqual([...b.extraTurnGrants],['auguste']);assert.equal(b.phase,'main');assert.equal(abilityAvailability(b,a,b.content.abilities['auguste.lecture']).ok,false);
});
test('three completed ally skills record exactly once each; four damage hits still produce one Strike',()=>{
 const {b}=opened();assert.equal(activeActor(b).id,'iris');act(b,'test.lead');assert.equal(activeActor(b).id,'fran');act(b,'test.break');assert.equal(activeActor(b).id,'lisbeth');act(b,'test.strike');const field=getActor(b,'auguste').formulaField;assert.deepEqual(field.entries.map(e=>e.tag),['lead','break','strike']);assert.deepEqual(field.entries.map(e=>e.sourceId),['iris','fran','lisbeth']);assert.equal(b.events.filter(e=>e.type==='formula_record').length,1);ready(b,'auguste');assert.equal(b.phase,'extra');assert.equal(formulaSnapshot(b,getActor(b,'auguste')).baseMagic,9);
});
test('classification is deterministic: damage beats debuff, debuff beats support, basics and passive casts never record',()=>{
 assert.equal(classifyFormulaSkill(content,content.abilities['sieg.break_form']),'strike');assert.equal(classifyFormulaSkill(content,content.abilities['fran.fracture']),'break');assert.equal(classifyFormulaSkill(content,content.abilities['minerva.cleanse']),'lead');assert.equal(classifyFormulaSkill(content,content.abilities['monica.distortion']),'lead');assert.equal(classifyFormulaSkill(content,basicAbility(content.characters.lisbeth)),null);assert.equal(classifyFormulaSkill(content,DEFEND),null);assert.equal(classifyFormulaSkill(content,content.abilities['aurora.follow_up']),null);
});
test('Auguste own casts, basic attacks, defense, periodic effects and Aurora follow-ups cannot add extra runes',()=>{
 const {b}=opened(['auguste','iris','aurora','elaine']);act(b,'$attack');assert.equal(getActor(b,'auguste').formulaField.entries.length,0);ready(b,'elaine');act(b,'$defend');ready(b,'auguste');act(b,'auguste.rebuttal');assert.equal(getActor(b,'auguste').formulaField.entries.length,0);
 const x=opened(['auguste','freya','aurora','elaine']).b;ready(x,'freya');act(x,'freya.fireball');assert.equal(getActor(x,'auguste').formulaField.entries.length,1);assert.equal(getActor(x,'auguste').formulaField.entries[0].sourceId,'freya');assert.equal(hits(x,'aurora').length,1);
});
test('queue is rolling, keeps only the last three entries and forecasts never consume combat RNG',()=>{
 const {b}=opened();fill(b);const a=activeActor(b);let calls=0;b.random=()=>{calls++;return .99;};const forecast=formulaForecast(b,a,b.content.abilities['test.lead'])[0];assert.deepEqual(forecast.entries.map(e=>e.tag),['break','strike','lead']);assert.equal(calls,0);act(b,'test.lead');assert.deepEqual(getActor(b,'auguste').formulaField.entries.map(e=>e.tag),['break','strike','lead']);assert.equal(getActor(b,'auguste').formulaField.entries.length,3);
});
test('swap preserves sources; rewriting changes exactly one source and reduces inherited MAG',()=>{
 const {b}=opened();fill(b,['break','lead','strike']);ready(b,'auguste');const a=getActor(b,'auguste');act(b,'auguste.edit',a.id,{formulaEdit:{kind:'swap',left:0,right:1}});assert.deepEqual(a.formulaField.entries.map(e=>e.tag),['lead','break','strike']);assert.equal(a.mp,110);assert.equal(formulaSnapshot(b,a).baseMagic,9);ready(b,a.id);act(b,'auguste.edit',a.id,{formulaEdit:{kind:'rewrite',index:2,tag:'lead'}});assert.equal(a.formulaField.entries[2].sourceId,a.id);assert.equal(formulaSnapshot(b,a).baseMagic,6);assert.equal(a.formulaField.entries.length,3);
});
test('missing, malformed, unchanged rewrite and out-of-range choices fail before MP, cooldowns or action count mutate',()=>{
 const {b}=opened();fill(b);ready(b,'auguste');const a=getActor(b,'auguste');for(const formulaEdit of [undefined,{kind:'swap',left:0,right:0},{kind:'swap',left:0,right:3},{kind:'rewrite',index:0,tag:'lead'},{kind:'rewrite',index:1,tag:'unknown'},{kind:'rewrite',index:0,tag:'break',sourceId:'iris'}]){const before=structuredClone(a.formulaField),mp=a.mp,count=b.actionCount;assert.throws(()=>act(b,'auguste.edit',a.id,{formulaEdit}));assert.equal(a.mp,mp);assert.equal(b.actionCount,count);assert.deepEqual(a.formulaField,before);}
});
for(const [tags,correct,amount]of [[['strike','lead','break'],0,81],[['strike','strike','strike'],1,108],[['lead','break','lead'],2,135],[['lead','break','strike'],3,162]])test(`theorem ${correct}/3: exact three-hit multiplier, three distinct sources and one 36 MP payment`,()=>{
 const {b}=opened();fill(b,tags);ready(b,'auguste');const a=getActor(b,'auguste'),before=a.mp;for(const e of b.actors.filter(a=>a.team==='enemy'))e.statuses=[];act(b,'auguste.theorem');assert.equal(hits(b).length,3);assert.ok(hits(b).every(e=>e.amount===amount));assert.equal(a.mp,before-36);assert.equal(a.formulaField,undefined);assert.equal(a.stats.magic,36);assert.equal(b.events.filter(e=>e.type==='formula_burst').length,1);assert.equal(b.events.find(e=>e.type==='formula_burst').correct,correct);
});
test('perfect theorem penetrates half of RES; inherited MAG is base stat before ordinary MAG buffs',()=>{
 const {b}=opened();fill(b);ready(b,'auguste');const a=getActor(b,'auguste'),target=getActor(b,'enemy_0');target.statuses=[];target.stats.resistance=100;a.statuses.push({id:'calibrated',remaining:3,sourceId:'iris'});act(b,'auguste.theorem',target.id);assert.ok(hits(b).every(e=>e.amount===166));assert.equal(a.baseStats,undefined);assert.equal(a.stats.magic,36);
});
test('multiple notes from one ally count once, rewritten self notes count zero and fallen contributors keep their history',()=>{
 const {b}=opened();fill(b,undefined,['iris','iris','auguste']);const a=getActor(b,'auguste');assert.equal(formulaSnapshot(b,a).baseMagic,3);fill(b);getActor(b,'fran').hp=0;assert.equal(formulaSnapshot(b,a).baseMagic,9);
});
test('finisher requires an active complete field; invalid targets never spend MP or consume the field',()=>{
 const {b}=setup(),a=getActor(b,'auguste'),skill=b.content.abilities['auguste.theorem'];assert.equal(abilityAvailability(b,a,skill).ok,false);act(b,'auguste.lecture');ready(b,a.id);assert.equal(abilityAvailability(b,a,skill).ok,false);fill(b);assert.throws(()=>act(b,skill.id,'missing'));assert.equal(a.mp,120);assert.equal(a.formulaField.entries.length,3);
});
test('killing the target on the first hit still consumes the field and cannot leak native power into a follow-up',()=>{
 const {b}=opened(['auguste','aurora','iris','elaine']);fill(b,undefined,['aurora','iris','elaine']);ready(b,'auguste');getActor(b,'enemy_0').statuses=[];getActor(b,'enemy_0').hp=1;act(b,'auguste.theorem','enemy_0');assert.equal(hits(b).length,1);assert.equal(getActor(b,'auguste').formulaField,undefined);assert.equal(hits(b,'aurora').length,0);
});
test('one Aurora follow-up can occur during a surviving single-target theorem; it inherits neither 9 MAG nor three hits',()=>{
 const {b}=opened(['auguste','aurora','iris','elaine']);fill(b,undefined,['aurora','iris','elaine']);ready(b,'auguste');getActor(b,'enemy_0').statuses=[];act(b,'auguste.theorem');assert.equal(hits(b).length,3);assert.equal(hits(b,'aurora').length,1);assert.equal(getActor(b,'aurora').resourceValues.thunder_charge,1);
});
test('the field lasts three global rounds including extras, cannot be extended by turns and closes on KO',()=>{
 const {b}=opened();ready(b,'auguste');assert.equal(b.phase,'extra');assert.ok(activeFormula(b,getActor(b,'auguste')));act(b);until(b,()=>b.round===3);assert.ok(activeFormula(b,getActor(b,'auguste')));until(b,()=>b.round===4);assert.equal(getActor(b,'auguste').formulaField,undefined);
 const x=opened().b;getActor(x,'auguste').hp=0;act(x);assert.equal(getActor(x,'auguste').formulaField,undefined);
});
test('an already granted extra action is not duplicated, and opening a field in extra cannot chain another phase',()=>{
 const {b}=setup();b.extraTurnGrants.add('auguste');b.extraPhaseRequired=true;act(b,'auguste.lecture');assert.equal(b.extraTurnGrants.size,1);ready(b,'auguste');assert.equal(b.phase,'extra');act(b);assert.equal(b.round,2);
 const x=setup().b;x.extraTurnGrants.add('auguste');x.extraPhaseRequired=true;act(x);ready(x,'auguste');assert.equal(x.phase,'extra');act(x,'auguste.lecture');assert.equal(x.round,2);assert.equal(x.phase,'main');assert.ok(getActor(x,'auguste').formulaField);
});
test('formula coexists with Monica priority and Magnamut without resetting their clocks or modes',()=>{
 const {b}=opened(['auguste','monica','astoria','iris']);ready(b,'monica');act(b,'monica.distortion');ready(b,'astoria');getActor(b,'astoria').resourceValues.space_rift=5;act(b,'astoria.summon');assert.ok(b.turnOrderField);assert.equal(getActor(b,'astoria').activeMode,'magnamut');assert.ok(getActor(b,'auguste').formulaField);assert.deepEqual(getActor(b,'auguste').formulaField.entries.map(e=>e.tag),['lead','lead']);
});
test('non-final room victory carries formula history only for its remaining duration; a final victory closes it',()=>{
 const {b,c,save}=opened();fill(b);b.continuesOnVictory=true;const a=getActor(b,'auguste');for(const e of b.actors.filter(a=>a.team==='enemy'))e.hp=0;act(b);assert.equal(b.outcome,'victory');assert.ok(a.formulaField);const next=createBattle(c,save,'forest_patrol',()=>.99,{partyActors:b.actors.filter(a=>a.team==='party'),roundOffset:b.round});assert.deepEqual(getActor(next,'auguste').formulaField.entries.map(e=>e.tag),['lead','break','strike']);const expired=createBattle(c,save,'forest_patrol',()=>.99,{partyActors:b.actors.filter(a=>a.team==='party'),roundOffset:3});assert.equal(getActor(expired,'auguste').formulaField,undefined);next.continuesOnVictory=false;for(const e of next.actors.filter(a=>a.team==='enemy'))e.hp=0;act(next);assert.equal(getActor(next,'auguste').formulaField,undefined);
});
test('live skill facts, compact scaling, assumed previews and cast snapshot agree on the same formula',()=>{
 const {b}=opened();fill(b);const a=getActor(b,'auguste'),skill=b.content.abilities['auguste.theorem'],choices=liveSkillChoices(skill,a,getActor(b,'enemy_0'),b);assert.equal(choices.formulaCorrect,3);assert.equal(choices.formulaContributors,3);assert.equal(choices.baseStatBonuses.magic,9);assert.match(compactSkillScaling(skill,a,getActor(b,'enemy_0'),content,b),/3 × 360% MAG/);assert.match(skillPresentation(skill,a,content,choices).facts.join(' '),/50% RES/);assert.match(skillPresentation(skill,a,content,{formulaCorrect:0,formulaContributors:0}).facts.join(' '),/180% MAG/);const snap=formulaSnapshot(b,a);fill(b,['break','strike','lead']);assert.equal(formulaDamage(skill.effects[0],snap).multiplier,3.6);
});
test('invalid formula definitions, scaling, tags and native values are rejected by content validation',()=>{
 for(const change of [c=>c.abilities['auguste.lecture'].effects[0].sequence=['lead','lead','strike'],c=>c.abilities['auguste.lecture'].effects[0].durationRounds=0,c=>c.abilities['auguste.theorem'].effects[0].formulaScaling.perfectPenetration=2,c=>c.abilities['auguste.edit'].requiresFormula=false,c=>c.abilities['auguste.theorem'].minFormulaEntries=2,c=>c.abilities['auguste.rebuttal'].formulaTag='anything',c=>c.characters.auguste.passive.maxSources=4]){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length);}
});

test('an allied/self-inflicted support penalty is not classified as hostile Break',()=>{
 const skill={id:'test.penalty',target:'self',effects:[{type:'status',status:'shaken',duration:2}]};
 assert.equal(classifyFormulaSkill(content,skill),'lead');
 assert.equal(classifyFormulaSkill(content,{...skill,target:'enemy'}),'break');
});

test('forecast shows inherited MAG before a repeated ally pushes another contributor out',()=>{
 const {b}=opened();fill(b,undefined,['fran','iris','lisbeth']);const actor=getActor(b,'iris');
 const forecast=formulaForecast(b,actor,b.content.abilities['test.lead'])[0];
 assert.equal(forecast.baseMagic,6);assert.equal(getActor(b,'auguste').formulaField.entries[0].sourceId,'fran');
});
test('duplicate openers, impossible opener requirements and non-consuming finishers fail content validation',()=>{
 for(const change of [c=>c.abilities['auguste.lecture'].effects.push(structuredClone(c.abilities['auguste.lecture'].effects[0])),c=>c.abilities['auguste.lecture'].requiresFormula=true,c=>c.abilities['auguste.theorem'].effects.pop()]){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length);}
});
