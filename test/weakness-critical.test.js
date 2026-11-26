import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,forecastBattleAction} from '../src/core/battle.js';
import {criticalChance,resolveCritical} from '../src/core/critical.js';
import {createArenaBattle} from '../src/core/arena.js';
import {seededRandom} from '../src/core/random.js';
const content=await loadContent();
const effect=(extra={})=>({type:'damage',damageType:'physical',element:'plain',scalingStat:'attack',multiplier:1,...extra});
function fixture(){const c=structuredClone(content),b=createBattle(c,createGameSave(c),'forest_patrol',seededRandom(18));for(const a of b.actors){a.passive=null;a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=1000;a.stats.attack=a.stats.magic=150;a.stats.defense=a.stats.resistance=0;a.baseStats={...a.stats};a.weaknesses=[];a.damageTypeWeaknesses=[];a.resistances={};a.statuses=[];a.gearEffects=[];a.cooldowns={};}return {b,a:b.actors.find(a=>a.team==='party'),enemies:b.actors.filter(a=>a.team==='enemy')};}
function cast(b,a,effects,target='all_enemies'){const id='test.weakness_crit';b.content.abilities[id]={id,name:'Thử điểm yếu',cost:{mp:0},target,effects};a.abilities.push(id);b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:b.actors.find(x=>x.team!==a.team).id});return b.events.filter(e=>e.type==='damage'&&e.sourceId===a.id);}
const attach=(a,id)=>a.gearEffects.push(structuredClone(content.gearEffects[id]));

test('weakness grants 15 percentage points without gear and adds only to the strongest gear chance',()=>{
 const {a}=fixture();assert.equal(criticalChance(a),0);assert.equal(criticalChance(a,true),.15);attach(a,'martial_insight');a.baseStats.attack=100;assert.equal(criticalChance(a,true),100/150+.15);
 attach(a,'arcane_insight');a.baseStats.magic=120;assert.equal(criticalChance(a,true),.8+.15);a.baseStats.magic=127.5;assert.equal(criticalChance(a,true),1);a.baseStats.magic=150;assert.equal(criticalChance(a),1);
});
test('a single cached roll yields different outcomes for weak and nonweak targets in either order',()=>{
 for(const order of [[false,true],[true,false]]){const {b,a}=fixture();attach(a,'martial_insight');a.baseStats.attack=100;let rolls=0;b.random=()=>{rolls++;return .8;};const ctx={};const outcomes=order.map(weak=>resolveCritical(b,a,effect(),ctx,weak).critical);assert.deepEqual(outcomes,order);assert.equal(rolls,1);assert.equal(ctx.criticalRolls.get(a.id),.8);}
});
test('no-gear thresholds and guaranteed/zero chances do not consume or poison the shared roll',()=>{
 const {b,a}=fixture();let rolls=0;b.random=()=>{rolls++;return .15;};const ctx={};assert.equal(resolveCritical(b,a,effect(),ctx).critical,false);assert.equal(rolls,0);assert.equal(resolveCritical(b,a,effect(),ctx,true).critical,false);assert.equal(rolls,1);
 b.random=()=>.149;assert.equal(resolveCritical(b,a,effect(),{},true).critical,true);
 attach(a,'martial_insight');a.baseStats.attack=127.5;const fresh={};rolls=0;b.random=()=>{rolls++;return .9;};assert.equal(resolveCritical(b,a,effect(),fresh,true).critical,true);assert.equal(rolls,0);assert.equal(resolveCritical(b,a,effect(),fresh,false).critical,false);assert.equal(rolls,1);
});
test('actual multi-hit AoE tests each target weakness while sharing its one roll; Moon remains excluded',()=>{
 const {b,a,enemies}=fixture();attach(a,'martial_insight');a.baseStats.attack=100;enemies[0].weaknesses=['plain'];let rolls=0;b.random=()=>{rolls++;return .8;};const hits=cast(b,a,[effect({hits:2}),effect({additionalElements:['moon']})]);assert.equal(hits.length,9);
 const normal=hits.filter(h=>h.normalDamage);assert.ok(normal.filter(h=>h.targetId===enemies[0].id).every(h=>h.critical&&h.weakness&&h.amount===225));assert.ok(normal.filter(h=>h.targetId!==enemies[0].id).every(h=>!h.critical&&!h.weakness&&h.amount===100));assert.ok(hits.filter(h=>h.effectDamage).every(h=>!h.critical));assert.equal(rolls,1);
});
test('natural and physical weaknesses count once; weakness exploitation changes damage, not the 15 percent rate',()=>{
 for(const exploit of [false,true]){const {b,a,enemies}=fixture();enemies[0].weaknesses=['plain'];enemies[0].damageTypeWeaknesses=['physical'];if(exploit)a.statuses.push({id:'weakness_exploitation',remaining:3,stacks:1});b.random=()=>.16;const hits=cast(b,a,[effect()],'enemy');assert.equal(hits[0].weakness,true);assert.equal(hits[0].critical,undefined);assert.equal(hits[0].weaknessMultiplier,exploit?2:1.5);}
});
test('exposure supplies weakness crit for the whole multi-hit skill and consumes only one charge',()=>{
 const {b,a,enemies}=fixture();enemies[0].statuses=[{id:'exposure_fire',stacks:2,remaining:null,sourceId:a.id}];let rolls=0;b.random=()=>{rolls++;return .1;};const hits=cast(b,a,[effect({element:'fire',hits:3})],'enemy');assert.equal(hits.length,3);assert.ok(hits.every(h=>h.critical&&h.weakness));assert.equal(enemies[0].statuses.find(s=>s.id==='exposure_fire').stacks,1);assert.equal(rolls,1);
});
test('no-gear Moon attacks cannot gain weakness crit or spend critical RNG',()=>{
 const {b,a,enemies}=fixture();enemies[0].weaknesses=['moon'];let rolls=0;b.random=()=>{rolls++;return 0;};const hits=cast(b,a,[effect({additionalElements:['moon']})],'enemy');assert.equal(hits[0].weakness,true);assert.equal(hits[0].effectDamage,true);assert.equal(hits[0].critical,undefined);assert.equal(rolls,0);
});
test('forecast does not consume live RNG for natural no-gear crit; illegal casts remain rejected before RNG',()=>{
 const {b,a,enemies}=fixture();enemies[0].weaknesses=['plain'];const id='test.forecast_critical';b.content.abilities[id]={id,name:'Thử',cost:{mp:0},target:'enemy',effects:[effect()]};a.abilities.push(id);b.queue=[a.id,enemies[0].id];b.cursor=0;const state=b.random.getState();forecastBattleAction(b,{actorId:a.id,abilityId:id,targetId:enemies[0].id});assert.equal(b.random.getState(),state);b.content.abilities[id].cost.mp=9999;assert.throws(()=>executeAction(b,{actorId:a.id,abilityId:id,targetId:enemies[0].id}));assert.equal(b.random.getState(),state);
});
test('weakness crit works without gear on both PvP teams and enters soft caps after the critical layer',()=>{
 for(const team of ['party','enemy']){const b=createArenaBattle(content,createGameSave(content),'mirror',17);for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.passive=null;a.statuses=[];a.gearEffects=[];a.stats.defense=a.stats.resistance=0;a.stats.attack=150;a.baseStats={...a.stats};a.weaknesses=['plain','light'];a.damageTypeWeaknesses=[];a.resistances={};}const a=b.actors.find(a=>a.team===team),t=b.actors.find(a=>a.team!==team);b.random=()=>.1;b.queue=[a.id,t.id];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:'$attack',targetId:t.id});const h=b.events.find(e=>e.type==='damage'&&e.sourceId===a.id);assert.equal(h.critical,true);assert.equal(h.pvpDamage.before,337);}
});
