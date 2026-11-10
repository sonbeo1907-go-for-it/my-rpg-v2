import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,getActor,executeAction} from '../src/core/battle.js';
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
 for(const e of keys){assert.throws(()=>questDifficulty(content,e,e.enemyLevel===35?'east_55':'east_35'));const s=save();s.claimedFirstClearRewards=Object.keys(content.encounters);s.storyFlags.push('eastern_hunts_unlocked');s.party=['arthur','iris','elaine','garrek'];const b=createBattle(content,s,e.id,()=>.99,{questDifficulty:`east_${e.enemyLevel}`});assert.equal(b.enemyLevel,e.enemyLevel);}
 const hunt=hunts.find(e=>e.eastGroup===1);const s=save();s.claimedFirstClearRewards=Object.keys(content.encounters);s.storyFlags.push('eastern_hunts_unlocked');s.party=['arthur','iris','elaine','garrek'];assert.throws(()=>createBattle(content,s,hunt.id,()=>.99,{questDifficulty:'east_55',enemyLevel:35}));
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
 const s=save();assert.equal(questCatalog(content,s,{tab:'east'}).length,0,'Hắc Ảnh Arthur dễ chưa clear thì East phải khóa');s.storyFlags.push('eastern_hunts_unlocked');assert.equal(questCatalog(content,s,{tab:'east'}).map(e=>e.id).join(','),'east_ke_01');
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
 const s=save();s.claimedFirstClearRewards=Object.keys(content.encounters);s.storyFlags.push('eastern_hunts_unlocked');s.party=['arthur','iris','elaine','garrek'];
 const run=createStoryRun(content,s,'east_ke_01',seededRandom(7),{questDifficulty:'east_35'});
 assert.equal(run.battle.storyWave.totalWaves,3);assert.equal(run.battle.enemyLevel,35);
 run.battle.outcome='victory';const next=advanceStoryWave(content,run);assert.equal(next.storyWave.waveIndex,1);assert.equal(next.enemyLevel,35);
});

test('clearing Hắc Ảnh Arthur — Dễ records the eastern unlock before opening KE1',()=>{
 const s=save();s.claimedFirstClearRewards=['iris_story_revenge','fiona_story_drei','takeshi_story_horizon'];s.party=['arthur','iris','elaine','garrek'];s.characters.arthur.upgradeIds=[];
 const battle={encounterId:'epilogue_shadow_easy',outcome:'victory',rewardRandom:()=>0,actors:[{definitionId:'arthur',team:'party'}]};
 const next=claimBattleReward(s,battle,content);
 assert.ok(next.storyFlags.includes('eastern_hunts_unlocked'));
 assert.ok(next.characters.arthur.upgradeIds.includes('arthur.eastern_hunts'));
 assert.equal(questCatalog(content,next,{tab:'east'})[0].id,'east_ke_01');
});

test('every non-boss hunt has an authored mechanic, including KE2 support',()=>{
 for(const e of hunts){const ids=e.waves?e.waves.flat():e.enemies;if(ids.some(id=>content.enemies[id].boss))continue;const mechanics=ids.flatMap(id=>content.enemies[id].abilities??[]).filter(id=>id.startsWith('east.mech'));
  assert.ok(mechanics.length,e.id);
 }
 const ke2=content.encounters.east_ke_02;assert.ok((ke2.waves.flat().flatMap(id=>content.enemies[id].abilities??[])).some(id=>id.startsWith('east.mech')));
 assert.ok(content.abilities['east.mech_web']);assert.ok(content.abilities['east.mech_blizzard'].windup);
 assert.ok(content.statuses.east_burn.damageOverTime);assert.ok(content.statuses.east_chill.modifiers.speed<0);
});

test('encounter mechanics apply their authored statuses',()=>{
 const s=save();s.claimedFirstClearRewards=Object.keys(content.encounters);s.storyFlags.push('eastern_hunts_unlocked');s.party=['arthur','iris','elaine','garrek'];
 const b=createBattle(content,s,'east_e_12',()=>.99,{questDifficulty:'east_35'});const enemy=b.actors.find(a=>a.team==='enemy'&&a.abilities?.includes('east.mech_onibi'));
 assert.ok(enemy);b.queue=[enemy.id];b.cursor=0;b.phase='main';b.outcome=null;enemy.mp=999;
 executeAction(b,{actorId:enemy.id,abilityId:'east.mech_onibi',targetId:getActor(b,'arthur').id});
 assert.ok(b.actors.filter(a=>a.team==='party').some(a=>a.statuses.some(st=>st.id==='east_burn')));
});

test('every east boss has two authored mechanics, a telegraph and a valid phase kit',()=>{
 for(const e of [...keys,...hunts])for(const id of (e.waves?e.waves.flat():e.enemies)){const b=content.enemies[id];if(!b.boss)continue;
  const custom=b.abilities.filter(a=>a.startsWith('east.')&&!a.startsWith('east_anchor'));
  assert.ok(custom.length>=2,`${id} mechanics`);assert.ok(custom.some(a=>content.abilities[a].windup),`${id} telegraph`);assert.ok(b.boss.phases.length>=2,`${id} phases`);assert.ok(b.initialStatuses.some(s=>s.status==='east_soul_guard'),`${id} soul guard`);
 }
 assert.equal(content.enemies.east_orochi.boss.phases.length,3);assert.equal(content.enemies.east_chiyoko.boss.phases[1].actionsPerTurn,2);
 assert.ok(content.abilities['east.yamauba_drain'].windup);assert.ok(content.abilities['east.yamauba_drain'].effects.some(e=>e.lifeStealRatio>0));
 assert.ok(content.abilities['east.tengu_wind'].effects.some(e=>e.status==='east_illusion'&&e.to==='self'));
});

test('east difficulty is scoped away from normal quests and east first-clear saves load',()=>{
 const normal=content.encounters.forest_patrol;
 assert.throws(()=>questDifficulty(content,normal,'east_35'),/Độ khó Phương Đông/);
 assert.equal(questDifficulty(content,content.encounters.east_ke_01,'east_35').level,35);
 const s=save();s.claimedFirstClearRewards.push('east_ke_01');s.storyFlags.push('eastern_hunts_unlocked');
 const loaded=decodeGameSave(encodeGameSave(s,content),content);
 assert.ok(loaded.claimedFirstClearRewards.includes('east_ke_01'));
});

test('Hàn Khí stacks up to three and refreshes its duration',()=>{
 const s=save();s.claimedFirstClearRewards=Object.keys(content.encounters);s.storyFlags.push('eastern_hunts_unlocked');s.party=['arthur','iris','elaine','garrek'];
 const b=createBattle(content,s,'east_e_16',()=>.99,{questDifficulty:'east_35'});const enemy=b.actors.find(a=>a.team==='enemy'&&a.abilities?.includes('east.mech_chill'));
 for(let i=0;i<3;i++){b.queue=[enemy.id];b.cursor=0;b.phase='main';b.outcome=null;enemy.mp=999;enemy.cooldowns={};executeAction(b,{actorId:enemy.id,abilityId:'east.mech_chill',targetId:getActor(b,'arthur').id});}
 const target=b.actors.find(a=>a.team==='party'&&a.statuses.some(st=>st.id==='east_chill'));const chill=target.statuses.find(st=>st.id==='east_chill');assert.equal(chill.stacks,3);
});

test('Chiyoko builds Tổ Kiếm and spends it on her finisher',()=>{
 const s=save();s.claimedFirstClearRewards=Object.keys(content.encounters);s.storyFlags.push('eastern_hunts_unlocked');s.party=['arthur','iris','elaine','garrek'];
 const b=createBattle(content,s,'east_ke_06',()=>.99,{questDifficulty:'east_45'});const boss=b.actors.find(a=>a.team==='enemy');boss.mp=999;
 b.queue=[boss.id];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:boss.id,abilityId:'east.chiyoko_pressure',targetId:getActor(b,'arthur').id});assert.equal(boss.resourceValues.to_kiem,1);
 boss.resourceValues.to_kiem=3;boss.cooldowns={};b.queue=[boss.id];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:boss.id,abilityId:'east.chiyoko_finisher',targetId:getActor(b,'arthur').id});assert.equal(boss.resourceValues.to_kiem,0);
});

test('White Oni shield breaking applies Giáp Quỷ Vỡ',()=>{
 const s=save();s.claimedFirstClearRewards=Object.keys(content.encounters);s.storyFlags.push('eastern_hunts_unlocked');s.party=['arthur','iris','elaine','garrek'];
 const b=createBattle(content,s,'east_e_20',()=>.99,{questDifficulty:'east_55'});const boss=b.actors.find(a=>a.team==='enemy');boss.shield=1;boss.shieldSourceId='test';
 b.queue=[getActor(b,'arthur').id];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:'arthur',abilityId:'$attack',targetId:boss.id});
 assert.equal(boss.shield,0);assert.ok(boss.statuses.some(st=>st.id==='east_guard_broken'));
});

test('Jorōgumo summons a web anchor that can carry the tether cleanup tag',()=>{
 const s=save();s.claimedFirstClearRewards=Object.keys(content.encounters);s.storyFlags.push('eastern_hunts_unlocked');s.party=['arthur','iris','elaine','garrek'];
 const b=createBattle(content,s,'east_ke_04',()=>.99,{questDifficulty:'east_45',storyWaveIndex:2});const boss=b.actors.find(a=>a.team==='enemy');boss.mp=999;
 b.queue=[boss.id];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:boss.id,abilityId:'east.jorogumo_spawn',targetId:getActor(b,'arthur').id});
 assert.ok(b.actors.some(a=>a.addTag==='web_anchor'&&a.summonedBy===boss.id));
});

test('east catalog defaults to unlock order and key events carry their own marker',()=>{
 const s=save();s.claimedFirstClearRewards=Object.keys(content.encounters);s.storyFlags.push('eastern_hunts_unlocked');
 const ids=questCatalog(content,s,{tab:'east'}).map(e=>e.id);
 assert.deepEqual(ids.slice(0,12),['east_ke_01','east_ke_02','east_ke_03','east_e_01','east_e_02','east_e_03','east_e_04','east_e_05','east_ke_04','east_e_06','east_e_07','east_e_08']);
 assert.equal(content.encounters.east_ke_01.category,'east_key');assert.equal(content.encounters.east_e_01.category,'east_hunt');
});

test('soul seal layers: basic -1, soul -2 and Chiyoko has 24',()=>{
 assert.equal(content.statuses.east_soul_guard.modifiers.damageReduction,.5);
 assert.equal(content.statuses.east_soul_exposed.modifiers.damageTakenBonus,.25);
 assert.equal(content.enemies.east_chiyoko.soulBreak.layers,24);
 assert.ok(content.enemies.east_orochi.soulBreak.layers>=12&&content.enemies.east_orochi.soulBreak.layers<=18);
 const s=save();s.claimedFirstClearRewards=Object.keys(content.encounters);s.storyFlags.push('eastern_hunts_unlocked');s.party=['tsukiha','arthur','iris','elaine'];
 const b=createBattle(content,s,'east_ke_03',()=>.99,{questDifficulty:'east_35'});const boss=b.actors.find(a=>a.team==='enemy');
 const guard=()=>boss.statuses.find(st=>st.id==='east_soul_guard');
 guard().stacks=10;b.queue=[getActor(b,'arthur').id];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:'arthur',abilityId:'$attack',targetId:boss.id});assert.equal(guard().stacks,9);
 guard().stacks=10;b.queue=[getActor(b,'tsukiha').id];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:'tsukiha',abilityId:'tsukiha.ember',targetId:boss.id});assert.equal(guard().stacks,8);
 guard().stacks=10;b.teamResources.party.sword_soul.value=4;b.queue=[getActor(b,'tsukiha').id];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:'tsukiha',abilityId:'tsukiha.burst',targetId:boss.id});assert.equal(guard().stacks,4,'4 Hồn Kiếm + 2, chỉ một lần cho cả cast nhiều hit');
});

test('east bosses use authored kits and Hồn Kiếm breaks their soul seal',()=>{
 const s=save();s.claimedFirstClearRewards=Object.keys(content.encounters);s.storyFlags.push('eastern_hunts_unlocked');s.party=['tsukiha','arthur','iris','elaine'];
 const b=createBattle(content,s,'east_ke_03',()=>.99,{questDifficulty:'east_35'});
 const boss=b.actors.find(a=>a.team==='enemy');
 assert.ok(content.abilities['east.hunter_flash'].windup);
 assert.ok(content.enemies.east_hunter.boss.phases[0].rotation.flat().includes('east.hunter_flash'));
 assert.ok(boss.statuses.some(st=>st.id==='east_soul_guard'));
 boss.statuses.find(st=>st.id==='east_soul_guard').stacks=2;
 b.queue=[...b.queue];b.cursor=b.queue.indexOf('tsukiha');b.phase='main';b.outcome=null;
 executeAction(b,{actorId:'tsukiha',abilityId:'tsukiha.ember',targetId:boss.id});
 assert.ok(!boss.statuses.some(st=>st.id==='east_soul_guard'));
 assert.ok(boss.statuses.some(st=>st.id==='east_soul_exposed'));
 assert.ok(b.events.some(event=>event.type==='boss_soul_break'));
});
