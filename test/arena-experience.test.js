import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createArenaBattle} from '../src/core/arena.js';
import {ARENA_USERNAMES,arenaIdentity,nextArenaSeed,forfeitArenaBattle} from '../src/core/arena-identity.js';
import {activeActor,executeAction,planArenaEnemyTurn,executeEnemyTurn} from '../src/core/battle.js';
import {saveArenaSession,takeAbandonedArena} from '../src/runtime/arena-session.js';
import {ARENA_PACING,arenaLoadDuration,arenaActionSummary,arenaSkillName} from '../src/ui/arena-experience.js';
const content=await loadContent();
test('100 fictional opponent names are unique, seeded and never equal the player',()=>{
 assert.equal(ARENA_USERNAMES.length,100);assert.equal(new Set(ARENA_USERNAMES).size,100);
 const id=arenaIdentity(12,'JoshGaming');assert.deepEqual(id,arenaIdentity(12,'JoshGaming'));assert.notEqual(id.opponentName,id.playerName);
 for(const name of ARENA_USERNAMES)assert.notEqual(arenaIdentity(12,name).opponentName,name);
 assert.equal(nextArenaSeed(9,9),10);assert.equal(nextArenaSeed(0xffffffff,0xffffffff),0);
 for(let seed=0;seed<4000;seed++)assert.ok(arenaLoadDuration(seed)>=5000&&arenaLoadDuration(seed)<=8000);
 assert.equal(arenaSkillName(content,{basicDamageType:'magical'},{abilityId:'$attack'}),'Phép cơ bản');
 assert.equal(ARENA_PACING.think,2000);assert.equal(ARENA_PACING.announce,1000);
});
test('preview and committed match use the same username, roster and normalized stats',()=>{
 const c=createGameSave(content);const preview=createArenaBattle(content,c,'match',72,{playerName:'DinoShooter'}),committed=createArenaBattle(content,c,'match',72,{playerName:'DinoShooter'});
 assert.deepEqual(preview.arena,committed.arena);assert.deepEqual(preview.actors,committed.actors);assert.equal(preview.arena.playerName,'DinoShooter');assert.ok(!preview.arena.opponentName.includes('#'));
});
test('planning an enemy action changes no state/RNG; execute only commits the chosen plan once',()=>{
 const b=createArenaBattle(content,createGameSave(content),'mirror',7);
 while(!b.outcome&&activeActor(b).team==='party')executeAction(b,{actorId:activeActor(b).id,abilityId:'$defend',targetId:activeActor(b).id});
 let rngCalls=0;const rng=b.random;b.random=()=>{rngCalls++;return rng();};
 const before=JSON.stringify({...b,content:null,random:null}),plan=planArenaEnemyTurn(b);assert.ok(plan);assert.equal(rngCalls,0);assert.equal(JSON.stringify({...b,content:null,random:null}),before);
 executeEnemyTurn(b,plan);assert.ok(b.events.some(e=>e.type==='arena_ai_decision'&&e.abilityId===plan.abilityId));
});
test('forfeit and durable markers are isolated by profile, survive forced exit, and never change campaign',()=>{
 const map=new Map(),storage={setItem:(k,v)=>map.set(k,v),getItem:k=>map.get(k)??null};
 const c=createGameSave(content),before=JSON.stringify(c),b=createArenaBattle(content,c,'match',7,{playerName:'JoshGaming'});
 saveArenaSession(storage,1,b);assert.equal(takeAbandonedArena(storage,2),null);
 const abandoned=takeAbandonedArena(storage,1);assert.equal(abandoned.seed,7);assert.equal(takeAbandonedArena(storage,1),null);
 assert.equal(forfeitArenaBattle(b),true);assert.equal(b.outcome,'defeat');assert.equal(forfeitArenaBattle(b),false);assert.equal(b.log.filter(x=>x.includes('Xử thua')).length,1);assert.equal(JSON.stringify(c),before);
 saveArenaSession(storage,1,b);assert.equal(takeAbandonedArena(storage,1).teamId,'match');assert.equal(takeAbandonedArena(storage,1),null);
 const won=createArenaBattle(content,c,'match',8);won.outcome='victory';saveArenaSession(storage,1,won);assert.equal(takeAbandonedArena(storage,1),null);assert.equal(forfeitArenaBattle(won),false);
 assert.equal(arenaActionSummary({id:'a',name:'Arthur'},'Kiếm quang',[{type:'damage',sourceId:'a',amount:50}]),'Arthur đã dùng Kiếm quang · 50 sát thương.');
});
