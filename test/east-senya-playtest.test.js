import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {SENYA_SEEDS,SENYA_TEAMS,SENYA_BUILDS,senyaCases,senyaFixture} from '../scripts/fixtures/east-senya.mjs';
import {simulateSenya} from '../scripts/east-senya-playtest.mjs';
import {encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {isQuestUnlocked} from '../src/core/quest-catalog.js';
import {skillRankCap,skillRules} from '../src/core/skill-rules.js';
import {gearSlotCapacity} from '../src/core/gear-slots.js';
const content=await loadContent(),cases=senyaCases(content);
function spec(teamId,buildId,encounterId,replay=false){const s=cases.find(s=>s.teamId===teamId&&s.buildId===buildId&&s.encounterId===encounterId&&Boolean(s.replay)===replay);assert.ok(s);return s;}

test('30 deterministic seeds are shared across six free teams and three legal builds',()=>{
 assert.equal(SENYA_SEEDS.length,30);assert.equal(new Set(SENYA_SEEDS).size,30);
 assert.equal(SENYA_TEAMS.length,6);assert.equal(SENYA_BUILDS.length,3);
 for(const s of cases){assert.ok(!content.encounters[s.encounterId].fixedEnemyLevel||s.difficulty===content.encounters[s.encounterId].defaultDifficulty);if(s.teamId!=='starter_control'&&!s.replay)assert.ok(content.encounters[s.encounterId].eastOrder>content.encounters.east_ke_03.eastOrder);}
 const full=senyaCases(content,{full:true});
 for(const difficulty of ['east_35','east_45','east_55'])assert.ok(full.some(c=>c.teamId==='senya_guard'&&c.encounterId==='east_e_01'&&c.difficulty===difficulty));
 assert.equal(new Set(full.map(c=>c.id)).size,full.length);
});
test('all milestone fixtures round-trip, use only free owners and contain no future clears or mastery',()=>{
 for(const s of cases){
  const {campaign:c,metadata}=senyaFixture(content,s),target=content.encounters[s.encounterId];
  const restored=decodeGameSave(encodeGameSave(c,content),content);
  assert.deepEqual(restored,c,s.id);assert.ok(isQuestUnlocked(target,c));
  assert.ok(c.unlockedCharacterIds.every(id=>content.economy.default.starterCharacters.includes(id)||id==='senya'));
  assert.ok(c.claimedFirstClearRewards.filter(id=>content.encounters[id].category?.startsWith('east_')).every(id=>content.encounters[id].eastOrder<target.eastOrder||s.replay&&id===target.id));
  assert.deepEqual(c.exclusiveGear,[]);assert.ok(c.gear.every(g=>['t2','t3_focused'].includes(g.typeId)));
  for(const id of c.party){const state=c.characters[id];assert.equal(state.level,metadata.build.level);assert.ok(Object.values(state.skillRanks).every(rank=>rank<=skillRankCap(state.level,skillRules(content))));assert.ok(c.equipment[id].length<=gearSlotCapacity(c,content,id));}
 }
});
test('Senya is absent before recruitment, first slot needs a replay, later slots are not pre-granted',()=>{
 const early=senyaFixture(content,spec('starter_control','entry35','east_ke_03')).campaign;
 assert.ok(!early.unlockedCharacterIds.includes('senya'));
 const replay=senyaFixture(content,spec('senya_arthur','entry35','east_ke_03',true)).campaign;
 assert.ok(replay.unlockedCharacterIds.includes('senya'));assert.equal(gearSlotCapacity(replay,content,'senya'),3);
 for(const [target,slots]of [['east_ke_04',4],['east_ke_06',4],['east_ke_07',5],['east_ke_08',5]]){
  const c=senyaFixture(content,spec('senya_guard','endgame50',target)).campaign;
  assert.equal(gearSlotCapacity(c,content,'senya'),slots);assert.ok(!c.storyFlags.includes('senya.gear_slot_3_unlocked'));
 }
});
test('real multi-wave simulation is reproducible, records every wave and leaves fixtures/content unchanged',()=>{
 const s=spec('senya_guard','endgame50','east_ke_04'),{campaign:c}=senyaFixture(content,s),before=JSON.stringify(c),templates=JSON.stringify(content.enemies);
 const a=simulateSenya(content,c,s,SENYA_SEEDS[0]),b=simulateSenya(content,c,s,SENYA_SEEDS[0]);
 assert.equal(a.error,null);assert.deepEqual(a,b);assert.equal(a.waveCount,3);assert.equal(a.waves.length,3);
 assert.ok(a.waves.every(w=>w.enemyLevel===45));assert.ok(a.skills['senya.slash']||a.skills['senya.fulfill']);assert.ok(a.soul.spent>0);
 assert.equal(JSON.stringify(c),before);assert.equal(JSON.stringify(content.enemies),templates);
 const bounded=simulateSenya(content,c,s,SENYA_SEEDS[0],{maxActions:1});assert.equal(bounded.outcome,'bounded');assert.equal(bounded.wavesCleared,0);
 const auto=simulateSenya(content,c,s,SENYA_SEEDS[0],{policy:'arena',maxActions:3});assert.equal(auto.error,null);assert.equal(JSON.stringify(c),before);
});
