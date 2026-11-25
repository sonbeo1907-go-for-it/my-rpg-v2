import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,forecastBattleAction} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {damageFlags,copyDamageFlags,isOnlyNormalDamage} from '../src/core/damage-kind.js';
const c=await loadContent();
const variants=[{normalDamage:true},{effectDamage:true},{normalDamage:true,effectDamage:true},{damageFlags:{normalDamage:true,futureRune:true}},{additionalElements:['moon']}];
function account(content=c){const s=createGameSave(content);s.party=['garrek','iris','armie','elaine'];s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...s.party])];return s;}
function setup(recipe,extra={}){const content=structuredClone(c),s=account(content),b=createBattle(content,s,'forest_patrol',()=>.99);prepare(b);const a=b.actors.find(x=>x.id==='garrek');a.gearEffects=[structuredClone(c.gearEffects[recipe]),structuredClone(c.gearEffects.martial_insight)];const id='test.echoFlags';b.content.abilities[id]={id,name:'Thử dấu đòn',target:'enemy',cost:{mp:0},effects:[packet(extra)]};a.abilities.push(id);return {b,a,id,t:b.actors.find(x=>x.team==='enemy')};}
function prepare(b){for(const a of b.actors){a.hp=a.stats.maxHp=1000000;a.mp=a.stats.maxMp=10000;a.stats.attack=a.stats.magic=150;a.stats.defense=a.stats.resistance=0;a.baseStats={...a.stats};a.passive=null;a.statuses=a.team==='enemy'?['deep_wound','gear_defense_crack'].map(id=>({id,remaining:10,stacks:1})):[];a.weaknesses=[];a.resistances={};a.gearEffects=[];a.cooldowns={};}}
const packet=extra=>({type:'damage',damageType:'physical',element:'plain',scalingStat:'attack',multiplier:1,...extra});
function use(b,a,id,t){b.queue=[a.id,...b.actors.filter(x=>x!==a&&x.hp>0).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:t.id});}
const damage=(b,a)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===a.id);
test('copied flag namespace is independent, preserves arbitrary future flags and conflicting flags',()=>{
 const original={normalDamage:true,effectDamage:true,damageFlags:{futureRune:true}};const copy=copyDamageFlags(original);assert.deepEqual(damageFlags(copy),damageFlags(original));copy.damageFlags.futureRune=false;assert.equal(original.damageFlags.futureRune,true);
});
for(const recipe of ['echoing_edge','affliction_prism'])test(`${recipe}: follow-up retains normal/effect/future/Moon flags and cannot wash special damage into insight proc`,()=>{
 for(const flags of variants){const {b,a,id,t}=setup(recipe,flags);use(b,a,id,t);const root=damage(b,a).find(e=>!e.reaction),echoes=damage(b,a).filter(e=>e.abilityId==='$gear.'+recipe);assert.ok(root);assert.equal(echoes.length,recipe==='echoing_edge'?2:1);
  for(const e of echoes){assert.deepEqual(e.damageFlags,root.damageFlags);assert.equal(e.effectDamage,root.effectDamage);assert.equal(e.normalDamage,root.normalDamage);assert.equal(e.element,root.element);assert.deepEqual(e.elements,root.elements);assert.equal(e.damageType,root.damageType);assert.equal(e.amount,recipe==='echoing_edge'?(isOnlyNormalDamage(root)?45:30):(isOnlyNormalDamage(root)?202:135));}
 }
});
test('mixed two-hit packets copy their own flags for every echoed target, with one shared recipe limit',()=>{
 const {b,a,id,t}=setup('echoing_edge');b.content.abilities[id].effects=[packet({normalDamage:true}),packet({effectDamage:true}),packet({damageFlags:{futureRune:true},hits:2})];use(b,a,id,t);
 const hits=damage(b,a),originals=hits.filter(h=>!h.reaction),echoes=hits.filter(h=>h.reaction);assert.equal(originals.length,4);assert.equal(echoes.length,8);assert.equal(b.events.filter(e=>e.type==='reaction'&&e.gearEffectId==='echoing_edge').length,1);
 for(const targetId of new Set(echoes.map(e=>e.targetId))){const group=echoes.filter(e=>e.targetId===targetId);assert.deepEqual(group.map(e=>e.damageFlags),originals.map(e=>e.damageFlags));assert.deepEqual(group.map(e=>e.amount),[45,30,30,30]);}
});
test('gear echoes keep rank-resolved power at twenty percent, forecast leaves live limiter intact',()=>{
 const {b,a,id,t}=setup('echoing_edge',{normalDamage:true});b.content.abilities[id].growthProfile='damage';b.content.abilities[id].growthGroups=['damage'];b.content.abilities[id].rankable=true;a.skillRanks[id]=5;b.queue=[a.id,t.id];b.cursor=0;
 const f=forecastBattleAction(b,{actorId:a.id,abilityId:id,targetId:t.id});assert.equal(a.gearEffectProcRounds?.gear_echoing_edge,undefined);assert.ok(f.events.some(e=>e.abilityId==='$gear.echoing_edge'));use(b,a,id,t);const echo=damage(b,a).find(e=>e.abilityId==='$gear.echoing_edge');assert.equal(echo.amount,Math.floor(150*1.1**4*.2*1.5));assert.equal(a.gearEffectProcRounds.gear_echoing_edge,b.round);
});
test('both gear recipes preserve special flags on either side in Arena',()=>{
 for(const recipe of ['echoing_edge','affliction_prism'])for(const team of ['party','enemy']){
  const content=structuredClone(c),abilityId='arthur.light_slash';content.abilities[abilityId].effects=[packet({normalDamage:true,effectDamage:true,damageFlags:{futureRune:true}})];
  const s=account(content);s.party[0]='arthur';s.partyPresets[0].slots=[...s.party];const b=createArenaBattle(content,s,'mirror',993);prepare(b);const a=b.actors.find(x=>x.team===team&&x.characterId==='arthur'),t=b.actors.find(x=>x.team!==team);a.gearEffects=[structuredClone(c.gearEffects[recipe]),structuredClone(c.gearEffects.martial_insight)];for(const target of b.actors.filter(x=>x.team!==team))target.statuses=['deep_wound','gear_defense_crack'].map(id=>({id,remaining:10,stacks:1}));
  use(b,a,abilityId,t);const echoes=damage(b,a).filter(e=>e.abilityId==='$gear.'+recipe);assert.ok(echoes.length);for(const e of echoes){assert.equal(e.effectDamage,true);assert.equal(e.damageFlags.futureRune,true);assert.equal(isOnlyNormalDamage(e),false);assert.ok(e.pvpDamage);}
 }
});
