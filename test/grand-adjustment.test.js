import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,executeEnemyTurn,activeActor,forecastBattleAction,abilityAvailability} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {resolveCharacter} from '../src/core/progression.js';
import {craftGear} from '../src/core/gear-forge.js';
import {damageFlags} from '../src/core/damage-kind.js';
import {normalGearBaseMultiplier} from '../src/core/normal-damage-gear.js';
import {seededRandom} from '../src/core/random.js';
import {validateContent} from '../src/core/content.js';
const content=await loadContent();
function save(c=content,party=['arthur','iris','garrek','elaine']){const s=createGameSave(c);s.party=party;s.partyPresets[0].slots=[...party];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...party])];return s;}
function setup(party){const c=structuredClone(content),s=save(c,party),b=createBattle(c,s,'forest_patrol',seededRandom(51));for(const a of b.actors){a.passive=null;a.exclusiveGear=null;a.stats={maxHp:1000000,maxMp:10000,attack:100,magic:100,defense:0,resistance:0,speed:10};a.baseStats={...a.stats};a.hp=1000000;a.mp=10000;a.statuses=[];a.gearEffects=[];a.weaknesses=[];a.resistances={};a.cooldowns={};a.teamAuraModifiers={};}return {c,b,s,a:b.actors.find(x=>x.team==='party'),t:b.actors.find(x=>x.team==='enemy')};}
function attach(a,id){a.gearEffects.push(structuredClone(content.gearEffects[id]));}
function use(b,a,id,t=a){b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:t.id});}
function skill(c,a,{effects,target='enemy',id='test.grand',cost={mp:0}}={}){c.abilities[id]={id,name:'Chiêu thử',target,cost,effects,rankable:false};a.abilities.push(id);return id;}
const hit=(extra={})=>({type:'damage',damageType:'physical',scalingStat:'attack',element:'plain',multiplier:1,...extra});
const hits=(b,a)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===a.id);
test('damage classes are complementary, include additional Moon, and do not confuse Sword Soul or physical/magical',()=>{
 for(const e of [hit(),hit({element:'sword_soul'}),hit({additionalElements:['sword_soul']})])assert.deepEqual(damageFlags(e),{normalDamage:true,effectDamage:false});
 for(const e of [hit({element:'moon'}),hit({additionalElements:['moon']}),{element:'dark',elements:['dark','moon']}])assert.deepEqual(damageFlags(e),{normalDamage:false,effectDamage:true});
});
test('recipes validate, forge with existing costs and T3, survive save/load and grant exact permanent stats',()=>{
 assert.deepEqual(validateContent(content),[]);
 for(const [id,key] of [['martial_insight','attack'],['arcane_insight','magic']]){
  const s=save();s.coins=50000;s.prismaFragments=10000;s.gear=[{id:'gear_1',typeId:'t3_focused',stats:{attack:5}}];s.gacha.totalPulls=1;
  const n=craftGear(s,content,{effectId:id,materialId:'gear_1'}),g=n.gear.at(-1);assert.equal(g.effectId,id);assert.equal(n.coins,38000);assert.equal(n.prismaFragments,7600);assert.equal(s.coins,50000);
  const baseline=resolveCharacter(content,n,'arthur').stats[key];n.equipment.arthur=[g.id,null,null];const r=decodeGameSave(encodeGameSave(n,content),content);assert.ok(Math.abs(resolveCharacter(content,r,'arthur').stats[key]-baseline*1.2)<1e-8);
 }
});
test('chance uses base stat, caps at 150, shares one roll per group/action and excludes Moon without rolling',()=>{
 const {b,a}=setup();attach(a,'martial_insight');let rolls=0;b.random=()=>{rolls++;return .4;};a.baseStats.attack=75;
 const ctx={};assert.equal(normalGearBaseMultiplier(b,a,hit(),ctx),1.5);assert.equal(normalGearBaseMultiplier(b,a,hit(),ctx),1.5);assert.equal(rolls,1);
 a.statuses=[{id:'anabel_command',stacks:1,remaining:6}];assert.equal(normalGearBaseMultiplier({...b,random:()=>.6},a,hit(),{}),1);
 a.baseStats.attack=150;assert.equal(normalGearBaseMultiplier(b,a,hit(),{}),1.5);assert.equal(rolls,1);
 a.baseStats.attack=1000;assert.equal(normalGearBaseMultiplier(b,a,hit(),{}),1.5);
 assert.equal(normalGearBaseMultiplier(b,a,hit({additionalElements:['moon']}),{}),1);assert.equal(rolls,1);
 a.baseStats.attack=0;assert.equal(normalGearBaseMultiplier(b,a,hit(),{}),1);assert.equal(rolls,1);
});
test('new gear boosts before defense and coexists with strongest-only charged skill amp',()=>{
 const {b,c,a,t}=setup();attach(a,'martial_insight');a.baseStats.attack=150;t.stats.defense=t.baseStats.defense=100;
 c.statuses.test_amp={id:'test_amp',name:'Thử',kind:'buff',persistent:true,damageUses:2,modifiers:{damageBonus:.3}};a.statuses=[{id:'test_amp',charges:2,remaining:null,stacks:1}];
 const id=skill(c,a,{effects:[hit()]});use(b,a,id,t);assert.equal(hits(b,a)[0].amount,Math.floor((150*1.5-55)*1.3));assert.equal(a.statuses.find(s=>s.id==='test_amp').charges,1);
});
test('AoE/multi-hit use one roll, while a second action rolls again; flags persist on shield hits',()=>{
 const {b,c,a,t}=setup();attach(a,'martial_insight');a.baseStats.attack=75;let count=0;b.random=()=>{count++;return count===1?.1:.9;};t.shield=10000;
 const id=skill(c,a,{effects:[hit({hits:3})],target:'all_enemies'});use(b,a,id,t);assert.equal(hits(b,a).length,9);assert.ok(hits(b,a).every(e=>e.amount+e.absorbed===112&&e.normalDamage&&!e.effectDamage));assert.equal(count,1);
 use(b,a,id,t);assert.ok(hits(b,a).every(e=>e.amount+e.absorbed===75));assert.equal(count,2);
});
test('mixed-affinity action classifies each hit and only the non-Moon packet receives base bonus',()=>{
 const {b,c,a,t}=setup();attach(a,'martial_insight');a.baseStats.attack=150;const id=skill(c,a,{effects:[hit(),hit({additionalElements:['moon']})]});use(b,a,id,t);
 assert.deepEqual(hits(b,a).map(e=>[e.amount,e.normalDamage,e.effectDamage]),[[225,true,false],[150,false,true]]);
});
test('two different insights add base bonus; duplicate group cannot proc twice; MAG gear also works on ATK-scaled damage',()=>{
 const {b,c,a,t}=setup();a.baseStats.attack=a.baseStats.magic=150;attach(a,'martial_insight');attach(a,'martial_insight');attach(a,'arcane_insight');const id=skill(c,a,{effects:[hit()]});use(b,a,id,t);assert.equal(hits(b,a)[0].amount,300);
 const broken=structuredClone(c);broken.gearEffects.arcane_insight.effect.atStat=0;assert.ok(validateContent(broken).some(s=>s.includes('arcane_insight')));
});
test('Moon conversion in an actual active blessing is classified after conversion and does not roll gear',()=>{
 const {b,c}=setup(['noelle','elaine','iris','arthur']),a=b.actors.find(x=>x.id==='noelle'),t=b.actors.find(x=>x.team==='enemy');a.passive=structuredClone(c.characters.noelle.passive);attach(a,'martial_insight');a.baseStats.attack=150;
 use(b,a,'noelle.thunder',t);assert.ok(hits(b,a).every(e=>e.normalDamage));use(b,b.actors.find(x=>x.id==='elaine'),'$attack',t);assert.equal(b.moonlight.party.active.id,'thunder_wrath');
 for(const enemy of b.actors.filter(x=>x.team==='enemy'))enemy.statuses=[];
 const id=skill(c,a,{effects:[hit({element:'thunder'})]});use(b,a,id,t);assert.ok(hits(b,a).every(e=>e.effectDamage&&!e.normalDamage));assert.equal(hits(b,a)[0].amount,150);
});
test('forecast never consumes live RNG or stores a live proc; rejected cast cannot roll or spend MP',()=>{
 const {b,c,a,t}=setup();attach(a,'martial_insight');a.baseStats.attack=75;const id=skill(c,a,{effects:[hit()],cost:{mp:10}});b.queue=[a.id,t.id];b.cursor=0;const state=b.random.getState(),mp=a.mp;
 const f=forecastBattleAction(b,{actorId:a.id,abilityId:id,targetId:t.id});assert.equal(b.random.getState(),state);assert.equal(a.mp,mp);assert.ok(f.events.some(e=>e.normalDamage));assert.equal(a.normalGearChecks,undefined);
 a.mp=0;assert.throws(()=>executeAction(b,{actorId:a.id,abilityId:id,targetId:t.id}));assert.equal(b.random.getState(),state);
});
test('normal periodic damage gets base bonus per tick, keeps source potency snapshot and receives classification',()=>{
 const {b,c,a,t}=setup();attach(a,'martial_insight');a.baseStats.attack=150;
 c.statuses.test_dot={id:'test_dot',name:'Độc thử',kind:'debuff',damageOverTime:{element:'dark',scalingStat:'attack',multiplier:.2}};
 const id=skill(c,a,{effects:[{type:'status',status:'test_dot',duration:3}]});use(b,a,id,t);
 // End an ordinary actor turn directly into target beginTurn, no manual tick helper.
 a.baseStats.attack=300;b.queue=[a.id,t.id];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});
 const tick=b.events.find(e=>e.type==='damage'&&e.periodic&&e.targetId===t.id);assert.ok(tick);assert.equal(tick.amount,45);assert.equal(tick.normalDamage,true);assert.equal(tick.effectDamage,false);
});
test('opposing Arena characters use the same classification and insight before PvP caps',()=>{
 const c=structuredClone(content),b=createArenaBattle(c,save(c),'mirror',123),a=b.actors.find(x=>x.team==='enemy'),t=b.actors.find(x=>x.team==='party');for(const x of b.actors){x.hp=x.stats.maxHp=100000;x.passive=null;x.stats.defense=x.stats.resistance=0;x.statuses=[];x.weaknesses=[];}a.baseStats={...a.stats,attack:150};attach(a,'martial_insight');
 use(b,a,'$attack',t);const e=hits(b,a)[0];assert.equal(e.normalDamage,true);assert.ok(e.pvpDamage);assert.ok(e.amount<225);
});
test('Anabel command spans two legal bursts R2 and R6, including their repeats and an Extra turn',()=>{
 const c=structuredClone(content),b=createBattle(c,save(c,['anabel','iris','garrek','elaine']),'forest_patrol',()=>.99),a=b.actors.find(x=>x.id==='anabel'),t=b.actors.find(x=>x.team==='enemy');for(const x of b.actors){x.hp=x.stats.maxHp=1000000;x.mp=x.stats.maxMp=10000;if(x.team==='enemy')x.stats.attack=x.stats.magic=0;}
 function step(){const x=activeActor(b);if(x.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:x.id,abilityId:'$defend',targetId:x.id});}
 function seek(round,phase='main'){let n=0;while((b.round!==round||b.phase!==phase||activeActor(b)?.id!==a.id)&&n++<250)step();assert.ok(n<250);}
 seek(1);executeAction(b,{actorId:a.id,abilityId:'anabel.command',targetId:a.id});b.extraTurnGrants.add(a.id);b.extraPhaseRequired=true;seek(1,'extra');step();
 for(const r of [2,6]){seek(r);assert.ok(a.statuses.some(s=>s.id==='anabel_command'));assert.equal(abilityAvailability(b,a,c.abilities['anabel.judgment']).ok,true);executeAction(b,{actorId:a.id,abilityId:'anabel.judgment',targetId:t.id});assert.equal(hits(b,a).filter(e=>e.abilityId==='anabel.judgment').length,2);assert.equal(hits(b,a)[0].amount,hits(b,a)[1].amount);}
 assert.ok(a.statuses.some(s=>s.id==='anabel_command'));seek(7);step();assert.ok(!a.statuses.some(s=>s.id==='anabel_command'));
});
test('Siesta three-step automatic chain ignores downstream CDs through natural turn progression and Extra shares limits',()=>{
 const {b,c}=setup(['siesta','iris','garrek','elaine']),a=b.actors.find(x=>x.id==='siesta'),t=b.actors.find(x=>x.team==='enemy');a.passive=structuredClone(c.characters.siesta.passive);a.resourceValues.ferocity=3;a.cooldowns['siesta.howl']=7;a.cooldowns['siesta.ravage']=8;
 const previous=b.actors.find(x=>x.id==='iris');b.queue=[previous.id,a.id,t.id];b.cursor=0;executeAction(b,{actorId:previous.id,abilityId:'$defend',targetId:previous.id});assert.equal(activeActor(b).id,a.id);
 executeAction(b,{actorId:a.id,abilityId:'siesta.rend',targetId:t.id});assert.deepEqual(b.events.filter(e=>e.type==='reaction'&&e.sourceId===a.id).map(e=>e.abilityId),['siesta.howl','siesta.ravage','siesta.ravage']);assert.equal(a.cooldowns['siesta.howl'],7);assert.equal(a.cooldowns['siesta.ravage'],8);assert.equal(a.resourceValues.ferocity,0);assert.equal(a.mp,9990);
});
