import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,getActor,executeAction,abilityAvailability,basicAbility,DEFEND} from '../src/core/battle.js';
import {commandAbilityIds} from '../src/core/combat-modes.js';
import {battlePresentation} from '../src/core/combat-modes.js';
import {effectiveStat} from '../src/core/combat-math.js';
import {validateContent} from '../src/core/content.js';
const content=await loadContent();
function setup(party=['astoria']){
 const c=structuredClone(content);c.characters.astoria.stats.speed=100;
 const save=createGameSave(c);save.party=[...party];save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];
 const b=createBattle(c,save,'forest_patrol',()=>.99);
 for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.defense=e.stats.resistance=0;e.statuses=[];e.weaknesses=[];e.resistances={};delete e.passive;}
 return b;
}
function act(b,id='$defend',target){const a=activeActor(b),s=id==='$defend'?DEFEND:id==='$attack'?basicAbility(a):b.content.abilities[id];executeAction(b,{actorId:a.id,abilityId:id,targetId:target??(s.target==='self'?a.id:'enemy_0')});}
function until(b,predicate){for(let i=0;i<200;i++){if(predicate())return;assert.ok(!b.outcome,'trận kết thúc ngoài dự kiến');act(b);}throw Error('No turn');}
function summon(b){const a=getActor(b,'astoria');a.resourceValues.space_rift=5;act(b,'astoria.summon');return a;}
function extraAstoria(b){until(b,()=>b.phase==='extra'&&activeActor(b)?.id==='astoria');}
function mainAstoria(b,minRound=1){until(b,()=>b.phase==='main'&&b.round>=minRound&&activeActor(b)?.id==='astoria');}

test('Thu Hồi Lỗ Hổng replaces Defend while Magnamut is present and keeps remaining rifts',()=>{
 const recall=content.abilities['astoria.recall'];
 assert.equal(recall.name,'Thu Hồi Lỗ Hổng');
 assert.equal(recall.target,'self');
 assert.equal(recall.requiresMode,'magnamut');
 assert.deepEqual(recall.effects,[{type:'end_mode',mode:'magnamut',to:'self'}]);
 assert.ok(!recall.description.includes('combatMode'),'mô tả không dùng thuật ngữ kỹ thuật');
 assert.ok(recall.description.includes('Vết nứt'));
 const mode=content.characters.astoria.combatModes.magnamut;
 assert.deepEqual(mode.allowedAbilities,['astoria.command','astoria.recall']);
 assert.deepEqual(mode.commandAbilities,['astoria.command','astoria.recall']);

 const b=setup(),a=getActor(b,'astoria');
 assert.equal(abilityAvailability(b,a,recall).ok,false,'ngoài Magnamut không dùng được');
 assert.equal(abilityAvailability(b,a,DEFEND).ok,true,'ngoài Magnamut vẫn Phòng thủ bình thường');
 summon(b);
 assert.deepEqual(commandAbilityIds(a),['astoria.command','astoria.recall']);
 assert.equal(abilityAvailability(b,a,DEFEND).ok,false,'Phòng thủ bị thay thế trong Magnamut');
 assert.equal(abilityAvailability(b,a,basicAbility(a)).ok,false);
 assert.equal(abilityAvailability(b,a,recall).ok,true);

 extraAstoria(b);
 assert.throws(()=>executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id}),/Magnamut đang hiện diện/);
 a.mp=0;a.resourceValues.space_rift=3;
 act(b,'astoria.recall');
 assert.equal(a.activeMode,undefined,'phải thu hồi Magnamut');
 assert.equal(a.resourceValues.space_rift,3,'Vết nứt còn lại phải được giữ nguyên');
 assert.equal(a.mp,42,'vẫn nhận hồi 35% MP khi Magnamut rời sân');
 assert.equal(effectiveStat(a,'magic'),36,'mất +15 MAG căn bản khi rời dạng');
 assert.equal(b.events.filter(e=>e.type==='mode_exit').length,1);
 assert.equal(battlePresentation(b.actors),null);
 assert.equal(abilityAvailability(b,a,recall).ok,false,'sau thu hồi không dùng lại được');
 assert.equal(abilityAvailability(b,a,DEFEND).ok,true,'sau thu hồi Phòng thủ trở lại');
});

test('recall preserves every remaining rift count and caps the exit MP refund',()=>{
 for(const rifts of [5,3,1,0]){
  const b=setup(),a=summon(b);extraAstoria(b);
  a.mp=a.stats.maxMp;a.resourceValues.space_rift=rifts;
  act(b,'astoria.recall');
  assert.equal(a.activeMode,undefined);
  assert.equal(a.resourceValues.space_rift,rifts,'rifts='+rifts);
  assert.equal(a.mp,a.stats.maxMp,'hồi MP không được vượt trần');
 }
});

test('recall on a normal main turn preserves rifts and restores the normal command set',()=>{
 const b=setup(),a=summon(b);
 extraAstoria(b);a.resourceValues.space_rift=5;act(b,'astoria.command');
 until(b,()=>b.phase==='main'&&b.round>=2&&activeActor(b)?.id==='astoria');
 a.resourceValues.space_rift=2;
 act(b,'astoria.recall');
 assert.equal(a.activeMode,undefined);
 assert.equal(a.resourceValues.space_rift,2);
 assert.equal(abilityAvailability(b,a,DEFEND).ok,true);
 assert.equal(abilityAvailability(b,a,content.abilities['astoria.summon']).ok,false,'2 rifts chưa đủ triệu hồi lại');
});

test('after recalling with five rifts, Astoria can summon Magnamut again without losing progress',()=>{
 const b=setup(),a=summon(b);extraAstoria(b);
 a.resourceValues.space_rift=5;
 act(b,'astoria.recall');
 assert.equal(a.resourceValues.space_rift,5);
 mainAstoria(b,2);
 assert.equal(abilityAvailability(b,a,content.abilities['astoria.summon']).ok,true);
 act(b,'astoria.summon');
 assert.equal(a.activeMode,'magnamut');
 assert.equal(a.resourceValues.space_rift,5,'triệu hồi lại không tiêu tầng');
});

test('recall is unavailable after empty-resource auto-exit has already removed Magnamut',()=>{
 const b=setup(),a=getActor(b,'astoria');
 a.activeMode='magnamut';a.resourceValues.space_rift=1;a.mp=0;b.extraTurnGrants.add(a.id);b.extraPhaseRequired=true;
 act(b,'astoria.command');
 assert.equal(a.activeMode,'magnamut');assert.equal(a.resourceValues.space_rift,0);
 until(b,()=>b.phase==='extra');
 assert.equal(activeActor(b).id,'astoria');
 assert.equal(a.activeMode,undefined,'hết Vết nứt phải tự rời dạng trước khi hành động');
 assert.equal(a.mp,42);
 assert.equal(abilityAvailability(b,a,content.abilities['astoria.recall']).ok,false);
 assert.equal(abilityAvailability(b,a,DEFEND).ok,true);
});

test('end_mode must name a real mode of the owner',()=>{
 const bad=structuredClone(content);
 bad.abilities['astoria.recall'].effects[0].mode='missing_mode';
 assert.ok(validateContent(bad).some(error=>error.includes('unknown end mode')));
});
