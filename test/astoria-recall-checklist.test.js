import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {unlockCharacter} from '../src/core/ownership.js';
import {createBattle,activeActor,getActor,executeAction,abilityAvailability,basicAbility,DEFEND} from '../src/core/battle.js';
import {battlePresentation} from '../src/core/combat-modes.js';
import {effectiveStat} from '../src/core/combat-math.js';
import {exclusiveRollRange} from '../src/core/blacksmith-rules.js';
import {createDungeonRun,createDungeonPreview,advanceDungeonWave} from '../src/core/dungeon.js';
const content=await loadContent(),now=new Date('2026-11-06T05:00:00Z');
function fixture(party=['astoria'],speeds={},magic=36,gear=false){
 const c=structuredClone(content);c.characters.astoria.stats.magic=magic;c.characters.astoria.stats.speed=speeds.astoria??100;
 for(const [id,speed] of Object.entries(speeds))if(c.characters[id])c.characters[id].stats.speed=speed;
 const save=createGameSave(c);save.party=[...party];save.partyPresets[0].slots=[...party];
 save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];
 if(gear){
  save.exclusiveGear.push({templateId:'astoria.crown',statKey:'attack',statValue:exclusiveRollRange(c,'attack').min});
  save.equippedExclusiveGear.astoria='astoria.crown';
  save.unlockedExclusiveRecipes.push('astoria.crown');
 }
 const b=createBattle(c,save,'forest_patrol',()=>.99);
 for(const enemy of b.actors.filter(actor=>actor.team==='enemy')){enemy.hp=enemy.stats.maxHp=100000;enemy.stats.defense=enemy.stats.resistance=0;enemy.statuses=[];enemy.weaknesses=[];enemy.resistances={};delete enemy.passive;}
 return b;
}
function act(b,id='$defend',target){const actor=activeActor(b),skill=id==='$defend'?DEFEND:id==='$attack'?basicAbility(actor):b.content.abilities[id];executeAction(b,{actorId:actor.id,abilityId:id,targetId:target??(skill.target==='self'?actor.id:b.actors.find(a=>a.team==='enemy'&&a.hp>0)?.id)});}
function until(b,predicate){for(let i=0;i<240;i++){if(predicate())return;assert.ok(!b.outcome,'trận kết thúc ngoài dự kiến');act(b);}throw Error('No turn');}
function summon(b){const astoria=getActor(b,'astoria');astoria.resourceValues.space_rift=5;act(b,'astoria.summon');return astoria;}
function extraAstoria(b){until(b,()=>b.phase==='extra'&&activeActor(b)?.id==='astoria');}
function mainAstoria(b,minRound=2){until(b,()=>b.phase==='main'&&b.round>=minRound&&activeActor(b)?.id==='astoria');}
function astoriaTurn(b){until(b,()=>activeActor(b)?.id==='astoria');}

test('A01 — Summon → Extra Turn → Recall exits Magnamut and keeps rifts',()=>{
 const b=fixture(),a=summon(b);extraAstoria(b);
 a.mp=0;a.resourceValues.space_rift=5;
 act(b,'astoria.recall');
 assert.equal(a.activeMode,undefined);
 assert.equal(a.resourceValues.space_rift,5);
 assert.equal(a.mp,42);
 assert.equal(b.events.filter(event=>event.type==='mode_exit').length,1);
});

test('A04 — Recall with exactly 5 rifts preserves all five',()=>{
 const b=fixture(),a=summon(b);extraAstoria(b);
 a.resourceValues.space_rift=5;
 act(b,'astoria.recall');
 assert.equal(a.resourceValues.space_rift,5);
 assert.equal(a.activeMode,undefined);
});

test('A05 — Re-summon works on the next round without losing progress',()=>{
 const b=fixture(),a=summon(b);extraAstoria(b);
 a.resourceValues.space_rift=5;
 act(b,'astoria.recall');
 mainAstoria(b,2);
 assert.equal(a.resourceValues.space_rift,5);
 assert.equal(abilityAvailability(b,a,content.abilities['astoria.summon']).ok,true);
 act(b,'astoria.summon');
 assert.equal(a.activeMode,'magnamut');
 assert.equal(a.resourceValues.space_rift,5);
});

test('A06 — Recall is unavailable outside Magnamut and engine rejects it',()=>{
 const b=fixture(),a=getActor(b,'astoria');
 const recall=content.abilities['astoria.recall'];
 assert.equal(a.activeMode,undefined);
 assert.equal(abilityAvailability(b,a,recall).ok,false);
 assert.throws(()=>executeAction(b,{actorId:a.id,abilityId:'astoria.recall',targetId:a.id}),/Cần Magnamut/);
 assert.equal(abilityAvailability(b,a,DEFEND).ok,true);
});

test('B01 — Summon does not duplicate an Extra Turn already granted',()=>{
 const b=fixture(['astoria','lionel'],{astoria:10,lionel:100}),a=getActor(b,'astoria');
 a.resourceValues.space_rift=5;
 until(b,()=>activeActor(b)?.id==='lionel');
 act(b,'lionel.encore',a.id);
 until(b,()=>activeActor(b)?.id==='astoria'&&b.phase==='main');
 act(b,'astoria.summon');
 assert.equal(b.log.filter(line=>line.includes('nhận Lượt Thêm')).length,1,'chỉ một Lượt Thêm được cấp');
 assert.ok(b.log.some(line=>line.includes('đã có Lượt Thêm')));
 until(b,()=>b.phase==='extra');
 assert.equal(b.queue.filter(id=>id===a.id).length,1,'chỉ một lượt phụ cho Astoria');
});

test('B02 — Summon during the Extra Phase does not create another turn',()=>{
 const b=fixture(['astoria','lionel'],{astoria:10,lionel:100}),a=getActor(b,'astoria');
 a.resourceValues.space_rift=5;
 until(b,()=>activeActor(b)?.id==='lionel');
 act(b,'lionel.encore',a.id);
 extraAstoria(b);
 a.resourceValues.space_rift=5;
 act(b,'astoria.summon');
 assert.equal(a.activeMode,'magnamut');
 assert.equal(b.log.filter(line=>line.includes('nhận Lượt Thêm')).length,1,'không cấp thêm Lượt Thêm');
 assert.ok(b.log.some(line=>line.includes('bỏ qua cấp Lượt Thêm trong Vòng Phụ')));
});

test('B04 — Stun during the Extra Turn consumes the turn, not Magnamut',()=>{
 const b=fixture(),a=summon(b);
 a.statuses.push({id:'stunned',remaining:1,stacks:1});
 until(b,()=>b.round>=2);
 assert.equal(b.round,2);
 assert.equal(a.activeMode,'magnamut','Choáng không được rút Magnamut');
 assert.equal(a.resourceValues.space_rift,5);
 assert.equal(b.log.filter(line=>line.includes('Astoria dùng Triệu hồi Magnamut')).length,1,'chỉ có lượt triệu hồi');
 assert.equal(b.log.filter(line=>line.includes('bị choáng, mất lượt hành động')).length,1);
});

test('C07 — 35% MP refund happens exactly once',()=>{
 const b=fixture(),a=summon(b);extraAstoria(b);
 a.mp=0;a.resourceValues.space_rift=3;
 act(b,'astoria.recall');
 const refunds=()=>b.events.filter(event=>event.type==='mode_exit').length;
 assert.equal(a.mp,42);
 assert.equal(refunds(),1);
 until(b,()=>b.round>=2);
 assert.equal(a.mp,42,'không hồi MP lần hai ở cuối vòng');
 assert.equal(refunds(),1);
 assert.equal(b.log.filter(line=>line==='Magnamut rời sân.').length,1);
});

test('C09 — Trấn keeps the last rift through Mệnh lệnh, then recall preserves it',()=>{
 const b=fixture(['astoria'],{},135,true),a=summon(b);extraAstoria(b);
 a.resourceValues.space_rift=1;
 act(b,'astoria.command');
 assert.equal(a.activeMode,'magnamut','giữ Vết nứt thì Magnamut vẫn hiện diện');
 assert.equal(a.resourceValues.space_rift,1,'Trấn phải giữ Vết nứt cuối cùng');
 mainAstoria(b,2);
 act(b,'astoria.recall');
 assert.equal(a.activeMode,undefined);
 assert.equal(a.resourceValues.space_rift,1);
});

test('D01 — Recalled state carries rifts across Dungeon rooms',()=>{
 const c=structuredClone(content),save=createGameSave(c);
 save.party=['astoria','elaine'];save.partyPresets[0].slots=[...save.party];
 unlockCharacter(save,c,'astoria');unlockCharacter(save,c,'elaine');
 const preview=createDungeonPreview(c,'gold_mine','easy',{now,random:()=>0});
 const run=createDungeonRun(c,save,'gold_mine','easy',{now,preview,random:()=>.99});
 const b=run.battle;astoriaTurn(b);const a=summon(b);
 extraAstoria(b);a.resourceValues.space_rift=4;a.mp=0;act(b,'astoria.recall');
 astoriaTurn(b);
 const enemies=b.actors.filter(actor=>actor.team==='enemy');
 for(const enemy of enemies.slice(0,-1))enemy.hp=0;
 enemies.at(-1).hp=1;
 act(b,'$attack',enemies.at(-1).id);
 assert.equal(b.outcome,'victory');
 const exits=b.log.filter(line=>line==='Magnamut rời sân.').length;
 advanceDungeonWave(c,run);
 const carried=getActor(run.battle,'astoria');
 assert.equal(carried.activeMode,undefined);
 assert.equal(carried.resourceValues.space_rift,4);
 assert.equal(carried.mp,42,'không hồi MP lần hai khi qua phòng');
 assert.equal(run.battle.log.filter(line=>line==='Magnamut rời sân.').length,exits);
 assert.equal(abilityAvailability(run.battle,carried,content.abilities['astoria.recall']).ok,false);
 assert.equal(abilityAvailability(run.battle,carried,DEFEND).ok,true);
});
