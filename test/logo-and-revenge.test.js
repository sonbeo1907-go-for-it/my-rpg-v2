import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent}from'../scripts/load-content.mjs';import{createGameSave}from'../src/core/game-save.js';
import{createBattle,executeAction,getActor}from'../src/core/battle.js';import{battleStat}from'../src/core/stat-values.js';
import{validateContent}from'../src/core/content.js';import{normalizeSettings,readSettings}from'../src/ui/preferences.js';
import{passivePresentation}from'../src/ui/skill-copy.js';
const content=await loadContent();
function setup(){const c=createGameSave(content);c.claimedFirstClearRewards=['iris_story_growth','iris_story_pride'];return createBattle(content,c,'iris_story_revenge',()=>.99);}
function use(b,id,skill,target=id){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:skill,targetId:target});}
test('logo preference defaults old settings to EN, accepts JP and never imports campaign data',()=>{
 assert.equal(normalizeSettings({musicVolume:.6}).logoStyle,'en');assert.equal(normalizeSettings({logoStyle:'jp'}).logoStyle,'jp');assert.equal(normalizeSettings({logoStyle:'unknown'}).logoStyle,'en');const parsed=readSettings({getItem:()=>JSON.stringify({logoStyle:'jp',coins:999})});assert.equal(parsed.logoStyle,'jp');assert.equal(parsed.coins,undefined);
});
test('Keith now deals two real physical hits with 20 percent penetration against high DEF',()=>{
 const b=setup(),arthur=getActor(b,'arthur'),keith=getActor(b,'enemy_0');arthur.stats.defense=40;const mp=keith.mp;use(b,keith.id,'traveler.keith','arthur');const hits=b.events.filter(e=>e.type==='damage');assert.equal(hits.length,2);const expected=Math.floor(keith.stats.attack*.7-40*.8*.55);assert.deepEqual(hits.map(e=>e.amount),[expected,expected]);assert.equal(keith.mp,mp-7);assert.ok(hits.reduce((sum,e)=>sum+e.amount,0)>2*Math.max(1,Math.floor(keith.stats.attack*.7-40*.55)));
});
test('Mac reduces physical and magical damage only while his required taunt is active',()=>{
 for(const magical of [false,true])for(const taunt of [false,true]){const b=setup(),arthur=getActor(b,'arthur'),mac=getActor(b,'enemy_1');arthur.stats.attack=arthur.stats.magic=100;if(magical)arthur.basicDamageType='magical';if(taunt)mac.statuses.push({id:'taunt',remaining:2,sourceId:mac.id,stacks:1});const guard=magical?mac.stats.resistance:mac.stats.defense;use(b,'arthur','$attack',mac.id);assert.equal(b.events.find(e=>e.type==='damage').amount,Math.floor((100-guard*.55)*(taunt ? .7 : 1)));}
 const mac=getActor(setup(),'enemy_1');assert.ok(passivePresentation(mac,content).facts.some(f=>f.includes('30%')&&f.includes('Khiêu khích')));
});
test('Mac DEF and Amy RES buffs reach all their allies, combine by existing stat rules, and never buff the player',()=>{
 const b=setup(),team=b.actors.filter(a=>a.team==='enemy');use(b,'enemy_1','traveler.mac_defense');use(b,'enemy_3','traveler.amy_ward');for(const ally of team){assert.ok(Math.abs(battleStat(content,ally,'defense')-ally.stats.defense*1.4)<1e-8);assert.ok(Math.abs(battleStat(content,ally,'resistance')-ally.stats.resistance*1.3)<1e-8);}assert.ok(b.actors.filter(a=>a.team==='party').every(a=>!a.statuses.some(s=>['traveler_mac_defense','traveler_ward'].includes(s.id))));
 getActor(b,'enemy_1').cooldowns['traveler.mac_defense']=0;use(b,'enemy_1','traveler.mac_defense');assert.equal(getActor(b,'enemy_0').statuses.filter(s=>s.id==='traveler_mac_defense').length,1);
});
test('conditional reduction validation rejects missing status references and invalid magnitudes',()=>{
 for(const mutate of [c=>c.enemies.traveler_mac.passive.requiresStatus='missing',c=>c.enemies.traveler_mac.passive.amount=1.1,c=>c.enemies.traveler_mac.passive.amount=-.3]){const c=structuredClone(content);mutate(c);assert.ok(validateContent(c).some(e=>e.includes('conditional damage reduction')));}
});
