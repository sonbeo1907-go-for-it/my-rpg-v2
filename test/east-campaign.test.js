import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle} from '../src/core/battle.js';
import {createStoryRun,advanceStoryWave} from '../src/core/story-waves.js';
import {questCatalog,isQuestUnlocked,encounterReturnPath} from '../src/core/quest-catalog.js';
import {questDifficulty} from '../src/core/quest-difficulty.js';
import {levelScaledEnemyStats} from '../src/core/enemy-scaling.js';
import {claimBattleReward} from '../src/core/economy.js';
import {seededRandom} from '../src/core/random.js';
const content=await loadContent();
const keys=Object.values(content.encounters).filter(e=>e.category==='east_key');
const hunts=Object.values(content.encounters).filter(e=>e.category==='east_hunt');
function save(){const s=createGameSave(content);s.unlockedCharacterIds=Object.keys(content.characters);s.claimedFirstClearRewards=[];return s;}

test('Thảo Phạt Phương Đông has 8 Key Events and 25 hunts in five groups',()=>{
 assert.equal(keys.length,8);assert.equal(hunts.length,25);assert.equal(new Set([...keys,...hunts].map(e=>e.id)).size,33);
 assert.deepEqual(keys.map(e=>e.id),['east_ke_01','east_ke_02','east_ke_03','east_ke_04','east_ke_05','east_ke_06','east_ke_07','east_ke_08']);
 for(let g=1;g<=5;g++)assert.equal(hunts.filter(e=>e.eastGroup===g).length,5);
 for(const e of keys){assert.equal(e.rewardTier,e.id==='east_ke_02'?'normal':'boss');assert.equal(e.fixedEnemyLevel,e.enemyLevel);assert.deepEqual(e.allowedDifficulties,[`east_${e.enemyLevel}`]);}
 for(const e of hunts)assert.deepEqual(e.allowedDifficulties,['east_35','east_45','east_55']);
});

test('east hunt levels use only 35/45/55 and Key Event levels are fixed',()=>{
 for(const e of hunts)for(const id of ['east_35','east_45','east_55']){const d=questDifficulty(content,e,id);assert.ok([35,45,55].includes(d.level));}
 for(const e of keys){assert.throws(()=>questDifficulty(content,e,e.enemyLevel===35?'east_55':'east_35'));const s=save();s.claimedFirstClearRewards=Object.keys(content.encounters);s.party=['arthur','iris','elaine','garrek'];const b=createBattle(content,s,e.id,()=>.99,{questDifficulty:`east_${e.enemyLevel}`});assert.equal(b.enemyLevel,e.enemyLevel);}
 const hunt=hunts.find(e=>e.eastGroup===1);const s=save();s.claimedFirstClearRewards=Object.keys(content.encounters);s.party=['arthur','iris','elaine','garrek'];assert.throws(()=>createBattle(content,s,hunt.id,()=>.99,{questDifficulty:'east_55',enemyLevel:35}));
});

test('east music exists and every effective BGM id contains east',()=>{
 for(const e of [...keys,...hunts]){assert.match(e.bgm,/east/);assert.ok(content.music[e.bgm],e.bgm);}
 for(const e of [...keys,...hunts])assert.ok(content.music[e.bgm].tracks.every(t=>/^\/bgm\/.+\.mp3$/.test(t)));
});

test('east bosses respect the pre/post-KE5 HP bands and weakness rules',()=>{
 for(const e of [...keys,...hunts])if(e.enemies.length===1&&content.enemies[e.enemies[0]].boss){const b=content.enemies[e.enemies[0]];assert.ok(b.stats.maxHp>=1400&&b.stats.maxHp<=2200,`${b.id} HP`);assert.ok(b.boss?.phases?.length>=2,`${b.id} phases`);if(b.id!=='east_chiyoko')assert.ok(b.weaknesses.includes('sword_soul'),`${b.id} soul weakness`);}
 assert.deepEqual(content.enemies.east_chiyoko.weaknesses,[]);
 assert.ok(levelScaledEnemyStats(content.enemies.east_orochi,55,content,1,content.encounters.east_ke_08).maxHp>0);
});

test('unlock chain opens KE1, then KE4 only after all five group-1 hunts, then KE5 after group 2',()=>{
 const s=save();assert.equal(questCatalog(content,s,{tab:'east'}).map(e=>e.id).join(','),'east_ke_01');
 s.claimedFirstClearRewards.push('east_ke_01','east_ke_02','east_ke_03');
 assert.equal(questCatalog(content,s,{tab:'east'}).filter(e=>e.category==='east_hunt').length,5);
 s.claimedFirstClearRewards.push('east_e_01','east_e_02','east_e_03','east_e_04','east_e_05');
 assert.ok(isQuestUnlocked(content.encounters.east_ke_04,s));
 s.claimedFirstClearRewards.push('east_e_06','east_e_07','east_e_08','east_e_09','east_e_10');
 assert.ok(isQuestUnlocked(content.encounters.east_ke_05,s));
 assert.equal(encounterReturnPath(content,'east_e_01','east_35'),'/quests?tab=east&selected=east_e_01&difficulty=east_35');
});

test('east clears are recorded without first-clear rewards and KE8 completes the campaign flag',()=>{
 const s=save();s.claimedFirstClearRewards=['east_ke_07','east_e_21','east_e_22','east_e_23','east_e_24','east_e_25'];
 const battle={questDifficulty:'east_55',rewardRandom:()=>0,encounterId:'east_ke_08',outcome:'victory',actors:[]};
 const next=claimBattleReward(s,battle,content);
 assert.ok(next.claimedFirstClearRewards.includes('east_ke_08'));assert.ok(next.storyFlags.includes('east_campaign_completed'));
});

test('a multi-wave east hunt keeps its difficulty and advances through the authored waves',()=>{
 const s=save();s.claimedFirstClearRewards=Object.keys(content.encounters);s.party=['arthur','iris','elaine','garrek'];
 const run=createStoryRun(content,s,'east_ke_01',seededRandom(7),{questDifficulty:'east_35'});
 assert.equal(run.battle.storyWave.totalWaves,3);assert.equal(run.battle.enemyLevel,35);
 run.battle.outcome='victory';const next=advanceStoryWave(content,run);assert.equal(next.storyWave.waveIndex,1);assert.equal(next.enemyLevel,35);
});
