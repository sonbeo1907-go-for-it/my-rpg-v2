import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave,GAME_SAVE_VERSION} from '../src/core/game-save.js';
import {nativeEvasion} from '../src/core/evasion.js';
import {resolveCharacter} from '../src/core/progression.js';
import {allocationLimit,allocatePoints,resetAllocations,unspentPoints,xpRequired,grantCharacterXp,limitBreak,normalizeLevelState} from '../src/core/leveling.js';
import {levelScaledEnemyStats,scaleEnemyStats} from '../src/core/enemy-scaling.js';
import {trainingChargeState,consumeTrainingCharge,trainingSlot} from '../src/core/training-charges.js';
import {dungeonDailyState} from '../src/core/dungeon-rules.js';
import {createBattle,getActor} from '../src/core/battle.js';
import {claimBattleReward} from '../src/core/economy.js';
import {questExperience} from '../src/core/quest-difficulty.js';
import {createDungeonRun,createDungeonPreview,advanceDungeonWave,claimDungeonReward,sweepDungeon,dungeonQuestPool} from '../src/core/dungeon.js';
import {normalizeDailyCommissions,recordDailyClear,visitDailyCommissions,claimDailyCommissions,dailyCommissionView} from '../src/core/daily-commissions.js';
import {validateContent} from '../src/core/content.js';
const content=await loadContent(),fresh=()=>createGameSave(content),now=new Date('2026-11-01T00:59:59Z');
const state=(level,rank=0,xp=0,allocations={})=>({level,limitBreakRank:rank,xp,allocations,upgradeIds:[]});
const finish=(run)=>{run.waveIndex=run.waveIds.length-1;run.battle.outcome='victory';return run;};
function run(c,id='training_grounds',difficulty='easy',time=now){return createDungeonRun(content,c,id,difficulty,{now:time,random:()=>.1,preview:createDungeonPreview(content,id,difficulty,{now:time,random:()=>.1})});}
test('levels award separate points, no automatic stats; EXP can cross several levels',()=>{
 const c=fresh(),base=resolveCharacter(content,c,'arthur').stats;assert.equal(xpRequired(content,1),80);assert.equal(xpRequired(content,20),1182);assert.equal(xpRequired(content,49),5648);
 const report=grantCharacterXp(c,content,'arthur',262);assert.equal(report.toLevel,3);assert.equal(c.characters.arthur.xp,80);assert.equal(unspentPoints(content,c.characters.arthur),2);assert.deepEqual(resolveCharacter(content,c,'arthur').stats,base);assert.equal(c.characters.iris.level,1);
});
test('temporary cap banks exactly one level, discards overflow and processes bank only after Limit Break',()=>{
 const c=fresh();c.characters.arthur=state(20);const r=grantCharacterXp(c,content,'arthur',2000);assert.equal(r.lost,818);assert.equal(c.characters.arthur.xp,1182);c.limitBreakStones=1;
 const next=limitBreak(c,content,'arthur');assert.equal(next.characters.arthur.level,21);assert.equal(next.characters.arthur.xp,0);assert.equal(next.characters.arthur.limitBreakRank,1);assert.equal(next.limitBreakStones,0);assert.equal(next.characters.arthur.upgradeIds.length,0);assert.equal(c.characters.arthur.level,20);
});
test('all three Limit Break ranks have distinct costs; no early break or stat/story reward',()=>{
 for(const [level,rank,cost]of [[20,0,1],[30,1,2],[40,2,3]]){const c=fresh();c.characters.arthur=state(level,rank);c.limitBreakStones=cost;const before=resolveCharacter(content,c,'arthur').stats;const next=limitBreak(c,content,'arthur');assert.equal(next.limitBreakStones,0);assert.deepEqual(resolveCharacter(content,next,'arthur').stats,before);assert.equal(next.characters.arthur.level,level);assert.equal(next.characters.arthur.limitBreakRank,rank+1);c.limitBreakStones=cost-1;assert.throws(()=>limitBreak(c,content,'arthur'));}
 assert.throws(()=>limitBreak(fresh(),content,'arthur'));
});
test('absolute cap always stores zero XP, even when a reward crosses level 49',()=>{
 const c=fresh();c.characters.arthur=state(49,3,5600);const r=grantCharacterXp(c,content,'arthur',1000);assert.equal(c.characters.arthur.level,50);assert.equal(c.characters.arthur.xp,0);assert.equal(r.lost,952);assert.equal(unspentPoints(content,c.characters.arthur),49);assert.equal(grantCharacterXp(c,content,'arthur',965).lost,965);assert.equal(c.characters.arthur.xp,0);
});
test('allocation enforces level-specific caps, weighted SPD cost and per-character point ownership',()=>{
 const c=fresh();c.characters.arthur=state(50,3);assert.equal(allocationLimit(content,50,'attack'),17);assert.equal(allocationLimit(content,50,'speed'),9);
 const n=allocatePoints(c,content,'arthur',{attack:17,maxHp:14,speed:9});assert.equal(unspentPoints(content,n.characters.arthur),0);assert.equal(resolveCharacter(content,n,'arthur').stats.attack,content.characters.arthur.stats.attack+17);assert.equal(resolveCharacter(content,n,'arthur').stats.maxHp,content.characters.arthur.stats.maxHp+70);
 for(const x of [{attack:18},{speed:10},{attack:17,maxHp:17,speed:9},{magic:-1},{hack:1},{attack:1.5}])assert.throws(()=>allocatePoints(c,content,'arthur',x));assert.throws(()=>allocatePoints(c,content,'iris',{attack:1}));assert.equal(c.characters.arthur.allocations.attack,undefined);
});
test('allocation flat bonus precedes passive percent and survives saves without accumulating',()=>{
 let c=fresh();c.unlockedCharacterIds.push('lisbeth');c.characters.lisbeth=state(10);c=allocatePoints(c,content,'lisbeth',{magic:3});for(let i=0;i<3;i++){c=decodeGameSave(encodeGameSave(c,content),content);const a=resolveCharacter(content,c,'lisbeth');assert.equal(a.baseStats.magic,45);assert.equal(a.stats.magic,54);assert.equal(a.levelBonuses.magic,3);}
});
test('reset is free and preserves level/XP/upgrades; progression is locked during adventure',()=>{
 const c=fresh();c.characters.arthur=state(10,0,100,{attack:3});const n=resetAllocations(c,content,'arthur');assert.equal(n.characters.arthur.level,10);assert.equal(n.characters.arthur.xp,100);assert.equal(unspentPoints(content,n.characters.arthur),9);assert.equal(n.coins,c.coins);assert.throws(()=>resetAllocations(c,content,'arthur',{battleActive:true}));assert.throws(()=>limitBreak(c,content,'arthur',{battleActive:true}));assert.throws(()=>allocatePoints(c,content,'dain',{}));
});
test('Chelsea remains uncapped below 100%; a level 50 SPD godroll build reaches 95 base SPD',()=>{
 const c=fresh();c.unlockedCharacterIds.push('chelsea');c.characters.chelsea=state(50,3,0,{speed:9});c.extraGearSlots.chelsea=3;c.gacha.totalPulls=6;c.gear=Array.from({length:6},(_,i)=>({id:`gear_${i+1}`,typeId:'t4_stats',stats:{speed:8},primaryStat:'speed',secondaryStat:'speed'}));
 // Read actual gear/exclusive schema elsewhere; base-stat math is independent of roll serialization.
 c.equipment.chelsea=c.gear.map(g=>g.id);c.exclusiveGear=[{templateId:'chelsea.compass',statKey:'speed',statValue:10}];c.equippedExclusiveGear.chelsea='chelsea.compass';const a=resolveCharacter(content,c,'chelsea');assert.equal(a.stats.speed,95);assert.ok(Math.abs(nativeEvasion(a,'physical')-.97)<1e-10);assert.ok(Math.abs(nativeEvasion(a,'magical')-.97)<1e-10);
});
test('v4-v6 saves migrate isolated levels and preserve old gear/quests; max legacy level clamps to 50',()=>{
 for(const version of [4,5,6]){const c=JSON.parse(encodeGameSave(fresh(),content));c.version=version;delete c.levelProgressionVersion;for(const s of Object.values(c.characters)){delete s.xp;delete s.allocations;delete s.limitBreakRank;}c.characters.arthur.level=99;const n=decodeGameSave(JSON.stringify(c),content);assert.equal(n.characters.arthur.level,50);assert.equal(n.characters.arthur.xp,0);assert.equal(n.characters.arthur.limitBreakRank,3);assert.deepEqual(n.party,c.party);assert.equal(JSON.parse(encodeGameSave(n,content)).version,7);assert.equal(fresh().characters.arthur.level,1);}
});
test('modern corrupt progression, quotas and unknown future versions reject before replacing a save',()=>{
 const base=JSON.parse(encodeGameSave(fresh(),content));for(const change of [s=>s.version=GAME_SAVE_VERSION+1,s=>delete s.levelProgressionVersion,s=>s.characters.arthur.xp=80,s=>s.characters.arthur.allocations={attack:1},s=>s.characters.arthur.limitBreakRank=3,s=>s.trainingCharges={charges:10,lastSlot:1},s=>s.sweepTickets=-1,s=>s.sweepTickets=null,s=>s.limitBreakStones=null,s=>s.dungeonClearedDifficulties=null,s=>s.dungeonClearedDifficulties={gold_mine:['invalid']},s=>s.characters.arthur=state(50,3,1)]){const s=structuredClone(base);change(s);assert.throws(()=>decodeGameSave(JSON.stringify(s),content));}
});
test('five Quest levels normalize once using encounter curves, reference level is exact identity',()=>{
 const e=content.enemies.goblin;assert.deepEqual(levelScaledEnemyStats(e,e.referenceLevel,content),e.stats);
 for(const [id,level]of [['very_easy',5],['easy',15],['medium',25],['hard',35],['very_hard',45]]){const b=createBattle(content,fresh(),'forest_patrol',undefined,{questDifficulty:id});assert.equal(b.enemyLevel,level);assert.deepEqual(getActor(b,'enemy_0').stats,levelScaledEnemyStats(e,level,content));}
 const base={stats:{maxHp:100,maxMp:100,attack:100,magic:100,defense:100,resistance:100,speed:100},referenceLevel:1};const s=levelScaledEnemyStats(base,50,content);assert.equal(s.attack,200);assert.equal(s.defense,125);assert.equal(s.maxHp,Math.round(100*1.018**29*1.025**20));assert.throws(()=>levelScaledEnemyStats(e,0,content));
});
test('superboss and story levels stay fixed despite difficulty overrides; dungeon multipliers apply once',()=>{
 for(const [id,level]of [['alice_superboss',60],['miraebolis_superboss',60],['iris_story_growth',10]])if(content.encounters[id]){const c=fresh();c.storyFlags.push('illusion.sinister_unlocked');c.chronicles.aliceFirstEncounterCleared=true;c.chronicles.eventClearIds.push('book1.j04');const b=createBattle(content,c,id,undefined,{questDifficulty:'very_easy'});assert.equal(b.enemyLevel,level);}
 const r=run(fresh(),'gold_mine','medium');const e=getActor(r.battle,'wave_1_enemy_0');assert.deepEqual(e.stats,levelScaledEnemyStats(content.enemies[e.definitionId],30,content,content.dungeons.gold_mine.difficulties[1].enemyScale,content.encounters[r.battle.encounterId]));
});
test('Quest XP differs by Normal/Boss/Bounty; no XP from story or super',()=>{
 const bounty=Object.values(content.encounters).find(e=>e.category==='bounty');for(const [id,n]of [['forest_patrol',965],['ogre_trial',1930],[bounty.id,2895],['iris_story_growth',0],['alice_superboss',0]])assert.equal(questExperience(content,content.encounters[id],'very_hard'),n);
});
test('full XP goes to each participant including KO, not reserve; persistence failure/retry cannot duplicate',()=>{
 const c=fresh(),b=createBattle(content,c,'forest_patrol',undefined,{questDifficulty:'easy'});getActor(b,'arthur').hp=0;b.outcome='victory';assert.throws(()=>claimBattleReward(c,b,content,()=>{throw Error('disk');}));assert.equal(c.characters.arthur.xp,0);assert.equal(b.xpAwards,undefined);const n=claimBattleReward(c,b,content);for(const id of c.party){assert.equal(n.characters[id].level,2);assert.equal(n.characters[id].xp,70);}assert.equal(n.characters.takeshi.xp,0);assert.strictEqual(claimBattleReward(n,b,content),n);assert.equal(b.xpAwards.length,4);
});
test('difficulty raises farm rewards but never repeats unique first-clear grants',()=>{
 let c=fresh();for(const [difficulty,coins]of [['very_easy',150],['very_hard',300]]){const b=createBattle(content,c,'ogre_trial',undefined,{questDifficulty:difficulty});b.rewardRandom=()=>0;b.outcome='victory';const old=c.coins;c=claimBattleReward(c,b,content);assert.equal(c.coins-old,coins);}assert.deepEqual(c.claimedFirstClearRewards,['ogre_trial']);assert.deepEqual(c.characters.arthur.upgradeIds,['arthur.control_training']);
});
test('training recharges 3 at fixed Vietnam 00/08/16 boundaries, and never banks overflow',()=>{
 const c=fresh();for(let i=0;i<9;i++)consumeTrainingCharge(c,now);assert.equal(trainingChargeState(c,now).remaining,0);const t=new Date('2026-11-01T01:00:00Z');assert.equal(trainingChargeState(c,t).remaining,3);assert.equal(trainingChargeState(c,new Date('2026-11-01T09:00:00Z')).remaining,6);assert.equal(trainingChargeState(c,new Date('2026-11-01T17:00:00Z')).remaining,9);
 const later=new Date('2026-11-10T01:10:00Z');consumeTrainingCharge(c,later);assert.equal(trainingChargeState(c,later).remaining,8);assert.equal(trainingChargeState(c,new Date('2026-11-10T00:00:00Z')).remaining,8);assert.equal(trainingChargeState(c,new Date('2026-11-10T09:00:00Z')).remaining,9);assert.equal(trainingSlot(t)-trainingSlot(now),1);
});
test('training capacity is shared across difficulties and persists partial charges across midnight',()=>{
 const c=fresh(),before=new Date('2026-11-01T16:59:59Z'),after=new Date('2026-11-01T17:00:00Z');for(let i=0;i<6;i++)consumeTrainingCharge(c,before);const n=decodeGameSave(encodeGameSave(c,content),content);assert.equal(dungeonDailyState(n,content,'training_grounds',after).remaining,6);assert.equal(dungeonDailyState(n,content,'breakthrough_trial',after).remaining,2);
});
test('training rewards only at final clear; snapshot party gets full XP, failure consumes nothing',()=>{
 const c=fresh(),r=run(c);r.battle.outcome='victory';assert.strictEqual(claimDungeonReward(c,r,content,()=>{},now),c);assert.equal(c.trainingCharges.charges,9);advanceDungeonWave(content,r);assert.equal(r.battle.enemyLevel,15);finish(r);assert.throws(()=>claimDungeonReward(c,r,content,()=>{throw Error('disk');},now));assert.equal(r.claimed,false);assert.equal(c.trainingCharges.charges,9);
 const n=claimDungeonReward(c,r,content,()=>{},now);assert.equal(n.characters.arthur.level,4);assert.equal(n.characters.arthur.xp,50);assert.equal(n.characters.takeshi.level,1);assert.equal(n.trainingCharges.charges,8);assert.equal(n.dailyCommissions.trainingClears,1);assert.equal(n.dailyCommissions.dungeonClears,1);assert.equal(n.dailyCommissions.questClears,0);assert.deepEqual(n.dungeonClearedDifficulties.training_grounds,['easy']);assert.strictEqual(claimDungeonReward(n,r,content,()=>{},now),n);
});
test('breakthrough pool excludes story, Bounty and superboss; daily quota/rewards are shared and atomic',()=>{
 assert.ok(dungeonQuestPool(content,'breakthrough_trial').every(id=>{const e=content.encounters[id];return e.rewardTier==='boss'&&!e.travelerStory&&e.category!=='bounty';}));let c=fresh();for(const [diff,amount]of [['easy',1],['hard',3]]){const r=finish(run(c,'breakthrough_trial',diff));const old=c.limitBreakStones;c=claimDungeonReward(c,r,content,()=>{},now);assert.equal(c.limitBreakStones,old+amount);assert.equal(c.characters.arthur.xp,0);}assert.equal(dungeonDailyState(c,content,'breakthrough_trial',now).remaining,0);assert.throws(()=>run(c,'breakthrough_trial'));assert.equal(c.limitBreakStones,4);
});
test('sweep requires exact difficulty clear, full quota/ticket, cannot run in combat; transaction rollback keeps both',()=>{
 const c=fresh();c.sweepTickets=2;assert.throws(()=>sweepDungeon(c,content,'gold_mine','easy',()=>{},now));c.dungeonClearedDifficulties.gold_mine=['easy'];assert.throws(()=>sweepDungeon(c,content,'gold_mine','hard',()=>{},now));assert.throws(()=>sweepDungeon(c,content,'gold_mine','easy',()=>{},now,{battleActive:true}));assert.throws(()=>sweepDungeon(c,content,'gold_mine','easy',()=>{throw Error('disk');},now));assert.equal(c.sweepTickets,2);assert.equal(c.coins,0);assert.equal(c.dungeonDaily.day,null);const n=sweepDungeon(c,content,'gold_mine','easy',()=>{},now);assert.equal(n.coins,1000);assert.equal(n.sweepTickets,1);assert.equal(n.dungeonDaily.clears.gold_mine,1);assert.equal(n.dailyCommissions.dungeonClears,1);assert.equal(n.characters.arthur.xp,0);
});
test('training sweep awards current party, consumes one charge and ticket for entire run',()=>{
 const c=fresh();c.sweepTickets=1;c.dungeonClearedDifficulties.training_grounds=['hard'];c.party=['takeshi','fiona'];const n=sweepDungeon(c,content,'training_grounds','hard',()=>{},now);assert.equal(n.sweepTickets,0);assert.equal(n.trainingCharges.charges,8);assert.equal(n.characters.arthur.level,1);assert.ok(n.characters.takeshi.level>1);assert.equal(n.characters.takeshi.level,n.characters.fiona.level);assert.equal(n.characters.takeshi.xp,n.characters.fiona.xp);assert.equal(n.dailyCommissions.trainingClears,1);
});
test('six daily tasks grant exactly four sweep tickets and Original only at milestone 6',()=>{
 const c=visitDailyCommissions(fresh(),now);for(let i=0;i<5;i++)recordDailyClear(c,'quest',now);recordDailyClear(c,'dungeon',now);assert.equal(dailyCommissionView(c,now).count,5);assert.throws(()=>claimDailyCommissions(c,['milestone:6'],now));recordDailyClear(c,'training',now);const n=claimDailyCommissions(c,undefined,now);assert.equal(n.sweepTickets,4);assert.equal(n.originalPrisma,1);assert.equal(n.coins,6500);assert.equal(n.recruitmentShards,11);assert.equal(n.dailyCommissions.claimedMilestones.length,6);assert.deepEqual(decodeGameSave(encodeGameSave(n,content),content),n);
});
test('old daily milestones migrate by reward identity, never pay an already claimed Original again',()=>{
 const old={day:'2026-11-01',loggedIn:true,questClears:5,dungeonClears:1,claimedTasks:['login','quest_1','quest_3','quest_5','dungeon'],claimedMilestones:['1','2','3','4','5']};const s=normalizeDailyCommissions(old);assert.deepEqual(s.claimedMilestones,['1','2','4','5','6']);assert.deepEqual(s.legacyMilestoneClaims,['6']);const c=fresh();c.dailyCommissions=s;assert.deepEqual(dailyCommissionView(c,now).available.map(x=>x.key),['milestone:3']);recordDailyClear(c,'training',now);assert.deepEqual(dailyCommissionView(c,now).available.map(x=>x.key),['task:training','milestone:3']);
});
test('validation rejects malformed level growth, recharge and dungeon reward definitions',()=>{
 for(const change of [c=>c.progressionRules.default.enemyGrowth.attack=-1,c=>c.progressionRules.default.milestones[0].offense=-1,c=>c.dungeons.training_grounds.recharge.amount=4,c=>c.dungeons.training_grounds.difficulties[0].reward={coins:10}]){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length);}
});
