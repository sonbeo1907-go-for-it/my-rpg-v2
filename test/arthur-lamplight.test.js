import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,executeEnemyTurn,activeActor,forecastBattleAction} from '../src/core/battle.js';
import {createStoryRun,advanceStoryWave} from '../src/core/story-waves.js';
import {claimBattleReward} from '../src/core/economy.js';
import {exclusiveRollRange} from '../src/core/blacksmith-rules.js';
import {equipExclusive,craftExclusive} from '../src/core/blacksmith.js';
import {resolveCharacter} from '../src/core/progression.js';
import {baseStatValue} from '../src/core/combat-math.js';
import {criticalChance,criticalDamageMultiplier,stackCriticalDamageBonuses,resolveCritical,MAX_CRITICAL_MULTIPLIER} from '../src/core/critical.js';
import {validateContent} from '../src/core/content.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
import {createArenaBattle} from '../src/core/arena.js';
import {seededRandom} from '../src/core/random.js';
const c=await loadContent(),id='arthur.lamplight',item={templateId:id,statKey:'attack',statValue:10};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,a+' != '+b);
function save(arthur=true){const s=createGameSave(c);s.claimedFirstClearRewards=['east_ke_08','north_ke_01'];if(!arthur){s.party=['iris','elaine','garrek',null];s.partyPresets[0].slots=[...s.party];}return s;}
function finalWave(s){const run=createStoryRun(c,s,'north_ke_02',seededRandom(30));run.battle.outcome='victory';advanceStoryWave(c,run);run.battle.outcome='victory';return run.battle;}
function equipped(){const s=save();s.exclusiveGear.push({...item});return equipExclusive(s,c,'arthur',id);}
function combat(content=structuredClone(c),s=equipped()){
 const b=createBattle(content,s,'forest_patrol',seededRandom(4242)),a=b.actors.find(x=>x.definitionId==='arthur'),t=b.actors.find(x=>x.team==='enemy');
 for(const actor of b.actors){actor.hp=actor.stats.maxHp=1000000;actor.mp=actor.stats.maxMp=1000;actor.passive=null;actor.statuses=[];actor.weaknesses=[];actor.resistances={};actor.stats.attack=actor.stats.magic=100;actor.stats.defense=actor.stats.resistance=0;actor.baseStats={...actor.stats};actor.cooldowns={};}
 return {b,a,t};
}
function cast(b,a,abilityId,targetId=a.id){b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId,targetId});}
const hit={type:'damage',multiplier:1,element:'plain',damageType:'physical'};
test('signature content, 10 base ATK and quest party requirement validate',()=>{
 assert.deepEqual(validateContent(c),[]);assert.deepEqual(c.exclusiveGear[id].source,{type:'quest',encounterId:'north_ke_02',statKey:'attack',statValue:10,requiredPartyIds:['arthur']});
 assert.equal(c.exclusiveGear[id].passive.effects.find(p=>p.type==='critical_chance_bonus').ratio,.1);
 assert.equal(c.exclusiveGear[id].passive.effects.find(p=>p.type==='critical_damage_bonus').ratio,.2);
 assert.throws(()=>craftExclusive(save(),c,id),/nhiệm vụ/);
});
test('real two-wave victory grants the ready item once, never between waves',()=>{
 let s=save();const run=createStoryRun(c,s,'north_ke_02',seededRandom(3));
 for(;;){for(const a of run.battle.actors.filter(a=>a.team==='party')){a.hp=a.stats.maxHp=1000000;a.stats.attack=a.stats.magic=1000000;if(a.baseStats)a.baseStats={...a.stats};}
  let guard=0;while(!run.battle.outcome&&guard++<100){const b=run.battle,a=activeActor(b);if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:a.id,abilityId:'$attack',targetId:b.actors.find(x=>x.team==='enemy'&&x.hp>0).id});}
  assert.equal(run.battle.outcome,'victory');if(run.waveIndex===0){assert.equal(claimBattleReward(s,run.battle,c),s);advanceStoryWave(c,run);}else break;
 }
 const before=JSON.stringify(s);const next=claimBattleReward(s,run.battle,c);assert.equal(JSON.stringify(s),before);assert.deepEqual(next.exclusiveGear.find(x=>x.templateId===id),item);assert.equal(next.equippedExclusiveGear.arthur,undefined);assert.ok(run.battle.firstClearRewards.some(r=>r.templateId===id&&r.conditional));
 assert.deepEqual(decodeGameSave(encodeGameSave(next,c),c).exclusiveGear.find(x=>x.templateId===id),item);
});
test('an earlier clear without Arthur does not consume the signature reward',()=>{
 let s=save(false);s=claimBattleReward(s,finalWave(s),c);assert.ok(s.claimedFirstClearRewards.includes('north_ke_02'));assert.ok(!s.exclusiveGear.some(x=>x.templateId===id));
 s.party=['arthur','iris','elaine','garrek'];s.partyPresets[0].slots=[...s.party];const b=finalWave(s),next=claimBattleReward(s,b,c);assert.deepEqual(next.exclusiveGear.find(x=>x.templateId===id),item);
});
test('uses the actual battle roster, accepts fallen Arthur and never overwrites a reforged owned item',()=>{
 const s=save(),b=finalWave(s);b.actors.find(a=>a.definitionId==='arthur').hp=0;s.party=['iris','elaine','garrek',null];s.partyPresets[0].slots=[...s.party];const next=claimBattleReward(s,b,c);assert.ok(next.exclusiveGear.some(x=>x.templateId===id));
 const noArthur=finalWave(save(false));const current=save();assert.ok(!claimBattleReward(current,noArthur,c).exclusiveGear.some(x=>x.templateId===id));
 const owned=equipped(),rerolled={templateId:id,statKey:'magic',statValue:exclusiveRollRange(c,'magic').max};owned.exclusiveGear[0]=rerolled;const repeat=claimBattleReward(owned,finalWave(owned),c);assert.deepEqual(repeat.exclusiveGear,[rerolled]);assert.equal(repeat.equippedExclusiveGear.arthur,id);
});
test('defeat and failed persistence never grant or mark the signature claimed',()=>{
 const s=save(),b=finalWave(s);b.outcome='defeat';assert.equal(claimBattleReward(s,b,c),s);b.outcome='victory';const raw=JSON.stringify(s);assert.throws(()=>claimBattleReward(s,b,c,()=>{throw Error('disk');}),/disk/);assert.equal(JSON.stringify(s),raw);assert.ok(!b.rewardClaimed);assert.ok(!b.firstClearRewards);const next=claimBattleReward(s,b,c);assert.equal(next.exclusiveGear.filter(x=>x.templateId===id).length,1);
});
test('equip grants flat base ATK plus 10/20 Crit stats; an older signature is not replaced on reward',()=>{
 const plain=resolveCharacter(c,save(),'arthur'),actor=resolveCharacter(c,equipped(),'arthur');near(baseStatValue(actor,'attack'),baseStatValue(plain,'attack')+10);near(criticalChance(actor),.1);near(criticalChance(actor,true),.25);near(criticalDamageMultiplier(actor,c),1.7);
 const s=save();s.exclusiveGear=[{templateId:'arthur.intro',statKey:'attack',statValue:5}];s.equippedExclusiveGear.arthur='arthur.intro';const next=claimBattleReward(s,finalWave(s),c);assert.equal(next.equippedExclusiveGear.arthur,'arthur.intro');near(criticalChance(resolveCharacter(c,next,'arthur')),0);
});
test('all critical damage bonuses add before a total 200 percent cap',()=>{
 assert.equal(MAX_CRITICAL_MULTIPLIER,2);near(stackCriticalDamageBonuses(),1.5);near(stackCriticalDamageBonuses([.2]),1.7);near(stackCriticalDamageBonuses([.1,.2]),1.8);near(stackCriticalDamageBonuses([.2,.3]),2);near(stackCriticalDamageBonuses([.3,.3]),2);assert.equal(stackCriticalDamageBonuses([100,100]),2);
});
test('different Crit buffs stack even in the same modifier group; applied values, stacks, linked buffs and expiry work',()=>{
 const content=structuredClone(c),actor=resolveCharacter(content,equipped(),'arthur');
 content.statuses.crit_a={id:'crit_a',name:'A',kind:'buff',modifierGroup:'crit',modifiers:{criticalDamageBonus:.1}};
 content.statuses.crit_b={id:'crit_b',name:'B',kind:'buff',modifierGroup:'crit',maxStacks:3,modifiersPerStack:true,modifiers:{criticalDamageBonus:.05}};
 actor.statuses=[{id:'crit_a',remaining:2},{id:'crit_b',remaining:2,stacks:2}];near(criticalDamageMultiplier(actor,content),1.9);
 actor.statuses[1].appliedModifiers={criticalDamageBonus:.2};assert.equal(criticalDamageMultiplier(actor,content),2);
 actor.statuses[1].remaining=0;near(criticalDamageMultiplier(actor,content),1.8);actor.statuses[0].remaining=0;near(criticalDamageMultiplier(actor,content),1.7);
 content.statuses.crit_parent={id:'crit_parent',kind:'buff'};actor.statuses=[{id:'crit_parent',remaining:3,linkedStatuses:['crit_a']}];near(criticalDamageMultiplier(actor,content),1.8);
});
test('Crit chance rules remain max gear source plus exclusive plus weakness, capped at 100 percent',()=>{
 const a=resolveCharacter(c,equipped(),'arthur');a.baseStats={...a.stats,attack:120,magic:90};a.gearEffects=[c.gearEffects.martial_insight,c.gearEffects.arcane_insight];near(criticalChance(a),.9);assert.equal(criticalChance(a,true),1);a.statuses=[{id:'crit',remaining:4,appliedModifiers:{criticalDamageBonus:100}}];near(criticalChance(a),.9);
});
test('actual damage events and forecast use the capped Crit layer; Moon remains excluded',()=>{
 const {b,a,t}=combat();a.gearEffects=[c.gearEffects.martial_insight];a.baseStats.attack=150;
 b.content.statuses.crit={id:'crit',name:'Sát thương Bạo Kích',kind:'buff',modifiers:{criticalDamageBonus:.6}};a.statuses=[{id:'crit',remaining:4}];
 const skill={id:'test.crit_cap',name:'Thử Bạo Kích',target:'enemy',cost:{mp:0},effects:[{...hit,hits:2},{...hit,additionalElements:['moon']}]};b.content.abilities[skill.id]=skill;a.abilities.push(skill.id);b.queue=[a.id,t.id];b.cursor=0;
 const state=b.random.getState(),hp=t.hp,f=forecastBattleAction(b,{actorId:a.id,abilityId:skill.id,targetId:t.id});assert.equal(b.random.getState(),state);assert.equal(t.hp,hp);cast(b,a,skill.id,t.id);
 const hits=b.events.filter(e=>e.type==='damage'&&e.sourceId===a.id);assert.equal(hits.length,3);assert.ok(hits.slice(0,2).every(e=>e.criticalMultiplier===2));assert.ok(!hits[2].critical);assert.equal(hits[2].effectDamage,true);assert.deepEqual(hits.map(e=>e.amount),f.events.filter(e=>e.type==='damage'&&e.sourceId===a.id).map(e=>e.amount));
 assert.deepEqual(resolveCritical({random:()=>{throw Error('no Moon roll');}},a,{...hit,element:'moon'},{}),{critical:false,multiplier:1});
});
test('Crit buff expiry follows actual main-turn advancement, then returns to signature-only 170 percent',()=>{
 const {b,a}=combat();b.content.statuses.crit={id:'crit',name:'Bạo Kích',kind:'buff',durationClock:'main_turn',modifiers:{criticalDamageBonus:.2}};a.statuses=[{id:'crit',remaining:1,sourceId:a.id}];near(criticalDamageMultiplier(a,b.content),1.9);cast(b,a,'$defend');assert.ok(!a.statuses.some(s=>s.id==='crit'));near(criticalDamageMultiplier(a,b.content),1.7);
});
test('Crit damage cap works for both Arena sides and survives battle snapshots',()=>{
 for(const team of ['party','enemy']){const content=structuredClone(c);content.statuses.crit={id:'crit',name:'Bạo Kích',kind:'buff',modifiers:{criticalDamageBonus:.5}};const b=createArenaBattle(content,equipped(),'mirror',5),a=b.actors.find(x=>x.team===team&&x.definitionId==='arthur'),t=b.actors.find(x=>x.team!==team);for(const x of b.actors){x.hp=x.stats.maxHp=100000;x.passive=null;x.statuses=[];x.weaknesses=[];x.resistances={};x.stats.defense=x.stats.resistance=0;x.baseStats={...x.stats,attack:150,defense:0,resistance:0};}a.gearEffects=[c.gearEffects.martial_insight];a.statuses=[{id:'crit',remaining:4}];
  const restored=restoreChronicleBattle(b.content,snapshotChronicleBattle(b)),copy=restored.actors.find(x=>x.id===a.id);assert.equal(criticalDamageMultiplier(copy,b.content),2);cast(b,a,'$attack',t.id);const e=b.events.find(e=>e.type==='damage'&&e.sourceId===a.id);assert.equal(e.criticalMultiplier,2);assert.ok(e.pvpDamage);
 }
});
test('invalid critical buff amounts and party reward requirements are rejected',()=>{
 for(const amount of [-.1,NaN,Infinity]){const data=structuredClone(c);data.statuses.test_crit={id:'test_crit',name:'Thử',kind:'buff',modifiers:{criticalDamageBonus:amount}};assert.ok(validateContent(data).some(e=>e.includes('critical damage buff')));}
 for(const ids of [[],['missing'],['arthur','arthur']]){const data=structuredClone(c);data.exclusiveGear[id].source.requiredPartyIds=ids;assert.ok(validateContent(data).some(e=>e.includes('quest party requirement')));}
});
