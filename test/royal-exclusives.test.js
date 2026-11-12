import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,activeActor,executeEnemyTurn,forecastBattleAction} from '../src/core/battle.js';
import {baseStatValue} from '../src/core/combat-math.js';
import {battleStat} from '../src/core/stat-values.js';
import {buyExclusiveRecipe} from '../src/core/blueprint-shop.js';
import {craftExclusive} from '../src/core/blacksmith.js';
import {exclusiveRollRange} from '../src/core/blacksmith-rules.js';
import {createArenaBattle} from '../src/core/arena.js';
import {skillPresentation} from '../src/ui/skill-copy.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {validateContent} from '../src/core/content.js';
const c=await loadContent(),ids=['geoffrey.royal_bulwark','nikita.silent_oath'],near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function save(gear=true){const s=createGameSave(c);s.party=['geoffrey','nikita','iris','elaine'];s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds.push('geoffrey','nikita');if(gear)for(const id of ids){s.unlockedExclusiveRecipes.push(id);s.exclusiveGear.push({templateId:id,statKey:'maxMp',statValue:exclusiveRollRange(c,'maxMp').min});s.equippedExclusiveGear[c.exclusiveGear[id].characterId]=id;}return s;}
function fixture(gear=true){const b=createBattle(c,save(gear),'forest_patrol',()=>.99);for(const x of b.actors){x.hp=x.stats.maxHp=100000;x.mp=x.stats.maxMp=1000;}return {b,g:b.actors.find(x=>x.id==='geoffrey'),n:b.actors.find(x=>x.id==='nikita'),e:b.actors.find(x=>x.team==='enemy')};}
function cast(b,a,id,target=a.id){b.queue=[a.id,...b.actors.filter(x=>x.hp>0&&x.id!==a.id).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:target});}
test('both royal recipes require Blueprints and use standard craft/save rules',()=>{
 assert.deepEqual(validateContent(c),[]);let s=save(false);s.blueprints=20;s.coins=100000;s.prismaFragments=10000;s.recruitmentShards=100;s.originalPrisma=10;
 for(const id of ids){assert.throws(()=>craftExclusive(s,c,id),/Shop/);s=buyExclusiveRecipe(s,c,id);s=craftExclusive(s,c,id,()=>.5);assert.ok(s.exclusiveGear.some(x=>x.templateId===id));}
 assert.equal(s.blueprints,0);assert.equal(decodeGameSave(encodeGameSave(s,c),c).exclusiveGear.length,2);
});
test('Geoffrey adds flat base DEF/RES once to living allies, before aura percentages; refresh is not stacking',()=>{
 const {b,g,e}=fixture(),before=baseStatValue(g,'defense');cast(b,g,'geoffrey.rampart');near(baseStatValue(g,'defense'),before+6);near(battleStat(c,g,'defense'),(before+6)*1.35);
 for(const a of b.actors.filter(x=>x.team==='party')){const s=a.statuses.find(x=>x.id==='geoffrey_royal_foundation');assert.equal(s.remaining,3);assert.deepEqual(s.baseStatModifiers,{defense:6,resistance:6});}
 assert.ok(!e.statuses.some(x=>x.id==='geoffrey_royal_foundation'));cast(b,g,'geoffrey.rampart');near(baseStatValue(g,'defense'),before+6);assert.equal(g.statuses.filter(x=>x.id==='geoffrey_royal_foundation').length,1);
 const plain=fixture(false);cast(plain.b,plain.g,'geoffrey.rampart');assert.ok(!plain.g.statuses.some(x=>x.id==='geoffrey_royal_foundation'));
 assert.match(skillPresentation(resolveRankedAbility(c,g,'geoffrey.rampart',5),g,c).facts.join(' '),/6 DEF/);
});
test('Geoffrey buff clock follows each recipient, ignores Extra and expires during real main progression',()=>{
 const {b,g}=fixture();const original=baseStatValue(g,'defense');
 function step(){const a=activeActor(b);if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}
 function seek(phase='main'){let n=0;while((activeActor(b)?.id!==g.id||b.phase!==phase)&&n++<200)step();assert.ok(n<200);}
 seek();executeAction(b,{actorId:g.id,abilityId:'geoffrey.rampart',targetId:g.id});b.extraTurnGrants.add(g.id);b.extraPhaseRequired=true;seek('extra');step();assert.equal(g.statuses.find(x=>x.id==='geoffrey_royal_foundation').remaining,3);
 for(let i=0;i<3;i++){seek();step();}seek();assert.ok(!g.statuses.some(x=>x.id==='geoffrey_royal_foundation'));near(baseStatValue(g,'defense'),original);
});
test('Nikita dagger gains two charges and dispels on HP/shield hits; no extra charges on her other skill',()=>{
 for(const shield of [0,10000]){const {b,n,e}=fixture();e.shield=shield;e.statuses=[{id:'anabel_command',remaining:5,stacks:1}];cast(b,n,'nikita.dagger',e.id);assert.equal(n.resourceValues.shadow_wind,2);assert.ok(!e.statuses.some(x=>x.id==='anabel_command'));cast(b,n,'nikita.dagger',e.id);assert.equal(n.resourceValues.shadow_wind,4);cast(b,n,'nikita.dagger',e.id);assert.equal(n.resourceValues.shadow_wind,4);}
 const {b,n,e}=fixture();cast(b,n,'nikita.veil',e.id);assert.equal(n.resourceValues.shadow_wind,1);const plain=fixture(false);cast(plain.b,plain.n,'nikita.dagger',plain.e.id);assert.equal(plain.n.resourceValues.shadow_wind,1);
});
test('forecast and rejected casts do not spend live state; PvP mirror effects stay on their own side',()=>{
 const {b,n,e}=fixture();b.queue=[n.id,e.id];b.cursor=0;e.statuses=[{id:'anabel_command',remaining:5,stacks:1}];const f=forecastBattleAction(b,{actorId:n.id,abilityId:'nikita.dagger',targetId:e.id});assert.equal(f.actors.find(x=>x.id===n.id).resourceValues.shadow_wind,2);assert.equal(n.resourceValues.shadow_wind,0);assert.equal(e.statuses.length,1);
 n.mp=0;assert.throws(()=>executeAction(b,{actorId:n.id,abilityId:'nikita.dagger',targetId:e.id}));assert.equal(n.resourceValues.shadow_wind,0);
 const arena=createArenaBattle(c,save(),'mirror',789),g=arena.actors.find(x=>x.team==='enemy'&&x.definitionId==='geoffrey');cast(arena,g,'geoffrey.rampart');assert.ok(arena.actors.filter(x=>x.team==='enemy').every(x=>x.statuses.some(s=>s.id==='geoffrey_royal_foundation')));assert.ok(arena.actors.filter(x=>x.team==='party').every(x=>!x.statuses.some(s=>s.id==='geoffrey_royal_foundation')));
});

