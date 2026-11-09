import {seededRandom}from'../src/core/random.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent}from'../scripts/load-content.mjs';import {createGameSave,encodeGameSave,decodeGameSave}from'../src/core/game-save.js';
import {createBattle,executeAction,forecastBattleAction,planAutoBattleTurn}from'../src/core/battle.js';
import {teamResourceState}from'../src/core/team-resources.js';import{battleStat}from'../src/core/stat-values.js';
import{statusApplicationChance,validStatusChance}from'../src/core/status-chance.js';
import{resolveWeakness}from'../src/core/weakness.js';import{resolveRankedAbility}from'../src/core/skill-resolver.js';import{validateContent}from'../src/core/content.js';
import{skillPresentation,passivePresentation}from'../src/ui/skill-copy.js';import{snapshotChronicleBattle,restoreChronicleBattle}from'../src/core/chronicle-combat.js';
const c0=await loadContent();
function setup(party=['miyuki','arthur','iris','elaine'],encounter='forest_patrol'){
 const c=structuredClone(c0),s=createGameSave(c);s.party=party;s.partyPresets[0].slots=[...party];s.unlockedCharacterIds=Object.keys(c.characters);const b=createBattle(c,s,encounter,seededRandom(19),{enemyLevel:1});
 for(const a of b.actors){a.stats.maxHp=a.hp=10000;a.stats.maxMp=a.mp=100;a.stats.defense=a.stats.resistance=0;a.baseStats={...a.stats};a.statuses=[];a.gearEffects=[];a.weaknesses=[];a.resistances={};if(a.id!=='miyuki')a.passive=null;}
 const unit=id=>b.actors.find(a=>(a.characterId??a.definitionId)===id),m=unit('miyuki'),e=b.actors.find(a=>a.team==='enemy'),ally=unit('arthur');const pool=teamResourceState(b,m,'sword_soul');pool.value=0;return{c,s,b,unit,m,e,ally,pool};
}
function use(b,a,id,t=a){b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.cursor=0;return executeAction(b,{actorId:a.id,abilityId:id,targetId:t.id});}
function custom(b,a,effects,target='self'){const id='test.miyuki.'+b.actionCount;b.content.abilities[id]={id,name:'Thử nghiệm',target,cost:{mp:0},effects};a.abilities.push(id);return id;}
function fill(x,n=6){use(x.b,x.ally,custom(x.b,x.ally,[{type:'team_resource',resource:'sword_soul',amount:n}]));}
test('Miyuki official gacha/AI and fixed cleanse, ranked damage and unchanged chance cap validate',()=>{
 assert.deepEqual(validateContent(c0),[]);assert.ok(c0.banners.standard.characterPool.includes('miyuki'));assert.ok(c0.pvpAiProfiles.miyuki);const s=createGameSave(c0);assert.ok(decodeGameSave(encodeGameSave(s,c0),c0).characters.miyuki);assert.ok(!s.unlockedCharacterIds.includes('miyuki'));
 const {b,m,c,e}=setup();assert.ok(planAutoBattleTurn(b));const a=resolveRankedAbility(c,m,'miyuki.burst',5);assert.equal(a.effects[0].onHitStatus.chanceScaling.cap,.8);assert.equal(a.effects[0].rankDamageFactor,1.1**4);assert.ok(passivePresentation(m,c).facts.length);assert.ok(skillPresentation(c.abilities['miyuki.burst'],m,c).facts.some(x=>x.includes('80%')));
});
test('team reaching six enters immediately without payment and does not refresh an active three-turn mode',()=>{
 const x=setup();x.pool.value=4;use(x.b,x.ally,'$defend');assert.equal(x.m.activeMode,undefined);fill(x);assert.equal(x.pool.value,6);assert.equal(x.m.activeMode,'soul_tide');assert.equal(x.m.modeTurnsRemaining,3);assert.equal(battleStat(x.c,x.m,'attack'),40);fill(x,1);assert.equal(x.m.modeTurnsRemaining,3);
 const restored=restoreChronicleBattle(x.c,snapshotChronicleBattle(x.b));assert.equal(restored.actors.find(a=>a.id==='miyuki').modeTurnsRemaining,3);
});
test('mode clocks owner turns including Extra Turn and skipped turn; expiry waits until next turn to re-enter',()=>{
 const x=setup();fill(x);use(x.b,x.m,'$attack',x.e);assert.equal(x.m.modeTurnsRemaining,2);x.b.phase='extra';use(x.b,x.m,'$defend');assert.equal(x.m.modeTurnsRemaining,1);x.b.phase='main';x.m.statuses.push({id:'stunned',remaining:1,sourceId:x.e.id});x.b.queue=[x.ally.id,x.m.id,x.e.id];x.b.cursor=0;executeAction(x.b,{actorId:x.ally.id,abilityId:'$defend',targetId:x.ally.id});assert.equal(x.m.activeMode,undefined);assert.ok(x.b.log.some(x=>x.includes('rời sân')));
 x.b.queue=[x.ally.id,x.m.id,x.e.id];x.b.cursor=0;executeAction(x.b,{actorId:x.ally.id,abilityId:'$defend',targetId:x.ally.id});assert.equal(x.m.activeMode,'soul_tide');assert.equal(x.m.modeTurnsRemaining,3);
});
test('expiry below threshold does not re-enter; mode grants x2 weakness and no standalone lingering buff',()=>{
 const x=setup();fill(x);x.e.weaknesses=['water'];let effect=x.c.abilities['miyuki.strike'].effects[0];assert.equal(resolveWeakness(x.c,x.m,x.e,effect,{}).multiplier,2);x.pool.value=0;for(let i=0;i<3;i++)use(x.b,x.m,'$attack',x.e);assert.equal(x.m.activeMode,undefined);assert.equal(resolveWeakness(x.c,x.m,x.e,effect,{}).multiplier,1.5);assert.ok(!x.m.statuses.some(s=>x.c.statuses[s.id].weaknessMultiplier));
});
test('offering cleanses actual debuffs and adds explicit plus natural soul, burst prefers four else MP',()=>{
 const x=setup();x.m.statuses=[{id:'mana_disruption',remaining:null,charges:1,mpCostIncrease:.5,sourceId:x.e.id},{id:'exposure_dark',remaining:null,stacks:1,sourceId:x.e.id}];use(x.b,x.m,'miyuki.offering');assert.equal(x.m.statuses.length,0);assert.equal(x.pool.value,2);
 for(const funded of [false,true]){const y=setup();y.pool.value=funded?4:3;use(y.b,y.m,'miyuki.burst',y.e);assert.equal(y.m.mp,funded?100:76);assert.equal(y.pool.value,funded?1:4);}
});
test('chance scaling supports every stat, dynamic and base, zero and cap without rank changes',()=>{
 const x=setup();x.c.statuses.test_boost={id:'test_boost',name:'Tăng công',kind:'buff',modifiers:{attack:1}};x.m.stats.attack=x.m.baseStats.attack=100;x.m.statuses=[{id:'test_boost',remaining:2,stacks:1,sourceId:x.m.id}];const q={stat:'attack',basis:'dynamic',at:160,cap:.8};assert.equal(statusApplicationChance(x.c,x.m,q),.8);assert.equal(statusApplicationChance(x.c,x.m,{...q,basis:'base'}),.5);
 for(const stat of ['maxHp','maxMp','attack','magic','defense','resistance','speed'])assert.ok(validStatusChance({...q,stat}));assert.equal(validStatusChance({...q,stat:'crit'}),false);assert.equal(validStatusChance({...q,cap:2}),false);x.m.stats.attack=x.m.baseStats.attack=0;assert.equal(statusApplicationChance(x.c,x.m,q),0);
});
test('real on-hit stun uses dynamic ATK and misses at boundary; Ward blocks a successful roll',()=>{
 for(const [roll,ward,stunned]of [[.799,false,true],[.8,false,false],[.799,true,false]]){const x=setup();x.m.stats.attack=x.m.baseStats.attack=160;x.b.random=()=>roll;if(ward)x.e.statuses=[{id:'effect_ward',remaining:null,charges:1,stacks:1,sourceId:x.e.id}];use(x.b,x.m,'miyuki.burst',x.e);assert.equal(x.e.statuses.some(s=>s.id==='stunned'),stunned);if(ward)assert.ok(!x.e.statuses.some(s=>s.id==='effect_ward'));}
});
test('boss immune to incoming stun without using Ward, minions remain susceptible',()=>{
 const x=setup(undefined,'ogre_trial');x.m.stats.attack=x.m.baseStats.attack=1000;x.b.random=()=>0;x.e.statuses=[{id:'effect_ward',remaining:null,charges:1,stacks:1,sourceId:x.e.id}];use(x.b,x.m,'miyuki.burst',x.e);assert.ok(!x.e.statuses.some(s=>s.id==='stunned'));assert.ok(x.e.statuses.some(s=>s.id==='effect_ward'));assert.ok(x.b.events.some(e=>e.type==='status_immune'));
 const minion=x.b.actors.filter(a=>a.team==='enemy')[1];x.m.cooldowns={};use(x.b,x.m,'miyuki.burst',minion);assert.ok(minion.statuses.some(s=>s.id==='stunned'));
});
test('spider retains scripted self-stun on broken shield despite boss immunity',()=>{
 const x=setup(undefined,'giant_spider_lair');x.e.passive=structuredClone(x.c.enemies.giant_spider.passive);x.e.shield=1;x.e.shieldSourceId=x.e.id;use(x.b,x.m,'$attack',x.e);assert.ok(x.e.statuses.some(s=>s.id==='stunned'&&s.bypassControlImmunity));assert.ok(x.e.statuses.some(s=>s.id==='shell_exposed'));
});
test('forecast can trigger native mode and stun but cannot mutate actual pool, mode, HP or RNG',()=>{
 const x=setup();x.pool.value=5;x.b.queue=[x.m.id,x.e.id];x.b.cursor=0;const trial=forecastBattleAction(x.b,{actorId:x.m.id,abilityId:'miyuki.offering',targetId:x.m.id});assert.equal(x.pool.value,5);assert.equal(x.m.activeMode,undefined);assert.equal(trial.actors.find(a=>a.id===x.m.id).activeMode,'soul_tide');
});
test('invalid stun chance parameters are rejected by content validation',()=>{for(const rule of [{stat:'x',basis:'dynamic',at:160,cap:.8},{stat:'attack',basis:'future',at:160,cap:.8},{stat:'attack',basis:'base',at:0,cap:.8}]){const c=structuredClone(c0);c.abilities['miyuki.burst'].effects[0].onHitStatus.chanceScaling=rule;assert.ok(validateContent(c).some(e=>e.includes('control probability')));}});

test('boss immunity resolves through current definition for a restored snapshot missing the new metadata',()=>{
 const x=setup(undefined,'ogre_trial');delete x.e.controlImmunities;x.m.stats.attack=x.m.baseStats.attack=1000;x.b.random=()=>0;use(x.b,x.m,'miyuki.burst',x.e);assert.ok(!x.e.statuses.some(s=>s.id==='stunned'));assert.ok(x.b.events.some(e=>e.type==='status_immune'));
});

test('all shipped superbosses reject incoming guaranteed stun while keeping their Ward intact',()=>{
 for(const id of ['alice_superboss','miraebolis_superboss','epilogue_unfinished']){
  const c=structuredClone(c0);delete c.encounters[id].requires;
  const save=createGameSave(c);save.party=['miyuki','arthur','iris','elaine'];save.partyPresets[0].slots=[...save.party];save.unlockedCharacterIds=Object.keys(c.characters);save.chronicles.aliceFirstEncounterCleared=true;save.storyFlags.push("illusion.sinister_unlocked");
  const b=createBattle(c,save,id,seededRandom(27)),m=b.actors.find(a=>a.id==='miyuki'),enemy=b.actors.find(a=>a.team==='enemy');
  enemy.hp=enemy.stats.maxHp=100000;enemy.stats.defense=0;enemy.weaknesses=[];enemy.damageTypeWeaknesses=[];enemy.statuses=[{id:'effect_ward',remaining:null,charges:1,stacks:1,sourceId:enemy.id}];m.baseStats??={...m.stats};m.stats.attack=m.baseStats.attack=160;b.random=()=>0;
  use(b,m,'miyuki.burst',enemy);
  assert.ok(!enemy.statuses.some(s=>s.id==='stunned'),id);assert.ok(enemy.statuses.some(s=>s.id==='effect_ward'),id);assert.ok(b.events.some(e=>e.type==='status_immune'&&e.targetId===enemy.id),id);
 }
});
test('Miyuki uses the standard local mode presentation of Valery, Joshua and Yufina, never Selene mask scene',()=>{
 const mode=c0.characters.miyuki.combatModes.soul_tide;
 assert.equal(mode.presentationScope,'none');assert.equal(mode.background,undefined);assert.equal(mode.music,undefined);assert.ok(mode.summary.includes('+25% ATK'));assert.ok(mode.summary.includes('Khai Phá Điểm Yếu'));
 for(const id of ['valery','joshua','yufina'])assert.ok(Object.values(c0.characters[id].combatModes).every(m=>m.presentationScope===mode.presentationScope));
 assert.equal(c0.characters.selene.combatModes.lunarmare.presentationScope,'actor');
});
test('content validation rejects a single-unit superboss that forgets stun immunity',()=>{
 const c=structuredClone(c0);delete c.enemies.dark_holy_blade_alice.controlImmunities;
 assert.ok(validateContent(c).some(e=>e.includes('alice_superboss: superboss requires stun immunity')));
});
