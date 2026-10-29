import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createGameSave, encodeGameSave, decodeGameSave } from '../src/core/game-save.js';
import { completeStoryEvent } from '../src/core/story-events.js';
import { createBattle } from '../src/core/battle.js';
import { validateContent } from '../src/core/content.js';
import { encounterTier, victoryCoinReward, claimBattleReward } from '../src/core/economy.js';
import { questCatalog, questCategory, SINISTER_UNLOCK_FLAG, isQuestUnlocked } from '../src/core/quest-catalog.js';
const content = await loadContent();

test('default board contains normal then boss quests, stable within reward groups, with scoped search/type', () => {
  const save = createGameSave(content), entries = questCatalog(content, save);
  assert.equal(questCategory(), 'extermination');
  assert.equal(entries[0].id, 'goblin_forest_ambush');
  const rewards = entries.map(e => victoryCoinReward(content, e.id));
  assert.deepEqual(rewards, [...rewards].sort((a,b)=>a-b));
  assert.deepEqual([...new Set(rewards)], [50, 150]);
  for(const tier of ['normal','boss']) {
    assert.deepEqual(questCatalog(content,save,{type:tier}).map(e=>e.id),Object.values(content.encounters).filter(e=>encounterTier(e)===tier).map(e=>e.id));
  }
  assert.equal(questCatalog(content,save,{q:'LỢN RỪNG'})[0].id,'boar_field');
  assert.ok(questCatalog(content,save,{tab:'extermination',selected:'alice_superboss'}).every(e=>encounterTier(e)!=='super'));
});
test('new and old saves cannot see/start super quests, including legacy filters and future supers without explicit requirements', () => {
  const save=createGameSave(content);
  for(const filter of [{tab:'sinister'},{type:'super'},{tab:'sinister',q:'Alice',selected:'alice_superboss'}]) assert.deepEqual(questCatalog(content,save,filter),[]);
  for(const encounter of Object.values(content.encounters).filter(e=>encounterTier(e)==='super')) {
    assert.equal(isQuestUnlocked(encounter,save),false);
    assert.throws(()=>createBattle(content,save,encounter.id),/chưa mở khóa/);
    const source=structuredClone(content);delete source.encounters[encounter.id].requires;
    assert.equal(isQuestUnlocked(source.encounters[encounter.id],save),false);
  }
});
test('illusion flag persists per profile and unlocks battles without modifying historical rewards/progress',()=>{
  const save=claimBattleReward(createGameSave(content),{encounterId:'goblin_forest_ambush',outcome:'victory'},content);save.coins=850;save.victories=7;
  completeStoryEvent(save,content,SINISTER_UNLOCK_FLAG);completeStoryEvent(save,content,SINISTER_UNLOCK_FLAG);
  const loaded=decodeGameSave(encodeGameSave(save,content),content);
  assert.deepEqual(loaded.storyFlags,[SINISTER_UNLOCK_FLAG]);assert.equal(loaded.coins,850);assert.equal(loaded.victories,7);
  assert.deepEqual(loaded.claimedFirstClearRewards,['goblin_forest_ambush']);
  const entries=questCatalog(content,loaded,{tab:'sinister'});assert.equal(entries.length,2);
  for(const entry of entries)assert.equal(createBattle(content,loaded,entry.id).encounterId,entry.id);
  assert.deepEqual(questCatalog(content,createGameSave(content),{tab:'sinister'}),[]);
});
test('authored requirements support individual quest gates and reject invalid content',()=>{
  const source=structuredClone(content),save=createGameSave(content);
  source.encounters.forest_patrol.requires={storyFlag:'story.forest'};
  assert.equal(isQuestUnlocked(source.encounters.forest_patrol,save),false);
  completeStoryEvent(save,source,'story.forest');assert.equal(isQuestUnlocked(source.encounters.forest_patrol,save),true);
  for(const requires of [null,[],{}, {storyFlag:''},{storyFlag:42}]) {
    const broken=structuredClone(content);broken.encounters.forest_patrol.requires=requires;
    assert.ok(validateContent(broken).some(e=>e.includes('invalid quest unlock requirement')));
  }
});
