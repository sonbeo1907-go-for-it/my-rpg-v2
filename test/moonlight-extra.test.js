import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,getActor,executeAction,moonlightSnapshot} from '../src/core/battle.js';
import {createDungeonRun,advanceDungeonWave} from '../src/core/dungeon.js';
import {combatTimeline} from '../src/ui/combat-timeline.js';
import {recordMoonlightDamage,pulseMoonlight,expireMoonlight,settleMoonlight} from '../src/core/moonlight-blessings.js';
const c=await loadContent();
function save(){const s=createGameSave(c);s.party=['noelle','elaine','iris','garrek'];s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds.push('noelle');return s;}
function cast(b,id,skill,target='enemy_0'){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:skill,targetId:target});}
function battle(){const b=createBattle(c,save(),'forest_patrol',()=>.99);for(const a of b.actors.filter(a=>a.team==='enemy'))a.hp=a.stats.maxHp=100000;return b;}
function activate(b){cast(b,'noelle','noelle.thunder',b.actors.find(a=>a.team==='enemy').id);cast(b,'elaine','$attack',b.actors.find(a=>a.team==='enemy').id);}
test('stunned owner and Extra Turns do not freeze or duplicate the round pulse clock',()=>{
 const b=battle();activate(b);getActor(b,'noelle').statuses.push({id:'stunned',remaining:2,stacks:1,sourceId:'enemy_0'});
 b.extraTurnGrants.add('elaine');b.extraPhaseRequired=true;let extras=0,pulses=0;
 for(let i=0;i<30&&b.round===1;i++){if(b.phase==='extra')extras++;const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});pulses+=b.events.filter(e=>e.type==='ability_cast'&&e.abilityId==='moonlight.thunder_wrath').length;}
 assert.ok(extras>0);assert.equal(b.round,2);assert.equal(pulses,2);assert.equal(b.moonlight.party.active.expiresAfterRound,3);
});
test('storm carry keeps absolute expiry, source identity and activation lock through a dungeon room',()=>{
 const run=createDungeonRun(c,save(),'gold_mine','easy',{random:()=>0,rewardRandom:()=>0,now:new Date('2026-11-19T05:00:00Z')});
 for(const e of run.battle.actors.filter(a=>a.team==='enemy'))e.hp=e.stats.maxHp=100000;
 activate(run.battle);const old=structuredClone(run.battle.moonlight.party.active);run.battle.outcome='victory';advanceDungeonWave(c,run);
 assert.equal(run.battle.moonlight.party.active.startedRound,old.startedRound);assert.equal(run.battle.moonlight.party.active.expiresAfterRound,old.expiresAfterRound);assert.equal(run.battle.sourceActors.filter(a=>a.id==='moonlight_party').length,1);assert.ok(!run.battle.events.some(e=>e.type==='moonlight_enter'));
});
test('a real Miraebolis phase transition preserves the blessing and its clock',()=>{
 const cc=structuredClone(c),s=save();s.storyFlags.push('illusion.sinister_unlocked');cc.encounters.miraebolis_superboss.enemyLevel=1;delete cc.encounters.miraebolis_superboss.superLevels;
 const b=createBattle(cc,s,'miraebolis_superboss',()=>.99);activate(b);const d=structuredClone(b.moonlight.party.active),boss=getActor(b,'enemy_0');boss.hp=1;cast(b,'noelle','noelle.thunder');assert.equal(boss.bossState.phase,2);assert.equal(b.moonlight.party.active.startedRound,d.startedRound);assert.equal(b.moonlight.party.active.expiresAfterRound,d.expiresAfterRound);
});
test('expired blessing cannot reactivate twice in its activation round',()=>{
 const b=battle();activate(b);const state=b.moonlight.party,source={stat:()=>35,emit(){},write(){}};state.active.expiresAfterRound=b.round;expireMoonlight(b,source);state.slots=['water','thunder'];settleMoonlight(b,source);assert.equal(state.active,null);
});
test('multiple passive providers grant one team blessing and zero damage or dodges never fill sockets',()=>{
 const cc=structuredClone(c);cc.characters.iris.moonlightBlessings=['thunder_wrath'];const b=createBattle(cc,save(),'forest_patrol',()=>.99);assert.deepEqual(b.moonlight.party.allowed,['thunder_wrath']);
 recordMoonlightDamage(b,getActor(b,'elaine'),getActor(b,'enemy_0'),{element:'water'},0,{emit(){}});assert.deepEqual(b.moonlight.party.slots,[]);
});
test('storm and seed effects use custom hit-synchronised timelines, including automatic pulse damage',()=>{
 for(const id of ['moonlight.thunder_wrath','moonlight.bountiful_seed','noelle.thunder']){
  const skill=c.abilities[id],events=[{type:'ability_cast',sourceId:'moonlight_party',abilityId:id,area:true,targetId:'a',automaticCast:true},...['a','b'].map(targetId=>({type:'damage',sourceId:'moonlight_party',targetId,amount:10,element:skill.effects[0].element,automatic:true}))];
  const p=combatTimeline(events,c);const signatures=p.frames.filter(f=>f.kind==='signature'),hits=p.frames.filter(f=>f.kind==='hurt');assert.equal(signatures.length,id==='moonlight.bountiful_seed'?2:1);assert.ok(hits.every(f=>f.custom));assert.equal(signatures[0].at,hits[0].at);assert.ok(!p.frames.some(f=>f.kind==='formation'));
 }
});
test('runtime snapshot exposes dynamic blessing stat without mutating persistent state',()=>{
 const b=battle();activate(b);const before=structuredClone(b.moonlight),view=moonlightSnapshot(b);assert.ok(view.party.active.statValue>0);assert.deepEqual(b.moonlight,before);
});

test('a storm pulse itself transitions Miraebolis before the next actor acts',()=>{
 const cc=structuredClone(c),s=save();s.storyFlags.push('illusion.sinister_unlocked');cc.encounters.miraebolis_superboss.enemyLevel=1;delete cc.encounters.miraebolis_superboss.superLevels;
 const b=createBattle(cc,s,'miraebolis_superboss',()=>.99);activate(b);const boss=getActor(b,'enemy_0');boss.hp=Math.ceil(boss.stats.maxHp*boss.boss.phases[1].atHpRatio)+1;const r=b.round;
 for(let i=0;i<30&&b.round===r;i++){const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}
 assert.equal(boss.bossState.phase,2);assert.ok(b.events.some(e=>e.type==='damage'&&e.sourceId==='moonlight_party'));
});

test('tournament tie-break credit includes the fifth source HP damage',()=>{
 const b=battle();b.tournament={directHpDamage:{party:0,enemy:0},maxMainRounds:40};activate(b);b.tournament.directHpDamage.party=0;const r=b.round;
 for(let i=0;i<30&&b.round===r;i++){const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}
 const expected=b.events.filter(e=>e.tournamentDirect&&['moonlight_party','noelle'].includes(e.sourceId)).reduce((n,e)=>n+e.amount,0);assert.ok(expected>0);assert.equal(b.tournament.directHpDamage.party,expected);
});
