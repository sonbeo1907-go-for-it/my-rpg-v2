import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,getActor} from '../src/core/battle.js';
import {isQuestUnlocked,assertEncounterParty} from '../src/core/quest-catalog.js';
import {claimBattleReward} from '../src/core/economy.js';
import {validateContent} from '../src/core/content.js';
import {hasBeneficialStatus,bypassedBarrierReduction} from '../src/core/skill-barrier.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
const content=await loadContent();
const prereqs=['iris_story_revenge','fiona_story_drei','takeshi_story_horizon'];
function save(party=['arthur','artesia','chelsea','elaine'],gear=true){const c=createGameSave(content);c.unlockedCharacterIds=Object.keys(content.characters);c.party=party;c.partyPresets[0].slots=[...party];c.claimedFirstClearRewards=[...prereqs,'artesia_story_1','artesia_story_2'];if(gear){c.exclusiveGear.push({templateId:'artesia.astral_orb',statKey:'magic',statValue:5});c.equippedExclusiveGear.artesia='artesia.astral_orb';}return c;}
function use(b,id,skill,target=id,phase='main'){b.phase=phase;b.queue=[id,b.actors.find(a=>a.id!==id&&a.hp>0).id];b.cursor=0;executeAction(b,{actorId:id,abilityId:skill,targetId:target});}
function cast(b,owner,target,effects){const id='test.cast';b.content.abilities[id]={id,name:'Test',target:owner.team===target.team?'ally':'enemy',effects};if(!owner.abilities.includes(id))owner.abilities.push(id);use(b,owner.id,id,target.id);}
test('Artesia chapters use Lv10/20/30, sequential locks and standard gacha story rewards without ownership requirement',()=>{
 assert.deepEqual(validateContent(content),[]);let c=createGameSave(content);const ids=content.travelerStories.artesia.chapters;assert.deepEqual(ids.map(id=>content.encounters[id].enemyLevel),[10,20,30]);assert.equal(isQuestUnlocked(content.encounters[ids[0]],c),false);c.claimedFirstClearRewards=[...prereqs];assert.equal(c.unlockedCharacterIds.includes('artesia'),false);
 for(const id of ids){const e=content.encounters[id];assert.equal(isQuestUnlocked(e,c),true);assert.doesNotThrow(()=>assertEncounterParty(e,c,content));c=claimBattleReward(c,{encounterId:id,outcome:'victory',rewardRandom:()=>0,actors:[],...(e.waves?{storyWave:{waveIndex:e.waves.length-1,totalWaves:e.waves.length}}:{})},content);}
 assert.ok(c.claimedFirstClearRewards.includes(ids[2]));assert.equal(content.exclusiveGear['artesia.astral_orb'].requires.firstClear,ids[1]);assert.ok(content.encounters[ids[1]].firstClearRewards.some(r=>r.templateId==='artesia.astral_orb'));assert.equal(c.originalPrisma,1);
 for(const id of ['astral_mote','cracked_astrolabe','nebula_echo','orbis_lost_sphere'])assert.ok(content.enemies[id].stats.speed<=19);
});
test('Orbis starts with75% reduction; any active attacker buff bypasses it, never consumes barrier stacks',()=>{
 const b=createBattle(structuredClone(content),save(),'artesia_story_3',()=>.99),t=getActor(b,'enemy_0'),a=getActor(b,'arthur');t.hp=t.stats.maxHp=100000;t.stats.defense=t.stats.resistance=0;t.weaknesses=[];a.stats.attack=100;a.statuses=[];a.passive=null;
 const hit={type:'damage',damageType:'physical',element:'plain',multiplier:1};assert.equal(t.statuses.find(s=>s.id==='starveil_barrier').stacks,3);cast(b,a,t,[hit]);const normal=b.events.find(e=>e.type==='damage').amount;
 cast(b,a,a,[{type:'status',status:'elder_resolve',duration:3}]);cast(b,a,t,[hit]);const boosted=b.events.find(e=>e.type==='damage').amount;assert.ok(boosted>=normal*3.9);assert.equal(t.statuses.find(s=>s.id==='starveil_barrier').stacks,3);
 a.statuses=[];cast(b,a,t,[hit]);assert.equal(b.events.find(e=>e.type==='damage').amount,normal);cast(b,a,t,[{type:'dispel',all:true}]);assert.equal(t.statuses.find(s=>s.id==='starveil_barrier'),undefined);
});
test('barrier tests current beneficial state, excluding debuffs, expired buffs and bare modes/resources',()=>{
 const target={statuses:[{id:'starveil_barrier',stacks:2,remaining:null}]};assert.equal(hasBeneficialStatus(content,{statuses:[{id:'effect_ward',remaining:null,charges:1}]}),true);assert.equal(hasBeneficialStatus(content,{statuses:[{id:'deep_wound',remaining:2}]}),false);assert.equal(hasBeneficialStatus(content,{statuses:[{id:'elder_resolve',remaining:0}]}),false);assert.equal(hasBeneficialStatus(content,{statuses:[],activeMode:'test',resourceValues:{x:3}}),false);assert.equal(bypassedBarrierReduction(content,target,{statuses:[{id:'effect_ward',remaining:null,charges:1}]}),.5);
});
test('Astral Orb replaces3% with5%, wraps positions, grants guard to neighbors only and respects Seal',()=>{
 const b=createBattle(structuredClone(content),save(),'forest_patrol',()=>.99),art=getActor(b,'artesia');for(const a of b.actors.filter(a=>a.team==='party')){a.stats.maxMp=100;a.mp=0;}
 use(b,'artesia','$defend');assert.equal(getActor(b,'arthur').mp,5);assert.equal(getActor(b,'chelsea').mp,5);assert.equal(getActor(b,'elaine').mp,0);assert.equal(art.mp,5);for(const id of ['arthur','chelsea'])assert.equal(getActor(b,id).statuses.find(s=>s.id==='astral_neighbor_guard').remaining,1);
 assert.ok(passivePresentation(art,content).facts.some(s=>s.includes('5%')));assert.ok(skillPresentation({id:'$defend',target:'self',effects:[{type:'status',status:'guard',duration:1}]},art,content).facts.some(s=>s.includes('Chiêm Tinh Cầu')||s.includes('5%')));
 const party=['artesia','arthur','chelsea','elaine'];const wrap=createBattle(structuredClone(content),save(party),'forest_patrol',()=>.99);for(const a of wrap.actors.filter(a=>a.team==='party')){a.stats.maxMp=100;a.mp=0;}const t=getActor(wrap,'elaine');t.statuses.push({id:'buff_seal',remaining:null,charges:1,stacks:1,sourceId:'enemy_0'});use(wrap,'artesia','$defend',undefined,'extra');assert.equal(t.mp,5);assert.equal(t.statuses.some(s=>s.id==='astral_neighbor_guard'),false);assert.equal(getActor(wrap,'arthur').mp,5);assert.equal(getActor(wrap,'chelsea').mp,0);
});
test('without Orb Artesia retains3% and no guard, and vacant/dead adjacent slots are never replaced',()=>{
 const b=createBattle(structuredClone(content),save(['arthur','artesia','chelsea','elaine'],false),'forest_patrol',()=>.99);for(const a of b.actors.filter(a=>a.team==='party')){a.stats.maxMp=100;a.mp=0;}getActor(b,'chelsea').hp=0;use(b,'artesia','$defend');assert.equal(getActor(b,'arthur').mp,3);assert.equal(getActor(b,'elaine').mp,0);assert.equal(getActor(b,'arthur').statuses.some(s=>s.id==='astral_neighbor_guard'),false);
});
