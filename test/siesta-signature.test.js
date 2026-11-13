import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,forecastBattleAction} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {buyExclusiveRecipe} from '../src/core/blueprint-shop.js';
import {craftExclusive,equipExclusive} from '../src/core/blacksmith.js';
import {exclusiveRollRange} from '../src/core/blacksmith-rules.js';
import {validateContent} from '../src/core/content.js';
import {passivePresentation} from '../src/ui/skill-copy.js';
const c=await loadContent(),id='siesta.signature';
function save(equip=true){const s=createGameSave(c);s.party=['siesta','iris','elaine','garrek'];s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...s.party])];if(equip){s.exclusiveGear.push({templateId:id,statKey:'attack',statValue:exclusiveRollRange(c,'attack').min});s.equippedExclusiveGear.siesta=id;s.unlockedExclusiveRecipes.push(id);}return s;}
function setup(equip=true){const s=save(equip),b=createBattle(c,s,'forest_patrol',()=>.99);for(const a of b.actors){a.hp=a.stats.maxHp=100000;if(a.team==='enemy'){a.stats.attack=a.stats.magic=0;a.stats.defense=a.stats.resistance=0;}}return {b,s,a:b.actors.find(x=>x.definitionId==='siesta'),e:b.actors.find(x=>x.team==='enemy')};}
function use(b,a,skill,target=a.id){b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:skill,targetId:target});}
test('Siesta signature buys, crafts, equips and saves with no retroactive unlock',()=>{
 let s=save(false);assert.ok(!s.unlockedExclusiveRecipes.includes(id));Object.assign(s,{blueprints:10,coins:100000,prismaFragments:10000,recruitmentShards:100,originalPrisma:10});s=buyExclusiveRecipe(s,c,id);s=craftExclusive(s,c,id,()=>0);s=equipExclusive(s,c,'siesta',id);assert.equal(s.blueprints,0);assert.deepEqual(decodeGameSave(encodeGameSave(s,c),c),s);assert.equal(createBattle(c,s,'forest_patrol',()=>.99).actors.find(a=>a.definitionId==='siesta').resourceValues.ferocity,3);assert.deepEqual(validateContent(c),[]);
});
test('fresh equipped battle starts at three, unequipped starts at zero, carry never refills',()=>{
 const {b,s,a}=setup();assert.equal(a.resourceValues.ferocity,3);assert.equal(setup(false).a.resourceValues.ferocity,0);a.resourceValues.ferocity=1;
 const next=createBattle(c,s,'forest_patrol',()=>.99,{partyActors:b.actors.filter(x=>x.team==='party'),roundOffset:b.round});assert.equal(next.actors.find(x=>x.definitionId==='siesta').resourceValues.ferocity,1);
 assert.ok(passivePresentation(a,c).facts.some(x=>x.includes('3 Dã Tính')));
});
test('extra basic stack uses base attack/150, has exact threshold, ignores percent ATK and caps at three',()=>{
 for(const [atk,roll,want]of [[0,0,1],[75,.49,2],[75,.5,1],[150,.999999,2],[300,.999999,2]]){
  const {b,a,e}=setup();a.resourceValues.ferocity=0;a.stats.attack=atk;a.baseStats={...a.stats,attack:atk};a.statuses.push({id:'siesta_howl',remaining:3,stacks:1,sourceId:a.id});b.random=()=>roll;
  use(b,a,'$attack',e.id);assert.equal(a.resourceValues.ferocity,want,`${atk}/${roll}`);
  const event=b.events.find(x=>x.type==='resource_bonus_roll');assert.equal(event.chance,Math.min(1,atk/150));
 }
 const {b,a,e}=setup();a.resourceValues.ferocity=2;use(b,a,'$attack',e.id);assert.equal(a.resourceValues.ferocity,3);assert.ok(!b.events.some(x=>x.type==='resource_bonus_roll'));
 const bare=setup(false);bare.a.resourceValues.ferocity=0;bare.a.stats.attack=300;use(bare.b,bare.a,'$attack',bare.e.id);assert.equal(bare.a.resourceValues.ferocity,1);
});
test('only a successful basic command rolls; Extra works and forecast preserves real pool and RNG',()=>{
 const {b,a,e}=setup();a.resourceValues.ferocity=0;a.stats.attack=150;a.baseStats={...a.stats};let rolls=0;b.random=()=>{rolls++;return .99;};
 b.queue=[a.id,e.id];b.cursor=0;const f=forecastBattleAction(b,{actorId:a.id,abilityId:'$attack',targetId:e.id});assert.equal(rolls,0);assert.equal(a.resourceValues.ferocity,0);assert.equal(f.actors.find(x=>x.id===a.id).resourceValues.ferocity,2);
 assert.throws(()=>executeAction(b,{actorId:a.id,abilityId:'$attack',targetId:'invalid'}));assert.equal(rolls,0);assert.equal(a.resourceValues.ferocity,0);
 use(b,a,'$defend');assert.equal(a.resourceValues.ferocity,0);assert.ok(!b.events.some(x=>x.type==='resource_bonus_roll'));
 b.phase='extra';use(b,a,'$attack',e.id);assert.equal(a.resourceValues.ferocity,2);
 a.resourceValues.ferocity=0;use(b,a,'siesta.rend',e.id);assert.equal(a.resourceValues.ferocity,0);assert.ok(!b.events.some(x=>x.type==='resource_bonus_roll'));
});
test('both mirror teams initialize independently; newly ready full chain still spends exactly three',()=>{
 const b=createArenaBattle(c,save(),'mirror',9),left=b.actors.find(x=>x.team==='party'&&x.definitionId==='siesta'),right=b.actors.find(x=>x.team==='enemy'&&x.definitionId==='siesta');assert.equal(left.resourceValues.ferocity,3);assert.equal(right.resourceValues.ferocity,3);for(const a of b.actors)a.hp=a.stats.maxHp=100000;
 use(b,left,'siesta.rend',right.id);assert.equal(left.resourceValues.ferocity,0);assert.equal(right.resourceValues.ferocity,3);assert.deepEqual(b.events.filter(x=>x.type==='reaction'&&x.sourceId===left.id).map(x=>x.abilityId),['siesta.howl','siesta.ravage','siesta.ravage']);
});
test('invalid initial pool, stat, cap, chance scale and wrong owner are rejected',()=>{
 for(const change of [p=>p.initial=4,p=>p.initial=1.5,p=>p.cap=2,p=>p.atStat=0,p=>p.stat='unknown',p=>p.resourceId='resonance']){const cc=structuredClone(c);change(cc.exclusiveGear[id].passive);assert.ok(validateContent(cc).length);}
});
