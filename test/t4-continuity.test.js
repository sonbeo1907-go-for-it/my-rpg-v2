import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave} from '../src/core/game-save.js';import {craftGear} from '../src/core/gear-forge.js';import {equipGear} from '../src/core/equipment.js';import {createBattle,getActor,executeAction} from '../src/core/battle.js';import {createStoryRun,advanceStoryWave} from '../src/core/story-waves.js';
const content=await loadContent();
function campaign(id='guardian_talisman',owner='arthur'){let c=createGameSave(content);Object.assign(c,{coins:50000,prismaFragments:5000});c.gear=[{id:'gear_1',typeId:'t3_focused',stats:{attack:5}}];c.gacha.totalPulls=1;c=craftGear(c,content,{effectId:id,primaryStat:undefined,materialId:'gear_1'});return equipGear(c,content,owner,'rune_1');}

test('gear cooldown carries across story rooms and resets only for an independent battle',()=>{
 const c=campaign();c.party=['arthur','fiona',null,null];c.partyPresets[0].slots=[...c.party];const run=createStoryRun(content,c,'fiona_story_eins',()=>.99),a=getActor(run.battle,'arthur');assert.equal(a.gearEffectReadyRounds.gear_ward,4);a.statuses=[];run.battle.outcome='victory';const next=advanceStoryWave(content,run),carried=getActor(next,'arthur');assert.equal(next.round,2);assert.equal(carried.gearEffectReadyRounds.gear_ward,4);assert.equal(carried.statuses.some(s=>s.id==='effect_ward'),false);
 const fresh=createBattle(content,c,'forest_patrol'),freshActor=getActor(fresh,'arthur');assert.equal(freshActor.gearEffectReadyRounds.gear_ward,4);assert.ok(freshActor.statuses.some(s=>s.id==='effect_ward'));
});

test('phase transition cannot reset or retrigger gear cooldown',()=>{
 const c=campaign();c.storyFlags.push('illusion.sinister_unlocked');const b=createBattle(content,c,'miraebolis_superboss',()=>.99),a=getActor(b,'arthur'),boss=getActor(b,'enemy_0');a.statuses=[];boss.hp=2341;b.queue=['arthur','enemy_0','iris','elaine','garrek'];b.cursor=0;executeAction(b,{actorId:'arthur',abilityId:'arthur.light_slash',targetId:'enemy_0'});assert.equal(boss.bossState.phase,2);assert.equal(a.gearEffectReadyRounds.gear_ward,4);assert.equal(a.statuses.some(s=>s.id==='effect_ward'),false);
});

test('healing gear announces its own activation without incorrectly announcing Elaine shield-break passive',()=>{
 const b=createBattle(content,campaign('spring_talisman','elaine'),'forest_patrol',()=>.99),a=getActor(b,'elaine');a.hp=1;b.queue=['iris'];b.cursor=0;executeAction(b,{actorId:'iris',abilityId:'$defend',targetId:'iris'});const announcements=b.events.filter(e=>e.type==='passive'&&e.sourceId==='elaine');assert.deepEqual(announcements.map(e=>e.label),['Bùa Suối Nguồn']);assert.equal(a.hp,9);
});
