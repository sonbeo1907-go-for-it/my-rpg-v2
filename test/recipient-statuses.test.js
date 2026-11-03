import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,basicAbility,abilityAvailability} from '../src/core/battle.js';
import {mpCost} from '../src/core/conditional-combat.js';
import {receivedSupport} from '../src/core/status-policies.js';
import {skillPresentation} from '../src/ui/skill-copy.js';
import {statusDetails} from '../src/ui/combat-presentation.js';
import {sweepDungeon} from '../src/core/dungeon.js';
const content=await loadContent();
function setup(){const c=structuredClone(content),b=createBattle(c,createGameSave(c),'forest_patrol',()=>.99);for(const a of b.actors){a.passive=null;a.hp=a.stats.maxHp=10000;a.mp=a.stats.maxMp=1000;a.statuses=[];a.cooldowns={};}return {b,c,a:b.actors.find(a=>a.team==='party'),t:b.actors.find(a=>a.team==='enemy')};}
function cast(b,a,t,effects,cost={mp:0}){const id='test.status';b.content.abilities[id]={id,name:'Kiểm tra',target:a.team===t.team?'ally':'enemy',effects,cost};if(!a.abilities.includes(id))a.abilities.push(id);b.queue=[a.id,b.actors.find(x=>x.id!==a.id).id];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:t.id});}
const status=(id)=>({type:'status',status:id,...(id==='elder_resolve'?{duration:3}:{})});
const has=(a,id)=>a.statuses.find(s=>s.id===id);
test('Seal blocks one fresh buff, preserves old buffs, refreshes and respects Ward in both directions',()=>{
 const {b,a,t}=setup();cast(b,t,a,[status('effect_ward')]);cast(b,t,a,[status('buff_seal')]);assert.equal(has(a,'buff_seal'),undefined);assert.equal(has(a,'effect_ward'),undefined);
 cast(b,t,a,[status('buff_seal')]);cast(b,t,a,[status('buff_seal')]);assert.equal(has(a,'buff_seal').charges,1);
 cast(b,a,a,[status('effect_ward'),status('elder_resolve')]);assert.equal(has(a,'buff_seal'),undefined);assert.equal(has(a,'effect_ward'),undefined);assert.ok(has(a,'elder_resolve'));
 cast(b,t,a,[status('buff_seal')]);cast(b,a,a,[status('effect_ward')]);assert.ok(has(a,'elder_resolve'));assert.equal(has(a,'effect_ward'),undefined);
});
test('Wound reduces direct/regen/lifesteal recovery and strongest source wins, never affects MP',()=>{
 const {b,c,a,t}=setup();cast(b,t,a,[status('deep_wound')]);assert.equal(has(a,'deep_wound').remaining,2);a.hp=100;cast(b,a,a,[{type:'heal',flat:100}]);assert.equal(a.hp,160);assert.equal(has(a,'deep_wound').remaining,1);
 c.statuses.test_wound={kind:'debuff',healingReceivedReduction:.2};a.statuses.push({id:'test_wound',remaining:2});assert.equal(receivedSupport(c,a,100,'healingReceivedReduction'),60);
 a.mp=50;cast(b,a,a,[{type:'resource',resource:'mp',amount:10}]);assert.equal(a.mp,60);assert.equal(has(a,'deep_wound'),undefined);
});
test('Wound and fracture expire only on main turns; fracture never shrinks existing shields',()=>{
 const {b,a,t}=setup();a.shield=90;cast(b,t,a,[status('shield_fracture'),status('deep_wound')]);assert.equal(a.shield,90);
 b.phase='extra';cast(b,a,a,[{type:'shield',flat:100}]);assert.equal(a.shield,90);assert.equal(has(a,'shield_fracture').remaining,2);assert.equal(has(a,'deep_wound').remaining,2);
 cast(b,a,a,[{type:'shield',flat:200}]);assert.equal(a.shield,130);b.phase='main';cast(b,a,a,[]);assert.equal(has(a,'shield_fracture').remaining,1);cast(b,a,a,[]);assert.equal(has(a,'shield_fracture'),undefined);
});
test('Mana disruption is previewed, rounds after discounts and consumes only on successful paid cast',()=>{
 const {b,a,t}=setup();cast(b,t,a,[status('mana_disruption')]);cast(b,t,a,[status('mana_disruption')]);assert.equal(has(a,'mana_disruption').charges,1);
 const skill={id:'test.paid',name:'Paid',target:'enemy',cost:{mp:5},effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:1,scaling:'attack'}]};b.content.abilities[skill.id]=skill;a.abilities.push(skill.id);assert.equal(mpCost(skill,a),8);assert.equal(mpCost(basicAbility(a),a),0);
 a.mp=7;assert.equal(abilityAvailability(b,a,skill).ok,false);b.queue=[a.id,t.id];b.cursor=0;assert.throws(()=>executeAction(b,{actorId:a.id,abilityId:skill.id,targetId:t.id}));assert.equal(has(a,'mana_disruption').charges,1);a.mp=50;assert.throws(()=>executeAction(b,{actorId:a.id,abilityId:skill.id,targetId:'missing'}));assert.equal(a.mp,50);
 cast(b,a,a,[]);assert.ok(has(a,'mana_disruption'));cast(b,a,t,[],{mp:5});assert.equal(a.mp,42);assert.equal(has(a,'mana_disruption'),undefined);
 const actor={statuses:[{id:'x',remaining:null,charges:1,mpCostIncrease:.5}],combatModes:{mode:{mpCostReduction:.12,discountAbilityIds:['s']}},activeMode:'mode'};assert.equal(mpCost({id:'s',cost:{mp:6}},actor),9);
});
test('support statuses have concise inspection, default duration and remaining-charge feedback',()=>{
 const {b,a,t}=setup();for(const id of ['buff_seal','mana_disruption','deep_wound','shield_fracture']){cast(b,t,a,[status(id)]);const p=skillPresentation({target:'enemy',effects:[status(id)]},t,b.content,{});assert.ok(p.facts.length);assert.ok(!JSON.stringify(p).includes('NaN'));const d=statusDetails(has(a,id),a,b,b.content);assert.match(d.duration,id==='buff_seal'||id==='mana_disruption'?/1 lần/:/2 lượt chính/);}
});
test('sweep receipt holds actual XP and rewards and is never emitted for rejected transactions',()=>{
 const save=createGameSave(content);save.sweepTickets=1;save.dungeonClearedDifficulties.training_grounds=['easy'];let receipt;
 const next=sweepDungeon(save,content,'training_grounds','easy',()=>{},new Date(),{onResult:r=>receipt=r});assert.equal(next.sweepTickets,0);assert.equal(save.sweepTickets,1);assert.equal(receipt.sweep,true);assert.equal(receipt.rewardClaimed,true);assert.equal(receipt.xpAwards.length,4);assert.equal(receipt.xpAwards[0].accepted,content.dungeons.training_grounds.difficulties[0].reward.characterXp);
 let emitted=false;assert.throws(()=>sweepDungeon(save,content,'training_grounds','easy',()=>{throw Error('disk');},new Date(),{onResult:()=>emitted=true}),/disk/);assert.equal(emitted,false);
});

test('lifesteal passes through the same wound reduction after direct damage',()=>{
 const {b,a,t}=setup();a.hp=100;cast(b,t,a,[status('deep_wound')]);const before=a.hp;
 cast(b,a,t,[{type:'damage',damageType:'physical',element:'plain',stat:'attack',multiplier:4,lifeStealRatio:1}]);
 const hit=b.events.find(e=>e.type==='damage'&&e.sourceId===a.id);assert.ok(hit.amount>0);assert.equal(a.hp-before,Math.round(hit.amount*.6));
});
test('seals do not block transformation or shared resources and cleanse removes all four debuffs',()=>{
 const {b,a,t}=setup();a.combatModes={test:{name:'Test Mode',duration:3,modifiers:{attack:.2}}};cast(b,t,a,[status('buff_seal')]);cast(b,a,a,[{type:'enter_mode',mode:'test'}]);assert.equal(a.activeMode,'test');assert.equal(has(a,'buff_seal').charges,1);
 for(const id of ['mana_disruption','deep_wound','shield_fracture'])cast(b,t,a,[status(id)]);
 cast(b,a,a,[{type:'cleanse',all:true}]);assert.equal(a.statuses.filter(s=>['buff_seal','mana_disruption','deep_wound','shield_fracture'].includes(s.id)).length,0);
});
