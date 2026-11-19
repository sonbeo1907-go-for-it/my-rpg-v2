import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,getActor} from '../src/core/battle.js';
const c=await loadContent();
function setup(party=['noelle','elaine']){const s=createGameSave(c);s.party=party;s.partyPresets[0].slots=party;s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...party])];const b=createBattle(structuredClone(c),s,'forest_patrol',()=>.99);for(const e of b.actors.filter(a=>a.team==='enemy'))e.hp=e.stats.maxHp=100000;return b;}
function cast(b,id,skill){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:skill,targetId:'enemy_0'});}
test('the second element from an actual Aurora follow-up settles before activation',()=>{
 const b=setup(['noelle','elaine','aurora']);cast(b,'elaine','$attack');
 const damage=b.events.filter(e=>e.type==='damage');assert.ok(damage.some(e=>e.sourceId==='aurora'));
 assert.equal(b.moonlight.party.active.id,'thunder_wrath');assert.ok(b.events.findIndex(e=>e.type==='moonlight_enter')>b.events.findLastIndex(e=>e.type==='damage'));
});
test('turn-start periodic damage fills the second socket and activates before control returns',()=>{
 const b=setup();b.moonlight.party.slots=['thunder'];b.content.statuses.test_tide={id:'test_tide',name:'Thủy triều thử nghiệm',kind:'debuff',damageOverTime:{element:'water',scalingStat:'magic',multiplier:.1}};
 getActor(b,'enemy_0').statuses.push({id:'test_tide',remaining:2,stacks:1,potency:5,sourceId:'elaine'});b.queue=['noelle','enemy_0','elaine'];b.cursor=0;
 executeAction(b,{actorId:'noelle',abilityId:'$defend',targetId:'noelle'});
 assert.equal(b.moonlight.party.active.id,'thunder_wrath');assert.ok(b.events.findIndex(e=>e.type==='moonlight_enter')>b.events.findIndex(e=>e.periodic));
});
test('Noelle periodic damage also carries Moon while her blessing is active',()=>{
 const b=setup();cast(b,'noelle','noelle.thunder');cast(b,'elaine','$attack');b.content.statuses.test_spark={id:'test_spark',name:'Lôi thử nghiệm',kind:'debuff',damageOverTime:{element:'thunder',scalingStat:'attack',multiplier:.1}};
 getActor(b,'enemy_0').statuses.push({id:'test_spark',remaining:2,stacks:1,potency:5,sourceId:'noelle'});b.queue=['noelle','enemy_0','elaine'];b.cursor=0;executeAction(b,{actorId:'noelle',abilityId:'$defend',targetId:'noelle'});
 assert.deepEqual(b.events.find(e=>e.periodic).elements,['thunder','moon']);
});
