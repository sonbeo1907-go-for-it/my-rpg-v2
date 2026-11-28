import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle} from '../src/core/battle.js';
import {createStoryRun,advanceStoryWave} from '../src/core/story-waves.js';
import {battleDiscoveries,mergeBestiary,normalizeBestiary,recordBattleDiscovery,inspectBestiary,bestiaryLevelLimit,legacyBestiary} from '../src/core/bestiary.js';
import {levelScaledEnemyStats} from '../src/core/enemy-scaling.js';
import {partyLinkHref,partyReturnPath} from '../src/ui/party-navigation.js';
import {beginTournament} from '../src/core/tournament-session.js';
import {abandonTournamentBattle} from '../src/core/battle-abandon.js';
const c=await loadContent(),save=()=>createGameSave(c);
test('discovery records actual enemy definitions once, not player characters',()=>{
 const b=createBattle(c,save(),'forest_patrol',()=>.5),rows=battleDiscoveries(b,c);
 assert.deepEqual(rows.map(r=>r.enemyId),['elder_frog','goblin']);
 assert.equal(mergeBestiary(rows,rows,c).length,2);
});
test('scouting/future waves are not discovered, progressing a real wave adds the boss',()=>{
 const s=save();s.claimedFirstClearRewards=['east_ke_08','north_ke_01'];const run=createStoryRun(c,s,'north_ke_02',()=>.5);
 let next=recordBattleDiscovery(s,run.battle,c);
 assert.deepEqual(next.bestiary.map(r=>r.enemyId),['north_tavern_shade']);
 run.battle.outcome='victory';advanceStoryWave(c,run);
 next=recordBattleDiscovery(next,run.battle,c);
 assert.deepEqual(next.bestiary.map(r=>r.enemyId),['north_tavern_horror','north_tavern_shade']);
 assert.deepEqual(s.bestiary,[]);
});
test('spawns are recorded even if defeated, historical source actors cannot acquire another encounter context',()=>{
 const b=createBattle(c,save(),'forest_patrol',()=>.5);
 b.actors.push({...b.actors.find(a=>a.team==='enemy'),definitionId:'north_archer',hp:0});
 b.sourceActors=[{team:'enemy',definitionId:'north_chief'}];
 const ids=battleDiscoveries(b,c).map(r=>r.enemyId);
 assert.ok(ids.includes('north_archer'));assert.ok(!ids.includes('north_chief'));
});
test('training and Arena never disclose enemies',()=>{
 const b=createBattle(c,save(),'forest_patrol',()=>.5);
 for(const key of ['training','arena'])assert.deepEqual(battleDiscoveries({...b,[key]:{}},c),[]);
 b.actors=b.actors.map(a=>({...a,actorKind:'character'}));assert.deepEqual(battleDiscoveries(b,c),[]);
});
test('normalize rejects unknown records, deduplicates IDs and retains legitimate encounter contexts',()=>{
 assert.deepEqual(normalizeBestiary([{enemyId:'goblin',encounterIds:['forest_patrol','forest_patrol','fake']},{enemyId:'fake',encounterIds:['forest_patrol']},{enemyId:'goblin',encounterIds:[]},null],c),[{enemyId:'goblin',encounterIds:['forest_patrol']}]);
});
test('inspection uses the encounter HP curve at every level without mutating content',()=>{
 const id='goblin',ids=['forest_patrol','ogre_trial'],s={bestiary:[{enemyId:id,encounterIds:ids}]},before=JSON.stringify(c.enemies[id]);
 for(const encounterId of ids)for(const level of [1,25,50]){
  const view=inspectBestiary(s,c,id,encounterId,level);
  assert.deepEqual(view.stats,levelScaledEnemyStats(c.enemies[id],level,c,1,c.encounters[encounterId]));
 }
 assert.notEqual(inspectBestiary(s,c,id,ids[0],50).stats.maxHp,inspectBestiary(s,c,id,ids[1],50).stats.maxHp);
 assert.equal(JSON.stringify(c.enemies[id]),before);
});
test('unseen contexts and invalid levels cannot bypass discovery or curve limits',()=>{
 const s={bestiary:[{enemyId:'goblin',encounterIds:['forest_patrol']}]};
 for(const level of [0,-1,1.5,56,NaN])assert.throws(()=>inspectBestiary(s,c,'goblin','forest_patrol',level));
 assert.throws(()=>inspectBestiary(s,c,'goblin','ogre_trial',1));
 assert.equal(bestiaryLevelLimit(c,c.encounters.forest_patrol),55);
});
test('discovery survives full game-save encode/decode and remains idempotent',()=>{
 const b=createBattle(c,save(),'forest_patrol',()=>.5),next=recordBattleDiscovery(save(),b,c),loaded=decodeGameSave(encodeGameSave(next,c),c);
 assert.deepEqual(loaded.bestiary,next.bestiary);assert.equal(recordBattleDiscovery(loaded,b,c),loaded);
});
test('legacy first-clear receipts backfill cleared waves, not unlocked stages',()=>{
 const s=save();s.claimedFirstClearRewards=['forest_patrol'];
 assert.deepEqual(legacyBestiary(s,c).map(r=>r.enemyId),['elder_frog','goblin']);
 assert.ok(!legacyBestiary(s,c).some(r=>r.enemyId==='north_tavern_horror'));
});
test('party return routes preserve training, each trial and query through character detours',()=>{
 for(const origin of ['/chronicles/training?count=3','/chronicles/unrecorded/chimera?level=80','/chronicles/book2?location=yard','/stories/iris?chapter=2','/dungeon/gold_mine?selected=hard','/quests?tab=bounty&selected=ogre_trial','/arena/match?mode=ranked']){
  assert.equal(partyReturnPath(new URL(partyLinkHref(origin),'https://game.local').searchParams.get('back')),origin);
 }
 for(const value of ['//evil.test','/\\evil.test','/chronicles/../battle','/battle','https://evil.test','/chronicles/training\n'])assert.equal(partyReturnPath(value),'/home');
});
test('shade Lv50 bite is reduced without weakening the boss sharing the former ability',()=>{
 const s=save();s.claimedFirstClearRewards=['east_ke_08','north_ke_01'];const b=createBattle(c,s,'north_ke_02',()=>.5),shade=b.actors.find(a=>a.definitionId==='north_tavern_shade');
 assert.equal(shade.stats.attack,72);assert.equal(shade.stats.magic,86);
 assert.ok(shade.abilities.includes('north.shade_snap'));assert.equal(c.abilities['north.shade_snap'].effects[0].multiplier,1.4);
 assert.ok(c.enemies.north_tavern_horror.abilities.includes('north.shade_bite'));assert.equal(c.abilities['north.shade_bite'].effects[0].multiplier,1.8);
});
test('abandoning academy combat records a defeat without resetting or awarding a tournament',()=>{
 let s=save();s.tournaments.rulesAccepted=true;s=beginTournament(s,c,{revision:0,seed:'bestiary-menu-test'});
 const before=JSON.stringify(s),next=abandonTournamentBattle(c,s);
 assert.equal(JSON.stringify(s),before);assert.equal(JSON.parse(next.tournaments.activeRun.battleCheckpoint.data.state).outcome,'defeat');
 assert.ok(next.tournaments.activeRun.pendingResult);assert.equal(next.tournaments.firstClear,false);
});

test('every recorded enemy skill can be presented with its inspected level stats',async()=>{
 const {skillPresentation}=await import('../src/ui/skill-copy.js');
 const s={bestiary:legacyBestiary({claimedFirstClearRewards:Object.keys(c.encounters)},c)};
 for(const row of s.bestiary){const enemy=inspectBestiary(s,c,row.enemyId,row.encounterIds[0],1),actor={...enemy,baseStats:enemy.stats,resources:enemy.resources??{},statuses:[]};
  for(const id of enemy.abilities){assert.doesNotThrow(()=>skillPresentation(c.abilities[id],actor,c),row.enemyId+' '+id);}
 }
});

test('old v7 envelope without journal backfills only its first-clear receipts',()=>{
 const s=save();s.claimedFirstClearRewards=['north_ke_01'];
 const raw=JSON.parse(encodeGameSave(s,c));delete raw.bestiary;
 const loaded=decodeGameSave(JSON.stringify(raw),c);
 assert.deepEqual(loaded.bestiary.map(r=>r.enemyId),['north_archer','north_bandit','north_chief','north_mage']);
});
