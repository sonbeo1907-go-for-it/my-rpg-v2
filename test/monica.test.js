import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {recruitCharacter} from '../src/core/economy.js';
import {createBattle,getActor,activeActor,executeAction,executeEnemyTurn,abilityAvailability,DEFEND,basicAbility} from '../src/core/battle.js';
import {activeTurnOrderField,skillBaseStatBonuses,copyTurnOrderField} from '../src/core/turn-order.js';
import {statusModifier} from '../src/core/stat-values.js';
import {createDungeonRun,advanceDungeonWave} from '../src/core/dungeon.js';
import {validateContent} from '../src/core/content.js';
import {liveSkillChoices,compactSkillScaling} from '../src/ui/combat-presentation.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';

const content=await loadContent();
function setup(party=['monica','iris','garrek'],change=()=>{}) {
 const source=structuredClone(content);change(source);
 const save=createGameSave(source);save.party=party;save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];save.storyFlags.push('illusion.sinister_unlocked');
 const b=createBattle(source,save,'forest_patrol',()=>.99);
 for(const [i,enemy] of b.actors.filter(a=>a.team==='enemy').entries()){
  enemy.hp=enemy.stats.maxHp=10000;enemy.stats.speed=[50,20,5][i];enemy.stats.resistance=0;enemy.weaknesses=[];enemy.resistances={};enemy.statuses=[];delete enemy.passive;
 }
 // Establish a known main-round order before any turn is resolved.
 b.queue=['enemy_0','monica',...b.actors.filter(a=>a.team==='party'&&a.id!=='monica').sort((a,b)=>b.stats.speed-a.stats.speed).map(a=>a.id),'enemy_1','enemy_2'];
 // Place enemy_1 according to SPD among the allies after Monica.
 b.queue=b.queue.filter(id=>id!=='enemy_1');const idx=b.queue.findIndex(id=>getActor(b,id).stats.speed<20);b.queue.splice(idx<0?b.queue.length:idx,0,'enemy_1');
 b.mainTurnOrder=[...b.queue];b.cursor=0;
 return b;
}
function act(b,id='$defend',target){const a=activeActor(b),skill=id==='$defend'?DEFEND:id==='$attack'?basicAbility(a):b.content.abilities[id];executeAction(b,{actorId:a.id,abilityId:id,targetId:target??(skill.target==='self'?a.id:b.actors.find(a=>a.team==='enemy'&&a.hp>0).id)});}
function until(b,predicate){for(let i=0;i<100;i++){if(predicate())return;assert.equal(b.outcome,null);act(b);}throw Error('Turn not reached');}
function ready(b){until(b,()=>activeActor(b)?.id==='monica');}
function clean(b){for(const e of b.actors.filter(a=>a.team==='enemy'))e.statuses=[];}
function hits(b){return b.events.filter(e=>e.type==='damage'&&e.sourceId==='monica');}

test('Monica is an official Wind sorcerer with exact stats, normal recruitment and no free unlock',()=>{
 const m=content.characters.monica;assert.equal(m.roleGroup,'sorcerer');assert.equal(m.element,'wind');assert.equal(m.developerOnly,undefined);
 assert.deepEqual(m.stats,{maxHp:160,maxMp:150,attack:12,magic:34,defense:15,resistance:24,speed:24});
 const save=createGameSave(content);assert.equal(save.unlockedCharacterIds.includes('monica'),false);assert.ok(content.banners.standard.characterPool.includes('monica'));assert.equal(content.banners.standard.characterPool.includes('astoria'),false);
 save.recruitmentShards=120;const recruited=recruitCharacter(save,content,'standard','monica');assert.ok(recruited.unlockedCharacterIds.includes('monica'));assert.equal(recruited.extraGearSlots.monica??0,0);assert.deepEqual(decodeGameSave(encodeGameSave(recruited,content),content),recruited);
});
test('basic is two real magical Wind hits and never receives the active-skill passive',()=>{
 const b=setup();ready(b);clean(b);act(b,'$attack','enemy_1');assert.deepEqual(hits(b).map(e=>[e.amount,e.element]),[[20,'wind'],[20,'wind']]);assert.equal(b.events.some(e=>e.type==='skill_base_bonus'),false);assert.equal(getActor(b,'monica').mp,150);
});
test('single-target nuke gets +6 base MAG only against a later main-order target, with 25% RES penetration',()=>{
 for(const [target,expected]of [['enemy_0',92],['enemy_1',111]]){
  const b=setup();ready(b);clean(b);getActor(b,target).stats.resistance=40;act(b,'monica.loophole',target);
  assert.equal(hits(b)[0].amount,expected);assert.equal(getActor(b,'monica').mp,130);assert.equal(getActor(b,'monica').cooldowns['monica.loophole'],3);assert.equal(getActor(b,'monica').stats.magic,34);
  assert.equal(b.events.filter(e=>e.type==='skill_base_bonus').length,target==='enemy_1'?1:0);
 }
});
test('flat passive bonus is applied before percentage MAG buffs and never leaks to later attacks',()=>{
 const b=setup(undefined,c=>{c.statuses.test_magic={id:'test_magic',name:'MAG test',kind:'buff',modifiers:{magic:.5}};});ready(b);clean(b);const m=getActor(b,'monica');m.statuses.push({id:'test_magic',remaining:3,sourceId:'monica'});getActor(b,'enemy_1').stats.resistance=40;
 act(b,'monica.loophole','enemy_1');assert.equal(hits(b)[0].amount,175);assert.equal(m.stats.magic,34);
 ready(b);clean(b);act(b,'$attack','enemy_1');assert.deepEqual(hits(b).map(e=>e.amount),[8,8]); // Normal 51 MAG after buff; the prior +6 is gone.
});
test('AoE grants one flat bonus to the whole cast if any selected enemy is later, not per hit or enemy',()=>{
 const b=setup();ready(b);clean(b);act(b,'monica.formula');assert.deepEqual(hits(b).map(e=>e.amount),[32,32,32]);assert.equal(b.events.filter(e=>e.type==='skill_base_bonus').length,1);assert.equal(getActor(b,'monica').mp,138);
});
test('no living later targets means no passive, even for AoE',()=>{
 const b=setup();ready(b);clean(b);getActor(b,'enemy_1').hp=0;getActor(b,'enemy_2').hp=0;act(b,'monica.formula');assert.deepEqual(hits(b).map(e=>e.amount),[27]);assert.equal(b.events.some(e=>e.type==='skill_base_bonus'),false);
});
test('AoE attack/magic debuff lasts one target main turn and ignores its extra action',()=>{
 const b=setup();ready(b);clean(b);act(b,'monica.formula');const target=getActor(b,'enemy_0');assert.equal(statusModifier(b.content,target,'attack'),-.15);assert.equal(statusModifier(b.content,target,'magic'),-.15);
 b.extraTurnGrants.add(target.id);b.extraPhaseRequired=true;until(b,()=>b.phase==='extra');assert.equal(target.statuses.find(s=>s.id==='time_weakened').remaining,1);act(b);assert.equal(target.statuses.find(s=>s.id==='time_weakened').remaining,1);assert.equal(activeActor(b).id,target.id);act(b);assert.equal(target.statuses.some(s=>s.id==='time_weakened'),false);
});
test('field preserves acted prefix and current turn, moves only pending allies ahead, and grants no extra action',()=>{
 const b=setup();ready(b);const prefix=b.queue.slice(0,b.cursor+1),m=getActor(b,'monica');act(b,'monica.distortion');assert.deepEqual(b.queue,['enemy_0','monica','iris','garrek','enemy_1','enemy_2']);assert.deepEqual(b.queue.slice(0,2),prefix);assert.equal(activeActor(b).id,'iris');assert.equal(new Set(b.queue).size,b.queue.length);assert.equal(b.extraTurnGrants.size,0);assert.equal(m.mp,120);assert.equal(m.cooldowns['monica.distortion'],5);assert.deepEqual(b.mainTurnOrder,b.queue);
});
test('field covers current and next round through the entire extra phase, then restores natural order',()=>{
 const b=setup();ready(b);act(b,'monica.distortion');until(b,()=>b.round===2);assert.deepEqual(b.queue,['monica','iris','garrek','enemy_0','enemy_1','enemy_2']);assert.equal(activeTurnOrderField(b).expiresAfterRound,2);
 b.extraTurnGrants=new Set(['monica','enemy_0']);b.extraPhaseRequired=true;const main=[...b.mainTurnOrder];until(b,()=>b.phase==='extra');assert.deepEqual(b.queue,['monica','enemy_0']);assert.deepEqual(b.mainTurnOrder,main);assert.ok(activeTurnOrderField(b));assert.equal(getActor(b,'monica').cooldowns['monica.distortion'],4);act(b);assert.ok(activeTurnOrderField(b));act(b);assert.equal(b.round,3);assert.equal(activeTurnOrderField(b),null);assert.equal(activeActor(b).id,'enemy_0');assert.equal(b.log.filter(l=>l==='Đảo lộn thời không hết hiệu lực.').length,1);
});
test('CD4 cast in round 1 becomes usable in round 6, never early through extra actions',()=>{
 const b=setup();ready(b);act(b,'monica.distortion');for(let round=2;round<=6;round++){until(b,()=>b.round===round);const m=getActor(b,'monica');assert.equal(m.cooldowns['monica.distortion'],6-round);assert.equal(abilityAvailability(b,m,b.content.abilities['monica.distortion']).ok,round===6);}
});
test('casting during an extra phase only reorders that phase and keeps the completed main order for the passive',()=>{
 const b=setup();b.extraTurnGrants=new Set(['monica','iris','garrek','enemy_1','enemy_2']);b.extraPhaseRequired=true;const main=[...b.mainTurnOrder];until(b,()=>b.phase==='extra');assert.equal(activeActor(b).id,'monica');act(b,'monica.distortion');assert.deepEqual(b.queue,['monica','iris','garrek','enemy_1','enemy_2']);assert.deepEqual(b.mainTurnOrder,main);assert.equal(b.extraTurnGrants.size,5);
});
test('extra-phase passive uses main history even when the target has no extra action',()=>{
 for(const [target,expected]of [['enemy_0',92],['enemy_1',111]]){
  const b=setup();b.extraTurnGrants.add('monica');b.extraPhaseRequired=true;until(b,()=>b.phase==='extra');clean(b);getActor(b,target).stats.resistance=40;assert.equal(b.queue.includes(target),false);act(b,'monica.loophole',target);assert.equal(hits(b)[0].amount,expected);
 }
});
test('reapplication refreshes one battlefield field instead of stacking durations',()=>{
 const b=setup(undefined,c=>{c.abilities['monica.distortion'].cooldown=0;});ready(b);act(b,'monica.distortion');until(b,()=>b.round===2);act(b,'monica.distortion');assert.equal(b.turnOrderField.expiresAfterRound,3);assert.equal(Array.isArray(b.turnOrderField),false);until(b,()=>b.round===4);assert.equal(b.turnOrderField,null);
});
test('enemy-sourced field uses the same reusable priority rule and SPD within both teams',()=>{
 const b=setup();const enemy=getActor(b,'enemy_0');enemy.abilities.push('monica.distortion');act(b,'monica.distortion');assert.equal(b.turnOrderField.priorityTeam,'enemy');assert.deepEqual(b.queue,['enemy_0','enemy_1','enemy_2','monica','iris','garrek']);until(b,()=>b.round===2);assert.deepEqual(b.queue,['enemy_0','enemy_1','enemy_2','monica','iris','garrek']);
});
test('field persists if caster falls, but standalone new battles start without it',()=>{
 const b=setup();ready(b);act(b,'monica.distortion');getActor(b,'monica').hp=0;until(b,()=>b.round===2);assert.ok(activeTurnOrderField(b));assert.equal(activeActor(b).id,'iris');assert.equal(setup().turnOrderField,null);
});
test('Monica interacts with Aurora only through single-target magic; bonus does not leak into the follow-up',()=>{
 const b=setup(['monica','aurora']);ready(b);clean(b);act(b,'monica.formula');assert.equal(getActor(b,'aurora').resourceValues.thunder_charge,0);ready(b);clean(b);act(b,'monica.loophole','enemy_1');assert.equal(getActor(b,'aurora').resourceValues.thunder_charge,1);assert.equal(b.events.filter(e=>e.type==='skill_base_bonus').length,1);assert.equal(getActor(b,'aurora').stats.magic,28);
});
test('preview and engine share the same live passive eligibility; field and passive copy are concise',()=>{
 const b=setup();ready(b);const m=getActor(b,'monica'),skill=b.content.abilities['monica.loophole'];
 const later=liveSkillChoices(skill,m,getActor(b,'enemy_1'),b),earlier=liveSkillChoices(skill,m,getActor(b,'enemy_0'),b);assert.deepEqual(later.baseStatBonuses,{magic:6});assert.deepEqual(earlier.baseStatBonuses,{});
 assert.match(compactSkillScaling(skill,m,getActor(b,'enemy_1'),b.content,b),/\+6 MAG căn bản/);assert.ok(skillPresentation(skill,m,b.content,later).facts.some(line=>line.includes('đang kích hoạt')));assert.ok(skillPresentation(skill,m,b.content,earlier).facts.some(line=>line.includes('chưa đủ điều kiện')));assert.ok(passivePresentation(m,b.content).rules.some(line=>line.includes('Không áp dụng cho đánh thường')));
});
test('field carries across dungeon rooms without gaining extra duration when a room ends mid-round',()=>{
 const source=structuredClone(content);for(const enemy of Object.values(source.enemies))enemy.stats.speed=50;
 source.abilities.test_wipe={id:'test_wipe',name:'Clear',target:'all_enemies',effects:[{type:'damage',damageType:'magical',element:'plain',multiplier:10000}]};source.characters.iris.abilities.push('test_wipe');
 const save=createGameSave(source);save.party=['monica','iris'];save.unlockedCharacterIds.push('monica');const run=createDungeonRun(source,save,'gold_mine','easy',{now:new Date('2026-10-30T05:00:00Z'),random:()=>0});
 ready(run.battle);act(run.battle,'monica.distortion');assert.equal(activeActor(run.battle).id,'iris');act(run.battle,'test_wipe');assert.equal(run.battle.outcome,'victory');const original=structuredClone(run.battle.turnOrderField);
 advanceDungeonWave(source,run);assert.equal(run.battle.round,2);assert.equal(activeActor(run.battle).id,'monica');assert.deepEqual(run.battle.turnOrderField,original);act(run.battle);act(run.battle,'test_wipe');advanceDungeonWave(source,run);assert.equal(run.battle.round,3);assert.equal(run.battle.turnOrderField,null);assert.equal(activeActor(run.battle).team,'enemy');assert.equal(original.expiresAfterRound,2);
});
test('Miraebolis phase transition preserves field; phase-three boss still performs two moves in one turn',()=>{
 const source=structuredClone(content),save=createGameSave(source);save.party=['monica','iris'];save.unlockedCharacterIds.push('monica');save.storyFlags.push('illusion.sinister_unlocked');const b=createBattle(source,save,'miraebolis_superboss',()=>.99);act(b,'monica.distortion');const field=structuredClone(b.turnOrderField),boss=getActor(b,'enemy_0');getActor(b,'iris').stats.magic=100000;act(b,'$attack',boss.id);assert.equal(boss.bossState.phase,2);assert.deepEqual(b.turnOrderField,field);assert.equal(b.queue.filter(id=>id===boss.id).length,1);
 boss.bossState.phase=3;boss.bossState.rotationStep=0;b.cursor=b.queue.indexOf(boss.id);for(const a of b.actors.filter(a=>a.team==='party'))a.hp=a.stats.maxHp=10000;const before=b.log.length;executeEnemyTurn(b);assert.equal(b.log.slice(before).filter(line=>/hành động [12] \/ 2/.test(line)).length,2);
});
test('content rejects invalid field duration, recipient, passive stat and carried field shapes',()=>{
 for(const change of [c=>c.abilities['monica.distortion'].effects[0].durationRounds=0,c=>c.abilities['monica.distortion'].target='all_allies',c=>c.characters.monica.passive.stat='speed']){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length);}
 assert.throws(()=>copyTurnOrderField({kind:'team_priority',priorityTeam:'other',name:'x',sourceId:'x',expiresAfterRound:2}));assert.deepEqual(skillBaseStatBonuses({mainTurnOrder:[]},content.characters.monica,content.abilities['monica.formula'],[]),{});
});
