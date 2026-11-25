import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,forecastBattleAction} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {criticalChance,resolveCritical,criticalMultiplier} from '../src/core/critical.js';
import {damageFlags} from '../src/core/damage-kind.js';
import {combatTimeline} from '../src/ui/combat-timeline.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
import {seededRandom} from '../src/core/random.js';
const c=await loadContent();
function setup(){const content=structuredClone(c),s=createGameSave(content),b=createBattle(content,s,'forest_patrol',seededRandom(4242));for(const a of b.actors){a.passive=null;a.hp=a.stats.maxHp=1000000;a.mp=1000;a.stats.attack=a.stats.magic=150;a.stats.defense=a.stats.resistance=0;a.baseStats={...a.stats};a.statuses=[];a.weaknesses=[];a.resistances={};a.gearEffects=[];a.cooldowns={};}return {b,a:b.actors.find(a=>a.team==='party'),t:b.actors.find(a=>a.team==='enemy')};}
const attach=(a,id)=>a.gearEffects.push(structuredClone(c.gearEffects[id]));
const hit=(extra={})=>({type:'damage',damageType:'physical',element:'plain',scalingStat:'attack',multiplier:1,...extra});
function skill(b,a,effects,target='enemy'){const id='test.critical';b.content.abilities[id]={id,name:'Thử Bạo Kích',cost:{mp:0},target,effects};a.abilities.push(id);return id;}
function cast(b,a,id,t){b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:t.id});}
test('Moon alone defines effect damage; all other damage is normal despite stale type annotations',()=>{
 for(const packet of [hit(),hit({element:'sword_soul'}),hit({normalDamage:false,effectDamage:true}),hit({damageFlags:{futureDamage:true}})])assert.deepEqual([damageFlags(packet).normalDamage,damageFlags(packet).effectDamage],[true,false]);
 for(const packet of [hit({element:'moon'}),hit({additionalElements:['moon'],normalDamage:true,effectDamage:false})])assert.deepEqual([damageFlags(packet).normalDamage,damageFlags(packet).effectDamage],[false,true]);
});
test('critical chance follows base ATK or MAG linearly, caps at 100%, ignores percentage buffs and never stacks chance or damage',()=>{
 const {b,a}=setup();attach(a,'martial_insight');a.baseStats.attack=75;a.statuses=[{id:'anabel_command',stacks:1,remaining:6}];assert.equal(criticalChance(a),.5);
 attach(a,'arcane_insight');a.baseStats.magic=120;assert.equal(criticalChance(a),.8);assert.equal(resolveCritical({...b,random:()=>.79},a,hit(),{}).multiplier,1.5);assert.equal(resolveCritical({...b,random:()=>.8},a,hit(),{}).critical,false);
 a.baseStats.magic=500;attach(a,'arcane_insight');assert.equal(criticalChance(a),1);assert.equal(criticalMultiplier(b,a,hit(),{}),1.5);
});
test('critical is after DEF/RES and skill damage amp, with a resolved event and combat log label',()=>{
 const {b,a,t}=setup();attach(a,'martial_insight');t.stats.defense=t.baseStats.defense=100;
 b.content.statuses.critical_amp={id:'critical_amp',name:'Thử',kind:'buff',persistent:true,damageUses:1,modifiers:{damageBonus:.3}};a.statuses=[{id:'critical_amp',remaining:null,stacks:1,charges:1}];const id=skill(b,a,[hit()]);cast(b,a,id,t);const e=b.events.find(e=>e.type==='damage');
 assert.equal(e.amount,184);assert.equal(e.critical,true);assert.equal(e.criticalMultiplier,1.5);assert.equal(e.normalDamage,true);assert.ok(b.log.some(s=>s.includes('Bạo Kích')));
});
test('one roll covers all normal multi-hit AoE targets; Moon packets never inherit a critical result',()=>{
 const {b,a,t}=setup();attach(a,'martial_insight');a.baseStats.attack=75;let rolls=0;b.random=()=>{rolls++;return 0;};const id=skill(b,a,[hit({hits:2}),hit({additionalElements:['moon']})],'all_enemies');cast(b,a,id,t);
 const hits=b.events.filter(e=>e.type==='damage');assert.equal(hits.length,9);assert.ok(hits.filter(e=>e.normalDamage).every(e=>e.critical&&e.amount===112));assert.ok(hits.filter(e=>e.effectDamage).every(e=>!e.critical&&e.amount===75));assert.equal(rolls,1);
});
test('Moon skips critical RNG; normal reactions and magic can use either chance source',()=>{
 const {b,a}=setup();attach(a,'arcane_insight');a.baseStats.magic=75;let rolls=0;const probe={...b,random:()=>{rolls++;return 0;}},ctx={};assert.equal(resolveCritical(probe,a,hit({additionalElements:['moon']}),ctx).critical,false);assert.equal(rolls,0);assert.equal(ctx.criticalChecks,undefined);
 assert.equal(resolveCritical(probe,a,hit({damageType:'magical'}),{}).critical,true);assert.equal(resolveCritical(probe,a,hit(),{reaction:true}).critical,true);assert.equal(rolls,2);
});
test('shield-only critical impacts retain the label and timeline metadata; no fake HP damage is added',()=>{
 const {b,a,t}=setup();attach(a,'martial_insight');t.shield=1000;const id=skill(b,a,[hit()]);cast(b,a,id,t);const e=b.events.find(e=>e.type==='damage');assert.equal(e.amount,0);assert.equal(e.absorbed,225);assert.equal(e.critical,true);
 for(const reduced of [false,true]){const frames=combatTimeline(b.events,b.content,{reduced}).frames;assert.ok(frames.some(f=>f.kind==='block'&&f.critical));}
});
test('forecast and rejected actions cannot consume live critical RNG',()=>{
 const {b,a,t}=setup();attach(a,'martial_insight');a.baseStats.attack=75;const id=skill(b,a,[hit()]);b.queue=[a.id,t.id];b.cursor=0;const state=b.random.getState(),hp=t.hp;const f=forecastBattleAction(b,{actorId:a.id,abilityId:id,targetId:t.id});assert.equal(b.random.getState(),state);assert.equal(t.hp,hp);assert.ok(f.events.some(e=>e.normalDamage));
 b.content.abilities[id].cost.mp=9999;a.mp=0;assert.throws(()=>executeAction(b,{actorId:a.id,abilityId:id,targetId:t.id}));assert.equal(b.random.getState(),state);
});
test('critical applies before PvP soft cap on either side',()=>{
 for(const team of ['party','enemy']){const b=createArenaBattle(c,createGameSave(c),'mirror',999);for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.passive=null;a.statuses=[];a.stats.defense=a.stats.resistance=0;a.baseStats={...a.stats,attack:150,defense:0,resistance:0};a.weaknesses=[];a.resistances={};}const a=b.actors.find(a=>a.team===team),t=b.actors.find(a=>a.team!==team);attach(a,'martial_insight');cast(b,a,'$attack',t);const e=b.events.find(e=>e.type==='damage'&&e.sourceId===a.id);assert.equal(e.critical,true);assert.equal(e.pvpDamage.before,225);assert.ok(e.amount<225);}
});
test('existing insight gear saves still load by stable effect IDs; concise descriptions contain no engine keys',()=>{
 const s=createGameSave(c);s.craftedGearSerial=2;s.gear.push({id:'rune_1',typeId:'t4_effect',effectId:'martial_insight',stats:{}},{id:'rune_2',typeId:'t4_effect',effectId:'arcane_insight',stats:{}});assert.equal(decodeGameSave(encodeGameSave(s,c),c).gear.length,2);
 for(const id of ['martial_insight','arcane_insight']){const r=c.gearEffects[id];assert.equal(r.effect.type,'critical_chance');assert.ok(r.description.includes('Bạo Kích'));assert.ok(r.description.length<130);assert.doesNotMatch(r.description,/normalDamage|effectDamage|snapshot|proc|xác suất.*hành động/i);}
});

test('legacy gear definitions in an in-progress chronicle resume with the new critical layer',()=>{
 const {b,a,t}=setup();attach(a,'martial_insight');a.mp=20;a.gearEffects[0].effect.type='normal_damage_chance';
 const id=skill(b,a,[hit()]),restored=restoreChronicleBattle(b.content,snapshotChronicleBattle(b)),ra=restored.actors.find(x=>x.id===a.id),rt=restored.actors.find(x=>x.id===t.id);
 const hp=rt.hp,mp=ra.mp;cast(restored,ra,id,rt);const e=restored.events.find(e=>e.type==='damage');assert.equal(e.critical,true);assert.equal(e.amount,225);assert.equal(rt.hp,hp-225);assert.equal(ra.mp,mp);
});
