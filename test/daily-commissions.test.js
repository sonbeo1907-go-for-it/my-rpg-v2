import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle} from '../src/core/battle.js';
import {claimBattleReward} from '../src/core/economy.js';
import {createDungeonRun,createDungeonPreview,claimDungeonReward} from '../src/core/dungeon.js';
import {emptyDailyCommissions,normalizeDailyCommissions,visitDailyCommissions,needsDailyVisit,recordDailyClear,dailyCommissionView,claimDailyCommissions} from '../src/core/daily-commissions.js';
const content=await loadContent(),day=new Date('2026-10-31T12:00:00Z');
const fresh=()=>createGameSave(content);
function full(){const c=visitDailyCommissions(fresh(),day);for(let i=0;i<5;i++)recordDailyClear(c,'quest',day);recordDailyClear(c,'dungeon',day);return c;}
test('login requires no currency grant before claim and completes the first milestone independently',()=>{
 const before=fresh(),c=visitDailyCommissions(before,day),view=dailyCommissionView(c,day);assert.equal(before.dailyCommissions.day,null);assert.equal(c.prisma,0);assert.equal(view.count,1);assert.deepEqual(view.available.map(x=>x.key),['task:login','milestone:1']);assert.equal(needsDailyVisit(c,day),false);
 const next=claimDailyCommissions(c,['milestone:1'],day);assert.equal(next.coins,500);assert.equal(next.prisma,0);assert.equal(next.dailyCommissions.claimedTasks.length,0);
});
test('all five tasks and every milestone award the exact daily totals once',()=>{
 const c=full(),next=claimDailyCommissions(c,undefined,day);assert.equal(next.coins,6500);assert.equal(next.prisma,1);assert.equal(next.recruitmentShards,11);assert.equal(next.originalPrisma,1);assert.equal(dailyCommissionView(next,day).available.length,0);assert.equal(next.dailyCommissions.claimedTasks.length,5);assert.equal(next.dailyCommissions.claimedMilestones.length,5);assert.throws(()=>claimDailyCommissions(next,undefined,day));assert.equal(c.coins,0);
});
test('partial claims, duplicate requests, unearned milestones and malformed keys are atomic',()=>{
 const c=visitDailyCommissions(fresh(),day),before=structuredClone(c);for(const keys of [['task:quest_1'],['milestone:5'],['task:login','task:login'],['bad'],[]])assert.throws(()=>claimDailyCommissions(c,keys,day));assert.deepEqual(c,before);const n=claimDailyCommissions(c,['task:login'],day);assert.throws(()=>claimDailyCommissions(n,['task:login'],day));assert.equal(n.prisma,1);
});
test('Vietnam midnight resets unclaimed tasks and rewards; rolling the clock back never resets twice',()=>{
 const before=new Date('2026-10-31T16:59:59Z'),after=new Date('2026-10-31T17:00:00Z');const c=claimDailyCommissions(full(),undefined,before);const next=visitDailyCommissions(c,after);assert.equal(next.dailyCommissions.day,'2026-11-01');assert.equal(next.dailyCommissions.questClears,0);assert.equal(next.dailyCommissions.claimedTasks.length,0);assert.equal(next.coins,6500);const claimed=claimDailyCommissions(next,undefined,after);assert.equal(claimed.coins,7000);assert.equal(claimed.prisma,2);const back=visitDailyCommissions(claimed,before);assert.equal(back.dailyCommissions.day,'2026-11-01');assert.equal(dailyCommissionView(back,before).available.length,0);
});
test('a late claim cannot collect yesterday completed quest rewards',()=>{
 const c=full();assert.throws(()=>claimDailyCommissions(c,['task:quest_5'],new Date('2026-11-01T10:00:00Z')));assert.equal(c.coins,0);
});
for(const encounterId of ['goblin_forest_ambush','ogre_trial'])test('repeated '+encounterId+' victories count once per committed battle',()=>{
 let c=fresh();for(let i=0;i<3;i++){const b=createBattle(content,c,encounterId);b.outcome='victory';const next=claimBattleReward(c,b,content,()=>{},day);assert.equal(next.dailyCommissions.questClears,i+1);assert.strictEqual(claimBattleReward(next,b,content,()=>{},day),next);c=next;}assert.equal(dailyCommissionView(c,day).count,3);
});
test('failed victory persistence grants neither quest progress nor reward; retry grants one',()=>{
 const c=fresh(),b=createBattle(content,c,'forest_patrol');b.outcome='victory';assert.throws(()=>claimBattleReward(c,b,content,()=>{throw Error('disk full');},day));assert.equal(c.dailyCommissions.questClears,0);assert.equal(b.rewardClaimed,undefined);const next=claimBattleReward(c,b,content,()=>{},day);assert.equal(next.dailyCommissions.questClears,1);
});
test('defeats and traveler story battles do not advance the ordinary-quest counter',()=>{
 const c=fresh(),lost=createBattle(content,c,'forest_patrol');lost.outcome='defeat';assert.strictEqual(claimBattleReward(c,lost,content,()=>{},day),c);const story=createBattle(content,c,'iris_story_growth');story.outcome='victory';const next=claimBattleReward(c,story,content,()=>{},day);assert.equal(next.dailyCommissions.questClears,0);
});
for(const type of ['gold_mine','dangerous'])test(type+' grants dungeon progress only on final successfully saved clear',()=>{
 const c=fresh(),run=createDungeonRun(content,c,type,'easy',{random:()=>.1,now:day,preview:createDungeonPreview(content,type,'easy',{random:()=>.1,now:day})});run.battle.outcome='victory';if(run.waveIds.length>1){assert.strictEqual(claimDungeonReward(c,run,content,()=>{},day),c);run.waveIndex=run.waveIds.length-1;}
 assert.throws(()=>claimDungeonReward(c,run,content,()=>{throw Error('disk');},day));assert.equal(c.dailyCommissions.dungeonClears,0);assert.equal(run.claimed,false);const next=claimDungeonReward(c,run,content,()=>{},day);assert.equal(next.dailyCommissions.dungeonClears,1);assert.equal(next.dailyCommissions.questClears,0);assert.strictEqual(claimDungeonReward(next,run,content,()=>{},day),next);
});
test('new optional ledger migrates old v6 saves, roundtrips claims and stays profile-local',()=>{
 const old=JSON.parse(encodeGameSave(fresh(),content));delete old.dailyCommissions;const migrated=decodeGameSave(JSON.stringify(old),content);assert.deepEqual(migrated.dailyCommissions,emptyDailyCommissions());const c=claimDailyCommissions(full(),undefined,day);assert.deepEqual(decodeGameSave(encodeGameSave(c,content),content).dailyCommissions,c.dailyCommissions);assert.equal(fresh().dailyCommissions.day,null);
});
test('malformed dates, counters and impossible saved claims are rejected',()=>{
 const base=full().dailyCommissions;for(const mutate of [s=>s.day='2026-02-30',s=>s.questClears=6,s=>s.dungeonClears=-1,s=>s.loggedIn='true',s=>s.claimedTasks=['login','login'],s=>{s.questClears=0;s.claimedTasks=['quest_5'];},s=>{s.questClears=0;s.claimedMilestones=['5'];},s=>s.claimedTasks=['unknown']]){const x=structuredClone(base);mutate(x);assert.throws(()=>normalizeDailyCommissions(x));}
});
test('claim overflow is rejected without spending claim flags or changing any balance',()=>{
 const c=full();c.coins=Number.MAX_SAFE_INTEGER;const before=structuredClone(c);assert.throws(()=>claimDailyCommissions(c,undefined,day));assert.deepEqual(c,before);
});

 test('super-boss clears do not advance the 50/150 Coin commission',()=>{const c=fresh();c.storyFlags.push('illusion.sinister_unlocked');const b=createBattle(content,c,'alice_superboss');b.outcome='victory';const n=claimBattleReward(c,b,content,()=>{},day);assert.equal(n.coins,1000);assert.equal(n.dailyCommissions.questClears,0);});
