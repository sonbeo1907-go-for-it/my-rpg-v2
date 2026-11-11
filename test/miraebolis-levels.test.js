import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,getActor} from '../src/core/battle.js';
import {isQuestUnlocked,encounterReturnPath} from '../src/core/quest-catalog.js';
import {validateContent,DEPRECATED_CHARACTER_RELEASE_IDS} from '../src/core/content.js';
import {levelScaledEnemyStats} from '../src/core/enemy-scaling.js';
const content=await loadContent();

test('Miraebolis offers 60/70/80/90 with existing fortress and legacy unlocks',()=>{
 const e=content.encounters.miraebolis_superboss,c=createGameSave(content);
 assert.deepEqual(e.superLevels,[60,70,80,90]);assert.equal(isQuestUnlocked(e,c),false);
 c.chronicles.books.book2.finaleCleared=true;assert.equal(isQuestUnlocked(e,c),true);
 const legacy=createGameSave(content);legacy.storyFlags.push('illusion.sinister_unlocked');assert.ok(isQuestUnlocked(e,legacy));
});
test('every selectable Miraebolis level uses the engine curve, own level and return URL',()=>{
 const c=createGameSave(content);c.storyFlags.push('illusion.sinister_unlocked');let hp=0;
 for(const level of [60,70,80,90]){
  const b=createBattle(content,c,'miraebolis_superboss',()=>.99,{enemyLevel:level}),boss=getActor(b,'enemy_0');
  assert.equal(b.enemyLevel,level);assert.ok(boss.stats.maxHp>hp);hp=boss.stats.maxHp;
  assert.deepEqual(boss.stats,levelScaledEnemyStats(content.enemies.miraebolis,level,content,1,content.encounters.miraebolis_superboss));
  assert.equal(encounterReturnPath(content,b.encounterId,undefined,level),`/quests?tab=sinister&selected=miraebolis_superboss&superLevel=${level}`);
  assert.equal(boss.bossState.phase,1);assert.equal(content.encounters[b.encounterId].bgm,'miraebolis');
 }
 assert.equal(createBattle(content,c,'miraebolis_superboss').enemyLevel,60);
 assert.throws(()=>createBattle(content,c,'miraebolis_superboss',Math.random,{enemyLevel:75}),/không hợp lệ/);
});
test('official Astoria keeps stable identity and reserved historical numbering',()=>{
 assert.deepEqual(DEPRECATED_CHARACTER_RELEASE_IDS,[33]);
 assert.equal(content.characters.astoria.releaseId,93);assert.equal(content.characters.chiyoko.releaseId,92);
 assert.equal(Object.keys(content.characters).at(-1),'senya');
 assert.equal(new Set(Object.values(content.characters).map(c=>c.releaseId)).size,100);
 const invalid=structuredClone(content);invalid.characters.astoria.releaseId=33;
 assert.ok(validateContent(invalid).some(e=>e.includes('releaseId')));
 invalid.characters.astoria.releaseId=92;assert.ok(validateContent(invalid).some(e=>e.includes('releaseId')));
});
