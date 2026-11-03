import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,activeActor,executeEnemyTurn,planAutoBattleTurn} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {farmLimit,createFarmSession,recordFarmResult,stopFarmSession,validateFarmTarget} from '../src/core/farm-session.js';
import {claimBattleReward} from '../src/core/economy.js';
import {seededRandom} from '../src/core/random.js';
const content=await loadContent();
test('farm accepts only 1–999 integer runs and excludes Arena/session/story targets',()=>{
 for(const v of [1,10,999])assert.equal(farmLimit(v),v);for(const v of [0,-1,1000,1.5,NaN,Infinity,'10',null])assert.throws(()=>farmLimit(v));
 assert.throws(()=>validateFarmTarget(content,{kind:'arena'}));assert.throws(()=>validateFarmTarget(content,{kind:'dungeon',id:'unknown'}));
 const story=Object.values(content.encounters).find(e=>e.travelerStory);assert.throws(()=>validateFarmTarget(content,{kind:'quest',id:story.id}));
 validateFarmTarget(content,{kind:'quest',id:'forest_patrol'});validateFarmTarget(content,{kind:'dungeon',id:'gold_mine'});
});
test('farm counts rewards only after a committed victory, exactly once per owned battle',()=>{
 const s=createFarmSession({kind:'quest',id:'forest_patrol'},2,1),win={outcome:'victory',rewardClaimed:false,xpAwards:[{characterId:'arthur',accepted:40}]},before={coins:10,prismaFragments:0};
 assert.equal(recordFarmResult(s,1,win,before,{coins:60}),s);win.rewardClaimed=true;
 const once=recordFarmResult(s,1,win,before,{coins:60});assert.equal(once.completed,1);assert.equal(once.totals.coins,50);assert.equal(once.xp.arthur,40);assert.equal(once.enabled,true);assert.equal(recordFarmResult(once,1,win,before,{coins:999}),once);
 assert.equal(recordFarmResult(once,2,win,before,{coins:999}),once);
 const second=recordFarmResult({...once,sessionId:2},2,win,{coins:60,prismaFragments:0},{coins:60,prismaFragments:5});assert.equal(second.completed,2);assert.equal(second.wins,2);assert.equal(second.enabled,false);assert.deepEqual(second.totals,{coins:50,prismaFragments:5});assert.equal(second.xp.arthur,80);
});
test('loss/draw stops repeat and awards no currency or XP; stop does not rewrite campaign',()=>{
 const s=createFarmSession({kind:'dungeon',id:'gold_mine'},999,3);
 for(const outcome of ['defeat','draw']){const n=recordFarmResult(s,3,{outcome}, {coins:10},{coins:999});assert.equal(n.enabled,false);assert.equal(n.completed,1);assert.deepEqual(n.totals,{});assert.deepEqual(n.xp,{});}
 const stopped=stopFarmSession(s);assert.equal(stopped.enabled,false);assert.equal(s.enabled,true);
});
test('PvE AI uses legal player commands without touching live RNG/state or adding PvP rules',()=>{
 const c=createGameSave(content),b=createBattle(content,c,'forest_patrol',seededRandom(7));
 while(activeActor(b)?.team==='enemy')executeEnemyTurn(b);
 let calls=0;const rng=b.random;b.random=()=>{calls++;return rng();};const before=JSON.stringify({...b,content:null,random:null});
 const cmd=planAutoBattleTurn(b);assert.ok(cmd);assert.equal(calls,0);assert.equal(JSON.stringify({...b,content:null,random:null}),before);assert.equal(b.arena,null);assert.equal(b.pvpRules,undefined);executeAction(b,cmd);assert.equal(b.events.some(e=>e.type==='pvp_soft_cap'),false);
 assert.equal(planAutoBattleTurn(createArenaBattle(content,c,'mirror',1)),null);
});
test('basic F2P auto battle finishes a real PvE quest and claims its normal rewards',()=>{
 const c=createGameSave(content);let b=createBattle(content,c,'goblin_forest_ambush',seededRandom(7));
 for(let i=0;i<300&&!b.outcome;i++){if(activeActor(b)?.team==='party')executeAction(b,planAutoBattleTurn(b));else executeEnemyTurn(b);}
 assert.equal(b.outcome,'victory');const next=claimBattleReward(c,b,content);assert.equal(b.rewardClaimed,true);assert.equal(next.victories,c.victories+1);assert.ok(next.unlockedCharacterIds.includes('kai'));
});
