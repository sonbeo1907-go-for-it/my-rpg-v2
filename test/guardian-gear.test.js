import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,activeActor,executeEnemyTurn,forecastBattleAction} from '../src/core/battle.js';
import {resolveCharacter} from '../src/core/progression.js';import {battleStat} from '../src/core/stat-values.js';
import {createArenaBattle} from '../src/core/arena.js';import {expireRoundEffects} from '../src/core/round-effects.js';
import {validateContent} from '../src/core/content.js';import {guardianRecipes} from '../src/core/guardian-gear.js';
const c=await loadContent(),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function fixture(party=['elaine','armie','iris','garrek']){const content=structuredClone(c),save=createGameSave(content);save.party=party;save.partyPresets[0].slots=[...party];save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];const b=createBattle(content,save,'forest_patrol',()=>.99);for(const a of b.actors){a.hp=a.stats.maxHp=10000;a.mp=50;a.stats.maxMp=100;a.stats.attack=a.stats.magic=100;a.stats.defense=a.stats.resistance=0;a.baseStats={...a.stats};a.statuses=[];a.gearEffects=[];a.weaknesses=[];a.resistances={};}return {b,save,a:b.actors.find(x=>x.id===party[0]),e:b.actors.find(x=>x.team==='enemy'),allies:b.actors.filter(x=>x.team==='party')};}
const attach=(a,id)=>a.gearEffects.push(structuredClone(c.gearEffects[id]));
function cast(b,a,id,target=a.id){b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:target});}
function skill(b,a,id,effects,target='enemy'){b.content.abilities[id]={id,name:'Kiểm thử',target,effects};a.abilities.push(id);return id;}
const reactions=b=>b.events.filter(x=>x.type==='reaction'&&x.gearEffectId);
test('new recipes validate and permanent/conditional stats are exact and reversible',()=>{
 assert.deepEqual(validateContent(c),[]);const recipes=['aegis_covenant','shelter_relay','restoration_clock','unbroken_crest','desperate_crest','echoing_edge','affliction_prism','healers_chorus'];
 for(const id of recipes){const save=createGameSave(c);save.craftedGearSerial=1;save.gear.push({id:'rune_1',typeId:'t4_effect',effectId:id,stats:{}});save.equipment.arthur=['rune_1'];assert.equal(decodeGameSave(encodeGameSave(save,c),c).gear[0].effectId,id);const a=resolveCharacter(c,save,'arthur');
  if(id==='unbroken_crest'){near(battleStat(c,a,'attack'),34*1.3);a.hp=189;near(battleStat(c,a,'attack'),34*1.15);a.hp=190;near(battleStat(c,a,'attack'),34*1.3);}
  if(id==='desperate_crest'){a.hp=133;near(battleStat(c,a,'attack'),34*1.2);a.hp=132;near(battleStat(c,a,'attack'),34*1.4);a.hp=190;near(battleStat(c,a,'attack'),34*1.2);}
 }
});
test('shield skill grants direct guard through end of next round, without blocking status damage',()=>{
 const {b,a,allies}=fixture();attach(a,'aegis_covenant');const id=skill(b,a,'test.shield',[{type:'shield',flat:10}],'all_allies');cast(b,a,id);for(const x of allies){const s=x.statuses.find(s=>s.id==='gear_direct_guard');assert.equal(s.expiresAfterRound,b.round+1);}
 const io={write:()=>{},emit:()=>{}};expireRoundEffects(b,io,true);assert.ok(a.statuses.some(s=>s.id==='gear_direct_guard'));b.round++;expireRoundEffects(b,io,true);assert.ok(!a.statuses.some(s=>s.id==='gear_direct_guard'));
 assert.equal(c.statuses.gear_direct_guard.modifiers.damageReduction,undefined);
});
test('enemy shield break refills once per wearer/round, no expiry/friendly/lethal proc; Elaine native still heals first',()=>{
 const {b,a,e,allies}=fixture();attach(a,'shelter_relay');a.stats.maxHp=1000;a.hp=1000;const target=allies[2];target.hp=500;target.shield=1;target.shieldSourceId=a.id;
 cast(b,e,'$attack',target.id);assert.equal(target.shield,350);assert.ok(b.events.some(x=>x.type==='heal'&&x.sourceId===a.id));
 target.shield=1;cast(b,e,'$attack',target.id);assert.equal(target.shield,0);
 b.round++;target.shield=1;cast(b,allies[1],'$attack',e.id);assert.equal(target.shield,1);target.hp=1;target.shield=1;cast(b,e,'$attack',target.id);assert.equal(target.hp,0);assert.equal(target.shield,0);
});
test('support clock selects longest remaining heal/shield CD, excludes utility and never ticks in Extra',()=>{
 const {b,a}=fixture();attach(a,'restoration_clock');a.cooldowns={'elaine.water_shield':4};
 const heal=skill(b,a,'test.heal',[{type:'heal',flat:10}],'ally'),shield=skill(b,a,'test.aegis',[{type:'shield',flat:10}],'self'),other=skill(b,a,'test.utility',[{type:'status',status:'guard',duration:1}],'self');a.cooldowns={[heal]:5,[shield]:3,[other]:9};
 // Enter beginTurn through the engine by ending the immediately preceding actor's turn.
 const before=b.actors.find(x=>x.id!==a.id);b.queue=[before.id,a.id];b.cursor=0;executeAction(b,{actorId:before.id,abilityId:'$defend',targetId:before.id});assert.equal(a.cooldowns[heal],4);assert.equal(a.cooldowns[shield],3);assert.equal(a.cooldowns[other],9);
 b.phase='extra';b.queue=[before.id,a.id];b.cursor=0;executeAction(b,{actorId:before.id,abilityId:'$defend',targetId:before.id});assert.equal(a.cooldowns[heal],4);
});
test('single-target echo inherits two hit strength/type/element, hits only other enemies once per round, no utility copying',()=>{
 const {b,a,e}=fixture();attach(a,'echoing_edge');const id=skill(b,a,'test.dual',[{type:'damage',damageType:'physical',element:'wind',scalingStat:'attack',multiplier:2,hits:2,onHitStatus:{status:'deep_wound',duration:2}}]);cast(b,a,id,e.id);
 const hits=b.events.filter(x=>x.type==='damage');assert.equal(reactions(b).length,1);assert.equal(hits.length,6);assert.equal(hits.filter(x=>x.reaction&&x.targetId===e.id).length,0);assert.ok(hits.filter(x=>x.reaction).every(x=>x.damageType==='physical'&&x.element==='wind'));for(const x of hits.filter(x=>x.reaction))assert.ok(Math.abs(x.amount-hits[0].amount*.85)<=1);
 cast(b,a,id,e.id);assert.equal(reactions(b).length,0);
});
test('debuff echo counts distinct types, not stacks, at 2/4 thresholds, follows damage type, never recurses',()=>{
 for(const count of [1,2,3,4]){const {b,a,e}=fixture();attach(a,'affliction_prism');e.statuses=['deep_wound','exposure_wind','gear_defense_crack','gear_resistance_crack'].slice(0,count).map(id=>({id,remaining:3,stacks:1}));const id=skill(b,a,'test.hit',[{type:'damage',damageType:'physical',element:'earth',multiplier:1}]);cast(b,a,id,e.id);assert.equal(reactions(b).length,count>=2?1:0);if(count>=2){const h=b.events.find(x=>x.type==='damage'&&x.reaction);assert.equal(h.damageType,'physical');assert.equal(h.element,'earth');assert.ok(Math.abs(h.amount-(count>=4?180:90))<=2);}}
});
test('active AoE healing restores exactly 6 MP team once and protects every actually healed target, not overheal',()=>{
 const {b,a,allies}=fixture(['armie','elaine','iris','garrek']);attach(a,'healers_chorus');for(const x of allies){x.hp=500;x.mp=20;}const id=skill(b,a,'test.heal',[{type:'heal',flat:100}],'all_allies');cast(b,a,id);for(const x of allies){assert.equal(x.mp,26);assert.equal(x.statuses.find(s=>s.id==='gear_healing_guard').expiresAfterRound,b.round);}
 const other=allies[1];attach(other,'healers_chorus');const heal=skill(b,other,'test.other',[{type:'heal',flat:10}],'all_allies');cast(b,other,heal);for(const x of allies)assert.equal(x.mp,26);
 b.round++;for(const x of allies)x.hp=x.stats.maxHp;cast(b,a,id);for(const x of allies)assert.equal(x.mp,26);
});
test('Elaine native break heals multiple allies in an enemy AoE: one team proc, each healed recipient protected',()=>{
 const {b,a,e,allies}=fixture();attach(a,'healers_chorus');for(const x of allies){x.hp=500;x.mp=20;x.shield=1;x.shieldSourceId=a.id;}
 const id=skill(b,e,'test.aoe',[{type:'damage',damageType:'physical',element:'plain',multiplier:1}],'all_enemies');cast(b,e,id,allies[0].id);for(const x of allies){assert.equal(x.mp,26);assert.ok(x.statuses.some(s=>s.id==='gear_healing_guard'));}assert.equal(b.events.filter(x=>x.type==='passive'&&x.gearEffectId==='healers_chorus').length,1);
});
test('Elaine overheal/death do not proc, forecast leaves team budget intact',()=>{
 const {b,a,e,allies}=fixture();attach(a,'healers_chorus');const t=allies[2];t.hp=t.stats.maxHp;t.shield=10000;t.shieldSourceId=a.id;b.queue=[e.id,t.id];b.cursor=0;
 const probe=forecastBattleAction(b,{actorId:e.id,abilityId:'$attack',targetId:t.id});t.shield=probe.events.find(x=>x.type==='damage'&&x.sourceId===e.id).absorbed;
 cast(b,e,'$attack',t.id);assert.equal(t.shield,0);assert.equal(t.hp,t.stats.maxHp);assert.ok(b.events.some(x=>x.type==='heal')===false);assert.ok(!b.gearTeamProcRounds);
 t.hp=500;t.shield=1;b.queue=[e.id,t.id];b.cursor=0;const f=forecastBattleAction(b,{actorId:e.id,abilityId:'$attack',targetId:t.id});assert.ok(f.gearTeamProcRounds);assert.ok(!b.gearTeamProcRounds);cast(b,e,'$attack',t.id);assert.equal(t.mp,56);
});

test('real active healers Armie, Ardelia and Cedric activate team mana and protect healed allies',()=>{
 for(const owner of ['armie','ardelia','cedric']){const {b,a,allies}=fixture([owner,'iris','garrek','arthur']);attach(a,'healers_chorus');for(const x of allies){x.hp=500;x.mp=50;}
  const ability=a.abilities.map(id=>b.content.abilities[id]).find(s=>s.effects.some(e=>e.type==='heal'));assert.ok(ability,owner+' needs an authored heal');
  cast(b,a,ability.id,ability.target==='ally'?allies[1].id:a.id);
  const healed=b.events.filter(x=>x.type==='heal'&&x.sourceId===a.id&&x.amount>0);assert.ok(healed.length,owner+' heals');
  assert.equal(b.events.filter(x=>x.type==='passive'&&x.gearEffectId==='healers_chorus').length,1);
  assert.equal(b.events.filter(x=>x.type==='mp_restore'&&x.sourceId===a.id&&x.amount===6).length,4);
  for(const h of healed)assert.ok(b.actors.find(x=>x.id===h.targetId).statuses.some(s=>s.id==='gear_healing_guard'));
 }
});

test('healing gear ignores debt-only healing and blocked outside healing, resets next round and separates opposing teams',()=>{
 const {b,a,e,allies}=fixture(['armie','elaine','iris','garrek']);attach(a,'healers_chorus');const t=allies[2];t.hp=500;
 const id=skill(b,a,'test.heal',[{type:'heal',flat:100}],'ally');t.statuses=[{id:'life_mortgage',remaining:null,stacks:1,debtHp:1000}];
 t.passive={...t.passive,blockExternalHealing:true};cast(b,a,id,t.id);assert.ok(!b.gearTeamProcRounds);assert.equal(t.hp,500);t.passive.blockExternalHealing=false;
 cast(b,a,id,t.id);assert.ok(!b.gearTeamProcRounds);assert.equal(t.hp,500);t.statuses=[];t.lifeDebt=0;cast(b,a,id,t.id);assert.ok(b.gearTeamProcRounds.party);b.round++;cast(b,a,id,t.id);assert.equal(b.gearTeamProcRounds.party.gear_healers_chorus,b.round);
 attach(e,'healers_chorus');const other=b.actors.find(x=>x.team==='enemy'&&x!==e);other.hp=500;const eid=skill(b,e,'test.enemyHeal',[{type:'heal',flat:10}],'ally');cast(b,e,eid,other.id);assert.equal(b.gearTeamProcRounds.enemy.gear_healers_chorus,b.round);
});
