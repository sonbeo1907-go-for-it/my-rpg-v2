import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,forecastBattleAction} from '../src/core/battle.js';
import {resolveCharacter} from '../src/core/progression.js';
import {assertValidEquipment} from '../src/core/equipment.js';
import {gearRecipeUnlocked} from '../src/core/gear-rules.js';
import {validateContent} from '../src/core/content.js';
import {skillPresentation} from '../src/ui/skill-copy.js';
const c=await loadContent();
function fixture(){const content=structuredClone(c),s=createGameSave(content);s.party=['arthur','iris','garrek','elaine'];s.partyPresets[0].slots=[...s.party];const b=createBattle(content,s,'forest_patrol',()=>.5);for(const a of b.actors){a.hp=a.stats.maxHp=10000;a.mp=50;a.stats.maxMp=100;a.stats.magic=a.stats.attack=100;a.statuses=[];a.gearEffects=[];a.weaknesses=[];a.stats.defense=a.stats.resistance=0;}return {b,a:b.actors.find(x=>x.id==='arthur'),e:b.actors.find(x=>x.team==='enemy'),allies:b.actors.filter(x=>x.team==='party')};}
const attach=(a,id)=>a.gearEffects.push(structuredClone(c.gearEffects[id]));
function cast(b,a,id,target=a.id){b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:target});}
function skill(b,a,id,effects,cost=0,target='enemy'){b.content.abilities[id]={id,name:'Kiểm thử',target,cost:{mp:cost},effects};a.abilities.push(id);return id;}
const damage=b=>b.events.filter(x=>x.type==='damage').map(x=>x.amount);
test('four recipes craft-ready, stat bonuses and duplicate prevention survive save',()=>{
 assert.deepEqual(validateContent(c),[]);const s=createGameSave(c);const cases=[['mana_overdrive','maxMp',1.1],['aegis_weave','speed',1.15],['vitality_chalice','maxHp',1.15],['shared_respite','maxMp',1.1]];
 for(const [id,key,factor] of cases){assert.ok(gearRecipeUnlocked(s,c.gearEffects[id]));const copy=structuredClone(s);copy.craftedGearSerial=2;copy.gear.push({id:'rune_1',typeId:'t4_effect',effectId:id,stats:{}});copy.equipment.arthur=['rune_1'];const a=resolveCharacter(c,copy,'arthur');assert.ok(Math.abs(a.stats[key]-c.characters.arthur.stats[key]*factor)<1e-8);copy.gear.push({id:'rune_2',typeId:'t4_effect',effectId:id,stats:{}});copy.equipment.arthur.push('rune_2');assert.throws(()=>assertValidEquipment(copy,c));copy.equipment.arthur.pop();assert.equal(decodeGameSave(encodeGameSave(copy,c),c).gear.length,2);}
});
test('paid MP damage counts full five-MP steps, every hit and AoE once, not refunds or duplicate items',()=>{
 for(const cost of [0,4,5,14,15,24,25,26,50]){const base=fixture(),geared=fixture();for(const f of [base,geared])f.a.mp=100;for(const f of [base,geared])skill(f.b,f.a,'test.blast',[{type:'damage',damageType:'magical',element:'plain',multiplier:1,hits:2},{type:'resource',to:'self',resource:'mp',amount:20}],cost,'all_enemies');attach(geared.a,'mana_overdrive');attach(geared.a,'mana_overdrive');cast(base.b,base.a,'test.blast',base.e.id);cast(geared.b,geared.a,'test.blast',geared.e.id);assert.equal(damage(geared.b).length,6);for(let i=0;i<6;i++)assert.ok(Math.abs(damage(geared.b)[i]-damage(base.b)[i]*(1+Math.min(.3,Math.floor(cost/5)*.06)))<=1);}
});
test('shield/heal gear increases active skill output before reception cuts; previews agree',()=>{
 const {b,a,allies}=fixture();attach(a,'aegis_weave');attach(a,'vitality_chalice');
 const shield=skill(b,a,'test.shield',[{type:'shield',scalingStat:'magic',multiplier:1}],0,'all_allies');cast(b,a,shield);for(const x of allies)assert.equal(x.shield,130);assert.match(skillPresentation(b.content.abilities[shield],a,b.content).facts.join(' '),/130/);
 const heal=skill(b,a,'test.heal',[{type:'heal',scalingStat:'magic',multiplier:1}],0,'all_allies');for(const x of allies)x.hp=100;cast(b,a,heal);for(const x of allies)assert.equal(x.hp,218);assert.match(skillPresentation(b.content.abilities[heal],a,b.content).facts.join(' '),/118/);
});
test('defend shares actual capped recovery including incense, excludes wearer and honors team/round limiter',()=>{
 const {b,a,allies}=fixture();for(const x of allies){attach(x,'shared_respite');x.mp=0;}attach(a,'calming_incense');a.mp=97;cast(b,a,'$defend');assert.equal(a.mp,100);for(const x of allies.filter(x=>x!==a))assert.equal(x.mp,3);
 const second=allies[1];cast(b,second,'$defend');assert.equal(second.mp,8);assert.equal(allies[2].mp,3);assert.equal(a.mp,100);
 b.round++;a.mp=0;for(const x of allies.filter(x=>x!==a))x.mp=0;cast(b,a,'$defend');assert.equal(a.mp,9);for(const x of allies.filter(x=>x!==a))assert.equal(x.mp,9);
});
test('full MP wearer does not share, forecast does not reserve live quota, and enemy team has separate quota',()=>{
 const {b,a,e,allies}=fixture();attach(a,'shared_respite');a.mp=100;for(const x of allies.filter(x=>x!==a))x.mp=0;cast(b,a,'$defend');assert.equal(allies[1].mp,0);
 a.mp=0;b.queue=[a.id,e.id];b.cursor=0;const f=forecastBattleAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});assert.equal(f.actors.find(x=>x.id===allies[1].id).mp,5);assert.equal(b.gearTeamProcRounds,undefined);cast(b,a,'$defend');assert.equal(allies[1].mp,5);
 for(const x of b.actors.filter(x=>x.team==='enemy'))x.mp=0;attach(e,'shared_respite');cast(b,e,'$defend');assert.ok(b.actors.filter(x=>x.team==='enemy').every(x=>x.mp===5));
});
