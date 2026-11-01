import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createGameSave, encodeGameSave, decodeGameSave } from '../src/core/game-save.js';
import { createDungeonPreview, validDungeonPreview, createDungeonRun, advanceDungeonWave, isFinalDungeonWave, claimDungeonReward, dungeonQuestPool } from '../src/core/dungeon.js';
import { createDungeonPreviewCache } from '../src/runtime/dungeon-preview.js';
import { dungeonDailyState, validateDungeonContent } from '../src/core/dungeon-rules.js';
import { encounterTier, victoryCoinReward, claimBattleReward } from '../src/core/economy.js';
import { getActor } from '../src/core/battle.js';
import {levelScaledEnemyStats} from '../src/core/enemy-scaling.js';
const content=await loadContent(),now=new Date('2026-10-29T05:00:00Z');
const preview=(level='medium')=>createDungeonPreview(content,'dangerous',level,{random:()=>0,now});
const run=(level='medium',save=createGameSave(content))=>createDungeonRun(content,save,'dangerous',level,{preview:preview(level),random:()=>0,now});
function clear(current){current.battle.actors.filter(a=>a.team==='enemy').forEach(a=>a.hp=0);current.battle.outcome='victory';}
function finish(current){while(true){clear(current);if(isFinalDungeonWave(current))return;advanceDungeonWave(content,current);}}

test('scouting chooses only distinct 150-Coin bosses; all levels start exactly the advertised rooms with correct stats',()=>{
 const original=JSON.stringify(content),pool=dungeonQuestPool(content,'dangerous');assert.ok(pool.length>=2);
 assert.ok(pool.every(id=>encounterTier(content.encounters[id])==='boss'&&victoryCoinReward(content,id)===150));
 assert.ok(!pool.includes('alice_superboss'));assert.ok(pool.every(id=>!content.encounters[id].enemies.some(e=>content.enemies[e].boss)));
 for(const[level,count,mp,power]of[['easy',1,1.2,1],['medium',2,1.6,1],['hard',2,2,1]]){
  const plan=preview(level),current=run(level);assert.equal(plan.waveIds.length,count);assert.equal(new Set(plan.waveIds).size,count);assert.deepEqual(current.waveIds,plan.waveIds);
  for(let i=0;i<count;i++){
   assert.equal(current.battle.encounterId,plan.waveIds[i]);assert.equal(current.battle.dungeon.stageLabel,'Phòng');assert.equal(current.battle.dungeon.revealRooms,true);
   for(const actor of current.battle.actors.filter(a=>a.team==='enemy')){const base=content.enemies[actor.definitionId];assert.deepEqual(actor.stats,levelScaledEnemyStats(base,{easy:15,medium:30,hard:45}[level],content,{maxHp:1,maxMp:mp,attack:power,magic:power},content.encounters[plan.waveIds[i]]));assert.equal(actor.hp,actor.stats.maxHp);assert.equal(actor.mp,actor.stats.maxMp);}
   if(i<count-1){clear(current);advanceDungeonWave(content,current);}
  }
 }
 assert.equal(JSON.stringify(content),original);
});
test('missing, expired, duplicate, wrong-tier or wrong-difficulty scouting cannot silently reroll into a run',()=>{
 const save=createGameSave(content),plan=preview();
 for(const invalid of [null,{...plan,day:'2026-10-28'},{...plan,difficultyId:'hard'},{...plan,waveIds:[plan.waveIds[0],plan.waveIds[0]]},{...plan,waveIds:['forest_patrol',plan.waveIds[0]]},{...plan,waveIds:Object.values(content.encounters).filter(e=>encounterTier(e)==='super').map(e=>e.id)}]){
  assert.equal(validDungeonPreview(content,invalid,'dangerous','medium',now),false);assert.throws(()=>createDungeonRun(content,save,'dangerous','medium',{now,preview:invalid}),/danh sách phòng/);
 }
 assert.throws(()=>createDungeonPreview(content,'dangerous','medium',{now,random:()=>1}));
 const bad=structuredClone(content);bad.dungeons.dangerous.encounterTier='super';assert.ok(validateDungeonContent(bad).length);
});
test('scouting survives navigation/reload, isolates profiles/difficulties/days, and never exposes a mutable cached plan',()=>{
 const storage={data:new Map(),getItem(key){return this.data.get(key)??null;},setItem(key,value){this.data.set(key,value);}};
 let rolls=0;const random=()=>{rolls++;return .25;};
 const first=createDungeonPreviewCache(content,storage,random),plan=first.prepare(1,'dangerous','medium',now),count=rolls;
 assert.deepEqual(first.prepare(1,'dangerous','medium',now),plan);assert.equal(rolls,count);
 const reloaded=createDungeonPreviewCache(content,storage,()=>{throw new Error('Must not reroll');});assert.deepEqual(reloaded.prepare(1,'dangerous','medium',now),plan);
 plan.waveIds[0]='forest_patrol';assert.notEqual(first.read(1,'dangerous','medium',now).waveIds[0],'forest_patrol');
 assert.equal(first.read(2,'dangerous','medium',now),null);assert.equal(first.read(1,'dangerous','hard',now),null);assert.equal(first.read(1,'dangerous','medium',new Date('2026-10-29T17:00:00Z')),null);
});
test('rooms carry party HP/MP, shields, status charges and cooldowns without changing their snapshot',()=>{
 const current=run(),previous=current.battle,actor=getActor(previous,'garrek');actor.hp=81;actor.mp=12;actor.shield=27;actor.shieldSourceId='elaine';actor.cooldowns['garrek.resolve']=2;actor.statuses=[{id:'effect_ward',sourceId:'garrek',remaining:null,stacks:1,charges:1}];getActor(previous,'arthur').hp=0;
 const before=structuredClone(actor);clear(current);advanceDungeonWave(content,current);const carried=getActor(current.battle,'garrek');for(const key of ['hp','mp','shield','shieldSourceId'])assert.equal(carried[key],before[key]);assert.deepEqual(carried.statuses,before.statuses);assert.equal(carried.cooldowns['garrek.resolve'],1);assert.equal(getActor(current.battle,'arthur').hp,0);
});
test('final completion grants only 1/3/5 Pure Prisma, once; failures do not consume the shared daily claim',()=>{
 for(const[level,amount]of[['easy',1],['medium',3],['hard',5]]){
  const save=createGameSave(content),current=run(level,save);clear(current);assert.equal(claimBattleReward(save,current.battle,content),save);
  if(!isFinalDungeonWave(current))assert.equal(claimDungeonReward(save,current,content,()=>{},now),save);
  finish(current);assert.throws(()=>claimDungeonReward(save,current,content,()=>{throw new Error('disk full');},now),/disk full/);assert.equal(current.claimed,false);assert.equal(save.recruitmentShards,0);
  const earned=claimDungeonReward(save,current,content,()=>{},now);assert.equal(earned.recruitmentShards,amount);assert.equal(earned.coins,0);assert.equal(earned.victories,1);assert.deepEqual(earned.claimedFirstClearRewards,[]);assert.deepEqual(earned.characters.arthur.upgradeIds,[]);assert.equal(earned.dungeonDaily.clears.dangerous,1);assert.equal(dungeonDailyState(earned,content,'gold_mine',now).remaining,3);
  assert.equal(claimDungeonReward(earned,current,content,()=>{},now),earned);assert.deepEqual(decodeGameSave(encodeGameSave(earned,content),content),earned);
  for(const other of ['easy','medium','hard'])assert.throws(()=>run(other,earned),/hết lượt/);
 }
});
